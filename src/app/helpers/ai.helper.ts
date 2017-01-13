import { AppInsights } from 'applicationinsights-js';
import global from '../../environment';

AppInsights.downloadAndSetup({
    instrumentationKey: global.auth.instrumentation_key,
    autoTrackPageVisitTime: true
});

const AI = AppInsights;
export { AI };
