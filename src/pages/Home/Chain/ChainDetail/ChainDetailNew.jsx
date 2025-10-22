import {Outlet, useParams} from "react-router-dom";
import React, {useContext, useEffect, useRef, useState} from "react";
import {createDonHang, getAllDonHang} from "../../../../apis/donHangService.jsx";
import {createNewHoaDon, getAllHoaDon} from "../../../../apis/hoaDonService.jsx";
import css from "./ChainDetail.module.css";
import {IconButton} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ActionBookMarkChain from "../../AgridTable/actionButton/ActionBookMarkChain.jsx";
import {Input, Menu, message, Modal, Popover} from "antd";
import {DateIcon, SearchIcon} from "../../../../icon/IconSVG.js";
import {MyContext} from "../../../../MyContext.jsx";
import ListCardNew from "../../Card/ListCard/ListCardNew.jsx";
import ViewCardTable from "../../Card/ListCard/ViewCardTable.jsx";
import {PhieuGom} from "../../SubStep/SubStepItem/Mau/PhieuXuat/PhieuGom.jsx";
import {PhieuGomNhap} from "../../SubStep/SubStepItem/Mau/PhieuXuat/PhieuGomNhap.jsx";
import {PhieuGomHoaDon} from "../../SubStep/SubStepItem/Mau/PhieuXuat/PhieuGomHoaDon.jsx";
import {PhieuGomPhieuThuBaoCo} from "../../SubStep/SubStepItem/Mau/PhieuXuat/PhieuGomPhieuThuBaoCo.jsx";
import {ViewPhieuGom} from "../../SubStep/SubStepItem/Mau/PhieuXuat/ViewPhieuGom.jsx";
import {createNewDeNghiThanhToan, getAllDeNghiThanhToan} from "../../../../apis/deNghiThanhToanService.jsx";
import {createDonMuaHang, getAllDonMuaHang} from "../../../../apis/donMuaHangService.jsx";
import {createNewTamUng, getAllTamUng} from "../../../../apis/tamUngService.jsx";
import {createPhieuChi2, getAllPhieuChi2} from "../../../../apis/phieuChi2Service.jsx";
import {createNewPhieuThu, getAllPhieuThu} from "../../../../apis/phieuThuService.jsx";
import {createNewDieuChuyenKho, getAllDieuChuyenKho} from "../../../../apis/dieuChuyenKhoService.jsx";
import {createNewPhieuNhap, getAllPhieuNhap} from "../../../../apis/phieuNhapService.jsx";
import {createNewPhieuXuat, getAllPhieuXuat} from "../../../../apis/phieuXuatService.jsx";
import {createTimestamp, formatDateFromTimestamp} from "../../../../generalFunction/format.js";

