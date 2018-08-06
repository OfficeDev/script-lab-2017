import React, { Component } from 'react';
import styled from 'styled-components';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Label } from 'office-ui-fabric-react/lib/Label';

interface IState {
  isExpanded: boolean;
}

interface IProps {
  content: String;
  fontFamily: string;
  caption?: string;
  noDropdown?: boolean;
  statusIcon?: string;
  statusIconColor?: string;
  indent?: string;
  children?: any[];
  backgroundColor?: string;
  hasBorderTop?: boolean;
  padding?: string;
  statusTitle?: boolean;
}

const DropDownStyling = {
  width: '18px',
  fontSize: '16px',
  color: '#666',
  marginTop: '3px',
  marginRight: '5px',
};

export default class DetailsItem extends Component<IProps, IState> {
  state = { isExpanded: true };

  toggleVisibility = () => {
    const currentDisplay = this.state.isExpanded ? false : true;
    this.setState({ isExpanded: currentDisplay });
  };

  render() {
    const props = this.props;
    const state = this.state;
    const ContainerWrapper = styled.div`
      &:hover: {
        color: red;
      }
      padding: ${props.padding || '12px'};
      background: ${props.backgroundColor || '#fff'};
      display: flex;
      flex-direction: horizontal;
      margin-left: ${props.indent};
      word-break: ${props.statusTitle && 'break-all'};
      font-variant: ${props.statusTitle && 'small-caps'};
      height: auto;
    `;

    const dividerStyle = {
      borderTop: 'solid',
      borderTopColor: '#eee',
      borderWidth: '1px',
      background: props.backgroundColor || '#fff',
    };

    const IconStyling = {
      width: '18px',
      fontSize: '16px',
      color: `${props.statusIconColor}`,
      marginTop: '1px',
      marginRight: '4px',
    };

    return (
      <div style={props.hasBorderTop && dividerStyle}>
        <ContainerWrapper>
          {!props.noDropdown && (
            <Icon
              className="ms-font-m"
              iconName={state.isExpanded ? 'ChevronUpMed' : 'ChevronDownMed'}
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
          <p style={{ width: '100%', marginRight: '5px' }} className={props.fontFamily}>
            {props.content}
            <br />
            <span className="ms-font-s">{props.caption}</span>
          </p>
        </ContainerWrapper>
        {state.isExpanded && props.children}
      </div>
    );
  }
}
