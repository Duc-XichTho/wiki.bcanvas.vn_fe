import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Card, Checkbox, Col, Input, Modal, Row, Select, Space, Typography } from 'antd';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MyContext } from '../../../../MyContext.jsx';

const { Text } = Typography;
const { Option } = Select;

// Memoized Column Settings Component
const ColumnSettingsCard = memo(function ColumnSettingsCard({
	columnId,
	columnName,
	columnSetting,
	columnSize,
	isCollapsed,
	onColumnSettingChange,
	onColumnSizeChange,
	onColumnValueFormatChange,
	onToggleCollapse,
}) {
	const handleColumnSettingChange = useCallback((field, value) => {
		onColumnSettingChange(columnId, field, value);
	}, [columnId, onColumnSettingChange]);

	const handleColumnValueFormatChange = useCallback((field, value) => {
		onColumnValueFormatChange(columnId, field, value);
	}, [columnId, onColumnValueFormatChange]);

	const handleColumnSizeChange = useCallback((value) => {
		onColumnSizeChange(columnId, value);
	}, [columnId, onColumnSizeChange]);

	const handleToggleCollapse = useCallback(() => {
		onToggleCollapse(columnId);
	}, [columnId, onToggleCollapse]);

	return (
		<Card
			key={columnId}
			size="small"
			style={{ marginBottom: '8px' }}
			title={
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						cursor: 'pointer',
					}}
					onClick={handleToggleCollapse}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						{isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
						<Text strong>{columnName}</Text>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<Text type="secondary" style={{ fontSize: '12px' }}>
							Kích thước:
						</Text>
						<Select
							size="small"
							value={columnSize}
							onChange={handleColumnSizeChange}
							style={{ width: '80px' }}
						>
							<Option value={1}>1</Option>
							<Option value={2}>2</Option>
							<Option value={3}>3</Option>
							<Option value={4}>4</Option>
							<Option value={6}>6</Option>
							<Option value={8}>8</Option>
							<Option value={12}>12</Option>
						</Select>
					</div>
				</div>
			}
		>
			{!isCollapsed && (
				<div style={{ padding: '8px 32px' }}>
					<div style={{ display: 'flex', gap: '16px' }}>
						<div style={{ width: '30%' }}>
							<Text strong>Loại dữ liệu</Text>
						</div>
						<div style={{ width: '70%' }}>
							<Select
								value={columnSetting.type}
								onChange={(value) => handleColumnSettingChange('type', value)}
								style={{ width: '100%' }}
							>
								<Option value="date">Ngày tháng</Option>
								<Option value="value">Giá trị</Option>
								<Option value="dataBar">Data Bar</Option>
								<Option value="text">Chữ</Option>
							</Select>
						</div>
					</div>

					{columnSetting.type === 'date' && (
						<div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
							<div style={{ width: '30%' }}>
								<Text strong>Định dạng ngày</Text>
							</div>
							<div style={{ width: '70%' }}>
								<Select
									value={columnSetting.dateFormat}
									onChange={(value) => handleColumnSettingChange('dateFormat', value)}
									style={{ width: '100%' }}
								>
									<Option value="DD/MM/YY">DD/MM/YY</Option>
									<Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
									<Option value="MM/DD/YY">MM/DD/YY</Option>
									<Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
								</Select>
							</div>
						</div>
					)}

					{(columnSetting.type === 'value' || columnSetting.type === 'dataBar') && (
						<>
							<div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
								<div style={{ width: '30%' }}>
									<Text strong>Định dạng hiển thị</Text>
								</div>
								<div style={{ width: '70%' }}>
									<Space direction="vertical" style={{ width: '100%' }}>
										<div>
											<Checkbox
												checked={columnSetting.showCurrency}
												onChange={(e) => handleColumnSettingChange('showCurrency', e.target.checked)}
											>
												Hiển thị ký hiệu tiền tệ
											</Checkbox>
										</div>
										<div>
											<Checkbox
												checked={columnSetting.showPercentage}
												onChange={(e) => handleColumnSettingChange('showPercentage', e.target.checked)}
											>
												Hiển thị phần trăm
											</Checkbox>
										</div>
										<div>
											<Checkbox
												checked={columnSetting.showThousandsSeparator}
												onChange={(e) => handleColumnSettingChange('showThousandsSeparator', e.target.checked)}
											>
												Hiển thị dấu phân cách hàng nghìn
											</Checkbox>
										</div>
									</Space>
								</div>
							</div>

							<div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
								<div style={{ width: '30%' }}>
									<Text strong>Số chữ số thập phân</Text>
								</div>
								<div style={{ width: '70%' }}>
									<Select
										value={columnSetting.decimalPlaces}
										onChange={(value) => handleColumnSettingChange('decimalPlaces', value)}
										style={{ width: '100%' }}
									>
										<Option value={0}>0</Option>
										<Option value={1}>1</Option>
										<Option value={2}>2</Option>
										<Option value={3}>3</Option>
										<Option value={4}>4</Option>
									</Select>
								</div>
							</div>

							{columnSetting.type === 'dataBar' && (
								<div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
									<div style={{ width: '30%' }}>
										<Text strong>Màu sắc</Text>
									</div>
									<div style={{ width: '70%' }}>
										<Select
											value={columnSetting.barColor}
											onChange={(value) => handleColumnSettingChange('barColor', value)}
											style={{ width: '100%' }}
										>
											<Option value="blue">Xanh dương</Option>
											<Option value="green">Xanh lá</Option>
											<Option value="red">Đỏ</Option>
											<Option value="orange">Cam</Option>
											<Option value="purple">Tím</Option>
										</Select>
									</div>
								</div>
							)}
						</>
					)}

					{columnSetting.type === 'text' && (
						<div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
							<div style={{ width: '30%' }}>
								<Text strong>Tùy chọn văn bản</Text>
							</div>
							<div style={{ width: '70%' }}>
								<Space direction="vertical" style={{ width: '100%' }}>
									<Checkbox
										checked={columnSetting.textWrap}
										onChange={(e) => handleColumnSettingChange('textWrap', e.target.checked)}
									>
										Xuống dòng tự động
									</Checkbox>
									<Checkbox
										checked={columnSetting.textAlign}
										onChange={(e) => handleColumnSettingChange('textAlign', e.target.checked)}
									>
										Căn giữa
									</Checkbox>
								</Space>
							</div>
						</div>
					)}
				</div>
			)}
		</Card>
	);
});

