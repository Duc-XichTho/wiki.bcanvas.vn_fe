import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import css from './SanPhamDauRa.module.css';
// CONSTANTS
import { LSX_STATUS } from '../../../../../../CONST';
// API
import {
    deleteLenhSanXuatSP,
    deleteLenhSanXuatNL,
    createNewLenhSanXuatNL,
    createNewLenhSanXuatSP,
    updateLenhSanXuatNL,
    updateLenhSanXuatSP
} from '../../../../../../apis/lenhSanXuatService';
import { getAllDinhMucNLBySPId } from '../../../../../../apis/dinhMucBomService';

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
};

const ProductSelectionModal = ({ isOpen, onClose, sanPhamDropDown, onAdd }) => {
    const [selectedId, setSelectedId] = useState('');
    const [soLuong, setSoLuong] = useState('');
    const [selectedSanPham, setSelectedSanPham] = useState(null);

    const handleAdd = () => {
        if (selectedId && soLuong) {
            onAdd(selectedId, Number(soLuong));
            onClose();
            setSelectedId('');
            setSoLuong('');
            setSelectedSanPham(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={css.modalOverlay}>
            <div className={css.modalContent}>
                <h3 className={css.modalTitle}>Chọn sản phẩm</h3>

                <div className={css.formGroup} style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 4 }}>
                        <label className={css.label}>Sản phẩm</label>
                        <select
                            className={css.select}
                            value={selectedId}
                            onChange={(e) => {
                                setSelectedId(e.target.value);
                                const SP = sanPhamDropDown.find(sp => sp.id == e.target.value);
                                setSelectedSanPham(SP); // Changed this line
                            }}
                        >
                            <option value="">Chọn sản phẩm</option>
                            {sanPhamDropDown.map(sp => (
                                <option key={sp.id} value={sp.id}>
                                    {sp.name}
                                </option>
                            ))}
                        </select>
                        {selectedSanPham && !selectedSanPham.hasBOM && (
                            <p className={css.warning}>Sản phẩm không có BOM khả dụng</p>
                        )}
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
    );
};

