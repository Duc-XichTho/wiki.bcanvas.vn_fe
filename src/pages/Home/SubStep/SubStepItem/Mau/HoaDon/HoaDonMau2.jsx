import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {getFullPhieuXuat} from "../../../../../../apis/phieuNhapXuatService.jsx";
import InvoicePopup2 from "../../../../InvoicePopup/InvoicePopup2.jsx";
import {getAllHoaDon} from "../../../../../../apis/hoaDonService.jsx";
import {HoaDonDetail} from "./HoaDonDetail.jsx";
import {getPhieuXuatDataById} from "../../../../../../apis/phieuXuatService.jsx";

export function HoaDonMau2() {
    const { id, idCard, idStep } = useParams();
    const { loadData, setLoadData } = useContext(MyContext);
    const [phieuXuats, setPhieuXuats] = useState([]);
    const [itemSelected, setItemSelected] = useState({
        type: '',
        data: null,
    });

    async function fetchPhieuXuats() {
        try {
            const dataHoaDon = await getAllHoaDon();
            let data = dataHoaDon.filter(item => item.id_card_create == idCard);
            if (data.length > 0) {
                let phieu = data[0];
                phieu.pxs = [];
                if (phieu.list_id_phieu_xuat.length > 0) {
                    for (const item of phieu.list_id_phieu_xuat) {
                        try {
                            let idPX = item;
                            let px = await getPhieuXuatDataById(idPX);
                            if (px) {
                                phieu.pxs.push(px);
                            }
                        } catch (error) {
                        }
                    }

                }
                setItemSelected({ type: 'phieu', data: phieu });
            } else {
                setItemSelected({ type: 'phieu_moi', data: null });
            }

            const dataPhieuXuat = await getFullPhieuXuat();
            setPhieuXuats(dataPhieuXuat);
        } catch (error) {
            console.error("Lỗi khi fetch dữ liệu:", error);
        }
    }



    useEffect(() => {
        fetchPhieuXuats()
    }, [idCard]);

    return (
        <>
            <div className={css.phieu}>
                {itemSelected?.type === 'phieu_moi' && <InvoicePopup2 phieuXuats={phieuXuats} fetchPhieuXuats={fetchPhieuXuats}/>}
                {itemSelected?.type === 'phieu' && <HoaDonDetail phieu={itemSelected.data} />}
            </div>
        </>)
}
