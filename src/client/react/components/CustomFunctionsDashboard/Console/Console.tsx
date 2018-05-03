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
`;

const RunnerLastUpdatedWrapper = styled.div`
  padding: 8px 12px;
  height: 16px;
  background: #f4f4f4;
`;

const RunnerLastUpdated = ({ isAlive, lastUpdated }) => (
  <>
    {isAlive ? (
      <RunnerLastUpdatedWrapper>
        Runner last updated {lastUpdated}
      </RunnerLastUpdatedWrapper>
    ) : (
      <div />
    )}
  </>
);

function getLogPropsBySeverity(severity: 'log' | 'warn' | 'error') {
  let background;
  let color = 'black';

  switch (severity) {
    case 'log':
      background = 'white';
      break;
    case 'warn':
      background = '##fff4ce';
      break;
    case 'error':
      background = '#fde7e9';
      break;
    default:
      break;
  }

  return { background, color };
}

export interface Props {}

export interface State {
  filterQuery: string;
  shouldScrollToBottom: boolean;
  logs: { message: string; severity: 'log' | 'warn' | 'error' }[];
  runnerLastUpdatedText?: string;
  runnerIsAlive?: boolean;
}

export default class Console extends React.Component<Props, State> {
  private interval;
  constructor(props: Props) {
    super(props);

    setUpMomentJsDurationDefaults(moment);
    this.state = { filterQuery: '', shouldScrollToBottom: true, logs: [] };
  }

  getLogs() {
    const runnerIsAlive =
      getElapsedTime(
        getNumberFromLocalStorage(
          localStorageKeys.customFunctionsLastHeartbeatTimestamp,
        ),
      ) < 3000;

    let runnerLastUpdatedText = null;

    if (runnerIsAlive) {
      runnerLastUpdatedText = moment(
        new Date(
          getNumberFromLocalStorage(
            localStorageKeys.customFunctionsCurrentlyRunningTimestamp,
          ),
        ),
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

    this.scrollToBottom();
    this.setState({
      logs: [...this.state.logs, ...logs],
      runnerIsAlive,
      runnerLastUpdatedText,
    });

    window.localStorage.removeItem(localStorageKeys.log);
  }

  componentDidMount() {
    this.scrollToBottom();

    this.interval = setInterval(() => this.getLogs(), 250);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.state.shouldScrollToBottom) {
      (this.refs.lastLog as any).scrollIntoView();
    }
  }

  updateFilterQuery = () =>
    this.setState({
      filterQuery: (this.refs.filterTextInput as any).value.toLowerCase(),
      // tslint:disable-next-line:semicolon
    });

  clearLogs = () => {
    window.localStorage.removeItem(localStorageKeys.log);
    this.setState({ logs: [] });
    // tslint:disable-next-line:semicolon
  };

  setShouldScrollToBottom = (
    ev: React.FormEvent<HTMLElement>,
    checked: boolean,
  ) =>
    this.setState({
      shouldScrollToBottom: checked,
      // tslint:disable-next-line:semicolon
    });

  render() {
    const items = this.state.logs
      .filter(log => log.message.toLowerCase().includes(this.state.filterQuery))
      .map((log, i) => ({
        name: log.message,
        key: i,
        ...getLogPropsBySeverity(log.severity),
      }));

    return (
      <PivotContentContainer>
        <RunnerLastUpdated
          isAlive={this.state.runnerIsAlive}
          lastUpdated={this.state.runnerLastUpdatedText}
        />
        {items.length > 0 ? (
          <Logs
            items={items}
            clearLogs={this.clearLogs}
            setShouldScrollToBottom={this.setShouldScrollToBottom}
            updateFilterQuery={this.updateFilterQuery}
          />
        ) : (
          <NoLogsPlaceholder>
            <p
              style={{
                top: '0px',
                bottom: '0px',
                left: '0px',
                right: '0px',
                margin: 'auto',
                color: '#333',
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
