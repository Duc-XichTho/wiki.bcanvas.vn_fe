import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
	Button,
	Card,
	Col,
	Modal,
	Row,
	Space,
	Table,
	Tag,
	Typography,
	Checkbox,
	Divider,
	Select,
} from 'antd';
import { AgCharts } from 'ag-charts-react';
import { AgGridReact } from 'ag-grid-react';
import AG_GRID_LOCALE_VN from '../../../Home/AgridTable/locale';
import { formatCurrency } from '../../../../generalFunction/format.js';
import { FilterOutlined, EyeOutlined } from '@ant-design/icons';
import { getSettingByType, createSetting, updateSetting } from '../../../../apis/settingService.jsx';

const { Title, Text } = Typography;
const { Option } = Select;

const MetricDetailsModal = ({
	visible,
	onCancel,
	selectedMetric,
	tableData,
	rawApprovedVersionData,
	chartOptions,
	loading,
	onLoadChartData,
	onLoadTopData,
	onLoadTableData,
	onLoadTableChartData,
	onLoadTableChart2Data,
	prepareTableColumns,
	prepareTableData,
}) => {
	if (!selectedMetric) return null;

	// State for filter toggle
	const [isFilterEnabled, setIsFilterEnabled] = useState(false);
	
	// State for responsive design
	const [isMobile, setIsMobile] = useState(false);

	// State for display settings modal
	const [displaySettingsVisible, setDisplaySettingsVisible] = useState(false);
	const [hiddenColumns, setHiddenColumns] = useState([]);
	const [dateColumns, setDateColumns] = useState([]);
	const [valueColumns, setValueColumns] = useState([]);
	const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
	const [currentSettingId, setCurrentSettingId] = useState(null);
	const [isLoadingSettings, setIsLoadingSettings] = useState(false);

	// Get available columns for settings
	const availableColumns = useMemo(() => {
		if (!rawApprovedVersionData[selectedMetric.id] || rawApprovedVersionData[selectedMetric.id].length === 0) {
			return [];
		}
		const firstRow = rawApprovedVersionData[selectedMetric.id][0];
		return Object.keys(firstRow).filter(key => key !== 'rowId');
	}, [rawApprovedVersionData, selectedMetric.id]);

	// Check screen size on mount and resize
	useEffect(() => {
		const checkScreenSize = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkScreenSize();
		window.addEventListener('resize', checkScreenSize);

		return () => {
			window.removeEventListener('resize', checkScreenSize);
		};
	}, []);

	// Load display settings when metric changes
	useEffect(() => {
		if (selectedMetric && selectedMetric.id) {
			loadDisplaySettings();
		}
	}, [selectedMetric?.id]);

	// Also load settings when modal opens
	useEffect(() => {
		if (displaySettingsVisible && selectedMetric?.id) {
			loadDisplaySettings();
		}
	}, [displaySettingsVisible, selectedMetric?.id]);

	// Load display settings from database
	const loadDisplaySettings = async () => {
		if (!selectedMetric?.id) return;
		
		setIsLoadingSettings(true);
		try {
			const settingType = `TABLE_DISPLAY_${selectedMetric.id}`;
			const settings = await getSettingByType(settingType);
			
			// Handle both array and single object responses
			let setting = null;
			if (Array.isArray(settings) && settings.length > 0) {
				setting = settings[0];
			} else if (settings && typeof settings === 'object' && settings.id) {
				setting = settings;
			}
			
			if (setting) {
				setCurrentSettingId(setting.id);
				
				if (setting.setting) {
					const displaySettings = setting.setting;
					setHiddenColumns(displaySettings.hiddenColumns || []);
					setDateColumns(displaySettings.dateColumns || []);
					setValueColumns(displaySettings.valueColumns || []);
					setDateFormat(displaySettings.dateFormat || 'DD/MM/YYYY');
				}
			} else {
				// Reset to defaults if no settings found
				setCurrentSettingId(null);
				setHiddenColumns([]);
				setDateColumns([]);
				setValueColumns([]);
				setDateFormat('DD/MM/YYYY');
			}
		} catch (error) {
			console.error('Error loading display settings:', error);
			// Reset to defaults on error
			setCurrentSettingId(null);
			setHiddenColumns([]);
			setDateColumns([]);
			setValueColumns([]);
			setDateFormat('DD/MM/YYYY');
		} finally {
			setIsLoadingSettings(false);
		}
	};

	// ag-grid configuration for table types
	const defaultColDef = useMemo(() => ({
		editable: false,
		filter: isFilterEnabled,
		suppressMenu: !isFilterEnabled,
		wrapHeaderText: true,
		autoHeaderHeight: true,
		cellStyle: { fontSize: '13px' },
		resizable: true,
		sortable: true,
		floatingFilter: isFilterEnabled,
	}), [isFilterEnabled]);

	// Build column definitions for ag-grid with display settings
	const buildAgGridColumns = useCallback((data, metricType, metricSettings) => {
		if (!data || data.length === 0) return [];
		
		const firstRow = data[0];
		let columnsToShow = Object.keys(firstRow).filter(key => key !== 'rowId'); // Ẩn cột rowId
		
		// Đối với table_chart và table_chart_2, chỉ hiển thị các cột được cấu hình trong chart
		if (metricType === 'table_chart' || metricType === 'table_chart_2') {
			const configuredColumns = [];
			
			// Lấy các cột từ cấu hình chart
			if (metricSettings) {
				// Thêm cột thời gian (timeColumn)
				if (metricSettings.timeColumn) {
					configuredColumns.push(metricSettings.timeColumn);
				}
				
				// Thêm cột nhóm (groupColumn)
				if (metricSettings.groupColumn) {
					configuredColumns.push(metricSettings.groupColumn);
				}
				
				// Thêm cột giá trị (valueColumn)
				if (metricSettings.valueColumn) {
					configuredColumns.push(metricSettings.valueColumn);
				}
			}
			
			// Chỉ hiển thị các cột được cấu hình
			if (configuredColumns.length > 0) {
				columnsToShow = columnsToShow.filter(col => configuredColumns.includes(col));
			}
		}
		
		// Apply hidden columns filter
		columnsToShow = columnsToShow.filter(col => !hiddenColumns.includes(col));
		
		return columnsToShow.map(key => ({
			headerName: key,
			field: key,
			width: 150,
			cellRenderer: (params) => {
				const value = params.value;
				
				// Format as date if column is in dateColumns
				if (dateColumns.includes(key) && value) {
					try {
						const date = new Date(value);
						if (!isNaN(date.getTime())) {
							// Format date based on selected format
							const day = date.getDate().toString().padStart(2, '0');
							const month = (date.getMonth() + 1).toString().padStart(2, '0');
							const year = date.getFullYear();
							
							if (dateFormat === 'DD/MM/YYYY') {
								return `${day}/${month}/${year}`;
							} else if (dateFormat === 'MM/DD/YYYY') {
								return `${month}/${day}/${year}`;
							}
							return date.toLocaleDateString('vi-VN');
						}
					} catch (e) {
						// If date parsing fails, return original value
					}
				}
				
				// Format as value if column is in valueColumns
				if (valueColumns.includes(key)) {
					// Convert string numbers to actual numbers for formatting
					let numericValue = value;
					if (typeof value === 'string') {
						// Remove any non-numeric characters except decimal point and minus
						const cleanValue = value.replace(/[^\d.-]/g, '');
						numericValue = parseFloat(cleanValue);
					}
					
					// Check if it's a valid number
					if (typeof numericValue === 'number' && !isNaN(numericValue)) {
						return numericValue.toLocaleString('en-US');
					}
				}
				
				// Default formatting for numbers
				if (typeof value === 'number') {
					return formatCurrency(value);
				}
				
				return value;
			},
		}));
	}, [hiddenColumns, dateColumns, valueColumns, dateFormat]);

	// Status bar configuration
	const statusBar = useMemo(() => ({ 
		statusPanels: [{ statusPanel: 'agAggregationComponent' }] 
	}), []);

	// Toggle filter function
	const toggleFilter = () => {
		setIsFilterEnabled(prev => !prev);
	};

	// Display settings functions
	const openDisplaySettings = async () => {
		// Load settings first before opening modal
		await loadDisplaySettings();
		setDisplaySettingsVisible(true);
	};

	const closeDisplaySettings = () => {
		setDisplaySettingsVisible(false);
	};

	// Save display settings to database
	const saveDisplaySettings = async () => {
		if (!selectedMetric?.id) return;
		
		try {
			const settingType = `TABLE_DISPLAY_${selectedMetric.id}`;
			const displaySettings = {
				hiddenColumns,
				dateColumns,
				valueColumns,
				dateFormat,
			};
			
			if (currentSettingId && currentSettingId !== null && currentSettingId !== undefined) {
				// Update existing setting
				const updateData = {
					id: currentSettingId,
					type: settingType,
					setting: displaySettings,
				};
				try {
					await updateSetting(updateData);
				} catch (updateError) {
					console.error('Update failed, creating new setting:', updateError);
					// If update fails, create a new setting
					const newSetting = await createSetting({
						type: settingType,
						setting: displaySettings,
					});
					setCurrentSettingId(newSetting.id);
				}
			} else {
				// Create new setting
				const newSetting = await createSetting({
					type: settingType,
					setting: displaySettings,
				});
				setCurrentSettingId(newSetting.id);
			}
		} catch (error) {
			console.error('Error saving display settings:', error);
			console.error('Error details:', error.response?.data);
			console.error('Error status:', error.response?.status);
		}
	};

	const handleHiddenColumnsChange = (checkedValues) => {
		setHiddenColumns(checkedValues);
	};

	const handleDateColumnsChange = (values) => {
		setDateColumns(values);
	};

	const handleValueColumnsChange = (values) => {
		setValueColumns(values);
	};

	const handleDateFormatChange = (value) => {
		setDateFormat(value);
	};

	// Display Settings Modal Component
	const DisplaySettingsModal = () => (
		<Modal
			title={`Cài đặt hiển thị - ${selectedMetric?.name}`}
			open={displaySettingsVisible}
			onCancel={closeDisplaySettings}
			footer={[
				<Button key="cancel" onClick={closeDisplaySettings}>
					Hủy
				</Button>,
				<Button key="apply" type="primary" onClick={() => {
					saveDisplaySettings();
					closeDisplaySettings();
				}}>
					Áp dụng & Lưu
				</Button>,
			]}
			width={isMobile ? '95%' : 600}
		>
			<Space direction="vertical" size={16} style={{ width: '100%' }}>

				
				{isLoadingSettings && (
					<div style={{ textAlign: 'center', padding: '20px' }}>
						<Text type="secondary">Đang tải cài đặt...</Text>
					</div>
				)}
				
				{!isLoadingSettings && (
					<>
						{/* Hide Columns Section */}
						<div>
							<Title level={5}>Ẩn/Tắt Cột</Title>
							<Text type="secondary">Chọn các cột bạn muốn ẩn khỏi bảng</Text>
							<div style={{ marginTop: 8 }}>
								<Checkbox.Group
									options={availableColumns.map(col => ({ label: col, value: col }))}
									value={hiddenColumns}
									onChange={handleHiddenColumnsChange}
								/>
							</div>
						</div>

				<Divider />

				{/* Format as Date Section */}
				<div>
					<Title level={5}>Format as Date một số cột</Title>
					<Text type="secondary">Chọn các cột chứa dữ liệu ngày tháng</Text>
					<div style={{ marginTop: 8 }}>
						<Select
							mode="multiple"
							placeholder="Chọn cột ngày tháng"
							value={dateColumns}
							onChange={handleDateColumnsChange}
							style={{ width: '100%' }}
							options={availableColumns.map(col => ({ label: col, value: col }))}
						/>
						<div style={{ marginTop: 8 }}>
							<Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Định dạng ngày tháng:</Text>
							<Select
								placeholder="Chọn định dạng"
								value={dateFormat}
								onChange={handleDateFormatChange}
								style={{ width: '100%' }}
								options={[
									{ label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
									{ label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
								]}
							/>
						</div>
					</div>
				</div>

				<Divider />

				{/* Format as Value Section */}
				<div>
					<Title level={5}>Format as Value một số cột</Title>
					<Text type="secondary">Chọn các cột chứa dữ liệu số để format</Text>
					<div style={{ marginTop: 8 }}>
						<Select
							mode="multiple"
							placeholder="Chọn cột số"
							value={valueColumns}
							onChange={handleValueColumnsChange}
							style={{ width: '100%' }}
							options={availableColumns.map(col => ({ label: col, value: col }))}
						/>
					</div>
				</div>
					</>
				)}
			</Space>
		</Modal>
	);

	return (
		<>
			<Modal
				title={`Chi tiết: ${selectedMetric?.name}`}
				open={visible}
				onCancel={onCancel}
				footer={[
					<Button key="close" onClick={onCancel}>
						Đóng
					</Button>,
				]}
				width={isMobile ? '95%' : 1200}
				style={{ top: '5vh' }}
				bodyStyle={{
					maxHeight: '80vh',
					overflow: 'hidden',
					padding: isMobile ? '5px' : '24px',
				}}
			>
				<Space direction="vertical" size={isMobile ? 12 : 24} style={{
					width: '100%',
					maxHeight: 'calc(80vh - 120px)',
					overflow: 'auto',
					height: '80vh'
				}}>
					{selectedMetric.type === 'chart' ? (
						<>
							<Row gutter={isMobile ? 8 : 16}>
								<Col span={isMobile ? 24 : 12}>
									<Card size="small">
										<Text type="secondary" style={{ fontSize: isMobile ? 10 : 12 }}>Giá trị hiện tại</Text>
										<Title level={isMobile ? 3 : 2} style={{ margin: '8px 0 4px 0' }}>
											{(() => {
												const lastValue = tableData[selectedMetric.id]?.[tableData[selectedMetric.id]?.length - 1]?.value;
												if (lastValue !== undefined && !isNaN(lastValue)) {
													return lastValue.toLocaleString('vn-VN', {
														minimumFractionDigits: 0,
														maximumFractionDigits: 2,
														useGrouping: true,
													});
												}
												return '0';
											})()}
										</Title>
									</Card>
								</Col>
							</Row>

							<div>
								<Title level={isMobile ? 4 : 5}>Biểu đồ</Title>
								<div style={{
									border: '1px solid #f0f0f0',
									borderRadius: '6px',
									padding: '1px',
									backgroundColor: '#fff',
								}}>
									{chartOptions[selectedMetric.id] ? (
										<div style={{
											width: '100%',
											height: isMobile ? '200px' : '280px',
										}}>
											<AgCharts options={chartOptions[selectedMetric.id]} />
										</div>
									) : (
										<div style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											height: '100%',
											backgroundColor: '#fafafa',
											borderRadius: '6px',
											border: '1px dashed #d9d9d9',
										}}>
											<Button
												type="primary"
												onClick={() => onLoadChartData(selectedMetric)}
												loading={loading}
												size={isMobile ? 'small' : 'middle'}
											>
												Tải dữ liệu
											</Button>
										</div>
									)}
								</div>
							</div>

							<div>
								<Title level={isMobile ? 4 : 5}>Bảng dữ liệu</Title>
								<div style={{
									border: '1px solid #f0f0f0',
									borderRadius: '6px',
									overflow: 'hidden',
									maxHeight: isMobile ? '300px' : '400px',
								}}>
									{tableData[selectedMetric.id] ? (
										<Table
											dataSource={prepareTableData(selectedMetric.id)}
											columns={prepareTableColumns(selectedMetric.id)}
											pagination={false}
											size={isMobile ? 'small' : 'small'}
											scroll={{ x: 'max-content', y: isMobile ? 250 : 350 }}
											bordered
											style={{
												backgroundColor: '#fff',
											}}
											rowClassName={(record, index) => {
												if (record.name === 'Giá trị thực hiện') return 'actual-row';
												if (record.name.includes('Benchmark')) return 'benchmark-row';
												if (record.name.includes('% so với')) return 'percentage-row';
												return '';
											}}
										/>
									) : (
										<div style={{
											textAlign: 'center',
											padding: isMobile ? '20px 10px' : '40px 20px',
											backgroundColor: '#fafafa',
											border: '1px dashed #d9d9d9',
										}}>
											<Button
												type="primary"
												onClick={() => onLoadChartData(selectedMetric)}
												loading={loading}
												size={isMobile ? 'small' : 'middle'}
											>
												Tải dữ liệu
											</Button>
										</div>
									)}
								</div>
							</div>
						</>
					) : selectedMetric.type === 'top' ? (
						<>
							<Row gutter={isMobile ? 8 : 16}>
								<Col span={isMobile ? 24 : 12}>
									<Card size="small">
										<Text type="secondary" style={{ fontSize: isMobile ? 10 : 12 }}>Tổng số mục</Text>
										<Title level={isMobile ? 3 : 2} style={{ margin: '8px 0 4px 0' }}>
											{tableData[selectedMetric.id]?.length || 0}
										</Title>
										<Text type="success" style={{ fontSize: isMobile ? 12 : 14 }}>
											Card hiển thị Top {selectedMetric.settings?.topN || 5}
										</Text>
									</Card>
								</Col>
								<Col span={isMobile ? 24 : 12}>
									<Card size="small">
										<Text type="secondary" style={{ fontSize: isMobile ? 10 : 12 }}>Phân loại</Text>
										<Space size={4} style={{ margin: '8px 0' }}>
											<Tag color="default">{selectedMetric.category}</Tag>
										</Space>
										<br />
										<Text type="secondary" style={{ fontSize: isMobile ? 10 : 12 }}>
											Danh sách xếp hạng
										</Text>
									</Card>
								</Col>
							</Row>

							<div>
								<Title level={isMobile ? 4 : 5}>Toàn bộ dữ liệu
									({tableData[selectedMetric.id]?.length || 0} mục)</Title>
								<div style={{
									border: '1px solid #f0f0f0',
									borderRadius: '6px',
									overflow: 'hidden',
									maxHeight: isMobile ? '300px' : '400px',
								}}>
									{tableData[selectedMetric.id] ? (
										<Table
											dataSource={tableData[selectedMetric.id].map((item, index) => ({
												key: index,
												rank: item.rank,
												name: item.name,
												value: item.value,
												percentage: item.percentage,
											}))}
											columns={[
												{
													title: 'Hạng',
													dataIndex: 'rank',
													key: 'rank',
													width: isMobile ? 60 : 80,
													render: (rank) => (
														<div style={{
															width: isMobile ? '20px' : '24px',
															height: isMobile ? '20px' : '24px',
															borderRadius: '50%',
															backgroundColor: rank === 1 ? '#fbbf24' : rank === 2 ? '#9ca3af' : rank === 3 ? '#d97706' : '#6b7280',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															fontSize: isMobile ? '10px' : '12px',
															fontWeight: 'bold',
															color: 'white',
														}}>
															{rank}
														</div>
													),
												},
												{
													title: 'Tên',
													dataIndex: 'name',
													key: 'name',
													render: (name) => <Text strong>{name}</Text>,
												},
												{
													title: 'Giá trị',
													dataIndex: 'value',
													key: 'value',
													align: 'right',
													render: (value, record, index) => {
														const maxValue = Math.max(...tableData[selectedMetric.id]?.map(d => d.value || 0) || []);
														return (
															<div style={{
																display: 'flex',
																alignItems: 'center',
																gap: '8px',
															}}>
																<div style={{
																	width: isMobile ? '40px' : '60px',
																	height: '4px',
																	backgroundColor: '#e5e7eb',
																	borderRadius: '2px',
																	overflow: 'hidden',
																}}>
																	<div style={{
																		width: `${(value / maxValue) * 100}%`,
																		height: '100%',
																		backgroundColor: '#3b82f6',
																		borderRadius: '2px',
																	}} />
																</div>
																<Text style={{
																	fontWeight: 600,
																	minWidth: isMobile ? '60px' : '80px',
																	textAlign: 'right',
																	fontSize: isMobile ? '12px' : '14px',
																}}>
																	{formatCurrency(value)}
																</Text>
															</div>
														);
													},
												},
												{
													title: 'Tỷ lệ',
													dataIndex: 'percentage',
													key: 'percentage',
													align: 'right',
													width: isMobile ? 80 : 100,
													render: (percentage) => (
														<Text style={{ color: '#6b7280', fontSize: isMobile ? '12px' : '14px' }}>
															{percentage.toFixed(1)}%
														</Text>
													),
												},
											]}
											pagination={false}
											size="small"
											scroll={{ x: 'max-content', y: isMobile ? 250 : 350 }}
											bordered
											style={{
												backgroundColor: '#fff',
											}}
										/>
									) : (
										<div style={{
											textAlign: 'center',
											padding: isMobile ? '20px 10px' : '40px 20px',
											backgroundColor: '#fafafa',
											border: '1px dashed #d9d9d9',
										}}>
											<Button
												type="primary"
												onClick={() => onLoadTopData(selectedMetric)}
												loading={loading}
												size={isMobile ? 'small' : 'middle'}
											>
												Tải dữ liệu
											</Button>
										</div>
									)}
								</div>
							</div>
						</>
					) : selectedMetric.type === 'table' || selectedMetric.type === 'table2' || selectedMetric.type === 'table_chart' || selectedMetric.type === 'table_chart_2' ? (
						<>
							<div>
								<div style={{ 
									display: 'flex', 
									justifyContent: 'space-between', 
									alignItems: 'center',
									marginBottom: isMobile ? '8px' : '12px',
									flexDirection: isMobile ? 'column' : 'row',
									gap: isMobile ? '8px' : '0',
								}}>
									<Title level={isMobile ? 4 : 5} style={{ margin: 0 }}>
										{selectedMetric.type === 'table' || selectedMetric.type === 'table2'
											? `Toàn bộ dữ liệu (${rawApprovedVersionData[selectedMetric.id]?.length || 0} dòng)`
											: `Dữ liệu chart (${rawApprovedVersionData[selectedMetric.id]?.length || 0} dòng)`
										}
									</Title>
									{rawApprovedVersionData[selectedMetric.id] && (
										<Space>
											<Button
												icon={<EyeOutlined />}
												onClick={openDisplaySettings}
												size="small"
											>
												Hiển thị
											</Button>
											<Button
												type={isFilterEnabled ? 'primary' : 'default'}
												icon={<FilterOutlined />}
												onClick={toggleFilter}
												size="small"
											>
												{isFilterEnabled ? 'Tắt filter' : 'Bật filter'}
											</Button>
										</Space>
									)}
								</div>
								<div style={{
									border: '1px solid #f0f0f0',
									borderRadius: '6px',
									overflow: 'hidden',
									maxHeight: isMobile ? '600px' : '80vh',
								}}>
									{rawApprovedVersionData[selectedMetric.id] ? (
										<div className='ag-theme-quartz' style={{ 
											width: '100%', 
											height: isMobile ? '450px' : '60vh',
											backgroundColor: '#fff',
										}}>
											<AgGridReact
												rowData={rawApprovedVersionData[selectedMetric.id]}
												columnDefs={buildAgGridColumns(rawApprovedVersionData[selectedMetric.id], selectedMetric.type, selectedMetric.settings)}
												defaultColDef={defaultColDef}
												animateRows={true}
												localeText={AG_GRID_LOCALE_VN}
												statusBar={statusBar}
												enableRangeSelection={true}
												style={{
													backgroundColor: '#fff',
												}}
											/>
										</div>
									) : (
										<div style={{
											textAlign: 'center',
											padding: isMobile ? '20px 10px' : '40px 20px',
											backgroundColor: '#fafafa',
											border: '1px dashed #d9d9d9',
										}}>
											<Button
												type="primary"
												onClick={() => {
													if (selectedMetric.type === 'table' || selectedMetric.type === 'table2') {
														onLoadTableData(selectedMetric);
													} else if (selectedMetric.type === 'table_chart') {
														onLoadTableChart2Data(selectedMetric);
													} else if (selectedMetric.type === 'table_chart_2') {
														onLoadTableChart2Data(selectedMetric);
													}
												}}
												loading={loading}
												size={isMobile ? 'small' : 'middle'}
											>
												Tải dữ liệu
											</Button>
										</div>
									)}
								</div>
							</div>
						</>
					) : (
						<div style={{ textAlign: 'center', color: '#6b7280' }}>
							Loại thẻ không được hỗ trợ
						</div>
					)}
				</Space>
			</Modal>
			
			{/* Display Settings Modal */}
			<DisplaySettingsModal />
		</>
	);
};

export default MetricDetailsModal; 