"use client";

import { Button } from "antd";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  return (
    <section className="hero-section">
      <h1 className="hero-title">Atlas</h1>
      <h2 className="hero-subtitle">A modern home for your writing</h2>
      <div className="hero-actions">
        <Button
          type="primary"
          size="large"
          onClick={() => router.push("/signup")}
        >
          Get Started
        </Button>
        <Button 
          type="default" 
          size="large" 
          onClick={() => router.push("/blogs")}
          style={{ border: "1px solid var(--border)" }}
        >
          Explore Blogs
        </Button>
      </div>
    </section>
  );
}