export default function ChainDetailNew() {
    const {option} = useParams();
    const [listData, setListData] = useState([]);
    const dropdownRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isViewGomOpen, setIsViewGomOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [sortCriteria, setSortCriteria] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [newCardName, setNewCardName] = useState("");  // State for new card name
    const [isModalVisible, setIsModalVisible] = useState(false);  // State for modal visibility
    const [searchText, setSearchText] = useState("");
    const [status, setStatus] = useState("");
    const [time, setTime] = useState("");
    const [selectedTemplateName, setSelectedTemplateName] = useState(null);  // State for selected template
    const [isViewTable, setIsViewTable] = useState(false);  // State for modal visibility

    const {
        selectedCompany,
        currentYear,
        isCollapsedCard,
        setIsCollapseCard,
        currentMonth,
        currentDay,
        loadData,
        setLoadData,
        chainTemplate2Selected,
        setChainTemplate2Selected,
        currentUser
    } = useContext(MyContext);

    const fieldConfig = {
        "don-hang": {
            id: 'id',
            code: "code",
            mo_ta: "ngay_dat_hang",
            mo_ta2: ["code_khach_hang", "name_khach_hang"],
            so_tien: ["tien_truoc_thue", "tien_thue"],
            trang_thai: "trang_thai",
            created_at: 'created_at'
        },
        "hoa-don": {
            id: 'id',
            code: "code",
            mo_ta: "date",
            mo_ta2: ["code_khach_hang", "name_khach_hang"],
            so_tien: ["tong_gia_tri_chua_thue", "tien_thue"],
            trang_thai: "trang_thai",
            created_at: 'created_at'
        },
        "de-nghi-thanh-toan": {
            id: 'id',
            code: "code",
            mo_ta: "ngay_du_kien_thanh_toan",
            mo_ta2: ["code_nhan_vien", "name_nhan_vien"],
            so_tien: ["tong_tien"],
            trang_thai: "trang_thai",
            created_at: 'created_at'
        },
        "de-nghi-mua": {
            id: 'id',
            code: "code",
            mo_ta: "ngay_mua_hang",
            mo_ta2: ["code_bo_phan_de_nghi", "name_bo_phan_de_nghi"],
            so_tien: ["tien_truoc_thue", "tien_thue"],
            trang_thai: "trang_thai",
            created_at: 'created_at'
        },
        "tam-ung": {
            id: 'id',
            code: "code",
            mo_ta: "created_at",
            mo_ta2: ["code_nhan_vien", "name_nhan_vien"],
            so_tien: ["tong_tien"],
            trang_thai: "trang_thai",
            created_at: 'created_at'
        },
        "phieu-chi": {
            id: 'id',
            code: "code",
            mo_ta: "ngay_chi",
            mo_ta2: ["ly_do"],
            so_tien: ["so_tien"],
            trang_thai: "trang_thai",
            created_at: 'created_at'
        },
        "phieu-thu": {
            id: 'id',
            code: "code",
            mo_ta: "ngay_thu",
            mo_ta2: ["ly_do"],
            so_tien: ["so_tien"],
            trang_thai: "trang_thai",
            created_at: 'created_at'
        },
        "dieu-chuyen-kho": {
            id: 'id',
            code: "code",
            mo_ta: "ngay",
            mo_ta2: ["kho_dich", "kho_nguon"],
            so_tien: ["so_tien"],
            trang_thai: "trang_thai",
            created_at: 'created_at'
        },
        "nhap-kho": {
            id: 'id',
            code: "code",
            mo_ta: "ngay",
            mo_ta2: ["code_nhan_vien", "name_nhan_vien"],
            so_tien: ["so_tien"],
            trang_thai: "trang_thai",
            created_at: 'created_at'
        },
        "xuat-kho": {
            id: 'id',
            code: "code",
            mo_ta: "ngay",
            mo_ta2: ["code_nhan_vien", "name_nhan_vien"],
            so_tien: ["so_tien"],
            trang_thai: "trang_thai",
            created_at: 'created_at'
        },
    }

    const isTimestamp = (value) => {
        return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value);
    };
    const formatItem = (item, option) => {
        const selectedFields = fieldConfig[option];

        return {
            id: item[selectedFields.id] || "",
            code: item[selectedFields.code] || "",
            mo_ta: isTimestamp(item[selectedFields.mo_ta])
                ? formatDateFromTimestamp(item[selectedFields.mo_ta])
                : item[selectedFields.mo_ta] || "",
            trang_thai: item[selectedFields.trang_thai] || null,
            created_at: item[selectedFields.created_at] || "",
            mo_ta2: option === 'dieu-chuyen-kho'
                ? selectedFields.mo_ta2.map(field => item[field] || "").join(" ➡ ")
                : selectedFields.mo_ta2.map(field => item[field] || "").join(" | "),
            so_tien: selectedFields.so_tien
                .map(field => parseFloat(item[field]) || 0)
                .reduce((acc, value) => acc + value, 0),
        };
    };

    const formatData = (data, option) => data.map(item => formatItem(item, option));


    const fetchData = async () => {
        let data = [];
        switch (option) {
            case "don-hang":
                data = await getAllDonHang();
                setSelectedTemplateName('Đơn hàng')
                break;
            case "hoa-don":
                data = await getAllHoaDon();
                setSelectedTemplateName('Hóa đơn')
                break;
            case 'de-nghi-thanh-toan':
                data = await getAllDeNghiThanhToan();
                setSelectedTemplateName('Đề nghị thanh toán')
                break;
            case 'de-nghi-mua':
                data = await getAllDonMuaHang();
                setSelectedTemplateName('Đề nghị mua')
                break;
            case 'tam-ung':
                data = await getAllTamUng();
                setSelectedTemplateName("Tạm ứng")
                break;
            case 'phieu-chi':
                data = await getAllPhieuChi2();
                setSelectedTemplateName("Phiếu chi / UN chi")
                break;
            case 'phieu-thu':
                data = await getAllPhieuThu();
                setSelectedTemplateName("Phiếu thu / Báo có")
                break;
            case 'dieu-chuyen-kho':
                data = await getAllDieuChuyenKho();
                setSelectedTemplateName("Điều chuyển kho")
                break;
            case 'nhap-kho':
                data = await getAllPhieuNhap();
                setSelectedTemplateName("Nhập kho")
                break;
            case 'xuat-kho':
                data = await getAllPhieuXuat();
                setSelectedTemplateName("Xuất kho")
                break;
            default:
                console.warn(`Option không hợp lệ: ${option}`);
                return;
        }
        const formattedData = formatData(data, option);
        setListData(formattedData);
    };


    useEffect(() => {
        fetchData()
        setIsOpen(false)
    }, [option]);


    const handleCreateCard = async () => {
        try {
            let data;
            const newData = {
                created_at: createTimestamp(),
                company: selectedCompany !== 'Toàn bộ' ? selectedCompany : '',
                year: currentYear,
                user_create: currentUser.email,
            }
            switch (option) {
                case "don-hang" :
                    newData.ngay_dat_hang = formatDateFromTimestamp(newData.created_at);
                    data = await createDonHang(newData)
                    break;
                case "hoa-don" :
                    newData.date = formatDateFromTimestamp(newData.created_at);
                    data = await createNewHoaDon(newData)
                    break;
                case "de-nghi-mua" :
                    newData.ngay_mua_hang = formatDateFromTimestamp(newData.created_at);
                    data = await createDonMuaHang(newData)
                    break;
                case "de-nghi-thanh-toan" :
                    newData.ngay_du_kien_thanh_toan = formatDateFromTimestamp(newData.created_at);
                    data = await createNewDeNghiThanhToan(newData)
                    break;
                case "tam-ung" :
                    data = await createNewTamUng(newData)
                    break;
                case "phieu-chi" :
                    newData.ngay_chi = formatDateFromTimestamp(newData.created_at);
                    data = await createPhieuChi2(newData)
                    break;
                case "phieu-thu" :
                    newData.ngay_thu = formatDateFromTimestamp(newData.created_at);
                    data = await createNewPhieuThu(newData)
                    break;
                case "dieu-chuyen-kho" :
                    newData.ngay = formatDateFromTimestamp(newData.created_at);
                    data = await createNewDieuChuyenKho(newData)
                    break;
                case "nhap-kho" :
                    newData.ngay = formatDateFromTimestamp(newData.created_at);
                    data = await createNewPhieuNhap(newData)
                    break;
                case "xuat-kho" :
                    newData.ngay = formatDateFromTimestamp(newData.created_at);
                    data = await createNewPhieuXuat(newData)
                    break;
            }
            const formattedItem = formatItem(data, option);
            setListData((prevData) => [formattedItem, ...prevData]);

        } catch
            (error) {
            console.error("Error creating card:", error);
            message.error("An error occurred while creating the card. Please try again!", {autoClose: 1000});
        }
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setNewCardName("");
    };

    useEffect(() => {
        setSearchText("");
        setStatus("");
        setTime("");
        setSortCriteria(null);
        setSortOrder("asc")
    }, [option]);

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };

    const handleStatusChange = (e) => {
        setStatus(e.target.value);
    };

    const handleTimeChange = (e) => {
        setTime(e.target.value);
    };


    const handleSort = (criteria, type) => {
        setSortCriteria(criteria);
        setSortOrder(type);
        setIsDropdownOpen(false)
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const [visible, setVisible] = useState(false);

    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };


    const handleOpenViewTable = () => {
        setIsViewTable(true);
    };

    const handleCloseViewTable = () => {
        setIsViewTable(false);

    };


    const handlePhieuGom = (value) => {
        if (value == 'add') {
            setIsOpen(true)
        } else if (value == 'view') {
            setIsViewGomOpen(true)
        }
        setVisible(false);
    };

    const content2 = (
        <Menu className={css.customMenu}>
            <Menu.Item onClick={() => handlePhieuGom("add")}>Thêm phiếu gom</Menu.Item>
            <Menu.Item onClick={() => handlePhieuGom("view")}>Xem phiếu gom</Menu.Item>
        </Menu>
    );

    return (
        <>
            <div className={css.chainContainer}>
                <div className={`${css.listCardContainer} ${isCollapsedCard ? css.isCollapsed : css.unCollapsed}`}>
                    {
                        isCollapsedCard &&
                        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                            <IconButton onClick={() => setIsCollapseCard(false)} size="small">
                                <MenuIcon/>
                            </IconButton>
                            <ActionBookMarkChain headerTitle={chainTemplate2Selected?.data?.selectedTemplate?.name}/>
                        </div>


                    }
                    {
                        !isCollapsedCard && (
                            <>
                                <div className={css.headerContainer}>
                                    <div className={css.headerSalesFlow}>
                                        <div className={css.nameSalesFlow}>
                                            <div style={{display: "flex", gap: '10px', alignItems: "center"}}>
                                                <span>{selectedTemplateName}</span>
                                                <ActionBookMarkChain
                                                    headerTitle={chainTemplate2Selected?.data?.selectedTemplate?.name}/>
                                            </div>

                                        </div>
                                    </div>
                                    <div className={css.buttonContainer}>
                                        <div className={`${css.createCard}`} onClick={() => handleCreateCard()}>
                                            <div style={{display: "flex", gap: '5px', alignItems: "center"}}>
                                                {/*<img src={CreateCardIcon} alt=""/>*/}
                                                <span>Tạo mới</span>
                                            </div>
                                        </div>
                                        <div className={`${css.btnItem}`} onClick={() => handleOpenViewTable()}>
                                            <div style={{display: "flex", gap: '5px', alignItems: "center"}}>
                                                <span>Xem bảng</span>
                                            </div>
                                        </div>
                                        <div className={`${css.btnItem}`}>
                                            <div style={{display: "flex", alignItems: "center"}}>
                                                <Popover
                                                    content={content2}
                                                    trigger="click"
                                                    visible={visible}
                                                    onVisibleChange={(val) => setVisible(val)}
                                                    placement="right"
                                                >
                                                    Phiếu gom
                                                </Popover>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={css.salesFlow}>
                                        <div className={css.searchContainer}>
                                            <div className={css.searchBox}>
                                                <img src={SearchIcon} alt=""/>
                                                <input placeholder="Tìm kiếm"
                                                       value={searchText}
                                                       onChange={handleSearchChange}
                                                />
                                            </div>
                                        </div>
                                        <div className={css.filtersContainer}>
                                            <div className={css.timeFilter}>
                                                <img src={DateIcon} alt=""/>
                                                <select style={{width: "max-content"}} value={time}
                                                        onChange={handleTimeChange}>
                                                    <option value="">Lọc thời gian</option>
                                                    {[...Array(12)].map((_, index) => {
                                                        const month = index + 1;
                                                        return (
                                                            <option key={month} value={month}>
                                                                Tháng {month}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                            <div className={css.iconSvg} ref={dropdownRef}>
                                                {/*<img*/}
                                                {/*    src={EllipsisIcon}*/}
                                                {/*    style={{width: 32, height: 32, cursor: 'pointer'}}*/}
                                                {/*    alt="Ellipsis Icon"*/}
                                                {/*    onClick={handleDropdownToggle}*/}
                                                {/*/>*/}
                                                <span onClick={handleDropdownToggle}>Sắp xếp</span>
                                                {isDropdownOpen && (
                                                    <div className={css.dropdownMenu}>
                                                        <div onClick={() => handleSort("time", 'asc')}>Ngày tăng dần
                                                        </div>
                                                        <div onClick={() => handleSort("time", 'desc')}>Ngày giảm
                                                            dần
                                                        </div>
                                                        <div onClick={() => handleSort("amount", 'asc')}>Tiền tăng
                                                            dần
                                                        </div>
                                                        <div onClick={() => handleSort("amount", 'desc')}>Tiền giảm
                                                            dần
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                <div className={css.listCard}>
                                    <ListCardNew
                                        searchText={searchText}
                                        time={time}
                                        status={status}
                                        sortCriteria={sortCriteria}
                                        sortOrder={sortOrder}
                                        listCards={listData}
                                    />
                                </div>
                            </>
                        )
                    }

                </div>
                <div className={css.cardDetailContainer}>
                    <Outlet/>
                </div>
            </div>

            <Modal
                title="Tạo Mới Card"
                visible={isModalVisible}
                onOk={handleCreateCard}
                onCancel={handleCloseModal}
                okText="Tạo"
                cancelText="Hủy"
            >
                <div>
                    <Input
                        placeholder="Nhập tên Card"
                        value={newCardName}
                        onChange={(e) => setNewCardName(e.target.value)}
                        style={{marginBottom: 10}}
                    />
                </div>
            </Modal>
            <ViewCardTable open={isViewTable} onClose={handleCloseViewTable} listCard={listData}
                           name={selectedTemplateName}/>

            {isOpen && selectedTemplateName === 'Xuất kho' &&
                <PhieuGom isOpen={isOpen} setIsOpen={setIsOpen}></PhieuGom>}
            {isOpen && selectedTemplateName === 'Nhập kho' &&
                <PhieuGomNhap isOpen={isOpen} setIsOpen={setIsOpen}></PhieuGomNhap>}
            {isOpen && selectedTemplateName === 'Hóa đơn' &&
                <PhieuGomHoaDon isOpen={isOpen} setIsOpen={setIsOpen}></PhieuGomHoaDon>}
            {isOpen && selectedTemplateName === 'Phiếu thu / Báo có' &&
                <PhieuGomPhieuThuBaoCo isOpen={isOpen} setIsOpen={setIsOpen}></PhieuGomPhieuThuBaoCo>}

            {isViewGomOpen && selectedTemplateName === 'Xuất kho' &&
                <ViewPhieuGom name={'Xuất kho'} isOpen={isViewGomOpen} setIsOpen={setIsViewGomOpen}/>
            }
            {isViewGomOpen && selectedTemplateName === 'Nhập kho' &&
                <ViewPhieuGom name={'Nhập kho'} isOpen={isViewGomOpen} setIsOpen={setIsViewGomOpen}/>
            }
        </>
    )
}
