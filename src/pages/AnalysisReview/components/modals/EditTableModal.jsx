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
import { MyContext } from '../../../../MyContext.jsx';

const { Text } = Typography;
const { Option } = Select;

const EditTableModal = memo(function EditTableModal({
									editingDashboardItem,
									setEditingDashboardItem,
									settingModalVisible,
									handleCancelEdit,
									handleSaveEdit,
									businessTags,
									storeTags,
									kpi2Calculators,
									kpiCalculators,
									editSelectedKpis,
									setEditSelectedKpis,
									editSelectedKpiCalculators,
									setEditSelectedKpiCalculators,
									approvedVersions,
									editSelectedApprovedVersion,
									handleEditApprovedVersionChange,
									editTemplateColumns,
									editSelectedColumns,
									setEditSelectedColumns,
									editTopN,
									setEditTopN,
									editTableChartTimeColumn,
									setEditTableChartTimeColumn,
									editTableChartGroupColumn,
									setEditTableChartGroupColumn,
									editTableChartValueColumn,
									setEditTableChartValueColumn,
									editTableChartType,
									setEditTableChartType,
									editTableChartDataGrouping,
									setEditTableChartDataGrouping,
									editTableChart2Columns,
									editTableChart2TimeColumn,
									setEditTableChart2TimeColumn,
									editTableChart2GroupColumn,
									setEditTableChart2GroupColumn,
									editTableChart2ValueColumn,
									setEditTableChart2ValueColumn,
									editTableChart2Type,
									setEditTableChart2Type,
									editTableChart2DateRange,
									setEditTableChart2DateRange,
									editTableDateColumn,
									setEditTableDateColumn,
									editTableDateRange,
									setEditTableDateRange,
									editTableDateColumnSize,
									setEditTableDateColumnSize,
									editTableTimeThreshold,
									setEditTableTimeThreshold,
									editTableDisplayColumns,
									handleTableDisplayColumnsChange,
									editTableColumnSettings,
									updateTableColumnSetting,
									updateTableColumnValueFormat,
									editTableColumnSizes,
									setEditTableColumnSizes,
									editTableFilterColumn,
									setEditTableFilterColumn,
									editTableSortColumn,
									setEditTableSortColumn,
									editTableSortType,
									setEditTableSortType,
									collapsedColumns,
									toggleColumnCollapse,
									loading,
								}) {
	const { currentUser } = useContext(MyContext);
	
	// Local state for input fields to prevent re-render
	const [localInputs, setLocalInputs] = useState({
		name: '',
		tag: '',
		storeTag: '',
	});

	// Sync with parent state when modal opens or editingDashboardItem changes
	useEffect(() => {
		if (settingModalVisible && editingDashboardItem) {
			setLocalInputs({
				name: editingDashboardItem.name || '',
				tag: editingDashboardItem.tag || editingDashboardItem.category || '',
				storeTag: editingDashboardItem.storeTag || editingDashboardItem.storeCategory || '',
			});
		}
	}, [settingModalVisible, editingDashboardItem]);

	// Only update local state, don't sync to parent until save
	const handleInputChange = useCallback((field, value) => {
		setLocalInputs(prev => ({ ...prev, [field]: value }));
	}, []);

	// Sync local inputs to parent state before saving
	const handleSave = useCallback(() => {
		// Update editingDashboardItem with local inputs
		setEditingDashboardItem(prev => ({
			...prev,
			name: localInputs.name,
			tag: localInputs.tag,
			category: localInputs.tag,
			storeTag: localInputs.storeTag,
			storeCategory: localInputs.storeTag,
		}));
		
		// Call the original handleSaveEdit function
		handleSaveEdit();
	}, [localInputs, setEditingDashboardItem, handleSaveEdit]);

	return (
		<Modal
			title="Chỉnh sửa"
			open={settingModalVisible}
			onCancel={handleCancelEdit}
			footer={editingDashboardItem ? [
				<Button key="cancel" onClick={handleCancelEdit}>
					Hủy
				</Button>,
				<Button
					key="save"
					type="primary"
					onClick={handleSave}
					disabled={!localInputs.name.trim()}
				>
					Lưu
				</Button>,
			] : null}
			width={1200}
			style={{ top: '5vh' }}
			bodyStyle={{
				maxHeight: '80vh',
				overflow: 'hidden',
				padding: '24px',
			}}
		>
			{editingDashboardItem && (
				<div style={{
					maxHeight: 'calc(80vh - 120px)',
					overflow: 'auto',
					paddingRight: '8px',
				}}>
					<Space direction="vertical" style={{ width: '100%' }} size="large">
						{/* Tên item - chung cho tất cả loại */}
						<Row gutter={16}>
							<Col span={24}>
								<div>
									<Text strong>Tên *</Text>
									<Input
										value={localInputs.name}
										onChange={e => handleInputChange('name', e.target.value)}
										style={{ marginTop: 8 }}
										placeholder="Nhập tên"
									/>
								</div>
							</Col>
						</Row>

						{/* Danh mục doanh nghiệp và cửa hàng - chung cho tất cả loại */}
						<Row gutter={16}>
							<Col span={12}>
								<div>
									<Text strong>Tag Function</Text>
									<Select
										value={localInputs.tag}
										onChange={(value) => handleInputChange('tag', value)}
										style={{ width: '100%', marginTop: 8 }}
									>
										{businessTags.filter(tag => tag !== 'All').map(tag => (
											<Option key={tag} value={tag}>{tag}</Option>
										))}
									</Select>
								</div>
							</Col>
							<Col span={12}>
								<div>
									<Text strong>Tag Unit</Text>
									<Select
										value={localInputs.storeTag}
										onChange={(value) => handleInputChange('storeTag', value)}
										style={{ width: '100%', marginTop: 8 }}
									>
										{storeTags.filter(tag => tag !== 'All').map(tag => (
											<Option key={tag} value={tag}>{tag}</Option>
										))}
									</Select>
								</div>
							</Col>
						</Row>
						{editingDashboardItem.type === 'table2' && (
							<>
								<div>
									<Text strong>Chọn dữ liệu *</Text>
									<Select
										value={editSelectedApprovedVersion}
										onChange={handleEditApprovedVersionChange}
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

								{editTemplateColumns.length > 0 && (
									<>
										<Row gutter={16}>
											<Col span={8}>
												<div>
													<Text strong>Thời gian</Text>
													<Select
														value={editTableDateColumn || undefined}
														onChange={(value) => setEditTableDateColumn(value)}
														style={{ width: '100%', marginTop: 8 }}
														placeholder="Chọn cột thời gian (tùy chọn)"
														showSearch
														filterOption={(input, option) =>
															option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
														}
														allowClear
													>
														{editTemplateColumns
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
														value={editTableDateRange}
														onChange={(value) => setEditTableDateRange(value)}
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
													<Text type="secondary" style={{
														fontSize: '12px',
														marginTop: 4,
														display: 'block',
													}}>
														Khoảng thời gian này sẽ được áp dụng mặc định khi xem bảng
													</Text>
												</div>
											</Col>
											<Col span={8}>
												<div>
													<Text strong>Kích thước cột thời gian</Text>
													<Select
														value={editTableDateColumnSize}
														onChange={(value) => setEditTableDateColumnSize(value)}
														style={{ width: '100%', marginTop: 8 }}
														placeholder="Chọn kích thước cột thời gian"
													>
														<Option value={0.5}>Rất nhỏ (0.5)</Option>
														<Option value={1}>Nhỏ (1)</Option>
														<Option value={2}>Vừa (2)</Option>
														<Option value={3}>Lớn (3)</Option>
													</Select>
													<Text type="secondary" style={{
														fontSize: '12px',
														marginTop: 4,
														display: 'block',
													}}>
														Kích thước cột thời gian trong bảng
													</Text>
												</div>
											</Col>
										</Row>

										<Row gutter={16}>
											{/*<Col span={8}>*/}
											{/*	<div>*/}
											{/*		<Text strong>Mốc thời gian phân tích AI</Text>*/}
											{/*		<Input*/}
											{/*			type="datetime-local"*/}
											{/*			value={editTableTimeThreshold || ''}*/}
											{/*			onChange={(e) => setEditTableTimeThreshold(e.target.value)}*/}
											{/*			style={{ width: '100%', marginTop: 8 }}*/}
											{/*			placeholder="Chọn mốc thời gian (tùy chọn)"*/}
											{/*		/>*/}
											{/*		<Text type="secondary" style={{*/}
											{/*			fontSize: '12px',*/}
											{/*			marginTop: 4,*/}
											{/*			display: 'block',*/}
											{/*		}}>*/}
											{/*			Khi chạy AI, chỉ phân tích dữ liệu từ mốc thời gian này trở đi*/}
											{/*		</Text>*/}
											{/*	</div>*/}
											{/*</Col>*/}
											<Col span={8}>
												<div>
													<Text strong>Cột lọc dữ liệu</Text>
													<Select
														value={editTableFilterColumn || undefined}
														onChange={(value) => setEditTableFilterColumn(value)}
														style={{ width: '100%', marginTop: 8 }}
														placeholder="Chọn cột để lọc (tùy chọn)"
														showSearch
														filterOption={(input, option) =>
															option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
														}
														allowClear
													>
														{editTemplateColumns.map(col => (
															<Option key={col.id} value={col.id}>
																{col.columnName}
															</Option>
														))}
													</Select>
													<Text type="secondary" style={{
														fontSize: '12px',
														marginTop: 4,
														display: 'block',
													}}>
														Chọn cột để hiển thị bộ lọc bên cạnh bộ lọc thời gian
													</Text>
												</div>
											</Col>
											<Col span={8}>
												<div>
													<Text strong>Cột sắp xếp dữ liệu</Text>
													<Select
														value={editTableSortColumn || undefined}
														onChange={(value) => setEditTableSortColumn(value)}
														style={{ width: '100%', marginTop: 8 }}
														placeholder="Chọn cột để sắp xếp (tùy chọn)"
														showSearch
														filterOption={(input, option) =>
															option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
														}
														allowClear
													>
														{editTemplateColumns.map(col => (
															<Option key={col.id} value={col.id}>
																{col.columnName}
															</Option>
														))}
													</Select>
													<Text type="secondary" style={{
														fontSize: '12px',
														marginTop: 4,
														display: 'block',
													}}>
														Chọn cột để sắp xếp dữ liệu trong bảng
													</Text>
												</div>
											</Col>
											<Col span={8}>
												<div>
													<Text strong>Kiểu sắp xếp</Text>
													<Select
														value={editTableSortType}
														onChange={(value) => setEditTableSortType(value)}
														style={{ width: '100%', marginTop: 8 }}
														placeholder="Chọn kiểu sắp xếp"
														disabled={!editTableSortColumn}
													>
														<Option value="desc">Từ lớn đến bé (100, 90, 10, 0, -10, -100)</Option>
														<Option value="desc_abs">Dương giảm dần → Âm tăng dần (100, 90, 10, -100, -20, -10)</Option>
													</Select>
													<Text type="secondary" style={{
														fontSize: '12px',
														marginTop: 4,
														display: 'block',
													}}>
														Kiểu sắp xếp dữ liệu theo cột đã chọn
													</Text>
												</div>
											</Col>
										</Row>

										<div>
											<Text strong>Chọn cột hiển thị *</Text>
											<Select
												mode="multiple"
												value={editTableDisplayColumns || []}
												onChange={handleTableDisplayColumnsChange}
												style={{ width: '100%', marginTop: 8 }}
												placeholder="Chọn các cột để hiển thị"
												showSearch
												filterOption={(input, option) =>
													option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
												}
											>
												{editTemplateColumns.map(col => (
													<Option key={col.id} value={col.id}>
														{col.columnName}
													</Option>
												))}
											</Select>
										</div>


										{/* Column Settings */}
										<div>
											<Text strong>Cài đặt hiển thị cột</Text>

											{editTableDisplayColumns.length === 0 && (
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

											{editTableDisplayColumns.map((columnId) => {
												const columnSetting = editTableColumnSettings[columnId] || {
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
												const columnName = editTemplateColumns.find(col => col.id === columnId)?.columnName || `Cột ${columnId}`;
												const isCollapsed = collapsedColumns[columnId];

												return (
													<Card
														key={columnId}
														size="small"
														style={{ marginTop: 8, marginBottom: 8 }}
														bodyStyle={{ padding: 0 }}
													>
														<div style={{
															display: 'flex',
															alignItems: 'center',
															padding: '12px 16px',
															borderBottom: isCollapsed ? 'none' : '1px solid #f0f0f0',
															cursor: 'pointer',
															backgroundColor: '#fafafa',
														}}
															 onClick={() => toggleColumnCollapse(columnId)}
														>
															<div style={{
																width: '30%',
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'space-between',
															}}>
																<Text strong
																	  style={{ margin: 0 }}>{columnName}</Text>
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
																	{editTableColumnSizes[columnId] && ` - Size ${editTableColumnSizes[columnId]}`}
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
																			onChange={(value) => updateTableColumnSetting(columnId, 'type', value)}
																			style={{ width: '100%' }}
																		>
																			<Option value="date">Ngày tháng</Option>
																			<Option value="value">Giá trị</Option>
																			<Option value="dataBar">Data
																				Bar</Option>
																			<Option value="text">Chữ</Option>
																		</Select>
																	</div>
																</div>

																{columnSetting.type === 'date' && (
																	<div style={{
																		display: 'flex',
																		gap: '16px',
																		marginTop: '12px',
																	}}>
																		<div style={{ width: '30%' }}>
																			<Text strong>Định dạng ngày</Text>
																		</div>
																		<div style={{ width: '70%' }}>
																			<Select
																				value={columnSetting.dateFormat}
																				onChange={(value) => updateTableColumnSetting(columnId, 'dateFormat', value)}
																				style={{ width: '100%' }}
																			>
																				<Option
																					value="DD/MM/YY">DD/MM/YY</Option>
																				<Option
																					value="DD/MM/YYYY">DD/MM/YYYY</Option>
																				<Option
																					value="MM/DD/YY">MM/DD/YY</Option>
																				<Option
																					value="MM/DD/YYYY">MM/DD/YYYY</Option>
																			</Select>
																		</div>
																	</div>
																)}

																{(columnSetting.type === 'value' || columnSetting.type === 'dataBar') && (
																	<>
																		<div style={{
																			display: 'flex',
																			gap: '16px',
																			marginTop: '12px',
																		}}>
																			<div style={{ width: '30%' }}>
																				<Text strong>Định dạng hiển
																					thị</Text>
																			</div>
																			<div style={{ width: '70%' }}>
																				<Space direction="vertical"
																					   style={{ width: '100%' }}>
																					<div>
																						<Checkbox
																							checked={columnSetting.valueFormat.showThousands}
																							onChange={(e) => updateTableColumnValueFormat(columnId, 'showThousands', e.target.checked)}
																						>
																							Thể hiện hàng nghìn (K)
																						</Checkbox>
																					</div>
																					<div>
																						<Checkbox
																							checked={columnSetting.valueFormat.showMillions}
																							onChange={(e) => updateTableColumnValueFormat(columnId, 'showMillions', e.target.checked)}
																						>
																							Thể hiện hàng triệu (M)
																						</Checkbox>
																					</div>
																					<div>
																						<Checkbox
																							checked={columnSetting.valueFormat.showPercentage}
																							onChange={(e) => updateTableColumnValueFormat(columnId, 'showPercentage', e.target.checked)}
																						>
																							Thể hiện dạng %
																						</Checkbox>
																					</div>
																					<div>
																						<Checkbox
																							checked={columnSetting.valueFormat.negativeRed}
																							onChange={(e) => updateTableColumnValueFormat(columnId, 'negativeRed', e.target.checked)}
																						>
																							Số âm màu đỏ
																						</Checkbox>
																					</div>
																				</Space>
																			</div>
																		</div>

																		<div style={{
																			display: 'flex',
																			gap: '16px',
																			marginTop: '12px',
																		}}>
																			<div style={{ width: '30%' }}>
																				<Text strong>Số thập phân</Text>
																			</div>
																			<div style={{ width: '70%' }}>
																				<Select
																					value={columnSetting.valueFormat.decimalPlaces}
																					onChange={(value) => updateTableColumnValueFormat(columnId, 'decimalPlaces', value)}
																					style={{ width: '100%' }}
																				>
																					<Option value={0}>0 (không có
																						thập phân)</Option>
																					<Option value={1}>1</Option>
																					<Option value={2}>2</Option>
																				</Select>
																			</div>
																		</div>
																	</>
																)}

																<div style={{
																	display: 'flex',
																	gap: '16px',
																	marginTop: '12px',
																}}>
																	<div style={{ width: '30%' }}>
																		<Text strong>Kích thước cột</Text>
																	</div>
																	<div style={{ width: '70%' }}>
																		<Select
																			value={editTableColumnSizes[columnId] || 2}
																			onChange={(value) => {
																				setEditTableColumnSizes(prev => ({
																					...prev,
																					[columnId]: value,
																				}));
																			}}
																			style={{ width: '100%' }}
																		>
																			<Option value={0.5}>Rất nhỏ
																				(0.5)</Option>
																			<Option value={1}>Nhỏ (1)</Option>
																			<Option value={2}>Vừa (2)</Option>
																			<Option value={3}>Lớn (3)</Option>
																		</Select>
																	</div>
																</div>
															</div>
														)}
													</Card>
												);
											})}
										</div>
									</>
								)}
							</>
						)}



						{/*{currentUser && (currentUser.isAdmin || currentUser.isEditor) &&*/}
						{/*	<div>*/}
						{/*		<Text strong>Prompt</Text>*/}
						{/*		<Input.TextArea*/}
						{/*			value={editingDashboardItem.analysis?.prompt || ''}*/}
						{/*			onChange={(e) => setEditingDashboardItem({*/}
						{/*				...editingDashboardItem,*/}
						{/*				analysis: {*/}
						{/*					...editingDashboardItem.analysis,*/}
						{/*					prompt: e.target.value,*/}
						{/*				},*/}
						{/*			})}*/}
						{/*			placeholder="Nhập prompt..."*/}
						{/*			style={{ marginTop: 8 }}*/}
						{/*			rows={3}*/}
						{/*		/>*/}
						{/*	</div>*/}
						{/*}*/}

						{/*<div>*/}
						{/*	<Text strong>Phân tích</Text>*/}
						{/*	<Input.TextArea*/}
						{/*		value={editingDashboardItem.analysis?.answer || ''}*/}
						{/*		onChange={(e) => setEditingDashboardItem({*/}
						{/*			...editingDashboardItem,*/}
						{/*			analysis: {*/}
						{/*				...editingDashboardItem.analysis,*/}
						{/*				answer: e.target.value,*/}
						{/*			},*/}
						{/*		})}*/}
						{/*		placeholder="Nhập mô tả..."*/}
						{/*		style={{ marginTop: 8 }}*/}
						{/*		rows={10}*/}
						{/*	/>*/}
						{/*</div>*/}

					</Space>
				</div>
			)}
		</Modal>
	);
}, (prevProps, nextProps) => {
	// Only re-render if essential props change
	// Input fields are completely managed by local state
	const essentialProps = [
		'settingModalVisible', 'loading', 'approvedVersions', 'editTemplateColumns',
		'editTableDisplayColumns', 'editTableDateColumn', 'editTableDateRange',
		'editTableDateColumnSize', 'editTableTimeThreshold', 'editTableColumnSettings',
		'editTableColumnSizes', 'editTableFilterColumn', 'editTableSortColumn',
		'editTableSortType', 'collapsedColumns', 'businessTags', 'storeTags',
		'editSelectedApprovedVersion', 'editSelectedColumns', 'editTopN',
		'editTableChartTimeColumn', 'editTableChartGroupColumn', 'editTableChartValueColumn',
		'editTableChartType', 'editTableChartDataGrouping', 'editTableChart2TimeColumn',
		'editTableChart2GroupColumn', 'editTableChart2ValueColumn', 'editTableChart2Type',
		'editTableChart2DateRange', 'editSelectedKpis', 'editSelectedKpiCalculators'
	];
	
	// Check essential props
	for (const prop of essentialProps) {
		if (prevProps[prop] !== nextProps[prop]) {
			return false; // Re-render needed
		}
	}
	
	// For editingDashboardItem, only check non-input fields
	if (prevProps.editingDashboardItem !== nextProps.editingDashboardItem) {
		const prevItem = prevProps.editingDashboardItem;
		const nextItem = nextProps.editingDashboardItem;
		
		// Only re-render if non-input fields changed
		if (prevItem?.type !== nextItem?.type || 
			prevItem?.id !== nextItem?.id ||
			prevItem?.settings !== nextItem?.settings ||
			prevItem?.analysis !== nextItem?.analysis) {
			return false; // Re-render needed
		}
	}
	
	return true; // No re-render needed
});

export default EditTableModal;