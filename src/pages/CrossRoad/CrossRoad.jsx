import css from "./CrossRoad.module.css"
import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom";
import { TTBC_ICON, XLBC_ICON, QLKT_ICON, WIKI_ICON, TODO_ICON, ADMIN_ICON } from './icon.js'
import { Button, Modal, Flex, Input, message } from 'antd'
import { createFeedback } from '../../apis/feedbackService.jsx'
import { MyContext } from "../../MyContext.jsx";

const { TextArea } = Input;

export default function CrossRoad() {
    const { currentUser } = useContext(MyContext);
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [hoveredPageId, setHoveredPageId] = useState(null);

    const [openFeedback, setOpenFeedback] = useState(false);
    const [titleFeedback, setTitleFeedback] = useState('');
    const [bodyFeedback, setBodyFeedback] = useState('');
    const [confirmLoading, setConfirmLoading] = useState(false);

    const onChangeTitle = (e) => {
        setTitleFeedback(e.target.value);
    };

    const onChangeBody = (e) => {
        setBodyFeedback(e.target.value);
    };

    const handleCloseFeedback = () => {
        setTitleFeedback('');
        setBodyFeedback('');
        setOpenFeedback(false);
    };

    const renderFeedback = () => {

        return (
            <Flex vertical gap={16}>
                <Input
                    placeholder="tiêu đề"
                    showCount maxLength={100}
                    value={titleFeedback}
                    onChange={onChangeTitle}
                />
                <TextArea
                    showCount
                    maxLength={2000}
                    placeholder="nội dung"
                    style={{
                        height: 260,
                        resize: 'none',
                    }}
                    value={bodyFeedback}
                    onChange={onChangeBody}
                />
            </Flex>
        )
    };

    const handleMouseEnter = (pageId) => {
        setHoveredPageId(pageId);
    };

    const handleMouseLeave = () => {
        setHoveredPageId(null);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const seconds = String(currentTime.getSeconds()).padStart(2, '0');

    const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayOfWeek = weekdays[currentTime.getDay()];

    const day = currentTime.getDate();
    const month = currentTime.getMonth() + 1;
    const year = currentTime.getFullYear();

    const listPages = [
        {
            id: 1,
            name: 'Trung tâm báo cáo tài chính (TTBC)',
            icon: TTBC_ICON,
            description: 'Chức năng xem tập trung báo cáo tài chính - kế toán quản trị cho người dùng'
        },
        {
            id: 2,
            name: 'Kho cẩm nang - thư viện (Wiki)',
            icon: WIKI_ICON,
            description: 'Hướng dẫn sử dụng, tài liệu tham khảo và các tài liệu chung cho người dùng'
        },
        {
            id: 3,
            name: 'Tổng hợp, xử lý báo cáo (XLBC)',
            icon: XLBC_ICON,
            description: 'Chức năng xử lý báo cáo/ dữ liệu thô thành các chiều quản trị, hợp nhất, xây dựng kế hoạch'
        },
        {
            id: 4,
            name: 'Sổ quản lý công việc (To-do)',
            icon: TODO_ICON,
            description: 'Công cụ quản lý công việc, file đính kèm theo các dự án, vụ việc, các phase.'
        },
        {
            id: 5,
            name: 'Quản lý kế toán (QLKT)',
            icon: QLKT_ICON,
            description: 'Chức năng quản lý nghiệp vụ, ghi nhận giao dịch kinh doanh, quản lý số liệu kế toán và nội bộ'
        },
        currentUser && currentUser.isAdmin && {
            id: 6,
            name: 'Admin - quản lý phân quyền',
            icon: ADMIN_ICON,
            description: 'Khu vực quản lý phân quyền sử dụng, thao tác cho các phần chức năng'
        },
    ]

    const handleSelectPage = (page) => {
        const { id } = page

        const pageRoutes = {
            1: `${import.meta.env.VITE_DOMAIN_URL}/canvas`,
            2: 'https://sab.io.vn',
            3: `${import.meta.env.VITE_DOMAIN_URL}/ke-toan-quan-tri`,
            4: `${import.meta.env.VITE_DOMAIN_URL}/project-manager`,
            5: `${import.meta.env.VITE_DOMAIN_URL}/accounting`,
            6: `${import.meta.env.VITE_DOMAIN_URL}/admin`,
        };

        const url = pageRoutes[id];

        if (url) {
            id === 2 ? window.open(url, '_blank') : (window.location.href = url);
        } else {
            console.warn('Page ID không hợp lệ:', id);
        }
    }

    const handleSendEmail = async () => {

        setConfirmLoading(true);

        if (!titleFeedback.trim() || !bodyFeedback.trim()) {
            message.warning("Vui lòng nhập tiêu đề và nội dung!");
            setConfirmLoading(false);
            return;
        }

        const emailData = {
            senderName: currentUser?.name,
            senderEmail: currentUser?.email,
            title: titleFeedback,
            body: bodyFeedback,
        };

        try {
            const response = await createFeedback(emailData);

            if (response.data.code === 'OK') {
                message.success('Gửi thành công');
                setConfirmLoading(false);
                handleCloseFeedback();
            } else {
                setConfirmLoading(false);
                message.error('Gửi thất bại');
            }
        } catch (error) {
            setConfirmLoading(false);
            console.error("Lỗi gửi email:", error);
        }

    };

    return (
        <>
            <div className={css.main}>
                <div className={css.container}>
                    {/*<div className={css.header}>*/}
                    {/*  <div className={css.headerContainer}>*/}
                    {/*    <div className={css.headerTitleLarge}>*/}
                    {/*      <span>SAB Management Accounting & Finance</span>*/}
                    {/*    </div>*/}
                    {/*    <div className={css.headerTitleSmall}>*/}
                    {/*      <span>Phần mềm Kế toán Quản trị - Tài chính SAB</span>*/}
                    {/*    </div>*/}
                    {/*  </div>*/}
                    {/*</div>*/}
                    <div className={css.body}>
                        <div className={css.bodyContainer}>
                            {/*<div className={css.bodyLeft}>*/}
                            {/*  <div className={css.bodyLeftContainer}>*/}
                            {/*    <img src="https://bucket-xichtho.hn.ss.bfcplatform.vn/sab/sheet_gif.gif" alt="" />*/}
                            {/*  </div>*/}
                            {/*</div>*/}
                            <div className={css.bodyRight}>
                                <div className={css.bodyRightContainer}>
                                    {listPages.map((page) => {
                                        const isHovered = hoveredPageId === page.id;
                                        const content = (
                                            <div
                                                key={page.id}
                                                className={`${css.dataset} ${isHovered ? css.datasetHovered : ''}`}
                                                onClick={() => handleSelectPage(page)}
                                                onMouseEnter={() => handleMouseEnter(page.id)}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                <div className={css.datasetContainer}>
                                                    <div className={css.datasetThumnail}>
                                                        <img src={page.icon} alt='Page Icon' />
                                                    </div>
                                                    <div className={css.datasetInfo}>
                                                        <div className={css.datasetInfoContainer}>
                                                            <div className={css.datasetInfoTop}>
                                                                <span>{page.name}</span>
                                                            </div>
                                                            <div className={css.datasetInfoBottom}>
                                                                <span>{page.description}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                        return content;
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={css.footer}>
                        <div className={css.footerContainer}>
                            <div className={css.footerLeft}>
                                <div className={css.footerLeftTop}>
                                    <span>{hours}:{minutes}:{seconds}</span>
                                </div>
                                <div className={css.footerLeftBottom}>
                                    <span>{dayOfWeek}, ngày {day} tháng {month} năm {year}</span>
                                </div>
                            </div>
                            <div className={css.footerRight}>
                                <Button onClick={() => setOpenFeedback(true)}>Yêu cầu hỗ trợ</Button>
                                <Button onClick={() => window.open('https://sab.io.vn')}>Tới sab.io.vn</Button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <Modal
                width={700}
                title="Yêu cầu hỗ trợ"
                confirmLoading={confirmLoading}
                centered
                open={openFeedback}
                onOk={() => handleSendEmail()}
                onCancel={() => handleCloseFeedback()}
                okText="Gửi"
                cancelText="Hủy"
                maskClosable={false}
                styles={{
                    body: {
                        height: 350,
                        overflowY: 'auto',
                    },
                }}
            >
                {renderFeedback()}
            </Modal>
        </>
    )
}
