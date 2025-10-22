import css from "./TaoPhieuXuat.module.css";
import React, {useContext, useEffect, useState} from "react";
import {Button, Col, Flex, Form, Input, message, Row, Select, Space, Typography} from "antd";
import {DANH_MUC_LIST} from "../../../Consts/DANH_MUC_LIST.js";
import {createTimestamp, formatCurrency, parseCurrencyInput} from "../../../generalFunction/format.js";
import EditableTable from "./EditableTable.jsx";
import {createNewDetailPhieuThu, getDetailPhieuThuByPhieuThuIdService,} from "../../../apis/detailPhieuThuService.jsx";
import {createNewPhieuThu, getPhieuThuByCardId, updatePhieuThu} from "../../../apis/phieuThuService.jsx";
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
import {getHoaDonDataById, updateHoaDon} from "../../../apis/hoaDonService.jsx";
import {CODE_PC, CODE_PC2, CODE_PT, CODE_PT2, genCode} from "../../../generalFunction/genCode/genCode.js";
import {LIST_LOAI_PHIEU_CHI, LIST_LOAI_PHIEU_THU} from "../../../Consts/LIST_LOAI_PHIEU.js";
import dayjs from "dayjs";
import {updateCardDetails} from "../SubStep/SubStepItem/Mau/cardUtils.js";
import styles from "../InvoicePopup/InvoicePopup.module.css";
import {PhieuLQ} from "../SubStep/SubStepItem/Mau/PhieuLQ/PhieuLQ.jsx";

const {Option} = Select;

