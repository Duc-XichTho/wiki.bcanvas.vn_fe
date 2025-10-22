import React from 'react';
import { Dropdown, Button } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from './AntdDropdown.module.css';

const AntdDropdown = ({ onEdit, onDelete, itemName = 'item' }) => {
  const items = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: `Sửa ${itemName}`,
      onClick: () => onEdit(),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: `Xóa ${itemName}`,
      onClick: () => onDelete(),
      danger: true,
    },
  ];

  return (
    <Dropdown
      menu={{ items }}
      trigger={['click']}
      placement="bottomRight"
      overlayClassName={styles.dropdownOverlay}
    >
      <Button
        type="text"
        icon={<MoreOutlined />}
        className={styles.dropdownButton}
        size="small"
      />
    </Dropdown>
  );
};

export default AntdDropdown;
