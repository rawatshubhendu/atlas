"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Card, Typography, Upload, Avatar, message, Space } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { getCurrentUser } from "../../lib/auth";

const { Title, Text } = Typography;

export default function UserSettingsPage() {
  const [form] = Form.useForm();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const router = useRouter();

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);
    setAvatarUrl(u?.avatar || "");
    form.setFieldsValue({
      name: u?.name || "",
      email: u?.email || ""
    });
  }, [router, form]);

  const handleUpload = async ({ file }) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data.message || "Upload failed");
      setAvatarUrl(data.url);
      message.success("Avatar uploaded");
    } catch (e) {
      console.error(e);
      message.error(e.message || "Upload failed");
    }
  };

  const onSave = async (values) => {
    try {
      setSaving(true);
      const payload = {
        currentEmail: user.email,
        name: values.name,
        email: values.email,
        avatar: avatarUrl || null,
        password: values.password || undefined,
      };
      const res = await fetch("/api/users/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Update failed");

      // Update local storage user so UI reflects changes immediately
      const updatedUser = { ...(user || {}), name: data.user.name, email: data.user.email, avatar: data.user.avatar };
      localStorage.setItem("atlas_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      message.success("Profile updated");
    } catch (e) {
      console.error(e);
      message.error(e.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-main" style={{ padding: 24 }}>
      <Card className="card-surface" style={{ maxWidth: 720, margin: "0 auto" }}>
        <Space align="start" size="large" style={{ width: "100%", marginBottom: 16 }}>
          <Avatar size={64} src={avatarUrl || undefined} style={{ backgroundColor: 'var(--accent)' }}>
            {(user?.name || "U").charAt(0)}
          </Avatar>
          <div>
            <Title level={3} style={{ marginBottom: 0 }}>User Settings</Title>
            <Text type="secondary">Update your account information</Text>
          </div>
        </Space>

        <Form layout="vertical" form={form} onFinish={onSave}>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: "Please enter your name" }]}>
            <Input placeholder="Your name" />
          </Form.Item>

          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: "Please enter a valid email" }]}>
            <Input placeholder="you@example.com" />
          </Form.Item>

          <Form.Item label="New Password" name="password" extra="Leave blank to keep current password">
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Form.Item label="Avatar">
            <Upload accept="image/*" showUploadList={false} customRequest={handleUpload}>
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </Upload>
            {avatarUrl ? (
              <div style={{ marginTop: 12 }}>
                <img src={avatarUrl} alt="avatar" style={{ width: 96, height: 96, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--border)' }} />
              </div>
            ) : null}
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving} className="premium-button">Save Changes</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}


