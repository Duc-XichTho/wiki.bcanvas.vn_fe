import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {formatDateISO, formatMoney} from "../../../../../../generalFunction/format.js";
import {Button, ConfigProvider, message, Table} from "antd";
import {getDetailPhieuGiaoHangByPhieuGiaoHangIdService} from "../../../../../../apis/detailPhieuGiaoHangService.jsx";
import {getHoaDonByCardId} from "../../../../../../apis/hoaDonService.jsx";
import {Tag} from 'antd';
import {DONE, PENDING} from "../../../../../../Consts/STEP_STATUS.js";
import {getAllPhieuThu, updatePhieuThu} from "../../../../../../apis/phieuThuService.jsx";
import {getSubStepDKIdInCardByType} from "../../../../../../generalFunction/logicMau/logicMau.js";
import {SE, SH, SN} from "../../../../../../Consts/LIST_STEP_TYPE.js";
import {getDinhKhoanProDataByStepId} from "../../../../../../apis/dinhKhoanProService.jsx";
import {createNewDinhKhoanProData} from "../../../../../../apis/dinhKhoanProDataService.jsx";
import {getAllCard} from "../../../../../../apis/cardService.jsx";
import {getAllPhieuChi2, updatePhieuChi2} from "../../../../../../apis/phieuChi2Service.jsx";
import {updatePhieuChi} from "../../../../../../apis/phieuChiService.jsx";
import {getNhanVienDataById} from "../../../../../../apis/nhanVienService.jsx";
import {LIST_LOAI_PHIEU_CHI} from "../../../../../../Consts/LIST_LOAI_PHIEU.js";

import {updateCard} from "../../../../../../apis/cardService.jsx";
import {updateCardDetails} from '../cardUtils.js'
import {CODE_PKT, genCode} from "../../../../../../generalFunction/genCode/genCode.js";
import PopUpUploadFile from "../../../../../../components/UploadFile/PopUpUploadFile.jsx";
import PhieuLQView from "../PhieuLQView.jsx";

