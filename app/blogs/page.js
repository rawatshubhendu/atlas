"use client";

import { useEffect, useState } from "react";
import { Button, Spin, Avatar, Switch, Tooltip } from "antd";
import { SearchOutlined, EditOutlined, CalendarOutlined, UserOutlined, SunOutlined, MoonOutlined, PlusOutlined, HomeOutlined } from "@ant-design/icons";
import { useTheme } from "../components/Themeprovider";
import { useRouter } from "next/navigation";

export default function BlogIndex() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [fetching, setFetching] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const fetchPosts = async (search = "") => {
    try {
      setFetching(true);
      const res = await fetch(`/api/posts?status=published&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load posts");
      setPosts(data.posts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPosts("");
  }, []);

  const onSearch = async (value) => {
    setQuery(value);
    await fetchPosts(value);
  };

  const stripHtml = (html) => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="blog-page">
      <div className="blog-container">
        {/* Clean Header */}
        <header className="blog-header">
          <div className="header-left">
            <h1 className="blog-title">Blogs</h1>
            <p className="blog-subtitle">Thoughts, ideas, and insights</p>
          </div>
          <div className="header-right">
            <Button 
              type="primary" 
              href="/dashboard" 
              className="write-button"
              icon={<PlusOutlined />}
            >
              Write Article
            </Button>
            <Tooltip title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <Switch
                checked={theme === "light"}
                onChange={(checked) => setTheme(checked ? "light" : "dark")}
                checkedChildren={<SunOutlined />}
                unCheckedChildren={<MoonOutlined />}
                className="theme-switch"
              />
            </Tooltip>
          </div>
        </header>

        {/* Clean Search */}
        <div className="search-section">
          <div className="search-box">
            <SearchOutlined className="search-icon" />
            <input
              type="text"
              placeholder="Search articles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch(query)}
              className="search-input"
            />
            {fetching && <Spin size="small" className="search-spinner" />}
          </div>
        </div>

        {/* Content */}
        <main className="blog-content">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
              <p className="loading-text">Loading articles...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-container">
              <div className="empty-content">
                <h3 className="empty-title">
                  {query ? 'No articles found' : 'No articles yet'}
                </h3>
                <p className="empty-text">
                  {query 
                    ? `No articles match "${query}". Try a different search term.`
                    : 'Be the first to share your thoughts and ideas.'
                  }
                </p>
                {!query && (
                  <Button type="primary" href="/dashboard" className="write-button">
                    Write First Article
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="articles-grid">
              {posts.map((item) => (
                <article key={item._id} className="article-card" onClick={() => router.push(`/blog/${item._id}`)} style={{ cursor: 'pointer' }}>
                  <div className="article-image">
                    {item.coverImage ? (
                      <img 
                        src={item.coverImage} 
                        alt={item.title}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="image-placeholder"><EditOutlined /></div>';
                        }}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <EditOutlined />
                      </div>
                    )}
                  </div>
                  
                  <div className="article-body">
                    <div className="article-meta">
                      <div className="author">
                        <Avatar size={24} icon={<UserOutlined />} />
                        <span className="author-name">{item.authorName || 'Anonymous'}</span>
                      </div>
                      <div className="date">
                        <CalendarOutlined />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>

                    <h2 className="article-title">
                      {item.title}
                    </h2>

                    <p className="article-excerpt">
                      {stripHtml(item.content).length > 120 
                        ? stripHtml(item.content).slice(0, 120) + '...' 
                        : stripHtml(item.content)
                      }
                    </p>

                    {item.tags && item.tags.length > 0 && (
                      <div className="article-tags">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="tag-more">
                            +{item.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
      
      {/* Floating Home Button */}
      <Tooltip title="Go to Home" placement="left">
        <Button
          type="primary"
          shape="circle"
          icon={<HomeOutlined />}
          className="floating-home-btn"
          onClick={() => router.push('/')}
        />
      </Tooltip>
    </div>
  );
}
