import css from './../Mau.module.css'
import React from "react";

export function HopDongDetail({ phieu }) {

    return (<>
        <div className={css.phieuDetail}>
            <h3 className={css.maPhieu}>{phieu?.code}</h3>
            <div className={css.infoContainer}>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Mã hợp đồng
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.code)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Tên hợp đồng
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.name)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Đối tác
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.doi_tac)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Loại hợp đồng
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.loai)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Ngày ký
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.ngay_ky)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Hiệu lực từ
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.hieu_luc_tu)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Hiệu lực đến
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.hieu_luc_den)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Giá trị
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.gia_tri)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Đã xuất
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.da_xuat)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Còn lại
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.con_lai)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Lãi suất năm
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.lai_suat_nam)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Kỳ trả lại
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.ky_tra_lai)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Dư nợ gốc
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.du_no_goc)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Mục đích vay
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.muc_dich_vay)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Tài sản đảm bảo
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.tai_san_dam_bao)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Mô tả hợp đồng
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.mo_ta)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Điều khoản thanh toán
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.dieu_khoan_tt)}
                    </div>
                </div>
            </div>
        </div>
    </>)
}
