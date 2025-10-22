import React from 'react';
import { Button, Title, Flex } from 'antd';
import { SettingOutlined, SafetyOutlined } from '@ant-design/icons';
import { Trash } from 'lucide-react';
import { AgCharts } from 'ag-charts-react';

const ChartItem = ({
	item,
	tableData,
	chartOptions,
	showAnalysis,
	loading,
	currentUser,
	deleteLoading,
	deletingItemId,
	onOpenEditModal,
	onOpenUserClassModal,
	onDeleteDashboardItem,
	onLoadChartData,
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

				<Flex align='baseline' gap={8}>
					<h2 style={{ margin: 0, padding: 0 }}>
						{(() => {
							const lastValue = tableData[item.id]?.[tableData[item.id]?.length - 1]?.value;
							if (lastValue !== undefined && !isNaN(lastValue)) {
								return lastValue.toLocaleString('vn-VN', {
									minimumFractionDigits: 0,
									maximumFractionDigits: 2,
									useGrouping: true,
								});
							}
							return '0';
						})()}
					</h2>
					{(() => {
						const data = tableData[item.id];
						if (data && data.length >= 2) {
							const currentValue = data[data.length - 1]?.value;
							const previousValue = data[data.length - 2]?.value;

							if (currentValue !== undefined && previousValue !== undefined &&
								!isNaN(currentValue) && !isNaN(previousValue) && previousValue !== 0) {

								const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
								const isPositive = percentageChange >= 0;

								return (
									<div style={{
										display: 'flex',
										alignItems: 'center',
										gap: '4px',
										fontSize: '14px',
										fontWeight: '500',
										color: isPositive ? '#10b981' : '#ef4444',
									}}>
										<span>{isPositive ? '↗' : '↘'}</span>
										<span>{Math.abs(percentageChange).toFixed(1)}%</span>
									</div>
								);
							}
						}
						return null;
					})()}
				</Flex>
			</div>

			<div style={{ display: 'flex', justifyContent: 'center' }}>
				{chartOptions[item.id] ? (
					<div style={{
						width: '100%',
						height: showAnalysis ? '350px' : '300px',
					}}>
						<AgCharts options={chartOptions[item.id]} />
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
							onClick={() => onLoadChartData(item)}
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

export default ChartItem;
