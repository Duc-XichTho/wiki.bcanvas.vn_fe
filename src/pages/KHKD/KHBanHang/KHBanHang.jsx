import React, { useState } from 'react';
import { Button } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import css from '../KHKD.module.css';
import { convertAndSumKHBH } from './logicKHBanHang.js';
import { formatMoney } from '../../../generalFunction/format.js';
import AG_GRID_LOCALE_VN from '../../Home/AgridTable/locale.jsx';
import KHKDChuKyModal from '../KHKDChuKy/KHKDChuKyModal.jsx';
import KHKDSettingLaiModal from '../KHKDChuKy/KHKDSettingLaiModal.jsx';

export function KHBanHang({fetchKHTH , dataTT }) {
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isModalSettingLai, setIsModalSettingLai] = useState(false);

	const columnDefs = [
		{
			headerName: 'Tên',
			field: 'name',
			width: 150,
			pinned: 'left',
			editable: true,
		},
		{
			headerName: 'Khoản mục',
			field: 'khoanMuc',
			width: 160,
			pinned: 'left',
			editable: true,
		},
		{
			headerName: 'Bộ phận',
			field: 'boPhan',
			width: 150,
			pinned: 'left',
			editable: true,
		},
		...Array.from({ length: 12 }, (_, i) => ({
			headerName: `Tháng ${i + 1}`,
			field: `t${i + 1}`,
			editable: true,
			valueFormatter: (params) => formatMoney(params.value),
			cellStyle: { textAlign: 'right' },
			headerClass: 'ag-right-aligned-header',
			width: 130,
		})),
	];

	return (
		<>
			<div className={css.caiDatNhomKetQuaContainer}>
				<h2>KẾ HOẠCH BÁN HÀNG</h2>
				<Button
					className={css.actionButton}
					onClick={() => setIsModalVisible(true)}
				>
					Cài đặt chu kỳ
				</Button>
				<Button
					className={css.actionButton}
					onClick={() => setIsModalSettingLai(true)}
				>
					Cài đặt tỷ lệ lãi
				</Button>
			</div>
			<div className='ag-theme-quartz' style={{ width: '100%' }}>
				<AgGridReact
					domLayout='autoHeight'
					enableRangeSelection={true}
					statusBar={{
						statusPanels: [{ statusPanel: 'agAggregationComponent' }],
					}}
					localeText={AG_GRID_LOCALE_VN}
					rowData={convertAndSumKHBH(dataTT)}
					columnDefs={columnDefs}
					defaultColDef={{
						resizable: true,
						sortable: true,
					}}
				/>
			</div>
			{
				isModalVisible && <KHKDChuKyModal fetchKHTH ={fetchKHTH}
												  dataTT={dataTT}
												  isVisible={isModalVisible}
												  onClose={() => setIsModalVisible(false)}
				/>
			}
			{
				isModalSettingLai && <KHKDSettingLaiModal fetchKHTH ={fetchKHTH}
												  dataTT={dataTT}
												  isVisible={isModalSettingLai}
												  onClose={() => setIsModalSettingLai(false)}
				/>
			}

		</>
	);
}