export function PhieuChiDetail({phieu: initialPhieu, dataTamUng, dataDeNghi, ptc}) {
    const {idCard, idStep} = useParams();
    const {
        loadData,
        setLoadData,
        chainTemplate2Selected,
        setChainTemplate2Selected,
        currentYear
    } = useContext(MyContext);
    let phieuKT = genCode(CODE_PKT, idCard, currentYear)
    const [dataDetail, setDataDetail] = useState([]);
    const [card, setCard] = useState([]);
    const [phieu, setPhieu] = useState(initialPhieu);
    const [selectedPhieuLQ, setSelectedPhieuLQ] = useState(null);

    function fetchCard() {
        getAllCard().then(data => {
            setCard(data.find(item => item.id == idCard))
        })
    }

    useEffect(() => {
        setPhieu(initialPhieu);
    }, [initialPhieu]);


    useEffect(() => {
        fetchCard()
    }, [])

    const phieuTamUngs = dataTamUng?.filter(item => phieu?.tam_ung_lien_quan?.includes(item.id));
    const phieuDeNghis = dataDeNghi?.filter(item => phieu?.de_nghi_lien_quan?.includes(item.id));

    useEffect(() => {
        setDataDetail(phieu?.chi_tiet_phieu_chi)
    }, [phieu]);

    const columns = [
        {
            title: 'Code',
            dataIndex: 'code_hang_hoa',
            key: 'code_hang_hoa',
        },
        {
            title: 'Tên hàng hóa',
            dataIndex: 'name_hang_hoa',
            key: 'name_hang_hoa',
        },
        {
            title: 'Số lượng',
            dataIndex: 'so_luong',
            key: 'so_luong',
        },

        {
            title: 'Giá bán',
            dataIndex: 'gia_ban',
            key: 'gia_ban',
            render: (value) => {
                return parseInt(value).toLocaleString('en-US') || 0
            }
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'tong_tien',
            key: 'tong_tien',
            render: (value) => {
                return parseInt(value).toLocaleString('en-US') || 0
            }
        },
        {
            title: 'Đính kèm',
            dataIndex: 'dinh_kem',
            key: 'dinh_kem',
            width: 200,
            render: (value, record, index) => {
                return (
                    <PopUpUploadFile
                        id={record?.id_hang_hoa}
                        table={`card_PC_${idCard}`}
                        onGridReady={() => setLoadData(!loadData)}
                        card={idCard}
                    />
                )
            }
        },

    ];

    async function handleChangeStatus(status) {
        let data = await getAllPhieuChi2()
        let pc = data.find((item) => item.id == phieu.id);

        if (pc) {
            await updatePhieuChi2(pc.id, {...pc, trang_thai: status})
            setPhieu((prevPhieu) => ({
                ...prevPhieu,
                trang_thai: status,
            }));

            if (status === PENDING) {

                await updateCardDetails(idCard, pc.created_at, pc.so_tien, pc.ly_do)
                setChainTemplate2Selected({
                    type: 'chain2',
                    data: {
                        ...chainTemplate2Selected.data,
                        selectedTemplate: {
                            ...chainTemplate2Selected.data.selectedTemplate,
                            cards: chainTemplate2Selected.data.selectedTemplate.cards.map((item) => item.id == idCard ? {
                                ...item,
                                mo_ta: pc.created_at,
                                so_tien: pc.so_tien,
                                mo_ta2: pc.ly_do,
                            } : item)
                        }
                    }
                })
                message.success("Đã xác nhận");

            }

            if (status === DONE) {
                let idSSDK = getSubStepDKIdInCardByType(card, SH);
                if (ptc) idSSDK = getSubStepDKIdInCardByType(card, SN);
                const dinhKhoanPro = await getDinhKhoanProDataByStepId(idSSDK, idCard);

                let lq = '';
                phieuTamUngs.map(item => {
                    lq = item?.code + ','
                })
                phieuDeNghis.map(item => {
                    lq = item?.code + ','
                })
                if (dinhKhoanPro) {
                    let nv = null
                    if (phieu.id_nhan_vien) {
                        nv = await getNhanVienDataById(phieu.id_nhan_vien)
                    }
                    if (phieu.type == 'UN_CHI') {
                        const newRowData = {
                            dinhKhoan_id: dinhKhoanPro.id,
                            "date": new Date(),
                            "note": 'Ủy nhiệm chi ' + phieu.code + ' - ' + (phieu.ly_do || ''),
                            "tkNo": 3311,
                            "tkCo": 1121,
                            "soTien": phieu.so_tien,
                            card_id: idCard,
                            step_id: idStep,
                            soChungTu: phieu.code,
                            soChungTuLQ: lq,
                            phieuKT: phieuKT,
                            phieu_thu_chi: phieu.code,
                            phieu_lq: phieu.phieu_lq,
                            "show": true
                        };
                        await createNewDinhKhoanProData(newRowData);
                    } else {
                        const newRowData = {
                            dinhKhoan_id: dinhKhoanPro.id,
                            "date": new Date(),
                            "note": 'Phiếu Chi ' + phieu.code + ' - ' + (phieu.ly_do || ''),
                            "tkNo": 3311,
                            "tkCo": 1111,
                            "soTien": phieu.so_tien,
                            card_id: idCard,
                            step_id: idStep,
                            soChungTu: phieu.code,
                            soChungTuLQ: lq,
                            phieuKT: phieuKT,
                            phieu_thu_chi: phieu.code,
                            phieu_lq: phieu.phieu_lq,
                            "show": true
                        };
                        await createNewDinhKhoanProData(newRowData);
                    }
                }
            }

            setLoadData(!loadData);
        }

    }

    const dataSource = dataDetail.map((item, index) => ({
        ...item,
        key: item.id || index,
    }));

    const renderDanhSachPhieu = (title, data, prefix) => {
        if (!data || data.length === 0) return null;
        return (
            <div className={css.infoItem}>
                <div className={css.infoLabel}>{title}</div>
                {data.map((item) => (
                        <button className={'btn-view-phieu'} onClick={() => setSelectedPhieuLQ(item.code)}>{item.code}</button>
                ))}
            </div>
        );
    };

    return (<>
        <div className={css.phieuDetail}>
            <h3 className={css.maPhieu}>{phieu?.code}</h3>
            <div className={css.infoContainer}>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Kiểu phiếu
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.type?.length > 0 ? LIST_LOAI_PHIEU_CHI.map(e => {
                            if (e.code == phieu?.type) {
                                return e.label
                            }
                        }) : 'Phiếu chi'}
                    </div>
                </div>
                {renderDanhSachPhieu("Danh sách phiếu tạm ứng", phieuTamUngs, "TU")}
                {renderDanhSachPhieu("Danh sách phiếu đề nghị thanh toán", phieuDeNghis, "DNTT")}
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Nhân viên
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.nhan_vien?.code} - {phieu?.nhan_vien?.name}
                    </div>
                </div>

                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Ngày chi
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.ngay_chi}
                    </div>
                </div>
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Tên chủ tài khoản
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.ten_chu_tai_khoan}
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
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Tài khoản nhận tiền
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.tai_khoan_nhan_tien}
                    </div>
                </div>
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Thanh toán công nợ
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.thanh_toan_cong_no}
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
            <div style={{width: '100%', display: "block"}}>
                <Table
                    bordered
                    dataSource={dataSource?.length > 0 ? dataSource : []}
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
                        {/*<Button*/}
                        {/*    type="primary"*/}
                        {/*    style={{*/}
                        {/*        backgroundColor: '#FFA862',*/}
                        {/*        color: '#262626',*/}
                        {/*        fontWeight: 450,*/}
                        {/*    }}*/}
                        {/*    onClick={() => {*/}
                        {/*        handleChangeStatus(PENDING);*/}
                        {/*    }}*/}
                        {/*    disabled={phieu.trang_thai === PENDING || phieu.trang_thai === DONE}*/}
                        {/*>*/}
                        {/*    {(phieu.trang_thai === PENDING || phieu.trang_thai === DONE) && (*/}
                        {/*        <>Đã xác nhận</>*/}
                        {/*    )}*/}
                        {/*    {!phieu.trang_thai && <>Xác nhận phiếu </>}*/}
                        {/*</Button>*/}
                        <Button
                            type="primary"
                            style={{
                                backgroundColor: '#FFA862',
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

                        </Button>
                    </ConfigProvider>
                </div>
            </div>
        </div>


    </>)
}
