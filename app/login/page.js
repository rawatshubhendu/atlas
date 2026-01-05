"use client";

import { useState } from "react";
import { Layout, Form, Input, Button, Card, Divider, message } from "antd";
import { MailOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { signIn, signInWithGoogle } from "../lib/auth";

const NavBar = dynamic(() => import("../components/Navbar"), {
  ssr: false,
  loading: () => (
    <div
      className="navbar-placeholder"
      style={{ height: "64px", background: "transparent" }}
    />
  ),
});

const { Content } = Layout;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await signIn(values.email, values.password);
      if (result.success) {
        message.success("Welcome back!");
        router.push("/dashboard");
      } else {
        message.error(result.error || "Login failed");
      }
    } catch (error) {
      message.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignin = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      message.error("Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <NavBar />
      <div className="auth-background"></div>
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
      
      <Content style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        padding: "1rem",
        position: "relative",
        zIndex: 2,
        minHeight: "calc(100vh - 120px)",
        marginTop: "100px",
        flex: 1
      }}>
        <Card className="auth-card" style={{ 
          width: "100%", 
          maxWidth: "500px",
          padding: "2rem",
          border: "none",
          boxShadow: "none"
        }}>
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back</h1>
          </div>

          <Form form={form} name="login" onFinish={onFinish} layout="vertical" requiredMark={false} size="large">
            <Form.Item
              name="email"
              label={<span style={{ color: "var(--text)", fontWeight: 600, fontSize: "14px" }}>Email Address</span>}
              rules={[{ required: true, message: "Please enter your email" }, { type: "email", message: "Invalid email" }]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter your email address"
                className="premium-input"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ color: "var(--text)", fontWeight: 600, fontSize: "14px" }}>Password</span>}
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                className="premium-input"
                size="large"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: "1rem" }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading} 
                block 
                className="premium-button"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-divider">
            <span>Or continue with</span>
          </div>

          <Button
            onClick={handleGoogleSignin}
            loading={googleLoading}
            block
            className="google-button"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "15px" }}>
              Don&apos;t have an account?{" "}
              <a 
                className="auth-link"
                onClick={() => router.push("/signup")}
                style={{ cursor: "pointer" }}
              >
                Sign up
              </a>
            </p>
          </div>
        </Card>
      </Content>
    </div>
  );
}
