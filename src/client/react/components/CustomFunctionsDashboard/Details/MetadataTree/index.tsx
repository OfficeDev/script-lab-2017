import * as React from 'react';

import Item from './Item';
import { FunctionWrapper, List, SnippetWrapper, TreeContainer } from './Wrappers';

const SnippetItem = props => (
  <Item className="ms-font-m" {...props} size="large" noLines={true} />
);
const FunctionItem = props => <Item className="ms-font-m" {...props} size="medium" />;
const ParameterItem = props => <Item className="ms-font-s" {...props} size="small" />;

const Function = ({ func }: { func: ICFVisualFunctionMetadata }) => (
  <FunctionWrapper>
    <FunctionItem name={`${func.funcName}(...)`} status={func.status} />
    <List>
      {func.parameters.map(param => (
        <ParameterItem key={`${func.nonCapitalizedFullName}${param.name}`} {...param} />
      ))}
      <ParameterItem
        key={`${func.nonCapitalizedFullName}return`}
        name={'return'}
        {...func.result}
      />
    </List>
  </FunctionWrapper>
);

const Snippet = ({ snippet }) => (
  <SnippetWrapper>
    <SnippetItem name={snippet.name} status={snippet.status} />
    <List>
      {snippet.functions.map((func: ICFVisualFunctionMetadata) => (
        <Function key={`${snippet.name}${func.funcName}`} func={func} />
      ))}
    </List>
  </SnippetWrapper>
);

const MetadataTree = ({ metadata }: { metadata: ICFVisualMetadata }) => (
  <TreeContainer>
    {metadata.snippets.map(snippet => <Snippet key={snippet.name} snippet={snippet} />)}
  </TreeContainer>
);

export default MetadataTree;
