import * as React from 'react';
import styled from 'styled-components';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

const ListItem = styled.li`
  display: flex;
  align-items: center;

  width: 100%;
  min-height: 42px;
  padding: 13px;
  box-sizing: border-box;

  border-top: 0.5px solid #eeeeee;
  border-bottom: 0.5px solid #eeeeee;

  color: #333333;
`;

const Text = styled.span`
  flex: 1;
`;

const ListContainer = styled.ul``;

export default ({ items }) => (
  <ListContainer>
    {items.map(item => (
      <ListItem key={item.key} className="ms-font-s">
        {item.iconName && (
          <Icon
            iconName={item.iconName}
            style={{
              width: '20px',
              height: '20px',
              lineHeight: '20px',
              color: '#2C8EDD',
              marginRight: '4px',
            }}
          />
        )}
        <Text>{item.name}</Text>
      </ListItem>
    ))}
  </ListContainer>
);
