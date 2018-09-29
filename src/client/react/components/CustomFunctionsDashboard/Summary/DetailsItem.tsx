import React, { Component } from 'react';
import styled, { css } from 'styled-components';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

interface IState {
  isExpanded: boolean;
}

interface IProps extends IContainerWrapperProps {
  content: String;
  fontFamily: string;
  caption?: string;
  noDropdown?: boolean;
  statusIcon?: string;
  statusIconColor?: string;
  children?: any[];
  hasBorderTop?: boolean;
}

interface IContainerWrapperProps {
  statusTitle?: boolean;
  padding?: string;
  indent?: string;
  backgroundColor?: string;
}

const DropDownStyling = {
  width: '18px',
  fontSize: '16px',
  color: '#333',
  marginTop: '3px',
  marginRight: '5px',
};

const ContainerWrapper = styled.div`
  &:hover: {
    color: red;
  }
  display: flex;
  flex-direction: horizontal;
  height: auto;
  ${(props: Partial<IContainerWrapperProps>) => css`
    padding: ${props.padding || '12px'};
    background: ${props.backgroundColor || '#fff'};
    ${props.indent ? `margin-left: ${props.indent};` : ''} ${props.statusTitle
      ? `
      word-break: break-all;
      font-variant: small-caps;
    `
      : ''};
  `};
`;

export default class DetailsItem extends Component<IProps, IState> {
  state = { isExpanded: true };

  toggleVisibility = () => {
    const currentDisplay = this.state.isExpanded ? false : true;
    this.setState({ isExpanded: currentDisplay });
  };

  render() {
    const props = this.props;
    const state = this.state;

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
        <ContainerWrapper
          statusTitle={props.statusTitle}
          padding={props.padding}
          indent={props.indent}
          backgroundColor={props.backgroundColor}
        >
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
