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
  return res.json(Object.keys(chats_db));
});
router.get("/chats/:chat_id", (req, res) => {
  return res.json(chats_db[req.params.chat_id]);
});
router.post("/chats/:chat_id", (req, res) => {
  console.log("/api/post:\t", req.body);
  chats_db[req.params.chat_id].push(req.body);
  res.send("OK");
});
/************************* router Real (/api/*) **************************/

/************************** router end **************************/

app.use("/api", router);

const server = app.listen(app.get("PORT"), () => {
  console.log(app.get("PORT"), "포트 기동");
});

/* Socket */
const io = SocketIO(server, { transports: ["websocket"] });
/************************* socket test **************************/
const chatNsp = io.of("chat").on("connect", (socket) => {
  socket.on("ping", (data) => {
    console.log(data, "\t from client!");
    socket.emit("pong", data);
  });
});
/************************* socket test End **************************/
