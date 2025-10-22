import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {formatDateISO, formatMoney} from "../../../../../../generalFunction/format.js";
import {Table, Button, ConfigProvider} from "antd";
import {updateDeNghiThanhToan} from "../../../../../../apis/deNghiThanhToanService.jsx";
import {updateCard} from "../../../../../../apis/cardService.jsx";
import PopUpUploadFile from "../../../../../../components/UploadFile/PopUpUploadFile.jsx";
import PhieuLQView from "../PhieuLQView.jsx";
import {getAllHoaDon, getHoaDonById2} from "../../../../../../apis/hoaDonService.jsx";
import {getAllHopDong, getHopDongDataById} from "../../../../../../apis/hopDongService.jsx";

export function DNTTDetail({phieu, fetchPhieuThus, phieuGom = false}) {
    const {idCard} = useParams();
    let table = 'DeNghiThanhToan';
    const {chainTemplate2Selected, setChainTemplate2Selected} = useContext(MyContext);
    const [ selectedPhieuLQ, setSelectedPhieuLQ ] = useState(null);
    const [dataDetail, setDataDetail] = useState([]);

    async function loadDSHH() {
        phieu.list_hd = []
        if (phieu && phieu.danh_sach_hang_hoa) {
            for (const hh of phieu.danh_sach_hang_hoa) {
                if (hh.hoaDon) {
                    let hoaDon = await getHoaDonById2(hh.hoaDon);
                    hh.codeHoaDon = hoaDon?.code;
                }
                if (hh.hopDong) {
                    let hopDong = await getHopDongDataById(hh.hopDong);
                    hh.codeHopDong = hopDong?.code;
                }
            }
        }
        setDataDetail(phieu?.danh_sach_hang_hoa)
    }

    useEffect(() => {
        loadDSHH().then()
    }, [phieu]);

    const columns = [
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
            width: 100
        },
        {
            title: 'Tên hàng hóa',
            dataIndex: 'name',
            key: 'name',
            width: 200
        },
        {
            title: 'KMF',
            dataIndex: 'kmf_name',
            key: 'kmf_name',
            width: 200
        },
        {
            title: 'Bộ phận sử dụng',
            dataIndex: 'bu_name',
            key: 'bu_name',
            width: 200
        },
        {
            title: 'KMTC',
            dataIndex: 'kmns_name',
            key: 'kmns_name',
            width: 200
        },
        {
            title: 'Đơn vị tính',
            dataIndex: 'dvt',
            key: 'dvt',
            width: 200
        },
        {
            title: 'Số lượng',
            dataIndex: 'so_luong',
            key: 'so_luong',
            width: 100
        },
        {
            title: 'Đơn giá',
            dataIndex: 'don_gia',
            key: 'don_gia',
            width: 100,
            render: (value) => {
                return parseInt(value).toLocaleString('en-US') || 0
            }
        },
        {
            title: 'Thuế',
            dataIndex: 'thue',
            key: 'thue',
            width: 100
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'tong_tien',
            key: 'tong_tien',
            width: 100,
            render: (value) => {
                return parseInt(value).toLocaleString('en-US') || 0
            }
        },
        {
            title: 'Hoá đơn',
            dataIndex: 'codeHoaDon',
            key: 'codeHoaDon',
            width: 100,
            render: (value, record, index) => {
                if (!value) return null;
                return (
                    <button className={'btn-view-phieu'} onClick={()=> setSelectedPhieuLQ(value)}>{value}</button>
                )
            }
        },
        {
            title: 'Hợp đồng',
            dataIndex: 'codeHopDong',
            key: 'codeHopDong',
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
                        table={`card_DNTT_${idCard}`}
                        onGridReady={() => setLoadData(!loadData)}
                        card={idCard}
                    />
                )
            }
        },
    ];

    const handleDuyet = async () => {
        try {
            const dataUpdate = {
                ...phieu,
                trang_thai: true
            }
            await updateDeNghiThanhToan(dataUpdate)
            fetchPhieuThus()
            await updateCard({id: idCard, trang_thai: 'Hoàn thành'})
            setChainTemplate2Selected({
                type: 'chain2',
                data: {
                    ...chainTemplate2Selected.data,
                    selectedTemplate: {
                        ...chainTemplate2Selected.data.selectedTemplate,
                        cards: chainTemplate2Selected.data.selectedTemplate.cards.map((item) => item.id == idCard ? {
                            ...item,
                            trang_thai: 'Hoàn thành'
                        } : item)
                    }
                }
            })
        } catch (error) {

        }
    }

    return (<>
        <div className={css.phieuDetail}>
            <h3 className={css.maPhieu}>{phieu?.code}</h3>
            <div className={css.infoContainer}>
                {/*<div className={css.infoItem}>*/}
                {/*<div className={css.infoLabel}>*/}
                {/*    Số phiếu:*/}
                {/*</div>*/}
                {/*<div className={css.infoValue}>*/}
                {/*    {phieu?.code}*/}
                {/*</div>*/}
                {/*</div>*/}
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Ngày dự kiến thanh toán:
                    </div>
                    <div className={css.infoValue}>
                        {formatDateISO(phieu?.ngay_du_kien_thanh_toan)}
                    </div>
                </div>
                {phieu?.de_nghi_mua?.code2 &&
                    <div className={css.infoItem2}>
                        <div className={css.infoLabel}>
                            Đề nghị mua
                        </div>
                        <div className={css.infoValue}>
                            <button className={'btn-view-phieu'}
                                onClick={() => setSelectedPhieuLQ(phieu?.de_nghi_mua?.code2)}>{phieu?.de_nghi_mua?.code2}</button>
                        </div>
                    </div>}
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Tạm ứng
                    </div>
                    <div className={css.infoValue}>
                        {
                            phieu?.tam_ung?.code &&
                            <button className={'btn-view-phieu'} onClick={() => setSelectedPhieuLQ(phieu?.tam_ung?.code)}>{phieu?.tam_ung?.code}</button>
                        }
                    </div>
                </div>
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Nhân viên
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.nhan_vien?.name}
                    </div>
                </div>
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Tài khoản nhận tiền
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.tk_nhan_tien}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Bộ phận
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.bo_phan?.name}
                    </div>
                </div>
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Mô tả
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.mo_ta}
                    </div>
                </div>
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Tổng tiền
                    </div>
                    <div className={css.infoValue}>
                        {formatMoney(phieu?.tong_tien)}
                    </div>
                </div>
                <div className={css.infoItem2}>
                    <div className={css.infoLabel}>
                        Đính kèm
                    </div>
                    <div style={{width: '180px', padding:'5px'}}>
                        <PopUpUploadFile
                            id={`DNTT_${idCard}`}
                            table={table}
                            onGridReady={() => setLoadData(!loadData)}
                            card={idCard}
                        />
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
            <div style={{width: '100%', display: "block"}}>
                <Table
                    bordered
                    dataSource={dataDetail?.length > 0 ? dataDetail : []}
                    columns={columns}
                    scroll={{x: 'max-content'}}
                    pagination={false}
                />
            </div>
            {!phieuGom && (
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
            )}
        </div>


    </>)
}
