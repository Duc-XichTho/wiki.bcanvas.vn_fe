import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Form, Card, Space, message } from 'antd';
import { Mail, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { getSettingByType, updateSetting } from '../../../../../apis/settingService.jsx';
import { v4 as uuidv4 } from 'uuid';

const SenderManagementModal = ({
  showSenderModal,
  onClose,
}) => {
  const [senders, setSenders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSender, setEditingSender] = useState(null);
  const [editingEmail, setEditingEmail] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form] = Form.useForm();
  const [settingId, setSettingId] = useState(null);
  const [showPassword, setShowPassword] = useState({});

  // Load senders from setting
  const loadSenders = async () => {
    try {
      setLoading(true);
      const data = await getSettingByType('EMAIL_SENDERS');
      if (data) {
        setSenders(data?.setting || []);
        setSettingId(data.id);
      }
    } catch (error) {
      console.error('Lỗi khi tải senders:', error);
      message.error('Không thể tải danh sách sender');
    } finally {
      setLoading(false);
    }
  };

  // Load senders when modal opens
  useEffect(() => {
    if (showSenderModal) {
      loadSenders();
    }
  }, [showSenderModal]);

  // Save sender
  const handleSaveSender = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const newSender = {
        id: editingSender?.id || uuidv4(),
        email: values.email,
        app_password: values.app_password,
        
      };

      let updatedSenders;
      if (editingSender) {
        // Update existing sender
        updatedSenders = senders.map(sender => 
          sender.id === editingSender.id ? newSender : sender
        );
      } else {
        // Add new sender
        updatedSenders = [...senders, newSender];
      }

      await updateSetting({
        id: settingId,
        type: 'EMAIL_SENDERS',
        setting: updatedSenders
      });

      setSenders(updatedSenders);
      setShowForm(false);
      setEditingSender(null);
      form.resetFields();
      message.success(editingSender ? 'Cập nhật sender thành công!' : 'Thêm sender thành công!');
    } catch (error) {
      console.error('Lỗi khi lưu sender:', error);
      message.error('Lỗi khi lưu sender. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  // Start inline editing
  const handleStartEdit = (sender) => {
    setEditingSender(sender);
    setEditingEmail(sender.email);
    form.setFieldsValue({
      email: sender.email,
      app_password: sender.app_password
    });
    setShowForm(true);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (senderId) => {
    setShowPassword(prev => ({
      ...prev,
      [senderId]: !prev[senderId]
    }));
  };

  // Save inline edit
  const handleSaveEdit = async () => {
    if (!editingEmail.trim()) {
      message.error('Email không được để trống!');
      return;
    }

    try {
      setSaving(true);
      const updatedSender = {
        ...editingSender,
        email: editingEmail,
      };

      const updatedSenders = senders.map(sender => 
        sender.id === editingSender.id ? updatedSender : sender
      );

      await updateSetting({
        id: settingId,
        type: 'EMAIL_SENDERS',
        setting: updatedSenders
      });

      setSenders(updatedSenders);
      setEditingSender(null);
      setEditingEmail('');
      message.success('Cập nhật sender thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật sender:', error);
      message.error('Lỗi khi cập nhật sender. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  // Cancel inline edit
  const handleCancelEdit = () => {
    setEditingSender(null);
    setEditingEmail('');
  };

  // Delete sender
  const handleDeleteSender = async (senderId) => {
    try {
      const updatedSenders = senders.filter(sender => sender.id !== senderId);
      
      await updateSetting({
        id: settingId,
        type: 'EMAIL_SENDERS',
        setting: updatedSenders
      });

      setSenders(updatedSenders);
      message.success('Xóa sender thành công!');
    } catch (error) {
      console.error('Lỗi khi xóa sender:', error);
      message.error('Lỗi khi xóa sender. Vui lòng thử lại.');
    }
  };

  // Cancel form
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingSender(null);
    form.resetFields();
  };

  return (
    <Modal
      title={
        <Space>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={20} style={{ color: '#1890ff' }} />
          Quản lý Email Sender ({senders.length})
        </div>
           <Button
           icon={<Plus size={16} />}
           onClick={() => setShowForm(true)}
           size="small"
        
         >
           Thêm Sender
         </Button>
         </Space>
      }
      open={showSenderModal}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
      bodyStyle={{ 
        maxHeight: '70vh', 
        overflowY: 'auto',
        padding: '24px'
      }}
    >
      {/* Sender Form */}
      {showForm && (
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} style={{ color: '#1890ff' }} />
              {editingSender ? 'Chỉnh sửa Sender' : 'Thêm Sender mới'}
            </div>
          } 
          style={{ 
            marginBottom: '20px',
            border: '1px solid #e8f4fd',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveSender}
            style={{ marginTop: '16px' }}
          >
            <Form.Item
              name="email"
              label={
                <span style={{ fontWeight: '500', color: '#333' }}>
                  Email Gmail
                </span>
              }
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input 
                placeholder="example@gmail.com" 
                size="large"
                style={{ borderRadius: '6px' }}
              />
            </Form.Item>

            <Form.Item
              name="app_password"
              label={
                <span style={{ fontWeight: '500', color: '#333' }}>
                  App Password
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng nhập app password!' }]}
            >
              <Input.Password 
                placeholder="Nhập app password từ Gmail" 
                size="large"
                style={{ borderRadius: '6px' }}
              />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <Button 
                onClick={handleCancelForm}
                size="large"
                style={{ borderRadius: '6px' }}
              >
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={saving}
                size="large"
                style={{ borderRadius: '6px' }}
              >
                {editingSender ? 'Cập nhật' : 'Thêm'}
              </Button>
            </div>
          </Form>
        </Card>
      )}

      {/* Senders List */}
      <div>
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: '#666',
            fontSize: '16px'
          }}>
            <div style={{ marginBottom: '12px' }}>⏳</div>
            Đang tải danh sách sender...
          </div>
        ) : senders.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#666',
            fontSize: '16px'
          }}>
            <div style={{ marginBottom: '12px', fontSize: '48px' }}>📧</div>
            <div style={{ marginBottom: '8px', fontWeight: '500' }}>Chưa có sender nào</div>
            <div style={{ fontSize: '14px' }}>Hãy thêm sender đầu tiên để bắt đầu!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {senders.map((sender) => (
              <Card
                key={sender.id}
                style={{
                  border: '1px solid #e8f4fd',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                hoverable
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      backgroundColor: '#e6f7ff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '2px solid #91d5ff'
                    }}>
                      <Mail size={18} style={{ color: '#1890ff' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                     
                        <div>
                          <div style={{ 
                            color: '#333', 
                            fontSize: '16px', 
                            fontWeight: '500', 
                            marginBottom: '2px' 
                          }}>
                            {sender.email}
                          </div>
                          <div style={{ 
                            color: '#666', 
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>🔑 App Password: {showPassword[sender.id] ? sender.app_password : '••••••••'}</span>
                            <Button
                              type="link"
                              size="small"
                              icon={showPassword[sender.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                              onClick={() => togglePasswordVisibility(sender.id)}
                              style={{ padding: '0 4px', height: 'auto' }}
                            />
                          </div>
                        </div>
                    </div>
                  </div>
                  {!(editingSender && editingSender.id === sender.id) && (
                    <Space>
                      <Button
                        size="small"
                        icon={<Edit size={14} />}
                        onClick={() => handleStartEdit(sender)}
                        style={{ 
                          borderRadius: '6px',
                          borderColor: '#1890ff',
                          color: '#1890ff'
                        }}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<Trash2 size={14} />}
                        onClick={() => handleDeleteSender(sender.id)}
                        style={{ borderRadius: '6px' }}
                      >
                        Xóa
                      </Button>
                    </Space>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SenderManagementModal;
