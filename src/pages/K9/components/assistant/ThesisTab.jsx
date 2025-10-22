import React, { useState } from 'react';
import { Input, Button, DatePicker, List, Card, Modal, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from '../../K9.module.css';

const { TextArea } = Input;

const ThesisTab = ({ thesis, setThesis, onAcceptThesis }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingThesis, setEditingThesis] = useState(null);
  const [form, setForm] = useState({
    title: '',
    date: dayjs(),
    content: ''
  });

  const handleCreateNew = () => {
    setForm({
      title: '',
      date: dayjs(),
      content: ''
    });
    setEditingThesis(null);
    setIsModalVisible(true);
  };

  const handleEdit = (thesisItem) => {
    setForm({
      title: thesisItem.title,
      date: dayjs(thesisItem.date),
      content: thesisItem.content
    });
    setEditingThesis(thesisItem);
    setIsModalVisible(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      message.error('Vui lòng nhập tiêu đề thesis');
      return;
    }

    if (!form.content.trim()) {
      message.error('Vui lòng nhập nội dung thesis');
      return;
    }

    const thesisData = {
      id: editingThesis ? editingThesis.id : Date.now().toString(),
      title: form.title,
      date: form.date.format('YYYY-MM-DD'),
      content: form.content,
      status: 'draft',
      createdAt: editingThesis ? editingThesis.createdAt : new Date(),
      updatedAt: new Date()
    };

    if (editingThesis) {
      setThesis(prev => prev.map(t => t.id === editingThesis.id ? thesisData : t));
      message.success('Đã cập nhật thesis');
    } else {
      setThesis(prev => [...prev, thesisData]);
      message.success('Đã tạo thesis mới');
    }

    setIsModalVisible(false);
    setEditingThesis(null);
  };

  const handleDelete = (thesisId) => {
    setThesis(prev => prev.filter(t => t.id !== thesisId));
    message.success('Đã xóa thesis');
  };

  const handleAccept = (thesisItem) => {
    onAcceptThesis(thesisItem);
    message.success('Đã accept thesis và lưu vào nhật ký');
  };

  const handleSaveDraft = () => {
    if (!form.title.trim() && !form.content.trim()) {
      message.error('Vui lòng nhập ít nhất tiêu đề hoặc nội dung');
      return;
    }

    const thesisData = {
      id: editingThesis ? editingThesis.id : Date.now().toString(),
      title: form.title || 'Untitled',
      date: form.date.format('YYYY-MM-DD'),
      content: form.content,
      status: 'draft',
      createdAt: editingThesis ? editingThesis.createdAt : new Date(),
      updatedAt: new Date()
    };

    if (editingThesis) {
      setThesis(prev => prev.map(t => t.id === editingThesis.id ? thesisData : t));
      message.success('Đã lưu draft');
    } else {
      setThesis(prev => [...prev, thesisData]);
      message.success('Đã lưu draft mới');
    }

    setIsModalVisible(false);
    setEditingThesis(null);
  };

  return (
    <div className={styles.thesisContainer}>
      <div className={styles.thesisHeader}>
        <h3>Investment Thesis Management</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateNew}
          className={styles.createButton}
        >
          Tạo Thesis Mới
        </Button>
      </div>

      {thesis.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <h4>Chưa có thesis nào</h4>
          <p>Tạo thesis đầu tiên để bắt đầu xây dựng chiến lược đầu tư của bạn</p>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateNew}
          >
            Tạo Thesis Đầu Tiên
          </Button>
        </div>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1 }}
          dataSource={thesis}
          renderItem={(item) => (
            <List.Item>
              <Card
                className={styles.thesisCard}
                title={
                  <div className={styles.thesisCardHeader}>
                    <div className={styles.thesisTitle}>{item.title}</div>
                    <div className={styles.thesisActions}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(item)}
                      />
                      <Popconfirm
                        title="Bạn có chắc muốn xóa thesis này?"
                        onConfirm={() => handleDelete(item.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          danger
                        />
                      </Popconfirm>
                    </div>
                  </div>
                }
                extra={
                  <div className={styles.thesisExtra}>
                    <span className={`${styles.statusBadge} ${styles[item.status]}`}>
                      {item.status === 'draft' ? 'Draft' : 'Published'}
                    </span>
                  </div>
                }
              >
                <div className={styles.thesisContent}>
                  <div className={styles.thesisDate}>
                    <strong>Ngày:</strong> {dayjs(item.date).format('DD/MM/YYYY')}
                  </div>
                  <div className={styles.thesisText}>
                    {item.content.length > 300 
                      ? item.content.substring(0, 300) + '...' 
                      : item.content
                    }
                  </div>
                  <div className={styles.thesisMeta}>
                    <span>Cập nhật: {dayjs(item.updateAt).format('DD/MM/YYYY HH:mm')}</span>
                  </div>
                </div>
                <div className={styles.thesisCardActions}>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(item)}
                  >
                    Sửa
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => handleAccept(item)}
                  >
                    Accept
                  </Button>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        title={editingThesis ? 'Sửa Investment Thesis' : 'Tạo Investment Thesis Mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="draft"
            icon={<SaveOutlined />}
            onClick={handleSaveDraft}
          >
            Lưu Draft
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleSave}
          >
            {editingThesis ? 'Cập nhật' : 'Tạo'} Thesis
          </Button>,
        ]}
      >
        <div className={styles.thesisForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tiêu đề Thesis:</label>
            <Input
              placeholder="Nhập tiêu đề cho investment thesis..."
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Ngày:</label>
            <DatePicker
              value={form.date}
              onChange={(date) => setForm(prev => ({ ...prev, date }))}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nội dung Thesis:</label>
            <TextArea
              placeholder="Nhập nội dung chi tiết của investment thesis...

Ví dụ:
## Executive Summary
Khuyến nghị đầu tư vào [Tên công ty/Ngành] với mục tiêu giá...

## Investment Rationale
1. Catalysts chính:
   - 
   - 

2. Valuation:
   - Current P/E: 
   - Target P/E:
   - Upside potential:

3. Risk Assessment:
   - Key risks:
   - Mitigation:

## Timeline & Targets
- Entry point:
- Target price:
- Stop loss:
- Investment horizon:"
              value={form.content}
              onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
              autoSize={{ minRows: 10, maxRows: 20 }}
              className={styles.formTextarea}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ThesisTab; 