export default function TaoPhieuThu({fetchPhieuThus}) {
    const {
        loadData,
        setLoadData,
        selectedCompany,
        currentYear,
        chainTemplate2Selected,
        setChainTemplate2Selected
    } = useContext(MyContext);
    const {id, idCard, idStep} = useParams();
    let table = 'PhieuThu';
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

    const [valueType, setValueType] = useState('PHIEU_THU');

    const [phieuThuDetail, setPhieuThuDetail] = useState(null);
    const [phieuThus, setPhieuThus] = useState(null);
    const [cauHinh, setCauHinh] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [selectedSubStepId, setSelectedSubStepId] = useState(null);
    const [gom1, setGom1] = useState(true);
    const [gom2, setGom2] = useState(true);
    const [openModalPhieuByCard, setOpenModalPhieuByCard] = useState(false);
    const [dataPhieuThuByCardId, setDataPhieuThuByCardId] = useState([]);
    const [menuSelected, setMenuSelected] = useState(null);
    const [listHDSelected, setListHDSelected] = useState([])

    const [tongTien, setTongTien] = useState(0);
    const [isOpenPhieuLQ, setIsOpenPhieuLQ] = useState(false);
    const [selectedPhieuCodes, setSelectedPhieuCodes] = useState([]);


    useEffect(() => {
        const dataTongTien = dataDetail.map(item => item.tong_tien);
        setTongTien(dataTongTien.reduce((acc, item) => acc + Number(item), 0));
    }, [dataDetail])

    const fetchPhieuThuByCardId = async () => {
        try {
            const data = await getPhieuThuByCardId(idCard);
            setDataPhieuThuByCardId(data);
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu phiếu xuất:', error);
        }
    }

    const handleClickMenu = (e) => {
        const selected = dataPhieuThuByCardId.find((phieuThu) => phieuThu.id == e.key);
        setMenuSelected(selected);
    };


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
        // setFormData({ don_hang_lien_quan: `DH|${idCard}` });
        setListNumberInput([]);
        fetchPhieuThuByCardId();
    }, [loadData]);

    // async function loadListSPFromSA() {
    //     if (card && card.cau_truc) {
    //         let steps = card.cau_truc;
    //         if (steps.length > 1) {
    //             if (steps[0] && steps[0].type == SA && steps[0].status == DONE) {
    //                 if (steps[0].subSteps) {
    //                     let subStepDS = steps[0].subSteps.find(subStep => subStep.subStepType == TYPE_SHEET)
    //                     if (subStepDS) {
    //                         let rs = await getDetailData(idCard, subStepDS.id, sheets, hhs, khos, los, nhaps, phieuThuDetail, cauHinh)
    //                         setDataDetail(rs)
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }

    useEffect(() => {
        if (selectedCardId && selectedSubStepId) {
            getDetailData(selectedCardId, selectedSubStepId, sheets, hhs, khos, los, phieuThuDetail, cauHinh).then(rs => {
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

    const handleChangeType = (e) => {
        setValueType(e);
    }
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
            const updatedFields = selectedItem.fields.filter(item => item.field !== 'id' && item.field !== 'so_tien');
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
        const formattedData = {...formData,};

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
        formData.type = valueType;
        formData.user_create = currentUser.email;
        formData.id_hoa_don = listHDSelected;
        formData.phieu_lq = selectedPhieuCodes;
        let so_tien = 0;
        dataDetail.forEach(item => {
            item.so_luong = Number(item.so_luong?.toFixed(0)) || 0;
            item.don_gia = Number(item.don_gia?.toFixed(0)) || 0;
            item.thue_gtgt = Number(item.thue_gtgt?.toFixed(0)) || 0;
            item.chiet_khau = Number(item.chiet_khau?.toFixed(0)) || 0;
            item.tong_tien = Number(item.tong_tien?.toFixed(0)) || 0;
            so_tien += (item.so_luong * item.don_gia) * (1 + item.thue_gtgt / 100) - (item.chiet_khau || 0)
        })
        formData.so_tien = so_tien;
        formData.company = selectedCompany;
        console.log('formData', formData);

        await createNewPhieuThu(formData).then(async e => {
            if (e && e.data && dataDetail.length > 0) {
                const mergedDetails = mergeDetails(dataDetail);

                mergedDetails.forEach(detail => {
                    const data = {...detail, id_phieu_thu: e.data.id};
                    createNewDetailPhieuThu(data);
                });

                listHDSelected.forEach(idHD => {
                    getHoaDonDataById(idHD).then(data => {
                        updateHoaDon({
                            id: parseInt(idHD),
                            list_id_phieu_thu: [...data?.list_id_phieu_thu, e.data?.id]
                        }).then(x => {
                        })
                    })

                })
            }
            if (valueType === 'BAO_CO') {
                e.data.code = genCode(CODE_PT2, e.data.id, currentYear);
            } else {
                e.data.code = genCode(CODE_PT, e.data.id, currentYear);
            }
            await updatePhieuThu(e.data);
            const created_at = dayjs(Date.now()).format('DD-MM-YYYY');
            await updateCardDetails(idCard, created_at, tongTien, formData.ly_do, e.data.code, selectedPhieuCodes);
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
                            mo_ta2: formData.ly_do,
                            name: e.data.code,
                            phieu_lq: selectedPhieuCodes,
                        } : item)
                    }
                }
            })
        });



        message.success("Tạo phiếu thành công");
        fetchPhieuThus();
        setLoadData(!loadData);
        // await fetchPhieuThuByCardId(idCard)
        setDataDetail([])
        setListHDSelected([])
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

    const [showNgoaiTe, setShowNgoaiTe] = useState(false);


    return (
        <div style={{padding: '10px', width: '100%'}}>

            <Form layout="vertical" style={{width: '100%', height: '790px', overflow: 'auto'}}>
                <h3>Tạo phiếu</h3>
                <Row gutter={16}>

                    <Col xs={24} sm={24}>
                        <Flex vertical gap={5}>
                            <span>Kiểu</span>
                            <Select
                                placeholder="Chọn"
                                onChange={handleChangeType}
                                showSearch
                                value={valueType}
                                options={LIST_LOAI_PHIEU_THU.map(e => ({
                                    label: (
                                        <Space>
                                            {e.label}
                                        </Space>
                                    ),
                                    value: e.code,
                                }))}
                            />

                        </Flex>
                    </Col>
                </Row>

                <Row aria-colspan={12} style={{display: "flex", justifyContent: 'space-between', marginTop: '10px'}}>
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
                                    {field.type === 'custom_select' && (
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
                                                {field.value?.map((option) => (
                                                    <Option key={option.key}
                                                            value={option.value}>{option.value}</Option>
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
                    <Col span={11}>
                        <div>
                            <Form.Item label={'Phiếu liên quan'}>
                                {selectedPhieuCodes.length > 0 &&
                                    <>
                                        Các phiếu đang chọn: <i>{selectedPhieuCodes.toString()}</i>
                                        <button onClick={() => {
                                            setSelectedPhieuCodes([])
                                        }}>Bỏ chọn toàn bộ
                                        </button>
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
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Chọn ngoại tệ <input
                            type="checkbox"
                            checked={showNgoaiTe}
                            onChange={() => setShowNgoaiTe(!showNgoaiTe)}
                        /></h3>
                    </div>

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
                                    setListHDSelected={setListHDSelected}
                                    listHDSelected={listHDSelected}
                                    table={table}
                                    showNgoaiTe={showNgoaiTe}
                                />
                            ) : null
                        )}
                    </Col>
                )}

            </Form>
            <div>
                <button className={css.btn_tao_phieu} onClick={handleSave}>Tạo phiếu</button>
            </div>
            {isOpenPhieuLQ && <PhieuLQ isOpenPhieuLQ={isOpenPhieuLQ} setIsOpenPhieuLQ={setIsOpenPhieuLQ}
                                       selectedPhieuCodes={selectedPhieuCodes}
                                       setSelectedPhieuCodes={setSelectedPhieuCodes}/>}
        </div>

    );
}
