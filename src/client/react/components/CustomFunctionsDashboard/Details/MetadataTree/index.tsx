import * as React from 'react';

import Item from './Item';
import {
  FunctionWrapper,
  List,
  SnippetWrapper,
  TreeContainer,
} from './Wrappers';

const SnippetItem = props => (
  <Item className="ms-font-m" {...props} size="large" noLines={true} />
);
const FunctionItem = props => (
  <Item className="ms-font-m" {...props} size="medium" />
);
const ParameterItem = props => (
  <Item className="ms-font-s" {...props} size="small" />
);

const Function = ({ func }) => (
  <FunctionWrapper>
    <FunctionItem name={`${func.name}(...)`} status={func.status} />
    <List>
      {func.parameters.map(param => (
        <ParameterItem key={`${func.name}${param.name}`} {...param} />
      ))}
      <ParameterItem
        key={`${func.name}return`}
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
      {snippet.functions.map(func => (
        <Function key={`${snippet.name}${func.name}`} func={func} />
      ))}
    </List>
  </SnippetWrapper>
);

const MetadataTree = ({ metadata }) => (
  <TreeContainer>
    {metadata.map(snippet => <Snippet key={snippet.name} snippet={snippet} />)}
  </TreeContainer>
);

export default MetadataTree;
