import { createContext, useContext, useEffect } from "react";

type ThemeProviderContextType = {
  theme: "light";
  setTheme: (theme: string) => void;
};

const ThemeProviderContext = createContext<ThemeProviderContextType>({
  theme: "light",
  setTheme: () => null,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always force light mode — no dark mode allowed
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark", "system");
    root.classList.add("light");
    // Clear any stored theme preference
    localStorage.removeItem("al-mohandes-theme");
  }, []);

  return (
    <ThemeProviderContext.Provider value={{ theme: "light", setTheme: () => {} }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeProviderContext);
