import React, { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import AG_GRID_LOCALE_VN from '../../../../pages/Home/AgridTable/locale.jsx';
import { getKHKDElementByLabelSoLuong } from '../../../../apis/khkdElementService.jsx';
import { Dialog, DialogActions, DialogContent } from '@mui/material';
import { formatMoney } from '../../../../generalFunction/format.js';
import { Button } from 'antd';
import css from './Detail.module.css';
import { convertKHKDElementData } from '../../KHKDElement/logicKHKDElementData.js';
import { getDeepestLevelRows, viewDetailTH } from './logicDetailTH.js';
import { ViewTHTable } from './ViewTHTable.jsx';

export default function DetailKHKDTongHopDL({ open, onClose, name, khkdData }) {
	const [khkdListElement, setKhkdListElement] = useState([]);
	const [dataTH, setDataTH] = useState(null);
	const fetchKHKDElementList = async () => {
		try {
			const data = await getKHKDElementByLabelSoLuong(name);
			setKhkdListElement(convertKHKDElementData(data));
		} catch (error) {
			console.error('Lỗi khi lấy danh sách KHKD:', error);
		}
	};

	useEffect(() => {
		fetchKHKDElementList();
	}, [name]);

	const columnDefs = [
		// { headerName: 'Tên', field: 'name', editable: false, pinned: 'left', width: 220 },
		{ headerName: 'Chỉ số', field: 'labelSoLuong', editable: true, pinned: 'left', width: 200 },
		{ headerName: 'Bộ phận', field: 'boPhan', editable: false, pinned: 'left', width: 200 },
		// { headerName: 'Chỉ số', field: 'labelSoLuong', editable: true, width: 200 },
		...Array.from({ length: 12 }, (_, i) => ({
			headerName: `Tháng ${i + 1}`,
			field: `T${i + 1}`,
			editable: true,
			valueFormatter: (params) => formatMoney(params.value),
			cellStyle: { textAlign: 'right' },
			headerClass: 'ag-right-aligned-header',
			width: 130,
		})),
	];

	async function viewTH() {
		let allTemplatesData = await viewDetailTH(khkdData, 'doLuongThucHien').then();
		let dataTH = getDeepestLevelRows(allTemplatesData);
		setDataTH(dataTH);
	}

	return (
		<Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
			<DialogContent sx={{
				maxHeight: '80vh', // Chiều cao tối đa là 80% chiều cao viewport
				overflowY: 'auto', // Tự cuộn nếu nội dung vượt quá
			}}>
				<div className={css.contentContainer}>
					{khkdListElement.length === 0 ? (
						<div>Không có dữ liệu.</div>
					) : (
						<>
							{khkdData && <Button onClick={viewTH}>Xem thực hiện</Button>}
							<div className="ag-theme-quartz" style={{ width: '100%', marginTop: 30 }}>
								<h1>Dữ liệu kế hoạch</h1>
								<AgGridReact
									domLayout="autoHeight"
									rowData={khkdListElement}
									columnDefs={columnDefs}
									localeText={AG_GRID_LOCALE_VN}
									defaultColDef={{ resizable: true, sortable: true, suppressHeaderMenuButton: true }}
									enableRangeSelection={true}
									statusBar={{
										statusPanels: [{ statusPanel: 'agAggregationComponent' }],
									}}
								/>
							</div>
							{dataTH &&
								<>
									<h1>Dữ liệu thực hiện</h1>
									<ViewTHTable data={dataTH} />
								</>
							}
						</>
					)}
				</div>
			</DialogContent>

			<DialogActions>
				<Button onClick={onClose} color="primary">
					Đóng
				</Button>
			</DialogActions>
		</Dialog>

	);
};

