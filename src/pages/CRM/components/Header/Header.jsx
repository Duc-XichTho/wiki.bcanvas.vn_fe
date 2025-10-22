import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Badge, Tooltip } from 'antd';
import { BackCanvas } from '../../../../icon/svg/IconSvg.jsx';
import { MyContext } from '../../../../MyContext.jsx';
import ProfileSelect from '../../../Home/SelectComponent/ProfileSelect.jsx';
import styles from './Header.module.css';

const Header = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const Theme = localStorage.getItem('theme');
  const { currentUser } = useContext(MyContext);
  const tabs = ['Data', 'Email Template', 'Báo cáo'];

  return (
    <div className={styles.navContainer} style={{ backgroundColor: Theme === 'dark' ? '#1E2A3B' : '#f0f0f0' }}>
      <div className={styles.header_left}>
        <div 
          className={styles.backCanvas}
          onClick={() => navigate('/dashboard')}
          style={{ 
            backgroundColor: Theme === 'dark' ? 'transparent' : '#fff',
            boxShadow: Theme === 'dark' ? 'none' : '0 0 10px 0 rgba(0, 0, 0, 0.1)'
          }}
        >
          <BackCanvas 
            height={Theme === 'dark' ? 25 : 20} 
            width={Theme === 'dark' ? 25 : 20} 
            color={Theme === 'dark' ? '#fff' : '#454545'}
          />
        </div>
        
        <div className={styles.appIcon}>
          <span style={{ fontSize: '20px' }}>📊</span>
        </div>
        
        <div className={styles.headerLogo} style={{ color: Theme === 'dark' ? '#fff' : '#454545' }}>
          B-CRM
        </div>
      </div>

      <div className={styles.header_center}>
        <div className={styles.tabContainer}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`${styles.tab} ${
                activeTab === tab ? styles.tabActive : ''
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.header_right}>       
        <div className={styles.username}>
          <ProfileSelect />
        </div>
      </div>
    </div>
  );
};

export default Header;
