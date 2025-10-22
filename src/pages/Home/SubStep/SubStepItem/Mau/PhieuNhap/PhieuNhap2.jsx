import css from './../Mau.module.css'
import { useParams } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";
import { MyContext } from "../../../../../../MyContext.jsx";
import { ADD } from "../PHIEU.js";
import { PhieuNhapDetail } from "./PhieuNhapDetail.jsx";
import { CreateCardIcon, LienQuanIcon } from "../../../../../../icon/IconSVG.js";
import { formatDateISO, formatDateToDDMMYYYY } from "../../../../../../generalFunction/format.js";
import { PhieuNhapGom } from "./PhieuNhapGom.jsx";
import TaoPhieuNhap from "../../../../formCreate/TaoPhieuNhap.jsx";
import { getPhieuNhapByCardId } from "../../../../../../apis/phieuNhapService.jsx";

export function PhieuNhap2() {
    const { id, idCard, idStep } = useParams();
    const { loadData, setLoadData } = useContext(MyContext);
    const [itemSelected, setItemSelected] = useState({
        type: '',
        data: null,
    });

    function fetchPhieuNhap() {
        getPhieuNhapByCardId(idCard).then(data => {
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
        fetchPhieuNhap()
    }, [idCard]);


    return (<>
        <div className={css.phieu}>
            {itemSelected?.type === 'phieu_moi' && <TaoPhieuNhap fetchPhieuNhap={fetchPhieuNhap} />}
            {itemSelected?.type === 'phieu' && <PhieuNhapDetail phieu={itemSelected.data} fetchPhieuNhap={fetchPhieuNhap} />}
        </div>
    </>)
}


