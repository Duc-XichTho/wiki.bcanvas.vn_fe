import React, { useEffect, useRef, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import { useEditor } from '../../../Canvas/CongCu/CanvasWebPage/ContentWebPage/useEditor';
import { Button, message } from 'antd';
import { SaveIcon } from '../../../Canvas/CongCu/CanvasWebPage/ContentWebPage/ListIcon.jsx';
import { TiptapToolbar } from '../../../Canvas/CongCu/CanvasWebPage/ContentWebPage/TiptapToolbar';
import styles from './CareEventEditor.module.css';
import '../../../Canvas/CongCu/CanvasWebPage/ContentWebPage/TipTap.module.css';

export default function CareEventEditor({ 
  initialContent = '', 
  onSave, 
  onCancel, 
  isVisible = false,
  loading = false,
  showToolbar = true,
  editable = true
}) {
  const { editor } = useEditor();

  // Toolbar menu states
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [colorPickerMenuOpen, setColorPickerMenuOpen] = useState(false);
  const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
  const [lineHeightMenuOpen, setLineHeightMenuOpen] = useState(false);
  

  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent);
    } else {
      editor.commands.setContent('<p></p>');
    }
  }, [editor, initialContent]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  useEffect(() => {
    if (editor) {
      // Lắng nghe thay đổi content
      const handleUpdate = () => {
        const htmlContent = editor.getHTML();
        // Tự động cập nhật content vào parent component
        if (onSave) {
          onSave(htmlContent);
        }
      };

      editor.on('update', handleUpdate);
      
      return () => {
        editor.off('update', handleUpdate);
      };
    }
  }, [editor, onSave]);

  const handleSave = async () => {
    try {
      const htmlContent = editor.getHTML();
      await onSave(htmlContent);
    } catch (error) {
      console.error('Error saving content:', error);
      message.error('Lỗi khi lưu nội dung!');
    }
  };

  if (!editor || !isVisible) {
    return null;
  }

  return (
    <>
      {showToolbar && (
        <div className={styles.editorHeader}>
          <TiptapToolbar
            editor={editor}
            headingMenuOpen={headingMenuOpen}
            setHeadingMenuOpen={setHeadingMenuOpen}
            tableMenuOpen={tableMenuOpen}
            setTableMenuOpen={setTableMenuOpen}
            fontMenuOpen={fontMenuOpen}
            setFontMenuOpen={setFontMenuOpen}
            colorPickerMenuOpen={colorPickerMenuOpen}
            setColorPickerMenuOpen={setColorPickerMenuOpen}
            fontSizeMenuOpen={fontSizeMenuOpen}
            setFontSizeMenuOpen={setFontSizeMenuOpen}
            lineHeightMenuOpen={lineHeightMenuOpen}
            setLineHeightMenuOpen={setLineHeightMenuOpen}
          />
        </div>
      )}
      <div className={styles.editorContainer}>
        <div className={styles.editorContent}>
          <EditorContent
            editor={editor}
            className={styles.editorContentWrap}
          />
        </div>
      </div>
    </>
  );
}
