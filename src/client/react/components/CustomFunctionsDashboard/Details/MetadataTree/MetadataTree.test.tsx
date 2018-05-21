import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MetadataTree from './index';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<MetadataTree metadata={{ snippets: [] }} />, div);
  ReactDOM.unmountComponentAtNode(div);
});
