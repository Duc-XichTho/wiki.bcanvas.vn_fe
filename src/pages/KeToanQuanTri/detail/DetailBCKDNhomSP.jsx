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
import '../../Home/AgridTable/agComponent.css';
import AG_GRID_LOCALE_VN from '../../Home/AgridTable/locale.jsx';
import { formatCurrency } from '../functionKTQT/formatMoney.js';
import { getAllProduct } from '../../../apisKTQT/productService.jsx';
import { MyContext } from '../../../MyContext.jsx';
import { getAllSoKeToan } from '../../../apisKTQT/soketoanService.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function DetailBCKDNhomSP({ kmf, field, data, viewB, currentYear }) {
	let [group, month] = field.split('_');
	const table = 'DetailBCKDNhomSP';
	const gridRef = useRef();
	const { loadDataSoKeToan } = useContext(MyContext);
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

	const onGridReady = useCallback(async () => {
		setLoading(true);
		let sktList = await getAllSoKeToan();
		let productList = await getAllProduct();
		productList = productList.filter(e => e.group === group);
		let filteredStk = sktList.filter(e => e.consol?.toLowerCase() == 'consol' && e.pl_value !== '' && e.pl_value && e.year == currentYear && e.kmf == kmf && (e.month == month || month == 0)&& (e.pl_type === plType || plType == null));
		const newArray = filteredStk.map(item => {

			if (item.CCBSP && item.PBSP) {

				const parsedPBSP = JSON.parse(item.PBSP);
				return parsedPBSP.teams.map(pb => ({
					...item,
					spPB: pb.team,
					tienPB: pb.tien,
				}));
			}
			return [{
				...item,
				spPB: item.product2,
				tienPB: item.pl_value,
				CCBSP: 'Trực tiếp',
			}];
		});

		let arr = newArray.flat().filter(e => e.tienPB && e.tienPB !== 0 && productList.some(sp => e.spPB === sp.code));
		if (viewB) {
			arr = arr.filter(e => e.pl_type === data.code);
		}
		setRowData(arr);
		setLoading(false);

	}, []);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setColDefs([
					{
						field: 'id',
						headerName: 'ID',
						width: 70,
					},
					{
						field: 'diengiai',
						headerName: 'Diễn giải',
						flex: 1,
					},
					{
						field: 'CCBSP',
						headerName: 'Cơ chế phân bổ',
						width: 150,
					},
					{
						field: 'pl_type',
						headerName: 'PL Type',
						width: 70,
						suppressHeaderMenuButton: true,
					},
					{
						field: 'month',
						headerName: 'Tháng',
						width: 70,
						suppressHeaderMenuButton: true,
					},
					{
						field: 'year',
						headerName: 'Năm',
						width: 70,
						suppressHeaderMenuButton: true,
					},
					{
						field: 'kmf',
						headerName: 'Kmf',
						width: 70,
						suppressHeaderMenuButton: true,
					},
					{
						field: 'spPB',
						headerName: 'Sản phẩm',
						width: 180,
						suppressHeaderMenuButton: true,
					},
					{
						field: 'tienPB',
						headerName: 'Số tiền phân bổ',
						width: 150,
						headerClass: 'right-align-important',
						valueFormatter: params => formatCurrency((params.value / 1).toFixed(0)),
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
		let sum = headerRenderer(rowData, `tienPB`);
		return sum ? (sum / 1).toFixed(0) : 0;
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
					Nhóm: {group}
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
