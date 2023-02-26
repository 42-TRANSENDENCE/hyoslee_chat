import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useParams } from "react-router";
import { io } from "socket.io-client";

async function getUser() {
  return fetch(`/api/user/`).then((res) => res.json());
}
async function getDms(id: any) {
  return fetch(`/api/dms/${id}`).then((res) => res.json());
}
async function postDM(dmId: any, chat: any, user: any) {
  fetch(`/api/dms/${dmId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      createdAt: new Date(),
      SenderId: user.sessionID,
      ReceiverId: dmId,
      content: chat,
    }),
  }).then((res) => res.text());
}

const socket = io("http://localhost:3095/v2_dm", {
  transports: ["websocket"],
});

export default function V2dms() {
  const params = useParams<{ dmId?: string }>();
  const { dmId } = params;
  const [chat, setChat] = useState("");

  const { data: user, isLoading: isLoadingUser } = useQuery<any>(
    ["user"],
    getUser
  );
  //   const { data: dms, isLoading: isLoadingDms } = useQuery<any>(
  //     ["dms", dmId],
  //     (dmId) => getDms(dmId)
  //   );
  const { data: dms, isLoading: isLoadingDms } = useQuery<any>(
    ["dms", dmId],
    () => fetch(`/api/dms`).then((res) => res.json())
  );
  const queryClient = useQueryClient();

  const { mutate: mutateDM } = useMutation<unknown, unknown, any, unknown>(
    ({ dmId, chat, user }) => postDM(dmId, chat, user),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["dms", dmId]);
      },
    }
  );

  const onChangeChat = (e: any) => {
    setChat(e.target.value);
  };

  const onSubmitForm = (e: any) => {
    e.preventDefault();
    mutateDM({ dmId, chat, user });
    setChat("");
  };

  const onDM = useCallback(
    async (data: any) => {
      console.log("데이터: ", data);
      queryClient.setQueryData(["dms", dmId], (dmData: any) => {
        return [...dmData, data];
      });
      // if (data.SenderId === "hyoslee") {
      //   setTimeout(() => {
      //     scrollbarRef.current?.scrollToBottom();
      //   }, 10);
      //   return;
      // }
      //   if (
      //     scrollbarRef.current &&
      //     scrollbarRef.current.getScrollHeight() <
      //       scrollbarRef.current.getClientHeight() +
      //         scrollbarRef.current.getScrollTop() +
      //         150
      //   ) {
      //     setTimeout(() => {
      //       scrollbarRef.current?.scrollToBottom();
      //     }, 50);
      //   } else {
      //     toast.success("새 메시지가 도착했습니다.", {
      //       onClick() {
      //         scrollbarRef.current?.scrollToBottom();
      //       },
      //       closeOnClick: true,
      //     });
      //     toast.clearWaitingQueue();
      //   }
    },
    [queryClient, dmId]
  );

  useEffect(() => {
    // if (chatDatas === undefined) return;
    console.log("소켓 연결되어라!");
    socket?.on("DM", onDM);
    return () => {
      socket?.off("DM", onDM);
    };
  }, [onDM]);

  if (isLoadingUser || isLoadingDms) return <div>로딩중</div>;
  return (
    <>
      <div>{user.sessionID}</div>
      {dms.map((dm: any) => {
        return (
          <div style={{ marginTop: "2rem" }}>
            <div>{dm.createdAt}</div>
            <div>{dm.SenderId}</div>
            <div>{dm.ReceiverId}</div>
            <div>{dm.content}</div>
          </div>
        );
      })}
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
}
