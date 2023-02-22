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

module.exports = {
  user_db,
  chats_db,
};
