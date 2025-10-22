import css from './TipTap.module.css'
import { useEffect, useState } from 'react';
import { EditorContent } from '@tiptap/react'
import { TiptapToolbar } from './TiptapToolbar'
import { useEditor } from './useEditor'
import { message } from 'antd'
import { EditIcon, SaveIcon } from './ListIcon.jsx'
import { updateFileNotePad } from '../../../../apis/fileNotePadService.jsx'
import { getCurrentUserLogin } from "../../../../apis/userService.jsx";

export default function Tiptap({ fileNotePad, fetchData }) {
  const { editor } = useEditor();
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [colorPickerMenuOpen, setColorPickerMenuOpen] = useState(false);
  const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
  const [isEditMode, setEditMode] = useState(false)
  const [showButton, setShowButton] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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
      <div className={css.tiptapFull}>
        <div className={css.editorContentFull}>
          <EditorContent
            className={css.editorContentWrap}
            editor={editor}
          />
        </div>
      </div>
    </div>
  )
}
