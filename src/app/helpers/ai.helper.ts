import { AppInsights } from 'applicationinsights-js';
import { Environment } from '../../environment';

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
    }

    toggleTelemetry(force?: boolean) {
        this.current.config.disableTelemetry = force || !this._disable;
    }
};

export const AI = new ApplicationInsights();
