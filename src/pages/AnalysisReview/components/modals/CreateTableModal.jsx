import React, { useContext, memo, useCallback, useState, useEffect } from 'react';
import {
	Button,
	Card,
	Checkbox,
	Col,
	Input,
	Modal,
	Row,
	Select,
	Space,
	Typography,
} from 'antd';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { BarChartOutlined, TableOutlined } from '@ant-design/icons';
import { MyContext } from '../../../../MyContext.jsx';

const { Text } = Typography;
const { Option } = Select;

// Memoized Column Settings Component
const ColumnSettingsCard = memo(function ColumnSettingsCard({
	columnId,
	columnName,
	columnSetting,
	newTableColumnSizes,
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
			size="small"
			style={{ marginTop: 8, marginBottom: 8 }}
			bodyStyle={{ padding: 0 }}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					padding: '12px 16px',
					borderBottom: isCollapsed ? 'none' : '1px solid #f0f0f0',
					cursor: 'pointer',
					backgroundColor: '#fafafa',
				}}
				onClick={handleToggleCollapse}
			>
				<div style={{
					width: '30%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}>
					<Text strong style={{ margin: 0 }}>{columnName}</Text>
				</div>
				<div style={{
					width: '70%',
					paddingLeft: '16px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}>
					<Text type="secondary" style={{ fontSize: '12px' }}>
						{columnSetting.type === 'date' ? 'Ngày tháng' : 
						 columnSetting.type === 'value' ? 'Giá trị' : 
						 columnSetting.type === 'dataBar' ? 'Data Bar' : 
						 columnSetting.type === 'text' ? 'Chữ' : 'Giá trị'}
						{columnSetting.type === 'date' && ` - ${columnSetting.dateFormat}`}
						{(columnSetting.type === 'value' || columnSetting.type === 'dataBar') && (
							<>
								{columnSetting.valueFormat.showThousands && ' - K'}
								{columnSetting.valueFormat.showMillions && ' - M'}
								{columnSetting.valueFormat.showPercentage && ' - %'}
								{columnSetting.valueFormat.decimalPlaces > 0 && ` - ${columnSetting.valueFormat.decimalPlaces}dp`}
							</>
						)}
						{newTableColumnSizes[columnId] && ` - Size ${newTableColumnSizes[columnId]}`}
					</Text>
					{isCollapsed ? <ChevronRight /> : <ChevronDown />}
				</div>
			</div>

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
												checked={columnSetting.valueFormat.showThousands}
												onChange={(e) => handleColumnValueFormatChange('showThousands', e.target.checked)}
											>
												Thể hiện hàng nghìn (K)
											</Checkbox>
										</div>
										<div>
											<Checkbox
												checked={columnSetting.valueFormat.showMillions}
												onChange={(e) => handleColumnValueFormatChange('showMillions', e.target.checked)}
											>
												Thể hiện hàng triệu (M)
											</Checkbox>
										</div>
										<div>
											<Checkbox
												checked={columnSetting.valueFormat.showPercentage}
												onChange={(e) => handleColumnValueFormatChange('showPercentage', e.target.checked)}
											>
												Thể hiện dạng %
											</Checkbox>
										</div>
										<div>
											<Checkbox
												checked={columnSetting.valueFormat.negativeRed}
												onChange={(e) => handleColumnValueFormatChange('negativeRed', e.target.checked)}
											>
												Số âm màu đỏ
											</Checkbox>
										</div>
									</Space>
								</div>
							</div>

							<div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
								<div style={{ width: '30%' }}>
									<Text strong>Số thập phân</Text>
								</div>
								<div style={{ width: '70%' }}>
									<Select
										value={columnSetting.valueFormat.decimalPlaces}
										onChange={(value) => handleColumnValueFormatChange('decimalPlaces', value)}
										style={{ width: '100%' }}
									>
										<Option value={0}>0 (không có thập phân)</Option>
										<Option value={1}>1</Option>
										<Option value={2}>2</Option>
									</Select>
								</div>
							</div>

							<div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
								<div style={{ width: '30%' }}>
									<Text strong>Kích thước cột</Text>
								</div>
								<div style={{ width: '70%' }}>
									<Select
										value={newTableColumnSizes[columnId] || 2}
										onChange={handleColumnSizeChange}
										style={{ width: '100%' }}
									>
										<Option value={0.5}>Rất nhỏ (0.5)</Option>
										<Option value={1}>Nhỏ (1)</Option>
										<Option value={2}>Vừa (2)</Option>
										<Option value={3}>Lớn (3)</Option>
									</Select>
								</div>
							</div>
						</>
					)}
				</div>
			)}
		</Card>
	);
});

