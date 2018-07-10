import React, { Component } from 'react';
import styled from 'styled-components';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import List, { Item } from '../List';

const ContainerWrapper = styled.div`
  padding: 15px;
  background: white;
  display: flex;
  flex-direction: horizontal;
`;

const DropDownStyling = {
  width: '18px',
  fontSize: '16px',
  color: '#666',
  marginTop: '4px',
  marginRight: '5px',
};

interface IState {
  isExpanded: boolean;
}

interface IProps {
  content: string;
  fontFamily: string;
  children: Item[];
}

export default class DetailsContainer extends Component<IProps, IState> {
  state = { isExpanded: false };

  toggleVisibility = () => {
    const currentDisplay = this.state.isExpanded ? false : true;
    this.setState({ isExpanded: currentDisplay });
  };

  render() {
    const props = this.props;
    const state = this.state;
    return (
      <div>
        <ContainerWrapper>
          <Icon
            className="ms-font-m"
            iconName="ChevronDownMed"
            style={DropDownStyling}
            onClick={this.toggleVisibility}
          />
          <p className={props.fontFamily}>{props.content}</p>
        </ContainerWrapper>
        {state.isExpanded && <List items={props.children} />}
      </div>
    );
  }
}
