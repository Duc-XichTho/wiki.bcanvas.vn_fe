import { Button, Checkbox, Col, Input, Modal, Popconfirm, Row, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import {
    getAllTemplateTables,
    getTemplateColumn,
    updateTemplateTable,
} from '../../../../../../apis/templateSettingService.jsx';
import { getFileNotePadByIdController } from '../../../../../../apis/fileNotePadService.jsx';
import DeleteIcon from '@mui/icons-material/Delete';
import { useParams } from 'react-router-dom';

const { Search } = Input;

export default function SettingCombine({ showSettingsChartPopup, setShowSettingsChartPopup, templateData, fetchData }) {
    const { id } = useParams();
    const [listTemp, setListTemp] = useState([]);
    const [selectedTemplates, setSelectedTemplates] = useState({});
    const [joinConditions, setJoinConditions] = useState([]);
    const [selectedFields, setSelectedFields] = useState({
        template1: null,
        field1: null,
        template2: null,
        field2: null,
    });
    const [currentStep, setCurrentStep] = useState(1); // Quản lý bước hiện tại: 1 = Bước 1, 2 = Bước 2, 3 = Bước 3
    const [sortColumn, setSortColumn] = useState(null); // Cột để sắp xếp
    const [sortOrder, setSortOrder] = useState('ascend');
    const [newComputedColumn, setNewComputedColumn] = useState({
        formula: '',
        columnName: '',
        variables: [],
        mappings: {},
    });
    const [computedColumns, setComputedColumns] = useState([]);
    const [groupColumn, setGroupColumn] = useState(null);
    const [valueColumn, setValueColumn] = useState([]);
    const [groupFunc, setGroupFunc] = useState('sum');
    const [filterConditions, setFilterConditions] = useState([]);

    const handleGroupFuncChange = (func) => {
        setGroupFunc(func);
        setValueColumn(func === 'sum' ? [] : null);
    };

    function getAllColumnNames() {
        return Object.values(selectedTemplates).flat();
    }

    async function getAllTemplate() {
        let data = await getAllTemplateTables();
        for (const item of data) {
            if (typeof item !== 'object' || item === null) {
                continue;
            }
            let fileNote = await getFileNotePadByIdController(item.fileNote_id);
            item.name = fileNote?.name;
            item.value = 'TEMP_' + item.id;
            item.type = fileNote.table;
            let columns = await getTemplateColumn(item.id);
            item.fields = columns.map(col => ({
                headerName: col.columnName,
                field: col.columnName,
                type: col.columnType,
            }));
        }
        data = data.filter(item => item.type === 'Template');
        setListTemp(data);
    }

    useEffect(() => {
        getAllTemplate();
    }, []);



    useEffect(() => {
        if (templateData?.setting) {
            setJoinConditions(templateData.setting.joinConditions || []);
            setSortColumn(templateData.setting.sortColumn || null);
            setSortOrder(templateData.setting.sortOrder || 'ascend');
            setSelectedTemplates(templateData.setting.selectedTemplates || {});
            setComputedColumns(templateData.setting.computedColumns || []);
            setGroupColumn(templateData.setting.groupColumn || null);
            setGroupFunc(templateData.setting.groupFunc || null);
            setValueColumn(templateData.setting.valueColumn || null);
            setFilterConditions(templateData.setting.filterConditions || []);

        }
    }, [templateData]);

    const handleTemplateSelection = (id) => {
        setSelectedTemplates(prev => ({
            ...prev,
            [id]: prev[id] ? undefined : [],
        }));
    };

    const handleConditionChange = (index, type, value) => {
        const newConditions = [...joinConditions];
        newConditions[index] = {
            ...newConditions[index],
            [type]: value,
        };
        setJoinConditions(newConditions);
    };

    const handleFieldSelection = (templateId, field) => {
        setSelectedTemplates(prev => {
            const selectedFields = prev[templateId] || [];
            const newFields = selectedFields.includes(field)
                ? selectedFields.filter(f => f !== field)
                : [...selectedFields, field];
            return { ...prev, [templateId]: newFields };
        });
    };

    const handleAddCondition = () => {
        if (selectedFields.template1 && selectedFields.field1 && selectedFields.template2 && selectedFields.field2) {
            setJoinConditions([...joinConditions, { ...selectedFields }]);
            setSelectedFields({ template1: null, field1: null, template2: null, field2: null });
        }
    };

    const handleRemoveCondition = (index) => {
        const newConditions = [...joinConditions];
        newConditions.splice(index, 1);
        setJoinConditions(newConditions);
    };

    const handleNextStep = () => {
        if (currentStep === 1) {
            setCurrentStep(2); // Chuyển sang Bước 2
        } else if (currentStep === 2) {
            setCurrentStep(3); // Chuyển sang Bước 3
        }
        else if (currentStep === 3) {
            setCurrentStep(6); // Chuyển sang Bước 3
        }
    };

    const handlePrevStep = () => {
        if (currentStep === 2) {
            setCurrentStep(1); // Quay lại Bước 1
        } else if (currentStep === 3) {
            setCurrentStep(2); // Quay lại Bước 2
        }
         else if (currentStep === 6) {
            setCurrentStep(3); // Quay lại Bước 2
        }
    };


    const handleAddFilterCondition = () => {
        setFilterConditions([...filterConditions, {
            column: '',
            operator: '=',
            value: '',
            logicalOperator: 'AND'
        }]);
    };

    // Hàm xử lý cập nhật điều kiện lọc
    const handleUpdateFilterCondition = (index, field, value) => {
        const newConditions = [...filterConditions];
        newConditions[index] = {
            ...newConditions[index],
            [field]: value
        };
        setFilterConditions(newConditions);
    };

    // Hàm xóa điều kiện lọc
    const handleRemoveFilterCondition = (index) => {
        const newConditions = filterConditions.filter((_, i) => i !== index);
        // Nếu xóa phần tử và còn phần tử khác, đảm bảo phần tử đầu không có logicalOperator
        if (newConditions.length > 0) {
            newConditions[0] = {
                ...newConditions[0],
                logicalOperator: null // hoặc delete newConditions[0].logicalOperator
            };
        }
        setFilterConditions(newConditions);
    };


    const handleSaveSettings = async () => {
        await updateTemplateTable({
            ...templateData,
            isCombine: true,
            setting: {
                joinConditions,
                sortColumn,
                sortOrder,
                selectedTemplates,
                computedColumns,
                groupColumn,
                valueColumn,
                groupFunc,
                filterConditions, // Thêm điều kiện lọc vào settings
            },
        });
        await fetchData();
        setShowSettingsChartPopup(false);
    };


    const handleExtractVariables = () => {
        const formula = newComputedColumn.formula;
        if (!formula) return;

        // Tìm các biến trong công thức (chỉ lấy chữ cái, không lấy số hoặc toán tử)
        const variables = [...new Set(formula.match(/[a-zA-Z]+/g))] || [];

        setNewComputedColumn(prev => ({
            ...prev,
            variables,
            mappings: {},  // Reset ánh xạ cũ
        }));
    };

    const handleVariableMapping = (variable, column) => {
        setNewComputedColumn(prev => ({
            ...prev,
            mappings: { ...prev.mappings, [variable]: column },
        }));
    };

    const handleAddComputedColumn = () => {
        if (!newComputedColumn.columnName || !newComputedColumn.formula) return;

        // Kiểm tra xem tất cả biến đã được ánh xạ chưa
        if (newComputedColumn.variables.some(v => !newComputedColumn.mappings[v])) {
            alert('Bạn cần ánh xạ tất cả biến với các cột!');
            return;
        }

        setComputedColumns([...computedColumns, newComputedColumn]);
        setNewComputedColumn({ formula: '', columnName: '', variables: [], mappings: {} });
    };
    const handleUpdateComputedColumn = (index, key, value) => {
        setComputedColumns(prev => prev.map((col, i) =>
            i === index ? { ...col, [key]: value } : col,
        ));
    };

    const handleUpdateVariableMapping = (index, variable, value) => {
        setComputedColumns(prev => prev.map((col, i) =>
            i === index ? {
                ...col,
                mappings: { ...col.mappings, [variable]: value },
            } : col,
        ));
    };

    const handleDeleteComputedColumn = index => {
        setComputedColumns(prev => prev.filter((_, i) => i !== index));
    };

    const handleSelectAllFields = (templateId, fields) => {
        const allFieldKeys = fields.map(field => field.field);
        const isAllSelected =
            selectedTemplates[templateId]?.length === allFieldKeys.length;

        setSelectedTemplates(prev => ({
            ...prev,
            [templateId]: isAllSelected ? [] : allFieldKeys,
        }));
    };


    return (
        <Modal
        open={showSettingsChartPopup}
        onCancel={() => setShowSettingsChartPopup(false)}
        width={1300}
        title={
            <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', gap:'20px' }}>
                <span>Ghép bảng - Bước {currentStep}</span>
                <div>
                    {currentStep > 1 && (
                        <Button onClick={handlePrevStep} style={{ marginRight: 8 }}>
                            Quay lại
                        </Button>
                    )}
                    {currentStep < 6 && (
                        <Button
                            type="primary"
                            onClick={handleNextStep}
                        >
                            Tiếp theo
                        </Button>
                    )}
                </div>
            </div>
        }
        footer={
            <div style={{ textAlign: 'right' }}>
                <Button
                    type="primary"
                    onClick={handleSaveSettings}
                >
                    Lưu cài đặt
                </Button>
            </div>
        }
        centered={true}
        style={{ padding: '20px', overflow: 'auto' }}
    >
            <div style={{ height: '70vh', overflow: 'auto' }}>
                {currentStep === 1 && (
                    <div>
                        <h3>Bước 1: Chọn Template và Fields</h3>
                        <div>
                            {listTemp.map(template => (
                                <div key={template.id}
                                    style={{ borderBottom: '1px solid #e8e8e8', marginBottom: '15px' }}>
                                    <Checkbox
                                        checked={!!selectedTemplates[template.id]}
                                        onChange={() => handleTemplateSelection(template.id)}
                                        style={{ fontWeight: 'bold' }}
                                    >
                                        {template.name}
                                    </Checkbox>
                                    {selectedTemplates[template.id] && (
                                        <div style={{ marginLeft: 20 }}>
                                            <Checkbox
                                                indeterminate={
                                                    selectedTemplates[template.id].length > 0 &&
                                                    selectedTemplates[template.id].length < template.fields.length
                                                }
                                                checked={selectedTemplates[template.id].length === template.fields.length}
                                                onChange={() => handleSelectAllFields(template.id, template.fields)}
                                                style={{ fontWeight: '500', marginBottom: 8 }}
                                            >
                                                Chọn tất cả
                                            </Checkbox>
                                            <div>
                                                {template.fields.map(field => (
                                                    <Checkbox
                                                        key={field.field}
                                                        checked={selectedTemplates[template.id]?.includes(field.field)}
                                                        onChange={() => handleFieldSelection(template.id, field.field)}
                                                    >
                                                        {field.headerName}
                                                    </Checkbox>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            ))}
                        </div>

                    </div>
                )}

                {currentStep === 2 && (
                    <div>
                        <h3>Bước 2: Chọn Điều kiện JOIN</h3>
                        <div style={{ marginTop: 20 }}>
                            <div>
                                {joinConditions.map((cond, idx) => (
                                    <div key={idx}>
                                        <Row gutter={10} style={{ marginBottom: '10px' }}>
                                            <Col span={5}>
                                                <Select
                                                    style={{ width: '100%' }}
                                                    value={cond.template1}
                                                    onChange={value => handleConditionChange(idx, 'template1', value)}
                                                >
                                                    {listTemp.map(t => selectedTemplates[t.id] &&
                                                        <Select.Option key={t.id}
                                                            value={t.id}>{t.name}</Select.Option>)}
                                                </Select>
                                            </Col>
                                            <Col span={5}>
                                                <Select
                                                    style={{ width: '100%' }}
                                                    value={cond.field1}
                                                    onChange={value => handleConditionChange(idx, 'field1', value)}
                                                >
                                                    {listTemp.find(t => t.id === cond.template1)?.fields.map(f => (
                                                        <Select.Option key={f.field}
                                                            value={f.field}>{f.headerName}</Select.Option>
                                                    ))}
                                                </Select>
                                            </Col>
                                            <Col span={1} style={{ textAlign: 'center', paddingTop: '8px' }}>=</Col>
                                            <Col span={5}>
                                                <Select
                                                    style={{ width: '100%' }}
                                                    value={cond.template2}
                                                    onChange={value => handleConditionChange(idx, 'template2', value)}
                                                >
                                                    {listTemp.map(t => selectedTemplates[t.id] &&
                                                        <Select.Option key={t.id}
                                                            value={t.id}>{t.name}</Select.Option>)}
                                                </Select>
                                            </Col>
                                            <Col span={5}>
                                                <Select
                                                    style={{ width: '100%' }}
                                                    value={cond.field2}
                                                    onChange={value => handleConditionChange(idx, 'field2', value)}
                                                >
                                                    {listTemp.find(t => t.id === cond.template2)?.fields.map(f => (
                                                        <Select.Option key={f.field}
                                                            value={f.field}>{f.headerName}</Select.Option>
                                                    ))}
                                                </Select>
                                            </Col>
                                            <Col span={2}>
                                                <Popconfirm
                                                    title='Bạn có chắc chắn muốn xóa điều kiện này?'
                                                    onConfirm={() => handleRemoveCondition(idx)}
                                                >
                                                    <Button type='link' icon={<DeleteIcon />} style={{ padding: 0 }} />
                                                </Popconfirm>
                                            </Col>
                                        </Row>
                                    </div>
                                ))}
                            </div>

                            {/* Form add condition */}
                            <Row gutter={10}>
                                <Col span={5}>
                                    <Select
                                        placeholder='Chọn template 1'
                                        style={{ width: '100%' }}
                                        onChange={value => setSelectedFields(prev => ({ ...prev, template1: value }))}
                                        value={selectedFields.template1}
                                    >
                                        {listTemp.map(t => selectedTemplates[t.id] &&
                                            <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>)}
                                    </Select>
                                </Col>
                                <Col span={5}>
                                    <Select
                                        placeholder='Chọn cột 1'
                                        style={{ width: '100%' }}
                                        onChange={value => setSelectedFields(prev => ({ ...prev, field1: value }))}
                                        value={selectedFields.field1}
                                        disabled={!selectedFields.template1}
                                    >
                                        {selectedFields.template1 && listTemp.find(t => t.id === selectedFields.template1)?.fields.map(f => (
                                            <Select.Option key={f.field} value={f.field}>{f.headerName}</Select.Option>
                                        ))}
                                    </Select>
                                </Col>
                                <Col span={1} style={{ textAlign: 'center', paddingTop: '8px' }}>=</Col>
                                <Col span={5}>
                                    <Select
                                        placeholder='Chọn template 2'
                                        style={{ width: '100%' }}
                                        onChange={value => setSelectedFields(prev => ({ ...prev, template2: value }))}
                                        value={selectedFields.template2}
                                    >
                                        {listTemp.map(t => selectedTemplates[t.id] &&
                                            <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>)}
                                    </Select>
                                </Col>
                                <Col span={5}>
                                    <Select
                                        placeholder='Chọn cột 2'
                                        style={{ width: '100%' }}
                                        onChange={value => setSelectedFields(prev => ({ ...prev, field2: value }))}
                                        value={selectedFields.field2}
                                        disabled={!selectedFields.template2}
                                    >
                                        {selectedFields.template2 && listTemp.find(t => t.id === selectedFields.template2)?.fields.map(f => (
                                            <Select.Option key={f.field} value={f.field}>{f.headerName}</Select.Option>
                                        ))}
                                    </Select>
                                </Col>
                                <Col span={2}>
                                    <Button
                                        type='primary'
                                        onClick={handleAddCondition}
                                        style={{ width: '100%' }}
                                        disabled={!selectedFields.template1 || !selectedFields.field1 || !selectedFields.template2 || !selectedFields.field2}
                                    >
                                        + Điều kiện
                                    </Button>
                                </Col>
                            </Row>
                        </div>

                    </div>
                )}

                {currentStep === 3 && (
                    <div>
                        <h3>Bước 3: Chọn cột để sắp xếp</h3>
                        <Row gutter={10}>
                            <Col span={10}>
                                <Select
                                    placeholder='Chọn cột để sắp xếp'
                                    style={{ width: '100%' }}
                                    onChange={value => setSortColumn(value)}
                                    value={sortColumn}
                                >
                                    {listTemp.map(t =>
                                        selectedTemplates[t.id] &&
                                        t.fields.map(f =>
                                            <Select.Option key={`${t.id}_${f.field}`} value={f.field}>
                                                {f.headerName}
                                            </Select.Option>
                                        )
                                    )}
                                </Select>
                            </Col>
                            <Col span={10}>
                                <Select
                                    placeholder='Chọn thứ tự sắp xếp'
                                    style={{ width: '100%' }}
                                    onChange={value => setSortOrder(value)}
                                    value={sortOrder}
                                >
                                    <Select.Option value='ascend'>Tăng dần</Select.Option>
                                    <Select.Option value='descend'>Giảm dần</Select.Option>
                                </Select>
                            </Col>
                        </Row>
                        <h3>Bước 4.1: Nhập công thức tính toán</h3>
                        <Row gutter={10}>
                            <Col span={8}>
                                <Input
                                    placeholder='Nhập công thức (VD: a + b - c)'
                                    value={newComputedColumn.formula}
                                    onChange={e => setNewComputedColumn(prev => ({
                                        ...prev,
                                        formula: e.target.value,
                                    }))}
                                />
                            </Col>
                            <Col span={6}>
                                <Input
                                    placeholder='Tên cột mới'
                                    value={newComputedColumn.columnName}
                                    onChange={e => setNewComputedColumn(prev => ({
                                        ...prev,
                                        columnName: e.target.value,
                                    }))}
                                />
                            </Col>
                            <Col span={2}>
                                <Button type='primary' onClick={handleExtractVariables}>+ Biến</Button>
                            </Col>
                        </Row>

                        {/* Nếu có biến, hiển thị danh sách ánh xạ cột */}
                        {newComputedColumn.variables && newComputedColumn.variables.length > 0 && (
                            <div style={{ marginTop: 10 }}>
                                <h4>Ánh xạ biến với cột</h4>
                                {newComputedColumn.variables.map((variable, index) => (
                                    <Row key={index} gutter={10} align='middle'>
                                        <Col span={4}><strong>{variable}:</strong></Col>
                                        <Col span={8}>
                                            <Select
                                                style={{ width: '100%' }}
                                                placeholder={`Chọn cột cho ${variable}`}
                                                onChange={value => handleVariableMapping(variable, value)}
                                                value={newComputedColumn.mappings[variable] || null}
                                            >
                                                {getAllColumnNames().map(col => (
                                                    <Select.Option key={col} value={col}>{col}</Select.Option>
                                                ))}
                                            </Select>
                                        </Col>
                                    </Row>
                                ))}
                                <Button type='primary' style={{ marginTop: 10 }} onClick={handleAddComputedColumn}>
                                    Thêm cột tính toán
                                </Button>
                            </div>
                        )}

                        {/* Danh sách cột tính toán có thể chỉnh sửa */}
                        {computedColumns && computedColumns.length > 0 &&
                            <>
                                <h3>Danh sách cột tính toán</h3>
                                {computedColumns.map((col, idx) => (
                                    <div key={idx} style={{ border: '1px solid #ddd', padding: 10, marginBottom: 10 }}>
                                        <Row gutter={10}>
                                            <Col span={8}>
                                                <Input
                                                    value={col.formula}
                                                    onChange={e => handleUpdateComputedColumn(idx, 'formula', e.target.value)}
                                                />
                                            </Col>
                                            <Col span={6}>
                                                <Input
                                                    value={col.columnName}
                                                    onChange={e => handleUpdateComputedColumn(idx, 'columnName', e.target.value)}
                                                />
                                            </Col>
                                            <Col span={2}>
                                                <Button icon={<DeleteIcon />}
                                                    onClick={() => handleDeleteComputedColumn(idx)}></Button>
                                            </Col>
                                        </Row>

                                        {/* Hiển thị dropdown chỉnh sửa ánh xạ biến */}
                                        {col.variables.map((variable, index) => (
                                            <Row key={index} gutter={10} align='middle' style={{ marginTop: 5 }}>
                                                <Col span={1}><strong>{variable}:</strong></Col>
                                                <Col span={8}>
                                                    <Select
                                                        style={{ width: '100%' }}
                                                        value={col.mappings[variable] || null}
                                                        onChange={value => handleUpdateVariableMapping(idx, variable, value)}
                                                    >
                                                        {getAllColumnNames().map(col => (
                                                            <Select.Option key={`map_${variable}_${col}`} value={col}>
                                                                {col}
                                                            </Select.Option>
                                                        ))}
                                                    </Select>
                                                </Col>
                                            </Row>
                                        ))}
                                    </div>
                                ))}
                            </>
                        }


                        <h3>Bước 5: Nhóm dữ liệu</h3>
                        <Row gutter={10}>
                            <Col span={6}>
                                <Select
                                    placeholder='Chọn cột để gom'
                                    style={{ width: '100%' }}
                                    mode={'multiple'}
                                    onChange={value => setGroupColumn(value)}
                                    value={groupColumn}
                                >

                                    {getAllColumnNames().map(col => (
                                        <Select.Option key={col} value={col}>{col}</Select.Option>
                                    ))}
                                </Select>
                            </Col>
                            <Col span={6}>
                                <Select
                                    placeholder='Chọn hàm'
                                    style={{ width: '100%' }}
                                    onChange={handleGroupFuncChange}
                                    value={groupFunc}
                                >
                                    <Select.Option value='sum'>SUM</Select.Option>
                                    <Select.Option value='avg'>AVG</Select.Option>
                                    <Select.Option value='count'>COUNT</Select.Option>
                                </Select>

                            </Col>
                            <Col span={6}>
                                <Select
                                    placeholder='Chọn cột để tính giá trị'
                                    style={{ width: '100%' }}
                                    mode={'multiple'}
                                    onChange={value => setValueColumn(value)}
                                    value={valueColumn}
                                >
                                    {[...getAllColumnNames(), ...computedColumns.map(e => e.columnName)].map(col => (
                                        <Select.Option key={col} value={col}>{col}</Select.Option>
                                    ))}
                                </Select>

                            </Col>
                        </Row>

                    </div>
                )}


                {currentStep === 6 && (
                    <div>
                        <h3>Bước 6: Thiết lập điều kiện lọc cho dữ liệu</h3>
                        <div style={{ marginTop: 20 }}>
                        {filterConditions.map((condition, index) => (
                <Row key={index} gutter={10} style={{ marginBottom: '10px' }}>
                    {index > 0 && (
                        <Col span={4}>
                            <Select
                                style={{ width: '100%' }}
                                value={condition.logicalOperator}
                                onChange={(value) => handleUpdateFilterCondition(index, 'logicalOperator', value)}
                            >
                                <Select.Option value="AND">VÀ (AND)</Select.Option>
                                <Select.Option value="OR">HOẶC (OpenRouter)</Select.Option>
                            </Select>
                        </Col>
                    )}
                    <Col span={index === 0 ? 8 : 6}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Chọn cột"
                            value={condition.column}
                            onChange={(value) => handleUpdateFilterCondition(index, 'column', value)}
                        >
                            {[...getAllColumnNames(), ...computedColumns.map(e => e.columnName)].length > 0 && [...getAllColumnNames(), ...computedColumns.map(e => e.columnName)].map(column => (
                                <Select.Option key={column} value={column}>
                                    {column}
                                </Select.Option>
                            ))}
                        </Select>
                    </Col>
                    <Col span={4}>
                        <Select
                            style={{ width: '100%' }}
                            value={condition.operator}
                            onChange={(value) => handleUpdateFilterCondition(index, 'operator', value)}
                        >
                            <Select.Option value="=">=</Select.Option>
                            <Select.Option value="!=">≠</Select.Option>
                            <Select.Option value=">">{'>'}</Select.Option>
                            <Select.Option value="<">{'<'}</Select.Option>
                            <Select.Option value=">=">≥</Select.Option>
                            <Select.Option value="<=">≤</Select.Option>
                        </Select>
                    </Col>
                    <Col span={8}>
                        <Input
                            placeholder="Nhập giá trị"
                            value={condition.value}
                            onChange={(e) => handleUpdateFilterCondition(index, 'value', e.target.value)}
                        />
                    </Col>
                    <Col span={2}>
                        <Button
                            type="link"
                            danger
                            icon={<DeleteIcon />}
                            onClick={() => handleRemoveFilterCondition(index)}
                        />
                    </Col>
                </Row>
            ))}
                            <Button
                                type="dashed"
                                onClick={handleAddFilterCondition}
                                style={{ width: '100%', marginTop: '10px' }}
                            >
                                + Thêm điều kiện lọc
                            </Button>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <Button onClick={handlePrevStep} style={{ marginRight: '8px' }}>
                                Quay lại
                            </Button>
                            <Button type="primary" onClick={handleSaveSettings}>
                                Lưu cài đặt
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
