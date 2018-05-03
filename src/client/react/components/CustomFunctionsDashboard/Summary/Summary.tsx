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
  let items = { success: [], skipped: [], error: [] };
  metadata.forEach(snippet => {
    snippet.functions.forEach(func => {
      const name = `=ScriptLab.${snippet.name}.${func.name}(${
        func.parameters.length > 0 ? '…' : ''
      })`;

      const item = { name, key: name };

      if (snippet.error) {
        if (func.error) {
          items.error.push({
            ...item,
            icon: { name: 'ErrorBadge', color: '#f04251' },
          });
        } else {
          items.skipped.push({
            ...item,
            icon: { name: 'Unknown', color: '#ffd333' },
          });
        }
      } else {
        items.success.push({
          ...item,
          icon: { name: 'Completed', color: '#55cf4a' },
        });
      }
    });
  });

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
          The following custom functions were found in your workspace
        </p>
      </TopInfo>
      <FunctionsContainer>
        <List items={items.success.concat(items.error).concat(items.skipped)} />
      </FunctionsContainer>
    </PivotContentContainer>
  );
};

export default Summary;
