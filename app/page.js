// app/page.js
"use client";

import { Layout } from "antd";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Lazy load components for better performance
const NavBar = dynamic(() => import("./components/Navbar"), {
  ssr: false,
  loading: () => <div className="navbar-placeholder" style={{ height: '64px', background: 'transparent' }} />,
});

const Hero = dynamic(() => import("./components/Hero"), {
  ssr: false,
  loading: () => <div className="hero-placeholder" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="loading-spinner" />
  </div>,
});

const PageLoader = dynamic(() => import("./components/PageLoader"), {
  ssr: false,
});

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by using consistent year
  if (!mounted) {
    return (
      <Layout className="home-layout" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div className="navbar-placeholder" style={{ height: '64px', background: 'transparent' }} />
        <Layout.Content style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative"
        }}>
          <div className="hero-placeholder" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loading-spinner" />
          </div>
        </Layout.Content>
        <Layout.Footer style={{
          textAlign: "center",
          background: "transparent",
          color: "var(--text-muted)",
          borderTop: "1px solid var(--border)",
          padding: "1rem"
        }}>
          © {currentYear} Atlas — Write. Publish. Be found.
        </Layout.Footer>
      </Layout>
    );
  }

  return (
    <>
      <PageLoader />
      <Layout className="home-layout" style={{ minHeight: "100vh", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }} suppressHydrationWarning>
        <NavBar />
        <Layout.Content style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden"
        }} suppressHydrationWarning>
          <Hero />
        </Layout.Content>
        <Layout.Footer style={{
          textAlign: "center",
          background: "transparent",
          color: "var(--text-muted)",
          borderTop: "1px solid var(--border)",
          padding: "1rem",
          flexShrink: 0
        }} suppressHydrationWarning>
          © {currentYear} Atlas — Write. Publish. Be found.
        </Layout.Footer>
      </Layout>
    </>
  );
}
