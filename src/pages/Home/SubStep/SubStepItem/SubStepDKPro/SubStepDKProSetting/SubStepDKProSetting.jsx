import React, { useState, useEffect } from 'react';
import styles from './SubStepDKProSetting.module.css';
import { updateDinhKhoanPro } from '../../../../../../apis/dinhKhoanProService';
import { message } from 'antd';
import { Select } from 'antd';
// API
import { getAllSheetColumnBySheetId } from '../../../../../../apis/sheetColumnService';
import { getAllStep } from '../../../../../../apis/stepService';
import { getAllSubStep } from '../../../../../../apis/subStepService';
import { getAllInput } from '../../../../../../apis/inputService';
// ICON
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
// LIST
import { DANH_MUC_LIST } from '../../../../../../Consts/DANH_MUC_LIST';

const SettingDkProPopup = ({ dinhKhoanProData, setDinhKhoanProData, onClose, formStep, DANH_MUC_LIST }) => {
    const [colList, setColList] = useState([]);
    const [listStep, setListStep] = useState([]);
    const [listInput, setListInput] = useState([]);
    const [settings, setSettings] = useState(() => {
        const normalizeSetting = (setting, defaultType = 'category') => {
            if (typeof setting === 'string') {
                return { type: defaultType, id: setting, field: null };
            }

            return {
                type: setting?.type || defaultType,
                id: setting?.id || null,
                field: setting?.field || null
            };
        };

        return {
            showKMF: dinhKhoanProData.showKMF,
            showKMTC: dinhKhoanProData.showKMTC,
            showDuAn: dinhKhoanProData.showDuAn,
            showSanPham: dinhKhoanProData.showSanPham,
            showNcc: dinhKhoanProData.showNcc,
            showHopDong: dinhKhoanProData.showHopDong,
            showKhachHang: dinhKhoanProData.showKhachHang,

            settingKMF: normalizeSetting(dinhKhoanProData.settingKMF),
            settingKMTC: normalizeSetting(dinhKhoanProData.settingKMTC),
            settingDuAn: normalizeSetting(dinhKhoanProData.settingDuAn),
            settingSanPham: normalizeSetting(dinhKhoanProData.settingSanPham),
            settingNcc: normalizeSetting(dinhKhoanProData.settingNcc),
            settingHopDong: normalizeSetting(dinhKhoanProData.settingHopDong),
            settingKhachHang: normalizeSetting(dinhKhoanProData.settingKhachHang),
            settingChuThich: dinhKhoanProData.settingChuThich
                ? {
                    useInput: dinhKhoanProData.settingChuThich.useInput || false,
                    inputId: dinhKhoanProData.settingChuThich.inputId || null
                }
                : {
                    useInput: false,
                    inputId: null
                }
        };
    });

    const [expandedSections, setExpandedSections] = useState({});

    const getDropDownData = async () => {
        try {
            const results = await Promise.all(
                formStep.map(async (item) => {
                    const sheetColumnList = await getAllSheetColumnBySheetId(item.id);
                    return sheetColumnList.map((sheetCol) => ({
                        key: `${item.name} - ${sheetCol.name}`,
                        value: sheetCol.id,
                    }));
                })
            );
            const updatedColList = results.flat();
            setColList(updatedColList);
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Error fetching data');
        }
    }

    const getAllInputOfTemp = async () => {
        const steps = await getAllStep();
        const subSteps = await getAllSubStep();
        const inputs = await getAllInput();

        let filterStep = steps.filter(step => step.template_id == idTemp);
        let filterStepIds = filterStep.map(step => step.id);
        let filterSubStep = subSteps.filter(subStep =>
            filterStepIds.some(id => subStep.step_id == id)
        );
        let finalFilteredData = inputs.filter(input =>
            filterSubStep.some(sub => sub.id == input.sub_step_id)
        );

        filterStep.sort((a, b) => a.position - b.position);
        filterSubStep.sort((a, b) => a.position - b.position);
        finalFilteredData.sort((a, b) => a.position - b.position);

        filterSubStep.forEach(subStep => {
            subStep.inputs = finalFilteredData.filter(input => input.sub_step_id == subStep.id);
        });

        filterStep.forEach(step => {
            step.subSteps = filterSubStep.filter(subStep => subStep.step_id == step.id);
        });

        setListStep(filterStep);
        setListInput(finalFilteredData);
        return finalFilteredData;
    };

    useEffect(() => {
        getAllInputOfTemp();
        getDropDownData();
    }, [idTemp]);

    const toggleSetting = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleColumnChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: { type: 'sheet', id: value }
        }));
    };

    const toggleSection = (key) => {
        setExpandedSections(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = async () => {
        try {
            const updatedData = await updateDinhKhoanPro({
                id: dinhKhoanProData.id,
                showKMF: settings.showKMF,
                settingKMF: settings.settingKMF.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingKMF.id }
                    : {
                        type: 'category',
                        id: settings.settingKMF.id,
                        field: settings.settingKMF.field
                    },
                showKMTC: settings.showKMTC,
                settingKMTC: settings.settingKMTC.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingKMTC.id }
                    : { type: 'category', id: settings.settingKMTC.id, field: settings.settingKMTC.field },
                showDuAn: settings.showDuAn,
                settingDuAn: settings.settingDuAn.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingDuAn.id }
                    : { type: 'category', id: settings.settingDuAn.id, field: settings.settingDuAn.field },
                showSanPham: settings.showSanPham,
                settingSanPham: settings.settingSanPham.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingSanPham.id }
                    : { type: 'category', id: settings.settingSanPham.id, field: settings.settingSanPham.field },
                showNcc: settings.showNcc,
                settingNcc: settings.settingNcc.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingNcc.id }
                    : { type: 'category', id: settings.settingSanPham.id, field: settings.settingNcc.field },
                showHopDong: settings.showHopDong,
                settingHopDong: settings.settingHopDong.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingHopDong.id }
                    : { type: 'category', id: settings.settingHopDong.id, field: settings.settingHopDong.field },
                showKhachHang: settings.showKhachHang,
                settingKhachHang: settings.settingKhachHang.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingKhachHang.id }
                    : { type: 'category', id: settings.settingKhachHang.id, field: settings.settingKhachHang.field },
                settingChuThich: settings.settingChuThich
                    ? {
                        useInput: settings.settingChuThich.useInput || false,
                        inputId: settings.settingChuThich.useInput
                            ? settings.settingChuThich.inputId
                            : null
                    }
                    : null,
            });
            setDinhKhoanProData(updatedData);
            onClose();
            message.success("Cập nhật cài đặt thành công!");
        } catch (error) {
            console.error('Failed to update settings:', error);
            message.error("Cập nhật cài đặt thất bại!");
        }
    };

    const sections = [
        {
            value: 'note',
            label: 'Chú thích',
            settingKey: 'settingChuThich',
            isNote: true
        },
        {
            key: 'showKMF',
            value: 'kmf',
            label: 'Khoản Mục Phí',
            show: dinhKhoanProData.showKMF,
            settingKey: 'settingKMF'
        },
        {
            key: 'showKMTC',
            label: 'Khoản Mục Thu Chi',
            value: 'kmtc',
            show: dinhKhoanProData.showKMTC,
            settingKey: 'settingKMTC'
        },
        {
            key: 'showDuAn',
            label: 'Dự Án',
            value: 'duAn',
            show: dinhKhoanProData.showDuAn,
            settingKey: 'settingDuAn'
        },
        {
            key: 'showSanPham',
            label: 'Sản Phẩm',
            value: 'sanPham',
            show: dinhKhoanProData.showSanPham,
            settingKey: 'settingSanPham'
        },
        {
            key: 'showNcc',
            label: 'Nhà Cung Cấp',
            value: 'nhaCungCap',
            show: dinhKhoanProData.showNcc,
            settingKey: 'settingNcc'
        },
        {
            key: 'showHopDong',
            label: 'Hợp Đồng',
            value: 'hopDong',
            show: dinhKhoanProData.showHopDong,
            settingKey: 'settingHopDong'
        },
        {
            key: 'showKhachHang',
            label: 'Khách Hàng',
            value: 'khachHang',
            show: dinhKhoanProData.showKhachHang,
            settingKey: 'settingKhachHang'
        },
    ];

    const toggleSettingType = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                type: prev[key].type === 'sheet' ? 'category' : 'sheet',
                id: prev[key].type === 'sheet' ? null : prev[key].id
            }
        }));
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.popup}>
                    <div className={styles.popupHeader}>
                        <h2 className={styles.title}>Cài Đặt Định Khoản</h2>
                        <button className={styles.closeButton} onClick={onClose}>×</button>
                    </div>
                    <div className={styles.popupContent}>
                        {sections.map(section => (
                            <div key={section.key} className={styles.section}>
                                <div
                                    className={styles.sectionHeader}
                                    onClick={() => toggleSection(section.key)}
                                >
                                    <span>{section.label}
                                        {!section.isNote && (
                                            <span
                                                data-state={settings[section.key] ? 'Hiện' : 'Ẩn'}
                                                style={{
                                                    color: settings[section.key] ? 'green' : 'red',
                                                    marginLeft: '8px'
                                                }}
                                            >
                                                {settings[section.key] ? 'Hiện' : 'Ẩn'}
                                            </span>
                                        )}
                                    </span>
                                    <span className={styles.toggleIcon}>
                                        {expandedSections[section.key] ? '▼' : '►'}
                                    </span>
                                </div>

                                {expandedSections[section.key] && (
                                    <div className={styles.sectionContent}>
                                        {section.isNote ? (
                                            <div className={styles.checkboxContainer}>
                                                <input
                                                    type="checkbox"
                                                    id={`${section.value}-use-input`}
                                                    checked={settings[section.settingKey]?.useInput}
                                                    onChange={() => {
                                                        setSettings(prev => ({
                                                            ...prev,
                                                            [section.settingKey]: {
                                                                ...prev[section.settingKey],
                                                                useInput: !prev[section.settingKey]?.useInput
                                                            }
                                                        }));
                                                    }}
                                                    className={styles.checkbox}
                                                />
                                                <label
                                                    htmlFor={`${section.value}-use-input`}
                                                    className={styles.checkboxLabel}
                                                >
                                                    Sử dụng Input
                                                </label>
                                            </div>
                                        ) : (
                                            <div className={styles.checkboxContainer}>
                                                <div
                                                    onClick={() => toggleSetting(section.key)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {settings[section.key] ? (
                                                        <VisibilityIcon
                                                            sx={{
                                                                color: 'green',
                                                                fontSize: 30,
                                                                transition: 'transform 0.3s ease',
                                                                '&:hover': { transform: 'scale(1.1)' }
                                                            }}
                                                        />
                                                    ) : (
                                                        <VisibilityOffIcon
                                                            sx={{
                                                                color: 'red',
                                                                fontSize: 30,
                                                                transition: 'transform 0.3s ease',
                                                                '&:hover': { transform: 'scale(1.1)' }
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                {section.key !== 'showSoTien' && settings[section.key] && (
                                                    <div className={styles.checkboxContainer}>
                                                        <input
                                                            type="checkbox"
                                                            id={`${section.key}-type`}
                                                            checked={settings[section.settingKey]?.type === 'sheet'}
                                                            onChange={() => toggleSettingType(section.settingKey)}
                                                            className={styles.checkbox}
                                                        />
                                                        <label
                                                            htmlFor={`${section.key}-type`}
                                                            className={styles.checkboxLabel}
                                                        >
                                                            Lấy từ bảng
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {settings[section.key] && settings[section.settingKey]?.type === 'sheet' && (
                                            <div className={styles.dropdownContainer}>
                                                <Select
                                                    style={{ width: '100%' }}
                                                    placeholder="Chọn cột"
                                                    value={settings[section.settingKey] ? settings[section.settingKey].id : null}
                                                    onChange={(value) => handleColumnChange(section.settingKey, value)}
                                                    options={colList.map(col => ({
                                                        label: col.key,
                                                        value: col.value
                                                    }))}
                                                />
                                            </div>
                                        )}
                                        {settings[section.key] && settings[section.settingKey]?.type === 'category' && (
                                            <div>
                                                <div className={styles.dropdownContainer}>
                                                    <Select
                                                        style={{ width: '100%' }}
                                                        placeholder="Chọn danh mục"
                                                        value={settings[section.settingKey] ? settings[section.settingKey].id : null}
                                                        onChange={(value) => {
                                                            setSettings(prev => ({
                                                                ...prev,
                                                                [section.settingKey]: {
                                                                    ...prev[section.settingKey],
                                                                    type: 'category',
                                                                    id: value,
                                                                    field: null
                                                                }
                                                            }));
                                                        }}
                                                        options={DANH_MUC_LIST
                                                            .filter(dm => !dm.isNotDM)
                                                            .map(dm => ({
                                                                label: dm.label,
                                                                value: dm.key
                                                            }))
                                                        }
                                                    />
                                                </div>
                                                {settings[section.settingKey]?.id && (
                                                    <div className={styles.dropdownContainer}>
                                                        <Select
                                                            style={{ width: '100%' }}
                                                            placeholder="Chọn trường"
                                                            value={settings[section.settingKey]?.field || null}
                                                            onChange={(value) => {
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    [section.settingKey]: {
                                                                        ...prev[section.settingKey],
                                                                        field: value
                                                                    }
                                                                }));
                                                            }}
                                                            options={
                                                                DANH_MUC_LIST
                                                                    .find(dm => dm.key === settings[section.settingKey].id)
                                                                    ?.fields?.map(field => ({
                                                                        label: field.headerName,
                                                                        value: field.field
                                                                    })) || []
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {section.isNote && settings[section.settingKey]?.useInput && (
                                            <div className={styles.dropdownContainer}>
                                                <Select
                                                    style={{ width: '100%' }}
                                                    placeholder="Chọn Input"
                                                    value={settings[section.settingKey]?.inputId}
                                                    onChange={(value) => {
                                                        setSettings(prev => ({
                                                            ...prev,
                                                            [section.settingKey]: {
                                                                ...prev[section.settingKey],
                                                                inputId: value
                                                            }
                                                        }));
                                                    }}
                                                >
                                                    {listInput.map((input, index) => (
                                                        <Select.Option value={input.id} key={index}>
                                                            I{input.id}
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                                {listStep.map((step, indexStep) => (
                                                    <div className={styles.step_container} key={step.id}>
                                                        {step.name}:
                                                        <div className={styles.steps}>
                                                            {step.subSteps && step.subSteps.map((subStep, indexSubStep) => (
                                                                <div key={subStep.id}>
                                                                    {subStep.name}:
                                                                    <div className={styles.steps}>
                                                                        {subStep.inputs && subStep.inputs.map((input, indexInput) => (
                                                                            <div key={input.id}>
                                                                                (I{input.id}): {input.label}, {input.type_input}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className={styles.popupFooter}>
                        <div className={styles.saveButtonContainer}>
                            <button
                                onClick={handleSave}
                                className={styles.saveButton}
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingDkProPopup;