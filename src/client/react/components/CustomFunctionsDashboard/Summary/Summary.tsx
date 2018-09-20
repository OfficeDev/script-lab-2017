import * as React from 'react';
import styled from 'styled-components';
import PivotContentContainer from '../PivotContentContainer';
import DetailsItem from './DetailsItem';
import { getScriptLabTopLevelNamespace } from '../../../../app/helpers';
import Items from './Items';
const TopInfo = styled.div`
  padding: 27px 24px 0px 17px;
`;

const SummaryContainer = styled.div`
  height: auto;
  overflow-x: auto;
  overflow-y: auto;
  flex-shrink: 2;
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
      if (func.result.error) {
        paramErrorMessages.push(`Return - ${func.result.error}`);
      }
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

    const scriptLabTopLevelNamespace = getScriptLabTopLevelNamespace();

    if (snippet.error) {
      const functionItemArray = [];
      items.unsuccessful.errors.map((item, index) => {
        const errorDetailItems: DetailsItem[] = item.children.map(
          (paramErrorMessage, index) => {
            return (
              <DetailsItem
                content={paramErrorMessage}
                fontFamily="ms-font-xs"
                indent="50px"
                noDropdown={true}
                padding={functionPadding}
                key={index}
              />
            ) as any;
          }
        );

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
            statusTitle={true}
            key={index}
          />
        );
        functionItemArray.push(functionItem);
      });
      items.unsuccessful.skipped.forEach((item, index) => {
        let errorMessage = (
          <DetailsItem
            content={
              'This function was skipped because of other invalid functions in the snippet, please fix them.'
            }
            fontFamily="ms-font-xs"
            indent="50px"
            noDropdown={true}
            padding={functionPadding}
            key={index}
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
            statusTitle={true}
          />
        );
        functionItemArray.push(functionItem);
      });
      const namespacePlusSnippetName = `=${scriptLabTopLevelNamespace}.${snippet.name}`;
      const errorItem: any = (
        <DetailsItem
          content={namespacePlusSnippetName}
          fontFamily="ms-font-s"
          statusIcon="ErrorBadge"
          statusIconColor="#f04251"
          children={functionItemArray}
          noDropdown={true}
          indent="7px"
          hasBorderTop={true}
          statusTitle={true}
        />
      );
      errorItemsContainer.push(errorItem);
    } else {
      items.successful.forEach(item => {
        const functionFullName = `=${scriptLabTopLevelNamespace}.${snippet.name}.${item}`;
        const successItem: any = (
          <DetailsItem
            content={functionFullName}
            fontFamily="ms-font-s"
            statusIcon="Completed"
            statusIconColor="#107C10"
            noDropdown={true}
            indent="7px"
            hasBorderTop={true}
            statusTitle={true}
            key={functionFullName}
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
      <SummaryContainer>
        {errorItemsContainer.length > 0 && (
          <DetailsItem
            fontFamily={'ms-font-l'}
            content={'Invalid Functions'}
            noDropdown={true}
            indent={'7px'}
            hasBorderTop={true}
            backgroundColor={'#EEE'}
          />
        )}
        {errorItemsContainer.length > 0 && (
          <p
            className="ms-font-s"
            style={{
              padding: '10px 19px',
              color: '#333',
            }}
          >
            The following snippets contain invalid functions. Please review and fix the
            errors.
          </p>
        )}
        {errorItemsContainer}
        <div style={{ marginTop: '12px' }}>
          <DetailsItem
            fontFamily={'ms-font-l'}
            content={'Registered Custom Functions'}
            noDropdown={true}
            indent={'7px'}
            hasBorderTop={true}
            backgroundColor={'#EEE'}
          />
          {successItemsContainer}

          {successItemsContainer.length === 0 && (
            <DetailsItem
              fontFamily={'ms-font-m'}
              content={'There are no registered custom functions.'}
              noDropdown={true}
              indent={'7px'}
            />
          )}
        </div>
      </SummaryContainer>
    </PivotContentContainer>
  );
};

export default Summary;
