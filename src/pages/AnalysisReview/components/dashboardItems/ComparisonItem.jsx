import React from 'react';
import { Button, Title, Tag } from 'antd';
import { SettingOutlined, SafetyOutlined } from '@ant-design/icons';
import { Trash } from 'lucide-react';
import { AgCharts } from 'ag-charts-react';

const ComparisonItem = ({
	item,
	chartOptions,
	loading,
	currentUser,
	deleteLoading,
	deletingItemId,
	kpi2Calculators,
	onOpenEditModal,
	onOpenUserClassModal,
	onDeleteDashboardItem,
	onLoadComparisonData,
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
				<div style={{ display: 'flex', alignItems: 'start', gap: 8 }}>
					{(() => {
						const kpis = item.settings?.kpis?.map(kpiId =>
							kpi2Calculators.find(k => k.id === kpiId),
						).filter(Boolean) || [];

						if (kpis.length === 0) return null;

						const colors = ['blue', 'green', 'orange', 'red', 'purple', 'cyan', 'lime', 'volcano'];
						return (
							<div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
								{kpis.map((kpi, index) => (
									<Tag key={kpi.id}
										color={colors[index % colors.length]}
										style={{ marginBottom: 8 }}>
										{kpi.name}
									</Tag>
								))}
							</div>
						);
					})()}
				</div>
			</div>

			<div
				style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
				{chartOptions[item.id] ? (
					<div style={{ width: '100%' }}>
						<AgCharts options={chartOptions[item.id]} />
					</div>
				) : (
					<div style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: '#fafafa',
						borderRadius: '6px',
						border: '1px dashed #d9d9d9',
					}}>
						<Button
							type='primary'
							size='small'
							onClick={() => onLoadComparisonData(item)}
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

export default ComparisonItem;
