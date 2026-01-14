"use client";

import ThemeProvider from "./components/Themeprovider";

export default function Template({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
