import * as React from 'react';

import Item from './Item';
import { FunctionWrapper, List, SnippetWrapper, TreeContainer } from './Wrappers';

const SnippetItem   = props => <Item {...props} size='large' noLines={true} />
const ParameterItem = props => <Item {...props} size='small'/>
const FunctionItem  = props => <Item {...props} size='medium'/>

const Snippet = ({snippet}) =>
  <SnippetWrapper>
    <SnippetItem name={snippet.name} status={snippet.status} />
    <List>
      { snippet.functions.map(func => <Function key={func.name} func={func}/>) }
    </List>
  </SnippetWrapper>

const Function = ({func}) =>
  <FunctionWrapper>
    <FunctionItem name={`${func.name}(...)`} status={func.status} />
    <List>
      { func.parameters.map(param => <ParameterItem key={func.name} {...param} />) }
    </List>
  </FunctionWrapper>

const MetadataTree = ({metadata}) =>
  <TreeContainer>
    { metadata.map(snippet => <Snippet key={snippet.name} snippet={snippet} />) }
  </TreeContainer>

export default MetadataTree;
