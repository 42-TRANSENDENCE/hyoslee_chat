import { useParams } from "react-router";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { ChatElement } from "./styles";
import { useState } from "react";

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

const Chat = () => {
  const params = useParams<{ chatId?: string }>();
  const { chatId } = params;
  const [chat, setChat] = useState("");

  const {
    data: chatDatas,
    isLoading,
    refetch,
  } = useQuery<any>(["chat", chatId], () =>
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
  if (isLoading) return <div />;

  const onSubmitForm = (e: any) => {
    e.preventDefault();
    mutatePost(chat);
    setChat("");
  };

  const onChangeChat = (e: any) => {
    e.preventDefault();
    setChat(e.target.value);
  };

  return (
    <>
      <div>
        {chatDatas.map((chat: any) => {
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
