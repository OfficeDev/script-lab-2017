// TODO Sophia:  remove this file, which is here for reference only for now.

import * as React from 'react';
import styled from 'styled-components';
import PivotContentContainer from '../PivotContentContainer';
import DetailsItem from './DetailsItem';
import { getScriptLabTopLevelNamespace } from '../../../../app/helpers';
import Items from './Items';
import {
  DetailsList,
  CheckboxVisibility,
  DetailsListLayoutMode,
} from 'office-ui-fabric-react/lib/DetailsList';

const TopInfo = styled.div`
  padding: 27px 24px 0px 17px;
`;

const SummaryContainer = styled.div`
  height: auto;
  overflow-x: hidden;
  width: auto;
  overflow-y: auto;
  flex-shrink: 2;
`;

const functionPadding = '4px 8px 10px 8px';

let detailsListErrors = [
  { name: 'sample(...)' },
  { name: 'add2(...)' },
  { name: 'mult2(...)' },
];
let groupsErrors = [
  /* {
    count: 2,
    key: 'unique',
    name: '=ScriptLab.Addition', // this should be the snippet top level namespace
    startIndex: 0,
    level: 0,
    children: [
      {
        count: 1,
        key: 'unique-nested',
        name: 'add2(...)',
        startIndex: 0,
        level: 1,
      },
    ], // this should be the function groups
  },
  {
    count: 1,
    key: 'unique-2',
    name: '=ScriptLab.Multiply',
    startIndex: 0,
    level: 0,
    children: [],
  }, */
];

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

    const scriptLabTopLevelNamespace = getScriptLabTopLevelNamespace();

    if (snippet.error) {
      // TODO: testing out detailslist function group creation
      createGroup('snippet', snippet.name, groupsErrors);

      const functionItemArray = [];
      //TODO: testing out detailslist function
      const detailsListFunctionArray = [];
      items.unsuccessful.errors.map(item => {
        const errorDetailItems: DetailsItem[] = item.children.map(paramErrorMessage => {
          return (
            <DetailsItem
              content={paramErrorMessage}
              fontFamily="ms-font-xs"
              indent="50px"
              noDropdown={true}
              padding={functionPadding}
            />
          ) as any;
        });
        // TODO: testing out detailslist function group creation
        /* const detailsListFunction = createGroup('function', item.name);
        detailsListFunctionArray.push(detailsListFunction); */

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
        let errorMessage = (
          <DetailsItem
            content={
              'This function was skipped because of other invalid functions in the snippet, please fix them.'
            }
            fontFamily="ms-font-xs"
            indent="50px"
            noDropdown={true}
            padding={functionPadding}
          />
        );

        // TODO: testing out detailslist function group creation
        /* const detailsListFunction = createGroup('function', item.name);
        detailsListFunctionArray.push(detailsListFunction); */

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
      items.successful.forEach(item => {
        const successItem: any = (
          <DetailsItem
            content={`=${scriptLabTopLevelNamespace}.${snippet.name}.${item}`}
            fontFamily="ms-font-s"
            statusIcon="Completed"
            statusIconColor="#107C10"
            noDropdown={true}
            indent="7px"
            hasBorderTop={true}
            statusTitle={true}
          />
        );
        successItemsContainer.push(successItem);
      });
    }
  });

  /* HELPER: for snippets and function */
  function createGroup(
    type: string,
    name: string,
    parentContainer: any[],
    children?: any[]
  ) {
    let level: number;
    if (type === 'snippet') {
      level = 0;
    }
    if (type === 'function') {
      level = 1;
    }
    //logic for children rendering goes here
    // const params = createGroups("functions", name2)
    parentContainer.push({
      count: 1,
      key: type + groupsErrors.length,
      name: name,
      startIndex: 0,
      level: level,
      // children: [children || null],
    });
  }

  /* HELPER: for parameter error messages */
  function createItems(errorMessages) {
    errorMessages.forEach(errorMessage => {
      detailsListErrors.push({
        name: errorMessage,
      });
    });
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
            className="ms-font-xs"
            style={{
              padding: '10px 19px',
              color: '#777',
            }}
          >
            The following snippets contain invalid functions. Please review and fix the
            errors.
          </p>
        )}
        {errorItemsContainer}

        <DetailsList
          groups={groupsErrors}
          items={detailsListErrors}
          checkboxVisibility={CheckboxVisibility.hidden}
          isHeaderVisible={false}
          layoutMode={DetailsListLayoutMode.justified}
        />

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
            className="ms-font-xs"
            style={{
              padding: '10px 19px',
              color: '#777',
            }}
          >
            These functions run async in Script Lab. You can run them faster in sync mode
            with <a href="https://aka.ms/customfunctions">these instructions</a>.
          </p>
          {successItemsContainer}

          {successItemsContainer.length === 0 && (
            <DetailsItem
              fontFamily={'ms-font-m'}
              content={'There are no registered functions.'}
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
