import css from './../Mau.module.css'
import { useParams } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";
import { MyContext } from "../../../../../../MyContext.jsx";
import { ADD } from "../PHIEU.js";
import { CreateCardIcon, LienQuanIcon } from "../../../../../../icon/IconSVG.js";
import { PhieuXuatDetail } from "../PhieuXuat/PhieuXuatDetail.jsx";
import { getPhieuXuatByCardId } from "../../../../../../apis/phieuXuatService.jsx";
import { TamUngDetail } from "./TamUngDetail.jsx";
import TaoTamUng from "../../../../formCreate/TaoTamUng.jsx";
import { getTamUngByCardId } from "../../../../../../apis/tamUngService.jsx";

export function TamUng() {
    const { id, idCard, idStep } = useParams();
    const { loadData, setLoadData } = useContext(MyContext);
    const [tamUng, setTamUng] = useState([]);
    const [selectedTU, setSelectedTU] = useState(null);
    const [selectedPX, setSelectedPX] = useState(null);
    function fetchTamUng() {
        getTamUngByCardId(idCard).then(data => {
            setTamUng(data);
        })
    }

    useEffect(() => {
        fetchTamUng()
    }, [loadData]);

    function changeSelectedTU(select) {
        setSelectedTU(select);
        setSelectedPX(null)
    }

    return (<>
        <div className={css.phieu}>
            <div className={css.bar}>
                <div style={{ margin: "15px 0 0 25px" }}>
                    <div className={css.btns}
                        onClick={() => {
                            changeSelectedTU(ADD)
                        }}
                    >
                        <div style={{ display: "flex", gap: '5px', alignItems: "center" }}>
                            <img src={CreateCardIcon} alt="" />
                            <span>Tạo mới</span>
                        </div>
                    </div>
                </div>

                <div className={css.list}>
                    <span style={{ marginLeft: '15px' }}>Danh sách tạm ứng </span>
                    <div style={{ margin: '15px 0 15px 8px' }}>
                        {tamUng.map(item => (

                            <div className={`${css.nameContainer} ${selectedTU?.id === item.id ? css.selected : ''}`}
                                onClick={() => {
                                    changeSelectedTU(item)
                                }}>
                                <div className={css.item} key={item.id}>
                                    <img src={LienQuanIcon} alt="" />
                                    <span>TU {item.id}</span>
                                </div>

                            </div>

                        ))}
                    </div>
                </div>
            </div>
            <div className={css.contentRight}>
                {selectedTU === ADD && <TaoTamUng />}
                {selectedTU && selectedTU !== ADD && <TamUngDetail phieu={selectedTU} />}
            </div>
        </div>
    </>)
}
