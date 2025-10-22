import css from "./TaoPhieuXuat.module.css";
import React, {useContext, useEffect, useState} from "react";
import {Button, Col, Flex, Form, Input, message, Row, Select, Typography} from "antd";
import {DANH_MUC_LIST} from "../../../Consts/DANH_MUC_LIST.js";
import {createTimestamp, formatCurrency, parseCurrencyInput} from "../../../generalFunction/format.js";
import EditableTable from "./EditableTable.jsx";
import {getPhieuThuByCardId} from "../../../apis/phieuThuService.jsx";
import {getCurrentUserLogin} from "../../../apis/userService.jsx";
import {useParams} from "react-router-dom";
import {getAllCard} from "../../../apis/cardService.jsx";
import {getAllStep} from "../../../apis/stepService.jsx";
import {getAllInputMau} from "../../../generalFunction/logicMau/logicMau.js";
import {MyContext} from "../../../MyContext.jsx";
import {createNewDeNghiThanhToan, updateDeNghiThanhToan} from "../../../apis/deNghiThanhToanService.jsx";
import {createNewDetailDeNghiThanhToanDetail} from "../../../apis/deNghiThanhToanDetailService.jsx";
import {getAllDonMuaHang, getDonMuaHangByCode} from "../../../apis/donMuaHangService.jsx";
import {getAllKmf} from "../../../apis/kmfService.jsx";
import {getAllKmtc} from "../../../apis/kmtcService.jsx";
import {getAllDuAn} from "../../../apis/duAnService.jsx";
import {getListProductDNTT, getListProductTU} from "../SubStep/SubStepItem/Mau/logicMau/getListProduct.js";
import {getAllTamUng} from "../../../apis/tamUngService.jsx";
import {getAllBusinessUnit} from "../../../apis/businessUnitService.jsx";
import {CODE_DNTT, genCode} from "../../../generalFunction/genCode/genCode.js";
import dayjs from "dayjs";
import {updateCardDetails} from "../SubStep/SubStepItem/Mau/cardUtils.js";
import {getNhanVienDataById} from "../../../apis/nhanVienService.jsx";
import styles from "../InvoicePopup/InvoicePopup.module.css";
import {PhieuLQ} from "../SubStep/SubStepItem/Mau/PhieuLQ/PhieuLQ.jsx";
import PopUpUploadFile from "../../../components/UploadFile/PopUpUploadFile.jsx";

const {Option} = Select;
const {Text} = Typography;

