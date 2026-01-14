"use client";

import ThemeProvider from "./Themeprovider";

/**
 * Client-side Providers Wrapper
 * This component wraps all client-side providers
 * Used in the root layout to avoid import issues
 */
export default function ClientProviders({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
