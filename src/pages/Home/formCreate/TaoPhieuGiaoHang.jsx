import css from "./TaoPhieuXuat.module.css";
import React, {useContext, useEffect, useState} from "react";
import {Col, Form, Input, message, Row, Select} from "antd";
import {DANH_MUC_LIST} from "../../../Consts/DANH_MUC_LIST.js";
import {createTimestamp, formatCurrency, parseCurrencyInput} from "../../../generalFunction/format.js";
import EditableTable from "./EditableTable.jsx";
import {
    createNewDetailPhieuGiaoHang,
    getDetailPhieuGiaoHangByPhieuGiaoHangIdService,
} from "../../../apis/detailPhieuGiaoHangService.jsx";
import {createNewPhieuGiaoHang, getPhieuGiaoHangByCardId} from "../../../apis/phieuGiaoHangService.jsx";
import {getCurrentUserLogin} from "../../../apis/userService.jsx";
import {useParams} from "react-router-dom";
import {getAllCard} from "../../../apis/cardService.jsx";
import {getAllStep} from "../../../apis/stepService.jsx";
import {getAllSheet} from "../../../apis/sheetService.jsx";
import {getAllHangHoa} from "../../../apis/hangHoaService.jsx";
import {getAllLo} from "../../../apis/loService.jsx";
import {getAllKho} from "../../../apis/khoService.jsx";
import {getDetailData} from "./GomPhieu/logicGom.js";
import {getAllInputMau} from "../../../generalFunction/logicMau/logicMau.js";
import {MyContext} from "../../../MyContext.jsx";
import {getDonHangByCode} from "../../../apis/donHangService.jsx";

const {Option} = Select;

