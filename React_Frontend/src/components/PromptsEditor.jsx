import React, { useContext, useState } from "react";
import PromptMessage from './PromptMessage';
import { SystemOperationsContext } from "../context/SystemRunnerContext";


const PromptsEditor = ({handleClose}) => {
  const { system_operations } = useContext(SystemOperationsContext);
  // const [mainPrompt, setMainPrompt] = useState("");
  const [promptMessages, setPromptMessages] = useState([]);
  const [creativeMode, setCreativeMode] = useState(system_operations.system_runner.current_character_runner.creative_mode);
  const [excludeProgress, setExcludeProgress] = useState(system_operations.system_runner.current_character_runner.exclude_progress_prompt);
  const [excludeSentiment, setExcludeSentiment] = useState(system_operations.system_runner.current_character_runner.exclude_sentiment_prompt);

  let mainPrompt = ""

  const toggleCreativeMode = () => {
    setCreativeMode(!creativeMode);
  };
  const toggleExcludeProgress = () => {
    setExcludeProgress(!excludeProgress);
  };
  const toggleExcludeSentiment = () => {
    setExcludeSentiment(!excludeSentiment);
  };

  const handleSave = () => {
    system_operations.collect_all_prompt_data(mainPrompt, promptMessages, creativeMode, excludeProgress, excludeSentiment)
    handleClose()
  };

  const handleMainPromptChange = (event) => {
    // setMainPrompt(event.target.value);
    mainPrompt = event.target.value;
  };

  const handleAdd = () => {
    setPromptMessages([...promptMessages, { role: "user", content: "" }]);
  };

  const handleDeleteMessage = (index) => {
    console.log(index);
    if (index < promptMessages.length) {
      setPromptMessages(promptMessages.filter((_, i) => i !== index));
      console.log(promptMessages)
    }
  };

  const handlePromptInputChange = (index, value) => {
    console.log(index, value)
    if (index < promptMessages.length) {
      promptMessages[index]["content"] = value;
    }
  }

  // setCreativeMode(system_operations.system_runner.current_character_runner.creative_mode)
  let base_prompt = system_operations.system_runner.current_character_runner.get_base_prompt_content()

  return (
    <div className="prompts-editor">
      <button onClick={toggleCreativeMode} className="toggle">
        {creativeMode ? 'Disable Creative Mode' : 'Enable Creative Mode'}
      </button>
      <button onClick={toggleExcludeProgress} className="toggle">
        {excludeProgress ? 'Enable progress Mode' : 'Disable progress Mode'}
      </button>
      <button onClick={toggleExcludeSentiment} className="toggle">
        {excludeSentiment ? 'Enable Sentiment Mode' : 'Disable Sentiment Mode'}
      </button>
      <textarea
        className="main-prompt"
        placeholder="Type your main prompt here"
        defaultValue={base_prompt}
        onChange={handleMainPromptChange}
        readOnly={!creativeMode}
        style={{backgroundColor: creativeMode ? 'white' : 'lightgray',}}
      ></textarea>
      <div className="prompt-messages" style={{ maxHeight: '200px', overflowY: 'scroll' }}>
        {promptMessages.map((message, index) => (
          <PromptMessage {...{"message": message, "handleDelete": ()=>{handleDeleteMessage(index)}, "handleInputChange": (value)=>{handlePromptInputChange(index, value)}}} key={index} />
        ))}
      </div>
      <button onClick={handleAdd} className="plus-button">+</button>
      <div className="button-group">
        <button onClick={handleSave} className="save-button">
          Save
        </button>
        <button onClick={handleClose} className="close-button">
          Close
        </button>
      </div>
    </div>
  );
};

export default PromptsEditor;