import { AppInsights } from 'applicationinsights-js';
import { environment } from './environment';
import { settings } from './settings';
import { Utilities, CustomError } from '@microsoft/office-js-helpers';

class TelemetryError extends CustomError {
    constructor(message: string, innerError?: Error) {
        super('Telemetry Error', message, innerError);
    }
}

class ApplicationInsights {
    private _current = AppInsights;
    private _disable = false;

    /**
     * Sometimes AppInsights will encounter a failure on first use
     * (https://github.com/Microsoft/ApplicationInsights-JS/issues/347)
     * To avoid the issue, wrap any use of "this.current" in a try/catch
    */
    initialize(instrumentationKey, disable?: boolean) {
        AppInsights.downloadAndSetup({
            instrumentationKey: instrumentationKey,
            autoTrackPageVisitTime: true
        });

        try {
            this._disable = disable || environment.current.devMode;
            this._current.config.enableDebug = this._current.config.verboseLogging = !environment.current.devMode;
            this.setAuthenticatedUserContext();
        }
        catch (e) {
            Utilities.log(new TelemetryError('Could not initialize application insights', e));
        }
    }

    toggleTelemetry(force?: boolean) {
        try {
            this._current.config.disableTelemetry = force || !this._disable;
        }
        catch (error) {
            Utilities.log(new TelemetryError(`Could not toggle telemetry ${force ? 'on' : 'off'}`, error));
        }
    }

    trackPageView(name: string, url?: string, properties?: { [index: string]: string }, measurement?: { [index: string]: number }) {
        let timer = performance || Date;
        const tStart = timer.now();
        return {
            stop: () => {
                try {
                    const tEnd = timer.now();
                    if (environment.current.devMode) {
                        console.info(name, url, properties, { ...measurement, duration: (tEnd - tStart) / 1000 });
                    }
                    this._current.trackPageView(name, url, properties, { ...measurement, duration: (tEnd - tStart) / 1000 });
                    return tEnd - tStart;
                }
                catch (e) {
                    Utilities.log(new TelemetryError('Could not track page view', e));
                    return -1;
                }
            },
            get elapsed() {
                return timer.now() - tStart;
            }
        };
    }

    trackTimedEvent(name: string, properties?: { [index: string]: string }, measurement?: { [index: string]: number }) {
        let timer = performance || Date;
        const tStart = timer.now();
        return {
            stop: () => {
                try {
                    const tEnd = timer.now();
                    this.trackEvent(name, properties, { ...measurement, duration: (tEnd - tStart) / 1000 });
                    return tEnd - tStart;
                }
                catch (e) {
                    Utilities.log(new TelemetryError('Could not track timed event', e));
                    return -1;
                }
            },
            get elapsed() {
                return timer.now() - tStart;
            }
        };
    }

    /**
     * Log an exception you have caught.
     * @param   exception   An Error from a catch clause, or the string error message.
     * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
     * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
     * @param   severityLevel   AI.SeverityLevel - severity level
     */
    trackException(error, location) {
        try {
            if (environment.current.devMode) {
                Utilities.log(error);
            }
            this._current.trackException(error, location, {
                user: settings.user,
                innerError: error.innerError,
                message: error.message,
                location: location,
                host: environment.current.host,
                platform: environment.current.platform,
                ...environment.current.build
            });
        }
        catch (e) {
            Utilities.log(new TelemetryError('Could not track exception', error));
        }
    }

    /**
    * Log a user action or other occurrence.
    * @param   name    A string to identify this event in the portal.
    * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
    * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
    */
    trackEvent(name: string, properties?: { [index: string]: string }, measurement?: { [index: string]: number }) {
        try {
            if (environment.current.devMode) {
                console.info(name, {
                    ...properties,
                    user: settings.user,
                    host: environment.current.host,
                    platform: environment.current.platform,
                    ...environment.current.build
                }, measurement);
            }
            this._current.trackEvent(name, {
                ...properties,
                user: settings.user,
                host: environment.current.host,
                platform: environment.current.platform,
                ...environment.current.build
            }, measurement);
        }
        catch (e) {

        }
    }

    /**
     * Log a numeric value that is not associated with a specific event. Typically used to send regular reports of performance indicators.
     * To send a single measurement, use just the first two parameters. If you take measurements very frequently, you can reduce the
     * telemetry bandwidth by aggregating multiple measurements and sending the resulting average at intervals.
     * @param   name    A string that identifies the metric.
     * @param   average Number representing either a single measurement, or the average of several measurements.
     * @param   sampleCount The number of measurements represented by the average. Defaults to 1.
     * @param   min The smallest measurement in the sample. Defaults to the average.
     * @param   max The largest measurement in the sample. Defaults to the average.
     */
    trackMetric(
        name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: {
            [name: string]: string;
        }
    ) {
        try {
            if (environment.current.devMode) {
                console.info(name, average, sampleCount, min, max, {
                    ...properties,
                    user: settings.user,
                    host: environment.current.host,
                    platform: environment.current.platform,
                    ...environment.current.build
                });
            }
            this._current.trackMetric(name, average, sampleCount, min, max, {
                ...properties,
                user: settings.user,
                host: environment.current.host,
                platform: environment.current.platform,
                ...environment.current.build
            });
        }
        catch (e) {

        }
    }

    /**
    * Sets the autheticated user id and the account id in this session.
    * User auth id and account id should be of type string. They should not contain commas, semi-colons, equal signs, spaces, or vertical-bars.
    *
    * @param authenticatedUserId {string} - The authenticated user id. A unique and persistent string that represents each authenticated user in the service.
    * @param accountId {string} - An optional string to represent the account associated with the authenticated user.
    */
    setAuthenticatedUserContext(handle?) {
        try {
            this._current.setAuthenticatedUserContext(handle || settings.user, settings.user);
        }
        catch (e) {

        }
    }
}

export const AI = new ApplicationInsights();
