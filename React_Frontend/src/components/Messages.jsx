import React, { useContext, useEffect, useState } from "react";
import { SystemOperationsContext } from "../context/SystemRunnerContext";
import Message from "./Message";

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const { system_operations } = useContext(SystemOperationsContext);
  const [number_of_messages, set_number_of_messages] = useState(0);
  const [refresh_count, set_refresh_count] = useState(0);

  const refresh_chat = () => {
    set_refresh_count(refresh_count + 1)
  }

  system_operations.on_refresh_chat["from_messages"] = refresh_chat;

  useEffect(() => {
    const updateMessages = () => {
      system_operations.system_runner.update();
      const chatHistory = system_operations.system_runner.get_all_chat();
      set_number_of_messages(chatHistory.length)
      setMessages(chatHistory);
    };

    const intervalId = setInterval(updateMessages, 333); // Call the updateMessages every 500 milliseconds

    return () => {
      clearInterval(intervalId); // Clear the interval when the component is unmounted
    };
  }, [system_operations?.system_runner?.current_character_runner, number_of_messages]);


  return (
    <div className="messages">
      {messages.map((m, index) => (
        <Message message={m} key={index} />
      ))}
    </div>
  );
};

export default Messages;
