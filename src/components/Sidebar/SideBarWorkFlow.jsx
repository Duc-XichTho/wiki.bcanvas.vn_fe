import React, {useContext, useEffect, useState} from 'react';
import {Menu} from 'antd';
import {
    ChuoiNghiepVu,
    CollapseAllMenuSideBar,
    PinSideBarIcon,
    SearchIcon,
    UnPinSideBarIcon
} from "../../icon/IconSVG.js";
import css from "./Sidebar.module.css";
import {IconButton} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import CreateQuickMenu from "../../pages/Home/formCreate/CreateQuickMenu.jsx";
import {MyContext} from "../../MyContext.jsx";
import {findRecordsByConditions} from "../../apis/searchModelService.jsx";
import {Chain, TEMPLATE} from "../../Consts/MODEL_CALL_API.js";

export default function SideBarWorkFlow({isCollapsed, onToggle, togglePinSidebar, isPinSideBar}) {
    const [listChain, setListChain] = useState([]);
    const [selectedKey, setSelectedKey] = useState(getLocalStorageSettings().selectedTemplate);
    const [selectedTap, setSelectedTap] = useState(null);
    const [cardSelected, setSelectedCard] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [searchText, setSearchText] = useState("");
    const [open, setOpen] = useState(false);
    const {
        setLoadData,
        loadData,
        selectedTemplate,
        setSelectedTemplate,
        selectedTemplateName,
        setSelectedTemplateName
    } = useContext(MyContext)

    function getLocalStorageSettings() {
        const storedSettings = JSON.parse(localStorage.getItem('WorkFlow'));
        return {
            selectedTemplate: storedSettings?.selectedTemplate ?? null,
            selectedTemplateName: storedSettings?.selectedTemplateName ?? null,
        };
    };

    useEffect(() => {
        const tableSettings = {
            selectedTemplate,
            selectedTemplateName
        };

        localStorage.setItem('WorkFlow', JSON.stringify(tableSettings));
    }, [selectedTemplate, selectedTemplateName]);

    useEffect(() => {
        if (selectedTemplate == '' && selectedTemplateName == '') {
            setSelectedKey('')
        }
    }, [selectedTemplate, selectedTemplateName]);



    const handleClose = () => setOpen(false);
    const handleOpen = () => setOpen(true);

    useEffect(() => {
        if (location && location.pathname == "/accounting/khai-bao/dau-ky") {
            setSelectedKey(null)
        }
    }, [location]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // const data = await getAllChain();
                const conditionsCard = {name: "Workflow"};
                const dataCard = await findRecordsByConditions(Chain, conditionsCard);
                setSelectedCard(dataCard[0])
                const conditions = {chain_id: dataCard[0].id};
                const data = await findRecordsByConditions(TEMPLATE, conditions);
                setListChain(data);
            } catch (error) {
                console.error("Error fetching card data:", error);
            }
        };

        fetchData();
    }, []);

    const handleSelectTemplate = async (id, name) => {
        setSelectedTemplate(id)
        setSelectedTemplateName(name)
    }

    const items = [
        {
            key: 'template',
            icon: <img src={ChuoiNghiepVu} alt="Chuoi Nghiep Vu"/>,
            label: 'Quy trình',
            children: listChain.map(chain => ({
                key: chain.id,
                label: chain.name,
            })),
            mode: 'inline'
        },
    ];

    const handleMenuClick = async (e) => {
        const templateSelect = listChain.find(value => value.id == e.key)
        const path = e.keyPath[1];
        setSelectedKey(e.key);
        setSelectedTap(path);
        if (path === "template") {
            navigate(`/work-flow/${cardSelected.id}`);
            await handleSelectTemplate(e.key, templateSelect.name)
        }
    };

    const hasVietnameseTones = (str) => {
        const regex = /[\u0300-\u036f\u1ea0-\u1eff]/;
        return regex.test(str);
    };

    const removeVietnameseTones = (str) => {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu
            .replace(/đ/g, "d") // Thay 'đ' bằng 'd'
            .replace(/Đ/g, "D") // Thay 'Đ' bằng 'D'
            .toLowerCase(); // Chuyển về chữ thường
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
            return {...item, children: filteredChildren};
        }
        return null;
    }).filter(item => item !== null);

    const [openKeys, setOpenKeys] = useState([]);

    const closeAllMenus = () => {
        setOpenKeys([]);
    };

    const handleOpenChange = (key, keys) => {
        setOpenKeys(prev => ({
            ...prev,
            [key]: keys, // Lưu trạng thái mở/đóng của từng menu theo key
        }));
    };

    return (
        <div className={`${css.sidebar} ${isCollapsed ? css.sidebarCollapsed : ''}`}>
            {
                !isCollapsed ?
                    <>

                        <div className={css.buttonSearch}>
                            <img src={SearchIcon} alt=""/>
                            <input
                                type="text"
                                className={css.quickFilterInput2}
                                value={searchText}
                                placeholder="Tìm kiếm"
                                onChange={handleSearchChange}
                            />
                            <IconButton onClick={closeAllMenus} size="small">
                                <img src={CollapseAllMenuSideBar}/>
                            </IconButton>
                            <IconButton
                                onClick={togglePinSidebar}
                                size="small"
                                // sx={{
                                //     backgroundColor: !isPinSideBar ? "#1C77E7" : "transparent",
                                //     "&:hover": {
                                //         backgroundColor: !isPinSideBar ? "#1C77E7" : "",
                                //     },
                                // }}
                            >
                                <img src={!isPinSideBar ? PinSideBarIcon : UnPinSideBarIcon} alt=""/>
                            </IconButton>
                            <IconButton onClick={onToggle} size="small">
                                <ChevronLeftIcon/>
                            </IconButton>

                        </div>
                    </>
                    :
                    <>
                        <div className={css.button}>
                            <IconButton onClick={onToggle} size="small">
                                <ChevronRightIcon/>
                            </IconButton>

                        </div>
                        {/*<div className={css.button}>*/}
                        {/*    <div className={css.buttonWrapper} onClick={handleOpen}>*/}
                        {/*        <span>{'+'}</span>*/}
                        {/*    </div>*/}
                        {/*</div>*/}
                    </>

            }

            <div className={css.tabs}>
                {filteredList.map(item => (
                    <Menu
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
                                <span style={{
                                    fontWeight: 'bold',
                                }}>{item.label}</span>}
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
