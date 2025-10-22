import React, { useState } from 'react';
import { Spin } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import styles from '../K9.module.css';
import K9SubTabs from './K9SubTabs.jsx';
import PlaygroundTab from './assistant/PlaygroundTab.jsx';
import ThesisTab from './assistant/ThesisTab.jsx';
import DiaryTab from './assistant/DiaryTab.jsx';

const K9AssistantTab = ({ loading }) => {
  const [activeSubTab, setActiveSubTab] = useState('playground');
  const [thesis, setThesis] = useState([]);
  const [acceptedThesis, setAcceptedThesis] = useState([]);

  // Handle sub-tab change
  const handleSubTabChange = (subTab) => {
    setActiveSubTab(subTab);
  };

  // Handle saving AI response to thesis
  const handleSaveToThesis = (content, thesisId) => {
    setThesis(prev => prev.map(t =>
      t.id === thesisId
        ? { ...t, content: t.content + '\n\n' + content }
        : t
    ));
  };

  // Handle accepting thesis
  const handleAcceptThesis = (thesisData) => {
    setAcceptedThesis(prev => [...prev, { ...thesisData, acceptedAt: new Date() }]);
    setThesis(prev => prev.filter(t => t.id !== thesisData.id));
  };

  // Sub-tab options for K9Service Assistant
  const assistantSubTabs = [
    { key: 'playground', label: 'Playground' },
    { key: 'thesis', label: 'Thesis' },
    { key: 'diary', label: 'Nhật ký' },
  ];

  return (
    <div className={styles.tabContent}>
      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <p>Đang khởi động K9 Assistant...</p>
        </div>
      ) : (
        <div className={styles.assistantContainer}>

          <K9SubTabs
            activeSubTab={activeSubTab}
            onSubTabChange={handleSubTabChange}
            subTabOptions={assistantSubTabs}
          />

          {/* Playground Tab */}
          {activeSubTab === 'playground' && (
            <PlaygroundTab
              onSaveToThesis={handleSaveToThesis}
              thesis={thesis}
            />
          )}

          {/* Thesis Tab */}
          {activeSubTab === 'thesis' && (
            <ThesisTab
              thesis={thesis}
              setThesis={setThesis}
              onAcceptThesis={handleAcceptThesis}
            />
          )}

          {/* Diary Tab */}
          {activeSubTab === 'diary' && (
            <DiaryTab
              acceptedThesis={acceptedThesis}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default K9AssistantTab;
