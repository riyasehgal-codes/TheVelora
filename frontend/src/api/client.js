import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
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