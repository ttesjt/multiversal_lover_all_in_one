import React, { useState, useContext, useEffect } from 'react';
import { SystemOperationsContext } from "../context/SystemRunnerContext";
import characterPresetsData from './characterPresets.json';
import Backward from "../img/backward.png";
import Default_Avatar from "../img/Default_Avatar.png";
import './styles/CharacterCreation.scss';


const CharacterCreation = () => {
    const [scrollable, setScrollable] = useState(false);
    const [character_data, set_character_data] = useState(null);
    const { system_operations } = useContext(SystemOperationsContext);

    const checkScrollable = () => {
      const element = document.getElementById('circle-buttons-container');
      if (element.scrollHeight > element.clientHeight) {
        setScrollable(true);
      } else {
        setScrollable(false);
      }
    };
  
    useEffect(() => {
      checkScrollable();
    }, [characterPresetsData]);
  
    const handleCustomizeClick = () => {
      set_character_data({
        "name":"",
        "nickname": "",
        "avatar": Default_Avatar,
        "base_prompt": "",
        "appearance": "",
      })
    };
  
    const handlePresetClick = (preset) => {
      set_character_data(preset)
    };

    const handleBackward = () => {
      set_character_data(null)
    }

    const handleSubmit = async () => {
      if (character_data.avatar === "" || !character_data.avatar) {
        return;
      }
      system_operations.set_loading(true);
      let request_json = {
        "action": "upload_character",
        "user_id": system_operations.system_runner.user_id,
        "character_data": {
          "name": character_data["name"],
          "nickname": character_data["nickname"],
          "base_prompt": character_data["base_prompt"],
          "appearance": "",
          "creative_mode": false,
          "exclude_progress_prompt": true,
          "exclude_sentiment_prompt": true,
          "sample_messages": []
        }
      }
      const response = await system_operations.system_runner.loader.post_to_database_url(request_json);
      if (response["status"] === "successed") {
        let presigned_url = response["body"]["avatar_url"];
        const response2 = await system_operations.system_runner.loader.post_file_to_presigned_url(presigned_url, character_data["avatar"]);
      }
      system_operations.set_loading(false);
      system_operations.refresh_and_reload_user();
      // console.log("the url: ", character_data["avatar"], " and ", response2)
      // refresh the app
    }
  
    if (!character_data) {
      return (
        <div className="chat_panel_full">
          <div className="my-component">
            <button className="customize-btn" onClick={handleCustomizeClick}>
              Customize your own
            </button>
            <div
              className={`circle-buttons-container ${scrollable ? 'scrollable' : ''}`}
              id="circle-buttons-container"
              onScroll={checkScrollable}
            >
              {characterPresetsData.map((preset, index) => (
                <div className="circle-button-wrapper" key={index}>
                  <button
                    className="circle-button"
                    style={{ backgroundImage: `url(${preset.avatar})` }}
                    onClick={() => handlePresetClick(preset)}
                  ></button>
                  <div className="preset-name">{preset.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="chat_panel_full">
        <button className="backward-button" onClick={handleBackward}>
          <img src={Backward} alt="Backward" />
        </button>
        <div className="character-editing">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            defaultValue={character_data.name}
            onChange={(e) => set_character_data({ ...character_data, name: e.target.value })}
          />
    
          <label htmlFor="nickname">Nickname:</label>
          <input
            type="text"
            id="nickname"
            defaultValue={character_data.nickname}
            onChange={(e) => set_character_data({ ...character_data, nickname: e.target.value })}
          />
          <div className="avatar-upload">
            <div
              className="avatar-display"
              style={{
                backgroundImage: character_data.avatar
                  ? `url(${character_data.avatar})`
                  : `url(${Default_Avatar})`,
                backgroundColor: character_data.avatar ? "transparent" : "white",
              }}
            ></div>
            <input
              type="file"
              id="avatar-upload-input"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = () => {
                  set_character_data({ ...character_data, avatar: reader.result });
                };
                if (file) {
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>
          <label htmlFor="description">Description:</label>
          <textarea
            id="base_prompt"
            defaultValue={character_data.base_prompt}
            onChange={(e) => set_character_data({ ...character_data, base_prompt: e.target.value })}
            placeholder="Talk anything about the character, like the look, the personality, the background..."
          />
    
          <p>Adding pre-made prompts:</p>
          <div className="button-container">
            <button onClick={() => {/* Add functionality for anti_ai button */}}>Anti_AI</button>
            <button onClick={() => {/* Add functionality for be_girlfriend button */}}>Be Girlfriend</button>
          </div>
          <button onClick={handleSubmit} className="submit-button">Submit</button>
        </div>
      </div>
    );
  };
  
  export default CharacterCreation;