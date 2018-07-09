import * as React from 'react';
import styled from 'styled-components';
import PivotContentContainer from '../PivotContentContainer';
import List, { Item } from '../List';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

const TopInfo = styled.div`
  padding: 27px 24px 0px 17px;
`;

const ErrorContainer = styled.div`
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  flex-shrink: 2;
  border-top: 1px solid #f4f4f4;
`;

const RegisteredFunctionsContainer = styled.div`

  width: 100%
  height: auto;
  overflow-x: hidden;
  overflow-y: auto;
  flex-shrink: 2;
  border-top: 1px solid #f4f4f4;
  z-index: 2000;
  bottom: 20px;
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
      const paramErrorNames = [];
      const paramErrorMergeTest = [];
      name3.forEach(param => {
        if (param.error !== undefined) {
          paramErrorNames.push(param.name);
          paramErrorMergeTest.push(`${param.name}: ${param.error}`);
        }
      });
      const itemError: Item = {
        name: `${name2}`,
        errorMessage: `${paramErrorMergeTest.toString()}`,
        key: name2,
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
            dropdown: { name: 'ChevronDownMed', color: '#666' },
            indent: 5,
            icon: { name: 'ErrorBadge', color: '#f04251' },
            children: [...paramErrorNames],
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
          The following functions are invalid and cannot be declared. Review and fix the
          issue.
        </p>
      </TopInfo>
      <ErrorContainer style={{ marginTop: '20px' }}>
        <List items={[...items.error, ...items.skipped]} />
      </ErrorContainer>
      {/* TODO: insert another container here for the registered functions */}

      <RegisteredFunctionsContainer>
        <p className="ms-font-l" style={{ padding: '15px 24px 15px 17px' }}>
          <Icon
            className="ms-font-m"
            iconName="ChevronDownMed"
            style={{
              width: '18px',
              fontSize: '16px',
              color: '#666',
              marginRight: '5px',
            }}
            onClick={() => {
              const listItem = document.getElementById('success-items');
              const display = listItem.style.display === 'block' ? 'none' : 'block';
              listItem.style.display = display;
            }}
          />
          Registered Custom Functions
        </p>
        <div id="success-items">
          <List items={[...items.success]} />
        </div>
      </RegisteredFunctionsContainer>
    </PivotContentContainer>
  );
};

export default Summary;
