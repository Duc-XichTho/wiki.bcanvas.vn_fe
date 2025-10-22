import {Modal} from "antd";
import React, {useState} from "react";
import css from "./SettingChart.module.css";
import ListChartTemplate from "./ChartTemplate/ChartTemplateList/ListChartTemplate.jsx";
import ChartTemplateCreate from "./ChartTemplate/ChartTemplateCreate/ChartTemplateCreate.jsx";

export default function SettingChart({showSettingsChartPopup, setShowSettingsChartPopup , colDefs , templateData , }) {
    const [activeTabHeader, setActiveTabHeader] = useState('list');

    const listHeaderTabs = [
        {value: 'list', label: 'Danh sách'},
        {value: 'create', label: 'Tạo mới'},
    ];
    const HeaderTabs = ({activeTab, onTabChange, tabs}) => (
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

    const ContentTabs = ({activeTab}) => (
        <div className={css.content}>
            {activeTab === 'list' && (
                <>
                    <ListChartTemplate templateData={templateData}/>
                </>
            )}

            {activeTab === 'create' && (
                <>
                    <ChartTemplateCreate colDefs={colDefs} templateData={templateData}/>
                </>
            )}
        </div>
    );

    return (
        <>
            <Modal
                open={showSettingsChartPopup}
                onCancel={() => setShowSettingsChartPopup(false)}
                width={1300}
                title={`Cài đặt biểu đồ`}
                footer={false}
                styles={{
                    body: {
                        padding: 0,
                        margin: 0,
                        height: '70vh',
                        overflow: 'auto'
                    }
                }}
            >
                <div className={css.container}>
                    <div className={css.header}>
                        <HeaderTabs
                            activeTab={activeTabHeader}
                            onTabChange={(tab) => setActiveTabHeader(tab.value)}
                            tabs={listHeaderTabs}
                        />
                    </div>
                    <div className={css.content}>
                        <ContentTabs activeTab={activeTabHeader}/>
                    </div>
                </div>
            </Modal>
        </>
    )
}
