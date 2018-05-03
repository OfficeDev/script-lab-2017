import styled from 'styled-components';

export default styled.h1`
  margin: 0;
  padding: 20px 0;

  font-size: 3rem;
  font-weight: 500;

  transition: 500ms ease-out;

  @media screen and (min-width: 600px) {
    font-size: 3.5rem;
  }

  @media screen and (min-width: 900px) {
    font-size: 4rem;
  }
`;
