import * as React from 'react';
import styled from 'styled-components';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';

import MetadataTree from './MetadataTree';
import Title from './Title';
import Logs from './Logs';

// styles
const Container = styled.div`
  width: 100%;
  height: 100vh;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  padding: 5%;
  box-sizing: border-box;
`;

const ButtonBar = styled.div`
  width: 60%;
  margin: 20pt auto;
  display: flex;
  justify-content: space-around;
`;

const Content = styled.div`
  position: relative;
  /* background: papayawhip; */
  height: 100%;
  flex-shrink: 2;
  padding-top: 20pt;
  padding-bottom: 20pt;
`;

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
    const { metadata, logs } = this.state;
    const content = metadata.isVisible ? (
      <MetadataTree metadata={metadata.data} />
    ) : (
      <Logs logs={logs} />
    );
    // console.log(content);
    return (
      <Container>
        <Title>Custom Functions</Title>
        <ButtonBar>
          <DefaultButton
            data-automation-id="see-metadata"
            disabled={false}
            checked={false}
            text={metadata.isVisible ? 'Hide' : 'View'}
            onClick={this.toggleMetadata}
          />
          <DefaultButton
            data-automation-id="see-metadata"
            disabled={false}
            checked={false}
            text="Register"
            primary={true}
            onClick={this.toggleMetadata}
          />
        </ButtonBar>
        <Content>{content}</Content>
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
