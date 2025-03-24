import React, { useState, useEffect, useContext } from "react";
import { SystemOperationsContext } from "../context/SystemRunnerContext";
// import "./styles/TokenBar.scss";

const total_token = 100000;

const TokenBar = () => {
  const { system_operations } = useContext(SystemOperationsContext);
  const [token_remaining, setTokenRemaining] = useState(system_operations.system_runner.token_left);

  useEffect(() => {
    // Simulate token consumption
    const interval = setInterval(() => {
      setTokenRemaining(system_operations.system_runner.token_left);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const percentage = (token_remaining / total_token) * 100;

  return (
    <div className="fill-center-container">
      <div className="fill-bar-container">
        <div
          className="fill-bar"
          style={{
            width: `${percentage}%`,
            backgroundColor: `rgba(${255 - percentage * 2.55}, ${
              percentage * 2.55
            }, 0)`,
          }}
        ></div>
      </div>
    </div>
  );
};

export default TokenBar;