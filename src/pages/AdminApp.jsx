import css from './Admin2/Admin2.module.css';
import React, { useEffect, useState } from 'react';
import { SettingOutlined } from '@ant-design/icons';
import { Menu, Space } from 'antd';
import UserManagement from './Admin2/Components/UserManagement/UserManagement';
import ProjectManager from './Admin2/Components/ProjectManager/ProjectManager';
import { getSettingByType } from '../apis/settingService.jsx';
import { BackCanvas, ICON_CROSSROAD_LIST } from '../icon/svg/IconSvg.jsx';
import { useNavigate } from 'react-router-dom';
import DMCompany from '../pages/Home/AgridTable/DanhMuc/DMCompany.jsx';

const AdminApp = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState('user');
  const [tool, setTool] = useState(null);
  useEffect(() => {
    getSettingByType('DASHBOARD_SETTING').then(res => {
           if (res.setting.length > 0) {
        let dashboardSetting = res.setting.find(item => item.id === 'admin');
        if (dashboardSetting) {
          setTool(dashboardSetting);
        }
      }
    });
  }, [location]);
  const items = [
 
    {
      label: 'Quản lý nhân viên',
      key: 'user',
      icon: <SettingOutlined />,
    },
  
    {
      label: 'Quản lý nhóm nhân viên',
      key: 'group',
      icon: <SettingOutlined />,
    },
    {
      label: 'Quản lý đơn vị (HQTC)',
      key: 'company',
      icon: <SettingOutlined />,
    },
  ];

  const onClickTab = (e) => {
    setCurrentTab(e.key);
  };

  const renderBody = () => {
    switch (currentTab) {
      case 'company':
        return (
          <div style={{padding: '20px 33%'}}>
            <DMCompany/>
          </div>
        );
      case 'user':
        return <UserManagement />;
      case 'group':
        return <ProjectManager />;
      default:
        return null;
    }
  };
  const getIconSrcById = (tool) => {
    const found = ICON_CROSSROAD_LIST.find(item => item.id == tool.icon);
    return found ? found.icon : undefined;
  };
  const handleBack = () => {
    const prePath = localStorage.getItem('prePath');
    if (prePath) {
      navigate(prePath)
    } else {
      navigate('/dashboard')
    }
  }
  return (
    <div className={css.main}>
      <div className={css.container}>
        <div className={css.navbar}>
          <div className={css.logo}>
            <div className={css.backCanvas}
                 onClick={() =>
                  handleBack()

                 }
            >
              <BackCanvas height={20} width={20} />
            </div>
            {tool && <img src={getIconSrcById(tool)} alt={tool.name} width={30} height={30} />}
            <div className={css.headerLogo}>
              Admin
            </div>
          </div>
          <div className={css.menu}>
            <Menu
                style={{ width: '100%', height: '100%' }}
                onClick={onClickTab}
                selectedKeys={[currentTab]}
                mode="horizontal"
                items={items}
            />
          </div>
        </div>
        <div className={css.body}>{renderBody()}</div>
      </div>
    </div>
  );
};

export default AdminApp;
