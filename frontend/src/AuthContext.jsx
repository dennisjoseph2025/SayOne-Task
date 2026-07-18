import { createContext, useContext, useState, useEffect } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    if (token && username) {
      setUser({ token, username });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await api.post("/auth/login/", { username, password });
    const { token } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    setUser({ token, username });
    return res.data;
  };

  const register = async (username, password) => {
    const res = await api.post("/auth/register/", { username, password });
    const { token } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    setUser({ token, username });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
