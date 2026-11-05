
import api from "../api/client";

export const saveAuthTokens = (tokens, rememberMe = true) => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");

  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");

  const storage = rememberMe ? localStorage : sessionStorage;

  storage.setItem("accessToken", tokens.access);
  storage.setItem("refreshToken", tokens.refresh);
};

export const logout = async () => {
  const refreshToken =
    localStorage.getItem("refreshToken") ||
    sessionStorage.getItem("refreshToken");

  // Clear tokens immediately.
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");

  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");

  // Blacklist the refresh token on the backend.
  if (refreshToken) {
    try {
      await api.post("/token/blacklist/", {
        refresh: refreshToken,
      });
    } catch (error) {
      console.error("Token blacklist error:", error);
    }
  }
};
