import css from './SidebarChiSoKinhDoanh.module.css';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Dropdown, Form, Input, Menu, message, Modal, Popconfirm } from 'antd'; // Thêm Dropdown, Menu, message
import { EyeInvisibleOutlined, EyeOutlined, SettingOutlined } from '@ant-design/icons'; // Thêm icons
import { deleteKHKDTongHop, getAllKHKDTongHop, updateKHKDTongHop } from '../../../../apis/khkdTongHopService.jsx';
import CreateHopKH from '../../KeHoach/CanvasHopKeHoach/Action/CreateHopKH.jsx';
import { deleteReportCanvas, updateReportCanvas } from '../../../../apis/reportCanvasService.jsx';
import { ICON_SIDEBAR_LIST } from '../../../../icon/svg/IconSvg.jsx';
import { getCurrentUserLogin, updateUser } from '../../../../apis/userService.jsx'; // Bỏ updateSetting vì đã dùng trong modal
import { useLocation } from 'react-router-dom';

const SETTING_TYPE = 'StrategicItemsVisibility'; // Định nghĩa loại setting

export default function SidebarChiSoKinhDoanh({ isShowChiSoKinhDoanh, setIsShowChiSoKinhDoanh }) {
    const { companySelect, buSelect, idHopKH } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(null);
    const [isKHKDTongHopModalOpen, setIsKHKDTongHopModalOpen] = useState(false);
    const [strategicItems, setStrategicItems] = useState([]);
    const [khkdTongHopForm] = Form.useForm();

    const fetchData = async () => {
        let data = await getAllKHKDTongHop();
        setStrategicItems(data || []);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubItemClick = async (subItem) => {
        setActiveTab(subItem.id);  // Cập nhật activeTab

        // Cập nhật lại viewState trong người dùng
        await updateViewStateForChiSoKinhDoanh({ data: { selectedHopKHId: subItem.id } });

        const newPath = `/canvas/${companySelect}/${buSelect}/dashboard/hop-ke-hoach/${subItem.id}`;
        navigate(newPath);
    };


    useEffect(() => {
        const init = async () => {
            const data = await getAllKHKDTongHop();
            setStrategicItems(data || []);

            const user = (await getCurrentUserLogin()).data;
            const savedId = user?.info?.viewState?.chiSoKinhDoanh?.selectedHopKHId;

            if (savedId) {
                setActiveTab(savedId);
                const found = (data || []).find(item => item.id === savedId);
                if (found) {
                    const newPath = `/canvas/${companySelect}/${buSelect}/dashboard/hop-ke-hoach/${found.id}`;
                    navigate(newPath);
                }
            }
        };

        init();
    }, []);



    const handleMenuClick = (e) => {
        if (e.key === 'create') {
            setIsKHKDTongHopModalOpen(true);
        } else if (e.key === 'folder') {
            // Xử lý khi bấm nút Folder (hiện tại chưa có yêu cầu cụ thể)
            message.info('Chức năng Folder chưa được triển khai.');
        } else if (e.key === 'toggle') {
            setIsShowChiSoKinhDoanh(!isShowChiSoKinhDoanh);
        }
    };

    const menu = (
        <Menu onClick={handleMenuClick}>
            {isShowChiSoKinhDoanh ?
                <Menu.Item key="toggle" icon={<EyeInvisibleOutlined />}>
                    Thu gọn
                </Menu.Item>
                : <Menu.Item key="toggle" icon={<EyeOutlined />}>
                    Mở rộng
                </Menu.Item>}
            <Menu.Item key="create" icon={<SettingOutlined />}>
                Thêm mới
            </Menu.Item>
        </Menu>
    );

    const [newFileName, setNewFileName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);

    const handleRename = async () => {
        try {
            if (!newFileName.trim()) {
                message.warning('Tên không được để trống');
                return;
            }

            await updateKHKDTongHop({
                ...selectedFile,
                name: newFileName,
            });

            message.success('Đổi tên thành công');
            setIsRenameModalVisible(false);
            await fetchData();
        } catch (error) {
            console.error('Error renaming file:', error);
            message.error('Có lỗi xảy ra khi đổi tên');
        }
    };

    const contextMenuItems = [
        {
            key: '1',
            label: 'Đổi tên',
            onClick: (e) => {
                setSelectedFile(e.selectedFile);
                setNewFileName(e.selectedFile?.name);
                setIsRenameModalVisible(true);
            },
        },
        {
            key: '2',
            label: 'Xóa',
            onClick: (e) => e.domEvent.stopPropagation(),
        },
    ];

    const handleDelete = async (id) => {
        try {
            await deleteKHKDTongHop(id);
            message.success('Xóa thành công');
            await fetchData();
            const newPath = `/canvas/${companySelect}/${buSelect}/dashboard`;
            navigate(newPath);
        } catch (error) {
            console.error('Error deleting file:', error);
            message.error('Có lỗi xảy ra khi xóa');
        }
    };

    const handleContextMenu = (e, value) => {
        e.preventDefault(); // Ngừng hành động mặc định của context menu

        contextMenuItems[0].onClick = () => {
            setSelectedFile(value);
            setNewFileName(value.name);
            setIsRenameModalVisible(true);
        };

        contextMenuItems[1].label = (
            <Popconfirm
                title="Bạn có chắc chắn muốn xóa?"
                onConfirm={() => handleDelete(value.id)}
                okText="Có"
                cancelText="Không"
                onCancel={(e) => e.stopPropagation()}
            >
                <div onClick={(e) => e.stopPropagation()}>Xóa</div>
            </Popconfirm>
        );
    };

    const location = useLocation();

    useEffect(() => {
        const checkOutsideSidebarChiSoKinhDoanh = async () => {
            const currentPath = location.pathname;

            // Nếu KHÔNG phải path thuộc sidebar ChiSoKinhDoanh
            if (!currentPath.includes('/dashboard/hop-ke-hoach')) {
                const user = (await getCurrentUserLogin()).data;
                const currentSelected = user?.info?.viewState?.chiSoKinhDoanh?.selectedHopKHId;

                // Nếu vẫn đang lưu selectedHopKHId thì reset
                if (currentSelected) {
                    await updateViewStateForChiSoKinhDoanh({ data: { selectedHopKHId: null } });
                    setActiveTab(null); // reset UI local
                }
            }
        };

        checkOutsideSidebarChiSoKinhDoanh();
    }, [location.pathname]);



    // Cập nhật lại viewState của SidebarChiSoKinhDoanh
    const updateViewStateForChiSoKinhDoanh = async ({ data }) => {
        const user = (await getCurrentUserLogin()).data;

        const info = user.info || {};
        const viewState = info.viewState || {};
        const chiSoKinhDoanh = viewState.chiSoKinhDoanh || {};

        const newUser = {
            ...user,
            info: {
                ...info,
                viewState: {
                    ...viewState,
                    chiSoKinhDoanh: {
                        ...chiSoKinhDoanh,
                        ...data,  // Cập nhật dữ liệu viewState mới
                    },
                },
            },
        };

        await updateUser(user.email, newUser); // Lưu lại viewState vào API
    };


    return (
        <div className={css.main}>
            <div className={css.sidebar}>
                <div className={css.menu}>
                    <div className={css.header}>
	                    <span className={css.titleGroup}>
		                    <span className={css.dotDoLuong}></span>
		                        ĐO LƯỜNG & KIỂM SOÁT
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
                    {isShowChiSoKinhDoanh && (
                        <div className={css.subItems}>
                            {strategicItems.length > 0 ? strategicItems.filter((subItem) => subItem.duyet).map((subItem, idx) => (
                                <Dropdown
                                    key={idx}
                                    trigger={['contextMenu']}  // Chỉ hiển thị dropdown khi chuột phải
                                    menu={{
                                        items: contextMenuItems,
                                        onClick: ({ key }) => {
                                            if (key === '1') {
                                                setSelectedFile(subItem);
                                                setNewFileName(subItem.name);
                                                setIsRenameModalVisible(true);
                                            }
                                        },
                                    }}
                                >
                                    <div
                                        key={subItem.id}
                                        className={`${css.subTab} ${subItem.id == idHopKH ? css.active : ''}`}
                                        onClick={(e) => handleSubItemClick(subItem)}  // Bấm vào để chuyển trang
                                        onContextMenu={(e) => handleContextMenu(e, subItem)}  // Bấm chuột phải để mở context menu
                                    >
                                        {subItem.name}
                                    </div>
                                </Dropdown>
                            )) : (
                                <div className={css.noItems}>Không có mục nào được hiển thị.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {isKHKDTongHopModalOpen && <CreateHopKH khkdTongHopForm={khkdTongHopForm}
                                                    isKHKDTongHopModalOpen={isKHKDTongHopModalOpen}
                                                    setIsKHKDTongHopModalOpen={setIsKHKDTongHopModalOpen}
                                                    fetchData={fetchData}
                                                    title={'Tạo bản kết quả kinh doanh hợp nhất mới'}
                                                    isOnlyTH={true}
                                                    duyet={true}
            />
            }
            <Modal
                title='Đổi tên'
                open={isRenameModalVisible}
                onOk={handleRename}
                onCancel={() => {
                    setIsRenameModalVisible(false);
                }}
                okText='Lưu'
                cancelText='Hủy'
            >
                <Input
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder='Nhập tên mới'
                />
            </Modal>
        </div>
    );
};
