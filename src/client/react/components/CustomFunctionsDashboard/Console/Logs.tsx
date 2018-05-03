import * as React from 'react';
import styled from 'styled-components';

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
    cursor: pointer;
  }

  &:active {
    color: red;
  }

  &:focus {
    outline: none;
  }
`;

export default ({
  items,
  clearLogs,
  updateFilterQuery,
  setShouldScrollToBottom,
}) => {
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
          onChange={updateFilterQuery}
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
          onChange={setShouldScrollToBottom}
        />
      </CheckboxWrapper>
    </>
  );
};
