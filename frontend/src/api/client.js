// client.js

import axios from "axios";


/*
  Create one Axios instance for communicating
  with our Django backend.
*/
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",

  headers: {
    "Content-Type": "application/json",
  },
});


/*
  Axios interceptor

  Before every request, we check whether the user
  has an access token stored in the browser.

  If a token exists, we attach it to the request.

  This means we don't have to manually write:

  Authorization: Bearer <token>

  every single time.
*/
api.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


export default api;