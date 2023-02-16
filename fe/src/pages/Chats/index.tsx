import { io, Socket } from "socket.io-client";
import { Body, Container, Tab, TabChannel } from "./styles";
import { useQuery } from "react-query";
import { useParams } from "react-router";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import Chat from "../../chat";

async function fetchChats() {
  return fetch(`/api/chats`).then((res) => res.json());
}

const Chats = () => {
  const { data, isLoading } = useQuery<any>("chats", fetchChats);
  if (isLoading) return <div />;

  return (
    <Container>
      <Tab>
        {data?.map((channel: string) => {
          return (
            <NavLink key={channel.at(-1)} to={`/chats/${channel}`}>
              <TabChannel>{channel}</TabChannel>
            </NavLink>
          );
        })}
      </Tab>
      <Body>
        <Routes>
          <Route path=":chatId" element={<Chat />} />
        </Routes>
      </Body>
    </Container>
  );
};

export default Chats;
