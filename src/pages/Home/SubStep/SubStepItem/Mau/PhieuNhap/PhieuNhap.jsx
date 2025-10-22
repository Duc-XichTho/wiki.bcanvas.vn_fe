import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {ADD} from "../PHIEU.js";
import {PhieuNhapDetail} from "./PhieuNhapDetail.jsx";
import {CreateCardIcon, LienQuanIcon} from "../../../../../../icon/IconSVG.js";
import {formatDateISO, formatDateToDDMMYYYY} from "../../../../../../generalFunction/format.js";
import {PhieuNhapGom} from "./PhieuNhapGom.jsx";
import TaoPhieuNhap from "../../../../formCreate/TaoPhieuNhap.jsx";
import {getPhieuNhapByCardId} from "../../../../../../apis/phieuNhapService.jsx";

export function PhieuNhap() {
    const {id, idCard, idStep} = useParams();
    const {loadData, setLoadData} = useContext(MyContext);
    const [phieuNhaps, setPhieuNhaps] = useState([]);
    const [phieuGoms, setPhieuGoms] = useState([]);
    const [selected, setSelected] = useState(ADD);
    const [selectedG, setSelectedG] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    function fetchPhieuXuats() {
        getPhieuNhapByCardId(idCard).then(data => {
            setPhieuNhaps(data);
            // let phieuGom = gomPN(data.filter(item => item.id_card_create == idCard && item.gom))
            // setPhieuGoms(phieuGom);
        })
    }

    useEffect(() => {
        fetchPhieuXuats()
    }, []);
    useEffect(() => {
        fetchPhieuXuats()
    }, [loadData]);

    function changeSelected(select) {
        setSelected(select);
        setSelectedG(null)
    }

    function changeSelectedG(select) {
        setSelected(null);
        setSelectedG(select)
    }


    return (<>
        <div className={css.phieu}>
            <div className={css.bar}>
                <div style={{margin: "15px 0 0 25px"}}>
                    <div className={css.btns}
                         onClick={() => {
                             changeSelected(ADD)
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
                    {/*        <span>Gom phiếu</span>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>


                <div className={css.list}>
                    <span style={{marginLeft: '15px'}}>Danh sách phiếu nhập</span>
                    <div style={{margin: '15px 0 15px 8px'}}>
                        {phieuNhaps.map(item => (
                            <div
                                className={`${css.nameContainer} ${selected?.id === item.id ? css.selected : ''}`}
                                onClick={() => {
                                    changeSelected(item)
                                }}>
                                <div className={css.item} key={item.id}>
                                    <img src={LienQuanIcon} alt=""/>
                                    <span>PN {item.id}</span>
                                </div>
                                <div className={css.item}>
                                    <span>({formatDateISO(item?.ngay)})</span>
                                </div>
                            </div>

                        ))}
                    </div>

                </div>

                <div className={css.list}>
                    <span style={{marginLeft: '15px'}}>Danh sách phiếu gom </span>
                    <div style={{margin: '15px 0 15px 8px'}}>
                        {phieuGoms.map(item => (
                            <div
                                className={`${css.nameContainer} ${selectedG?.gom === item.gom ? css.selected : ''}`}
                                onClick={() => {
                                    changeSelectedG(item)
                                }}>
                                <div className={css.item} key={item.id_phieu_nhap}>
                                    <img src={LienQuanIcon} alt=""/>
                                    <span>{item.gom}</span>
                                </div>
                                <div className={css.item}>
                                    <span>({formatDateToDDMMYYYY(item?.ngay)})</span>
                                </div>
                            </div>

                        ))}
                    </div>

                </div>
            </div>
            <div className={css.contentRight}>
                {selected === ADD && <TaoPhieuNhap/>}
                {selected && selected !== ADD && <PhieuNhapDetail phieu={selected}/>}
                {selectedG && selectedG !== ADD && <PhieuNhapDetail phieu={selectedG} gom={true}/>}
            </div>
            {isOpen && <PhieuNhapGom isOpen={isOpen} setIsOpen={setIsOpen}></PhieuNhapGom>}
        </div>
    </>)
}


