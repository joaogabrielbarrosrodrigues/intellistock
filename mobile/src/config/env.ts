/// <reference types="expo/types" />

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_URL = (configuredApiUrl || "http://localhost:8080").replace(/\/$/, "");

export const appConfig = {
  apiUrl: API_URL,
  requestTimeoutMs: 15000
} as const;
