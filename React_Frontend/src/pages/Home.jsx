import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar'
import Chat from '../components/Chat'
import { SystemOperationsContext } from "../context/SystemRunnerContext";
import PromptsEditor from '../components/PromptsEditor'
import PumpUpWindow from '../components/PumpUpWindow'

const Home = () => {
  const [showPromptsEditor, setShowPromptsEditor] = useState(false);
  const [on_sidebar, set_on_sidebar] = useState(true);
  const [has_pop_up, set_has_pop_up] = useState(false);
  const [pop_up_props, set_pop_up_props] = useState({
    "isOpen": true,
    "isConfirmation": true,
    "message": "Warning",
    "onConfirm": () => {},
    "onCancel": () => {}
  });
  const [desktop_mode, set_desktop_mode] = useState(window.innerWidth >= 800);

  const { system_operations } = useContext(SystemOperationsContext);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 800) {
        set_desktop_mode(false);
      } else {
        set_desktop_mode(true);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);


  const handlePromptsEditor = (value) => {
    if (value === true && !system_operations.system_runner.current_character_runner) {
      return;     // if is going to set to true, but there is no current character runner, then dump the task
    }
    setShowPromptsEditor(value);
  };

  system_operations.show_pop_up = (type, message, onConfirm, onCancel, onInputChange = (nothing) => {}, default_input_value = "") => {
    const new_pop_up_props = {
      "isOpen": true,
      "type": type,
      "message": message,
      "onInputChange": onInputChange,
      "default_input_value": default_input_value,
      "onConfirm": () => {
        onConfirm();
        set_has_pop_up(false);
      },
      "onCancel": () => {
        onCancel();
        set_has_pop_up(false);
      }
    }

    set_pop_up_props(new_pop_up_props)
    set_has_pop_up(true);
  }

  const utility_props = {
    "handlePromptsEditorOpen": () => { handlePromptsEditor(true); },
    "set_on_sidebar": (value) => { set_on_sidebar(value);},
    "desktop_mode": desktop_mode
  };

  return (
    <div className='home'>
      <div className="container">
        {has_pop_up && <PumpUpWindow {...pop_up_props}/>}
        {/*showPromptsEditor && <PromptsEditor handleClose={() => {handlePromptsEditor(false)}} />*/}
        {desktop_mode ? (
          <>
            <Sidebar {...utility_props} />
            <Chat {...utility_props} />
          </>
        ) : on_sidebar ? (
          <Sidebar {...utility_props} />
        ) : (
          <Chat {...utility_props} />
        )}
      </div>
    </div>
  )
}

export default Home