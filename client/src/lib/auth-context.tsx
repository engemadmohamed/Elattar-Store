import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "./queryClient";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  admin: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("al-mohandes-token");
    if (!token) { setIsLoading(false); return; }
    apiRequest<Admin>("GET", "/api/auth/me")
      .then((data) => setAdmin(data))
      .catch(() => localStorage.removeItem("al-mohandes-token"))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ token: string; admin: Admin }>("POST", "/api/auth/login", { email, password });
    localStorage.setItem("al-mohandes-token", data.token);
    setAdmin(data.admin);
  };

  const logout = () => {
    localStorage.removeItem("al-mohandes-token");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: !!admin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
