import * as React from 'react';
import * as ReactDOM from 'react-dom';
import CustomFunctionsDashboard from './index';

const metadata: ICFVisualMetadata = { snippets: [] };

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <CustomFunctionsDashboard
      metadata={metadata}
      engineStatus={{ enabled: true, nativeRuntime: true }}
    />,
    div
  );
  ReactDOM.unmountComponentAtNode(div);
});
