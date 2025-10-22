import React, {useContext, useEffect, useState} from 'react';
import {Info, Save, XCircle} from 'lucide-react';
import styles from './ChuKy.module.css';
import {updatePMVDeployment} from "../../../../../apis/pmvDeploymentService.jsx";
import {createTimestamp} from "../../../../../generalFunction/format.js";
import {MyContext} from "../../../../../MyContext.jsx";
import {Button, Input, message, Modal} from "antd";
import {createNewPMVChuKy} from "../../../../../apis/pmvChuKyService.jsx";

const CyclicalConfigModal = ({isOpen, setIsOpen, selectedDeployment}) => {
    // const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('week');
    const [showModal, setShowModal,] = useState(false);
    // Modal đặt tên
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [tempConfigName, setTempConfigName] = useState('');
    const [tempConfigData, setTempConfigData] = useState(null);
    const { currentUser} = useContext(MyContext)

    const [configTitle, setConfigTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    // Cấu hình cho chu kỳ tuần
    const [weekPreset, setWeekPreset] = useState('even');
    const [weekConfig, setWeekConfig] = useState({
        1: 2, // Thứ 2
        2: 2, // Thứ 3
        3: 2, // Thứ 4
        4: 2, // Thứ 5
        5: 3, // Thứ 6
        6: 4, // Thứ 7
        0: 3, // Chủ nhật
    });
    const [weekPresets, setWeekPresets] = useState([
        {id: 'even', name: 'Chia đều các ngày', isSystem: true},
        {id: 'weekend-strong', name: 'Cao điểm cuối tuần', isSystem: true},
        {id: 'mid-week-strong', name: 'Cao điểm giữa tuần', isSystem: true}
    ]);

    // Cấu hình cho chu kỳ tháng
    const [monthPreset, setMonthPreset] = useState('even');
    const [monthConfig, setMonthConfig] = useState([2, 2, 2, 2]); // 4 tuần
    const [monthPresets, setMonthPresets] = useState([
        {id: 'even', name: 'Chia đều các tuần', isSystem: true},
        {id: 'start-peak', name: 'Cao điểm đầu tháng', isSystem: true},
        {id: 'middle-peak', name: 'Cao điểm giữa tháng', isSystem: true},
        {id: 'end-peak', name: 'Cao điểm cuối tháng', isSystem: true}
    ]);

    // Cấu hình cho chu kỳ năm
    const [yearPreset, setYearPreset] = useState('even');
    const [yearConfig, setYearConfig] = useState(Array(12).fill(2));
    const [yearPresets, setYearPresets] = useState([
        {id: 'even', name: 'Chia đều các tháng', isSystem: true},
        {id: 'summer-peak', name: 'Cao điểm mùa hè', isSystem: true},
        {id: 'holiday-peak', name: 'Cao điểm cuối năm', isSystem: true}
    ]);

    // Thay đổi cấu hình tuần theo preset
    useEffect(() => {
        const presetId = weekPreset;
        // Tìm trong danh sách presets tùy chỉnh
        const customPreset = weekPresets.find(p => p.id === presetId && !p.isSystem);

        if (customPreset) {
            // Nếu là preset tùy chỉnh, áp dụng cấu hình từ preset đó
            setWeekConfig({...customPreset.config});
            return;
        }

        // Xử lý các preset hệ thống
        switch (presetId) {
            case 'weekend-strong':
                setWeekConfig({
                    1: 2, // Thứ 2
                    2: 2, // Thứ 3
                    3: 2, // Thứ 4
                    4: 2, // Thứ 5
                    5: 3, // Thứ 6
                    6: 4, // Thứ 7
                    0: 3, // Chủ nhật
                });
                break;
            case 'mid-week-strong':
                setWeekConfig({
                    1: 2, // Thứ 2
                    2: 3, // Thứ 3
                    3: 4, // Thứ 4
                    4: 3, // Thứ 5
                    5: 2, // Thứ 6
                    6: 2, // Thứ 7
                    0: 1, // Chủ nhật
                });
                break;
            case 'even':
                setWeekConfig({
                    1: 2, // Thứ 2
                    2: 2, // Thứ 3
                    3: 2, // Thứ 4
                    4: 2, // Thứ 5
                    5: 2, // Thứ 6
                    6: 2, // Thứ 7
                    0: 2, // Chủ nhật
                });
                break;
            default:
                break;
        }
    }, [weekPreset]);

    // Thay đổi cấu hình tháng theo preset
    useEffect(() => {
        const presetId = monthPreset;
        // Tìm trong danh sách presets tùy chỉnh
        const customPreset = monthPresets.find(p => p.id === presetId && !p.isSystem);

        if (customPreset) {
            // Nếu là preset tùy chỉnh, áp dụng cấu hình từ preset đó
            setMonthConfig([...customPreset.config]);
            return;
        }

        // Xử lý các preset hệ thống
        const newMonthConfig = [2, 2, 2, 2]; // Mặc định - trung bình

        switch (presetId) {
            case 'start-peak':
                // Cao điểm đầu tháng
                newMonthConfig[0] = 4;
                newMonthConfig[1] = 3;
                break;
            case 'middle-peak':
                // Cao điểm giữa tháng
                newMonthConfig[1] = 3;
                newMonthConfig[2] = 4;
                break;
            case 'end-peak':
                // Cao điểm cuối tháng
                newMonthConfig[2] = 3;
                newMonthConfig[3] = 4;
                break;
            case 'even':
                // Giữ nguyên 2 cho tất cả tuần
                break;
            default:
                return;
        }

        setMonthConfig(newMonthConfig);
    }, [monthPreset]);

    // Thay đổi cấu hình năm theo preset
    useEffect(() => {
        const presetId = yearPreset;
        // Tìm trong danh sách presets tùy chỉnh
        const customPreset = yearPresets.find(p => p.id === presetId && !p.isSystem);

        if (customPreset) {
            // Nếu là preset tùy chỉnh, áp dụng cấu hình từ preset đó
            setYearConfig([...customPreset.config]);
            return;
        }

        // Xử lý các preset hệ thống
        const newYearConfig = Array(12).fill(2); // Mặc định - trung bình

        switch (presetId) {
            case 'summer-peak':
                // Cao điểm mùa hè (tháng 5-8)
                newYearConfig[4] = 3; // Tháng 5
                newYearConfig[5] = 4; // Tháng 6
                newYearConfig[6] = 4; // Tháng 7
                newYearConfig[7] = 3; // Tháng 8
                break;
            case 'holiday-peak':
                // Cao điểm cuối năm (tháng 11-12)
                newYearConfig[10] = 4; // Tháng 11
                newYearConfig[11] = 5; // Tháng 12
                break;
            case 'even':
                // Giữ nguyên 2 cho tất cả các tháng
                break;
            default:
                return;
        }

        setYearConfig(newYearConfig);
    }, [yearPreset]);

    // Xử lý khi thay đổi giá trị ngày trong tuần
    const handleWeekChange = (day, value) => {
        const newValue = parseInt(value) || 1;
        setWeekConfig(prev => ({
            ...prev,
            [day]: newValue
        }));
    };

    // Xử lý khi thay đổi giá trị tuần trong tháng
    const handleMonthChange = (week, value) => {
        const newValue = parseInt(value) || 1;
        const newConfig = [...monthConfig];
        newConfig[week] = newValue;
        setMonthConfig(newConfig);
    };

    // Xử lý khi thay đổi giá trị tháng trong năm
    const handleYearChange = (month, value) => {
        const newValue = parseInt(value) || 1;
        const newConfig = [...yearConfig];
        newConfig[month] = newValue;
        setYearConfig(newConfig);
    };

    // Tạo bản sao từ cấu hình hiện tại
    const createCopy = () => {
        let defaultName = '';
        let configData = null;

        if (activeTab === 'week') {
            const currentPreset = weekPresets.find(p => p.id === weekPreset);
            defaultName = `${currentPreset?.name || 'Chu kỳ tuần'} - bản sao`;
            configData = {
                type: 'week',
                config: {...weekConfig}
            };
        } else if (activeTab === 'month') {
            const currentPreset = monthPresets.find(p => p.id === monthPreset);
            defaultName = `${currentPreset?.name || 'Chu kỳ tháng'} - bản sao`;
            configData = {
                type: 'month',
                config: [...monthConfig]
            };
        } else {
            const currentPreset = yearPresets.find(p => p.id === yearPreset);
            defaultName = `${currentPreset?.name || 'Chu kỳ năm'} - bản sao`;
            configData = {
                type: 'year',
                config: [...yearConfig]
            };
        }

        setTempConfigName(defaultName);
        setTempConfigData(configData);
        setShowRenameModal(true);
    };

    // Lưu cấu hình vào presets
    const saveToPresets = () => {
        if (!tempConfigName.trim()) {
            alert('Vui lòng nhập tên cấu hình');
            return;
        }

        const newId = `custom-${Date.now()}`;
        const newPreset = {
            id: newId,
            name: tempConfigName,
            config: tempConfigData.config,
            isSystem: false
        };

        if (tempConfigData.type === 'week') {
            setWeekPresets([...weekPresets, newPreset]);
            setWeekPreset(newId);
        } else if (tempConfigData.type === 'month') {
            setMonthPresets([...monthPresets, newPreset]);
            setMonthPreset(newId);
        } else {
            setYearPresets([...yearPresets, newPreset]);
            setYearPreset(newId);
        }

        setShowRenameModal(false);
        setTempConfigName('');
        setTempConfigData(null);
    };

    // Lấy màu nền dựa vào giá trị
    const getBackgroundColor = (value) => {
        switch (value) {
            case 5:
                return 'rgba(37, 156, 99, 1)'; // Đột biến - Đậm nhất
            case 4:
                return 'rgba(37, 156, 99, 0.8)'; // Cao điểm
            case 3:
                return 'rgba(37, 156, 99, 0.6)'; // Bán chạy
            case 2:
                return 'rgba(37, 156, 99, 0.4)'; // Trung bình
            case 1:
                return 'rgba(37, 156, 99, 0.2)'; // Thấp điểm
            default:
                return 'rgba(37, 156, 99, 0.1)';
        }
    };

    // Lấy tên dựa vào giá trị
    const getValueLabel = (value) => {
        switch (value) {
            case 5:
                return 'Đột biến';
            case 4:
                return 'Cao điểm';
            case 3:
                return 'Bán chạy';
            case 2:
                return 'Trung bình';
            case 1:
                return 'Thấp điểm';
            default:
                return '';
        }
    };

    const formatValues =  (values, labels) =>
        Array.isArray(values)
            ? Object.fromEntries(values.map((v, i) => [labels[i], v]))
            : Object.fromEntries(Object.entries(values).map(([k, v]) => [labels[+k], v]));

    const handleApplyConfig = async () => {
        try {
            const configMap = {
                week: { preset: weekPreset, values: weekConfig, labels: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] },
                month: { preset: monthPreset, values: monthConfig, labels: ['T1', 'T2', 'T3', 'T4'] },
                year: {
                    preset: yearPreset,
                    values: yearConfig,
                    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
                }
            };

            const { preset, values, labels } = configMap[activeTab];

            const finalConfig = {
                preset,
                values:  formatValues(values, labels),
                typeConfig: activeTab
            };

            const updatedData = {
                ...selectedDeployment,
                config_period: finalConfig,
                updated_at: createTimestamp(),
                user_update: currentUser.email,
            };

            await updatePMVDeployment(updatedData);
            setIsOpen(false);
            message.success('Cấu hình đã được cập nhật thành công.');
        } catch (error) {
            console.error('Lỗi khi cập nhật cấu hình:', error);
            message.error('Đã xảy ra lỗi khi cập nhật cấu hình. Vui lòng thử lại!');
        }
    };


    const handleSaveConfig = async () => {
        try {
            setIsSaving(true)
            const configMap = {
                week: { preset: weekPreset, values: weekConfig, labels: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] },
                month: { preset: monthPreset, values: monthConfig, labels: ['T1', 'T2', 'T3', 'T4'] },
                year: {
                    preset: yearPreset,
                    values: yearConfig,
                    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
                }
            };

            const { preset, values, labels } = configMap[activeTab];

            const finalConfig = {
                preset,
                values:  formatValues(values, labels),
                typeConfig: activeTab
            };

            const updatedData = {
                name : configTitle,
                config_period: finalConfig,
                created_at: createTimestamp(),
                user_create: currentUser.email,
            };

            await createNewPMVChuKy(updatedData);
            message.success('Cấu hình đã được cập nhật thành công.');
        } catch (error) {
            console.error('Lỗi khi cập nhật cấu hình:', error);
            message.error('Đã xảy ra lỗi khi cập nhật cấu hình. Vui lòng thử lại!');
        }
        finally {
            setIsSaving(true)
            setIsOpen(false);
        }
    }



    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>Cấu hình chu kỳ bán hàng</h3>
                    <button onClick={() => setIsOpen(false)} className={styles.closeButton}>
                        <XCircle className={styles.icon}/>
                    </button>
                </div>

                {/* Tabs */}
                <div className={styles.tabContainer}>
                    <div className={styles.tabsWrapper}>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'week' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('week')}
                        >
                            Chu kỳ tuần
                        </button>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'month' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('month')}
                        >
                            Chu kỳ tháng
                        </button>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'year' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('year')}
                        >
                            Chu kỳ năm
                        </button>
                    </div>
                </div>

                {/* Hướng dẫn sử dụng */}
                <div className={styles.guideContainer}>
                    <Info className={styles.infoIcon}/>
                    <div>
                        <p className={styles.guideTitle}>Thang điểm mức độ bán hàng:</p>
                        <ul className={styles.guideList}>
                            <li className={styles.guideItem}>
                                <div className={styles.colorBox}
                                     style={{backgroundColor: 'rgba(37, 156, 99, 1)'}}></div>
                                <span><strong>5</strong> - Đột biến</span>
                            </li>
                            <li className={styles.guideItem}>
                                <div className={styles.colorBox}
                                     style={{backgroundColor: 'rgba(37, 156, 99, 0.8)'}}></div>
                                <span><strong>4</strong> - Cao điểm</span>
                            </li>
                            <li className={styles.guideItem}>
                                <div className={styles.colorBox}
                                     style={{backgroundColor: 'rgba(37, 156, 99, 0.6)'}}></div>
                                <span><strong>3</strong> - Bán chạy</span>
                            </li>
                            <li className={styles.guideItem}>
                                <div className={styles.colorBox}
                                     style={{backgroundColor: 'rgba(37, 156, 99, 0.4)'}}></div>
                                <span><strong>2</strong> - Trung bình</span>
                            </li>
                            <li className={styles.guideItem}>
                                <div className={styles.colorBox}
                                     style={{backgroundColor: 'rgba(37, 156, 99, 0.2)'}}></div>
                                <span><strong>1</strong> - Thấp điểm</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    {/* Cấu hình chu kỳ tuần */}
                    {activeTab === 'week' && (
                        <div>
                            <div className={styles.presetSelection}>
                                <div className={styles.selectWrapper}>
                                    <label className={styles.selectLabel}>Mẫu chu kỳ tuần</label>
                                    <select
                                        className={styles.select}
                                        value={weekPreset}
                                        onChange={(e) => setWeekPreset(e.target.value)}
                                    >
                                        {weekPresets.map(preset => (
                                            <option key={preset.id} value={preset.id}>
                                                {preset.name} {!preset.isSystem && '(Tùy chỉnh)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/*<button*/}
                                {/*    onClick={createCopy}*/}
                                {/*    className={styles.copyButton}*/}
                                {/*>*/}
                                {/*    <Copy className={styles.buttonIcon} />*/}
                                {/*    Tạo bản sao*/}
                                {/*</button>*/}
                            </div>

                            <div className={styles.configSection}>
                                <div className={styles.sectionHeader}>
                                    <h4 className={styles.sectionTitle}>Phân bổ theo ngày trong tuần</h4>
                                </div>

                                <div className={styles.weekGrid}>
                                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, index) => {
                                        const dayIndex = index === 6 ? 0 : index + 1;
                                        return (
                                            <div key={index} className={styles.gridItem}>
                                                <label className={styles.dayLabel}>{day}</label>
                                                <select
                                                    value={weekConfig[dayIndex]}
                                                    onChange={(e) => handleWeekChange(dayIndex, e.target.value)}
                                                    className={styles.valueSelect}
                                                >
                                                    <option value="1">1 - Thấp điểm</option>
                                                    <option value="2">2 - Trung bình</option>
                                                    <option value="3">3 - Bán chạy</option>
                                                    <option value="4">4 - Cao điểm</option>
                                                    <option value="5">5 - Đột biến</option>
                                                </select>
                                                <div
                                                    className={styles.colorIndicator}
                                                    style={{backgroundColor: getBackgroundColor(weekConfig[dayIndex])}}
                                                >
                                                    <div className={styles.valueLabel}>
                                                        {getValueLabel(weekConfig[dayIndex])}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cấu hình chu kỳ tháng */}
                    {activeTab === 'month' && (
                        <div>
                            <div className={styles.presetSelection}>
                                <div className={styles.selectWrapper}>
                                    <label className={styles.selectLabel}>Mẫu chu kỳ tháng</label>
                                    <select
                                        className={styles.select}
                                        value={monthPreset}
                                        onChange={(e) => setMonthPreset(e.target.value)}
                                    >
                                        {monthPresets.map(preset => (
                                            <option key={preset.id} value={preset.id}>
                                                {preset.name} {!preset.isSystem && '(Tùy chỉnh)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/*<button*/}
                                {/*    onClick={createCopy}*/}
                                {/*    className={styles.copyButton}*/}
                                {/*>*/}
                                {/*    <Copy className={styles.buttonIcon} />*/}
                                {/*    Tạo bản sao*/}
                                {/*</button>*/}
                            </div>

                            <div className={styles.configSection}>
                                <h4 className={styles.sectionTitle}>Phân bổ theo tuần trong tháng</h4>

                                <div className={styles.monthGrid}>
                                    {['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'].map((week, index) => (
                                        <div key={index} className={styles.gridItem}>
                                            <label className={styles.weekLabel}>{week}</label>
                                            <select
                                                value={monthConfig[index]}
                                                onChange={(e) => handleMonthChange(index, e.target.value)}
                                                className={styles.valueSelect}
                                            >
                                                <option value="1">1 - Thấp điểm</option>
                                                <option value="2">2 - Trung bình</option>
                                                <option value="3">3 - Bán chạy</option>
                                                <option value="4">4 - Cao điểm</option>
                                                <option value="5">5 - Đột biến</option>
                                            </select>
                                            <div
                                                className={styles.colorIndicator}
                                                style={{backgroundColor: getBackgroundColor(monthConfig[index])}}
                                            >
                                                <div className={styles.valueLabel}>
                                                    {getValueLabel(monthConfig[index])}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cấu hình chu kỳ năm */}
                    {activeTab === 'year' && (
                        <div>
                            <div className={styles.presetSelection}>
                                <div className={styles.selectWrapper}>
                                    <label className={styles.selectLabel}>Mẫu chu kỳ năm</label>
                                    <select
                                        className={styles.select}
                                        value={yearPreset}
                                        onChange={(e) => setYearPreset(e.target.value)}
                                    >
                                        {yearPresets.map(preset => (
                                            <option key={preset.id} value={preset.id}>
                                                {preset.name} {!preset.isSystem && '(Tùy chỉnh)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/*<button*/}
                                {/*    onClick={createCopy}*/}
                                {/*    className={styles.copyButton}*/}
                                {/*>*/}
                                {/*    <Copy className={styles.buttonIcon} />*/}
                                {/*    Tạo bản sao*/}
                                {/*</button>*/}
                            </div>

                            <div className={styles.configSection}>
                                <h4 className={styles.sectionTitle}>Phân bổ theo tháng trong năm</h4>

                                <div className={styles.yearGrid}>
                                    {['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'].map((month, index) => (
                                        <div key={index} className={styles.gridItem}>
                                            <label className={styles.monthLabel}>{month}</label>
                                            <select
                                                value={yearConfig[index]}
                                                onChange={(e) => handleYearChange(index, e.target.value)}
                                                className={styles.valueSelect}
                                            >
                                                <option value="1">1 - Thấp điểm</option>
                                                <option value="2">2 - Trung bình</option>
                                                <option value="3">3 - Bán chạy</option>
                                                <option value="4">4 - Cao điểm</option>
                                                <option value="5">5 - Đột biến</option>
                                            </select>
                                            <div
                                                className={styles.colorIndicator}
                                                style={{backgroundColor: getBackgroundColor(yearConfig[index])}}
                                            >
                                                <div className={styles.valueLabel}>
                                                    {getValueLabel(yearConfig[index])}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <button
                        onClick={() => setIsOpen(false)}
                        className={styles.cancelButton}
                    >
                        Hủy
                    </button>

                    <button
                        onClick={handleApplyConfig}
                        className={styles.applyButton}
                    >
                        Áp dụng
                    </button>

                    <button
                        onClick={() => setShowModal(true)}
                        className={styles.applyButton}
                    >
                        Lưu cấu hình
                    </button>
                </div>
            </div>

            {/* Modal đặt tên bản sao */}
            {showRenameModal && (
                <div className={styles.renameModalOverlay}>
                    <div className={styles.renameModalContainer}>
                        <div className={styles.renameModalHeader}>
                            <h4 className={styles.renameModalTitle}>Đặt tên cho cấu hình mới</h4>
                            <button onClick={() => setShowRenameModal(false)} className={styles.closeRenameButton}>
                                <XCircle className={styles.smallIcon}/>
                            </button>
                        </div>
                        <div className={styles.renameModalBody}>
                            <label className={styles.inputLabel}>Tên cấu hình</label>
                            <input
                                type="text"
                                className={styles.textInput}
                                value={tempConfigName}
                                onChange={(e) => setTempConfigName(e.target.value)}
                                autoFocus
                            />
                            <div className={styles.renameModalFooter}>
                                <button
                                    onClick={() => setShowRenameModal(false)}
                                    className={styles.cancelButton}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={saveToPresets}
                                    className={styles.saveButton}
                                >
                                    <Save className={styles.buttonIcon}/>
                                    Lưu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            <Modal
                title="Nhập tên cấu hình"
                visible={showModal}
                onCancel={() => setShowModal(false)}
                footer={[
                    <Button key="cancel" onClick={() => setShowModal(false)}>
                        Hủy
                    </Button>,
                    <Button
                        key="save"
                        type="primary"
                        loading={isSaving}
                        onClick={handleSaveConfig}
                        disabled={!configTitle.trim()}
                    >
                        {isSaving ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                ]}
            >
                <Input
                    placeholder="Nhập tên cấu hình"
                    value={configTitle}
                    onChange={(e) => setConfigTitle(e.target.value)}
                />
            </Modal>

        </div>
    );
};

export default CyclicalConfigModal;
