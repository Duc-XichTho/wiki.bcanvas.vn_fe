import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import React, {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {Button, ConfigProvider, Table} from "antd";
import {getAllDieuChuyenKho, updateDieuChuyenKho} from "../../../../../../apis/dieuChuyenKhoService.jsx";
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
import {getAllCard, updateCard} from "../../../../../../apis/cardService.jsx";
import {formatDateISO, formatDateToDDMMYYYY} from "../../../../../../generalFunction/format.js";
import {getNhanVienDataById} from "../../../../../../apis/nhanVienService.jsx";
import {updatePhieuXuat} from "../../../../../../apis/phieuXuatService.jsx";
import PopUpUploadFile from "../../../../../../components/UploadFile/PopUpUploadFile.jsx";

export function DieuChuyenKhoDetail({ initialPhieu , gom, fetchDCK}) {
    const {idCard, idStep} = useParams();
    const {loadData, setLoadData, chainTemplate2Selected, setChainTemplate2Selected} = useContext(MyContext);
    const [phieu, setPhieu] = useState(null);
    const [card, setCard] = useState([]);
    const [detailPhieu, setDetailPhieu] = useState([]);

    function fetchCard() {
        getAllCard().then(data => {
            setCard(data.find(item => item.id == idCard))
        })
    }




    const columns = [
        {
            title: 'Hàng hóa',
            dataIndex: 'hh_full',
            key: 'hh_full',
        },
        {
            title: 'Số lượng',
            dataIndex: 'so_luong',
            key: 'so_luong',
            render: (value) => value?.toLocaleString('en-US')
        },
        {
            title: 'Đính kèm',
            dataIndex: 'dinh_kem',
            key: 'dinh_kem',
            width:200,
            render: (value, record, index) => {
                
                return (
                    <PopUpUploadFile
                        id={record?.hh_code}
                        table={`card_DCK_${idCard}`}
                        onGridReady={() => setLoadData(!loadData)}
                        card={idCard}
                    />
                )
            }
        },
        // {
        //     title: 'Đơn giá',
        //     dataIndex: 'gia_nhap',
        //     key: 'gia_nhap',
        //     render: (value) => {
        //         return parseInt(value).toLocaleString('en-US')
        //     }
        // },
    ];

    useEffect(() => {
        setPhieu(initialPhieu);
        
        setDetailPhieu(initialPhieu?.detail?.phieuNhapRecord[[0]])
    }, [initialPhieu]);

    useEffect(() => {
        fetchCard();
    }, []);

    async function handleChangeStatus(status) {
        let data = await getAllDieuChuyenKho()
        let dck = data.find((item) => item.id === phieu.dieuChuyenKhoRecord.id);
        if (dck) {
            await updateCard({ id: idCard, trang_thai: 'Hoàn thành' })
            setChainTemplate2Selected({
                type: 'chain2',
                data: {
                    ...chainTemplate2Selected.data,
                    selectedTemplate: {
                        ...chainTemplate2Selected.data.selectedTemplate,
                        cards: chainTemplate2Selected.data.selectedTemplate.cards.map((item) => item.id == idCard ? { ...item, trang_thai: 'Hoàn thành' } : item)
                    }
                }
            })
            fetchDCK()
        }
    }
    const handleDuyet = async () => {
        try {
            const dataUpdate = {
                ...phieu?.dieuChuyenKhoRecord,
                trang_thai: 'done'
            }
            await updateDieuChuyenKho(dataUpdate)
            fetchDCK()
            await updateCard({ id: idCard, trang_thai: 'Hoàn thành' })
            setChainTemplate2Selected({
                type: 'chain2',
                data: {
                    ...chainTemplate2Selected.data,
                    selectedTemplate: {
                        ...chainTemplate2Selected.data.selectedTemplate,
                        cards: chainTemplate2Selected.data.selectedTemplate.cards.map((item) => item.id == idCard ? { ...item, trang_thai: 'Hoàn thành' } : item)
                    }
                }
            })
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className={css.phieuDetail}>
            <h3 className={css.maPhieu}>{`${phieu?.dieuChuyenKhoRecord?.code}`}</h3>
            <div className={css.infoContainer}>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>Ngày điều chuyển:</div>
                    <div className={css.infoValue}>
                        <div className={css.infoValue}>{formatDateISO(phieu?.dieuChuyenKhoRecord?.ngay)}</div>
                    </div>
                </div>
                <div className={css.infoItem}>
                <div className={css.infoLabel}>Nhân viên:</div>
                    <div className={css.infoValue}>
                        {detailPhieu?.nhan_vien?.code} | {detailPhieu?.nhan_vien?.name}
                    </div>
                </div>

                <div className={css.infoItem}>
                <div className={css.infoLabel}>Kho nguồn:</div>
                    <div className={css.infoValue}>
                        {phieu?.dieuChuyenKhoRecord?.kho_nguon.code} | {phieu?.dieuChuyenKhoRecord?.kho_nguon.name}
                    </div>
                </div>

                <div className={css.infoItem}>
                <div className={css.infoLabel}>Kho đích:</div>
                    <div className={css.infoValue}>
                        {phieu?.dieuChuyenKhoRecord?.kho_dich.code} | {phieu?.dieuChuyenKhoRecord?.kho_dich.name}
                    </div>
                </div>

                {/*<div className={css.infoItem}>*/}
                {/*    {!gom && <>*/}
                {/*        <div className={css.infoLabel}>Đơn hàng:</div>*/}
                {/*        <div className={css.infoValue}>{phieu?.don_hang}</div>*/}
                {/*    </>}*/}
                {/*    {gom && <>*/}
                {/*        <div className={css.infoLabel}>Phiếu xuất:</div>*/}
                {/*        <div className={css.infoValue}>{phieu?.phieus.join(', ')}</div>*/}
                {/*    </>}*/}
                {/*</div>*/}
            </div>
            <div style={{width: '100%', display: 'block'}}>
                <Table
                    dataSource={detailPhieu?.danh_sach_hang_hoa?.length > 0 ? detailPhieu?.danh_sach_hang_hoa : []}
                    columns={columns}
                    pagination={false}
                />
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10dck',
                        justifyContent: 'right',
                        marginTop: '15px',
                    }}
                >
                    <ConfigProvider>
                            <Button
                                type={phieu?.dieuChuyenKhoRecord?.trang_thai === null ? 'primary' : 'default'}
                                onClick={() => handleDuyet()}
                                disabled={phieu?.dieuChuyenKhoRecord?.trang_thai === null ? false : true}
                            >
                                {phieu?.dieuChuyenKhoRecord?.trang_thai === null ? 'Duyệt phiếu' : 'Đã duyệt'}
                            </Button>

                    </ConfigProvider>
                </div>
            </div>
        </div>
    );
}
