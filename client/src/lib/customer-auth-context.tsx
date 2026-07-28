import { createContext, useContext, useState, useEffect } from "react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signup: (name: string, email: string, phone: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = "el-attar-customer-token";

const CustomerAuthContext = createContext<CustomerAuthContextType>({
  customer: null,
  isAuthenticated: false,
  isLoading: true,
  signup: async () => {},
  login: async () => {},
  logout: () => {},
});

async function customerRequest<T>(method: string, url: string, data?: unknown): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["X-Customer-Token"] = token;

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "حدث خطأ" }));
    throw new Error(error.message || "حدث خطأ");
  }
  return res.json();
}

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setIsLoading(false); return; }
    customerRequest<Customer>("GET", "/api/customer-auth/me")
      .then((data) => setCustomer(data))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  const signup = async (name: string, email: string, phone: string, password: string) => {
    const data = await customerRequest<{ token: string; customer: Customer }>(
      "POST",
      "/api/customer-auth/signup",
      { name, email, phone, password }
    );
    localStorage.setItem(TOKEN_KEY, data.token);
    setCustomer(data.customer);
  };

  const login = async (email: string, password: string) => {
    const data = await customerRequest<{ token: string; customer: Customer }>(
      "POST",
      "/api/customer-auth/login",
      { email, password }
    );
    localStorage.setItem(TOKEN_KEY, data.token);
    setCustomer(data.customer);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setCustomer(null);
  };

  return (
    <CustomerAuthContext.Provider
      value={{ customer, isAuthenticated: !!customer, isLoading, signup, login, logout }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export const useCustomerAuth = () => useContext(CustomerAuthContext);
