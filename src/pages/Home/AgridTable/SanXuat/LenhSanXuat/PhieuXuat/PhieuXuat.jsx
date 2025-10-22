import React, { useState, useEffect } from 'react';
import styles from './PhieuXuat.module.css';
import { Input } from "antd";
// CONSTANTS
import { LSX_STATUS } from '../../../../../../CONST';
// API
import { getLenhSanXuatNLByLSXId, updateLenhSanXuatNL } from '../../../../../../apis/lenhSanXuatService';
import { getAllInfoInventoryService } from '../../../../../../apis/hangHoaService';
// COMPONENTS
import PopUpFormCreatePhieu from '../../../../formCreate/formCreatePhieu';

const FormattedNumberInput = ({ value, onChange, placeholder, min }) => {
    const formatDisplayValue = (val) => {
        if (val === '' || val === null || val === undefined) return '';
        return Number(val).toLocaleString('en-US');
    };

    const handleChange = (e) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (rawValue === '' || (!isNaN(rawValue) && Number(rawValue) >= (min || -Infinity))) {
            onChange(rawValue);
        }
    };

    return (
        <Input
            type="text"
            value={formatDisplayValue(value)}
            onChange={handleChange}
            placeholder={placeholder}
        />
    );
};

const PhieuXuat = ({ isOpen, onClose, reload, orderList, allNguyenLieu, currentUser }) => {
    if (!isOpen) return null;
    const table = "PhieuXuat";
    const [orders, setOrders] = useState();
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [showAllocationModal, setShowAllocationModal] = useState(false);
    const [showCreatePhieu, setShowCreatePhieu] = useState(false);
    const [materialAllocation, setMaterialAllocation] = useState({});
    const [materialsData, setMaterialsData] = useState([]);
    const [availableStock, setAvailableStock] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [currentData, setCurrentData] = useState([]);

    const loadData = async () => {
        let orders = []
        for (const order of orderList) {
            const materials = await getLenhSanXuatNLByLSXId(order.id);
            let materialsList = []
            for (const material of materials) {
                const nguyenLieu = allNguyenLieu.find(nl => nl.id == material.idNL)
                materialsList.push({
                    id: material.id,
                    idNL: nguyenLieu.id,
                    code: nguyenLieu.code,
                    name: nguyenLieu.name,
                    quantity: material.SoLuong,
                    price: nguyenLieu.gia_ban,
                    actual: material.SoLuongThucTe,
                })
            }
            orders.push({
                id: order.code,
                code: order.code,
                deadline: order.ngay_dk_hoan_thanh,
                bom: materialsList,
                status: order.trang_thai,
            })
        }
        setOrders(orders)
    }

    useEffect(() => {
        loadData()
    }, [])

    const getUniqueMaterials = () => {
        const materials = new Set();
        selectedOrders.forEach(orderId => {
            const order = orders.find(o => o.id === orderId);
            order.bom.forEach(item => materials.add(item.code));
        });
        return Array.from(materials);
    };

    const loadMaterialAllocationData = async () => {
        setIsLoading(true);
        const materials = getUniqueMaterials();

        const inventorys = await getAllInfoInventoryService();

        const relevantCodes = new Set(
            orders.flatMap(order => order.bom.map(bomItem => bomItem.code))
        );

        const filteredStock = inventorys.reduce((stock, item) => {
            if (relevantCodes.has(item.code)) {
                stock[item.code] = (stock[item.code] || 0) + (item.so_luong_nhap - item.so_luong_xuat);
            }
            return stock;
        }, {});

        setAvailableStock(filteredStock);
        setMaterialsData(materials);
        setIsLoading(false);
    };

    useEffect(() => {
        if (showAllocationModal) {
            loadMaterialAllocationData();
        }
    }, [showAllocationModal]);

    const calculateTotalRequired = (code) => {
        return selectedOrders.reduce((total, orderId) => {
            const customAllocation = materialAllocation[`${orderId}-${code}`];
            if (customAllocation !== undefined) {
                return total + Number(customAllocation);
            }
            const order = orders.find(o => o.id === orderId);
            const bomItem = order.bom.find(b => b.code === code);
            return total + (bomItem?.quantity || 0);
        }, 0);
    };

    const handleOrderSelect = (orderId) => {
        setSelectedOrders((prev) =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const handleXacNhan = () => {
        setShowCreatePhieu(true);
        let data = [];
        for (const code of materialsData) {
            const totalRequired = calculateTotalRequired(code);
            const order = orders.flatMap(order => order.bom).find(b => b.code === code)
            if (order) {
                const value = {
                    key: Date.now(),
                    id_hang_hoa: order.idNL,
                    id_lo: null,
                    id_nha_cung_cap: null,
                    id_kho: null,
                    gia_xuat: order.price,
                    so_luong: totalRequired,
                }
                data.push(value)
            }
        }
        setCurrentData(data)
    }

    const handleAllocationChange = (orderId, materialId, value) => {
        const numericValue = value === '' ? '' : Number(value);
        setMaterialAllocation(prev => ({
            ...prev,
            [`${orderId}-${materialId}`]: numericValue
        }));
    };

    const handleCreatePhieu = () => {
        selectedOrders.forEach(async (orderId) => {
            const order = orders.find(o => o.id === orderId);
            for (const material of order.bom) {
                const value = {
                    id: material.id,
                    SoLuongThucTe: material.actual + materialAllocation[`${orderId}-${material.code}`] || material.quantity
                }
                await updateLenhSanXuatNL(value)
            }
        });
    };

    const MaterialAllocationModal = () => {
        return (
            <div className={styles.modalOverlay}>
                <div className={styles.allocationModalContent}>
                    <h2 className={styles.modalTitle}>Phân bổ nguyên vật liệu</h2>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={`${styles.th} ${styles.stickyLeft}`}>Mã NVL</th>
                                    <th className={`${styles.th} ${styles.stickyLeftSecond}`}>Tên vật tư</th>
                                    {selectedOrders.map(orderId => (
                                        <th key={orderId} className={styles.th}>{orderId}</th>
                                    ))}
                                    <th className={styles.th}>Tổng cần xuất</th>
                                    <th className={styles.th}>Tổng hiện có</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materialsData.map(code => {
                                    const totalRequired = calculateTotalRequired(code);
                                    const available = availableStock[code] || 0;
                                    const isShortage = totalRequired > available;

                                    return (
                                        <tr key={code} className={isShortage ? styles.shortageRow : ''}>
                                            <td className={`${styles.td} ${styles.stickyLeft} ${styles.fontMedium}`}>
                                                {code}
                                            </td>
                                            <td className={`${styles.td} ${styles.stickyLeftSecond} ${styles.fontMedium}`}>
                                                {orders.flatMap(order => order.bom).find(b => b.code === code)?.name || ''}
                                                {isShortage && (
                                                    <div className={styles.shortageWarning}>
                                                        Không đủ NVL, hãy tự phân bổ cho LSX
                                                    </div>
                                                )}
                                            </td>
                                            {selectedOrders.map(orderId => {
                                                const order = orders.find(o => o.id === orderId);
                                                const bomItem = order.bom.find(b => b.code === code);
                                                const planned = bomItem?.quantity || 0;
                                                const actual = materialAllocation[`${orderId}-${code}`] ?? planned;

                                                return (
                                                    <td key={orderId} className={styles.td}>
                                                        <div className={styles.inputWrapper}>
                                                            <div className={styles.plannedQuantity}>
                                                                Kế hoạch: {planned}
                                                            </div>
                                                            {/* <Input
                                                                type="number"
                                                                value={actual}
                                                                onChange={(e) => handleAllocationChange(orderId, code, e.target.value)}
                                                                className={`${styles.input} ${actual < planned ? styles.inputUnder :
                                                                    actual > planned ? styles.inputOver : ''
                                                                    }`}
                                                                size="small"
                                                            /> */}
                                                            <FormattedNumberInput
                                                                value={actual}
                                                                onChange={(e) => handleAllocationChange(orderId, code, e)}
                                                                placeholder={"Nhập giá trị"}
                                                                min={0}
                                                            />
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td className={`${styles.td} ${styles.textRight} ${isShortage ? styles.textDanger : ''}`}>
                                                {totalRequired.toLocaleString()}
                                            </td>
                                            <td className={`${styles.td} ${styles.textRight} ${isShortage ? styles.textDanger : ''}`}>
                                                {available.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.modalFooter}>
                        <button
                            onClick={() => setShowAllocationModal(false)}
                            className={styles.buttonSecondary}
                        >
                            Hủy
                        </button>
                        <button
                            onClick={() => { handleXacNhan() }}
                            className={styles.buttonPrimary}
                        >
                            Xác nhận
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const formatStatus = (status) => {
        switch (status) {
            case LSX_STATUS.PENDING:
                return 'Chưa bắt đầu';
            case LSX_STATUS.APPROVE:
                return 'Duyệt LSX';
            case LSX_STATUS.ONGOING:
                return 'Đang sản xuất';
            case LSX_STATUS.COMPLETED:
                return 'Hoàn thành';
            case LSX_STATUS.CANCEL:
                return 'Hủy';
            default:
                return 'Không xác định';
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className={styles.modalContent}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Quản lý lệnh sản xuất</h1>
                    <div className={styles.headerButtons}>
                        <button
                            onClick={() => setShowAllocationModal(true)}
                            disabled={selectedOrders.length === 0}
                            className={`${styles.button} ${selectedOrders.length === 0 ? styles.buttonDisabled : styles.buttonPrimary}`}
                        >
                            Xuất NVL ({selectedOrders.length})
                        </button>
                        <button onClick={onClose} className={styles.closeButton}>×</button>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>&nbsp;</th>
                                <th className={styles.th}>Mã LSX</th>
                                <th className={styles.th}>Trạng thái</th>
                                <th className={styles.th}>Hạn giao</th>
                                <th className={styles.th}>NVL dự kiến</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders && orders.map(order => (
                                <tr key={order.id} className={styles.tableRow}>
                                    <td className={styles.td}>
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders.includes(order.id)}
                                            onChange={() => handleOrderSelect(order.id)}
                                            className={styles.checkbox}
                                        />
                                    </td>
                                    <td className={`${styles.td} ${styles.fontMedium}`}>{order.code}</td>
                                    <td className={styles.td}>
                                        <span className={styles.statusBadge}>
                                            {formatStatus(order.status)}
                                        </span>
                                    </td>
                                    <td className={styles.td}>{order.deadline}</td>
                                    <td className={styles.td}>
                                        <div className={styles.bomList}>
                                            {order.bom.map(item => (
                                                <span key={item.code} className={styles.bomItem}>
                                                    {item.code}: {item.quantity}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showAllocationModal && <MaterialAllocationModal />}

                {showCreatePhieu && currentData &&
                    <PopUpFormCreatePhieu
                        table={table}
                        open={showCreatePhieu}
                        onClose={() => setShowCreatePhieu(false)}
                        reload={reload}
                        currentUser={currentUser}
                        currentData={currentData}
                        editable={false}
                        onSave={handleCreatePhieu}
                    />
                }
            </div>
        </div>
    );
};

export default PhieuXuat;