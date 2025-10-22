import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const SidebarLoadingIcon = ({ size = 16, color = '#1890ff' }) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size, color }} spin />;
  
  return (
    <Spin 
      indicator={antIcon} 
      size="small"
      style={{ 
        display: 'inline-flex',
        alignItems: 'center',
        marginRight: '4px'
      }}
    />
  );
};

export default SidebarLoadingIcon;
