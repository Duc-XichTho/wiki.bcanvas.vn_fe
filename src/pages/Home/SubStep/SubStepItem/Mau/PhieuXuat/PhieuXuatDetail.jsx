import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {Button, ConfigProvider, Table} from "antd";
import {getAllPhieuXuat, updatePhieuXuat} from "../../../../../../apis/phieuXuatService.jsx";
import {DONE, PENDING} from "../../../../../../Consts/STEP_STATUS.js";
import {SB} from "../../../../../../Consts/LIST_STEP_TYPE.js";
import {createNewDinhKhoanProData} from "../../../../../../apis/dinhKhoanProDataService.jsx";
import {
    getAllInputMau,
    getInputValueInCardByIdInput,
    getSubStepDKIdInCardByType
} from "../../../../../../generalFunction/logicMau/logicMau.js";
import {createDataDK} from "../../../../formCreate/GomPhieu/logicGom.js";
import {getDinhKhoanProDataByStepId} from "../../../../../../apis/dinhKhoanProService.jsx";
import {getAllCardInput} from "../../../../../../apis/cardInputService.jsx";
import {getAllCard} from "../../../../../../apis/cardService.jsx";
import {formatDateToDDMMYYYY} from "../../../../../../generalFunction/format.js";
import {getAllHangHoa} from "../../../../../../apis/hangHoaService.jsx";
import {updateCard} from "../../../../../../apis/cardService.jsx";
import {getDonHangByCode, getDonHangById} from "../../../../../../apis/donHangService.jsx";
import {CODE_PKT, genCode} from "../../../../../../generalFunction/genCode/genCode.js";
import PopUpUploadFile from "../../../../../../components/UploadFile/PopUpUploadFile.jsx";
import PhieuLQView from "../PhieuLQView.jsx";

