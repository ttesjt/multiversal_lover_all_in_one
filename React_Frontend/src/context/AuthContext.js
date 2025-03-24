import { createContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export const AuthContext = createContext();


const fake_user = {
  "username": "the_tester",
  "user_id": "default",
  "avatar_url": "https://firebasestorage.googleapis.com/v0/b/chat2-32e4a.appspot.com/o/ttesjt1681034798431?alt=media&token=5f3c1570-9020-4725-b876-ea5808fded0b",
  "character_list": ["test_char"],
  "user_info": {
    "token_left": 2000,
    "join_time": Date.now()
  }
}


export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(fake_user);
    });

    return () => {
      unsub();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {/*console.log("the fake user is ", fake_user)*/}
      {children}
    </AuthContext.Provider>
  );
};
