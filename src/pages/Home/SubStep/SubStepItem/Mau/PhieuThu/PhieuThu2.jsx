import css from './../Mau.module.css'
import { useParams } from "react-router-dom";
import React, { useContext, useEffect, useRef, useState } from "react";
import { MyContext } from "../../../../../../MyContext.jsx";
import { ADD } from "../PHIEU.js";
import { PhieuThuDetail } from "./PhieuThuDetail.jsx";
import { getPhieuThuByCardId } from "../../../../../../apis/phieuThuService.jsx";
import TaoPhieuThu from "../../../../formCreate/TaoPhieuThu.jsx";
import { CreateCardIcon, LienQuanIcon, SettingIcon } from "../../../../../../icon/IconSVG.js";
import { HoaDonDetail } from "../HoaDon/HoaDonDetail.jsx";
import { getAllHoaDon } from "../../../../../../apis/hoaDonService.jsx";
import { Menu, Popover } from "antd";
import { PhieuGom } from "./PhieuGom.jsx";
import { formatDateToDDMMYYYY } from "../../../../../../generalFunction/format.js";
import { getNoteChartData, updateNoteChart } from "../../../../../../apis/noteChartService.jsx";
import { toast } from "react-toastify";
import {findRecordsByConditions} from "../../../../../../apis/searchModelService.jsx";
import {HoaDon, PhieuXuat} from "../../../../../../Consts/MODEL_CALL_API.js";

export function PhieuThu2() {
    const { id, idCard, idStep } = useParams();
    const { loadData, setLoadData } = useContext(MyContext);
    const [listNoteChart, setListNoteChart] = useState([]);
    const [noteContent, setNoteContent] = useState('');
    const [noteId, setNoteId] = useState();
    const textAreaRef = useRef(null);
    const [itemSelected, setItemSelected] = useState({
        type: '',
        data: null,
    });

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [noteContent]);

    const getNoteForChart = () => {
        if (Array.isArray(listNoteChart)) {
            const note = listNoteChart.find(note => note.chartTitle == 'PhieuThu');
            setNoteId(note?.id);
            return note?.content;
        } else {
            return 'Dữ liệu biểu đồ không hợp lệ';
        }
    };
    useEffect(() => {
        getNoteChartData('PhieuThu').then((data) => {
            setListNoteChart(data)
        })
    }, []);

    useEffect(() => {
        setNoteContent(getNoteForChart());
    }, [listNoteChart]);

    async function fetchPhieuThus() {
        try {
            const data = await getPhieuThuByCardId(idCard);
            if (data.length > 0 && Array.isArray(data[0].id_hoa_don)) {
                data[0].id_hoa_don = (
                    await Promise.all(
                        data[0].id_hoa_don.map(async (id) => {
                            const conditionsCard = { id: id };
                            return findRecordsByConditions(HoaDon, conditionsCard);
                        })
                    )
                ).flat();
            }

            setItemSelected({
                type: data.length > 0 ? 'phieu' : 'phieu_moi',
                data: data.length > 0 ? data[0] : null
            });
        } catch (error) {
            console.error("Lỗi khi fetch phiếu thu:", error);
        }
    }


    useEffect(() => {
        fetchPhieuThus()
    }, [idCard]);

    return (<>
        <div className={css.phieu}>
            {itemSelected?.type === 'phieu_moi' && <TaoPhieuThu fetchPhieuThus={fetchPhieuThus} />}
            {itemSelected?.type === 'phieu' && <PhieuThuDetail phieu={itemSelected?.data} fetchPhieuThus={fetchPhieuThus} />}
        </div>
    </>)
}
