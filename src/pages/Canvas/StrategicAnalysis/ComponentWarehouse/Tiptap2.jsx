import React, { useState, useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { Button, message } from 'antd';
import css from './Tiptap2.module.css';
import { TiptapToolbar } from './TiptapToolbar';
import { useEditor } from './useEditor';
import { createPhanTichNote, getAllPhanTichNote, updatePhanTichNote } from '../../../../apisKTQT/phantichNoteService.jsx';
import { getCurrentUserLogin } from '../../../../apis/userService.jsx';

const Tiptap2 = ({ tableName }) => {
  const { editor } = useEditor();
  const [phantichNote, setPhanTichNote] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const result = await getCurrentUserLogin();
      if (result?.data) {
        setCurrentUser(result.data);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchAllPhanTichNote = async () => {
      try {
        if (currentUser && editor) {
          const notes = await getAllPhanTichNote();
          const foundNote = notes.find(note => note.table === tableName);
          if (foundNote) {
            setPhanTichNote(foundNote);
            editor.commands.setContent(foundNote.body);
          } else {
            const newNoteData = {
              body: '<p></p>',
              user_email: currentUser.email,
              user_name: currentUser.name,
              table: tableName
            };
            const newNote = await createPhanTichNote(newNoteData);
            setPhanTichNote(newNote);
            editor.commands.setContent(newNote.body);
          }
        }
      } catch (error) {
        message.error('Lỗi khi tải hoặc tạo ghi chú!');
      }
    };
    if (editor && currentUser) {
      fetchAllPhanTichNote();
    }
    // Lắng nghe reload event
    const reloadHandler = () => {
      fetchAllPhanTichNote();
    };
    window.addEventListener('reload-tiptap2-cong-cu-dai-duong-xanh', reloadHandler);
    return () => {
      window.removeEventListener('reload-tiptap2-cong-cu-dai-duong-xanh', reloadHandler);
    };
  }, [tableName, currentUser, editor]);

  const handleEditClick = () => {
    if (currentUser?.isAdmin) {
      setIsEditing(true);
    } else {
      message.warn('Bạn không có quyền sửa vì không phải là Admin!');
    }
  };

  const handleSaveClick = async () => {
    try {
      setLoading(true);
      const content = editor.getHTML();
      await updatePhanTichNote(phantichNote.id, {
        body: content,
        user_name: currentUser.name,
        user_email: currentUser.email
      });
      setIsEditing(false);
      message.success('Đã lưu!');
    } catch (error) {
      message.error('Có lỗi khi lưu!');
    }
    setLoading(false);
  };

  const handleCancelClick = () => {
    editor.commands.setContent(phantichNote.body);
    setIsEditing(false);
  };

  if (!editor) return null;

  return (
    <div className={css.main}>
           <div style={{display: 'flex', gap: 8, width:'100%', justifyContent:'end' }}>
        {isEditing ? (
          <>
            <Button type="primary" onClick={handleSaveClick} loading={loading}>Lưu</Button>
            <Button onClick={handleCancelClick}>Hủy</Button>
          </>
        ) : (
            <Button onClick={handleEditClick}>Cập nhật</Button>
        )}
      </div>
      <div className={css.tool_bar} style={{ opacity: isEditing ? 1 : 0 }}>
        
        <TiptapToolbar editor={editor} />
      </div>
      <div className={css.tiptap}>
        <div className={isEditing ? css.editorContent : css.editorContentFull}>
          <EditorContent className={css.editorContentWrap} editor={editor} />
        </div>
      </div>

    </div>
  );
};

export default Tiptap2; 