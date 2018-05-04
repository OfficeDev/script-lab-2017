import * as React from 'react';
const gray = '#333333';

export default () => (
  <div id="progress" className="ms-progress-component">
    <div id="ribbon" className="ribbon" />
    <main className="ms-progress-component__main">
      <img
        className="ms-progress-component__logo"
        src="../assets/images/icon-large.svg"
      />
      <h2 id="title" className="ms-progress-component__title ms-font-xxl">
        Script Lab
      </h2>
      <h1
        style={{ color: '#D83B01', marginTop: '24px', lineHeight: '56px' }}
        className="ms-fontSize-su ms-fontWeight-light"
      >
        Custom Functions Preview
      </h1>
      <hr
        style={{
          width: '118px',
          marginTop: '12px',
          marginBottom: '27px',
          color: gray,
        }}
      />
      <p
        style={{
          marginLeft: '20%',
          marginRight: '20%',
          textAlign: 'center',
          lineHeight: '19px',
          color: gray,
        }}
        className="ms-fontSize-m ms-fontWeight-regular"
      >
        You system configuration does not support Custom Functions, yet. For
        more info, see{' '}
        <a href="https://aka.ms/customfunctions">these instructions</a>.
      </p>
    </main>
  </div>
);
