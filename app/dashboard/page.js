"use client";

import { useEffect, useState } from "react";
import { Layout, Button, message, Typography, Avatar, Spin } from "antd";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Lazy load heavy components
const DashboardSidebar = dynamic(() => import("../components/DashboardSidebar"), {
  loading: () => <div className="sidebar-placeholder" style={{ width: '280px', background: 'var(--surface)' }} />,
});

const CreateBlogModal = dynamic(() => import("../components/CreateBlogModal"), {
  loading: () => null,
});

import { getCurrentUser, signOut } from "../lib/auth";
import {
  EditOutlined,
  AppstoreOutlined,
  UserOutlined,
  BookOutlined,
  BarChartOutlined,
  CalendarOutlined,
  SearchOutlined,
  UploadOutlined,
  MailOutlined,
  LockOutlined,
  MenuOutlined
} from "@ant-design/icons";

const { Content } = Layout;

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'posts' | 'settings'
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false); // show mobile button only on mobile
  
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  // Hide desktop navbar and mobile header on dashboard page - AGGRESSIVE
  useEffect(() => {
    const hideNavbarElements = () => {
      // Hide desktop navbar
      const navbar = document.querySelector('.glass-navbar');
      if (navbar) {
        navbar.style.display = 'none';
        navbar.style.visibility = 'hidden';
        navbar.style.opacity = '0';
        navbar.style.pointerEvents = 'none';
      }
      
      // Hide mobile header
      const mobileHeader = document.querySelector('.mobile-header');
      if (mobileHeader) {
        mobileHeader.style.display = 'none';
        mobileHeader.style.visibility = 'hidden';
        mobileHeader.style.opacity = '0';
        mobileHeader.style.pointerEvents = 'none';
      }
      
      // Hide mobile menu button
      const mobileMenuBtn = document.querySelector('.mobile-menu-button');
      if (mobileMenuBtn) {
        mobileMenuBtn.style.display = 'none';
        mobileMenuBtn.style.visibility = 'hidden';
      }
    };
    
    // Hide immediately
    hideNavbarElements();
    
    // Also hide after a short delay to catch any late-rendering elements
    const timeoutId = setTimeout(hideNavbarElements, 100);
    
    // Use MutationObserver to catch dynamically added navbar elements
    const observer = new MutationObserver(hideNavbarElements);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
      // Restore navbar when leaving dashboard
      const navbar = document.querySelector('.glass-navbar');
      if (navbar) {
        navbar.style.display = '';
        navbar.style.visibility = '';
        navbar.style.opacity = '';
        navbar.style.pointerEvents = '';
      }
    };
  }, []);

  // Track viewport to conditionally render mobile toggle button
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => {
      const matches = mq.matches;
      setIsMobile(matches);
      // Debug log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Mobile state updated:', matches, 'Window width:', window.innerWidth);
      }
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Ensure posts refresh when user becomes available
  useEffect(() => {
    if (currentView === 'posts' && user?.email) {
      fetchPosts(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const authorKey = user?.email; // stable across sessions
  const authorDisplayName = user?.name;

  const fetchPosts = async (search = "", forceRefresh = false) => {
    if (!authorKey) return; // guard until user is ready
    try {
      setLoading(true);
      // Add cache-busting timestamp to ensure fresh data
      const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : '';
      const url = `/api/posts?status=published&search=${encodeURIComponent(search)}&authorId=${encodeURIComponent(authorKey)}${authorDisplayName ? `&authorName=${encodeURIComponent(authorDisplayName)}` : ''}${cacheBuster}`;
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store', // Ensure we don't use cached data
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load posts");
      // Always update posts state, even if it's an empty array
      setPosts(data.posts || []);
    } catch (e) {
      console.error('Error fetching posts:', e);
      message.error('Failed to refresh posts');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Clear any dashboard-specific state
      setUser(null);
      setOpen(false);
      // Small delay to ensure cleanup completes
      setTimeout(() => {
        // Force a hard navigation to clear all state and prevent scroll issues
        window.location.replace('/');
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if signOut fails
      setTimeout(() => {
        window.location.replace('/');
      }, 100);
    }
  };

  const openCreateModal = () => {
    setOpen(true);
  };

  const closeCreateModal = () => setOpen(false);

  const handlePublished = () => {
    message.success('Blog published');
    closeCreateModal();
    // Refresh posts if we're on posts view
    if (currentView === 'posts') {
      fetchPosts(query);
    }
  };

  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    if (view === 'posts') {
      fetchPosts(query);
    }
  };

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

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'var(--bg)',
        width: '100%'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      {/* Mobile Menu Button for Dashboard - render only on mobile */}
      {isMobile && (
        <button
          className="dashboard-mobile-menu-btn"
          onClick={() => {
            // Toggle mobile sidebar
            const sidebar = document.querySelector('.exotic-sidebar');
            const main = document.querySelector('.dashboard-main');
            if (sidebar && main) {
              const isOpen = sidebar.classList.contains('mobile-open');
              if (isOpen) {
                sidebar.classList.remove('mobile-open');
                main.classList.remove('mobile-sidebar-open');
              } else {
                sidebar.classList.add('mobile-open');
                main.classList.add('mobile-sidebar-open');
              }
            }
          }}
          aria-label="Toggle dashboard menu"
        >
          <MenuOutlined />
        </button>
      )}

      <div className={`dashboard-container ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ width: '100%', minHeight: '100vh' }}>
        <DashboardSidebar
          user={user}
          onLogout={handleLogout}
          onCollapse={handleSidebarCollapse}
          currentView={currentView}
          onViewChange={handleViewChange}
        />

        <div className={`dashboard-main ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ marginTop: 0, width: '100%', flex: 1 }}>
          {/* Header Section */}
          <div className="dashboard-header">
            <div className="header-left">
              <Typography.Title level={1} className="page-title">
                {currentView === 'dashboard' ? 'Dashboard' : currentView === 'posts' ? 'Posts' : 'User Settings'}
              </Typography.Title>
            </div>
            <div className="header-right">
              <div className="user-profile">
                <Avatar size={40} style={{ backgroundColor: 'var(--accent)' }} src={user?.avatar}>
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
                <div className="user-info">
                  <Typography.Text strong className="user-name">{user?.name || 'User'}</Typography.Text>
                </div>
              </div>
            </div>
          </div>

          {/* Content based on current view */}
          {currentView === 'dashboard' ? (
            /* Welcome Section Only (Centered) */
            <div className="dashboard-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 'calc(100vh - 200px)' }}>
              <div className="welcome-section welcome-compact" style={{ display: 'block', visibility: 'visible', opacity: 1 }}>
                <Typography.Title level={2} className="welcome-title">
                  Welcome to your workspace
                </Typography.Title>
                <Typography.Paragraph className="welcome-description">
                  Start creating amazing content and manage your projects from here.
                </Typography.Paragraph>
                <div className="welcome-actions">
                  <Button type="primary" size="large" className="premium-button" onClick={openCreateModal}>
                    Create Blog
                  </Button>
                </div>
              </div>
            </div>
        ) : currentView === 'posts' ? (
          /* Posts View */
          <div className="posts-view">
            {/* Search Section */}
            <div className="posts-search-section">
              <div className="posts-search-box">
                <SearchOutlined className="posts-search-icon" />
                <input
                  type="text"
                  placeholder="Search your posts..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && onSearch(query)}
                  className="posts-search-input"
                />
                {loading && <Spin size="small" className="posts-search-spinner" />}
              </div>
            </div>

            {/* Posts Grid */}
            <div className="posts-content">
              {loading ? (
                <div className="posts-loading">
                  <Spin size="large" />
                  <p className="posts-loading-text">Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="posts-empty">
                  <div className="posts-empty-content">
                    <h3 className="posts-empty-title">
                      {query ? 'No posts found' : 'No posts yet'}
                    </h3>
                    <p className="posts-empty-text">
                      {query 
                        ? `No posts match "${query}". Try a different search term.`
                        : 'Start creating your first blog post.'
                      }
                    </p>
                    {!query && (
                      <Button type="primary" className="premium-button" onClick={openCreateModal}>
                        Create First Post
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="posts-grid">
                  {posts.map((item) => (
                    <article key={item._id} className="post-card" onClick={() => router.push(`/blog/${item._id}`)} style={{ cursor: 'pointer', position: 'relative' }}>
                      <div className="post-image">
                        {item.coverImage ? (
                          <img 
                            src={item.coverImage} 
                            alt={item.title}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div class="post-image-placeholder"><EditOutlined /></div>';
                            }}
                          />
                        ) : (
                          <div className="post-image-placeholder">
                            <EditOutlined />
                          </div>
                        )}
                      </div>
                      
                      <div className="post-body">
                        <div className="post-meta">
                          <div className="post-date">
                            <CalendarOutlined />
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                          <div className="post-status">
                            <span className={`status-badge ${item.status}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>

                        <h2 className="post-title">
                          {item.title}
                        </h2>

                        <p className="post-excerpt">
                          {stripHtml(item.content).length > 120 
                            ? stripHtml(item.content).slice(0, 120) + '...' 
                            : stripHtml(item.content)
                          }
                        </p>

                        {item.tags && item.tags.length > 0 && (
                          <div className="post-tags">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="post-tag">
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="post-tag-more">
                                +{item.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Delete button */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                          <Button size="small" danger onClick={async () => {
                            try {
                              // Confirm before deleting
                              // eslint-disable-next-line no-alert
                              const confirmed = window.confirm('Are you sure you want to delete this post?');
                              if (!confirmed) return;
                              
                              // Optimistically remove from UI immediately
                              setPosts(prevPosts => prevPosts.filter(post => post._id !== item._id));
                              
                              const url = `/api/posts/${item._id}?authorId=${encodeURIComponent(authorKey)}${authorDisplayName ? `&authorName=${encodeURIComponent(authorDisplayName)}` : ''}`;
                              const res = await fetch(url, { method: 'DELETE' });
                              const data = await res.json();
                              
                              if (!res.ok || !data.success) {
                                // If delete failed, refresh to restore the post
                                fetchPosts(query);
                                throw new Error(data.message || 'Failed to delete');
                              }
                              
                              message.success('Post deleted successfully');
                              
                              // Refresh posts list to ensure consistency with server
                              // Use a small delay to ensure server has processed the deletion
                              // Force refresh to bypass cache
                              setTimeout(() => {
                                fetchPosts(query, true);
                              }, 300);
                            } catch (err) {
                              console.error('Delete error:', err);
                              message.error(err.message || 'Delete failed');
                              // Refresh to restore correct state
                              fetchPosts(query);
                            }
                          }}>Delete</Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Settings Inline View - premium minimal form */
          <div className="premium-settings-view">
            <div className="premium-settings-container">
              <div className="premium-settings-form">
                {/* Avatar Section */}
                <div className="premium-avatar-section">
                  <div className="premium-avatar-container">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="avatar" className="premium-avatar-image" />
                    ) : (
                      <div className="premium-avatar-placeholder">
                        <UserOutlined />
                      </div>
                    )}
                    <div className="premium-avatar-overlay">
                      <UploadOutlined />
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="premium-avatar-input"
                      onChange={async (ev) => {
                        const file = ev.target.files?.[0];
                        if (!file) return;
                        try {
                          // Upload file first
                          const fd = new FormData();
                          fd.append('file', file);
                          const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
                          const uploadData = await uploadRes.json();
                          if (!uploadRes.ok || !uploadData?.url) throw new Error(uploadData.message || 'Upload failed');
                          
                          // Save avatar to database
                          const updateRes = await fetch('/api/users/update', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              currentEmail: user.email,
                              name: user.name,
                              email: user.email,
                              avatar: uploadData.url,
                              password: undefined
                            })
                          });
                          const updateData = await updateRes.json();
                          if (!updateRes.ok || !updateData.success) throw new Error(updateData.message || 'Failed to save avatar');
                          
                          // Update local state
                          const updatedUser = { ...(user || {}), avatar: uploadData.url };
                          localStorage.setItem('atlas_user', JSON.stringify(updatedUser));
                          setUser(updatedUser);
                          message.success('Avatar updated and saved');
                        } catch (er) {
                          console.error(er);
                          message.error(er.message || 'Upload failed');
                        }
                      }} 
                    />
                  </div>
                  <Typography.Text className="premium-avatar-label">Click to change avatar</Typography.Text>
                </div>

                {/* Form Fields */}
                <div className="premium-form-grid">
                  <div className="premium-form-group">
                    <label className="premium-form-label">Full Name</label>
                    <input 
                      name="settings_name" 
                      defaultValue={user?.name} 
                      className="premium-input" 
                      placeholder="Your full name"
                      onChange={(e)=>{ 
                        const u={...(user||{}), name:e.target.value}; 
                        setUser(u); 
                        localStorage.setItem('atlas_user', JSON.stringify(u)); 
                      }} 
                    />
                  </div>

                  <div className="premium-form-group">
                    <label className="premium-form-label">Email Address</label>
                    <input 
                      name="settings_email" 
                      defaultValue={user?.email} 
                      className="premium-input" 
                      placeholder="your.email@example.com"
                      type="email"
                    />
                  </div>

                  <div className="premium-form-group">
                    <label className="premium-form-label">New Password</label>
                    <input 
                      name="settings_password" 
                      type="password" 
                      className="premium-input" 
                      placeholder="New password (optional)"
                    />
                    <Typography.Text className="premium-form-hint">Leave blank to keep current password</Typography.Text>
                  </div>
                </div>

                {/* Save Button */}
                <div className="premium-save-section">
                  <button
                    onClick={async ()=>{
                      try {
                        const nameEl = document.getElementsByName('settings_name')[0];
                        const emailEl = document.getElementsByName('settings_email')[0];
                        const passEl = document.getElementsByName('settings_password')[0];
                        const payload = {
                          currentEmail: user.email,
                          name: nameEl?.value,
                          email: emailEl?.value,
                          avatar: user?.avatar || null,
                          password: passEl?.value || undefined,
                        };
                        const res = await fetch('/api/users/update', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload)
                        });
                        const data = await res.json();
                        if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');
                        const updatedUser = { ...(user || {}), name: data.user.name, email: data.user.email, avatar: data.user.avatar };
                        localStorage.setItem('atlas_user', JSON.stringify(updatedUser));
                        setUser(updatedUser);
                        message.success('Profile updated successfully');
                      } catch (err) {
                        console.error(err);
                        message.error(err.message || 'Update failed');
                      }
                    }}
                    className="premium-save-button"
                  >
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
      {/* Create Blog Modal */}
      <CreateBlogModal
        open={open}
        onClose={closeCreateModal}
        onPublished={handlePublished}
        authorName={user?.name || 'Anonymous'}
        authorId={authorKey}
      />
    </>
  );
}
