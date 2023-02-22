import { useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { ChatElement } from "./styles";
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
// import socket from "../socket";

// async function fetchChat(chatId: string) {
//   return fetch(`/api/chats/${chatId}`).then((res) => res.json());
// }

async function postChat(chatId: string, data: any): Promise<string> {
  let res = await fetch(`/api/chats/${chatId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      createdAt: new Date(),
      SenderId: "hyoslee",
      content: data,
    }),
  }).then((res) => res.text());
  return res;
}

const socket = io("http://localhost:3095/chats", {
  transports: ["websocket"],
});

const Chat = () => {
  const params = useParams<{ chatId?: string }>();
  const { chatId } = params;
  const [chat, setChat] = useState("");

  const { data: chatDatas, isLoading } = useQuery<any>(["chat", chatId], () =>
    fetch(`/api/chats/${chatId}`).then((res) => res.json())
  );
  const queryClient = useQueryClient();
  const { mutate: mutatePost } = useMutation(
    (chat: string) => postChat(chatId!, chat),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["chat", chatId]);
      },
    }
  );
  const onMessage = useCallback(
    (data: any) => {
      console.log("데이터: ", data);
      queryClient.setQueryData(["chat", chatId], () => {
        return [...chatDatas, data];
      });
    },
    [queryClient, chatId, chatDatas]
  );

  socket.on("message", (data) => console.log("message", data));

  useEffect(() => {
    socket?.on("message", onMessage);
    // console.log("소켓데이터-", socket);
    return () => {
      socket?.off("message", onMessage);
    };
  }, [onMessage]);

  const onSubmitForm = (e: any) => {
    e.preventDefault();
    if (!chat?.trim()) {
      setChat("");
      return;
    }
    mutatePost(chat);
    setChat("");
  };

  const onChangeChat = (e: any) => {
    e.preventDefault();
    setChat(e.target.value);
  };

  if (isLoading) return <div />;
  return (
    <>
      <div>
        {chatDatas.map((chat: any) => {
          return (
            <ChatElement key={chat.createdAt}>
              <div>
                {chat.SenderId}({chat.createdAt})
              </div>
              <div>&emsp;{chat.content}</div>
            </ChatElement>
          );
        })}
      </div>
      <form onSubmit={onSubmitForm}>
        <textarea placeholder="" value={chat} onChange={onChangeChat} />
        <button
          type="submit"
          style={{ display: "block", width: "100px", height: "100px" }}
        >
          전송
        </button>
      </form>
    </>
  );
};

export default Chat;
