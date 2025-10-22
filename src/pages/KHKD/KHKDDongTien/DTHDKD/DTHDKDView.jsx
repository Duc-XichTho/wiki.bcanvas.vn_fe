import React, { useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import AG_GRID_LOCALE_VN from '../../../../pages/Home/AgridTable/locale.jsx';
import { formatMoney } from '../../../../generalFunction/format.js';

export default function DTHDKDView({ showCungKy ,dataKetQua, khkdTH, settingMonth, dataDongTienTHCK, setDataDT1AI, hasKH }) {
	const [resultData, setResultData] = useState([]);
	const defaultColDef = useMemo(() => ({
		editable: true,
		filter: true,
		suppressMenu: true,
		cellStyle: { fontSize: '14.5px' },
		wrapHeaderText: true,
		autoHeaderHeight: true,
		width: 120,
	}), []);

	useEffect(() => {
		if (dataKetQua) {
			let initialData;
			if (khkdTH && Array.isArray(khkdTH.settingDongTien) && khkdTH.settingDongTien.length > 0) {
				initialData = JSON.parse(JSON.stringify(khkdTH.settingDongTien));
			} else {
				initialData = dataKetQua.map(item => {
					const row = { name: item.name };
					for (let i = 1; i <= 12; i++) {
						row[`t${i}`] = '';
					}
					return row;
				});
			}
			const inputData = initialData;
			const result = (dataKetQua|| []).map((sourceItem) => {
				const inputItem = inputData.find(item => item.name === sourceItem.name);
				const itemTHCK = dataDongTienTHCK.find(item => item.name === sourceItem.name);
				const row = { name: sourceItem.name };
				for (let i = 1; i <= 12; i++) {
					const val1 = Number(sourceItem[`t${i}`] || 0);
					const val2 = Number(inputItem?.[`t${i}`] || 0);
					const ck = Number(itemTHCK?.[`t${i}_ck`] || 0);
					const th = Number(itemTHCK?.[`t${i}_th`] || 0);
					const val = val1 * val2 / 100;

					row[`t${i}`] = val;
					row[`t${i}_ck`] = ck;
					row[`t${i}_th`] = th;
					row[`t${i}_ck_cl`] = th - ck;
					row[`t${i}_cl_th`] = th - val;
				}

				return row;
			});
			setDataDT1AI(result)
			setResultData(result);
		}
	}, [dataKetQua]);

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
			<>
				<div style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: 16,
				}}>
					<h3 style={{ marginBottom: 16 }}>DÒNG TIỀN TỪ HOẠT ĐỘNG KINH DOANH</h3>
				</div>
				<div className="ag-theme-quartz" style={{ width: '100%' }}>
					<AgGridReact
						defaultColDef={defaultColDef}
						localeText={AG_GRID_LOCALE_VN}
						rowData={resultData}
						columnDefs={columns}
						enableRangeSelection={true}
						statusBar={{
							statusPanels: [{ statusPanel: 'agAggregationComponent' }],
						}}
						domLayout="autoHeight"
					/>
				</div>
			</>
		</div>
	);
}
