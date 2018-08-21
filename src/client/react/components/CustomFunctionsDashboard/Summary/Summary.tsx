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
  let successItemsContainer: DetailsItem[] = [];
  const scriptLabTopLevelNamespace = getScriptLabTopLevelNamespace();

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

    if (snippet.error) {
      const functionItemArray = [];
      items.unsuccessful.errors.map(item => {
        const errorDetailItems: DetailsItem[] = generateRows(
          item.children,
          'ms-font-xs',
          '50px',
          functionPadding
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
          />
        );
        functionItemArray.push(functionItem);
      });
      items.unsuccessful.skipped.forEach(item => {
        const skippedItem: DetailsItem[] = generateRows(
          [
            'This function was skipped because of other invalid functions in the snippet, please fix them.',
          ],
          'ms-font-xs',
          '50px',
          functionPadding
        );
        const functionItem = (
          <DetailsItem
            content={item.name}
            fontFamily="ms-font-s"
            statusIcon="Warning"
            statusIconColor="#F0C784"
            indent="30px"
            children={skippedItem}
            noDropdown={true}
            padding={functionPadding}
            statusTitle={true}
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
          indent="7px"
          hasBorderTop={true}
          statusTitle={true}
        />
      );
      errorItemsContainer.push(errorItem);
    } else {
      successItemsContainer = generateRows(
        items.successful,
        'ms-font-s',
        '7px',
        null,
        'Completed',
        '#107C10',
        null,
        true,
        true,
        true,
        snippet.name
      );
    }
  });

  /*HELPER FUNCTION*/
  function generateRows(
    itemList: any,
    fontFamily: string,
    indent: string,
    padding?: string,
    statusIcon?: string,
    statusIconColor?: string,
    children?: any,
    hasBorderTop?: boolean,
    statusTitle?: boolean,
    isSnippetHeader?: boolean,
    snippetName?: string
  ) {
    const container: DetailsItem[] = itemList.map(itemMessage => {
      if (isSnippetHeader) {
        itemMessage = `=${scriptLabTopLevelNamespace}.${snippetName}.${itemMessage}`;
      }
      return (
        <DetailsItem
          content={itemMessage}
          fontFamily={fontFamily}
          indent={indent}
          noDropdown={true}
          padding={padding}
          statusIcon={statusIcon}
          statusIconColor={statusIconColor}
          children={children}
          hasBorderTop={hasBorderTop}
          statusTitle={statusTitle}
        />
      ) as any;
    });
    return container;
  }

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
          <p
            className="ms-font-s"
            style={{
              padding: '10px 19px',
              color: '#333',
            }}
          >
            These functions run async in Script Lab. You can run them faster in sync mode
            with <a href="https://aka.ms/customfunctions">these instructions</a>.
          </p>
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
