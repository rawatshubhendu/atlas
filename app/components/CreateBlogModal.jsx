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
  const [editorInstance, setEditorInstance] = useState(null); // Store editor instance reference
  const [coverImage, setCoverImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState("");

  // Extract text content from HTML - more robust extraction
  const extractTextContent = useCallback((html) => {
    if (!html) return '';
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      // Get text content
      let text = (tempDiv.textContent || tempDiv.innerText || '').trim();
      // Remove multiple spaces/newlines, replace with single space
      text = text.replace(/\s+/g, ' ').trim();
      return text;
    } catch (e) {
      // Fallback: regex-based extraction
      return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
  }, []);

  const textContent = useMemo(() => {
    return extractTextContent(editorHTML);
  }, [editorHTML, extractTextContent]);

  // Get actual text content directly from editor if available (most reliable)
  const getEditorTextContent = useCallback(() => {
    if (editorInstance) {
      try {
        // Use TipTap's built-in method to get text content
        const text = editorInstance.getText();
        return text.trim();
      } catch (e) {
        // Fallback to HTML extraction
        return extractTextContent(editorHTML);
      }
    }
    return extractTextContent(editorHTML);
  }, [editorInstance, editorHTML, extractTextContent]);

  const canPublish = useMemo(() => {
    const hasTitle = title && title.trim().length > 0;
    
    // Get text content - prefer editor instance, fallback to HTML extraction
    let actualTextContent = '';
    if (editorInstance) {
      try {
        actualTextContent = editorInstance.getText().trim();
      } catch (e) {
        // Fallback to extracted text content
        actualTextContent = textContent || '';
      }
    } else {
      // Use extracted text content from HTML
      actualTextContent = textContent || '';
    }
    
    // Additional check: ensure HTML has substantial content (not just empty tags)
    // Remove all HTML tags and check for actual text
    const htmlWithoutTags = editorHTML ? editorHTML.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
    
    // Content is valid if there's actual text (at least 3 characters)
    // Check both editor text and HTML text to be thorough
    const hasContent = actualTextContent.length >= 3 || htmlWithoutTags.length >= 3;
    
    return Boolean(hasTitle && hasContent);
  }, [title, textContent, editorHTML, editorInstance]);

  // Debug effect for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const editorText = editorInstance ? editorInstance.getText().trim() : 'N/A';
      console.log('Editor state updated:', {
        editorHTML: editorHTML?.length,
        textContent: textContent?.length,
        editorText: editorText?.length,
        editorTextValue: editorText.substring(0, 50),
        hasContent: textContent && textContent.length >= 3,
        canPublish,
        editorInstanceAvailable: !!editorInstance
      });
    }
  }, [editorHTML, textContent, canPublish, editorInstance]);

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
      // CRITICAL: Get fresh content directly from editor instance FIRST
      let actualTextContent = '';
      let currentHTML = '';
      
      // Always try to get content from editor instance first (most reliable)
      if (editorInstance) {
        try {
          // Get fresh text content directly from editor
          actualTextContent = editorInstance.getText().trim();
          currentHTML = editorInstance.getHTML();
          
          // If editor instance exists but returns empty, wait a tick and try again
          if (!actualTextContent && !currentHTML) {
            await new Promise(resolve => setTimeout(resolve, 100));
            actualTextContent = editorInstance.getText().trim();
            currentHTML = editorInstance.getHTML();
          }
        } catch (e) {
          console.error('Error getting content from editor instance:', e);
          // Fallback to state
          actualTextContent = textContent || '';
          currentHTML = editorHTML || '';
        }
      } else {
        // Fallback if editor instance not available
        actualTextContent = textContent || '';
        currentHTML = editorHTML || '';
      }
      
      // Extract text from HTML as additional check
      const htmlWithoutTags = currentHTML ? currentHTML.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
      
      // Content validation - check both editor text and HTML text
      // At least 3 characters of actual text content
      const hasContent = actualTextContent.length >= 3 || htmlWithoutTags.length >= 3;
      
      // Title validation
      const hasTitle = title && title.trim().length > 0;

      // Sync form field so antd validation sees latest content
      form.setFieldsValue({ content: currentHTML || editorHTML || '' });

      // Validate form (title rules etc.)
      const values = await form.validateFields();

      if (process.env.NODE_ENV === 'development') {
        console.log('Blog validation (FINAL CHECK):', {
          title: title?.length,
          titleValue: title,
          editorHTML: currentHTML?.length,
          editorHTMLPreview: currentHTML?.substring(0, 200),
          editorText: actualTextContent,
          editorTextLength: actualTextContent.length,
          htmlWithoutTags: htmlWithoutTags,
          htmlWithoutTagsLength: htmlWithoutTags.length,
          hasTitle,
          hasContent,
          editorInstanceAvailable: !!editorInstance,
          willPublish: hasTitle && hasContent
        });
      }

      if (!hasTitle) {
        form.setFields([{ name: "title", errors: ["Please enter a title"] }]);
        message.error("Please enter a title");
        return;
      }

      if (!hasContent) {
        form.setFields([{ name: "content", errors: ["Please write your content (at least 3 characters)"] }]);
        message.error(`Please write your content (at least 3 characters). Current length: ${actualTextContent.length || htmlWithoutTags.length}`);
        return;
      }

      setSubmitting(true);
      
      const finalContent = currentHTML || editorHTML || '';
      form.setFieldsValue({ content: finalContent });
      
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          content: finalContent,
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
  }, [form, textContent, editorHTML, editorInstance, coverImage, tags, authorName, authorId, onPublished, title]);

  const resetState = () => {
    form.resetFields();
    setEditorHTML("");
    setEditorInstance(null);
    setCoverImage("");
    setTags([]);
    setCurrentTag("");
    setTitle("");
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
      okText="Publish"
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
                <TipTapEditor 
                  value={editorHTML} 
                  onChange={(html) => {
                    setEditorHTML(html);
                    // Force form validation update
                    form.setFieldsValue({ content: html });
                    // Also update canPublish state
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Editor onChange:', { htmlLength: html?.length, htmlPreview: html?.substring(0, 100) });
                    }
                  }}
                  onEditorReady={(editor) => {
                    // Store editor instance reference for direct access
                    setEditorInstance(editor);
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Editor instance ready:', { 
                        hasEditor: !!editor,
                        initialText: editor?.getText()?.trim()?.substring(0, 50)
                      });
                    }
                  }}
                />
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
