user_db = {
  data: [
    {
      id: "hyoslee",
    },
    {
      id: "dkim2",
    },
  ],
};
chats_db = {
  chat_2: {
    data: [
      {
        createdAt: "2022-12-12",
        SenderId: "hyoslee",
        content: "let's eat pizza! it's chat 2!",
      },
      {
        createdAt: "2022-12-13",
        SenderId: "minjkim2",
        content: "how about you?",
      },
    ],
    private: false,
  },
  chat_3: {
    data: [
      {
        createdAt: "1994-01-11",
        SenderId: "junyopar",
        content: "it's chat_3!",
      },
      {
        createdAt: "2022-12-13",
        SenderId: "minjkim2",
        content: "oh! It's past!",
      },
    ],
    private: false,
  },
  secret_room: {
    data: [
      {
        createdAt: "XXXX-XX-X1",
        SenderId: "someone",
        content: "!!!!!!!!!!!!!!!it's secret room!!!!!!!",
      },
      {
        createdAt: "XXXX-XX-X2",
        SenderId: "someone2",
        content: "shit!",
      },
    ],
    private: true,
    secret: "1234",
  },
};
v2_room_db = {
  data: [
    {
      title: "room1",
      id: 0,
      max: 5,
      owner: "hyoslee",
      password: "",
      createdAt: "1992.02.19",
    },
    {
      title: "room2",
      id: 1,
      max: 10,
      owner: "hyoslee",
      password: "1234",
      createdAt: "1992.02.20",
    },
  ],
};
v2_chat_db = {
  0: [
    {
      user: "hyoslee",
      chat: "hello! it's chat 1!",

      createdAt: "2022-12-12",
    },
    {
      user: "junyopar",
      chat: "oh! it's chat 1!",

      createdAt: "2022-12-12",
    },
  ],
};
module.exports = {
  user_db,
  chats_db,
  v2_room_db,
  v2_chat_db,
};
