import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import AG_GRID_LOCALE_VN from '../Home/AgridTable/locale.jsx';
import styles from './ForecastingApp.module.css';
import { getApprovedVersionDataById } from '../../apis/approvedVersionTemp.jsx';
import { getTemplateColumn, getTemplateRow } from '../../apis/templateSettingService.jsx';
import { buildColumn, buildColumnDef } from '../Canvas/Daas/Content/Template/TemplateLogic/buildColumnDef.jsx';
import { Button, Input, Pagination } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const DataDetail = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [dataItem, setDataItem] = useState(null);
	const [templateColumns, setTemplateColumns] = useState([]);
	const [rowData, setRowData] = useState([]);
	const [colDefs, setColDefs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [isStatusFilter, setIsStatusFilter] = useState(false);
	const [duplicateHighlightColumns, setDuplicateHighlightColumns] = useState([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [gridApi, setGridApi] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(50000);
	const [totalRows, setTotalRows] = useState(0);

	const handlePageChange = (page, size) => {
		setCurrentPage(page);
		if (size !== pageSize) {
			setPageSize(size);
		}
	};

	const handleSearch = (e) => {
		setSearchQuery(e.target.value);
		if (gridApi) {
			gridApi.setQuickFilter(e.target.value);
		}
	};

	// Filter logic giống ShowData.jsx
	function filter() {
		if (isStatusFilter) {
			return {
				filter: 'agMultiColumnFilter', floatingFilter: true, filterParams: {
					filters: [
						{ filter: 'agTextColumnFilter' },
						{ filter: 'agSetColumnFilter' },
					],
				},
			};
		}
		return {};
	}

	const handleChangeStatusFilter = () => {
		setIsStatusFilter((prev) => !prev);
	};

	const toggleDuplicateHighlight = (columnName) => {
		setDuplicateHighlightColumns((prev) => {
			if (prev.includes(columnName)) {
				return prev.filter((col) => col !== columnName);
			} else {
				return [...prev, columnName];
			}
		});
	};

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const data = await getApprovedVersionDataById(id);
				setDataItem(data);

				const columns = await getTemplateColumn(data.id_template);
				setTemplateColumns(columns);

				// Lấy dữ liệu theo version
				const response = await getTemplateRow(data.id_template, data.id_version == 1 ? null : data.id_version, false, currentPage, pageSize);

				if (response && response.rows) {
					setRowData(response.rows.map(row => ({ ...row.data, rowId: row.id })));
					setTotalRows(response.count);
				} else {
					setRowData([]);
					setTotalRows(0);
				}
			} catch (error) {
				console.error('Error fetching data:', error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [id, currentPage, pageSize]);

	// Build colDefs dựa trên dữ liệu hiện tại
	useEffect(() => {
		if (!rowData.length || !templateColumns.length) return;

		// Lấy tất cả columns từ dữ liệu hiện tại
		const dataColumns = [];
		if (rowData.length > 0) {
			Object.keys(rowData[0]).forEach(key => {
				if (key !== 'rowId') { // Bỏ qua rowId
					dataColumns.push(key);
				}
			});
		}

		// Tạo colDefs dựa trên columns của dữ liệu hiện tại
		const colDefs = dataColumns.map(columnName => {
			// Tìm template column tương ứng (nếu có)
			const templateColumn = templateColumns.find(col => col.columnName === columnName);

			// Nếu có template column, sử dụng buildColumnDef
			if (templateColumn) {
				const def = buildColumnDef({
					col: templateColumn,
					rowData,
					duplicateHighlightColumns,
					templateColumns: templateColumns,
					currentUser: { email: '', isAdmin: true },
					getHeaderTemplate: (name) => `<span>${name}${duplicateHighlightColumns.includes(name) ? ' 📌' : ''}</span>`,
					toggleDuplicateHighlight,
					filter,
				});
				buildColumn(templateColumn, def, dataItem?.id_template, () => { });
				return def;
			} else {
				// Nếu không có template column (cột mới từ Calculated Column), tạo definition đơn giản
				return {
					headerName: columnName,
					field: columnName,
					width: 150,
					resizable: true,
					sortable: true,
					cellStyle: { fontSize: '14.5px' },
					...filter(),
				};
			}
		});

		setColDefs(colDefs);
	}, [rowData, templateColumns, duplicateHighlightColumns, isStatusFilter, dataItem]);

	// statusBar giống ShowData.jsx
	const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

	// defaultColDef giống ShowData.jsx
	const defaultColDef = useMemo(() => ({
		editable: false,
		filter: false,
		suppressMenu: true,
		wrapHeaderText: true,
		autoHeaderHeight: true,
		cellStyle: { fontSize: '14.5px' },
	}), []);

	// Pagination configuration
	const pagination = false; // Disable ag-grid pagination

	return (
		<div style={{
			width: '100%',
			height: '70vh',
			display: 'flex',
			flexDirection: 'column',
			overflow: 'hidden'
		}}>
			<div style={{
				padding: '16px',
				borderBottom: '1px solid #e5e7eb',
				flexShrink: 0
			}}>
				<h2 className={`${styles.textLg} ${styles.fontMedium} ${styles.textGray900}`}>
					Data Preview
				</h2>
			</div>

			{colDefs.length > 0 && rowData.length > 0 ? (
				<>
					<div style={{
						padding: '8px 16px',
						borderBottom: '1px solid #e5e7eb',
						flexShrink: 0,
						display: 'flex',
						gap: 8,
						alignItems: 'center'
					}}>
						<Input
							placeholder="Tìm kiếm bảng"
							value={searchQuery}
							onChange={handleSearch}
							style={{ width: 200 }}
							prefix={<SearchOutlined />}
						/>
						<Button onClick={handleChangeStatusFilter}>
							{isStatusFilter ? '❌ Tắt filter' : '✅ Bật filter'}
						</Button>
					</div>
					<div
						className='ag-theme-quartz'
						style={{
							width: '100%',
							flex: 1,
							minHeight: 0,
							overflow: 'hidden'
						}}
					>
						<AgGridReact
							rowData={rowData}
							columnDefs={colDefs}
							defaultColDef={defaultColDef}
							animateRows={true}
							localeText={AG_GRID_LOCALE_VN}
							statusBar={statusBar}
							loadingOverlayComponentParams={{ loadingMessage: 'Đang tải dữ liệu...' }}
							loadingOverlayComponent={loading ? 'agLoadingOverlay' : undefined}
							enableRangeSelection={true}
							suppressHorizontalScroll={false}
							suppressColumnVirtualisation={false}
							pagination={pagination}
							onGridReady={(params) => setGridApi(params.api)}
						/>
					</div>
					<div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb' }}>
						<Pagination
							current={currentPage}
							pageSize={pageSize}
							total={totalRows}
							onChange={handlePageChange}
							showSizeChanger
							pageSizeOptions={[10000, 20000, 50000, 100000]}
							showQuickJumper
							showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
						/>
					</div>
				</>
			) : (
				<div style={{
					width: '100%',
					flex: 1,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					fontSize: '16px',
					color: '#6b7280'
				}}>
					{loading ? 'Đang tải...' : 'Không có dữ liệu'}
				</div>
			)}
		</div>
	);
};

export default DataDetail;
