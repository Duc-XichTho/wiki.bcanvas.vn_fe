import React from 'react';
import { Button, Title, Typography } from 'antd';
import { SettingOutlined, SafetyOutlined } from '@ant-design/icons';
import { Trash } from 'lucide-react';

const { Text } = Typography;

const TopItem = ({
	item,
	tableData,
	loading,
	currentUser,
	deleteLoading,
	deletingItemId,
	onOpenEditModal,
	onOpenUserClassModal,
	onDeleteDashboardItem,
	onLoadTopData,
	formatCurrency,
}) => {
	return (
		<>
			<div style={{ marginBottom: 16 }}>
				<Title level={5} style={{ margin: '0 0 16px 0', lineHeight: 1.4 }}>
					{item.name}
				</Title>
			</div>

			<div style={{ marginBottom: 20 }}>
				{tableData[item.id] && tableData[item.id].length > 0 ? (
					<div style={{
						padding: '16px',
						backgroundColor: '#f9fafb',
						borderRadius: '8px',
					}}>
						{(() => {
							const topN = item.settings?.topN || 5;
							const displayData = tableData[item.id].slice(0, topN); // Chỉ hiển thị top N trong card nhỏ
							const maxValue = Math.max(...tableData[item.id].map(d => d.value || 0));

							return displayData.map((topItem, index) => (
								<div key={index} style={{
									display: 'flex',
									flexDirection: 'column',
									marginBottom: index < displayData.length - 1 ? '12px' : 0,
									paddingBottom: index < displayData.length - 1 ? '12px' : 0,
									borderBottom: index < displayData.length - 1 ? '1px solid #e5e7eb' : 'none',
								}}>
									<div style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										marginBottom: '6px',
									}}>
										<div style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
										}}>
											<div style={{
												width: '20px',
												height: '20px',
												borderRadius: '50%',
												backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#d97706' : '#6b7280',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontSize: '12px',
												fontWeight: 'bold',
												color: 'white',
											}}>
												{index + 1}
											</div>
											<Text style={{
												fontSize: '12px',
												fontWeight: 500,
											}}>
												{topItem.name}
											</Text>
										</div>
										<Text style={{
											fontSize: '12px',
											fontWeight: 600,
										}}>
											{formatCurrency(topItem.value)}
										</Text>
									</div>
									<div style={{
										width: '100%',
										height: '6px',
										backgroundColor: '#e5e7eb',
										borderRadius: '3px',
										overflow: 'hidden',
									}}>
										<div style={{
											width: `${(topItem.value / maxValue) * 100}%`,
											height: '100%',
											backgroundColor: '#3b82f6',
											borderRadius: '3px',
											transition: 'width 0.3s ease',
										}} />
									</div>
								</div>
							));
						})()}
					</div>
				) : (
					<div style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						height: '100px',
						backgroundColor: '#fafafa',
						borderRadius: '6px',
						border: '1px dashed #d9d9d9',
					}}>
						<Button
							type='primary'
							size='small'
							onClick={() => onLoadTopData(item)}
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

export default TopItem;
