import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:3095/v2_room", {
  transports: ["websocket"],
});

function V2rooms() {
  // const params = useParams<{ roomId?: string }>();
  // const { roomId } = params;
  const navigate = useNavigate();
  // const location = useLocation();
  // const searchParams = new URLSearchParams(location.search);
  // const searchPassword = searchParams.get("password");

  const [passwordError, setPasswordError] = useState<string | null>(null);

  const {
    data: rooms,
    isLoading,
    refetch,
  } = useQuery<any>(["roomlist"], () =>
    fetch(`/api/room_list/`).then((res) => res.json())
  );

  const queryClient = useQueryClient();

  const onNewRoom = useCallback(
    async (data: any) => {
      console.log("데이터: ", data);
      queryClient.setQueryData(["roomlist"], () => {
        return { data: [...rooms.data, data] };
      });
    },
    [queryClient, rooms]
  );

  const onRemoveRoom = useCallback((data: any) => refetch(), [refetch]);

  useEffect(() => {
    socket?.on("newRoom", onNewRoom);
    socket?.on("removeRoom", onRemoveRoom);
    return () => {
      socket?.off("newRoom", onNewRoom);
      socket?.off("removeRoom", onRemoveRoom);
    };
  }, [onNewRoom, onRemoveRoom]);

  const onEnterEvent = useCallback((e: any) => {
    let enterApiURL: any, password: any;
    if (e.target.dataset.password === "true") {
      password = prompt("비밀번호를 입력하세요");
      e.preventDefault();
      enterApiURL = `/api/room_list/room/${e.target.dataset.id}?password=${password}`;
    } else {
      enterApiURL = `/api/room_list/room/${e.target.dataset.id}`;
    }
    fetch(enterApiURL)
      .then((res) => res.text())
      .then((data) => {
        if (data === "OK") {
          let navigateURL = `/v2_rooms/${e.target.dataset.id}/chat`;
          if (e.target.dataset.password === "true") {
            navigateURL = `/v2_rooms/${e.target.dataset.id}/chat?password=${password}`;
          }
          navigate(navigateURL);
        } else {
          setPasswordError("비밀번호가 틀렸습니다.");
        }
      });
  }, []);

  // if (roomId) {
  //   return <Navigate to="/workspace/sleact/channel/일반" />;
  // }

  if (isLoading) return <div>isLoading...</div>;
  return (
    <>
      <h1>채팅방</h1>
      <fieldset onClick={() => setPasswordError("")}>
        <legend>채팅방 목록</legend>
        <table>
          <thead>
            <tr>
              <th>방 제목</th>
              <th>종류</th>
              <th>허용 인원</th>
              <th>방장</th>
            </tr>
          </thead>
          <tbody>
            {rooms.data.map((room: any) => {
              return (
                <div>
                  <th data-id={room.id}>
                    <td>{room.title}</td>
                    <td>{room.password ? "비밀방" : "공개방"}</td>
                    <td>{room.max}</td>
                    <td>{room.owner}</td>
                    <td>
                      <button
                        data-password={room.password ? "true" : "false"}
                        data-id={room.id}
                        onClick={onEnterEvent}
                      >
                        입장
                      </button>
                    </td>
                  </th>
                </div>
              );
            })}
          </tbody>
        </table>
        <div className="error-message"></div>
        <Link to="/v2_rooms/create_room">방 만들기</Link>
      </fieldset>
      {passwordError && <div style={{ color: "red" }}>{passwordError}</div>}
    </>
  );
}

export default V2rooms;
