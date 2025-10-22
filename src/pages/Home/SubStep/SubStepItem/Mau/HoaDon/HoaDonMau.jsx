import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useRef, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {getFullPhieuXuat} from "../../../../../../apis/phieuNhapXuatService.jsx";
import {ADD} from "../PHIEU.js";
import {CreateCardIcon, LienQuanIcon} from "../../../../../../icon/IconSVG.js";
import {formatDateToDDMMYYYY} from "../../../../../../generalFunction/format.js";
import InvoicePopup2 from "../../../../InvoicePopup/InvoicePopup2.jsx";
import {getAllHoaDon, getHoaDonByCardId} from "../../../../../../apis/hoaDonService.jsx";
import {PhieuXuatDetail} from "../PhieuXuat/PhieuXuatDetail.jsx";
import {HoaDonDetail} from "./HoaDonDetail.jsx";
import {getNoteChartData, updateNoteChart} from "../../../../../../apis/noteChartService.jsx";
import {toast} from "react-toastify";

export function HoaDonMau() {
    const {id, idCard, idStep} = useParams();
    const {loadData, setLoadData} = useContext(MyContext);
    const [phieuXuats, setPhieuXuats] = useState([]);
    const [hoaDons, setHoaDons] = useState([]);
    const [selected, setSelected] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [typeSelect, setTypeSelect] = useState(null);
    const [listNoteChart, setListNoteChart] = useState([]);
    const [noteContent, setNoteContent] = useState('');
    const [noteId, setNoteId] = useState();
    const textAreaRef = useRef(null);

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [noteContent]);

    const getNoteForChart = () => {
        if (Array.isArray(listNoteChart)) {
            const note = listNoteChart.find(note => note.chartTitle == 'HoaDon');
            setNoteId(note?.id);
            return note?.content;
        } else {
            return 'Dữ liệu biểu đồ không hợp lệ';
        }
    };
    useEffect(() => {
        getNoteChartData('HoaDon').then((data) => {
            setListNoteChart(data)
        })
    }, []);

    useEffect(() => {
        setNoteContent(getNoteForChart());
    }, [listNoteChart]);

    const updateNoteForChart = async (e) => {
        try {
            const inputValue = e.target.value;
            setNoteContent(inputValue);
            const updatedNote = {
                content: inputValue,
            };
            await updateNoteChart(noteId, updatedNote);
        } catch (e) {
            toast.error('Lỗi khi update');
        }

    }
    function fetchPhieuXuats() {
        getAllHoaDon().then(data => {
            setHoaDons(data.filter(item => item.id_card_create == idCard));
        })
        getFullPhieuXuat().then(data => {
            setPhieuXuats(data.filter(item => item.don_hang == 'DH|' + idCard));
        })
    }

    useEffect(() => {
        fetchPhieuXuats()
    }, [loadData]);

    function changeSelected(type, item) {
        setTypeSelect(type)
        setSelected(item);
    }

    return (
        <>
            <div className={css.phieu}>
                <div className={css.bar}>
                    <div className={css.buttonHeader}>
                        <div className={css.btns}
                             onClick={() => {
                                 changeSelected(ADD)
                             }}
                        >
                            <div style={{display: "flex", gap: '5px', alignItems: "center"}}>
                                <img src={CreateCardIcon} alt=""/>
                                <span>Phiếu mới </span>
                            </div>
                        </div>
                    </div>
                    <div className={css.lineBorder}></div>

                    <div className={css.list}>
                        <span className={css.titleList}>Danh sách hóa đơn</span>
                        <div className={css.listItem}>
                            {hoaDons.map(item => (
                                <div
                                    className={`${css.nameContainer} ${selected?.id === item.id && typeSelect === "HoaDon" ? css.selected : ''}`}
                                    onClick={() => {
                                        changeSelected("HoaDon", item);
                                    }}
                                >
                                    <div className={css.item} key={item.id}>
                                        <img src={LienQuanIcon} alt=""/>
                                        <span>Hóa đơn HD {item.id}</span>
                                    </div>
                                    <div className={css.itemTime}>
                                        <p>({formatDateToDDMMYYYY(item?.created_at)})</p>
                                    </div>
                                </div>

                            ))}
                        </div>
                    </div>
                    <div className={css.list}>
                        <span className={css.titleList}>Danh sách phiếu xuất </span>
                        <div className={css.listItem}>
                            {phieuXuats.map(item => (
                                <div
                                    className={`${css.nameContainer} ${selected?.id_phieu_xuat === item.id_phieu_xuat && typeSelect === "PhieuXuat" ? css.selected : ''}`}
                                    onClick={() => {
                                        changeSelected("PhieuXuat", item);
                                    }}
                                >
                                    <div className={css.item} key={item.id_phieu_xuat}>
                                        <img src={LienQuanIcon} alt=""/>
                                        <span>Phiếu xuất PXK {item.id_phieu_xuat}</span>
                                    </div>
                                    <div className={css.itemTime}>
                                        <p>({formatDateToDDMMYYYY(item?.created_at)})</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={css.note}>
                    <textarea
                        ref={textAreaRef}
                        className={`${css.auto_line_break} ${noteContent ? css.marginWithContent : css.marginDefault}`}
                        value={noteContent || ""}
                        onChange={(e) => updateNoteForChart(e)}
                        rows={1}
                        style={{width: '100%',}}
                        placeholder={"Ghi chú"}
                    />
                    </div>
                </div>
                <div className={css.contentRight}>
                    {typeSelect === ADD && <InvoicePopup2 phieuXuats={phieuXuats}/>}
                    {typeSelect === "PhieuXuat" && <PhieuXuatDetail phieu={selected}/>}
                    {typeSelect === "HoaDon" && <HoaDonDetail phieu={selected}/>}
                </div>
            </div>
        </>)
}
