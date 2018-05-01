import * as React from 'react';
import styled from 'styled-components';
import { Strings } from '../../../app/strings';
const { localStorageKeys } = PLAYGROUND;
// tslint:disable:semicolon

const strings = Strings();

const Curtain = styled.div`
  position: absolute;
  z-index: 40000;
  top: 40px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
`;

const RunnerNotification = styled.div`
  z-index: 41000;
  width: 100%;
  box-sizing: border-box;
  position: absolute;
  background: white;

  .ms-MessageBar-icon {
    font-size: 30px;
  }

  .ms-MessageBar-text {
    font-size: 1em;
  }

  .buttons {
    text-align: right;
    margin-top: 15px;
  }
`;

const Button = styled.button`
  background: #217346;
  color: white;
  margin-left: 5px;

  &:hover {
    background: #1d673f;
  }

  &:focus {
    background: #1c613b;
  }

  & > span {
    color: white !important;
  }
`;

interface State {
  isVisible: boolean;
  lastUpdatedTimestamp: number;
}

export default class RefreshBar extends React.Component<{}, State> {
  private interval;

  constructor(props) {
    super(props);

    const lastUpdatedTimestamp =
      Number(
        window.localStorage.getItem(
          localStorageKeys.customFunctionsLastEditorUpdateTimestamp
        )
      ) || Date.now();
    this.state = { isVisible: false, lastUpdatedTimestamp };
  }

  showRefreshIfNeeded() {
    const newTimestamp = Number(
      window.localStorage.getItem(
        localStorageKeys.customFunctionsLastEditorUpdateTimestamp
      )
    );
    if (newTimestamp > this.state.lastUpdatedTimestamp) {
      this.setState({ lastUpdatedTimestamp: newTimestamp, isVisible: true });
    }
  }

  refresh = () => {
    window.location.reload();
  };

  dismiss = () => {
    const newTimestamp = Number(
      window.localStorage.getItem(
        localStorageKeys.customFunctionsLastEditorUpdateTimestamp
      )
    );
    this.setState({
      lastUpdatedTimestamp: newTimestamp,
      isVisible: false,
    });
  };

  componentDidMount() {
    this.interval = setInterval(() => this.showRefreshIfNeeded(), 500);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <>
        {this.state.isVisible && (
          <Curtain>
            <RunnerNotification className="ms-MessageBar ms-MessageBar--info">
              <div className="ms-MessageBar-content">
                <div className="ms-MessageBar-text">
                  You changed the code in one or more custom functions. Refresh
                  this pane to update your custom functions in Excel.
                </div>

                <div className="buttons" style={{ textAlign: 'right' }}>
                  <Button
                    onClick={this.refresh}
                    className="action-fast-reload ms-Button host-colored-button"
                  >
                    <span className="ms-Button-label">{strings.refresh}</span>
                  </Button>
                  <Button
                    onClick={this.dismiss}
                    className="action-dismiss ms-Button host-colored-button"
                  >
                    <span className="ms-Button-label">{strings.dismiss}</span>
                  </Button>
                </div>
              </div>
            </RunnerNotification>
          </Curtain>
        )}
      </>
    );
  }
}
