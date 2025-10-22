import css from './../Mau.module.css'
import React, {useEffect, useState} from "react";
import {ADD} from "../PHIEU.js";
import {LienQuanIcon} from "../../../../../../icon/IconSVG.js";
import {Modal} from "antd";
import {getFullPhieuNhap, getFullPhieuXuat} from "../../../../../../apis/phieuNhapXuatService.jsx";
import {gomPN, gomPX} from "../../../../../../generalFunction/logicMau/logicGom.js";
import {ViewPGPhieuXuatDetail} from "./ViewPGPhieuXuatDetail.jsx";
import {ViewPGPhieuNhapDetail} from "./ViewPGPhieuNhapDetail.jsx";

export function ViewPhieuGom({name, isOpen, setIsOpen,}) {
    const [selectedG, setSelectedG] = useState(null);
    const [phieuGoms, setPhieuGoms] = useState(null);

    function changeSelectedG(select) {
        setSelectedG(select)
    }

    function fetchPhieuXuats() {
        getFullPhieuXuat().then(data => {
            let phieuGom = gomPX(data.filter(item => item.gom))
            setPhieuGoms(phieuGom);
        })
    }

    function fetchAllPhieuNhap() {
        try {
            getFullPhieuNhap().then(data => {
                console.log(data)
                let phieuGom = gomPN(data.filter(item => item.gom))
                setPhieuGoms(phieuGom);
            })
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error)
        }
    }

    useEffect(() => {
        if (name == 'Xuất kho') {
            fetchPhieuXuats()
        } else if (name == "Nhập kho") {
            fetchAllPhieuNhap()
        }
    }, [name]);

    return (
        <>
            <Modal
                open={isOpen}
                title={'Danh sách phiếu gom'}
                onCancel={() => {
                    setIsOpen(false)
                }}
                footer={null}
                centered
                width={1200}

            >
                <div style={{display: "flex", height: '80vh', overflowY: 'auto', gap: '20px',}}>
                    <div className={css.bar}>
                        <div className={css.list} style={{marginTop: '10px'}}>
                            {/*<span className={css.titleList}>Danh sách phiếu gom </span>*/}
                            <div className={css.listItem}>
                                {phieuGoms?.map(item => (
                                    <div
                                        className={`${css.nameContainer} ${selectedG?.gom == item.gom ? css.selected : ''}`}
                                        onClick={() => {
                                            changeSelectedG(item)
                                        }}>
                                        <div className={css.item} key={item.gom}>
                                            <img src={LienQuanIcon} alt=""/>
                                            <span>PG | {item.gom}</span>
                                        </div>
                                        <div className={css.itemTime}>
                                            {/*<p>({formatDateToDDMMYYYY(item?.created_at)})</p>*/}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className={css.contentRight}>
                        {selectedG && selectedG !== ADD && name == "Xuất kho" &&  <ViewPGPhieuXuatDetail phieu={selectedG} type={name}/>}
                        {selectedG && selectedG !== ADD && name == "Nhập kho" &&  <ViewPGPhieuNhapDetail phieu={selectedG} type={name}/>}
                    </div>
                </div>
            </Modal>

        </>)
}


