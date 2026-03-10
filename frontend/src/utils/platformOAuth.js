import axios from 'axios';
import { API_URL } from '../config/api';

const oauthStartLocks = new Set();

const START_ENDPOINTS = {
  steam: '/api/auth/steam/start'
};

const UNLINK_ENDPOINTS = {
  steam: '/api/auth/steam'
};

const resolveEndpoint = (map, provider) => {
  const endpoint = map[String(provider || '').trim().toLowerCase()];
  if (!endpoint) {
    throw new Error(`Proveedor OAuth no soportado: ${provider}`);
  }
  return `${API_URL}${endpoint}`;
};

export const startPlatformOAuth = async (provider) => {
  const normalizedProvider = String(provider || '').trim().toLowerCase();
  if (oauthStartLocks.has(normalizedProvider)) {
    return;
  }

  oauthStartLocks.add(normalizedProvider);

  try {
    const response = await axios.post(resolveEndpoint(START_ENDPOINTS, normalizedProvider));
    const authorizeUrl = String(response?.data?.authorizeUrl || '').trim();

    if (!authorizeUrl) {
      throw new Error('El proveedor no devolvió una URL de autorización válida.');
    }

    window.location.assign(authorizeUrl);
  } catch (error) {
    oauthStartLocks.delete(normalizedProvider);
    throw error;
  }
};

export const unlinkPlatformOAuth = async (provider) => {
  await axios.delete(resolveEndpoint(UNLINK_ENDPOINTS, provider));
};
