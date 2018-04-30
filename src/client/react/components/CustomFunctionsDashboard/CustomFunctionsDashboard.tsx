import * as React from 'react';
import styled from 'styled-components';

import {
  Pivot,
  PivotItem,
  PivotLinkFormat,
} from 'office-ui-fabric-react/lib/Pivot';
import { mergeStyles } from '@uifabric/merge-styles';

import Summary from './Summary';
import Details from './Details';
import Console from './Console';

// styles
const Container = styled.div`
  width: 100%;
  height: 100vh;

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
    '&& .ms-Pivot .ms-Pivot-link.is-selected': {
      background: '#103822 !important',
      color: 'white',
      fontWeight: '400',
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
  logs: any[];
}

interface ICustomFunctionsDashboardProps {
  placeholder?: any;
  metadata: object[];
}

class CustomFunctionsDashboard extends React.Component<
  ICustomFunctionsDashboardProps,
  ICustomFunctionsDashboardState
> {
  constructor(props) {
    super(props);
    this.state = { logs: [] };

    setInterval(() => {
      const l = this.state.logs;
      l.push(new Date().toISOString());
      this.setState({ logs: l });
    }, 100);
  }

  render() {
    const { metadata } = this.props;
    console.log(PivotClassName);
    return (
      <Container className={PivotClassName}>
        <Pivot linkFormat={PivotLinkFormat.tabs}>
          <PivotItem linkText="Summary">
            <Summary metadata={metadata} />
          </PivotItem>
          <PivotItem linkText="Details">
            <Details metadata={metadata} />
          </PivotItem>
          <PivotItem linkText="Console">
            <Console />
          </PivotItem>
        </Pivot>
      </Container>
    );
  }
}

// // Test DATA
// const param1 = { name: 'x', status: 'good' };
// const param2 = { name: 'y', status: 'warning' };
// const param3 = { name: 'z', status: 'error', error: 'Some error message!' };

// const func1 = {
//   name: 'foo',
//   status: 'good',
//   parameters: [param1, param2],
// };

// const func2 = {
//   name: 'bar',
//   status: 'good',
//   parameters: [param1],
// };

// const func3 = {
//   name: 'foobar',
//   status: 'error',
//   parameters: [param2, param3],
// };

// const data = [
//   {
//     name: 'snippet1',
//     status: 'good',
//     functions: [func1, func2, func3],
//   },
//   {
//     name: 'snippet2',
//     status: 'warning',
//     functions: [func1, func3, func1],
//   },
// ];

export default CustomFunctionsDashboard;
