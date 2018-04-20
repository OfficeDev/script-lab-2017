import * as React from 'react';
import MetadataTree from './components/CustomFunctionsDashboard/MetadataTree';

class App extends React.Component {
    render() {
        return (
            <div>
                <MetadataTree metadata={data}/>
            </div>
        );
    }
}


// Test DATA
const param1 = {name: 'x', status: 'good'}
const param2 = {name: 'y', status: 'warning'}
const param3 = {name: 'z', status: 'error', error: 'Some error message!'}

const func1 = {
  name: 'foo',
  status: 'good',
  parameters: [param1, param2]
}

const func2 = {
  name: 'bar',
  status: 'good',
  parameters: [param1]
}

const func3 = {
  name: 'foobar',
  status: 'error',
  parameters: [param2, param3]
}

const data = [
  {
    name: 'snippet1',
    status: 'good',
    functions: [func1, func2, func3]
  },
  {
    name: 'snippet2',
    status: 'warning',
    functions: [func1, func3, func1]
  }
]

export default App;