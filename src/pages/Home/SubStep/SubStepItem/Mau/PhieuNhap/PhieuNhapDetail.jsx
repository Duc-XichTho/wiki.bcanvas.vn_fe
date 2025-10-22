import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {Button, ConfigProvider, Table} from "antd";
import {getAllPhieuXuat, updatePhieuXuat} from "../../../../../../apis/phieuXuatService.jsx";
import {DONE, PENDING} from "../../../../../../Consts/STEP_STATUS.js";
import {SB, SL} from "../../../../../../Consts/LIST_STEP_TYPE.js";
import {createNewDinhKhoanProData} from "../../../../../../apis/dinhKhoanProDataService.jsx";
import {getSubStepDKIdInCardByType} from "../../../../../../generalFunction/logicMau/logicMau.js";
import {createDataDK, createDataDK_SL} from "../../../../formCreate/GomPhieu/logicGom.js";
import {getDinhKhoanProDataByStepId} from "../../../../../../apis/dinhKhoanProService.jsx";
import {getAllCard} from "../../../../../../apis/cardService.jsx";
import {formatDateISO, formatDateToDDMMYYYY} from "../../../../../../generalFunction/format.js";
import {getAllPhieuNhap, updatePhieuNhap} from "../../../../../../apis/phieuNhapService.jsx";
import {updateCard} from "../../../../../../apis/cardService.jsx";
import {CODE_PKT, genCode} from "../../../../../../generalFunction/genCode/genCode.js";
import {
    getAllDeNghiThanhToan,
    getDeNghiThanhToanByCardId,
    getDeNghiThanhToanDataById
} from "../../../../../../apis/deNghiThanhToanService.jsx";
import PopUpUploadFile from "../../../../../../components/UploadFile/PopUpUploadFile.jsx";
import PhieuLQView from "../PhieuLQView.jsx";

