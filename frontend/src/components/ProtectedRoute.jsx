// ProtectedRoute.jsx

import { Navigate } from "react-router-dom";


function ProtectedRoute({ children }) {

  /*
    Check whether an access token exists.

    If it doesn't exist, the user isn't logged in.
  */
  const token = localStorage.getItem("accessToken");


  /*
    No token → send the user to login.
  */
  if (!token) {
    return <Navigate to="/login" replace />;
  }


  /*
    Token exists → allow the requested page.
  */
  return children;
}


export default ProtectedRoute;