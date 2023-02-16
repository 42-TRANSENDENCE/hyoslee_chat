import { io, Socket } from "socket.io-client";

const tests = () => {
  /************************* api test **************************/
  //   fetch("/api")
  //     .then((res) => res.text())
  //     .then((data) => {
  //       console.log("/api :\t", data);
  //     });

  //   fetch("/api/id")
  //     .then((res) => res.json())
  //     .then((data) => {
  //       console.log("/api/id :\t", data);
  //     });

  //   fetch("/api/post", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       title: "Test",
  //       body: "I am testing!",
  //       userId: 1,
  //     }),
  //   })
  //     .then((res) => res.json())
  //     .then((data) => {
  //       console.log("/api/post :\t", data);
  //     });

  //   let chat_id = "chat_2";

  //   fetch(`/api/chats/${chat_id}`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       createdAt: "9999-12-13",
  //       SenderId: "hyoslee",
  //       content: "it's added as POST!",
  //     }),
  //   })
  //     .then((res) => res.text())
  //     .then((data) => {
  //       console.log(`/api/chats/${chat_id} :\t`, data);
  //     });

  //   fetch(`/api/chats/${chat_id}`)
  //     .then((res) => res.json())
  //     .then((data) => console.log(data));
  /************************* api test End **************************/

  /************************* socket test **************************/
  //   const socket = io("http://localhost:3095/chat", {
  //     transports: ["websocket"],
  //   });

  //   socket.on("pong", (data) => {
  //     console.log(data);
  //   });
  //   socket.emit("ping", "pingpingping!");
  /************************* socket test End **************************/

  return <>hi</>;
};

export default tests;
