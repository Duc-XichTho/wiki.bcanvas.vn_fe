import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, message, Select, Spin } from 'antd';
import { createSetting, getSettingByType, updateSetting } from '../../apis/settingService.jsx';
import { MODEL_AI_LIST } from '../../CONST.js';

const { TextArea } = Input;

const PowerDrillPromptModal = ({ open, onClose }) => {
    // Bot tạo mô tả (dùng chung với AI truyền thống)
    const [descMsg, setDescMsg] = useState('');
    const [descModel, setDescModel] = useState(MODEL_AI_LIST[0].value);
    const [descLoading, setDescLoading] = useState(false);
    const [descSaving, setDescSaving] = useState(false);

    // Bot lọc dữ liệu (PowerDrill riêng)
    const [filterMsg, setFilterMsg] = useState('');
    const [filterModel, setFilterModel] = useState(MODEL_AI_LIST[0].value);
    const [filterLoading, setFilterLoading] = useState(false);
    const [filterSaving, setFilterSaving] = useState(false);

    // Prompt mặc định cho PowerDrill
    const [prompt, setPrompt] = useState('');
    const [promptLoading, setPromptLoading] = useState(false);
    const [promptSaving, setPromptSaving] = useState(false);

    useEffect(() => {
        if (open) {
            loadDescConfig();
            loadFilterConfig();
            loadPrompt();
        }
    }, [open]);

    // --- Bot tạo mô tả (dùng chung AI truyền thống) ---
    const loadDescConfig = async () => {
        setDescLoading(true);
        try {
            const msg = await getSettingByType('SYSTEM_MESSAGE_1');
            setDescMsg(msg?.setting || '');
            const model = await getSettingByType('MODEL_AI_1');
            setDescModel(model?.setting || MODEL_AI_LIST[0].value);
        } catch (e) {
            setDescMsg('');
            setDescModel(MODEL_AI_LIST[0].value);
        } finally {
            setDescLoading(false);
        }
    };
    const saveDescConfig = async () => {
        setDescSaving(true);
        try {
            const msgSetting = await getSettingByType('SYSTEM_MESSAGE_1');
            if (msgSetting) {
                await updateSetting({ ...msgSetting, setting: descMsg });
            } else {
                await createSetting({ type: 'SYSTEM_MESSAGE_1', setting: descMsg });
            }
            const modelSetting = await getSettingByType('MODEL_AI_1');
            if (modelSetting) {
                await updateSetting({ ...modelSetting, setting: descModel });
            } else {
                await createSetting({ type: 'MODEL_AI_1', setting: descModel });
            }
            message.success('Đã lưu cấu hình Bot tạo Mô tả!');
        } catch (e) {
            message.error('Lỗi khi lưu cấu hình Bot tạo Mô tả!');
        } finally {
            setDescSaving(false);
        }
    };

    // --- Bot lọc dữ liệu ---
    const loadFilterConfig = async () => {
        setFilterLoading(true);
        try {
            const msg = await getSettingByType('SYSTEM_MESSAGE_PD_1');
            setFilterMsg(msg?.setting || '');
            const model = await getSettingByType('MODEL_PD_1');
            setFilterModel(model?.setting || MODEL_AI_LIST[0].value);
        } catch (e) {
            setFilterMsg('');
            setFilterModel(MODEL_AI_LIST[0].value);
        } finally {
            setFilterLoading(false);
        }
    };
    const saveFilterConfig = async () => {
        setFilterSaving(true);
        try {
            const msgSetting = await getSettingByType('SYSTEM_MESSAGE_PD_1');
            if (msgSetting) {
                await updateSetting({ ...msgSetting, setting: filterMsg });
            } else {
                await createSetting({ type: 'SYSTEM_MESSAGE_PD_1', setting: filterMsg });
            }
            const modelSetting = await getSettingByType('MODEL_PD_1');
            if (modelSetting) {
                await updateSetting({ ...modelSetting, setting: filterModel });
            } else {
                await createSetting({ type: 'MODEL_PD_1', setting: filterModel });
            }
            message.success('Đã lưu cấu hình Bot lọc dữ liệu!');
        } catch (e) {
            message.error('Lỗi khi lưu cấu hình Bot lọc dữ liệu!');
        } finally {
            setFilterSaving(false);
        }
    };

    // --- Default prompt cho PowerDrill ---
    const loadPrompt = async () => {
        setPromptLoading(true);
        try {
            const setting = await getSettingByType('SYSTEM_PROMT_POWER_DRILL');
            setPrompt(setting?.setting || '');
        } catch (e) {
            setPrompt('');
        } finally {
            setPromptLoading(false);
        }
    };
    const savePrompt = async () => {
        setPromptSaving(true);
        try {
            const existingSetting = await getSettingByType('SYSTEM_PROMT_POWER_DRILL');
            if (existingSetting) {
                await updateSetting({ ...existingSetting, setting: prompt });
            } else {
                await createSetting({ type: 'SYSTEM_PROMT_POWER_DRILL', setting: prompt });
            }
            message.success('Đã lưu prompt mặc định thành công!');
            onClose();
        } catch (e) {
            message.error('Không thể lưu prompt mặc định');
        } finally {
            setPromptSaving(false);
        }
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <Modal
            title="Cấu hình PowerDrill AI"
            open={open}
            onCancel={handleCancel}
            width={'80vw'}
            footer={null}
            centered
        >
            <div style={{ display: 'flex', gap: 24, marginBottom: 32, height: '80vh' }}>
                {/* Bot tạo mô tả (dùng chung AI truyền thống) */}
                <div style={{ height: '100%', minWidth: 260 }}>
                    <h4>Bot tạo Mô tả (dùng chung với AI truyền thống)</h4>
                    <Spin spinning={descLoading}>
                        <Select
                            style={{ width: '100%', marginBottom: 8, height: '35px' }}
                            value={descModel}
                            onChange={setDescModel}
                            options={MODEL_AI_LIST}
                        />
                        <TextArea
                            value={descMsg}
                            onChange={e => setDescMsg(e.target.value)}
                            placeholder="System message cho bot tạo mô tả..."
                            rows={6}
                            style={{ height: 'calc(80vh - 100px)' }}
                        />
                        <Button
                            type="primary"
                            onClick={saveDescConfig}
                            loading={descSaving}
                            style={{ marginTop: 8, height: '35px' }}
                        >
                            Lưu cấu hình
                        </Button>
                    </Spin>
                </div>
                {/* Bot lọc dữ liệu */}
                <div style={{ height: '100%', minWidth: 260 }}>
                    <h4>Bot lọc dữ liệu</h4>
                    <Spin spinning={filterLoading}>
                        <Select
                            style={{ width: '100%', marginBottom: 8, height: '35px' }}
                            value={filterModel}
                            onChange={setFilterModel}
                            options={MODEL_AI_LIST}
                        />
                        <TextArea
                            value={filterMsg}
                            onChange={e => setFilterMsg(e.target.value)}
                            placeholder="System message cho bot lọc dữ liệu..."
                            rows={6}
                            style={{ height: 'calc(80vh - 100px)' }}
                        />
                        <Button
                            type="primary"
                            onClick={saveFilterConfig}
                            loading={filterSaving}
                            style={{ marginTop: 8, height: '35px' }}
                        >
                            Lưu cấu hình
                        </Button>
                    </Spin>
                </div>
                {/* Default prompt cho PowerDrill */}
                <div style={{ height: '100%',  width: '33.33%' }}>
                    <h4>Prompt mặc định cho PowerDrill</h4>
                    <div style={{ marginTop: 8, fontSize: 12, color: '#999', height: '35px' }}>
                            Số ký tự: {prompt.length}
                        </div>
                    <Spin spinning={promptLoading}>
                        <TextArea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="Nhập prompt mặc định sẽ được nối vào trước câu hỏi..."
                            style={{ height: 'calc(80vh - 100px)', width: '100%' }}
                        />
                       
                        <Button
                            type="primary"
                            onClick={savePrompt}
                            loading={promptSaving}
                            style={{ marginTop: 8 }}
                        >
                            Lưu prompt
                        </Button>
                    </Spin>
                </div>
            </div>
        </Modal>
    );
};

export default PowerDrillPromptModal; 