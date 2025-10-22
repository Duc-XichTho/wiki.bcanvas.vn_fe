import {Col, Form, Input, Modal, Row, Select, Table} from "antd";
import {useParams} from "react-router-dom";
import css from "../Mau.module.css";
import React, {useContext, useEffect, useState} from "react";
import {getAllDeNghiThanhToan} from "../../../../../../apis/deNghiThanhToanService.jsx";
import {LienQuanIcon} from "../../../../../../icon/IconSVG.js";
import {DNTTDetail} from "../DNTT/DNTTDetail.jsx";
import {DANH_MUC_LIST} from "../../../../../../Consts/DANH_MUC_LIST.js";
import {createTimestamp, formatCurrency, parseCurrencyInput} from "../../../../../../generalFunction/format.js";
import {
    createNewDetailPhieuNhap,
    getFullDetailPhieuNhapService
} from "../../../../../../apis/detailPhieuNhapService.jsx";
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
import {getDetailDataGomPhieuNhap} from "../../../../formCreate/GomPhieu/logicGom.js";
import {MyContext} from "../../../../../../MyContext.jsx";
import {getAllKhachHang} from "../../../../../../apis/khachHangService.jsx";
import {getAllCard} from "../../../../../../apis/cardService.jsx";
import {SA, SB} from "../../../../../../Consts/LIST_STEP_TYPE.js";
import {DONE} from "../../../../../../Consts/STEP_STATUS.js";
import {getAllNhaCungCap} from "../../../../../../apis/nhaCungCapService.jsx";
import dayjs from "dayjs";
import {createCardByTemplate} from "../../../../../../generalFunction/createCardByTemplate.js";
import {CODE_PN, CODE_PX, genCode} from "../../../../../../generalFunction/genCode/genCode.js";
import {getNhanVienDataById} from "../../../../../../apis/nhanVienService.jsx";
import {updateCardDetails} from "../cardUtils.js";
import {createNewPhieuNhap, updatePhieuNhap} from "../../../../../../apis/phieuNhapService.jsx";

