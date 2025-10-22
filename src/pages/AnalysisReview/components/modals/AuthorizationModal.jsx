import React from 'react';
import {
	Button,
	Input,
	Modal,
	Space,
	Table,
	Tag,
	Typography,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Text } = Typography;

const AuthorizationModal = ({
	visible,
	onCancel,
	selectedDashboardItem,
	dashboardItems,
	allUserClasses,
	userClassSearchText,
	setUserClassSearchText,
	userClassFilter,
	setUserClassFilter,
	filteredUserClasses,
	selectedUserClasses,
	handleUserClassChange,
	handleSelectAllVisible,
	handleDeselectAllVisible,
	handleSaveUserClass,
	handleOpenUserClassModal,
}) => {
	return (
		<Modal
			title={selectedDashboardItem ? `Cài đặt quyền - ${selectedDashboardItem.name}` : 'Quản lý quyền truy cập'}
			open={visible}
			onCancel={onCancel}
			okText="Lưu"
			cancelText="Hủy"
			width={1000}
			footer={selectedDashboardItem ? [
				<Button key="cancel" onClick={onCancel}>
					Đóng
				</Button>,
				<Button key="save" type="primary" onClick={handleSaveUserClass}>
					Lưu
				</Button>,
			] : [
				<Button key="cancel" onClick={onCancel}>
					Đóng
				</Button>,
			]}
		>
			{selectedDashboardItem ? (
				// Modal cho 1 item cụ thể
				<div style={{ marginBottom: 16 }}>
					<div style={{
						marginBottom: 12,
						padding: '8px',
						backgroundColor: '#f0f8ff',
						border: '1px solid #91d5ff',
						borderRadius: '4px',
						fontSize: '12px',
					}}>
						<strong>Dashboard Item:</strong> {selectedDashboardItem.name}
					</div>
					<p style={{ marginBottom: 12, color: '#666', fontSize: '13px' }}>
						Chọn các nhóm người dùng có quyền truy cập:
					</p>

					{/* Search and Filter Controls */}
					<div style={{ marginBottom: 8 }}>
						<Input
							placeholder="Tìm kiếm..."
							value={userClassSearchText}
							onChange={(e) => setUserClassSearchText(e.target.value)}
							style={{ marginBottom: 6 }}
							size="small"
							prefix={<SearchOutlined />}
						/>
						<div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
							<Button
								size="small"
								type={userClassFilter === 'all' ? 'primary' : 'default'}
								onClick={() => setUserClassFilter('all')}
								style={{ fontSize: '11px', padding: '0 6px' }}
							>
								Tất cả
							</Button>
							<Button
								size="small"
								type={userClassFilter === 'selected' ? 'primary' : 'default'}
								onClick={() => setUserClassFilter('selected')}
								style={{ fontSize: '11px', padding: '0 6px' }}
							>
								Đã chọn
							</Button>
							<Button
								size="small"
								type={userClassFilter === 'unselected' ? 'primary' : 'default'}
								onClick={() => setUserClassFilter('unselected')}
								style={{ fontSize: '11px', padding: '0 6px' }}
							>
								Chưa chọn
							</Button>
						</div>
						<div style={{ display: 'flex', gap: 4 }}>
							<Button
								size="small"
								onClick={handleSelectAllVisible}
								disabled={filteredUserClasses.length === 0}
								style={{ fontSize: '11px', padding: '0 6px' }}
							>
								Chọn tất cả
							</Button>
							<Button
								size="small"
								onClick={handleDeselectAllVisible}
								disabled={filteredUserClasses.length === 0}
								style={{ fontSize: '11px', padding: '0 6px' }}
							>
								Bỏ chọn tất cả
							</Button>
						</div>
					</div>

					<div style={{
						maxHeight: '250px',
						overflowY: 'auto',
						border: '1px solid #d9d9d9',
						borderRadius: '4px',
						padding: '8px',
					}}>
						{filteredUserClasses.length > 0 ? (
							filteredUserClasses.map((userClass) => (
								<div key={userClass.id}>
									<input type={'checkbox'}
										   checked={selectedUserClasses.has(userClass.id)}
										   onChange={() => handleUserClassChange(userClass.id)}
										   style={{
											   display: 'inline-block',
											   borderRadius: '4px',
											   margin: 5,
											   height: '16px !important',
											   backgroundColor: selectedUserClasses.has(userClass.id) ? '#f0f8ff' : 'transparent',
										   }}
									/>
									{userClass.name}
								</div>
							))
						) : (
							<div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
								Không tìm thấy nhóm người dùng nào phù hợp
							</div>
						)}
					</div>
					{selectedUserClasses.size > 0 && (
						<div style={{
							marginTop: '8px',
							padding: '6px 8px',
							backgroundColor: '#f6ffed',
							border: '1px solid #b7eb8f',
							borderRadius: '4px',
							fontSize: '12px',
						}}>
							<strong>Đã chọn:</strong> {Array.from(selectedUserClasses).map(id => {
							const userClass = allUserClasses.find(uc => uc.id === id);
							return userClass ? userClass.name : `ID: ${id}`;
						}).join(', ')}
						</div>
					)}
					{selectedUserClasses.size === 0 && (
						<div style={{
							marginTop: '8px',
							padding: '6px 8px',
							backgroundColor: '#fff2e8',
							border: '1px solid #ffbb96',
							borderRadius: '4px',
							textAlign: 'center',
							color: '#d46b08',
							fontSize: '12px',
						}}>
							Chưa chọn nhóm người dùng nào
						</div>
					)}
				</div>
			) : (
				// Modal cho tất cả items
				<div>
					<div style={{
						marginBottom: 16,
						padding: '12px',
						backgroundColor: '#f0f8ff',
						border: '1px solid #91d5ff',
						borderRadius: '6px',
						fontSize: '13px',
					}}>
						<strong>Quản lý quyền truy cập cho tất cả Dashboard Items</strong>
						<br />
						<Text type="secondary" style={{ fontSize: '12px' }}>
							Xem quyền hiện tại và cài đặt lại quyền cho từng Dashboard Item
						</Text>
					</div>

					<Table
						dataSource={dashboardItems}
						columns={[
							{
								title: 'Dashboard Item',
								dataIndex: 'name',
								key: 'name',
								render: (text, record) => (
									<div>
										<div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
										<Space size={4}>
											<Tag color="default">{record.category}</Tag>
											<Tag color="blue">{record.type}</Tag>
											{record.userClasses && record.userClasses.length > 0 && (
												<Tag color="green">
													{record.userClasses.length} quyền
												</Tag>
											)}
										</Space>
									</div>
								),
							},
							{
								title: 'Quyền hiện tại',
								key: 'currentPermissions',
								render: (_, record) => (
									<div>
										{record.userClasses && record.userClasses.length > 0 ? (
											<div style={{ fontSize: '12px' }}>
												{record.userClasses.map(id => {
													const userClass = allUserClasses.find(uc => uc.id === id);
													return userClass ? userClass.name : `ID: ${id}`;
												}).join(', ')}
											</div>
										) : (
											<Text type="secondary" style={{ fontSize: '12px' }}>
												Không có hạn chế
											</Text>
										)}
									</div>
								),
							},
							{
								title: 'Thao tác',
								key: 'actions',
								width: 120,
								render: (_, record) => (
									<Button
										size="small"
										type="primary"
										onClick={() => handleOpenUserClassModal(record)}
										style={{ fontSize: '11px' }}
									>
										Cài đặt quyền
									</Button>
								),
							},
						]}
						pagination={false}
						size="small"
						rowKey="id"
						scroll={{ y: 400 }}
					/>

					<div style={{ marginTop: 16 }}>
						<Text strong>Hướng dẫn:</Text>
						<ul style={{ marginTop: 8, paddingLeft: 20 }}>
							<li>Xem quyền hiện tại của từng Dashboard Item</li>
							<li>Click "Cài đặt quyền" để thay đổi quyền cho item đó</li>
							<li>Modal sẽ mở ra cho phép chọn UserClass mới</li>
						</ul>
					</div>
				</div>
			)}
		</Modal>
	);
};

export default AuthorizationModal; 