import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { AppIcon, CollapseAllMenuSideBar } from "../../../icon/IconSVG.js";
import { IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Dropdown, Space, Modal } from "antd";
import { useContext, useState } from "react";
import { MyContext } from "../../../MyContext.jsx";
import { Canvas_APP, SAB_FA, SAB_MA, SAB_Workflow } from "../../../Consts/NAME_APP.js";
import CrossRoadPopup from '../../../components/CrossRoadPopup/CrossRoadPopup.jsx'
import CrossRoadPopup2 from '../../../components/CrossRoadPopup/CrossRoadPopup2.jsx'

export default function ChangeMode() {
    const navigate = useNavigate();
    const { setSelectedTemplate, setSelectedTemplateName, currentUser } = useContext(MyContext)

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
                <div
                    onClick={() => {
                        setSelectedTemplateName('');
                        setSelectedTemplate('');

                        setTimeout(() => {
                            navigate(`/work-flow`);
                        }, 100);
                    }}
                >
                    {SAB_Workflow}
                </div>
            ),
        },
        {
            key: '5',
            label: (
                <div onClick={() => window.open('https://wiki.xichtho.vn', '_blank')}>
                    SAB Wiki
                </div>
            ),
        },
        {
            key: '6',
            label: (
                <>
                    {currentUser?.isAdmin && (
                        <div onClick={() => navigate('/admin')}> Admin</div>
                    )
                    }
                </>
            )
        }
    ];

    return (
        // <Dropdown
        //     menu={{
        //         items,
        //     }}
        // >
        //     <a onClick={(e) => e.preventDefault()}>
        //         <Space
        //             style={{
        //                 cursor: 'pointer'
        //             }}
        //         >
        //             <img src={AppIcon} alt="" width={30} />
        //             <img src="/logo.png" alt="" width={35} />
        //         </Space>
        //     </a>
        // </Dropdown>

        <>
            <Space
                style={{
                    cursor: 'pointer'
                }}
                onClick={showModal}
            >
                {/*<img src={AppIcon} alt="" width={30} />*/}
                <img src="/logo.png" alt="" width={35} />
            </Space>
            <CrossRoadPopup2
                openCrossRoad={isModalOpen}
                onOkCrossRoad={handleOk}
                onCancelCrossRoad={handleCancel}
            />
        </>
    );
}
