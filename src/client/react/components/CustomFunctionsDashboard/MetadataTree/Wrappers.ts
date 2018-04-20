import styled from 'styled-components';

export const TreeContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 30px;

  font-size: 1.5rem;

  overflow-y: auto;

  box-sizing: border-box;
`;

export const List = styled.ul`
  margin: 0;
  margin-left: 40pt;
  padding: 0;
`

export const SnippetWrapper = styled.div`
  margin-bottom: 40pt;
`

export const FunctionWrapper = styled.div`
  margin-top: 10pt;
  box-sizing: border-box;

  position: relative;

  &::before {
    box-sizing: border-box;

    content:'';
    position: absolute;
    top: 0;
    height: 100%;
    left: -14pt;
    width: 14pt;

    border-left: 1px solid #808080;
    z-index: -1001;
  }

  &:last-child {
    &::before {
      display: none;
    }
  }
`;