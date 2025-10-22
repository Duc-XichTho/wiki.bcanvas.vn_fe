import { useRef, useEffect } from 'react';
import styles from './ReportTiptapToolbar.module.css';

// Simple icon components
const BoldIcon = () => <span style={{ fontWeight: 'bold' }}>B</span>;
const ItalicIcon = () => <span style={{ fontStyle: 'italic' }}>I</span>;
const UnderlineIcon = () => <span style={{ textDecoration: 'underline' }}>U</span>;
const StrikeIcon = () => <span style={{ textDecoration: 'line-through' }}>S</span>;
const HighlightIcon = () => <span style={{ backgroundColor: 'yellow' }}>H</span>;
const BlockquoteIcon = () => <span>"</span>;
const BulletListIcon = () => <span>•</span>;
const OrderedListIcon = () => <span>1.</span>;
const ImageIcon = () => <span>🖼️</span>;
const InsertTableIcon = () => <span>📋</span>;
const ColumnInsertLeftIcon = () => <span>⬅️</span>;
const ColumnInsertRightIcon = () => <span>➡️</span>;
const DeleteColumnIcon = () => <span>❌</span>;
const RowInsertTopIcon = () => <span>⬆️</span>;
const RowInsertBottomIcon = () => <span>⬇️</span>;
const DeleteRowIcon = () => <span>❌</span>;
const DeleteTableIcon = () => <span>🗑️</span>;
const CellMergeIcon = () => <span>🔗</span>;
const SplitCellIcon = () => <span>✂️</span>;
const SetColorIcon = () => <span>🎨</span>;
const EraserIcon = () => <span>🧽</span>;
const FontFillIcon = () => <span>📝</span>;
const AlignLeftIcon = () => <span>⬅️</span>;
const AlignCenterIcon = () => <span>⬆️</span>;
const AlignRightIcon = () => <span>➡️</span>;
const FontSizeIcon = () => <span>Aa</span>;
const HeadingIcon = () => <span>H</span>;
const LineHeightIcon = () => <span>≡</span>;

