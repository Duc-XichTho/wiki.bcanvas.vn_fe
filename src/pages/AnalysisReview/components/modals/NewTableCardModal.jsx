import React, { useState, useEffect } from 'react';
import {
	Modal,
	Form,
	Input,
	Select,
	Button,
	Space,
	Row,
	Col,
	Card,
	Typography,
	Divider,
	Checkbox,
	DatePicker,
	message,
	Tooltip,
	Tag,
} from 'antd';
import {
	PlusOutlined,
	MinusCircleOutlined,
	SettingOutlined,
	EyeOutlined,
	EyeInvisibleOutlined,
	ArrowUpOutlined,
	ArrowDownOutlined,
} from '@ant-design/icons';
import { getAllApprovedVersion } from '../../../../apis/approvedVersionTemp.jsx';
import { getAllTemplateTables, getTemplateColumn } from '../../../../apis/templateSettingService.jsx';
import { createNewDashboardItem } from '../tabs/TableAnalysisTabLogic.js';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

export default function NewTableCardModal({ 
	visible, 
	onCancel, 
	onSuccess,
	businessTags = [],
	storeTags = [],
	defaultPrompt = '',
	backgroundColors = { color: '#e2e2e2', bg_color: '#d4d4d4' }
}) {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [approvedVersions, setApprovedVersions] = useState([]);
	const [selectedVersion, setSelectedVersion] = useState(null);
	const [templateColumns, setTemplateColumns] = useState([]);
	const [displayColumns, setDisplayColumns] = useState([]);
	const [dateColumn, setDateColumn] = useState(null);
	const [dateRange, setDateRange] = useState('all');
	const [columnSettings, setColumnSettings] = useState({});
	const [columnSizes, setColumnSizes] = useState({});
	const [dateColumnWidth, setDateColumnWidth] = useState(120);
	const [filterColumn, setFilterColumn] = useState(null);
	const [sortColumn, setSortColumn] = useState(null);
	const [sortType, setSortType] = useState('desc');
	const [dateColumnSize, setDateColumnSize] = useState(2);
	const [collapsedColumns, setCollapsedColumns] = useState({});
	const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

	useEffect(() => {
		if (visible) {
			loadApprovedVersions();
			form.resetFields();
			resetTableSettings();
		}
	}, [visible]);

	const loadApprovedVersions = async () => {
		try {
			const versions = await getAllApprovedVersion();
			const filteredVersions = versions.filter(version => 
				version.apps && version.apps.includes('analysis-review')
			);
			setApprovedVersions(filteredVersions);
		} catch (error) {
			console.error('Error loading approved versions:', error);
			message.error('Lỗi khi tải danh sách approved versions');
		}
	};

	const resetTableSettings = () => {
		setSelectedVersion(null);
		setTemplateColumns([]);
		setDisplayColumns([]);
		setDateColumn(null);
		setDateRange('all');
		setColumnSettings({});
		setColumnSizes({});
		setDateColumnWidth(120);
		setFilterColumn(null);
		setSortColumn(null);
		setSortType('desc');
		setDateColumnSize(2);
		setCollapsedColumns({});
	};

	const handleVersionChange = async (versionId) => {
		if (!versionId) {
			setSelectedVersion(null);
			setTemplateColumns([]);
			return;
		}

		const version = approvedVersions.find(v => v.id == versionId);
		setSelectedVersion(version);

		try {
			// Load template columns
			const columns = await getTemplateColumn(version.id_template);
			if (columns && columns.length > 0) {
				setTemplateColumns(columns);
				// Auto-select first few columns as display columns
				const autoSelectColumns = columns.slice(0, 3).map(col => col.id);
				setDisplayColumns(autoSelectColumns);
			}
		} catch (error) {
			console.error('Error loading template columns:', error);
			message.error('Lỗi khi tải thông tin cột');
		}
	};

	const handleSubmit = async (values) => {
		try {
			setLoading(true);

			const tableSettings = {
				displayColumns,
				dateColumn,
				dateRange,
				columnSettings,
				columnSizes,
				dateColumnWidth,
				filterColumn,
				sortColumn,
				sortType,
				dateColumnSize,
				collapsedColumns,
				templateColumns,
			};

			const newCard = {
				title: values.title,
				type: 'table',
				tag: values.tag,
				storeTag: values.storeTag,
				idData: values.idData,
				prompt: values.prompt || defaultPrompt,
				answer: '',
			};

			await createNewDashboardItem(newCard, tableSettings);
			
			message.success('Thẻ mới đã được tạo thành công!');
			onSuccess();
			onCancel();
		} catch (error) {
			console.error('Error creating new card:', error);
			// Error message is already shown in createNewDashboardItem
		} finally {
			setLoading(false);
		}
	};

	const toggleColumnCollapse = (columnId) => {
		setCollapsedColumns(prev => ({
			...prev,
			[columnId]: !prev[columnId]
		}));
	};

	const updateColumnSetting = (columnId, key, value) => {
		setColumnSettings(prev => ({
			...prev,
			[columnId]: {
				...prev[columnId],
				[key]: value
			}
		}));
	};

	const updateColumnSize = (columnId, value) => {
		setColumnSizes(prev => ({
			...prev,
			[columnId]: value
		}));
	};

	const renderColumnSettings = (column) => {
		const isCollapsed = collapsedColumns[column.id];
		const settings = columnSettings[column.id] || {};
		const size = columnSizes[column.id] || 1;

		return (
			<Card 
				key={column.id} 
				size="small" 
				style={{ marginBottom: 8 }}
				title={
					<Space>
						<Checkbox
							checked={displayColumns.includes(column.id)}
							onChange={(e) => {
								if (e.target.checked) {
									setDisplayColumns(prev => [...prev, column.id]);
								} else {
									setDisplayColumns(prev => prev.filter(id => id !== column.id));
								}
							}}
						>
							{column.columnName}
						</Checkbox>
						<Button
							type="text"
							size="small"
							icon={isCollapsed ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
							onClick={() => toggleColumnCollapse(column.id)}
						/>
					</Space>
				}
			>
				{!isCollapsed && (
					<Row gutter={[16, 8]}>
						<Col span={12}>
							<Text strong>Loại dữ liệu:</Text>
							<Select
								value={settings.type || 'text'}
								onChange={(value) => updateColumnSetting(column.id, 'type', value)}
								style={{ width: '100%', marginTop: 4 }}
							>
								<Option value="text">Văn bản</Option>
								<Option value="date">Ngày tháng</Option>
								<Option value="value">Số liệu</Option>
							</Select>
						</Col>
						<Col span={12}>
							<Text strong>Kích thước cột:</Text>
							<Select
								value={size}
								onChange={(value) => updateColumnSize(column.id, value)}
								style={{ width: '100%', marginTop: 4 }}
							>
								<Option value={1}>1</Option>
								<Option value={2}>2</Option>
								<Option value={3}>3</Option>
								<Option value={4}>4</Option>
							</Select>
						</Col>
						
						{settings.type === 'date' && (
							<Col span={12}>
								<Text strong>Định dạng ngày:</Text>
								<Select
									value={settings.dateFormat || 'DD/MM/YYYY'}
									onChange={(value) => updateColumnSetting(column.id, 'dateFormat', value)}
									style={{ width: '100%', marginTop: 4 }}
								>
									<Option value="DD/MM/YY">DD/MM/YY</Option>
									<Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
									<Option value="MM/DD/YY">MM/DD/YY</Option>
									<Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
								</Select>
							</Col>
						)}
						
						{settings.type === 'value' && (
							<>
								<Col span={12}>
									<Text strong>Số thập phân:</Text>
									<Select
										value={settings.valueFormat?.decimalPlaces || 0}
										onChange={(value) => updateColumnSetting(column.id, 'valueFormat', {
											...settings.valueFormat,
											decimalPlaces: value
										})}
										style={{ width: '100%', marginTop: 4 }}
									>
										<Option value={0}>0</Option>
										<Option value={1}>1</Option>
										<Option value={2}>2</Option>
										<Option value={3}>3</Option>
									</Select>
								</Col>
								<Col span={12}>
									<Checkbox
										checked={settings.valueFormat?.showThousands || false}
										onChange={(e) => updateColumnSetting(column.id, 'valueFormat', {
											...settings.valueFormat,
											showThousands: e.target.checked,
											showMillions: false
										})}
									>
										Hiển thị theo nghìn (K)
									</Checkbox>
								</Col>
								<Col span={12}>
									<Checkbox
										checked={settings.valueFormat?.showMillions || false}
										onChange={(e) => updateColumnSetting(column.id, 'valueFormat', {
											...settings.valueFormat,
											showMillions: e.target.checked,
											showThousands: false
										})}
									>
										Hiển thị theo triệu (M)
									</Checkbox>
								</Col>
								<Col span={12}>
									<Checkbox
										checked={settings.valueFormat?.showPercentage || false}
										onChange={(e) => updateColumnSetting(column.id, 'valueFormat', {
											...settings.valueFormat,
											showPercentage: e.target.checked
										})}
									>
										Hiển thị phần trăm (%)
									</Checkbox>
								</Col>
							</>
						)}
					</Row>
				)}
			</Card>
		);
	};

	return (
		<Modal
			title={
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<PlusOutlined />
					<span>Tạo thẻ mới - Table Analysis</span>
				</div>
			}
			open={visible}
			onCancel={onCancel}
			footer={null}
			width={1000}
			style={{
				'--color': backgroundColors.color,
				'--bg-color': backgroundColors.bg_color,
			}}
		>
			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
				initialValues={{
					tag: 'Revenue',
					storeTag: 'Sales',
					dateRange: 'all',
					sortType: 'desc',
					dateColumnSize: 2,
					dateColumnWidth: 120,
				}}
			>
				<Row gutter={[16, 16]}>
					{/* Basic Information */}
					<Col span={24}>
						<Card size="small" title="Thông tin cơ bản">
							<Row gutter={[16, 16]}>
								<Col span={12}>
									<Form.Item
										name="title"
										label="Tên thẻ"
										rules={[{ required: true, message: 'Vui lòng nhập tên thẻ!' }]}
									>
										<Input placeholder="Nhập tên thẻ..." />
									</Form.Item>
								</Col>
								<Col span={6}>
									<Form.Item
										name="tag"
										label="Thẻ kinh doanh"
										rules={[{ required: true, message: 'Vui lòng chọn thẻ!' }]}
									>
										<Select placeholder="Chọn thẻ">
											{businessTags.map(tag => (
												<Option key={tag} value={tag}>{tag}</Option>
											))}
										</Select>
									</Form.Item>
								</Col>
								<Col span={6}>
									<Form.Item
										name="storeTag"
										label="Thẻ cửa hàng"
										rules={[{ required: true, message: 'Vui lòng chọn thẻ!' }]}
									>
										<Select placeholder="Chọn thẻ">
											{storeTags.map(tag => (
												<Option key={tag} value={tag}>{tag}</Option>
											))}
										</Select>
									</Form.Item>
								</Col>
							</Row>
						</Card>
					</Col>

					{/* Data Selection */}
					<Col span={24}>
						<Card size="small" title="Chọn dữ liệu">
							<Row gutter={[16, 16]}>
								<Col span={12}>
									<Form.Item
										name="idData"
										label="Dữ liệu nguồn"
										rules={[{ required: true, message: 'Vui lòng chọn dữ liệu!' }]}
									>
										<Select
											placeholder="Chọn dữ liệu..."
											onChange={handleVersionChange}
											showSearch
											filterOption={(input, option) =>
												option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
											}
										>
											{approvedVersions.map(version => (
												<Option key={version.id} value={version.id}>
													{version.name || `Version ${version.id}`}
												</Option>
											))}
										</Select>
									</Form.Item>
								</Col>
								<Col span={12}>
									<Form.Item
										name="dateRange"
										label="Phạm vi thời gian"
									>
										<Select>
											<Option value="all">Tất cả</Option>
											<Option value="today">Hôm nay</Option>
											<Option value="yesterday">Hôm qua</Option>
											<Option value="thisWeek">Tuần này</Option>
											<Option value="lastWeek">Tuần trước</Option>
											<Option value="thisMonth">Tháng này</Option>
											<Option value="lastMonth">Tháng trước</Option>
											<Option value="last7Days">7 ngày qua</Option>
											<Option value="last30Days">30 ngày qua</Option>
											<Option value="thisYear">Năm nay</Option>
											<Option value="lastYear">Năm trước</Option>
										</Select>
									</Form.Item>
								</Col>
							</Row>
						</Card>
					</Col>

					{/* Column Configuration */}
					{selectedVersion && templateColumns.length > 0 && (
						<Col span={24}>
							<Card 
								size="small" 
								title={
									<Space>
										<span>Cấu hình cột hiển thị</span>
										<Button
											type="text"
											size="small"
											icon={showAdvancedSettings ? <EyeInvisibleOutlined /> : <EyeOutlined />}
											onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
										>
											{showAdvancedSettings ? 'Ẩn cài đặt nâng cao' : 'Hiện cài đặt nâng cao'}
										</Button>
									</Space>
								}
							>
								<Row gutter={[16, 16]}>
									<Col span={12}>
										<Form.Item label="Cột thời gian">
											<Select
												placeholder="Chọn cột thời gian (tùy chọn)"
												value={dateColumn}
												onChange={setDateColumn}
												allowClear
											>
												{templateColumns
													.filter(col => col.dataType === 'date' || col.dataType === 'datetime')
													.map(col => (
														<Option key={col.id} value={col.id}>
															{col.columnName}
														</Option>
													))
												}
											</Select>
										</Form.Item>
									</Col>
									{showAdvancedSettings && (
										<Col span={12}>
											<Form.Item label="Độ rộng cột thời gian">
												<Select
													value={dateColumnWidth}
													onChange={setDateColumnWidth}
												>
													<Option value={80}>80px</Option>
													<Option value={100}>100px</Option>
													<Option value={120}>120px</Option>
													<Option value={150}>150px</Option>
													<Option value={200}>200px</Option>
												</Select>
											</Form.Item>
										</Col>
									)}
								</Row>

								<Divider orientation="left">Các cột dữ liệu</Divider>
								
								{templateColumns.map(renderColumnSettings)}

								{showAdvancedSettings && (
									<>
										<Divider orientation="left">Cài đặt nâng cao</Divider>
										<Row gutter={[16, 16]}>
											<Col span={8}>
												<Form.Item label="Cột lọc">
													<Select
														placeholder="Chọn cột lọc"
														value={filterColumn}
														onChange={setFilterColumn}
														allowClear
													>
														{templateColumns.map(col => (
															<Option key={col.id} value={col.id}>
																{col.columnName}
															</Option>
														))}
													</Select>
												</Form.Item>
											</Col>
											<Col span={8}>
												<Form.Item label="Cột sắp xếp">
													<Select
														placeholder="Chọn cột sắp xếp"
														value={sortColumn}
														onChange={setSortColumn}
														allowClear
													>
														{templateColumns.map(col => (
															<Option key={col.id} value={col.id}>
																{col.columnName}
															</Option>
														))}
													</Select>
												</Form.Item>
											</Col>
											<Col span={8}>
												<Form.Item label="Kiểu sắp xếp">
													<Select value={sortType} onChange={setSortType}>
														<Option value="asc">Tăng dần</Option>
														<Option value="desc">Giảm dần</Option>
													</Select>
												</Form.Item>
											</Col>
										</Row>
									</>
								)}
							</Card>
						</Col>
					)}

					{/* AI Prompt */}
					<Col span={24}>
						<Card size="small" title="Prompt AI (tùy chọn)">
							<Form.Item name="prompt">
								<TextArea
									rows={4}
									placeholder="Nhập prompt tùy chỉnh cho AI phân tích... (để trống sẽ sử dụng prompt mặc định)"
									defaultValue={defaultPrompt}
								/>
							</Form.Item>
						</Card>
					</Col>
				</Row>

				{/* Action Buttons */}
				<div style={{ textAlign: 'right', marginTop: 16 }}>
					<Space>
						<Button onClick={onCancel}>
							Hủy
						</Button>
						<Button 
							type="primary" 
							htmlType="submit" 
							loading={loading}
							disabled={!selectedVersion || displayColumns.length === 0}
						>
							Tạo thẻ
						</Button>
					</Space>
				</div>
			</Form>
		</Modal>
	);
}
