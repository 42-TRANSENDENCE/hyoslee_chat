const cors = require("cors");
const express = require("express");
const SocketIO = require("socket.io");
const { user_db, chats_db } = require("./db");

const app = express();
app.set("PORT", process.env.PORT || 3095);
app.use(express.json());

const router = express.Router();

/************************* router test (/api/) **************************/
router.get("/", (req, res) => {
  res.send("Hello, User");
});

router.get("/id", (req, res) => {
  obj = { hi: "value" };
  res.json(obj);
});
router.post("/post", (req, res) => {
  console.log("/api/post:\t", req.body);
  req.body["wellReceived"] = "true";
  res.json(req.body);
});

router.get("/chats", (req, res) => {
  // return res.json(Object.keys(chats_db));
  return res.json(
    Object.keys(chats_db).map((v) => {
      return { chatId: v, is_private: chats_db[v]["private"] };
    })
  );
});
router.get("/chats/:chat_id", (req, res) => {
  return res.json(chats_db[req.params.chat_id]);
});
router.post("/chats/:chat_id", (req, res) => {
  console.log("/api/post:\t", req.body);
  chats_db[req.params.chat_id].data.push(req.body);
  const io = req.app.get("io");
  io.of("/chats").emit("message", req.body);
  // io.of("/chats").to(`/chats-${req.params.chat_id}`).emit("message", req.body);
  // io.sockets.in(`/chats-${req.params.chat_id}`).emit("message", req.body);
  console.log(`/chats-${req.params.chat_id} 소켓Room에게 ${req.body} 전송`);
  console.log(req.body);
  res.send("OK");
});
router.get("/chats/:chat_id/private", (req, res) => {
  console.log(chats_db[req.params.chat_id].private + "합니다");
  return res.send(chats_db[req.params.chat_id].private);
});
router.post("/chats/:chat_id/private", (req, res) => {
  // console.log(chats_db[req.params.chat_id].private + "합니다");
  if (chats_db[req.params.chat_id].secret === req.body.secret) {
    return res.json(true);
  }
  return res.json(false);
});
/************************* router Real (/api/*) **************************/

/************************** router end **************************/

app.use("/api", router);

const server = app.listen(app.get("PORT"), () => {
  console.log(app.get("PORT"), "포트 기동");
});

/* Socket */
const io = SocketIO(server, { transports: ["websocket"] });
app.set("io", io);
/************************* socket test **************************/
// const chatNsp = io.of("chat").on("connect", (socket) => {
//   socket.on("ping", (data) => {
//     console.log(data, "\t from client!");
//     socket.emit("pong", data);
//   });
// });
/************************* socket test End **************************/
const chats = io.of("chats").on("connect", (socket) => {
  Object.keys(chats_db).forEach((chat_id) => {
    console.log(`chats-${chat_id} 소켓Room에 join`);
    socket.join(`chats-${chat_id}`);
  });
  socket.on("ping", (data) => {
    console.log(data, "\t from client!");
    socket.emit("pong", data);
  });
});
