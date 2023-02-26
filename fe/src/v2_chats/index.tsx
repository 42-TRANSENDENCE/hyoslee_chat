import styled from "@emotion/styled";
import { useCallback, useEffect, useRef, useState } from "react";
import Scrollbars from "react-custom-scrollbars";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const ChatElement = styled.section`
  margin: 1rem;
`;

async function postChat(roomId: string, data: any): Promise<string> {
  let res = await fetch(`/api/room_list/room/${roomId}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      createdAt: new Date(),
      user: "hyoslee",
      chat: data,
    }),
  }).then((res) => res.text());
  return res;
}

const socket = io("http://localhost:3095/v2_chat", {
  transports: ["websocket"],
});

export default function V2chats() {
  const params = useParams<{ roomId?: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const password = queryParams.get("password");
  const { roomId } = params;
  const [chat, setChat] = useState("");
  const scrollbarRef = useRef<Scrollbars>(null);

  const {
    data: chatDatas,
    isLoading,
    isError,
  } = useQuery<any>(
    ["chat", roomId],
    async () => {
      const response = await fetch(
        `/api/room_list/room/${roomId}/chat?password=${password}`
      );
      if (!response.ok) {
        throw new Error("password check Error!");
      }
      return response.json();
    },
    {
      retry: 1,
      retryOnMount: true,
    }
  );
  console.log("chatDatas: ", chatDatas);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mutate: mutatePost } = useMutation(
    (chat: string) => postChat(roomId!, chat),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["chat", roomId]);
      },
    }
  );

  const onMessage = useCallback(
    async (data: any) => {
      console.log("데이터: ", data);
      queryClient.setQueryData(["chat", roomId], (chatData: any) => {
        return [...chatData, data];
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
    [queryClient, roomId]
  );
  const onJoin = useCallback(function (data: any) {
    console.log("JoinData: ", data);
  }, []);
  const onExit = useCallback(function (data: any) {
    console.log("LeaveData: ", data);
  }, []);

  useEffect(() => {
    // if (chatDatas === undefined) return;
    console.log("소켓 연결되어라!");
    socket?.on("message", onMessage);
    return () => {
      socket?.off("message", onMessage);
    };
  }, [onMessage]);

  useEffect(() => {
    // if (chatDatas === undefined) return;
    console.log("소켓 연결되어라! (join)");
    socket?.on("join", onJoin);
    socket?.on("exit", onExit);
    return () => {
      socket?.off("join", onJoin);
      socket?.emit("leave", roomId);
      socket?.off("exit", onExit);
    };
  }, [roomId, onJoin, onExit]);

  useEffect(() => {
    // if (chatDatas === undefined) return;
    socket?.emit("join", roomId);
  }, [roomId]);

  const onSubmitForm = (e: any) => {
    e.preventDefault();
    if (!chat?.trim()) {
      setChat("");
      return;
    }
    mutatePost(chat);
    setChat("");
  };

  const onChangeChat = useCallback((e: any) => {
    e.preventDefault();
    setChat(e.target.value);
  }, []);

  if (isLoading) return <div />;
  if (isError)
    return (
      <>
        <div>비밀번호 틀렸어</div>
        <Link to="/v2_rooms">방 목록으로</Link>
      </>
    );
  return (
    <>
      <Scrollbars
        autoHide
        style={{ width: 500, height: 700 }}
        ref={scrollbarRef}
        onScrollFrame={() => {}}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {chatDatas.map((chat: any) => {
            return (
              <ChatElement key={chat.chat}>
                <div>
                  {chat.user}({chat.createdAt})
                </div>
                <div>&emsp;{chat.chat}</div>
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
      <Link to="/v2_rooms">방 목록으로</Link>
    </>
  );
}
