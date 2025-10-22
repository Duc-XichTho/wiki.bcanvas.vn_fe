import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {ADD} from "../PHIEU.js";
import {PhieuThuChiDetail} from "./PhieuThuChiDetail.jsx";
import {getPhieuThuByCardId} from "../../../../../../apis/phieuThuService.jsx";
import TaoPhieuThu from "../../../../formCreate/TaoPhieuThu.jsx";
import {CreateCardIcon, LienQuanIcon} from "../../../../../../icon/IconSVG.js";
import {HoaDonDetail} from "../HoaDon/HoaDonDetail.jsx";
import {getAllHoaDon} from "../../../../../../apis/hoaDonService.jsx";
import TaoPhieuThuChi from "../../../../formCreate/TaoPhieuThuChi.jsx";
import {PhieuChiDetail} from "../PhieuChi/PhieuChiDetail.jsx";
import {getAllPhieuChi2} from "../../../../../../apis/phieuChi2Service.jsx";
import {getAllTamUngNew} from "../../../../../../apis/tamUngService.jsx";
import {PhieuThuDetail} from "../PhieuThu/PhieuThuDetail.jsx";

export function PhieuThuChi() {
    const {id, idCard, idStep} = useParams();
    const {loadData, setLoadData} = useContext(MyContext);
    const [phieuThus, setPhieuThus] = useState([]);
    const [selectedPGH, setSelectedPGH] = useState(null);
    const [selectedPX, setSelectedPX] = useState(null);
    const [phieuChis, setPhieuChis] = useState([]);
    const [dataTamUng, setDataTamUng] = useState([]);

    const fetchAllTamUng = async () => {
        try {
            const data = await getAllTamUngNew();
            setDataTamUng(data);
        } catch (error) {
            console.error(error);
        }
    }

    function fetchPhieuThus() {
        getPhieuThuByCardId(idCard).then(data => {
            setPhieuThus(data);
        })
        getAllPhieuChi2().then(data => {
            setPhieuChis(data.filter(item => item.id_card_create == idCard));
        })
    }

    useEffect(() => {
        fetchPhieuThus()
        fetchAllTamUng()
    }, [loadData]);

    function changeSelectedPGH(select) {
        setSelectedPGH(select);
        setSelectedPX(null)
    }

    function changeSelectedPX(select) {
        setSelectedPX(select);
        setSelectedPGH(null)
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
                    <span style={{marginLeft: '15px'}}>Danh sách phiếu thu </span>
                    <div style={{margin: '15px 0 15px 8px'}}>
                        {phieuThus.map(item => (
                            <div className={`${css.nameContainer} ${selectedPGH?.id_phieu_thu === item.id_phieu_thu ? css.selected : ''}`}
                                 onClick={() => {
                                     changeSelectedPGH(item)
                                 }}>
                                <div className={css.item} key={item.id}>
                                    <img src={LienQuanIcon} alt=""/>
                                    <span>PT {item.id_phieu_thu}</span>
                                </div>
                            </div>

                        ))}
                    </div>

                    <div className={css.list}>
                        <span style={{marginLeft: '15px'}}>Danh sách phiếu chi </span>
                        <div style={{margin: '15px 0 15px 8px'}}>
                            {phieuChis.map(item => (
                                <div
                                    className={`${css.nameContainer} ${selectedPX?.id === item.id ? css.selected : ''}`}
                                    onClick={() => {
                                        changeSelectedPX(item)
                                    }}>
                                    <div className={css.item} key={item.id}>
                                        <img src={LienQuanIcon} alt=""/>
                                        <span>PC {item.id}</span>
                                    </div>
                                </div>

                            ))}
                        </div>

                    </div>
                </div>
            </div>
            <div className={css.contentRight}>
                {selectedPGH === ADD && <TaoPhieuThuChi/>}
                {selectedPGH && selectedPGH !== ADD && <PhieuThuDetail phieu={selectedPGH} ptc={true}/>}
                {selectedPX && selectedPX !== ADD && <PhieuChiDetail phieu={selectedPX} dataTamUng={dataTamUng}  ptc={true}/>}
            </div>
        </div>
    </>)
}
