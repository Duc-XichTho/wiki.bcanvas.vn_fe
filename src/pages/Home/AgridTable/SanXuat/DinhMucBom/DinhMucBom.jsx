import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, CheckCircle, XCircle, X } from 'lucide-react';
import css from './DinhMucBom.module.css';
// ANTD
import { message, Switch } from 'antd';
// API
import {
    getAllDinhMucSP,
    getAllDinhMucNLBySPId,
    createNewDinhMucSP,
    createNewDinhMucNL,
    updateDinhMucNL,
    updateDinhMucSP,
    deleteDinhMucNL,
    deleteDinhMucSP,
} from '../../../../../apis/dinhMucBomService';
import { getCurrentUserLogin } from '../../../../../apis/userService';
import { getAllHangHoa } from '../../../../../apis/hangHoaService';
// FUNCTION
import { formatMoney } from '../../../../../generalFunction/format';

const DinhMucBom = () => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [allNguyenLieu, setAllNguyenLieu] = useState([]);
    const [sanPhamDropDown, setSanPhamDropDown] = useState([]);
    const [nguyenLieuDropDown, setNguyenLieuDropDown] = useState([]);
    const [products, setProducts] = useState([]);
    const [bomItems, setBomItems] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingMaterial, setDeletingMaterial] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [newProduct, setNewProduct] = useState({
        idHangHoa: '',
    });
    const [showMaterialModel, setShowMaterialModel] = useState(false);
    const [newMaterial, setNewMaterial] = useState({
        idSP: '',
        idNL: '',
        SoLuong: 0,
    });
    const [errors, setErrors] = useState({});

    const fetchCurrentUserLogin = async () => {
        try {
            const { data } = await getCurrentUserLogin();
            if (data) {
                setCurrentUser(data);
            }

        } catch (error) {
            console.error("Error fetching current user:", error);
        }
    }

    useEffect(() => {
        fetchCurrentUserLogin();
    }, []);

    const validateForm = () => {
        const newErrors = {};
        if (!newProduct.idHangHoa) {
            newErrors.idHangHoa = 'Vui lòng chọn sản phẩm';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updateTimestamp = async (productId) => {
        try {
            await updateDinhMucSP({
                id: productId,
                updated_at: new Date().toISOString(),
                email: currentUser.email
            });
        } catch (error) {
            console.error('Error updating timestamp:', error);
        }
    };

    const handleEditMaterial = (material) => {
        const materialToEdit = {
            id: material.id,
            idSP: material.idSP,
            idNL: material.idNL,
            SoLuong: material.SoLuong,
            gia_ban: material.gia_ban
        };
        setEditingMaterial(materialToEdit);
        setNewMaterial(materialToEdit);
        setIsEditing(true);
        setShowMaterialModel(true);
    };

    const handleUpdateMaterial = async () => {
        try {
            await updateDinhMucNL({
                id: editingMaterial.id,
                idSP: editingMaterial.idSP,
                idNL: newMaterial.idNL || editingMaterial.idNL,
                SoLuong: newMaterial.SoLuong,
                email: currentUser.email
            });
            await updateTimestamp(editingMaterial.idSP);
            message.success('Cập nhật nguyên liệu thành công');
            loadNguyenLieu(selectedProduct);
            setShowMaterialModel(false);
            setNewMaterial({
                idSP: '',
                idNL: '',
                SoLuong: 0,
            });
            setIsEditing(false);
            setEditingMaterial(null);
            setErrors({});
        } catch (error) {
            message.error('Lỗi khi cập nhật nguyên liệu');
        }
    };

    const handleCloseMaterial = () => {
        setShowMaterialModel(false);
        setNewMaterial({
            idSP: '',
            idNL: '',
            SoLuong: 0,
        });
        setIsEditing(false);
        setEditingMaterial(null);
        setErrors({});
    };

    const handleAddProduct = async () => {
        if (validateForm()) {
            try {
                await createNewDinhMucSP(newProduct);
                message.success('Thêm sản phẩm thành công');
                loadData();
                setShowAddModal(false);
                setNewProduct({ idHangHoa: '' });
                setErrors({});
            } catch (error) {
                message.error('Lỗi khi thêm sản phẩm');
            }
        }
    };

    const handleAddMaterial = async () => {
        try {
            await createNewDinhMucNL(newMaterial);
            await updateTimestamp(selectedProduct.id);
            message.success('Thêm nguyên liệu thành công');
            loadNguyenLieu(selectedProduct);
            setShowMaterialModel(false);
            setNewMaterial({
                idSP: selectedProduct.id,
                idNL: '',
                SoLuong: 0,
            });
            setErrors({});
        } catch (error) {
            message.error('Lỗi khi thêm nguyên liệu');
        }
    }

    const handleCloseModal = () => {
        setShowAddModal(false);
        setNewProduct({ idHangHoa: '' });
        setErrors({});
    };

    const handleToggleApproval = async (checked) => {
        try {
            await updateDinhMucSP({
                id: selectedProduct.id,
                approve: checked,
                updated_at: new Date().toISOString(),
                userApprove: checked ? currentUser.email : '',
                email: currentUser.email
            });

            setProducts(products.map(product => {
                if (product.id === selectedProduct.id) {
                    return {
                        ...product,
                        approve: checked,
                        updated_at: new Date().toISOString(),
                        userApprove: checked ? currentUser.email : ''
                    };
                }
                return product;
            }));

            setSelectedProduct(prev => ({
                ...prev,
                approve: checked,
                updated_at: new Date().toISOString(),
                userApprove: checked ? currentUser.email : ''
            }));

            if (checked) {
                message.success('Đã duyệt định mức');
            } else {
                message.info('Đã hủy duyệt định mức');
            }
        } catch (error) {
            message.error('Lỗi khi cập nhật trạng thái duyệt');
        }
    };

    const handleToggleShow = async (productId, checked) => {
        try {
            await updateDinhMucSP({
                id: productId,
                show: checked,
                email: currentUser.email
            });
            setProducts(products.map(product =>
                product.id === productId ? { ...product, show: checked } : product
            ));
            message.success(`${checked ? 'Hiện' : 'Ẩn'} sản phẩm thành công`);
        } catch (error) {
            message.error('Lỗi khi cập nhật trạng thái hiển thị');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const utc7Date = new Date(date.getTime() + (7 * 60 * 60 * 1000));
        const day = utc7Date.getUTCDate().toString().padStart(2, '0');
        const month = (utc7Date.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = utc7Date.getUTCFullYear();
        const hours = utc7Date.getUTCHours().toString().padStart(2, '0');
        const minutes = utc7Date.getUTCMinutes().toString().padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    const loadNguyenLieu = async (product) => {
        try {
            const dinhMucMaterials = await getAllDinhMucNLBySPId(product.id);
            const materialsWithDetails = dinhMucMaterials
                .filter(dinhMuc => dinhMuc.show)
                .map(dinhMuc => {
                    const hangHoa = allNguyenLieu.find(sp => sp.id == dinhMuc.idNL);
                    return {
                        ...dinhMuc,
                        tenSP: hangHoa?.name,
                        unit: hangHoa?.dvt,
                        materialCode: hangHoa?.code,
                        cost: hangHoa?.gia_ban ? parseInt(hangHoa.gia_ban) * dinhMuc.SoLuong : 0,
                        gia_ban: hangHoa?.gia_ban,
                    };
                });
            const existingMaterialIds = dinhMucMaterials.map(dm => dm.idNL);
            const availableMaterial = allNguyenLieu.filter(sp => !existingMaterialIds.includes(sp.id));
            setBomItems(materialsWithDetails);
            setNguyenLieuDropDown(availableMaterial);
        } catch (error) {
            console.error('Lỗi khi tải danh sách nguyên liệu:', error);
        }
    };

    const handleSelectProduct = (product) => {
        console.log(product.id);
        setSelectedProduct(product);
        setNewMaterial({ ...newMaterial, idSP: product.id });
        loadNguyenLieu(product);
    };

    const loadData = async () => {
        try {
            const [allHangHoa, dinhMucProducts] = await Promise.all([
                getAllHangHoa(),
                getAllDinhMucSP(),
            ]);
            const allSanPham = allHangHoa.filter(item => item.loai === 'sp');
            const nguyenLieu = allHangHoa.filter(item => item.loai === 'nl');
            setAllNguyenLieu(nguyenLieu);
            const existingProductIds = dinhMucProducts.map(dm => dm.idHangHoa);
            const availableSanPham = allSanPham.filter(sp => !existingProductIds.includes(sp.id));
            setSanPhamDropDown(availableSanPham);
            const productsWithDetails = dinhMucProducts
                .map(dinhMuc => {
                    const hangHoa = allSanPham.find(sp => sp.id == dinhMuc.idHangHoa);
                    return {
                        ...dinhMuc,
                        tenSP: hangHoa?.name,
                        unit: hangHoa?.dvt,
                        code: hangHoa?.code
                    };
                });
            setProducts(productsWithDetails);
        } catch (error) {
            console.error(error);
            message.error('Lỗi khi tải dữ liệu');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDeleteClick = (material) => {
        setDeletingMaterial(material);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteDinhMucNL(deletingMaterial.id);
            await updateTimestamp(selectedProduct.id);
            message.success('Xóa nguyên liệu thành công');
            loadNguyenLieu(selectedProduct);
            setShowDeleteConfirm(false);
            setDeletingMaterial(null);
        } catch (error) {
            message.error('Lỗi khi xóa nguyên liệu');
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
        setDeletingMaterial(null);
    };

    const renderTableRow = (item) => (
        <tr key={item.id} className={css.tableRow}>
            <td className={css.tableCell}>{item.materialCode}</td>
            <td className={css.tableCell}>{item.tenSP}</td>
            <td className={css.tableCell}>{item.SoLuong}</td>
            <td className={css.tableCell}>{item.unit}</td>
            <td className={css.tableCellRight}>{item.gia_ban ? parseInt(item.gia_ban).toLocaleString('en-US') : 0}</td>
            <td className={css.tableCellRight}>
                {item.cost ? item.cost.toLocaleString('en-US') : 0}
            </td>
            <td className={css.tableCell}>
                <div className={css.actionButtons}>
                    <button
                        className={css.editButton}
                        onClick={() => handleEditMaterial(item)}
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                        className={css.deleteButton}
                        onClick={() => handleDeleteClick(item)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </td>
        </tr>
    );

    const renderMaterialModal = () => (
        <div className={css.modalOverlay}>
            <div className={css.modal}>
                <div className={css.modalHeader}>
                    <h2>{isEditing ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'}</h2>
                    <button
                        className={css.closeButton}
                        onClick={handleCloseMaterial}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className={css.modalBody}>
                    <div className={css.formGroup}>
                        <label>Chọn nguyên liệu</label>
                        <select
                            value={newMaterial.idNL}
                            onChange={(e) => {
                                const selectedId = parseInt(e.target.value);
                                const selectedMaterial = isEditing
                                    ? [...nguyenLieuDropDown, allNguyenLieu.find(nl => nl.id === editingMaterial.idNL)]
                                        .find(nl => nl.id === selectedId)
                                    : nguyenLieuDropDown.find(nl => nl.id === selectedId);
                                setNewMaterial({
                                    ...newMaterial,
                                    idNL: selectedId,
                                    gia_ban: selectedMaterial ? selectedMaterial.gia_ban : ""
                                });
                            }}
                            className={errors.idNL ? css.inputError : css.select}
                            disabled={isEditing}
                        >
                            <option value="">-- Chọn sản phẩm --</option>
                            {(isEditing
                                ? [...nguyenLieuDropDown, allNguyenLieu.find(nl => nl.id === editingMaterial.idNL)]
                                : nguyenLieuDropDown
                            ).map(nl => (
                                <option key={nl.id} value={nl.id}>
                                    {nl.name} ({nl.code})
                                </option>
                            ))}
                        </select>
                        <div className={css.rowInputs}>
                            <div className={css.inputGroup}>
                                <label>Định mức</label>
                                <input
                                    type="number"
                                    min="0"
                                    className={errors.SoLuong ? css.inputError : css.input}
                                    value={newMaterial.SoLuong || 0}
                                    onChange={(e) => setNewMaterial({
                                        ...newMaterial,
                                        SoLuong: e.target.value
                                    })}
                                />
                            </div>
                            <div className={css.inputGroup}>
                                <label>Giá trị</label>
                                <input
                                    type="number"
                                    className={css.input}
                                    value={newMaterial.gia_ban || 0}
                                    readOnly
                                />
                            </div>
                        </div>
                        <div className={css.totalContainer}>
                            <strong>Tổng:</strong> {(newMaterial.SoLuong * newMaterial.gia_ban || 0).toLocaleString('en-US')} VNĐ
                        </div>
                    </div>
                </div>
                <div className={css.modalFooter}>
                    <button
                        className={css.cancelButton}
                        onClick={handleCloseMaterial}
                    >
                        Hủy
                    </button>
                    <button
                        className={css.saveButton}
                        onClick={isEditing ? handleUpdateMaterial : handleAddMaterial}
                    >
                        {isEditing ? 'Cập nhật' : 'Lưu'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderDeleteConfirmModal = () => (
        <div className={css.modalOverlay}>
            <div className={css.modal}>
                <div className={css.modalHeader}>
                    <h2>Xác nhận xóa</h2>
                    <button
                        className={css.closeButton}
                        onClick={handleCancelDelete}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className={css.modalBody}>
                    <p>Bạn có muốn bỏ nguyên liệu '{deletingMaterial?.tenSP}'?</p>
                </div>
                <div className={css.modalFooter}>
                    <button
                        className={css.cancelButton}
                        onClick={handleCancelDelete}
                    >
                        Hủy
                    </button>
                    <button
                        className={`${css.saveButton} ${css.deleteButton}`}
                        onClick={handleConfirmDelete}
                    >
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className={css.container}>
            <div className={css.leftPanel}>
                <div className={css.header}>
                    <h2 className={css.title}>Danh mục sản phẩm/dịch vụ</h2>
                    <div className={css.searchContainer}>
                        <div className={css.searchWrapper}>
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className={css.searchInput}
                            />
                            <Search className={css.searchIcon} />
                        </div>
                        <button
                            className={css.addButton}
                            onClick={() => setShowAddModal(true)}
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className={css.productListContainer}>
                    <div className={css.productList}>
                        {products.map(product => (
                            <div key={product.id} className={`${css.productItem} ${selectedProduct?.id === product.id ? css.selected : ''}`}>
                                <div
                                    onClick={() => handleSelectProduct(product)}
                                    className={css.productContent}
                                >
                                    <div className={css.productName}>{product.tenSP}</div>
                                    <div className={css.productMeta}>
                                        Mã: {product.code} | Đơn vị: {product.unit}
                                    </div>
                                </div>
                                <div className={css.switchContainer}>
                                    <Switch
                                        size="small"
                                        checked={product.show}
                                        onChange={(checked) => handleToggleShow(product.id, checked)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className={css.rightPanel}>
                {selectedProduct ? (
                    <>
                        <div className={css.productHeader}>
                            <div className={css.productInfo}>
                                <h2>{selectedProduct.tenSP}</h2>
                                <p>Mã: {selectedProduct.code}</p>
                            </div>
                            <div>
                                <button
                                    onClick={() => setShowMaterialModel(true)}
                                    className={css.addMaterialButton}
                                >
                                    Thêm vật tư
                                </button>
                            </div>
                        </div>

                        <div className={css.tableContainer}>
                            <table className={css.table}>
                                <thead className={css.tableHeader}>
                                    <tr>
                                        <th>Mã vật tư</th>
                                        <th>Tên vật tư</th>
                                        <th>Định mức</th>
                                        <th>Đơn vị</th>
                                        <th className={css.tableCellRight}>Đơn giá</th>
                                        <th className={css.tableCellRight}>Thành tiền</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bomItems.map(item => renderTableRow(item))}
                                </tbody>
                            </table>
                        </div>

                        <div className={css.footer}>
                            <div className={css.footerContent}>
                                <div className={css.footerLeft}>
                                    <span>Cập nhật lần cuối: {formatDate(selectedProduct.updated_at)}</span>
                                    <span>|</span>
                                    {selectedProduct.approve ? <span>Người duyệt: {selectedProduct.userApprove}</span> : ''}
                                </div>
                                <div className={css.footerRight}>
                                    <div className={css.statusContainer}>
                                        <span className={css.statusItem}>
                                            {selectedProduct.approve ? (
                                                <>
                                                    <CheckCircle className={css.approvedIcon} />
                                                    <span>Đã duyệt</span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className={css.pendingIcon} />
                                                    <span>Chưa duyệt</span>
                                                </>
                                            )}
                                        </span>
                                        <Switch
                                            checked={selectedProduct.approve}
                                            onChange={handleToggleApproval}
                                            size="small"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={css.emptyState}>
                        Chọn sản phẩm để xem định mức
                    </div>
                )}
            </div>

            {showAddModal && (
                <div className={css.modalOverlay}>
                    <div className={css.modal}>
                        <div className={css.modalHeader}>
                            <h2>Thêm sản phẩm mới</h2>
                            <button
                                className={css.closeButton}
                                onClick={handleCloseModal}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className={css.modalBody}>
                            <div className={css.formGroup}>
                                <label>Chọn sản phẩm</label>
                                <select
                                    value={newProduct.idHangHoa}
                                    onChange={(e) => setNewProduct({
                                        ...newProduct,
                                        idHangHoa: parseInt(e.target.value)
                                    })}
                                    className={errors.idHangHoa ? css.inputError : css.select}
                                >
                                    <option value="">-- Chọn sản phẩm --</option>
                                    {sanPhamDropDown.map(sp => (
                                        <option key={sp.id} value={sp.id}>
                                            {sp.name} ({sp.code})
                                        </option>
                                    ))}
                                </select>
                                {errors.idHangHoa && (
                                    <span className={css.errorMessage}>{errors.idHangHoa}</span>
                                )}
                            </div>
                        </div>
                        <div className={css.modalFooter}>
                            <button
                                className={css.cancelButton}
                                onClick={handleCloseModal}
                            >
                                Hủy
                            </button>
                            <button
                                className={css.saveButton}
                                onClick={handleAddProduct}
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showMaterialModel && renderMaterialModal()}

            {showDeleteConfirm && renderDeleteConfirmModal()}
        </div>
    );
};

export default DinhMucBom;