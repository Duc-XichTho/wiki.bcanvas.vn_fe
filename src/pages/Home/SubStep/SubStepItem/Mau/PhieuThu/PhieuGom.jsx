import {Col, Form, Input, InputNumber, Modal, Row, Select, Table} from "antd";
import {useParams} from "react-router-dom";
import css from "../Mau.module.css";
import React, {useContext, useEffect, useState} from "react";
import {getDonHangByCode} from "../../../../../../apis/donHangService.jsx";
import {LienQuanIcon} from "../../../../../../icon/IconSVG.js";
// import {PhieuGomDetail} from "./PhieuGomDetail.jsx";
import {DANH_MUC_LIST} from "../../../../../../Consts/DANH_MUC_LIST.js";
import {formatCurrency, parseCurrencyInput} from "../../../../../../generalFunction/format.js";
import {getFullDetailPhieuNhapService} from "../../../../../../apis/detailPhieuNhapService.jsx";
import {getFullDetailPhieuXuatService} from "../../../../../../apis/detailPhieuXuatService.jsx";
import {getAllCauHinh} from "../../../../../../apis/cauHinhService.jsx";
import {getAllHangHoa} from "../../../../../../apis/hangHoaService.jsx";
import {getAllKho} from "../../../../../../apis/khoService.jsx";
import {getAllLo} from "../../../../../../apis/loService.jsx";
import {getCurrentUserLogin} from "../../../../../../apis/userService.jsx";
import {MyContext} from "../../../../../../MyContext.jsx";
import {getAllKhachHang} from "../../../../../../apis/khachHangService.jsx";
import {getAllCard} from "../../../../../../apis/cardService.jsx";
import {SA, SB} from "../../../../../../Consts/LIST_STEP_TYPE.js";
import {DONE} from "../../../../../../Consts/STEP_STATUS.js";
import {getAllHoaDon} from "../../../../../../apis/hoaDonService.jsx";
import {HoaDonDetail} from "../HoaDon/HoaDonDetail.jsx";

