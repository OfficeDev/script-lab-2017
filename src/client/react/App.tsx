import * as React from 'react';
import CustomFunctionsDashboard from './components/CustomFunctionsDashboard';
import { CustomFunctionEngineStatus } from '../app/helpers/utilities';

class App extends React.Component<
  { metadata: ICFVisualMetadata; engineStatus: CustomFunctionEngineStatus },
  {}
> {
  render() {
    return (
      <div>
        <CustomFunctionsDashboard
          metadata={this.props.metadata}
          engineStatus={this.props.engineStatus}
        />
      </div>
    );
  }
}

export default App;
