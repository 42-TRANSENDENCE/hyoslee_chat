import React from "react";
import { Navigate, Route, Routes } from "react-router";
import Chat from "./chat";
import Chats from "./pages/Chats";
import Login from "./pages/login";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Navigate replace to="/" />} />
      <Route path="*" element={<h1>Not Found</h1>} />
      <Route path="/chats/*" element={<Chats />} />
    </Routes>
  );
}

export default App;
