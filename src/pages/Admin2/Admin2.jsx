import css from './Admin2.module.css'
import React, { useState } from 'react';
import { SettingOutlined } from '@ant-design/icons';
import { Menu, Modal, Space } from 'antd';
import UserManagement from './Components/UserManagement/UserManagement';
import SabFa from './Components/SabFa/SabFa';
import SabMa from './Components/SabMa/SabMa';
import Canvas from './Components/Canvas/Canvas';
import ProjectManager from './Components/ProjectManager/ProjectManager';
import CrossRoadPopup from '../../components/CrossRoadPopup/CrossRoadPopup';
import CrossRoadPopup2 from '../../components/CrossRoadPopup/CrossRoadPopup2';
import { AppIcon } from '../../icon/IconSVG.js'
import DMCompany from '../../pages/Home/AgridTable/DanhMuc/DMCompany';
import {BackCanvas} from "../../icon/svg/IconSvg.jsx";
const Admin2 = () => {
  const [currentTab, setCurrentTab] = useState('user');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const items = [
    {
      label: 'Quản lý công ty',
      key: 'company',
      icon: <SettingOutlined />,
    },
    {
      label: 'Quản lý nhân viên',
      key: 'user',
      icon: <SettingOutlined />,
    },
    {
      label: 'SAB-FA',
      key: 'sabfa',
      icon: <SettingOutlined />,
    },
    {
      label: 'SAB-MA',
      key: 'sabma',
      icon: <SettingOutlined />,
    },
    {
      label: 'Canvas',
      key: 'canvas',
      icon: <SettingOutlined />,
    },
    {
      label: 'Project Manager',
      key: 'project-manager',
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
      case 'sabfa':
        return <SabFa />;
      case 'sabma':
        return <SabMa />;
      case 'canvas':
        return <Canvas />;
      case 'project-manager':
        return <ProjectManager />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className={css.main}>
        <div className={css.container}>
          <div className={css.navbar}>
            <div
              className={css.logo}
              onClick={showModal}
            >
              <Space
                  style={{
                    cursor: 'pointer'
                  }}
                  onClick={showModal}
              >
                {/*<img src={AppIcon} alt="" width={30}/>*/}
                {/*<img src="/App%20switcher.svg" alt="" width={25}/>*/}
                <div className={css.backCanvas}
                     onClick={  () =>
                         (window.location.href = `${import.meta.env.VITE_DOMAIN_URL}/dashboard`)
                     }
                >
                  <div>
                    <BackCanvas height={20} width={20}/>
                  </div>
                </div>
                <strong>Admin</strong>
              </Space>
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
          <div className={css.body}>
            {renderBody()}
          </div>
        </div>
      </div>

      <CrossRoadPopup2
        openCrossRoad={isModalOpen}
        onOkCrossRoad={handleOk}
        onCancelCrossRoad={handleCancel}
      />
    </>
  )
}

export default Admin2
