
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getAccessToken = () => {
  return (
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken")
  );
};

const getTokenStorage = () => {
  if (localStorage.getItem("refreshToken")) {
    return localStorage;
  }

  if (sessionStorage.getItem("refreshToken")) {
    return sessionStorage;
  }

  return null;
};

const clearAuthTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
};

let refreshPromise = null;

// Attach the access token to API requests.
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Automatically refresh expired access tokens.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    if (error.response.status !== 401) {
      return Promise.reject(error);
    }

    const excludedUrls = [
      "/login/",
      "/register/",
      "/token/refresh/",
      "/token/blacklist/",
    ];

    if (
      excludedUrls.some((url) =>
        originalRequest.url?.includes(url)
      ) ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    const storage = getTokenStorage();
    const refreshToken = storage?.getItem("refreshToken");

    if (!refreshToken) {
      clearAuthTokens();

      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(
            `${API_BASE_URL}/token/refresh/`,
            { refresh: refreshToken },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
          .then((response) => {
            const newAccessToken = response.data.access;

            storage.setItem("accessToken", newAccessToken);

            // SimpleJWT returns a new refresh token when rotation is enabled.
            if (response.data.refresh) {
              storage.setItem(
                "refreshToken",
                response.data.refresh
              );
            }

            return newAccessToken;
          })
          .catch((refreshError) => {
            clearAuthTokens();

            if (window.location.pathname !== "/login") {
              window.location.assign("/login");
            }

            throw refreshError;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

// ============================================================
// MARKET PRICE
// ============================================================

export const getMarketPrice = async (ticker) => {
  const response = await api.get(`/market-price/${ticker}/`);
  return response.data;
};

// ============================================================
// EXCHANGE RATE
// ============================================================

export const getExchangeRate = async (
  fromCurrency,
  toCurrency = "INR"
) => {
  const response = await api.get(
    `/exchange-rate/${fromCurrency}/${toCurrency}/`
  );

  return response.data;
};

// ============================================================
// HISTORICAL PRICES
// ============================================================

export const getHistoricalPrices = async (
  ticker,
  period = "1mo"
) => {
  const response = await api.get(
    `/historical-prices/${ticker}/`,
    {
      params: { period },
    }
  );

  return response.data;
};

// ============================================================
// FORECAST
// ============================================================

export const getForecast = async (ticker) => {
  const response = await api.get(`/forecast/${ticker}/`);
  return response.data;
};

// ============================================================
// NEWS
// ============================================================

export const getStockNews = async (ticker) => {
  const response = await api.get(`/news/${ticker}/`);
  return response.data;
};

// ============================================================
// ALERTS
// ============================================================

export const getAlerts = async () => {
  const response = await api.get("/alerts/");
  return response.data;
};

export const createAlert = async (alertData) => {
  const response = await api.post("/alerts/", alertData);
  return response.data;
};

export const deleteAlert = async (alertId) => {
  const response = await api.delete(`/alerts/${alertId}/`);
  return response.data;
};

export const checkAlerts = async () => {
  const response = await api.post("/alerts/check/");
  return response.data;
};

// ============================================================
// AI-3: PERSISTENT CHAT HISTORY
// ============================================================

export const getChatConversations = async () => {
  const response = await api.get("/chat/conversations/");
  return response.data;
};

export const createChatConversation = async (title = "New conversation") => {
  const response = await api.post("/chat/conversations/", {
    title,
  });

  return response.data;
};

export const getChatMessages = async (conversationId) => {
  const response = await api.get(
    `/chat/conversations/${conversationId}/messages/`
  );

  return response.data;
};

export const sendChatMessage = async (conversationId, content) => {
  const response = await api.post(
    `/chat/conversations/${conversationId}/messages/`,
    { content }
  );

  return response.data;
};

export const deleteChatConversation = async (conversationId) => {
  const response = await api.delete(
    `/chat/conversations/${conversationId}/`
  );

  return response.data;
};

// ============================================================
// EXPORT AXIOS INSTANCE
// ============================================================

export default api;
