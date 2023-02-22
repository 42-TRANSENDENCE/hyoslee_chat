import { useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { ChatElement } from "./styles";
import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
// import socket from "../socket";
import Scrollbars from "react-custom-scrollbars";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const scrollbarRef = useRef<Scrollbars>(null);

  const { data: chatDatas, isLoading } = useQuery<any>(["chat", chatId], () =>
    fetch(`/api/chats/${chatId}`).then((res) => res.json())
  );
  console.log(chatDatas);
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
    async (data: any) => {
      console.log("데이터: ", data);
      queryClient.setQueryData(["chat", chatId], () => {
        return { ...chatDatas, data: [...chatDatas.data, data] };
      });
      // if (data.SenderId === "hyoslee") {
      //   setTimeout(() => {
      //     scrollbarRef.current?.scrollToBottom();
      //   }, 10);
      //   return;
      // }
      if (
        scrollbarRef.current &&
        scrollbarRef.current.getScrollHeight() <
          scrollbarRef.current.getClientHeight() +
            scrollbarRef.current.getScrollTop() +
            150
      ) {
        setTimeout(() => {
          scrollbarRef.current?.scrollToBottom();
        }, 50);
      } else {
        toast.success("새 메시지가 도착했습니다.", {
          onClick() {
            scrollbarRef.current?.scrollToBottom();
          },
          closeOnClick: true,
        });
        toast.clearWaitingQueue();
      }
    },
    [queryClient, chatId, chatDatas]
  );

  // socket.on("message", (data) => console.log("message", data));

  useEffect(() => {
    socket?.on("message", onMessage);
    // console.log("소켓데이터-", socket);
    return () => {
      socket?.off("message", onMessage);
    };
  }, [onMessage]);

  useEffect(() => {
    if (!isLoading) scrollbarRef.current?.scrollToBottom();
  }, [isLoading]);

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
      <Scrollbars
        autoHide
        style={{ width: 500, height: 700 }}
        ref={scrollbarRef}
        onScrollFrame={() => {}}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {chatDatas.data.map((chat: any) => {
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
        <ToastContainer limit={1} />
      </Scrollbars>
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
