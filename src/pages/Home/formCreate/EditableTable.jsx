import React, {useContext, useEffect, useState} from 'react';
import {Button, Input, InputNumber, Select, Table, Typography, Card, Divider, ConfigProvider} from 'antd';

import css from './formCreate.module.css';
import {DeleteIcon} from "../../../icon/IconSVG.js";
import {getAllCauHinh} from "../../../apis/cauHinhService.jsx";
import {calGiaBan} from "../AgridTable/SoLieu/TonKho/logicTonKho.js";
import {getFullDetailPhieuNhapService} from "../../../apis/detailPhieuNhapService.jsx";
import {getFullDetailPhieuXuatService} from "../../../apis/detailPhieuXuatService.jsx";
import {getAllHangHoa} from "../../../apis/hangHoaService.jsx";
import {getAllLo} from "../../../apis/loService.jsx";
import {getAllKho} from "../../../apis/khoService.jsx";
import {getPhieuXuatByCardId} from "../../../apis/phieuXuatService.jsx";
import {useParams} from "react-router-dom";
import {MyContext} from "../../../MyContext.jsx";
import {getAllHoaDon, getHoaDonByCardId} from "../../../apis/hoaDonService.jsx";
import {getDonHangByCode, getDonHangById} from "../../../apis/donHangService.jsx";
import {formatCurrency} from "../../../generalFunction/format.js";
import {getAllDonMuaHang, getDonMuaHangByCode} from "../../../apis/donMuaHangService.jsx";
import {getAllDeNghiThanhToan, getDeNghiThanhToanDataByCardId} from "../../../apis/deNghiThanhToanService.jsx";
import {getAllNhaCungCap} from "../../../apis/nhaCungCapService.jsx";
import UploadFilePWS from "../../../components/UploadFile/UploadFilePWS.jsx";
import PopUpUploadFile from "../../../components/UploadFile/PopUpUploadFile.jsx";

const {Option} = Select;
const {Text} = Typography;

const gridStyle = {
    width: '100%',
    padding: '10px',
};

