import { io, Socket } from "socket.io-client";
import { Body, Container, Tab, TabChannel } from "./styles";
import { useQuery } from "react-query";
import { useParams } from "react-router";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import Chat from "../../chat";
import ChatPrivate from "../../chatPrivate";

async function fetchChats() {
  return fetch(`/api/chats`).then((res) => res.json());
}

const Chats = () => {
  const { data, isLoading } = useQuery<
    [{ chatId: string; is_private: boolean }]
  >("chats", fetchChats);
  if (isLoading) return <div />;

  // console.log("data=", data);
  // fetch(`/api/chats/${chatId}/private`)
  //   .then((res) => res.text())
  //   .then((data) => {
  //     console.log(data);
  //     return <ChatPrivate />;
  //   });

  return (
    <Container>
      <Tab>
        {data?.map(({ chatId, is_private }) => {
          console.log(is_private + "입니다");
          if (is_private) {
            localStorage.setItem(chatId, "false");
            return (
              <NavLink key={chatId.at(-1)} to={`/chats/${chatId}/private`}>
                <TabChannel>{chatId}</TabChannel>
              </NavLink>
            );
          }
          localStorage.setItem(chatId, "true");
          return (
            <NavLink key={chatId.at(-1)} to={`/chats/${chatId}`}>
              <TabChannel>{chatId}</TabChannel>
            </NavLink>
          );
        })}
      </Tab>
      <Body>
        <Routes>
          <Route path=":chatId" element={<Chat />} />
          <Route path=":chatId/private" element={<ChatPrivate />} />
        </Routes>
      </Body>
    </Container>
  );
};

export default Chats;
