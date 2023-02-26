const cors = require("cors");
const express = require("express");
const session = require("express-session");
const SocketIO = require("socket.io");
const { user_db, chats_db, v2_room_db, v2_chat_db } = require("./db");

const app = express();
app.set("PORT", process.env.PORT || 3095);
app.use(express.json());
app.use(
  session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: true,
  })
);

const router = express.Router();

/************************* router test (/api/) **************************/
// router.get("/", (req, res) => {
//   res.send("Hello, User");
// });

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
router.post("chats", (req, res) => {
  chats_db[req.params.chat_id].push(req.body);
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
/************************* router v2 (/api/*) **************************/
router.get("/user", (req, res) => {
  console.log("세션: ", req.sessionID);
  return res.json({ sessionID: req.sessionID });
});

router.get("/room_list", (req, res) => {
  return res.json(v2_room_db);
});
// router.get("/room_list/room");
let room_id = 2;
router.post("/room_list/room", (req, res) => {
  const { title, max, password } = req.body;
  // for (const [key, value] of Object.entries(req.body)) {
  //   console.log(`${key}: ${value}`);
  // }
  new_data = {
    id: room_id++,
    title,
    max,
    owner: req.sessionID,
    password,
    createdAt: new Date(),
  };
  v2_room_db.data.push(new_data);
  // return res.json(v2_room_db.data);
  io.of("/v2_room").emit("newRoom", new_data);
  return res.send("OK!");
});
router.get("/room_list/room/:id", (req, res) => {
  // console.log("here!", req.params.id, req.query.password);
  const room = v2_room_db.data.find((v) => {
    // console.log(String(v.id), req.params.id);
    if (String(v.id) === req.params.id) {
      return v;
    }
  });
  if (!room) return res.send("존재하지 않는 방입니다.");
  if (room.password && room.password !== req.query.password) {
    return res.send("비밀번호가 틀렸습니다.");
  }
  return res.send("OK");
});
router.delete("/room_list/room/:id");
router.get("/room_list/room/:id/chat", (req, res) => {
  // console.log(v2_chat_db[req.params.id]);
  // console.log(req.params.id, req.query.password);
  if (req.query.password) {
    // console.log("비밀번호가 있습니다.");
    const room = v2_room_db.data.find((v) => {
      if (String(v.id) === req.params.id) {
        return v;
      }
    });
    // console.log("room:", room);
    // console.log("에러체킹 ", room.password);
    if (room.password && room.password !== req.query.password) {
      console.log("401 error!");
      return res.status(401).json({ message: "Incorrect password" });
    }
  }
  if (!v2_chat_db[req.params.id]) {
    v2_chat_db[req.params.id] = [];
  }
  res.json(v2_chat_db[req.params.id]);
});
router.post("/room_list/room/:id/chat", (req, res) => {
  // console.log("/api/post:\t", req.body);
  // console.log("여기로 왓습니다");
  if (!v2_chat_db[req.params.id]) {
    v2_chat_db[req.params.id] = [];
  }
  req.body.user = req.sessionID;
  v2_chat_db[req.params.id].push(req.body);
  console.log("req.body: ", req.body);

  console.log(v2_chat_db[req.params.id]);

  const io = req.app.get("io");
  io.of("/v2_chat").to(req.params.id).emit("message", req.body);
  // io.of("/v2_chat").emit("message", req.body);
  // io.of("/chats").to(`/chats-${req.params.chat_id}`).emit("message", req.body);
  // io.sockets.in(`/chats-${req.params.chat_id}`).emit("message", req.body);
  console.log(`${req.params.id} 소켓Room에게 ${req.body} 전송`);
  console.log(req.body);

  res.send("OK");
});
/************************* router v2 End (/api/*) **************************/
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
// const chats = io.of("chats").on("connect", (socket) => {
//   Object.keys(chats_db).forEach((chat_id) => {
//     console.log(`chats-${chat_id} 소켓Room에 join`);
//     socket.join(`chats-${chat_id}`);
//   });
//   socket.on("ping", (data) => {
//     console.log(data, "\t from client!");
//     socket.emit("pong", data);
//   });
// });

/************************* socket v2 **************************/
const room = io.of("/v2_room");
const chat = io.of("/v2_chat");

room.on("connection", (socket) => {
  // console.log("room 네임스페이스에 접속");
  socket.on("disconnect", () => {
    // console.log("room 네임스페이스 접속 해제");
  });
});
chat.on("connection", (socket) => {
  socket.on("join", (data) => {
    socket.join(data);
    console.log(data + "에 join합니다.");
    chat.to(data).emit("join", {
      chat: `님이 입장하셨습니다.`,
    });
  });
  socket.on("leave", (room) => {
    console.log(`Client left room ${room}`);
    socket.leave(room);
    const { referer } = socket.request.headers;
    const currentRoom = chat.adapter.rooms.get(room);
    const userCount = currentRoom?.size || 0;
    if (userCount === 0) {
      console.log(`Deleting room ${room}`);
      delete v2_chat_db[room];
      v2_room_db.data = v2_room_db.data.filter((v) => v.id !== Number(room));
      console.log("v2_room_db: ", v2_room_db);
      console.log("v2_chat_db: ", v2_chat_db);
      socket.emit("removeRoom", room);
    } else {
      chat.to(room).emit("exit", {
        chat: `님이 퇴장하셨습니다.`,
      });
    }
  });
  socket.on("disconnect", (data) => {
    // const { referer } = socket.request.headers;
    // const roomId = new URL(referer).pathname.split("/").at(-2);
    // console.log(roomId + "를 나갓습니다.");
    console.log("chat 네임스페이스 접속 해제");
    chat.to(data).emit("leave", {
      chat: `님이 퇴장하셨습니다.`,
    });
  });
});

/************************* socket v2 End **************************/
