import React, { useState, useEffect } from 'react';
import styles from './InvoicePopup.module.css';
import { message } from "antd";
import Select from 'react-select';
// API
import { getAllKhachHang } from '../../../apis/khachHangService';
import { createNewHoaDon } from '../../../apis/hoaDonService';
import { getAllHangHoa } from '../../../apis/hangHoaService';
import { createNewHoaDonSanPham } from '../../../apis/hoaDonSanPhamService.jsx';
import { HOA_DON_TYPE } from "../../../CONST.js";

export default function InvoicePopup({ loadData, currentUser, onClose, type = HOA_DON_TYPE.DauRa }) {
    const [khachHangList, setKhachHangList] = useState([]);
    const [KHLists, setKHLists] = useState([]);
    const [hangHoaList, setHangHoaList] = useState([]);
    const [invoice, setInvoice] = useState({
        invoiceInfo: {
            date: new Date().toISOString().split('T')[0],
            dueDate: '',
            mauSo: '',
            kiHieu: ''
        },
        customerInfo: {
            id_khach_hang: '',
            name: '',
            taxCode: '',
            address: '',
            email: '',
            contact: '',
            phone: '',
            bankAccount: '',
            bankName: ''
        },
        items: [
            {
                id: 1,
                code: '',
                description: '',
                unit: '',
                quantity: 1,
                unitPrice: 0,
                vatRate: 10
            }
        ],
        paymentMethod: 'CK',
        note: ''
    });

    const getSPData = async () => {
        try {
            const HHLists = await getAllHangHoa();
            const options = HHLists.map(hh => ({
                value: hh.id,
                label: hh.name,
                code: hh.code,
                dvt: hh.dvt,
                giaban: hh.gia_ban
            }));
            setHangHoaList(options);
        } catch (e) {
            message.error(e.message);
        }
    };

    const getKHData = async () => {
        try {
            const KHList = await getAllKhachHang();
            setKHLists(KHList);
            const options = KHList.map(kh => ({
                value: kh.id,
                label: `${kh.name} (mst: ${kh.mst})`
            }));
            setKhachHangList(options);
        } catch (e) {
            message.error(e.message);
        }
    };

    const formatNumber = (number) => {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const parseNumber = (formattedNumber) => {
        return parseFloat(formattedNumber.replace(/\./g, "")) || 0;
    };

    const handleCustomerSelect = (selectedCustomerId) => {
        const selectedCustomer = KHLists.find(kh => kh.id === selectedCustomerId);
        if (selectedCustomer) {
            setInvoice(prev => ({
                ...prev,
                customerInfo: {
                    ...prev.customerInfo,
                    id_khach_hang: selectedCustomer.id,
                    name: selectedCustomer.name,
                    taxCode: selectedCustomer.mst,
                    bankAccount: selectedCustomer.bank_account || '',
                    bankName: selectedCustomer.bank_name || '',
                    term: selectedCustomer.dieu_khoan_tt || '',
                    code: selectedCustomer.code || '',
                }
            }));
        }
    };

    const handleInvoiceInfoChange = (field, value) => {
        setInvoice(prev => ({
            ...prev,
            invoiceInfo: {
                ...prev.invoiceInfo,
                [field]: value
            }
        }));
    };

    const handleItemChange = (index, field, value) => {
        if (field === 'unitPrice') {
            const numericValue = parseNumber(value);
            setInvoice(prev => ({
                ...prev,
                items: prev.items.map((item, i) =>
                    i === index ? { ...item, [field]: numericValue } : item
                )
            }));
        } else {
            setInvoice(prev => ({
                ...prev,
                items: prev.items.map((item, i) =>
                    i === index ? { ...item, [field]: value } : item
                )
            }));
        }
    };

    const handleProductSelect = (selectedOption, index) => {
        if (selectedOption) {
            setInvoice(prev => ({
                ...prev,
                items: prev.items.map((item, i) =>
                    i === index
                        ? {
                            ...item,
                            id: selectedOption.value,
                            code: selectedOption.code,
                            description: selectedOption.label,
                            unit: selectedOption.dvt,
                            unitPrice: selectedOption.giaban
                        }
                        : item
                )
            }));
        }
    };

    const addItem = () => {
        setInvoice(prev => ({
            ...prev,
            items: [...prev.items, { code: '', description: '', unit: '', quantity: 1, unitPrice: 0, vatRate: 10 }]
        }));
    };

    const removeItem = (index) => {
        setInvoice(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const calculateTotal = () => {
        const total = invoice.items.reduce((sum, item) => {
            const amount = item.quantity * item.unitPrice;
            const vat = (amount * item.vatRate) / 100;
            return sum + amount + vat;
        }, 0);

        return total;
    };

    const handleSubmit = async (isWait) => {
        if (!invoice.invoiceInfo.date) {
            message.warning('Vui lòng nhập ngày hóa đơn');
            return;
        }
        if (!invoice.customerInfo.id_khach_hang) {
            message.warning('Vui lòng chọn tên đơn vị');
            return;
        }
        const hasValidItems = invoice.items.some(item => item.description && item.code);
        if (!hasValidItems) {
            message.warning('Vui lòng chọn ít nhất một hàng hóa');
            return;
        }
        const currentDate = new Date();
        let total_without_vate = 0;
        const vatRates = new Set(invoice.items.map(item => item.vatRate));
        const thue_suat = vatRates.size > 1 ? 'mix' : Array.from(vatRates)[0];
        invoice.items.forEach(item => {
            total_without_vate += item.quantity * parseInt(item.unitPrice);
        });
        const newData = {
            date: invoice.invoiceInfo.date,
            id_khach_hang: invoice.customerInfo.id_khach_hang,
            khach_hang: invoice.customerInfo.code,
            hinh_thuc_tt: invoice.paymentMethod == 'CK' ? 'Chuyển khoản' : 'Tiền mặt',
            type: type,
            trang_thai: isWait ? 'Chờ' : 'Nháp',
            code: `INV${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}${String(currentDate.getHours()).padStart(2, '0')}${String(currentDate.getMinutes()).padStart(2, '0')}${String(currentDate.getSeconds()).padStart(2, '0')}`,
            so_hoa_don: `INV${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}${String(currentDate.getHours()).padStart(2, '0')}${String(currentDate.getMinutes()).padStart(2, '0')}${String(currentDate.getSeconds()).padStart(2, '0')}`,
            mau_so: invoice.invoiceInfo.mauSo,
            ky_hieu_hd: invoice.invoiceInfo.kiHieu,
            tong_gia_tri_chua_thue: total_without_vate,
            tong_gia_tri: calculateTotal(),
            thue_suat: thue_suat,
            note: invoice.note,
            tien_thue: calculateTotal() - total_without_vate,
            user_create: currentUser.email,
        };

        try {
            const newHoaDon = await createNewHoaDon(newData);
            const productDetails = invoice.items
                .filter(item => item.code && item.description)
                .map(item => ({
                    id: item.id,
                    code: item.code,
                    soLuong: item.quantity,
                    thue: item.vatRate
                }));
            for (const product of productDetails) {
                await createNewHoaDonSanPham({
                    orderId: newHoaDon.id,
                    productId: product.id,
                    productCode: product.code,
                    soLuong: product.soLuong,
                    thue: product.thue
                });
            }
            message.success('Hóa đơn đã được tạo thành công');
            if (!loadData || !onClose) {
                return
            }
            loadData();
            onClose();
        } catch (error) {
            console.log(error)
            message.error('Có lỗi xảy ra khi tạo hóa đơn');
        }
    };

    useEffect(() => {
        getKHData();
        getSPData();
    }, []);

    return (
        // <div className={styles.popupOverlay}>
        //     <div className={styles.popupContainer}>
        //         <button className={styles.closeButton} onClick={onClose}>×</button>

        <div className={styles.invoiceContent}>
            {/* Invoice Information Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Thông tin hóa đơn</h2>
                <div className={styles.gridThree}>
                    <div>
                        <label className={styles.label}>Ngày hóa đơn</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={invoice.invoiceInfo.date}
                            onChange={(e) => handleInvoiceInfoChange('date', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={styles.label}>Mẫu số</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={invoice.invoiceInfo.mauSo}
                            onChange={(e) => handleInvoiceInfoChange('mauSo', e.target.value)}
                            placeholder="Nhập mẫu số"
                        />
                    </div>
                    <div>
                        <label className={styles.label}>Kí hiệu hóa đơn</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={invoice.invoiceInfo.kiHieu}
                            onChange={(e) => handleInvoiceInfoChange('kiHieu', e.target.value)}
                            placeholder="Nhập kí hiệu"
                        />
                    </div>
                </div>
            </div>

            {/* Customer Information Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Thông tin khách hàng</h2>
                <div className={styles.gridThree}>
                    <div>
                        <label className={styles.label}>Tên đơn vị</label>
                        {/* <select
                                    className={styles.input}
                                    value={invoice.customerInfo.id_khach_hang}
                                    onChange={(e) => handleCustomerSelect(e.target.value)}
                                >
                                    <option value="">Chọn khách hàng</option>
                                    {khachHangList.map(kh => (
                                        <option key={kh.id} value={kh.id}>
                                            {kh.name} (mst: {kh.mst})
                                        </option>
                                    ))}
                                </select> */}
                        <Select
                            onChange={(selectedOption) => handleCustomerSelect(selectedOption.value)}
                            isSearchable={true}
                            name="name"
                            options={khachHangList}
                            value={khachHangList.find(option => option.value === invoice.customerInfo.id_khach_hang) || null}
                        />
                    </div>
                    <div>
                        <label className={styles.label}>Mã số thuế</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={invoice.customerInfo.taxCode}
                            readOnly
                            disabled
                        />
                    </div>
                    <div>
                        <label className={styles.label}>Điều khoản thanh toán</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={invoice.customerInfo.term ? invoice.customerInfo.term + ' ngày' : ''}
                            readOnly
                            disabled
                        />
                    </div>
                </div>
            </div>

            {/* Invoice Items Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Chi tiết hàng hóa, dịch vụ</h2>

                <div className={styles.itemHeaders}>
                    <div style={{ width: '100px' }}>Mã hàng</div>
                    <div style={{ flex: 1 }}>Tên hàng hóa</div>
                    <div style={{ width: '80px' }}>ĐVT</div>
                    <div style={{ width: '100px' }}>Số lượng</div>
                    <div style={{ width: '120px' }}>Đơn giá (VNĐ)</div>
                    <div style={{ width: '100px' }}>Thuế suất</div>
                    <div style={{ width: '40px' }}></div>
                </div>

                {invoice.items.map((item, index) => (
                    <div key={index} className={styles.itemRow}>
                        <div style={{ width: '100px' }}>
                            <input
                                type="text"
                                placeholder="Mã hàng"
                                className={styles.input}
                                value={item.code}
                                readOnly
                                disabled
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <Select
                                className={styles.select}
                                options={hangHoaList}
                                value={hangHoaList.find(option => option.label === item.description) || null}
                                onChange={(selectedOption) => handleProductSelect(selectedOption, index)}
                                isSearchable={true}
                                placeholder="Chọn hàng hóa"
                            />
                        </div>
                        <div style={{ width: '80px' }}>
                            <input
                                type="text"
                                placeholder="ĐVT"
                                className={styles.input}
                                value={item.unit}
                                readOnly
                                disabled
                            />
                        </div>
                        <div style={{ width: '100px' }}>
                            <input
                                type="number"
                                placeholder="Số lượng"
                                className={styles.input}
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                            />
                        </div>
                        <div style={{ width: '120px' }}>
                            <input
                                type="text"
                                placeholder="Đơn giá"
                                className={styles.input}
                                value={formatNumber(item.unitPrice)}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^\d.]/g, '');
                                    handleItemChange(index, 'unitPrice', value);
                                }}
                                onFocus={(e) => {
                                    e.target.value = item.unitPrice.toString();
                                }}
                                onBlur={(e) => {
                                    e.target.value = formatNumber(item.unitPrice);
                                }}
                            />
                        </div>
                        <div style={{ width: '100px' }}>
                            <select
                                className={styles.input}
                                value={item.vatRate}
                                onChange={(e) => handleItemChange(index, 'vatRate', parseInt(e.target.value))}
                            >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="8">8%</option>
                                <option value="10">10%</option>
                            </select>
                        </div>
                        <div style={{ width: '40px' }}>
                            <button
                                className={styles.removeItemButton}
                                onClick={() => removeItem(index)}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    className={styles.addItemButton}
                    onClick={addItem}
                >
                    + Thêm hàng hóa
                </button>
            </div>

            <div className={styles.section}>
                <div className={styles.paymentMethodGrid}>
                    <div>
                        <label className={styles.label}>Hình thức thanh toán</label>
                        <select
                            className={styles.input}
                            value={invoice.paymentMethod}
                            onChange={(e) => setInvoice(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        >
                            <option value="TM">Tiền mặt</option>
                            <option value="CK">Chuyển khoản</option>
                        </select>
                    </div>
                    <div>
                        <label className={styles.label}>Ghi chú</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={invoice.note}
                            onChange={(e) => setInvoice(prev => ({ ...prev, note: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            {/* Total and Actions */}
            <div className={styles.totalSection}>
                <div className={styles.totalText}>
                    Tổng tiền (đã bao gồm VAT): {new Intl.NumberFormat('en-US').format(calculateTotal()) + ' đ'}
                </div>
            </div>

            <div className={styles.actionButtons}>
                <button className={styles.previewButton}>Xem hóa đơn nháp</button>
                <button
                    className={styles.draftButton}
                    onClick={() => handleSubmit(false)}
                >
                    Lưu nháp</button>
                <button
                    className={styles.submitButton}
                    onClick={() => handleSubmit(true)}
                >
                    Xuất hóa đơn
                </button>
            </div>
        </div>
        //     </div>
        // </div>
    );
}
