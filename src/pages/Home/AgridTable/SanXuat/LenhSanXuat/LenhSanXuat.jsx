import React, { useEffect, useState } from 'react';
import { Eye, Plus, AlertCircle, CheckCircle, Clock, FileOutput, Wallet, PlayCircle, XCircle, Save } from 'lucide-react';
import styles from './LenhSanXuat.module.css';
import { message } from 'antd';
// CONSTANT
import { LSX_STATUS } from '../../../../../CONST';
// FUNCTION
import { createDateOnly, createTimestamp } from '../../../../../generalFunction/format';
// COMPONENT
import NotesSection from './Note/Note';
import SanPhamDauRa from './SanPhamDauRa/SanPhamDauRa';
import DinhMucNguyenLieu from './DinhMucNguyenLieu/DinhMucNguyenLieu';
import PhieuXuat from './PhieuXuat/PhieuXuat';
import PhieuNhap from './PhieuNhap/PhieuNhap';
// API
import { getAllLenhSanXuat, getLenhSanXuatNLByLSXId, updateLenhSanXuat, createNewLenhSanXuat, getLenhSanXuatSPByLSXId } from '../../../../../apis/lenhSanXuatService';
import { getAllDinhMucSP } from '../../../../../apis/dinhMucBomService';
import { getCurrentUserLogin } from '../../../../../apis/userService';
import { getAllHangHoa } from '../../../../../apis/hangHoaService';

