import React, { useState, useEffect, useRef } from 'react';
// Import các thành phần cần thiết giống TiptapChild.jsx
import { EditorContent, useEditor, BubbleMenu } from '@tiptap/react';
import { Color } from '@tiptap/extension-color';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import TextStyle from '@tiptap/extension-text-style';
import StarterKit from '@tiptap/starter-kit';
import { message } from 'antd';
import css from './TiptapChild.module.css'; // Sử dụng CSS từ TiptapChild
import { getCurrentUserLogin } from '../../../../apis/userService.jsx';
import { updatePhanTichNote, getAllPhanTichNote, createPhanTichNote } from '../../../../apisKTQT/phantichNoteService.jsx';
// Import các Icon cần thiết giống TiptapChild.jsx (Bỏ CancelIcon)
import { SaveIcon, EditIcon, LineHeightIcon } from './ListIcon.jsx';
import { LineHeight } from './LineHeight'; // Import extension LineHeight
import Link from '@tiptap/extension-link';

const TiptapChild2 = ({ tableName }) => {
    // Sử dụng cấu hình editor giống TiptapChild.jsx
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: true,
            }),
            Link.configure({ openOnClick: true }),
            TextStyle.configure({ types: ['textStyle'] }),
            Color.configure({ types: ['textStyle'] }),
            Document,
            Paragraph,
            Text,
            LineHeight, // Thêm LineHeight extension
        ],
        content: '',
    });

    // State giống TiptapChild.jsx
    const [isEditing, setIsEditing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [originalContent, setOriginalContent] = useState('');
    const [currentNote, setCurrentNote] = useState(null);
    const [showButton, setShowButton] = useState(false);
    const [lineHeightMenuOpen, setLineHeightMenuOpen] = useState(false);
    const lineHeightMenuRef = useRef(null);

    const lineHeights = ["1.0", "1.15", "1.5", "2.0", "2.5", "3.0"];

    // useEffect để đóng menu LineHeight khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(event) {
            if (lineHeightMenuRef.current && !lineHeightMenuRef.current.contains(event.target)) {
                setLineHeightMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch current user
    useEffect(() => {
        const fetchCurrentUser = async () => {
            const { data } = await getCurrentUserLogin();
            if (data) {
                setCurrentUser(data);
            } else {
                console.error("Could not fetch current user");
            }
        };
        fetchCurrentUser();
    }, []);

    // Fetch hoặc tạo note
    useEffect(() => {
        const fetchOrCreateNote = async () => {
            if (currentUser && editor && tableName) {
                try {
                    const notes = await getAllPhanTichNote();
                    const foundNote = notes.find(note => note.table === tableName);
                    let noteToSet;
                    if (foundNote) {
                        noteToSet = foundNote;
                    } else {
                        const newNoteData = {
                            body:  '<p></p>',
                            user_email: currentUser.email,
                            user_name: currentUser.name,
                            table: tableName
                        };
                        noteToSet = await createPhanTichNote(newNoteData);
                    }

                    if (noteToSet) {
                        setCurrentNote(noteToSet);
                        let content = noteToSet.body || '';
                        if (!content || content === '<p></p>' || content.trim() === '') {
                            content = '<p></p>';
                        }
                        if (editor.isEditable !== undefined) {
                           editor.commands.setContent(content);
                           setOriginalContent(content);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching or creating PhanTichNote:", error);
                    message.error("Lỗi khi tải hoặc tạo ghi chú!");
                }
            }
        };
         if (editor) {
            fetchOrCreateNote();
         }
    }, [currentUser, editor, tableName]);

    // Set editor editable state
    useEffect(() => {
        if (editor) {
            editor.setEditable(isEditing);
        }
    }, [isEditing, editor]);

    // Hàm xử lý khi nhấn nút Edit (tương tự toggleEditMode)
    const handleEditClick = () => {
         if (currentUser?.isAdmin) {
            setIsEditing(!isEditing);
            setShowButton(true);
         } else {
             message.warn('Bạn không có quyền sửa vì không phải là Admin!');
         }
    };

    // Hàm xử lý khi nhấn nút Save (tương tự handleSave)
    const handleSaveClick = async () => {
        if (!editor || !currentNote || !currentUser) return;
        try {
            const content = editor.getHTML();
            await updatePhanTichNote(currentNote.id, {
                body: content,
                user_name: currentUser.name,
                user_email: currentUser.email
            });
            setShowButton(false);
            setIsEditing(false);
            setOriginalContent(content);
            message.success('Đã lưu!');
        } catch (error) {
            console.error("Error updating wiki note:", error);
            message.error('Có lỗi khi lưu!');
        }
    };

    if (!editor) {
        return null;
    }

    // JSX Structure giống TiptapChild.jsx
    return (
        <div className={css.main}>
            {/* Phần info và nút Edit/Save giống TiptapChild.jsx */}
            {currentUser?.isAdmin && (
                <div className={css.info}>
                    <div className={css.infoRight}>
                        <div className={css.controlContainer}>
                            {showButton ? (
                                <div
                                    className={css.editMode}
                                    onClick={handleSaveClick}
                                >
                                    <SaveIcon />
                                </div>
                            ) : (
                                <div
                                    className={css.editMode}
                                    onClick={handleEditClick}
                                >
                                    <EditIcon />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Phần tiptap và editor content giống TiptapChild.jsx */}
            <div className={currentUser?.isAdmin ? css.tiptap : css.tiptapFull}>
                <div className={isEditing ? css.editorContent : css.editorContentFull}>
                    {/* BubbleMenu giống TiptapChild.jsx */}
                    {editor && (
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
                                {/* Line Height Menu giống TiptapChild.jsx */}
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
                                                    editor.chain().focus().unsetLineHeight().run(); // Hoặc setLineHeight('normal')
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
                                {/* Color Picker giống TiptapChild.jsx */}
                                <input
                                    type="color"
                                    onInput={event => editor.chain().focus().setColor(event.target.value).run()}
                                    value={editor.getAttributes('textStyle').color || '#000000'}
                                    data-testid="setColor"
                                />
                            </div>
                        </BubbleMenu>
                    )}
                    <EditorContent
                        className={css.editorContentWrap}
                        editor={editor}
                    />
                </div>
            </div>
        </div>
    );
};

export default TiptapChild2;