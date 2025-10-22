import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import TaoPhieuXuat from "../../../../formCreate/TaoPhieuXuat.jsx";
import {MyContext} from "../../../../../../MyContext.jsx";
import {getFullPhieuXuat} from "../../../../../../apis/phieuNhapXuatService.jsx";
import {PhieuXuatDetail} from "./PhieuXuatDetail.jsx";

export function PhieuXuat2() {
    const {id, idCard, idStep} = useParams();
    const {loadData, setLoadData} = useContext(MyContext);
    const [itemSelected, setItemSelected] = useState({
        type: '',
        data: null,
    });

    function fetchPhieuXuats() {
        getFullPhieuXuat().then(data => {
            data = data.filter(item => item.id_card_create == idCard)
            if (data?.length > 0) {
                setItemSelected({
                    type: 'phieu',
                    data: data[0]
                })
            } else {
                setItemSelected({
                    type: 'phieu_moi',
                    data: null
                })
            }
        })
    }

    useEffect(() => {
        fetchPhieuXuats()
    }, [idCard]);

    return (
        <>
            <div className={css.phieu}>
                {itemSelected?.type === 'phieu_moi' && <TaoPhieuXuat fetchPhieuXuats={fetchPhieuXuats}/>}
                {itemSelected?.type === 'phieu' && <PhieuXuatDetail phieu={itemSelected.data} fetchPhieuXuats={fetchPhieuXuats}/>}
            </div>
        </>)
}


