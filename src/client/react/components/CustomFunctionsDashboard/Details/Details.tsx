import * as React from 'react';
import styled from 'styled-components';
import MetadataTree from './MetadataTree';
import PivotContentContainer from '../PivotContentContainer';
const TreeWrapper = styled.div`
  position: relative;
  height: 100%;
  flex-shrink: 2;
  padding-top: 20pt;
  padding-bottom: 20pt;
  padding-right: 20pt;
`;

const PaddedPivotContentContainer = PivotContentContainer.extend`
  box-sizing: border-box;
  padding: 27px 27px 17px 17px;
`;

const Details = ({ metadata }) => (
  <PaddedPivotContentContainer>
    <h1
      className="ms-font-xl"
      style={{ lineHeight: '28px', marginBottom: '22px' }}
    >
      Custom Functions
    </h1>
    <TreeWrapper>
      <MetadataTree metadata={metadata} />
    </TreeWrapper>
  </PaddedPivotContentContainer>
);

export default Details;
