import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthContextProvider } from "./context/AuthContext";
import { SystemOperationsContextProvider } from "./context/SystemRunnerContext";
import { ChatContextProvider } from "./context/ChatContext";
import {UserSystem} from "./system_runner/system_runner"


const login = {
  "username": "ttesjt_demo",
  "password": "whateverisgood"
}

let user = null
let system_runner = null

async function initialization() {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  // const userSystem = new UserSystem();
  // user = (await userSystem.sign_in(login["username"], login["password"]))["body"]

  root.render(
    <AuthContextProvider>
      <ChatContextProvider>
        <SystemOperationsContextProvider>
          <React.StrictMode>
            <App />
          </React.StrictMode>
        </SystemOperationsContextProvider>
      </ChatContextProvider>
    </AuthContextProvider>
  );
}

initialization()