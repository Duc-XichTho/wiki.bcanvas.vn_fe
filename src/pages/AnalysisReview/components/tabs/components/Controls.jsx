import React from 'react';
import { Button, Card, Space, Input, Tooltip, Typography } from 'antd';
import {
	AppstoreAddOutlined,
	AppstoreOutlined,
	EyeOutlined,
	EyeInvisibleOutlined,
	PlusOutlined,
	SettingOutlined,
	TagsOutlined,
	SearchOutlined,
} from '@ant-design/icons';
import styles from '../BusinessMeasurementTab.module.css';

const { Text } = Typography;

const Controls = ({
	searchQuery,
	setSearchQuery,
	arrangeMode,
	setArrangeMode,
	gridMode,
	setGridMode,
	showAnalysis,
	setShowAnalysis,
	onOpenNewCardModal,
	onOpenTagSettings,
	onOpenPromptSettings,
	currentUser,
	windowWidth,
}) => {
	return (
		<Card className={styles.controlsCard}>
			<Space direction='vertical' size={0} className={styles.controlsContainer}>
				{/* Optimized Controls - All on one line */}
				<div className={styles.controlsRow}>
					{/* Search Input - Reduced width */}
					<div className={styles.searchContainer}>
						<Input
							placeholder='Tìm kiếm chỉ số...'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							prefix={<SearchOutlined />}
							className={styles.searchInput}
						/>
					</div>

					{/* Action Buttons */}
					<div className={styles.actionButtons}>
						{/* Add New Card Button */}
						{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
							<Tooltip title='Thêm thẻ mới'>
								<Button
									icon={<PlusOutlined />}
									size={windowWidth <= 480 ? 'small' : 'middle'}
									onClick={onOpenNewCardModal}
									style={{
										fontSize: windowWidth <= 480 ? '11px' : '12px',
									}}
								/>
							</Tooltip>
						)}

						{/* Arrange Mode Button */}
						<Button
							type={arrangeMode ? 'primary' : 'default'}
							icon={<AppstoreOutlined />}
							size={windowWidth <= 480 ? 'small' : 'middle'}
							onClick={() => setArrangeMode(!arrangeMode)}
							style={{
								fontSize: windowWidth <= 480 ? '11px' : '12px',
							}}
						/>

						{/* Grid Mode Button */}
						{windowWidth > 1024 && (
							<Tooltip title={`Chuyển sang ${gridMode === 3 ? '2' : '3'} thẻ mỗi hàng`}>
								<Button
									icon={gridMode === 3 ? <AppstoreAddOutlined /> : <AppstoreOutlined />}
									size={windowWidth <= 480 ? 'small' : 'middle'}
									onClick={() => setGridMode(gridMode === 3 ? 2 : 3)}
									style={{
										fontSize: windowWidth <= 480 ? '11px' : '12px',
									}}
								/>
							</Tooltip>
						)}

						{/* Toggle Analysis Button */}
						<Tooltip title={showAnalysis ? '' : ''}>
							<Button
								type={showAnalysis ? 'default' : 'default'}
								icon={showAnalysis ? <EyeOutlined /> : <EyeInvisibleOutlined />}
								size={windowWidth <= 480 ? 'small' : 'middle'}
								onClick={() => setShowAnalysis(!showAnalysis)}
								style={{
									fontSize: windowWidth <= 480 ? '11px' : '12px',
								}}
							>
								{windowWidth <= 480 ? (showAnalysis ? 'Ẩn PT' : 'Hiện PT') : (showAnalysis ? '' : '')}
							</Button>
						</Tooltip>

						{/* Tags Settings Button */}
						{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
							<Tooltip title='Cài đặt Tags'>
								<Button
									icon={<TagsOutlined />}
									size={windowWidth <= 480 ? 'small' : 'middle'}
									style={{
										fontSize: windowWidth <= 480 ? '11px' : '12px',
									}}
									onClick={onOpenTagSettings}
								/>
							</Tooltip>
						)}

						{/* Prompt Settings Button */}
						{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
							<Tooltip title='Cài đặt Prompt mặc định'>
								<Button
									icon={<SettingOutlined />}
									size={windowWidth <= 480 ? 'small' : 'middle'}
									style={{
										fontSize: windowWidth <= 480 ? '11px' : '12px',
									}}
									onClick={onOpenPromptSettings}
								/>
							</Tooltip>
						)}
					</div>
				</div>

				{/* Arrange Mode Info */}
				{arrangeMode && (
					<div style={{
						backgroundColor: '#eff6ff',
						border: '1px solid #bfdbfe',
						borderRadius: 8,
						padding: 12,
					}}>
						<Text style={{ fontSize: 12, color: '#1d4ed8' }}>
							Chế độ sắp xếp: Sử dụng nút ↑ ↓ trên mỗi thẻ để thay đổi thứ tự hiển thị
						</Text>
					</div>
				)}
			</Space>
		</Card>
	);
};

export default Controls;
