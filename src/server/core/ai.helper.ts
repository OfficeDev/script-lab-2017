import * as AppInsights from 'applicationinsights';

export class ApplicationInsights {
  private _current: Client;
  private _disable = false;

  /**
   * Sometimes AppInsights will encounter a failure on first use
   * (https://github.com/Microsoft/ApplicationInsights-JS/issues/347)
   * To avoid the issue, wrap any use of "this.current" in a try/catch
   */
  constructor(instrumentationKey, disable?: boolean) {
    try {
      this._disable = disable;
      this._current = AppInsights.setup(instrumentationKey).start().client;
      if (!this._disable) {
        AppInsights.enableVerboseLogging();
      }
    } catch (e) {
      console.error('Could not initialize AppInsights.');
    }
  }

  trackTimedEvent(
    name: string,
    properties?: { [index: string]: string },
    measurement?: { [index: string]: number }
  ) {
    let timer = Date;
    const tStart = timer.now();
    return {
      stop: () => {
        try {
          const tEnd = timer.now();
          this.trackEvent(name, properties, {
            ...measurement,
            duration: (tEnd - tStart) / 1000,
          });
        } catch (e) {}
      },
      get elapsed() {
        return timer.now() - tStart;
      },
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
      if (this._disable) {
        console.log(error);
      }
      this._current.trackException(error.innerError || error, {
        message: error.message,
        location: location,
      });
    } catch (e) {
      console.error(error, location);
    }
  }

  /**
   * Log a user action or other occurrence.
   * @param   name    A string to identify this event in the portal.
   * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
   * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
   */
  trackEvent(
    name: string,
    properties?: { [index: string]: string },
    measurement?: { [index: string]: number }
  ) {
    try {
      if (this._disable) {
        console.info(
          name,
          {
            ...properties,
          },
          measurement
        );
      }
      this._current.trackEvent(
        name,
        {
          ...properties,
        },
        measurement
      );
    } catch (e) {}
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
    name: string,
    average: number,
    sampleCount?: number,
    min?: number,
    max?: number,
    properties?: {
      [name: string]: string;
    }
  ) {
    try {
      if (this._disable) {
        console.info(name, average, sampleCount, min, max, {
          ...properties,
        });
      }
      this._current.trackMetric(name, average, sampleCount, min, max, null, {
        ...properties,
      });
    } catch (e) {}
  }
}
