import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {ADD} from "../PHIEU.js";
import {PhieuGhiTSDetail} from "./PhieuGhiTSDetail.jsx";
import {getPhieuThuByCardId} from "../../../../../../apis/phieuThuService.jsx";
import TaoPhieuThu from "../../../../formCreate/TaoPhieuThu.jsx";
import {CreateCardIcon, LienQuanIcon} from "../../../../../../icon/IconSVG.js";
import {HoaDonDetail} from "../HoaDon/HoaDonDetail.jsx";
import {getAllHoaDon} from "../../../../../../apis/hoaDonService.jsx";

export function PhieuGhiTS() {
    const {id, idCard, idStep} = useParams();
    const {loadData, setLoadData} = useContext(MyContext);
    const [phieuThus, setPhieuThus] = useState([]);
    const [selectedPGH, setSelectedPGH] = useState(null);
    const [selectedPX, setSelectedPX] = useState(null);
    const [hoaDons, setHoaDons] = useState([]);

    function fetchPhieuThus() {
        getPhieuThuByCardId(idCard).then(data => {
            setPhieuThus(data);
        })
    }

    function fetchHoaDons() {
        getAllHoaDon().then(data => {
            setHoaDons(data.filter(item => item.id_card_create == idCard));
        })
    }


    useEffect(() => {
        fetchPhieuThus()
        fetchHoaDons()
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
                    {/*<div className={css.btns}>*/}
                    {/*    <div style={{display: "flex", gap: '5px', alignItems: "center"}}*/}
                    {/*         onClick={() => setIsOpen(true)}>*/}
                    {/*        <img src={CreateCardIcon} alt=""/>*/}
                    {/*        <span>Phiếu gom</span>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>

                <div className={css.list}>
                    <span style={{marginLeft: '15px'}}>Danh sách phiếu thu </span>
                    <div style={{margin: '15px 0 15px 8px'}}>
                        {phieuThus.map(item => (
                            // <div className={css.item}
                            //      key={item.id}
                            //      onClick={() => {changeSelected(item)}}>
                            //     PGH {item.id}
                            // </div>

                            <div className={`${css.nameContainer} ${selectedPGH?.id_phieu_thu === item.id_phieu_thu ? css.selected : ''}`}
                                 onClick={() => {
                                     changeSelectedPGH(item)
                                 }}>
                                <div className={css.item} key={item.id}>
                                    <img src={LienQuanIcon} alt=""/>
                                    <span>PT {item.id_phieu_thu}</span>
                                </div>
                                {/*<div className={css.item}>*/}
                                {/*    <span>({(item?.ngay_thu)})</span>*/}
                                {/*</div>*/}
                            </div>

                        ))}
                    </div>

                    <div className={css.list}>
                        <span style={{marginLeft: '15px'}}>Danh sách hóa đơn</span>
                        <div style={{margin: '15px 0 15px 8px'}}>
                            {hoaDons.map(item => (
                                <div
                                    className={`${css.nameContainer} ${selectedPX?.id === item.id ? css.selected : ''}`}
                                    onClick={() => {
                                        changeSelectedPX(item)
                                    }}>
                                    <div className={css.item} key={item.id}>
                                        <img src={LienQuanIcon} alt=""/>
                                        <span>HĐ {item.id}</span>
                                    </div>
                                    {/*<div className={css.item}>*/}
                                    {/*    <span>({formatDateToDDMMYYYY(item?.ngay_xuat)})</span>*/}
                                    {/*</div>*/}
                                    {/*<div className={css.item}>*/}
                                    {/*    <span>({item.list_id_phieu_thu?.length >0 && item.list_id_phieu_thu[0]  ?'PT '+ item.list_id_phieu_thu[0]: '-'})</span>*/}
                                    {/*</div>*/}
                                </div>

                            ))}
                        </div>

                    </div>
                </div>
            </div>
            <div className={css.contentRight}>
                {selectedPGH === ADD && <TaoPhieuThu/>}
                {selectedPGH && selectedPGH !== ADD && <PhieuGhiTSDetail phieu={selectedPGH}/>}
                {selectedPX && selectedPX !== ADD && <HoaDonDetail phieu={selectedPX}/>}
            </div>
        </div>
    </>)
}
