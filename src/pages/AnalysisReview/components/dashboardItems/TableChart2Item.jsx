import React from 'react';
import { Button, Title, Space, Select, DatePicker } from 'antd';
import { SettingOutlined, SafetyOutlined } from '@ant-design/icons';
import { Trash, ListRestart } from 'lucide-react';
import { AgCharts } from 'ag-charts-react';

const { Option } = Select;

const TableChart2Item = ({
	item,
	chartOptions,
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
	onLoadTableChart2Data,
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

			{/* Date Range Filter for table_chart_2 */}
			{item.settings?.timeColumn && (
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

			<div style={{ display: 'flex', justifyContent: 'center' }}>
				{chartOptions[item.id] ? (
					<div style={{
						width: '100%',
						height: !showAnalysis ? '330px' : '280px',
					}}>
						<AgCharts options={chartOptions[item.id]}
							style={{ width: '100%', height: '100%' }} />
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
							type='primary'
							size='small'
							onClick={() => onLoadTableChart2Data(item)}
							loading={loading}
						>
							Tải dữ liệu
						</Button>
					</div>
				)}
			</div>
		</>
	);
};

export default TableChart2Item;
