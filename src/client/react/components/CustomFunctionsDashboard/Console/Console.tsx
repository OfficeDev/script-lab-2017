import * as React from 'react';
import * as moment from 'moment';
import styled from 'styled-components';
import PivotContentContainer from '../PivotContentContainer';
import List from '../List';
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import {
  getElapsedTime,
  getNumberFromLocalStorage,
  setUpMomentJsDurationDefaults,
} from '../../../../app/helpers';
import { getDisplayLanguage } from '../../../../app/strings';
const { localStorageKeys } = PLAYGROUND;

const FilterWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  height: 48px;
  background: #f4f4f4;
  box-sizing: border-box;
`;

const CheckboxWrapper = styled.div`
  height: 38px;
  background: #f4f4f4;
  box-sizing: border-box;
  padding: 9px;
`;

const LogsWrapper = styled.div`
  height: 100%;
  overflow: auto;
  flex-shrink: 2;
`;

const ClearButton = styled.button`
  width: 20px;
  height: 20px;
  background: none;
  border: 0px;
  position: relative;
  margin-right: 13px;
  margin-left: 5px;

  &:hover {
    color: #b22222;
    cursor: pointer;
  }

  &:active {
    color: red;
  }

  &:focus {
    outline: none;
  }
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
    checked: boolean
  ) =>
    this.setState({
      shouldScrollToBottom: checked,
      // tslint:disable-next-line:semicolon
    });

  render() {
    const items = this.state.logs
      .filter(log => log.message.toLowerCase().includes(this.state.filterQuery))
      .map((log, i) => ({ name: log.message, key: i }));

    return (
      <PivotContentContainer>
        <RunnerLastUpdated
          isAlive={this.state.runnerIsAlive}
          lastUpdated={this.state.runnerLastUpdatedText}
        />
        <FilterWrapper>
          <ClearButton onClick={this.clearLogs}>
            <Icon
              style={{
                position: 'absolute',
                top: '0px',
                bottom: '0px',
                left: '0px',
                right: '0px',
                width: '20px',
                height: '20px',
                lineHeight: '20px',
              }}
              iconName="Clear"
            />
          </ClearButton>
          <input
            className="ms-font-m"
            type="text"
            placeholder="Filter"
            onChange={this.updateFilterQuery}
            ref="filterTextInput"
            style={{
              width: '100%',
              height: '32px',
              padding: '6px',
              boxSizing: 'border-box',
            }}
          />
        </FilterWrapper>
        <LogsWrapper>
          <List items={items} />
          <div ref="lastLog" />
        </LogsWrapper>
        <CheckboxWrapper>
          <Checkbox
            label="Auto-scroll"
            defaultChecked={true}
            onChange={this.setShouldScrollToBottom}
          />
        </CheckboxWrapper>
      </PivotContentContainer>
    );
  }
}
