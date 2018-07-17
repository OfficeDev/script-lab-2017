import * as React from 'react';
import styled from 'styled-components';

import PivotContentContainer from '../PivotContentContainer';
import List, { Item } from '../List';

const TopInfo = styled.div`
  padding: 27px 24px 0px 17px;
`;

const FunctionsContainer = styled.div`
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  flex-shrink: 2;
  border-top: 1px solid #f4f4f4;
`;

const Summary = ({ metadata }: { metadata: ICFVisualMetadata }) => {
  let items: { success: Item[]; skipped: Item[]; error: Item[] } = {
    success: [],
    skipped: [],
    error: [],
  };
  metadata.snippets.forEach(snippet => {
    snippet.functions.forEach(func => {
      const scriptLabToplevelNamespace = 'ScriptLab';
      const name = `=${scriptLabToplevelNamespace}.${func.nonCapitalizedFullName}(${
        func.parameters.length > 0 ? '…' : ''
      })`;

      const item: Item = { name, key: name, smallCaps: true };

      if (snippet.error) {
        if (func.error) {
          items.error.push({
            ...item,
            icon: { name: 'ErrorBadge', color: '#f04251' },
            title: 'See Details tab for more information.',
          });
        } else {
          items.skipped.push({
            ...item,
            icon: { name: 'Unknown', color: '#ffd333' },
            title: 'See Details tab for more information.',
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
          Custom Functions (Preview)
        </h1>
        <p
          className="ms-font-m"
          style={{
            lineHeight: '16.8px',
            marginBottom: '26px',
            marginTop: '10px',
          }}
        >
          The following custom functions were found in your workspace. These functions run
          async in Script Lab. You can run them faster in sync mode with{' '}
          <a href="https://aka.ms/customfunctions" target="_blank">
            these instructions
          </a>.
        </p>
      </TopInfo>
      <FunctionsContainer style={{ marginTop: '20px' }}>
        <List items={[...items.success, ...items.error, ...items.skipped]} />
      </FunctionsContainer>
    </PivotContentContainer>
  );
};

export default Summary;
