import React from "react";
import { Navigate, Route, Routes } from "react-router";
import Chat from "./chat";
import Chats from "./pages/Chats";
import Login from "./pages/login";
import V2rooms from "./pages/v2_rooms";
import V2chats from "./v2_chats";
import CreateRoom from "./v2_create_room";
import V2dms from "./v2_dms";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/v2_rooms" />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<h1>Not Found</h1>} />
      <Route path="/chats/*" element={<Chats />} />
      <Route path="/v2_rooms/create_room" element={<CreateRoom />} />
      <Route path="/v2_rooms/:roomId/chat" element={<V2chats />} />
      {/* <Route path="/v2_rooms/:roomId" element={<V2rooms />} /> */}
      <Route path="/v2_rooms/*" element={<V2rooms />} />
      <Route path="/v2_dms/:dmId" element={<V2dms />} />
    </Routes>
  );
}

export default App;
