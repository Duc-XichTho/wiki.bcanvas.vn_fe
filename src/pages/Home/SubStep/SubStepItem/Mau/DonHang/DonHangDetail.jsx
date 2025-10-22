import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {formatCurrency, formatDateISO} from "../../../../../../generalFunction/format.js";
import {Button, ConfigProvider, Table} from "antd";
import {updateTamUng} from "../../../../../../apis/tamUngService.jsx";
import {updateCard} from "../../../../../../apis/cardService.jsx";
import PopUpUploadFile from "../../../../../../components/UploadFile/PopUpUploadFile.jsx";
import PhieuLQView from "../PhieuLQView.jsx";

export function DonHangDetail({ phieu, fetchTamUng }) {
    const { idCard } = useParams();
    const [dataDetail, setDataDetail] = useState([]);
    const { chainTemplate2Selected, setChainTemplate2Selected } = useContext(MyContext);
    const [ selectedPhieuLQ, setSelectedPhieuLQ ] = useState(null);

    useEffect(() => {
        setDataDetail(phieu?.chi_tiet_don_hang)
    }, [phieu]);

    const columns = [

        {
            title: 'Hàng hóa',
            dataIndex: 'hang_hoa',
            key: 'hang_hoa',
            width: 350,
            render: (value, record, index) => { return `${record?.code_hang_hoa} | ${record?.name_hang_hoa}` }
        },
        {
            title: 'Số lượng',
            dataIndex: 'so_luong',
            key: 'so_luong',
            width: 100,
        },
        {
            title: 'Giá bán',
            dataIndex: 'gia_ban',
            key: 'gia_ban',
            width: 150,
            render: (value) => { return  formatCurrency(value) || '-' }
        },
        {
            title: 'Thuế',
            dataIndex: 'thue_vat',
            key: 'thue_vat',
            width: 150,
            render: (value) => { return  formatCurrency(value) || '-' }
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'tong_tien',
            key: 'tong_tien',
            width: 150,
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
            <div className={css.infoContainer}>
                {phieu?.de_nghi_mua &&
                    <div className={css.infoItem}>
                        <div className={css.infoLabel}>
                            Đề nghị mua
                        </div>
                        <div className={css.infoValue}>
                            {`${phieu?.de_nghi_mua?.code}`}
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
                        Khách hàng
                    </div>
                    <div className={css.infoValue}>
                        {`${phieu?.code_khach_hang} | ${phieu?.name_khach_hang}`}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Vụ việc
                    </div>
                    <div className={css.infoValue}>
                        {`${phieu?.code_vu_viec} | ${phieu?.name_vu_viec}`}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Công ty
                    </div>
                    <div className={css.infoValue}>
                        {`${phieu?.company}`}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Ngày dự đặt hàng
                    </div>
                    <div className={css.infoValue}>
                        {formatDateISO(phieu?.ngay_dat_hang)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Địa điểm giao hàng
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.dia_diem_giao_hang}
                    </div>
                </div>

                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Điều khoản thanh toán
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.dieu_khoan_thanh_toan}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Hình thức thanh toán
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.hinh_thuc_thanh_toan === 'chuyen_khoan'? 'Chuyển khoản': 'Tiền mặt'}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Tiền trước thuế
                    </div>
                    <div className={css.infoValue}>
                        {formatCurrency(phieu?.tien_truoc_thue)}
                    </div>
                </div>
            </div>
            <div style={{ width: '100%', overflow: "auto" }}>
                <Table
                    // dataSource={dataDetail?.length > 0 ? dataDetail : []}
                    dataSource={dataDetail?.map(item => ({ ...item, key: item.code }))}
                    columns={columns}
                    bordered
                    scroll={{ x: '120%' }}
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
