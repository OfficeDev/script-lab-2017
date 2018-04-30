import * as React from 'react';
import styled from 'styled-components';

const ListItem = styled.li`
  width: 100%;
  height: 42px;
  padding: 13px;
  box-sizing: border-box;

  border-top: 0.5px solid #eeeeee;
  border-bottom: 0.5px solid #eeeeee;

  color: #333333;
`;

const ListContainer = styled.ul``;

export default ({ items }) => (
  <ListContainer>
    {items.map(item => (
      <ListItem key={item.key} className="ms-font-s">
        {item.name}
      </ListItem>
    ))}
  </ListContainer>
);
