import * as React from 'react';
import styled from 'styled-components';

import List, { Item } from '../List';

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
  overflow-x: hidden;
  overflow-y: auto;
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

function getLogPropsBySeverity(severity: 'info' | 'warn' | 'error') {
  let background;
  let color = 'black';
  let icon = null;

  switch (severity) {
    case 'info':
      background = 'white';
      break;
    case 'warn':
      background = '#fff4ce';
      icon = { name: 'Warning', color: 'gold' };
      break;
    case 'error':
      background = '#fde7e9';
      icon = { name: 'Error', color: 'red' };
      break;
    default:
      break;
  }

  return { background, color, icon };
}

export interface ILog {
  message: string;
  severity: 'info' | 'warn' | 'error';
  source: string;
}

interface Props {
  logs: ILog[];
  clearLogs: () => void;
}

interface State {
  filterQuery: string;
  shouldScrollToBottom: boolean;
}

export default class Logs extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { filterQuery: '', shouldScrollToBottom: true };
  }

  componentDidMount() {
    this.scrollToBottom();
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

  setShouldScrollToBottom = (
    ev: React.FormEvent<HTMLElement>,
    checked: boolean
  ) =>
    this.setState({
      shouldScrollToBottom: checked,
      // tslint:disable-next-line:semicolon
    });

  render() {
    const { clearLogs, logs } = this.props;

    const items: Item[] = logs.map((log, i) => ({
      name: log.message,
      title: log.source,
      key: i,
      ...getLogPropsBySeverity(log.severity),
    }));

    return (
      <>
        <FilterWrapper>
          <ClearButton onClick={clearLogs}>
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
          <List
            items={items.filter(item =>
              item.name.toLowerCase().includes(this.state.filterQuery)
            )}
          />
          <div ref="lastLog" />
        </LogsWrapper>
        <CheckboxWrapper>
          <Checkbox
            label="Auto-scroll"
            defaultChecked={true}
            onChange={this.setShouldScrollToBottom}
          />
        </CheckboxWrapper>
      </>
    );
  }
}
