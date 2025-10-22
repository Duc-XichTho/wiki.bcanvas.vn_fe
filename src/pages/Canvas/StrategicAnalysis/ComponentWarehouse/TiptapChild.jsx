import css from './TiptapChild.module.css'
import { useEffect, useState, useRef } from 'react';
import { BubbleMenu, EditorContent, useEditor } from '@tiptap/react'
import { Color } from '@tiptap/extension-color'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import TextStyle from '@tiptap/extension-text-style'
// import { TiptapToolbar } from './TiptapToolbar'
// import { useEditor } from './useEditor'
import { message } from 'antd'
import { EditIcon, SaveIcon, LineHeightIcon } from './ListIcon.jsx'
import { updateFileNotePad } from '../../../../apis/fileNotePadService.jsx'
import { getCurrentUserLogin } from "../../../../apis/userService.jsx";
import StarterKit from '@tiptap/starter-kit'
import { LineHeight } from './LineHeight'

export default function TiptapChild({ fileNotePad, fetchData }) {

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: true,
      }),
      TextStyle.configure({
        types: ['textStyle']
      }),
      Color.configure({
        types: ['textStyle']
      }),
      Document,
      Paragraph,
      Text,
      LineHeight
    ],
    content: '',
  })
  const lineHeightMenuRef = useRef(null);
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [colorPickerMenuOpen, setColorPickerMenuOpen] = useState(false);
  const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
  const [isEditMode, setEditMode] = useState(false)
  const [showButton, setShowButton] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [lineHeightMenuOpen, setLineHeightMenuOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (lineHeightMenuRef.current && !lineHeightMenuRef.current.contains(event.target)) {
        // setLineHeightMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const lineHeights = ["1.0", "1.15", "1.5", "2.0", "2.5", "3.0"];

  const fetchCurrentUser = async () => {
    const { data, error } = await getCurrentUserLogin();
    if (data) {
      setCurrentUser(data);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditMode)
    }
  }, [isEditMode, editor])

  useEffect(() => {
    if (fileNotePad?.url) {
      editor.commands.setContent(fileNotePad.url)
    }
  }, [fileNotePad?.url])

  const handleSave = async () => {
    try {
      const content = editor.getHTML()
      const data = {
        ...fileNotePad,
        url: content,
      }
      await updateFileNotePad(data)
      await fetchData()
      setShowButton(false)
      setEditMode(false)
      message.success('Đã lưu')
    } catch (error) {
      console.log(error)
      message.error('Có lỗi khi lưu')
    }
  }

  const toggleEditMode = () => {
    setEditMode(!isEditMode)
    setShowButton(true)
  }

  if (!editor) {
    return null
  }

  return (
    <div className={css.main}>
      {currentUser?.isAdmin && (
        <div className={css.info}>
          <div className={css.infoRight}>
            <div className={css.controlContainer}>
              {showButton ? (
                <div
                  className={css.editMode}
                  onClick={handleSave}
                >
                  <SaveIcon />
                </div>
              ) : (
                <div
                  className={css.editMode}
                  onClick={toggleEditMode}
                >
                  <EditIcon />
                </div>
              )}
            </div>

          </div>
        </div>
      )}
      <div className={currentUser?.isAdmin ? css.tiptap : css.tiptapFull}>
        <div className={isEditMode ? css.editorContent : css.editorContentFull}>
          {editor &&
            <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
              <div className="bubble-menu">
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={editor.isActive('bold') ? 'is-active' : ''}
                >
                  Bold
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={editor.isActive('italic') ? 'is-active' : ''}
                >
                  <i>Italic</i>
                </button>
                <div className={css.lineHeightMenuContainer} ref={lineHeightMenuRef}>
                  <button
                    onClick={() => setLineHeightMenuOpen(!lineHeightMenuOpen)}
                    className={lineHeightMenuOpen ? css.isActive : ''}
                  >
                    <LineHeightIcon />
                  </button>
                  {lineHeightMenuOpen && (
                    <div className={css.lineHeightDropdownMenu}>
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
                          className={editor.isActive('lineHeight', { lineHeight: height }) ? css.isActive : ''}
                        >
                          <span>{height}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="color"
                  onInput={event => editor.chain().focus().setColor(event.target.value).run()}
                  value={editor.getAttributes('textStyle').color}
                  data-testid="setColor"
                />

              </div>
            </BubbleMenu>
          }
          <EditorContent
            className={css.editorContentWrap}
            editor={editor}
          />
        </div>
      </div>
    </div>
  )
}
