import React from "react";

const PumpUpWindow = (props) => {
  if (!props.isOpen) return null;

  const handleConfirm = () => {
    console.log(props)
    props.onConfirm();
  };

  const handleCancel = () => {
    props.onCancel();
  };

  const handleInputChange = (e) => {
    props.onInputChange(e.target.value);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4>{props.message}</h4>
        {props.type === "confirmation" && (
          <div className="modal-actions">
            <button onClick={handleConfirm}>Yes</button>
            <button onClick={handleCancel}>No</button>
          </div>
        )}
        {props.type === "warning" && (
          <button onClick={handleConfirm}>OK</button>
        )}
        {props.type === "input" && (
          <div className="modal-actions">
            <input type="text" onChange={handleInputChange} defaultValue = {props.default_input_value? props.default_input_value : ""}/>
            <button onClick={handleConfirm}>Yes</button>
            <button onClick={handleCancel}>No</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PumpUpWindow;