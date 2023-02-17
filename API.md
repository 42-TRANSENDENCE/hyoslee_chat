### GET /api/chats

- 전체 채팅목록 반환
- return: [chat_2, chat_3]

### GET /api/chats/:chat_id

- 해당 채팅기록들 반환
- return:
  [
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
  ]

### POST /api/chats/:chat_id

- 채팅 입력(db에 입력 후 소켓으로 해당 채팅 클라이언트로 전달)
- chat 소켓 이벤트가 emit됨
- return: "OK"
