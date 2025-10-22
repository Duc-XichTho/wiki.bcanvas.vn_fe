import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Button, message } from 'antd';
import { getSettingByType, updateSetting, createSetting } from '../../../apis/settingService';
import { MODEL_TEXT_AI_LIST } from '../../../CONST.js';

const AiConfigModal = ({ visible, onCancel }) => {
    const [aiConfig, setAiConfig] = useState({
        model: MODEL_TEXT_AI_LIST[0]?.value,
        prompt: 'Hãy phân tích và tóm tắt nội dung sau một cách chi tiết và chính xác:',
    });
    const [loading, setLoading] = useState(false);
    const [existingSetting, setExistingSetting] = useState(null);

    // Load AI configuration when modal opens
    useEffect(() => {
        if (visible) {
            loadAiConfig();
        }
    }, [visible]);

    const loadAiConfig = async () => {
        try {
            const settings = await getSettingByType('MODEL_AI_FILE');
            if (settings) {
                setExistingSetting(settings); // Store the existing setting for update
                if (settings.setting) {
                    setAiConfig(settings.setting);
                }
                // If settings.setting is null, keep default values
            }
        } catch (error) {
            console.error('Error loading AI config:', error);
            // If no setting exists, keep default values
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            if (existingSetting) {
                // Update existing setting
                await updateSetting({
                    id: existingSetting.id,
                    type: 'MODEL_AI_FILE',
                    setting: aiConfig
                });
            } else {
                // Create new setting
                await createSetting({
                    type: 'MODEL_AI_FILE',
                    setting: aiConfig
                });
            }
            message.success('Cấu hình AI đã được lưu thành công!');
            onCancel();
        } catch (error) {
            console.error('Error saving AI config:', error);
            message.error('Lỗi khi lưu cấu hình AI');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Cấu hình AI"
            open={visible}
            onOk={handleSave}
            onCancel={onCancel}
            width={600}
            okText="Lưu cấu hình"
            cancelText="Hủy"
            confirmLoading={loading}
        >
            <Form layout="vertical">
                <Form.Item label="Model AI">
                    <Select
                        value={aiConfig.model}
                        onChange={(value) => setAiConfig(prev => ({ ...prev, model: value }))}
                        style={{ width: '100%' }}
                        options={ MODEL_TEXT_AI_LIST.map(model => ({ value: model.value, label: model.name }))}
                    />
                </Form.Item>

                <Form.Item label="Prompt mặc định">
                    <Input.TextArea
                        value={aiConfig.prompt}
                        onChange={(e) => setAiConfig(prev => ({ ...prev, prompt: e.target.value }))}
                        rows={4}
                        placeholder="Nhập prompt mặc định cho AI..."
                    />
                </Form.Item>

                {/* <Form.Item label="Temperature (0.0 - 2.0)">
                    <Input
                        type="number"
                        value={aiConfig.temperature}
                        onChange={(e) => setAiConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                        min={0}
                        max={2}
                        step={0.1}
                        placeholder="0.7"
                    />
                </Form.Item> */}

                {/* <Form.Item label="Max Tokens">
                    <Input
                        type="number"
                        value={aiConfig.maxTokens}
                        onChange={(e) => setAiConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 2000 }))}
                        min={100}
                        max={4000}
                        placeholder="2000"
                    />
                </Form.Item> */}
            </Form>
        </Modal>
    );
};

export default AiConfigModal;