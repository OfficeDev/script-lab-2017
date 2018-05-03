import * as React from 'react';
import CustomFunctionsDashboard from './components/CustomFunctionsDashboard/';

class App extends React.Component<{ metadata: object[] }, {}> {
  render() {
    return (
      <div>
        <CustomFunctionsDashboard metadata={this.props.metadata} />
      </div>
    );
  }
}

export default App;
