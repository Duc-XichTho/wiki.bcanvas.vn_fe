import React, {useContext, useState} from "react";
import {Button, Divider, Modal, Popover} from "antd";
import css from "./SidebarNew.module.css";
import {IconButton} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import {MyContext} from "../../../../MyContext.jsx";
import {IconCollapGreen,} from "../../../../icon/IconSVG.js";
// API
// CONSTANT
import SettingSideBar from "./Action/SettingSideBar.jsx";
import ListFileNote from "../FileNote/ListFileNote.jsx";
import ListCongCu from "../CongCu/ListCongCu.jsx";
import {FooterSideBar, RulerIcon} from "../../../../icon/svg/IconSvg.jsx";
import RequestSideBar from "./Action/RequestSideBar.jsx";

const {confirm} = Modal;

export default function SideBarNew({
                                       isCollapsed,
                                       onToggle,
                                       togglePinSidebar,
                                       isPinSideBar,
                                   }) {
    const {
        selectedTapCanvas,
        setSelectedTapCanvas,
        loadData,
        userClasses,
        fetchUserClasses,
        uCSelected_CANVAS,
        currentUser,
        setCurrentUser,
        listUC_CANVAS
    } = useContext(MyContext);
    const [isDialogOpenSetting, setIsDialogOpenSetting] = useState(false)
    const [isOpenCreateRequest, setIsOpenCreateRequest] = useState(false)
    const [checkFolder, setCheckFolder] = useState([])
    const [selectedKey, setSelectedKey] = useState(null);
    const [selectedTap, setSelectedTap] = useState(null);
    const [selectedType, setSelectedType] = useState(null);

    const handleCloseModalSetting = async (data) => {
        setIsDialogOpenSetting(false)
        if (data) {
            setCheckFolder(data);
        }
    }

    const handleCloseCreateRequest =  () => {
        setIsOpenCreateRequest(false)
    }

    const content = () => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentUser && currentUser.isAdmin && (
                    <>
                        <Button onClick={() => setIsDialogOpenSetting(true)}
                                style={{padding: '5px 8px', height: '28px'}}>
                            <span className={css.advancedFilter}>Cấu hình B-Canvas</span>
                        </Button>
                        <Button onClick={() => setIsOpenCreateRequest(true)}
                                style={{padding: '5px 8px', height: '28px'}}>
                            <span className={css.advancedFilter}> Yêu cầu tùy biến</span>
                        </Button>
                    </>

                )}
                {isDialogOpenSetting && <SettingSideBar open={isDialogOpenSetting}
                                                        onClose={handleCloseModalSetting}
                                                        data={checkFolder}/>
                }
                {isOpenCreateRequest && <RequestSideBar open={isOpenCreateRequest}
                                                        onClose={handleCloseCreateRequest}
                />
                }
            </div>
        );
    };



    return (
        <div className={`${css.sidebar} ${isCollapsed ? css.sidebarCollapsed : ""}`}>
            {!isCollapsed ? (
                <>
                    <div className={css.headerSidebar}>
                        <div className={css.headerSidebarLeft}>
                            <Popover content={content} trigger="click">
                                <Button style={{ padding: '5px 8px', height: '28px' }}>
                                    <RulerIcon width={15} height={18}/>
                                    <span className={css.advancedFilter}> Mở rộng - Tùy biến</span>
                                </Button>
                            </Popover>
                        </div>
                        <div className={css.headerSidebarRight}>
                            <IconButton onClick={onToggle} size="small">
                                <ChevronLeftIcon/>
                            </IconButton>
                        </div>

                    </div>


                </>
            ) : (
                <>
                    <div className={css.button}>
                        <IconButton onClick={onToggle} size="small" className={css.iconButton}>
                            <ChevronRightIcon className={css.defaultIcon}/>
                            <img src={IconCollapGreen} alt="collapsed icon" className={css.hoverIcon}/>
                        </IconButton>

                    </div>
                </>
            )}
            {!isCollapsed && (
                <>
                    <div className={css.tabs}>
                        {/*Sidebar phía Công Cụ*/}

                        <ListCongCu checkFolder={checkFolder}
                                    setCheckFolder={setCheckFolder}
                                    selectedKey={selectedKey}
                                    setSelectedKey={setSelectedKey}
                                    selectedTap={selectedTap}
                                    setSelectedTap={setSelectedTap}
                                    selectedType={selectedType}
                                    setSelectedType={setSelectedType}
                        />

                        <Divider
                            dashed
                            style={{  borderColor: 'rgba(188, 188, 188, 1)', margin: '25px 0' }}
                        />

                        {/*Sidebar phía FileNote*/}
                        <ListFileNote selectedKey={selectedKey}
                                      setSelectedKey={setSelectedKey}
                                      selectedTap={selectedTap}
                                      setSelectedTap={setSelectedTap}
                                      selectedType={selectedType}
                                      setSelectedType={setSelectedType}
                        />
                    </div>
                    <div className={css.footer}>
                        <FooterSideBar height={20} width={220}></FooterSideBar>
                    </div>
                </>
            )}


            {/*<KeHoachKinhDoanh*/}
            {/*    isOpen={isModalKeHoachKinhDoanh}*/}
            {/*    setIsOpen={setIsModalKeHoachKinhDoanh}*/}
            {/*/>*/}
        </div>
    );
}
