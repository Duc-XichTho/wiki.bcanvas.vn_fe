import css from "./Header.module.css"
import { useContext, useState, useEffect } from "react";
import ProfileSelect from "../../../../pages/Home/SelectComponent/ProfileSelect.jsx";
import { Dropdown, Space, Modal } from 'antd';
import { AppIcon } from '../../../../icon/IconSVG.js';
import { useNavigate } from "react-router-dom";
import { Canvas_APP, Gateway, SAB_FA, SAB_MA } from "../../../../Consts/NAME_APP.js";
import { MyContext } from "../../../../MyContext.jsx";
import CrossRoadPopup from '../../../../components/CrossRoadPopup/CrossRoadPopup.jsx'
import CrossRoadPopup2 from '../../../../components/CrossRoadPopup/CrossRoadPopup2.jsx'
import * as React from "react";

const Header = () => {
    const { currentUser } = useContext(MyContext)
    const navigate = useNavigate()

    const [isModalOpen, setIsModalOpen] = useState(false);
    const showModal = () => {
        setIsModalOpen(true);
    };
    const handleOk = () => {
        setIsModalOpen(false);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const items = [
        currentUser && currentUser.isAdmin ? {
            key: '0',
            label: (
                <div onClick={() => navigate('/admin')}>Admin</div>
            ),
        } : null,
        {
            key: '1',
            label: (
                <div onClick={() => navigate('/accounting')}>{SAB_FA}</div>
            ),
        },
        {
            key: '2',
            label: (
                <div onClick={() => navigate('/ke-toan-quan-tri/can-doi-phat-sinh')}>{SAB_MA}</div>
            ),
        },
        {
            key: '3',
            label: (
                <div onClick={() => navigate('/canvas')}>{Canvas_APP}</div>
            ),
        },
        {
            key: '4',
            label: (
                <div onClick={() => navigate('/project-manager')}>{Gateway}</div>
            ),
        },
        {
            key: '5',
            label: (
                <div onClick={() => window.open('https://sab.io.vn', '_blank')}>SAB Wiki</div>
            ),
        },
    ];

    return (
        <>
            <div className={css.navContainer}>
                <div className={css.header_left}>
                    <Space
                        style={{
                            cursor: 'pointer'
                        }}
                        onClick={showModal}
                    >
                        {/*<img src={AppIcon} alt="" width={30} />*/}
                        <img src="/App%20switcher.svg" alt="" width={25}/>
                        <span>WF</span>
                    </Space>
                </div>
                <div className={css.header_right}>
                    <div className={css.username}>
                        <ProfileSelect />
                    </div>
                </div>
            </div>

            <CrossRoadPopup2
                openCrossRoad={isModalOpen}
                onOkCrossRoad={handleOk}
                onCancelCrossRoad={handleCancel}
            />
        </>
    )
}

export default Header
