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
import RefreshBar from './RefreshBar';

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

    const tabs = [
      { name: 'Summary', component: <Summary metadata={metadata} /> },
      { name: 'Details', component: <Details metadata={metadata} /> },
      { name: 'Console', component: <Console /> },
    ];

    return (
      <Container className={PivotClassName}>
        <RefreshBar />
        <Pivot linkFormat={PivotLinkFormat.tabs}>
          {tabs.map(({ name, component }) => (
            <PivotItem linkText={name}>{component}</PivotItem>
          ))}
        </Pivot>
      </Container>
    );
  }
}

export default CustomFunctionsDashboard;
