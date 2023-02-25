import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";

async function postRoom(
  title: string,
  max: number,
  password: string
): Promise<string> {
  return await fetch(`/api/room_list/room`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      max,
      password,
    }),
  }).then((res) => res.text());
}

export default function CreateRoom() {
  const [title, setTitle] = useState("");
  const [max, setMax] = useState(10);
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: mutateRoom } = useMutation<unknown, unknown, any, unknown>(
    ({ title, max, password }) => postRoom(title, max, password),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["roomlist"]);
      },
    }
  );

  const onSubmitFunction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutateRoom({ title, max, password });
    navigate("/v2_rooms");
  };

  const onChangeTitle = (e: any) => {
    e.preventDefault();
    setTitle(e.target.value);
  };

  const onChangeMax = (e: any) => {
    e.preventDefault();
    setMax(e.target.value);
  };

  const onChangePassword = (e: any) => {
    e.preventDefault();
    setPassword(e.target.value);
  };

  return (
    <fieldset>
      <legend>방 만들기</legend>
      <form
        action="/api/room_list/room"
        method="post"
        onSubmit={onSubmitFunction}
      >
        <div>
          <input
            type="text"
            name="title"
            placeholder="방 제목"
            value={title}
            onChange={onChangeTitle}
          />
        </div>
        <div>
          <input
            type="number"
            name="max"
            placeholder="수용 인원(최소 2명)"
            min="2"
            value={max}
            onChange={onChangeMax}
          />
        </div>
        <div>
          <input
            type="password"
            name="password"
            placeholder="비밀번호(없으면 공개방)"
            value={password}
            onChange={onChangePassword}
          />
        </div>
        <button type="submit">생성</button>
      </form>
    </fieldset>
  );
}
