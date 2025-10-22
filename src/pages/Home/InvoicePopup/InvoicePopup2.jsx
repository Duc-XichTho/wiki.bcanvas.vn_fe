import React, {useContext, useEffect, useState} from 'react';
import styles from './InvoicePopup.module.css';
import {Button, Flex, Form, Input, message, Typography} from "antd";
import Select from 'react-select';
// API
import {getAllKhachHang} from '../../../apis/khachHangService';
import {createNewHoaDon, getAllHoaDon} from '../../../apis/hoaDonService';
import {getAllHangHoa} from '../../../apis/hangHoaService';
import {createNewHoaDonSanPham} from '../../../apis/hoaDonSanPhamService.jsx';
import {HOA_DON_TYPE} from "../../../CONST.js";
import {getCurrentUserLogin} from "../../../apis/userService.jsx";
import {useParams} from "react-router-dom";
import {getAllCard} from "../../../apis/cardService.jsx";
import {getAllSheet} from "../../../apis/sheetService.jsx";
import {getAllLo} from "../../../apis/loService.jsx";
import {getAllKho} from "../../../apis/khoService.jsx";
import {getAllStep} from "../../../apis/stepService.jsx";
import {SD} from "../../../Consts/LIST_STEP_TYPE.js";
import {getFullDetailPhieuNhapService} from "../../../apis/detailPhieuNhapService.jsx";
import {getFullDetailPhieuXuatService} from "../../../apis/detailPhieuXuatService.jsx";
import {getAllCauHinh} from "../../../apis/cauHinhService.jsx";
import {getSubStepDKIdInCardByType} from "../../../generalFunction/logicMau/logicMau.js";
import {createNewDinhKhoanProData} from "../../../apis/dinhKhoanProDataService.jsx";
import {getDinhKhoanProDataByStepId} from "../../../apis/dinhKhoanProService.jsx";
import {MyContext} from "../../../MyContext.jsx";
import {getDonHangByCode} from "../../../apis/donHangService.jsx";
import {CODE_HDB, genCode} from "../../../generalFunction/genCode/genCode.js";
import {updateCardDetails} from "../SubStep/SubStepItem/Mau/cardUtils.js";
import {formatCurrency} from "../../../generalFunction/format.js";
import PopUpUploadFile from "../../../components/UploadFile/PopUpUploadFile.jsx";
import {PhieuLQ} from "../SubStep/SubStepItem/Mau/PhieuLQ/PhieuLQ.jsx";
import {getAllHopDong} from "../../../apis/hopDongService.jsx";

const {Text} = Typography;

