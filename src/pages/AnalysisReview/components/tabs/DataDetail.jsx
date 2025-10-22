import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import AG_GRID_LOCALE_VN from '../../../Home/AgridTable/locale';
import styles from './DataDetail.module.css';
import { getApprovedVersionDataById } from '../../../../apis/approvedVersionTemp.jsx';
import { getTemplateColumn, getTemplateRow, getTableByid } from '../../../../apis/templateSettingService.jsx';
import { buildColumn, buildColumnDef } from '../../../Canvas/Daas/Content/Template/TemplateLogic/buildColumnDef.jsx';
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
	const [outputColumnNames, setOutputColumnNames] = useState([]);

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(1000);
	const [totalRows, setTotalRows] = useState(0);

	const handlePageChange = (page, size) => {
		setCurrentPage(page);
		if (size && size !== pageSize) {
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
		const fetchMetadata = async () => {
			if (!id) return;
			setLoading(true);
			setRowData([]);
			setTemplateColumns([]);
			setDataItem(null);
			setOutputColumnNames([]);
			setCurrentPage(1); // Reset page when id changes
			try {
				const data = await getApprovedVersionDataById(id);
				setDataItem(data);
				// Lấy danh sách outputColumns theo version (bước) đang chọn
				try {
					const table = await getTableByid(data.id_template);
					const steps = table?.steps || [];
					const targetStepId = data.id_version === 1 ? 1 : data.id_version;
					const step = steps.find(s => s.id === targetStepId) || steps[steps.length - 1];
					const names = step?.config?.outputColumns?.map(c => c.name).filter(Boolean) || [];
					setOutputColumnNames(names);
				} catch (e) {
					console.warn('Cannot load outputColumns from table steps:', e);
				}
			} catch (error) {
				console.error('Error fetching metadata:', error);
				setLoading(false); // Stop loading on metadata error
			}
			// Loading will be handled by the row data fetch effect
		};
		fetchMetadata();
	}, [id]);

	useEffect(() => {
		if (!dataItem) return;

		const fetchRowData = async () => {
			setLoading(true);
			try {
				const version = dataItem.id_version === 1 ? null : dataItem.id_version;
				const rowVersionResponse = await getTemplateRow(dataItem.id_template, version, false, currentPage, pageSize);
				if (rowVersionResponse && rowVersionResponse.rows) {
					setRowData(rowVersionResponse.rows.map(row => ({ ...row.data, rowId: row.id })));
					setTotalRows(rowVersionResponse.count);
				} else {
					setRowData([]);
					setTotalRows(0);
				}
			} catch (error) {
				console.error('Error fetching row data:', error);
				setRowData([]);
				setTotalRows(0);
			} finally {
				setLoading(false);
			}
		};

		fetchRowData();
	}, [dataItem, currentPage, pageSize]);

	// Build colDefs dựa trên dữ liệu hiện tại
	useEffect(() => {
		if (!rowData.length) return;

		// Xác định danh sách cột hiển thị dựa trên outputColumns của version hiện tại
		// Nếu không có outputColumns, fallback sang thứ tự template + keys trong dữ liệu
		const templateColumnOrder = templateColumns.map(col => col.columnName);
		let dataColumns = [];
		if (outputColumnNames && outputColumnNames.length > 0) {
			dataColumns = outputColumnNames;
		} else {
			const allColumnNamesSet = new Set();
			templateColumnOrder.forEach(name => allColumnNamesSet.add(name));
			rowData.forEach(row => {
				Object.keys(row).forEach(key => {
					if (key !== 'rowId') {
						allColumnNamesSet.add(key);
					}
				});
			});
			dataColumns = [
				...templateColumnOrder,
				...Array.from(allColumnNamesSet).filter(name => !templateColumnOrder.includes(name)),
			];
		}

		// Tạo colDefs dựa trên danh sách cột đã hợp nhất
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
					valueFormatter: (params) => {
						// Xử lý trường hợp Invalid Number cho cột không có template
						if (params.value == null || params.value == undefined || params.value === '') {
							return ''; // Không hiển thị gì khi trống
						}
						// Kiểm tra nếu là số hợp lệ
						if (typeof params.value === 'number' && !isNaN(params.value)) {
							return params.value.toLocaleString('en-US', { useGrouping: true });
						}
						// Nếu không phải số, trả về giá trị gốc
						return params.value;
					},
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

	const pageSizeOptions = [1000, 5000, 10000, 20000, 50000];

	return (
		<div style={{
			width: '100%',
			height: '100%',
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
							pageSizeOptions={pageSizeOptions}
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
