// components/ThemeProvider.jsx
"use client";

// compatibility patch for React 19 + antd (if you installed it)
try {
  require('@ant-design/v5-patch-for-react-19');
} catch (e) {
  // ignore if not installed / SSR safe
}

import React, { createContext, useContext, useEffect, useState } from "react";
import { ConfigProvider } from "antd";

const ThemeContext = createContext({
  theme: "dark",
  setTheme: () => {}
});

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * ThemeProvider with Ant Design ConfigProvider
 * - default is "dark" (server layout set data-theme="dark")
 * - reads localStorage and applies saved theme
 * - provides theme and setTheme to children
 * - wraps children with Ant Design ConfigProvider
 */
export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark"); // Always start with dark
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize theme on mount (client-side only)
  useEffect(() => {
    // Prevent hydration mismatch by only running on client
    const initializeTheme = () => {
    try {
      const saved = localStorage.getItem("atlas-theme");
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
      }
        // Always ensure document has the correct theme
        document.documentElement.setAttribute("data-theme", saved || "dark");
    } catch (e) {
      // Fallback to dark if localStorage fails
      document.documentElement.setAttribute("data-theme", "dark");
    }
      setIsHydrated(true);
    };

    initializeTheme();
  }, []); // run once on mount

  // Whenever theme changes, persist and apply to document
  useEffect(() => {
    if (isHydrated) {
    try { localStorage.setItem("atlas-theme", theme); } catch (e) {}
    document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme, isHydrated]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#10b981",
            borderRadius: 8,
          },
          cssVar: {
            prefix: 'atlas',
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
