// app/page.js
"use client";

import { Layout } from "antd";
import dynamic from "next/dynamic";

// Lazy load components for better performance
const NavBar = dynamic(() => import("./components/Navbar"), {
  ssr: false,
  loading: () => <div className="navbar-placeholder" style={{ height: '64px', background: 'transparent' }} />,
});

const Hero = dynamic(() => import("./components/Hero"), {
  loading: () => <div className="hero-placeholder" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="loading-spinner" />
  </div>,
});

const PageLoader = dynamic(() => import("./components/PageLoader"));

export default function Home() {
  return (
    <>
      <PageLoader />
      <Layout className="home-layout" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <NavBar />
        <Layout.Content style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative"
        }}>
          <Hero />
        </Layout.Content>
        <Layout.Footer style={{
          textAlign: "center",
          background: "transparent",
          color: "var(--text-muted)",
          borderTop: "1px solid var(--border)",
          padding: "1rem"
        }}>
          © {new Date().getFullYear()} Atlas — Write. Publish. Be found.
        </Layout.Footer>
      </Layout>
    </>
  );
}