export default function TaoPhieuGiaoHang({phieu}) {
    const {loadData, setLoadData} = useContext(MyContext);
    const {id, idCard, idStep} = useParams();
    let table = 'PhieuGiaoHang';
    const [fields, setFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [options, setOptions] = useState({});
    const [optionsObject, setOptionsObject] = useState({});
    const [listNumberInput, setListNumberInput] = useState([]);
    const [mainFields, setMainFields] = useState({});
    const [subFields, setSubFields] = useState({});
    const [dataDetail, setDataDetail] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [cards, setCards] = useState([]);
    const [card, setCard] = useState([]);
    const [step, setStep] = useState([]);
    const [sheets, setSheets] = useState([]);
    const [hhs, setHHs] = useState([]);
    const [los, setLos] = useState([]);
    const [khos, setKhos] = useState([]);

    const [phieuGiaoHangDetail, setPhieuGiaoHangDetail] = useState(null);
    const [cauHinh, setCauHinh] = useState(null);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [selectedSubStepId, setSelectedSubStepId] = useState(null);
    const [gom1, setGom1] = useState(true);
    const [dataPhieuGiaoHangByCardId, setDataPhieuGiaoHangByCardId] = useState([]);
    const [menuSelected, setMenuSelected] = useState(null);
    const [listPXSelected, setListPXSelected] = useState([])
    const [donHang, setDonHang] = useState(null);

    function fetchDonHang() {
        getDonHangByCode('DH|'+idCard).then(data => {
            setFormData({...formData, dia_chi: data.dia_diem_giao_hang})
            setDonHang(data)
        })
    }

    const fetchPhieuGiaoHangByCardId = async () => {
        try {
            const data = await getPhieuGiaoHangByCardId(idCard);
            setDataPhieuGiaoHangByCardId(data);
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu phiếu xuất:', error);
        }
    }

    const handleClickMenu = (e) => {
        const selected = dataPhieuGiaoHangByCardId.find((phieuGiaoHang) => phieuGiaoHang.id == e.key);
        setMenuSelected(selected);
    };


    useEffect(() => {
        if (phieu) {
            getDetailPhieuGiaoHangByPhieuGiaoHangIdService(phieu.id).then(data => {
                setPhieuGiaoHangDetail(data)
            })
        } else {
            setPhieuGiaoHangDetail([])
        }

    }, [loadData]);

    const fetchCurrentUser = async () => {
        const {data} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    function fetchCards() {
        getAllCard().then(data => {
            setCards(data)
        })
    }


    function fetchSheets() {
        getAllSheet().then(data => {
            setSheets(data)
        })
    }

    function fetchHHs() {
        getAllHangHoa().then(data => {
            setHHs(data)
        })
    }

    function fetchLos() {
        getAllLo().then(data => {
            setLos(data)
        })
    }

    function fetchKhos() {
        getAllKho().then(data => {
            setKhos(data)
        })
    }

    function fetchCard() {
        getAllCard().then(data => {
            setCard(data.find(item => item.id == idCard))
        })
    }

    function fetchStep() {
        getAllStep().then(data => {
            setStep(data.find(item => item.id == idStep));
        })
    }

    useEffect(() => {
        fetchCurrentUser();
        if (idCard) {
            fetchCard();
        }
        if (idStep) {
            fetchStep();
        }
        fetchCards();
        fetchSheets()
        fetchLos()
        fetchKhos()
        fetchHHs()
        fetchSheets()
        setFormData({});
        setListNumberInput([]);
        fetchDonHang()
        fetchPhieuGiaoHangByCardId();
    }, [loadData]);

    // async function loadListSPFromSA() {
    //     if (card && card.cau_truc) {
    //         let steps = card.cau_truc;
    //         if (steps.length > 1) {
    //             if (steps[0] && steps[0].type == SA && steps[0].status == DONE) {
    //                 if (steps[0].subSteps) {
    //                     let subStepDS = steps[0].subSteps.find(subStep => subStep.subStepType == TYPE_SHEET)
    //                     if (subStepDS) {
    //                         let rs = await getDetailData(idCard, subStepDS.id, sheets, hhs, khos, los, nhaps, phieuGiaoHangDetail, cauHinh)
    //                         setDataDetail(rs)
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }

    useEffect(() => {
        if (selectedCardId && selectedSubStepId) {
            getDetailData(selectedCardId, selectedSubStepId, sheets, hhs, khos, los, phieuGiaoHangDetail, cauHinh).then(rs => {
                setDataDetail(rs)
                getAllInputMau().then(ipms => {
                    const ipm = ipms.find(e => e.label == 'Mã đơn hàng')
                    setFormData(prevState => ({
                        ...prevState,
                        donHang: `${ipm?.default_value}|${selectedCardId}`,
                        id_card_create: selectedCardId
                    }))
                })
            })
        }
    }, [gom1])


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

        }
    };

    function mergeDetails(details) {
        const merged = {};

        details.forEach(detail => {
            const key = `${detail.name}-${detail.code}`; // Tạo khóa duy nhất dựa trên name và code
            if (!merged[key]) {
                merged[key] = {...detail}; // Nếu chưa có, khởi tạo bản ghi mới
            } else {
                merged[key].so_luong += detail.so_luong; // Cộng dồn so_luong
            }
        });

        return Object.values(merged); // Trả về mảng các bản ghi đã gộp
    }

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
        formData.list_id_phieu_xuat = listPXSelected

        await createNewPhieuGiaoHang(formData).then(e => {
            if (e && e.data && dataDetail.length > 0) {
                const mergedDetails = mergeDetails(dataDetail);

                mergedDetails.forEach(detail => {
                    const data = {...detail, id_phieu_giao_hang: e.data.id};
                    createNewDetailPhieuGiaoHang(data);
                });
            }
        });

        message.success("Tạo phiếu thành công",  1);
        setLoadData(!loadData);
        // await fetchPhieuGiaoHangByCardId(idCard)
        setDataDetail([])
        setListPXSelected([])
    };

    useEffect(() => {
        getAllInputMau().then(ipms => {
            const ipm = ipms.find(e => e.label == 'Mã đơn hàng')
            setFormData(prevState => ({
                ...prevState,
                donHang: `${ipm?.default_value}|${idCard}`,
                id_card_create: idCard
            }))
        })
    }, [loadData]);

    return (
        <div style={{padding: '10px', width: '100%'}}>

            <Form layout="vertical" style={{width: '100%', height: '570px', overflow: 'auto'}}>
                <h3>Tạo phiếu</h3>
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
                                                readOnly={field?.readOnly}
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
                                                    <Option key={option.id}
                                                            value={option.id}>{option.label}</Option>
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
                                                    <Option key={option.id} value={option.id}>{option.code}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    )}
                                </div>
                            </Col>
                        </React.Fragment>
                    ))}
                </Row>

                {fields.some(field => field.type === 'object' && field.object) && (
                    <Col span={24}>
                        {fields.map((field) =>
                            field.type === 'object' && field.object ? (
                                <EditableTable
                                    key="details"
                                    field={field}
                                    optionsObject={optionsObject}
                                    dataDetail={dataDetail}
                                    editable={true}
                                    setDataDetail={setDataDetail}
                                    setListPXSelected={setListPXSelected}
                                    listPXSelected={listPXSelected}
                                    table={table}
                                />
                            ) : null
                        )}
                    </Col>
                )}

            </Form>
            <div>
                <button className={css.btn_tao_phieu} onClick={handleSave}>Tạo phiếu</button>
            </div>

        </div>

    );
}
