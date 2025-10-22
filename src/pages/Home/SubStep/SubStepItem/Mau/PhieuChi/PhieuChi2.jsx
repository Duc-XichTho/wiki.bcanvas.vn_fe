import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {PhieuChiDetail} from "./PhieuChiDetail.jsx";
import {getAllTamUngNew} from "../../../../../../apis/tamUngService";
import TaoPhieuChi from "../../../../formCreate/TaoPhieuChi.jsx";
import {getAllPhieuChi2} from "../../../../../../apis/phieuChi2Service.jsx";
import PhieuTamUngDetail from '../PhieuTamUngDetail/PhieuTamUngDetail.jsx';
import {getDeNghiThanhToanNew} from "../../../../../../apis/deNghiThanhToanService.jsx";

export function PhieuChi2() {
    const { id, idCard, idStep } = useParams();
    // const { loadData, setLoadData } = useContext(MyContext);
    // const [phieuThus, setPhieuThus] = useState([]);
    // const [hoaDons, setHoaDons] = useState([]);
    const [dataTamUng, setDataTamUng] = useState([]);
    const [dataDeNghi, setDataDeNghi] = useState([]);
    const [itemSelected, setItemSelected] = useState({
        type: '',
        data: null,
    });


    const fetchAllPhieuChi = async () => {
        try {
            let data = await getAllPhieuChi2();
            data = data.filter(e => e.id_card_create == idCard)
            if (data?.length > 0) {
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
    const fetchAllDeNghi = async () => {
        try {
            const data = await getDeNghiThanhToanNew();
            setDataDeNghi(data);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        fetchAllTamUng()
        fetchAllDeNghi()
        fetchAllPhieuChi()
    }, [idCard]);

    // function fetchPhieuThus() {
    //     getPhieuThuByCardId(idCard).then(data => {
    //         setPhieuThus(data);
    //     })
    // }

    // function fetchHoaDons() {
    //     getAllHoaDon().then(data => {
    //         setHoaDons(data.filter(item => item.id_card_create == idCard));
    //     })
    // }

    // useEffect(() => {
    //     fetchPhieuThus()
    //     fetchHoaDons()
    // }, [loadData]);

    return (<>
        <div className={css.phieu}>
            <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: '10px' }}>
                {itemSelected?.type === 'phieu_moi' && <TaoPhieuChi fetchAllPhieuChi={fetchAllPhieuChi} />}
                {itemSelected?.type === 'phieu_chi' && <PhieuChiDetail phieu={itemSelected?.data} dataTamUng={dataTamUng} dataDeNghi={dataDeNghi} />}
                {itemSelected?.type === 'phieu_tam_ung' && <PhieuTamUngDetail phieu={itemSelected?.data} />}
            </div>
        </div>
    </>)
}
