import * as React from 'react';
import styled from 'styled-components';
import MetadataTree from '../Details/MetadataTree';
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
      // this has to be conditional upon error based on if there is an error or not
      const name = `=${scriptLabToplevelNamespace}.${snippet.name}.${func.name}(${
        func.parameters.length > 0 ? '…' : ''
      })`;
      const item: Item = { name, key: name, smallCaps: true };
      // item for second indented error
      const name2 = func.name;
      // const itemError: Item = { name: name2, key: name2, smallCaps: false };
      // item for third indented error
      const name3 = [...func.parameters]; // this is an array that contains all of the parameter names for each function
      const paramErrors = [];
      const paramErrorNames = [];
      const paramErrorMergeTest = [];
      name3.forEach(param => {
        paramErrors.push({
          name: param.error !== undefined ? `${param.name}: ${param.error}` : null,
          key: `${param.name}`,
          smallCaps: false,
        });
        if (param.error !== undefined) {
          paramErrorNames.push(param.name);
        }
        if (param.error !== undefined) {
          const x = `${param.name}: ${param.error}`;
          paramErrorMergeTest.push(x);
        }
      });
      // const paramError: Item = { name: `${name3[0].name}`, key: name2, smallCaps: false };
      const itemError: Item = {
        name: `${name2}`,
        errorMessage: `${paramErrorMergeTest.toString()}`,
        key: name2,
        smallCaps: true,
      };
      if (snippet.error) {
        if (func.error) {
          // first indented item
          items.error.push({
            ...item,
            dropdown: { name: 'ChevronDownMed', color: '#666' },
            icon: { name: 'ErrorBadge', color: '#f04251' },
            title: 'Expand for details.',
            children: [itemError.name],
          });
          // the second indented item -> uses itemError instead of item
          items.error.push({
            ...itemError,
            // dropdown: { name: 'ChevronDownMed', color: '#666' },
            indent: 5,
            icon: { name: 'ErrorBadge', color: '#f04251' },
            children: [...paramErrorNames],
          });
          // third indented item -> describes parameter errors
          /* paramErrors.forEach(param => {
            // only display the problematic parameter
            if (param.name !== null) {
              items.error.push({
                icon: { name: '', color: '#f04251' },
                indent: 20,
                ...param,
              });
            }
          }); */
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
