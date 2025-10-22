import React, { useEffect, useState, useContext } from 'react';
import { Modal, Table, Button, Input, Space, Popconfirm, message as antdMessage, Select } from 'antd';
import { getSettingByTypeExternal, createOrUpdateSettingByTypeExternal } from '../../../apis/serviceApi/k9Service';
import { MyContext } from '../../../MyContext';

const TemplateSettingModal = ({ visible, onClose, onTemplateUpdate }) => {
  const { currentUser } = useContext(MyContext);
  const [templateList, setTemplateList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState({ visible: false, editing: null });
  const [formState, setFormState] = useState({ label: '', template: '', defaultAdvisor: '' });
  const [advisorList, setAdvisorList] = useState([]);
  const [pipelineList, setPipelineList] = useState([]);

  // Template mặc định
  const defaultTemplates = [
    {
      key: 'stock-news',
      label: 'Tóm tắt tin tức cổ phiếu',
      template: 'Hãy tóm tắt và phân tích những tin tức gần đây liên quan đến cổ phiếu &&&. Đánh giá tác động đến giá cổ phiếu và đưa ra khuyến nghị đầu tư.',
    },
    {
      key: 'sector-analysis',
      label: 'Phân tích ngành và cơ hội',
      template: 'Phân tích tình hình ngành &&& hiện tại, xác định các cơ hội đầu tư tiềm năng và những rủi ro cần lưu ý.',
    },
    {
      key: 'financial-comparison',
      label: 'So sánh tỷ số tài chính',
      template: 'So sánh các tỷ số tài chính chính của &&& trong cùng ngành. Phân tích điểm mạnh, điểm yếu và đưa ra khuyến nghị đầu tư.',
    },
    {
      key: 'valuation-analysis',
      label: 'Phân tích định giá',
      template: 'Thực hiện phân tích định giá cho cổ phiếu &&& sử dụng các phương pháp DCF, P/E, P/B. Đánh giá liệu cổ phiếu có đang được định giá thấp hay cao.',
    },
    {
      key: 'risk-assessment',
      label: 'Đánh giá rủi ro',
      template: 'Đánh giá các rủi ro tiềm ẩn khi đầu tư vào &&&. Đưa ra chiến lược quản lý rủi ro phù hợp.',
    },
  ];

  useEffect(() => {
    if (visible) {
      loadTemplateList();
      loadAdvisorAndPipelineList();
    }
  }, [visible]);

  const loadTemplateList = async () => {
    setLoading(true);
    try {
      const setting = await getSettingByTypeExternal('TEMPLATE_AI_SETTING');
      const allTemplates = setting?.setting || defaultTemplates;
      
      // Lọc template theo user hiện tại: hiển thị template của user hoặc template chung (không có userEmail)
      const userEmail = currentUser?.email || currentUser?.id;
      const filteredTemplates = allTemplates.filter(template => 
        !template.userEmail || template.userEmail === userEmail
      );
      
      setTemplateList(filteredTemplates);
    } catch {
      setTemplateList(defaultTemplates);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplateList = async (newList) => {
    setLoading(true);
    try {
      // Lấy toàn bộ template hiện tại từ server
      const currentSetting = await getSettingByTypeExternal('TEMPLATE_AI_SETTING');
      const allCurrentTemplates = currentSetting?.setting || defaultTemplates;
      
      // Lọc ra các template không phải của user hiện tại
      const userEmail = currentUser?.email || currentUser?.id;
      const otherUserTemplates = allCurrentTemplates.filter(template => 
        template.userEmail && template.userEmail !== userEmail
      );
      
      // Kết hợp template của user hiện tại với template của user khác
      const combinedTemplates = [...otherUserTemplates, ...newList];
      
      await createOrUpdateSettingByTypeExternal({ type: 'TEMPLATE_AI_SETTING', setting: combinedTemplates });
      setTemplateList(newList);
      antdMessage.success('Đã lưu cấu hình Template!');
      if (onTemplateUpdate) {
        onTemplateUpdate(combinedTemplates);
      }
    } catch {
      antdMessage.error('Lỗi khi lưu Template!');
    } finally {
      setLoading(false);
    }
  };

  // Load advisor và pipeline list
  const loadAdvisorAndPipelineList = async () => {
    try {
      const [advisorSetting, pipelineSetting] = await Promise.all([
        getSettingByTypeExternal('ADVISOR_SETTING'),
        getSettingByTypeExternal('AI_PIPELINE_SETTING')
      ]);
      
      setAdvisorList(advisorSetting?.setting || []);
      setPipelineList(pipelineSetting?.setting || []);
    } catch (error) {
      console.error('Error loading advisor/pipeline list:', error);
      setAdvisorList([]);
      setPipelineList([]);
    }
  };

  const handleAdd = () => {
    setFormState({ label: '', template: '', defaultAdvisor: '' });
    setEditModal({ visible: true, editing: null });
  };

  const handleEdit = (record) => {
    setFormState({ 
      label: record.label, 
      template: record.template,
      defaultAdvisor: record.defaultAdvisor || ''
    });
    setEditModal({ visible: true, editing: record });
  };

  const handleDelete = async (key) => {
    const newList = templateList.filter(item => item.key !== key);
    await saveTemplateList(newList);
  };

  const handleSave = async () => {
    if (!formState.label || !formState.template) {
      antdMessage.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const userEmail = currentUser?.email || currentUser?.id;
    let newList;
    
    if (editModal.editing) {
      // Edit - giữ nguyên key cũ và thêm userEmail nếu chưa có
      newList = templateList.map(item =>
        item.key === editModal.editing.key ? { 
          ...item, 
          ...formState,
          userEmail: item.userEmail || userEmail // Giữ userEmail cũ hoặc gán mới nếu chưa có
        } : item
      );
    } else {
      // Add - tự sinh key mới và gắn userEmail
      const newKey = `template-${Date.now()}`;
      newList = [...templateList, { 
        ...formState, 
        key: newKey, 
        userEmail: userEmail 
      }];
    }
    await saveTemplateList(newList);
    setEditModal({ visible: false, editing: null });
  };

  const handleResetToDefault = async () => {
    try {
      await saveTemplateList(defaultTemplates);
      antdMessage.success('Đã khôi phục template mặc định!');
    } catch {
      antdMessage.error('Lỗi khi khôi phục template mặc định!');
    }
  };

  // Lấy tên advisor từ key
  const getAdvisorName = (advisorKey) => {
    if (!advisorKey) return 'Không có';
    
    const advisor = advisorList.find(a => a.key === advisorKey);
    const pipeline = pipelineList.find(p => p.key === advisorKey);
    
    if (advisor) return advisor.name;
    if (pipeline) return `${pipeline.name} (Pipeline)`;
    return advisorKey;
  };

  const columns = [
    { title: 'Tên Template', dataIndex: 'label', width: '20%' },
    { title: 'Nội dung Template', dataIndex: 'template', width: '35%', ellipsis: true, render: val => <span title={val}>{val?.slice(0, 80)}{val && val.length > 80 ? '...' : ''}</span> },
    { 
      title: 'Advisor mặc định', 
      dataIndex: 'defaultAdvisor', 
      width: '15%',
      render: (advisorKey) => (
        <span style={{ 
          color: advisorKey ? '#1890ff' : '#999',
          fontSize: '12px'
        }}>
          {getAdvisorName(advisorKey)}
        </span>
      )
    },
    { 
      title: 'Loại', 
      dataIndex: 'userEmail', 
      width: '10%', 
      render: (userEmail) => (
        <span style={{ 
          color: userEmail ? '#1890ff' : '#52c41a',
          fontWeight: 500,
          fontSize: '12px'
        }}>
          {userEmail ? 'Cá nhân' : 'Chung'}
        </span>
      )
    },
    { title: 'Hành động', dataIndex: 'action', width: '20%', render: (_, record) => (
      <Space>
        <a onClick={() => handleEdit(record)}>Sửa</a>
        <Popconfirm title="Xóa template này?" onConfirm={() => handleDelete(record.key)}><a>Xóa</a></Popconfirm>
      </Space>
    ) },
  ];

  return (
    <Modal
      title="Cài đặt Template"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
    >
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Button type="primary" onClick={handleAdd}>Thêm Template</Button>
        <Button onClick={handleResetToDefault}>Khôi phục mặc định</Button>
      </div>
      <Table
        bordered
        dataSource={templateList.map(item => ({ ...item, key: item.key }))}
        columns={columns}
        rowClassName="editable-row"
        pagination={false}
        loading={loading}
        style={{ marginTop: 8 }}
      />
      {/* Modal add/edit template */}
      <Modal
        title={editModal.editing ? 'Sửa Template' : 'Thêm Template'}
        open={editModal.visible}
        onCancel={() => setEditModal({ visible: false, editing: null })}
        onOk={handleSave}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
        width={600}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Tên Template</div>
            <Input 
              value={formState.label} 
              onChange={e => setFormState(f => ({ ...f, label: e.target.value }))}
              placeholder="vd: Tóm tắt tin tức cổ phiếu"
            />
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Advisor mặc định</div>
            <Select
              value={formState.defaultAdvisor}
              onChange={value => setFormState(f => ({ ...f, defaultAdvisor: value }))}
              placeholder="Chọn advisor mặc định (tùy chọn)"
              style={{ width: '100%' }}
              allowClear
            >
              <Select.OptGroup label="Advisors">
                {advisorList.map(advisor => (
                  <Select.Option key={advisor.key} value={advisor.key}>
                    {advisor.name}
                  </Select.Option>
                ))}
              </Select.OptGroup>
              <Select.OptGroup label="Pipelines">
                {pipelineList.map(pipeline => (
                  <Select.Option key={pipeline.key} value={pipeline.key}>
                    {pipeline.name} (Pipeline)
                  </Select.Option>
                ))}
              </Select.OptGroup>
            </Select>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              Khi chọn template này, advisor sẽ được tự động chuyển sang advisor đã cài đặt
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Nội dung Template</div>
            <Input.TextArea 
              rows={8} 
              value={formState.template} 
              onChange={e => setFormState(f => ({ ...f, template: e.target.value }))}
              placeholder="Nhập nội dung template. Sử dụng &&& để đánh dấu vị trí cần thay thế."
            />
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              Sử dụng &&& để đánh dấu vị trí cần thay thế thông tin
            </div>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default TemplateSettingModal; 