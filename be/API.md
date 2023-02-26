[get] /api/room_list

```
{
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
}
```

[post] /api/room_list/room
db에 Room추가 후, 새Room 정보를 담아 "newRoom"이벤트를 통해 클라이언트에게 소켓 발송

[get] /api/room_list/room/:id?password=1234
비밀번호 방의 비밀번호 확인용 api

[get] /api/room_list/room/:id/chat?password=1234
해당 Room의 Chats를 반환. 비밀번호 방의 비밀번호도 같이 확인

[post] /api/room_list/room/:id/chat
Chat 전송. 해당 방의 소켓들에게 "message"이벤트 발송

-----상상 zone-----

[get] /api/dms/:id/chats

- 해당 id와 나눈 dms를 가져옴
- return: IDM[]

[post] /api/dms/:id/chats

- dm 보내기 저장
- body: { content: string(내용) }
- return: 'ok'
- dm 소켓 이벤트가 emit됨
