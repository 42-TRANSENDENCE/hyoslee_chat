import { useParams } from "react-router";
import { useMutation, useQuery } from "react-query";
import { ChatElement } from "./styles";
import { useState } from "react";

// async function fetchChat(chatId: string) {
//   return fetch(`/api/chats/${chatId}`).then((res) => res.json());
// }

const Chat = () => {
  const params = useParams<{ chatId?: string }>();
  const { chatId } = params;
  const [chat, setChat] = useState("");

  const {
    data: chatData,
    isLoading,
    refetch,
  } = useQuery<any>(["chat", chatId], () =>
    fetch(`/api/chats/${chatId}`).then((res) => res.json())
  );
  if (isLoading) return <div />;

  const onSubmitForm = (e: any) => {
    e.preventDefault();
    fetch(`/api/chats/${chatId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        createdAt: new Date(),
        SenderId: "hyoslee",
        content: chat,
      }),
    })
      .then((res) => res.text())
      .then((data) => {
        console.log("/api/post :\t", data);
        refetch();
      });
    setChat("");
  };

  const onChangeChat = (e: any) => {
    e.preventDefault();
    setChat(e.target.value);
  };

  return (
    <>
      <div>
        {chatData.map((chat: any) => {
          return (
            <ChatElement>
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
