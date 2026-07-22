import { createContext, useContext, useEffect, useState } from "react";
import { api, setToken, getToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const res = await api("/auth/me");
        setUser(res.data);
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function login(email, password) {
    const res = await api("/auth/login", { method: "POST", body: { email, password } });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
