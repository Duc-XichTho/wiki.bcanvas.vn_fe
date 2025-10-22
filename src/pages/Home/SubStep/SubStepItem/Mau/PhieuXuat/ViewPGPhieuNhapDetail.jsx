import css from './../Mau.module.css'
import { useParams } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";
import { MyContext } from "../../../../../../MyContext.jsx";
import { Button, ConfigProvider, Table } from "antd";
import { getAllPhieuXuat, updatePhieuXuat } from "../../../../../../apis/phieuXuatService.jsx";
import { DONE, PENDING } from "../../../../../../Consts/STEP_STATUS.js";
import { SB } from "../../../../../../Consts/LIST_STEP_TYPE.js";
import { createNewDinhKhoanProData } from "../../../../../../apis/dinhKhoanProDataService.jsx";
import {
    getAllInputMau,
    getInputValueInCardByIdInput,
    getSubStepDKIdInCardByType
} from "../../../../../../generalFunction/logicMau/logicMau.js";
import { createDataDK } from "../../../../formCreate/GomPhieu/logicGom.js";
import { getDinhKhoanProDataByStepId } from "../../../../../../apis/dinhKhoanProService.jsx";
import { getAllCardInput } from "../../../../../../apis/cardInputService.jsx";
import { getAllCard } from "../../../../../../apis/cardService.jsx";
import { formatDateToDDMMYYYY } from "../../../../../../generalFunction/format.js";
import { getAllHangHoa } from "../../../../../../apis/hangHoaService.jsx";
import { updateCard } from "../../../../../../apis/cardService.jsx";
import { getDonHangByCode, getDonHangById } from "../../../../../../apis/donHangService.jsx";
import { CODE_PKT, genCode } from "../../../../../../generalFunction/genCode/genCode.js";

export function ViewPGPhieuNhapDetail({ phieu: initialPhieu, fetchPhieuXuats, type }) {
    const { idCard, idStep } = useParams();
    const { loadData, setLoadData, chainTemplate2Selected, setChainTemplate2Selected, currentYear } = useContext(MyContext);
    let phieuKT = genCode(CODE_PKT, idCard, currentYear)
    const [phieu, setPhieu] = useState({});
    const [card, setCard] = useState([]);
    const [hhs, setHHs] = useState([]);

    useEffect(() => {
        setPhieu(initialPhieu)
    }, [initialPhieu]);

    function fetchCard() {
        getAllCard().then(data => {
            setCard(data.find(item => item.id == idCard))
        })
        getAllHangHoa().then(data => {
            setHHs(data)
        })
    }

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
            dataIndex: 'so_luong',
            key: 'so_luong',
        },
        {
            title: 'Đơn giá',
            dataIndex: 'gia_nhap',
            key: 'gia_nhap',
            render: (value) => {
                if (value === "-") return value;
                const number = parseInt(value, 10);
                return isNaN(number) ? value : number.toLocaleString('en-US');
            }
        },
        {
            title: 'Lô',
            dataIndex: 'lo_name',
            key: 'lo_name',
        },
        {
            title: 'Kho',
            dataIndex: 'kho_name',
            key: 'kho_name',
        },
    ];

    useEffect(() => {
        fetchCard();
    }, []);


    return (
        <div className={css.phieuDetail}>
            <h3 className={css.maPhieu}>{phieu ? phieu.gom : `${phieu.code}`}</h3>
            <div className={css.infoContainer}>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Nhân viên:</div>
                    <div className={css.infoValue}>
                        {phieu?.code_nhan_vien} | {phieu?.name_nhan_vien}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Ngày nhập :</div>
                    <div className={css.infoValue}>{(phieu?.ngay_nhap?.split("-").reverse().join("-"))}</div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Phiếu nhập:</div>
                    <div className={css.infoValue}>{phieu?.phieus?.join(', ')}</div>
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
