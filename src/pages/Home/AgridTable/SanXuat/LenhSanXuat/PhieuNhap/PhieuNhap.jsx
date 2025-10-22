import React, { useState, useMemo, useEffect } from 'react';
import styles from './PhieuNhap.module.css';
// CONSTANTS
import { LSX_STATUS } from '../../../../../../CONST';
// API
import { getLenhSanXuatNLByLSXId, updateLenhSanXuatNL } from '../../../../../../apis/lenhSanXuatService';
// COMPONENTS
import PopUpFormCreatePhieu from '../../../../formCreate/formCreatePhieu';

const PhieuNhap = ({ isOpen, onClose, reload, orderList, allNguyenLieu, currentUser }) => {
    if (!isOpen) return null;
    const table = "PhieuNhap";
    const [orders, setOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [recoveryInputs, setRecoveryInputs] = useState({});
    const [note, setNote] = useState('');
    const [showRecoveryModal, setShowRecoveryModal] = useState(false);
    const [showCreatePhieu, setShowCreatePhieu] = useState(false);
    const [currentData, setCurrentData] = useState([]);

    const loadData = async () => {
        let orders = []
        for (const order of orderList) {
            const materials = await getLenhSanXuatNLByLSXId(order.id);
            let materialsList = []
            for (const material of materials) {
                const nguyenLieu = allNguyenLieu.find(nl => nl.id == material.idNL)
                materialsList.push({
                    id: nguyenLieu.code,
                    idNL: nguyenLieu.id,
                    idNLLSX: material.id,
                    name: nguyenLieu.name,
                    plannedQty: material.SoLuong,
                    unitPrice: parseInt(nguyenLieu.gia_ban),
                    unit: nguyenLieu.dvt,
                    actual: material.SoLuongThucTe,
                })
            }
            orders.push({
                id: order.code,
                code: order.code,
                startDate: order.ngay_tao,
                materials: materialsList,
                status: order.trang_thai
            })
        }
        setOrders(orders)
    }

    useEffect(() => {
        loadData()
    }, [])

    const materialSummary = useMemo(() => {
        const summary = {};
        selectedOrders.forEach(orderId => {
            const order = orders.find(o => o.id === orderId);
            order.materials.forEach(material => {
                if (!summary[material.id]) {
                    summary[material.id] = {
                        id: material.id,
                        idNL: material.idNL,
                        idNLLSX: material.idNLLSX,
                        name: material.name,
                        unit: material.unit,
                        unitPrice: material.unitPrice,
                        totalPlanned: 0,
                        actual: material.actual,
                        orders: []
                    };
                }
                summary[material.id].totalPlanned += material.actual;
                summary[material.id].orders.push({
                    orderId,
                    plannedQty: material.actual
                });
            });
        });
        return summary;
    }, [selectedOrders, orders]);

    const getAllocations = (materialId, totalRecovery) => {
        const material = materialSummary[materialId];
        if (!material) return {};
        const allocations = {};
        let remainingRecovery = totalRecovery;
        let remainingProportion = 1;
        const sortedOrders = [...material.orders].sort((a, b) => b.plannedQty - a.plannedQty);
        sortedOrders.forEach((order, index) => {
            if (index === sortedOrders.length - 1) {
                allocations[order.orderId] = Math.round(remainingRecovery);
            } else {
                const proportion = order.plannedQty / material.totalPlanned;
                const allocation = Math.floor(totalRecovery * proportion);
                allocations[order.orderId] = allocation;
                remainingRecovery -= allocation;
                remainingProportion -= proportion;
            }
        });
        return allocations;
    };

    const handleOrderSelect = (orderId) => {
        setSelectedOrders(prev => {
            if (prev.includes(orderId)) {
                return prev.filter(id => id !== orderId);
            }
            return [...prev, orderId];
        });
    };

    const handleTotalRecoveryChange = (materialId, value) => {
        setRecoveryInputs(prev => ({
            ...prev,
            [materialId]: value
        }));
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('vi-VN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0
        }).format(num);
    };

    const formatCurrency = (num) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(num);
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

    const handleConfirmRecovery = () => {
        setShowCreatePhieu(true);
        let data = [];
        Object.values(materialSummary).forEach(material => {
            const recoveryQty = recoveryInputs[material.id] || 0;
            const value = {
                key: Date.now(),
                id_hang_hoa: material.idNL,
                id_lo: null,
                id_nha_cung_cap: null,
                id_kho: null,
                gia_nhap: material.unitPrice,
                so_luong: recoveryQty,
            }
            data.push(value)
        });
        setCurrentData(data)
    };

    const handleCreatePhieu = () => {
        const allAllocations = Object.values(materialSummary).map(material => {
            const totalRecovery = recoveryInputs[material.id] || 0;
            const allocations = getAllocations(material.id, totalRecovery);
            return material.orders.map(order => ({
                id: material.idNL,
                idNLLSX: material.idNLLSX,
                LSX: order.orderId,
                NVL: material.name,
                SoLuongThuHoi: allocations[order.orderId] || 0,
                SoLuongThucTe: material.actual
            }));
        }).flat();
        allAllocations.forEach(async (allocation) => {
            const value = {
                id: allocation.idNLLSX,
                SoLuongThucTe: allocation.SoLuongThucTe - allocation.SoLuongThuHoi,
            }
            await updateLenhSanXuatNL(value)
        });
        return allAllocations;
    };

    const RecoveryModal = () => {
        if (!showRecoveryModal) return null;

        return (
            <div className={styles.modal}>
                <div className={styles.modalContent}>
                    <div className={styles.header}>
                        <h1>Thu hồi NVL từ lệnh sản xuất</h1>
                        <div className={styles.headerButtons}>
                            <button onClick={() => setShowRecoveryModal(false)} className={styles.closeButton}>×</button>
                        </div>
                    </div>

                    <div className={styles.alert}>
                        Nhập tổng số lượng thu hồi cho mỗi loại NVL.
                        Hệ thống sẽ tự động phân bổ theo tỷ lệ NVL đã xuất cho các LSX.
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <colgroup>
                                <col style={{ width: '7%' }} />
                                <col style={{ width: '17%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '20%' }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>Mã NVL</th>
                                    <th>Tên NVL</th>
                                    <th>ĐVT</th>
                                    <th className={styles.textRight}>Tổng đã xuất</th>
                                    <th className={styles.textRight}>Số lượng thu hồi</th>
                                    <th className={styles.textRight}>Đơn giá</th>
                                    <th className={styles.textRight}>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(materialSummary).map(material => {
                                    const recoveryQty = recoveryInputs[material.id] || 0;
                                    const recoveryValue = recoveryQty * material.unitPrice;
                                    return (
                                        <tr key={material.id}>
                                            <td>{material.id}</td>
                                            <td>{material.name}</td>
                                            <td>{material.unit}</td>
                                            <td className={styles.textRight}>
                                                {formatNumber(material.totalPlanned)}
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={material.totalPlanned}
                                                    className={styles.input}
                                                    value={recoveryQty || 0}
                                                    onChange={(e) => handleTotalRecoveryChange(material.id, e.target.value)}
                                                />
                                            </td>
                                            <td className={styles.textRight}>
                                                {formatCurrency(material.unitPrice)}
                                            </td>
                                            <td className={styles.textRight}>
                                                {formatCurrency(recoveryValue)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.allocationSection}>
                        <h3>Phân bổ thu hồi theo LSX:</h3>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <colgroup>
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '20%' }} />
                                    <col style={{ width: '20%' }} />
                                    <col style={{ width: '25%' }} />
                                    <col style={{ width: '25%' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>LSX</th>
                                        <th>NVL</th>
                                        <th className={styles.textRight}>Số lượng đã xuất</th>
                                        <th className={styles.textRight}>Tỷ lệ phân bổ</th>
                                        <th className={styles.textRight}>Số lượng thu hồi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.values(materialSummary).map(material => {
                                        const totalRecovery = recoveryInputs[material.id] || 0;
                                        const allocations = getAllocations(material.id, totalRecovery);

                                        return material.orders.map(order => {
                                            const proportion = order.plannedQty / material.totalPlanned;
                                            const allocated = allocations[order.orderId] || 0;

                                            return (
                                                <tr key={`${material.id}-${order.orderId}`}>
                                                    <td>{order.orderId}</td>
                                                    <td>{material.name}</td>
                                                    <td className={styles.textRight}>
                                                        {formatNumber(order.plannedQty)}
                                                    </td>
                                                    <td className={styles.textRight}>
                                                        {formatNumber(proportion * 100)}%
                                                    </td>
                                                    <td className={styles.textRight}>
                                                        {formatNumber(allocated)}
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <div className={styles.noteContainer}>
                            <label>Ghi chú thu hồi:</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Nhập ghi chú về việc thu hồi..."
                                className={styles.textarea}
                            />
                        </div>
                        <div className={styles.actions}>
                            <button
                                onClick={() => setShowRecoveryModal(false)}
                                className={styles.buttonSecondary}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmRecovery}
                                className={styles.buttonPrimary}
                            >
                                Xác nhận thu hồi
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                <div className={styles.header}>
                    <h1>Thu hồi NVL từ lệnh sản xuất</h1>
                    <div className={styles.headerButtons}>
                        <button
                            onClick={() => setShowRecoveryModal(true)}
                            disabled={selectedOrders.length === 0}
                            className={selectedOrders.length === 0 ? styles.buttonDisabled : styles.buttonPrimary}
                        >
                            Thu hồi NVL ({selectedOrders.length})
                        </button>
                        <button onClick={onClose} className={styles.closeButton}>×</button>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <colgroup>
                            <col style={{ width: '5%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '50%' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.length === orders.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedOrders(orders.map(o => o.id));
                                            } else {
                                                setSelectedOrders([]);
                                            }
                                        }}
                                    />
                                </th>
                                <th>Mã LSX</th>
                                <th>Trạng thái</th>
                                <th>Ngày bắt đầu</th>
                                <th>NVL đã xuất</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders.includes(order.id)}
                                            onChange={() => handleOrderSelect(order.id)}
                                        />
                                    </td>
                                    <td className={styles.fontMedium}>{order.id}</td>
                                    <td>
                                        <span className={styles.status}>{formatStatus(order.status)}</span>
                                    </td>
                                    <td>{order.startDate}</td>
                                    <td>
                                        <div className={styles.materialTags}>
                                            {order.materials.map(m => (
                                                <span key={m.id} className={styles.materialTag}>
                                                    {m.name}: {formatNumber(m.plannedQty)} {m.unit}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <RecoveryModal />

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

export default PhieuNhap;