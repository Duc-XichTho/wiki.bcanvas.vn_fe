import css from './SidebarPhanTichChienLuoc.module.css';
import React, { useEffect, useState, useCallback, useContext } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PTCL } from '../../../../icon/svg/IconSvg.jsx';
import { Button, Dropdown, Menu, message } from 'antd'; // Thêm Dropdown, Menu, message
import { SettingOutlined, FolderOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'; // Thêm icons
import { getSettingByType, createSetting } from '../../../../apis/settingService.jsx';
import SettingVisibilityModal from './SettingVisibilityModal.jsx';
import { MyContext } from '../../../../MyContext.jsx'; // Bỏ updateSetting vì đã dùng trong modal
import { getCurrentUserLogin, updateUser } from '../../../../apis/userService.jsx';


const SETTING_TYPE = 'StrategicItemsVisibility'; // Định nghĩa loại setting

const SidebarPhanTichChienLuoc = ({ isShowChienLuoc, setIsShowChienLuoc }) => {
    const { companySelect, buSelect } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(null);
    const location = useLocation();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [visibleItems, setVisibleItems] = useState({}); // State lưu trạng thái hiển thị
    const { loadData } = useContext(MyContext);
    const [strategicItems, setStrategicItems] = useState([]);
    const baseStrategicItems = [
        {
            id: 'pestel',
            title: 'Phân tích PESTEL',
            link: `/canvas/${companySelect}/${buSelect}/dashboard/phan-tich-chien-luoc/pestel`,
        },
        {
            id: 'porter',
            title: 'Mô hình Porter',
            link: `/canvas/${companySelect}/${buSelect}/dashboard/phan-tich-chien-luoc/porter`,
        },
        {
            id: 'swot',
            title: 'Phân tích SWOT',
            link: `/canvas/${companySelect}/${buSelect}/dashboard/phan-tich-chien-luoc/swot`,
        },
        {
            id: 'clddx',
            title: 'Strategy Canvas (Đại dương Xanh)',
            link: `/canvas/${companySelect}/${buSelect}/dashboard/phan-tich-chien-luoc/clddx`,
        },
        {
            id: 'bmcs',
            title: 'Business Model Canvas (Tiêu chuẩn)',
            link: `/canvas/${companySelect}/${buSelect}/dashboard/phan-tich-chien-luoc/bmcs`,
        },
        {
            id: 'bmcr',
            title: 'Business Model Canvas (Rút gọn)',
            link: `/canvas/${companySelect}/${buSelect}/dashboard/phan-tich-chien-luoc/bmcr`,
        },
        {
            id: 'bsc',
            title: 'Balanced Scored Card',
            link: `/canvas/${companySelect}/${buSelect}/dashboard/phan-tich-chien-luoc/bsc`,
        },

    ];



    // Hàm fetch cài đặt hiển thị
    const fetchVisibilitySettings = async () => {
        const defaultVisibility = baseStrategicItems.reduce((acc, item) => {
            acc[item.id] = true;
            return acc;
        }, {});

        try {
            let data = await getSettingByType(SETTING_TYPE);
            let finalVisibility = {};

            if (!data) {
                finalVisibility = defaultVisibility;
            } else {
                // Trường hợp có setting từ server
                const serverVisibility = { ...data.setting };
                finalVisibility = { ...defaultVisibility };

                baseStrategicItems.forEach(item => {
                    if (serverVisibility[item.id] !== undefined) {

                        finalVisibility[item.id] = serverVisibility[item.id];
                    }
                });
            }

            setVisibleItems(finalVisibility);

            setStrategicItems(baseStrategicItems.filter(item => finalVisibility[item.id] !== false));

        } catch (error) {
            console.error('Lỗi khi lấy cài đặt hiển thị:', error);
            setVisibleItems(defaultVisibility);
            setStrategicItems(baseStrategicItems.filter(item => defaultVisibility[item.id] !== false));
        }
    };

    useEffect(() => {
        fetchVisibilitySettings();
    }, [loadData]);

    const handleSubItemClick = (subItem) => {
        setActiveTab(subItem);
        navigate(subItem.link);

        updateViewStateForPhanTichChienLuoc({
            data: {
                selectedTabId: subItem.id,
            },
        });
    }

    useEffect(() => {
        const loadActiveTabFromViewState = async () => {
            const user = (await getCurrentUserLogin()).data;
            const selectedId = user?.info?.viewState?.phanTichChienLuoc?.selectedTabId;

            if (selectedId) {
                const found = baseStrategicItems.find(item => item.id === selectedId);
                if (found) {
                    setActiveTab(found);
                    navigate(found.link); // ✅ thêm dòng này để điều hướng
                }
            }
        };

        loadActiveTabFromViewState();
    }, []);


    useEffect(() => {
        // Kiểm tra pathname có nằm trong khu vực phân tích chiến lược không
        if (location.pathname.includes('/phan-tich-chien-luoc')) {
            const currentItem = strategicItems.find(item =>
                location.pathname.includes(`/${item.id}`)
            );
            if (currentItem) {
                setActiveTab(currentItem);
            } else {
                setActiveTab(null); // Không tìm thấy ID phù hợp => reset
            }
        } else {
            // Nếu không nằm trong phân tích chiến lược => reset
            setActiveTab(null);
        }
    }, [location.pathname, strategicItems]);// Thêm strategicItems vào dependency

    useEffect(() => {
        if (!location.pathname.includes('/phan-tich-chien-luoc')) {
            // Reset khi rời vùng phân tích chiến lược
            updateViewStateForPhanTichChienLuoc({
                data: { selectedTabId: null },
            });
        }
    }, [location.pathname]);


    const handleMenuClick = (e) => {
        if (e.key === 'visibility') {
            setIsModalVisible(true);
        } else if (e.key === 'folder') {
            // Xử lý khi bấm nút Folder (hiện tại chưa có yêu cầu cụ thể)
            message.info('Chức năng Folder chưa được triển khai.');
        } else if (e.key === 'toggle') {
            setIsShowChienLuoc(!isShowChienLuoc);
        }
    };

    const handleModalClose = (saved) => {
        setIsModalVisible(false);
        if (saved) {
            fetchVisibilitySettings(); // Tải lại cài đặt nếu đã lưu
        }
    };

    const menu = (
        <Menu onClick={handleMenuClick}>
            {isShowChienLuoc ?
                <Menu.Item key="toggle" icon={<EyeInvisibleOutlined />}>
                    Thu gọn
                </Menu.Item>
                : <Menu.Item key="toggle" icon={<EyeOutlined />}>
                    Mở rộng
                </Menu.Item>}
            <Menu.Item key="visibility" icon={<SettingOutlined />}>
                Cài đặt hiển thị
            </Menu.Item>
        </Menu>
    );


    const updateViewStateForPhanTichChienLuoc = async ({ data }) => {
        const user = (await getCurrentUserLogin()).data;

        const info = user.info || {};
        const viewState = info.viewState || {};
        const phanTichChienLuoc = viewState.phanTichChienLuoc || {};

        const newUser = {
            ...user,
            info: {
                ...info,
                viewState: {
                    ...viewState,
                    phanTichChienLuoc: {
                        ...phanTichChienLuoc,
                        ...data,
                    },
                },
            },
        };

        await updateUser(user.email, newUser);
    };


    return (
        <div className={css.main}>
            <div className={css.sidebar}>
                <div className={css.menu}>
                    <div className={css.header}>
                        <span className={css.titleGroup}>
		                    <span className={css.dot}></span>
		                        CHIẾN LƯỢC - PHÂN TÍCH
	                    </span>
                        <div className={css.dropdownWrapper}>
                            <Dropdown overlay={menu} trigger={['click']}>
                                <Button
                                    type="text"
                                    icon={<SettingOutlined />}
                                    className={css.settingsBtn}
                                />
                            </Dropdown>
                        </div>
                    </div>

                    {/* Chỉ hiển thị nội dung nếu isShowChienLuoc là true */}
                    {isShowChienLuoc && (
                        <div className={css.subItems}>
                            {strategicItems.length > 0 ? strategicItems.map((subItem) => (
                                <div
                                    key={subItem.id}
                                    className={`${css.subTab} ${activeTab?.id === subItem.id ? css.active : ''}`}
                                    onClick={() => handleSubItemClick(subItem)}
                                >
                                    {subItem.title}
                                </div>
                            )) : (
                                <div className={css.noItems}>Không có mục nào được hiển thị.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Render Modal */}
            <SettingVisibilityModal
                isOpen={isModalVisible}
                onClose={handleModalClose}
                items={baseStrategicItems}
            />
        </div>
    );
};

export default SidebarPhanTichChienLuoc;