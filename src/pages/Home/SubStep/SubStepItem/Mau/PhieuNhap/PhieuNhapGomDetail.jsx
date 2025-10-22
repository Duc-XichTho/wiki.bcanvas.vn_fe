import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {Table} from "antd";
import {formatCurrency} from "../../../../../../generalFunction/format.js";
import {getDonHangByCode} from "../../../../../../apis/donHangService.jsx";

export function PhieuNhapGomDetail ({ phieu: initialPhieu }) {
    const { idCard } = useParams();
    const { loadData, setLoadData } = useContext(MyContext);
    const [phieu, setPhieu] = useState(initialPhieu);

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
            title: 'Số lượng',
            dataIndex: 'so_luong',
            key: 'so_luong',
            render: (value) => value?.toLocaleString('en-US')
        },
        {
            title: 'Đơn giá',
            dataIndex: 'gia_ban',
            key: 'gia_xuat',
            render: (value) => {
                return parseInt(value).toLocaleString('en-US')
            }
        },
    ];

    useEffect(() => {
        getDonHangByCode(initialPhieu?.code).then(data => {
            setPhieu({...initialPhieu, danh_sach_hang_hoa: data.chi_tiet_don_hang});
        })
    }, [initialPhieu]);


    return (
        <div className={css.phieuDetail}>
            <h3 className={css.maPhieu}>{phieu.code}</h3>
            <div className={css.infoContainer}>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Khách hàng:</div>
                    <div className={css.infoValue}>
                        {phieu?.code_khach_hang} | {phieu?.name_khach_hang}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Vụ việc:</div>
                    <div className={css.infoValue}>
                        {phieu?.code_vu_viec} | {phieu?.name_vu_viec}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Ngày đặt hàng:</div>
                    <div className={css.infoValue}>{phieu?.ngay_dat_hang}</div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Địa điểm giao hàng:</div>
                    <div className={css.infoValue}>{phieu?.dia_diem_giao_hang}</div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Điều khoản thanh toán:</div>
                    <div className={css.infoValue}>{phieu?.dieu_khoan_thanh_toan}</div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Hình thức thanh toán:</div>
                    <div className={css.infoValue}>{phieu?.hinh_thuc_thanh_toan == "chuyen_khoan"? 'Chuyển khoản': 'Tiền mặt'}</div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Tiền trước thuế:</div>
                    <div className={css.infoValue}>{formatCurrency(phieu?.tien_truoc_thue)}</div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Thuế:</div>
                    <div className={css.infoValue}>{formatCurrency(phieu?.thue)}</div>
                </div>
            </div>
            <div style={{ width: '100%', display: 'block' }}>
                <Table
                    dataSource={phieu.danh_sach_hang_hoa?.length > 0 ? phieu.danh_sach_hang_hoa : []}
                    columns={columns}
                    pagination={false}
                />
            </div>
        </div>
    );
}
