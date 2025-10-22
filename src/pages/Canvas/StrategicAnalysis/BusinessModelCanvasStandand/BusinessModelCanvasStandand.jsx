import { useState, useEffect } from 'react';
import css from './BusinessModelCanvasStandand.module.css';
// Xóa import không cần thiết
// import { getFullFileNotePad } from "../../../../apis/fileNotePadService.jsx";
// Import TiptapChild2
import TiptapChild2 from '../ComponentWarehouse/TiptapChild2.jsx';
import { Switch } from 'antd';

const BusinessModelCanvasStandand = () => {


	return (
		<div className={css.main}>
			<div className={css.header}>
				<span>Business Model Canvas (Tiêu chuẩn)</span>
			</div>
			<div className={css.content}>
				<div className={css.main2}>
					<div className={css.item}>
						<div className={css.sectionTitle}>Đối tác chính</div>
						{/* Sử dụng TiptapChild2 */}
						<TiptapChild2
							tableName={'BMC_DOI_TAC_CHINH'}
						/>
					</div>
					<div className={css.item}>
						<div className={css.sectionTitle}>Hoạt động chính</div>
						{/* Sử dụng TiptapChild2 */}
						<TiptapChild2
							tableName={'BMC_HOAT_DONG_CHINH'}
						/>
					</div>
					<div className={css.item}>
						<div className={css.sectionTitle}>Nguồn lực chính</div>
						{/* Sử dụng TiptapChild2 */}
						<TiptapChild2
							tableName={'BMC_NGUON_LUC_CHINH'}
						/>
					</div>
					<div className={css.item}>
						<div className={css.sectionTitle}>Giá trị cung cấp</div>
						{/* Sử dụng TiptapChild2 */}
						<TiptapChild2
							tableName={'BMC_GIA_TRI_CUNG_CAP'}
						/>
					</div>
					<div className={css.item}>
						<div className={css.sectionTitle}>Quan hệ khách hàng</div>
						{/* Sử dụng TiptapChild2 */}
						<TiptapChild2
							tableName={'BMC_QUAN_HE_KHACH_HANG'}
						/>
					</div>
					<div className={css.item}>
						<div className={css.sectionTitle}>Kênh bán hàng</div>
						{/* Sử dụng TiptapChild2 */}
						<TiptapChild2
							tableName={'BMC_KENH_BAN_HANG'}
						/>
					</div>
					<div className={css.item}>
						<div className={css.sectionTitle}>Phân khúc khách hàng</div>
						{/* Sử dụng TiptapChild2 */}
						<TiptapChild2
							tableName={'BMC_PHAN_KHUC_KHACH_HANG'}
						/>
					</div>
					<div className={css.item}>
						<div className={css.sectionTitle}>Cấu trúc chi phí</div>
						{/* Sử dụng TiptapChild2 */}
						<TiptapChild2
							tableName={'BMC_CAU_TRUC_CHI_PHI'}
						/>
					</div>
					<div className={css.item}>
						<div className={css.sectionTitle}>Dòng doanh thu</div>
						{/* Sử dụng TiptapChild2 */}
						<TiptapChild2
							tableName={'BMC_DONG_DOANH_THU'}
						/>
					</div>
				</div>

			</div>
		</div>
	);
};

export default BusinessModelCanvasStandand;
