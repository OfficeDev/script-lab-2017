import * as React from 'react';
import styled from 'styled-components';

// import MetadataTree from './MetadataTree';
// import Title from './Title';
import Summary from './Summary';

import { Label } from 'office-ui-fabric-react/lib/Label';
import {
  Pivot,
  PivotItem,
  PivotLinkFormat,
} from 'office-ui-fabric-react/lib/Pivot';
import { mergeStyles } from '@uifabric/merge-styles';
import Details from './Details';

// styles
const Container = styled.div`
  width: 100%;
  height: 100vh;

  /* overflow: hidden; */

  box-sizing: border-box;
`;

const PivotClassName = mergeStyles({
  selectors: {
    '& .ms-Pivot': {
      backgroundColor: '#217346',
    },
    '& .ms-Pivot .ms-Pivot-link': {
      background: '#217346 !important',
      color: 'white !important',
    },
    '& .ms-Pivot .ms-Pivot-link.is-selected': {
      background: '#103822 !important',
      color: 'white',
    },
    '& .ms-Pivot .ms-Pivot-link.is-selected:before': {
      borderBottom: '0px solid white',
    },
    '& .ms-Pivot .ms-Pivot-link:not(.is-selected):hover': {
      color: 'white !important',
      backgroundColor: 'rgba(0,0,0,0.3) !important',
    },
    '& .ms-Pivot .ms-Pivot-link .ms-Pivot-link-content': {
      flexGrow: 1,
    },
  },
});

// interfaces
interface ICustomFunctionsDashboardState {
  metadata: {
    data: object[];
    isVisible: boolean;
  };
  logs: any[];
}

interface ICustomFunctionsDashboardProps {
  placeholder?: any;
}

class CustomFunctionsDashboard extends React.Component<
  ICustomFunctionsDashboardProps,
  ICustomFunctionsDashboardState
> {
  constructor(props) {
    super(props);
    this.state = { metadata: { data, isVisible: false }, logs: [] };

    setInterval(() => {
      const l = this.state.logs;
      l.push(new Date().toISOString());
      this.setState({ logs: l });
    }, 100);
  }

  toggleMetadata = () => {
    this.setState({
      metadata: {
        isVisible: !this.state.metadata.isVisible,
        data: this.state.metadata.data,
      },
    });
  };

  render() {
    console.log(PivotClassName);
    return (
      <Container className={PivotClassName}>
        <Pivot linkFormat={PivotLinkFormat.tabs}>
          <PivotItem linkText="Summary">
            <div style={{ overflow: 'auto' }}>
              <Summary metadata={this.state.metadata} />
            </div>
          </PivotItem>
          <PivotItem linkText="Details">
            <Details metadata={this.state.metadata.data} />
          </PivotItem>
          <PivotItem linkText="Console">
            <Label>Pivot #3</Label>
          </PivotItem>
        </Pivot>
      </Container>
    );
  }
}

// Test DATA
const param1 = { name: 'x', status: 'good' };
const param2 = { name: 'y', status: 'warning' };
const param3 = { name: 'z', status: 'error', error: 'Some error message!' };

const func1 = {
  name: 'foo',
  status: 'good',
  parameters: [param1, param2],
};

const func2 = {
  name: 'bar',
  status: 'good',
  parameters: [param1],
};

const func3 = {
  name: 'foobar',
  status: 'error',
  parameters: [param2, param3],
};

const data = [
  {
    name: 'snippet1',
    status: 'good',
    functions: [func1, func2, func3],
  },
  {
    name: 'snippet2',
    status: 'warning',
    functions: [func1, func3, func1],
  },
];

export default CustomFunctionsDashboard;
