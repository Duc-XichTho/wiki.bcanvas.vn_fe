import css from './../Mau.module.css'
import { useParams } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";
import { MyContext } from "../../../../../../MyContext.jsx";
import { DNTTDetail } from "./DNTTDetail.jsx";
import TaoDNTT from "../../../../formCreate/TaoDNTT.jsx";
import { getDeNghiThanhToanByCardId } from "../../../../../../apis/deNghiThanhToanService.jsx";

export function DNTT2() {
    const { id, idCard, idStep } = useParams();
    const { loadData, setLoadData } = useContext(MyContext);
    const [itemSelected, setItemSelected] = useState({
        type: '',
        data: null,
    });

    function fetchPhieuThus() {
        getDeNghiThanhToanByCardId(idCard).then(data => {
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
        fetchPhieuThus()
    }, [idCard]);


    return (<>
        <div className={css.phieu}>
            {itemSelected?.type === 'phieu_moi' && <TaoDNTT fetchPhieuThus={fetchPhieuThus} />}
            {itemSelected?.type === 'phieu' && <DNTTDetail phieu={itemSelected.data} fetchPhieuThus={fetchPhieuThus} />}
        </div>
    </>)
}
