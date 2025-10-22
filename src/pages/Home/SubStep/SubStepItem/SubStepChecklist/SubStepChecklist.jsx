import React, {useContext, useEffect, useState} from 'react';
import css from './SubStepChecklist.module.css';
import { IconButton } from "@mui/material";
import { CancelIcon, EditIcon, SaveIcon, XRedIcon } from "../../../../../icon/IconSVG.js";
// API
import {
    createNewCheckList,
    getAllCheckList,
    updateCheckList,
    deleteCheckList
} from '../../../../../apis/checklistService';
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {createTimestamp} from "../../../../../generalFunction/format.js";
import {updateCard} from "../../../../../apis/cardService.jsx";
import {MyContext} from "../../../../../MyContext.jsx";

const SubStepChecklist = ({ sub_step_id, idCard, permissionsSubStep }) => {
    const UPDATE_PERMISSION = permissionsSubStep?.update;
    const [checklist, setChecklist] = useState(null);
    const [options, setOptions] = useState([]);
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [originalOptions, setOriginalOptions] = useState([]);
    const { loadData, setLoadData } = useContext(MyContext);

    useEffect(() => {
        loadChecklistData();
    }, [sub_step_id, idCard]);

    const loadChecklistData = async () => {
        try {
            const checklists = await getAllCheckList();
            const existingChecklist = checklists.find(
                cl => cl.sub_step_id == sub_step_id && cl.card_id == idCard
            );
            if (existingChecklist) {
                setChecklist(existingChecklist);
                setOptions(existingChecklist.options || []);
            } else {
                const templateChecklist = checklists.find(
                    cl => cl.sub_step_id == sub_step_id && cl.card_id == null
                );
                const newChecklist = {
                    sub_step_id,
                    card_id: idCard,
                    options: templateChecklist.options,
                    position: 0,
                };
                const createdChecklist = await createNewCheckList(newChecklist);

                setChecklist(createdChecklist);
                setOptions(createdChecklist.options);
            }
        } catch (error) {
            console.error("Error loading checklist:", error);
        }
    };

    const handleEdit = () => {
        setOriginalOptions(JSON.parse(JSON.stringify(options)));
        setIsEditing(true);
    };

    const handleCancel = () => {
        setOptions(JSON.parse(JSON.stringify(originalOptions)));
        setIsEditing(false);
        setNewChecklistItem('');
    };

    const handleSave = async () => {
        if (!checklist) return;

        try {
            const updatedChecklist = await updateCheckList({
                ...checklist,
                options: options
            });
            const { data, error } = await getCurrentUserLogin();
            const newData = {
                id : idCard,
                user_update: data.email,
                updated_at: createTimestamp(),
            }
            await updateCard(newData)
            setLoadData(!loadData)
            setChecklist(updatedChecklist);
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving checklist:", error);
        }
    };

    const handleDelete = async () => {
        if (!checklist) return;

        try {
            await deleteCheckList(checklist.id);
            setChecklist(null);
            setOptions([]);
        } catch (error) {
            console.error("Error deleting checklist:", error);
        }
    };

    const handleAddItem = () => {
        if (!newChecklistItem.trim()) return;

        const newItem = {
            id: Date.now(), // Temporary unique ID
            text: newChecklistItem,
            completed: false
        };

        setOptions([...options, newItem]);
        setNewChecklistItem('');
    };

    const handleRemoveItem = (itemId) => {
        setOptions(options.filter(item => item.id !== itemId));
    };

    const handleToggleItem = async (itemId) => {
        const updatedOptions = options.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );

        setOptions(updatedOptions);

        if (checklist) {
            try {
                await updateCheckList({
                    ...checklist,
                    options: updatedOptions
                });
            } catch (error) {
                console.error("Error updating checklist item status:", error);
                // Optionally, revert the local state if the save fails
                setOptions(options);
            }
        }
    };

    return (
        <div className={css.inputListContainer}>
            <div className={css.checklistHeader}>
                {UPDATE_PERMISSION
                    ? (
                        !isEditing ? (
                            <div>
                                <IconButton onClick={handleEdit} size="small">
                                    <img src={EditIcon} alt="" />
                                </IconButton>
                                {/* <IconButton onClick={handleDelete} size="small">
                                <img src={XRedIcon} alt="" />
                            </IconButton> */}
                            </div>
                        ) : (
                            <div>
                                <IconButton onClick={handleSave} size="small">
                                    <img src={SaveIcon} alt="" />
                                </IconButton>
                                <IconButton onClick={handleCancel} size="small">
                                    <img src={CancelIcon} alt="" />
                                </IconButton>
                            </div>
                        )
                    )
                    : (<></>)
                }
            </div>

            {isEditing && (
                <div className={css.newItemInput}>
                    <button onClick={handleAddItem}>+</button>
                    <input
                        type="text"
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        placeholder="Enter new item"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                    />
                </div>
            )}

            <div className={css.checklistContainer}>
                {options.map((item) => (
                    <div
                        key={item.id}
                        className={`${css.checklistItem} ${item.completed ? css.completed : ''}`}
                    >
                        <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleItem(item.id)}
                        />
                        <span>{item.text}</span>
                        {isEditing && (
                            <IconButton onClick={() => handleRemoveItem(item.id)} size="small">
                                <img src={XRedIcon} alt="" />
                            </IconButton>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubStepChecklist;