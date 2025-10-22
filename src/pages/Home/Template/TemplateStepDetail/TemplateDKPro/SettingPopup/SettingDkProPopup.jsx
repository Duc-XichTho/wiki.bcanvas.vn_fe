import React, { useState, useEffect } from 'react';
import styles from './SettingDkProPopup.module.css';
import { updateDinhKhoanPro } from '../../../../../../apis/dinhKhoanProService';
import { message, Select, Input } from 'antd';
import { DANH_MUC_LIST } from '../../../../../../Consts/DANH_MUC_LIST';
// API
import { getAllSheetColumnBySheetId } from '../../../../../../apis/sheetColumnService';
import { getAllStep } from '../../../../../../apis/stepService';
import { getAllSubStep } from '../../../../../../apis/subStepService';
import { getAllInput } from '../../../../../../apis/inputService';
// ICON
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const SettingDkProPopup = ({ dinhKhoanProData, setDinhKhoanProData, onClose, formStep, idTemp, sections }) => {
    const [colList, setColList] = useState([]);
    const [danhMucData, setDanhMucData] = useState([]);
    const [listStep, setListStep] = useState([]);
    const [listInput, setListInput] = useState([]);
    const [settings, setSettings] = useState([]);

    const setupInitialData = async (initialData) => {
        try {
            const updatedSettings = {};
            let needsUpdate = false;

            sections.forEach(section => {
                if (section.settingKey && section.defaultCategory) {
                    const settingKey = section.settingKey;
                    const currentSetting = initialData[settingKey];

                    if (!currentSetting?.id && initialData[section.key]) {
                        updatedSettings[settingKey] = {
                            type: 'category',
                            id: section.defaultCategory,
                            field: 'code',
                            defaultValue: ''
                        };
                        needsUpdate = true;
                    }
                }
            });

            if (needsUpdate) {
                const updatedData = await updateDinhKhoanPro({
                    id: initialData.id,
                    ...initialData,
                    ...updatedSettings
                });
                setDinhKhoanProData(updatedData);
                return updatedData;
            }

            return initialData;
        } catch (error) {
            console.error('Failed to setup initial data:', error);
            message.error("Khởi tạo dữ liệu thất bại!");
            return initialData;
        }
    };

    useEffect(() => {
        const initializeSettings = async () => {
            const initializedData = await setupInitialData(dinhKhoanProData);
            setSettings(() => {
                const normalizeSetting = (setting, defaultType = 'category', defaultCat = null) => {
                    if (typeof setting === 'string') {
                        return { type: defaultType, id: setting || defaultCat, field: null, defaultValue: '' };
                    }

                    return {
                        type: setting?.type || defaultType,
                        id: setting?.id || defaultCat,
                        field: setting?.field || null,
                        defaultValue: setting?.defaultValue || ''
                    };
                };

                return {
                    showKMF: initializedData.showKMF,
                    showKMTC: initializedData.showKMTC,
                    showDuAn: initializedData.showDuAn,
                    showSanPham: initializedData.showSanPham,
                    showNcc: initializedData.showNcc,
                    showHopDong: initializedData.showHopDong,
                    showKhachHang: initializedData.showKhachHang,
                    showEmployee: initializedData.showEmployee,
                    showUnitCode: initializedData.showUnitCode,
                    showHoaDon: initializedData.showHoaDon,
                    showTaiSan: initializedData.showTaiSan,
                    showTemCode: initializedData.showTemCode,
                    showTaiSanDauTu: initializedData.showTaiSanDauTu,
                    showLoaiTien: initializedData.showLoaiTien,
                    showNganHang: initializedData.showNganHang,
                    showChuSoHuu: initializedData.showChuSoHuu,
                    showChuongTrinh: initializedData.showChuongTrinh,
                    showSoTienNguyenTe: initializedData.showSoTienNguyenTe,
                    showFxRate: initializedData.showFxRate,
                    showSoChungTu: initializedData.showSoChungTu,

                    settingKMF: normalizeSetting(initializedData.settingKMF),
                    settingKMTC: normalizeSetting(initializedData.settingKMTC),
                    settingDuAn: normalizeSetting(initializedData.settingDuAn),
                    settingSanPham: normalizeSetting(initializedData.settingSanPham),
                    settingNcc: normalizeSetting(initializedData.settingNcc),
                    settingHopDong: normalizeSetting(initializedData.settingHopDong),
                    settingKhachHang: normalizeSetting(initializedData.settingKhachHang),
                    settingEmployee: normalizeSetting(initializedData.settingEmployee),
                    settingUnitCode: normalizeSetting(initializedData.settingUnitCode),
                    settingHoaDon: normalizeSetting(initializedData.settingHoaDon),
                    settingTaiSan: normalizeSetting(initializedData.settingTaiSan),
                    settingTemCode: normalizeSetting(initializedData.settingTemCode),
                    settingTaiSanDauTu: normalizeSetting(initializedData.settingTaiSanDauTu),
                    settingLoaiTien: normalizeSetting(initializedData.settingLoaiTien),
                    settingNganHang: normalizeSetting(initializedData.settingNganHang),
                    settingChuSoHuu: normalizeSetting(initializedData.settingChuSoHuu),
                    settingChuongTrinh: normalizeSetting(initializedData.settingChuongTrinh),
                    settingSoTienNguyenTe: normalizeSetting(initializedData.settingSoTienNguyenTe),
                    settingFxRate: normalizeSetting(initializedData.settingFxRate),
                    settingSoChungTu: normalizeSetting(initializedData.settingSoChungTu),
                    settingChuThich: initializedData.settingChuThich
                        ? {
                            useInput: initializedData.settingChuThich.useInput || false,
                            inputId: initializedData.settingChuThich.inputId || null
                        }
                        : {
                            useInput: false,
                            inputId: null
                        }
                };
            });
        };

        initializeSettings();
    }, [dinhKhoanProData]);

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

    const loadDanhMucData = async () => {
        let DMDataList = [];
        const danhMucList = DANH_MUC_LIST.filter(dm => dm.isNotDM != true);
        for (const dm of danhMucList) {
            const data = await dm.getAllApi();
            DMDataList.push({
                key: dm.key,
                data: data
            });
        }
        setDanhMucData(DMDataList);
    }

    useEffect(() => {
        loadDanhMucData();
    }, [DANH_MUC_LIST])

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
        setSettings(prev => {
            const section = sections.find(s => s.settingKey === key);
            if ((!value || value === '') && section?.defaultCategory) {
                return {
                    ...prev,
                    [key]: {
                        type: 'category',
                        id: section.defaultCategory,
                        field: null,
                        defaultValue: ''
                    }
                };
            }

            return {
                ...prev,
                [key]: {
                    type: 'sheet',
                    id: value,
                    field: null,
                    defaultValue: ''
                }
            };
        });
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
                        field: settings.settingKMF.field,
                        defaultValue: settings.settingKMF.defaultValue
                    },
                showKMTC: settings.showKMTC,
                settingKMTC: settings.settingKMTC.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingKMTC.id }
                    : {
                        type: 'category',
                        id: settings.settingKMTC.id,
                        field: settings.settingKMTC.field,
                        defaultValue: settings.settingKMTC.defaultValue
                    },
                showDuAn: settings.showDuAn,
                settingDuAn: settings.settingDuAn.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingDuAn.id }
                    : {
                        type: 'category',
                        id: settings.settingDuAn.id,
                        field: settings.settingDuAn.field,
                        defaultValue: settings.settingDuAn.defaultValue
                    },
                showSanPham: settings.showSanPham,
                settingSanPham: settings.settingSanPham.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingSanPham.id }
                    : {
                        type: 'category',
                        id: settings.settingSanPham.id,
                        field: settings.settingSanPham.field,
                        defaultValue: settings.settingSanPham.defaultValue
                    },
                showNcc: settings.showNcc,
                settingNcc: settings.settingNcc.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingNcc.id }
                    : {
                        type: 'category',
                        id: settings.settingNcc.id,
                        field: settings.settingNcc.field,
                        defaultValue: settings.settingNcc.defaultValue
                    },
                showHopDong: settings.showHopDong,
                settingHopDong: settings.settingHopDong.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingHopDong.id }
                    : {
                        type: 'category',
                        id: settings.settingHopDong.id,
                        field: settings.settingHopDong.field,
                        defaultValue: settings.settingHopDong.defaultValue
                    },
                showKhachHang: settings.showKhachHang,
                settingKhachHang: settings.settingKhachHang.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingKhachHang.id }
                    : {
                        type: 'category',
                        id: settings.settingKhachHang.id,
                        field: settings.settingKhachHang.field,
                        defaultValue: settings.settingKhachHang.defaultValue
                    },
                showEmployee: settings.showEmployee,
                settingEmployee: settings.settingEmployee.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingEmployee.id }
                    : {
                        type: 'category',
                        id: settings.settingEmployee.id,
                        field: settings.settingEmployee.field,
                        defaultValue: settings.settingEmployee.defaultValue
                    },
                showUnitCode: settings.showUnitCode,
                settingUnitCode: settings.settingUnitCode.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingUnitCode.id }
                    : {
                        type: 'category',
                        id: settings.settingUnitCode.id,
                        field: settings.settingUnitCode.field,
                        defaultValue: settings.settingUnitCode.defaultValue
                    },
                showHoaDon: settings.showHoaDon,
                settingHoaDon: settings.settingHoaDon.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingHoaDon.id }
                    : {
                        type: 'category',
                        id: settings.settingHoaDon.id,
                        field: settings.settingHoaDon.field,
                        defaultValue: settings.settingHoaDon.defaultValue
                    },
                showTaiSan: settings.showTaiSan,
                settingTaiSan: settings.settingTaiSan.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingTaiSan.id }
                    : {
                        type: 'category',
                        id: settings.settingTaiSan.id,
                        field: settings.settingTaiSan.field,
                        defaultValue: settings.settingTaiSan.defaultValue
                    },
                showTemCode: settings.showTemCode,
                settingTemCode: settings.settingTemCode.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingTemCode.id }
                    : {
                        type: 'category',
                        id: settings.settingTemCode.id,
                        field: settings.settingTemCode.field,
                        defaultValue: settings.settingTemCode.defaultValue
                    },
                showTaiSanDauTu: settings.showTaiSanDauTu,
                settingTaiSanDauTu: settings.settingTaiSanDauTu.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingTaiSanDauTu.id }
                    : {
                        type: 'category',
                        id: settings.settingTaiSanDauTu.id,
                        field: settings.settingTaiSanDauTu.field,
                        defaultValue: settings.settingTaiSanDauTu.defaultValue
                    },
                showLoaiTien: settings.showLoaiTien,
                settingLoaiTien: settings.settingLoaiTien.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingLoaiTien.id }
                    : {
                        type: 'category',
                        id: settings.settingLoaiTien.id,
                        field: settings.settingLoaiTien.field,
                        defaultValue: settings.settingLoaiTien.defaultValue
                    },
                showNganHang: settings.showNganHang,
                settingNganHang: settings.settingNganHang.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingNganHang.id }
                    : {
                        type: 'category',
                        id: settings.settingNganHang.id,
                        field: settings.settingNganHang.field,
                        defaultValue: settings.settingNganHang.defaultValue
                    },
                showChuSoHuu: settings.showChuSoHuu,
                settingChuSoHuu: settings.settingChuSoHuu.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingChuSoHuu.id }
                    : {
                        type: 'category',
                        id: settings.settingChuSoHuu.id,
                        field: settings.settingChuSoHuu.field,
                        defaultValue: settings.settingChuSoHuu.defaultValue
                    },
                showChuongTrinh: settings.showChuongTrinh,
                settingChuongTrinh: settings.settingChuongTrinh.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingChuongTrinh.id }
                    : {
                        type: 'category',
                        id: settings.settingChuongTrinh.id,
                        field: settings.settingChuongTrinh.field,
                        defaultValue: settings.settingChuongTrinh.defaultValue
                    },
                showSoTienNguyenTe: settings.showSoTienNguyenTe,
                settingSoTienNguyenTe: settings.settingSoTienNguyenTe.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingSoTienNguyenTe.id }
                    : {
                        type: 'category',
                        id: settings.settingSoTienNguyenTe.id,
                        field: settings.settingSoTienNguyenTe.field,
                        defaultValue: settings.settingSoTienNguyenTe.defaultValue
                    },
                showFxRate: settings.showFxRate,
                settingFxRate: settings.settingFxRate.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingFxRate.id }
                    : {
                        type: 'category',
                        id: settings.settingFxRate.id,
                        field: settings.settingFxRate.field,
                        defaultValue: settings.settingFxRate.defaultValue
                    },
                showSoChungTu: settings.showSoChungTu,
                settingSoChungTu: settings.settingSoChungTu.type === 'sheet'
                    ? { type: 'sheet', id: settings.settingSoChungTu.id }
                    : {
                        type: 'category',
                        id: settings.settingSoChungTu.id,
                        field: settings.settingSoChungTu.field,
                        defaultValue: settings.settingSoChungTu.defaultValue
                    },
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

    const toggleSettingType = (key) => {
        setSettings(prev => {
            const section = sections.find(s => s.settingKey === key);
            const defaultCategory = section?.defaultCategory ||
                DANH_MUC_LIST.find(dm => dm.key === section?.value)?.key;

            const newType = prev[key].type === 'sheet' ? 'category' : 'sheet';
            const newId = newType === 'category' ? defaultCategory : null;

            return {
                ...prev,
                [key]: {
                    ...prev[key],
                    type: newType,
                    id: newId,
                    field: null,
                    defaultValue: ''
                }
            };
        });
    };

    const getFilteredDefaultValues = (categoryKey, fieldName) => {
        if (!categoryKey || !fieldName) return [];
        const categoryData = danhMucData.find(dm => dm.key === categoryKey);
        if (!categoryData || !categoryData.data) return [];

        const uniqueValues = [...new Set(categoryData.data.map(item => item[fieldName]))];
        return uniqueValues
            .filter(value => value != null)
            .sort((a, b) => {
                if (typeof a === 'string' && typeof b === 'string') {
                    return a.localeCompare(b);
                }
                return a - b;
            })
            .map(value => {
                const item = categoryData.data.find(d => d[fieldName] === value);
                const displayValue = fieldName != 'name' && item.name
                    ? `${value} | ${item.name}`
                    : value.toString();

                return {
                    label: displayValue,
                    value: value.toString()
                };
            });
    };

    const renderDefaultValueSelection = (section, settingKey) => {
        const currentSetting = settings[settingKey];
        if (!currentSetting?.type === 'category' || !currentSetting?.id || !currentSetting?.field) {
            return null;
        }

        const filteredValues = getFilteredDefaultValues(currentSetting.id, currentSetting.field);

        return (
            <div className={styles.dropdownContainer}>
                <Select
                    style={{ width: '100%' }}
                    placeholder="Chọn giá trị mặc định"
                    value={currentSetting.defaultValue || undefined}
                    onChange={(value) => {
                        setSettings(prev => ({
                            ...prev,
                            [settingKey]: {
                                ...prev[settingKey],
                                defaultValue: value
                            }
                        }));
                    }}
                    options={filteredValues}
                    showSearch
                    filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                />
            </div>
        );
    };

    const renderCategorySelect = (section, settingKey) => (
        <Select
            style={{ width: '100%' }}
            placeholder="Chọn danh mục"
            value={settings[settingKey]?.id || section.defaultCategory}
            onChange={(value) => {
                setSettings(prev => ({
                    ...prev,
                    [settingKey]: {
                        ...prev[settingKey],
                        type: 'category',
                        id: value || section.defaultCategory,
                        field: null,
                        defaultValue: ''
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
    );

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
                                                    {renderCategorySelect(section, section.settingKey)}
                                                </div>
                                                {settings[section.settingKey]?.id && (
                                                    <div>
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
                                                                            field: value,
                                                                            defaultValue: ''
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
                                                        {settings[section.settingKey]?.type === 'category' &&
                                                            settings[section.settingKey]?.id &&
                                                            settings[section.settingKey]?.field && (
                                                                <div className={styles.dropdownContainer}>
                                                                    {renderDefaultValueSelection(section, section.settingKey)}
                                                                </div>
                                                            )}
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