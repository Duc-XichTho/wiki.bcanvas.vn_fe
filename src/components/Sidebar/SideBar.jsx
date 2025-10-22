import React, { useContext, useEffect, useState } from 'react';
import {Button, Menu} from 'antd';
import {
    BaoCaoIcon,
    ChuoiNghiepVu,
    CollapseAllMenuSideBar,
    DanhMucDuLieu,
    DuLieuKhacIconSideBar,
    HoaDonIcon,
    LenhSanXuat,
    PinSideBarIcon,
    SearchIcon,
    SoLieuIcon,
    UnPinSideBarIcon
} from "../../icon/IconSVG.js";
import { getAllChain, getAllChainTemplateStepSubStep } from "../../apis/chainService.jsx";
import css from "./Sidebar.module.css";
import { IconButton } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { useLocation, useNavigate } from "react-router-dom";
import CreateQuickMenu from "../../pages/Home/formCreate/CreateQuickMenu.jsx";
import { MyContext } from "../../MyContext.jsx";
import { HOA_DON_LIST } from "../../Consts/HOA_DON_LIST.js";
import { BAO_CAO_LIST } from "../../Consts/BAO_CAO_LIST.js";
import { SO_LIEU_LIST } from "../../Consts/SO_LIEU_LIST.js";
import { DANH_MUC_KHAC } from "../../Consts/DANH_MUC_KHAC.js";
import { SAN_XUAT_LIST } from '../../Consts/SAN_XUAT_LIST.js';
import { DANH_MUC_HOAT_DONG } from "../../Consts/DANH_MUC_HOAT_DONG.js";
import { DU_LIEU_KHAC } from "../../Consts/DU_LIEU_KHAC.js";
import { useParams } from 'react-router-dom';
import {getAllWarningSAB} from "../../apis/smartWarmingSABService.jsx";

