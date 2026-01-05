"use client";

import { useEffect, useState } from "react";
import { Typography, Input, List, Tag, Button, Space, Empty, Spin } from "antd";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/app/lib/auth";

export default function DashboardPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchPosts = async (search = "") => {
    try {
      const res = await fetch(`/api/posts?status=published&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed loading");
      setPosts(data.posts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) window.location.href = "/login";
    fetchPosts("");
  }, []);

  return (
    <div className="dashboard-main" style={{ marginLeft: 0, width: "100%", padding: 0 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div className="dashboard-header" style={{ marginBottom: 24 }}>
          <div className="header-left">
            <Typography.Title level={2} className="page-title" style={{ margin: 0 }}>Posts</Typography.Title>
            <Typography.Text className="breadcrumb">Dashboard / Posts</Typography.Text>
          </div>
        </div>

        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Input.Search
            placeholder="Search posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onSearch={(v) => fetchPosts(v)}
            enterButton
            allowClear
          />

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <Spin />
            </div>
          ) : posts.length === 0 ? (
            <Empty description="No posts yet" />
          ) : (
            <List
              dataSource={posts}
              itemLayout="vertical"
              renderItem={(item) => (
                <List.Item key={item._id} className="card-surface">
                  <List.Item.Meta
                    title={<Typography.Title level={4} style={{ margin: 0, color: "var(--text)" }}>{item.title}</Typography.Title>}
                    description={
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(item.tags || []).map((t) => (
                          <Tag key={t} color="green">{t}</Tag>
                        ))}
                        <span style={{ color: 'var(--text-subtle)' }}>
                          by {item.authorName || 'Anonymous'} • {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    }
                  />
                  <div style={{ color: 'var(--text-muted)' }} dangerouslySetInnerHTML={{ __html: item.content?.length > 600 ? item.content.slice(0, 600) + '…' : item.content }} />
                </List.Item>
              )}
            />
          )}
        </Space>
      </div>
    </div>
  );
}
