import styled from "@emotion/styled";

export const Header = styled.header`
  text-align: center;
  font-weight: 700;
  font-size: 6rem;
  letter-spacing: 0.25rem;
  margin-top: 1rem;
  margin-bottom: 2.5rem;
  color: white;

  @media (max-width: 420px) {
    font-size: 2rem;
  }
`;

export const Button = styled.button`
  width: 10rem;
  margin: 0 auto;
  text-align: center;
  display: block;
  color: white;
  background-color: #7c4dff;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  outline: none;
  font-size: 1.5rem;

  transition: all 80ms linear;
  height: 2rem;
  padding: 1rem 0 3rem;
  border: none;
  border: 1px solid black;
  border-radius: 0.25rem;
  &:hover {
    background-color: #865ef6;
    /* border: none; */
  }
  &:focus {
    box-shadow: 0 0 0 0.2rem rgba(242, 0, 255, 0.25);
  }
`;

export const InnerWindow = styled.div`
  margin: auto;
  position: absolute;
  padding: -1rem 0 2rem 0;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  width: 55%;
  height: 60%;
  background-color: #29b6f6;
  border-radius: 1rem;
`;

export const OuterWindow = styled.div`
  margin: auto;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  width: 65%;
  height: 60%;
  // padding: 1rem 0 2rem 0;

  & .browser-body {
    // padding: 1rem 0 2rem 0;
    background: #00e5ff;
    height: 100%;
  }
`;

export const BrowserHeader = styled.div`
  & .browser-header {
    display: flex;
    background: #b4b4b4;
    opacity: 0.9;
    padding: 1rem 0 2rem 0;
    padding: 10px;
    border-radius: 7px 7px 0px 0px;
  }
`;

export const DotThree = styled.div`
  .outer {
    background: #b4b4b4;
    opacity: 0.9;
    // width: 960px;
    // margin: 10px auto;
    padding: 10px;
    border-radius: 7px 7px 0px 0px;
  }

  .dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    background: #f9f9f9;
    border-radius: 50%;
    margin: 0 4px 0 0;

    &.red {
      background: #ff6057;
      border: 1px solid #e14640;
    }

    &.amber {
      background: #ffbd2e;
      border: 1px solid #dfa123;
    }

    &.green {
      background: #27c93f;
      border: 1px solid #1dad2b;
    }
  }
`;

export const Container = styled.div`
  // display: relative;
  // width: 100%;
  height: 100vh;
  background: #42a5f5;
`;