export function ReportTiptapToolbar({
  editor,
  headingMenuOpen,
  setHeadingMenuOpen,
  tableMenuOpen,
  setTableMenuOpen,
  fontMenuOpen,
  setFontMenuOpen,
  colorPickerMenuOpen,
  setColorPickerMenuOpen,
  fontSizeMenuOpen,
  setFontSizeMenuOpen,
  lineHeightMenuOpen,
  setLineHeightMenuOpen
}) {
  const fontMenuRef = useRef(null);
  const fontSizeMenuRef = useRef(null);
  const headingMenuRef = useRef(null);
  const tableMenuRef = useRef(null);
  const colorPickerRef = useRef(null);
  const lineHeightMenuRef = useRef(null);

  const addImage = () => {
    const url = window.prompt('URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (tableMenuRef.current && !tableMenuRef.current.contains(event.target)) {
        setTableMenuOpen(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setColorPickerMenuOpen(false);
      }
      if (fontMenuRef.current && !fontMenuRef.current.contains(event.target)) {
        setFontMenuOpen(false);
      }
      if (headingMenuRef.current && !headingMenuRef.current.contains(event.target)) {
        setHeadingMenuOpen(false);
      }
      if (fontSizeMenuRef.current && !fontSizeMenuRef.current.contains(event.target)) {
        setFontSizeMenuOpen(false);
      }
      if (lineHeightMenuRef.current && !lineHeightMenuRef.current.contains(event.target)) {
        setLineHeightMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fontSizes = ["10px", "12px", "14px", "18px", "20px", "22px", "24px", "28px", "32px", "36px", "48px", "72px"];
  const lineHeights = ["1.0", "1.15", "1.5", "2.0", "2.5", "3.0"];

  if (!editor) {
    return null;
  }

  return (
    <div className={styles.tiptapControlGroup}>
      <div className={styles.tiptapButtonGroup}>
        {/* Line Height */}
        <div className={styles.tiptapMenuContainer} ref={lineHeightMenuRef}>
          <button
            onClick={() => setLineHeightMenuOpen(!lineHeightMenuOpen)}
            className={lineHeightMenuOpen ? styles.tiptapActive : ''}
          >
            <LineHeightIcon />
          </button>
          {lineHeightMenuOpen && (
            <div className={styles.tiptapDropdownMenu}>
              <button
                onClick={() => {
                  editor.chain().focus().setLineHeight('normal').run();
                  setLineHeightMenuOpen(false);
                }}
              >
                <span>Mặc định</span>
              </button>
              {lineHeights.map((height) => (
                <button
                  key={height}
                  onClick={() => {
                    editor.chain().focus().setLineHeight(height).run();
                    setLineHeightMenuOpen(false);
                  }}
                  className={editor.isActive('lineHeight', { lineHeight: height }) ? styles.tiptapActive : ''}
                >
                  <span>{height}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Family */}
        <div className={styles.tiptapMenuContainer} ref={fontMenuRef}>
          <button
            onClick={() => setFontMenuOpen(!fontMenuOpen)}
            className={fontMenuOpen ? styles.tiptapActive : ''}
          >
            <FontFillIcon />
          </button>
          {fontMenuOpen && (
            <div className={styles.tiptapDropdownMenu}>
              <button
                onClick={() => {
                  editor.chain().focus().setFontFamily('Comic Sans MS').run();
                  setFontMenuOpen(false);
                }}
                className={
                  editor.isActive('textStyle', { fontFamily: 'Comic Sans MS' })
                    ? styles.tiptapActive
                    : ''
                }
              >
                <span style={{ fontFamily: 'Comic Sans MS' }}>Comic Sans</span>
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().setFontFamily('serif').run();
                  setFontMenuOpen(false);
                }}
                className={editor.isActive('textStyle', { fontFamily: 'serif' }) ? styles.tiptapActive : ''}
              >
                <span style={{ fontFamily: 'serif' }}>Serif</span>
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().setFontFamily('monospace').run();
                  setFontMenuOpen(false);
                }}
                className={editor.isActive('textStyle', { fontFamily: 'monospace' }) ? styles.tiptapActive : ''}
              >
                <span style={{ fontFamily: 'monospace' }}>Monospace</span>
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().setFontFamily('cursive').run();
                  setFontMenuOpen(false);
                }}
                className={editor.isActive('textStyle', { fontFamily: 'cursive' }) ? styles.tiptapActive : ''}
              >
                <span style={{ fontFamily: 'cursive' }}>Cursive</span>
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().unsetFontFamily().run();
                  setFontMenuOpen(false);
                }}
              >
                <EraserIcon /> <span>Bỏ font</span>
              </button>
            </div>
          )}
        </div>

        {/* Font Size */}
        <div className={styles.tiptapMenuContainer} ref={fontSizeMenuRef}>
          <button
            onClick={() => setFontSizeMenuOpen(!fontSizeMenuOpen)}
            className={fontSizeMenuOpen ? styles.tiptapActive : ''}
          >
            <FontSizeIcon />
          </button>
          {fontSizeMenuOpen && (
            <div className={styles.tiptapDropdownMenu}>
              <button onClick={() => editor.chain().focus().unsetFontSize().run()}>
                <span>Mặc định</span>
              </button>
              {fontSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    editor.chain().focus().setFontSize(size).run();
                    setFontSizeMenuOpen(false);
                  }}
                >
                  <span style={{ fontSize: size }}>{size}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Headings */}
        <div className={styles.tiptapMenuContainer} ref={headingMenuRef}>
          <button
            onClick={() => setHeadingMenuOpen(!headingMenuOpen)}
            className={headingMenuOpen ? styles.tiptapActive : ''}
          >
            <HeadingIcon />
          </button>
          {headingMenuOpen && (
            <div className={styles.tiptapDropdownMenu}>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? styles.tiptapActive : ''}
              >
                <span style={{ fontSize: '32px' }}>H1</span>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? styles.tiptapActive : ''}
              >
                <span style={{ fontSize: '24px' }}>H2</span>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? styles.tiptapActive : ''}
              >
                <span style={{ fontSize: '18.72px' }}>H3</span>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                className={editor.isActive('heading', { level: 4 }) ? styles.tiptapActive : ''}
              >
                <span style={{ fontSize: '16px' }}>H4</span>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
                className={editor.isActive('heading', { level: 5 }) ? styles.tiptapActive : ''}
              >
                <span style={{ fontSize: '13.28px' }}>H5</span>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
                className={editor.isActive('heading', { level: 6 }) ? styles.tiptapActive : ''}
              >
                <span style={{ fontSize: '10.72px' }}>H6</span>
              </button>
            </div>
          )}
        </div>

        {/* Basic formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? styles.tiptapActive : ''}
        >
          <BoldIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={editor.isActive('highlight') ? styles.tiptapActive : ''}
        >
          <HighlightIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? styles.tiptapActive : ''}
        >
          <ItalicIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? styles.tiptapActive : ''}
        >
          <StrikeIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? styles.tiptapActive : ''}
        >
          <UnderlineIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? styles.tiptapActive : ''}
        >
          <BlockquoteIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? styles.tiptapActive : ''}
        >
          <BulletListIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? styles.tiptapActive : ''}
        >
          <OrderedListIcon />
        </button>
        <button onClick={addImage}><ImageIcon /></button>

        {/* Table menu */}
        <div className={styles.tiptapMenuContainer} ref={tableMenuRef}>
          <button
            onClick={() => setTableMenuOpen(!tableMenuOpen)}
            className={tableMenuOpen ? styles.tiptapActive : ''}
          >
            <InsertTableIcon />
          </button>
          {tableMenuOpen && (
            <div className={styles.tiptapDropdownMenu}>
              <button onClick={() => {
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                setTableMenuOpen(false);
              }}>
                <InsertTableIcon /> <span>Thêm bảng</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().addColumnBefore().run();
                setTableMenuOpen(false);
              }}>
                <ColumnInsertRightIcon /> <span>Thêm cột bên trái</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().addColumnAfter().run();
                setTableMenuOpen(false);
              }}>
                <ColumnInsertLeftIcon /> <span>Thêm cột bên phải</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().deleteColumn().run();
                setTableMenuOpen(false);
              }}>
                <DeleteColumnIcon /> <span>Xóa cột</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().addRowBefore().run();
                setTableMenuOpen(false);
              }}>
                <RowInsertTopIcon /> <span>Thêm dòng bên trên</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().addRowAfter().run();
                setTableMenuOpen(false);
              }}>
                <RowInsertBottomIcon /> <span>Thêm dòng bên dưới</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().deleteRow().run();
                setTableMenuOpen(false);
              }}>
                <DeleteRowIcon /> <span>Xóa dòng</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().deleteTable().run();
                setTableMenuOpen(false);
              }}>
                <DeleteTableIcon /> <span>Xóa bảng</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().mergeCells().run();
                setTableMenuOpen(false);
              }}>
                <CellMergeIcon /> <span>Hợp nhất ô</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().splitCell().run();
                setTableMenuOpen(false);
              }}>
                <SplitCellIcon /> <span>Tách ô</span>
              </button>
            </div>
          )}
        </div>

        {/* Color picker */}
        <div className={styles.tiptapMenuContainer} ref={colorPickerRef}>
          <button
            onClick={() => setColorPickerMenuOpen(!colorPickerMenuOpen)}
            className={colorPickerMenuOpen ? styles.tiptapActive : ''}
          >
            <SetColorIcon />
          </button>
          {colorPickerMenuOpen && (
            <div className={styles.tiptapDropdownMenu}>
              <input
                type="color"
                className={styles.tiptapColorPicker}
                onInput={event => editor.chain().focus().setColor(event.target.value).run()}
                value={editor.getAttributes('textStyle').color}
              />
              <button
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setColorPickerMenuOpen(false);
                }}
              >
                Unset
              </button>
            </div>
          )}
        </div>

        {/* Text alignment */}
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? styles.tiptapActive : ''}
        >
          <AlignLeftIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? styles.tiptapActive : ''}
        >
          <AlignCenterIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? styles.tiptapActive : ''}
        >
          <AlignRightIcon />
        </button>
      </div>
    </div>
  );
} 