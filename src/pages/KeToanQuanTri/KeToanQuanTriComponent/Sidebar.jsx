import React, { useContext, useEffect, useMemo, useState } from 'react';
import List from '@mui/material/List';
import { Button, Col, Dropdown, Divider, Row } from 'antd';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import css from './Sidebar.module.css';
import { useNavigate, useParams } from 'react-router-dom';

import { IconCloseFolder, IconOpenFolder, SearchIcon, SoLieuTongHopIcon } from '../../../icon/IconSVG.js';

import Tooltip from '@mui/material/Tooltip';
import { MyContext } from '../../../MyContext.jsx';
import { getAllCompany } from '../../../apis/companyService.jsx';
import { ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import UpdateOB from '../ActionButton/UpdateOB.jsx';
import { getAllVas } from '../../../apisKTQT/vasService.jsx';
import { getAllKmf } from '../../../apisKTQT/kmfService.jsx';
import { getAllKmns } from '../../../apisKTQT/kmnsService.jsx';
import { getAllUnits } from '../../../apisKTQT/unitService.jsx';
import CrossRoadPopup2 from '../../../components/CrossRoadPopup/CrossRoadPopup2.jsx';
import { getAllProduct } from '../../../apisKTQT/productService.jsx';
import { getItemFromIndexedDB2 } from '../storage/storageService.js';
import { LIST_COMPANY_KEY } from '../../../Consts/LIST_KEYS.js';
import { getAllSoKeToan } from '../../../apisKTQT/soketoanService.jsx';
import KTQTImportComponent from '../popUp/importFIle/KTQTImportComponent.jsx';
import KTQTImportComponentGV from '../popUp/importFIle/KTQTImportComponentGV.jsx';
import styles from '../VanHanh/CaiDatSuDung/InstallPopup.module.css';
import { BackCanvas } from '../../../icon/svg/IconSvg.jsx';

function ensureHQCompany(listCompany) {
    // Kiểm tra xem đã có HQ chưa
    if (!listCompany.some(c => c.code === 'HQ')) {
        return [
            ...listCompany,
            { id: 99999999, name: 'Hợp nhất', code: 'HQ' }
        ];
    }
    return listCompany;
}

export default function Sidebar({ allowedCompanies, permissions , companies }) {
    const navigate = useNavigate();
    const { buSelect, companySelect } = useParams();

    const {
        isCollapsedKTQT,
        setIsCollapsedKTQT,
        currentUser,
        loadDataSoKeToan,
        currentCompanyKTQT,
        setCurrentCompanyKTQT,
        isUpdateNoti,
        currentYearKTQT,
        setCurrentYearKTQT,
        uCSelected_CANVAS,
        listUC_CANVAS
    } = useContext(MyContext);
    const [openTabs, setOpenTabs] = useState({
        'Báo cáo tài chính tổng quát': true,
        'KQKD đơn vị': true,
        'KQKD vụ việc': true,
        'KQKD sản phẩm': true,
        'KQKD kênh': true,
        'Dữ liệu hợp nhất': true,
    });
    const [isMinimized, setIsMinimized] = useState(true);

    const [checkCDPS, setCheckCDPS] = useState([]);
    const [checkDKCDPS, setCheckDKCDPS] = useState([]);
    const [checkKCCDPS, setCheckKCCDPS] = useState([]);
    const [checkCONSOLCDPS, setCheckCONSOLCDPS] = useState([]);
    const [checkCONSOLSKT, setCheckCONSOLSKT] = useState([]);
    const [checkKMFSKT, setCheckKMFSKT] = useState([]);
    const [checkKMTCSKT, setCheckKMTCSKT] = useState([]);
    const [checkGroupKMF, setCheckGroupKMF] = useState([]);
    const [checkGroupKHKMF, setCheckGroupKHKMF] = useState([]);
    const [checkGroupKMNS, setCheckGroupKMNS] = useState([]);
    const [checkGroupUnit, setCheckGroupUnit] = useState([]);
    const [checkGroupKHUnit, setCheckGroupKHUnit] = useState([]);
    const [checkGroupProduct, setCheckGroupProduct] = useState([]);
    const [checkProductUnit, setCheckProductUnit] = useState([]);
    const [checkFolder, setCheckFolder] = useState([]);
    const [visibleFolders, setVisibleFolders] = useState({
        'Báo cáo tài chính tổng quát': true,
        'KQKD sản phẩm': true,
        'KQKD kênh': true,
        'KQKD vụ việc': true,
        'KQKD đơn vị': true,
        'Dữ liệu hợp nhất': true,
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPath, setSelectedPath] = useState(() => {
        return localStorage.getItem('selectedPath') || '/ke-toan-quan-tri/can-doi-phat-sinh';
    });
    const PRE_PATH = `/fdr/`;
    const [loadingCount, setLoadingCount] = useState(true);
    const [loading, setLoading] = useState(true);
    const [isKTQTImportOpen, setIsKTQTImportOpen] = useState(false);
    const [isKTQTImportGVOpen, setIsKTQTImportGVOpen] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };
    const handleOk = () => {
        setIsModalOpen(false);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };
    const handleCancelGV = () => {
        setIsKTQTImportGVOpen(false);
    };
    const handleOkGV = () => {
        setIsKTQTImportGVOpen(false);
    };


    useEffect(() => {
        if (location.pathname === '/ke-toan-quan-tri') {
            setSelectedPath('/ke-toan-quan-tri/can-doi-phat-sinh');
            localStorage.setItem('selectedPath', '/ke-toan-quan-tri/can-doi-phat-sinh');
        }
    }, [location.pathname]);

    const handleClick = (title) => {
        setOpenTabs((prev) => ({
            ...prev,
            [title]: !prev[title],
        }));
    };

    const handleListItemClick = (event, path) => {
        setSelectedPath(path);
        localStorage.setItem('selectedPath', path);
        navigate(path);
    };

    const toggleSidebar = () => {
        setIsCollapsedKTQT(prev => !prev);
    };

    const routes = [
        { label: 'Sổ hợp nhất', path: PRE_PATH + 'so-ke-toan' },
        // { label: "Cân đối phát sinh", path: PRE_PATH + "can-doi-phat-sinh" },
        // { label: 'Sổ kế toán điều chỉnh', path: PRE_PATH + 'so-ke-toan-dc' },
        // { label: 'Review Sổ kế toán', path: PRE_PATH + 'so-ke-toan-rv' },
        // { label: 'Review VAS', path: PRE_PATH + 'vas-rv' },
        { label: 'Doanh thu', path: PRE_PATH + 'dt' },
        { label: 'Giá vốn', path: PRE_PATH + 'gv' },
        { label: 'Chi phí', path: PRE_PATH + 'cf' },
        // { label: 'KTQT Mapping', path: PRE_PATH + 'mapping' },
        // { label: "Báo cáo tài chính", path: PRE_PATH + "bao-cao-tai-chinh" },
        { label: 'Danh mục chung', path: PRE_PATH + 'danh-muc-chung' },
    ];

    const routesCompany = [
        { label: 'Sổ kế toán', path: PRE_PATH + 'so-ke-toan-' },
        // { label: "Cân đối phát sinh", path: PRE_PATH + "can-doi-phat-sinh-" },
        // {label: "Danh mục chung", path: PRE_PATH + "danh-muc-chung-"},
    ];

    const routesPlan = [
        { label: 'Quản lý kế hoạch KQKD', path: PRE_PATH + 'plan-kh-kqkd' },
        { label: 'So sánh KH vs TH', path: PRE_PATH + 'plan-ss-kh-th' },
        { label: 'So sánh TH vs Cùng kỳ', path: PRE_PATH + 'plan-ss-th-ck' },
    ];

    const routesBaoCao = [
        { label: 'Báo cáo Tổng quát', path: PRE_PATH + 'bc-tong-quat' },

        // { label: 'Hệ số tài chính', path: PRE_PATH + 'hstc' },
        // { label: 'Cân đối tài chính', path: PRE_PATH + 'cdtc' },
        // { label: "KQKD Team", path: PRE_PATH + "kqkd-team" },
        // { label: 'Báo cáo tiền', path: PRE_PATH + 'bc-tien' },
    ];

    const routesBaoCaoKQKDKenh = [
        { label: 'KQKD Nhóm Kênh', path: PRE_PATH + 'kqkd-nhom-kenh' },
        { label: 'KQKD Nhóm Kênh theo tháng', path: PRE_PATH + 'kqkd-nhom-kenh-2' },
        { label: 'Sổ phân bổ Kênh', path: PRE_PATH + 'so-phan-bo-kenh' },
        { label: 'Thẻ phân bổ Kênh', path: PRE_PATH + 'the-phan-bo-kenh' },
    ];

    const routesBaoCaoKQKDVuViec = [
        { label: 'KQKD Nhóm Vụ việc', path: PRE_PATH + 'kqkd-nhom-vu-viec' },
        { label: 'KQKD Nhóm Vụ việc theo tháng', path: PRE_PATH + 'kqkd-nhom-vu-viec-2' },
        { label: 'Sổ phân bổ Vụ việc', path: PRE_PATH + 'so-phan-bo-vu-viec' },
        { label: 'Thẻ phân bổ Vụ việc', path: PRE_PATH + 'the-phan-bo-vu-viec' },
    ];

    const routesBaoCaoKQKDDonVi = [
        // { label: 'KQKD Đơn vị', path: PRE_PATH + 'kqkd-dv' },
        // {label: "KQKD Đơn vị theo tháng", path: PRE_PATH + "kqkd-dv2"},
        { label: 'KQKD nhóm Đơn vị', path: PRE_PATH + 'kqkd-nhom-dv' },
        { label: 'KQKD Nhóm Đơn vị theo tháng', path: PRE_PATH + 'kqkd-nhom-dv-thang' },
        { label: 'Sổ phân bổ Đơn vị', path: PRE_PATH + 'so-phan-bo-dv' },
        { label: 'Thẻ phân bổ Đơn vị', path: PRE_PATH + 'the-phan-bo-dv' },
    ];

    const routesBaoCaoKQKDSanPham = [
        { label: 'KQKD Nhóm Sản phẩm', path: PRE_PATH + 'kqkd-nhom-sp' },
        { label: 'KQKD Nhóm Sản phẩm theo tháng', path: PRE_PATH + 'kqkd-nhom-sp-thang' },
        { label: 'Sổ phân bổ Sản phẩm', path: PRE_PATH + 'so-phan-bo-sp' },
        { label: 'Thẻ phân bổ Sản phẩm', path: PRE_PATH + 'the-phan-bo-sp' },
    ];

    const SidebarMenu = ({ icon, title, routes, selectedPath, onItemClick, isOpen, onToggle, searchText }) => {
        // Lọc danh sách theo từ khóa tìm kiếm
        const filteredRoutes = routes.filter(({ label }) =>
            label.toLowerCase().includes(searchText.toLowerCase()),
        );

        // Ẩn Tab nếu không có kết quả
        if (filteredRoutes.length === 0) {
            return null;
        }

        return (
            <List>
                <ListItemButton onClick={onToggle}
                    style={{
                        borderTop: title === 'Dữ liệu hợp nhất' || title === 'Báo cáo tài chính tổng quát' ? '1px solid rgb(217, 217, 217)' : '',
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                    className={css.listItemButton}
                >

                    {/*<img src={icon} className={css.tabsIcon} alt="" />*/}
                    <Tooltip title={title}>
                        <ListItemText
                            primary={title}
                            primaryTypographyProps={{ noWrap: true, style: { fontWeight: 'bold', fontSize: '19px', color: '#262626' } }}
                            className={`${css.menuText} ${css.menuTextBold}`}
                        />
                    </Tooltip>
                    <img src={isOpen ? IconOpenFolder : IconCloseFolder} alt="" />
                </ListItemButton>
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {filteredRoutes.map(({ label, path }) => (
                            <Tooltip key={path} title={label}>
                                <ListItemButton
                                    sx={{
                                        pl: 3,
                                        // borderRadius: '8px',
                                        // margin: '10px 8px',
                                        // backgroundColor: selectedPath === path ? '#e1efef' : '#ffffff',
                                        // border: '1px solid #DADADA',
                                        // boxShadow: '0px 0px 5px 0px rgba(0,0,0,0.1)',

                                    }}
                                    onClick={(event) => onItemClick(event, path)}
                                    className={css.listItemButton}
                                >
                                    {/*<img src={IconSheet} className={css.tabsIcon} alt=""/>*/}

                                    <ListItemText
                                        primary={label}
                                        primaryTypographyProps={{ noWrap: true, style: { fontWeight: selectedPath === path ? 'bold' : 'normal' } }}
                                        className={css.menuText}
                                    />
                                </ListItemButton>
                            </Tooltip>
                        ))}
                    </List>
                </Collapse>
            </List>
        );
    };

    const [searchText, setSearchText] = useState('');

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };

    const goToStep = (e, step, sStep) => {
        navigate(`/fdr`);
        setIsMinimized(false);
        setCompany(e.company);
        setYearCDSD(e.year);
        setActiveStep(step);
        setSubStep(sStep);
    };

    const [searchTerm, setSearchTerm] = useState('');


    const items1 = useMemo(() => {
        const filteredItems = [

            ...(checkDKCDPS.length > 0
                ? checkDKCDPS.map((item, index) => ({
                    key: `${item.company}_${item.year}_DKCDPS`,
                    year: item.year,
                    value: item.title,
                    label: (
                        <div onClick={() => goToStep(item, 3, 0)}>
                            <span>{item.title}</span>
                        </div>
                    ),
                }))
                : []),
            ...(checkCDPS.length > 0
                ? checkCDPS.map((item, index) => ({
                    key: `${item.company}_${item.year}_${item.month}_CDPS`,
                    year: item.year,
                    value: item.title,
                    label: (
                        <div onClick={() => goToStep(item, 3, 0)}>
                            <span>{item.title}</span>
                        </div>
                    ),
                }))
                : []),
            ...(checkKCCDPS && checkKCCDPS.length > 0) ?
                checkKCCDPS.map((item, index) => (
                    {
                        key: `${item.company}_${item.year}_KCCDPS`,
                        year: item.year,
                        value: `Có ${item.count} bản ghi chưa điền mã kết chuyển năm ${item.year} - công ty ${item.company}`,
                        label: (<div onClick={() => goToStep(item, 3, 1)}>
                            <span>{`Có ${item.count} bản ghi chưa điền mã kết chuyển năm ${item.year} - công ty ${item.company}`}</span>
                        </div>),
                    })) : [],
            ...(checkCONSOLCDPS && checkCONSOLCDPS.length > 0) ?
                checkCONSOLCDPS.map((item, index) => (
                    {
                        key: `${item.company}_${item.year}_CONSOLCDPS`,
                        year: item.year,
                        value: `Có ${item.count} bản ghi cân đối phát sinh chưa điền CONSOL năm ${item.year} - công ty ${item.company}`,
                        label: (<div onClick={() => goToStep(item, 3, 0)}>
                            <span>{`Có ${item.count} bản ghi cân đối phát sinh chưa điền CONSOL năm ${item.year} - công ty ${item.company}`}</span>
                        </div>),
                    })) : [],
            ...(checkCONSOLSKT && checkCONSOLSKT.length > 0) ?
                checkCONSOLSKT.map((item, index) => (
                    {
                        key: `${item.company}_${item.year}_CONSOLSKT`,
                        year: item.year,
                        value: `Có ${item.count} bản ghi sổ kế toán chưa điền CONSOL năm ${item.year} - công ty ${item.company}`,
                        label: (<div onClick={() => {
                            setCurrentYearKTQT(item.year);
                            // navigate(`/canvas/${buSelect}/${companySelect}/ke-toan-quan-tri/so-ke-toan-${item.company}`);

                        }
                        }>
                            <span>{`Có ${item.count} bản ghi sổ kế toán chưa điền CONSOL năm ${item.year} - công ty ${item.company}`}</span>
                        </div>),
                    })) : [],
            ...(checkKMFSKT && checkKMFSKT.length > 0) ?
                checkKMFSKT.map((item, index) => (
                    {
                        key: `${item.company}_${item.year}_checkKMFSKT`,
                        year: item.year,
                        value: `Có ${item.count} bản ghi sổ kế toán chưa điền KMF năm ${item.year} - công ty ${item.company}`,
                        label: (<div onClick={() => {
                            setCurrentYearKTQT(item.year);
                            // navigate(`/canvas/${buSelect}/${companySelect}/ke-toan-quan-tri/so-ke-toan-${item.company}`);

                        }
                        }>
                            <span>{`Có ${item.count} bản ghi sổ kế toán chưa điền KMF năm ${item.year} - công ty ${item.company}`}</span>
                        </div>),
                    })) : [],
            ...(checkKMTCSKT && checkKMTCSKT.length > 0) ?
                checkKMTCSKT.map((item, index) => (
                    {
                        key: `${item.company}_${item.year}_checkKMTCSKT`,
                        year: item.year,
                        value: `Có ${item.count} bản ghi sổ kế toán chưa điền KMTC năm ${item.year} - công ty ${item.company}`,
                        label: (<div onClick={() => {
                            setCurrentYearKTQT(item.year);
                            //  navigate(`/canvas/${buSelect}/${companySelect}/ke-toan-quan-tri/so-ke-toan-${item.company}`);

                        }
                        }>
                            <span>{`Có ${item.count} bản ghi sổ kế toán chưa điền KMTC năm ${item.year} - công ty ${item.company}`}</span>
                        </div>),
                    })) : [],
            ...(checkGroupKMF && checkGroupKMF.length > 0) ?
                checkGroupKMF.map((item, index) => (
                    {
                        key: `${item.company}_checkGroupKMF_${index}`,
                        year: item.year,
                        value: `Có ${item.count} bản ghi khoản mục KQKD chưa điền nhóm KQKD - công ty ${item.company}`,
                        label: (<div onClick={() => {
                            goToStep(item, 6, 0);
                        }}>
                            <span>{`Có ${item.count} bản ghi khoản mục KQKD chưa điền nhóm KQKD - công ty ${item.company}`}</span>
                        </div>),
                    })) : [],

            // ...(checkGroupKHKMF && checkGroupKHKMF.length > 0) ?
            //     checkGroupKHKMF.map((item, index) => (
            //         {
            //             key: `${item.company}_checkGroupKHKMF_${index}`,
            //             year: item.year,
            //             value: `Có ${item.count} bản ghi khoản mục KQKD chưa điền nhóm kế hoạch KQKD - công ty ${item.company}`,
            //             label: (<div onClick={() => {
            //                 goToStep(item, 6, 0);
            //             }}>
            //                 <span>{`Có ${item.count} bản ghi khoản mục KQKD chưa điền nhóm kế hoạch KQKD - công ty ${item.company}`}</span>
            //             </div>),
            //         })) : [],

            ...(checkGroupKMNS && checkGroupKMNS.length > 0) ?
                checkGroupKMNS.map((item, index) => (
                    {
                        key: `${item.company}_checkGroupKMNS`,
                        year: item.year,
                        value: `Có ${item.count} bản ghi khoản mục thu chi chưa điền nhóm báo cáo - công ty ${item.company}`,
                        label: (<div onClick={() => {
                            goToStep(item, 6, 1);
                        }}>
                            <span>{`Có ${item.count} bản ghi khoản mục thu chi chưa điền nhóm báo cáo - công ty ${item.company}`}</span>
                        </div>),
                    })) : [],

            ...(checkGroupUnit && checkGroupUnit.length > 0) ?
                checkGroupUnit.map((item, index) => (
                    {
                        key: `${item.company}_checkGroupUnit`,
                        year: item.year,
                        value: `Có ${item.count} bản ghi đơn vị chưa điền nhóm báo cáo - công ty ${item.company}`,
                        label: (<div onClick={() => {
                            goToStep(item, 6, 4);
                        }}>
                            <span>{`Có ${item.count} bản ghi đơn vị chưa điền nhóm báo cáo - công ty ${item.company}`}</span>
                        </div>),
                    })) : [],

            // ...(checkGroupKHUnit && checkGroupKHUnit.length > 0) ?
            //     checkGroupKHUnit.map((item, index) => (
            //         {
            //             key: `${item.company}_checkGroupKHUnit`,
            //             year: item.year,
            //             value: `Có ${item.count} bản ghi đơn vị chưa điền nhóm kế hoạch - công ty ${item.company}`,
            //             label: (<div onClick={() => {
            //                 goToStep(item, 6, 4);
            //             }}>
            //                 <span>{`Có ${item.count} bản ghi đơn vị chưa điền nhóm kế hoạch - công ty ${item.company}`}</span>
            //             </div>),
            //         })) : [],

            ...(checkGroupProduct && checkGroupProduct.length > 0) ?
                checkGroupProduct.map((item, index) => (
                    {
                        key: `${item.company}_checkGroupProduct`,
                        year: item.year,
                        value: `Có ${item.count} bản ghi sản phẩm chưa điền nhóm báo cáo - công ty ${item.company}`,
                        label: (<div onClick={() => {
                            goToStep(item, 6, 2);
                        }}>
                            <span>{`Có ${item.count} bản ghi sản phẩm chưa điền nhóm báo cáo - công ty ${item.company}`}</span>
                        </div>),
                    })) : [],

            ...(checkProductUnit && checkProductUnit.length > 0) ?
                checkProductUnit.map((item, index) => (
                    {
                        key: `${item.company}_checkProductUnit`,
                        year: item.year,
                        value: `Có ${item.count} bản ghi sản phẩm chưa điền đơn vị - công ty ${item.company}`,
                        label: (<div onClick={() => {
                            goToStep(item, 6, 2);
                        }}>
                            <span>{`Có ${item.count} bản ghi sản phẩm chưa điền đơn vị - công ty ${item.company}`}</span>
                        </div>),
                    })) : [],
        ];
        const filteredResults = filteredItems.filter((item) => item.value.toString().toLowerCase().includes(searchTerm.trim().toLowerCase()));
        return filteredResults;
    }, [checkDKCDPS, checkCDPS, checkCONSOLSKT, checkCONSOLCDPS, checkKCCDPS, checkGroupKMF, checkGroupKHKMF, checkGroupKMNS, checkGroupUnit, checkKMFSKT, checkKMTCSKT, checkGroupProduct, checkProductUnit, isUpdateNoti, searchTerm]);


    const listNotification = items1.length > 0 ? items1 : [{
        key: 'no-data',
        label: (
            <div style={{
                textAlign: 'center',
                padding: '10px 0',
                color: '#999',
                fontStyle: 'italic',
            }}>
                Không có chú ý nào của {searchTerm}
            </div>
        ),
    }];


    async function checkStatus() {
        let companies = await getItemFromIndexedDB2(LIST_COMPANY_KEY);
        if (!companies || companies.length === 0) {
            companies = await getAllCompany();
        }
        await getAllSoKeToan().then(soketoan => {
            let resultSKTCONSOL = [];
            let notKmf = [];
            let notKmns = [];
            for (const company1 of companies) {

                // Lọc ra dữ liệu của công ty hiện tại
                const companyData = soketoan.filter(item => item.company === company1.code);

                if (companyData.length > 0) {
                    // Nhóm dữ liệu theo năm
                    const groupByYear = {};
                    for (const item of companyData) {
                        const year = item.year;
                        if (!groupByYear[year]) {
                            groupByYear[year] = [];
                        }
                        groupByYear[year].push(item);
                    }

                    // Tính tổng cho từng năm
                    for (const [year, items] of Object.entries(groupByYear)) {
                        let countSKTCONSOL = 0;
                        let countKMFSKT = 0;
                        let countKMNSSKT = 0;
                        for (const item of items) {
                            if (!item.consol || item.consol === '') {
                                countSKTCONSOL++;
                            }
                            if (item.pl_value && item.pl_value != 0 && (!item.kmf || item.kmf === '')) {
                                countKMFSKT++;
                            }
                            if (item.cash_value && item.cash_value != 0 && (!item.kmns || item.kmns === '')) {
                                countKMNSSKT++;
                            }
                        }

                        if (countSKTCONSOL > 0) {
                            resultSKTCONSOL.push({ company: company1.code, year: year, count: countSKTCONSOL });
                        }
                        if (countKMFSKT > 0) {
                            notKmf.push({ company: company1.code, year: year, count: countKMFSKT });
                        }
                        if (countKMNSSKT > 0) {
                            notKmns.push({ company: company1.code, year: year, count: countKMNSSKT });
                        }
                    }


                    setCheckCONSOLSKT(resultSKTCONSOL);
                    setCheckKMFSKT(notKmf);
                    setCheckKMTCSKT(notKmns);

                }

            }
        });

        await getAllVas().then((data) => {
            let filteredData = data
                .sort((a, b) => {
                    const aKey = a.ma_tai_khoan?.trim()?.slice(0, 3);
                    const bKey = b.ma_tai_khoan?.trim()?.slice(0, 3);
                    return aKey?.localeCompare(bKey);
                })
                .filter((e) => e.consol?.toLowerCase() === 'consol');

            const resultDK = [];
            const resultMonth = [];
            let resultKC = [];
            let resultCDPSCONSOL = [];


            setCheckKCCDPS(resultKC);
            // Duyệt qua từng công ty
            for (const company1 of companies) {

                // Lọc ra dữ liệu của công ty hiện tại
                const companyData = filteredData.filter(item => item.company === company1.code);
                if (companyData.length > 0) {
                    // Nhóm dữ liệu theo năm
                    const groupByYear = {};
                    for (const item of companyData) {
                        const year = item.year;
                        if (!groupByYear[year]) {
                            groupByYear[year] = [];
                        }
                        groupByYear[year].push(item);
                    }

                    // Tính tổng cho từng năm
                    for (const [year, items] of Object.entries(groupByYear)) {
                        let count = 0;
                        let countCONSOL = 0;
                        const total = {
                            company: company1.code,
                            year,
                            t1_open_net: 0,
                            t1_ending_net: 0,
                            t2_ending_net: 0,
                            t3_ending_net: 0,
                            t4_ending_net: 0,
                            t5_ending_net: 0,
                            t6_ending_net: 0,
                            t7_ending_net: 0,
                            t8_ending_net: 0,
                            t9_ending_net: 0,
                            t10_ending_net: 0,
                            t11_ending_net: 0,
                            t12_ending_net: 0,
                        };
                        const keyOpenNet = `t1_open_net`;
                        // Duyệt qua từng bản ghi của năm đó
                        for (const item of items) {
                            if (!item.kc_co && !item.kc_no && !item.kc_net && !item.kc_net2) {
                                count++;
                            }
                            if (!item.consol || item.consol === '') {
                                countCONSOL++;
                            }
                            total[keyOpenNet] += parseFloat(item[keyOpenNet]) || 0;

                            for (let i = 1; i <= 12; i++) {

                                const keyTotal = `t${i}_ending_net`;
                                const keyTx = `tx_${i}_ending_net`;
                                // Cộng dồn vào total nếu có số liệu
                                total[keyTotal] += parseFloat(item[keyTotal]) || 0;
                                total[keyOpenNet] += parseFloat(item[keyOpenNet]) || 0;

                                // Nếu tx_ending_net vượt quá 10.000 thì log thông báo lỗi
                                const txValue = parseFloat(item[keyTx]) || 0;
                                if (Math.abs(txValue) > 10000) {
                                    resultMonth.push({
                                        company: company1.code,
                                        year: year,
                                        month: i,
                                        title: `Cân đối phát sinh lệch quá 10.000 VNĐ tại tháng ${i} của năm ${year} công ty ${company.code} (Lỗi: Cân đối phát sinh lệch)`,
                                    });
                                }
                            }
                        }
                        if (count > 0) {
                            resultKC.push({ company: company1.code, year: year, count: count++ });
                        }
                        if (countCONSOL > 0) {
                            resultCDPSCONSOL.push({ company: company1.code, year: year, count: countCONSOL++ });
                        }
                        if (Math.abs(total[keyOpenNet]) > 10000) {
                            resultDK.push({
                                company: company1.code,
                                year: year,
                                title: `Đầu kỳ của năm ${year} - công ty ${company.code} (Lỗi: Cân đối phát sinh lệch đầu kỳ)`,
                            });
                        }


                    }
                }
            }
            setCheckDKCDPS(resultDK);
            setCheckCDPS(resultMonth);
            setCheckKCCDPS(resultKC);
            setCheckCONSOLCDPS(resultCDPSCONSOL);
        });

        const kmfs = await getAllKmf();
        let resultNhomKQKD = [];
        let resultNhomKHKQKD = [];

        for (const company1 of companies) {
            const companyData = kmfs.filter(item => item.company === company1.code);
            if (companyData.length > 0) {
                let countNhomKQKD = 0;
                let countNhomKHKQKD = 0;
                for (const item of companyData) {
                    if (!item.code || item.code === '') {
                        countNhomKQKD++;
                    }
                    if (!item.group || item.group === '') {
                        countNhomKHKQKD++;
                    }

                }
                if (countNhomKQKD > 0) {
                    resultNhomKQKD.push({ company: company1.code, count: countNhomKQKD, year: currentYearKTQT });
                }
                if (countNhomKHKQKD > 0) {
                    resultNhomKHKQKD.push({ company: company1.code, count: countNhomKHKQKD, year: currentYearKTQT });
                }
            }

            setCheckGroupKMF(resultNhomKQKD);
            setCheckGroupKHKMF(resultNhomKHKQKD);

        }


        const kmns = await getAllKmns();
        let resultNhomKMNS = [];

        for (const company1 of companies) {
            const companyData = kmns.filter(item => item.company === company1.code);
            if (companyData.length > 0) {
                let countNhomKMNS = 0; // reset count cho từng công ty
                for (const item of companyData) {
                    if (!item.mo_ta || item.mo_ta === '') {
                        countNhomKMNS++;
                    }
                }
                if (countNhomKMNS > 0) {
                    resultNhomKMNS.push({ company: company1.code, count: countNhomKMNS, year: currentYearKTQT });
                }
            }
        }
        setCheckGroupKMNS(resultNhomKMNS);

        const units = await getAllUnits();
        let resultNhomUnit = [];
        let resultNhomKHUnit = [];

        for (const company1 of companies) {
            const companyData = units.filter(item => item.company === company1.code);
            if (companyData.length > 0) {
                let countNhomUnit = 0; // reset count cho từng công ty
                let countNhomKHUnit = 0; // reset count cho từng công ty
                for (const item of companyData) {
                    if (!item.group || item.group === '') {
                        countNhomUnit++;
                    }
                    if (!item.groupKH || item.groupKH === '') {
                        countNhomKHUnit++;
                    }
                }
                if (countNhomUnit > 0) {
                    resultNhomUnit.push({ company: company1.code, count: countNhomUnit, year: currentYearKTQT });
                }
                if (countNhomKHUnit > 0) {
                    resultNhomKHUnit.push({ company: company1.code, count: countNhomKHUnit, year: currentYearKTQT });
                }
            }
        }
        setCheckGroupUnit(resultNhomUnit);
        setCheckGroupKHUnit(resultNhomKHUnit);


        const products = await getAllProduct();
        let resultNhomProduct = [];
        let resultProductUnit = [];

        for (const company1 of companies) {
            const companyData = products.filter(item => item.company === company1.code);
            if (companyData.length > 0) {
                let countNhomProduct = 0; // reset count cho từng công ty
                let countProductUnit = 0; // reset count cho từng công ty
                for (const item of companyData) {
                    if (!item.group || item.group === '') {
                        countNhomProduct++;
                    }
                    if (!item.unit_code || item.unit_code === '') {
                        countProductUnit++;
                    }
                }
                if (countNhomProduct > 0) {
                    resultNhomProduct.push({ company: company1.code, count: countNhomProduct });
                }
                if (countProductUnit > 0) {
                    resultProductUnit.push({ company: company1.code, count: countProductUnit });
                }
            }
        }
        setCheckGroupProduct(resultNhomProduct);
        setCheckProductUnit(resultProductUnit);

    }

    useEffect(() => {
        checkStatus();
    }, [isUpdateNoti]);

    const [listCompanyToShow, setListCompanyToShow] = useState([]);

     useEffect(() => {
        if (allowedCompanies && allowedCompanies.length > 0) setListCompanyToShow(allowedCompanies);
        else setListCompanyToShow(ensureHQCompany(companies || []));
    }, [allowedCompanies, companies]);

    return (
        <>
            {/*{loading && <LoadingAll/>}*/}
            {!isCollapsedKTQT && (
                <div className={css.sidebar}
                >
                    {/* <div className={css.header}>
                        <div className={css.headerFunction}>

                            <div className={css.changeMode}>

                                <img src={AppIcon} alt="" width={30}/>
                                <img src="/App%20switcher.svg" alt="" width={25}/>
                                <div className={css.backCanvas}
                                    onClick={() =>
                                        navigate('/canvas')
                                        // (window.location.href = `${import.meta.env.VITE_DOMAIN_URL}/canvas`)
                                    }
                                >
                                    <div>
                                        <BackCanvas height={20} width={20} />
                                    </div>
                                    <span style={{
                                        color: '#262626',
                                        fontWeight: 'bold',
                                        fontSize: '19px'
                                    }}>Phân bổ & Hợp nhất BCTC</span>
                                </div>
                                <div className={css.buttonMode}>
                                    <div className={css.buttonModeRight}>
                                        <ProfileSelect />
                                        <YearSelectKTQT />
                                    </div>


                                </div>

                            </div>


                        </div>
                        <div className={css.headerTitle}>
                           <img src={DatasheetIcon} alt="" style={{width: 25, height: 25}}/>
                           <span>Financial Simulation Sandbox</span>
                        </div>
                    </div> */}
                    {/*{permission ?*/}
                    <>
                        <div className={css.kyChot}>
                            {/*<div style={{ display: "flex", }}>*/}
                            {/*<MonthSelect />*/}
                            {/*</div>*/}
                            {/*<Tooltip title="Cập nhật">*/}
                            {/*    <img*/}
                            {/*        onClick={handleUpdate}*/}
                            {/*        className={`${isSyncing ? css.spinning2 : ''} ${css.IoIosArrowDropleft}`}*/}
                            {/*        src={RefIcon}*/}
                            {/*        alt="Arrow Back Icon"*/}
                            {/*        width="25"*/}
                            {/*        height="25"*/}
                            {/*    />*/}
                            {/*</Tooltip>*/}
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'start',
                            gap: '5px',
                            marginTop: '5px',
                            padding: '0 5px',
                        }}>
                            <div style={{
                                display: 'flex',
                                width: '48%',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}>
                                <div className={css.searchBox}>
                                    <div className={css.buttonSearch}>
                                        <img src={SearchIcon} alt="" />
                                        <input
                                            type="text"
                                            className={css.quickFilterInput}
                                            value={searchText}
                                            placeholder="Tìm kiếm"
                                            onChange={handleSearchChange}
                                        />
                                    </div>
                                </div>
                                {(items1.length > 0 || searchTerm !== '') &&
                                    <Dropdown
                                        menu={{
                                            items: [{
                                                key: 'search-bar',
                                                label: (
                                                    <input
                                                        type="text"
                                                        placeholder="Tìm kiếm ..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{
                                                            width: '100%',
                                                            padding: '5px 10px',
                                                            marginBottom: '10px',
                                                            border: '1px solid #ccc',
                                                            borderRadius: '4px',
                                                        }}
                                                    />
                                                ),
                                            }, ...listNotification],
                                        }}
                                    >
                                        <Button variant={'filled'} className={css.bell}
                                        >
                                            <span style={{ color: '#ffffff' }}>Điểm cần lưu ý</span></Button>
                                    </Dropdown>
                                }
                                <UpdateOB />
                                <Tooltip title="Thu gọn">
                                    <IconButton onClick={toggleSidebar} size="small">
                                        <ChevronLeftIcon />
                                    </IconButton>
                                </Tooltip>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 5px', width: '100%', flexWrap: 'wrap' }}>

                            {listCompanyToShow.map(item => (
                                <Button
                                    key={item.code || item.id || item.name}
                                    type={item.code == currentCompanyKTQT ? "primary" : "default"}
                                    onClick={() => setCurrentCompanyKTQT(item.code)}
                                    style={{
                                        width: 'fit-content',
                                        backgroundColor: item.code == currentCompanyKTQT ? '#1C6EBB' : '#fff',
                                        borderColor: item.code == currentCompanyKTQT ? '#1C6EBB' : '#DADADA',
                                    }}
                                >
                                    <p style={{
                                        // fontWeight: item.code == currentCompanyKTQT ? 'bold' : 'normal',
                                        color: item.code == currentCompanyKTQT ? '#fff' : '#262626',
                                    }}>{item.name}</p>
                                </Button>
                            ))}

                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', padding: '0 4px' }}>
                            {currentCompanyKTQT !== 'HQ' &&
                                <Button
                                    style={{
                                        width: '100%',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '5px',
                                        borderRadius: '8px',
                                        backgroundColor: '#ed6e4e',
                                        border: '1px solid #DADADA',
                                        boxShadow: '0px 0px 5px 0px rgba(0,0,0,0.1)',
                                    }}
                                    onClick={() => handleListItemClick(null, PRE_PATH + 'chay-du-lieu')}
                                >

                                    <p style={{ color: '#ffffff', fontWeight: 'bold' }}>Thực hiện luồng xử lý</p>
                                </Button>
                            }
                        </div>


                        <div className={css.tabs}>
                            {/*{visibleFolders?.["Quản lý kế hoạch KQKD"] && (*/}
                            {/*    <SidebarMenu*/}
                            {/*        icon={SoLieuTongHopIcon}*/}
                            {/*        title="Quản lý kế hoạch KQKD"*/}
                            {/*        routes={routesPlan}*/}
                            {/*        selectedPath={selectedPath}*/}
                            {/*        onItemClick={handleListItemClick}*/}
                            {/*        isOpen={openTabs?.["Quản lý kế hoạch KQKD"] ?? false}*/}
                            {/*        onToggle={() => handleClick("Quản lý kế hoạch KQKD")}*/}
                            {/*        searchText={searchText}*/}
                            {/*    />*/}
                            {/*)}*/}

                            {visibleFolders?.['Báo cáo tài chính tổng quát'] && (
                                <SidebarMenu
                                    icon={SoLieuTongHopIcon}
                                    title="Báo cáo tài chính tổng quát"
                                    routes={routesBaoCao}
                                    selectedPath={selectedPath}
                                    onItemClick={handleListItemClick}
                                    isOpen={openTabs?.['Báo cáo tài chính tổng quát']}
                                    onToggle={() => handleClick('Báo cáo tài chính tổng quát')}
                                    searchText={searchText}
                                />
                            )}

                            {visibleFolders?.['KQKD đơn vị'] && (
                                <SidebarMenu
                                    icon={SoLieuTongHopIcon}
                                    title="KQKD đơn vị"
                                    routes={routesBaoCaoKQKDDonVi}
                                    selectedPath={selectedPath}
                                    onItemClick={handleListItemClick}
                                    isOpen={openTabs?.['KQKD đơn vị']}
                                    onToggle={() => handleClick('KQKD đơn vị')}
                                    searchText={searchText}
                                />
                            )}

                            {visibleFolders?.['KQKD vụ việc'] && (
                                <SidebarMenu
                                    icon={SoLieuTongHopIcon}
                                    title="KQKD vụ việc"
                                    routes={routesBaoCaoKQKDVuViec}
                                    selectedPath={selectedPath}
                                    onItemClick={handleListItemClick}
                                    isOpen={openTabs?.['KQKD vụ việc']}
                                    onToggle={() => handleClick('KQKD vụ việc')}
                                    searchText={searchText}
                                />
                            )}

                            {visibleFolders?.['KQKD sản phẩm'] && (
                                <SidebarMenu
                                    icon={SoLieuTongHopIcon}
                                    title="KQKD sản phẩm"
                                    routes={routesBaoCaoKQKDSanPham}
                                    selectedPath={selectedPath}
                                    onItemClick={handleListItemClick}
                                    isOpen={openTabs?.['KQKD sản phẩm']}
                                    onToggle={() => handleClick('KQKD sản phẩm')}
                                    searchText={searchText}
                                />
                            )}

                            {visibleFolders?.['KQKD kênh'] && (
                                <SidebarMenu
                                    icon={SoLieuTongHopIcon}
                                    title="KQKD kênh"
                                    routes={routesBaoCaoKQKDKenh}
                                    selectedPath={selectedPath}
                                    onItemClick={handleListItemClick}
                                    isOpen={openTabs?.['KQKD kênh']}
                                    onToggle={() => handleClick('KQKD kênh')}
                                    searchText={searchText}
                                />
                            )}

                            {visibleFolders?.['Dữ liệu hợp nhất'] && (
                                <SidebarMenu
                                    icon={SoLieuTongHopIcon}
                                    title="Dữ liệu"
                                    routes={routes}
                                    selectedPath={selectedPath}
                                    onItemClick={handleListItemClick}
                                    isOpen={openTabs?.['Dữ liệu hợp nhất']}
                                    onToggle={() => handleClick('Dữ liệu hợp nhất')}
                                    searchText={searchText}
                                />
                            )}

                            {/*{companies.map(company =>*/}
                            {/*    visibleFolders?.[company.name] && (*/}
                            {/*        <SidebarMenu*/}
                            {/*            key={company.name}*/}
                            {/*            icon={SoLieuTongHopIcon}*/}
                            {/*            title={company.name}*/}
                            {/*            routes={routesCompany.map(route => ({*/}
                            {/*                ...route,*/}
                            {/*                path: `${route.path}${company.code}`,*/}
                            {/*            }))}*/}
                            {/*            selectedPath={selectedPath}*/}
                            {/*            onItemClick={handleListItemClick}*/}
                            {/*            isOpen={openTabs?.[company.name]}*/}
                            {/*            onToggle={() => handleClick(company.name)}*/}
                            {/*            searchText={searchText}*/}
                            {/*        />*/}
                            {/*    ),*/}
                            {/*)}*/}

                        </div>

                    </>
                    {/*    :*/}
                    {/*    <div></div>*/}
                    {/*}*/}


                </div>
            )}
            {isCollapsedKTQT && (
                <div className={css.buttonCollapseWrap} onClick={toggleSidebar}>
                    <IconButton size="small">
                        <ChevronRightIcon />
                    </IconButton>
                </div>
            )}
            {/*{permissionEdit &&*/}
            <>
                {/* <button
                    className={styles.minimizedButton}
                    onClick={() => setIsMinimized(false)}
                    title={'Cài đặt - Sử dụng'}
                    style={{ zIndex: 10000 }}
                >
                    <SettingOutlined />
                </button> */}

                {/* <button
                    className={styles.importButton1}
                    onClick={() => {
                        setIsKTQTImportOpen(true);
                    }}
                    title={'Import dữ liệu'}
                    style={{ zIndex: 10000 }}
                >
                    <SettingOutlined />
                </button> */}

                {/*<button*/}
                {/*    className={styles.minimizedButton2}*/}
                {/*    onClick={name => {*/}
                {/*        localStorage.clear();*/}
                {/*        window.location.reload();*/}
                {/*        indexedDB.deleteDatabase('my-database');*/}
                {/*        indexedDB.deleteDatabase('SoKeToanDB');*/}
                {/*    }}*/}
                {/*    title={'Xóa bộ nhớ đệm'}*/}
                {/*    style={{ zIndex: 10000 }}*/}
                {/*>*/}
                {/*    <ReloadOutlined />*/}
                {/*</button>*/}
            </>
            {/*}*/}
            <CrossRoadPopup2
                openCrossRoad={isModalOpen}
                onOkCrossRoad={handleOk}
                onCancelCrossRoad={handleCancel}
                onCancelCrossRoadGV={handleCancelGV}
                onOkCrossRoadGV={handleOkGV}
            />
            <KTQTImportComponent
                open={isKTQTImportOpen}
                onClose={() => setIsKTQTImportOpen(false)}
                onSuccess={() => setIsKTQTImportOpen(false)}
            />
            <KTQTImportComponentGV
                open={isKTQTImportGVOpen}
                onClose={() => setIsKTQTImportGVOpen(false)}
                onSuccess={() => setIsKTQTImportGVOpen(false)}
            />
        </>
    );
};



