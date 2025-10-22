import css from './TipTap.module.css'
import { useEffect, useState } from 'react';
import { EditorContent } from '@tiptap/react'
import { TiptapToolbar } from './TiptapToolbar'
import { useEditor } from './useEditor'
import { message } from 'antd'
import { EditIcon, SaveIcon } from './ListIcon.jsx'
import { updateFileNotePad, deleteS3File } from '../../../../apis/fileNotePadService.jsx'
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
	const [lineHeightMenuOpen, setLineHeightMenuOpen] = useState(false);

  const fetchCurrentUser = async () => {
    const { data, error } = await getCurrentUserLogin();
    if (data) {
      setCurrentUser(data);
    }
  };

  function extractImageUrls(html) {
    const regex = /<img[^>]+src="([^">]+)"/g;
    const urls = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      urls.push(match[1]);
    }
    return urls;
  }

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
      const newContent = editor.getHTML();
      const oldContent = fileNotePad?.url || "";

      const oldImages = extractImageUrls(oldContent);
      const newImages = extractImageUrls(newContent);

      const deletedImages = oldImages.filter(url => !newImages.includes(url));

      await Promise.all(
          deletedImages.map(async (url) => {
            try {
              await deleteS3File({ fileUrl: url });
            } catch (err) {
              console.warn("Lỗi khi xóa ảnh:", url, err);
            }
          })
      );

      const data = {
        ...fileNotePad,
        url: newContent,
      };

      await updateFileNotePad(data);
      await fetchData();
      setShowButton(false);
      setEditMode(false);
      message.success('Đã lưu và đồng bộ ảnh');
    } catch (error) {
      console.error(error);
      message.error('Có lỗi khi lưu');
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
                  <span>Lưu</span>
                  <SaveIcon />
                </div>
              ) : (
                <div
                  className={css.editMode}
                  onClick={toggleEditMode}
                >
                  <span>Cập nhật</span>
                  <EditIcon />
                </div>
              )}
            </div>

          </div>
        </div>
      )}
      <div className={currentUser?.isAdmin ? css.tiptap : css.tiptapFull}>
        {isEditMode && (
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
        )}

        <div className={isEditMode ? css.editorContent : css.editorContentFull}>
          <EditorContent
            className={css.editorContentWrap}
            editor={editor}
          />
        </div>
      </div>
    </div>
  )
}
