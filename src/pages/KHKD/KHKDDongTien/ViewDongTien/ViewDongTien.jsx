import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import AG_GRID_LOCALE_VN from '../../../../pages/Home/AgridTable/locale.jsx';
import { formatMoney } from '../../../../generalFunction/format.js';
import { chuyenDoiBang } from '../../logicKHKD/calDongTien.js';

export default function ViewDongTien({dataDongTien}) {
	const columnDefs = [
		{
			headerName: 'Mô tả',
			field: 'name',
			width: 460,
			pinned: 'left',
			cellStyle: { fontWeight: 'bold' },
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
		<div style={{ marginBottom: 40 }}>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
				<h3>TỔNG QUAN</h3>
			</div>


			<div className='ag-theme-quartz' style={{width: '100%' }}>
				<AgGridReact
					domLayout="autoHeight"
					localeText={AG_GRID_LOCALE_VN}
					rowData={chuyenDoiBang(dataDongTien)}
					columnDefs={columnDefs}
					enableRangeSelection={true}
				/>
			</div>
		</div>
	);
}
