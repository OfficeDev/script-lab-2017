import * as React from 'react';
import styled, { StyledFunction } from 'styled-components';

interface IBlockProps {
    good?: boolean,
    warning?: boolean,
    error?: boolean,
    small?: boolean,
    medium?: boolean,
    large?: boolean,
    noLines?: boolean,
};

const block: StyledFunction<IBlockProps & React.HTMLProps<HTMLLIElement>> = styled.li;

const Block = block`
  width: 100%;
  border: 1pt solid black;
  padding: 8pt;
  margin: 6pt 0pt;
  box-sizing: border-box;
  list-style-type: none;

  position: relative;

  ${props => props.good    && 'background: #dff6dd;'}
  ${props => props.warning && 'background: #fff4ce;'}
  ${props => props.error   && 'background: #fde7e9;'}

  ${props => props.small &&
      'padding-top: 6pt; padding-bottom: 6pt; font-size: 1.5rem'
  };

  ${props => props.medium &&
      'padding-top: 8pt; padding-bottom: 8pt; font-size: 1.6rem'
  };

  ${props => props.large &&
      'padding-top: 12pt; padding-bottom: 12pt; font-size: 1.8rem'
  };

  &:before {
    ${props => props.noLines && 'display: none;'}

    content:'';
    position: absolute;
    top: -50%;
    height: 100%;
    left: -15pt;
    width: 15pt;

    border-left: 1px solid #808080;
    border-bottom: 1px solid #808080;

    z-index: -1000;
  }

  &:after {
     content:'';
     position: absolute;
     top: 50%;
     height: 100%;
     left: -15pt;
     width: 15pt;

    border-left: 1px solid #808080;

    z-index: -1000;
  }

  &:last-of-type:after {
    display:none;
  }
`;

const getBlockText = (name, type, error) => {
  const sType  = type  ? ` : ${type}`  : ''
  const sError = error ? ` - ${error}` : ''
  return name + sType + sError
}

export default ({name, type, error, status, size, noLines}) =>
  <Block {...{[size]:true}}
         {...{[status]:true}}
         noLines={noLines}>
    { getBlockText(name, type, error) }
  </Block>