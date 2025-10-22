import React, { useContext } from 'react';
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

const EditDashboardItemModal = ({
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
									editRecentPeriods,
									setEditRecentPeriods,
									editChartViewType,
									setEditChartViewType,
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
									editTableTimeThreshold,
									setEditTableTimeThreshold,
									collapsedColumns,
									toggleColumnCollapse,
									loading,
								}) => {
	const { currentUser } = useContext(MyContext);
	
	// Function to get display name for card type
	const getCardTypeDisplayName = (type) => {
		switch (type) {
			case 'chart':
				return 'Thẻ chỉ số';
			case 'table_chart':
				return 'BIỂU ĐỒ';
			case 'table_chart_2':
				return 'BIỂU ĐỒ';
			case 'top':
				return 'TOP';
			case 'comparison':
				return 'SO SÁNH CHỈ SỐ';
			case 'table':
				return 'TABLE';
			case 'statistics':
				return 'THỐNG KÊ';
			default:
				return type;
		}
	};
	
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
					onClick={handleSaveEdit}
					disabled={!editingDashboardItem.name.trim()}
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
							<Col span={16}>
								<div>
									<Text strong>Tên *</Text>
									<Input
										value={editingDashboardItem.name}
										onChange={e => setEditingDashboardItem({
											...editingDashboardItem,
											name: e.target.value,
										})}
										style={{ marginTop: 8 }}
										placeholder="Nhập tên"
									/>
								</div>
							</Col>
							<Col span={8}>
								<div>
									<Text strong>Loại thẻ</Text>
									<div style={{
										marginTop: 8,
										padding: '4px 11px',
										backgroundColor: '#f5f5f5',
										borderRadius: '6px',
										border: '1px solid #d9d9d9',
										fontSize: '14px',
										color: '#666',
										height: '32px',
										lineHeight: '24px',
										display: 'flex',
										alignItems: 'center',
									}}>
										{editingDashboardItem ? getCardTypeDisplayName(editingDashboardItem.type) : ''}
									</div>
								</div>
							</Col>
						</Row>

						{/* Danh mục doanh nghiệp và cửa hàng - chung cho tất cả loại */}
						<Row gutter={16}>
							<Col span={12}>
								<div>
									<Text strong>Tag Function</Text>
									<Select
										value={editingDashboardItem.tag || editingDashboardItem.category || 'Revenue'}
										onChange={(value) => setEditingDashboardItem({
											...editingDashboardItem,
											tag: value,
											category: value,
										})}
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
										value={editingDashboardItem.storeTag || editingDashboardItem.storeCategory || 'Sales'}
										onChange={(value) => setEditingDashboardItem({
											...editingDashboardItem,
											storeTag: value,
											storeCategory: value,
										})}
										style={{ width: '100%', marginTop: 8 }}
									>
										{storeTags.filter(tag => tag !== 'All').map(tag => (
											<Option key={tag} value={tag}>{tag}</Option>
										))}
									</Select>
								</div>
							</Col>
						</Row>
						{/* Cài đặt riêng cho từng loại */}
						{editingDashboardItem.type === 'chart' && (
							<div>
								<Text strong>KPI nguồn</Text>
								<div style={{
									marginTop: 8,
									padding: '8px 12px',
									backgroundColor: '#f5f5f5',
									borderRadius: '4px',
								}}>
									{(() => {
										const kpi = kpi2Calculators.find(k => k.id === editingDashboardItem.idData);
										return kpi ? kpi.name : 'Không xác định';
									})()}
								</div>
								<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
									KPI nguồn không thể thay đổi sau khi tạo
								</Text>
								
								<div style={{ marginTop: 16 }}>
									<Text strong>Loại biểu đồ</Text>
									<div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
										<Button
							type={editChartViewType === 'line' ? 'primary' : 'default'}
											onClick={() => setEditChartViewType('line')}
											size="small"
										>
											Line
										</Button>
										<Button
											type={editChartViewType === 'area' ? 'primary' : 'default'}
											onClick={() => setEditChartViewType('area')}
											size="small"
										>
											Area dạng Gradient + Marker
										</Button>
						<Button
							type={editChartViewType === 'line_marker' ? 'primary' : 'default'}
							onClick={() => setEditChartViewType('line_marker')}
							size="small"
						>
							Line dạng Marker
						</Button>
										<Button
											type={editChartViewType === 'bar' ? 'primary' : 'default'}
											onClick={() => setEditChartViewType('bar')}
											size="small"
										>
											Bar
										</Button>
									</div>
									<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
										Chọn loại biểu đồ để hiển thị dữ liệu
									</Text>
								</div>
								
								<div style={{ marginTop: 16 }}>
									<Text strong>Số lượng kỳ gần nhất hiển thị</Text>
									<Select
										value={editingDashboardItem.settings?.recentPeriods || 0}
										onChange={(value) => setEditingDashboardItem({
											...editingDashboardItem,
											settings: {
												...editingDashboardItem.settings,
												recentPeriods: value,
											},
										})}
										style={{ width: '100%', marginTop: 8 }}
										placeholder="Chọn số lượng kỳ"
									>
										<Option value={0}>Hiển thị tất cả kỳ</Option>
										<Option value={3}>3 kỳ gần nhất</Option>
										<Option value={5}>5 kỳ gần nhất</Option>
										<Option value={10}>10 kỳ gần nhất</Option>
										<Option value={12}>12 kỳ gần nhất</Option>
								<Option value={24}>24 kỳ gần nhất</Option>
								<Option value={48}>48 kỳ gần nhất</Option>
									</Select>
								</div>
							</div>
						)}

						{editingDashboardItem.type === 'comparison' && (
							<div>
								<Text strong>Chọn các KPI để so sánh *</Text>
								<Select
									mode="multiple"
									value={editSelectedKpis}
									onChange={(values) => setEditSelectedKpis(values)}
									style={{ width: '100%', marginTop: 8 }}
									placeholder="Chọn ít nhất 2 KPI để so sánh"
									showSearch
									filterOption={(input, option) =>
										option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
									}
									maxTagCount={5}
									maxTagTextLength={20}
								>
									{kpi2Calculators.map(kpi => (
										<Option key={kpi.id} value={kpi.id}>
											{kpi.name}
										</Option>
									))}
								</Select>
								<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
									Có thể chọn nhiều KPI để so sánh cùng lúc
								</Text>

						<div style={{ marginTop: 16 }}>
							<Text strong>Kiểu hiển thị</Text>
							<div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
								<Button
									type={(editingDashboardItem.settings?.chartViewType || 'line') === 'line' ? 'primary' : 'default'}
									onClick={() => setEditingDashboardItem({
										...editingDashboardItem,
										settings: { ...(editingDashboardItem.settings || {}), chartViewType: 'line' },
									})}
									size="small"
								>
									Line
								</Button>
								<Button
									type={(editingDashboardItem.settings?.chartViewType) === 'stacked_area' ? 'primary' : 'default'}
									onClick={() => setEditingDashboardItem({
										...editingDashboardItem,
										settings: { ...(editingDashboardItem.settings || {}), chartViewType: 'stacked_area' },
									})}
									size="small"
								>
									Stacked area
								</Button>
								<Button
									type={(editingDashboardItem.settings?.chartViewType) === 'stacked_bar' ? 'primary' : 'default'}
									onClick={() => setEditingDashboardItem({
										...editingDashboardItem,
										settings: { ...(editingDashboardItem.settings || {}), chartViewType: 'stacked_bar' },
									})}
									size="small"
								>
									Stacked bar
								</Button>
								<Button
									type={(editingDashboardItem.settings?.chartViewType) === 'normalizebar' ? 'primary' : 'default'}
									onClick={() => setEditingDashboardItem({
										...editingDashboardItem,
										settings: { ...(editingDashboardItem.settings || {}), chartViewType: 'normalizebar' },
									})}
									size="small"
								>
									Normalize 100%
								</Button>
							</div>
							<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
								Chọn kiểu hiển thị biểu đồ so sánh
							</Text>
						</div>
								
								<div style={{ marginTop: 16 }}>
									<Text strong>Số lượng kỳ gần nhất hiển thị</Text>
									<Select
										value={editingDashboardItem.settings?.recentPeriods || 0}
										onChange={(value) => setEditingDashboardItem({
											...editingDashboardItem,
											settings: {
												...editingDashboardItem.settings,
												recentPeriods: value,
											},
										})}
										style={{ width: '100%', marginTop: 8 }}
										placeholder="Chọn số lượng kỳ"
									>
										<Option value={0}>Hiển thị tất cả kỳ</Option>
										<Option value={3}>3 kỳ gần nhất</Option>
										<Option value={5}>5 kỳ gần nhất</Option>
										<Option value={10}>10 kỳ gần nhất</Option>
										<Option value={12}>12 kỳ gần nhất</Option>
								<Option value={24}>24 kỳ gần nhất</Option>
								<Option value={48}>48 kỳ gần nhất</Option>
									</Select>
								</div>
							</div>
						)}

						{editingDashboardItem.type === 'top' && (
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
										<div>
											<Text strong>Chọn cột tên *</Text>
											<Select
												value={editSelectedColumns.column1}
												onChange={(value) => setEditSelectedColumns({
													...editSelectedColumns,
													column1: value,
												})}
												style={{ width: '100%', marginTop: 8 }}
												placeholder="Chọn cột chứa tên"
											>
												{editTemplateColumns.map(col => (
													<Option key={col.id} value={col.id}>
														{col.columnName}
													</Option>
												))}
											</Select>
										</div>

										<div>
											<Text strong>Chọn cột giá trị *</Text>
											<Select
												value={editSelectedColumns.column2}
												onChange={(value) => setEditSelectedColumns({
													...editSelectedColumns,
													column2: value,
												})}
												style={{ width: '100%', marginTop: 8 }}
												placeholder="Chọn cột chứa giá trị"
											>
												{editTemplateColumns.map(col => (
													<Option key={col.id} value={col.id}>
														{col.columnName}
													</Option>
												))}
											</Select>
										</div>

										<div>
											<Text strong>Số lượng hiển thị (Top N)</Text>
											<Input
												type="number"
												value={editTopN}
												onChange={(e) => setEditTopN(parseInt(e.target.value) || 5)}
												style={{ width: '100%', marginTop: 8 }}
												placeholder="Nhập số lượng (mặc định: 5)"
												min={1}
												max={50}
											/>
										</div>
									</>
								)}
							</>
						)}

						{editingDashboardItem.type === 'table_chart' && (
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
													<Text strong>Cột thời gian</Text>
													<Select
														value={editTableChartTimeColumn || undefined}
														onChange={(value) => setEditTableChartTimeColumn(value)}
														style={{ width: '100%', marginTop: 8 }}
														placeholder="Chọn cột thời gian (tùy chọn)"
														showSearch
														filterOption={(input, option) =>
															option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
														}
														allowClear
													>
														{editTemplateColumns
															.filter(col => {
																const columnName = col.columnName.toLowerCase();
																return columnName.includes('ngày') ||
																	columnName.includes('date') ||
																	columnName.includes('time') ||
																	columnName.includes('thời gian') ||
																	columnName.includes('created') ||
																	columnName.includes('updated');
															})
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
													<Text strong>Cột gom nhóm</Text>
													<Select
														value={editTableChartGroupColumn || undefined}
														onChange={(value) => setEditTableChartGroupColumn(value)}
														style={{ width: '100%', marginTop: 8 }}
														placeholder="Chọn cột gom nhóm (tùy chọn)"
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
												</div>
											</Col>
											<Col span={8}>
												<div>
													<Text strong>Cột giá trị *</Text>
													<Select
														value={editTableChartValueColumn || undefined}
														onChange={(value) => setEditTableChartValueColumn(value)}
														style={{ width: '100%', marginTop: 8 }}
														placeholder="Chọn cột giá trị"
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
											</Col>
										</Row>

										<Row gutter={16}>
											<Col span={12}>
												<div>
													<Text strong>Loại biểu đồ</Text>
													<Select
														value={editTableChartType}
														onChange={(value) => setEditTableChartType(value)}
														style={{ width: '100%', marginTop: 8 }}
														placeholder="Chọn loại biểu đồ"
													>
														<Option value="line">Đường</Option>
														<Option value="bar">Cột</Option>
														{/*<Option value="pie">Tròn</Option>*/}
													</Select>
												</div>
											</Col>
											<Col span={12}>
												<div>
													<Text strong>Gộp dữ liệu theo thời gian</Text>
													<Select
														value={editTableChartDataGrouping}
														onChange={(value) => setEditTableChartDataGrouping(value)}
														style={{ width: '100%', marginTop: 8 }}
														placeholder="Chọn cách gộp dữ liệu"
														disabled={!editTableChartTimeColumn}
													>
														<Option value="none">Giữ nguyên</Option>
														<Option value="month">Theo tháng</Option>
														<Option value="week">Theo tuần</Option>
													</Select>
													<Text type="secondary" style={{
														fontSize: '12px',
														marginTop: 4,
														display: 'block',
													}}>
														{editTableChartTimeColumn ? 'Chỉ áp dụng khi có cột thời gian' : 'Cần chọn cột thời gian để sử dụng tính năng này'}
													</Text>
												</div>
											</Col>
										</Row>
									</>
								)}
							</>
						)}

						{editingDashboardItem.type === 'table_chart_2' && (
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

								{editTableChart2Columns.length > 0 && (
									<>
										<Row gutter={16}>
											<Col span={8}>
												<div>
													<Text strong>Cột thời gian (lọc dữ liệu)</Text>
													<Select
														value={editTableChart2TimeColumn || undefined}
														onChange={(value) => setEditTableChart2TimeColumn(value)}
														style={{ width: '100%', marginTop: 8 }}
														placeholder="Chọn cột thời gian (tùy chọn)"
														showSearch
														filterOption={(input, option) =>
															option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
														}
														allowClear
													>
														{editTableChart2Columns
															.filter(col => {
																const columnName = col.columnName.toLowerCase();
																return columnName.includes('ngày') ||
																	columnName.includes('date') ||
																	columnName.includes('time') ||
																	columnName.includes('thời gian') ||
																	columnName.includes('created') ||
																	columnName.includes('updated');
															})
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
													<Text strong>Cột nhóm (trục X)</Text>
													<Select
														value={editTableChart2GroupColumn || undefined}
														onChange={(value) => setEditTableChart2GroupColumn(value)}
														style={{ width: '100%', marginTop: 8 }}
														placeholder="Chọn cột nhóm (tùy chọn)"
														showSearch
														filterOption={(input, option) =>
															option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
														}
														allowClear
													>
														{editTableChart2Columns.map(col => (
															<Option key={col.id} value={col.id}>
																{col.columnName}
															</Option>
														))}
													</Select>
												</div>
											</Col>
											<Col span={8}>
												<div>
													<Text strong>Cột giá trị (trục Y) *</Text>
													<Select
														value={editTableChart2ValueColumn || undefined}
														onChange={(value) => setEditTableChart2ValueColumn(value)}
														style={{ width: '100%', marginTop: 8 }}
														placeholder="Chọn cột giá trị"
														showSearch
														filterOption={(input, option) =>
															option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
														}
													>
														{editTableChart2Columns.map(col => (
															<Option key={col.id} value={col.id}>
																{col.columnName}
															</Option>
														))}
													</Select>
												</div>
											</Col>
										</Row>

										<Row gutter={16}>
											<Col span={8}>
												<div>
													<Text strong>Loại biểu đồ</Text>
													<Select
														value={editTableChart2Type}
														onChange={(value) => setEditTableChart2Type(value)}
														style={{ width: '100%', marginTop: 8 }}
														placeholder="Chọn loại biểu đồ"
													>
														<Option value="line">Đường</Option>
														<Option value="bar">Cột</Option>
														<Option value="pie">Tròn</Option>
													</Select>
												</div>
											</Col>

											<Col span={8}>
												<div>
													<Text strong>Khoảng lọc dữ liệu</Text>
													<Select
														value={editTableChart2DateRange}
														onChange={(value) => setEditTableChart2DateRange(value)}
														style={{ width: '100%', marginTop: 8 }}
														placeholder="Chọn khoảng lọc dữ liệu"
														disabled={!editTableChart2TimeColumn}
													>
														<Option value="all">Tất cả dữ liệu</Option>
														<Option value="today">Hôm nay</Option>
														<Option value="yesterday">Hôm qua</Option>
														<Option value="thisWeek">Tuần này</Option>
														<Option value="lastWeek">Tuần trước</Option>
														<Option value="thisMonth">Tháng này</Option>
														<Option value="lastMonth">Tháng trước</Option>
														<Option value="last7Days">7 ngày qua</Option>
														<Option value="last15Days">15 ngày qua</Option>
														<Option value="last30Days">30 ngày qua</Option>
														<Option value="last90Days">90 ngày qua</Option>
														<Option value="thisYear">Năm nay</Option>
														<Option value="lastYear">Năm trước</Option>
													</Select>
													<Text type="secondary" style={{
														fontSize: '12px',
														marginTop: 4,
														display: 'block',
													}}>
														{editTableChart2TimeColumn ? 'Chỉ áp dụng khi có cột thời gian' : 'Cần chọn cột thời gian để sử dụng tính năng này'}
													</Text>
												</div>
											</Col>
										</Row>
									</>
								)}
							</>
						)}

						{editingDashboardItem.type === 'statistics' && (
							<div>
								<Text strong>Chọn các KPI Calculator *</Text>
								<Select
									mode="multiple"
									value={editSelectedKpiCalculators}
									onChange={(values) => setEditSelectedKpiCalculators(values)}
									style={{ width: '100%', marginTop: 8 }}
									placeholder="Chọn ít nhất một KPI Calculator"
									showSearch
									filterOption={(input, option) =>
										option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
									}
									maxTagCount={5}
									maxTagTextLength={20}
								>
									{kpiCalculators.map(kpi => (
										<Option key={kpi.id} value={kpi.id}>
											{kpi.name}
										</Option>
									))}
								</Select>
								<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
									Có thể chọn nhiều KPI Calculator để hiển thị thống kê cùng lúc
								</Text>
							</div>
						)}

						{editingDashboardItem.type === 'table' && (
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
															.filter(col => {
																// Only show columns that might contain date data
																const columnName = col.columnName.toLowerCase();
																return columnName.includes('ngày') ||
																	columnName.includes('date') ||
																	columnName.includes('time') ||
																	columnName.includes('thời gian') ||
																	columnName.includes('created') ||
																	columnName.includes('updated');
															})
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
													<Text strong>Mốc thời gian phân tích AI</Text>
													<Input
														type="datetime-local"
														value={editTableTimeThreshold || ''}
														onChange={(e) => setEditTableTimeThreshold(e.target.value)}
														style={{ width: '100%', marginTop: 8 }}
														placeholder="Chọn mốc thời gian"
													/>
													<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
														Khi chạy AI, chỉ phân tích dữ liệu từ mốc thời gian này trở đi
													</Text>
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

												{/* Advanced filters for edit table */}
												<div style={{ marginTop: 12 }}>
													<Text strong>Bộ lọc nâng cao</Text>
													<div style={{ marginTop: 8 }}>
														<Select
															value={editingDashboardItem.settings?.tableFilterLogic || 'AND'}
															onChange={(v) => setEditingDashboardItem({
																...editingDashboardItem,
																settings: { ...(editingDashboardItem.settings || {}), tableFilterLogic: v },
															})}
															style={{ width: '260px', marginBottom: 8 }}
														>
															<Option value="AND">Kết hợp điều kiện: AND</Option>
															<Option value="OR">Kết hợp điều kiện: OR</Option>
														</Select>

														{(editingDashboardItem.settings?.tableFilters || []).map((f, idx) => (
															<div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
																<Select
																	value={f.columnId}
																	onChange={(v) => {
																		const copy = [ ...(editingDashboardItem.settings?.tableFilters || []) ];
																		copy[idx] = { ...copy[idx], columnId: v };
																		setEditingDashboardItem({
																			...editingDashboardItem,
																			settings: { ...(editingDashboardItem.settings || {}), tableFilters: copy },
																		});
																	}}
																	style={{ flex: 1 }}
																	showSearch
																	filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
																>
																	{editTemplateColumns.map(col => (
																		<Option key={col.id} value={col.id}>{col.columnName}</Option>
																	))}
																</Select>
																<Select
																	value={f.operator}
																	onChange={(v) => {
																		const copy = [ ...(editingDashboardItem.settings?.tableFilters || []) ];
																		copy[idx] = { ...copy[idx], operator: v };
																		setEditingDashboardItem({
																			...editingDashboardItem,
																			settings: { ...(editingDashboardItem.settings || {}), tableFilters: copy },
																		});
																	}}
																	style={{ width: 130 }}
																>
																<Option value=">">{'>'}</Option>
																<Option value="<">{'<'}</Option>
																<Option value=">=">{'>='}</Option>
																<Option value="<=">{'<='}</Option>
																	<Option value="#"># (khác)</Option>
																	<Option value="=">=</Option>
																	<Option value="not_empty">is not empty</Option>
																</Select>
																<Input
																	value={f.value}
																	onChange={(e) => {
																		const copy = [ ...(editingDashboardItem.settings?.tableFilters || []) ];
																		copy[idx] = { ...copy[idx], value: e.target.value };
																		setEditingDashboardItem({
																			...editingDashboardItem,
																			settings: { ...(editingDashboardItem.settings || {}), tableFilters: copy },
																		});
																	}}
																	style={{ flex: 1 }}
																	disabled={f.operator === 'not_empty'}
																/>
																<Button danger onClick={() => {
																	const copy = [ ...(editingDashboardItem.settings?.tableFilters || []) ];
																	copy.splice(idx, 1);
																	setEditingDashboardItem({
																		...editingDashboardItem,
																		settings: { ...(editingDashboardItem.settings || {}), tableFilters: copy },
																	});
																}} size="small">Xóa</Button>
															</div>
														))}

														<Button onClick={() => {
															const next = [ ...(editingDashboardItem.settings?.tableFilters || []), { columnId: undefined, operator: '=', value: '' } ];
															setEditingDashboardItem({
																...editingDashboardItem,
																settings: { ...(editingDashboardItem.settings || {}), tableFilters: next },
															});
														}} size="small">Thêm điều kiện</Button>
													</div>
												</div>

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



						{currentUser && (currentUser.isSuperAdmin) &&
							<div>
								<Text strong>Prompt</Text>
								<Input.TextArea
									value={editingDashboardItem.analysis?.prompt || ''}
									onChange={(e) => setEditingDashboardItem({
										...editingDashboardItem,
										analysis: {
											...editingDashboardItem.analysis,
											prompt: e.target.value,
										},
									})}
									placeholder="Nhập prompt..."
									style={{ marginTop: 8 }}
									rows={3}
								/>
							</div>
						}

						<div>
							<Text strong>Phân tích</Text>
							<Input.TextArea
								value={editingDashboardItem.analysis?.answer || ''}
								onChange={(e) => setEditingDashboardItem({
									...editingDashboardItem,
									analysis: {
										...editingDashboardItem.analysis,
										answer: e.target.value,
									},
								})}
								placeholder="Nhập mô tả..."
								style={{ marginTop: 8 }}
								rows={10}
							/>
						</div>

					</Space>
				</div>
			)}
		</Modal>
	);
};

export default EditDashboardItemModal; 