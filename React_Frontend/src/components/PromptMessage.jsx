import React, { useState } from 'react';

const PromptMessage = (props) => {
  const [value, setValue] = useState(props["message"]["content"]);

  function handleInputChange(event) {
    setValue(event.target.value)
    props.handleInputChange(event.target.value)
  }

  function handleRoleChange(event) {
    props.handleRoleChange(event.target.value)
  }

  return (
    <div className="prompt-message">
      <button onClick={props.handleDelete} className="delete-button">x</button>
      <select className="message-type" onChange={handleRoleChange} defaultValue = {props["message"]["role"]}>
        <option value="user">User</option>
        <option value="assistant">Assistant</option>
        <option value="system">System</option>
      </select>
      <input
        className="message-input"
        type="text"
        value={value}
        placeholder="Type your message here"
        onChange={handleInputChange}
      />
    </div>
  );
};

export default PromptMessage;