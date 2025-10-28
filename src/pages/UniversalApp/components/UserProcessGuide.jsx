import React, { useState, useEffect } from 'react';
import { Modal, Radio, Select, Button, message, Table, Input, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import { getAllUser } from '../../../apis/userService';
import { updateProcessItem } from '../../../apis/processItemService';
import { getAllUserClass, createUserClass, updateUserClass, deleteUserClass } from '../../../apis/userClassService';
import styles from './UserProcessGuide.module.css';

const { Option } = Select;

const UserProcessGuide = ({ 
  visible, 
  onCancel, 
  processItem, 
  onSave,
  isUserClassManagement = false
}) => {
  const [privacyType, setPrivacyType] = useState('public');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUserClassesForPrivacy, setSelectedUserClassesForPrivacy] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // User class management state
  const [userClasses, setUserClasses] = useState([]);
  const [selectedUserClass, setSelectedUserClass] = useState(null);
  const [isCreatingUserClass, setIsCreatingUserClass] = useState(false);
  const [newUserClassName, setNewUserClassName] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsersForClass, setSelectedUsersForClass] = useState([]);

  useEffect(() => {
    if (visible) {
      if (isUserClassManagement) {
        fetchUserClasses();
        fetchUsers();
      } else {
        fetchUsers();
        fetchUserClasses(); // Also fetch user classes for privacy settings
        // Initialize with process item's current privacy settings if available
        if (processItem) {
          // Check if users column has data
          if (processItem.users && Array.isArray(processItem.users) && processItem.users.length > 0) {
            // Check if it's a user class ID (starts with 'userclass_')
            const firstUser = processItem.users[0];
            if (typeof firstUser === 'string' && firstUser.startsWith('userclass_')) {
              // It's a user class restriction
              setPrivacyType('userClass');
              setSelectedUsers([]);
              // We'll set the user class in the second useEffect after userClasses are loaded
            } else {
              // It's individual user restriction
              setPrivacyType('private');
              setSelectedUsers(processItem.users);
              setSelectedUserClassesForPrivacy([]);
            }
          } else {
            // No users data, set to public
            setPrivacyType('public');
            setSelectedUsers([]);
            setSelectedUserClassesForPrivacy([]);
          }
        }
      }
    }
  }, [visible, processItem, isUserClassManagement]);

  // Separate useEffect to handle user class initialization after userClasses are loaded
  useEffect(() => {
    if (visible && !isUserClassManagement && processItem && userClasses.length > 0) {
      // Check if users column contains user class IDs
      if (processItem.users && Array.isArray(processItem.users) && processItem.users.length > 0) {
        const firstUser = processItem.users[0];
        if (typeof firstUser === 'string' && firstUser.startsWith('userclass_')) {
          // Find all user classes by their IDs
          const userClassObjects = processItem.users
            .filter(userId => typeof userId === 'string' && userId.startsWith('userclass_'))
            .map(userClassId => userClasses.find(uc => uc.id === userClassId))
            .filter(Boolean); // Remove any undefined values
          
          setSelectedUserClassesForPrivacy(userClassObjects);
          setSelectedUsers([]);
        }
      }
    }
  }, [visible, processItem, userClasses, isUserClassManagement]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUser();
      
      // Handle the API response structure: {code: 'SUCCESS', message: '...', result: Array}
      if (usersData && usersData.result && Array.isArray(usersData.result)) {
        setUsers(usersData.result);
        setAvailableUsers(usersData.result);
      } else if (Array.isArray(usersData)) {
        setUsers(usersData);
        setAvailableUsers(usersData);
      } else if (usersData && Array.isArray(usersData.data)) {
        setUsers(usersData.data);
        setAvailableUsers(usersData.data);
      } else if (usersData && Array.isArray(usersData.users)) {
        setUsers(usersData.users);
        setAvailableUsers(usersData.users);
      } else {
        console.warn('Unexpected users data structure:', usersData);
        setUsers([]);
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Không thể tải danh sách người dùng');
      setUsers([]);
      setAvailableUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserClasses = async () => {
    try {
      setLoading(true);
      const userClassesData = await getAllUserClass();
      
      // Filter for PROCESS_GUIDE module
      let filteredClasses = [];
      if (userClassesData && userClassesData.result && Array.isArray(userClassesData.result)) {
        filteredClasses = userClassesData.result.filter(uc => uc.module === 'PROCESS_GUIDE');
      } else if (Array.isArray(userClassesData)) {
        filteredClasses = userClassesData.filter(uc => uc.module === 'PROCESS_GUIDE');
      } else if (userClassesData && Array.isArray(userClassesData.data)) {
        filteredClasses = userClassesData.data.filter(uc => uc.module === 'PROCESS_GUIDE');
      }
      
      setUserClasses(filteredClasses);
    } catch (error) {
      console.error('Error fetching user classes:', error);
      message.error('Không thể tải danh sách nhóm người dùng');
      setUserClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    let usersToSave = [];
    
    if (privacyType === 'public') {
      // For public documents, clear the users column
      usersToSave = [];
    } else if (privacyType === 'private') {
      usersToSave = selectedUsers;
    } else if (privacyType === 'userClass' && selectedUserClassesForPrivacy.length > 0) {
      // Save the user class IDs to the users column
      usersToSave = selectedUserClassesForPrivacy.map(uc => uc.id);
    }
    
    const privacySettings = {
      allowedUsers: usersToSave
    };
    
    onSave(processItem.id, privacySettings);
    onCancel();
  };

  // Cleanup function to remove orphaned user class references
  const handleCleanupOrphanedReferences = () => {
    if (!processItem || !processItem.users) return;
    
    // Filter out orphaned user class references
    const validUserClasses = processItem.users.filter(userId => {
      if (typeof userId === 'string' && userId.startsWith('userclass_')) {
        return userClasses.find(uc => uc.id === userId);
      }
      return true; // Keep non-userclass references (individual emails)
    });
    
    // Update the selected user classes to only include valid ones
    const validSelectedClasses = selectedUserClassesForPrivacy.filter(uc => 
      userClasses.find(existingUc => existingUc.id === uc.id)
    );
    
    setSelectedUserClassesForPrivacy(validSelectedClasses);
    
    // Show success message
    message.success('Đã dọn dẹp các tham chiếu nhóm người dùng không hợp lệ');
  };

  const handleCancel = () => {
    setPrivacyType('public');
    setSelectedUsers([]);
    setSelectedUserClassesForPrivacy([]);
    onCancel();
  };

  // Helper function to check if user class is being used
  const checkUserClassUsage = async (userClassId) => {
    try {
      // This would need to be implemented with an API call to check processItems
      // For now, we'll return an empty array as a placeholder
      // In a real implementation, you'd call an API like: getProcessItemsByUserClass(userClassId)
      return [];
    } catch (error) {
      console.error('Error checking user class usage:', error);
      return [];
    }
  };

  // Helper function to show deletion confirmation
  const showDeleteConfirmation = async (userClassId, affectedProcessItems) => {
    return new Promise((resolve) => {
      Modal.confirm({
        title: 'Xác nhận xóa nhóm người dùng',
        content: (
          <div>
            <p>Nhóm người dùng này đang được sử dụng bởi {affectedProcessItems.length} tài liệu:</p>
            <ul style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {affectedProcessItems.map(item => (
                <li key={item.id}>{item.text || item.title}</li>
              ))}
            </ul>
            <p style={{ color: '#ff4d4f', marginTop: '10px' }}>
              <strong>Cảnh báo:</strong> Xóa nhóm này sẽ làm mất quyền truy cập của người dùng vào các tài liệu trên.
            </p>
            <p>Bạn có chắc chắn muốn tiếp tục?</p>
          </div>
        ),
        okText: 'Xóa',
        cancelText: 'Hủy',
        okType: 'danger',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  };

  // User class management functions
  const handleCreateUserClass = async () => {
    if (!newUserClassName.trim()) {
      message.error('Vui lòng nhập tên nhóm người dùng');
      return;
    }

    try {
      setLoading(true);
      // Generate a unique ID for the new user class
      const newId = `userclass_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newUserClass = {
        id: newId,
        name: newUserClassName.trim(),
        module: 'PROCESS_GUIDE',
        company: 'default', // You might want to get this from context
        userAccess: [],
        chainAccess: {},
        templateAccess: {},
        stepAccess: {},
        subStepAccess: {},
        progressTaskAccess: {},
        reportChart: {},
        reportChartGroup: {},
        info: {}
      };

      await createUserClass(newUserClass);
      message.success('Tạo nhóm người dùng thành công!');
      setNewUserClassName('');
      setIsCreatingUserClass(false);
      fetchUserClasses();
    } catch (error) {
      console.error('Error creating user class:', error);
      message.error('Không thể tạo nhóm người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUserClass = async (userClassId) => {
    try {
      setLoading(true);
      
      // Check if this user class is being used by any processItems
      const affectedProcessItems = await checkUserClassUsage(userClassId);
      
      if (affectedProcessItems.length > 0) {
        // Show warning and ask for confirmation
        const confirmed = await showDeleteConfirmation(userClassId, affectedProcessItems);
        if (!confirmed) {
          return;
        }
      }
      
      await deleteUserClass(userClassId);
      message.success('Xóa nhóm người dùng thành công!');
      fetchUserClasses();
      if (selectedUserClass && selectedUserClass.id === userClassId) {
        setSelectedUserClass(null);
        setSelectedUsersForClass([]);
      }
    } catch (error) {
      console.error('Error deleting user class:', error);
      message.error('Không thể xóa nhóm người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUserClass = (userClass) => {
    setSelectedUserClass(userClass);
    // Load users already in this class
    if (userClass.userAccess && Array.isArray(userClass.userAccess)) {
      setSelectedUsersForClass(userClass.userAccess);
    } else {
      setSelectedUsersForClass([]);
    }
  };

  const handleAddUsersToClass = async () => {
    if (!selectedUserClass) {
      message.error('Vui lòng chọn nhóm người dùng');
      return;
    }

    if (selectedUsersForClass.length === 0) {
      message.error('Vui lòng chọn ít nhất một người dùng');
      return;
    }

    try {
      setLoading(true);
      const updatedUserClass = {
        ...selectedUserClass,
        userAccess: selectedUsersForClass
      };

      await updateUserClass(selectedUserClass.id, updatedUserClass);
      message.success('Cập nhật thành viên nhóm thành công!');
      fetchUserClasses();
    } catch (error) {
      console.error('Error updating user class:', error);
      message.error('Không thể cập nhật thành viên nhóm');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClassCancel = () => {
    setSelectedUserClass(null);
    setSelectedUsersForClass([]);
    setNewUserClassName('');
    setIsCreatingUserClass(false);
    onCancel();
  };

  // Table columns for user classes
  const userClassColumns = [
    {
      title: 'Tên nhóm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Thành viên',
      key: 'members',
      render: (_, record) => {
        const memberCount = Array.isArray(record.userAccess) ? record.userAccess.length : 0;
        return `${memberCount} thành viên`;
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleSelectUserClass(record)}
            size="small"
          >
            Chọn
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa nhóm này?"
            onConfirm={() => handleDeleteUserClass(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isUserClassManagement) {
    return (
      <Modal
        title="Quản lý nhóm người dùng"
        open={visible}
        onCancel={handleUserClassCancel}
        footer={null}
        width={1200}
        className={styles.modal}
      >
        <div className={styles.userClassManagement}>
          <div className={styles.tablesContainer}>
            {/* First table - User Classes */}
            <div className={styles.userClassTable}>
              <div className={styles.tableHeader}>
                <h4>Danh sách nhóm người dùng</h4>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreatingUserClass(true)}
                  size="small"
                >
                  Tạo nhóm mới
                </Button>
              </div>
              
              {isCreatingUserClass && (
                <div className={styles.createUserClassForm}>
                  <Input
                    placeholder="Nhập tên nhóm người dùng"
                    value={newUserClassName}
                    onChange={(e) => setNewUserClassName(e.target.value)}
                    onPressEnter={handleCreateUserClass}
                    style={{ marginBottom: '8px' }}
                  />
                  <Space>
                    <Button
                      type="primary"
                      onClick={handleCreateUserClass}
                      loading={loading}
                      size="small"
                    >
                      Tạo
                    </Button>
                    <Button
                      onClick={() => {
                        setIsCreatingUserClass(false);
                        setNewUserClassName('');
                      }}
                      size="small"
                    >
                      Hủy
                    </Button>
                  </Space>
                </div>
              )}
              
              <Table
                columns={userClassColumns}
                dataSource={userClasses}
                rowKey="id"
                size="small"
                pagination={false}
                loading={loading}
                rowSelection={{
                  type: 'radio',
                  selectedRowKeys: selectedUserClass ? [selectedUserClass.id] : [],
                  onSelect: (record) => handleSelectUserClass(record),
                }}
              />
            </div>

            {/* Second table - User Assignment */}
            <div className={styles.userAssignmentTable}>
              <div className={styles.tableHeader}>
                <h4>
                  {selectedUserClass 
                    ? `Thành viên nhóm: ${selectedUserClass.name}`
                    : 'Chọn nhóm để quản lý thành viên'
                  }
                </h4>
                {selectedUserClass && (
                  <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={handleAddUsersToClass}
                    loading={loading}
                    size="small"
                  >
                    Cập nhật thành viên
                  </Button>
                )}
              </div>
              
              {selectedUserClass && (
                <Select
                  mode="multiple"
                  placeholder="Chọn người dùng để thêm vào nhóm..."
                  value={selectedUsersForClass}
                  onChange={setSelectedUsersForClass}
                  style={{ width: '100%', marginBottom: '16px' }}
                  loading={loading}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {availableUsers.map(user => (
                    <Option key={user.email || user.id} value={user.email || user.id}>
                      {user.email || user.name || user.username}
                    </Option>
                  ))}
                </Select>
              )}
              
              {selectedUserClass && selectedUsersForClass.length > 0 && (
                <div className={styles.selectedCount}>
                  Đã chọn {selectedUsersForClass.length} người dùng
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Chỉnh sửa quyền riêng tư"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Hủy
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Lưu
        </Button>
      ]}
      width={500}
      className={styles.modal}
    >
      <div className={styles.content}>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Quyền truy cập</h4>
          <Radio.Group 
            value={privacyType} 
            onChange={(e) => setPrivacyType(e.target.value)}
            className={styles.radioGroup}
          >
            <Radio value="public" className={styles.radioOption}>
              <div className={styles.radioContent}>
                <div className={styles.radioTitle}>Công khai</div>
                <div className={styles.radioDescription}>
                  Tất cả người dùng có thể xem quy trình này
                </div>
              </div>
            </Radio>
            <Radio value="userClass" className={styles.radioOption}>
              <div className={styles.radioContent}>
                <div className={styles.radioTitle}>Riêng tư với nhóm người dùng</div>
                <div className={styles.radioDescription}>
                  Chỉ những người dùng trong nhóm được chọn mới có thể xem quy trình này
                </div>
              </div>
            </Radio>
          </Radio.Group>
        </div>

        {privacyType === 'userClass' && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Chọn nhóm người dùng</h4>
            <Select
              mode="multiple"
              placeholder="Chọn nhóm người dùng..."
              value={selectedUserClassesForPrivacy.map(uc => uc.id)}
              onChange={(values) => {
                const selectedClasses = userClasses.filter(uc => values.includes(uc.id));
                setSelectedUserClassesForPrivacy(selectedClasses);
              }}
              style={{ width: '100%' }}
              loading={loading}
              className={styles.userSelect}
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {Array.isArray(userClasses) && userClasses.map(userClass => (
                <Option key={userClass.id} value={userClass.id}>
                  {userClass.name} ({Array.isArray(userClass.userAccess) ? userClass.userAccess.length : 0} thành viên)
                </Option>
              ))}
            </Select>
            {selectedUserClassesForPrivacy.length > 0 && (
              <div className={styles.selectedCount}>
                Đã chọn {selectedUserClassesForPrivacy.length} nhóm: {selectedUserClassesForPrivacy.map(uc => uc.name).join(', ')}
              </div>
            )}
            
            {/* Show warning for orphaned user class references */}
            {processItem && processItem.users && processItem.users.some(userId => 
              typeof userId === 'string' && userId.startsWith('userclass_') && 
              !userClasses.find(uc => uc.id === userId)
            ) && (
              <div style={{ 
                marginTop: '10px', 
                padding: '8px 12px', 
                backgroundColor: '#fff7e6', 
                border: '1px solid #ffd591', 
                borderRadius: '4px',
                color: '#d46b08'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>⚠️ Cảnh báo:</strong> Một số nhóm người dùng đã bị xóa nhưng vẫn được tham chiếu trong tài liệu này.
                </div>
                <Button 
                  size="small" 
                  type="primary" 
                  onClick={handleCleanupOrphanedReferences}
                  style={{ backgroundColor: '#d46b08', borderColor: '#d46b08' }}
                >
                  Dọn dẹp tham chiếu
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UserProcessGuide;
