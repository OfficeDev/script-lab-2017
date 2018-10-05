import * as React from 'react';
import styled from 'styled-components';

import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { mergeStyles } from '@uifabric/merge-styles';

import Summary from './Summary';
import Console from './Console/Console';
import RefreshBar from './RefreshBar';
import { Authenticator } from '@microsoft/office-js-helpers';
import {
  isNullOrWhitespace,
  environment,
  CustomFunctionEngineStatus,
} from '../../../app/helpers';
import { getLogAndHeartbeatStatus } from './LogAndHeartbeatFetcher';

const NavigateBackIconName = 'NavigateBack';

// styles
const Container = styled.div`
  width: 100%;
  height: 100vh;

  box-sizing: border-box;
`;

// interfaces
interface ICustomFunctionsDashboardState {
  logs: (LogData & { id: string })[];
  runnerIsAlive: boolean;
  runnerLastUpdated: number;
}

interface ICustomFunctionsDashboardProps {
  placeholder?: any;
  metadata: ICFVisualMetadata;
  engineStatus: CustomFunctionEngineStatus;
}

class CustomFunctionsDashboard extends React.Component<
  ICustomFunctionsDashboardProps,
  ICustomFunctionsDashboardState
> {
  private returnUrl: string | undefined;
  private interval;
  private _pivotClassName: string;
  private _logCounter: number = 0;

  constructor(props: ICustomFunctionsDashboardProps) {
    super(props);
    this.state = {
      logs: [],
      runnerIsAlive: false,
      runnerLastUpdated: 0,
    };

    this.performLogFetch = this.performLogFetch.bind(this);

    // Better design would be to put it on root page, and pass it down to this component.  But this will do for now
    const pageParams: { returnUrl?: string } =
      Authenticator.extractParams(window.location.href.split('?')[1]) || {};
    if (isNullOrWhitespace(pageParams.returnUrl)) {
      pageParams.returnUrl = null;
    } else {
      pageParams.returnUrl = decodeURIComponent(pageParams.returnUrl);
    }

    // By the same token, set the playground return url to something,
    // so that if snippets switch and navigate to runner, don't later end up in editor
    // by pressing the editor's back button!
    if (pageParams.returnUrl) {
      window.sessionStorage.playground_returnUrl = pageParams.returnUrl;
    } else {
      if (!window.sessionStorage.playground_returnUrl) {
        window.sessionStorage.playground_returnUrl =
          environment.current.config.editorUrl + '?gallery=true';
      }
    }
  }

  render() {
    return (
      <Container className={this.pivotClassName}>
        <RefreshBar />
        <Pivot initialSelectedIndex={this.returnUrl ? 1 : 0} onLinkClick={onLinkClick}>
          {this.getPivotItems()}
        </Pivot>
      </Container>
    );

    function onLinkClick(item: PivotItem): void {
      if (item.props.itemIcon === NavigateBackIconName) {
        window.location.href = this.returnUrl;
      }
    }
  }

  async componentDidMount() {
    await this.performLogFetch();

    let waitingOnPreviousLogFetch = false;
    this.interval = setInterval(async () => {
      if (waitingOnPreviousLogFetch) {
        return;
      }
      waitingOnPreviousLogFetch = true;
      await this.performLogFetch();
      waitingOnPreviousLogFetch = false;
    }, 300);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  private get pivotClassName() {
    if (!this._pivotClassName) {
      this._pivotClassName = mergeStyles({
        selectors: {
          '& .ms-Pivot': {
            backgroundColor: '#217346',
            paddingLeft: '8px',
          },
          '& .ms-Pivot .ms-Pivot-link': {
            background: '#217346 !important',
            color: 'white !important',
            minWidth: '20px',
          },
          '& .ms-Pivot .ms-Pivot-link:first-child .ms-Pivot-link-content': this.returnUrl
            ? {
                position: 'relative',
                top: '1px',
              }
            : {},
          '&& .ms-Pivot .ms-Pivot-link.is-selected': {
            background: '#103822 !important',
            color: 'white',
            fontWeight: '400',
          },
          '& .ms-Pivot .ms-Pivot-link.is-selected:before': {
            borderBottom: '0px solid white',
          },
          '& .ms-Pivot .ms-Pivot-link:not(.is-selected):hover': {
            color: 'white !important',
            backgroundColor: 'rgba(0,0,0,0.3) !important',
          },
          '& .ms-Pivot .ms-Pivot-link .ms-Pivot-link-content': {
            flexGrow: 1,
          },
        },
      });
    }
    return this._pivotClassName;
  }

  private getPivotItems() {
    const { metadata, engineStatus } = this.props;

    return [
      this.returnUrl ? (
        <PivotItem key="Back" itemIcon={NavigateBackIconName}>
          {<div />}
        </PivotItem>
      ) : null,

      <PivotItem linkText="Summary" key="Summary">
        <Summary metadata={metadata} />
      </PivotItem>,

      <PivotItem
        linkText="Console"
        key="Console"
        itemCount={this.state.logs.length || undefined}
      >
        <Console
          logs={this.state.logs}
          runnerLastUpdated={this.state.runnerLastUpdated}
          runnerIsAlive={this.state.runnerIsAlive}
          engineStatus={engineStatus}
          clearLogsCallback={() => this.setState({ logs: [] })}
        />
      </PivotItem>,
    ].filter(item => item != null);
  }

  private async performLogFetch() {
    let newData: {
      runnerIsAlive: boolean;
      newLogs: LogData[];
      runnerLastUpdated: number;
    };
    try {
      newData = await getLogAndHeartbeatStatus(this.props.engineStatus);
    } catch (e) {
      newData = {
        newLogs: [
          {
            message: 'Unable to fetch logs & status: ' + e,
            source: 'SYSTEM',
            severity: 'error',
          },
        ],
        runnerIsAlive: false,
        runnerLastUpdated: 0,
      };
    }
    let newLogs = [
      ...this.state.logs,
      ...newData.newLogs.map(item => ({ id: (this._logCounter++).toString(), ...item })),
    ];
    this.setState({
      runnerIsAlive: newData.runnerIsAlive,
      logs: newLogs,
      runnerLastUpdated: newData.runnerLastUpdated,
    });
  }
}

export default CustomFunctionsDashboard;
