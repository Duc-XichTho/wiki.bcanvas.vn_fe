import React, { useState, useEffect } from 'react';
import { FileText, Edit2, Save, X } from 'lucide-react';

const NotesSection = ({ styles, initialNotes, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [notes, setNotes] = useState(initialNotes);
    const [tempNotes, setTempNotes] = useState(initialNotes);

    useEffect(() => {
        setNotes(initialNotes || '');
        setTempNotes(initialNotes);
    }, [initialNotes]);

    const handleSave = async () => {
        try {
            await onSave(tempNotes);
            setNotes(tempNotes);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save notes:', error);
        }
    };

    return (
        <div className={styles.notesSection}>
            <div className={styles.notes}>
                <div className={styles.notesHeader}>
                    <div className={styles.notesTitle}>
                        <FileText className={styles.notesIcon} />
                        <span>Ghi chú</span>
                    </div>
                    {isEditing ? (
                        <div className={styles.editActions}>
                            <button onClick={handleSave} className={styles.editButton}>
                                <Save size={18} />
                            </button>
                            <button
                                onClick={() => {
                                    setTempNotes(notes);
                                    setIsEditing(false);
                                }}
                                className={styles.editButton}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className={styles.editButton}>
                            <Edit2 size={18} />
                        </button>
                    )}
                </div>
                <textarea
                    value={isEditing ? tempNotes : notes}
                    onChange={(e) => isEditing && setTempNotes(e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                    className={styles.notesTextarea}
                />
            </div>
        </div>
    );
};

export default NotesSection;