import React from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Table as TableIcon
} from 'lucide-react';
import styles from './DataRubikProcessGuide.module.css';

export function ProcessItemToolbar({ editor }) {
  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('Nhập URL hình ảnh:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className={styles.tiptapToolbar}>
      <div className={styles.toolbarGroup}>
        {/* Text Formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? styles.toolbarButtonActive : styles.toolbarButton}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? styles.toolbarButtonActive : styles.toolbarButton}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? styles.toolbarButtonActive : styles.toolbarButton}
          title="Underline"
        >
          <Underline size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? styles.toolbarButtonActive : styles.toolbarButton}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
      </div>

      <div className={styles.toolbarGroup}>
        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? styles.toolbarButtonActive : styles.toolbarButton}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? styles.toolbarButtonActive : styles.toolbarButton}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? styles.toolbarButtonActive : styles.toolbarButton}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </button>
      </div>

      <div className={styles.toolbarGroup}>
        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? styles.toolbarButtonActive : styles.toolbarButton}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? styles.toolbarButtonActive : styles.toolbarButton}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? styles.toolbarButtonActive : styles.toolbarButton}
          title="Quote"
        >
          <Quote size={16} />
        </button>
      </div>

      <div className={styles.toolbarGroup}>
        {/* Alignment */}
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? styles.toolbarButtonActive : styles.toolbarButton}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? styles.toolbarButtonActive : styles.toolbarButton}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? styles.toolbarButtonActive : styles.toolbarButton}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
      </div>

      <div className={styles.toolbarGroup}>
        {/* Media */}
        <button
          onClick={addImage}
          className={styles.toolbarButton}
          title="Insert Image"
        >
          <ImageIcon size={16} />
        </button>
        <button
          onClick={addTable}
          className={styles.toolbarButton}
          title="Insert Table"
        >
          <TableIcon size={16} />
        </button>
      </div>
    </div>
  );
}