export function PhieuXuatDetail({phieu: initialPhieu, gom, fetchPhieuXuats, phieuGom = false}) {
    const {idCard, idStep} = useParams();
    const {
        loadData,
        setLoadData,
        chainTemplate2Selected,
        setChainTemplate2Selected,
        currentYear
    } = useContext(MyContext);
    let phieuKT = genCode(CODE_PKT, idCard, currentYear)
    const [phieu, setPhieu] = useState(initialPhieu);
    const [card, setCard] = useState([]);
    const [hhs, setHHs] = useState([]);
    const [ selectedPhieuLQ, setSelectedPhieuLQ ] = useState(null);

    function fetchCard() {
        getAllCard().then(data => {
            setCard(data.find(item => item.id == idCard))
        })
        getAllHangHoa().then(data => {
            setHHs(data)
        })
    }

    const columns = [
        {
            title: 'Mã hàng hóa',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: 'Tên hàng hóa',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Số lượng',
            dataIndex: 'so_luong',
            key: 'so_luong',
        },
        {
            title: 'Đơn giá',
            dataIndex: 'gia_xuat',
            key: 'gia_xuat',
            render: (value) => {
                if (value === "-") return value;
                const number = parseInt(value, 10);
                return isNaN(number) ? value : number.toLocaleString('en-US');
            }
        },
        {
            title: 'Lô',
            dataIndex: 'lo_name',
            key: 'lo_name',
        },
        {
            title: 'Kho',
            dataIndex: 'kho_name',
            key: 'kho_name',
        },
        {
            title: 'Đính kèm',
            dataIndex: 'dinh_kem',
            key: 'dinh_kem',
            width:200,
            render: (value, record, index) => {

                return (
                    <PopUpUploadFile
                        id={record?.id}
                        table={`card_PXK_${idCard}`}
                        onGridReady={() => setLoadData(!loadData)}
                        card={idCard}
                    />
                )
            }
        },
    ];

    useEffect(() => {
        if (initialPhieu.don_hang) {
            getDonHangById(initialPhieu.don_hang).then(r => {
                if (r) {
                    initialPhieu.code_don_hang = r.code2
                    setPhieu(initialPhieu);
                }
            })
        } else {
            setPhieu(initialPhieu);
        }
    }, [initialPhieu]);

    useEffect(() => {
        fetchCard();
    }, []);

    const handleDuyet = async () => {
        try {
            await updatePhieuXuat({id: phieu.id_phieu_xuat, trang_thai: DONE})
            fetchPhieuXuats()

            let idSSDK = getSubStepDKIdInCardByType(card, SB);
            const dinhKhoanPro = await getDinhKhoanProDataByStepId(idSSDK, idCard);
            if (dinhKhoanPro) {
                let dks = createDataDK(phieu.danh_sach_hang_hoa);
                dks.map(async item => {
                    let sp = hhs.find(hh => hh.code == item.sanPham);
                    const newRowData = {
                        dinhKhoan_id: dinhKhoanPro.id,
                        "date": phieu.ngay_xuat,
                        "note": 'Phiếu xuất kho ' + phieu.code,
                        soChungTu: phieu.code,
                        soChungTuLQ: phieu?.code_don_hang || '',
                        phieuKT: phieuKT,
                        "tkNo": 632,
                        "tkCo": 155,
                        "soTien": item.soTien,
                        "sanPham": item.sanPham,
                        "khachHang": phieu.code_khach_hang,
                        card_id: idCard,
                        step_id: idStep,
                        "show": true,
                        phieu_lq: phieu.phieu_lq
                    };
                    await createNewDinhKhoanProData(newRowData);
                })
            }

            setLoadData(!loadData);

        } catch (error) {
            console.log(error)
        }
    }


    return (
        <div className={css.phieuDetail}>
            <h3 className={css.maPhieu}>{gom ? phieu.gom : `${phieu.code}`}</h3>
            <div className={css.infoContainer}>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Khách hàng:</div>
                    <div className={css.infoValue}>
                        {phieu?.code_khach_hang} | {phieu?.name_khach_hang}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Nhân viên:</div>
                    <div className={css.infoValue}>
                        {phieu?.code_nhan_vien} | {phieu?.name_nhan_vien}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Ngày xuất:</div>
                    <div className={css.infoValue}>{(phieu?.ngay_xuat.split("-").reverse().join("-"))}</div>
                </div>
                <div className={css.infoItem}>
                    {!gom && <>
                        <div className={css.infoLabel}>Đơn hàng:</div>
                        <div className={css.infoValue}>
                            <button className={'btn-view-phieu'} onClick={()=> setSelectedPhieuLQ(phieu?.code_don_hang)}>{phieu?.code_don_hang}</button>
                        </div>
                    </>}
                    {gom && <>
                        <div className={css.infoLabel}>Phiếu xuất:</div>
                        <div className={css.infoValue}>{phieu?.phieus.join(', ')}</div>
                    </>}
                </div>
                {phieu?.phieu_lq &&
                    <div className={css.infoItem}>
                        <div className={css.infoLabel}>
                            Phiếu liên quan
                        </div>
                        <div className={css.infoValue}>
                            {phieu.phieu_lq.map(ph => (
                                <button className={'btn-view-phieu'} onClick={()=> setSelectedPhieuLQ(ph)}>{ph}</button>
                            ))}
                        </div>
                        {selectedPhieuLQ && <PhieuLQView selectedPhieuLQ={selectedPhieuLQ} setSelectedPhieuLQ={setSelectedPhieuLQ}/> }
                    </div>
                }
            </div>
            <div style={{width: '100%', display: 'block'}}>
                <Table
                    dataSource={phieu.danh_sach_hang_hoa?.length > 0 ? phieu.danh_sach_hang_hoa : []}
                    columns={columns}
                    pagination={false}
                />
                {!phieuGom && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            justifyContent: 'right',
                            marginTop: '15px',
                        }}
                    >
                        <ConfigProvider>
                            <Button
                                type={phieu.trang_thai === null ? 'primary' : 'default'}
                                onClick={() => handleDuyet()}
                                disabled={phieu.trang_thai === null ? false : true}
                            >
                                {phieu.trang_thai === null ? 'Duyệt phiếu' : 'Đã duyệt'}
                            </Button>
                        </ConfigProvider>
                    </div>
                )}
            </div>
        </div>
    );
}
