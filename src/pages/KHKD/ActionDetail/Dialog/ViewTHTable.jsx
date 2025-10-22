import { AgGridReact } from 'ag-grid-react';
import AG_GRID_LOCALE_VN from '../../../Home/AgridTable/locale.jsx';
import React, { useEffect, useMemo, useState } from 'react';
export function ViewTHTable({ data }) {
	const [columns, setColumns] = useState([]);
	const [gridApi, setGridApi] = useState(null);
	const onGridReady = (params) => {
		setGridApi(params.api);
		params.api.sizeColumnsToFit();
	};

	useEffect(() => {
		if (data && data[0]) {
			const firstRow = data[0];
			const columnOrder = ['id', 'Thời gian'];

			const dynamicColumns = Object.keys(firstRow)
				.sort((a, b) => {
					const aIndex = columnOrder.indexOf(a);
					const bIndex = columnOrder.indexOf(b);
					if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
					if (aIndex === -1) return 1;
					if (bIndex === -1) return -1;
					return aIndex - bIndex;
				})
				.map(key => ({
					field: key,
					headerName: key,
					minWidth: 100,
					maxWidth: 600,
					width: 'auto',
					autoHeight: true,
					wrapText: true,
					headerStyle: { width: 'fit-content' },
					valueFormatter: (params) => {
						if (key === 'Thời gian' && params.value) {
							const date = new Date(params.value);
							return date instanceof Date && !isNaN(date) ? `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}` : '-';
						}
						return params.value?.toString() || '-';
					},
				}));
			setColumns(dynamicColumns);
		}
	}, [data]);

	const defaultColDef = useMemo(() => {
		return {
			filter: true,
			cellStyle: { fontSize: '14.5px' },
			wrapHeaderText: true,
			autoHeaderHeight: true,
		};
	});
	return (
		<>
			<div className="ag-theme-quartz" style={{ height: 500, width: '100%', }}>
				<AgGridReact
					rowData={data}
					columnDefs={columns}
					onGridReady={onGridReady}
					pagination={true}
					paginationPageSize={50}
					defaultColDef={defaultColDef}
					localeText={AG_GRID_LOCALE_VN}

				/>
			</div>
		</>
	);
}