import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "./api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // /users/me: o'zim, skinlari to'liq (populate) bilan
  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return null;
    }
    try {
      const me = await api("/users/me");
      setUser(me);
      return me;
    } catch (e) {
      if (e.status === 401 || e.status === 403) setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, [refresh]);

  const login = useCallback(
    async (email, password) => {
      const r = await api("/users/login", { method: "POST", body: { email, password } });
      setToken(r.token);
      await refresh();
    },
    [refresh]
  );

  const register = useCallback(
    async (data) => {
      const r = await api("/users", { method: "POST", body: data });
      setToken(r.token);
      await refresh();
    },
    [refresh]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, refresh, login, register, logout }),
    [user, ready, refresh, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