const EditableTable = ({
                           field,
                           optionsObject,
                           dataDetail,
                           setDataDetail,
                           editable,
                           setListPXSelected,
                           listPXSelected,
                           setListHDSelected,
                           listHDSelected,
                           setListDMHSelected,
                           listDMHSelected,
                           listDNTTSelected,
                           setListDNTTSelected,
                           table,
                           formData,
                           showNgoaiTe
                       }) => {
    const {idCard} = useParams()
    const [nhaps, setNhaps] = useState(null);
    const [xuats, setXuats] = useState(null);
    const [cauHinh, setCauHinh] = useState(null);
    const [sps, setSPs] = useState(null);
    const [khos, setKhos] = useState(null);
    const {loadData} = useContext(MyContext);
    const [listPhieuXuatByCard, setListPhieuXuatByCard] = useState([]);
    const [listDonMuaHangByCard, setListDonMuaHangByCard] = useState([]);
    const [listDNTTByCard, setListDNTTByCard] = useState([]);
    const [listHDtByCard, setListHDByCard] = useState([]);
    const [donHang, setDonHang] = useState(null);
    const [capNhatSoLuong, setCapNhatSoLuong] = useState(false);
    const [tongTien, setTongTien] = useState(0);

    useEffect(() => {
        if (dataDetail) {
            const dataTongTien = dataDetail.map(item => item.tong_tien ? item.tong_tien : 0);
            setTongTien(dataTongTien.reduce((acc, item) => acc + Number(item), 0));
        }
    }, [dataDetail])

    useEffect(() => {
        try {
            getDonMuaHangByCode(decodeURIComponent(`DH|${idCard}`)).then(data => {
                setListDonMuaHangByCard(prevState => {
                    return [...prevState, data?.length > 0 ? data : []]
                })

            })
            getFullDetailPhieuNhapService().then(data => {
                setNhaps(data?.length > 0 ? data : []);
            })
            getFullDetailPhieuXuatService().then(data => {
                setXuats(data?.length > 0 ? data : [])
            })
            getAllCauHinh().then(data => {
                setCauHinh(data.find(item => item.field == 'Giá bán') || []);
            })
            getAllHangHoa().then(data => {
                setSPs(data?.length > 0 ? data : [])
            })
            getAllKho().then(data => {
                setKhos(data?.length > 0 ? data : [])
            })
            getPhieuXuatByCardId(idCard).then(e => {
                setListPhieuXuatByCard(e.filter(item => item.phieu_giao_hang?.length === 0) || [])
            })
            getAllHoaDon().then(e => {
                setListHDByCard(e?.length > 0 ? e : [])
            })
            getDonHangByCode(`DH|${idCard}`).then(data => {
                setDonHang(data?.length > 0 ? data : [])
            })
            getAllDeNghiThanhToan().then(data => {
                setListDNTTByCard(data?.length > 0 ? data : [])
            })
        } catch (e) {
            console.log(e)
        }

    }, [loadData]);


    const fetchDonHangById = async () => {
        try {
            const dataDonHangById = await getDonHangById(formData?.donHang);
            const pushDetail = dataDonHangById?.chi_tiet_don_hang?.map(item => ({
                key: item.id,
                id_hang_hoa: item.id_hang_hoa,
                id_lo: null,
                id_nha_cung_cap: null,
                id_kho: null,
                gia_nhap: '',
                so_luong: item.so_luong,
            }))
            setDataDetail(pushDetail);

        } catch (error) {
            console.log("error", error);
        }
    }

    useEffect(() => {
        if (formData?.donHang) {
            fetchDonHangById();
        }
    }, [formData?.donHang])

    const handleAddRow = () => {
        const newRow = {
            key: Date.now(),
            id_hang_hoa: null,
            id_lo: null,
            id_nha_cung_cap: null,
            id_kho: null,
            gia_nhap: '',
            so_luong: '',
        };
        setDataDetail([...dataDetail, newRow]);
    };

    const handleInputChange = (key, fieldName, value) => {
        // Only process changes if the field is editable or if it's id_lo or id_kho
        // if (!editable && fieldName !== 'id_lo' && fieldName !== 'id_kho') {
        //     return;
        // }
        console.log('key', key);
        console.log('fieldName', fieldName);
        console.log('value', value);
        const updatedData = dataDetail.map(row =>
            row.key === key ? {...row, [fieldName]: value} : row
        );

        if (['id_hang_hoa', 'id_kho', 'id_lo'].includes(fieldName) && table == 'PhieuXuat') {
            const currentRow = updatedData.find(row => row.key === key);
            if (currentRow.id_hang_hoa && currentRow.id_kho) {
                let sp = sps.find(item => item.id == currentRow.id_hang_hoa);
                let kho = khos.find(item => item.id == currentRow.id_kho);
                currentRow.gia_xuat = calGiaBan(nhaps, xuats, sp.code, kho.code, cauHinh);
            }

            const match = updatedData.find(row =>
                row.id_hang_hoa === currentRow.id_hang_hoa &&
                row.id_kho === currentRow.id_kho &&
                row.id_lo === currentRow.id_lo &&
                row.key !== key
            );

            if (match) {
                updatedData[key] = {...currentRow, gia_nhap: match.gia_nhap, isReadOnly: false};
            }
        }

        if (fieldName === 'so_luong' || fieldName === 'gia_xuat' || fieldName === 'gia_nhap' || fieldName === 'id_hang_hoa' || fieldName === 'id_kho' || fieldName === 'id_lo') {
            const newUpdatedData = updatedData.map(row => {

                let don_gia = row.don_gia || 0;

                let gia_xuat = row.gia_xuat || 0;

                let gia_nhap = row.gia_nhap || 0;

                let so_luong = row.so_luong || 0;

                let chiet_khau = row.chiet_khau || 0;

                let thue_gtgt = row.thue_gtgt || row.thue || 0;


                return {
                    ...row,
                    tong_tien: (((don_gia * so_luong) + (gia_xuat * so_luong) + (gia_nhap * so_luong)) - chiet_khau) * (1 + thue_gtgt / 100)
                };
            });

            setDataDetail(newUpdatedData);
        } else {
            setDataDetail(updatedData);
        }
    };


    const handleDeleteRow = (key) => {
        if (!editable) return;
        setDataDetail(dataDetail.filter(row => row.key !== key));
    };
    const selectPhieuXuatForPGH = (value) => {
        setListPXSelected(value)
    }
    const selectPhieuXuatForDNTT = (value) => {
        setListDNTTSelected([...listDNTTByCard, value])
    }
    const selectPhieuXuatForDMH = (value) => {
        setListDMHSelected(value)
    }
    const selectHDForPT = (value) => {
        setListHDSelected(value)
    }

    useEffect(() => {
        if (listHDSelected) setListHDSelected([]);
        if (listPXSelected) setListPXSelected([]);
        if (listDNTTSelected) setListDNTTSelected([]);
    }, [idCard]);


    useEffect(() => {
        if (table === 'PhieuGiaoHang') {
            let listDetail = []
            let key = Date.now()
            if (listPXSelected?.length > 0) {
                for (const px of listPhieuXuatByCard) {
                    for (const idPXSelected of listPXSelected) {
                        if (px.id_phieu_xuat == idPXSelected) {
                            px.danh_sach_hang_hoa.forEach(e => {
                                listDetail.push({
                                    id_hang_hoa: e?.id,
                                    code: e?.code,
                                    name: e?.name,
                                    so_luong: e?.so_luong,
                                    key: key,
                                    readOnly: false,
                                })
                                key++
                            })
                        }
                    }
                }
            }
            setDataDetail(listDetail)
        }
    }, [listPXSelected]);

    useEffect(() => {
        if (table === 'PhieuNhap') {
            getAllNhaCungCap().then(nccs => {
                getAllHangHoa().then(hhs => {
                    let listDetail = []
                    let key = Date.now()
                    if (listDNTTSelected?.length > 0) {
                        for (const dntt of listDNTTByCard) {
                            for (const idDNTTSelected of listDNTTSelected) {
                                if (dntt.id == idDNTTSelected) {
                                    dntt.danh_sach_hang_hoa.forEach(e => {
                                        const hh = hhs.find(h => h.id == e.id)
                                        let ncc = {}
                                        if (hh) {
                                            ncc = nccs.find(n => n.id == hh.id_nha_cung_cap)
                                        }
                                        listDetail.push({
                                            id_hang_hoa: e?.id,
                                            code: e?.code,
                                            name: e?.name,
                                            id_nha_cung_cap: ncc ? ncc.id : null,
                                            so_luong: e?.so_luong,
                                            gia_nhap: e?.don_gia,
                                            key: key,
                                            tong_tien: e?.don_gia * e?.so_luong,
                                            // readOnly: true,
                                        })
                                        key++
                                    })
                                }
                            }
                        }
                    }

                    setDataDetail(listDetail)
                })
            })
        }
    }, [listDNTTSelected]);


    useEffect(() => {
        if (table === 'PhieuThu' || table === 'DeNghiThanhToan') {
            let listDetail = []
            let key = Date.now()

            if (listHDSelected?.length > 0) {
                for (const hd of listHDtByCard) {
                    for (const idHDSelected of listHDSelected) {
                        if (hd.id_hoa_don == idHDSelected) {
                            hd.danh_sach_hang_hoa.forEach(e => {

                                let newItem = {
                                    id_hang_hoa: e?.id,
                                    code: e?.code,
                                    name: e?.name,
                                    so_luong: e?.so_luong,
                                    dvt: e?.dvt,
                                    thue_gtgt: e?.thue_gtgt,
                                    don_gia: parseInt(e?.don_gia) || 0,
                                    key: key,
                                    // readOnly: true,
                                }
                                let hhdh = donHang?.chi_tiet_don_hang;
                                let don_gia = newItem.don_gia || 0
                                let so_luong = newItem.so_luong || 0
                                let chiet_khau = newItem.chiet_khau || 0
                                let thue_gtgt = newItem.thue_gtgt || 0


                                if (hhdh) {
                                    hhdh.forEach(hh => {
                                        if (hh.code_hang_hoa == newItem.code) {
                                            if (hh.chiet_khau) {
                                                newItem.chiet_khau = hh.chiet_khau || 0
                                                chiet_khau = hh.chiet_khau || 0
                                                // newItem.gia_ban = (hh.chiet_khau / hh.so_luong * newItem.so_luong) * newItem.gia_ban;

                                            }
                                        }
                                    })
                                }
                                newItem.tong_tien = (don_gia * so_luong - chiet_khau * so_luong) * (1 + thue_gtgt / 100)
                                listDetail.push(newItem)
                                key++
                            })
                        }
                    }
                }
            }
            setDataDetail(listDetail)
        }


    }, [listHDSelected]);


    return (
        <div className={css.create_model__box}>
            {editable && (
                <>
                    {
                        field.field !== 'detailDieuChuyenKho' &&
                        <Button onClick={handleAddRow} style={{marginBottom: 16}}>Thêm chi tiết</Button>
                    }

                    <Divider orientation="left" orientationMargin="0">
                        {
                            field.field !== 'detailDieuChuyenKho' && <ConfigProvider
                                theme={{
                                    token: {
                                        borderRadiusLG: 0
                                    },
                                }}
                            >
                                <Card>
                                    <Card.Grid style={gridStyle}>
                                        <Text strong>Tổng
                                            tiền: &nbsp;&nbsp;&nbsp;{Number(tongTien).toLocaleString('vi-VN')}</Text>
                                    </Card.Grid>
                                </Card>
                            </ConfigProvider>
                        }

                    </Divider>
                    {field.field === 'detailPhieuNhap' && (
                        <>
                            <Typography>Chọn đề nghị thanh toán</Typography>
                            <Select
                                allowClear
                                onChange={selectPhieuXuatForDNTT}
                            >
                                {listDNTTByCard?.map(e => {
                                        return (<Select.Option
                                            value={e.id}>DNTT | {e?.id} - Tổng tiền
                                            : {formatCurrency(e?.tong_tien)} ₫</Select.Option>)
                                    }
                                )}
                            </Select>
                        </>

                    )}
                    {field.field === 'chiTietPhieuGiaoHang' && (
                        <>
                            <Typography>Chọn phiếu xuất</Typography>
                            <Select
                                mode={'multiple'}
                                allowClear
                                onChange={selectPhieuXuatForPGH}
                            >
                                {listPhieuXuatByCard?.map(e =>
                                    (<Select.Option
                                        value={e.id_phieu_xuat}>PX{e?.id_phieu_xuat}</Select.Option>)
                                )}
                            </Select>
                        </>

                    )}
                    {field.field === 'chiTietPhieuThu' && (
                        <>
                            <span>Chọn hóa đơn</span>
                            <Select
                                mode={'multiple'}
                                allowClear
                                onChange={selectHDForPT}
                            >
                                {listHDtByCard?.map(e => {
                                    return (<Select.Option
                                            value={e.id_hoa_don}>{e?.code} - Tổng
                                            tiền: {formatCurrency(e?.tong_gia_tri)}₫</Select.Option>
                                    )
                                })}
                            </Select>
                        </>

                    )}

                </>
            )}

            <div className={css.tableContainer}>
                <Table
                    dataSource={dataDetail}
                    rowKey="key"
                    pagination={false}
                    className={css.tableDetail}
                    scroll={{ x: 'max-content' }}

                >
                    {field.object.map(detailField => (
                        <Table.Column
                            key={detailField.field}
                            title={detailField.headerName}
                            dataIndex={detailField.field}
                            width={150}
                            render={(text, record) => {
                                const isFieldEditable = editable
                                // || detailField.field === 'id_lo' || detailField.field === 'id_kho';
                                
                                return (
                                    detailField.type === 'select' ? (
                                        <Select
                                            className={`${css.selectDetail}`}

                                            showSearch
                                            value={record[detailField.field]}
                                            onChange={(value) => handleInputChange(record.key, detailField.field, value)}
                                            // disabled={field.field === 'detailPhieuNhap' ? !(detailField.field == 'id_lo' || detailField.field == 'id_kho') : (!isFieldEditable || detailField.field === 'id_nha_cung_cap' || record?.readOnly)}
                                            style={{backgroundColor: 'white', width: '150px', height: '36px'}}
                                        >
                                            {optionsObject[detailField.field]?.map(option => (
                                                <Option key={option.id}
                                                        value={option.id}>{option.label} | {option?.name}</Option>
                                            ))}
                                        </Select>
                                    ) :detailField.type === 'file' ? (
                                        <div   style={{width: '200px'}}>
                                            <PopUpUploadFile
                                                id={record[detailField.key]}
                                                table={`card_${detailField.code}_${idCard}`}
                                                onGridReady={()=>setLoadData(!loadData)}
                                                card={idCard}
                                            />
                                        </div>

                                    ) : (
                                        <>
                                            {detailField.type === 'decimal' || detailField.type === 'number' ?
                                                <InputNumber
                                                    value={formatCurrency(parseInt(record[detailField.field]) || 0)}
                                                    onChange={(e) => handleInputChange(record.key, detailField.field, e)}
                                                    readOnly={detailField.field == 'so_luong' ? false : (!isFieldEditable || (detailField.field === 'gia_nhap' && record.isReadOnly) || record?.readOnly || detailField?.readOnly)}
                                                    style={{backgroundColor: 'white', width: '120px', height: '36px'}}
                                                /> :


                                                <Input
                                                    type={text}
                                                    value={detailField.type === 'decimal' || detailField.type === 'number' ? formatCurrency(parseInt(record[detailField.field]) || 0) : record[detailField.field]}
                                                    onChange={(e) => handleInputChange(record.key, detailField.field, e.target.value)}
                                                    readOnly={record?.readOnly || detailField?.readOnly || !isFieldEditable || (detailField.field === 'gia_nhap' && record.isReadOnly)}
                                                    style={{backgroundColor: 'white', width: '120px', height: '36px'}}
                                                />}
                                        </>

                                    )
                                );
                            }}
                        />
                    ))}
                    {
                        showNgoaiTe && (
                            <>
                                <Table.Column
                                    title="Tiền nguyên tệ"
                                    render={(text, record) => (
                                        <InputNumber
                                            style={{backgroundColor: 'white', width: '120px', height: '36px'}}
                                            onChange={(e) => handleInputChange(record.key, 'tien_nguyen_te', e)}

                                        />


                                    )}
                                />
                                <Table.Column
                                    title="Tỷ giá"
                                    render={(text, record) => (
                                        <InputNumber
                                            style={{backgroundColor: 'white', width: '120px', height: '36px'}}
                                            onChange={(e) => handleInputChange(record.key, 'ty_gia', e)}

                                        />


                                    )}
                                />
                                <Table.Column
                                    title="Tổng tiền nguyên tệ"
                                    render={(text, record) => (
                                        <InputNumber
                                            style={{backgroundColor: 'white', width: '150px', height: '36px'}}
                                            onChange={(e) => handleInputChange(record.key, 'tong_tien_nguyen_te', e)}

                                        />


                                    )}
                                />
                            </>


                        )
                    }
                    {editable && (
                        <Table.Column
                            title="Actions"
                            render={(text, record) => (
                                <>
                                    {!record?.readOnly && <Button style={{width: '35px'}} danger
                                                                  onClick={() => handleDeleteRow(record.key)}>
                                        <img src={DeleteIcon} alt=""/>
                                    </Button>}
                                </>


                            )}
                        />
                    )}
                </Table>
            </div>
        </div>
    );
};

export default EditableTable;
