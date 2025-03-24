import React, { useContext, useEffect, useState } from "react";
import { ChatContext } from "../context/ChatContext";
import { SystemOperationsContext } from "../context/SystemRunnerContext";
import AnimatedImage from './AnimatedImage';

const Chats = (props) => {
  const [animation_ready, set_animation_ready] = useState(false);
  const { dispatch } = useContext(ChatContext);
  const { system_operations } = useContext(SystemOperationsContext);

  useEffect(() => {
    if (system_operations?.system_runner?.current_character_runner) {
      set_animation_ready(system_operations.system_runner.current_character_runner.animation_controller.is_ready);
    }
  }, [system_operations?.system_runner?.current_character_runner?.animation_controller?.is_ready]);

  const handleSelect = (character) => {
    system_operations.unselect_all_messages();
    system_operations.set_main_chat_panel(1);
    system_operations.system_runner.start_conversation(character["character_id"]);
    // system_operations.react_reload_messages += 1;
    props["set_on_sidebar"](false)
    dispatch({ type: "CHANGE_CHARACTER", payload: character });
  };

  return (
    <div className="chats">
      {/*console.log(system_operations)*/}
      {Object.entries(system_operations?.system_runner?.get_user_data()["character_list"])?.sort((a, b) => b[1].last_message_time - a[1].last_message_time).map((chat) => {
        let isSelected = false;
        if (system_operations.system_runner.current_character_runner) {
          isSelected = system_operations.system_runner.current_character_runner.character_id === chat[1].character_id;
        }
        return (
          <div
            className={`userChat${isSelected ? ' selected' : ''}`}
            key={chat[0]}
            onClick={() => handleSelect(chat[1])}
          >
            {isSelected ? (
              <img src={system_operations.system_runner.get_current_animation_frame(chat[1].avatar_url)} alt=""/>
              /*animation_ready ? (
                  <AnimatedImage default_image = {chat[1].avatar_url}/>
                ) : (
                  <img src={system_operations.system_runner.get_current_animation_frame(chat[1].avatar_url)} alt=""/>
                )*/
            ) : (
              <img src={chat[1].avatar_url} alt="" />
            )}
            <div className={`userChatInfo${isSelected ? ' hidden' : ''}`}>
              <span>{chat[1].name}</span>
              <p>{chat[1].last_message?.text}</p>
            </div>
            {/*isSelected && <div className="selectedUsername">{chat[1].name}</div>*/}
          </div>
        );
      })}
    </div>
  );
  /* return (
    <div className="chats">
      {Object.entries(system_operations.system_runner.get_user_data()["character_list"])?.sort((a,b)=>b[1].last_message_time - a[1].last_message_time).map((chat) => (
        <div
          className="userChat"
          key={chat[0]}
          onClick={() => handleSelect(chat[1])}
        >
          <img src={chat[1].avatar_url} alt="" />
          <div className="userChatInfo">
            <span>{chat[1].name}</span>
            <p>{chat[1].last_message?.text}</p>
          </div>
        </div>
      ))}
    </div>
  );*/

  /*
  <img
    src={isSelected ? system_operations.system_runner.get_current_animation_frame(chat[1].avatar_url) : chat[1].avatar_url}
    alt=""
  />
  */
};
//{Object.entries(system_runner.get_user_data()["character_list"])?.sort((a,b)=>b[1].last_message_time - a[1].last_message_time).map((chat) => (
export default Chats;
