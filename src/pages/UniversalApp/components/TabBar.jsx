/**
 * TabBar Component
 * 
 * A browser-like tab interface that allows users to:
 * - Create new tabs with custom titles
 * - Switch between tabs (active state managed locally)
 * - Rename tabs via right-click context menu
 * - Delete tabs with confirmation
 * - Manage tab CRUD operations through processTabService
 * 
 * Features:
 * - Editable tabs with add/remove functionality
 * - Tab persistence through API service (CRUD operations)
 * - Local active tab state management
 * - Right-click context menu for tab actions
 * - Responsive design with proper styling
 * - Confirmation dialogs for destructive actions
 */
import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, message, Dropdown } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { 
  getAllProcessTabs, 
  createProcessTab, 
  updateProcessTab, 
  deleteProcessTab
} from '../../../apis/processTabService';
import styles from './TabBar.module.css';

const TabBar = ({ onTabChange, activeTabId, shouldAutoSelect = true, currentUser }) => {
  console.log('🏗️ TabBar component props:', { onTabChange: !!onTabChange, activeTabId });
  
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [editingTab, setEditingTab] = useState(null);
  const [form] = Form.useForm();
  const [renameForm] = Form.useForm();

  // Fetch tabs on component mount
  useEffect(() => {
    fetchTabs();
  }, []);

  const fetchTabs = async () => {
    console.log('📋 TabBar fetchTabs called');
    try {
      setLoading(true);
      const tabsData = await getAllProcessTabs();
      console.log('📋 Fetched tabs data:', tabsData);
      console.log('📋 Tabs with show property:', tabsData.map(tab => ({ id: tab.id, title: tab.title, show: tab.show })));
      
      // Determine order using description as numeric position; assign incremental if missing
      let maxOrder = 0;
      const normalized = tabsData.map(t => {
        const orderNum = Number.parseInt(t.description);
        if (!Number.isNaN(orderNum)) {
          maxOrder = Math.max(maxOrder, orderNum);
          return { ...t, description: String(orderNum) };
        }
        return t;
      }).map(t => {
        if (t.description === undefined || t.description === null || Number.isNaN(Number.parseInt(t.description))) {
          maxOrder += 1;
          return { ...t, description: String(maxOrder) };
        }
        return t;
      });
      
      // Sort tabs by description (ascending)
      const sortedTabs = normalized.sort((a, b) => (Number.parseInt(a.description) || 0) - (Number.parseInt(b.description) || 0));
      
      setTabs(sortedTabs);
      console.log('📋 Tabs state updated and sorted by id');
      
      // Auto-select the first tab (oldest one) if no tab is currently selected
      // Only do this if shouldAutoSelect is true
      if (sortedTabs.length > 0 && !activeTabId && shouldAutoSelect) {
        const firstTab = sortedTabs[0];
        console.log('🔄 Auto-selecting first tab:', firstTab);
        handleTabChange(firstTab);
      }
    } catch (error) {
      console.error('❌ Error fetching tabs:', error);
      message.error('Không thể tải danh sách tab');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTab = async (values) => {
    try {
      // Determine next order based on current tabs' description
      const nextOrder = tabs.length > 0 ? Math.max(...tabs.map(t => Number.parseInt(t.description) || 0)) + 1 : 1;
      const newTab = await createProcessTab({
        title: values.title,
        description: String(nextOrder),
        url: '',
        isActive: false
      });
      
      // Add new tab and maintain sorted order by id
      setTabs(prev => {
        const updatedTabs = [...prev, newTab];
        return updatedTabs.sort((a, b) => (Number.parseInt(a.description) || 0) - (Number.parseInt(b.description) || 0));
      });
      
      setIsCreateModalVisible(false);
      form.resetFields();
      message.success('Tạo tab mới thành công');
      
      // Set the new tab as active
      await handleTabChange(newTab);
    } catch (error) {
      console.error('Error creating tab:', error);
      message.error('Không thể tạo tab mới');
    }
  };

  const handleRenameTab = async (values) => {
    try {
      await updateProcessTab({
        id: editingTab.id,
        title: values.title
      });
      
      setTabs(prev => prev.map(tab => 
        tab.id === editingTab.id 
          ? { ...tab, title: values.title }
          : tab
      ));
      
      setIsRenameModalVisible(false);
      setEditingTab(null);
      renameForm.resetFields();
      message.success('Đổi tên tab thành công');
    } catch (error) {
      console.error('Error renaming tab:', error);
      message.error('Không thể đổi tên tab');
    }
  };

  const handleDeleteTab = async (tabId) => {
    try {
      await deleteProcessTab(tabId);
      setTabs(prev => prev.filter(tab => tab.id !== tabId));
      message.success('Xóa tab thành công');
    } catch (error) {
      console.error('Error deleting tab:', error);
      message.error('Không thể xóa tab');
    }
  };

  const handleTabChange = async (tab) => {
    console.log('🔍 TabBar handleTabChange called with tab:', tab);
    console.log('🔍 Available tabs:', tabs);
    
    if (onTabChange && tab) {
      console.log('🔍 Calling onTabChange with tab:', tab);
      onTabChange(tab);
    } else {
      console.log('🔍 onTabChange not called - onTabChange:', !!onTabChange, 'tab:', !!tab);
    }
  };

  // Move tab position left/right by swapping description values
  const moveTab = async (tab, direction) => {
    try {
      if (!tab) return;
      // Work only with visible tabs for ordering operations
      const visibleTabs = tabs
        .filter(t => t.show !== false)
        .sort((a, b) => (Number.parseInt(a.description) || 0) - (Number.parseInt(b.description) || 0));

      const currentIndex = visibleTabs.findIndex(t => t.id === tab.id);
      if (currentIndex === -1) return;
      const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= visibleTabs.length) return;
      const targetTab = visibleTabs[targetIndex];

      const aOrder = Number.parseInt(tab.description) || currentIndex + 1;
      const bOrder = Number.parseInt(targetTab.description) || targetIndex + 1;

      // Optimistically update UI
      const newTabs = tabs.map(t => {
        if (t.id === tab.id) return { ...t, description: String(bOrder) };
        if (t.id === targetTab.id) return { ...t, description: String(aOrder) };
        return t;
      });
      const resorted = newTabs.sort((x, y) => (Number.parseInt(x.description) || 0) - (Number.parseInt(y.description) || 0));
      setTabs(resorted);

      // Persist both tabs
      await Promise.all([
        updateProcessTab({ id: tab.id, title: tab.title, description: String(bOrder), url: tab.url, show: tab.show, isActive: tab.isActive, metadata: tab.metadata }),
        updateProcessTab({ id: targetTab.id, title: targetTab.title, description: String(aOrder), url: targetTab.url, show: targetTab.show, isActive: targetTab.isActive, metadata: targetTab.metadata })
      ]);
    } catch (error) {
      console.error('❌ Error moving tab:', error);
      message.error('Không thể đổi vị trí tab');
      // Reload to recover state
      fetchTabs();
    }
  };

  const showRenameModal = (tab) => {
    console.log('✏️ Opening rename modal for tab:', tab);
    setEditingTab(tab);
    renameForm.setFieldsValue({ title: tab.title });
    setIsRenameModalVisible(true);
  };


  return (
    <div className={styles.tabBar}>
      <div className={styles.customTabs}>
        {tabs.filter(tab => {
          const shouldShow = tab.show !== false;
          if (!shouldShow) {
            console.log('📋 Hiding tab with show: false:', tab);
          }
          return shouldShow;
        }).map(tab => (
          <div
            key={tab.id}
            className={`${styles.customTab} ${activeTabId === tab.id ? styles.activeTab : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            <Dropdown
              menu={{
                items: currentUser?.isSuperAdmin ? [
                  {
                    key: 'rename',
                    label: 'Đổi tên',
                    icon: <EditOutlined />,
                    onClick: () => {
                      console.log('🖱️ Context menu: Rename clicked for tab:', tab);
                      showRenameModal(tab);
                    }
                  },
                  {
                    key: 'move-left',
                    label: 'Di chuyển sang trái',
                    icon: <LeftOutlined />,
                    onClick: () => moveTab(tab, 'left')
                  },
                  {
                    key: 'move-right',
                    label: 'Di chuyển sang phải',
                    icon: <RightOutlined />,
                    onClick: () => moveTab(tab, 'right')
                  },
                  {
                    key: 'delete',
                    label: 'Xoá',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => {
                      console.log('🖱️ Context menu: Delete clicked for tab:', tab);
                      Modal.confirm({
                        title: 'Xác nhận xóa tab',
                        content: `Bạn có chắc chắn muốn xóa tab "${tab.title}"?`,
                        onOk: () => handleDeleteTab(tab.id),
                      });
                    }
                  }
                ] : []
              }}
              trigger={['contextMenu']}
            >
              <div className={styles.tabContent}>
                <span className={styles.tabTitle}>
                  {tab.title}
                </span>
                {currentUser?.isSuperAdmin && (
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    className={styles.closeButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      Modal.confirm({
                        title: 'Xác nhận xóa tab',
                        content: `Bạn có chắc chắn muốn xóa tab "${tab.title}"?`,
                        onOk: () => handleDeleteTab(tab.id),
                      });
                    }}
                  />
                )}
              </div>
            </Dropdown>
          </div>
        ))}
        
        {/* Add Tab Button */}
        {currentUser?.isSuperAdmin && (
          <div className={styles.addTabButton} onClick={() => setIsCreateModalVisible(true)}>
            <PlusOutlined />
          </div>
        )}
      </div>

      {/* Create Tab Modal */}
      <Modal
        title="Tạo tab mới"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTab}
        >
          <Form.Item
            name="title"
            label="Tên tab"
            rules={[{ required: true, message: 'Vui lòng nhập tên tab' }]}
          >
            <Input placeholder="Nhập tên tab" />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setIsCreateModalVisible(false);
                form.resetFields();
              }}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Tạo tab
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Rename Tab Modal */}
      <Modal
        title="Đổi tên tab"
        open={isRenameModalVisible}
        onCancel={() => {
          setIsRenameModalVisible(false);
          setEditingTab(null);
          renameForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={renameForm}
          layout="vertical"
          onFinish={handleRenameTab}
        >
          <Form.Item
            name="title"
            label="Tên tab"
            rules={[{ required: true, message: 'Vui lòng nhập tên tab' }]}
          >
            <Input placeholder="Nhập tên tab" />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setIsRenameModalVisible(false);
                setEditingTab(null);
                renameForm.resetFields();
              }}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Lưu
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TabBar;
