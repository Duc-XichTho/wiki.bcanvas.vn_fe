import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {formatDateISO} from "../../../../../../generalFunction/format.js";
import {Table} from "antd";
import {getDetailPhieuGiaoHangByPhieuGiaoHangIdService} from "../../../../../../apis/detailPhieuGiaoHangService.jsx";

export function PhieuGiaoHangDetail({phieu}) {
    const {idCard} = useParams();
    const {loadData, setLoadData} = useContext(MyContext);
    const [selected, setSelected] = useState(null);
    const [dataDetail, setDataDetail] = useState([]);


    useEffect(() => {
        
        setDataDetail(phieu?.danh_sach_hang_hoa)
    }, [phieu]);
    const columns = [
        {
            title: 'Code',
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
    ];
    return (<>
        <div className={css.phieuDetail}>
            <h3 className={css.maPhieu}>{phieu?.code}</h3>
            <div className={css.infoContainer}>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Người giao hàng
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.nguoi_giao_hang}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Người nhận hàng
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.nguoi_nhan_hang}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Địa chỉ
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.dia_chi}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Thời gian nhận
                    </div>
                    <div className={css.infoValue}>
                        {formatDateISO(phieu?.thoi_gian_nhan)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Danh sách phiếu xuất
                    </div>
                    <div className={css.infoValue}>
                        {(phieu?.list_id_phieu_xuat?.length > 0) &&
                        phieu?.list_id_phieu_xuat?.map(e=>('PXK '+e+ ' | '))
                        }
                    </div>
                </div>
            </div>
            <div style={{width: '100%', display: "block"}}>
                <Table bordered dataSource={dataDetail?.length > 0 ? dataDetail : []} columns={columns} pagination={false}/>
            </div>
        </div>


    </>)
}
