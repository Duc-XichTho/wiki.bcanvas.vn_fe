import React from 'react';
import { Button } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import css from '../BaoCao/BaoCao.module.css';

export default function ActionModalButton({ onClick, title = "Mở Modal" }) {
  return (
    <Button
      type="default"
      onClick={onClick}
      className={css.customButton}
      style={{
        borderRadius: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #d9d9d9',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '14px',
        fontWeight: '500'
      }}
    >
      {title}
    </Button>
  );
}
