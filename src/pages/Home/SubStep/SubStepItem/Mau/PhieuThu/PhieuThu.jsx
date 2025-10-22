import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useRef, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {ADD} from "../PHIEU.js";
import {PhieuThuDetail} from "./PhieuThuDetail.jsx";
import {getPhieuThuByCardId} from "../../../../../../apis/phieuThuService.jsx";
import TaoPhieuThu from "../../../../formCreate/TaoPhieuThu.jsx";
import {CreateCardIcon, LienQuanIcon, SettingIcon} from "../../../../../../icon/IconSVG.js";
import {HoaDonDetail} from "../HoaDon/HoaDonDetail.jsx";
import {getAllHoaDon} from "../../../../../../apis/hoaDonService.jsx";
import {Menu, Popover} from "antd";
import {PhieuGom} from "./PhieuGom.jsx";
import {formatDateToDDMMYYYY} from "../../../../../../generalFunction/format.js";
import {getNoteChartData, updateNoteChart} from "../../../../../../apis/noteChartService.jsx";
import {toast} from "react-toastify";

export function PhieuThu() {
    const {id, idCard, idStep} = useParams();
    const {loadData, setLoadData} = useContext(MyContext);
    const [phieuThus, setPhieuThus] = useState([]);
    const [selectedPGH, setSelectedPGH] = useState(null);
    const [selectedPX, setSelectedPX] = useState(null);
    const [hoaDons, setHoaDons] = useState([]);
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

    const [visible, setVisible] = useState(false);
    const [openViewPhieuGom, setOpenViewPhieuGom] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handlePhieuGom = (value) => {
        if (value == 'add') {
            setIsOpen(true)
        } else if (value == 'view') {
            setOpenViewPhieuGom(true)
        }
        setVisible(false);

    };
    const content = (
        <Menu className={css.customMenu}>
            <Menu.Item onClick={() => handlePhieuGom("add")}>Thêm phiếu gom</Menu.Item>
            <Menu.Item onClick={() => handlePhieuGom("view")}>Xem phiếu gom</Menu.Item>
        </Menu>
    );

    return (<>
        <div className={css.phieu}>
            <div className={css.bar}>
                <div className={css.buttonHeader}>
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
                    <div style={{display: "flex", alignItems: "center"}}>
                        <Popover
                            content={content}
                            trigger="click"
                            visible={visible}
                            onVisibleChange={(val) => setVisible(val)}
                            placement="right"
                        >
                            <img src={SettingIcon} alt="" style={{cursor: "pointer"}}/>
                        </Popover>
                    </div>
                </div>
                <div className={css.lineBorder}></div>

                <div className={css.list}>
                    <span className={css.titleList}>Danh sách phiếu thu </span>
                    <div className={css.listItem}>
                        {phieuThus.map(item => (
                            // <div className={css.item}
                            //      key={item.id}
                            //      onClick={() => {changeSelected(item)}}>
                            //     PGH {item.id}
                            // </div>

                            <div
                                className={`${css.nameContainer} ${selectedPGH?.id_phieu_thu === item.id_phieu_thu ? css.selected : ''}`}
                                onClick={() => {
                                    changeSelectedPGH(item)
                                }}>
                                <div className={css.item} key={item.id}>
                                    <img src={LienQuanIcon} alt=""/>
                                    <span>Phiếu thu PT {item.id_phieu_thu}</span>
                                </div>
                                <div className={css.itemTime}>
                                    <p>({formatDateToDDMMYYYY(item?.created_at)})</p>
                                </div>
                            </div>

                        ))}
                    </div>

                    <div className={css.list}>
                        <span className={css.titleList}>Danh sách hóa đơn</span>
                        <div className={css.listItem}>
                            {hoaDons.map(item => (
                                <div
                                    className={`${css.nameContainer} ${selectedPX?.id === item.id ? css.selected : ''}`}
                                    onClick={() => {
                                        changeSelectedPX(item)
                                    }}>
                                    <div className={css.item} key={item.id}>
                                        <img src={LienQuanIcon} alt=""/>
                                        <span>Hóa đơn HĐ {item.id}</span>
                                    </div>
                                    <div className={css.itemTime}>
                                        <p>({formatDateToDDMMYYYY(item?.created_at)})</p>
                                    </div>
                                </div>

                            ))}
                        </div>

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
                {selectedPGH === ADD && <TaoPhieuThu/>}
                {selectedPGH && selectedPGH !== ADD && <PhieuThuDetail phieu={selectedPGH}/>}
                {selectedPX && selectedPX !== ADD && <HoaDonDetail phieu={selectedPX}/>}
            </div>
            {isOpen && <PhieuGom isOpen={isOpen} setIsOpen={setIsOpen}></PhieuGom>}

        </div>
    </>)
}
