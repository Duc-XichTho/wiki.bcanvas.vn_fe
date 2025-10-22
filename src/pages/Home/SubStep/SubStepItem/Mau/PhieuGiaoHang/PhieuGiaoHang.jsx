import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useRef, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {ADD} from "../PHIEU.js";
import {PhieuGiaoHangDetail} from "./PhieuGiaoHangDetail.jsx";
import {getAllPhieuGiaoHang, getPhieuGiaoHangByCardId} from "../../../../../../apis/phieuGiaoHangService.jsx";
import TaoPhieuGiaoHang from "../../../../formCreate/TaoPhieuGiaoHang.jsx";
import {CreateCardIcon, LienQuanIcon} from "../../../../../../icon/IconSVG.js";
import {formatDateISO, formatDateToDDMMYYYY} from "../../../../../../generalFunction/format.js";
import {PhieuXuatDetail} from "../PhieuXuat/PhieuXuatDetail.jsx";
import {getFullPhieuXuat} from "../../../../../../apis/phieuNhapXuatService.jsx";
import {getPhieuXuatByCardId} from "../../../../../../apis/phieuXuatService.jsx";
import {getNoteChartData, updateNoteChart} from "../../../../../../apis/noteChartService.jsx";
import {toast} from "react-toastify";

export function PhieuGiaoHang() {
    const {id, idCard, idStep} = useParams();
    const {loadData, setLoadData} = useContext(MyContext);
    const [phieuGiaoHangs, setPhieuGiaoHangs] = useState([]);
    const [selectedPGH, setSelectedPGH] = useState(null);
    const [selectedPX, setSelectedPX] = useState(null);
    const [phieuXuats, setPhieuXuats] = useState([]);
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
            const note = listNoteChart.find(note => note.chartTitle == 'PhieuGiaoHang');
            setNoteId(note?.id);
            return note?.content;
        } else {
            return 'Dữ liệu biểu đồ không hợp lệ';
        }
    };
    useEffect(() => {
        getNoteChartData('PhieuGiaoHang').then((data) => {
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

    function fetchPhieuGiaoHangs() {
        getPhieuGiaoHangByCardId(idCard).then(data => {
            setPhieuGiaoHangs(data);
        })
    }

    function fetchPhieuXuats() {
        getPhieuXuatByCardId(idCard).then(e => {
            setPhieuXuats(e)
        })
    }


    useEffect(() => {
        fetchPhieuGiaoHangs()
        fetchPhieuXuats()
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
                <div className={css.buttonHeader} >
                    <div className={css.btns}
                         onClick={() => {
                             changeSelectedPGH(ADD)
                         }}
                    >
                        <div style={{display: "flex", gap: '5px', alignItems: "center"}}>
                            <img src={CreateCardIcon} alt=""/>
                            <span>Phiếu mới </span>
                        </div>
                    </div>

                </div>
                <div className={css.lineBorder} ></div>

                <div className={css.list}>
                    <span className={css.titleList}>Danh sách phiếu giao hàng </span>
                    <div className={css.listItem}>
                        {phieuGiaoHangs.map(item => (
                            <div className={`${css.nameContainer} ${selectedPGH?.id === item.id ? css.selected : ''}`}
                                 onClick={() => {
                                     changeSelectedPGH(item)
                                 }}>
                                <div className={css.item} key={item.id}>
                                    <img src={LienQuanIcon} alt=""/>
                                    <span>Phiếu giao hàng PGH {item.id}</span>
                                </div>
                                <div className={css.itemTime}>
                                    <p>({formatDateToDDMMYYYY(item?.created_at)})</p>
                                </div>
                            </div>

                        ))}
                    </div>
                </div>

                <div className={css.list}>
                    <span className={css.titleList}>Phiếu nguồn (bước trước) </span>
                    <div className={css.listItem}>
                        {phieuXuats.map(item => (
                            <div
                                className={`${css.nameContainer} ${selectedPX?.id_phieu_xuat === item.id_phieu_xuat ? css.selected : ''}`}
                                onClick={() => {
                                    changeSelectedPX(item)
                                }}>
                                <div className={css.item} key={item.id_phieu_xuat}>
                                    <img src={LienQuanIcon} alt=""/>
                                    <span>Phiếu xuất PXK {item.id_phieu_xuat}</span>
                                </div>
                                <div className={css.itemTime}>
                                    <p>({formatDateToDDMMYYYY(item?.created_at)})</p>
                                    <span>{item.phieu_giao_hang.length > 0 ? item.phieu_giao_hang : '-'}</span>
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
                {selectedPGH === ADD && <TaoPhieuGiaoHang/>}
                {selectedPGH && selectedPGH !== ADD && <PhieuGiaoHangDetail phieu={selectedPGH}/>}
                {selectedPX && selectedPX !== ADD && <PhieuXuatDetail phieu={selectedPX}/>}
            </div>
        </div>
    </>)
}
