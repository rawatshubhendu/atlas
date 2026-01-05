"use client";

import { useEffect, useState } from "react";

export default function PageLoader() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Wait for page to fully load
    const handleLoad = () => {
      // Small delay for smooth transition
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setLoading(false);
        }, 500); // Match fade-out duration
      }, 300);
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  if (!loading) return null;

  return (
    <div className={`page-loader ${fadeOut ? "fade-out" : ""}`}>
      <div className="loader-container">
        <div className="loader-logo">
          <div className="logo-circle">
            <div className="logo-inner"></div>
          </div>
          <h1 className="loader-title">Atlas</h1>
        </div>
        <div className="loader-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="loader-text">Loading your writing space...</p>
      </div>
    </div>
  );
}