export function PhieuGom({isOpen, setIsOpen}) {
    const {loadData, setLoadData} = useContext(MyContext);
    const {idCard} = useParams();
    const [dhList, setdhList] = useState([]);
    const [selected, setSelected] = useState(null);
    const [selectedDHs, setSelectedDHs] = useState([]);
    const [selectedDHList, setSelectedDHList] = useState([]);
    const [isOpenModal, setIsOpenModal] = useState(false);
    let table = 'PhieuThu';
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
        const selectedItem = DANH_MUC_LIST.find(item => item.table === table);
        if (selectedItem) {
            const updatedFields = selectedItem.fields.filter(item => item.field !== 'id' && item.field !== "don_hang_lien_quan" && item.field !== "so_tien");
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

    const handleChange = (value, data, dataIndex) => {
        const updatedDHList = selectedDHList.map(item => {
            if (item.id === data.orderId) {
                let dssp = item.chi_tiet;
                if (dssp) {
                    let sp = dssp.find(s => s.code_hang_hoa === data.code_hang_hoa);
                    if (sp) {
                        sp[dataIndex] = value;
                    }
                }
            }
            return item;
        });
        setSelectedDHList(updatedDHList);
    };

    const currencyFormatter = (value) =>
        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₫';

    const currencyParser = (value) => value.replace(/[^0-9]/g, '');
    const columns = [
        {
            title: 'Mã hàng hóa',
            dataIndex: 'code_hang_hoa',
            key: 'code_hang_hoa',
        },
        {
            title: 'Tên hàng hóa',
            dataIndex: 'name_hang_hoa',
            key: 'name_hang_hoa',
        },
        {
            title: 'Thuế',
            dataIndex: 'thue_gtgt',
            key: 'thue_gtgt',
            render: (value) => (value+'%'),
        },
        {
            title: 'Chiết khấu',
            dataIndex: 'chiet_khau',
            key: 'chiet_khau',
            render: (value, record) => (
                <InputNumber
                    value={value}
                    min={0}
                    formatter={currencyFormatter}
                    parser={currencyParser}
                    onChange={(val) => handleChange(val, record, 'chiet_khau')}
                />
            ),
        },
        {
            title: 'Số lượng',
            dataIndex: 'so_luong',
            key: 'so_luong',
            render: (value, record) => (
                <InputNumber
                    value={value}
                    min={0}
                    onChange={(val) => handleChange(val, record, 'so_luong')}
                />
            ),
        },
        {
            title: 'Đơn giá',
            dataIndex: 'don_gia',
            key: 'don_gia',
            render: (value, record) => (
                <InputNumber
                    value={value}
                    min={0}
                    formatter={currencyFormatter}
                    parser={currencyParser}
                    onChange={(val) => handleChange(val, record, 'don_gia')}
                />
            ),
        },

    ];

    async function handleSave() {
        console.log(selectedDHList)
        // formData.created_at = createTimestamp();
        // formData.gom = 'G' + Date.now();
        // formData.id_card_create = idCard;
        // formData.user_create = currentUser.email;
        // for (const dh of selectedDHList) {
        //     formData.donHang = dh.code
        //     let kh = khs.find(k => k.code == dh.code_khach_hang);
        //     formData.id_khach_hang = kh?.id
        //     let dataDetail = getDetailDataGom(idCard, dh.chi_tiet_don_hang, sps)
        //     await createNewPhieuXuat(formData).then(e => {
        //             if (e && e.data && dataDetail.length !== 0) {
        //                 dataDetail.forEach(detail => {
        //                     const data = {...detail, id_phieu_xuat: e.data.id, id: null}
        //                     createNewDetailPhieuXuat(data)
        //                 })
        //             }
        //         }
        //     )
        // }
        //
        // toast.success("Tạo dòng thành công", {autoClose: 1000});
        // setLoadData(!loadData);
        // setIsOpen(false)
    }

    async function handleOpenModal() {
        let listDH = []
        for (const dh of selectedDHs) {
            let hoaDon = dhList.find(item => item.code == dh);
            let donHang = await getDonHangByCode('DH|'+hoaDon.id_card_create)
            let ctdh = [];
            if (donHang && donHang.chi_tiet_don_hang) {
                ctdh = donHang.chi_tiet_don_hang;
            }
            if (hoaDon){
                hoaDon.chi_tiet = []
                hoaDon.sanPham.forEach(e => {
                    let newItem = {
                        code_hang_hoa: e.productCode,
                        so_luong: e.soLuong,
                        orderId: e.orderId
                    }
                    let hh = ctdh.find(item => item.code_hang_hoa == newItem.code_hang_hoa)
                    newItem.name_hang_hoa = hh.name_hang_hoa
                    newItem.don_gia = hh.gia_ban
                    newItem.thue_gtgt = hh.thue_vat
                    newItem.chiet_khau = hh.chiet_khau*newItem.so_luong/hh.so_luong
                    hoaDon.chi_tiet.push(newItem)
                })
                listDH.push(hoaDon);
            }
        }
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
            setdhList(data);
        })
    }

    function changeSelected(select) {
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
                                        }}>
                                        <div className={css.item} key={item.code}>
                                            <img src={LienQuanIcon} alt=""/>
                                            <span>HD{item.id}|{item.code}</span>
                                        </div>
                                        <input type="checkbox" value={item.code} onChange={handleChangeCheckbox}/>
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
                        width={800}
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

                        {selectedDHList.map(dh => (
                            <>
                                <div className={css.table}>
                                    <h3>{dh.code}</h3>
                                    <Table
                                        dataSource={dh.chi_tiet?.length > 0 ? dh.chi_tiet : []}
                                        columns={columns}
                                        pagination={false}
                                    />
                                </div>
                            </>
                        ))}
                    </Modal>
                </>
            }

        </>
    )
}
