import * as React from 'react';
import styled, { StyledFunction } from 'styled-components';

interface IBlockProps {
  good?: boolean;
  skipped?: boolean;
  error?: boolean;
  untrusted?: boolean;
  small?: boolean;
  medium?: boolean;
  large?: boolean;
  noLines?: boolean;
}

const block: StyledFunction<IBlockProps & React.HTMLProps<HTMLLIElement>> =
  styled.li;

const Block = block`
  width: 100%;
  outline: 1px solid #DDDDDD;
  padding: 10px;
  margin: 8px 0pt;
  box-sizing: border-box;
  list-style-type: none;

  position: relative;

  ${props => props.good && 'background: #dff6dd;'}
  ${props => props.skipped && 'background: #fff4ce;'}
  ${props => props.error && 'background: #fde7e9;'}
  ${props => props.untrusted && 'background: #eeeeee;'}

  padding-top: 0.5em;
  padding-bottom: 0.5em;

  ${props => props.noLines && 'margin-top: 0px;'}

  &:before {
    ${props => props.noLines && 'display: none;'}

    box-sizing:border-box;
    content:'';
    position: absolute;
    top: -50%;
    height: 100%;
    left: -20px;
    width: 20px;

    border-left: 1px solid #DDDDDD;
    border-bottom: 1px solid #DDDDDD;

    z-index: -1000;
  }

  &:after {
     box-sizing:border-box;
     content:'';
     position: absolute;
     top: 50%;
     height: 100%;
     left: -20px;
     width: 20px;

    border-left: 1px solid #DDDDDD;

    z-index: -1000;
  }

  &:last-of-type {
    margin-bottom: 0px;
  }
  &:last-of-type:after {
    display:none;
  }
`;

const getBlockText = (name, type, error) => {
  const sType = type ? ` : ${type}` : '';
  const sError = error ? ` - ${error}` : '';
  return name + sType + sError;
};

export default ({ name, type, error, status, size, noLines, className }) => (
  <Block
    {...{ [size]: true }}
    {...{ [status]: true }}
    noLines={noLines}
    className={className}
  >
    {getBlockText(name, type, error)}
  </Block>
);
