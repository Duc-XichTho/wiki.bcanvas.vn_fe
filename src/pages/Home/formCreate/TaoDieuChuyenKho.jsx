import css from "./TaoPhieuXuat.module.css";
import React, {useContext, useEffect, useState} from "react";
import {Col, Form, Input, Row, Select} from "antd";
import {DANH_MUC_LIST} from "../../../Consts/DANH_MUC_LIST.js";
import {createTimestamp, formatCurrency, parseCurrencyInput} from "../../../generalFunction/format.js";
import {toast} from "react-toastify";
import EditableTable from "./EditableTable.jsx";
import {
    createNewDieuChuyenKho,
    getDieuChuyenKhoByCardId,
    updateDieuChuyenKho
} from "../../../apis/dieuChuyenKhoService.jsx";
import {getCurrentUserLogin} from "../../../apis/userService.jsx";
import {useParams} from "react-router-dom";
import {getAllCard} from "../../../apis/cardService.jsx";
import {getAllStep} from "../../../apis/stepService.jsx";
import {getAllHangHoa, getAllInfoInventoryService} from "../../../apis/hangHoaService.jsx";
import {getDetailData} from "./GomPhieu/logicGom.js";
import {getAllInputMau} from "../../../generalFunction/logicMau/logicMau.js";
import {MyContext} from "../../../MyContext.jsx";
import {SA, SB} from '../../../Consts/LIST_STEP_TYPE.js'
import {DONE} from "../../../Consts/STEP_STATUS.js";
import {CODE_DCK, CODE_PN, CODE_PX, genCode} from "../../../generalFunction/genCode/genCode.js";
import {getAllKho, getKhoDataById} from "../../../apis/khoService.jsx";
import {getAllLo} from "../../../apis/loService.jsx";
import {getAllCauHinh} from "../../../apis/cauHinhService.jsx";
import {calGiaBan, calNhapXuatTon} from "../AgridTable/SoLieu/TonKho/logicTonKho.js";
import {createNewDetailPhieuNhap, getFullDetailPhieuNhapService} from "../../../apis/detailPhieuNhapService.jsx";
import {createNewDetailPhieuXuat, getFullDetailPhieuXuatService} from "../../../apis/detailPhieuXuatService.jsx";
import {createNewPhieuXuat, updatePhieuXuat} from "../../../apis/phieuXuatService.jsx";
import {createNewPhieuNhap, updatePhieuNhap} from "../../../apis/phieuNhapService.jsx";
import {setItemInIndexedDB2} from "../../KeToanQuanTri/storage/storageService.js";
import {updateCardDetails} from "../SubStep/SubStepItem/Mau/cardUtils.js";
import dayjs from "dayjs";
import {getAllNhanVien} from "../../../apis/nhanVienService.jsx";

const {Option} = Select;

