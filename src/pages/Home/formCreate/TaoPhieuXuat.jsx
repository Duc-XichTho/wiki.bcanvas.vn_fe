import css from "./TaoPhieuXuat.module.css";
import React, {useContext, useEffect, useState} from "react";
import {Button, Col, Form, Input, message, Row, Select} from "antd";
import {DANH_MUC_LIST} from "../../../Consts/DANH_MUC_LIST.js";
import {createTimestamp, formatCurrency, parseCurrencyInput} from "../../../generalFunction/format.js";
import EditableTable from "./EditableTable.jsx";
import {createNewDetailPhieuXuat} from "../../../apis/detailPhieuXuatService.jsx";
import {createNewPhieuXuat, updatePhieuXuat} from "../../../apis/phieuXuatService.jsx";
import {getCurrentUserLogin} from "../../../apis/userService.jsx";
import {useParams} from "react-router-dom";
import {getAllCard} from "../../../apis/cardService.jsx";
import {getAllStep} from "../../../apis/stepService.jsx";
import {getAllHangHoa} from "../../../apis/hangHoaService.jsx";
import {getDetailData} from "./GomPhieu/logicGom.js";
import {getAllInputMau} from "../../../generalFunction/logicMau/logicMau.js";
import {MyContext} from "../../../MyContext.jsx";
import {getDonHangByCode} from "../../../apis/donHangService.jsx";
import {SA, SB} from '../../../Consts/LIST_STEP_TYPE.js'
import {DONE} from "../../../Consts/STEP_STATUS.js";
import {CODE_PX, genCode} from "../../../generalFunction/genCode/genCode.js";
import dayjs from "dayjs";
import {getNhanVienDataById} from "../../../apis/nhanVienService.jsx";
import {updateCardDetails} from "../SubStep/SubStepItem/Mau/cardUtils.js";
import {PhieuLQ} from "../SubStep/SubStepItem/Mau/PhieuLQ/PhieuLQ.jsx";

const {Option} = Select;

export default function TaoPhieuXuat({fetchPhieuXuats}) {
    const {
        loadData,
        setLoadData,
        selectedCompany,
        currentYear,
        chainTemplate2Selected,
        setChainTemplate2Selected
    } = useContext(MyContext);
    const {id, idCard, idStep} = useParams();

    useEffect(() => {
        setDataDetail([]);
        setFormData({});
    }, [idCard]);

    let table = 'PhieuXuat';
    const [fields, setFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [options, setOptions] = useState({});
    const [optionsObject, setOptionsObject] = useState({});
    const [listNumberInput, setListNumberInput] = useState([]);
    const [mainFields, setMainFields] = useState({});
    const [subFields, setSubFields] = useState({});
    const [dataDetail, setDataDetail] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [card, setCard] = useState([]);
    const [step, setStep] = useState([]);
    const [hhs, setHHs] = useState([]);
    const [donHang, setDonHang] = useState(null);
    const [tongTien, setTongTien] = useState(0);
    const [isOpenPhieuLQ, setIsOpenPhieuLQ] = useState(false);
    const [selectedPhieuCodes, setSelectedPhieuCodes] = useState([]);

    useEffect(() => {
        if(dataDetail && dataDetail.length > 0) {
            const dataTongTien = dataDetail.map(item => item.tong_tien);
            setTongTien(dataTongTien.reduce((acc, item) => acc + Number(item), 0));
        }
    }, [dataDetail])

    const fetchCurrentUser = async () => {
        const {data} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    function fetchHHs() {
        getAllHangHoa().then(data => {
            setHHs(data)
        })
    }

    function fetchDonHang() {
        getDonHangByCode('DH|' + idCard).then(data => {
            setDonHang(data)
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
        fetchHHs()
        fetchDonHang()
        setFormData({});
        setListNumberInput([]);
    }, []);

    async function loadListSPFromSA() {
        if (card && card.cau_truc) {
            let steps = card.cau_truc;
            let donHangStep = steps.find(item => item.type == SA);
            let phieuXuatStep = steps.find(item => item.type == SB);
            if (donHangStep?.status === DONE && phieuXuatStep?.status !== DONE) {
                if (donHang) {
                    let dssp = donHang.chi_tiet_don_hang;
                    if (dssp) {
                        setDataDetail(getDetailData(idCard, dssp, hhs))
                    }
                }
            }

        }
    }

    useEffect(() => {
        loadListSPFromSA()
    }, [step, card, hhs, donHang])

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
                        if (field.headerName == 'Đơn hàng') {
                            
                            fetchedOptions[field.field] = response.map(item => ({
                                id: item.id,
                                label: `${item['code2'] || item['code']}  - Tổng tiền: ${formatCurrency(+item.tien_thue + +item.tien_truoc_thue)} đ`,
                            }));
                        } else {
                            fetchedOptions[field.field] = response.map(item => ({
                                id: item.id,
                                label: `${item[field.key]} | ${item['name']}`,
                            }));
                        }
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
            setFormData({...formData, lenh_san_xuat: e.target.value});
        }
    };

    const handleCreatePhieuXuatNhap = async () => {
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
        formData.company = selectedCompany;
        formData.id_card_create = idCard;
        formData.phieu_lq = selectedPhieuCodes;

        let e = await createNewPhieuXuat(formData)
        if (e && e.data && dataDetail.length !== 0) {
            dataDetail.forEach(detail => {
                const data = {...detail, id_phieu_xuat: e.data.id}
                createNewDetailPhieuXuat(data)
            })
        }
        e.data.code = genCode(CODE_PX, e.data.id, currentYear);
        await updatePhieuXuat({...e.data, id_phieu_xuat: e.data.id});
        const created_at = dayjs(Date.now()).format('DD-MM-YYYY');
        const {code = '', name = ''} = (await getNhanVienDataById(formData.id_nhan_vien)) || {};
        const dataNhanVien = `${code} | ${name}`;
        await updateCardDetails(idCard, created_at, tongTien, dataNhanVien, genCode(CODE_PX, e.data.id, currentYear), selectedPhieuCodes);
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
                        name: genCode(CODE_PX, e.data.id, currentYear),
                        phieu_lq: selectedPhieuCodes
                    } : item)
                }
            }
        });

        fetchPhieuXuats();
        message.success("Tạo phiếu thành công");
        setLoadData(!loadData);
        // await fetchPhieuXuatByCardId(idCard)
        setDataDetail([])
        setFormData({});
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
    }, []);

    return (
        <div style={{display: "flex", justifyContent: "space-between", padding: '10px', width: '100%'}}>
            <Form layout="vertical" style={{width: '100%', height: '600px', overflow: 'auto'}}>
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
                                                        value,
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
                                    table={table}
                                    formData={formData}
                                />
                            ) : null
                        )}
                    </Col>
                )}
                <button className={css.btn_tao_phieu} onClick={handleCreatePhieuXuatNhap}>Tạo phiếu</button>
            </Form>
            {isOpenPhieuLQ && <PhieuLQ isOpenPhieuLQ={isOpenPhieuLQ} setIsOpenPhieuLQ={setIsOpenPhieuLQ} selectedPhieuCodes={selectedPhieuCodes} setSelectedPhieuCodes={setSelectedPhieuCodes}/>}
        </div>


    );
}
