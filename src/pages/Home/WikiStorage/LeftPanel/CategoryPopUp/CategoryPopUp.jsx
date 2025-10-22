import React, { useState } from 'react';
import { Trash2, Plus, Edit2, Check } from 'lucide-react'; // Added Edit2 and Check icons
import css from './CategoryPopUp.module.css';
import { toast } from 'react-toastify';
import { createCategory, updateCategory } from '../../../../../apis/categoryService';

const CategoryPopUp = ({ categories, setIsModalOpen, getCategoryData }) => {
    const [newCategory, setNewCategory] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');

    const handleAdd = async () => {
        try {
            await createCategory({ name: newCategory })
            setNewCategory('');
            getCategoryData();
        } catch (e) {
            console.error(e)
            toast.error("Lỗi khi tạo danh mục!")
        }
    }

    const handleDelete = async (categoryId) => {
        try {
            await updateCategory({ id: categoryId, show: false });
            getCategoryData();
        } catch (e) {
            console.error(e);
            toast.error("Lỗi khi xóa danh mục!");
        }
    }

    const startEditing = (category) => {
        setEditingId(category.id);
        setEditingName(category.name);
    }

    const handleEdit = async (categoryId) => {
        try {
            await updateCategory({ id: categoryId, name: editingName });
            setEditingId(null);
            setEditingName('');
            getCategoryData();
            toast.success("Cập nhật danh mục thành công!");
        } catch (e) {
            console.error(e);
            toast.error("Lỗi khi cập nhật danh mục!");
        }
    }

    const handleOverlayClick = (e) => {
        if (e.target.className === css.modalOverlay) {
            getCategoryData();
            setIsModalOpen(false);
        }
    }

    return (
        <div className={css.modalOverlay} onClick={handleOverlayClick}>
            <div className={css.modal}>
                <div className={css.modalHeader}>
                    <span>Các Danh Mục</span>
                </div>
                <div className={css.modalContent}>
                    {categories.map((category) => (
                        <div key={category.id} className={css.categoryItem}>
                            {editingId === category.id ? (
                                <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className={css.editInput}
                                    autoFocus
                                />
                            ) : (
                                <span>{category.name}</span>
                            )}
                            <div className={css.categoryActions}>
                                {editingId === category.id ? (
                                    <button
                                        className={css.actionButton}
                                        onClick={() => handleEdit(category.id)}
                                    >
                                        <Check size={16} className={css.checkIcon} />
                                    </button>
                                ) : (
                                    <button
                                        className={css.actionButton}
                                        onClick={() => startEditing(category)}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                )}
                                <button
                                    className={css.actionButton}
                                    onClick={() => handleDelete(category.id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className={css.addNewItem}>
                        <div className={css.addNewItemWrapper}>
                            <input
                                type="text"
                                placeholder="Nhập tên danh mục..."
                                className={css.addInput}
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                            />
                            <button
                                className={css.addButton}
                                onClick={handleAdd}
                            >
                                <Plus size={16} />
                                <span>Thêm</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CategoryPopUp