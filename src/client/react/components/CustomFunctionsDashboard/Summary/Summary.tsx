import * as React from 'react';
import styled from 'styled-components';
import PivotContentContainer from '../PivotContentContainer';
import DetailsItem from './DetailsItem';
import { environment } from '../../../../app/helpers';
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
  const errorItemsContainer: DetailsItem[] = [];
  const successItemsContainer: DetailsItem[] = [];

  metadata.snippets.forEach(snippet => {
    let items: Items = {
      unsuccessful: {
        errors: [],
        skipped: [],
      },
      successful: [],
    };
    snippet.functions.forEach(func => {
      const functionName = `${func.funcName}(${func.parameters.length > 0 ? '…' : ''})`;
      const paramErrorMessages: string[] = [];
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

    const scriptLabTopLevelNamespace =
      'ScriptLab' + (environment.current.devMode ? 'Dev' : '');

    if (snippet.error) {
      const functionItemArray = [];
      items.unsuccessful.errors.forEach(item => {
        const errorDetailItems: DetailsItem[] = item.children.map(paramErrorMessage => {
          return (
            <DetailsItem
              content={paramErrorMessage}
              fontFamily="ms-font-s"
              indent="45px"
              noDropdown={true}
              padding={functionPadding}
            />
          ) as any;
        });

        const functionItem = (
          <DetailsItem
            content={item.name}
            fontFamily="ms-font-s"
            statusIcon="ErrorBadge"
            statusIconColor="#f04251"
            indent="30px"
            children={errorDetailItems}
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
      const errorItem: any = (
        <DetailsItem
          content={`=${scriptLabTopLevelNamespace}.${snippet.name}`}
          fontFamily="ms-font-s"
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
        const successItem: any = (
          <DetailsItem
            content={`=${scriptLabTopLevelNamespace}.${snippet.name}.${item}`}
            fontFamily="ms-font-s"
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
          content={'There are no registered functions.'}
          noDropdown={true}
          indent={'10px'}
        />
      )}
    </PivotContentContainer>
  );
};

export default Summary;