export default function DinhMucLenhSanXuat() {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [allSanPham, setAllSanPham] = useState([]);
    const [allNguyenLieu, setAllNguyenLieu] = useState([]);
    const [allSanPhamBOM, setAllSanPhamBOM] = useState([]);
    const [sanPhamList, setSanPhamList] = useState([]);
    const [nguyenLieuList, setnguyenLieuList] = useState([]);
    const [sanPhamDropDown, setSanPhamDropDown] = useState([]);
    const [nguyenLieuDropDown, setNguyenLieuDropDown] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [showDocumentsModal, setShowDocumentsModal] = useState(false);
    const [orders, setOrders] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState(selectedOrder?.trang_thai);
    const [hasStatusChanged, setHasStatusChanged] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [showPhieuPopup, setShowPhieuPopup] = useState(false);
    const [phieuType, setPhieuType] = useState(null);

    const loadData = async () => {
        try {
            const ordersData = await getAllLenhSanXuat();
            setOrders(ordersData);
            let sanPhamList = await getAllDinhMucSP();
            sanPhamList = sanPhamList.filter(sp => sp.show);
            const hangHoaList = await getAllHangHoa();
            const allSanPham = hangHoaList.filter(item => item.loai === 'sp');
            const allNguyenLieu = hangHoaList.filter(item => item.loai === 'nl');
            setAllSanPham(allSanPham);
            setAllNguyenLieu(allNguyenLieu)
            setAllSanPhamBOM(sanPhamList);
            if (selectedOrder) {
                handleSelectOrder(selectedOrder);
            }
        } catch (error) {
            console.error(error);
            message.error('Error loading data');
        }
    }

    const fetchCurrentUser = async () => {
        const { data, error } = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    const getStatusIcon = (trang_thai) => {
        switch (trang_thai) {
            case LSX_STATUS.PENDING: return <Clock className={styles.iconYellow} />;
            case LSX_STATUS.APPROVE: return <CheckCircle className={styles.iconBlue} />;
            case LSX_STATUS.COMPLETED: return <CheckCircle className={styles.iconGreen} />;
            case LSX_STATUS.ONGOING: return <PlayCircle className={styles.iconOrange} />;
            case LSX_STATUS.CANCEL: return <XCircle className={styles.iconRed} />;
            default: return <AlertCircle className={styles.iconGray} />;
        }
    };

    const getStatusClass = (trang_thai) => {
        switch (trang_thai) {
            case LSX_STATUS.PENDING: return styles.statusPending;
            case LSX_STATUS.APPROVE: return styles.statusApproved;
            case LSX_STATUS.COMPLETED: return styles.statusCompleted;
            default: return styles.statusDefault;
        }
    };

    const getStatusText = (trang_thai) => {
        switch (trang_thai) {
            case LSX_STATUS.PENDING: return 'Chưa bắt đầu';
            case LSX_STATUS.APPROVE: return 'Duyệt LSX';
            case LSX_STATUS.ONGOING: return 'Đang sản xuất';
            case LSX_STATUS.COMPLETED: return 'Hoàn thành';
            case LSX_STATUS.CANCEL: return 'hủy';
            default: return 'Khác';
        }
    };

    const RelatedDocumentsModal = ({ isOpen, onClose, orderId }) => {
        if (!isOpen) return null;

        const documents = [
            { code: 'PX001', type: 'Phiếu xuất', date: '2024-01-21', trang_thai: 'Đã duyệt' },
            { code: 'PN001', type: 'Phiếu nhập', date: '2024-01-22', trang_thai: 'Đã duyệt' },
            { code: 'PX002', type: 'Phiếu xuất', date: '2024-01-23', trang_thai: 'Chờ duyệt' }
        ];

        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                    <h3 className={styles.modalTitle}>Phiếu nhập xuất - LSX {orderId}</h3>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Số phiếu</th>
                                    <th>Loại phiếu</th>
                                    <th>Ngày</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map(doc => (
                                    <tr key={doc.code}>
                                        <td>{doc.code}</td>
                                        <td>{doc.type}</td>
                                        <td>{doc.date}</td>
                                        <td>{doc.trang_thai}</td>
                                        <td className={styles.actionCell}>
                                            <button className={styles.viewButton}>Xem</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.modalFooter}>
                        <button onClick={onClose} className={styles.closeButton}>Đóng</button>
                    </div>
                </div>
            </div>
        );
    };

    // handle
    const handleOrderSelect = (order, isChecked) => {
        if (isChecked) {
            setSelectedOrders([...selectedOrders, order]);
        } else {
            setSelectedOrders(selectedOrders.filter(o => o.id !== order.id));
        }
    };

    const handleSelectOrder = async (order) => {
        setSelectedOrder(order);
        const sanPhamLSXList = await getLenhSanXuatSPByLSXId(order.id);
        const nguyenLieuLSXList = await getLenhSanXuatNLByLSXId(order.id);
        let availableSP = allSanPham;
        let availableNL = allNguyenLieu;
        let sanPhams = [];
        let nguyenLieus = [];
        if (sanPhamLSXList.length > 0) {
            const sanPhamLSXIds = sanPhamLSXList.map((sp) => String(sp.idSP));
            availableSP = allSanPham.filter(
                (sanPham) => !sanPhamLSXIds.includes(String(sanPham.id))
            );
            for (const sp of sanPhamLSXList) {
                const spData = allSanPham.find((hh) => String(hh.id) === String(sp.idSP));
                if (spData) {
                    sanPhams.push({ ...spData, soLuong: sp.SoLuong, idSPLSX: sp.id, soLuongThucTe: sp.SoLuongThucTe || 0 });
                }
            }
        }
        if (nguyenLieuLSXList.length > 0) {
            const nguyenLieuLSXLists = nguyenLieuLSXList.map((nl) => String(nl.idNL));
            availableNL = allNguyenLieu.filter(
                (nguyenLieu) => !nguyenLieuLSXLists.includes(String(nguyenLieu.id))
            );
            for (const nl of nguyenLieuLSXList) {
                const nlData = allNguyenLieu.find((hh) => hh.id == nl.idNL);
                if (nlData) {
                    nguyenLieus.push({ ...nlData, soLuong: nl.SoLuong, idNLLSX: nl.id, idNL: nl.idNL, unit: nl.dvt, soLuongThucTe: nl.SoLuongThucTe || 0 });
                }
            }
        }
        availableSP = availableSP.map((sanPham) => {
            const hasBOM = allSanPhamBOM.some((bom) => bom.idHangHoa == sanPham.id);
            return { ...sanPham, hasBOM };
        });
        setnguyenLieuList(nguyenLieus);
        setSanPhamList(sanPhams);
        setSanPhamDropDown(availableSP);
        setNguyenLieuDropDown(availableNL);
    };

    const handleCreateNewOrder = async () => {
        try {
            const newData = {
                ngay_tao: createDateOnly(),
                ngay_dk_hoan_thanh: createDateOnly(),
                trang_thai: LSX_STATUS.PENDING,
                created_at: createTimestamp(),
                user_create: currentUser.email
            };
            await createNewLenhSanXuat(newData);
            loadData();
            message.success('New order created');
        } catch (error) {
            console.error(error);
            message.error('Error creating new order');
        }
    };

    const handleStatusChange = (e) => {
        const newStatus = e.target.value;
        setSelectedStatus(newStatus);
        setHasStatusChanged(newStatus !== selectedOrder.trang_thai);
    };

    const handleSaveStatus = async () => {
        try {
            const updatedOrder = { ...selectedOrder, trang_thai: selectedStatus };
            await updateLenhSanXuat(updatedOrder);
            loadData();
            setSelectedOrder(updatedOrder);
            setHasStatusChanged(false);
        } catch (error) {
            console.error(error);
            message.error('Đã có lỗi xảy ra');
        }
    };

    // useEffect 
    useEffect(() => {
        fetchCurrentUser();
        loadData();
    }, []);

    return (
        <div className={styles.container}>
            {/* Left Panel */}
            <div className={styles.leftPanel}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Lệnh Sản Xuất</h2>
                    <div className={styles.buttonGroup}>
                        <button
                            className={`${styles.returnButton} ${selectedOrders.length === 0 ? styles.disabled : ''}`}
                            onClick={() => {
                                if (selectedOrders.length > 0) {
                                    setPhieuType('xuat');
                                    setShowPhieuPopup(true);
                                }
                            }}
                            disabled={selectedOrders.length === 0}
                        >
                            <FileOutput size={20} />
                            <span>Phiếu xuất</span>
                        </button>
                        <button
                            className={`${styles.returnButton} ${selectedOrders.length === 0 ? styles.disabled : ''}`}
                            onClick={() => {
                                if (selectedOrders.length > 0) {
                                    setPhieuType('nhap');
                                    setShowPhieuPopup(true);
                                }
                            }}
                            disabled={selectedOrders.length === 0}
                        >
                            <Wallet size={20} />
                            <span>Phiếu nhập</span>
                        </button>
                        <button
                            className={styles.createButton}
                            onClick={() => handleCreateNewOrder()}
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                <div className={styles.ordersList}>
                    {orders.map(order => (
                        <div
                            key={order.code}
                            className={styles.orderCard}
                            onClick={() => handleSelectOrder(order)}
                        >
                            <div className={styles.orderHeader}>
                                <div className={styles.orderHeaderLeft}>
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.some(o => o.id === order.id)}
                                        onChange={(e) => handleOrderSelect(order, e.target.checked)}
                                        onClick={(e) => e.stopPropagation()}
                                        className={styles.checkbox}
                                    />
                                    <span className={styles.orderId}>{order.code}</span>
                                </div>
                                <div className={styles.orderActions}>
                                    {getStatusIcon(order.trang_thai)}
                                    <Eye
                                        className={styles.actionIcon}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowDocumentsModal(true);
                                        }}
                                    />
                                </div>
                            </div>
                            <div className={styles.orderInfo}>
                                <div className={styles.dates}>
                                    <div>Ngày tạo: {order.ngay_tao}</div>
                                    <div>Hoàn thành: {order.ngay_dk_hoan_thanh}</div>
                                </div>
                                <span className={getStatusClass(order.trang_thai)}>
                                    {getStatusText(order.trang_thai)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel */}
            <div className={styles.rightPanel}>
                {selectedOrder ? (
                    <div className={styles.orderDetails}>
                        <div className={styles.detailsHeader}>
                            <div>
                                <h2 className={styles.detailsTitle}>Chi tiết LSX: {selectedOrder.code}</h2>
                                <div className={styles.detailsDates}>
                                    <div>Ngày tạo: {selectedOrder.ngay_tao}</div>
                                    <div>Dự kiến hoàn thành: {selectedOrder.ngay_dk_hoan_thanh}</div>
                                </div>
                            </div>
                        </div>

                        <NotesSection
                            styles={styles}
                            initialNotes={selectedOrder.ghi_chu}
                            onSave={async (newNotes) => {
                                await updateLenhSanXuat({ id: selectedOrder.id, ghi_chu: newNotes });
                            }}
                        />

                        <div className={styles.outputSection}>
                            <SanPhamDauRa
                                styles={styles}
                                reload={() => handleSelectOrder(selectedOrder)}
                                sanPhamList={sanPhamList}
                                nguyenLieuList={nguyenLieuList}
                                allSanPhamBOM={allSanPhamBOM}
                                selectedOrder={selectedOrder}
                                sanPhamDropDown={sanPhamDropDown}
                            />
                        </div>

                        <div className={styles.bomSection}>
                            <DinhMucNguyenLieu
                                styles={styles}
                                reload={() => handleSelectOrder(selectedOrder)}
                                nguyenLieuList={nguyenLieuList}
                                selectedOrder={selectedOrder}
                                nguyenLieuDropDown={nguyenLieuDropDown}
                            />
                        </div>

                        <div className={styles.approvalSection}>
                            {selectedOrder.trang_thai != LSX_STATUS.APPROVE ? (
                                <div className={styles.approvalSection}>
                                    <div className={styles.statusDropdownContainer}>
                                        <select
                                            className={styles.statusDropdown}
                                            value={selectedStatus}
                                            onChange={handleStatusChange}
                                        >
                                            <option value={LSX_STATUS.PENDING}>{getStatusText(LSX_STATUS.PENDING)}</option>
                                            <option value={LSX_STATUS.APPROVE}>{getStatusText(LSX_STATUS.APPROVE)}</option>
                                            <option value={LSX_STATUS.ONGOING}>{getStatusText(LSX_STATUS.ONGOING)}</option>
                                            <option value={LSX_STATUS.COMPLETED}>{getStatusText(LSX_STATUS.COMPLETED)}</option>
                                            <option value={LSX_STATUS.CANCEL}>{getStatusText(LSX_STATUS.CANCEL)}</option>
                                        </select>

                                        {hasStatusChanged && (
                                            <button
                                                className={styles.saveButton}
                                                onClick={handleSaveStatus}
                                            >
                                                <Save size={16} />
                                                Lưu
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <button
                                    className={styles.approvedButton}
                                    disabled
                                >
                                    Đã Duyệt
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        Chọn một lệnh sản xuất để xem chi tiết
                    </div>
                )}
            </div>

            <RelatedDocumentsModal
                isOpen={showDocumentsModal}
                onClose={() => setShowDocumentsModal(false)}
                orderId={selectedOrder?.code}
            />

            {phieuType == 'nhap' && (
                <PhieuNhap
                    isOpen={showPhieuPopup}
                    onClose={() => setShowPhieuPopup(false)}
                    reload={loadData}
                    orderList={selectedOrders}
                    allNguyenLieu={allNguyenLieu}
                    currentUser={currentUser}
                />
            )}

            {phieuType == 'xuat' && (
                <PhieuXuat
                    isOpen={showPhieuPopup}
                    onClose={() => setShowPhieuPopup(false)}
                    reload={loadData}
                    orderList={selectedOrders}
                    allNguyenLieu={allNguyenLieu}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
}