export function PhieuGomNhap({isOpen, setIsOpen}) {
    const {
        loadData,
        setLoadData,
        selectedCompany,
        currentYear,
        setChainTemplate2Selected,
        chainTemplate2Selected
    } = useContext(MyContext);
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
    const [sps, setSPs] = useState([]);
    const [nccs, setNccs] = useState([]);

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
        getAllNhaCungCap().then(data => {
            setNccs(data)
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
        const selectedItem = DANH_MUC_LIST.find(item => item.key == 'phieu-nhap');
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
            if (item.id === record.id_dntt) {
                let dssp = item.chi_tiet_don_hang;
                dssp[index][field] = value;
            }
        })
        setSelectedDHList(updatedDHList);
    };

    const columns = [
        {
            title: 'Mã hàng hóa',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: 'Tên hàng hóa',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'NCC',
            dataIndex: 'id_nha_cung_cap',
            key: 'id_nha_cung_cap',
            render: (value, record, index) => (
                <Select
                    style={{width: '100%'}}
                    value={value}
                    onChange={(selectedValue) => handleChangeSelect('id_nha_cung_cap', selectedValue, index, record)}
                >
                    {nccs?.map((kho) => (
                        <Select.Option key={kho.id} value={kho.id}>
                            {kho.code}|{kho.name}
                        </Select.Option>
                    ))}
                </Select>
            ),
        },
        {
            title: 'Kho',
            dataIndex: 'id_kho',
            key: 'id_kho',
            render: (value, record, index) => (
                <Select
                    style={{width: '100%'}}
                    value={value}
                    onChange={(selectedValue) => handleChangeSelect('id_kho', selectedValue, index, record)}
                >
                    {khos?.map((kho) => (
                        <Select.Option key={kho.id} value={kho.id}>
                            {kho.code}|{kho.name}
                        </Select.Option>
                    ))}
                </Select>
            ),
        },
        {
            title: 'Lô',
            dataIndex: 'id_lo',
            key: 'id_lo',
            render: (value, record, index) => (
                <Select
                    style={{width: '100%'}}
                    value={value}
                    onChange={(selectedValue) => handleChangeSelect('id_lo', selectedValue, index, record)}
                >
                    {los?.map((lo) => (
                        <Select.Option key={lo.id} value={lo.id}>
                            {lo.code}|{lo.name}
                        </Select.Option>
                    ))}
                </Select>
            ),
        },
        {
            title: 'Số lượng',
            dataIndex: 'so_luong',
            key: 'so_luong',
            render: (value) => value?.toLocaleString('en-US'),
        },
        {
            title: 'Đơn giá',
            dataIndex: 'gia_nhap',
            key: 'gia_nhap',
            render: (value) => (parseInt(value) || 0).toLocaleString('en-US'),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'tong_tien',
            key: 'tong_tien',
            render: (value) => (parseInt(value) || 0).toLocaleString('en-US'),
        },
    ];

    async function handleSave() {
        formData.created_at = createTimestamp();
        formData.gom = 'G' + Date.now();
        formData.user_create = currentUser.email;
        const created_at = dayjs(Date.now()).format('DD-MM-YYYY');
        for (const dh of selectedDHList) {
            let idCardNew = await createCardByTemplate(chainTemplate2Selected?.data?.selectedTemplate, selectedCompany, currentYear, setChainTemplate2Selected, chainTemplate2Selected)
            formData.id_DNTT = dh.id
            formData.id_card_create = idCardNew
            let dataDetail = getDetailDataGomPhieuNhap(idCard, dh.chi_tiet_don_hang, sps)
            let tongTien = 0;
            let e = await createNewPhieuNhap(formData)
            if (e && e.data && dataDetail.length !== 0) {
                dataDetail.forEach(detail => {
                    const data = {...detail, gia_xuat: detail.gia_xuat || 0, id_phieu_nhap: e.data.id, id: null}
                    tongTien += parseInt(data.tong_tien)
                    createNewDetailPhieuNhap(data)
                })
            }
            e.data.code = genCode(CODE_PN, e.data.id, currentYear);
            await updatePhieuNhap({...e.data, id_phieu_xuat: e.data.id});
            const {code = '', name = ''} = (await getNhanVienDataById(formData.id_nhan_vien)) || {};
            const dataNhanVien = `${code} | ${name}`;
            await updateCardDetails(idCardNew, created_at, tongTien, dataNhanVien, genCode(CODE_PN, e.data.id, currentYear));
            //     setChainTemplate2Selected({
            //         type: 'chain2',
            //         data: {
            //             ...chainTemplate2Selected.data,
            //             selectedTemplate: {
            //                 ...chainTemplate2Selected.data.selectedTemplate,
            //                 cards: [...chainTemplate2Selected.data.selectedTemplate.cards, {
            //                     id: idCardNew,
            //                     mo_ta: created_at,
            //                     so_tien: tongTien,
            //                     mo_ta2: dataNhanVien,
            //                     name: genCode(CODE_PX, e.data.id, currentYear)
            //                 }]
            //             }
            //         }
            //     });
            //
        }
        window.location.reload()
        toast.success("Tạo dòng thành công", {autoClose: 1000});
        setLoadData(!loadData);
        setIsOpen(false)
    }

    async function handleOpenModal() {
        let listDH = []
        let key = Date.now()
        for (const dh of selectedDHs) {
            let d = dhList.find(e => e.id == dh);
            d.chi_tiet_don_hang = [];
            d.danh_sach_hang_hoa.forEach(e => {
                const hh = sps.find(h => h.id == e.id)
                let ncc = {}
                if (hh) {
                    ncc = nccs.find(n => n.id == hh.id_nha_cung_cap)
                }
                d.chi_tiet_don_hang.push({
                    id_hang_hoa: e?.id,
                    id_dntt: d.id,
                    code: e?.code,
                    name: e?.name,
                    id_nha_cung_cap: ncc ? ncc.id : null,
                    so_luong: e?.so_luong,
                    gia_nhap: e?.don_gia,
                    key: key,
                    tong_tien: e?.don_gia * e?.so_luong,
                })
                key++

            })
            listDH.push(d);
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
        getAllDeNghiThanhToan().then(data => {
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
                width={'95%'}

            >
                <div style={{
                    display: "flex", height: '80vh', overflowY: 'auto', gap: '20px'
                }}>
                    <div className={css.bar}>
                        <div className={css.list}>
                            <span style={{marginLeft: '15px'}}>Danh sách DNTT</span>
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
                        {selected && <DNTTDetail phieu={selected} phieuGom={true}/>}
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
                        width={'90%'}
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
                                        dataSource={dh.chi_tiet_don_hang?.length > 0 ? dh.chi_tiet_don_hang : []}
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
