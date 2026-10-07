// client.js

import axios from "axios";


/*
  Create one Axios instance for
  communicating with Django.
*/
const api = axios.create({

  baseURL:
    "http://127.0.0.1:8000/api",

  headers: {
    "Content-Type":
      "application/json",
  },

});


/*
  Automatically attach the JWT access
  token to authenticated requests.
*/
api.interceptors.request.use(

  (config) => {

    const token =
      localStorage.getItem(
        "accessToken"
      );


    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;

    }


    return config;

  },

  (error) => {

    return Promise.reject(error);

  }

);


/*
  Get the latest market price
  of a stock.
*/
export const getMarketPrice = async (
  ticker
) => {

  const response = await api.get(
    `/market-price/${ticker}/`
  );


  return response.data;

};


/*
  Get the exchange rate between
  two currencies.
*/
export const getExchangeRate = async (
  fromCurrency,
  toCurrency = "INR"
) => {

  const response = await api.get(
    `/exchange-rate/${fromCurrency}/${toCurrency}/`
  );


  return response.data;

};

export const getHistoricalPrices = async (
  ticker,
  period = "1mo"
) => {

  const response = await api.get(
    `/historical-prices/${ticker}/`,
    {
      params: {
        period: period,
      },
    }
  );

  return response.data;
};


export default api;

export const getForecast = async (
  ticker
) => {

  const response = await api.get(
    `/forecast/${ticker}/`
  );

  return response.data;

};