import React, { useContext, useState } from "react";
// import Cam from "../img/cam.png";
// import Add from "../img/add.png";
import More from "../img/more.png";
import Backward from "../img/backward.png";
import MainChatPanel from "./MainChatPanel";
import { SystemOperationsContext } from '../context/SystemRunnerContext';

const Chat = (props) => {
  const { system_operations } = useContext(SystemOperationsContext);
  const [refresh_count, set_refresh_count] = useState(0);

  const refresh_chat = () => {
    console.log("hehehe")
    set_refresh_count(refresh_count + 1)
  }

  system_operations.on_refresh_chat["from_chat"] = refresh_chat;

  const handlePromptsEditorButtonClick = () => {
    system_operations.set_main_chat_panel(3);
  };

  const handleExitBackward = () => {
    props["set_on_sidebar"](true)
  };

  let display_name = ""
  if (system_operations.system_runner.current_character_runner) {
    console.log("retry the name")
    if (system_operations.system_runner.current_character_runner.character_data["nickname"] !== "") {
      display_name = system_operations.system_runner.current_character_runner.character_data["nickname"];
    } else {
      display_name = system_operations.system_runner.current_character_runner.character_data["name"];
    }
  }

  return (
    <div className="chat">
      <div className="chatInfo">
        {!props["desktop_mode"] && (<img className="backward" src={Backward} onClick = {handleExitBackward} alt="Backward" />)}
        <span>{display_name}</span>
        <div className="chatIcons">
          {/*<img src={Cam} alt="" />*/}
          {system_operations.system_runner.current_character_runner && <img src={More} onClick = {handlePromptsEditorButtonClick} alt="" />}
        </div>
      </div>
      <MainChatPanel />
    </div>
  );
};

export default Chat;
