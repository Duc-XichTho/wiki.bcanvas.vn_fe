import React, { useState, forwardRef } from 'react';
import { X } from 'lucide-react';
import css from './CreateTaskPopup.module.css';

const CreateTaskPopup = forwardRef(({ isOpen, onClose, selectedProgressStep, onCreateTask, currentUser }, ref) => {
    const [formData, setFormData] = useState({
        title: '',
        tag: '',
        pic: '',
        cat: 'To-do',
        deadline: ''
    });

    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }

        onCreateTask({
            ...formData,
            lastUpdate: new Date().toLocaleString(),
            updateUser: currentUser.split('@')[0]
        });

        setFormData({
            title: '',
            tag: '',
            pic: '',
            cat: 'To-do',
            deadline: ''
        });

        onClose();
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (name === 'title') setError('');
    };

    return (
        <div className={css.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={css.popup}>
                <div className={css.header}>
                    <h2 className={css.title}>Create New Task</h2>
                    <button className={css.closeButton} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={css.form}>
                    <div className={css.formGroup}>
                        <label className={`${css.label} ${css.required}`}>Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className={`${css.input} ${error ? css.error : ''}`}
                            ref={ref}
                        />
                        {error && <span className={css.errorText}>{error}</span>}
                    </div>

                    <div className={css.formGroup}>
                        <label className={css.label}>Tag</label>
                        <select
                            className={css.select}
                            value={formData.tag}
                            onChange={(e) => handleChange('tag', e.target.value)}
                        >
                            <option value="">Select tag</option>
                            {selectedProgressStep?.tag?.map((tag) => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                    </div>

                    <div className={css.formGroup}>
                        <label className={css.label}>PIC</label>
                        <select
                            className={css.select}
                            value={formData.pic}
                            onChange={(e) => handleChange('pic', e.target.value)}
                        >
                            <option value="">Select PIC</option>
                            {selectedProgressStep?.pic?.map((pic) => (
                                <option key={pic} value={pic}>{pic}</option>
                            ))}
                        </select>
                    </div>

                    <div className={css.formGroup}>
                        <label className={css.label}>Category</label>
                        <select
                            className={css.select}
                            value={formData.cat}
                            onChange={(e) => handleChange('cat', e.target.value)}
                        >
                            <option value="To-do">To-do</option>
                            <option value="Backlog">Backlog</option>
                            <option value="Do-ing">Do-ing</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                        </select>
                    </div>

                    <div className={css.formGroup}>
                        <label className={css.label}>Deadline</label>
                        <input
                            type="date"
                            value={formData.deadline}
                            onChange={(e) => handleChange('deadline', e.target.value)}
                            className={css.input}
                        />
                    </div>

                    <div className={css.buttonGroup}>
                        <button type="button" onClick={onClose} className={`${css.button} ${css.cancelButton}`}>
                            Cancel
                        </button>
                        <button type="submit" className={`${css.button} ${css.submitButton}`}>
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

export default CreateTaskPopup;