import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import css from './TemplateNotepad.module.css';

import {
    createNewNotepad,
    deleteNotepad,
    getAllNotepad,

} from "../../../../../apis/notepadService.jsx";
import { DeleteIcon, UnSaveTron } from "../../../../../icon/IconSVG.js";

const TemplateNotepad = ({ sub_step_id }) => {
    const [notepad, setNotepad] = useState(null);
    const [editorContent, setEditorContent] = useState('');

    // Quill module configuration
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['clean']
        ]
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'link', 'image',
        'color', 'background',
        'align'
    ];

    useEffect(() => {
        loadNotepadData();
    }, [sub_step_id]);

    const loadNotepadData = async () => {
        try {
            const notepads = await getAllNotepad();
            const existingNotepad = notepads.find(np => np.sub_step_id === sub_step_id && np.card_id == null);

            if (existingNotepad) {
                setNotepad(existingNotepad);
                setEditorContent(existingNotepad.content || '');
            } else {
                const newNotepad = {
                    sub_step_id,
                    content: '',
                    position: 0,
                };
                const createdNotepad = await createNewNotepad(newNotepad);
                setNotepad(createdNotepad);
            }
        } catch (error) {
            console.error("Error loading notepad:", error);
        }
    };

    const handleContentChange = (content) => {
        setEditorContent(content);
    };

    const handleDelete = async () => {
        if (!notepad) return;

        try {
            await deleteNotepad(notepad.id);
            setNotepad(null);
            setEditorContent('');
        } catch (error) {
            console.error("Error deleting notepad:", error);
            Modal.error({
                title: 'Delete Failed',
                content: 'Unable to delete notepad. Please try again.'
            });
        }
    };

    return (
        <div className={css.inputListContainer}>
            <div className={css.notepadHeader}>
                {/*<div className={css.notepadActions}>*/}
                {/*    {notepad && <button className={css.btn} onClick={handleDelete}><img src={DeleteIcon} alt=""/></button>}*/}
                {/*</div>*/}
            </div>

            <ReactQuill
                value={editorContent}
                onChange={handleContentChange}
                readOnly={true}
                modules={modules}
                formats={formats}
                theme="snow"
            />
        </div>
    );
};

export default TemplateNotepad;