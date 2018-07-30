import * as React from 'react';
import styled from 'styled-components';
import PivotContentContainer from '../PivotContentContainer';
import DetailsItem from './DetailsItem';
import Items from './Items';

const TopInfo = styled.div`
  padding: 27px 24px 0px 17px;
`;

const ErrorContainer = styled.div`
  height: auto;
  overflow-x: hidden;
  overflow-y: auto;
  flex-shrink: 2;
  border-top: 1px solid #f4f4f4;
`;

const functionPadding = '4px 8px 10px 8px';

const Summary = ({ metadata }: { metadata: ICFVisualMetadata }) => {
  const errorItemsContainer = [];
  const successItemsContainer = [];
  metadata.snippets.forEach(snippet => {
    let items: Items = {
      unsuccessful: {
        errors: [],
        skipped: [],
      },
      successful: [],
    };
    /* TODO: NOTE - when snippet name is empty it doesn't get read as a custom function at all
    error message that says name cannot be empty
    */
    const snippetName =
      snippet.name.length > 27 ? `${snippet.name.substring(0, 27)}...` : snippet.name;
    snippet.functions.forEach(func => {
      const functionName = `${func.name}(${func.parameters.length > 0 ? '…' : ''})`;
      const paramErrorMessages = [];
      func.parameters.forEach(param => {
        if (param.error !== undefined) {
          paramErrorMessages.push(`${param.name}: ${param.error}`);
        }
      });
      if (snippet.error) {
        if (func.error) {
          items.unsuccessful.errors.push({
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
        items.successful.push(functionName);
      }
    });
    if (snippet.error) {
      const functionItemArray = [];
      items.unsuccessful.errors.forEach(item => {
        const errorMessages = [];
        item.children.forEach(paramErrorMessage => {
          const paramError = (
            <DetailsItem
              content={paramErrorMessage}
              fontFamily="ms-font-s"
              indent="45px"
              noDropdown={true}
              padding={functionPadding}
            />
          );
          errorMessages.push(paramError);
        });
        const functionItem = (
          <DetailsItem
            content={item.name}
            fontFamily="ms-font-s"
            statusIcon="ErrorBadge"
            statusIconColor="#f04251"
            indent="30px"
            children={errorMessages}
            noDropdown={true}
            padding={functionPadding}
          />
        );
        functionItemArray.push(functionItem);
      });
      items.unsuccessful.skipped.forEach(item => {
        let errorMessage = (
          <DetailsItem
            content={'This function was skipped.'}
            fontFamily="ms-font-s"
            indent="45px"
            noDropdown={true}
            padding={functionPadding}
          />
        );
        const functionItem = (
          <DetailsItem
            content={item.name}
            fontFamily="ms-font-s"
            statusIcon="Warning"
            statusIconColor="#F0C784"
            indent="30px"
            children={[errorMessage]}
            noDropdown={true}
            padding={functionPadding}
          />
        );
        functionItemArray.push(functionItem);
      });
      const errorItem = (
        <DetailsItem
          content={`=SCRIPTLAB.${snippetName}`}
          fontFamily="ms-font-m"
          statusIcon="ErrorBadge"
          statusIconColor="#f04251"
          children={functionItemArray}
          noDropdown={true}
          indent="10px"
          hasBorderTop={true}
        />
      );
      errorItemsContainer.push(errorItem);
    } else {
      items.successful.forEach(item => {
        const successItem = (
          <DetailsItem
            content={`=SCRIPTLAB.${snippetName}.${item}`}
            fontFamily="ms-font-m"
            statusIcon="Completed"
            statusIconColor="#107C10"
            noDropdown={true}
            indent="10px"
            hasBorderTop={true}
          />
        );
        successItemsContainer.push(successItem);
      });
    }
  });

  return (
    <PivotContentContainer>
      <TopInfo>
        <h1 className="ms-font-xl" style={{ lineHeight: '28px', marginBottom: '10px' }}>
          Custom Functions (Preview)
        </h1>
      </TopInfo>
      {errorItemsContainer.length > 0 && (
        <ErrorContainer style={{ marginTop: '10px' }}>
          <DetailsItem
            fontFamily={'ms-font-l'}
            content={'Invalid Functions - Please Review'}
            children={errorItemsContainer}
            noDropdown={true}
            indent={'10px'}
            hasBorderTop={true}
            backgroundColor={'#EEE'}
          />
        </ErrorContainer>
      )}
      <DetailsItem
        fontFamily={'ms-font-l'}
        content={'Registered Custom Functions'}
        children={successItemsContainer}
        noDropdown={true}
        indent={'10px'}
        hasBorderTop={true}
        backgroundColor={'#EEE'}
      />
      {successItemsContainer.length === 0 && (
        <DetailsItem
          fontFamily={'ms-font-m'}
          content={'There are no registered functions. Please fix the errors.'}
          noDropdown={true}
          indent={'10px'}
        />
      )}
    </PivotContentContainer>
  );
};

export default Summary;
