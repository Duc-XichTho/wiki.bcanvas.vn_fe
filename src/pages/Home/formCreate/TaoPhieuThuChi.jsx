import React, {useEffect, useState} from "react";
import {Col, Form, Input, Row, Select, Table} from "antd";
import {DANH_MUC_LIST} from "../../../Consts/DANH_MUC_LIST.js";
import {
    createTimestamp,
    formatCurrency,
    formatDateChangeDash, formatDateToDDMMYYYY, formatDateToDDMMYYYY2,
    parseCurrencyInput
} from "../../../generalFunction/format.js";
import {toast} from "react-toastify";
import EditableTable from "./EditableTable.jsx";
import {getCurrentUserLogin} from "../../../apis/userService.jsx";
import {createNewPhieuChi} from "../../../apis/phieuChiService.jsx";
import {createNewPhieuThu} from "../../../apis/phieuThuService.jsx";
import {getAllTamUng, getTamUngByCardId} from "../../../apis/tamUngService.jsx";
import {getAllDeNghiThanhToanByTamUngId} from "../../../apis/deNghiThanhToanService.jsx";
import {useParams} from "react-router-dom";
import TaoPhieuChi from "./TaoPhieuChi.jsx";

const {Option} = Select;

export default function TaoPhieuThuChi() {
    const { idCard, idStep } = useParams();
    const [fields, setFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [options, setOptions] = useState({});
    const [optionsObject, setOptionsObject] = useState({});
    const [listNumberInput, setListNumberInput] = useState([]);
    const [mainFields, setMainFields] = useState({});
    const [subFields, setSubFields] = useState({});
    const [dataDetail, setDataDetail] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedTU, setSelectedTU] = useState(null);
    const [table, setTable] = useState(null);
    const [TUList, setTUList] = useState([]);
    const [DNTTList, setDNTTList] = useState([]);

    function fetchTU() {
        getAllTamUng().then(data => {
            setTUList(data);
        })
    }

    const fetchCurrentUser = async () => {
        const {data} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
        fetchTU();
        setFormData({});
        setListNumberInput([]);
    }, []);

    const changeTUSelect = (e) => {
        setSelectedTU(e); // Cập nhật trạng thái selectedTU
    };

    useEffect(() => {
        if (selectedTU) {
            getAllDeNghiThanhToanByTamUngId(selectedTU.id).then(data => {
                setDNTTList(data);
                if (data?.length > 0) {
                    let tong_de_nghi = data.reduce((sum, item) => sum + (item.tong_tien || 0), 0);
                    if ((selectedTU.tong_tien || 0) - tong_de_nghi > 0) {
                        setTable('PhieuThu');
                    } else {
                        setTable('PhieuChi2');
                    }
                } else {
                    setTable(null);
                }
            });
        }
    }, [selectedTU]);


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
        return {mainFields, subFields};
    };

    useEffect(() => {
        if (table) {
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
                                label: item[field.key],
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
                                            label: item[fieldObject.key],
                                            ...item
                                        })
                                    });
                                }
                            }
                        } catch (error) {
                            console.error(`Error loading data for ${field.field}:`, error);
                        }
                    } else if (field.type === 'object1' && field) {
                        try {
                            const response = await field.getAllApi();
                            fetchedOptions[field.field] = response.map(item => ({
                                ...item,
                                id: item.id,
                                label: item[field.key],

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
        }
        else {
            setFields([]);
        }

    }, [table]);

    const handleInputChange = async (e, type) => {

        // Handle different input types
        if (type === 'decimal') {
            const {name, value} = e.target;
            const numericValue = value.replace(/[^\d.-]/g, '');
            setFormData({...formData, [name]: formatCurrency(numericValue)});
            if (!listNumberInput.includes(name)) {
                setListNumberInput(prevFields => [...prevFields, name]);
            }
        } else if (type === 'number') {
            const {name, value} = e.target;
            const numericValue = value.replace(/[^\d.-]/g, '');
            setFormData({...formData, [name]: parseCurrencyInput(numericValue)});
            if (!listNumberInput.includes(name)) {
                setListNumberInput(prevFields => [...prevFields, name]);
            }
        } else if (type === 'text' || type === 'date') {
            const {name, value} = e.target;
            setFormData({...formData, [name]: value});
        } else if (type === 'select') {
            const {name, value} = e.target;
            setFormData({...formData, [name]: value});

        } else if (type === 'object1') {
            console.log(e)
            // setFormData({...formData, [name]: value});

        }
    };

    const handleSave = async () => {
        const formattedData = {...formData};

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
        formData.id_card_create = idCard;

        if (table === "PhieuChi2") {
            await createNewPhieuChi(formData)
        }
        if (table === "PhieuThu") {
            await createNewPhieuThu(formData)
        }

        toast.success("Tạo dòng thành công", {autoClose: 1000});
        setDataDetail([])
    };
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 50,
            render:e=> `DNTT ${e}`
        },
        {
            title: 'Mô tả',
            dataIndex: 'mo_ta',
            key: 'mo_ta',
            width: 100
        },
        {
            title: 'Ngày dự kiến TT',
            dataIndex: 'ngay_du_kien_thanh_toan',
            key: 'ngay_du_kien_thanh_toan',
            width: 100
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'tong_tien',
            key: 'tong_tien',
            width: 100
        },


    ];

    return (
        <Form layout="vertical" style={{width: '100%', height: '480px', padding:'5px'}}>
            <Row aria-colspan={12} style={{display: "flex", justifyContent: 'space-between'}}>
                <Col span={11}>
                    <div style={{padding: 10}}>
                        <Form.Item label={'Phiếu tạm ứng'}>
                            <Select
                                name={'TU'}
                                onChange={(selectedId) => {
                                    const selectedObject = TUList.find(option => option.id === selectedId);
                                    changeTUSelect(selectedObject);
                                }}

                            >
                                {TUList.map((option) => (
                                    <Select.Option key={option.id} value={option.id}>Phiếu TU {option.id}: tổng
                                        tiền {formatCurrency(option.tong_tien)}đ{option.de_nghi_mua ? ', đơn mua liên quan ' + option.de_nghi_mua.code : ''}</Select.Option> // Use ID as value
                                ))}
                            </Select>
                        </Form.Item>
                    </div>
                </Col>

                {DNTTList?.length > 0 && <Col span={24}>
                    <div style={{width: '100%', display: "block"}}>
                        <Table bordered dataSource={DNTTList?.length > 0 ? DNTTList : []} columns={columns}
                               scroll={{x: 'max-content'}} pagination={false}/>
                    </div>
                </Col>}
                {table === 'PhieuChi2' && <div style={{width:'100%'}}><TaoPhieuChi/></div>}
                {fields.map((field) => (
                    <React.Fragment key={field.field}>
                        <Col span={11}>
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
                                            onChange={(value) => handleInputChange({
                                                target: {
                                                    name: field.field,
                                                    value
                                                }
                                            }, 'select')}
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
                                                handleInputChange({
                                                    target: {
                                                        name: field.field,
                                                        value: selectedObject
                                                    }
                                                }, 'object1');
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
                            />
                        ) : null
                    )}
                </Col>
            )}
            {table !== 'PhieuChi2' && <button onClick={handleSave} style={{margin: '5px'}}>Tạo phiếu</button>}
        </Form>


    );
}
