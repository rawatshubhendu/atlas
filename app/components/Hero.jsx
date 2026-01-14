"use client";

import { Button } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Hero() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="hero-section">
        <h1 className="hero-title">Atlas</h1>
        <h2 className="hero-subtitle">A modern home for your writing</h2>
        <div className="hero-actions">
          <div style={{ 
            display: 'inline-block', 
            padding: '12px 32px', 
            fontSize: '16px',
            borderRadius: '8px',
            background: 'var(--accent)',
            color: 'white',
            cursor: 'pointer'
          }}>Get Started</div>
          <div style={{ 
            display: 'inline-block', 
            padding: '12px 32px', 
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            cursor: 'pointer'
          }}>Explore Blogs</div>
        </div>
      </section>
    );
  }

  return (
    <section className="hero-section" suppressHydrationWarning>
      <h1 className="hero-title">Atlas</h1>
      <h2 className="hero-subtitle">A modern home for your writing</h2>
      <div className="hero-actions">
        <Button
          type="primary"
          size="large"
          onClick={() => router.push("/signup")}
          className="hero-btn-primary"
        >
          Get Started
        </Button>
        <Button 
          type="default" 
          size="large" 
          onClick={() => router.push("/blogs")}
          className="hero-btn-default"
          style={{ border: "1px solid var(--border)" }}
        >
          Explore Blogs
        </Button>
      </div>
    </section>
  );
}
