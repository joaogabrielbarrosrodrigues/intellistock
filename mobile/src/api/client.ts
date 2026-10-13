import axios from "axios";
import { appConfig } from "../config/env";

export const API_URL = appConfig.apiUrl;

export const api = axios.create({
  baseURL: API_URL,
  timeout: appConfig.requestTimeoutMs,
  headers: {
    "Content-Type": "application/json"
  }
});

let unauthorizedHandler: (() => void) | undefined;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) unauthorizedHandler?.();
    return Promise.reject(error);
  }
);

export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = undefined;
  };
}

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}
