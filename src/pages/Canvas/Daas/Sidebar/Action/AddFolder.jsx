import { Input, message, Modal, Switch, Tooltip } from 'antd';
import css from '../SidebarNew.module.css';
import {
	ArrowDownOutlined,
	ArrowUpOutlined,
	DeleteOutlined,
	EditOutlined,
	EyeInvisibleOutlined,
	EyeOutlined,
	FolderOutlined,
	FolderOpenOutlined
} from '@ant-design/icons';
import React, { useState } from 'react';
import { deleteFileTab, updateFileTab } from '../../../../../apis/fileTabService.jsx';

export default function AddFolder({
									  isModalFolderVisible,
									  setIsModalFolderVisible,
									  handleCreateFolder,
									  setNewFolderData,
									  newFolderData,
									  tabs,
									  editTabName,
									  editTabId,
									  setEditTabName,
									  updateTabName,
									  swapPosition,
									  setEditTabId,
									  loadFileTab,
									  table,
									  swapFileNotePosition,
								  }) {
	const [expandedTabIds, setExpandedTabIds] = useState([]);

	const toggleExpand = (tabId) => {
		setExpandedTabIds((prev) =>
			prev.includes(tabId) ? prev.filter((id) => id !== tabId) : [...prev, tabId]
		);
	};

	const checkDisabled = !newFolderData.label;
	const okButtonStyle = checkDisabled
		? {}
		: {
			backgroundColor: '#2d9d5b',
			color: 'white',
			border: 'none',
		};

	return (
		<Modal
			width={800}
			title='Tạo mới thư mục'
			open={isModalFolderVisible}
			onOk={handleCreateFolder}
			onCancel={() => {
				setIsModalFolderVisible(false);
				setNewFolderData({ label: '' });
			}}
			okText='Tạo'
			cancelText='Hủy'
			bodyStyle={{ height: '60vh', overflowY: 'auto' }}
			okButtonProps={{
				disabled: checkDisabled,
				style: okButtonStyle,
			}}
		>
			<div className={css.modalContent}>
				<div className={css.labelCreate}>
					<Input
						placeholder='Nhập label'
						value={newFolderData.label}
						onChange={(e) =>
							setNewFolderData((prev) => ({ ...prev, label: e.target.value }))
						}
						onPressEnter={handleCreateFolder}
						style={{ marginBottom: 10 }}
					/>
				</div>

				<h4>Danh sách thư mục hiện tại:</h4>
				<div className={css.listTab}>
					<div className={css.listTabContainer}>
						{tabs
							.filter((tab) => tab.key !== 'tapFavorite')
							.sort((a, b) =>
								((table ? a.position : a.position) || 0) -
								((table ? b.position2 : b.position) || 0)
							)
							.map((tab, index, array) => (
								<div key={tab.key} style={{ marginBottom: 17 }}>
									{/* TAB Header */}
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											padding: '12px',
											backgroundColor: '#f9f9f9',
											borderRadius: '8px',
											boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
											gap: 8,
										}}
									>
										<Tooltip title='Mở rộng'>
											<span onClick={() => toggleExpand(tab.id)} style={{ cursor: 'pointer' }}>
												{expandedTabIds.includes(tab.id) ? <FolderOpenOutlined/> : <FolderOutlined/>}
											</span>
										</Tooltip>

										<div style={{ flex: 1 }}>
											{editTabId === tab.id ? (
												<Input
													value={editTabName}
													onChange={(e) => setEditTabName(e.target.value)}
													onPressEnter={async () => await updateTabName(tab.id, editTabName)}
													onBlur={async () => await updateTabName(tab.id, editTabName)}
													autoFocus
												/>
											) : (
												<span style={{ fontWeight: 500 }}>{tab.label}</span>
											)}
										</div>

										<div style={{ display: 'flex', gap: 10 }}>
											<Tooltip title='Lên'>
												<ArrowUpOutlined
													onClick={() => swapPosition(tab, array[index - 1])}
													style={{
														color: index === 0 ? '#ccc' : '#1890ff',
														cursor: index === 0 ? 'not-allowed' : 'pointer',
													}}
												/>
											</Tooltip>
											<Tooltip title='Xuống'>
												<ArrowDownOutlined
													onClick={() => swapPosition(tab, array[index + 1])}
													style={{
														color: index === array.length - 1 ? '#ccc' : '#1890ff',
														cursor: index === array.length - 1 ? 'not-allowed' : 'pointer',
													}}
												/>
											</Tooltip>

											<Tooltip title='Sửa'>
												<EditOutlined
													onClick={() => {
														setEditTabId(tab.id);
														setEditTabName(tab.label);
													}}
													style={{ color: '#52c41a', cursor: 'pointer' }}
												/>
											</Tooltip>

											<Tooltip title={(table ? tab.hide2 : tab.hide) ? 'Hiện' : 'Ẩn'}>
												<Switch
													checked={table ? !tab.hide2 : !tab.hide}
													onChange={async (checked) => {
														try {
															await updateFileTab({
																...tab,
																...(table ? { hide2: !checked } : { hide: !checked }),
															});
															message.success(checked ? 'Hiện thành công' : 'Ẩn thành công');
															await loadFileTab();
														} catch (error) {
															console.error('Error toggle tab visibility:', error);
															message.error('Có lỗi xảy ra');
														}
													}}
													checkedChildren={<EyeOutlined />}
													unCheckedChildren={<EyeInvisibleOutlined />}
													style={{
														background: (table ? tab.hide2 : tab.hide)
															? '#df515a'
															: '#259c63',
													}}
												/>
											</Tooltip>

											<Tooltip title='Xóa'>
												<DeleteOutlined
													onClick={async () => {
														try {
															table
																? await updateFileTab({ ...tab, show2: false })
																: await deleteFileTab(tab.id);
															message.success('Xóa thành công');
															await loadFileTab();
														} catch (error) {
															console.error('Error deleting tab:', error);
															message.error('Có lỗi xảy ra khi xóa');
														}
													}}
													style={{ color: '#f5222d', cursor: 'pointer' }}
												/>
											</Tooltip>
										</div>
									</div>

									{/* FILE NOTES */}
									{expandedTabIds.includes(tab.id) && tab.listFileNote?.length > 0 && (
										<div style={{ paddingLeft: 40, paddingTop: 10 }}>
											{tab.listFileNote
												.slice()
												.sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999))
												.map((note, index, arr) => (
													<div
														key={note.id}
														style={{
															padding: '8px 12px',
															background: '#fff',
															marginBottom: 8,
															borderRadius: 6,
															boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
															display: 'flex',
															justifyContent: 'space-between',
															alignItems: 'center',
														}}
													>
														<span>{note.name}</span>
														<div style={{ display: 'flex', gap: 8 }}>
															<ArrowUpOutlined
																onClick={() => {
																	const prevNote = arr[index - 1];
																	if (prevNote) {
																		swapFileNotePosition(tab.id, note, prevNote, index, index - 1);
																	}
																}}
																style={{ marginRight: 8, cursor: index === 0 ? 'not-allowed' : 'pointer' }}
															/>
															<ArrowDownOutlined
																onClick={() => {
																	const nextNote = arr[index + 1];
																	if (nextNote) {
																		swapFileNotePosition(tab.id, note, nextNote, index, index + 1);
																	}
																}}
																style={{ cursor: index === arr.length - 1 ? 'not-allowed' : 'pointer' }}
															/>
														</div>
													</div>
												))}
										</div>
									)}
								</div>
							))}
					</div>
				</div>
			</div>
		</Modal>
	);
}
