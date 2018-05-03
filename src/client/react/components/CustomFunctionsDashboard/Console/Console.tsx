import * as React from 'react';
import * as moment from 'moment';
import styled from 'styled-components';
import PivotContentContainer from '../PivotContentContainer';
import Logs from './Logs';

import {
  getElapsedTime,
  getNumberFromLocalStorage,
  setUpMomentJsDurationDefaults,
} from '../../../../app/helpers';
import { getDisplayLanguage } from '../../../../app/strings';
const { localStorageKeys } = PLAYGROUND;

const NoLogsPlaceholder = styled.div`
  flex: 1;
  position: relative;
`;

const RunnerLastUpdatedWrapper = styled.div`
  padding: 8px 12px;
  height: 16px;
  line-height: 16px;
  background: #f4f4f4;
  overflow: hidden;
  overflow-wrap: normal;
`;

const RunnerLastUpdated = ({ isAlive, lastUpdated }) => (
  <>
    {isAlive ? (
      <RunnerLastUpdatedWrapper className="ms-font-m">
        Runner last updated {lastUpdated}
      </RunnerLastUpdatedWrapper>
    ) : (
      <div />
    )}
  </>
);

interface Props {}

interface State {
  logs: any[];
  runnerLastUpdatedText: string;
  runnerIsAlive: boolean;
}

export default class Console extends React.Component<Props, State> {
  private interval;
  constructor(props: Props) {
    super(props);

    setUpMomentJsDurationDefaults(moment);
    this.state = { logs: [], runnerIsAlive: false, runnerLastUpdatedText: '' };
  }

  getLogs = () => {
    const runnerIsAlive =
      getElapsedTime(
        getNumberFromLocalStorage(
          localStorageKeys.customFunctionsLastHeartbeatTimestamp
        )
      ) < 3000;

    let runnerLastUpdatedText = null;

    if (runnerIsAlive) {
      runnerLastUpdatedText = moment(
        new Date(
          getNumberFromLocalStorage(
            localStorageKeys.customFunctionsCurrentlyRunningTimestamp
          )
        )
      )
        .locale(getDisplayLanguage())
        .fromNow();
    }
    const storageLogs = window.localStorage.getItem(localStorageKeys.log) || '';
    const logs = storageLogs
      .split('\n')
      .filter(line => line !== '')
      .filter(line => !line.includes('Agave.HostCall'))
      .map(entry => JSON.parse(entry))
      .map(log => ({
        message: log.message as string,
        severity: log.severity as 'log' | 'warn' | 'error',
      }));

    this.setState({
      logs: [...this.state.logs, ...logs],
      runnerLastUpdatedText,
      runnerIsAlive,
    });

    window.localStorage.removeItem(localStorageKeys.log);
    // tslint:disable-next-line:semicolon
  };

  clearLogs = () => this.setState({ logs: [] });

  componentDidMount() {
    this.interval = setInterval(this.getLogs, 300);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <PivotContentContainer>
        <RunnerLastUpdated
          isAlive={this.state.runnerIsAlive}
          lastUpdated={this.state.runnerLastUpdatedText}
        />
        {this.state.logs.length > 0 ? (
          <Logs logs={this.state.logs} clearLogs={this.clearLogs} />
        ) : (
          <NoLogsPlaceholder>
            <p
              style={{
                position: 'absolute',
                top: '0',
                bottom: '0',
                left: '0',
                right: '0',
                margin: 'auto',
                color: '#333',
                textAlign: 'center',
                height: '60px',
                padding: '20px',
              }}
            >
              There are no logs to display. Use <strong>console.log()</strong>{' '}
              inside your functions to display logs here.
            </p>
          </NoLogsPlaceholder>
        )}
      </PivotContentContainer>
    );
  }
}