export default function TaoDNTT({fetchPhieuThus}) {
    const {
        loadData,
        setLoadData,
        currentYear,
        chainTemplate2Selected,
        setChainTemplate2Selected
    } = useContext(MyContext);
    const {id, idCard, idStep} = useParams();

    useEffect(() => {
        setDataDetail([]);
        setFormData({});
    }, [idCard]);

    let table = 'DeNghiThanhToan';
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
    const [dataPhieuThuByCardId, setDataPhieuThuByCardId] = useState([]);
    const [listHDSelected, setListHDSelected] = useState([])
    const [donHang, setDonHang] = useState(null);
    const [tamUng, setTamUng] = useState(null);
    const [donHangs, setDonHangs] = useState([]);
    const [tamUngs, setTamUngs] = useState([]);
    const [kmfs, setKmfs] = useState([]);
    const [vuViecs, setVuViec] = useState([]);
    const [boPhans, setBoPhans] = useState([]);
    const [kmns, setKmns] = useState([]);
    const [isOpenPhieuLQ, setIsOpenPhieuLQ] = useState(false);
    const [selectedPhieuCodes, setSelectedPhieuCodes] = useState([]);

    const [tongTien, setTongTien] = useState(0);
    useEffect(() => {
        const dataTongTien = dataDetail.map(item => item.tong_tien);
        setTongTien(dataTongTien.reduce((acc, item) => acc + Number(item), 0));
    }, [dataDetail])
    function fetchDonHang() {
        getAllDonMuaHang().then(data => {
            setDonHangs(data)
        })
        getAllTamUng().then(data => {
            setTamUngs(data)
        })
        getAllKmf().then(data => {
            setKmfs(data)
        })
        getAllKmtc().then(data => {
            setKmns(data)
        })
        getAllDuAn().then(data => {
            setVuViec(data)
        })
        getAllBusinessUnit().then(data => {
            setBoPhans(data)
        })
    }

    useEffect(() => {
        if (donHang && donHang.chi_tiet_don_mua_hang && !tamUng) {
            setDataDetail(getListProductDNTT(donHang.chi_tiet_don_mua_hang, kmfs, kmns, vuViecs))
        }
        if (tamUng && tamUng.chi_tiet_tam_ung) {
            console.log(tamUng)
            setDataDetail(getListProductTU(tamUng.chi_tiet_tam_ung, kmfs, kmns, vuViecs))
        }
    }, [donHang, tamUng, kmns, kmfs, vuViecs])

    const fetchPhieuThuByCardId = async () => {
        try {
            const data = await getPhieuThuByCardId(idCard);
            setDataPhieuThuByCardId(data);
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu phiếu xuất:', error);
        }
    }

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
        fetchDonHang();
        setFormData({don_hang_lien_quan: `DH|${idCard}`});
        setListNumberInput([]);
        fetchPhieuThuByCardId();
    }, [loadData]);

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
            const updatedFields = selectedItem.fields.filter(item => item.field !== 'id' && item.field !== 'tong_tien');
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
                            label: `${item[field.key]}|${item.name}`,
                        }));
                    } catch (error) {
                        console.error(`Error loading data for ${field.field}:`, error);
                    }
                } else if (field.type === 'selectDH' && field.getAllApi) {
                    try {
                        const response = await field.getAllApi();
                        fetchedOptions[field.field] = response.map(item => ({
                            id: item.code,
                            label: `${item['code2'] || item.code} - Tổng tiền: ${formatCurrency(parseFloat(item?.tien_truoc_thue) + parseFloat(item?.tien_thue))}`,
                        }));
                    } catch (error) {
                        console.error(`Error loading data for ${field.field}:`, error);
                    }
                } else if (field.type === 'selectTU' && field.getAllApi) {
                    try {
                        const response = await field.getAllApi();
                        fetchedOptions[field.field] = response.map(item => ({
                            id: item.id,
                            label: `${item.code || `TU | ${item[field.key]}`} - Tổng tiền: ${formatCurrency(parseFloat(item?.tong_tien))}`,
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
                                        label: `${item[fieldObject.key]}`,
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
    }, [table, donHang, tamUng,]);


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
        } else if (type.startsWith('select')) {
            const {name, value} = e.target;
            setFormData({...formData, [name]: value});
        }
    };

    function mergeDetails(details) {
        const merged = {};

        details.forEach(detail => {
            const key = `${detail.id_hang_hoa}`;
            if (!merged[key]) {
                merged[key] = {...detail};
            } else {
                merged[key].so_luong += detail.so_luong;
            }
        });

        return Object.values(merged); // Trả về mảng các bản ghi đã gộp
    }

    const handleCreateDNTT = async () => {
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
        formData.phieu_lq = selectedPhieuCodes

        let e = await createNewDeNghiThanhToan(formData)
        if (e && e.data && dataDetail.length > 0) {
            const mergedDetails = mergeDetails(dataDetail);
            mergedDetails.forEach(detail => {
                const data = {...detail, id_DNTT: e.data.id, id: null};
                createNewDetailDeNghiThanhToanDetail(data);
            });
        }
        e.data.code = genCode(CODE_DNTT, e.data.id, currentYear);
        await updateDeNghiThanhToan(e.data);

        const created_at = dayjs(Date.now()).format('DD-MM-YYYY');
        let dataNhanVien = ``;
        let code = "";
        let name = "";

        try {
            const data = await getNhanVienDataById(formData.id_nhan_vien);
            code = data?.code || "";
            name = data?.name || "";
            dataNhanVien = `${code} | ${name}`
        } catch (error) {
        }
        await updateCardDetails(idCard, created_at, tongTien, dataNhanVien, genCode(CODE_DNTT, e.data.id, currentYear), selectedPhieuCodes);
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
                        name: genCode(CODE_DNTT, e.data.id, currentYear),
                        phieu_lq: selectedPhieuCodes
                    } : item)
                }
            }
        })
        fetchPhieuThus()
        message.success("Tạo phiếu thành công");
        // setLoadData(!loadData);
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

            <Form layout="vertical" style={{width: '100%', height: '750px', overflow: 'auto'}}>
                <h3>Tạo phiếu</h3>
                <Row aria-colspan={12} style={{display: "flex", justifyContent: 'space-between'}}>
                    {fields.map((field) => (
                        <Col span={11}>
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
                            {field.type === ('select') && (
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
                            {field.type === ('selectDH') && (
                                <Form.Item label={field.headerName}>
                                    <Select
                                        allowClear
                                        name={field.field}
                                        value={formData[field.field] || ''}
                                        onChange={(value) => {
                                            setFormData({...formData, [field.field]: value, id_tam_ung: null});
                                            getDonMuaHangByCode(value).then(dh => {
                                                if (dh) {
                                                    setDonHang(dh)
                                                    setTamUng(null)
                                                }
                                            })
                                        }}
                                    >
                                        {options[field.field]?.map((option) => (
                                            <Option key={option.id}
                                                    value={option.id}>{option.label}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            )}
                            {field.type === ('selectTU') && (
                                <Form.Item label={field.headerName}>
                                    <Select
                                        allowClear
                                        name={field.field}
                                        value={formData[field.field] || ''}
                                        onChange={(value) => {
                                            setFormData({...formData, [field.field]: value, id_de_nghi_mua: null});
                                            let dh = tamUngs.find(item => item.id == value)
                                            if (dh) {
                                                setTamUng(dh)
                                                setDonHang(null)

                                            }

                                        }}
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
                        </Col>
                    ))}
                    <Col span={12}>
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
                    <Col span={6}>
                        <div className={styles.section}>
                            <Form.Item label={'Ngoại tệ'}>
                                <input
                                    type="checkbox"
                                    checked={showNgoaiTe}
                                    onChange={() => setShowNgoaiTe(!showNgoaiTe)}
                                />

                            </Form.Item>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div className={styles.section}>
                            <Form.Item label={'Đính kèm'}>
                                <div>
                                    <PopUpUploadFile
                                        id={`DNTT_${idCard}`}
                                        table={table}
                                        onGridReady={() => setLoadData(!loadData)}
                                        card={idCard}
                                    />
                                </div>
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
                <button className={css.btn_tao_phieu} onClick={handleCreateDNTT}>Tạo phiếu</button>
            </div>

            {isOpenPhieuLQ && <PhieuLQ isOpenPhieuLQ={isOpenPhieuLQ} setIsOpenPhieuLQ={setIsOpenPhieuLQ}
                                       selectedPhieuCodes={selectedPhieuCodes}
                                       setSelectedPhieuCodes={setSelectedPhieuCodes}/>}
        </div>

    );
}
