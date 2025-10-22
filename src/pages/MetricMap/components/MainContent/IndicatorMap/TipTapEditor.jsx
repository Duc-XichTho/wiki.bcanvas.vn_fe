import React, { useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { useEditor } from '@tiptap/react';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import TextStyle from '@tiptap/extension-text-style';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Dropcursor from '@tiptap/extension-dropcursor';
import Heading from '@tiptap/extension-heading';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import History from '@tiptap/extension-history';
import Image from '@tiptap/extension-image';
import { Check, X, ImageIcon } from 'lucide-react';
import { uploadFiles } from '../../../../../apis/uploadImageWikiNoteService';
import { FontSize } from './FontSize';
import styles from './IndicatorMap.module.css';

const TipTapEditor = ({ 
  content, 
  onSave, 
  onCancel, 
  placeholder = "Nhập phân tích mô hình kinh doanh..." 
}) => {

  const editor = useEditor({
    extensions: [
      Bold,
      Italic,
      Underline,
      Document,
      Paragraph,
      Text,
      TextStyle,
      FontSize,
      BulletList,
      OrderedList,
      ListItem,
      History,
      Dropcursor,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Placeholder.configure({
        placeholder: placeholder,
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: styles.tiptapEditorContent,
      },
      handlePaste: function (view, event, slice) {
        const items = event.clipboardData?.items;

        if (!items || !items.length) return false;

        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            event.preventDefault();

            const file = item.getAsFile();
            if (!file) continue;
            
            const timestamp = Date.now();
            const fileExtension = file.name.slice(file.name.lastIndexOf('.'));
            const newFileName = `image-${timestamp}${fileExtension}`;
            const newFile = new File([file], newFileName, { type: file.type });
            const formData = new FormData();
            formData.append('file', newFile);

            uploadFiles(formData)
              .then(url => {
                if (url && url.files && url.files[0] && url.files[0].fileUrl) {
                  editor.chain().focus().setImage({ src: url.files[0].fileUrl }).run();
                }
              })
              .catch(error => {
                console.error('Error uploading image:', error);
              });
            return true;
          }
        }
        return false;
      },
      handleDrop: function (view, event, slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length) {
          const files = Array.from(event.dataTransfer.files);
          const imageFiles = files.filter(file => file.type.startsWith('image/'));
          
          if (imageFiles.length > 0) {
            event.preventDefault();
            
            imageFiles.forEach(file => {
              const timestamp = Date.now();
              const fileExtension = file.name.slice(file.name.lastIndexOf('.'));
              const newFileName = `image-${timestamp}${fileExtension}`;
              const newFile = new File([file], newFileName, { type: file.type });
              const formData = new FormData();
              formData.append('file', newFile);

              uploadFiles(formData)
                .then(url => {
                  if (url) {
                    editor.chain().focus().setImage({ src: url.files[0]?.fileUrl }).run();
                  }
                })
                .catch(error => {
                  console.error('Error uploading image:', error);
                });
            });
            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && content !== undefined) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleSave = () => {
    if (editor) {
      const htmlContent = editor.getHTML();
      onSave(htmlContent);
    }
  };

  const handleCancel = () => {
    if (editor) {
      editor.commands.setContent(content || '');
    }
    onCancel();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={styles.tiptapEditorContainer}>
      <div className={styles.tiptapToolbar}>
          {/* Text Formatting */}
          <div className={styles.toolbarGroup}>
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`${styles.toolbarButton} ${editor.isActive('bold') ? styles.active : ''}`}
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`${styles.toolbarButton} ${editor.isActive('italic') ? styles.active : ''}`}
              title="Italic"
            >
              <em>I</em>
            </button>
       
          </div>

          {/* Headings */}
          <div className={styles.toolbarGroup}>
            <select
              onChange={(e) => {
                const level = parseInt(e.target.value);
                if (level === 0) {
                  editor.chain().focus().setParagraph().run();
                } else {
                  editor.chain().focus().toggleHeading({ level }).run();
                }
              }}
              value={editor.isActive('heading') ? editor.getAttributes('heading').level : 0}
              className={styles.fontSelect}
            >
              <option value={0}>H</option>
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </div>

          {/* Font Size */}
          <div className={styles.toolbarGroup}>
            <select
              onChange={(e) => {
                const fontSize = e.target.value;
                if (fontSize === '') {
                  editor.chain().focus().unsetFontSize().run();
                } else {
                  editor.chain().focus().setFontSize(fontSize).run();
                }
              }}
              value={editor.getAttributes('textStyle').fontSize || ''}
              className={styles.fontSelect}
            >
              <option value="">Font</option>
              <option value="12px">12px</option>
              <option value="14px">14px</option>
              <option value="16px">16px</option>
              <option value="18px">18px</option>
              <option value="20px">20px</option>
              <option value="24px">24px</option>
              <option value="28px">28px</option>
              <option value="32px">32px</option>
            </select>
          </div>

          {/* Lists */}
          <div className={styles.toolbarGroup}>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`${styles.toolbarButton} ${editor.isActive('bulletList') ? styles.active : ''}`}
              title="Bullet List"
            >
              •
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`${styles.toolbarButton} ${editor.isActive('orderedList') ? styles.active : ''}`}
              title="Numbered List"
            >
              1.
            </button>
          </div>

       
      </div>

      <div className={styles.tiptapEditorWrapper}>
        <EditorContent editor={editor} />
      </div>

      <div className={styles.tiptapActions}>
        <button onClick={handleSave} className={styles.saveButton}>
          <Check className={styles.saveIcon} />
          Lưu
        </button>
        <button onClick={handleCancel} className={styles.cancelButton}>
          <X className={styles.cancelIcon} />
          Hủy
        </button>
      </div>
    </div>
  );
};

export default TipTapEditor;
