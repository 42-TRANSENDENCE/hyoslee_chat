import { useState } from "react";
import { useQuery } from "react-query";
import { Navigate, useParams } from "react-router";

async function postChat(chatId: string, password: any): Promise<string> {
  let res;
  res = await fetch(`/api/chats/${chatId}/private`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      secret: password,
    }),
  });
  res = await res.text();
  return res;
}

const ChatPrivate = () => {
  const params = useParams<{ chatId?: string }>();
  const { chatId } = params;
  // let password = "1235";
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState(true);

  const {
    data: password_result,
    isLoading,
    refetch,
  } = useQuery<any>(["chat", chatId, "password"], () =>
    postChat(chatId!, password)
  );

  const onChangePassword = (e: any) => {
    e.preventDefault();
    setPassword(e.target.value);
  };

  const onSubmitForm = (e: any) => {
    e.preventDefault();
    if (!password?.trim()) {
      setPassword("");
      return;
    }
    setPasswordCheck(false);
    refetch();
    setPassword("");
  };

  if (isLoading) return <>로딩중</>;

  if (password_result === "true" || localStorage.getItem(chatId!) === "true") {
    // setPasswordCheck(true);
    localStorage.setItem(chatId!, "true");
    return <Navigate to={`/chats/${chatId}`} />;
  }
  return (
    <form onSubmit={onSubmitForm}>
      <input placeholder="" value={password} onChange={onChangePassword} />
      <button
        type="submit"
        style={{ display: "block", width: "100px", height: "100px" }}
      >
        비밀번호 확인
      </button>
      {!passwordCheck && <div>비밀번호가 틀렸습니다.</div>}
    </form>
  );
};

export default ChatPrivate;
