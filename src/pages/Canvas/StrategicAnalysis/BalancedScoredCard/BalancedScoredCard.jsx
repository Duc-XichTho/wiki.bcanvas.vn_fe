import { useState, useEffect } from 'react';
import css from './BalancedScoredCard.module.css';
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
				<span>BALANCED SCORED CARD - THẺ ĐIỂM CÂN BẰNG</span>
			</div>
			<div className={css.content}>
				<div className={css.gridItem}>
					<div className={css.sectionTitle}>TÀI CHÍNH</div>
					<div className={css.scrollableContent}>
						<TiptapChild2
							tableName={'BSC_TAI_CHINH'} // Chỉ truyền tableName
						/>
					</div>
				</div>
				<div className={css.gridItem}>
					<div className={css.sectionTitle}>KHÁCH HÀNG</div>
					<div className={css.scrollableContent}>
						<TiptapChild2
							tableName={'BSC_KHACH_HANG'} // Chỉ truyền tableName
						/>
					</div>
				</div>
				<div className={css.gridItem}>
					<div className={css.sectionTitle}>QUY TRÌNH - VẬN HÀNH</div>
					<div className={css.scrollableContent}>
						<TiptapChild2
							tableName={'BSC_QUY_TRINH_VAN_HANH'} // Chỉ truyền tableName
						/>
					</div>
				</div>
				<div className={css.gridItem}>
					<div className={css.sectionTitle}>PHÁT TRIỂN - ĐÀO TẠO</div>
					<div className={css.scrollableContent}>
						<TiptapChild2
							tableName={'BSC_PHAT_TRIEN_DAO_TAO]'} // Chỉ truyền tableName
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default BusinessModelCanvasShorten;