import css from './DataCheckingTools.module.css';
import { useState } from "react";
import { Modal } from "antd";
import CreateRuleForm from './components/CrossCheck/CreateRuleForm/CreateRuleForm';
import RuleList from './components/CrossCheck/RuleList/RuleList';
import HistoryResult from './components/CrossCheck/HistoryResult/HistoryResult';
import ValidateCreateForm from './components/Validate/ValidateCreateForm/ValidateCreateForm'
import ValidateList from './components/Validate/ValidateList/ValidateList';
import ValidateHistory from './components/Validate/ValidateHistory/ValidateHistory';
import MappingList from './components/Mapping/MappingList/MappingList';

const TabPanel = ({ activeTab, onTabChange, tabs }) => (
  <div className={css.tabs}>
    {tabs.map(tab => (
      <div
        key={tab.key}
        className={activeTab === tab.key ? css.tabActive : css.tab}
        onClick={() => onTabChange(tab.key)}
      >
        {tab.label}
      </div>
    ))}
  </div>
);

const DataCheckingTools = ({ isOpen, setIsOpen }) => {
  const [activeTabHeader, setActiveTabHeader] = useState('validate');
  const [activeTabCross, setActiveTabCross] = useState('list');
  const [activeTabMapping, setActiveTabMapping] = useState('list');
  const [activeTabDuplicate, setActiveTabDuplicate] = useState('list');
  const [showValidateCreate, setShowValidateCreate] = useState(false);

  const tabConfigs = {
    crosscheck: {
      tabs: [
        { key: 'list', label: 'Danh sách' },
        { key: 'create', label: 'Tạo mới' },
        { key: 'history', label: 'Kết quả' }
      ],
      components: {
        create: CreateRuleForm,
        list: RuleList,
        history: HistoryResult
      }
    },
    mapping: {
      tabs: [{ key: 'list', label: 'Danh sách' }],
      components: {
        list: MappingList,
      }
    },
  };

  const getActiveTab = () => {
    switch (activeTabHeader) {
      case 'crosscheck': return activeTabCross;
      case 'mapping': return activeTabMapping;
      default: return 'list';
    }
  };

  const setActiveTab = (tab) => {
    switch (activeTabHeader) {
      case 'crosscheck': setActiveTabCross(tab); break;
      case 'mapping': setActiveTabMapping(tab); break;
    }
  };

  const renderContent = () => {
    if (activeTabHeader === 'validate') {
      return <ValidateList onCreateNew={() => setShowValidateCreate(true)} />;
    }

    const config = tabConfigs[activeTabHeader];
    if (!config) return null;

    const Component = config.components[getActiveTab()];
    return Component ? <Component /> : null;
  };

  const HeaderTabs = ({ activeTab, onTabChange, tabs }) => (
    <div className={css.tabsHeader}>
      {tabs.map(tab => (
        <div
          key={tab.value}
          className={activeTab === tab.value ? css.tabActiveHeader : css.tab}
          onClick={() => onTabChange(tab)}
        >
          {tab.label}
        </div>
      ))}
    </div>
  );

  const listHeaderTabs = [
    { value: 'validate', label: 'Validate' },
    { value: 'mapping', label: 'Danh sách rule Mapping' },
  ];

  return (
    <Modal
      title="Kiểm định dữ liệu"
      centered
      open={isOpen}
      onCancel={() => setIsOpen(false)}
      width={1500}
      footer={null}
      maskClosable={false}
    >
      <div className={css.container}>
        <div className={css.header}>
          <HeaderTabs
            activeTab={activeTabHeader}
            onTabChange={(tab) => setActiveTabHeader(tab.value)}
            tabs={listHeaderTabs}
          />
        </div>
        <div className={css.content }>
          {activeTabHeader !== 'validate' && tabConfigs[activeTabHeader] && (
            <TabPanel
              activeTab={getActiveTab()}
              onTabChange={setActiveTab}
              tabs={tabConfigs[activeTabHeader].tabs}
            />
          )}
          <div className={css.mainPanel} style={{ height: activeTabHeader === 'validate' ? '100%' : '95%' }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DataCheckingTools
