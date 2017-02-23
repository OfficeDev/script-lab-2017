import { AppInsights } from 'applicationinsights-js';
import { Environment } from '../../environment';
import { Utilities } from '@microsoft/office-js-helpers';

AppInsights.downloadAndSetup({
    instrumentationKey: Environment.config.instrumentationKey,
    autoTrackPageVisitTime: true
});

class ApplicationInsights {
    private current = AppInsights;

    // Sometimes AppInsights will encounter a failure on first use
    // (https://github.com/Microsoft/ApplicationInsights-JS/issues/347)
    // To avoid the issue, wrap any use of "this.current" in a try/catch

    constructor(private _disable?: boolean) {
        try {
            this._disable = this._disable || Environment.devMode;
            this.current.config.enableDebug = this.current.config.verboseLogging = !Environment.devMode;
            this.current._onerror = (message) => console.log(message);
        }
        catch (e) {
            console.error('Could not initialize AppInsights.');
        }
    }

    toggleTelemetry(force?: boolean) {
        try {
            this.current.config.disableTelemetry = force || !this._disable;
        }
        catch (e) {
            console.error(force, 'Could not toggle telemetry.');
        }
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
            if (Environment.devMode) {
                Utilities.log(error);
            }
            this.current.trackException(error.innerError || error, location, {
                message: error.message,
                host: Environment.host,
                build: JSON.stringify(Environment.build)
            });
        }
        catch (e) {
            console.error('Could not log with AppInsights, including exception info below.');
            console.log(error, location);
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
            if (Environment.devMode) {
                console.info(name);
            }
            this.current.trackEvent(name, properties, measurement);
        }
        catch (e) {
            console.error('Could not log with AppInsights, including tracking info below.');
            console.log(name, properties, measurement);
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
            this.current.trackMetric(name, average, sampleCount, min, max, properties);
        }
        catch (e) {
            console.error('Could not log with AppInsights, including metric info below.');
            console.log(name, average, sampleCount, min, max, properties);
        }
    }

    /**
    * Sets the autheticated user id and the account id in this session.
    * User auth id and account id should be of type string. They should not contain commas, semi-colons, equal signs, spaces, or vertical-bars.
    *
    * @param authenticatedUserId {string} - The authenticated user id. A unique and persistent string that represents each authenticated user in the service.
    * @param accountId {string} - An optional string to represent the account associated with the authenticated user.
    */
    setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string) {
        try {
            this.current.setAuthenticatedUserContext(authenticatedUserId, accountId);
        }
        catch (e) {
            console.error('Could not log with AppInsights, including authenticated user context info below.');
            console.log(authenticatedUserId, accountId);
        }
    }
}

export const AI = new ApplicationInsights();
