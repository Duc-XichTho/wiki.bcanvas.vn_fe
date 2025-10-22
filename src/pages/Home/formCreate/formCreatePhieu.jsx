import React, { useEffect, useState } from "react";
import { Row, Col, Button, Collapse, Form, Modal, Select, Input, Typography } from "antd";
import css from './formCreate.module.css';
import { DANH_MUC_LIST } from "../../../Consts/DANH_MUC_LIST.js";
import { createTimestamp, formatCurrency, parseCurrencyInput } from "../../../generalFunction/format.js";
import { toast } from "react-toastify";
import { getAllNhaCungCap } from "../../../apis/nhaCungCapService.jsx";
import { handleCreate } from "../AgridTable/handleAction/handleCreate.js";
import EditableTable from "./EditableTable.jsx";
import { createNewLo } from "../../../apis/loService.jsx";
import { createNewDetailPhieuXuat } from "../../../apis/detailPhieuXuatService.jsx";
import { createNewDetailPhieuNhap } from "../../../apis/detailPhieuNhapService.jsx";
import { createNewPhieuNhap } from "../../../apis/phieuNhapService.jsx";
import { createNewPhieuXuat } from "../../../apis/phieuXuatService.jsx";

const { Option } = Select;

export default function PopUpFormCreatePhieu({ table, onClose, open, reload, currentUser, currentData = [], editable = true, onSave }) {
    const [fields, setFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [options, setOptions] = useState({});
    const [optionsObject, setOptionsObject] = useState({});
    const [listNumberInput, setListNumberInput] = useState([]);
    const [mainFields, setMainFields] = useState({});
    const [subFields, setSubFields] = useState({});
    const [dataDetail, setDataDetail] = useState(currentData);
    useEffect(() => {
        setFormData({});
        setListNumberInput([]);
    }, [onClose]);

    const getFieldLists = (data) => {
        let mainFields = {};
        let subFields = {};
        data.forEach(field => {
            if (field.type === 'object' && field.object) {
                field.object.forEach(subField => {
                    subFields[subField.field] = '';
                });
            } else {
                mainFields[field.field] = '';
            }
        });
        return { mainFields, subFields };
    };

    useEffect(() => {
        const selectedItem = DANH_MUC_LIST.find(item => item.table === table);
        if (selectedItem) {
            const updatedFields = selectedItem.fields.filter(item => item.field !== 'id');
            setFields(updatedFields);
            const allField = getFieldLists(updatedFields);
            setMainFields(allField.mainFields);
            setSubFields(allField.subFields);
        }

        const fetchOptions = async () => {
            const fetchedOptions = {};
            const fetchedOptionsObject = {};
            for (const field of selectedItem.fields) {
                if (field.type === 'select' && field.getAllApi) {
                    try {
                        const response = await field.getAllApi();
                        fetchedOptions[field.field] = response.map(item => ({
                            id: item.id,
                            label: item[field.key] + ' | ' +item.name,
                        }));
                    } catch (error) {
                        console.error(`Error loading data for ${field.field}:`, error);
                    }
                } else if (field.type === 'object' && field.object) {
                    try {
                        for (const fieldObject of field.object) {
                            if (fieldObject.type === 'select' && fieldObject.getAllApi) {
                                const response = await fieldObject.getAllApi();
                                fetchedOptionsObject[fieldObject.field] = response.map(item => {
                                    return ({
                                        id: item.id,
                                        label: item[fieldObject.key] + ' | ' +item.name,
                                        ...item
                                    })
                                });
                            }
                        }
                    } catch (error) {
                        console.error(`Error loading data for ${field.field}:`, error);
                    }
                }
                else if (field.type === 'object1' && field) {
                    try {
                        const response = await field.getAllApi();
                        fetchedOptions[field.field] = response.map(item => ({
                            ...item,
                            id: item.id,
                            label: item[field.key] + ' | ' +item.name,

                        }));
                    } catch (error) {
                        console.error(`Error loading data for ${field.field}:`, error);
                    }
                }
            }
            setOptions(fetchedOptions);
            setOptionsObject(fetchedOptionsObject);
        };

        fetchOptions();
    }, [table]);

    const handleInputChange = async (e, type) => {

        // Handle different input types
        if (type === 'decimal') {
            const { name, value } = e.target;
            const numericValue = value.replace(/[^\d.-]/g, '');
            setFormData({ ...formData, [name]: formatCurrency(numericValue) });
            if (!listNumberInput.includes(name)) {
                setListNumberInput(prevFields => [...prevFields, name]);
            }
        } else if (type === 'number') {
            const { name, value } = e.target;
            const numericValue = value.replace(/[^\d.-]/g, '');
            setFormData({ ...formData, [name]: parseCurrencyInput(numericValue) });
            if (!listNumberInput.includes(name)) {
                setListNumberInput(prevFields => [...prevFields, name]);
            }
        } else if (type === 'text' || type === 'date') {
            const { name, value } = e.target;
            setFormData({ ...formData, [name]: value });
        }
        else if (type === 'select') {
            const { name, value } = e.target;
            setFormData({ ...formData, [name]: value });

        }
        else if (type === 'object1') {
            console.log(e)
            // setFormData({...formData, [name]: value});

        }
    };

    const handleSave = async () => {
        const formattedData = { ...formData };

        listNumberInput.forEach(fieldName => {
            const value = formattedData[fieldName];
            if (value) {
                formattedData[fieldName] = parseCurrencyInput(value);
            }
        });

        let mainFieldsData = {};
        let subFieldsData = {};

        for (let key in mainFields) {
            if (formattedData[key]) {
                mainFieldsData[key] = formattedData[key];
            }
        }

        for (let key in subFields) {
            if (formattedData[key]) {
                subFieldsData[key] = formattedData[key];
            }
        }
        formData.created_at = createTimestamp();
        formData.user_create = currentUser.email;

        if (onSave) {
            onSave();
        }

        if (table === "PhieuNhap") {
            await createNewPhieuNhap(formData).then(e => {
                if (e && e.data && dataDetail.lenght !== 0) {
                    dataDetail.forEach(detail => {
                        const data = { ...detail, id_phieu_nhap: e.data.id }
                        createNewDetailPhieuNhap(data)
                    })
                }
            }
            )
        }

        if (table === "PhieuXuat") {
            await createNewPhieuXuat(formData).then(e => {
                if (e && e.data && dataDetail.lenght !== 0) {
                    dataDetail.forEach(detail => {
                        const data = { ...detail, id_phieu_xuat: e.data.id }
                        createNewDetailPhieuXuat(data)
                    })
                }
            }
            )

        }

        await reload();

        toast.success("Tạo dòng thành công", { autoClose: 10});
        setDataDetail([])
        onClose();
    };

    return (
        <Modal open={open} centered onCancel={onClose} cancelText={'Hủy'} width={1200} okText={'Lưu'} onOk={handleSave} title="Thêm mới">
            <Form layout="vertical" style={{ width: '100%', height: '70vh' }}>
                <Row aria-colspan={12} style={{ display: "flex", justifyContent: 'space-between' }}>
                    {fields.map((field) => (
                        <React.Fragment key={field.field}>
                            <Col span={11} >
                                <div>
                                    {field.type === 'text' && (
                                        <Form.Item label={field.headerName}>
                                            <Input
                                                name={field.field}
                                                value={formData[field.field] || ''}
                                                onChange={(e) => handleInputChange(e, 'text')}
                                            />
                                        </Form.Item>
                                    )}
                                    {field.type === 'date' && (
                                        <Form.Item label={field.headerName}>
                                            <Input
                                                name={field.field}
                                                type="date"
                                                value={formData[field.field] || ''}
                                                onChange={(e) => handleInputChange(e, 'date')}
                                            />
                                        </Form.Item>
                                    )}
                                    {field.type === 'decimal' && (
                                        <Form.Item label={field.headerName}>
                                            <Input
                                                name={field.field}
                                                value={formData[field.field] || ''}
                                                onChange={(e) => handleInputChange(e, 'decimal')}
                                            />
                                        </Form.Item>
                                    )}
                                    {field.type === 'number' && (
                                        <Form.Item label={field.headerName}>
                                            <Input
                                                name={field.field}
                                                value={formData[field.field] || ''}
                                                onChange={(e) => handleInputChange(e, 'number')}
                                            />
                                        </Form.Item>
                                    )}
                                    {field.type === 'select' && (
                                        <Form.Item label={field.headerName}>
                                            <Select
                                                name={field.field}
                                                value={formData[field.field] || ''}
                                                onChange={(value) => handleInputChange({ target: { name: field.field, value } }, 'select')}
                                            >
                                                {options[field.field]?.map((option) => (
                                                    <Option key={option.id} value={option.id}>{option.label}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    )}
                                    {field.type === 'object1' && (
                                        <Form.Item label={field.headerName}>
                                            <Select
                                                name={field.field}
                                                value={formData[field.field]?.id || undefined} // Use ID for value
                                                onChange={(selectedId) => {
                                                    const selectedObject = options[field.field]?.find(option => option.id === selectedId);
                                                    handleInputChange({ target: { name: field.field, value: selectedObject } }, 'object1');
                                                }}
                                            >
                                                {options[field.field]?.map((option) => (
                                                    <Option key={option.id} value={option.id}>{option.code}</Option> // Use ID as value
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    )}
                                </div>
                            </Col>
                        </React.Fragment>
                    ))}
                </Row>

                {/* Separate Col for EditableTable */}
                {fields.some(field => field.type === 'object' && field.object) && ( // Check if any field is of type 'object'
                    <Col span={24}>
                        {fields.map((field) =>
                            field.type === 'object' && field.object ? (
                                <EditableTable
                                    key="details"
                                    field={field}
                                    optionsObject={optionsObject}
                                    dataDetail={dataDetail}
                                    setDataDetail={setDataDetail}
                                    editable={editable}
                                />
                            ) : null
                        )}
                    </Col>
                )}
            </Form>
        </Modal>

    );
}