export default function TaoDieuChuyenKho({fetchDCK}) {
    const {
        loadData,
        setLoadData,
        selectedCompany,
        currentYear,
        chainTemplate2Selected,
        setChainTemplate2Selected
    } = useContext(MyContext);
    const {id, idCard, idStep} = useParams();
    let table = 'DieuChuyenKho';
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
    const [cauHinh, setCauHinh] = useState(null);
    const [hhs, setHHs] = useState([]);
    const [nhaps, setNhaps] = useState(null);
    const [xuats, setXuats] = useState(null);
    const [dataDieuChuyenKhoByCardId, setDataDieuChuyenKhoByCardId] = useState([]);

    const fetchDieuChuyenKhoByCardId = async () => {
        try {
            const data = await getDieuChuyenKhoByCardId(idCard);
            setDataDieuChuyenKhoByCardId(data);
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

    function fetchHHs() {
        getAllHangHoa().then(data => {
            setHHs(data)
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
        fetchHHs()
        getAllCauHinh().then(data => {
            setCauHinh(data.find(item => item.field == 'Giá bán'));
        })
        getFullDetailPhieuNhapService().then(data => {
            setNhaps(data);
        })
        getFullDetailPhieuXuatService().then(data => {
            setXuats(data)
        })
        setFormData({});
        setListNumberInput([]);
        fetchDieuChuyenKhoByCardId();

    }, []);
    const getData = async (startDate, endDate) => {
        let result = []
        result = calNhapXuatTon(nhaps, xuats, startDate, endDate)
        return result
    };

    async function loadListSPFromKho() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0 nên cần +1
        const day = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        if (formData?.id_kho_nguon) {
            const data = await getData('2024-01-01', formattedDate)
            const kho = await getKhoDataById(formData?.id_kho_nguon);
            if (data) {
                let listSP = data.filter(e => e?.kho === kho?.code)
                let detail = []
                let keyAuto = 1
                if (listSP?.length > 0) {
                    listSP.map(e => {
                        detail.push({
                            ...e,
                            key: keyAuto,
                            so_luong_ton: e.SoLuongTonCuoiKy

                        })
                        keyAuto++
                    })
                }
                setDataDetail(detail)
            }
        }

    }

    useEffect(() => {
        loadListSPFromKho()
    }, [formData?.id_kho_nguon, loadData])

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
                                label: `${item['code2'] || item['code']}`,
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
            setFormData({...formData, lenh_san_xuat: e.target.value});
        }
    };

    const handleSave = async () => {
        const dataLo = await getAllLo()
        const dataKho = await getAllKho()
        const dataNV = await getAllNhanVien()
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


        if (table === "DieuChuyenKho") {
            let detail = []
            for (const e of dataDetail) {
                if (e?.so_luong_dieu_chuyen > 0) {
                    e.id_hang_hoa = hhs.find(hh => hh?.code == e?.code)?.id
                    e.gia_nhap = calGiaBan(nhaps, xuats, e.code, e.kho, cauHinh)
                    e.gia_xuat = calGiaBan(nhaps, xuats, e.code, e.kho, cauHinh)
                    e.so_luong = e.so_luong_dieu_chuyen

                    detail.push(e)
                }
            }
            formData.id = null;
            await createNewDieuChuyenKho(formData).then(async e => {
                    await updateDieuChuyenKho({...e.data, code: e.code = genCode(CODE_DCK, e.data.id, currentYear)})
                    await createNewPhieuXuat({...formData, id_dieu_chuyen_kho: e.id}).then(async (dataPX) => {
                        if (dataPX && dataPX.data && detail?.length > 0) {
                            for (const detailItem of detail) {
                                const data = {
                                    ...detailItem,
                                    id: null, id_phieu_xuat:
                                    dataPX.data.id,
                                    id_lo: dataLo.find(l => l?.code == detailItem?.lo)?.id,
                                    id_kho: dataKho.find(k => k?.id == formData.id_kho_nguon)?.id
                                }
                                await createNewDetailPhieuXuat(data)
                            }
                        }
                        dataPX.data.code = genCode(CODE_PX, dataPX.data.id, currentYear);
                        await updatePhieuXuat(dataPX.data);
                    })
                    await createNewPhieuNhap({...formData, id_dieu_chuyen_kho: e.id}).then(async (dataPN) => {
                        if (dataPN && dataPN.data && detail?.length > 0) {
                            for (const detailItem of detail) {
                                const data = {
                                    ...detailItem,
                                    id: null,
                                    id_phieu_nhap: dataPN.data.id,
                                    id_lo: dataLo.find(l => l?.code == detailItem?.lo)?.id,
                                    id_kho: dataKho.find(k => k?.id == formData.id_kho_dich)?.id
                                }
                                await createNewDetailPhieuNhap(data)
                            }
                        }
                        dataPN.data.code = genCode(CODE_PN, dataPN.data.id, currentYear);
                        await updatePhieuNhap(dataPN.data);
                    })

                    const infoKho = e.data.id_kho_nguon && e.data.id_kho_dich
                        ? `${dataKho.find(k => k?.id == e.data.id_kho_nguon)?.code} | ${dataKho.find(k => k?.id == e.data.id_kho_nguon)?.name} --> ${dataKho.find(k => k?.id == e.data.id_kho_dich)?.code} | ${dataKho.find(k => k?.id == e.data.id_kho_dich)?.name}`
                        : "";
                    const infoNV = e.data.id_nhan_vien
                        ? `${dataNV.find(k => k?.id == e.data.id_nhan_vien)?.code} | ${dataNV.find(k => k?.id == e.data.id_nhan_vien)?.name}`
                        : "";

                    await updateCardDetails(idCard, e.data.ngay, infoNV, infoKho, genCode(CODE_DCK, e.data.id, currentYear));
                    setChainTemplate2Selected({
                        type: 'chain2',
                        data: {
                            ...chainTemplate2Selected.data,
                            selectedTemplate: {
                                ...chainTemplate2Selected.data?.selectedTemplate,
                                cards: chainTemplate2Selected.data?.selectedTemplate.cards.map((item) => item.id == idCard ? {
                                    ...item,
                                    name:genCode(CODE_DCK, e.data.id, currentYear),
                                    mo_ta: e.data.ngay,
                                    so_tien: infoNV,
                                    mo_ta2: infoKho
                                } : item)
                            }
                        }
                    })
                }
            )

        }


        toast.success("Tạo phiếu điều chuyển thành công", {autoClose: 1000});
        fetchDCK()
        setLoadData(!loadData);
        await fetchDieuChuyenKhoByCardId(idCard)
        setDataDetail([])
        setFormData({});
    };

    useEffect(() => {
        getAllInputMau().then(ipms => {
            const ipm = ipms.find(e => e.label == 'Mã đơn hàng')
            setFormData(prevState => ({
                ...prevState,
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
                                    table={table}
                                />
                            ) : null
                        )}
                    </Col>
                )}
                <button className={css.btn_tao_phieu} onClick={handleSave}>Tạo phiếu</button>
            </Form>
        </div>


    );
}
