import React from 'react';
import {
	Button,
	Card,
	Col,
	Input,
	Modal,
	Row,
	Select,
	Space,
	Typography,
	Checkbox
} from 'antd';
import {
	BarChartOutlined,
	PieChartOutlined,
	TrophyOutlined,
	AppstoreOutlined,
	TableOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const CreateCardModal = ({
	visible,
	onCancel,
	onCreate,
	newCard,
	setNewCard,
	businessTags,
	storeTags,
	kpi2Calculators,
	kpiCalculators,
	approvedVersions,
	selectedKpis,
	setSelectedKpis,
	selectedApprovedVersion,
	handleApprovedVersionChange,
	templateColumns,
	selectedColumns,
	setSelectedColumns,
	topN,
	setTopN,
	loading,
	// Table chart states
	newTemplateColumns,
	newTableChartTimeColumn,
	setNewTableChartTimeColumn,
	newTableChartGroupColumn,
	setNewTableChartGroupColumn,
	newTableChartValueColumn,
	setNewTableChartValueColumn,
	newTableChartType,
	setNewTableChartType,
	newTableChartDataGrouping,
	setNewTableChartDataGrouping,
	handleNewTableApprovedVersionChange,
	// Table chart 2 states
	newTableChart2TimeColumn,
	setNewTableChart2TimeColumn,
	newTableChart2GroupColumn,
	setNewTableChart2GroupColumn,
	newTableChart2ValueColumn,
	setNewTableChart2ValueColumn,
	newTableChart2Type,
	setNewTableChart2Type,
	newTableChart2DateRange,
	setNewTableChart2DateRange,
	// Table states
	newTableDisplayColumns,
	handleNewTableDisplayColumnsChange,
	newTableDateColumn,
	setNewTableDateColumn,
	newTableTimeThreshold,
	setNewTableTimeThreshold,
	newTableDateRange,
	setNewTableDateRange,
	newTableDateColumnSize,
	setNewTableDateColumnSize,
	newTableFilterColumn,
	setNewTableFilterColumn,
	newTableSortColumn,
	setNewTableSortColumn,
	newTableSortType,
	setNewTableSortType,
	newTableColumnSettings,
	setNewTableColumnSettings,
	newTableColumnSizes,
	setNewTableColumnSizes,
	newCollapsedColumns,
	toggleNewColumnCollapse,
	currentUser
}) => {
	return (
		<Modal
			title="Tạo thẻ mới"
			open={visible}
			onCancel={onCancel}
			footer={[
				<Button key="cancel" onClick={onCancel}>
					Hủy bỏ
				</Button>,
				<Button
					key="create"
					type="primary"
					onClick={onCreate}
					disabled={!newCard.title.trim()}
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
						value={newCard.title}
						onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
						placeholder="Nhập tiêu đề thẻ..."
						style={{ marginTop: 8 }}
					/>
				</div>

				<div>
					<Text strong>Loại thẻ *</Text>
					<div style={{ marginTop: 8 }}>
						{/* First Row */}
						<Row gutter={[12, 16]} style={{ marginBottom: 16 }}>
							<Col span={4}>
								<Card
									size="small"
									style={{
										border: newCard.type === 'chart' ? '2px solid #3b82f6' : '1px solid #d1d5db',
										backgroundColor: newCard.type === 'chart' ? '#eff6ff' : 'white',
										cursor: 'pointer',
										height: 120,
									}}
									onClick={() => setNewCard({ ...newCard, type: 'chart' })}
								>
									<div style={{ textAlign: 'center' }}>
										<BarChartOutlined style={{ fontSize: 24, color: '#3b82f6', marginBottom: 8 }} />
										<div style={{ fontWeight: 500, fontSize: 14 }}>Thẻ chỉ số</div>
										<div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
											Phân tích và benchmark chỉ số cụ thể
										</div>
									</div>
								</Card>
							</Col>
							<Col span={4}>
								<Card
									size="small"
									style={{
										border: newCard.type === 'table_chart' ? '2px solid #06b6d4' : '1px solid #d1d5db',
										backgroundColor: newCard.type === 'table_chart' ? '#ecfeff' : 'white',
										cursor: 'pointer',
										height: 120,
									}}
									onClick={() => setNewCard({ ...newCard, type: 'table_chart' })}
								>
									<div style={{ textAlign: 'center' }}>
										<PieChartOutlined style={{ fontSize: 24, color: '#06b6d4', marginBottom: 8 }} />
										<div style={{ fontWeight: 500, fontSize: 14 }}>BIỂU ĐỒ</div>
										<div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
											Từ bảng dữ liệu
										</div>
									</div>
								</Card>
							</Col>
							<Col span={4}>
								<Card
									size="small"
									style={{
										border: newCard.type === 'table_chart_2' ? '2px solid #8b5cf6' : '1px solid #d1d5db',
										backgroundColor: newCard.type === 'table_chart_2' ? '#f3f4f6' : 'white',
										cursor: 'pointer',
										height: 120,
									}}
									onClick={() => setNewCard({ ...newCard, type: 'table_chart_2' })}
								>
									<div style={{ textAlign: 'center' }}>
										<BarChartOutlined style={{ fontSize: 24, color: '#8b5cf6', marginBottom: 8 }} />
										<div style={{ fontWeight: 500, fontSize: 14 }}>BIỂU ĐỒ</div>
										<div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
											Từ bảng dữ liệu kết hợp lọc theo thời gian
										</div>
									</div>
								</Card>
							</Col>
							<Col span={4}>
								<Card
									size="small"
									style={{
										border: newCard.type === 'top' ? '2px solid #10b981' : '1px solid #d1d5db',
										backgroundColor: newCard.type === 'top' ? '#ecfdf5' : 'white',
										cursor: 'pointer',
										height: 120,
									}}
									onClick={() => setNewCard({ ...newCard, type: 'top' })}
								>
									<div style={{ textAlign: 'center' }}>
										<TrophyOutlined style={{ fontSize: 24, color: '#10b981', marginBottom: 8 }} />
										<div style={{ fontWeight: 500, fontSize: 14 }}>TOP</div>
										<div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
											Danh sách xếp hạng
										</div>
									</div>
								</Card>
							</Col>
							<Col span={4}>
								<Card
									size="small"
									style={{
										border: newCard.type === 'comparison' ? '2px solid #f59e0b' : '1px solid #d1d5db',
										backgroundColor: newCard.type === 'comparison' ? '#fffbeb' : 'white',
										cursor: 'pointer',
										height: 120,
									}}
									onClick={() => setNewCard({ ...newCard, type: 'comparison' })}
								>
									<div style={{ textAlign: 'center' }}>
										<AppstoreOutlined style={{ fontSize: 24, color: '#f59e0b', marginBottom: 8 }} />
										<div style={{ fontWeight: 500, fontSize: 14 }}>SO SÁNH CHỈ SỐ</div>
										<div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
											So sánh 1 chỉ số cụ thể giữa nhiều đơn vị
										</div>
									</div>
								</Card>
							</Col>
							<Col span={4}>
								<Card
									size="small"
									style={{
										border: newCard.type === 'table' ? '2px solid #8b5cf6' : '1px solid #d1d5db',
										backgroundColor: newCard.type === 'table' ? '#f3f4f6' : 'white',
										cursor: 'pointer',
										height: 120,
									}}
									onClick={() => setNewCard({ ...newCard, type: 'table' })}
								>
									<div style={{ textAlign: 'center' }}>
										<TableOutlined style={{ fontSize: 24, color: '#8b5cf6', marginBottom: 8 }} />
										<div style={{ fontWeight: 500, fontSize: 14 }}>TABLE</div>
										<div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Bảng dữ liệu</div>
									</div>
								</Card>
							</Col>
						</Row>

						{/* Second Row */}
						<Row gutter={[12, 16]}>
							<Col span={4}>
								<Card
									size="small"
									style={{
										border: newCard.type === 'statistics' ? '2px solid #dc2626' : '1px solid #d1d5db',
										backgroundColor: newCard.type === 'statistics' ? '#fef2f2' : 'white',
										cursor: 'pointer',
										height: 120,
									}}
									onClick={() => setNewCard({ ...newCard, type: 'statistics' })}
								>
									<div style={{ textAlign: 'center' }}>
										<BarChartOutlined style={{ fontSize: 24, color: '#dc2626', marginBottom: 8 }} />
										<div style={{ fontWeight: 500, fontSize: 14 }}>THỐNG KÊ</div>
										<div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
											Nhiều KPI Calculator theo hàng dọc
										</div>
									</div>
								</Card>
							</Col>
						</Row>
					</div>
				</div>

				{/* Chart Type Configuration */}
				{newCard.type === 'chart' && (
					<>
						<div>
							<Text strong>Chọn KPI *</Text>
							<Select
								value={newCard.idData}
								onChange={(value) => setNewCard({ ...newCard, idData: value })}
								style={{ width: '100%', marginTop: 8 }}
								placeholder="Chọn KPI"
								showSearch
								filterOption={(input, option) => 
									option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
								}
							>
								{kpi2Calculators.map(kpi => (
									<Option key={kpi.id} value={kpi.id}>
										{kpi.name}
									</Option>
								))}
							</Select>
						</div>
						<div>
							<Text strong>Số lượng kỳ gần nhất hiển thị</Text>
							<Select
								value={newCard.recentPeriods}
								onChange={(value) => setNewCard({ ...newCard, recentPeriods: value })}
								style={{ width: '100%', marginTop: 8 }}
								placeholder="Chọn số lượng kỳ gần nhất"
							>
								<Option value={0}>Tất cả kỳ</Option>
								<Option value={3}>3 kỳ gần nhất</Option>
								<Option value={5}>5 kỳ gần nhất</Option>
								<Option value={10}>10 kỳ gần nhất</Option>
								<Option value={12}>12 kỳ gần nhất</Option>
								<Option value={24}>24 kỳ gần nhất</Option>
								<Option value={48}>48 kỳ gần nhất</Option>
							</Select>
							<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
								Chỉ hiển thị số lượng kỳ gần nhất trên biểu đồ (0 = hiển thị tất cả)
							</Text>
						</div>
					</>
				)}

				{/* Table Chart Type Configuration */}
				{newCard.type === 'table_chart' && (
					<>
						<div>
							<Text strong>Chọn dữ liệu *</Text>
							<Select
								value={newCard.idData}
								onChange={handleNewTableApprovedVersionChange}
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
											<Text strong>Chọn cột thời gian</Text>
											<Select
												value={newTableChartTimeColumn || undefined}
												onChange={(value) => setNewTableChartTimeColumn(value)}
												style={{ width: '100%', marginTop: 8 }}
												placeholder="Chọn cột thời gian (tùy chọn)"
												showSearch
												filterOption={(input, option) => 
													option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
												}
												allowClear
											>
												{newTemplateColumns
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
													))
												}
											</Select>
										</div>
									</Col>
									<Col span={8}>
										<div>
											<Text strong>Chọn cột gom nhóm</Text>
											<Select
												value={newTableChartGroupColumn || undefined}
												onChange={(value) => setNewTableChartGroupColumn(value)}
												style={{ width: '100%', marginTop: 8 }}
												placeholder="Chọn cột gom nhóm (tùy chọn)"
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
										</div>
									</Col>
									<Col span={8}>
										<div>
											<Text strong>Chọn cột giá trị *</Text>
											<Select
												value={newTableChartValueColumn || undefined}
												onChange={(value) => setNewTableChartValueColumn(value)}
												style={{ width: '100%', marginTop: 8 }}
												placeholder="Chọn cột giá trị"
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
									</Col>
								</Row>

								<Row gutter={16}>
									<Col span={12}>
										<div>
											<Text strong>Kiểu biểu đồ</Text>
											<Select
												value={newTableChartType}
												onChange={(value) => setNewTableChartType(value)}
												style={{ width: '100%', marginTop: 8 }}
												placeholder="Chọn kiểu biểu đồ"
											>
												<Option value="line">Line</Option>
												<Option value="bar">Bar</Option>
												<Option value="pie">Pie</Option>
												<Option value="stacked_area">Stacked Area</Option>
											</Select>
										</div>
									</Col>
									<Col span={12}>
										<div>
											<Text strong>Gộp dữ liệu theo thời gian</Text>
											<Select
												value={newTableChartDataGrouping}
												onChange={(value) => setNewTableChartDataGrouping(value)}
												style={{ width: '100%', marginTop: 8 }}
												placeholder="Chọn cách gộp dữ liệu"
												disabled={!newTableChartTimeColumn}
											>
												<Option value="none">Giữ nguyên</Option>
												<Option value="month">Theo tháng</Option>
												<Option value="week">Theo tuần</Option>
											</Select>
											<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
												{newTableChartTimeColumn ? 
													'Chỉ áp dụng khi có cột thời gian' : 
													'Cần chọn cột thời gian để sử dụng tính năng này'
												}
											</Text>
										</div>
									</Col>
								</Row>
							</>
						)}
					</>
				)}

				{/* Table Chart 2 Type Configuration */}
				{newCard.type === 'table_chart_2' && (
					<>
						<div>
							<Text strong>Chọn dữ liệu *</Text>
							<Select
								value={newCard.idData}
								onChange={handleNewTableApprovedVersionChange}
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
											<Text strong>Cột thời gian (lọc dữ liệu)</Text>
											<Select
												value={newTableChart2TimeColumn || undefined}
												onChange={(value) => setNewTableChart2TimeColumn(value)}
												style={{ width: '100%', marginTop: 8 }}
												placeholder="Chọn cột thời gian để lọc (tùy chọn)"
												showSearch
												filterOption={(input, option) => 
													option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
												}
												allowClear
											>
												{newTemplateColumns
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
													))
												}
											</Select>
										</div>
									</Col>
									<Col span={8}>
										<div>
											<Text strong>Cột nhóm (trục X)</Text>
											<Select
												value={newTableChart2GroupColumn || undefined}
												onChange={(value) => setNewTableChart2GroupColumn(value)}
												style={{ width: '100%', marginTop: 8 }}
												placeholder="Chọn cột nhóm cho trục X (tùy chọn)"
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
										</div>
									</Col>
									<Col span={8}>
										<div>
											<Text strong>Cột giá trị (trục Y) *</Text>
											<Select
												value={newTableChart2ValueColumn || undefined}
												onChange={(value) => setNewTableChart2ValueColumn(value)}
												style={{ width: '100%', marginTop: 8 }}
												placeholder="Chọn cột giá trị cho trục Y"
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
									</Col>
								</Row>

								<Row gutter={16}>
									<Col span={8}>
										<div>
											<Text strong>Khoảng thời gian lọc</Text>
											<Select
												value={newTableChart2DateRange}
												onChange={(value) => setNewTableChart2DateRange(value)}
												style={{ width: '100%', marginTop: 8 }}
												placeholder="Chọn khoảng thời gian lọc"
												disabled={!newTableChart2TimeColumn}
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
												{newTableChart2TimeColumn ? 
													'Lọc dữ liệu theo khoảng thời gian' : 
													'Cần chọn cột thời gian để lọc dữ liệu'
												}
											</Text>
										</div>
									</Col>
									<Col span={8}>
										<div>
											<Text strong>Loại biểu đồ</Text>
											<Select
												value={newTableChart2Type}
												onChange={(value) => setNewTableChart2Type(value)}
												style={{ width: '100%', marginTop: 8 }}
												placeholder="Chọn loại biểu đồ"
											>
												<Option value="line">Đường</Option>
												<Option value="bar">Cột</Option>
												<Option value="pie">Tròn</Option>
											</Select>
										</div>
									</Col>
								</Row>
							</>
						)}
					</>
				)}

				{/* Comparison Type Configuration */}
				{newCard.type === 'comparison' && (
					<>
						<div>
							<Text strong>Chọn các KPI để so sánh *</Text>
							<Select
								mode="multiple"
								value={selectedKpis}
								onChange={(values) => setSelectedKpis(values)}
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
						</div>
						<div>
							<Text strong>Số lượng kỳ gần nhất hiển thị</Text>
							<Select
								value={newCard.recentPeriods}
								onChange={(value) => setNewCard({ ...newCard, recentPeriods: value })}
								style={{ width: '100%', marginTop: 8 }}
								placeholder="Chọn số lượng kỳ gần nhất"
							>
								<Option value={0}>Tất cả kỳ</Option>
								<Option value={3}>3 kỳ gần nhất</Option>
								<Option value={5}>5 kỳ gần nhất</Option>
								<Option value={10}>10 kỳ gần nhất</Option>
								<Option value={12}>12 kỳ gần nhất</Option>
								<Option value={24}>24 kỳ gần nhất</Option>
								<Option value={48}>48 kỳ gần nhất</Option>
							</Select>
							<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
								Chỉ hiển thị số lượng kỳ gần nhất trên biểu đồ (0 = hiển thị tất cả)
							</Text>
						</div>
					</>
				)}

				{/* Top Type Configuration */}
				{newCard.type === 'top' && (
					<>
						<div>
							<Text strong>Chọn dữ liệu *</Text>
							<Select
								value={selectedApprovedVersion}
								onChange={handleApprovedVersionChange}
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

						{templateColumns.length > 0 && (
							<>
								<div>
									<Text strong>Chọn cột tên *</Text>
									<Select
										value={selectedColumns.column1}
										onChange={(value) => setSelectedColumns({
											...selectedColumns,
											column1: value,
										})}
										style={{ width: '100%', marginTop: 8 }}
										placeholder="Chọn cột chứa tên"
									>
										{templateColumns.map(col => (
											<Option key={col.id} value={col.id}>
												{col.columnName}
											</Option>
										))}
									</Select>
								</div>

								<div>
									<Text strong>Chọn cột giá trị *</Text>
									<Select
										value={selectedColumns.column2}
										onChange={(value) => setSelectedColumns({
											...selectedColumns,
											column2: value,
										})}
										style={{ width: '100%', marginTop: 8 }}
										placeholder="Chọn cột chứa giá trị"
									>
										{templateColumns.map(col => (
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
										value={topN}
										onChange={(e) => setTopN(parseInt(e.target.value) || 5)}
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

				{/* Table Type Configuration */}
				{newCard.type === 'table' && (
					<>
						<div>
							<Text strong>Chọn dữ liệu *</Text>
							<Select
								value={newCard.idData}
								onChange={handleNewTableApprovedVersionChange}
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
												onChange={(value) => setNewTableDateColumn(value)}
												style={{ width: '100%', marginTop: 8 }}
												placeholder="Chọn cột thời gian (tùy chọn)"
												showSearch
												filterOption={(input, option) => 
													option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
												}
												allowClear
											>
												{newTemplateColumns
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
													))
												}
											</Select>
										</div>
									</Col>
									<Col span={8}>
										<div>
											<Text strong>Mốc thời gian phân tích AI</Text>
											<Input
												type="datetime-local"
												value={newTableTimeThreshold || ''}
												onChange={(e) => setNewTableTimeThreshold(e.target.value)}
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
												value={newTableDateRange}
												onChange={(value) => setNewTableDateRange(value)}
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
												onChange={(value) => setNewTableDateColumnSize(value)}
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

								<Row gutter={16}>
									<Col span={8}>
										<div>
											<Text strong>Cột lọc dữ liệu</Text>
											<Select
												value={newTableFilterColumn || undefined}
												onChange={(value) => setNewTableFilterColumn(value)}
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
												value={newTableSortColumn || undefined}
												onChange={(value) => setNewTableSortColumn(value)}
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
												value={newTableSortType}
												onChange={(value) => setNewTableSortType(value)}
												style={{ width: '100%', marginTop: 8 }}
												placeholder="Chọn kiểu sắp xếp"
												disabled={!newTableSortColumn}
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
										value={newTableDisplayColumns || []}
										onChange={handleNewTableDisplayColumnsChange}
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
													 onClick={() => toggleNewColumnCollapse(columnId)}
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
														{/* Add collapse icon here if needed */}
													</div>
												</div>

												{!isCollapsed && (
													<div style={{ padding: '8px 32px' }}>
														{/* Column type selection */}
														<div style={{ display: 'flex', gap: '16px' }}>
															<div style={{ width: '30%' }}>
																<Text strong>Loại dữ liệu</Text>
															</div>
															<div style={{ width: '70%' }}>
																<Select
																	value={columnSetting.type}
																	onChange={(value) => {
																		const newSettings = { ...newTableColumnSettings };
																		newSettings[columnId] = {
																			...newSettings[columnId],
																			type: value,
																		};
																		setNewTableColumnSettings(newSettings);
																	}}
																	style={{ width: '100%' }}
																>
																	<Option value="date">Ngày tháng</Option>
																	<Option value="value">Giá trị</Option>
																	<Option value="dataBar">Data Bar</Option>
																	<Option value="text">Chữ</Option>
																</Select>
															</div>
														</div>

														{/* Date format options */}
														{columnSetting.type === 'date' && (
															<div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
																<div style={{ width: '30%' }}>
																	<Text strong>Định dạng ngày</Text>
																</div>
																<div style={{ width: '70%' }}>
																	<Select
																		value={columnSetting.dateFormat}
																		onChange={(value) => {
																			const newSettings = { ...newTableColumnSettings };
																			newSettings[columnId] = {
																				...newSettings[columnId],
																				dateFormat: value,
																			};
																			setNewTableColumnSettings(newSettings);
																		}}
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

														{/* Value format options */}
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
																					onChange={(e) => {
																						const newSettings = { ...newTableColumnSettings };
																						newSettings[columnId] = {
																							...newSettings[columnId],
																							valueFormat: {
																								...newSettings[columnId].valueFormat,
																								showThousands: e.target.checked,
																							},
																						};
																						setNewTableColumnSettings(newSettings);
																					}}
																				>
																					Thể hiện hàng nghìn (K)
																				</Checkbox>
																			</div>
																			<div>
																				<Checkbox
																					checked={columnSetting.valueFormat.showMillions}
																					onChange={(e) => {
																						const newSettings = { ...newTableColumnSettings };
																						newSettings[columnId] = {
																							...newSettings[columnId],
																							valueFormat: {
																								...newSettings[columnId].valueFormat,
																								showMillions: e.target.checked,
																							},
																						};
																						setNewTableColumnSettings(newSettings);
																					}}
																				>
																					Thể hiện hàng triệu (M)
																				</Checkbox>
																			</div>
																			<div>
																				<Checkbox
																					checked={columnSetting.valueFormat.showPercentage}
																					onChange={(e) => {
																						const newSettings = { ...newTableColumnSettings };
																						newSettings[columnId] = {
																							...newSettings[columnId],
																							valueFormat: {
																								...newSettings[columnId].valueFormat,
																								showPercentage: e.target.checked,
																							},
																						};
																						setNewTableColumnSettings(newSettings);
																					}}
																				>
																					Thể hiện dạng %
																				</Checkbox>
																			</div>
																			<div>
																				<Checkbox
																					checked={columnSetting.valueFormat.negativeRed}
																					onChange={(e) => {
																						const newSettings = { ...newTableColumnSettings };
																						newSettings[columnId] = {
																							...newSettings[columnId],
																							valueFormat: {
																								...newSettings[columnId].valueFormat,
																								negativeRed: e.target.checked,
																							},
																						};
																						setNewTableColumnSettings(newSettings);
																					}}
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
																			onChange={(value) => {
																				const newSettings = { ...newTableColumnSettings };
																				newSettings[columnId] = {
																					...newSettings[columnId],
																					valueFormat: {
																						...newSettings[columnId].valueFormat,
																						decimalPlaces: value,
																					},
																				};
																				setNewTableColumnSettings(newSettings);
																			}}
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
																			onChange={(value) => {
																				setNewTableColumnSizes(prev => ({
																					...prev,
																					[columnId]: value,
																				}));
																			}}
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
									})}
								</div>
							</>
						)}
					</>
				)}

				{/* Statistics Type Configuration */}
				{newCard.type === 'statistics' && (
					<>
						<div>
							<Text strong>Chọn KPI Calculators *</Text>
							<Select
								mode="multiple"
								value={newCard.selectedKpiCalculators}
								onChange={(value) => setNewCard({ ...newCard, selectedKpiCalculators: value })}
								style={{ width: '100%', marginTop: 8 }}
								placeholder="Chọn nhiều KPI Calculator"
								showSearch
								filterOption={(input, option) => 
									option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
								}
							>
								{kpiCalculators.map(kpi => (
									<Option key={kpi.id} value={kpi.id}>
										{kpi.name}
									</Option>
								))}
							</Select>
							<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
								Chọn hiển thị các chỉ số sắp xếp từ trên xuống dưới
							</Text>
						</div>
					</>
				)}

				{/* Tags Configuration */}
				<Row gutter={16}>
					<Col span={12}>
						<div>
							<Text strong>Tag Function</Text>
							<Select
								value={newCard.tag}
								onChange={(value) => setNewCard({ ...newCard, tag: value })}
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
								value={newCard.storeTag}
								onChange={(value) => setNewCard({ ...newCard, storeTag: value })}
								style={{ width: '100%', marginTop: 8 }}
							>
								{storeTags.filter(tag => tag !== 'All').map(tag => (
									<Option key={tag} value={tag}>{tag}</Option>
								))}
							</Select>
						</div>
					</Col>
				</Row>

				{/* AI Prompt (Super Admin only) */}
				{currentUser && currentUser.isSuperAdmin && (
					<div>
						<Text strong>Yêu cầu cho AI</Text>
						<Input.TextArea
							value={newCard.prompt}
							onChange={(e) => setNewCard({ ...newCard, prompt: e.target.value })}
							placeholder="Nhập prompt..."
							style={{ marginTop: 8 }}
							rows={3}
						/>
					</div>
				)}

				{/* Description */}
				<div>
					<Text strong>Mô tả</Text>
					<Input.TextArea
						value={newCard.answer}
						onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
						placeholder="Nhập mô tả..."
						style={{ marginTop: 8 }}
						rows={4}
					/>
				</div>
			</Space>
		</Modal>
	);
};

export default CreateCardModal;
