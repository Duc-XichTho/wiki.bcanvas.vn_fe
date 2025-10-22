import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {formatDateISO} from "../../../../../../generalFunction/format.js";
import {Button, ConfigProvider, Table} from "antd";
import {updateTamUng} from "../../../../../../apis/tamUngService.jsx";
import {updateCard} from "../../../../../../apis/cardService.jsx";
import PopUpUploadFile from "../../../../../../components/UploadFile/PopUpUploadFile.jsx";
import PhieuLQView from "../PhieuLQView.jsx";

export function TamUngDetail({ phieu, fetchTamUng }) {
    const { idCard } = useParams();
    const [dataDetail, setDataDetail] = useState([]);
    const { chainTemplate2Selected, setChainTemplate2Selected } = useContext(MyContext);
    const [ selectedPhieuLQ, setSelectedPhieuLQ ] = useState(null);

    useEffect(() => {
        setDataDetail(phieu?.danh_sach_hang_hoa)
    }, [phieu]);


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
            title: 'Đơn vị tính',
            dataIndex: 'dvt',
            key: 'dvt',
        },
        {
            title: 'KMF',
            dataIndex: 'kmf_full',
            key: 'kmf_full',
        },
        {
            title: 'KMNS',
            dataIndex: 'kmns_full',
            key: 'kmns_full',
        },
        {
            title: 'Vụ việc',
            dataIndex: 'vuviec_full',
            key: 'vuviec_full',
        },
        {
            title: 'Bộ phận',
            dataIndex: 'bu_full',
            key: 'bu_full',
        },
        {
            title: 'Số lượng',
            dataIndex: 'so_luong',
            key: 'so_luong',
        },
        {
            title: 'Đơn giá',
            dataIndex: 'don_gia',
            key: 'don_gia',
            render: (value) => { return parseInt(value).toLocaleString('en-US') || 0 }
        },
        {
            title: 'Thuế',
            dataIndex: 'thue',
            key: 'thue',
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'tong_tien',
            key: 'tong_tien',
            render: (value) => { return parseInt(value).toLocaleString('en-US') || 0 }
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
                        table={`card_TU_${idCard}`}
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
            await updateTamUng(dataUpdate)
            fetchTamUng()
            await updateCard({ id: idCard, trang_thai: 'Hoàn thành' })
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
            console.log(error)
        }
    }

    return (<>
        <div className={css.phieuDetail}>
            <h3 className={css.maPhieu}>{phieu?.code}</h3>
            <div className={css.infoContainer}>
                {phieu?.de_nghi_mua &&
                    <div className={css.infoItem}>
                        <div className={css.infoLabel}>
                            Đề nghị mua
                        </div>
                        <div className={css.infoValue}>
                            <button className={'btn-view-phieu'} onClick={()=> setSelectedPhieuLQ(phieu?.de_nghi_mua?.code2)}>{phieu?.de_nghi_mua?.code2}</button>
                        </div>
                    </div>
                }
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
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Nhân viên
                    </div>
                    <div className={css.infoValue}>
                        {`${phieu?.nhan_vien?.code} | ${phieu?.nhan_vien?.name}`}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Bộ phận
                    </div>
                    <div className={css.infoValue}>
                        {`${phieu?.bo_phan?.code} | ${phieu?.bo_phan?.name}`}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Ngày dự kiến tạm ứng
                    </div>
                    <div className={css.infoValue}>
                        {formatDateISO(phieu?.ngay_du_kien_tam_ung)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Ngày dự kiến hoàn ứng
                    </div>
                    <div className={css.infoValue}>
                        {formatDateISO(phieu?.ngay_du_kien_hoan_ung)}
                    </div>
                </div>

                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Mô tả
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.mo_ta}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Tài khoản nhận tiền
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.tk_nhan_tien}
                    </div>
                </div>
            </div>
            <div style={{ width: '100%', overflow: "auto" }}>
                <Table
                    // dataSource={dataDetail?.length > 0 ? dataDetail : []}
                    dataSource={dataDetail?.map(item => ({ ...item, key: item.code }))}
                    columns={columns}
                    bordered
                    scroll={{ x: '200%' }}
                    pagination={false}
                />
            </div>
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
    </>)
}
