"use client";

import React, { useCallback, useState, useEffect, useMemo, memo } from "react";
import { Button, Space, Upload, Tooltip, Divider, Input, Popover } from "antd";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  ReadOutlined,
  LinkOutlined,
  PictureOutlined,
  RedoOutlined,
  UndoOutlined,
} from "@ant-design/icons";

// Memoize the component to prevent unnecessary re-renders
const TipTapEditor = memo(function TipTapEditor({ value = "", onChange = () => {}, onEditorReady = () => {} }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imgOpen, setImgOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState("");

  // Memoize extensions to prevent recreation
  const extensions = useMemo(() => [
    // Use StarterKit's built-in Link to avoid duplicate extension warnings
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      bulletList: {},
      orderedList: {},
      listItem: {},
      blockquote: {},
      codeBlock: false,
      code: {},
      horizontalRule: false,
      strike: {},
      bold: {},
      italic: {},
      link: true, // keep default Link from StarterKit (single source)
    }),
    Image.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: {
        class: "editor-image",
      },
    }),
    Placeholder.configure({
      placeholder: "Start writing your amazing story...",
      emptyEditorClass: "is-editor-empty",
    }),
  ], []);

  const editor = useEditor({
    extensions,
    content: value || "",
    immediatelyRender: false,
    autofocus: false,
    editable: true,
    editorProps: {
      attributes: {
        class: "tiptap-surface",
        spellcheck: "false",
      },
      handleKeyDown: (_view, event) => {
        // prevent modal hotkeys from closing
        if (event.key === "Escape") {
          event.stopPropagation();
          return true;
        }
        return false;
      },
      handleDOMEvents: {
        keydown: (_view, event) => {
          // Custom keyboard shortcuts can be added here
          return false;
        },
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    onCreate: ({ editor }) => {
      // Editor is ready - notify parent component
      if (onEditorReady) {
        onEditorReady(editor);
      }
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log("Editor created");
      }
    },
  });

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  const setHeading = level => editor?.chain().focus().toggleHeading({ level }).run();
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleStrike = () => editor?.chain().focus().toggleStrike().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const undo = () => editor?.chain().focus().undo().run();
  const redo = () => editor?.chain().focus().redo().run();

  const addLink = useCallback((url) => {
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setLinkOpen(false);
    setLinkUrl("");
  }, [editor]);

  const beforeUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        editor?.chain().focus().setImage({ src: data.url }).run();
      } else {
        console.error('Upload failed:', data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
    }

    return false;
  };

  const addImageFromUrl = () => {
    if (!imgUrl) return;
    let url = imgUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    editor?.chain().focus().setImage({ src: url }).run();
    setImgOpen(false);
    setImgUrl("");
  };

  return (
    <div className="tiptap-editor premium-editor">
      <div className="tiptap-toolbar premium-toolbar">
        <div className="toolbar-group">
          <Button
            size="small"
            type={editor?.isActive('heading', { level: 2 }) ? 'primary' : 'text'}
            icon={<ReadOutlined />}
            onMouseDown={(e)=>e.preventDefault()}
            onClick={() => setHeading(2)}
            className="toolbar-btn"
            title="Heading 2"
          />
          <Button
            size="small"
            type={editor?.isActive('bold') ? 'primary' : 'text'}
            icon={<BoldOutlined />}
            onMouseDown={(e)=>e.preventDefault()}
            onClick={toggleBold}
            className="toolbar-btn"
            title="Bold"
          />
          <Button
            size="small"
            type={editor?.isActive('italic') ? 'primary' : 'text'}
            icon={<ItalicOutlined />}
            onMouseDown={(e)=>e.preventDefault()}
            onClick={toggleItalic}
            className="toolbar-btn"
            title="Italic"
          />
          <Button
            size="small"
            type={editor?.isActive('strike') ? 'primary' : 'text'}
            icon={<StrikethroughOutlined />}
            onMouseDown={(e)=>e.preventDefault()}
            onClick={toggleStrike}
            className="toolbar-btn"
            title="Strikethrough"
          />
        </div>
        
        <Divider type="vertical" className="toolbar-divider" />
        
        <div className="toolbar-group">
          <Button
            size="small"
            type={editor?.isActive('orderedList') ? 'primary' : 'text'}
            icon={<OrderedListOutlined />}
            onMouseDown={(e)=>e.preventDefault()}
            onClick={toggleOrderedList}
            className="toolbar-btn"
            title="Ordered List"
          />
          <Button
            size="small"
            type={editor?.isActive('bulletList') ? 'primary' : 'text'}
            icon={<UnorderedListOutlined />}
            onMouseDown={(e)=>e.preventDefault()}
            onClick={toggleBulletList}
            className="toolbar-btn"
            title="Bullet List"
          />
        </div>
        
        <Divider type="vertical" className="toolbar-divider" />
        
        <div className="toolbar-group">
          <Popover
            title="Insert Link"
            open={linkOpen}
            onOpenChange={setLinkOpen}
            content={
              <div className="popover-content">
                <Space.Compact style={{ width: 280 }}>
                  <Input 
                    value={linkUrl} 
                    onChange={(e)=>setLinkUrl(e.target.value)} 
                    placeholder="https://example.com" 
                    size="small"
                    onPressEnter={() => addLink(linkUrl)}
                  />
                  <Button 
                    type="primary" 
                    size="small" 
                    onClick={()=>addLink(linkUrl)}
                    disabled={!linkUrl.trim()}
                  >
                    Add
                  </Button>
                </Space.Compact>
              </div>
            }
            trigger="click"
            placement="bottomLeft"
          >
            <Button 
              size="small" 
              type="text" 
              icon={<LinkOutlined />} 
              onMouseDown={(e)=>e.preventDefault()}
              className="toolbar-btn"
              title="Insert Link"
            />
          </Popover>
          
          <Popover
            title="Insert Image"
            open={imgOpen}
            onOpenChange={setImgOpen}
            content={
              <div className="popover-content">
                <Space direction="vertical" size={8} style={{ width: 280 }}>
                  <Space.Compact>
                    <Input 
                      value={imgUrl} 
                      onChange={(e)=>setImgUrl(e.target.value)} 
                      placeholder="https://image-url" 
                      size="small"
                      onPressEnter={addImageFromUrl}
                    />
                    <Button 
                      type="primary" 
                      size="small" 
                      onClick={addImageFromUrl}
                      disabled={!imgUrl.trim()}
                    >
                      Add
                    </Button>
                  </Space.Compact>
                  <Divider style={{ margin: '4px 0' }} />
                  <Upload beforeUpload={beforeUpload} showUploadList={false} accept="image/*">
                    <Button size="small" type="default" icon={<PictureOutlined />} style={{ width: '100%' }}>
                      Upload from device
                    </Button>
                  </Upload>
                </Space>
              </div>
            }
            trigger="click"
            placement="bottomLeft"
          >
            <Button 
              size="small" 
              type="text" 
              icon={<PictureOutlined />} 
              onMouseDown={(e)=>e.preventDefault()}
              className="toolbar-btn"
              title="Insert Image"
            />
          </Popover>
        </div>
        
        <div className="toolbar-spacer" />
        
        <div className="toolbar-group">
          <Button
            size="small"
            type="text"
            icon={<UndoOutlined />}
            onMouseDown={(e)=>e.preventDefault()}
            onClick={undo}
            className="toolbar-btn"
            title="Undo"
            disabled={!editor?.can().undo()}
          />
          <Button
            size="small"
            type="text"
            icon={<RedoOutlined />}
            onMouseDown={(e)=>e.preventDefault()}
            onClick={redo}
            className="toolbar-btn"
            title="Redo"
            disabled={!editor?.can().redo()}
          />
        </div>
      </div>
      <div className="tiptap-surface-wrapper premium-editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

TipTapEditor.displayName = 'TipTapEditor';

export default TipTapEditor;