const CreateTableModal = memo(function CreateTableModal({
	visible,
	onCancel,
	onCreate,
	loading,
	approvedVersions,
	newCard,
	setNewCard,
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
	newCollapsedColumns,
	onApprovedVersionChange,
	onDisplayColumnsChange,
	onDateColumnChange,
	onDateRangeChange,
	onDateColumnSizeChange,
	onTimeThresholdChange,
	onFilterColumnChange,
	onSortColumnChange,
	onSortTypeChange,
	onColumnSettingChange,
	onColumnSizeChange,
	onColumnValueFormatChange,
	toggleColumnCollapse,
	businessTags = [],
	storeTags = [],
}) {
	const { currentUser } = useContext(MyContext);
	// Local state for input fields to prevent re-render
	const [localInputs, setLocalInputs] = useState({
		title: '',
		tag: '',
		storeTag: '',
	});

	// Sync with parent state when modal opens
	useEffect(() => {
		if (visible) {
			setLocalInputs({
				title: newCard.title || '',
				tag: newCard.tag || '',
				storeTag: newCard.storeTag || '',
			});
		}
	}, [visible, newCard.title, newCard.tag, newCard.storeTag]);

	// Only update local state, don't sync to parent until save
	const handleInputChange = useCallback((field, value) => {
		setLocalInputs(prev => ({ ...prev, [field]: value }));
	}, []);

	// Sync local inputs to parent state before creating
	const handleCreate = useCallback(() => {
		// Prepare the complete card data with local inputs
		const completeCardData = {
			...newCard,
			title: localInputs.title,
			tag: localInputs.tag,
			storeTag: localInputs.storeTag,
		};
		
		console.log('Sending data to parent:', completeCardData);
		
		// Call the original onCreate function with the complete data
		onCreate(completeCardData);
	}, [localInputs, newCard, onCreate]);
	return (
		<Modal
			title="Tạo thẻ mới - Bảng dữ liệu"
			open={visible}
			onCancel={onCancel}
			footer={[
				<Button key="cancel" onClick={onCancel}>
					Hủy bỏ
				</Button>,
				<Button
					key="create"
					type="primary"
					onClick={handleCreate}
					disabled={!localInputs.title.trim()}
					loading={loading}
				>
					Tạo thẻ
				</Button>
			]}
			width={1200}
		>
			<Space direction="vertical" size={16} style={{ width: '100%' }}>
				<div>
					<Text strong>Tiêu đề thẻ *</Text>
					<Input
						value={localInputs.title}
						onChange={(e) => handleInputChange('title', e.target.value)}
						placeholder="Nhập tiêu đề thẻ..."
						style={{ marginTop: 8 }}
					/>
				</div>
				<div>
					<Text strong>Chọn dữ liệu *</Text>
					<Select
						value={newCard.idData}
						onChange={onApprovedVersionChange}
						style={{ width: '100%', marginTop: 8 }}
						placeholder="Chọn dữ liệu"
						showSearch
						filterOption={(input, option) =>
							option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
						}
						loading={loading}
					>
						{approvedVersions.map(version => (
							<Option key={version.id} value={version.id}>
								{version.name}
							</Option>
						))}
					</Select>
				</div>

				{newTemplateColumns.length > 0 && (
					<>
						<Row gutter={16}>
							<Col span={8}>
								<div>
									<Text strong>Thời gian</Text>
									<Select
										value={newTableDateColumn || undefined}
										onChange={onDateColumnChange}
										style={{ width: '100%', marginTop: 8 }}
										placeholder="Chọn cột thời gian (tùy chọn)"
										showSearch
										filterOption={(input, option) =>
											option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
										}
										allowClear
									>
										{newTemplateColumns
											.map(col => (
												<Option key={col.id} value={col.id}>
													{col.columnName}
												</Option>
											))}
									</Select>
								</div>
							</Col>
							<Col span={8}>
								<div>
									<Text strong>Khoảng thời gian mặc định</Text>
									<Select
										value={newTableDateRange}
										onChange={onDateRangeChange}
										style={{ width: '100%', marginTop: 8 }}
										placeholder="Chọn khoảng thời gian mặc định"
									>
										<Option value="all">Tất cả dữ liệu</Option>
										<Option value="today">Hôm nay</Option>
										<Option value="yesterday">Hôm qua</Option>
										<Option value="thisWeek">Tuần này</Option>
										<Option value="lastWeek">Tuần trước</Option>
										<Option value="thisMonth">Tháng này</Option>
										<Option value="lastMonth">Tháng trước</Option>
										<Option value="last7Days">7 ngày gần nhất</Option>
										<Option value="last15Days">15 ngày gần nhất</Option>
										<Option value="last30Days">30 ngày gần nhất</Option>
										<Option value="last90Days">90 ngày gần nhất</Option>
										<Option value="thisYear">Năm nay</Option>
										<Option value="lastYear">Năm trước</Option>
									</Select>
									<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
										Khoảng thời gian này sẽ được áp dụng mặc định khi xem bảng
									</Text>
								</div>
							</Col>
							<Col span={8}>
								<div>
									<Text strong>Kích thước cột thời gian</Text>
									<Select
										value={newTableDateColumnSize}
										onChange={onDateColumnSizeChange}
										style={{ width: '100%', marginTop: 8 }}
										placeholder="Chọn kích thước cột thời gian"
									>
										<Option value={0.5}>Rất nhỏ (0.5)</Option>
										<Option value={1}>Nhỏ (1)</Option>
										<Option value={2}>Vừa (2)</Option>
										<Option value={3}>Lớn (3)</Option>
									</Select>
									<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
										Kích thước cột thời gian trong bảng
									</Text>
								</div>
							</Col>
						</Row>

						{/*<Row gutter={16}>*/}
						{/*	<Col span={8}>*/}
						{/*		<div>*/}
						{/*			<Text strong>Mốc thời gian phân tích AI</Text>*/}
						{/*			<Input*/}
						{/*				type="datetime-local"*/}
						{/*				value={newTableTimeThreshold || ''}*/}
						{/*				onChange={(e) => onTimeThresholdChange(e.target.value)}*/}
						{/*				style={{ width: '100%', marginTop: 8 }}*/}
						{/*				placeholder="Chọn mốc thời gian (tùy chọn)"*/}
						{/*			/>*/}
						{/*			<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>*/}
						{/*				Khi chạy AI, chỉ phân tích dữ liệu từ mốc thời gian này trở đi*/}
						{/*			</Text>*/}
						{/*		</div>*/}
						{/*	</Col>*/}
						{/*</Row>*/}

						<Row gutter={16}>
							<Col span={8}>
								<div>
									<Text strong>Cột lọc dữ liệu</Text>
									<Select
										value={newTableFilterColumn || undefined}
										onChange={onFilterColumnChange}
										style={{ width: '100%', marginTop: 8 }}
										placeholder="Chọn cột để lọc (tùy chọn)"
										showSearch
										filterOption={(input, option) =>
											option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
										}
										allowClear
									>
										{newTemplateColumns.map(col => (
											<Option key={col.id} value={col.id}>
												{col.columnName}
											</Option>
										))}
									</Select>
									<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
										Chọn cột để hiển thị bộ lọc bên cạnh bộ lọc thời gian
									</Text>
								</div>
							</Col>
							<Col span={8}>
								<div>
									<Text strong>Cột sắp xếp dữ liệu</Text>
									<Select
										value={newTableSortColumn || undefined}
										onChange={onSortColumnChange}
										style={{ width: '100%', marginTop: 8 }}
										placeholder="Chọn cột để sắp xếp (tùy chọn)"
										showSearch
										filterOption={(input, option) =>
											option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
										}
										allowClear
									>
										{newTemplateColumns.map(col => (
											<Option key={col.id} value={col.id}>
												{col.columnName}
											</Option>
										))}
									</Select>
									<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
										Chọn cột để sắp xếp dữ liệu trong bảng
									</Text>
								</div>
							</Col>
							<Col span={8}>
								<div>
									<Text strong>Kiểu sắp xếp</Text>
									<Select
										value={newTableSortType}
										onChange={onSortTypeChange}
										style={{ width: '100%', marginTop: 8 }}
										placeholder="Chọn kiểu sắp xếp"
										disabled={!newTableSortColumn}
									>
										<Option value="desc">Từ lớn đến bé (100, 90, 10, 0, -10, -100)</Option>
										<Option value="desc_abs">Dương giảm dần → Âm tăng dần (100, 90, 10, -100, -20, -10)</Option>
									</Select>
									<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
										Kiểu sắp xếp dữ liệu theo cột đã chọn
									</Text>
								</div>
							</Col>
						</Row>

						<div>
							<Text strong>Chọn cột hiển thị *</Text>
							<Select
								mode="multiple"
								value={newTableDisplayColumns || []}
								onChange={onDisplayColumnsChange}
								style={{ width: '100%', marginTop: 8 }}
								placeholder="Chọn các cột để hiển thị"
								showSearch
								filterOption={(input, option) =>
									option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
								}
							>
								{newTemplateColumns.map(col => (
									<Option key={col.id} value={col.id}>
										{col.columnName}
									</Option>
								))}
							</Select>
						</div>

						{/* Column Settings for new table */}
						<div>
							<Text strong>Cài đặt hiển thị cột</Text>

							{newTableDisplayColumns.length === 0 && (
								<div style={{
									padding: '16px',
									textAlign: 'center',
									backgroundColor: '#fafafa',
									borderRadius: '6px',
									color: '#666',
									marginTop: 8,
								}}>
									Vui lòng chọn cột hiển thị để cấu hình.
								</div>
							)}

							{newTableDisplayColumns.map((columnId) => {
								const columnSetting = newTableColumnSettings[columnId] || {
									type: 'text',
									dateFormat: 'DD/MM/YY',
									valueFormat: {
										showThousands: false,
										showMillions: false,
										showPercentage: false,
										decimalPlaces: 0,
										negativeRed: false,
									},
								};
								const columnName = newTemplateColumns.find(col => col.id === columnId)?.columnName || `Cột ${columnId}`;
								const isCollapsed = newCollapsedColumns[columnId];

								return (
									<ColumnSettingsCard
										key={columnId}
										columnId={columnId}
										columnName={columnName}
										columnSetting={columnSetting}
										newTableColumnSizes={newTableColumnSizes}
										isCollapsed={isCollapsed}
										onColumnSettingChange={onColumnSettingChange}
										onColumnSizeChange={onColumnSizeChange}
										onColumnValueFormatChange={onColumnValueFormatChange}
										onToggleCollapse={toggleColumnCollapse}
									/>
								);
							})}
						</div>
					</>
				)}

				<Row gutter={16}>
					<Col span={12}>
						<div>
							<Text strong>Tag Function (Bắt buộc)</Text>
							<Select
								value={localInputs.tag}
								onChange={(value) => handleInputChange('tag', value)}
								style={{ width: '100%', marginTop: 8 }}
								placeholder="Chọn tag function"
							>
								{businessTags.filter(tag => tag !== 'All').map(tag => (
									<Option key={tag} value={tag}>{tag}</Option>
								))}
							</Select>
						</div>
					</Col>
					<Col span={12}>
						<div>
							<Text strong>Tag Unit (Bắt buộc)</Text>
							<Select
								value={localInputs.storeTag}
								onChange={(value) => handleInputChange('storeTag', value)}
								style={{ width: '100%', marginTop: 8 }}
								placeholder="Chọn tag unit"
							>
								{storeTags.filter(tag => tag !== 'All').map(tag => (
									<Option key={tag} value={tag}>{tag}</Option>
								))}
							</Select>
						</div>
					</Col>
				</Row>

				{/*<div>*/}
				{/*	<Text strong>Phân tích</Text>*/}
				{/*	<Input.TextArea*/}
				{/*		value={newCard.answer}*/}
				{/*		onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}*/}
				{/*		placeholder="Nhập mô tả..."*/}
				{/*		style={{ marginTop: 8 }}*/}
				{/*		rows={4}*/}
				{/*	/>*/}
				{/*</div>*/}
			</Space>
		</Modal>
	);
}, (prevProps, nextProps) => {
	// Only re-render if essential props change
	// Input fields are completely managed by local state
	const essentialProps = [
		'visible', 'loading', 'approvedVersions', 'newTemplateColumns',
		'newTableDisplayColumns', 'newTableDateColumn', 'newTableDateRange',
		'newTableDateColumnSize', 'newTableTimeThreshold', 'newTableColumnSettings',
		'newTableColumnSizes', 'newTableFilterColumn', 'newTableSortColumn',
		'newTableSortType', 'newCollapsedColumns', 'businessTags', 'storeTags'
	];
	
	// Check essential props
	for (const prop of essentialProps) {
		if (prevProps[prop] !== nextProps[prop]) {
			return false; // Re-render needed
		}
	}
	
	// For newCard, only check non-input fields (idData, type, etc.)
	if (prevProps.newCard !== nextProps.newCard) {
		const prevCard = prevProps.newCard;
		const nextCard = nextProps.newCard;
		
		// Only re-render if non-input fields changed
		if (prevCard.type !== nextCard.type || 
			prevCard.idData !== nextCard.idData ||
			prevCard.selectedKpiCalculators !== nextCard.selectedKpiCalculators ||
			prevCard.prompt !== nextCard.prompt ||
			prevCard.answer !== nextCard.answer) {
			return false; // Re-render needed
		}
	}
	
	return true; // No re-render needed
});

export default CreateTableModal;
