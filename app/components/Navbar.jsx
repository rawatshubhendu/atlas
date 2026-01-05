"use client";

import React, { useState, useEffect } from "react";
import { Button, Space, Tooltip, Avatar, Dropdown, Menu, Switch } from "antd";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "./Themeprovider";
import { SunOutlined, MoonOutlined, MenuOutlined, CloseOutlined, HomeOutlined, ReadOutlined, LoginOutlined, UserAddOutlined } from "@ant-design/icons";
import Link from "next/link";

const NavBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state after component mounts
  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.mobile-menu') && !event.target.closest('.mobile-menu-button')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isActive = (path) => pathname === path;

  if (!isMounted) {
    return (
      <div
        className="navbar-placeholder"
        style={{ height: "64px", background: "transparent" }}
      />
    );
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header">
        <button
          className="mobile-menu-button"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={closeMobileMenu}
      />

      {/* Mobile Menu */}
      <nav className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <button
          className="mobile-menu-close"
          onClick={closeMobileMenu}
          aria-label="Close menu"
        >
          <CloseOutlined />
        </button>
        <div className="mobile-menu-content">
          <div className="mobile-menu-nav">
            <Link
              href="/"
              className={`mobile-menu-link ${isActive('/') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <HomeOutlined className="mobile-menu-icon" />
              <span>Home</span>
            </Link>
            <Link
              href="/blogs"
              className={`mobile-menu-link ${isActive('/blogs') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <ReadOutlined className="mobile-menu-icon" />
              <span>Blogs</span>
            </Link>
            <Link
              href="/login"
              className={`mobile-menu-link ${isActive('/login') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <LoginOutlined className="mobile-menu-icon" />
              <span>Login</span>
            </Link>
            <Link
              href="/signup"
              className={`mobile-menu-link ${isActive('/signup') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <UserAddOutlined className="mobile-menu-icon" />
              <span>Sign Up</span>
            </Link>
          </div>

          <div className="mobile-menu-footer">
            <div className="mobile-theme-toggle" aria-label="Toggle theme">
              <span>{theme === "dark" ? "Dark" : "Light"}</span>
              <Switch
                checked={theme === "dark"}
                onChange={(checked) => setTheme(checked ? "dark" : "light")}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Desktop Navbar */}
      <header className={`glass-navbar ${isScrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <Link href="/" className="nav-brand">
            Atlas
          </Link>

          <div className="nav-links">
            <Button
              type="text"
              onClick={() => router.push("/")}
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              Home
            </Button>
            <Button
              type="text"
              onClick={() => router.push("/blogs")}
              className={`nav-link ${isActive('/blogs') ? 'active' : ''}`}
            >
              Blogs
            </Button>
            <Button
              type="text"
              onClick={() => router.push("/login")}
              className={`nav-link ${isActive('/login') ? 'active' : ''}`}
            >
              Login
            </Button>
            <Button
              type="primary"
              onClick={() => router.push("/signup")}
              className="signup-btn"
            >
              Sign Up
            </Button>
            <Tooltip
              title={theme === "dark" ? "Light Mode" : "Dark Mode"}
              placement="bottom"
            >
              <Button
                type="text"
                icon={theme === "dark" ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                className="theme-toggle"
              />
            </Tooltip>
          </div>
        </div>
      </header>
    </>
  );
};

export default NavBar;
