const cors = require("cors");
const express = require("express");
const session = require("express-session");
const SocketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const { user_db, chats_db, v2_room_db, v2_chat_db } = require("./db");
const bcrypt = require("bcrypt");

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
app.use(cors());

const router = express.Router();

//TEST
router.get("/test/pwd", (req, res) => {
  const plainTextPassword = "password123";
  const saltRounds = 10;
  let a;
  //hash
  bcrypt.hash(plainTextPassword, saltRounds, (err, hash) => {
    if (err) {
      console.error(err);
    } else {
      console.log({ hash });
    }
  });

  //compare
  const hashedPassword =
    "$2b$10$I515fsh4mR8AYYMYaBGBnuY998Zm0oKpfn1Y7idlkoMxkMQGhRXhi";

  bcrypt.compare(plainTextPassword, hashedPassword, (err, result) => {
    if (err) {
      console.error(err);
    } else if (result) {
      console.log({ hashedPassword, result });
      console.log("Passwords match!");
    } else {
      console.log("Passwords do not match.");
    }
  });
  res.json({ res: "res" });
});

/** JWT Authentication Server */
const secretKey = "your_secret_key";
router.post("/login", (req, res) => {
  const token = jwt.sign({ username: req.body.username }, secretKey);
  res.json({ token });
});
router.get("/create_fakeUsers", (req, res) => {
  for (let i = 0; i < 100; i++) {
    let token = jwt.sign({ username: `rock${i}${i}` }, secretKey);
    user_db.data.push({ username: `rock${i}${i}`, token: token });
  }
  // res.json({ token });
  res.json(user_db);
});
router.get("/fakeUser/id/:id", (req, res) => {
  const id = req.params.id;
  res.json(user_db.data[Number(id)]);
});
router.get("/user", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    // console.log(decoded);
    res.json({ username: decoded.username });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});
/**  JWT Authentication Server End */

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
// router.get("/user", (req, res) => {
//   console.log("세션: ", req.sessionID);
//   return res.json({ sessionID: req.sessionID });
// });

router.get("/room_list", (req, res) => {
  return res.json(v2_room_db.data);
});
// router.get("/room_list/room");
let room_id = 2;
router.post("/room_list/room", (req, res) => {
  const { title, max, password, owner } = req.body;
  new_data = {
    id: room_id++,
    title,
    owner,
    password,
    status: password ? 1 : 0,
    muteList: [],
    kickList: [],
    memberList: [],
    adminList: [],
    createdAt: new Date(),
  };
  v2_room_db.data.push(new_data);
  io.of("/v2_chat").emit("newRoom", new_data);
  return res.send("OK!");
});

