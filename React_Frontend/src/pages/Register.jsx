import React, { useContext } from "react";
import { useState } from "react";
import Add from "../img/addAvatar.png";
import Default_Avatar from "../img/Default_Avatar.png";
import {UserSystem} from "../system_runner/system_runner"
import { SystemOperationsContext } from "../context/SystemRunnerContext";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [err, setErr] = useState(false);
  const [error_message, set_error_message] = useState("something went wrong");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { system_operations } = useContext(SystemOperationsContext);

  const handleSubmit = async (e) => {
    system_operations.set_loading(true);
    if (loading) {return;}
    setLoading(true);

    e.preventDefault();
    const displayName = e.target[0].value;
    const email = e.target[1].value;
    const password = e.target[2].value;
    let file = e.target[3].files[0];

    if (!file) {
      console.log("error file!!!")
      file = Default_Avatar
    }

    const userSystem = new UserSystem();
    const sign_up_json = userSystem.form_sign_up_json(email, password, displayName, file);
    const response = await userSystem.sign_up(sign_up_json)
    if (response["statusCode"] === 200) {
      // sucess
      system_operations.user_set_up(response["body"]) // this function is set earlier in system runner context.
      setLoading(false);
      system_operations.set_loading(false);
      navigate("/");
    } else {
      setErr(true);
      setLoading(false);
      system_operations.set_loading(false);
      set_error_message(response["message"]);
    }
  };

  return (
    <div className="formContainer">
      <div className="formWrapper">
        <span className="logo">Multiversal Lovers!</span>
        <span className="title">Register</span>
        <form onSubmit={handleSubmit}>
          <input required type="text" placeholder="display name" />
          <input required type="email" placeholder="email" />
          <input required type="password" placeholder="password" />
          <input style={{ display: "none" }} type="file" id="file" />
          <label htmlFor="file">
            <img src={Add} alt="" />
            <span>Add an avatar</span>
          </label>
          <button disabled={loading}>Sign up</button>
          {loading && "Uploading and compressing the image please wait..."}
          {err && <span>{error_message}</span>}
        </form>
        <p>
          You do have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
