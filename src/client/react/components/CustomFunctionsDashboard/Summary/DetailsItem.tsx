import React, { Component } from 'react';
import styled from 'styled-components';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
// TODO: use focuszone from fabric components instead of greying out? -> https://developer.microsoft.com/en-us/fabric#/components/focuszone
// import { FocusZone, FocusZoneDirection } from 'office-ui-fabric-react/lib/FocusZone';
// TEST

interface IState {
  isExpanded: boolean;
}

interface IProps {
  content: string;
  fontFamily: string;
  noDropdown?: boolean;
  statusIcon?: string;
  statusIconColor?: string;
  indent?: string;
  children?: any[];
  isExpanded?: boolean; // don't know if this is still needed
  // TESTING: Background color
  backgroundColor?: string;
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

  toggleVisibility = () => {
    const currentDisplay = this.state.isExpanded ? false : true;
    this.setState({ isExpanded: currentDisplay });
  };

  render() {
    const props = this.props;
    const state = this.state; // unused
    const ContainerWrapper = styled.div`
      &:hover: {
        color: red;
      }
      padding: 12px;
      background: ${props.backgroundColor || '#fff'};
      display: flex;
      flex-direction: horizontal;
      margin-left: ${props.indent};
    `; // TODO: make the background grey for each detail item if expanded (this should apply to children as well)
    // thoughts: children will always be grey. so you can change their background to grey (you will alwyas only be able to view if expanded)

    const dividerStyle = {
      borderTop: 'solid',
      borderTopColor: '#eee',
      borderWidth: '0.5px',
      background: props.backgroundColor || '#fff',
    };

    const IconStyling = {
      width: '18px',
      fontSize: '16px',
      color: `${props.statusIconColor}`,
      marginTop: '3px',
      marginRight: '5px',
    };
    return (
      <div style={dividerStyle}>
        <FocusZone>
          <ContainerWrapper>
            {!props.noDropdown && (
              <Icon
                className="ms-font-m"
                iconName={this.state.isExpanded ? 'ChevronUpMed' : 'ChevronDownMed'}
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
          {state.isExpanded && props.children}
        </FocusZone>
      </div>
    );
  }
}
