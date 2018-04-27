import * as React from 'react';
import styled from 'styled-components';
import PivotContentContainer from '../PivotContentContainer';
import List from '../List';
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

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
  }

  &:active {
    color: red;
  }

  &:focus {
    outline: none;
  }
`;

export interface Props {}

export interface State {
  filterQuery: string;
  shouldScrollToBottom: boolean;
  logs: string[];
}

export default class Console extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = { filterQuery: '', shouldScrollToBottom: true, logs: [] };

    setInterval(() => {
      const currLogs = this.state.logs;
      currLogs.push(
        `Log #${currLogs.length} - something random blah blah blah`,
      );
      this.setState({ logs: currLogs });
    }, 250);
  }

  componentDidMount() {
    this.scrollToBottom();
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.state.shouldScrollToBottom) {
      this.refs.lastLog.scrollIntoView();
    }
  }

  updateFilterQuery = () =>
    this.setState({
      filterQuery: (this.refs.filterTextInput as any).value.toLowerCase(),
    });

  clearLogs = () => this.setState({ logs: [] }); // todo

  setShouldScrollToBottom = (
    ev: React.FormEvent<HTMLElement>,
    checked: boolean,
  ) =>
    this.setState({
      shouldScrollToBottom: checked,
    });

  render() {
    const items = this.state.logs
      .filter(log => log.toLowerCase().includes(this.state.filterQuery))
      .map((log, i) => ({ name: log, key: i }));

    return (
      <PivotContentContainer>
        <FilterWrapper>
          <ClearButton>
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
