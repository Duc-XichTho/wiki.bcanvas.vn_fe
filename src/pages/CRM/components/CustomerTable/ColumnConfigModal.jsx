import { Button, Input, Modal, Tag, Collapse } from 'antd';
import React, { useState } from 'react';
import styles from './ColumnConfigModal.module.css';

const ColumnConfigModal = ({
  open,
  onCancel,
  columnConfig,
  setColumnConfig,
  onSave
}) => {
  // Tag input states
  const [newGroup1Tag, setNewGroup1Tag] = useState('');
  const [newGroup2Tag, setNewGroup2Tag] = useState('');
  const [newGroup3Tag, setNewGroup3Tag] = useState('');
  const [newGroup4Tag, setNewGroup4Tag] = useState('');
  const [newGroup5Tag, setNewGroup5Tag] = useState('');
  const [newGroup6Tag, setNewGroup6Tag] = useState('');
  const [newGroup7Tag, setNewGroup7Tag] = useState('');
  const [newGroup8Tag, setNewGroup8Tag] = useState('');
  const [newGroup9Tag, setNewGroup9Tag] = useState('');
  const [newGroup10Tag, setNewGroup10Tag] = useState('');

  // Add tag to group1
  const addGroup1Tag = () => {
    if (newGroup1Tag.trim() && !columnConfig?.group1?.options?.includes(newGroup1Tag.trim())) {
      setColumnConfig(prev => ({
        ...prev,
        group1: {
          ...prev.group1,
          options: [...(prev.group1?.options || []), newGroup1Tag.trim()]
        }
      }));
      setNewGroup1Tag('');
    }
  };

  // Remove tag from group1
  const removeGroup1Tag = (tagToRemove) => {
    setColumnConfig(prev => ({
      ...prev,
      group1: {
        ...prev.group1,
        options: (prev.group1?.options || []).filter(tag => tag !== tagToRemove)
      }
    }));
  };

  // Add tag to group2
  const addGroup2Tag = () => {
    if (newGroup2Tag.trim() && !columnConfig?.group2?.options?.includes(newGroup2Tag.trim())) {
      setColumnConfig(prev => ({
        ...prev,
        group2: {
          ...prev.group2,
          options: [...(prev.group2?.options || []), newGroup2Tag.trim()]
        }
      }));
      setNewGroup2Tag('');
    }
  };

  // Remove tag from group2
  const removeGroup2Tag = (tagToRemove) => {
    setColumnConfig(prev => ({
      ...prev,
      group2: {
        ...prev.group2,
        options: (prev.group2?.options || []).filter(tag => tag !== tagToRemove)
      }
    }));
  };

  // Add tag to group3
  const addGroup3Tag = () => {
    if (newGroup3Tag.trim() && !columnConfig?.group3?.options?.includes(newGroup3Tag.trim())) {
      setColumnConfig(prev => ({
        ...prev,
        group3: {
          ...prev.group3,
          options: [...(prev.group3?.options || []), newGroup3Tag.trim()]
        }
      }));
      setNewGroup3Tag('');
    }
  };

  // Remove tag from group3
  const removeGroup3Tag = (tagToRemove) => {
    setColumnConfig(prev => ({
      ...prev,
      group3: {
        ...prev.group3,
        options: (prev.group3?.options || []).filter(tag => tag !== tagToRemove)
      }
    }));
  };

  // Add tag to group4
  const addGroup4Tag = () => {
    if (newGroup4Tag.trim() && !columnConfig?.group4?.options?.includes(newGroup4Tag.trim())) {
      setColumnConfig(prev => ({
        ...prev,
        group4: {
          ...prev.group4,
          options: [...(prev.group4?.options || []), newGroup4Tag.trim()]
        }
      }));
      setNewGroup4Tag('');
    }
  };

  // Remove tag from group4
  const removeGroup4Tag = (tagToRemove) => {
    setColumnConfig(prev => ({
      ...prev,
      group4: {
        ...prev.group4,
        options: (prev.group4?.options || []).filter(tag => tag !== tagToRemove)
      }
    }));
  };

  // Add tag to group5
  const addGroup5Tag = () => {
    if (newGroup5Tag.trim() && !columnConfig?.group5?.options?.includes(newGroup5Tag.trim())) {
      setColumnConfig(prev => ({
        ...prev,
        group5: {
          ...prev.group5,
          options: [...(prev.group5?.options || []), newGroup5Tag.trim()]
        }
      }));
      setNewGroup5Tag('');
    }
  };

  // Remove tag from group5
  const removeGroup5Tag = (tagToRemove) => {
    setColumnConfig(prev => ({
      ...prev,
      group5: {
        ...prev.group5,
        options: (prev.group5?.options || []).filter(tag => tag !== tagToRemove)
      }
    }));
  };

  // Add tag to group6
  const addGroup6Tag = () => {
    if (newGroup6Tag.trim() && !columnConfig?.group6?.options?.includes(newGroup6Tag.trim())) {
      setColumnConfig(prev => ({
        ...prev,
        group6: {
          ...prev.group6,
          options: [...(prev.group6?.options || []), newGroup6Tag.trim()]
        }
      }));
      setNewGroup6Tag('');
    }
  };

  // Remove tag from group6
  const removeGroup6Tag = (tagToRemove) => {
    setColumnConfig(prev => ({
      ...prev,
      group6: {
        ...prev.group6,
        options: (prev.group6?.options || []).filter(tag => tag !== tagToRemove)
      }
    }));
  };

  // Add tag to group7
  const addGroup7Tag = () => {
    if (newGroup7Tag.trim() && !columnConfig?.group7?.options?.includes(newGroup7Tag.trim())) {
      setColumnConfig(prev => ({
        ...prev,
        group7: {
          ...prev.group7,
          options: [...(prev.group7?.options || []), newGroup7Tag.trim()]
        }
      }));
      setNewGroup7Tag('');
    }
  };

  // Remove tag from group7
  const removeGroup7Tag = (tagToRemove) => {
    setColumnConfig(prev => ({
      ...prev,
      group7: {
        ...prev.group7,
        options: (prev.group7?.options || []).filter(tag => tag !== tagToRemove)
      }
    }));
  };

  // Add tag to group8
  const addGroup8Tag = () => {
    if (newGroup8Tag.trim() && !columnConfig?.group8?.options?.includes(newGroup8Tag.trim())) {
      setColumnConfig(prev => ({
        ...prev,
        group8: {
          ...prev.group8,
          options: [...(prev.group8?.options || []), newGroup8Tag.trim()]
        }
      }));
      setNewGroup8Tag('');
    }
  };

  // Remove tag from group8
  const removeGroup8Tag = (tagToRemove) => {
    setColumnConfig(prev => ({
      ...prev,
      group8: {
        ...prev.group8,
        options: (prev.group8?.options || []).filter(tag => tag !== tagToRemove)
      }
    }));
  };

  // Add tag to group9
  const addGroup9Tag = () => {
    if (newGroup9Tag.trim() && !columnConfig?.group9?.options?.includes(newGroup9Tag.trim())) {
      setColumnConfig(prev => ({
        ...prev,
        group9: {
          ...prev.group9,
          options: [...(prev.group9?.options || []), newGroup9Tag.trim()]
        }
      }));
      setNewGroup9Tag('');
    }
  };

  // Remove tag from group9
  const removeGroup9Tag = (tagToRemove) => {
    setColumnConfig(prev => ({
      ...prev,
      group9: {
        ...prev.group9,
        options: (prev.group9?.options || []).filter(tag => tag !== tagToRemove)
      }
    }));
  };

  // Add tag to group10
  const addGroup10Tag = () => {
    if (newGroup10Tag.trim() && !columnConfig?.group10?.options?.includes(newGroup10Tag.trim())) {
      setColumnConfig(prev => ({
        ...prev,
        group10: {
          ...prev.group10,
          options: [...(prev.group10?.options || []), newGroup10Tag.trim()]
        }
      }));
      setNewGroup10Tag('');
    }
  };

  // Remove tag from group10
  const removeGroup10Tag = (tagToRemove) => {
    setColumnConfig(prev => ({
      ...prev,
      group10: {
        ...prev.group10,
        options: (prev.group10?.options || []).filter(tag => tag !== tagToRemove)
      }
    }));
  };


  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <span className={styles.modalTitleIcon}>⚙️</span>
          <span className={styles.modalTitleText}>Cấu hình Cột</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button
          key="cancel"
          onClick={onCancel}
          size="large"
          className={styles.cancelButton}
        >
          Hủy
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={() => onSave(columnConfig)}
          size="large"
          className={styles.saveButton}
        >
          💾 Lưu cấu hình
        </Button>
      ]}
      width={1600}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Instructions */}
        <div className={styles.instructionsContainer}>
          <div className={styles.instructionsHeader}>
            <span className={styles.instructionsIcon}>💡</span>
            <span className={styles.instructionsTitle}>Hướng dẫn:</span>
          </div>
          <div className={styles.instructionsContent}>
            • <strong>Tên hiển thị:</strong> Đổi tên cột trong bảng<br />
            • <strong>Thêm thẻ:</strong> Nhập giá trị và nhấn Enter hoặc click ➕ để thêm<br />
            • <strong>Xóa thẻ:</strong> Click ❌ trên thẻ để xóa
          </div>
        </div>

        {/* Group Columns Section */}
        <div className={styles.sectionTitle}>
          📊 Cột Nhóm (Group Columns) - Có dropdown selection
        </div>
        
        {/* Collapsible Groups */}
        <Collapse 
          defaultActiveKey={['group1', 'group2', 'group3']}
          size="large"
          style={{ marginBottom: '20px' }}
        >
          {/* Group 1-3 */}
          <Collapse.Panel header="Nhóm Group 1-3" key="basic-groups">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>

          {/* Group 1 */}
          <div className={styles.columnSection}>
            <div className={styles.columnHeader}>
              <span className={styles.columnIcon}>📊</span>
              <span className={styles.columnTitle}>Group 1</span>
            </div>

            <div className={styles.columnContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Tên hiển thị:
                </label>
                <Input
                  value={columnConfig.group1.displayName}
                  onChange={(e) => setColumnConfig(prev => ({
                    ...prev,
                    group1: { ...prev.group1, displayName: e.target.value }
                  }))}
                  placeholder="Nhóm khách hàng..."
                  size="large"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Danh sách giá trị:
                </label>

                {/* Add new tag input */}
                <div className={styles.tagInputContainer}>
                  <Input
                    value={newGroup1Tag}
                    onChange={(e) => setNewGroup1Tag(e.target.value)}
                    placeholder="Nhập giá trị mới..."
                    onPressEnter={addGroup1Tag}
                    className={styles.tagInput}
                  />
                  <Button
                    type="primary"
                    onClick={addGroup1Tag}
                    disabled={!newGroup1Tag.trim()}
                    className={`${styles.addButton} ${styles.addButtonGroup1}`}
                  >
                    {newGroup1Tag.trim() ? '✙' : '➕'}
                  </Button>
                </div>

                {/* Tags display */}
                <div className={styles.tagsContainer}>
                  {columnConfig?.group1?.options?.length === 0 ? (
                    <div className={styles.emptyState}>
                      Chưa có giá trị nào
                    </div>
                  ) : (
                    <div className={styles.tagsList}>
                      {columnConfig?.group1?.options?.map((tag, index) => (
                        <Tag
                          key={index}
                          closable
                          onClose={() => removeGroup1Tag(tag)}
                          className={styles.tag}
                        >
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Group 2 */}
          <div className={styles.columnSection}>
            <div className={styles.columnHeader}>
              <span className={styles.columnIcon}>📈</span>
              <span className={styles.columnTitle}>Group 2</span>
            </div>

            <div className={styles.columnContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Tên hiển thị:
                </label>
                <Input
                  value={columnConfig?.group2?.displayName}
                  onChange={(e) => setColumnConfig(prev => ({
                    ...prev,
                    group2: { ...prev.group2, displayName: e.target.value }
                  }))}
                  placeholder="Khu vực..."
                  size="large"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Danh sách giá trị:
                </label>

                {/* Add new tag input */}
                <div className={styles.tagInputContainer}>
                  <Input
                    value={newGroup2Tag}
                    onChange={(e) => setNewGroup2Tag(e.target.value)}
                    placeholder="Nhập giá trị mới..."
                    onPressEnter={addGroup2Tag}
                    className={styles.tagInput}
                  />
                  <Button
                    type="primary"
                    onClick={addGroup2Tag}
                    disabled={!newGroup2Tag.trim()}
                    className={`${styles.addButton} ${styles.addButtonGroup2}`}
                  >
                    {newGroup2Tag.trim() ? '✙' : '➕'}
                  </Button>
                </div>

                {/* Tags display */}
                <div className={styles.tagsContainer}>
                  {columnConfig?.group2?.options?.length === 0 ? (
                    <div className={styles.emptyState}>
                      Chưa có giá trị nào
                    </div>
                  ) : (
                    <div className={styles.tagsList}>
                      {columnConfig?.group2?.options?.map((tag, index) => (
                        <Tag
                          key={index}
                          closable
                          onClose={() => removeGroup2Tag(tag)}
                          color="blue"
                          className={styles.tag}
                        >
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Group 3 */}
          <div className={styles.columnSection}>
            <div className={styles.columnHeader}>
              <span className={styles.columnIcon}>📋</span>
              <span className={styles.columnTitle}>Group 3</span>
            </div>

            <div className={styles.columnContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Tên hiển thị:
                </label>
                <Input
                  value={columnConfig?.group3?.displayName}
                  onChange={(e) => setColumnConfig(prev => ({
                    ...prev,
                    group3: { ...prev.group3, displayName: e.target.value }
                  }))}
                  placeholder="Nhóm khách hàng..."
                  size="large"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Danh sách giá trị:
                </label>

                {/* Add new tag input */}
                <div className={styles.tagInputContainer}>
                  <Input
                    value={newGroup3Tag}
                    onChange={(e) => setNewGroup3Tag(e.target.value)}
                    placeholder="Nhập giá trị mới..."
                    onPressEnter={addGroup3Tag}
                    className={styles.tagInput}
                  />
                  <Button
                    type="primary"
                    onClick={addGroup3Tag}
                    disabled={!newGroup3Tag.trim()}
                    className={`${styles.addButton} ${styles.addButtonGroup3}`}
                  >
                    {newGroup3Tag.trim() ? '✙' : '➕'}

                  </Button>
                </div>

                {/* Tags display */}
                <div className={styles.tagsContainer}>
                  {columnConfig?.group3?.options?.length === 0 ? (
                    <div className={styles.emptyState}>
                      Chưa có giá trị nào
                    </div>
                  ) : (
                    <div className={styles.tagsList}>
                      {columnConfig?.group3?.options?.map((tag, index) => (
                        <Tag
                          key={index}
                          closable
                          onClose={() => removeGroup3Tag(tag)}
                          color="purple"
                          className={styles.tag}
                        >
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
            </div>
          </Collapse.Panel>

          {/* Group 4-7 */}
          <Collapse.Panel header="Nhóm Group 4-7" key="extended-groups-1">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>

          {/* Group 4 */}
          <div className={styles.columnSection}>
            <div className={styles.columnHeader}>
              <span className={styles.columnIcon}>🧩</span>
              <span className={styles.columnTitle}>Group 4</span>
            </div>

            <div className={styles.columnContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Tên hiển thị:
                </label>
                <Input
                  value={columnConfig?.group4?.displayName}
                  onChange={(e) => setColumnConfig(prev => ({
                    ...prev,
                    group4: { ...prev.group4, displayName: e.target.value }
                  }))}
                  placeholder="Nhóm khách hàng..."
                  size="large"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Danh sách giá trị:
                </label>

                {/* Add new tag input */}
                <div className={styles.tagInputContainer}>
                  <Input
                    value={newGroup4Tag}
                    onChange={(e) => setNewGroup4Tag(e.target.value)}
                    placeholder="Nhập giá trị mới..."
                    onPressEnter={addGroup4Tag}
                    className={styles.tagInput}
                  />
                  <Button
                    type="primary"
                    onClick={addGroup4Tag}
                    disabled={!newGroup4Tag.trim()}
                    className={`${styles.addButton} ${styles.addButtonGroup4}`}
                  >
                    {newGroup4Tag.trim() ? '✙' : '➕'}
                  </Button>
                </div>

                {/* Tags display */}
                <div className={styles.tagsContainer}>
                  {columnConfig?.group4?.options?.length === 0 ? (
                    <div className={styles.emptyState}>
                      Chưa có giá trị nào
                    </div>
                  ) : (
                    <div className={styles.tagsList}>
                      {columnConfig?.group4?.options?.map((tag, index) => (
                        <Tag
                          key={index}
                          closable
                          onClose={() => removeGroup4Tag(tag)}
                          color="green"
                          className={styles.tag}
                        >
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Group 5 */}
          <div className={styles.columnSection}>
            <div className={styles.columnHeader}>
              <span className={styles.columnIcon}>🧩</span>
              <span className={styles.columnTitle}>Group 5</span>
            </div>

            <div className={styles.columnContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Tên hiển thị:
                </label>
                <Input
                  value={columnConfig?.group5?.displayName}
                  onChange={(e) => setColumnConfig(prev => ({
                    ...prev,
                    group5: { ...prev.group5, displayName: e.target.value }
                  }))}
                  placeholder="Nhóm khách hàng..."
                  size="large"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Danh sách giá trị:
                </label>

                {/* Add new tag input */}
                <div className={styles.tagInputContainer}>
                  <Input
                    value={newGroup5Tag}
                    onChange={(e) => setNewGroup5Tag(e.target.value)}
                    placeholder="Nhập giá trị mới..."
                    onPressEnter={addGroup5Tag}
                    className={styles.tagInput}
                  />
                  <Button
                    type="primary"
                    onClick={addGroup5Tag}
                    disabled={!newGroup5Tag.trim()}
                    className={`${styles.addButton} ${styles.addButtonGroup5}`}
                  >
                    {newGroup5Tag.trim() ? '✙' : '➕'}
                  </Button>
                </div>

                {/* Tags display */}
                <div className={styles.tagsContainer}>
                  {columnConfig?.group5?.options?.length === 0 ? (
                    <div className={styles.emptyState}>
                      Chưa có giá trị nào
                    </div>
                  ) : (
                    <div className={styles.tagsList}>
                      {columnConfig?.group5?.options?.map((tag, index) => (
                        <Tag
                          key={index}
                          closable
                          onClose={() => removeGroup5Tag(tag)}
                          color="orange"
                          className={styles.tag}
                        >
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Group 6 */}
          <div className={styles.columnSection}>
            <div className={styles.columnHeader}>
              <span className={styles.columnIcon}>🧩</span>
              <span className={styles.columnTitle}>Group 6</span>
            </div>

            <div className={styles.columnContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Tên hiển thị:
                </label>
                <Input
                  value={columnConfig?.group6?.displayName}
                  onChange={(e) => setColumnConfig(prev => ({
                    ...prev,
                    group6: { ...prev.group6, displayName: e.target.value }
                  }))}
                  placeholder="Nhóm khách hàng..."
                  size="large"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Danh sách giá trị:
                </label>

                {/* Add new tag input */}
                <div className={styles.tagInputContainer}>
                  <Input
                    value={newGroup6Tag}
                    onChange={(e) => setNewGroup6Tag(e.target.value)}
                    placeholder="Nhập giá trị mới..."
                    onPressEnter={addGroup6Tag}
                    className={styles.tagInput}
                  />
                  <Button
                    type="primary"
                    onClick={addGroup6Tag}
                    disabled={!newGroup6Tag.trim()}
                    className={`${styles.addButton} ${styles.addButtonGroup6}`}
                  >
                    {newGroup6Tag.trim() ? '✙' : '➕'}
                  </Button>
                </div>

                {/* Tags display */}
                <div className={styles.tagsContainer}>
                  {columnConfig?.group6?.options?.length === 0 ? (
                    <div className={styles.emptyState}>
                      Chưa có giá trị nào
                    </div>
                  ) : (
                    <div className={styles.tagsList}>
                      {columnConfig?.group6?.options?.map((tag, index) => (
                        <Tag
                          key={index}
                          closable
                          onClose={() => removeGroup6Tag(tag)}
                          color="red"
                          className={styles.tag}
                        >
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Group 7 */}
          <div className={styles.columnSection}>
            <div className={styles.columnHeader}>
              <span className={styles.columnIcon}>🧩</span>
              <span className={styles.columnTitle}>Group 7</span>
            </div>

            <div className={styles.columnContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Tên hiển thị:
                </label>
                <Input
                  value={columnConfig?.group7?.displayName}
                  onChange={(e) => setColumnConfig(prev => ({
                    ...prev,
                    group7: { ...prev.group7, displayName: e.target.value }
                  }))}
                  placeholder="Nhóm khách hàng..."
                  size="large"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Danh sách giá trị:
                </label>

                {/* Add new tag input */}
                <div className={styles.tagInputContainer}>
                  <Input
                    value={newGroup7Tag}
                    onChange={(e) => setNewGroup7Tag(e.target.value)}
                    placeholder="Nhập giá trị mới..."
                    onPressEnter={addGroup7Tag}
                    className={styles.tagInput}
                  />
                  <Button
                    type="primary"
                    onClick={addGroup7Tag}
                    disabled={!newGroup7Tag.trim()}
                    className={`${styles.addButton} ${styles.addButtonGroup7}`}
                  >
                    {newGroup7Tag.trim() ? '✙' : '➕'}
                  </Button>
                </div>

                {/* Tags display */}
                <div className={styles.tagsContainer}>
                  {columnConfig?.group7?.options?.length === 0 ? (
                    <div className={styles.emptyState}>
                      Chưa có giá trị nào
                    </div>
                  ) : (
                    <div className={styles.tagsList}>
                      {columnConfig?.group7?.options?.map((tag, index) => (
                        <Tag
                          key={index}
                          closable
                          onClose={() => removeGroup7Tag(tag)}
                          color="cyan"
                          className={styles.tag}
                        >
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
            </div>
          </Collapse.Panel>

          {/* Group 8-10 */}
          <Collapse.Panel header="Nhóm Group 8-10" key="extended-groups-2">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>

          {/* Group 8 */}
          <div className={styles.columnSection}>
            <div className={styles.columnHeader}>
              <span className={styles.columnIcon}>🧩</span>
              <span className={styles.columnTitle}>Group 8</span>
            </div>

            <div className={styles.columnContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Tên hiển thị:
                </label>
                <Input
                  value={columnConfig?.group8?.displayName}
                  onChange={(e) => setColumnConfig(prev => ({
                    ...prev,
                    group8: { ...prev.group8, displayName: e.target.value }
                  }))}
                  placeholder="Nhóm khách hàng..."
                  size="large"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Danh sách giá trị:
                </label>

                {/* Add new tag input */}
                <div className={styles.tagInputContainer}>
                  <Input
                    value={newGroup8Tag}
                    onChange={(e) => setNewGroup8Tag(e.target.value)}
                    placeholder="Nhập giá trị mới..."
                    onPressEnter={addGroup8Tag}
                    className={styles.tagInput}
                  />
                  <Button
                    type="primary"
                    onClick={addGroup8Tag}
                    disabled={!newGroup8Tag.trim()}
                    className={`${styles.addButton} ${styles.addButtonGroup8}`}
                  >
                    {newGroup8Tag.trim() ? '✙' : '➕'}
                  </Button>
                </div>

                {/* Tags display */}
                <div className={styles.tagsContainer}>
                  {columnConfig?.group8?.options?.length === 0 ? (
                    <div className={styles.emptyState}>
                      Chưa có giá trị nào
                    </div>
                  ) : (
                    <div className={styles.tagsList}>
                      {columnConfig?.group8?.options?.map((tag, index) => (
                        <Tag
                          key={index}
                          closable
                          onClose={() => removeGroup8Tag(tag)}
                          color="magenta"
                          className={styles.tag}
                        >
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Group 9 */}
          <div className={styles.columnSection}>
            <div className={styles.columnHeader}>
              <span className={styles.columnIcon}>🧩</span>
              <span className={styles.columnTitle}>Group 9</span>
            </div>

            <div className={styles.columnContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Tên hiển thị:
                </label>
                <Input
                  value={columnConfig?.group9?.displayName}
                  onChange={(e) => setColumnConfig(prev => ({
                    ...prev,
                    group9: { ...prev.group9, displayName: e.target.value }
                  }))}
                  placeholder="Nhóm khách hàng..."
                  size="large"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Danh sách giá trị:
                </label>

                {/* Add new tag input */}
                <div className={styles.tagInputContainer}>
                  <Input
                    value={newGroup9Tag}
                    onChange={(e) => setNewGroup9Tag(e.target.value)}
                    placeholder="Nhập giá trị mới..."
                    onPressEnter={addGroup9Tag}
                    className={styles.tagInput}
                  />
                  <Button
                    type="primary"
                    onClick={addGroup9Tag}
                    disabled={!newGroup9Tag.trim()}
                    className={`${styles.addButton} ${styles.addButtonGroup9}`}
                  >
                    {newGroup9Tag.trim() ? '✙' : '➕'}
                  </Button>
                </div>

                {/* Tags display */}
                <div className={styles.tagsContainer}>
                  {columnConfig?.group9?.options?.length === 0 ? (
                    <div className={styles.emptyState}>
                      Chưa có giá trị nào
                    </div>
                  ) : (
                    <div className={styles.tagsList}>
                      {columnConfig?.group9?.options?.map((tag, index) => (
                        <Tag
                          key={index}
                          closable
                          onClose={() => removeGroup9Tag(tag)}
                          color="lime"
                          className={styles.tag}
                        >
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Group 10 */}
          <div className={styles.columnSection}>
            <div className={styles.columnHeader}>
              <span className={styles.columnIcon}>🧩</span>
              <span className={styles.columnTitle}>Group 10</span>
            </div>

            <div className={styles.columnContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Tên hiển thị:
                </label>
                <Input
                  value={columnConfig?.group10?.displayName}
                  onChange={(e) => setColumnConfig(prev => ({
                    ...prev,
                    group10: { ...prev.group10, displayName: e.target.value }
                  }))}
                  placeholder="Nhóm khách hàng..."
                  size="large"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Danh sách giá trị:
                </label>

                {/* Add new tag input */}
                <div className={styles.tagInputContainer}>
                  <Input
                    value={newGroup10Tag}
                    onChange={(e) => setNewGroup10Tag(e.target.value)}
                    placeholder="Nhập giá trị mới..."
                    onPressEnter={addGroup10Tag}
                    className={styles.tagInput}
                  />
                  <Button
                    type="primary"
                    onClick={addGroup10Tag}
                    disabled={!newGroup10Tag.trim()}
                    className={`${styles.addButton} ${styles.addButtonGroup10}`}
                  >
                    {newGroup10Tag.trim() ? '✙' : '➕'}
                  </Button>
                </div>

                {/* Tags display */}
                <div className={styles.tagsContainer}>
                  {columnConfig?.group10?.options?.length === 0 ? (
                    <div className={styles.emptyState}>
                      Chưa có giá trị nào
                    </div>
                  ) : (
                    <div className={styles.tagsList}>
                      {columnConfig?.group10?.options?.map((tag, index) => (
                        <Tag
                          key={index}
                          closable
                          onClose={() => removeGroup10Tag(tag)}
                          color="gold"
                          className={styles.tag}
                        >
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
            </div>
          </Collapse.Panel>
        </Collapse>

        {/* Text Columns Section */}
        <Collapse 
          defaultActiveKey={['text-columns']}
          size="large"
          style={{ marginTop: '20px' }}
        >
          <Collapse.Panel header="📝 Cột Text (Text Columns) - Nhập text tự do" key="text-columns">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <div key={`text${num}`} className={styles.textColumnSection}>
                  <div className={styles.textColumnHeader}>
                    <span className={styles.columnIcon}>📝</span>
                    <span className={styles.columnTitle}>Text {num}</span>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tên hiển thị:</label>
                    <Input
                      value={columnConfig[`text${num}`]?.displayName || ''}
                      onChange={(e) => setColumnConfig(prev => ({
                        ...prev,
                        [`text${num}`]: { ...prev[`text${num}`], displayName: e.target.value }
                      }))}
                      placeholder={`Text Field ${num}`}
                      className={styles.textInput}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Collapse.Panel>
        </Collapse>

        {/* Date Columns Section */}
        <Collapse 
          defaultActiveKey={['date-columns']}
          size="large"
          style={{ marginTop: '20px' }}
        >
          <Collapse.Panel header="📅 Cột Date (Date Columns) - Chọn ngày tháng" key="date-columns">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              {[1, 2, 3].map(num => (
                <div key={`date${num}`} className={styles.textColumnSection}>
                  <div className={styles.columnHeader}>
                    <h4>Date Field {num}</h4>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label>Tên hiển thị:</label>
                    <Input
                      value={columnConfig?.[`date${num}`]?.displayName || ''}
                      onChange={(e) => setColumnConfig(prev => ({
                        ...prev,
                        [`date${num}`]: {
                          ...prev[`date${num}`],
                          displayName: e.target.value
                        }
                      }))}
                      placeholder={`Date Field ${num}`}
                    />
                  </div>
                  
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    📅 Sử dụng date picker để chọn ngày tháng
                  </div>
                </div>
              ))}
            </div>
          </Collapse.Panel>
        </Collapse>
      </div>
    </Modal>
  );
};

export default ColumnConfigModal;
