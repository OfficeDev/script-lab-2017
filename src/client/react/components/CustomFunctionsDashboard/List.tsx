import * as React from 'react';
import styled, { StyledFunction } from 'styled-components';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Label } from 'office-ui-fabric-react/lib/Label';

interface LIProps {
  backgroundColor?: string;
  color?: string;
  smallCaps?: boolean;
}

const LI: StyledFunction<LIProps & React.HTMLProps<HTMLLIElement>> = styled.li;

const ListItem = LI`
  display: flex;
  
  align-items: center;

  width: 100%;
  min-height: 42px;
  padding: 13px;
  box-sizing: border-box;
  word-wrap: break-word;

  border-top: 0.5px solid #eeeeee;
  border-bottom: 0.5px solid #eeeeee;

  color: ${props => props.color || '#333333'};
  background: ${props => props.backgroundColor || 'white'};
  font-variant: ${props => (props.smallCaps ? 'small-caps' : 'normal')};
`;

const Text = styled.div`
  flex: 1;
  line-height: 12px;
`;

const ListContainer = styled.ul``;

// Note: for any change to this interface, be sure to also consider
// How it will be mapped in the UI.  See the "render" method of List.tsx,
// particularly the line starting with "const items: Item[] = logs.map((log, i) => ({"
export interface Item {
  key: any;
  name: string;
  dropdown?: {
    name: string;
    color: string;
  };
  errorMessage?: string;
  children?: string[]; // list of errors
  icon?: {
    name: string;
    color: string;
  };
  background?: string;
  color?: string;
  title?: string;
  smallCaps?: boolean;
  indent?: number;
}

export default ({ items }) => (
  <ListContainer>
    {items.map((item: Item) => (
      <div id={item.name}>
        <ListItem
          key={item.key}
          className="ms-font-s"
          id={item.name}
          backgroundColor={item.background}
          color={item.color}
          title={item.title}
          smallCaps={item.smallCaps}
        >
          {item.dropdown && (
            <Icon
              className="ms-font-m"
              // iconProps={{ iconName: item.dropdown.name }}
              iconName={item.dropdown.name}
              style={{
                width: '18px',
                fontSize: '16px',
                color: item.dropdown.color,
                marginRight: '5px',
                marginLeft: (item.indent || 0) * 5 + 'px',
              }}
              // TODO: Implement this on summary.tsx
              onClick={() =>
                item.children.forEach(child => {
                  // select div by id -> something like x = document.getelementbyid(item.name)
                  // make it not visible -> x.display = none
                  const listItem = document.getElementById(child);
                  const display = listItem.style.display === 'flex' ? 'none' : 'flex';
                  listItem.style.display = display;
                })
              }
            />
          )}
          {item.icon && (
            <Icon
              className="ms-font-m"
              iconName={item.icon.name}
              style={{
                fontSize: '16px',
                color: item.icon.color,
                marginRight: '5px',
                marginLeft: (item.indent || 0) * 5 + 'px',
              }}
            />
          )}

          <Text>
            {item.name}
            <Label
              style={{
                fontSize: '12px',
              }}
            >
              {item.errorMessage}
            </Label>
          </Text>
        </ListItem>
      </div>
    ))}
  </ListContainer>
);
