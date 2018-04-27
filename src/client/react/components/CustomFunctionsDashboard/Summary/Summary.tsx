import * as React from 'react';
import styled from 'styled-components';
import PivotContentContainer from '../PivotContentContainer';
import List from '../List';

const TopInfo = styled.div`
  padding: 27px 24px 0px 17px;
`;

const FunctionsContainer = styled.div`
  height: 100%;
  overflow: auto;
  flex-shrink: 2;
  border-top: 1px solid #f4f4f4;
`;

const Summary = ({ metadata }) => {
  let names = [];
  metadata.filter(snippet => ~snippet.error).forEach(snippet => {
    const funcNames = snippet.functions.map(
      func =>
        `=ScriptLab.${snippet.name}.${func.name}(${func.parameters
          .map(p => p.name)
          .join(', ')})`,
    );
    names = names.concat(funcNames);
  });

  const items = names.map(item => ({ name: item, key: item }));

  return (
    <PivotContentContainer>
      <TopInfo>
        <h1 className="ms-font-xl" style={{ lineHeight: '28px' }}>
          Custom Functions
        </h1>
        <p
          className="ms-font-m"
          style={{
            lineHeight: '16.8px',
            marginBottom: '26px',
            marginTop: '10px',
          }}
        >
          The following custom functions were successfully declared. Start using
          Custom Functions in Excel.
        </p>
      </TopInfo>
      <FunctionsContainer>
        <List items={items} />
      </FunctionsContainer>
    </PivotContentContainer>
  );
};

export default Summary;
