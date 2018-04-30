import * as React from 'react';
import * as ReactDOM from 'react-dom';
import CustomFunctionsDashboard from './index';

const metadata = [];

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<CustomFunctionsDashboard metadata={metadata} />, div);
  ReactDOM.unmountComponentAtNode(div);
});
