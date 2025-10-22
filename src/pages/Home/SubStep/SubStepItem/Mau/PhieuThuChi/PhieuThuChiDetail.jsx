import css from './../Mau.module.css'
import {useParams} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import {MyContext} from "../../../../../../MyContext.jsx";
import {formatDateISO, formatMoney} from "../../../../../../generalFunction/format.js";
import {Table} from "antd";
import {getHoaDonByCardId} from "../../../../../../apis/hoaDonService.jsx";

export function PhieuThuChiDetail({phieu}) {
    const {idCard} = useParams();
    const {loadData, setLoadData} = useContext(MyContext);
    const [selected, setSelected] = useState(null);
    const [dataDetail, setDataDetail] = useState([]);


    useEffect(() => {


        phieu.list_hd=[]
        getHoaDonByCardId(idCard).then(e=>{

            e.forEach(hd=>{
                hd?.list_id_phieu_thu?.map(pt =>{
                    if(pt == phieu.id_phieu_thu){
                        phieu.list_hd.push(`HD ${hd.id_hoa_don}`)
                    }
                })
            })
            setDataDetail(phieu?.danh_sach_hang_hoa)
        })

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

        {
            title: 'Chiết khấu',
            dataIndex: 'chiet_khau',
            key: 'chiet_khau',
        },

        {
            title: 'Đơn giá',
            dataIndex: 'don_gia',
            key: 'don_gia',
        },

        {
            title: 'Tổng tiền',
            dataIndex: 'tong_tien',
            key: 'tong_tien',
        },

        {
            title: 'Thuế GTGT',
            dataIndex: 'thue_gtgt',
            key: 'thue_gtgt',
        },

    ];
    return (<>
        <div className={css.phieuDetail}>
            <h3 className={css.maPhieu}>{phieu?.id_hoa_don}</h3>
            <div className={css.infoContainer}>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Số phiếu
                    </div>
                    <div className={css.infoValue}>
                       PT {phieu?.id_phieu_thu}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                       Ngày thu
                    </div>
                    <div className={css.infoValue}>
                         {formatDateISO(phieu?.ngay_thu)}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Hình thức
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.hinh_thuc}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Đơn hàng liên quan
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.don_hang_lien_quan}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Người chuyển tiền
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.nguoi_chuyen_tien}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Số tiền
                    </div>
                    <div className={css.infoValue}>
                        {formatMoney(phieu?.so_tien) }
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Lý do
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.ly_do}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Thu công nợ
                    </div>
                    <div className={css.infoValue}>
                        {phieu?.thu_cong_no}
                    </div>
                </div>
                <div className={css.infoItem}>
                    <div className={css.infoLabel}>
                        Danh sách hóa đơn
                    </div>
                    <div className={css.infoValue}>
                        {phieu.list_hd?.length>0? phieu.list_hd.map(e=> e): '-'}
                    </div>
                </div>
            </div>
            <div style={{width: '100%', display: "block"}}>
                <Table bordered dataSource={dataDetail?.length > 0 ? dataDetail : []} columns={columns}/>
            </div>
        </div>


    </>)
}