export default function SideBar({ isCollapsed, onToggle, togglePinSidebar, isPinSideBar }) {
    const { id, idTemp } = useParams()
    const [listChainFull, setListChainFull] = useState([])
    const [listChain, setListChain] = useState([]);

    const [openKeys, setOpenKeys] = useState([]);
    const [selectedKey, setSelectedKey] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    const [searchText, setSearchText] = useState("");
    const [open, setOpen] = useState(false);
    const { setLoadData, loadData, chainTemplate2Selected, setChainTemplate2Selected } = useContext(MyContext)

    const handleClose = () => setOpen(false);
    const handleOpen = () => setOpen(true);

    const fetchData = async () => {
        try {
            const dataFull = await getAllChainTemplateStepSubStep();
            setListChainFull(dataFull.result)
        } catch (error) {
            console.error("Error fetching card data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [chainTemplate2Selected?.data?.selectedTemplate?.id]);

    const items = [
        ...listChainFull.map((item) => ({
            key: `chain2-${item.id}`,
            icon: <img src={ChuoiNghiepVu} alt="Chuoi Nghiep Vu" />,
            label: `${item.name}`,
            children: item.templates.map(template => ({
                key: template.id,
                label: template.name,
            })),
            mode: 'inline'
        })),
        {
            key: 'sanxuat',
            icon: <img src={LenhSanXuat} alt="LenhSanXuat" />,
            label: "Sản xuất - cung ứng",
            children: SAN_XUAT_LIST,
            mode: 'vertical'
        },
        {
            key: 'solieu',
            icon: <img src={SoLieuIcon} alt="SoLieuIcon" />,
            label: 'Báo cáo tổng hợp',
            children: SO_LIEU_LIST,
            mode: 'inline'
        },

        {
            key: 'hoadon',
            icon: <img src={HoaDonIcon} alt="HoaDonIcon" />,
            label: "Bảng kê hóa đơn",
            children: HOA_DON_LIST,
            mode: 'vertical'
        },

        // {
        //     key: 'chain',
        //     icon: <img src={ChuoiNghiepVu} alt="Chuoi Nghiep Vu" />,
        //     label: 'Quy trình',
        //     children: listChain.map(chain => ({
        //         key: chain.id,
        //         label: chain.name,
        //     })),
        //     mode: 'inline'
        // },

        {
            key: 'danhmuc',
            icon: <img src={DanhMucDuLieu} alt="Danh Muc Du Lieu" />,
            label: "Danh mục hoạt động",
            children: [...DANH_MUC_HOAT_DONG, ...DANH_MUC_KHAC],
            mode: 'inline'
        },
        {
            key: 'dulieukhac',
            icon: <img src={DuLieuKhacIconSideBar} alt="DuLieuKhacIcon" />,
            label: "Dữ liệu khác",
            children: DU_LIEU_KHAC,
            mode: 'vertical'
        },
        {
            key: 'baocao',
            icon: <img src={BaoCaoIcon} alt="BaoCaoIcon" />,
            label: 'Báo cáo tài chính',
            children: BAO_CAO_LIST,
            mode: 'inline'
        },
    ];

    const handleMenuClick = (e) => {
        const selectedKey = e.key;
        console.log(selectedKey)
        const path = e.keyPath[1];

        setSelectedKey(selectedKey);
        localStorage.setItem("selectedMenu", selectedKey);

        const parentKey = items.find((item) =>
            item.children.some((child) => child.key == selectedKey)
        )?.key

        if (parentKey) {
            localStorage.setItem("openMenu", parentKey);
        }

        if (path === "chain") {
            setChainTemplate2Selected({
                type: 'chain',
                data: null
            })
            navigate(`/accounting/chains/${selectedKey}`);
        } else if (path.includes("chain2")) {
            const idChain2 = path.slice("chain2-".length);

            const chain2TemplateSelected = listChainFull.find(item => item.id == idChain2) ?? {};

            const templateSelected = chain2TemplateSelected?.templates?.find(template => template.id == selectedKey);

            setChainTemplate2Selected({
                type: 'chain2',
                data: {
                    ...chain2TemplateSelected,
                    selectedTemplate: templateSelected
                }
            });

            navigate(`/accounting/chains/${idChain2}/templates/${templateSelected?.id}`);

        } else if (path === "danhmuc") {
            navigate(`/accounting/danh-muc/${selectedKey}`);
        } else if (path === "danhmuckhac") {
            navigate(`/accounting/danh-muc-khac/${selectedKey}`);
        } else if (path === "baocao") {
            navigate(`/accounting/bao-cao/${selectedKey}`);
        } else if (path === "solieu") {
            navigate(`/accounting/so-lieu/${selectedKey}`);
        } else if (path === "hoadon") {
            navigate(`/accounting/hoa-don/${selectedKey}`);
        } else if (path === "sanxuat") {
            navigate(`/accounting/san-xuat/${selectedKey}`);
        } else if (path === "dulieukhac") {
            navigate(`/accounting/du-lieu-khac/${selectedKey}`);
        }
    };

    const hasVietnameseTones = (str) => {
        const regex = /[\u0300-\u036f\u1ea0-\u1eff]/;
        return regex.test(str);
    };

    const removeVietnameseTones = (str) => {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toLowerCase();
    };

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };

    const filteredList = items.map(item => {
        const filteredChildren = item.children?.filter(subItem => {
            if (hasVietnameseTones(searchText)) {
                return subItem.label.toLowerCase().includes(searchText.toLowerCase());
            } else {
                return removeVietnameseTones(subItem.label).includes(removeVietnameseTones(searchText));
            }
        });
        if (filteredChildren && filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
        }
        return null;
    }).filter(item => item !== null);

    const closeAllMenus = () => {
        setOpenKeys([]);
    };

    const handleOpenChange = (key, keys) => {
        setOpenKeys(prev => ({
            ...prev,
            [key]: keys,
        }));
    };

    const fetchDataFirst = async () => {
        try {
            const savedSelectedKey = localStorage.getItem("selectedMenu");
            const savedOpenKey = localStorage.getItem("openMenu");

            if (savedSelectedKey && savedOpenKey) {
                const key = savedOpenKey
                const keys = [savedOpenKey];
                setSelectedKey(savedSelectedKey);
                handleOpenChange(key, keys);
            }

            const dataFull = await getAllChainTemplateStepSubStep();

            const chainTemplateSelected = dataFull.result.find(item => item.id == id) ?? {};

            const templateSelected = chainTemplateSelected?.templates?.find(item => item.id == savedSelectedKey);

            setChainTemplate2Selected({
                type: 'chain2',
                data: {
                    ...chainTemplateSelected,
                    selectedTemplate: templateSelected
                }
            });

        } catch (error) {
            console.error("Error fetching card data:", error);
        }
    }

    useEffect(() => {
        fetchDataFirst();
    }, []);

    useEffect(() => {
        async function fetchData() {
            const regexFull = /chains\/(\d+)\/templates\/(\d+)\/cards\/(\d+)\/steps\/(\d+)/;
            const regexChainTemplate = /chains\/(\d+)\/templates\/(\d+)/;

            let match = window.location.href.match(regexFull);

            let chainId, templateId, cardId, stepId;

            if (match) {
                [, chainId, templateId, cardId, stepId] = match;
            } else {
                match = window.location.href.match(regexChainTemplate);
                if (match) {
                    [, chainId, templateId] = match;
                } else {
                    // console.error("URL không hợp lệ:", window.location.href);
                    return;
                }
            }
            setSelectedKey(templateId);
            const dataFull = await getAllChainTemplateStepSubStep();
            if (!dataFull?.result || !Array.isArray(dataFull.result)) return;

            const chainTemplateSelected = dataFull.result.find(item => item.id == chainId && item.templates.some(template => template.id == templateId));

            if (!chainTemplateSelected || !chainTemplateSelected.id) return;

            const menuOpenKey = `chain2-${chainTemplateSelected.id}`;
            handleOpenChange(menuOpenKey, [menuOpenKey]);

            if (cardId && stepId) {
                navigate(`/accounting/chains/${chainId}/templates/${templateId}/cards/${cardId}/steps/${stepId}`);
            } else {
                navigate(`/accounting/chains/${chainId}/templates/${templateId}`);
            }
        }

        fetchData();
    }, [idTemp]);

    return (
        <div className={`${css.sidebar} ${isCollapsed ? css.sidebarCollapsed : ''}`}>
            {
                !isCollapsed ?
                    <>
                        <div className={css.button}>
                            <div className={css.buttonWrapper} onClick={handleOpen}>
                                <span>{'+ Nhanh'}</span>
                            </div>
                            <IconButton
                                onClick={togglePinSidebar}
                                size="small"
                            >
                                <img src={!isPinSideBar ? PinSideBarIcon : UnPinSideBarIcon} alt="" />
                            </IconButton>
                            <IconButton onClick={onToggle} size="small">
                                <ChevronLeftIcon />
                            </IconButton>
                        </div>
                        <div className={css.buttonSearch}>
                            <img src={SearchIcon} alt="" />
                            <input
                                type="text"
                                className={css.quickFilterInput}
                                value={searchText}
                                placeholder="Tìm kiếm"
                                onChange={handleSearchChange}
                            />
                            <IconButton onClick={closeAllMenus} size="small">
                                <img src={CollapseAllMenuSideBar} />
                            </IconButton>

                        </div>
                    </>
                    :
                    <>
                        <div className={css.button}>
                            <IconButton onClick={onToggle} size="small">
                                <ChevronRightIcon />
                            </IconButton>

                        </div>
                        <div className={css.button}>
                            <div className={css.buttonWrapper} onClick={handleOpen}>
                                <span>{'+'}</span>
                            </div>
                        </div>
                    </>

            }

            <div className={css.tabs}>

                {filteredList.map(item => (
                    <Menu
                        key={item.key}
                        onClick={handleMenuClick}
                        style={{
                            width: !isCollapsed ? 290 : 70,
                        }}
                        selectedKeys={[selectedKey]}
                        inlineCollapsed={isCollapsed}
                        openKeys={openKeys[item.key] || []}
                        onOpenChange={(keys) => handleOpenChange(item.key, keys)}
                        mode={item.mode}
                    >
                        <Menu.SubMenu
                            key={item.key}
                            icon={item.icon}
                            title={
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span
                                        style={{
                                            fontWeight: 'bold',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: 'inline-block',
                                            maxWidth: '180px',
                                            verticalAlign: 'middle',
                                            flex: 1,
                                            minWidth: 0,

                                        }}
                                    >
                                        {item.label}
                                    </span>
                                </div>

                            }
                        >
                            {item.children.map(subItem => (
                                <Menu.Item key={subItem.key}
                                    title={subItem.label}
                                    style={{
                                        color: subItem.key == selectedKey ? '#249E57' : 'unset',
                                        fontWeight: subItem.key == selectedKey ? 450 : 'unset'
                                    }}
                                >
                                    {subItem.label}
                                </Menu.Item>
                            ))}
                        </Menu.SubMenu>
                    </Menu>
                ))}



            </div>
            <CreateQuickMenu
                open={open}
                onClose={handleClose}
                setLoadData={setLoadData}
            />
        </div>
    );
}
