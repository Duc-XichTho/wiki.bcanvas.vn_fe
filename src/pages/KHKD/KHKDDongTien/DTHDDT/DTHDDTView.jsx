import React, { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import AG_GRID_LOCALE_VN from '../../../../pages/Home/AgridTable/locale.jsx';
import { formatMoney } from '../../../../generalFunction/format.js';
import { updateKHKDTongHop } from '../../../../apis/khkdTongHopService.jsx';
import ActionSave from '../../../Home/AgridTable/actionButton/ActionSave.jsx';
import { toast } from 'react-toastify';
import ActionCreate from '../../../Home/AgridTable/actionButton/ActionCreate.jsx';
import { v4 as uuidv4 } from 'uuid';

export default function DTHDDTView({showCungKy , settingMonth, dataDongTienTHCKDT, hasKH }) {
	const columns = [
		{ headerName: 'Tên', field: 'name', pinned: 'left', width: 460 },
		{
			headerName: 'Tổng',
			headerClass: 'ag-center-header-group',
			children: [
				{
					headerName: 'Thực hiện',
					field: 'total_th',
					valueGetter: (params) => {
						return (settingMonth ?? []).reduce((sum, m) => sum + (params.data[`t${m}_th`] || 0), 0);
					},
					valueFormatter: (params) => formatMoney(params.value),
					cellStyle: { textAlign: 'right' },
					headerClass: 'ag-right-aligned-header',
					width: 160,
				},
				...(hasKH ? [{
					headerName: 'Kế hoạch',
					field: 'total_kh',
					valueGetter: (params) => {
						return (settingMonth ?? []).reduce((sum, m) => sum + (params.data[`t${m}`] || 0), 0);
					},
					valueFormatter: (params) => formatMoney(params.value),
					cellStyle: { textAlign: 'right' },
					headerClass: 'ag-right-aligned-header',
					width: 160,
				},
				{
					headerName: 'Chênh lệch KH-TH',
					field: 'total_diff',
					valueGetter: (params) => {
						const th = (settingMonth ?? []).reduce((sum, m) => sum + (params.data[`t${m}_th`] || 0), 0);
						const kh = (settingMonth ?? []).reduce((sum, m) => sum + (params.data[`t${m}`] || 0), 0);
						const diff = th - kh;
						return diff;
					},
					valueFormatter: (params) => formatMoney(params.value),
					cellStyle: (params) => ({
						textAlign: 'right',
						color: params.value < 0 ? 'red' : params.value > 0 ? 'green' : '#e48407',
					}),
					headerClass: 'ag-right-aligned-header',
					width: 160,
				}] : []),
				{
					headerName: 'Cùng kỳ',
					field: 'total_ck',
					valueGetter: (params) => {
						return (settingMonth ?? []).reduce((sum, m) => sum + (params.data[`t${m}_ck`] || 0), 0);
					},
					valueFormatter: (params) => formatMoney(params.value),
					cellStyle: { textAlign: 'right' },
					headerClass: 'ag-right-aligned-header',
					width: 160,
					hide: !showCungKy,
				},
				{
					headerName: 'Chênh lệch CK',
					field: 'total_diff_ck',
					valueGetter: (params) => {
						const th = (settingMonth ?? []).reduce((sum, m) => sum + (params.data[`t${m}_th`] || 0), 0);
						const ck = (settingMonth ?? []).reduce((sum, m) => sum + (params.data[`t${m}_ck`] || 0), 0);
						const diff = th - ck;
						return diff;
					},
					valueFormatter: (params) => formatMoney(params.value),
					cellStyle: (params) => ({
						textAlign: 'right',
						color: params.value < 0 ? 'red' : params.value > 0 ? 'green' : '#e48407',
					}),
					headerClass: 'ag-right-aligned-header',
					width: 160,
					hide: !showCungKy,
				},
			],
		},
		...(settingMonth ?? [])
			.sort((a, b) => b - a).map((i) => {
			const month = i;
			return {
				headerName: `Tháng ${month}`,
				headerClass: 'ag-center-header-group',
				children: [
					{
						headerName: `Thực hiện`,
						field: `t${month}_th`,
						cellStyle: { textAlign: 'right' },
						headerClass: 'ag-right-aligned-header',
						valueFormatter: (params) => formatMoney(params.value),
						width: 140
					},
					...(hasKH ? [{
						headerName: `Kế hoạch `,
						field: `t${month}`,
						editable: true,
						cellStyle: { textAlign: 'right' },
						headerClass: 'ag-right-aligned-header',
						valueFormatter: (params) => formatMoney(params.value),
						width: 140
					},
					{
						headerName: `Chênh lệch KH-TH`,
						editable: false,
						valueGetter: (params) => {
							const th = params.data[`t${month}_th`] || 0;
							const kh = params.data[`t${month}`] || 0;
							const diff =th - kh;
							const percent = th !== 0 ? (diff / th) * 100 : 0;
							return { diff, percent };
						},
						valueFormatter: (params) => {
							if (!params.value) return '';
							const { diff, percent } = params.value;
							const sign = percent > 0 ? '+' : '';
							// return `${formatMoney(diff)} | ${sign}${percent.toFixed(1)}%`;
							return `${formatMoney(diff)}`;
						},
						cellStyle: (params) => {
							const value = params.value?.diff;
							return {
								textAlign: 'right',
								color: value < 0 ? 'red' : value > 0 ? 'green' : '#e48407',
							};
						},
						headerClass: 'ag-right-aligned-header',
						width: 160,
					}] : []),
					{
						headerName: `Cùng kỳ `,
						field: `t${month}_ck`,
						cellStyle: { textAlign: 'right' },
						headerClass: 'ag-right-aligned-header',
						valueFormatter: (params) => formatMoney(params.value),
						width: 140,
						hide: !showCungKy,
					},
					{
						headerName: `Chênh lệch CK`,
						editable: false,
						field: `t${month}_cl_ck`, // Có thể bỏ nếu dùng valueGetter
						valueGetter: (params) => {
							const th = params.data[`t${month}_th`] || 0;
							const ck = params.data[`t${month}_ck`] || 0;
							const diff = th - ck;
							const percent = ck !== 0 ? (diff / ck) * 100 : 0;
							return { diff, percent };
						},
						valueFormatter: (params) => {
							const { diff, percent } = params.value || {};
							const sign = percent > 0 ? '+' : '';
							// return `${formatMoney(diff)} | ${sign}${percent.toFixed(1)}%`;
							return `${formatMoney(diff)}`;
						},
						cellStyle: (params) => {
							const value = params.value?.diff;
							return {
								textAlign: 'right',
								color: value < 0 ? 'red' : value > 0 ? 'green' : '#e48407',
							};
						},
						headerClass: 'ag-right-aligned-header',
						width: 160,
						hide: !showCungKy,
					},
				]
			};
		}),

	];

	return (
		<div style={{ marginBottom: 40 }}>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
				<h3>DÒNG TIỀN TỪ HOẠT ĐỘNG ĐẦU TƯ</h3>
				<div  style={{ display: 'flex', alignItems: 'center', gap : '10px' }}>
				</div>
			</div>


			<div className='ag-theme-quartz' style={{ width: '100%' }}>
				<AgGridReact
					domLayout="autoHeight"
					enableRangeSelection={true}
					statusBar={{
						statusPanels: [{ statusPanel: 'agAggregationComponent' }],
					}}
					localeText={AG_GRID_LOCALE_VN}
					rowData={dataDongTienTHCKDT}
					columnDefs={columns}
					defaultColDef={{
						resizable: true,
						sortable: true,
					}}
				/>
			</div>
		</div>
	);
}
