import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {formatCurrency, formatDateISO, formatMoney} from "../../../../../../generalFunction/format.js";
import {Button, ConfigProvider, Table} from "antd";
import {DONE, PENDING} from "../../../../../../Consts/STEP_STATUS.js";
import {getSubStepDKIdInCardByType} from "../../../../../../generalFunction/logicMau/logicMau.js";
import {SE, SN} from "../../../../../../Consts/LIST_STEP_TYPE.js";
import {getDinhKhoanProDataByStepId} from "../../../../../../apis/dinhKhoanProService.jsx";
import {createNewDinhKhoanProData} from "../../../../../../apis/dinhKhoanProDataService.jsx";
import {getAllCard} from "../../../../../../apis/cardService.jsx";
import {getAllPhieuThu, updatePhieuThu} from "../../../../../../apis/phieuThuService.jsx";
import {LIST_LOAI_PHIEU_CHI, LIST_LOAI_PHIEU_THU} from "../../../../../../Consts/LIST_LOAI_PHIEU.js";
import {updateCard} from "../../../../../../apis/cardService.jsx";
import {CODE_PKT, genCode} from "../../../../../../generalFunction/genCode/genCode.js";
import PopUpUploadFile from "../../../../../../components/UploadFile/PopUpUploadFile.jsx";
import PhieuLQView from "../PhieuLQView.jsx";

