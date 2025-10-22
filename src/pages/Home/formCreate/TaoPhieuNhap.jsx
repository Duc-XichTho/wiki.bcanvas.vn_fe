import React, {useContext, useEffect, useState} from "react";
import {Col, Form, Input, Row, Select, message, Button} from "antd";
import {DANH_MUC_LIST} from "../../../Consts/DANH_MUC_LIST.js";
import {createTimestamp, formatCurrency, parseCurrencyInput} from "../../../generalFunction/format.js";
import {toast} from "react-toastify";
import EditableTable from "./EditableTable.jsx";
import {createNewDetailPhieuXuat} from "../../../apis/detailPhieuXuatService.jsx";
import {createNewDetailPhieuNhap} from "../../../apis/detailPhieuNhapService.jsx";
import {createNewPhieuNhap, updatePhieuNhap} from "../../../apis/phieuNhapService.jsx";
import {createNewPhieuXuat, updatePhieuXuat} from "../../../apis/phieuXuatService.jsx";
import {getCurrentUserLogin} from "../../../apis/userService.jsx";
import {useParams} from "react-router-dom";
import {MyContext} from "../../../MyContext.jsx";
import {CODE_PN, genCode} from "../../../generalFunction/genCode/genCode.js";
import dayjs from "dayjs";
import {getNhanVienDataById} from "../../../apis/nhanVienService.jsx";
import {updateCardDetails} from "../SubStep/SubStepItem/Mau/cardUtils.js";
import {PhieuLQ} from "../SubStep/SubStepItem/Mau/PhieuLQ/PhieuLQ.jsx";

const {Option} = Select;

export default function TaoPhieuNhap({fetchPhieuNhap}) {
    let table = 'PhieuNhap';
    const {idCard} = useParams()
    const {
        setLoadData,
        selectedCompany,
        currentYear,
        chainTemplate2Selected,
        setChainTemplate2Selected
    } = useContext(MyContext)
    const [fields, setFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [options, setOptions] = useState({});
    const [optionsObject, setOptionsObject] = useState({});
    const [listNumberInput, setListNumberInput] = useState([]);
    const [mainFields, setMainFields] = useState({});
    const [subFields, setSubFields] = useState({});
    const [dataDetail, setDataDetail] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [listDNTTSelected, setListDNTTSelected] = useState([])
    const [isOpenPhieuLQ, setIsOpenPhieuLQ] = useState(false);
    const [selectedPhieuCodes, setSelectedPhieuCodes] = useState([]);

    const [tongTien, setTongTien] = useState(0);

    useEffect(() => {
        const dataTongTien = dataDetail.map(item => item.tong_tien);
        setTongTien(dataTongTien.reduce((acc, item) => acc + Number(item), 0));
    }, [dataDetail])

    const fetchCurrentUser = async () => {
        const {data} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
        setFormData({});
        setListNumberInput([]);
    }, []);

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
                            label: item.code + ' | ' + item.name,
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
                            label: item.code + ' | ' + item.name,

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
            const {name, value} = e.target;
            setFormData({...formData, [name]: value});

        }
    };

    const handleCreatePhieu = async () => {
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
        formData.id_DNTT = listDNTTSelected[0]?.id;
        formData.company = selectedCompany;
        formData.phieu_lq = selectedPhieuCodes

        let e = await createNewPhieuNhap(formData);
        if (e && e.data && dataDetail.length !== 0) {
            dataDetail.forEach(detail => {
                const data = {...detail, id_phieu_nhap: e.data.id}
                createNewDetailPhieuNhap(data);
            })
        }
        e.data.code = genCode(CODE_PN, e.data.id, currentYear);
        await updatePhieuNhap(e.data);

        const created_at = dayjs(Date.now()).format('DD-MM-YYYY');
        const {code = '', name = ''} = (await getNhanVienDataById(formData.id_nhan_vien)) || {};
        const dataNhanVien = `${code} | ${name}`;
        await updateCardDetails(idCard, created_at, tongTien, dataNhanVien, genCode(CODE_PN, e.data.id, currentYear), selectedPhieuCodes);
        setChainTemplate2Selected({
            type: 'chain2',
            data: {
                ...chainTemplate2Selected.data,
                selectedTemplate: {
                    ...chainTemplate2Selected.data.selectedTemplate,
                    cards: chainTemplate2Selected.data.selectedTemplate.cards.map((item) => item.id == idCard ? {
                        ...item,
                        mo_ta: created_at,
                        so_tien: tongTien,
                        mo_ta2: dataNhanVien,
                        name: genCode(CODE_PN, e.data.id, currentYear),
                        phieu_lq: selectedPhieuCodes
                    } : item)
                }
            }
        });

        fetchPhieuNhap();
        message.success("Tạo phiếu thành công");
        setDataDetail([])
    };

    return (
        <Form layout="vertical" style={{width: '100%', height: '700px', padding: 10}}>
            <Row aria-colspan={12} style={{display: "flex", justifyContent: 'space-between'}}>
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
            <Col span={11}>
                <div>
                    <Form.Item label={'Phiếu liên quan'}>
                        {selectedPhieuCodes.length > 0 &&
                            <>
                                Các phiếu đang chọn: <i>{selectedPhieuCodes.toString()}</i>
                                <button onClick={()=> {setSelectedPhieuCodes([])}}>Bỏ chọn toàn bộ</button>
                            </>
                        }
                        <Button
                            onClick={() => setIsOpenPhieuLQ(true)}
                        >
                            Thêm phiếu LQ
                        </Button>
                    </Form.Item>
                </div>
            </Col>
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
                                listDNTTSelected={listDNTTSelected}
                                setListDNTTSelected={setListDNTTSelected}
                                editable={true}
                                table={table}
                            />
                        ) : null
                    )}
                </Col>
            )}
            <button onClick={handleCreatePhieu} style={{marginTop: '20px'}}>Tạo phiếu</button>
            {isOpenPhieuLQ && <PhieuLQ isOpenPhieuLQ={isOpenPhieuLQ} setIsOpenPhieuLQ={setIsOpenPhieuLQ} selectedPhieuCodes={selectedPhieuCodes} setSelectedPhieuCodes={setSelectedPhieuCodes}/>}
        </Form>


    );
}