export function PhieuNhapDetail({phieu: initialPhieu, gom, fetchPhieuNhap}) {
    const {idCard, idStep} = useParams();
    const {
        loadData,
        setLoadData,
        chainTemplate2Selected,
        setChainTemplate2Selected,
        currentYear
    } = useContext(MyContext);
    let phieuKT = genCode(CODE_PKT, idCard, currentYear)
    const [phieu, setPhieu] = useState(initialPhieu);
    const [card, setCard] = useState([]);
    const [selectedPhieuLQ, setSelectedPhieuLQ] = useState(null);

    function fetchCard() {
        getAllCard().then(data => {
            setCard(data.find(item => item.id == idCard))
        })
    }

    const columns = [

        {
            title: 'Hàng hóa',
            dataIndex: 'hh_full',
            key: 'hh_full',
        },
        {
            title: 'Nhà cung cấp',
            dataIndex: 'nha_cung_cap',
            key: 'nha_cung_cap',
            render: (ncc) => `${ncc?.code} | ${ncc?.name}`,
        },
        {
            title: 'Kho',
            dataIndex: 'kho',
            key: 'kho',
            render: (kho) => `${kho?.code} | ${kho?.name}`,
        },
        {
            title: 'Lô',
            dataIndex: 'lo',
            key: 'lo',
            render: (lo) => `${lo?.code} | ${lo?.name || ''}`,
        },
        {
            title: 'Số lượng',
            dataIndex: 'so_luong',
            key: 'so_luong',
        },
        {
            title: 'Giá nhập',
            dataIndex: 'gia_nhap',
            key: 'gia_nhap',
        },
        {
            title: 'Đính kèm',
            dataIndex: 'dinh_kem',
            key: 'dinh_kem',
            width: 200,
            render: (value, record, index) => {

                return (
                    <PopUpUploadFile
                        id={record?.id}
                        table={`card_PNK_${idCard}`}
                        onGridReady={() => setLoadData(!loadData)}
                        card={idCard}
                    />
                )
            }
        },
    ];

    useEffect(() => {
        if (initialPhieu.id_DNTT) {
            getDeNghiThanhToanByCardId('P' + initialPhieu.id_DNTT).then((dntt) => {
                initialPhieu.dntt = dntt[0];
                setPhieu(initialPhieu)
            })
        } else {
            setPhieu(initialPhieu);
        }
    }, [initialPhieu]);

    useEffect(() => {
        fetchCard();
    }, []);

    const handleDuyet = async () => {
        try {
            const dataUpdate = {
                ...phieu,
                trang_thai: 'done'
            }
            await updatePhieuNhap(dataUpdate)
            fetchPhieuNhap()

            let idSSDK = getSubStepDKIdInCardByType(card, SL);
            let dntts = await getAllDeNghiThanhToan(phieu.id_DNTT)
            let dntt = dntts.find(e => e.id == phieu.id_DNTT)
            const dinhKhoanPro = await getDinhKhoanProDataByStepId(idSSDK, idCard);
            if (dinhKhoanPro) {
                let dks = createDataDK_SL(phieu.danh_sach_hang_hoa);
                dks.map(async item => {
                    const newRowData = {
                        dinhKhoan_id: dinhKhoanPro.id,
                        "date": phieu.ngay,
                        "note": 'Phiếu nhập kho ' + phieu.code,
                        soChungTu: phieu.code,
                        soChungTuLQ: dntt?.code || '',
                        phieuKT: phieuKT,
                        "tkNo": 155,
                        "tkCo": 3311,
                        "soTien": item.soTien,
                        "sanPham": item.sanPham,
                        card_id: idCard,
                        step_id: idStep,
                        phieu_lq: phieu.phieu_lq,
                        "show": true

                    };
                    await createNewDinhKhoanProData(newRowData);
                })
            }

            setLoadData(!loadData);

        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className={css.phieuDetail}>
            <h3 className={css.maPhieu}>{gom ? phieu.gom : `${phieu.code}`}</h3>
            <div className={css.infoContainer}>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Đề nghị thanh toán: </div>
                    <div className={css.infoValue}>
                        <button onClick={() => {
                            setSelectedPhieuLQ(phieu?.dntt?.code)
                        }}>{phieu?.dntt?.code}</button>
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Nhân viên:</div>
                    <div className={css.infoValue}>
                        {phieu?.nhan_vien?.code} | {phieu?.nhan_vien?.name}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Nhóm hang hóa:</div>
                    <div className={css.infoValue}>
                        {phieu?.nhom_hang_hoa}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Ngày nhập:</div>
                    <div className={css.infoValue}>{formatDateISO(phieu?.ngay)}</div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Lệnh sản xuất:</div>
                    <div className={css.infoValue}>{phieu?.lenh_san_xuat?.code}</div>
                </div>
                {phieu?.phieu_lq &&
                    <div className={css.infoItem}>
                        <div className={css.infoLabel}>
                            Phiếu liên quan
                        </div>
                        <div className={css.infoValue}>
                            {phieu.phieu_lq.map(ph => (
                                <button className={'btn-view-phieu'} onClick={() => setSelectedPhieuLQ(ph)}>{ph}</button>
                            ))}
                        </div>
                        {selectedPhieuLQ &&
                            <PhieuLQView selectedPhieuLQ={selectedPhieuLQ} setSelectedPhieuLQ={setSelectedPhieuLQ}/>}
                    </div>
                }
            </div>
            <div style={{width: '100%', display: 'block'}}>
                <Table
                    dataSource={phieu.danh_sach_hang_hoa?.length > 0 ? phieu.danh_sach_hang_hoa : []}
                    columns={columns}
                    pagination={false}
                />
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        justifyContent: 'right',
                        marginTop: '15px',
                    }}
                >
                    <ConfigProvider>
                        <Button
                            type={phieu.trang_thai === null ? 'primary' : 'default'}
                            onClick={() => handleDuyet()}
                            disabled={phieu.trang_thai === null ? false : true}
                        >
                            {phieu.trang_thai === null ? 'Duyệt phiếu' : 'Đã duyệt'}
                        </Button>
                    </ConfigProvider>
                </div>
            </div>
        </div>
    );
}