export function PhieuThuDetail({phieu: initialPhieu, ptc, fetchPhieuThus}) {
    const {idCard, idStep} = useParams();
    const {
        loadData,
        setLoadData,
        chainTemplate2Selected,
        setChainTemplate2Selected,
        currentYear
    } = useContext(MyContext);
    let phieuKT = genCode(CODE_PKT, idCard, currentYear)
    const [selected, setSelected] = useState(null);
    const [dataDetail, setDataDetail] = useState([]);
    const [phieu, setPhieu] = useState(initialPhieu);
    const [card, setCard] = useState([]);
    const [ selectedPhieuLQ, setSelectedPhieuLQ ] = useState(null);

    function fetchCard() {
        getAllCard().then(data => {
            setCard(data.find(item => item.id == idCard))
        })
    }

    useEffect(() => {
        fetchCard()
    }, [])
    useEffect(() => {
        setPhieu(initialPhieu);
    }, [initialPhieu]);

    const columns = [
        {
            title: 'Code',
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
            dataIndex: 'so_luong',
            key: 'so_luong',
        },

        {
            title: 'Chiết khấu',
            dataIndex: 'chiet_khau',
            key: 'chiet_khau',
        },

        {
            title: 'Đơn giá',
            dataIndex: 'don_gia',
            key: 'don_gia',
            render: value => (formatCurrency(value))
        },

        {
            title: 'Tổng tiền',
            dataIndex: 'tong_tien',
            key: 'tong_tien',
            render: value => (formatCurrency(value))
        },

        {
            title: 'Thuế GTGT',
            dataIndex: 'thue_gtgt',
            key: 'thue_gtgt',
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
                        table={`card_PT_${idCard}`}
                        onGridReady={() => setLoadData(!loadData)}
                        card={idCard}
                    />
                )
            }
        },
    ];

    async function handleChangeStatus(status) {
        let data = await getAllPhieuThu()
        let px = data.find((item) => item.id == phieu.id_phieu_thu);
        if (px) {
            await updatePhieuThu({...px, trang_thai: status})
            setPhieu((prevPhieu) => ({
                ...prevPhieu,
                trang_thai: status,
            }));
            if (status === DONE) {
                let idSSDK = getSubStepDKIdInCardByType(card, SE);
                if (ptc) idSSDK = getSubStepDKIdInCardByType(card, SN);
                const dinhKhoanPro = await getDinhKhoanProDataByStepId(idSSDK, idCard);
                if (dinhKhoanPro) {
                    if (px.type == 'BAO_NO') {
                        const newRowData = {
                            dinhKhoan_id: dinhKhoanPro.id,
                            "date": new Date(),
                            "note": 'Phiếu báo có ' + px.code + ' - ' + px.ly_do,
                            "tkNo": 1121,
                            "tkCo": 1311,
                            "soTien": phieu.so_tien,
                            card_id: idCard,
                            step_id: idStep,
                            soChungTu: px.code,
                            phieu_thu_chi: px.code,
                            phieu_lq: px.phieu_lq,
                            "show": true,
                        };
                        await createNewDinhKhoanProData(newRowData);
                    } else {
                        const newRowData = {
                            dinhKhoan_id: dinhKhoanPro.id,
                            "date": new Date(),
                            "note": 'Phiếu thu ' + px.code + ' - ' + px.ly_do,
                            "tkNo": 1111,
                            "tkCo": 1311,
                            "soTien": phieu.so_tien,
                            card_id: idCard,
                            step_id: idStep,
                            soChungTu: px.code,
                            phieu_thu_chi: px.code,
                            phieu_lq: px.phieu_lq,
                            "show": true
                        };
                        await createNewDinhKhoanProData(newRowData);
                    }
                }

            }

            setLoadData(!loadData);
        }
    }

    const handleDuyet = async () => {
        try {
            let data = await getAllPhieuThu()
            let phieuThu = data.find((item) => item.id == phieu.id_phieu_thu);

            const dataUpdate = {
                ...phieuThu,
                trang_thai: 'done'
            }

            await updatePhieuThu(dataUpdate)
            fetchPhieuThus()

            let idSSDK = getSubStepDKIdInCardByType(card, SE);
            if (ptc) idSSDK = getSubStepDKIdInCardByType(card, SN);
            const dinhKhoanPro = await getDinhKhoanProDataByStepId(idSSDK, idCard);
            let lq = '';
            phieu.id_hoa_don.map(item => {
                lq = item?.code + ','
            })
            if (dinhKhoanPro) {
                if (phieuThu.type == 'BAO_NO') {
                    const newRowData = {
                        dinhKhoan_id: dinhKhoanPro.id,
                        "date": new Date(),
                        "note": 'Phiếu báo có ' + phieuThu.code + ' - ' + (phieuThu.ly_do || ''),
                        "tkNo": 1121,
                        "tkCo": 1311,
                        "soTien": phieu.so_tien,
                        card_id: idCard,
                        step_id: idStep,
                        soChungTu: phieuThu.code,
                        soChungTuLQ: lq,
                        phieuKT: phieuKT,
                        phieu_thu_chi: phieuThu.code,
                        phieu_lq: phieuThu.phieu_lq,
                        "show": true
                    };
                    await createNewDinhKhoanProData(newRowData);
                } else {
                    const newRowData = {
                        dinhKhoan_id: dinhKhoanPro.id,
                        "date": new Date(),
                        "note": 'Phiếu thu ' + phieuThu.code + ' - ' + (phieuThu.ly_do || ''),
                        "tkNo": 1111,
                        "tkCo": 1311,
                        "soTien": phieu.so_tien,
                        card_id: idCard,
                        step_id: idStep,
                        soChungTu: phieuThu.code,
                        soChungTuLQ: lq,
                        phieuKT: phieuKT,
                        phieu_thu_chi: phieuThu.code,
                        phieu_lq: phieuThu.phieu_lq,
                        "show": true
                    };
                    await createNewDinhKhoanProData(newRowData);
                }
            }

            setLoadData(!loadData);

        } catch (error) {
            console.log(error)
        }
    }


    return (<>
        <div className={css.phieuDetail}>
            <h3 className={css.maPhieu}>{phieu?.code}</h3>
            <div className={css.infoContainer}>
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Kiểu phiếu
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.type?.length > 0 ? LIST_LOAI_PHIEU_THU.map(e => {
                            if (e.code == phieu?.type) {
                                return e.label
                            }
                        }) : 'Phiếu thu'}
                    </div>
                </div>
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Hóa đơn
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.id_hoa_don?.map((item, index) => (
                            <button className={'btn-view-phieu'} onClick={()=> setSelectedPhieuLQ(item.code)}>{item.code}</button>
                        ))}
                    </div>
                </div>
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Ngày thu
                    </div>
                    <div className={css.infoValue}>
                        {formatDateISO(phieu?.ngay_thu)}
                    </div>
                </div>
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Hình thức
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.hinh_thuc}
                    </div>
                </div>
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Người chuyển tiền
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.nguoi_chuyen_tien}
                    </div>
                </div>
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Số tiền
                    </div>
                    <div className={css.infoValue}>
                        {formatMoney(phieu?.so_tien)}
                    </div>
                </div>

                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Thu công nợ
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.thu_cong_no}
                    </div>
                </div>
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Lý do
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.ly_do}
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
                        {/* <Button
                            type={phieu.trang_thai === PENDING || phieu.trang_thai === DONE ? 'text' : 'primary'}
                            style={{
                                backgroundColor: phieu.trang_thai === PENDING || phieu.trang_thai === DONE ? 'none' : '#FFA862',
                                color: '#262626',
                                fontWeight: 450,
                            }}
                            onClick={() => {
                                handleChangeStatus(PENDING);
                            }}
                            disabled={phieu.trang_thai === PENDING || phieu.trang_thai === DONE}
                        >
                            {(phieu.trang_thai === PENDING || phieu.trang_thai === DONE) && (
                                <>Đã xác nhận</>
                            )}
                            {!phieu.trang_thai && <>Xác nhận phiếu</>}
                        </Button>
                        <Button
                            type="primary"
                            style={{
                                backgroundColor: '#C7C7C7',
                                color: '#262626',
                                fontWeight: 450,
                            }}
                            onClick={() => {
                                handleChangeStatus(DONE);
                            }}
                            disabled={phieu.trang_thai !== PENDING}
                        >
                            {(phieu.trang_thai === DONE) && (
                                <>Đã duyệt</>
                            )}
                            {phieu.trang_thai !== DONE && <>Duyệt phiếu</>}

                        </Button> */}
                        <Button
                            type={phieu.trang_thai !== 'done' ? 'primary' : 'default'}
                            onClick={() => handleDuyet()}
                            disabled={phieu.trang_thai !== 'done' ? false : true}
                        >
                            {phieu.trang_thai !== 'done' ? 'Duyệt phiếu' : 'Đã duyệt'}
                        </Button>
                    </ConfigProvider>
                </div>
            </div>
        </div>


    </>)
}
