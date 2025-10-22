import React, { useState, useEffect } from 'react';
import { Modal, Button, List, message } from 'antd';
import { DragOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import styles from './ToolReorderModal.module.css';

const ToolReorderModal = ({ isOpen, onClose, tools, onSave }) => {
  const [reorderTools, setReorderTools] = useState([]);
  const [loading, setLoading] = useState(false);



  useEffect(() => {
    if (isOpen && tools) {
      // Sắp xếp tools theo order hiện tại
      const sortedTools = [...tools].sort((a, b) => (a.order || 0) - (b.order || 0));
      setReorderTools(sortedTools.filter(tool => tool.id !== 'process-guide'));
    }
  }, [isOpen, tools]);

  const handleMoveUp = (index) => {
    if (index > 0) {
      const newTools = [...reorderTools];
      [newTools[index], newTools[index - 1]] = [newTools[index - 1], newTools[index]];
      setReorderTools(newTools);
    }
  };

  const handleMoveDown = (index) => {
    if (index < reorderTools.length - 1) {
      const newTools = [...reorderTools];
      [newTools[index], newTools[index + 1]] = [newTools[index + 1], newTools[index]];
      setReorderTools(newTools);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Cập nhật order cho tất cả tools
      const updatedTools = reorderTools.map((tool, index) => ({
        ...tool,
        order: index
      }));

      await onSave(updatedTools);
      message.success('Đã lưu thứ tự công cụ thành công!');
      onClose();
    } catch (error) {
      console.error('Lỗi khi lưu thứ tự:', error);
      message.error('Có lỗi xảy ra khi lưu thứ tự!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontSize: '16px',
          fontWeight: '600',
          color: '#262626'
        }}>
          <DragOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
          Sắp xếp thứ tự công cụ
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={650}
      footer={[
        <Button key="cancel" onClick={onClose} size="middle">
          Hủy
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          loading={loading} 
          onClick={handleSave}
          size="middle"
        >
          Lưu thứ tự
        </Button>
      ]}
    >
      <div className={styles.reorderContainer}>
        <p className={styles.instruction}>
          Sử dụng các nút mũi tên để di chuyển công cụ lên hoặc xuống trong danh sách.
        </p>
        
        <List
          dataSource={reorderTools}
          renderItem={(tool, index) => (
            <List.Item className={styles.toolItem}>
              <div className={styles.toolContent}>
        
                <div className={styles.toolInfo}>
                  <div className={styles.toolName}>{tool.name || tool.title}</div>
                  <div className={styles.toolDescription}>
                    {tool.description || tool.content1 || 'Không có mô tả'}
                  </div>
                </div>
              </div>
              
              <div className={styles.toolActions}>
                <Button
                  icon={<ArrowUpOutlined />}
                  size="small"
                  disabled={index === 0}
                  onClick={() => handleMoveUp(index)}
                  title="Di chuyển lên"
                />
                <Button
                  icon={<ArrowDownOutlined />}
                  size="small"
                  disabled={index === reorderTools.length - 1}
                  onClick={() => handleMoveDown(index)}
                  title="Di chuyển xuống"
                />
              </div>
            </List.Item>
          )}
        />
      </div>
    </Modal>
  );
};

export default ToolReorderModal;
