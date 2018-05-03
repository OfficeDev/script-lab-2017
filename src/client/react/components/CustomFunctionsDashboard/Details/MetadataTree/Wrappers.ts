import styled from 'styled-components';

export const TreeContainer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;

  font-size: 1.5rem;

  overflow-y: auto;

  box-sizing: border-box;
`;

export const List = styled.ul`
  margin: 0;
  margin-left: 40px;
  padding: 0;
`;

export const SnippetWrapper = styled.div`
  margin-bottom: 40px;
  margin-right: 5px;
  border: 1px solid #dddddd;
`;

export const FunctionWrapper = styled.div`
  margin-top: 10px;
  box-sizing: border-box;

  position: relative;

  &::before {
    box-sizing: border-box;

    content: '';
    position: absolute;
    top: 0;
    height: 100%;
    left: -20px;
    width: 20px;

    border-left: 1px solid #dddddd;
    z-index: -1001;
  }

  &:last-child {
    &::before {
      display: none;
    }
  }
`;
