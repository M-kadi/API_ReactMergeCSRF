import React, { createContext, useContext, useState } from 'react';
import { bffFetch, ensureCsrf } from './lib/bffClient';

const AuthCtx = createContext();
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  async function login(username, password) {
    const r = await bffFetch('/bff/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (!r.ok) return false;

    await ensureCsrf();                 // <-- get CSRF right after login
    const me = await bffFetch('/bff/whoami', { method: 'GET' });
    if (me.ok) setUser(await me.json());
    return true;
  }

  async function logout() {
    await bffFetch('/bff/logout', { method: 'POST' });
    setUser(null);
  }

  const value = { user, login, logout };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
