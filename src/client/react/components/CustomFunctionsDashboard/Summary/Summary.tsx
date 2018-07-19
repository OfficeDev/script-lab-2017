import * as React from 'react';
import styled from 'styled-components';
import PivotContentContainer from '../PivotContentContainer';
import DetailsItem from './DetailsItem';

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

/* const Divider = styled.div`
  border-top: solid;
  border-top-color: #eee;
  border-width: 0.5px;
`; */

const Summary = ({ metadata }: { metadata: ICFVisualMetadata }) => {
  // ERROR CONTAINERS
  const errorItemsContainer = [];
  // SUCCESS CONTAINERS
  const successItemsContainer = [];

  // HF: GENERATING ERRONEOUS/SKIPPED ELEMENTS

  metadata.snippets.forEach(snippet => {
    let items: { unsuccessful: any; successful: any[] } = {
      unsuccessful: {
        error: [],
        skipped: [],
        isExpanded: true,
      },
      successful: [],
    };
    snippet.functions.forEach(func => {
      const functionName = `${func.name}(${func.parameters.length > 0 ? '…' : ''})`;
      const paramErrorMessages = [];
      func.parameters.forEach(param => {
        if (param.error !== undefined) {
          paramErrorMessages.push(`${param.name}: ${param.error}`);
        }
        // TODO: have some case for skipped items here
      });
      if (snippet.error) {
        if (func.error) {
          items.unsuccessful.error.push({
            name: functionName,
            children: paramErrorMessages,
          });
        } else {
          items.unsuccessful.skipped.push({
            name: functionName,
            children: paramErrorMessages,
          });
        }
      } else {
        items.successful.push({ content: functionName });
      }
    });
    // ERROR ITEMS
    if (snippet.error) {
      const functionItemArray = [];
      items.unsuccessful.error.forEach(item => {
        const errorMessageTest = [];
        item.children.forEach(paramErrorMessage => {
          const paramError = (
            <DetailsItem
              content={paramErrorMessage}
              fontFamily="ms-font-s"
              indent="45px"
              noDropdown={true}
              backgroundColor="#EEE"
            />
          );
          errorMessageTest.push(paramError);
        });
        const functionItem = (
          <DetailsItem
            content={item.name}
            fontFamily="ms-font-s"
            statusIcon="ErrorBadge"
            statusIconColor="#f04251"
            indent="20px"
            children={errorMessageTest}
            backgroundColor="#EEE"
          />
        );
        functionItemArray.push(functionItem);
      });
      // SKIPPED ITEMS
      items.unsuccessful.skipped.forEach(item => {
        let errorMessageTest = (
          <DetailsItem
            content={'This function was skipped.'}
            fontFamily="ms-font-s"
            indent="45px"
            noDropdown={true}
            backgroundColor="#EEE"
          />
        );
        const functionItem = (
          <DetailsItem
            content={item.name}
            fontFamily="ms-font-s"
            statusIcon="Warning"
            statusIconColor="#F0C784"
            indent="20px"
            children={[errorMessageTest]}
            backgroundColor="#EEE"
          />
        );
        functionItemArray.push(functionItem);
      });
      const errorItem = (
        <DetailsItem
          content={`=ScriptLab.${snippet.name}`}
          fontFamily="ms-font-m"
          statusIcon="ErrorBadge"
          statusIconColor="#f04251"
          children={functionItemArray}
          isExpanded={true}
        />
      );
      errorItemsContainer.push(errorItem);
    } else {
      // SUCCESS ITEMS
      items.successful.forEach(item => {
        const successItem = (
          <DetailsItem
            content={`=ScriptLab.${snippet.name}.${item.content}`}
            fontFamily="ms-font-m"
            statusIcon="Completed"
            statusIconColor="#107C10"
            noDropdown={true}
            indent="20px"
          />
        );
        successItemsContainer.push(successItem);
      });
    }
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
            marginBottom: '10px',
            marginTop: '10px',
          }}
        >
          The following snippets contain invalid functions that cannot be declared. Please
          review and fix the issues.
        </p>
      </TopInfo>
      {errorItemsContainer && (
        <ErrorContainer style={{ marginTop: '20px' }}>
          {errorItemsContainer}
        </ErrorContainer>
      )}
      <DetailsItem
        fontFamily={'ms-font-l'}
        content={'Registered Custom Functions'}
        children={successItemsContainer}
      />
    </PivotContentContainer>
  );
};

export default Summary;
