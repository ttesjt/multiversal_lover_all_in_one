import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import {UserSystem} from "../system_runner/system_runner"
import { SystemOperationsContext } from "../context/SystemRunnerContext";
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { auth } from "../firebase"

const Login = () => {
  const [err, setErr] = useState(false);
  // const [user, setUser] = useState(null);
  const { system_operations } = useContext(SystemOperationsContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    system_operations.set_loading(true);
    e.preventDefault();
    const username = e.target[0].value;
    const password = e.target[1].value;

    const userSystem = new UserSystem();
    const response = await userSystem.sign_in(username, password)
    // console.log(response)
    let user = null;
    if (response["statusCode"] === 200) {
      user = response["body"]
      system_operations.user_set_up(user)
      // console.log(system_operations.system_runner)
      navigate("/")
    } else {
      setErr(true);
    }

    system_operations.set_loading(false);
    /* try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/")
    } catch (err) {
      setErr(true);
    }*/
  };
  return (
    <div className="formContainer">
      <div className="formWrapper">
        <span className="logo">Multiversal Lovers!</span>
        <span className="title">Login</span>
        <form onSubmit={handleSubmit}>
          {/*<input type="email" placeholder="email" />*/}
          <input defaultValue="" placeholder="email" />
          <input defaultValue="" type="password" placeholder="password" />
          <button>Sign in</button>
          {err && <span>Something went wrong</span>}
        </form>
        <p>You don't have an account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
};

export default Login;
