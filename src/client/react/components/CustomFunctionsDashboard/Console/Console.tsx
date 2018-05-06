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
  logs: LogData[];
  runnerLastUpdatedText: string;
  runnerIsAlive: boolean;
}

export default class Console extends React.Component<Props, State> {
  private interval;

  constructor(props: Props) {
    super(props);
    this.keepRefreshingFromLocalStorage = this.keepRefreshingFromLocalStorage.bind(this);

    setUpMomentJsDurationDefaults(moment);
    this.state = { logs: [], runnerIsAlive: false, runnerLastUpdatedText: '' };
  }

  keepRefreshingFromLocalStorage() {
    const pendingState: State = {} as State;

    pendingState.runnerIsAlive =
      getElapsedTime(
        getNumberFromLocalStorage(localStorageKeys.customFunctionsLastHeartbeatTimestamp)
      ) < 3000;

    if (pendingState.runnerIsAlive) {
      pendingState.runnerLastUpdatedText = moment(
        new Date(
          getNumberFromLocalStorage(
            localStorageKeys.customFunctionsCurrentlyRunningTimestamp
          )
        )
      )
        .locale(getDisplayLanguage())
        .fromNow();
    }

    const logsString = window.localStorage.getItem(localStorageKeys.log) || '';
    if (logsString.length > 0) {
      window.localStorage.removeItem(localStorageKeys.log);

      const newLogs = logsString
        .split('\n')
        .filter(line => line !== '')
        .filter(line => !line.includes('Agave.HostCall'))
        .map(entry => JSON.parse(entry) as LogData);
      pendingState.logs = [...this.state.logs, ...newLogs];
    }

    this.setState(pendingState);
  }

  clearLogs = () => this.setState({ logs: [] });

  componentDidMount() {
    this.interval = setInterval(this.keepRefreshingFromLocalStorage, 300);
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
            <div
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
              There are no logs to display. Use{' '}
              <pre
                style={{
                  fontFamily: 'Consolas, monaco, monospace',
                  fontWeight: 'bold',
                  display: 'inline',
                }}
              >
                console.log()
              </pre>{' '}
              inside your functions to display logs here.
            </div>
          </NoLogsPlaceholder>
        )}
      </PivotContentContainer>
    );
  }
}
