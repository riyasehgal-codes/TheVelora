// auth.js

/*
  Remove the JWT tokens from the browser.
  After this, the user is effectively logged out.
*/
export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};