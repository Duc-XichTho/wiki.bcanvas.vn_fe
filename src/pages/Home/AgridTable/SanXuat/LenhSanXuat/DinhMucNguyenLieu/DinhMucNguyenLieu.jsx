import React, { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import css from './DinhMucNguyenLieu.module.css';
// CONSTANTS
import { LSX_STATUS } from '../../../../../../CONST';
// API
import {
    deleteLenhSanXuatNL,
    createNewLenhSanXuatNL,
    updateLenhSanXuatNL
} from '../../../../../../apis/lenhSanXuatService';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className={css.modalOverlay}>
            <div className={css.modalContent}>
                <h3 className={css.modalTitle}>Xác nhận xóa</h3>
                <p>Bạn có chắc chắn muốn xóa sản phẩm này?</p>
                <div className={css.modalFooter}>
                    <button onClick={onClose} className={css.cancelButton}>Hủy</button>
                    <button onClick={onConfirm} className={css.deleteButton}>Xóa</button>
                </div>
            </div>
        </div>
    );
}

const MaterialSelectionModal = ({ isOpen, onClose, nguyenLieuDropDown, onAdd }) => {
    const [selectedId, setSelectedId] = useState('');
    const [soLuong, setSoLuong] = useState('');

    const handleAdd = () => {
        if (selectedId && soLuong) {
            onAdd(selectedId, Number(soLuong));
            onClose();
            setSelectedId('');
            setSoLuong('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className={css.modalOverlay}>
            <div className={css.modalContent}>
                <h3 className={css.modalTitle}>Chọn nguyên liệu</h3>

                <div className={css.formGroup} style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 4 }}>
                        <label className={css.label}>Sản phẩm</label>
                        <select
                            className={css.select}
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                        >
                            <option value="">Chọn sản phẩm</option>
                            {nguyenLieuDropDown.map(nl => (
                                <option key={nl.id} value={nl.id}>
                                    {nl.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className={css.label}>Số lượng</label>
                        <input
                            type="number"
                            min="0"
                            className={css.select}
                            value={soLuong}
                            onChange={(e) => setSoLuong(e.target.value)}
                        />
                    </div>
                </div>

                <div className={css.modalFooter}>
                    <button onClick={onClose} className={css.cancelButton}>Hủy</button>
                    <button
                        onClick={handleAdd}
                        className={css.addButton}
                        disabled={!selectedId || !soLuong}
                    >
                        Thêm
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function DinhMucNguyenLieu({ styles, reload, nguyenLieuList, selectedOrder, nguyenLieuDropDown }) {
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState(null);
    const [editedValues, setEditedValues] = useState({});
    const [hasChanges, setHasChanges] = useState(false);

    const isEditable = selectedOrder?.trang_thai != LSX_STATUS.APPROVE;

    const handleAddMaterial = async (materialId, soLuong) => {
        await createNewLenhSanXuatNL({
            idLSX: selectedOrder.id,
            idNL: materialId,
            SoLuong: soLuong
        })
        reload();
    }

    const handleDelete = async () => {
        if (selectedDeleteId) {
            await deleteLenhSanXuatNL(selectedDeleteId);
            setShowDeleteModal(false);
            setSelectedDeleteId(null);
            reload();
        }
    };

    const handleValueChange = (id, value) => {
        setEditedValues(prev => ({
            ...prev,
            [id]: value
        }));
        setHasChanges(true);
    };

    const handleSaveChanges = async () => {
        try {
            const updatePromises = Object.entries(editedValues).map(async ([id, soLuong]) =>
                await updateLenhSanXuatNL({
                    id: id,
                    SoLuong: Number(soLuong)
                })
            );

            await Promise.all(updatePromises);
            setEditedValues({});
            setHasChanges(false);
            reload();
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    return (
        <>
            <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Định mức nguyên vật liệu (BOM)</h3>
                <div className={styles.headerButtons}>
                    {hasChanges && isEditable && (
                        <button
                            className={`${styles.saveButton} ${styles.plusButton}`}
                            onClick={handleSaveChanges}
                            title="Lưu thay đổi"
                        >
                            <Save size={20} />
                        </button>
                    )}
                    {isEditable && (
                        <button
                            className={styles.plusButton}
                            onClick={() => setShowModal(true)}
                        >
                            <Plus size={20} />
                        </button>
                    )}
                </div>
            </div>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <colgroup>
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '10%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Mã nguyên liệu</th>
                            <th>Tên nguyên liệu</th>
                            <th>Kế hoạch</th>
                            <th>Thực tế</th>
                            <th>Chênh lệch</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {nguyenLieuList.map(nl => (
                            <tr key={nl.id}>
                                <td>{nl.code}</td>
                                <td>{nl.name}</td>
                                <td>
                                    {isEditable ? (
                                        <input
                                            type="number"
                                            min="0"
                                            className={styles.editInput}
                                            value={editedValues[nl.idNLLSX] ?? nl.soLuong}
                                            onChange={(e) => handleValueChange(nl.idNLLSX, e.target.value)}
                                        />
                                    ) : (
                                        <>
                                            {nl.soLuong}  {nl.dvt}
                                        </>
                                    )}
                                </td>
                                <td>{nl.soLuongThucTe}  {nl.dvt}</td>
                                <td className={(nl.soLuong - nl.soLuongThucTe) < 0 ? styles.textRed : styles.textGreen}>
                                    {nl.soLuong - nl.soLuongThucTe} {nl.dvt}
                                </td>
                                <td>
                                    {isEditable && (
                                        <button
                                            className={styles.deleteButton}
                                            onClick={() => {
                                                setSelectedDeleteId(nl.idNLLSX);
                                                setShowDeleteModal(true);
                                            }}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <MaterialSelectionModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                nguyenLieuDropDown={nguyenLieuDropDown}
                onAdd={handleAddMaterial}
            />

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedDeleteId(null);
                }}
                onConfirm={handleDelete}
            />
        </>
    );
}