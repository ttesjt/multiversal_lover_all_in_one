import React, { useContext, useState, useRef } from "react";
import PromptMessage from './PromptMessage';
import { SystemOperationsContext } from "../context/SystemRunnerContext";
import Black_Check from "../img/Black_Check.png";
import Black_Uncheck from "../img/Black_Uncheck.png";
import './styles/CharacterEditingPanel.scss';

const CharacterEditingPanel = (props) => {
  const { system_operations } = useContext(SystemOperationsContext);
  // const [base_prompt, setMainPrompt] = useState("");
  const [freezed, set_freezed] = useState(false);

  const [avatar, setAvatar] = useState(system_operations.system_runner.current_character_runner.character_data.avatar_url);
  const [sample_messages, set_sample_messages] = useState(system_operations.system_runner.current_character_runner.sample_messages);
  const [creative_mode, set_creative_mode] = useState(system_operations.system_runner.current_character_runner.creative_mode);
  const [exclude_progress, set_exclude_progress] = useState(system_operations.system_runner.current_character_runner.exclude_progress_prompt);
  const [exclude_sentiment, set_exclude_sentiment] = useState(system_operations.system_runner.current_character_runner.exclude_sentiment_prompt);
  const base_prompt = useRef(system_operations.system_runner.current_character_runner.get_base_prompt_content());
  const name = useRef(system_operations.system_runner.current_character_runner.character_data["name"]);
  const nickname = useRef(system_operations.system_runner.current_character_runner.character_data["nickname"]);

  const [update_avatar, set_update_avatar] = useState(false);
  const [update_sample_messages, set_update_sample_messages] = useState(false);
  const [update_creative_mode, set_update_creative_mode] = useState(false);
  const [update_exclude_progress, set_update_exclude_progress] = useState(false);
  const [update_exclude_sentiment, set_update_exclude_sentiment] = useState(false);
  const [update_base_prompt, set_update_base_prompt] = useState(false);
  const [update_nickname, set_update_nickname] = useState(false);

  const handleNicknameChange = (event) => {
    if (!update_nickname) {set_update_nickname(true);}
    nickname.current = event.target.value;
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    if (!update_avatar) {set_update_avatar(true);}
    reader.onloadend = () => {
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleCreativeMode = () => {
    if (!update_creative_mode) {set_update_creative_mode(true);}
    set_creative_mode(!creative_mode);
  };
  const toggleExcludeProgress = () => {
    if (!update_exclude_progress) {set_update_exclude_progress(true);}
    set_exclude_progress(!exclude_progress);
  };
  const toggleExcludeSentiment = () => {
    if (!update_exclude_sentiment) {set_update_exclude_sentiment(true);}
    set_exclude_sentiment(!exclude_sentiment);
  };

  const handleSave = async () => {
    system_operations.set_loading(true);
    if (freezed) {return;}
    set_freezed(true);
    const update_json = {
      "update_nickname": update_nickname,
      "nickname": nickname.current,
      "update_avatar": update_avatar,
      "avatar": avatar,
      "update_creative_mode": update_creative_mode,
      "creative_mode": creative_mode,
      "update_base_prompt": update_base_prompt,
      "base_prompt": base_prompt.current,
      "update_sample_messages": update_sample_messages,
      "sample_messages": sample_messages,
      "update_exclude_progress": update_exclude_progress,
      "exclude_progress": exclude_progress,
      "update_exclude_sentiment": update_exclude_sentiment,
      "exclude_sentiment": exclude_sentiment
    }
    const response = await system_operations.update_character_data(update_json)
    if (response["status"] === "successed") {
      let presigned_url = response["body"]["avatar_url"];
      await system_operations.system_runner.loader.post_file_to_presigned_url(presigned_url, avatar);
    }
    system_operations.set_loading(false);
    system_operations.refresh_and_reload_user();
    system_operations.set_main_chat_panel(1);
  };

  const handleMainPromptChange = (event) => {
    if (!update_base_prompt) {set_update_base_prompt(true);}
    base_prompt.current = event.target.value;
  };

  const handleAdd = () => {
    if (!update_sample_messages) {set_update_sample_messages(true);}
    set_sample_messages([...sample_messages, { role: "user", content: "" }]);
  };

  const handleDeleteMessage = (index) => {
    if (index < sample_messages.length) {
      if (!update_sample_messages) {set_update_sample_messages(true);}
      set_sample_messages(sample_messages.filter((_, i) => i !== index));
      console.log(sample_messages)
    }
  };

  const handlePromptInputChange = (index, value) => {
    if (index < sample_messages.length) {
      if (!update_sample_messages) {set_update_sample_messages(true);}
      sample_messages[index]["content"] = value;
    }
  }

  const count_all_prompts_length = () => {
    let string_full = ""
    if (base_prompt != "") {
      string_full += base_prompt;
    }
    for (const message of sample_messages) {
      string_full += message["content"];
    }
    return string_full.length
  }

  const handlePromptRoleChange = (index, value) => {
    if (index < sample_messages.length) {
      console.log(value)
      if (!update_sample_messages) {set_update_sample_messages(true);}
      sample_messages[index]["role"] = value;
    }
  }

  // set_creative_mode(system_operations.system_runner.current_character_runner.creative_mode)
  
  return (
  <div className="chat_panel_full">
    <div className="wrapper">
      <input
        type="text"
        defaultValue={name.current}
        readOnly
        className="name-input"
      />
      <input
        type="text"
        defaultValue={nickname.current}
        onChange={handleNicknameChange}
        placeholder="Nickname"
      />
      <label htmlFor="image-upload" className="image-label">
        <input
          type="file"
          id="image-upload"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
        {avatar ? <img src={avatar} alt="Uploaded" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : null}
      </label>
      <div className="toggle-buttons">
        <div>
          Creative Mode
          <button onClick={toggleCreativeMode} className="toggle">
            <img src={creative_mode ? Black_Check : Black_Uncheck} alt="Creative Mode" />
          </button>
        </div>
        <div>
          Exclude Progress Mode(not working)
          <button onClick={toggleExcludeProgress} className="toggle">
            <img src={exclude_progress ? Black_Check : Black_Uncheck} alt="Progress Mode" />
          </button>
        </div>
        <div>
          Exclude Sentiment Mode(not working)
          <button onClick={toggleExcludeSentiment} className="toggle">
            <img src={exclude_sentiment ? Black_Check : Black_Uncheck} alt="Sentiment Mode" />
          </button>
        </div>
      </div>
      <textarea
        className={`main-prompt ${!creative_mode ? "lightgray" : ""}`}
        placeholder="Type your main prompt here"
        defaultValue={base_prompt.current}
        onChange={handleMainPromptChange}
        readOnly={!creative_mode}
      ></textarea>
      <div className="prompt-messages" style={{ maxHeight: '200px', overflowY: 'scroll' }}>
        {sample_messages.map((message, index) => (
          <PromptMessage {...{
            "message": message,
            "handleDelete": ()=>{handleDeleteMessage(index)},
            "handleInputChange": (value)=>{handlePromptInputChange(index, value)},
            "handleRoleChange": (value) => {handlePromptRoleChange(index, value)}
          }} key={index} />
        ))}
      </div>
      <button onClick={handleAdd} className="plus-button">+</button>
      <div className="save-close-buttons">
        <button onClick={handleSave} className="save-button">
          Save
        </button>
        <button onClick={() => { system_operations.set_main_chat_panel(1) }} className="close-button">
          Close
        </button>
      </div>
    </div>
  </div>
);
};

export default CharacterEditingPanel;

/*
This is a character editing panel. what i want you to do is:
add a text input before all the existing elements for
name (this is locked. grey out and can't be edited, just display it)
nickname
each of the text input port should take a whole line

add an circle icon display, which when you click, will ask you to upload a avatar. after avatar is uploaded, it will display it.

for toggles, I want them to be on the same line. and make them a small icon button. depending on if the mode is on or not, there are two icons one called "unckecked_box", one called "checked_box". put the text descriptions in front of the icon button.

the textarea, main-prompt should be as wide as the given space, and by default 20 lines tall. and scrollable if the text contents is long enough.

no need to change the PromptMessage

save button and close button should be on the same line as well. make the color white and text black for now. i will change them later.
*/