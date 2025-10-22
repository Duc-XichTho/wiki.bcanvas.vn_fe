import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {ADD} from "../PHIEU.js";
import {DNTTDetail} from "./DNTTDetail.jsx";
import {CreateCardIcon, LienQuanIcon} from "../../../../../../icon/IconSVG.js";
import {HoaDonDetail} from "../HoaDon/HoaDonDetail.jsx";
import TaoDNTT from "../../../../formCreate/TaoDNTT.jsx";
import {getDeNghiThanhToanByCardId} from "../../../../../../apis/deNghiThanhToanService.jsx";
import {getTamUngByCardId} from "../../../../../../apis/tamUngService.jsx";
import {TamUngDetail} from "../TamUng/TamUngDetail.jsx";

export function DNTT() {
    const {id, idCard, idStep} = useParams();
    const {loadData, setLoadData} = useContext(MyContext);
    const [dntt, setDntt] = useState([]);
    const [selectedDNTT, setSelectedDNTT] = useState(null);
    const [selectedTU, setSelectedTU] = useState(null);
    const [TUList, setTUList] = useState([]);

    function fetchPhieuThus() {
        getDeNghiThanhToanByCardId(idCard).then(data => {
            setDntt(data);
        })
    }

    function fetchHoaDons() {
        getTamUngByCardId(idCard).then(data => {
            setTUList(data);
        })
    }


    useEffect(() => {
        fetchPhieuThus()
        fetchHoaDons()
    }, [loadData]);

    function changeSelectedPGH(select) {
        setSelectedDNTT(select);
        setSelectedTU(null)
    }

    function changeSelectedPX(select) {
        setSelectedTU(select);
        setSelectedDNTT(null)
    }

    return (<>
        <div className={css.phieu}>
            <div className={css.bar}>
                <div style={{margin: "15px 0 0 25px"}}>
                    <div className={css.btns}
                         onClick={() => {
                             changeSelectedPGH(ADD)
                         }}
                    >
                        <div style={{display: "flex", gap: '5px', alignItems: "center"}}>
                            <img src={CreateCardIcon} alt=""/>
                            <span>Tạo mới</span>
                        </div>
                    </div>
                </div>

                <div className={css.list}>
                    <span style={{marginLeft: '15px'}}>Danh sách đề nghị thanh toán</span>
                    <div style={{margin: '15px 0 15px 8px'}}>
                        {dntt.map(item => (

                            <div className={`${css.nameContainer} ${selectedDNTT?.id === item.id ? css.selected : ''}`}
                                 onClick={() => {
                                     changeSelectedPGH(item)
                                 }}>
                                <div className={css.item} key={item.id}>
                                    <img src={LienQuanIcon} alt=""/>
                                    <span>DNTT {item.id}</span>
                                </div>
                            </div>

                        ))}
                    </div>

                    <div className={css.list}>
                        <span style={{marginLeft: '15px'}}>Danh sách tạm ứng </span>
                        <div style={{margin: '15px 0 15px 8px'}}>
                            {TUList.map(item => (
                                <div
                                    className={`${css.nameContainer} ${selectedTU?.id === item.id ? css.selected : ''}`}
                                    onClick={() => {
                                        changeSelectedPX(item)
                                    }}>
                                    <div className={css.item} key={item.id}>
                                        <img src={LienQuanIcon} alt=""/>
                                        <span>TƯ {item.id}</span>
                                    </div>
                                </div>

                            ))}
                        </div>

                    </div>
                </div>
            </div>
            <div className={css.contentRight}>
                {selectedDNTT === ADD && <TaoDNTT/>}
                {selectedDNTT && selectedDNTT !== ADD && <DNTTDetail phieu={selectedDNTT}/>}
                {selectedTU && selectedTU !== ADD && <TamUngDetail phieu={selectedTU}/>}
            </div>
        </div>
    </>)
}
