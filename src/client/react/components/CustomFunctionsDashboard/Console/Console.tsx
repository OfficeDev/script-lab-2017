import * as React from 'react';
import styled from 'styled-components';
import PivotContentContainer from '../PivotContentContainer';
import Logs from './Logs';

import { setUpMomentJsDurationDefaults } from '../../../../app/helpers';
import { getDisplayLanguage } from '../../../../app/strings';
import moment from 'moment';
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

interface Props {
  logs: LogData[];
  runnerLastUpdated: number;
  runnerIsAlive: boolean;
  clearLogsCallback: () => void;
}

interface State {}

export default class Console extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    setUpMomentJsDurationDefaults(moment);
  }

  render() {
    const { clearLogsCallback, logs, runnerIsAlive, runnerLastUpdated } = this.props;

    const runnerLastUpdatedText = runnerIsAlive
      ? moment(new Date(runnerLastUpdated))
          .locale(getDisplayLanguage())
          .fromNow()
      : '';

    return (
      <PivotContentContainer>
        <RunnerLastUpdated isAlive={runnerIsAlive} lastUpdated={runnerLastUpdatedText} />
        {logs.length > 0 ? (
          <Logs logs={logs} clearLogs={clearLogsCallback} />
        ) : (
          this.generateNoLogsPlaceholder()
        )}
      </PivotContentContainer>
    );
  }

  private generateNoLogsPlaceholder() {
    return (
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
    );
  }
}
