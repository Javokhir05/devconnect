import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // restore the session on page load
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const startSession = ({ token, user }) => {
    localStorage.setItem("token", token);
    setUser(user);
  };

  const login = async (email, password) =>
    startSession((await api.post("/auth/login", { email, password })).data);

  const register = async (username, email, password) =>
    startSession((await api.post("/auth/register", { username, email, password })).data);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };
  const updateUser = (patch) => setUser((u) => ({ ...u, ...patch }));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);