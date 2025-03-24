import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { SystemOperationsContext } from "../context/SystemRunnerContext";

const Message = ({ message }) => {
  const { currentUser } = useContext(AuthContext);
  const { data } = useContext(ChatContext);
  const { system_operations } = useContext(SystemOperationsContext);
  const [selected, setSelected] = useState(false);

  const ref = useRef();

  const editing_mode = (message == system_operations.current_editing_message);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  const unselect = () => {
    system_operations.handle_message_selection(false, message);
    setSelected(false);
  }

  const handleMessageSelect = () => {
    // check if is currently selected
    if (!editing_mode && message["role"] !== "warning") {
      if (selected) {
        system_operations.handle_message_selection(false, message, unselect);
      } else {
        system_operations.handle_message_selection(true, message, unselect);
      }
      setSelected(!selected);
    }
  };

  const handle_the_current_editing_message_content_change = (event) => {
    // update the current editing value
    system_operations.current_editing_message_content = event.target.value;
  }

  const autoExpand = (event) => {
    event.target.style.height = "inherit";
    event.target.style.height = `${event.target.scrollHeight}px`;
  }

  return (
    <div
      ref={ref}
      className={`message ${message.role === "user" && "owner"} ${
        selected && "selected"
      }`}
    >
      <div className="messageInfo">
        <img
          src={
            message.role === "user"? currentUser.avatar_url: data.char_data.avatar_url
          }
          alt=""
        />
        <span>just now</span>
      </div>
      <div className="messageContent" onClick={() => handleMessageSelect()}>
        {editing_mode ? (
          <textarea
            defaultValue={message.content}
            onChange={handle_the_current_editing_message_content_change}
            onInput={autoExpand}
            style={{ width: "100%", minHeight: "100%", resize: "none", border: "none", background: "transparent" }}
          />
        ) : (
          <>
            <p>{message.content}</p>
            {message.img && <img src={message.img} alt="" />}
          </>
        )}
      </div>
    </div>
  );
};

export default Message;
