import React from "react";
import Navbar from "./Navbar"
import Search from "./Search"
import Chats from "./Chats"
import TokenBar from "./TokenBar"

const Sidebar = (props) => {
  // const [openai_api_key, set_openai_api_key] = useState("");
  // const { system_operations } = useContext(SystemOperationsContext);
  // this.on_assign_openai_api_key
  return (
    <div className={props["desktop_mode"] ? "sidebar" : "sidebarMobile"}>
      <Navbar props = {props}/>
      <TokenBar/>
      <Search/>
      <Chats {...props}/>
    </div>
  );
};

export default Sidebar;
