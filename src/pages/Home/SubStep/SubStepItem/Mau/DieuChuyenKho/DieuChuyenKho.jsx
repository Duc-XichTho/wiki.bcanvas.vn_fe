import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import TaoDieuChuyenKho from "../../../../formCreate/TaoDieuChuyenKho.jsx";
import {getAllDieuChuyenKho, getDieuChuyenKhoByCardId} from "../../../../../../apis/dieuChuyenKhoService.jsx";
import {DieuChuyenKhoDetail} from "./DieuChuyenKhoDetail.jsx";

export function DieuChuyenKho() {
    const {id, idCard, idStep} = useParams();
    const {loadData, setLoadData} = useContext(MyContext);
    const [itemSelected, setItemSelected] = useState({
        type: '',
        data: null,
    });

    async function fetchDieuChuyenKhos() {
        try {
            const data = await getDieuChuyenKhoByCardId(idCard);
            if (data && data?.dieuChuyenKhoRecord?.id_card_create ) {
                setItemSelected({
                    type: 'phieu',
                    data: data,
                });
            }else {
                setItemSelected({
                    type: 'phieu_moi',
                    data: null,
                });
            }
        } catch (e) {
            if (e.response) {
                // Lỗi từ phía máy chủ
                console.error("Lỗi từ máy chủ:", e.response.data);
                console.error("Mã lỗi:", e.response.status);
                setItemSelected({
                    type: 'phieu_moi',
                    data: null,
                });
            } else if (e.request) {
                // Lỗi không có phản hồi từ máy chủ
                console.error("Không nhận được phản hồi từ máy chủ");
            } else {
                // Lỗi khác
                console.error("Lỗi:", e.message);
            }
        }
    }

    useEffect(() => {
        fetchDieuChuyenKhos()
    }, [loadData, idCard]);

    return (
        <>
            <div className={css.phieu}>
                {itemSelected?.type === 'phieu_moi' && <TaoDieuChuyenKho fetchDCK={fetchDieuChuyenKhos}/>}
                {itemSelected?.type === 'phieu' && <DieuChuyenKhoDetail fetchDCK={fetchDieuChuyenKhos} initialPhieu={itemSelected.data}/>}
            </div>
        </>)
}