export default function InvoicePopup2({
                                          loadData: loadDataHD,
                                          onClose,
                                          type = HOA_DON_TYPE.DauRa,
                                          phieuXuats,
                                          fetchPhieuXuats
                                      }) {
    const {
        loadData, setLoadData, selectedCompany, currentYear,
        chainTemplate2Selected,
        setChainTemplate2Selected
    } = useContext(MyContext);
    const {id, idCard, idStep} = useParams();
    const [khachHangList, setKhachHangList] = useState([]);
    const [KHLists, setKHLists] = useState([]);
    const [hangHoaList, setHangHoaList] = useState([]);
    const [hdList, setHdList] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [cards, setCards] = useState([]);
    const [card, setCard] = useState([]);
    const [step, setStep] = useState([]);
    const [sheets, setSheets] = useState([]);
    const [hhs, setHHs] = useState([]);
    const [los, setLos] = useState([]);
    const [khos, setKhos] = useState([]);
    const [nhaps, setNhaps] = useState(null);
    const [xuats, setXuats] = useState(null);
    const [cauHinh, setCauHinh] = useState(null);
    const [selectedPhieuXuats, setSelectedPhieuXuats] = useState([]);
    const [donHang, setDonHang] = useState(null);

    const [isOpenPhieuLQ, setIsOpenPhieuLQ] = useState(false);
    const [selectedPhieuCodes, setSelectedPhieuCodes] = useState([]);

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
        items: [],
        paymentMethod: 'CK',
        note: ''
    });

    useEffect(() => {
        getFullDetailPhieuNhapService().then(data => {
            setNhaps(data);
        })
        getFullDetailPhieuXuatService().then(data => {
            setXuats(data)
        })
        getAllCauHinh().then(data => {
            setCauHinh(data.find(item => item.field == 'Giá bán'));
        })
    }, []);

    const fetchCurrentUser = async () => {
        const {data} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    function fetchDonHang() {
        getDonHangByCode('DH|' + idCard).then(data => {
            setDonHang(data)
        })
    }

    function fetchCards() {
        getAllCard().then(data => {
            setCards(data)
        })
    }


    function fetchSheets() {
        getAllSheet().then(data => {
            setSheets(data)
        })
    }

    function fetchHHs() {
        getAllHangHoa().then(data => {
            setHHs(data)
        })
    }

    function fetchLos() {
        getAllLo().then(data => {
            setLos(data)
        })
    }

    function fetchKhos() {
        getAllKho().then(data => {
            setKhos(data)
        })
    }

    function fetchCard() {
        getAllCard().then(data => {
            setCard(data.find(item => item.id == idCard))
        })
    }

    function fetchStep() {
        getAllStep().then(data => {
            setStep(data.find(item => item.id == idStep));
        })
    }

    useEffect(() => {
        fetchCurrentUser();
        if (idCard) {
            fetchCard();
        }
        if (idStep) {
            fetchStep();
        }
        fetchCards();
        fetchLos()
        fetchKhos()
        fetchHHs()
        fetchSheets()
        fetchDonHang()
    }, []);

    const getSPData = async () => {
        try {
            const HHLists = await getAllHangHoa();
            let HDLists = await getAllHopDong();
            const options = HHLists.map(hh => ({
                value: hh.id,
                label: hh.name,
                code: hh.code,
                dvt: hh.dvt,
                giaban: hh.gia_ban
            }));
            const optionsHD = HDLists.map(hh => ({
                value: hh.code,
                label: hh.code,
                code: hh.code,
            }));
            setHangHoaList(options);
            setHdList(optionsHD);
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
        return number?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
                    i === index ? {...item, [field]: numericValue} : item
                )
            }));
        } else {
            setInvoice(prev => ({
                ...prev,
                items: prev.items.map((item, i) =>
                    i === index ? {...item, [field]: value} : item
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
    const handleHopDongSelect = (selectedOption, index) => {
        if (selectedOption) {
            setInvoice(prev => ({
                ...prev,
                items: prev.items.map((item, i) =>
                    i === index
                        ? {
                            ...item,
                            hopDong: selectedOption.value,
                        }
                        : item
                )
            }));
        }
    };

    const addItem = () => {
        setInvoice(prev => ({
            ...prev,
            items: [...prev.items, {
                code: '',
                description: '',
                unit: '',
                quantity: 1,
                unitPrice: 0,
                vatRate: 10,
                tien_nguyen_te: 0,
                ty_gia: 0,
                tong_tien_nguyen_te: 0
            }]
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

    const formatDate = (dateString) => {
        return dateString.split("-").reverse().join("-");
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
            date: formatDate(invoice.invoiceInfo.date),
            id_khach_hang: invoice.customerInfo.id_khach_hang,
            khach_hang: invoice.customerInfo.code,
            hinh_thuc_tt: invoice.paymentMethod == 'CK' ? 'Chuyển khoản' : 'Tiền mặt',
            type: type,
            trang_thai: isWait ? 'Chờ' : 'Nháp',
            code: genCode(CODE_HDB, idCard, currentYear),
            so_hoa_don: genCode(CODE_HDB, idCard, currentYear),
            mau_so: invoice.invoiceInfo.mauSo,
            ky_hieu_hd: invoice.invoiceInfo.kiHieu,
            tong_gia_tri_chua_thue: total_without_vate,
            tong_gia_tri: calculateTotal(),
            thue_suat: thue_suat,
            note: invoice.note,
            tien_thue: calculateTotal() - total_without_vate,
            user_create: currentUser.email,
            id_card_create: idCard,
            list_id_phieu_xuat: selectedPhieuXuats.map(item => item.value),
            company: selectedCompany,
            phieu_lq : selectedPhieuCodes,
        };

        try {
            const newHoaDon = await createNewHoaDon(newData);
            const productDetails = invoice.items
                .filter(item => item.code && item.description)
                .map(item => ({
                    id: item.id,
                    code: item.code,
                    soLuong: item.quantity,
                    thue: item.vatRate,
                    tien_nguyen_te: item.tien_nguyen_te,
                    ty_gia: item.ty_gia,
                    tong_tien_nguyen_te: item.tong_tien_nguyen_te,
                    hopDong: item.hopDong,

                }));
            let idSSDK = getSubStepDKIdInCardByType(card, SD);
            const dinhKhoanPro = await getDinhKhoanProDataByStepId(idSSDK, idCard);
            if (isWait) {
                await createNewDinhKhoanProData({
                    dinhKhoan_id: dinhKhoanPro.id,
                    "note": 'Tiền chưa thuế ' + newData.code,
                    "tkNo": 1311,
                    "tkCo": 5111,
                    "date": new Date(),
                    "soTien": newData.tong_gia_tri_chua_thue,
                    card_id: idCard,
                    step_id: idStep,
                    "show": true
                });
                await createNewDinhKhoanProData({
                    dinhKhoan_id: dinhKhoanPro.id,
                    "note": 'Tiền thuế ' + newData.code,
                    "tkNo": 1311,
                    "tkCo": 333,
                    "date": new Date(),
                    "soTien": newData.tien_thue,
                    card_id: idCard,
                    step_id: idStep,
                    "show": true
                });
            }
            for (const product of productDetails) {
                await createNewHoaDonSanPham({
                    orderId: newHoaDon.id,
                    productId: product.id,
                    productCode: product.code,
                    soLuong: product.soLuong,
                    thue: product.thue,
                    tien_nguyen_te: product.tien_nguyen_te,
                    ty_gia: product.ty_gia,
                    tong_tien_nguyen_te: product.tong_tien_nguyen_te,
                    hopDong: product.hopDong,
                });
            }
            message.success('Hóa đơn đã được tạo thành công');

            await updateCardDetails(idCard, newData.date, newData.tong_gia_tri, `${invoice.customerInfo?.code} | ${invoice.customerInfo?.name}`, genCode(CODE_HDB, idCard, currentYear), selectedPhieuCodes);
            setChainTemplate2Selected({
                type: 'chain2',
                data: {
                    ...chainTemplate2Selected.data,
                    selectedTemplate: {
                        ...chainTemplate2Selected.data?.selectedTemplate,
                        cards: chainTemplate2Selected.data?.selectedTemplate.cards.map((item) => item.id == idCard ? {
                            ...item,
                            mo_ta: newData.date,
                            so_tien: newData.tong_gia_tri,
                            mo_ta2: `${invoice.customerInfo?.code} | ${invoice.customerInfo?.name}`,
                            name: genCode(CODE_HDB, idCard, currentYear)
                        } : item)
                    }
                }
            })

            fetchPhieuXuats();
            setLoadData(!loadData);
            if (!loadDataHD || !onClose) {
                return
            }
            onClose();
        } catch (error) {
            console.log(error)
            message.error('Có lỗi xảy ra khi tạo hóa đơn');
        }
    };

    const handleSelectPhieuXuat = (selectedOptions) => {
        const isSelectAll = selectedOptions.some(option => option.value === 'select_all');
        let finalSelectedOptions;
        let previousSelectedIds = selectedPhieuXuats.map(option => option.value);

        if (isSelectAll) {
            finalSelectedOptions = phieuXuats.map(item => ({
                value: item.id_phieu_xuat,
                label: `${item.code}` || `PX${item.id_phieu_xuat}`,
            }));
        } else {
            finalSelectedOptions = selectedOptions;
        }
        let newSelectedIds = finalSelectedOptions.map(option => option.value);

        let addedIds = newSelectedIds.filter(id => !previousSelectedIds.includes(id));
        let removedIds = previousSelectedIds.filter(id => !newSelectedIds.includes(id));

        setSelectedPhieuXuats(finalSelectedOptions);

        const currentItems = new Map(
            invoice.items.map(item => [item.code, item])
        );
        addedIds.forEach(id => {
            const addedPhieuXuat = phieuXuats.find(px => px.id_phieu_xuat === id);
            if (addedPhieuXuat && addedPhieuXuat.danh_sach_hang_hoa) {
                addedPhieuXuat.danh_sach_hang_hoa.forEach(item => {
                    if (item.code) {
                        if (currentItems.has(item.code)) {
                            const existingItem = currentItems.get(item.code);
                            existingItem.quantity += item.so_luong;
                        } else {
                            const matchingHangHoa = hangHoaList.find(hh => hh.code === item.code);
                            let hhdh = donHang?.chi_tiet_don_hang;
                            if (hhdh) {
                                hhdh.forEach(hh => {
                                    if (hh.code_hang_hoa == item.code) {
                                        if (hh.chiet_khau) {
                                            matchingHangHoa.gia_ban = (hh.chiet_khau / hh.so_luong * item.so_luong) * matchingHangHoa.gia_ban;
                                        }
                                    }
                                })
                            }
                            currentItems.set(item.code, {
                                code: item.code,
                                id: matchingHangHoa.value,
                                description: item.name,
                                unit: item.dvt,
                                quantity: item.so_luong,
                                unitPrice: matchingHangHoa ? matchingHangHoa.giaban : 0,
                                vatRate: 10,
                                tien_nguyen_te: 0,
                                ty_gia: 0,
                                tong_tien_nguyen_te: 0
                            });
                        }
                    }
                });
            }
        });
        removedIds.forEach(id => {
            const removedPhieuXuat = phieuXuats.find(px => px.id_phieu_xuat === id);
            if (removedPhieuXuat && removedPhieuXuat.danh_sach_hang_hoa) {
                removedPhieuXuat.danh_sach_hang_hoa.forEach(item => {
                    if (item.code) {
                        if (currentItems.has(item.code)) {
                            const existingItem = currentItems.get(item.code);
                            existingItem.quantity -= item.so_luong;

                            if (existingItem.quantity <= 0) {
                                currentItems.delete(item.code);
                            }
                        }
                    }
                });
            }
        });
        setInvoice(prev => ({
            ...prev,
            items: Array.from(currentItems.values()).filter(item => item.quantity > 0)
        }));
    };

    useEffect(() => {
        getKHData();
        getSPData();
    }, []);

    const [showNgoaiTe, setShowNgoaiTe] = useState(false);

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
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Chọn ngoại tệ <input
                    type="checkbox"
                    checked={showNgoaiTe}
                    onChange={() => setShowNgoaiTe(!showNgoaiTe)}
                /></h2>
                {/*{showNgoaiTe && (*/}
                {/*    <Flex className={styles.gridThree}>*/}
                {/*        <Flex vertical gap={7}>*/}
                {/*            <Text>Tiền nguyên tệ </Text>*/}
                {/*            <Input*/}
                {/*                value={tienNguyenTe}*/}
                {/*                onChange={(e) => setTienNguyenTe(e.target.value)}*/}
                {/*                placeholder={"Nhập tiền nguyên tệ"}*/}
                {/*            />*/}
                {/*        </Flex>*/}
                {/*        <Flex vertical gap={7}>*/}
                {/*            <Text >Tỷ giá</Text>*/}
                {/*            <Input*/}
                {/*                value={tyGia}*/}
                {/*                onChange={(e) => setTyGia(e.target.value)}*/}
                {/*                placeholder={"Nhập tỷ giá"}*/}
                {/*            />*/}
                {/*        </Flex>*/}
                {/*    </Flex>*/}
                {/*)}*/}
            </div>
            <div className={styles.section}>
                <Form.Item label={'Phiếu liên quan'}>
                    {selectedPhieuCodes.length > 0 &&
                        <>
                            Các phiếu đang chọn: <i>{selectedPhieuCodes.toString()}</i>
                            <button onClick={() => {
                                setSelectedPhieuCodes([])
                            }}>Bỏ chọn toàn bộ
                            </button>
                        </>
                    }
                    <Button
                        onClick={() => setIsOpenPhieuLQ(true)}
                    >
                        Thêm phiếu LQ
                    </Button>
                </Form.Item>
            </div>
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Chọn phiếu xuất</h2>
                <div className={styles.gridFull}>
                    <Select
                        isMulti
                        options={[
                            {
                                value: 'select_all',
                                label: 'Chọn tất cả',
                            },
                            ...phieuXuats.map(item => ({
                                value: item.id_phieu_xuat,
                                label: `${item.code} - Tổng tiền: ${formatCurrency(item.tongTien.toFixed(0))} đ` || `PX${item.id_phieu_xuat}` + ` `,
                            })),
                        ]}
                        onChange={handleSelectPhieuXuat}
                        value={selectedPhieuXuats}
                        placeholder="Chọn phiếu xuất..."
                        isSearchable
                    />
                </div>
            </div>

            {/* Invoice Items Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Chi tiết hàng hóa, dịch vụ</h2>
                <div style={{width: '100%', overflowX: "auto"}}>
                    <div className={styles.itemHeaders}>
                        <div style={{width: '100px'}}>Mã hàng</div>
                        <div style={{width: '460px'}}>Tên hàng hóa</div>
                        <div style={{width: '80px'}}>ĐVT</div>
                        <div style={{width: '100px'}}>Số lượng</div>
                        <div style={{width: '120px'}}>Đơn giá (VNĐ)</div>
                        {showNgoaiTe &&
                            <>
                                <div style={{width: '130px'}}>Tiền nguyên tệ</div>
                                <div style={{width: '130px'}}>Tỷ giá</div>
                                <div style={{width: '160px'}}>Tổng tiền nguyên tệ</div>

                            </>

                        }
                        <div style={{width: '100px'}}>Thuế suất</div>
                        <div style={{width: '40px'}}></div>
                    </div>

                    {invoice.items.map((item, index) => {
                        return (
                            <div key={index} className={styles.itemRow}>
                                <div style={{width: '100px'}}>
                                    <input
                                        type="text"
                                        placeholder="Mã hàng"
                                        className={styles.input}
                                        value={item.code}
                                        readOnly
                                        disabled
                                    />
                                </div>
                                <div style={{width: '450px'}}>
                                    <Select
                                        className={styles.select}
                                        options={hangHoaList}
                                        value={hangHoaList.find(option => option.label === item.description) || null}
                                        onChange={(selectedOption) => handleProductSelect(selectedOption, index)}
                                        isSearchable={true}
                                        placeholder="Chọn hàng hóa"
                                    />
                                </div>
                                <div style={{width: '80px'}}>
                                    <input
                                        type="text"
                                        placeholder="ĐVT"
                                        className={styles.input}
                                        value={item.unit}
                                        readOnly
                                        disabled
                                    />
                                </div>
                                <div style={{width: '80px'}}>
                                    <input
                                        type="number"
                                        placeholder="Số lượng"
                                        className={styles.input}
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div style={{width: '120px'}}>
                                    <input
                                        type="text"
                                        placeholder="Đơn giá VND"
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
                                <div style={{width: '200px'}}>
                                    <PopUpUploadFile
                                        id={item?.id}
                                        table={`card_HDB_${idCard}`}
                                        onGridReady={() => setLoadData(!loadData)}
                                        card={idCard}
                                    />
                                </div>

                                {showNgoaiTe &&
                                    <>
                                        <div style={{width: '120px'}}>
                                            <input
                                                type="text"
                                                placeholder="Tiền nguyên tệ"
                                                className={styles.input}
                                                value={formatNumber(item.tien_nguyen_te)}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^\d.]/g, '');
                                                    handleItemChange(index, 'tien_nguyen_te', value);
                                                }}
                                                onFocus={(e) => {
                                                    e.target.value = item.tien_nguyen_te.toString();
                                                }}
                                                onBlur={(e) => {
                                                    e.target.value = formatNumber(item.tien_nguyen_te);
                                                }}
                                            />
                                        </div>
                                        <div style={{width: '120px'}}>
                                            <input
                                                type="text"
                                                placeholder="Tỷ giá"
                                                className={styles.input}
                                                value={formatNumber(item.ty_gia)}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^\d.]/g, '');
                                                    handleItemChange(index, 'ty_gia', value);
                                                }}
                                                onFocus={(e) => {
                                                    e.target.value = item.ty_gia.toString();
                                                }}
                                                onBlur={(e) => {
                                                    e.target.value = formatNumber(item.ty_gia);
                                                }}
                                            />
                                        </div>
                                        <div style={{width: '155px'}}>
                                            <input
                                                type="text"
                                                placeholder="Tổng tiền nguyên tệ"
                                                className={styles.input}
                                                value={formatNumber(item.tong_tien_nguyen_te)}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^\d.]/g, '');
                                                    handleItemChange(index, 'tong_tien_nguyen_te', value);
                                                }}
                                                onFocus={(e) => {
                                                    e.target.value = item.tong_tien_nguyen_te.toString();
                                                }}
                                                onBlur={(e) => {
                                                    e.target.value = formatNumber(item.tong_tien_nguyen_te);
                                                }}
                                            />
                                        </div>
                                    </>

                                }
                                <div style={{width: '250px'}}>
                                    <Select
                                        className={styles.select}
                                        options={hdList}
                                        value={hdList.find(option => option.code === item.hopDong) || null}
                                        onChange={(selectedOption) => handleHopDongSelect(selectedOption, index)}
                                        isSearchable={true}
                                        placeholder="Chọn hợp đồng"
                                    />
                                </div>
                                <div style={{width: '100px'}}>
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
                                <div style={{width: '40px'}}>
                                    <button
                                        className={styles.removeItemButton}
                                        onClick={() => removeItem(index)}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>

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
                            onChange={(e) => setInvoice(prev => ({...prev, paymentMethod: e.target.value}))}
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
                            onChange={(e) => setInvoice(prev => ({...prev, note: e.target.value}))}
                        />
                    </div>
                </div>
            </div>

            {/* Total and Actions */}
            <div className={styles.totalSection}>
                <div className={styles.totalText}>
                    Tổng tiền (đã bao gồm VAT): {new Intl.NumberFormat('en-US').format(calculateTotal()) + ' đ'}
                </div>
                <div className={styles.actionButtons}>
                    <button
                        className={styles.submitButton}
                        onClick={() => handleSubmit(false)}
                    >
                        Lưu
                    </button>
                    {/*<button*/}
                    {/*    className={styles.submitButton}*/}
                    {/*    onClick={() => handleSubmit(true)}*/}
                    {/*>*/}
                    {/*    Duyệt*/}
                    {/*</button>*/}
                </div>
            </div>
            {isOpenPhieuLQ && <PhieuLQ isOpenPhieuLQ={isOpenPhieuLQ} setIsOpenPhieuLQ={setIsOpenPhieuLQ}
                                       selectedPhieuCodes={selectedPhieuCodes}
                                       setSelectedPhieuCodes={setSelectedPhieuCodes}/>}
        </div>
        // </div>
        // </div>
    );
}
