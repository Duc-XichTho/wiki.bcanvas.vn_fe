import React from 'react';
import { Button, Title, Flex } from 'antd';
import { SettingOutlined, SafetyOutlined } from '@ant-design/icons';
import { Trash } from 'lucide-react';
import { AgCharts } from 'ag-charts-react';

const TableChartItem = ({
	item,
	chartOptions,
	showAnalysis,
	loading,
	currentUser,
	deleteLoading,
	deletingItemId,
	onOpenEditModal,
	onOpenUserClassModal,
	onDeleteDashboardItem,
	onLoadTableChartData,
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

				{/* Display current value and percentage change (similar to CHART type) */}
				<Flex align='baseline' gap={8}>
				</Flex>
			</div>

			<div style={{ display: 'flex', justifyContent: 'center' }}>
				{chartOptions[item.id] ? (
					<div style={{
						width: '100%',
						height: !showAnalysis ? '440px' : '350px',
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
							onClick={() => onLoadTableChartData(item)}
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

export default TableChartItem;
