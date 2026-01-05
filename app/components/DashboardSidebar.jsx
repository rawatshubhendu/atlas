"use client";

import React, { useState } from "react";
import { Layout, Menu, Avatar, Typography, Space, Switch, Tooltip, Button } from "antd";
import { 
  DashboardOutlined, 
  UserOutlined, 
  FileTextOutlined, 
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTheme } from "./Themeprovider";
import { signOut } from "../lib/auth";

const { Sider } = Layout;
const { Text } = Typography;

export default function DashboardSidebar({ user, onLogout, onCollapse, currentView, onViewChange }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const onToggle = (checked) => {
    const newTheme = checked ? "light" : "dark";
    setTheme(newTheme);
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const handleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onCollapse?.(newCollapsed);
  };

  // Generate user initials
  const getUserInitials = (name) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const handleMenuClick = (key) => {
    if (key === 'dashboard' || key === 'posts' || key === 'settings') {
      onViewChange?.(key);
    }
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => handleMenuClick('dashboard')
    },
    {
      key: 'posts',
      icon: <FileTextOutlined />,
      label: 'Posts',
      onClick: () => handleMenuClick('posts')
    },
    {
      key: 'settings',
      icon: <UserOutlined />,
      label: 'User Settings',
      onClick: () => handleMenuClick('settings')
    }
  ];

  return (
    <Sider 
      width={280}
      collapsedWidth={80}
      collapsed={collapsed}
      className="exotic-sidebar"
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Collapse Button */}
      <div className="sidebar-toggle">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={handleCollapse}
          className="toggle-btn"
        />
      </div>

      {/* Brand Section */}
      <div className="sidebar-brand-section">
        {!collapsed ? (
          <div className="brand-container">
            <div className="brand-logo">
              <div className="logo-icon">A</div>
            </div>
            <div className="brand-text">
              <span className="brand-name">Atlas</span>
              <span className="brand-dot">.</span>
            </div>
          </div>
        ) : (
          <div className="brand-collapsed">
            <div className="logo-icon">A</div>
          </div>
        )}
      </div>

      {/* User Section */}
      <div className="sidebar-user-section">
        <div className="user-container">
          <div className="user-avatar">
            <Avatar size={collapsed ? 32 : 40} className="user-avatar-img" src={user?.avatar || undefined}>
              {getUserInitials(user?.name)}
            </Avatar>
            {!collapsed && <div className="user-status"></div>}
          </div>
          {!collapsed && (
            <div className="user-details">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        <Menu
          mode="inline"
          selectedKeys={[currentView]}
          inlineCollapsed={collapsed}
          className="nav-menu"
          items={menuItems}
        />
      </div>

      {/* Theme Toggle */}
      <div className="sidebar-theme">
        {!collapsed && (
          <div className="theme-container">
            <div className="theme-label">Theme</div>
            <Switch
              checked={theme === "light"}
              onChange={onToggle}
              checkedChildren={<SunOutlined />}
              unCheckedChildren={<MoonOutlined />}
              className="dashboard-theme-switch"
            />
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="sidebar-actions">
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          className="logout-btn"
        >
          {!collapsed && 'Logout'}
        </Button>
      </div>
    </Sider>
  );
}
