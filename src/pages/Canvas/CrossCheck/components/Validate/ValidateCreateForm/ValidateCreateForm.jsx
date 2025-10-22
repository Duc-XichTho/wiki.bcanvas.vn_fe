import React, { useState, useEffect, useContext } from 'react';
import { message, Select } from 'antd';
import css from './ValidateCreateForm.module.css';
import { createCrossCheck } from "../../../../../../apis/crossCheckService.jsx";
import { 
    getAllTemplateSheetTable, 
    getTemplateColumn 
} from "../../../../../../apis/templateSettingService.jsx";
import { getFileNotePadByIdController } from "../../../../../../apis/fileNotePadService.jsx";
import { MyContext } from "../../../../../../MyContext.jsx";

const RuleInfoSection = ({ tenQuyTac, setTenQuyTac, moTa, setMoTa }) => (
    <div className={css.section}>
        <h2 className={css.sectionTitle}>Thông Tin Quy Tắc</h2>
        <div className={css.formRow}>
            <div className={css.formGroup}>
                <label>Tên Quy Tắc:</label>
                <input
                    type="text"
                    value={tenQuyTac}
                    onChange={(e) => setTenQuyTac(e.target.value)}
                    placeholder="Nhập tên quy tắc"
                />
            </div>
        </div>
        <div className={css.formRow}>
            <div className={css.formGroup}>
                <label>Mô Tả:</label>
                <input
                    type="text"
                    value={moTa}
                    onChange={(e) => setMoTa(e.target.value)}
                    placeholder="Mô tả ngắn về quy tắc kiểm tra"
                />
            </div>
        </div>
    </div>
);

const DataSourceSelector = ({ title, source, setSource, listTemplates }) => {
    const handleSelectChange = (selectedValue) => {
        const selectedItem = listTemplates.find(item => item.value === selectedValue);

        setSource(prevSource => ({
            ...prevSource,
            type: 'Template',
            bo_du_lieu: selectedValue,
            id: selectedItem?.fileNote_id || "",
        }));
    };

    const handleColumnChange = (selectedValue) => {
        setSource(prevSource => ({
            ...prevSource,
            cot_du_lieu: selectedValue
        }));
    };

    return (
        <div className={css.section}>
            <div className={css.sectionTitle}>
                <span>{title}</span>
            </div>
            <div className={css.formRow}>
                <div className={css.formGroup}>
                    <label>Bộ Dữ Liệu:</label>
                    <Select
                        value={source.bo_du_lieu}
                        onChange={handleSelectChange}
                        placeholder="Chọn dạng search filter"
                        style={{ width: '100%' }}
                        showSearch
                        optionFilterProp="children"
                    >
                        {listTemplates.map(item => (
                            <Select.Option key={item.value} value={item.value}>
                                {item.name}
                            </Select.Option>
                        ))}
                    </Select>
                </div>

                {source.bo_du_lieu && (
                    <div className={css.formGroup}>
                        <label>Cột Dữ Liệu:</label>
                        <Select
                            value={source.cot_du_lieu}
                            onChange={handleColumnChange}
                            placeholder="Chọn cột dữ liệu"
                            style={{ width: '100%' }}
                            showSearch
                            optionFilterProp="children"
                        >
                            {(listTemplates.find(item => item.value === source.bo_du_lieu)?.fields || [])
                                .map(item => (
                                    <Select.Option key={item.field} value={item.field}>
                                        {item.headerName}
                                    </Select.Option>
                                ))}
                        </Select>
                    </div>
                )}
            </div>
        </div>
    );
};