router.get("/room_list/room/:id", (req, res) => {
  const room = v2_room_db.data.find((v) => {
    if (String(v.id) === req.params.id) {
      return v;
    }
  });
  if (!room) return res.status(401).send("존재하지 않는 방입니다.");
  console.log("/room_list/room/:id  200 return");
  return res.status(200).json({
    memberList: room.memberList,
    kickList: room.kickList,
    muteList: room.muteList,
    adminList: room.adminList,
    status: room.status,
    owner: room.owner,
  });
});
router.post("/room_list/room/:id", (req, res) => {
  const room = v2_room_db.data.find((v) => {
    if (String(v.id) === req.params.id) {
      return v;
    }
    return false;
  });
  // console.log("here");
  if (room === undefined)
    return res.status(401).send("존재하지 않는 방입니다.");

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    // console.log("here2");
    return res.status(401).json({ message: "Authorization header missing" });
  }
  const decoded = jwt.verify(token, secretKey);
  const username = decoded.username;

  if (req.body.password === undefined) {
    // console.log("here3", room);
    if (room.status !== 0) return res.status(401).send("공개방이 아닙니다.");
    room.memberList.push(username);
    // console.log("here4");
    return res.status(200).send("OK");
  }
  // console.log("here5");
  if (room.password !== req.body.password)
    return res.status(401).send("비밀번호가 틀렸습니다.");
  // console.log("here6");
  room.memberList.push(username);
  return res.status(200).send("OK");
});
router.delete("/room_list/room/:id");
router.get("/room_list/room/:id/chat", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("here1");
  if (!token) {
    return res.status(401).json({ message: "Authorization header missing" });
  }
  console.log("here2");

  const decoded = jwt.verify(token, secretKey);
  const username = decoded.username;
  const room = v2_room_db.data.find((v) => {
    if (String(v.id) === req.params.id) {
      return v;
    }
  });
  const kickinfo = room.kickList.find((v) => v[0] == username);
  if (kickinfo) {
    if (new Date() < kickinfo[1]) {
      return res.status(401).send("강퇴당한 사용자입니다.");
    } else {
      room.kickList.splice(room.kickList.indexOf(kickinfo), 1);
    }
  }
  if (room.memberList.includes(username)) {
    if (!v2_chat_db[req.params.id]) {
      v2_chat_db[req.params.id] = [];
    }
    console.log("here3");
    return res.status(200).json(v2_chat_db[req.params.id]);
  } else {
    console.log("here4");
    return res.status(401).send("채팅방에 참여하지 않았습니다.");
  }
});
router.post("/room_list/room/:id/chat", (req, res) => {
  const room = v2_room_db.data.find((v) => {
    if (String(v.id) === req.params.id) {
      return v;
    }
  });
  const token = req.headers.authorization?.split(" ")[1];
  console.log("here1");
  if (!token) {
    return res.status(401).json({ message: "Authorization header missing" });
  }
  console.log("here2");

  const decoded = jwt.verify(token, secretKey);
  const username = decoded.username;
  console.log("here0000000");
  const muteinfo = room.muteList.find((v) => v[0] == username);
  if (muteinfo) {
    if (new Date() < muteinfo[1]) {
      console.log("here111111");
      return res.status(401).send("mute당한 사용자입니다.");
    } else {
      console.log("here22222");
      room.muteList.splice(room.muteList.indexOf(muteinfo), 1);
    }
  }

  if (!v2_chat_db[req.params.id]) {
    v2_chat_db[req.params.id] = [];
  }

  // const token = req.headers.authorization?.split(" ")[1];
  // if (!token) {
  //   return res.status(401).json({ message: "Authorization header missing" });
  // }

  // const decoded = jwt.verify(token, secretKey);
  // req.body.user = decoded.username;

  v2_chat_db[req.params.id].push(req.body);
  console.log("req.body: ", req.body);

  console.log(v2_chat_db[req.params.id]);

  const io = req.app.get("io");
  io.of("/v2_chat").to(req.params.id).emit("message", req.body);

  console.log(`${req.params.id} 소켓Room에게 ${req.body} 전송`);
  console.log(req.body);

  res.send("OK");
});
router.post("/room/:roomid/kick/:userid", (req, res) => {
  let roomsArr = v2_room_db.data;
  let room;
  for (let i = 0; i < roomsArr.length; i++) {
    if (roomsArr[i].id == req.params.roomid) {
      room = roomsArr[i];
      break;
    }
  }
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization header missing" });
  }
  const decoded = jwt.verify(token, secretKey);
  const myname = decoded.username;

  let admin = room.adminList.filter((admin) => {
    return admin.user_id == myname;
  });
  const ten = new Date().getTime() + 1000 * 10;
  if (admin) {
    let newMember = room.memberList.filter((user) => {
      return user.user_id != req.params.userid;
    });
    room.memberList = newMember;
    room.kickList.push([req.params.userid, ten]);
  }

  let host = room.owner;
  if (host == myname) {
    let newMember = room.memberList.filter((user) => {
      return user.user_id != req.params.userid;
    });
    room.memberList = newMember;
    room.kickList.push([req.params.userid, ten]);
  }
  io.of("/v2_chat").to(req.params.roomid).emit("kick", req.params.userid);
});
router.post("/room/:roomid/ban/:userid", (req, res) => {
  let roomsArr = v2_room_db.data;
  let room;
  for (let i = 0; i < roomsArr.length; i++) {
    if (roomsArr[i].id == req.params.roomid) {
      room = roomsArr[i];
      break;
    }
  }
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization header missing" });
  }
  const decoded = jwt.verify(token, secretKey);
  const myname = decoded.username;

  let admin = room.adminList.filter((admin) => {
    return admin.user_id == myname;
  });
  const infiniteDate = new Date();
  infiniteDate.setFullYear(9999);
  infiniteDate.setMonth(11);
  infiniteDate.setDate(31);
  if (admin) {
    let newMember = room.memberList.filter((user) => {
      return user.user_id != req.params.userid;
    });
    room.memberList = newMember;
    room.kickList.push([req.params.userid, infiniteDate]);
  }

  let host = room.owner;
  if (host == myname) {
    let newMember = room.memberList.filter((user) => {
      return user.user_id != req.params.userid;
    });
    room.memberList = newMember;
    room.kickList.push([req.params.userid, infiniteDate]);
  }
  io.of("/v2_chat").to(req.params.roomid).emit("kick", req.params.userid);
});

