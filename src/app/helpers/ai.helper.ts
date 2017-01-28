import { AppInsights } from 'applicationinsights-js';
import { Environment } from '../../environment';
import { Utilities } from '@microsoft/office-js-helpers';

AppInsights.downloadAndSetup({
    instrumentationKey: Environment.config.instrumentation_key,
    autoTrackPageVisitTime: true
});

class ApplicationInsights {
    public current = AppInsights;

    constructor(private _disable?: boolean) {
        this._disable = this._disable || Environment.env !== 'PRODUCTION';
        this.current.config.enableDebug = Environment.env === 'DEVELOPMENT';
        this.current.config.verboseLogging = Environment.env === 'DEVELOPMENT';
        this.current._onerror = (message) => console.log(message);
    }

    toggleTelemetry(force?: boolean) {
        this.current.config.disableTelemetry = force || !this._disable;
    }

    trackException(error, location) {
        if (Environment.env === 'DEVELOPMENT') {
            Utilities.log(error);
        }
        this.current.trackException(error.innerError || error, location, {
            message: error.message,
            host: Environment.host,
            build: JSON.stringify(Environment.build)
        });
    }

    trackEvent(name: string, properties?: { [index: string]: string }, measurement?: { [index: string]: number }) {
        if (Environment.env === 'DEVELOPMENT') {
            console.info(name);
        }
        this.current.trackEvent(name, properties, measurement);
    }
};

export const AI = new ApplicationInsights();
