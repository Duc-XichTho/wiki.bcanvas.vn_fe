import {Col, Form, Input, Modal, Row, Select, Table} from "antd";
import {useParams} from "react-router-dom";
import css from "../Mau.module.css";
import React, {useContext, useEffect, useState} from "react";
import {getAllHoaDon} from "../../../../../../apis/hoaDonService.jsx";
import {LienQuanIcon} from "../../../../../../icon/IconSVG.js";
import {HoaDonDetail} from "../HoaDon/HoaDonDetail.jsx";
import {DANH_MUC_LIST} from "../../../../../../Consts/DANH_MUC_LIST.js";
import {createTimestamp, formatCurrency, parseCurrencyInput} from "../../../../../../generalFunction/format.js";
import {getFullDetailPhieuNhapService} from "../../../../../../apis/detailPhieuNhapService.jsx";
import {
    createNewDetailPhieuXuat,
    getFullDetailPhieuXuatService
} from "../../../../../../apis/detailPhieuXuatService.jsx";
import {getAllCauHinh} from "../../../../../../apis/cauHinhService.jsx";
import {getAllHangHoa} from "../../../../../../apis/hangHoaService.jsx";
import {getAllKho} from "../../../../../../apis/khoService.jsx";
import {getAllLo} from "../../../../../../apis/loService.jsx";
import {toast} from "react-toastify";
import {getCurrentUserLogin} from "../../../../../../apis/userService.jsx";
import {calGiaBan} from "../../../../AgridTable/SoLieu/TonKho/logicTonKho.js";
import {getDetailDataGom} from "../../../../formCreate/GomPhieu/logicGom.js";
import {MyContext} from "../../../../../../MyContext.jsx";
import {createNewPhieuXuat} from "../../../../../../apis/phieuXuatService.jsx";
import {getAllKhachHang} from "../../../../../../apis/khachHangService.jsx";
import {getAllCard} from "../../../../../../apis/cardService.jsx";
import {SA, SB} from "../../../../../../Consts/LIST_STEP_TYPE.js";
import {DONE} from "../../../../../../Consts/STEP_STATUS.js";

