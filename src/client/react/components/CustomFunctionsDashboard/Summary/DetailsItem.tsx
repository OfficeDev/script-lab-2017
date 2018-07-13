import React, { Component } from 'react';
import styled from 'styled-components';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

interface IState {
  isExpanded: boolean;
}

interface IProps {
  content: string;
  fontFamily: string;
  // children?: any[];
  noDropdown?: boolean;
  statusIcon?: string;
  statusIconColor?: string;
  indent?: string;
}

const DropDownStyling = {
  width: '18px',
  fontSize: '16px',
  color: '#666',
  marginTop: '3px',
  marginRight: '5px',
};

export default class DetailsItem extends Component<IProps, IState> {
  state = { isExpanded: false };
  // Unused thus far (maybe this belongs in summary instead of detailsitem)
  toggleVisibility = () => {
    const currentDisplay = this.state.isExpanded ? false : true;
    this.setState({ isExpanded: currentDisplay });
  };
  render() {
    const props = this.props;
    // const state = this.state; // unused
    const ContainerWrapper = styled.div`
      padding: 12px;
      background: white;
      display: flex;
      flex-direction: horizontal;
      margin-left: ${props.indent};
    `;
    const IconStyling = {
      width: '18px',
      fontSize: '16px',
      color: `${props.statusIconColor}`,
      marginTop: '3px',
      marginRight: '5px',
    };
    return (
      <div>
        <ContainerWrapper>
          {!props.noDropdown && (
            <Icon
              className="ms-font-m"
              iconName="ChevronDownMed"
              style={DropDownStyling}
              onClick={this.toggleVisibility}
            />
          )}
          {props.statusIcon && (
            <Icon
              className="ms-font-m"
              iconName={this.props.statusIcon}
              style={IconStyling}
            />
          )}
          <p className={props.fontFamily}>{props.content}</p>
        </ContainerWrapper>
      </div>
    );
  }
}
