"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography, Tag, Spin, Button } from "antd";
import { ArrowLeftOutlined, CalendarOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params || {};
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${id}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load');
        setPost(data.post);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPost();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="blog-page">
        <div className="blog-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="blog-page">
        <div className="blog-container">
          <Button type="text" onClick={() => router.back()} icon={<ArrowLeftOutlined />}>Back</Button>
          <Title level={3}>Post not found</Title>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page">
      <div className="blog-container">
        <Button type="text" onClick={() => router.push('/blogs')} icon={<ArrowLeftOutlined />}>Back to Blogs</Button>

        <div style={{ marginTop: '1rem' }}>
          <Title>{post.title}</Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <CalendarOutlined style={{ color: 'var(--text-muted)' }} />
            <Text className="meta-text">{formatDate(post.createdAt)}</Text>
            {post.tags?.map((t) => (
              <Tag key={t} className="article-tag">{t}</Tag>
            ))}
          </div>

          {post.coverImage && (
            <div style={{ margin: '16px 0' }}>
              <img src={post.coverImage} alt={post.title} style={{ width: '100%', borderRadius: 12 }} />
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </div>
      </div>
    </div>
  );
}


