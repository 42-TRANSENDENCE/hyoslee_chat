import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

import {
  BrowserHeader,
  Button,
  Container,
  DotThree,
  Header,
  InnerWindow,
  OuterWindow,
} from "./styles";

export default function Login() {
  return (
    <Container>
      <OuterWindow>
        <BrowserHeader>
          <DotThree>
            <div className="outer">
              <div className="dot red"></div>
              <div className="dot amber"></div>
              <div className="dot green"></div>
              <FontAwesomeIcon style={{ float: "right" }} icon={faUser} />
            </div>
          </DotThree>
        </BrowserHeader>
        <div className="browser-body" />
        <InnerWindow>
          <BrowserHeader>
            <DotThree>
              <div className="outer">
                <div className="dot red"></div>
                <div className="dot amber"></div>
                <div className="dot green"></div>
                <FontAwesomeIcon style={{ float: "right" }} icon={faUser} />
              </div>
            </DotThree>
          </BrowserHeader>
          <Header>42PONG</Header>
          <Button>LOGIN</Button>
        </InnerWindow>
      </OuterWindow>
    </Container>
  );
}
