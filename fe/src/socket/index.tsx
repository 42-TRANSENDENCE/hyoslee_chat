import { io } from "socket.io-client";

const socket = io("http://localhost:3095/chats", {
  transports: ["websocket"],
});

export default socket;