export function PhieuGomPhieuThuBaoCo({isOpen, setIsOpen}) {
    const {loadData, setLoadData} = useContext(MyContext);
    const {idCard} = useParams();
    const [dhList, setdhList] = useState([]);
    const [selected, setSelected] = useState(null);
    const [selectedDHs, setSelectedDHs] = useState([]);
    const [selectedDHList, setSelectedDHList] = useState([]);
    const [isOpenModal, setIsOpenModal] = useState(false);
    let table = 'PhieuXuat';
    const [fields, setFields] = useState([]);
    const [khs, setKHs] = useState([]);
    const [cards, setCards] = useState([]);
    const [formData, setFormData] = useState({});
    const [options, setOptions] = useState({});
    const [optionsObject, setOptionsObject] = useState({});
    const [nhaps, setNhaps] = useState(null);
    const [xuats, setXuats] = useState(null);
    const [cauHinh, setCauHinh] = useState(null);
    const [los, setLos] = useState(null);
    const [khos, setKhos] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [sps, setSPs] = useState(null);

    useEffect(() => {
        getFullDetailPhieuNhapService().then(data => {
            setNhaps(data);
        })
        getFullDetailPhieuXuatService().then(data => {
            setXuats(data)
        })
        getAllCauHinh().then(data => {
            setCauHinh(data.find(item => item.field == 'Giá bán'));
        })
        getAllLo().then(data => {
            setLos(data)
        })
        getAllKho().then(data => {
            setKhos(data)
        })
        getAllHangHoa().then(data => {
            setSPs(data)
        })
        getCurrentUserLogin().then(data => {
            setCurrentUser(data)
        })
        getAllKhachHang().then(data => {
            setKHs(data)
        })
        getAllCard().then(data => {
            setCards(data)
        })
    }, []);

    const handleInputChange = async (e, type) => {

        // Handle different input types
        if (type === 'decimal') {
            const {name, value} = e.target;
            const numericValue = value.replace(/[^\d.-]/g, '');
            setFormData({...formData, [name]: formatCurrency(numericValue)});
        } else if (type === 'number') {
            const {name, value} = e.target;
            const numericValue = value.replace(/[^\d.-]/g, '');
            setFormData({...formData, [name]: parseCurrencyInput(numericValue)});
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

    useEffect(() => {
        const selectedItem = DANH_MUC_LIST.find(item => item.key == 'hoa-don');
        if (selectedItem) {
            const updatedFields = selectedItem.fields.filter(item => item.field !== 'id');
            setFields(updatedFields);
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
                            label: `${item[field.key]} | ${item['name']}`,
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

    const handleChangeSelect = (field, value, index, record) => {
        const updatedDHList = [...selectedDHList];
        updatedDHList.forEach(item => {
            if (item.id === record.id_don_hang) {
                let dssp = item.chi_tiet_don_hang;
                dssp[index][field] = value;
                let sp = sps.find(item => item.id == dssp[index].id_hang_hoa)
                let kho = khos.find(item => item.id == dssp[index].id_kho)
                dssp[index].gia_xuat = calGiaBan(nhaps, xuats, sp.code, kho.code, cauHinh)
            }
        })
        setSelectedDHList(updatedDHList);
    };

    const columns = [
        {
            title: 'Mã hàng hóa',
            render:(value)=> `${value?.code} | ${value?.name}`
        },
        {
            title: 'Số lượng',
            dataIndex: 'so_luong',
            key: 'so_luong',
            render: (value) => value?.toLocaleString('en-US'),
            ellipsis: true,
        },
        {
            title: 'Đơn vị',
            dataIndex: 'dvt',
            key: 'dvt',
            ellipsis: true,
        },
        {
            title: 'Đơn giá',
            dataIndex: 'don_gia',
            key: 'don_gia',
            ellipsis: true,
            render: (value) => (parseInt(value) || 0).toLocaleString('en-US'),
        },

    ];

    async function handleSave() {
        formData.created_at = createTimestamp();
        formData.gom = 'G' + Date.now();
        formData.id_card_create = idCard;
        formData.user_create = currentUser.email;
        for (const dh of selectedDHList) {
            formData.donHang = dh.code
            let kh = khs.find(k => k.code == dh.code_khach_hang);
            formData.id_khach_hang = kh?.id
            let dataDetail = getDetailDataGom(idCard, dh.chi_tiet_don_hang, sps)
            await createNewPhieuXuat(formData).then(e => {
                    if (e && e.data && dataDetail.length !== 0) {
                        dataDetail.forEach(detail => {
                            const data = {...detail, id_phieu_xuat: e.data.id, id: null}
                            createNewDetailPhieuXuat(data)
                        })
                    }
                }
            )
        }

        toast.success("Tạo dòng thành công", {autoClose: 1000});
        setLoadData(!loadData);
        setIsOpen(false)
    }

    async function handleOpenModal() {
        let listDH = []
        for (const dh of selectedDHs) {
            let d = dhList.find(e => e.id == dh);
            listDH.push(d);
        }
        console.log(listDH)
        setSelectedDHList(listDH)
        setIsOpenModal(true)
    }

    function fetchDHList() {
        let listDH = []
        cards.forEach(card => {
            if (card && card.cau_truc) {
                let steps = card.cau_truc;
                let donHangStep = steps.find(item => item.type == SA);
                let phieuXuatStep = steps.find(item => item.type == SB);
                if (donHangStep && donHangStep.status === DONE && phieuXuatStep && phieuXuatStep.status !== DONE) {
                    listDH.push(card.id)
                }

            }
        })

        getAllHoaDon().then(data => {
            const filtedData = data.filter(item => item.code);
            setdhList(filtedData);
        })
    }

    const changeSelected = (select) => {
        setSelected(select);
    }

    useEffect(() => {
        fetchDHList()
    }, [cards])

    function handleChangeCheckbox(e) {
        if (e.target.checked) {
            setSelectedDHs([...selectedDHs, e.target.value]);
        } else {
            setSelectedDHs(selectedDHs.filter(item => item !== e.target.value));
        }
    }

    return (
        <>
            <Modal
                open={isOpen}
                title={'Gom phiếu'}
                onCancel={() => {
                    setIsOpen(false)
                }}
                onOk={handleOpenModal}
                okText={'Tạo'}
                cancelText={'Đóng'}
                centered
                width={1200}

            >
                <div style={{
                    display: "flex", height: '80vh', overflowY: 'auto', gap: '20px'
                }}>
                    <div className={css.bar}>
                        <div className={css.list}>
                            <span style={{marginLeft: '15px'}}>Danh sách hóa đơn</span>
                            <div style={{margin: '15px 0 15px 8px'}}>
                                {dhList.map(item => (
                                    <div
                                        className={`${css.nameContainer} ${selected?.code === item.code ? css.selected : ''}`}
                                        onClick={() => {
                                            changeSelected(item)
                                        }}
                                        style={{display: "flex"}}
                                    >
                                        <input type="checkbox" value={item.id} onChange={handleChangeCheckbox}/>
                                        <div className={css.item} key={item.code}>
                                            <img src={LienQuanIcon} alt=""/>
                                            <span>{item.code}</span>
                                        </div>
                                    </div>

                                ))}
                            </div>

                        </div>
                    </div>
                    <div className={css.contentRight}>
                        {selected && <HoaDonDetail phieu={selected}/>}
                    </div>
                </div>
            </Modal>
            {isOpenModal &&
                <>
                    <Modal
                        open={isOpenModal}
                        title={'Xác nhận tạo phiếu'}
                        onCancel={() => {
                            setIsOpenModal(false)
                        }}
                        onOk={handleSave}
                        okText={'Lưu'}
                        cancelText={'Đóng'}
                        centered
                        width={1000}

                    >
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
                                                            <Option key={option.id}
                                                                    value={option.id}>{option.code}</Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            )}
                                        </div>
                                    </Col>
                                </React.Fragment>
                            ))}
                        </Row>
                        <div className={css.phieu_body}>
                            {selectedDHList.map(dh => (
                                <>
                                    <div className={css.table}>
                                        <h3>{dh.code}</h3>
                                        <Table
                                            dataSource={dh.danh_sach_hang_hoa?.length > 0 ? dh.danh_sach_hang_hoa : []}
                                            columns={columns}
                                            pagination={false}
                                        />
                                    </div>
                                </>
                            ))}
                        </div>

                    </Modal>
                </>
            }

        </>
    )
}
