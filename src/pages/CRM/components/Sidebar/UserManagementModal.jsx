import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, List, Avatar, Typography, Space, message, Empty } from 'antd';
import { UserAddOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { getAllUser } from '../../../../apis/userService';
import { updateCustomerItem } from '../../../../apis/customerItemService';

const { Title, Text } = Typography;
const { Option } = Select;

const UserManagementModal = ({
    visible,
    onClose,
    item,
    currentUser,
    onSuccess
}) => {
    const [users, setUsers] = useState([]);
    const [allowedUsers, setAllowedUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addLoading, setAddLoading] = useState(false);


    useEffect(() => {
        if (visible) {
            loadUsers();
            loadAllowedUsers();
        }
    }, [visible, item]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const usersData = await getAllUser();
            if (usersData.code === 'SUCCESS' && usersData.result.length > 0) {
                if (currentUser?.schema) {
                    usersData.result = usersData.result.filter(user => user.schema === currentUser.schema);
                }
                else {
                    usersData.result = usersData.result.filter(user => user.isSuperAdmin === true);
                }
                setUsers(usersData.result);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            message.error('Không thể tải danh sách user');
        } finally {
            setLoading(false);
        }
    };

    const loadAllowedUsers = () => {
        const info = item?.info || {};
        setAllowedUsers(info.allowed_users || []);
    };

    const handleAddUsers = async () => {
        if (!selectedUsers || selectedUsers.length === 0) {
            message.warning('Vui lòng chọn ít nhất một user');
            return;
        }

        // Lọc ra những user chưa được thêm
        const newUsers = selectedUsers.filter(user => !allowedUsers.includes(user));
        
        if (newUsers.length === 0) {
            message.warning('Tất cả user đã được thêm');
            return;
        }

        try {
            setAddLoading(true);
            const newAllowedUsers = [...allowedUsers, ...newUsers];
            const newInfo = {
                ...item.info,
                allowed_users: newAllowedUsers
            };

            await updateCustomerItem({
                id: item.id,
                info: newInfo
            });

            // Cập nhật state local
            setAllowedUsers(newAllowedUsers);
            setSelectedUsers([]);
            
            // Cập nhật lại item.info để đồng bộ
            item.info = newInfo;
            
            message.success(`Thêm thành công ${newUsers.length} user`);

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error adding users:', error);
            message.error('Không thể thêm user');
        } finally {
            setAddLoading(false);
        }
    };

    const handleRemoveUser = async (email) => {
        try {
            const newAllowedUsers = allowedUsers.filter(user => user !== email);
            const newInfo = {
                ...item.info,
                allowed_users: newAllowedUsers
            };

            await updateCustomerItem({
                id: item.id,
                info: newInfo
            });

            // Cập nhật state local
            setAllowedUsers(newAllowedUsers);
            
            // Cập nhật lại item.info để đồng bộ
            item.info = newInfo;
            
            message.success('Xóa user thành công');

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error removing user:', error);
            message.error('Không thể xóa user');
        }
    };


    const getAvailableUsers = () => {
        return users
    };

    const handleSelectChange = (values) => {
        setSelectedUsers(values);
    };

    const getInitials = (email) => {
        return email.charAt(0).toUpperCase();
    };

    return (
        <Modal
            title={
                <Space>
                    <UserOutlined />
                    <span>Quản lý user - {item?.name}</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="close" onClick={onClose}>
                    Đóng
                </Button>
            ]}
            width={600}
            destroyOnClose
        >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Thêm user mới */}
                <div>
                    <Title level={5}>
                        <UserAddOutlined /> Thêm user
                    </Title>
                    <Space.Compact style={{ width: '100%' }}>
                        <Select
                            mode="multiple"
                            placeholder="Chọn user để thêm"
                            value={selectedUsers}
                            onChange={handleSelectChange}
                            style={{ flex: 1 }}
                            loading={loading}
                            showSearch
                            maxTagCount="responsive"
                            listHeight={200}
                            dropdownStyle={{ maxHeight: '200px' }}
                            filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            {getAvailableUsers().map(user => (
                                <Option key={user.email} value={user.email}>
                                    {user.email}
                                </Option>
                            ))}
                        </Select>
                        <Button
                            type="primary"
                            onClick={handleAddUsers}
                            disabled={!selectedUsers || selectedUsers.length === 0}
                            loading={addLoading}
                            icon={<UserAddOutlined />}
                        >
                            Thêm ({selectedUsers.length})
                        </Button>
                    </Space.Compact>
                </div>

                {/* Danh sách user hiện tại */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Title level={5} style={{ margin: 0 }}>
                            <UserOutlined /> Danh sách user được phép truy cập
                        </Title>
                       
                    </div>

                    {allowedUsers.length === 0 ? (
                        <Empty
                            description="Chưa có user nào được thêm"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    ) : (
                        <List
                            key={allowedUsers.length} // Force re-render when length changes
                            dataSource={allowedUsers}
                            style={{
                                maxHeight: '500px',
                                overflowY: 'auto',
                                border: '1px solid #f0f0f0',
                                borderRadius: '6px'
                            }}
                            renderItem={(email) => (
                                <List.Item
                                    actions={[
                                            <Button
                                                key="remove"
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => handleRemoveUser(email)}
                                                title="Xóa user"
                                            />
                                    ].filter(Boolean)}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar
                                                style={{
                                                    backgroundColor: email === currentUser?.email ? '#52c41a' : '#1890ff',
                                                    color: 'white'
                                                }}
                                            >
                                                {getInitials(email)}
                                            </Avatar>
                                        }
                                        title={
                                            <Space>
                                                <Text strong>{email}</Text>
                                                {/* {email === currentUser?.email && (
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        (Chủ sở hữu)
                                                    </Text>
                                                )} */}
                                            </Space>
                                        }
                                        // description={
                                        //     email === currentUser?.email
                                        //         ? "Chủ sở hữu item này"
                                        //         : "Được cấp quyền truy cập"
                                        // }
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </div>
            </Space>
        </Modal>
    );
};

export default UserManagementModal;
