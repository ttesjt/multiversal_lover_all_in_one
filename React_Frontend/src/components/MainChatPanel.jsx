import React, { useState, useContext } from 'react';
import Messages from './Messages';
import CharacterCreation from './CharacterCreation';
import CharacterEditingPanel from './CharacterEditingPanel';
import Input from './Input';
import EmptyPanel from './EmptyPanel';
import { SystemOperationsContext } from '../context/SystemRunnerContext';

const MainChatPanel = (props) => {
  const [panel_index, set_panel_index] = useState(0);
  const { system_operations } = useContext(SystemOperationsContext);
  system_operations.set_main_chat_panel = set_panel_index

  const handle_click = () => {
    console.log("clicked")
    // system_operations.unselect_all_messages();
  }

  const renderPanel = (index) => {
    switch (index) {
      case 0:
        return <EmptyPanel />;
      case 1:
        return (
          <>
            <Messages/>
            <Input />
          </>
        );
      case 2:
        return <CharacterCreation {...props} />;
      case 3:
        return <CharacterEditingPanel {...props} />;
      default:
        return <EmptyPanel />;
    }
  };

  return <>{renderPanel(panel_index)}</>;
};

export default MainChatPanel;