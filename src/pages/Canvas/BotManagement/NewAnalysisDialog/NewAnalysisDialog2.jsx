import React, { useState, useEffect } from 'react';
import { Eye, PlusCircle } from 'lucide-react';
import css from './NewAnalysisDialog.module.css';
import { im } from 'mathjs';
// API
import { createNewCanvasBot, getAllCanvasBot } from '../../../../apis/canvasBotService';
import { getAllFileTab } from '../../../../apis/fileTabService.jsx';
import { getAllFileNotePad } from '../../../../apis/fileNotePadService.jsx';
import { CANVAS_DATA_PACK } from '../../../../CONST.js';
import { getSettingByType } from '../../../../apis/settingService';

const NewAnalysisDialog2 = ({ isOpen, onClose, idCanvasContainer, fetchData }) => {
    const models = [
        { key: 'claude-3-5-sonnet-20240620', value: 'Claude 3.5 Sonnet' },
        // { key: 'haiku', value: 'Haiku 3.5' },
    ];
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedPacks, setSelectedPacks] = useState([]);
    const [dataPacks, setDataPacks] = useState([]);
    const [notePacks, setNotePacks] = useState([]);
    const [tempPacks, setTempPacks] = useState([]);
    const [KPIPacks, setKPIPacks] = useState([]);
    const [tempChartPacks, setTempChartPacks] = useState([]);
    const [selectedPackPreview, setSelectedPackPreview] = useState();
    const [selectedNotePacks, setSelectedNotePacks] = useState([]);
    const [selectedTempPacks, setSelectedTempPacks] = useState([]);
    const [selectedKPIPacks, setSelectedKPIPacks] = useState([]);
    const [selectedTempChartPacks, setSelectedChartTempPacks] = useState([]);
    const [systemInstructions, setSystemInstructions] = useState('');

    const filteredNotePacks = notePacks
    const filteredTempPacks = tempPacks
    const filteredKPIPacks = KPIPacks
    const filteredTempChartPacks = tempChartPacks

    const loadData = async () => {
        try {
            // Fetch data packs
            const tabs = await getAllFileTab();
            let PacksData = await getAllFileNotePad();
            PacksData = PacksData.filter((pack) => tabs.some((tab) => tab.key === pack.tab));
            const notePacksData = PacksData.filter((pack) => pack.table == 'Tiptap');
            const tempPacksData = PacksData.filter((pack) => pack.table == 'Template');
            const tempChartPacksData = PacksData.filter((pack) => pack.table == 'ChartTemplate');
            const dataPacksData = PacksData.filter((pack) => pack.table == 'Data');
            const dataKPIData = PacksData.filter((pack) => pack.table == 'KPI');
            dataPacksData.forEach((item) => {
                let typeItem = CANVAS_DATA_PACK.find((e) => e.value === item.type);
                if (typeItem && typeItem.isDM) {
                    item.category = 'DM';
                } else if (typeItem && typeItem.isChart) {
                    item.category = 'C';
                } else {
                    item.category = 'BC';
                }
            });
            setDataPacks(dataPacksData);
            setNotePacks(notePacksData);
            setTempPacks(tempPacksData);
            setKPIPacks(dataKPIData);
            setTempChartPacks(tempChartPacksData);

            const promptData = await getSettingByType('SettingPrompt');
            if (promptData && typeof promptData.setting === 'string') {
                setSystemInstructions(promptData.setting);
            } else {
                setSystemInstructions('');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setSystemInstructions('');
        }
    };

    useEffect(() => {
        loadData();
    }, [idCanvasContainer, isOpen]);


    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    const handleSubmit = async () => {
        if (!name || !description || !selectedModel) return;

        const newData = {
            name,
            description,
            model: selectedModel,
            dataPacks: selectedPacks,
            isEditing: false,
            idCanvasContainer,
            notePacks: selectedNotePacks,
            tempPacks: selectedTempPacks,
            tempChartPacks: selectedTempChartPacks,
            kpiPacks: selectedKPIPacks,
            system: systemInstructions
        };

        await createNewCanvasBot(newData);
        await fetchData();

        setName('');
        setDescription('');
        setSelectedModel('');
        setSelectedPacks([]);
        setSystemInstructions('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className={`${css.overlay} ${isOpen ? css.overlayVisible : ''}`}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className={css.dialog}>
                <div className={css.header}>
                    <h2 className={css.title}>Tạo mới Bot</h2>
                </div>
                <div className={css.contentWrapper}>
                    <div className={css.content}>
                        <div className={css.formGroup2}>
                            <label className={css.label}>Tên: </label>
                            <input
                                type="text"
                                className={css.input}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nhập tên"
                            />
                        </div>

                        <div className={css.formGroup2}>
                            <label className={css.label}>Mô hình</label>
                            <select
                                className={css.select}
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                            >
                                <option value="">Chọn mô hình AI</option>
                                {models.map((model) => (
                                    <option key={model.key} value={model.key}>
                                        {model.value}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={css.formGroup}>
                            <label className={css.label}>Mô tả</label>
                            <textarea
                                className={css.textarea}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Nhập mô tả"
                            />
                        </div>
                        <div>
                            <div className={css.formGroup}>
                                <label className={css.label}>Tập dữ liệu Note</label>
                                <div className={css.dataPacks}>
                                    {filteredNotePacks.map((pack) => (
                                        <button
                                            key={pack.id}
                                            className={`${css.button} ${selectedNotePacks.includes(pack.id)
                                                ? css.buttonPrimary
                                                : css.buttonOutline
                                                }`}
                                            onClick={() => {
                                                setSelectedNotePacks((prev) =>
                                                    prev.includes(pack.id)
                                                        ? prev.filter((p) => p !== pack.id)
                                                        : [...prev, pack.id]
                                                );
                                            }}
                                        >
                                            {pack.name}
                                            <Eye size={16} style={{ marginLeft: 8, opacity: 0, transition: 'opacity 0.3s' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePreview(pack)
                                                }} />
                                        </button>
                                    ))}
                                </div>
                                <label className={css.label}>Tập dữ liệu Bảng dữ liệu</label>
                                <div className={css.dataPacks}>
                                    {filteredTempPacks.map((pack) => (
                                        <button
                                            key={pack.id}
                                            className={`${css.button} ${selectedTempPacks.includes(pack.id)
                                                ? css.buttonPrimary
                                                : css.buttonOutline
                                                }`}
                                            onClick={() => {
                                                setSelectedTempPacks((prev) =>
                                                    prev.includes(pack.id)
                                                        ? prev.filter((p) => p !== pack.id)
                                                        : [...prev, pack.id]
                                                );
                                            }}
                                        >
                                            {pack.name}
                                        </button>
                                    ))}
                                </div>
                                <label className={css.label}>Tập dữ liệu Chart Bảng dữ liệu</label>
                                <div className={css.dataPacks}>
                                    {filteredTempChartPacks.map((pack) => (
                                        <button
                                            key={pack.id}
                                            className={`${css.button} ${selectedTempChartPacks.includes(pack.id)
                                                ? css.buttonPrimary
                                                : css.buttonOutline
                                                }`}
                                            onClick={() => {
                                                setSelectedChartTempPacks((prev) =>
                                                    prev.includes(pack.id)
                                                        ? prev.filter((p) => p !== pack.id)
                                                        : [...prev, pack.id]
                                                );
                                            }}
                                        >
                                            {pack.name}
                                        </button>
                                    ))}
                                </div>
                                <label className={css.label}>Tập dữ liệu KPI</label>
                                <div className={css.dataPacks}>
                                    {filteredKPIPacks.map((pack) => (
                                        <button
                                            key={pack.id}
                                            className={`${css.button} ${selectedKPIPacks.includes(pack.id)
                                                ? css.buttonPrimary
                                                : css.buttonOutline
                                                }`}
                                            onClick={() => {
                                                setSelectedKPIPacks((prev) =>
                                                    prev.includes(pack.id)
                                                        ? prev.filter((p) => p !== pack.id)
                                                        : [...prev, pack.id]
                                                );
                                            }}
                                        >
                                            {pack.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={css.formGroup}>
                                <label className={css.label}>Hướng dẫn hệ thống</label>
                                <textarea
                                    className={css.textarea}
                                    placeholder="Hướng dẫn hệ thống..."
                                    style={{ height: '8rem' }}
                                    value={systemInstructions}
                                    onChange={(e) => setSystemInstructions(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className={css.footer}>
                    <button
                        className={`${css.buttonPrimary} ${!name || !description || !selectedModel
                            ? css.buttonDisabled
                            : ''
                            }`}
                        onClick={handleSubmit}
                        disabled={!name || !selectedModel}
                    >
                        Create Bot
                    </button>
                    <button
                        className={css.buttonClose}
                        onClick={onClose}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewAnalysisDialog2;
