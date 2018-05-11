import * as React from 'react';
import styled from 'styled-components';

import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { mergeStyles } from '@uifabric/merge-styles';

import Summary from './Summary';
import Details from './Details';
import Console from './Console';
import RefreshBar from './RefreshBar';
import { Authenticator } from '@microsoft/office-js-helpers';
import { isNullOrWhitespace, environment } from '../../../app/helpers';

const NavigateBackIconName = 'NavigateBack';

// styles
const Container = styled.div`
  width: 100%;
  height: 100vh;

  box-sizing: border-box;
`;

// interfaces
interface ICustomFunctionsDashboardState {
  consoleCount: number | undefined;
}

interface ICustomFunctionsDashboardProps {
  placeholder?: any;
  metadata: object[];
}

class CustomFunctionsDashboard extends React.Component<
  ICustomFunctionsDashboardProps,
  ICustomFunctionsDashboardState
> {
  constructor(props: ICustomFunctionsDashboardProps) {
    super(props);
    this.state = { consoleCount: undefined };
  }

  render() {
    const { metadata } = this.props;

    // Better design would be to put it on root page, and pass it down to this component.  But this will do for now
    const pageParams: { returnUrl?: string } =
      Authenticator.extractParams(window.location.href.split('?')[1]) || {};
    if (isNullOrWhitespace(pageParams.returnUrl)) {
      pageParams.returnUrl = null;
    } else {
      pageParams.returnUrl = decodeURIComponent(pageParams.returnUrl);
    }

    // By the same token, set the playground return url to something,
    // so that if snippets switch and navigate to runner, don't later end up in editor
    // by pressing the editor's back button!
    if (pageParams.returnUrl) {
      window.sessionStorage.playground_returnUrl = pageParams.returnUrl;
    } else {
      if (!window.sessionStorage.playground_returnUrl) {
        window.sessionStorage.playground_returnUrl =
          environment.current.config.editorUrl + '?gallery=true';
      }
    }

    const PivotClassName = mergeStyles({
      selectors: {
        '& .ms-Pivot': {
          backgroundColor: '#217346',
          paddingLeft: '8px',
        },
        '& .ms-Pivot .ms-Pivot-link': {
          background: '#217346 !important',
          color: 'white !important',
          minWidth: '20px',
        },
        '& .ms-Pivot .ms-Pivot-link:first-child .ms-Pivot-link-content': pageParams.returnUrl
          ? {
              position: 'relative',
              top: '1px',
            }
          : {},
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

    let pivotItems: React.ReactElement<PivotItem>[] = [];
    if (pageParams.returnUrl) {
      pivotItems.push(
        <PivotItem key="back" itemIcon={NavigateBackIconName}>
          {<div />}
        </PivotItem>
      );
    }

    let tabParts: {
      name: string;
      component: JSX.Element;
      counterStateName?: keyof ICustomFunctionsDashboardState;
    }[] = [
      { name: 'Summary', component: <Summary metadata={metadata} /> },
      { name: 'Details', component: <Details metadata={metadata} /> },
      {
        name: 'Console',
        component: (
          <Console countSetter={count => this.setState({ consoleCount: count })} />
        ),
        counterStateName: 'consoleCount',
      },
    ];
    pivotItems = [
      ...pivotItems,
      ...tabParts.map(({ name, component, counterStateName }) => {
        let pivotItem = (
          <PivotItem
            linkText={name}
            key={name}
            itemCount={
              counterStateName ? this.state[counterStateName] || undefined : undefined
            }
          >
            {component}
          </PivotItem>
        );
        return pivotItem;
      }),
    ];

    return (
      <Container className={PivotClassName}>
        <RefreshBar />
        <Pivot
          initialSelectedIndex={pageParams.returnUrl ? 1 : 0}
          onLinkClick={onLinkClick}
        >
          {pivotItems}
        </Pivot>
      </Container>
    );

    function onLinkClick(item: PivotItem): void {
      if (item.props.itemIcon === NavigateBackIconName) {
        window.location.href = pageParams.returnUrl;
      }
    }
  }
}

export default CustomFunctionsDashboard;