const CreateTableModalOptimized = memo(function CreateTableModalOptimized({
	visible,
	onCancel,
	onCreate,
	loading,
	approvedVersions,
	initialData = {},
}) {
	const { user } = useContext(MyContext);

	// Internal state management
	const [newCard, setNewCard] = useState({
		name: '',
		description: '',
		tag: 'Revenue',
		category: 'Revenue',
		storeTag: 'Sales',
		storeCategory: 'Sales',
		...initialData,
	});

	const [newTemplateColumns, setNewTemplateColumns] = useState([]);
	const [newTableDisplayColumns, setNewTableDisplayColumns] = useState([]);
	const [newTableDateColumn, setNewTableDateColumn] = useState(null);
	const [newTableDateRange, setNewTableDateRange] = useState('all');
	const [newTableDateColumnSize, setNewTableDateColumnSize] = useState(2);
	const [newTableTimeThreshold, setNewTableTimeThreshold] = useState(null);
	const [newTableColumnSettings, setNewTableColumnSettings] = useState({});
	const [newTableColumnSizes, setNewTableColumnSizes] = useState({});
	const [newTableFilterColumn, setNewTableFilterColumn] = useState(null);
	const [newTableSortColumn, setNewTableSortColumn] = useState(null);
	const [newTableSortType, setNewTableSortType] = useState('desc');
	const [newCollapsedColumns, setNewCollapsedColumns] = useState({});

	// Initialize state when modal opens
	useEffect(() => {
		if (visible) {
			// Reset all state to initial values
			setNewCard({
				name: '',
				description: '',
				tag: 'Revenue',
				category: 'Revenue',
				storeTag: 'Sales',
				storeCategory: 'Sales',
				...initialData,
			});
			setNewTemplateColumns([]);
			setNewTableDisplayColumns([]);
			setNewTableDateColumn(null);
			setNewTableDateRange('all');
			setNewTableDateColumnSize(2);
			setNewTableTimeThreshold(null);
			setNewTableColumnSettings({});
			setNewTableColumnSizes({});
			setNewTableFilterColumn(null);
			setNewTableSortColumn(null);
			setNewTableSortType('desc');
			setNewCollapsedColumns({});
		}
	}, [visible, initialData]);

	// Memoized handlers
	const handleNewCardChange = useCallback((field, value) => {
		setNewCard(prev => ({ ...prev, [field]: value }));
	}, []);

	const handleApprovedVersionChange = useCallback((value) => {
		// This would typically fetch template columns based on approved version
		// For now, we'll just update the state
		console.log('Approved version changed:', value);
	}, []);

	const handleDisplayColumnsChange = useCallback((values) => {
		setNewTableDisplayColumns(values);

		// Auto-create column settings for new columns
		const newColumnSettings = { ...newTableColumnSettings };
		const newCollapsedState = { ...newCollapsedColumns };

		values.forEach(columnId => {
			if (!newColumnSettings[columnId]) {
				newColumnSettings[columnId] = {
					type: 'text',
					dateFormat: 'DD/MM/YYYY',
					showCurrency: false,
					showPercentage: false,
					showThousandsSeparator: true,
					decimalPlaces: 2,
					barColor: 'blue',
					textWrap: true,
					textAlign: false,
				};
			}
			if (!newCollapsedState[columnId]) {
				newCollapsedState[columnId] = false;
			}
		});

		// Remove settings for unselected columns
		Object.keys(newColumnSettings).forEach(columnId => {
			if (!values.includes(columnId)) {
				delete newColumnSettings[columnId];
				delete newCollapsedState[columnId];
			}
		});

		setNewTableColumnSettings(newColumnSettings);
		setNewCollapsedColumns(newCollapsedState);
	}, [newTableColumnSettings, newCollapsedColumns]);

	const handleColumnSettingChange = useCallback((columnId, field, value) => {
		setNewTableColumnSettings(prev => ({
			...prev,
			[columnId]: {
				...prev[columnId],
				[field]: value,
			},
		}));
	}, []);

	const handleColumnSizeChange = useCallback((columnId, value) => {
		setNewTableColumnSizes(prev => ({
			...prev,
			[columnId]: value,
		}));
	}, []);

	const handleColumnValueFormatChange = useCallback((columnId, field, value) => {
		setNewTableColumnSettings(prev => ({
			...prev,
			[columnId]: {
				...prev[columnId],
				[field]: value,
			},
		}));
	}, []);

	const toggleColumnCollapse = useCallback((columnId) => {
		setNewCollapsedColumns(prev => ({
			...prev,
			[columnId]: !prev[columnId],
		}));
	}, []);

	const handleCreate = useCallback(() => {
		const tableData = {
			newCard,
			newTemplateColumns,
			newTableDisplayColumns,
			newTableDateColumn,
			newTableDateRange,
			newTableDateColumnSize,
			newTableTimeThreshold,
			newTableColumnSettings,
			newTableColumnSizes,
			newTableFilterColumn,
			newTableSortColumn,
			newTableSortType,
		};
		onCreate(tableData);
	}, [
		newCard,
		newTemplateColumns,
		newTableDisplayColumns,
		newTableDateColumn,
		newTableDateRange,
		newTableDateColumnSize,
		newTableTimeThreshold,
		newTableColumnSettings,
		newTableColumnSizes,
		newTableFilterColumn,
		newTableSortColumn,
		newTableSortType,
		onCreate,
	]);

	// Memoized column options
	const columnOptions = useMemo(() => {
		return newTemplateColumns.map(col => (
			<Option key={col.id} value={col.id}>
				{col.columnName}
			</Option>
		));
	}, [newTemplateColumns]);

	// Memoized display columns
	const displayColumns = useMemo(() => {
		return newTableDisplayColumns.map(colId => {
			const col = newTemplateColumns.find(c => c.id === colId);
			return col ? { id: colId, name: col.columnName } : null;
		}).filter(Boolean);
	}, [newTableDisplayColumns, newTemplateColumns]);

	return (
		<Modal
			title="Tạo bảng mới"
			open={visible}
			onCancel={onCancel}
			onOk={handleCreate}
			confirmLoading={loading}
			width={1200}
			okText="Tạo bảng"
			cancelText="Hủy"
		>
			<div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
				<Row gutter={[16, 16]}>
					{/* Basic Information */}
					<Col span={24}>
						<Card title="Thông tin cơ bản" size="small">
							<Row gutter={[16, 16]}>
								<Col span={12}>
									<Text strong>Tên bảng:</Text>
									<Input
										value={newCard.name}
										onChange={(e) => handleNewCardChange('name', e.target.value)}
										placeholder="Nhập tên bảng"
										style={{ marginTop: '4px' }}
									/>
								</Col>
								<Col span={12}>
									<Text strong>Mô tả:</Text>
									<Input
										value={newCard.description}
										onChange={(e) => handleNewCardChange('description', e.target.value)}
										placeholder="Nhập mô tả"
										style={{ marginTop: '4px' }}
									/>
								</Col>
								<Col span={12}>
									<Text strong>Phiên bản dữ liệu:</Text>
									<Select
										value={newCard.idData}
										onChange={(value) => {
											handleNewCardChange('idData', value);
											handleApprovedVersionChange(value);
										}}
										style={{ width: '100%', marginTop: '4px' }}
										placeholder="Chọn phiên bản dữ liệu"
									>
										{approvedVersions?.map(version => (
											<Option key={version.id} value={version.id}>
												{version.name}
											</Option>
										))}
									</Select>
								</Col>
								<Col span={12}>
									<Text strong>Tag:</Text>
									<Input
										value={newCard.tag}
										onChange={(e) => handleNewCardChange('tag', e.target.value)}
										placeholder="Nhập tag"
										style={{ marginTop: '4px' }}
									/>
								</Col>
							</Row>
						</Card>
					</Col>

					{/* Table Configuration */}
					<Col span={24}>
						<Card title="Cấu hình bảng" size="small">
							<Row gutter={[16, 16]}>
								<Col span={12}>
									<Text strong>Cột hiển thị:</Text>
									<Select
										mode="multiple"
										value={newTableDisplayColumns}
										onChange={handleDisplayColumnsChange}
										style={{ width: '100%', marginTop: '4px' }}
										placeholder="Chọn cột hiển thị"
									>
										{columnOptions}
									</Select>
								</Col>
								<Col span={12}>
									<Text strong>Cột ngày tháng:</Text>
									<Select
										value={newTableDateColumn}
										onChange={setNewTableDateColumn}
										style={{ width: '100%', marginTop: '4px' }}
										placeholder="Chọn cột ngày tháng"
										allowClear
									>
										{columnOptions}
									</Select>
								</Col>
								<Col span={12}>
									<Text strong>Khoảng thời gian:</Text>
									<Select
										value={newTableDateRange}
										onChange={setNewTableDateRange}
										style={{ width: '100%', marginTop: '4px' }}
									>
										<Option value="all">Tất cả</Option>
										<Option value="last7days">7 ngày qua</Option>
										<Option value="last30days">30 ngày qua</Option>
										<Option value="last90days">90 ngày qua</Option>
										<Option value="last365days">365 ngày qua</Option>
									</Select>
								</Col>
								<Col span={12}>
									<Text strong>Kích thước cột ngày:</Text>
									<Select
										value={newTableDateColumnSize}
										onChange={setNewTableDateColumnSize}
										style={{ width: '100%', marginTop: '4px' }}
									>
										<Option value={1}>1</Option>
										<Option value={2}>2</Option>
										<Option value={3}>3</Option>
										<Option value={4}>4</Option>
										<Option value={6}>6</Option>
										<Option value={8}>8</Option>
										<Option value={12}>12</Option>
									</Select>
								</Col>
							</Row>
						</Card>
					</Col>

					{/* Column Settings */}
					{displayColumns.length > 0 && (
						<Col span={24}>
							<Card title="Cài đặt cột" size="small">
								{displayColumns.map(column => (
									<ColumnSettingsCard
										key={column.id}
										columnId={column.id}
										columnName={column.name}
										columnSetting={newTableColumnSettings[column.id] || {
											type: 'text',
											dateFormat: 'DD/MM/YYYY',
											showCurrency: false,
											showPercentage: false,
											showThousandsSeparator: true,
											decimalPlaces: 2,
											barColor: 'blue',
											textWrap: true,
											textAlign: false,
										}}
										columnSize={newTableColumnSizes[column.id] || 2}
										isCollapsed={newCollapsedColumns[column.id] || false}
										onColumnSettingChange={handleColumnSettingChange}
										onColumnSizeChange={handleColumnSizeChange}
										onColumnValueFormatChange={handleColumnValueFormatChange}
										onToggleCollapse={toggleColumnCollapse}
									/>
								))}
							</Card>
						</Col>
					)}
				</Row>
			</div>
		</Modal>
	);
});

export default CreateTableModalOptimized;