const ValidateCreateForm = ({ onBack, setRefetch }) => {
    const { setIsUpdateNoti, isUpdateNoti } = useContext(MyContext);
    const [tenQuyTac, setTenQuyTac] = useState('');
    const [moTa, setMoTa] = useState('');
    const [listTemplates, setListTemplates] = useState([]);
    const [primarySource, setPrimarySource] = useState({
        type: 'Template',
        bo_du_lieu: '',
        cot_du_lieu: ''
    });
    const [checkingSource, setCheckingSource] = useState({
        type: 'Template',
        bo_du_lieu: '',
        cot_du_lieu: ''
    });

    const isFormValid = () => (
        tenQuyTac.trim() !== '' &&
        primarySource.bo_du_lieu !== '' &&
        primarySource.cot_du_lieu !== '' &&
        checkingSource.bo_du_lieu !== '' &&
        checkingSource.cot_du_lieu !== ''
    );

    const handleResetForm = () => {
        setTenQuyTac('');
        setMoTa('');
        setPrimarySource({
            type: 'Template',
            bo_du_lieu: '',
            cot_du_lieu: ''
        });
        setCheckingSource({
            type: 'Template',
            bo_du_lieu: '',
            cot_du_lieu: ''
        });
    };

    const handleSaveRule = async () => {
        try {
            const data = {
                name: tenQuyTac,
                desc: moTa,
                primarySource,
                checkingSource,
                type: 'Validate'
            };

            await createCrossCheck(data)
                .then(() => {
                    message.success('Tạo thành công');
                    handleResetForm();            
                    setRefetch(prev => !prev);
                })
                .catch(() => {
                    message.error('Tạo thất bại');
                });
            setIsUpdateNoti(!isUpdateNoti);
        } catch (error) {
            console.error('ERROR handleSaveRule:', error);
        }
    };
    const fetchTemplateData = async () => {
        try {
            let data = await getAllTemplateSheetTable();
            let validTemplates = [];

            for (const item of data) {
                try {
                    if (!item.fileNote_id) {
                        console.warn('Skipping template - missing fileNote_id:', item);
                        continue;
                    }

                    const fileNote = await getFileNotePadByIdController(item.fileNote_id);
                    if (!fileNote) {
                        console.warn('Skipping template - FileNote not found:', item.fileNote_id);
                        continue;
                    }

                    const columns = await getTemplateColumn(item.id);
                    
                    validTemplates.push({
                        ...item,
                        name: fileNote.name,
                        value: `TEMP_${item.id}`,
                        type: fileNote.table,
                        fields: columns.map(col => ({
                            headerName: col.columnName,
                            field: col.columnName,
                            type: col.columnType
                        })).sort((a, b) => a.headerName.localeCompare(b.headerName))
                    });
                    
                } catch (itemError) {
                    console.warn('Error processing template item:', item, itemError);
                    continue;
                }
            }

            // Sort templates by name
            const sortedTemplates = validTemplates
                .filter(item => item.type === 'Template')
                .sort((a, b) => a.name.localeCompare(b.name));

            setListTemplates(sortedTemplates);
        } catch (error) {
            console.error('Error fetching template data:', error);
            setListTemplates([]);
        }
    };

    useEffect(() => {
        fetchTemplateData();
    }, []);

    return (
        <div className={css.formContainer}>
            <div className={css.sectionContainer}>

                <RuleInfoSection
                    tenQuyTac={tenQuyTac}
                    setTenQuyTac={setTenQuyTac}
                    moTa={moTa}
                    setMoTa={setMoTa}
                />

                <DataSourceSelector
                    title="Dữ liệu cần kiểm soát làm sạch"
                    source={primarySource}
                    setSource={setPrimarySource}
                    listTemplates={listTemplates}
                />

                <DataSourceSelector
                    title="Dữ liệu chuẩn (Master Data)"
                    source={checkingSource}
                    setSource={setCheckingSource}
                    listTemplates={listTemplates}
                />
                
            </div>

            <div className={css.actionButtons}>
                <button
                    onClick={handleSaveRule}
                    className={css.primaryButton}
                    disabled={!isFormValid()}
                    style={{ 
                        opacity: isFormValid() ? 1 : 0.5, 
                        cursor: isFormValid() ? 'pointer' : 'not-allowed' 
                    }}
                >
                    Tạo
                </button>
                <button onClick={handleResetForm} className={css.secondaryButton}>
                    Đặt lại
                </button>
            </div>
        </div>
    );
};

export default ValidateCreateForm;