import React from "react";
import { Navigate, Route, Routes } from "react-router";
import Chat from "./chat";
import Chats from "./pages/Chats";
import Login from "./pages/login";
import V2rooms from "./pages/v2_rooms";
import V2chats from "./v2_chats";
import CreateRoom from "./v2_create_room";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Navigate replace to="/" />} />
      <Route path="*" element={<h1>Not Found</h1>} />
      <Route path="/chats/*" element={<Chats />} />
      <Route path="/v2_rooms/create_room" element={<CreateRoom />} />
      <Route path="/v2_rooms/:roomId/chat" element={<V2chats />} />
      {/* <Route path="/v2_rooms/:roomId" element={<V2rooms />} /> */}
      <Route path="/v2_rooms/*" element={<V2rooms />} />
    </Routes>
  );
}

export default App;
