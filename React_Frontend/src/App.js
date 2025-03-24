import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LoadingScene from "./components/LoadingScene";
import "./style.scss";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext, useState } from "react";
import { SystemOperationsContext } from "./context/SystemRunnerContext";

// leaving it here to prevent being refreshed.
let loading_count = 0

function App() {
  const { system_operations } = useContext(SystemOperationsContext);
  const [is_loading, set_is_loading] = useState(false);

  const set_loading = (loading) => {
    if (loading) {
      loading_count += 1;
    } else {
      loading_count -= 1;
    }

    if (loading_count > 0) {
      set_is_loading(true)
    } else {
      set_is_loading(false)
    }
  }
  system_operations.set_loading = set_loading;

  const ProtectedRoute = ({ children }) => {
    if (!system_operations.system_runner) {
      return <Navigate to="/login" />;
    }

    return children
  };
  
  return (
    <BrowserRouter>
      {is_loading > 0 && <LoadingScene />}
      <Routes>
        <Route path="/">
          <Route
            index
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          {/*console.log("the current user is ", currentUser)*/}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