router.post("/room/:roomid/admin/:userid", (req, res) => {
  let roomsArr = v2_room_db.data;
  let room;
  for (let i = 0; i < roomsArr.length; i++) {
    if (roomsArr[i].id == req.params.roomid) {
      room = roomsArr[i];
      break;
    }
  }
  room.adminList.push(req.params.userid);
  io.of("/v2_chat").to(req.params.roomid).emit("role", req.params.userid);
});
router.post("/room/:roomid/mute/:userid", (req, res) => {
  let roomsArr = v2_room_db.data;
  let room;
  for (let i = 0; i < roomsArr.length; i++) {
    if (roomsArr[i].id == req.params.roomid) {
      room = roomsArr[i];
      break;
    }
  }

  const ten = new Date().getTime() + 1000 * 10;
  room.muteList.push([req.params.userid, ten]);
  console.log("mute");
  // io.of("/v2_chat").to(req.params.roomid).emit("mute", req.params.userid);
});

router.get("/dms", (req, res) => {
  return res.json(v2_dms_db.data);
});
router.get("/dms/:id", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const decoded = jwt.verify(token, secretKey);
  const myname = decoded.username;
  const SenderID = myname;
  const ReceiverID = req.params.id;
  const dms = v2_dms_db.data.filter((v) => {
    return (
      (v.SenderID === SenderID && v.ReceiverID === ReceiverID) ||
      (v.SenderID === ReceiverID && v.ReceiverID === SenderID)
    );
  });
  return res.json(dms);
});
router.post("/dms/:id", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const decoded = jwt.verify(token, secretKey);
  const myname = decoded.username;
  const SenderID = myname;
  const ReceiverID = req.params.id;
  const content = req.body.content;
  const dm = {
    SenderID,
    ReceiverID,
    content,
    createdAt: req.body.createdAt,
  };
  v2_dms_db.data.push(dm);
  const io = req.app.get("io");
  // io.to(socketMap[ReceiverID]).emit("DM", dm);
  io.emit("dm", dm);
  console.log(socketMap, ReceiverID, socketMap[ReceiverID], JSON.stringify(dm));
  return res.send("OK!");
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
/************************* socket v2 **************************/
const chat = io.of("/v2_chat");

const socketMap = {};

chat.on("connection", (socket) => {
  console.log("chat 네임스페이스 접속 on");
  socket.on("login", (token) => {
    const decoded = jwt.verify(token, secretKey);
    console.log(decoded.username);
    socketMap[decoded.username] = socket.id;
  });

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
      // console.log("v2_room_db: ", v2_room_db);
      // console.log("v2_chat_db: ", v2_chat_db);
      chat.emit("removeRoom", room);
    } else {
      chat.to(room).emit("exit", {
        chat: `님이 퇴장하셨습니다.`,
      });
    }
  });
  socket.on("disconnect", (data) => {
    console.log("chat 네임스페이스 접속 해제");
    chat.to(data).emit("leave", {
      chat: `님이 퇴장하셨습니다.`,
    });
  });
});

/************************* socket v2 End **************************/
