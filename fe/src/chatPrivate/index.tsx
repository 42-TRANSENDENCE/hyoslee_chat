import { useParams } from "react-router";

const ChatPrivate = () => {
  const params = useParams<{ chatId?: string }>();
  const { chatId } = params;
  return <>shit!</>;
};

export default ChatPrivate;