export default function SanPhamDauRa({ styles, reload, sanPhamList, nguyenLieuList, allSanPhamBOM, selectedOrder, sanPhamDropDown }) {
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState(null);
    const [editedValues, setEditedValues] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        setHasChanges(false);
    }, [selectedOrder])

    const isEditable = selectedOrder?.trang_thai != LSX_STATUS.APPROVE;

    const handleRefreshNguyenLieu = async () => {
        try {
            setIsRefreshing(true);
            for (const nl of nguyenLieuList) {
                nl.soLuong = 0;
            }

            const matchingItems = allSanPhamBOM
                .filter(item =>
                    sanPhamList.some(bom => bom.id === item.idHangHoa)
                )
                .map(item => {
                    const matchedSanPham = sanPhamList.find(bom => bom.id === item.idHangHoa);
                    return {
                        ...item,
                        SoLuong: matchedSanPham ? matchedSanPham.soLuong : null
                    };
                });

            if (matchingItems.length > 0) {
                for (const sp of matchingItems) {
                    const nguyenLieuBOM = await getAllDinhMucNLBySPId(sp.id);
                    if (nguyenLieuBOM) {
                        for (const nguyenLieu of nguyenLieuBOM) {
                            let NLBOM = nguyenLieuList.find(nl => nl.id == nguyenLieu.idNL);
                            if (NLBOM) {
                                NLBOM.soLuong += nguyenLieu.SoLuong * sp.SoLuong;
                                await updateLenhSanXuatNL({
                                    id: NLBOM.idNLLSX,
                                    SoLuong: NLBOM.soLuong
                                });
                            } else {
                                const newNLData = {
                                    SoLuong: nguyenLieu.SoLuong * soLuong,
                                    idNL: nguyenLieu.id,
                                    idLSX: selectedOrder.id
                                }
                                await createNewLenhSanXuatNL(newNLData);
                            }
                        }
                    }
                }
            }

            const nonMatchedMaterial = nguyenLieuList.filter(nl => nl.soLuong == 0);

            if (nonMatchedMaterial.length > 0) {
                console.log('Non-matched materials:', nonMatchedMaterial);
                for (const nl of nonMatchedMaterial) {
                    await deleteLenhSanXuatNL(nl.idNLLSX);
                }
            }

            reload();
        } catch (error) {
            console.error('Error refreshing nguyenLieu:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleAddProduct = async (productId, soLuong) => {
        await createNewLenhSanXuatSP({ idLSX: selectedOrder.id, idSP: productId, SoLuong: soLuong });
        const sanPhamBOM = allSanPhamBOM.find(sp => sp.idHangHoa == productId);
        if (sanPhamBOM) {
            const nguyenLieuBOM = await getAllDinhMucNLBySPId(sanPhamBOM.id)
            if (nguyenLieuBOM) {
                for (const nguyenLieu of nguyenLieuBOM) {
                    let NLBOM = nguyenLieuList.find(nl => nl.id == nguyenLieu.idNL);
                    if (NLBOM) {
                        const SoLuong = NLBOM.soLuong + (nguyenLieu.SoLuong * soLuong);
                        await updateLenhSanXuatNL({ id: NLBOM.idNLLSX, SoLuong: SoLuong });
                    } else {
                        const newNLData = {
                            SoLuong: nguyenLieu.SoLuong * soLuong,
                            idNL: nguyenLieu.idNL,
                            idLSX: selectedOrder.id
                        }
                        await createNewLenhSanXuatNL(newNLData);
                    }
                }
            }
        }
        reload();
    };

    const handleDelete = async () => {
        if (selectedDeleteId) {
            await deleteLenhSanXuatSP(selectedDeleteId);
            setShowDeleteModal(false);
            setSelectedDeleteId(null);
            reload();
        }
    };

    const handleValueChange = (id, field, value) => {
        setEditedValues(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
        setHasChanges(true);
    };

    const handleSaveChanges = async () => {
        try {
            const updatePromises = Object.entries(editedValues).map(async ([id, values]) =>
                await updateLenhSanXuatSP({
                    id: id,
                    SoLuong: values.soLuong !== undefined ? Number(values.soLuong) : undefined,
                    SoLuongThucTe: values.soLuongThucTe !== undefined ? Number(values.soLuongThucTe) : undefined
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
                <h3 className={styles.sectionTitle}>Sản phẩm đầu ra</h3>
                <div className={styles.headerButtons}>
                    {hasChanges && (
                        <button
                            className={`${styles.saveButton} ${styles.plusButton}`}
                            onClick={handleSaveChanges}
                            title="Lưu thay đổi"
                        >
                            <Save size={20} />
                        </button>
                    )}
                    {isEditable && (
                        <>
                            <button
                                onClick={handleRefreshNguyenLieu}
                                className={`${styles.plusButton} ${isRefreshing ? styles.rotating : ''}`}
                                disabled={isRefreshing}
                                title="Tính lại nguyên liệu"
                            >
                                <RefreshCw size={20} />
                            </button>
                            <button
                                onClick={() => setShowModal(true)}
                                className={styles.plusButton}
                                title="Thêm sản phẩm"
                            >
                                <Plus size={20} />
                            </button>
                        </>
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
                            <th>Mã sản phẩm</th>
                            <th>Tên sản phẩm</th>
                            <th>Kế hoạch</th>
                            <th>Thực tế</th>
                            <th>Chênh lệch</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sanPhamList.map(sp => (
                            <tr key={sp.id}>
                                <td>{sp.code}</td>
                                <td>{sp.name}</td>
                                <td>
                                    {isEditable ? (
                                        <input
                                            type="number"
                                            min="0"
                                            className={styles.editInput}
                                            value={editedValues[sp.idSPLSX]?.soLuong ?? sp.soLuong}
                                            onChange={(e) => handleValueChange(sp.idSPLSX, 'soLuong', e.target.value)}
                                        />
                                    ) : sp.soLuong}
                                </td>
                                <td>
                                    {!isEditable ? (
                                        <input
                                            type="number"
                                            min="0"
                                            className={styles.editInput}
                                            value={editedValues[sp.idSPLSX]?.soLuongThucTe ?? sp.soLuongThucTe}
                                            onChange={(e) => handleValueChange(sp.idSPLSX, 'soLuongThucTe', e.target.value)}
                                        />
                                    ) : (
                                        <>
                                            {sp.soLuongThucTe} {sp.dvt}
                                        </>
                                    )}
                                </td>
                                <td className={(sp.soLuong - sp.soLuongThucTe) < 0 ? styles.textRed : styles.textGreen}>
                                    {sp.soLuong - (editedValues[sp.idSPLSX]?.soLuongThucTe ?? sp.soLuongThucTe)} {sp.dvt}
                                </td>
                                <td>
                                    {isEditable && (
                                        <button
                                            className={styles.deleteButton}
                                            onClick={() => {
                                                setSelectedDeleteId(sp.idSPLSX);
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

            <ProductSelectionModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                sanPhamDropDown={sanPhamDropDown}
                onAdd={handleAddProduct}
                styles={styles}
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