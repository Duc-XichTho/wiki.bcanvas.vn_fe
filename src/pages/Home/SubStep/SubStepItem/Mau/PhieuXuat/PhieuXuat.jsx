import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useRef, useState} from "react";
import TaoPhieuXuat from "../../../../formCreate/TaoPhieuXuat.jsx";
import {MyContext} from "../../../../../../MyContext.jsx";
import {getFullPhieuXuat} from "../../../../../../apis/phieuNhapXuatService.jsx";
import {ADD} from "../PHIEU.js";
import {PhieuXuatDetail} from "./PhieuXuatDetail.jsx";
import {CreateCardIcon, LienQuanIcon, SettingIcon} from "../../../../../../icon/IconSVG.js";
import {formatDateToDDMMYYYY} from "../../../../../../generalFunction/format.js";
import {PhieuGom} from "./PhieuGom.jsx";
import {gomPX} from "../../../../../../generalFunction/logicMau/logicGom.js";
import {toast} from "react-toastify";
import {getNoteChartData, updateNoteChart} from "../../../../../../apis/noteChartService.jsx";
import {Popover} from "antd";
import {Menu} from "antd";
import {ViewPhieuGom} from "./ViewPhieuGom.jsx";

export function PhieuXuat() {
    const {id, idCard, idStep} = useParams();
    const {loadData, setLoadData} = useContext(MyContext);
    const [phieuXuats, setPhieuXuats] = useState([]);
    const [phieuGoms, setPhieuGoms] = useState([]);
    const [selected, setSelected] = useState(null);
    const [selectedG, setSelectedG] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
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
            const note = listNoteChart.find(note => note.chartTitle == 'PhieuXuat');
            setNoteId(note?.id);
            return note?.content;
        } else {
            return 'Dữ liệu biểu đồ không hợp lệ';
        }
    };
    useEffect(() => {
        getNoteChartData('PhieuXuat').then((data) => {
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
        getFullPhieuXuat().then(data => {
            setPhieuXuats(data.filter(item => item.don_hang == 'DH|' + idCard));
            let phieuGom = gomPX(data.filter(item => item.id_card_create == idCard && item.gom))
            setPhieuGoms(phieuGom);
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
        setVisible(false);
    }

    const [visible, setVisible] = useState(false);
    const [openViewPhieuGom, setOpenViewPhieuGom] = useState(false);

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

    return (
        <>
            <div className={css.phieu}>
                <div className={css.bar}>
                    <div className={css.buttonHeader} >
                        <div className={css.btns}
                             onClick={() => {
                                 changeSelected(ADD)
                             }}
                        >
                            <div style={{display: "flex", gap: '5px', alignItems: "center"}}>
                                <img src={CreateCardIcon} alt=""/>
                                <span>Phiếu mới</span>
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
                    <div className={css.lineBorder} ></div>
                    <div className={css.list}>
                        <span className={css.titleList}>Danh sách phiếu xuất </span>
                        <div className={css.listItem}>
                            {phieuXuats.map(item => (
                                <div
                                    className={`${css.nameContainer} ${selected?.id_phieu_xuat === item.id_phieu_xuat ? css.selected : ''}`}
                                    onClick={() => {
                                        changeSelected(item)
                                    }}>
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
                    {selected === ADD && <TaoPhieuXuat/>}
                    {selected && selected !== ADD && <PhieuXuatDetail phieu={selected}/>}
                    {selectedG && selectedG !== ADD && <PhieuXuatDetail phieu={selectedG} gom={true}/>}
                </div>
                {isOpen && <PhieuGom isOpen={isOpen} setIsOpen={setIsOpen}></PhieuGom>}
                {openViewPhieuGom && <ViewPhieuGom isOpen={openViewPhieuGom} setIsOpen={setOpenViewPhieuGom} phieuGoms={phieuGoms}/>}
            </div>
        </>)
}


