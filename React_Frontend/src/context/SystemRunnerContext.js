import React, { createContext, useState, useEffect } from "react";
import { SystemRunner } from "../system_runner/system_runner";
import {UserSystem} from "../system_runner/system_runner"

export const SystemOperationsContext = createContext();

class SystemRunnerOperations{
  constructor() {
    this.api_key = "";
    this.system_runner = null;
    this.react_reload_messages = 0;
    this.number_of_messages = 0;
    
    this.on_assign_openai_api_key = {}
    this.on_message_selection_change_funcs = {}   // params: the selection list and selected_more as bool.
    this.on_refresh_chat = []          // (set in messages.jsx) a function that refresh the chat contents
    
    this.selection_list = []
    this.message_set_selected_funcs = []
    this.current_editing_message = null;
    this.current_editing_message_content = ""     // access from other components directly
    
    // methods to be set
    this.refresh_user = null                // (set here) don't change the user, just use hook to reset to the current value, so nothing changed, just refresh
    this.refresh_and_reload_user = null     // (set here) refresh the whole app. set the current user to null.
    this.set_loading = null                 // (set in app.jsx) take a bool, will pop up the loading scene
    this.show_pop_up = null                 // (set in home.jsx) a function that takes 
    this.set_main_chat_panel = null         // (set in home.jsx) a function that takes a int
  }

  assign_api_key(key) {
    this.api_key = key;
    this.system_runner.assign_api_key(this.api_key);
    for (const key in this.on_assign_openai_api_key) {
      this.on_assign_openai_api_key[key](this.api_key);
    }
  }

  wrap_app_functions_for_system_runner() {
    return {
      "finish_preparation_callback": this.refresh_user.bind(this),
      "set_loading": this.set_loading.bind(this),
      "new_message_update": null
    }
  }

  user_set_up(user_data) {
    this.user_data = user_data;
    this.system_runner = new SystemRunner(user_data, this.wrap_app_functions_for_system_runner(), this.api_key);
  }

  unselect_all_messages() {
    for (const func of this.message_set_selected_funcs) {
      if (func) {
        func();
      }
    }
    this.selection_list = []
    this.message_set_selected_funcs = []
  }

  delete_all_selected_messages(delete_all = false) {
    if (delete_all) {
      this.system_runner.delete_all_chat()
    } else {
      const index_list = this.system_runner.get_index_of_list_of_messages(this.selection_list);
      this.system_runner.delete_selected_chat(index_list);
    }
    
    this.selection_list = []
    this.unselect_all_messages()
  }

  handle_message_selection(selected, message, unselect_state_setter) {
    if (selected) {
      if (!this.selection_list.includes(message)) {
        this.selection_list.push(message)
        this.message_set_selected_funcs.push(unselect_state_setter)
      }
    } else {
      if (this.selection_list.includes(message)) {
        this.selection_list = this.selection_list.filter(item => item !== message);
        // this function will not be called properly
        this.message_set_selected_funcs = this.message_set_selected_funcs.filter(item => item !== unselect_state_setter);
      }
    }

    this.handle_editing_message(false);
    for (const key in this.on_message_selection_change_funcs) {
      this.on_message_selection_change_funcs[key](this.selection_list, selected);
    }
  }


  handle_editing_message(start_editing = true) {
    if (start_editing) {
      if (this.selection_list.length === 1) {
        this.current_editing_message = this.selection_list[0];
        console.log(this.current_editing_message)
        this.current_editing_message_content = this.current_editing_message["content"]
      } else {
        this.current_editing_message = null;
        this.current_editing_message_content = ""
      }
    } else {
      this.current_editing_message = null;
      this.current_editing_message_content = ""
    }

    for (const key in this.on_refresh_chat) {this.on_refresh_chat[key]();}
  }

  handle_message_content_update(message, content) {
    this.system_runner.update_a_message(message, content);
    for (const key in this.on_refresh_chat) {this.on_refresh_chat[key]();}
  }

  handle_current_editing_message_content_update() {
    if (this.current_editing_message !== null) {
      this.system_runner.update_a_message(this.current_editing_message, this.current_editing_message_content);
    }
    this.current_editing_message = null;
    this.current_editing_message_content = "";
    for (const key in this.on_refresh_chat) {this.on_refresh_chat[key]();}
  }

  async update_character_data(update_json) {
    let request_json = {
      "character_id": this.system_runner.current_character_runner.character_id,
    }

    if (update_json.update_nickname) {
      request_json["nickname"] = update_json["nickname"]
      // this.system_runner.current_character_runner.nickname = update_json["nickname"];
      this.system_runner.current_character_runner.character_data["nickname"] = update_json["nickname"];
    }
    
    if (update_json.update_avatar) {
      request_json["avatar_url"] = update_json["avatar"]
    }
    
    if (update_json.update_creative_mode) {
      request_json["creative_mode"] = update_json["creative_mode"]
    }
    
    if (update_json.update_base_prompt && update_json["base_prompt"] != "") {
      request_json["base_prompt"] = update_json["base_prompt"]
    }
    
    if (update_json.update_sample_messages) {
      let new_sample_messages = []
      for (const message of update_json["sample_messages"]) {
        if (message["content"] !== "") {  
          new_sample_messages.push(message);
        }
      }
      if (new_sample_messages.length > 0) { request_json["sample_messages"] = new_sample_messages}
    }
    
    if (update_json.update_exclude_progress) {
      request_json["exclude_progress_prompt"] = update_json["exclude_progress"]
    }
    
    if (update_json.update_exclude_sentiment) {
      request_json["exclude_sentiment_prompt"] = update_json["exclude_sentiment"]
    }

    if (update_json["creative_mode"] && update_json["update_base_prompt"]) {
      this.system_runner.current_character_runner.update_base_prompt(update_json["base_prompt"])
    }

    this.system_runner.current_character_runner.set_creative_mode(update_json["creative_mode"])
    this.system_runner.current_character_runner.update_sample_messages(update_json["sample_messages"])
    this.system_runner.current_character_runner.update_exclusion(update_json["exclude_progress"], update_json["exclude_sentiment"])


    const response = await this.system_runner.update_a_character(request_json)
    return response;
  }
}

export const SystemOperationsContextProvider = ({ children }) => {
  const [system_operations, setSystemOperations] = useState(new SystemRunnerOperations());
  const [refreshCounter, setRefreshCounter] = useState(0);
  system_operations.refresh_user = () => {setRefreshCounter((prevCounter) => prevCounter + 1);}
  system_operations.refresh_and_reload_user = async () => {
    const user_id = system_operations.user_data["user_id"]
    const userSystem = new UserSystem();
    const new_user_data = (await userSystem.sign_in_with_token(user_id))["body"]
    system_operations.user_set_up(new_user_data);
    setRefreshCounter((prevCounter) => prevCounter + 1);
  }
  system_operations.reset_user = () => {setSystemOperations(new SystemRunnerOperations());}

  // this will happen after the login page. which is after App.jsx main mechanisms

  return (
    <SystemOperationsContext.Provider value={{ system_operations }}>
      {children}
    </SystemOperationsContext.Provider>
  );
};