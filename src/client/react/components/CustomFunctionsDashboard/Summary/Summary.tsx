import * as React from 'react';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import {
  DetailsList,
  DetailsListLayoutMode,
  IDetailsHeaderProps,
  Selection,
  IColumn,
  CheckboxVisibility,
  ConstrainMode,
} from 'office-ui-fabric-react/lib/DetailsList';
import { IRenderFunction } from 'office-ui-fabric-react/lib/Utilities';
import {
  TooltipHost,
  ITooltipHostProps,
} from 'office-ui-fabric-react/lib/Tooltip';
import { ScrollablePane } from 'office-ui-fabric-react/lib/ScrollablePane';
import { Sticky } from 'office-ui-fabric-react/lib/Sticky';
import { MarqueeSelection } from 'office-ui-fabric-react/lib/MarqueeSelection';

import styled from 'styled-components';
import PivotContentContainer from '../PivotContentContainer';

const TopInfo = styled.div`
  padding: 27px 24px 0px 17px;
`;

const FunctionsContainer = styled.div`
  height: 100%;
  overflow: auto;
  flex-shrink: 2;
  border-top: 1px solid #f4f4f4;
`;

const items = Array.from(Array(50).keys()).map(i => ({
  name: `=ScriptLab.BlankSnippet.Function${i}()`,
  key: i,
}));
const columns: IColumn[] = [
  {
    name: 'Functions',
    key: 'Functions',
    fieldName: 'name',
    isResizable: false,
    ariaLabel: 'available functions',
    minWidth: 300,
    maxWidth: 350,
  },
];
const Summary = ({ metadata }) => {
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
          The following custom functions were successfully declared. Start using
          Custom Functions in Excel.
        </p>
      </TopInfo>
      <FunctionsContainer>
        <DetailsList
          checkboxVisibility={CheckboxVisibility.hidden}
          constrainMode={ConstrainMode.horizontalConstrained}
          isHeaderVisible={false}
          items={items}
          columns={columns}
          setKey="set"
          layoutMode={DetailsListLayoutMode.fixedColumns}
          selectionPreservedOnEmptyClick={true}
          ariaLabelForSelectionColumn="Toggle selection"
          ariaLabelForSelectAllCheckbox="Toggle selection for all items"
        />
      </FunctionsContainer>
    </PivotContentContainer>
  );
};

export default Summary;
