import React, {useContext, useEffect, useState} from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import css from './SubStepNotepad.module.css';

// API imports
import {createNewNotepad, deleteNotepad, getAllNotepad, updateNotepad} from "../../../../../apis/notepadService.jsx";
import {IconButton} from "@mui/material";
import {CancelIcon, EditIcon, SaveIcon} from "../../../../../icon/IconSVG.js";
import {updateCard} from "../../../../../apis/cardService.jsx";
import {createTimestamp} from "../../../../../generalFunction/format.js";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {MyContext} from "../../../../../MyContext.jsx";

const SubStepNotepad = ({sub_step_id, idCard, permissionsSubStep}) => {
    const UPDATE_PERMISSION = permissionsSubStep?.update;
    const [notepad, setNotepad] = useState(null);
    const [editorContent, setEditorContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [originalContent, setOriginalContent] = useState('');
    const { loadData, setLoadData } = useContext(MyContext);

    const modules = {
        toolbar: [
            [{'header': [1, 2, 3, 4, 5, 6, false]}],
            ['bold', 'italic', 'underline', 'strike'],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            ['link', 'image'],
            ['clean']
        ]
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'link', 'image'
    ];

    useEffect(() => {
        loadNotepadData();
    }, [sub_step_id]);

    const loadNotepadData = async () => {
        try {
            const notepads = await getAllNotepad();
            const existingNotepad = notepads.find(
                np => np.sub_step_id == sub_step_id && np.card_id == idCard
            );

            if (existingNotepad) {
                setNotepad(existingNotepad);
                setEditorContent(existingNotepad.content || '');
            } else {
                const newNotepad = {
                    sub_step_id,
                    card_id: idCard,
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

    const handleEdit = () => {
        setOriginalContent(editorContent);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setEditorContent(originalContent);
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!notepad) return;

        try {
            const updatedNotepad = await updateNotepad({
                ...notepad,
                content: editorContent
            });
            const { data, error } = await getCurrentUserLogin();
            const newData = {
                id : idCard,
                user_update: data.email,
                updated_at: createTimestamp(),
            }
            await updateCard(newData)
            setLoadData(!loadData)
            setNotepad(updatedNotepad);
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving notepad:", error);
        }
    };

    const handleDelete = async () => {
        if (!notepad) return;

        try {
            await deleteNotepad(notepad.id);
            setNotepad(null);
            setEditorContent('');
        } catch (error) {
            console.error("Error deleting notepad:", error);
        }
    };

    return (
        <div className={css.inputListContainer}>
            <div className={css.notepadHeader}>
                {UPDATE_PERMISSION
                    ? (
                        !isEditing ? (
                            <div className={css.notepadActions}>
                                <IconButton onClick={handleEdit} size="small">
                                    <img src={EditIcon} alt=""/>
                                </IconButton>
                                {/* <IconButton onClick={handleDelete} size="small">
                                    <img src={XRedIcon} alt="" />
                                </IconButton> */}
                            </div>
                        ) : (
                            <div className={css.editActions}>
                                <IconButton onClick={handleSave} size="small">
                                    <img src={SaveIcon} alt=""/>
                                </IconButton>
                                <IconButton onClick={handleCancel} size="small">
                                    <img src={CancelIcon} alt=""/>
                                </IconButton>
                                {/*<button onClick={handleSave}>Save</button>*/}
                                {/*<button onClick={handleCancel}>Cancel</button>*/}
                            </div>
                        )
                    )
                    : (<></>)
                }
            </div>

            <ReactQuill
                value={editorContent}
                onChange={setEditorContent}
                modules={modules}
                formats={formats}
                readOnly={!isEditing}
                theme="snow"
            />
        </div>
    );
};

export default SubStepNotepad;