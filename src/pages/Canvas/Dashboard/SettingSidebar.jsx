import css from './SettingSidebar.module.css';
import { useState, useEffect } from 'react';
import { Modal, Switch, message } from 'antd';
import { createSetting, getSettingByType, updateSetting } from '../../../apis/settingService';

const SettingSidebar = ({ isOpen, onClose, onSettingsChange }) => {
    const [settings, setSettings] = useState({
        isShowChienLuoc: true,
        isShowChiSoKinhDoanh: true,
        isShowDashboard: true
    });
    const [settingId, setSettingId] = useState(null);

    const fetchSettings = async () => {
        try {
            let data = await getSettingByType('SidebarSettings');
            if (!data) {
                data = await createSetting({
                    type: 'SidebarSettings',
                    setting: settings
                });
            }
            setSettingId(data.id);
            setSettings(data.setting);
            onSettingsChange(data.setting);
        } catch (error) {
            console.error('Error fetching sidebar settings:', error);
            message.error('Failed to load settings');
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen]);

    const handleSettingChange = (key, value) => {
        const newSettings = {
            ...settings,
            [key]: value
        };
        setSettings(newSettings);
    };

    const handleSave = async () => {
        try {
            if (!settingId) {
                // If no setting exists, create a new one
                const newSetting = await createSetting({
                    type: 'SidebarSettings',
                    setting: settings
                });
                setSettingId(newSetting.id);
            } else {
                // If setting exists, update it
                await updateSetting({
                    id: settingId,
                    type: 'SidebarSettings',
                    setting: settings
                });
            }
            onSettingsChange(settings);
            message.success('Settings saved successfully');
            onClose();
        } catch (error) {
            console.error('Error saving settings:', error);
            message.error('Failed to save settings');
        }
    };

    return (
        <Modal
            title="Cài đặt Sidebar"
            open={isOpen}
            onCancel={onClose}
            onOk={handleSave}
            okText="Lưu"
            cancelText="Đóng"
        >
            <div className={css.settingsContainer}>
                <div className={css.settingItem}>
                    <span>Phân tích chiến lược</span>
                    <Switch
                        checked={settings.isShowChienLuoc}
                        onChange={(checked) => handleSettingChange('isShowChienLuoc', checked)}
                    />
                </div>
                <div className={css.settingItem}>
                    <span>Chỉ số kinh doanh</span>
                    <Switch
                        checked={settings.isShowChiSoKinhDoanh}
                        onChange={(checked) => handleSettingChange('isShowChiSoKinhDoanh', checked)}
                    />
                </div>
                <div className={css.settingItem}>
                    <span>Dashboard</span>
                    <Switch
                        checked={settings.isShowDashboard}
                        onChange={(checked) => handleSettingChange('isShowDashboard', checked)}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default SettingSidebar;
