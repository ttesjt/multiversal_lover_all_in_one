import React, { useContext, useState } from "react";
// import Img from "../img/img.png";
import Editing from "../img/Editing.png";
import Confirm from "../img/Confirm.png";
import Trash from "../img/Trash.png";
import { SystemOperationsContext } from "../context/SystemRunnerContext";

const Input = () => {
  const [text, setText] = useState("");
  const [img, setImg] = useState(null);
  const [number_of_selection, set_number_of_selection] = useState(0);
  const [is_editing, set_is_editing] = useState(false);

  const { system_operations } = useContext(SystemOperationsContext);



  const handleSend = async () => {
    if (img) {
      console.log("image are disabled")
    } else {
      system_operations.system_runner.user_input(text)
    }
    setText("");
    setImg(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handle_message_selection_change = (selection_list, selected_more) => {
    set_is_editing(false)
    set_number_of_selection(selection_list.length)
  }
  system_operations.on_message_selection_change_funcs["input_component"] = handle_message_selection_change;

  /*const handleComplain = () => {
    system_operations.system_runner.reinform_character_identity();
  };*/

  const handleEditingStartOrSave = () => {
    const start_editing = !is_editing;
    set_is_editing(start_editing)
    if (start_editing) {
      system_operations.handle_editing_message(start_editing);
    } else {
      handle_update_message_change()
    }
  };

  const handle_update_message_change = () => {
    system_operations.handle_current_editing_message_content_update();
  }

  const handleDeleteHistory = () => {
    // system_operations.system_runner.delete_all_chat();
    if (system_operations.selection_list.length === 0) {
      // selected nothing, so delete all
      if (system_operations.show_pop_up !== null) {
        system_operations.show_pop_up("confirmation", "Delete all messages?", ()=>{system_operations.delete_all_selected_messages(true)}, ()=>{system_operations.unselect_all_messages()})
      }
    } else {
      // selected something, so delete the selected
      if (system_operations.show_pop_up !== null) {
        system_operations.show_pop_up("confirmation", "Delete the selected messages?", ()=>{system_operations.delete_all_selected_messages(false)}, ()=>{system_operations.unselect_all_messages()})
      }
    }
  };

  return (
    <div className="input">
      <input
        type="text"
        placeholder="Type something..."
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress} // Add the onKeyPress event handler
        value={text}
      />
      <div className="send">
        {number_of_selection === 1 && <button onClick={handleEditingStartOrSave}>
          {is_editing? <img src={Confirm} alt="" /> : <img src={Editing} alt="" />}
        </button>}
        <button onClick={handleDeleteHistory}>
          <img src={Trash} alt="Trash" />
        </button>
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default Input;
