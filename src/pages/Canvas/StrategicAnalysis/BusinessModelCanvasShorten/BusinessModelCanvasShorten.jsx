import { useState, useEffect } from 'react';
import css from './BusinessModelCanvasShorten.module.css';
// Bỏ import getFullFileNotePad nếu không dùng nữa
// import { getFullFileNotePad } from "../../../../apis/fileNotePadService.jsx";
import TiptapChild2 from '../ComponentWarehouse/TiptapChild2.jsx';

const BusinessModelCanvasShorten = () => {
    // Bỏ state elements và fetchData nếu không cần thiết nữa
    // const [elements, setElements] = useState({});
    //
    // const fetchData = async () => {
    //     try {
    //         const data = await getFullFileNotePad();
    //         // Sửa lỗi thiếu giá trị và đảm bảo tên đúng
    //         const businessElements = {
    //             giaTriCungCap: data.find(element => element.name === 'BMC_SHORT_GIA_TRI_CUNG_CAP'), // Thêm giá trị
    //             phanKhucKhachHang: data.find(element => element.name === 'BMC_SHORT_PHAN_KHUC_KHACH_HANG'),
    //             kenhPhanPhoi: data.find(element => element.name === 'BMC_SHORT_KENH_PHAN_PHOI'),
    //             hoatDongChinh: data.find(element => element.name === 'BMC_SHORT_HOAT_DONG_CHINH'),
    //             dongDoanhThuChiPhi: data.find(element => element.name === 'BMC_SHORT_DONG_DOANH_THU_CHI_PHI'),
    //         };
    //         setElements(businessElements);
    //     } catch (error) {
    //         console.log("Lỗi khi lấy dữ liệu:", error);
    //     }
    // };
    //
    // useEffect(() => {
    //     fetchData();
    // }, []);

    return (
        <div className={css.main}>
            <div className={css.header}>
                <span>Business Model Canvas (Rút gọn)</span>
            </div>
            <div className={css.content}>
                <div className={css.gridItem}>
                    <div className={css.sectionTitle}>Giá trị cung cấp</div>
                    <div className={css.scrollableContent}>
                        <TiptapChild2
                           tableName={'BMC_SHORT_GIA_TRI_CUNG_CAP'} // Chỉ truyền tableName
                        />
                    </div>
                </div>
                <div className={css.gridItem}>
                    <div className={css.sectionTitle}>Phân khúc khách hàng</div>
                    <div className={css.scrollableContent}>
                        <TiptapChild2
                            tableName={'BMC_SHORT_PHAN_KHUC_KHACH_HANG'} // Chỉ truyền tableName
                        />
                    </div>
                </div>
                <div className={css.gridItem}>
                    <div className={css.sectionTitle}>Kênh phân phối</div>
                    <div className={css.scrollableContent}>
                        <TiptapChild2
                            tableName={'BMC_SHORT_KENH_PHAN_PHOI'} // Chỉ truyền tableName
                        />
                    </div>
                </div>
                <div className={css.gridItem}>
                    <div className={css.sectionTitle}>Hoạt động chính</div>
                    <div className={css.scrollableContent}>
                        <TiptapChild2
                            tableName={'BMC_SHORT_HOAT_DONG_CHINH'} // Chỉ truyền tableName
                        />
                    </div>
                </div>
                {/* Sửa lại cấu trúc grid, ô này phải nằm ngoài cùng */}
                <div className={css.bottomSection}> {/* Sử dụng bottomSection cho ô cuối */}
                    <div className={css.sectionTitle}>Dòng doanh thu & chi phí</div>
                    <div className={css.scrollableContent}>
                        <TiptapChild2
                            tableName={'BMC_SHORT_DONG_DOANH_THU_CHI_PHI'} // Chỉ truyền tableName
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessModelCanvasShorten;