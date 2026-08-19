import { API_BASE_URL } from '../config/api';

const API_BASE = API_BASE_URL;

export const register = async ({ email, password, name }) => {
  const resp = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  if (!resp.ok) {
    const error = await resp.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(error.message || 'Registration failed');
  }

  return resp.json();
};

export const login = async ({ email, password }) => {
  const resp = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!resp.ok) {
    const error = await resp.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Invalid credentials');
  }

  return resp.json();
};
