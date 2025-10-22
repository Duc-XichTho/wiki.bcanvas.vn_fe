import React from 'react';
import { Button, Title, Space, Select, DatePicker } from 'antd';
import { SettingOutlined, SafetyOutlined } from '@ant-design/icons';
import { Trash, ListRestart } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

const { Option } = Select;

const TableItem = ({
	item,
	tableData,
	tableDateRanges,
	tableQuickDateRanges,
	showAnalysis,
	loading,
	currentUser,
	deleteLoading,
	deletingItemId,
	styles,
	onOpenEditModal,
	onOpenUserClassModal,
	onDeleteDashboardItem,
	onSetTableDateRanges,
	onSetTableQuickDateRanges,
	getDateRangeFromOption,
	formatValueBySettings,
	renderDataBar,
}) => {
	return (
		<>
			<div style={{ marginBottom: 16 }}>
				<div style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: 8,
				}}>
					<Title level={4} style={{ lineHeight: 1.4, margin: 0, flex: 1 }}>
						{item.name}
					</Title>
					<div style={{ display: 'flex', gap: 4 }}>
						<Button
							size='small'
							icon={<SettingOutlined style={{ color: '#acacac' }} />}
							onClick={(e) => {
								e.stopPropagation();
								onOpenEditModal(item);
							}}
							title='Cài đặt'
						/>

						{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
							<Button
								size='small'
								icon={<SafetyOutlined style={{ color: '#acacac' }} />}
								onClick={(e) => {
									e.stopPropagation();
									onOpenUserClassModal(item);
								}}
								title='Cài đặt quyền'
							/>
						)}

						{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
							<Button
								size='small'
								danger
								loading={deleteLoading && deletingItemId === item.id}
								onClick={(e) => {
									e.stopPropagation();
									onDeleteDashboardItem(item);
								}}
							>
								<Trash color='#ff8882' size={13} />
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Date Range Filter */}
			{item.settings?.dateColumn && (
				<div style={{
					marginBottom: 12,
					padding: '8px 12px',
					backgroundColor: '#f5f5f5',
					borderRadius: '6px',
				}}
					className={styles.dateRangeFilter}
					onClick={(e) => e.stopPropagation()} // Chặn click ở container
				>
					<Space size='small' align='center'>
						<DatePicker.RangePicker
							className={styles.dateRangePicker}
							size='small'
							style={{ width: 200 }}
							placeholder={['Từ ngày', 'Đến ngày']}
							value={tableDateRanges[item.id] || null}
							onChange={(dates) => {
								onSetTableDateRanges(prev => ({
									...prev,
									[item.id]: dates,
								}));
								// Clear quick date range when manual date is selected
								onSetTableQuickDateRanges(prev => ({
									...prev,
									[item.id]: null,
								}));
							}}
							format='DD/MM/YYYY'
						/>
						<Select
							className={styles.dateRangeSelect}
							size='small'
							style={{ width: 'auto' }}
							placeholder='Chọn nhanh'
							value={(() => {
								const userSelection = tableQuickDateRanges[item.id];
								const defaultSetting = item.settings?.dateRange;
								const finalValue = userSelection || (defaultSetting ? defaultSetting : undefined);
								return finalValue;
							})()}
							onChange={(value) => {
								onSetTableQuickDateRanges(prev => ({
									...prev,
									[item.id]: value,
								}));
								// Clear manual date range when quick option is selected
								onSetTableDateRanges(prev => ({
									...prev,
									[item.id]: null,
								}));
							}}
							allowClear
						>
							<Option value='today'>Hôm nay</Option>
							<Option value='yesterday'>Hôm qua</Option>
							<Option value='thisWeek'>Tuần này</Option>
							<Option value='lastWeek'>Tuần trước</Option>
							<Option value='thisMonth'>Tháng này</Option>
							<Option value='lastMonth'>Tháng trước</Option>
							<Option value='last7Days'>7 ngày gần nhất</Option>
							<Option value='last15Days'>15 ngày gần nhất</Option>
							<Option value='last30Days'>30 ngày gần nhất</Option>
							<Option value='all'>Tất cả dữ liệu</Option>
						</Select>
						{(tableDateRanges[item.id] && (tableDateRanges[item.id][0] || tableDateRanges[item.id][1])) && (
							<Button
								size='small'
								onClick={() => {
									onSetTableDateRanges(prev => ({
										...prev,
										[item.id]: null,
									}));
								}}
							>
								<ListRestart size={16} />
							</Button>
						)}
						{tableQuickDateRanges[item.id] && (
							<Button
								size='small'
								onClick={() => {
									onSetTableQuickDateRanges(prev => ({
										...prev,
										[item.id]: null,
									}));
								}}
							>
								<ListRestart size={16} />
							</Button>
						)}
					</Space>
				</div>
			)}

			<div style={{
				marginBottom: 20,
				height: !showAnalysis ? '370px' : '320px',
				overflow: 'auto',
			}}>
				{(item.settings?.fetchedData && item.settings?.fetchedData.length > 0) || tableData[item.id] ? (
					<AgGridReact
						rowData={(() => {
							const data = item.settings?.fetchedData || tableData[item.id] || [];

							// Check if we have date column and date range settings
							if (!item.settings.dateColumn) {
								return data;
							}

							// First, check if user has manually selected a date range
							if (tableDateRanges[item.id]) {
								const [startDate, endDate] = tableDateRanges[item.id];
								return data.filter(row => {
									const dateValue = row[item.settings.dateColumn];
									if (!dateValue) return true;

									const rowDate = new Date(dateValue);
									const isAfterStart = !startDate || rowDate >= startDate.startOf('day').toDate();
									const isBeforeEnd = !endDate || rowDate <= endDate.endOf('day').toDate();

									return isAfterStart && isBeforeEnd;
								});
							}

							// Second, check if user has selected a quick date range
							if (tableQuickDateRanges[item.id]) {
								const [startDate, endDate] = getDateRangeFromOption(tableQuickDateRanges[item.id]);

								return data.filter(row => {
									const dateValue = row[item.settings.dateColumn];
									if (!dateValue) return true;

									const rowDate = new Date(dateValue);
									const isAfterStart = !startDate || rowDate >= startDate;
									const isBeforeEnd = !endDate || rowDate <= endDate;

									return isAfterStart && isBeforeEnd;
								});
							}

							// Third, if no manual or quick date range, use the default date range from settings
							if (item.settings.dateRange && item.settings.dateRange !== 'all') {
								const [startDate, endDate] = getDateRangeFromOption(item.settings.dateRange);

								return data.filter(row => {
									const dateValue = row[item.settings.dateColumn];
									if (!dateValue) return true;

									const rowDate = new Date(dateValue);
									const isAfterStart = !startDate || rowDate >= startDate;
									const isBeforeEnd = !endDate || rowDate <= endDate;

									return isAfterStart && isBeforeEnd;
								});
							}

							// If no date range specified, return all data
							return data;
						})()}
						columnDefs={(() => {
							const columns = [];
							const columnSettings = item.settings?.columnSettings || {};
							const displayColumns = item.settings?.displayColumns || [];
							const dateColumn = item.settings?.dateColumn;
							const templateColumns = item.settings?.templateColumns || [];

							// Add date column if specified
							if (dateColumn) {
								const dateColumnSetting = columnSettings[dateColumn];
								columns.push({
									field: dateColumn,
									headerName: 'Thời gian',
									width: (() => {
										const columnWidths = {
											0.5: 60,
											1: 100,
											2: 150,
											3: 300,
										};
										const dateColumnSize = item.settings?.dateColumnSize || 2;
										return columnWidths[dateColumnSize] || 150;
									})(),
									resizable: true,
									sortable: true,
									filter: true,
									cellStyle: {
										fontSize: '12px',
										fontWeight: 500,
										backgroundColor: '#fafafa',
									},
									cellRenderer: (params) => {
										return formatValueBySettings(params.value, dateColumnSetting);
									},
								});
							}

							// Add data columns based on settings
							if (displayColumns.length > 0) {
								displayColumns.forEach((columnId, index) => {
									const columnSetting = columnSettings[columnId];
									const templateColumn = templateColumns.find(col => col.id === columnId);
									const columnName = templateColumn?.columnName || `Cột ${index + 1}`;

									// Get column size from settings
									const columnSizes = item.settings?.columnSizes || {};
									const columnSize = columnSizes[columnId] || 2;
									const columnWidths = {
										0.5: 60,
										1: 100,
										2: 150,
										3: 300,
									};

									columns.push({
										field: columnId,
										headerName: columnName,
										width: columnWidths[columnSize] || 150,
										resizable: true,
										sortable: true,
										filter: true,
										cellStyle: (params) => {
											let color = 'inherit';
											if (columnSetting?.type === 'value' &&
												columnSetting.valueFormat?.negativeRed &&
												Number(params.value) < 0) {
												color = '#ff4d4f';
											}
											return {
												fontSize: '12px',
												textAlign: columnSetting?.type === 'text' ? 'left' : 'right',
												color: color,
											};
										},
										cellRenderer: (params) => {
											// If column type is dataBar, render data bar
											if (columnSetting?.type === 'dataBar') {
												const allValues = params.api.getRenderedNodes().map(node => node.data[columnId]).filter(v => v !== null && v !== undefined);
												return renderDataBar(params.value, allValues, columnSetting, index);
											}
											// Otherwise, use normal formatting
											return formatValueBySettings(params.value, columnSetting);
										},
									});
								});
							} else {
								const data = item.settings?.fetchedData || tableData[item.id] || [];
								if (data && data.length > 0) {
									const firstRow = data[0];
									Object.keys(firstRow).forEach(key => {
										if (key !== 'rowId') { // Skip rowId column
											columns.push({
												field: key,
												headerName: key,
												width: 150,
												resizable: true,
												sortable: true,
												filter: true,
												cellStyle: { fontSize: '12px' },
											});
										}
									});
								}
							}

							return columns;
						})()}
						defaultColDef={{
							resizable: true,
							sortable: true,
							filter: true,
						}}
						className='ag-theme-quartz'
						style={{
							height: !showAnalysis ? '350px' : '300px',
							width: '100%',
						}}
					/>
				) : (
					<div style={{ textAlign: 'center', color: '#aaa', padding: 32 }}>
						Không có dữ liệu để hiển thị
					</div>
				)}
			</div>
		</>
	);
};

export default TableItem;
