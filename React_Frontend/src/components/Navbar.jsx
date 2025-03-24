import React, { useContext, useRef } from 'react'
import {signOut} from "firebase/auth"
import { auth } from '../firebase'
import { AuthContext } from '../context/AuthContext'
import { SystemOperationsContext } from '../context/SystemRunnerContext';
import Add from "../img/add.png";

const Navbar = (props) => {
  const {currentUser} = useContext(AuthContext)
  const { system_operations } = useContext(SystemOperationsContext);

  const openai_api_key = useRef("")

  const handleCharacterCreation = () => {
    system_operations.set_main_chat_panel(2);
  };

  const save_api_key = () => {
    system_operations.assign_api_key(openai_api_key.current);
  }

  const openai_api_key_on_change = (value) => {
    openai_api_key.current = value;
  }

  const handle_get_api_key = () => {
    system_operations.show_pop_up("input", "Enter Your API Key. Empty means no API key.", save_api_key, () => {}, openai_api_key_on_change, system_operations.api_key);
  }

  return (
    <div className='navbar'>
      <span className="logo">Multiversal Lovers!</span>
      <div className="user">
        <button onClick={handle_get_api_key}>API</button>
        <img src={Add} onClick={()=>{handleCharacterCreation()}}className="navbar_icon" alt="" />
        <button className="logout" onClick={()=>{system_operations.reset_user()}}>logout</button>
        <p className="statements">This is a test demo of multiversal-dating. No comercial purposes. Credits to "Lama Dev" for providing the chat app starter platform.</p>
      </div>
    </div>
  )
}

export default Navbar