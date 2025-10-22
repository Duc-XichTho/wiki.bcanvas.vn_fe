import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {Button, ConfigProvider, Table} from "antd";
import {getAllHangHoa} from "../../../../../../apis/hangHoaService.jsx";
import {getKhachHangDataById} from "../../../../../../apis/khachHangService.jsx";
import {updateHoaDon} from "../../../../../../apis/hoaDonService.jsx";
import {getSubStepDKIdInCardByType} from "../../../../../../generalFunction/logicMau/logicMau.js";
import {SD} from "../../../../../../Consts/LIST_STEP_TYPE.js";
import {getDinhKhoanProDataByStepId} from "../../../../../../apis/dinhKhoanProService.jsx";
import {createNewDinhKhoanProData} from "../../../../../../apis/dinhKhoanProDataService.jsx";
import {getAllCard} from "../../../../../../apis/cardService.jsx";
import {CODE_PKT, genCode} from "../../../../../../generalFunction/genCode/genCode.js";
import PopUpUploadFile from "../../../../../../components/UploadFile/PopUpUploadFile.jsx";
import PhieuLQView from "../PhieuLQView.jsx";

export function HoaDonDetail({ phieu: initialPhieu }) {
    const { idCard, idStep } = useParams();
    const { loadData, setLoadData, currentYear } = useContext(MyContext);
    let phieuKT = genCode(CODE_PKT, idCard, currentYear)
    const [phieu, setPhieu] = useState(initialPhieu);
    const [card, setCard] = useState([]);
    const [hhs, setHHs] = useState([]);
    const [ selectedPhieuLQ, setSelectedPhieuLQ ] = useState(null);

    function fetchCard() {
        getAllCard().then(data => {
            setCard(data.find(item => item.id == idCard))
        })
        getAllHangHoa().then(data => {
            setHHs(data)
        })
    }

    useEffect(() => {
        fetchCard()
    }, [idCard])
    useEffect(() => {
        setPhieu(initialPhieu);
    }, [initialPhieu]);

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
            title: 'Số lượng',
            dataIndex: 'soLuong',
            key: 'so_luong',
        },
        {
            title: 'Đơn giá',
            dataIndex: 'gia_ban',
            key: 'gia_ban',
            render: (value) => {
                return parseInt(value).toLocaleString('en-US') || 0
            }
        },
        {
            title: 'Hợp đồng',
            dataIndex: 'hopDong',
            key: 'hopDong',
            width: 200,
            render: (value, record, index) => {
                if (!value) return null;
                return (
                    <button className={'btn-view-phieu'} onClick={()=> setSelectedPhieuLQ(value)}>{value}</button>
                )
            }
        },
        {
            title: 'Đính kèm',
            dataIndex: 'dinh_kem',
            key: 'dinh_kem',
            width:200,
            render: (value, record, index) => {
                return (
                    <PopUpUploadFile
                        id={record?.id}
                        table={`card_HDB_${idCard}`}
                        onGridReady={() => setLoadData(!loadData)}
                        card={idCard}
                    />
                )
            }
        },
    ];

    const [matchedItems, setMatchedItems] = useState([]);
    const [khachHang, setKhachHang] = useState([{}]);
    const loadDataDetail = async () => {
        const hangHoaList = await getAllHangHoa();
        const khachHang = await getKhachHangDataById(phieu.id_khach_hang);
        setKhachHang(khachHang)
        const result = phieu.sanPham?.map(item => {
            const matchingItem = hangHoaList.find(hoa => hoa.code == item.productCode);
            return {
                ...matchingItem,
                soLuong: item.soLuong,
                tien_nguyen_te: item.tien_nguyen_te,
                ty_gia: item.ty_gia,
                tong_tien_nguyen_te: item.tong_tien_nguyen_te,
                hopDong: item.hopDong
            };
        });
        setMatchedItems(result);
    }

    useEffect(() => {
        loadDataDetail()
    }, [phieu]);

    async function handleDuyet() {
        await updateHoaDon({ ...phieu, trang_thai: 'Chờ' })
        setPhieu((prevPhieu) => ({
            ...prevPhieu,
            trang_thai: 'Chờ',
        }));
        let idSSDK = getSubStepDKIdInCardByType(card, SD);
        const dinhKhoanPro = await getDinhKhoanProDataByStepId(idSSDK, idCard);
        let pxs = phieu.pxs;
        let lq = '';
        pxs.map(item => {
            lq = item?.code + ','
        })
        phieu.sanPham?.map(async item => {
            let sp = hhs.find(hh => hh.id == item.productId);
            item.tien = item.soLuong * sp.gia_ban;
            item.thue = item.soLuong * sp.gia_ban * (item.thue / 100);
            await createNewDinhKhoanProData({
                dinhKhoan_id: dinhKhoanPro.id,
                "note": `Hóa đơn bán ${phieu.code} ngày ${phieu.date}`,
                soChungTu: phieu.code,
                soChungTuLQ: lq,
                phieuKT: phieuKT,
                "tkNo": 133,
                "tkCo": sp.tk_doanh_thu,
                "date": convertDateFormat(phieu.date),
                "soTien": item.tien + item.thue,
                card_id: idCard,
                step_id: idStep,
                phieu_lq: phieu.phieu_lq,
                hopDong: item.hopDong,
                "show": true
            });
        })
        setLoadData(!loadData);
    }
    function convertDateFormat(dateStr) {
        if (!dateStr) return null
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    }

    return (
        <>
            <div className={css.phieuDetail}>
                <h3 className={css.maPhieu}>{phieu.code || `HD${phieu.id}`}</h3>
                <div className={css.infoContainer}>
                    <div className={css.infoItem}>
                        <div className={css.infoLabel}>
                            Khách hàng:
                        </div>
                        <div className={css.infoValue}>
                            {khachHang?.code} | {khachHang?.name}
                        </div>
                    </div>
                    <div className={css.infoItem}>
                        <div className={css.infoLabel}>
                            Phiếu xuất:
                        </div>
                        <div className={css.infoValue}>
                            {phieu?.pxs?.map((item, index) => (
                                // <span
                                //     key={item.id}>{item.code || `PX${item.id}`}{index < phieu.list_id_phieu_xuat.length - 1 && ', '}</span>
                                <button className={'btn-view-phieu'} onClick={()=> setSelectedPhieuLQ(item.code)}>{item.code}</button>
                            ))}

                        </div>
                    </div>

                    <div className={css.infoItem}>
                        <div className={css.infoLabel}>
                            Phương thức thanh toán:
                        </div>
                        <div className={css.infoValue}>
                            {phieu?.hinh_thuc_tt}
                        </div>
                    </div>
                    <div className={css.infoItem}>
                        <div className={css.infoLabel}>
                            Ngày hóa đơn:
                        </div>
                        <div className={css.infoValue}>
                            {(phieu?.date)}
                        </div>
                    </div>
                    <div className={css.infoItem2}>
                        <div className={css.infoLabel}>
                            Mẫu số:
                        </div>
                        <div className={css.infoValue}>
                            {phieu?.mau_so}
                        </div>
                    </div>
                    <div className={css.infoItem2}>
                        <div className={css.infoLabel}>
                            Kí hiệu hóa đơn :
                        </div>
                        <div className={css.infoValue}>
                            {phieu?.ky_hieu_hd}
                        </div>
                    </div>
                    <div className={css.infoItem2}>
                        <div className={css.infoLabel}>
                            Ghi chú:
                        </div>
                        <div className={css.infoValue}>
                            {phieu?.note}
                            {phieu?.trang_thai}
                        </div>
                    </div>
                    {phieu?.phieu_lq &&
                        <div className={css.infoItem}>
                            <div className={css.infoLabel}>
                                Phiếu liên quan
                            </div>
                            <div className={css.infoValue}>
                                {phieu.phieu_lq.map(ph => (
                                    <button className={'btn-view-phieu'} onClick={()=> setSelectedPhieuLQ(ph)}>{ph}</button>
                                ))}
                            </div>
                            {selectedPhieuLQ && <PhieuLQView selectedPhieuLQ={selectedPhieuLQ} setSelectedPhieuLQ={setSelectedPhieuLQ}/> }
                        </div>
                    }
                </div>
                <div style={{ width: '100%', display: "block" }}>
                    <Table
                        dataSource={matchedItems?.length > 0 ? matchedItems : []}
                        columns={columns}
                        pagination={false}
                    />
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        justifyContent: "right",
                        marginTop: '15px'
                    }}>
                        <ConfigProvider>
                            {phieu.trang_thai !== 'Chờ' &&
                                <Button
                                    type="primary"
                                    style={{
                                        backgroundColor: '#C7C7C7',
                                        color: '#262626',
                                        fontWeight: 450
                                    }}
                                    onClick={() => {
                                        handleDuyet();
                                    }}
                                >
                                    Duyệt phiếu
                                </Button>}
                            {phieu.trang_thai == 'Chờ' &&
                                <Button
                                    type="primary"
                                    style={{
                                        color: '#262626',
                                        fontWeight: 450
                                    }}
                                    disabled={phieu.trang_thai == 'Chờ'}
                                >
                                    Đã duyệt
                                </Button>
                            }

                        </ConfigProvider>
                    </div>
                </div>
            </div>
        </>)
}
