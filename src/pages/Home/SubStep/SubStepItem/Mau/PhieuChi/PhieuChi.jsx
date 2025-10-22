import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {ADD} from "../PHIEU.js";
import {PhieuChiDetail} from "./PhieuChiDetail.jsx";
import {getPhieuThuByCardId} from "../../../../../../apis/phieuThuService.jsx";
import TaoPhieuThu from "../../../../formCreate/TaoPhieuThu.jsx";
import {CreateCardIcon, LienQuanIcon} from "../../../../../../icon/IconSVG.js";
import {HoaDonDetail} from "../HoaDon/HoaDonDetail.jsx";
import {getAllHoaDon} from "../../../../../../apis/hoaDonService.jsx";
import {getAllTamUngNew} from "../../../../../../apis/tamUngService";
import TaoPhieuChi from "../../../../formCreate/TaoPhieuChi.jsx";
import {getAllPhieuChi2} from "../../../../../../apis/phieuChi2Service.jsx";
import PhieuTamUngDetail from '../PhieuTamUngDetail/PhieuTamUngDetail.jsx';

export function PhieuChi() {
    const {id, idCard, idStep} = useParams();
    const {loadData, setLoadData} = useContext(MyContext);
    const [phieuThus, setPhieuThus] = useState([]);
    const [selectedPGH, setSelectedPGH] = useState(null);
    const [selectedPX, setSelectedPX] = useState(null);
    const [hoaDons, setHoaDons] = useState([]);
    const [dataTamUng, setDataTamUng] = useState([]);
    const [dataPhieuChi, setDataPhieuChi] = useState([]);

    const [itemSelected, setItemSelected] = useState({
        type: '',
        data: null,
    });

    const fetchAllPhieuChi = async () => {
        try {
            let data = await getAllPhieuChi2();
            data = data.filter(e => e.id_card_create == idCard)
            setDataPhieuChi(data);
            if (data?.length > 0 && data[0].trang_thai == 'done') {
                setItemSelected({
                    type: 'phieu_chi',
                    data: data[0]
                })
            } else {
                setItemSelected({
                    type: 'phieu_moi',
                    data: null
                })
            }
        } catch (error) {
            console.error(error);
        }
    }

    const fetchAllTamUng = async () => {
        try {
            const data = await getAllTamUngNew();
            setDataTamUng(data);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        fetchAllTamUng()
        fetchAllPhieuChi()
    }, [idCard, loadData]);


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
                         onClick={() => setItemSelected({
                             type: 'phieu_moi',
                             data: null
                         })}
                    >
                        <div style={{display: "flex", gap: '5px', alignItems: "center"}}>
                            <img src={CreateCardIcon} alt=""/>
                            <span>Phiếu mới</span>
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
                    <span style={{marginLeft: '15px'}}>Danh sách phiếu chi </span>
                    <div style={{margin: '15px 0 15px 8px'}}>
                        {dataPhieuChi.map(item => (
                            // <div className={css.item}
                            //      key={item.id}
                            //      onClick={() => {changeSelected(item)}}>
                            //     PGH {item.id}
                            // </div>

                            // <div className={`${css.nameContainer} ${selectedPGH?.id_phieu_thu === item.id_phieu_thu ? css.selected : ''}`}
                            <div
                                className={`${css.nameContainer} ${itemSelected.type === 'phieu_chi' && itemSelected?.data?.id === item.id ? css.selected : ''}`}

                                onClick={() => setItemSelected({
                                    type: 'phieu_chi',
                                    data: item
                                })}>
                                <div className={css.item} key={item.id}>
                                    <img src={LienQuanIcon} alt=""/>
                                    <span>PC {item.id}</span>
                                </div>
                                {/*<div className={css.item}>*/}
                                {/*    <span>({(item?.ngay_thu)})</span>*/}
                                {/*</div>*/}
                            </div>

                        ))}
                    </div>

                    <div className={css.list}>
                        <span style={{marginLeft: '15px'}}>Danh sách phiếu tạm ứng </span>
                        <div style={{margin: '15px 0 15px 8px'}}>
                            {dataTamUng.map(item => (
                                // <div className={`${css.nameContainer} ${selectedPX?.id === item.id ? css.selected : ''}`}
                                <div
                                    className={`${css.nameContainer} ${itemSelected.type === 'phieu_tam_ung' && itemSelected?.data?.id === item.id ? css.selected : ''}`}
                                    onClick={() => setItemSelected({
                                        type: 'phieu_tam_ung',
                                        data: item
                                    })}>
                                    <div className={css.item} key={item.id}>
                                        <img src={LienQuanIcon} alt=""/>
                                        <span>TU - {item.id}</span>
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
                <div style={{width: '100%', height: '100%', overflow: 'auto', padding: '10px'}}>
                    {itemSelected?.type === 'phieu_moi' && <TaoPhieuChi />}
                    {itemSelected?.type === 'phieu_chi' &&
                        <PhieuChiDetail phieu={itemSelected?.data} dataTamUng={dataTamUng}/>}
                    {itemSelected?.type === 'phieu_tam_ung' && <PhieuTamUngDetail phieu={itemSelected?.data}/>}
                </div>
            </div>
        </div>
    </>)
}
