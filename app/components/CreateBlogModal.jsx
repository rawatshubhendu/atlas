"use client";

import { useEffect, useMemo, useState, memo, useCallback } from "react";
import { Modal, Form, Input, Upload, Image, Space, Button, Card, Typography, Divider, Tag, message } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  PictureOutlined,
  LinkOutlined,
  TagOutlined,
  FileTextOutlined,
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined
} from "@ant-design/icons";
import dynamic from "next/dynamic";

// Lazy load the heavy TipTap editor
const TipTapEditor = dynamic(() => import("./TipTapEditor"), {
  loading: () => (
    <div className="editor-loading" style={{
      padding: '2rem',
      textAlign: 'center',
      color: 'var(--text-muted)',
      border: '2px dashed var(--border)',
      borderRadius: '12px'
    }}>
      Loading editor...
    </div>
  ),
  ssr: false, // Disable SSR for TipTap editor
});

const { Title, Text } = Typography;

// Memoize the modal component
const CreateBlogModal = memo(function CreateBlogModal({ open, onClose, onPublished, authorName = "Anonymous", authorId }) {
  const [form] = Form.useForm();
  const [editorHTML, setEditorHTML] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState("");

  const textContent = useMemo(() => editorHTML.replace(/<[^>]*>/g, "").trim(), [editorHTML]);
  const canPublish = useMemo(() => Boolean(title && textContent), [title, textContent]);

  const beforeUpload = async (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return false;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setCoverImage(data.url);
        message.success('Image uploaded successfully!');
      } else {
        message.error(data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Failed to upload image');
    } finally {
      setSubmitting(false);
    }

    return false;
  };

  const handleOk = useCallback(async () => {
    try {
      const values = await form.validateFields();
      if (!textContent) {
        form.setFields([{ name: "content", errors: ["Please write your content"] }]);
        return;
      }
      setSubmitting(true);
      form.setFieldsValue({ content: editorHTML });
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          content: editorHTML,
          coverImage,
          tags: tags,
          authorName,
          authorId,
          status: "published",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to publish");
      onPublished?.(data.post);
    } catch (e) {
      if (e?.errorFields) return;
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }, [form, textContent, editorHTML, coverImage, tags, authorName, authorId, onPublished]);

  const resetState = () => {
    form.resetFields();
    setEditorHTML("");
    setCoverImage("");
    setTags([]);
    setCurrentTag("");
  };

  const addTag = () => {
    if (currentTag.trim() && tags.length < 5) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Modal
      title={null}
      open={open}
      onOk={handleOk}
      onCancel={() => { resetState(); onClose?.(); }}
      maskClosable={false}
      keyboard={false}
      className="premium-blog-modal"
      width={800}
      style={{ maxHeight: '90vh', overflow: 'auto' }}
      styles={{
        body: { maxHeight: 'calc(90vh - 110px)', overflow: 'auto' }
      }}
      centered
      destroyOnHidden
      forceRender
      okButtonProps={{ 
        disabled: !canPublish,
        size: "large",
        type: "primary",
        className: "publish-button",
        loading: submitting
      }}
      cancelButtonProps={{ size: "large" }}
    >
      <div className="premium-modal-content">
        {/* Minimalist Header */}
        <div className="minimal-header">
          <div className="header-content">
            <div className="header-icon">
              <EditOutlined />
            </div>
          <div className="header-text">
              <h1 className="modal-title">Create Blog Post</h1>
              <p className="modal-subtitle">Share your story with the world</p>
            </div>
          </div>
        </div>

        <Form 
          form={form} 
          layout="vertical" 
          requiredMark={false} 
          preserve={false} 
          onValuesChange={(_, all) => setTitle(all.title || "")}
          className="minimal-form"
        >
          {/* Title Section */}
          <div className="form-section">
            <div className="section-label">
              <span className="label-icon">📝</span>
              <span className="label-text">Title</span>
            </div>
            <Form.Item
              name="title"
              rules={[{ required: true, message: "Please enter a title" }]}
            >
              <Input 
                placeholder="Write a compelling title..."
                maxLength={180}
                className="minimal-input"
              />
            </Form.Item>
            <div className="character-count">
              {title?.length || 0}/180 characters
            </div>
          </div>

          {/* Cover Image Section */}
          <div className="form-section">
            <div className="section-label">
              <span className="label-icon">🖼️</span>
              <span className="label-text">Cover Image</span>
              <span className="optional-badge">Optional</span>
            </div>
            <div className="image-upload-section">
              {!coverImage ? (
                <Upload 
                  accept="image/*" 
                  showUploadList={false} 
                  beforeUpload={beforeUpload}
                  className="minimal-upload"
                >
                  <div className="upload-zone">
                    <div className="upload-icon">
                      <UploadOutlined />
                    </div>
                    <div className="upload-text">
                      <div className="primary-text">Click to add a cover image</div>
                      <div className="secondary-text">JPG, PNG • Max 5MB</div>
                    </div>
                  </div>
                </Upload>
              ) : (
                <div className="image-preview">
                  <Image 
                    src={coverImage} 
                    alt="cover" 
                    className="preview-image"
                  />
                  <Button 
                    icon={<DeleteOutlined />} 
                    onClick={() => setCoverImage("")}
                    className="remove-image-btn"
                    size="small"
                    danger
                  />
                </div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="form-section">
            <div className="section-label">
              <span className="label-icon">✍️</span>
              <span className="label-text">Content</span>
            </div>
            <Form.Item
              name="content"
              rules={[{ required: true, message: "Please write your content" }]}
            >
              <div className="editor-container">
                <TipTapEditor value={editorHTML} onChange={setEditorHTML} />
              </div>
            </Form.Item>
            <div className="editor-hint">
              Use the toolbar to format text, add links, and insert images
            </div>
          </div>

          {/* Tags Section */}
          <div className="form-section">
            <div className="section-label">
              <span className="label-icon">🏷️</span>
              <span className="label-text">Tags</span>
              <span className="optional-badge">Optional</span>
            </div>
            <div className="tags-section">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                placeholder="Add tags (press Enter)"
                className="minimal-input"
                  suffix={
                    <Button 
                    type="text"
                      size="small" 
                      onClick={addTag}
                      disabled={!currentTag.trim() || tags.length >= 5}
                    className="add-tag-btn"
                    >
                      Add
                    </Button>
                  }
                />
              {tags.length > 0 && (
                <div className="tags-display">
                  {tags.map((tag, index) => (
                    <Tag
                      key={index}
                      closable
                      onClose={() => removeTag(index)}
                      className="minimal-tag"
                    >
                      #{tag}
                    </Tag>
                  ))}
                  <div className="tag-count">
                    {tags.length}/5 tags
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Section */}
          {title && (
            <div className="preview-section">
              <div className="preview-label">
                <span className="label-icon">👁️</span>
                <span className="label-text">Live Preview</span>
              </div>
              <div className="blog-preview">
                <div className="preview-cover">
                  {coverImage ? (
                    <img src={coverImage} alt="preview" className="preview-image" />
                  ) : (
                    <div className="preview-placeholder">
                      <PictureOutlined />
                    </div>
                  )}
                </div>
                <div className="preview-content">
                  <h3 className="preview-title">{title}</h3>
                  <p className="preview-excerpt">
                    {textContent.length > 120 ? `${textContent.substring(0, 120)}...` : textContent || "Your content will appear here..."}
                  </p>
                  {tags.length > 0 && (
                    <div className="preview-tags">
                      {tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="preview-tag">#{tag}</span>
                      ))}
                      {tags.length > 3 && <span className="preview-tag-more">+{tags.length - 3}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Form>
      </div>
    </Modal>
  );
});

CreateBlogModal.displayName = 'CreateBlogModal';

export default CreateBlogModal;
