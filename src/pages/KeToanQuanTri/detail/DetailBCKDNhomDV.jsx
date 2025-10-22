import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
// import loadingSvg from "../../../../public/loading3.gif";
// Ag Grid Function
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from '@ag-grid-community/core';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { toast } from 'react-toastify';
import { getAllSoKeToan } from '../../../apisKTQT/soketoanService.jsx';
import '../../Home/AgridTable/agComponent.css';
import AG_GRID_LOCALE_VN from '../../Home/AgridTable/locale.jsx';
import { formatCurrency } from '../functionKTQT/formatMoney.js';
import { getAllUnits } from '../../../apisKTQT/unitService.jsx';
import { MyContext } from '../../../MyContext.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function DetailBCKDNhomDV({ kmf, field, currentYear, plType }) {
	let [group, month] = field.split('_');
	const table = 'DetailBCKDNhomDV';
	const gridRef = useRef();
	const [rowData, setRowData] = useState([]);
	const [colDefs, setColDefs] = useState([]);
	const [loading, setLoading] = useState(false);
	const defaultColDef = useMemo(() => {
		return {
			editable: false,
			filter: true,
			width: 180,
			cellStyle: { fontSize: '14.5px' },
		};
	});
	const statusBar = useMemo(() => {
		return {
			statusPanels: [{ statusPanel: 'agAggregationComponent' }],
		};
	}, []);

	async function loadData() {
		setLoading(true);
		let data = await getAllSoKeToan();
		let units = await getAllUnits();

		units = units.filter(e => e.group === group);

		data = data.filter(e => e.consol?.toLowerCase() == 'consol' && e.year == currentYear && e.pl_value !== '' && e.pl_value && e.kmf === kmf && (e.month == month || month == 0) && e.year == currentYear && (e.pl_type === plType || plType == null));
		const filteredData = data.filter(e => {
			if (units.some(product => e.unit_code2 === product.code) && (!e.CCPBDV || e.CCPBDV === '')) {
				e.so_tien = e.pl_value;
				return true;
			} else {
				if (e.PBDV) {
					let pbdv = JSON.parse(e.PBDV).teams;
					return pbdv.some(pb => {
						if (units.some(unit => pb.team === unit.code)) {
							e.so_tien = pb.tien;
							return true;
						}
						return false;
					});
				}

			}
			return false;
		});
		console.log(filteredData.length, filteredData.reduce((acc, item) => acc + (+item.so_tien), 0));
		setRowData(filteredData);
		setLoading(false);
	}

	const onGridReady = useCallback(async () => {
		loadData();

	}, [kmf, field, currentYear]);
	useEffect(() => {
		loadData();
	}, [kmf, field, currentYear]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setColDefs([
					{
						field: 'id',
						headerName: 'ID',
						hide: true,
					},
					{
						field: 'company',
						headerName: 'Công ty',
						width: 100,
					},
					{
						field: 'diengiai',
						headerName: 'Diễn giải',
						width: 325,
					},
					{
						field: 'pl_type',
						headerName: 'PL Type',
						width: 70,
						suppressHeaderMenuButton: true,
					},
					{
						field: 'unit_code',
						headerName: 'Đơn vị',
						width: 100,
						suppressHeaderMenuButton: true,
					},
					{
						field: 'tk_no',
						headerName: 'TK nợ',
						flex: 1,
						// valueFormatter: (params) => getFirstThreeChars(params.value)
					},
					{
						field: 'tk_co',
						headerName: 'TK có',
						flex: 1,
						// valueFormatter: (params) => getFirstThreeChars(params.value)
					},
					{
						field: 'so_tien',
						headerName: 'Số tiền',
						width: 140,
						headerClass: 'right-align-important',
						valueFormatter: params => formatCurrency((params.value / 1000).toFixed(0)),
						cellStyle: { textAlign: 'right' },
					},
				]);
			} catch (error) {
				console.log(error);
			}
		};
		fetchData();
	}, [onGridReady, rowData, table]);

	function headerRenderer(subs, col) {
		let sum = 0;
		subs.map((node) => {
			if (node.show) {
				sum += +node[col];
			}
		});
		return sum;
	}

	function calSum() {
		let sum = headerRenderer(rowData, `so_tien`);
		return sum ? (sum / 1000).toFixed(0) : 0;
	}

	return (
		<>
			{loading && (<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '100%',
				position: 'absolute',
				width: '100%',
				zIndex: '1000',
				backgroundColor: 'rgba(255, 255, 255, 0.96)',
			}}>
				<img src="/loading_moi_2.svg" alt="Loading..." style={{ width: '650px', height: '550px' }} />
			</div>)}
			<div className={'header-detail'}>
				<div style={{ marginTop: '3px' }}>
					Nhóm: {group.split('-')[1] || 'Khác'}
				</div>
				<div>
					Tổng: {formatCurrency(calSum())}
				</div>
			</div>
			<div>
				<div style={{
					height: '50vh',
					display: 'flex',
					flexDirection: 'column',
					position: 'relative',
					marginTop: '15px',
				}}>
					<div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
						<AgGridReact
							statusBar={statusBar}
							enableRangeSelection={true}
							ref={gridRef}
							rowData={rowData}
							defaultColDef={defaultColDef}
							columnDefs={colDefs}
							rowSelection="multiple"
							animateRows={true}
							localeText={AG_GRID_LOCALE_VN}
							onGridReady={onGridReady}
						/>
					</div>
				</div>
			</div>
		</>
	);
}
