import * as React from 'react';
import * as ReactDOM from 'react-dom';
import CustomFunctionsDashboard from './index';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<CustomFunctionsDashboard />, div);
  ReactDOM.unmountComponentAtNode(div);
});
