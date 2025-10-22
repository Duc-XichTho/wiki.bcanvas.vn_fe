import { Button, Input, Modal, Popconfirm, Tag, message } from 'antd';
import { FileTextOutlined, EditOutlined, DeleteOutlined, EditFilled } from '@ant-design/icons';
import { useState, useRef, useEffect } from 'react';
import css from './PlaceholderOptionsModal.module.css';

export default function PlaceholderOptionsModal({
	isOpen,
	onClose,
	onSavePlaceholderOptions,
	onDeletePlaceholderKey,
	onAddNewPlaceholderKey,
	onAddOption,
	onRemoveOption,
	onOpenPlaceholderOptionsModal,
	onRenamePlaceholderKey,
	currentPlaceholderKey,
	setCurrentPlaceholderKey,
	currentPlaceholderOptions,
	setCurrentPlaceholderOptions,
	newPlaceholderKey,
	setNewPlaceholderKey,
	newPlaceholderOptions,
	setNewPlaceholderOptions,
	setNewPlaceholderOptionsByKey,
	newPlaceholderOptionsByKey,
	placeholderOptions,
}) {
	const [renamingKey, setRenamingKey] = useState(null);
	const [newKeyName, setNewKeyName] = useState('');
	const keysListRef = useRef(null);
	const activeKeyRef = useRef(null);
	const [scrollPosition, setScrollPosition] = useState(0);
	const [pendingRename, setPendingRename] = useState(null);
	const [originalKeysOrder, setOriginalKeysOrder] = useState([]);

	// Lưu thứ tự keys ban đầu khi component mount hoặc khi placeholderOptions thay đổi
	useEffect(() => {
		if (originalKeysOrder.length === 0) {
			// Lần đầu tiên, lưu thứ tự ban đầu
			const keys = [];
			for (const key in placeholderOptions) {
				if (placeholderOptions[key] && Array.isArray(placeholderOptions[key])) {
					keys.push(key);
				}
			}
			setOriginalKeysOrder(keys);
		} else {
			// Cập nhật thứ tự khi có key mới được thêm
			const currentKeys = [];
			for (const key in placeholderOptions) {
				if (placeholderOptions[key] && Array.isArray(placeholderOptions[key])) {
					currentKeys.push(key);
				}
			}
			
			// Thêm keys mới vào cuối nếu chưa có
			const newKeys = currentKeys.filter(key => !originalKeysOrder.includes(key));
			if (newKeys.length > 0) {
				setOriginalKeysOrder([...originalKeysOrder, ...newKeys]);
			}
		}
	}, [placeholderOptions]);

	// Sử dụng thứ tự đã lưu thay vì Object.keys()
	const getKeysInOrder = () => {
		// Sử dụng thứ tự ban đầu đã lưu
		let keys = [...originalKeysOrder];
		
		// Nếu có pending rename, thay thế key cũ bằng key mới ở cùng vị trí
		if (pendingRename) {
			const index = keys.indexOf(pendingRename.oldKey);
			if (index !== -1) {
				keys[index] = pendingRename.newKey;
			}
		}
		
		// Chỉ trả về những key có data
		return keys.filter(key => placeholderOptions?.[key] && Array.isArray(placeholderOptions?.[key]));
	};

	const keysArray = getKeysInOrder();

	// Lưu scroll position khi scroll
	const handleScroll = () => {
		if (keysListRef.current) {
			setScrollPosition(keysListRef.current.scrollTop);
		}
	};

	// Đảm bảo active key luôn visible sau khi update
	useEffect(() => {
		if (activeKeyRef.current && keysListRef.current) {
			const container = keysListRef.current;
			const activeElement = activeKeyRef.current;
			
			const containerRect = container.getBoundingClientRect();
			const elementRect = activeElement.getBoundingClientRect();
			
			// Kiểm tra xem element có trong viewport không
			if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
				activeElement.scrollIntoView({ 
					behavior: 'smooth', 
					block: 'nearest' 
				});
			}
		}
	}, [currentPlaceholderKey, keysArray.length]);

	const handleRenameKey = (oldKey) => {
		setRenamingKey(oldKey);
		setNewKeyName(oldKey);
	};

	const handleSaveRename = async () => {
		if (!newKeyName.trim()) {
			message.error('Vui lòng nhập tên key mới');
			return;
		}

		if (newKeyName === renamingKey) {
			setRenamingKey(null);
			setNewKeyName('');
			setPendingRename(null);
			return;
		}

		if (placeholderOptions[newKeyName]) {
			message.error('Tên key đã tồn tại');
			return;
		}

		try {
			// Đặt pending rename để giữ key trong danh sách
			setPendingRename({ oldKey: renamingKey, newKey: newKeyName });
			
			// Cập nhật thứ tự keys trong originalKeysOrder
			const newOrder = originalKeysOrder.map(key => key === renamingKey ? newKeyName : key);
			setOriginalKeysOrder(newOrder);
			
			await onRenamePlaceholderKey(renamingKey, newKeyName);
			
			// Xóa pending rename sau khi thành công
			setPendingRename(null);
			setRenamingKey(null);
			setNewKeyName('');
		} catch (error) {
			console.error('Error renaming key:', error);
			// Nếu lỗi, khôi phục lại thứ tự cũ và xóa pending rename
			setPendingRename(null);
		}
	};

	const handleCancelRename = () => {
		setRenamingKey(null);
		setNewKeyName('');
		setPendingRename(null);
	};

	const handleDeleteKey = (keyToDelete) => {
		// Cập nhật thứ tự keys khi xóa
		const newOrder = originalKeysOrder.filter(key => key !== keyToDelete);
		setOriginalKeysOrder(newOrder);
		onDeletePlaceholderKey(keyToDelete);
	};

	const handleAddNewKey = () => {
		// Thêm key mới vào cuối danh sách
		if (newPlaceholderKey.trim()) {
			const newKey = newPlaceholderKey.trim();
			// Thêm vào originalKeysOrder nếu chưa có
			if (!originalKeysOrder.includes(newKey)) {
				setOriginalKeysOrder([...originalKeysOrder, newKey]);
			}
		}
		onAddNewPlaceholderKey();
	};

	const handleKeyClick = (key) => {
		// Reset form khi chọn key khác
		setNewPlaceholderKey('');
		setNewPlaceholderOptions('');
		onOpenPlaceholderOptionsModal(key);
	};

	return (
		<Modal
			title={
				<div className={css.modalTitle}>
					<span>⚙️ Quản lý Placeholder Options</span>
				</div>
			}
			open={isOpen}
			onCancel={onClose}
			footer={[
				<Button key='cancel' onClick={onClose}>
					Đóng
				</Button>,
				<Button key='save' type='primary' onClick={onSavePlaceholderOptions}>
					Lưu thay đổi
				</Button>,
			]}
			width={1200}
		>
			<div className={css.modalContent}>
				{/* Header Section - Add New Key */}
				<div className={css.headerSection}>
					<h4 className={css.headerTitle}>Thêm Placeholder Key mới</h4>
					<div className={css.addNewForm}>
						<div className={css.keyInputGroup}>
							<Input
								placeholder='Nhập tên placeholder (ví dụ: THÁNG, QUÝ, NĂM)'
								value={newPlaceholderKey}
								onChange={(e) => setNewPlaceholderKey(e.target.value)}
								className={css.keyInput}
							/>
							<Input.TextArea
								placeholder='Nhập các options (mỗi option một dòng)&#10;Ví dụ:&#10;Tháng 1&#10;Tháng 2&#10;Tháng 3'
								value={newPlaceholderOptions}
								onChange={(e) => setNewPlaceholderOptions(e.target.value)}
								autoSize={{ minRows: 3, maxRows: 4 }}
								className={css.optionsTextarea}
							/>
							<div className={css.formHint}>
								💡 Tạo key để định nghĩa các tùy chọn cho template. Ví dụ: key "THÁNG" sẽ tạo dropdown với các tháng.
							</div>
						</div>
						<Button 
							onClick={handleAddNewKey} 
							type='primary'
							className={css.addButton}
						>
							Thêm Key
						</Button>
					</div>
				</div>

				{/* Main Content - Two Column Layout */}
				<div className={css.mainContent}>
					{/* Left Panel - Keys List */}
					<div className={css.leftPanel}>
						<div className={css.panelTitle}>
							📋 Danh sách Placeholder Keys ({keysArray.length})
						</div>
						<div className={css.keysListSection}>
							<div className={css.keysList} ref={keysListRef} onScroll={handleScroll}>
								{keysArray.map(key => {
									// Xác định key thực tế để hiển thị
									const actualKey = key; // key từ getKeysInOrder đã được xử lý
									const isPendingRename = pendingRename?.newKey === key;
									const isRenaming = renamingKey === key;
									
									return (
										<div
											key={`key-${actualKey}`}
											ref={currentPlaceholderKey === actualKey ? activeKeyRef : null}
											className={`${css.keyItem} ${currentPlaceholderKey === actualKey ? css.activeKey : ''}`}
											onClick={() => handleKeyClick(actualKey)}
										>
											<div className={css.keyInfo}>
												{isRenaming ? (
													<div className={css.keyName}>
														<Input
															value={newKeyName}
															onChange={(e) => setNewKeyName(e.target.value)}
															className={css.renameInput}
															onPressEnter={handleSaveRename}
															onBlur={handleSaveRename}
															autoFocus
														/>
													</div>
												) : (
													<div className={css.keyName}>
														<code>{actualKey}</code>
														{isPendingRename && (
															<span style={{ 
																marginLeft: '8px', 
																fontSize: '11px', 
																color: '#52c41a',
																fontStyle: 'italic'
															}}>
																(đang cập nhật...)
															</span>
														)}
													</div>
												)}
												<div className={css.keySummary}>
													{placeholderOptions[actualKey]?.length || 0} options: {placeholderOptions[actualKey]?.slice(0, 3).join(', ') || ''}
													{placeholderOptions[actualKey]?.length > 3 && '...'}
												</div>
											</div>
											<div className={css.keyActions}>
												{isRenaming ? (
													<div className={css.keyActionsSave}>
														<Button
															size='small'
															onClick={handleSaveRename}
														>
															Lưu
														</Button>
														<Button
															size='small'
															onClick={handleCancelRename}
														>
															Hủy
														</Button>
													</div>
												) : (
													<>
														<Button
															size='small'
															icon={<EditFilled />}
															onClick={(e) => {
																e.stopPropagation();
																handleRenameKey(actualKey);
															}}
															disabled={isPendingRename}
														>
															Đổi tên
														</Button>
														<Popconfirm
															title='Xóa placeholder key'
															description='Bạn có chắc chắn muốn xóa placeholder key này?'
															onConfirm={(e) => {
																e?.stopPropagation();
																handleDeleteKey(actualKey);
															}}
															okText='Có'
															cancelText='Không'
														>
															<Button 
																size='small' 
																danger
																icon={<DeleteOutlined />}
																onClick={(e) => e.stopPropagation()}
																disabled={isPendingRename}
															>
																Xóa
															</Button>
														</Popconfirm>
													</>
												)}
											</div>
										</div>
									);
								})}
								{keysArray.length === 0 && (
									<div className={css.emptyKeysList}>
										<p>Chưa có placeholder key nào</p>
										<p style={{ fontSize: '12px', color: '#999' }}>
											Hãy thêm placeholder key đầu tiên ở trên
										</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Right Panel - Edit Section */}
					<div className={css.rightPanel}>
						{currentPlaceholderKey ? (
							<div className={css.editSection}>
								<div className={css.editHeader}>
									<h4 className={css.editTitle}>
										✏️ Chỉnh sửa: <code>{currentPlaceholderKey}</code>
									</h4>
								</div>
								
								<div className={css.currentOptionsSection}>
									<h5 style={{ marginBottom: '12px', color: '#666', fontSize: '13px', fontWeight: '500' }}>
										Options hiện tại ({currentPlaceholderOptions.length}):
									</h5>
									<div className={css.optionsList}>
										{currentPlaceholderOptions.map((option, index) => (
											<Tag
												key={index}
												closable
												onClose={() => onRemoveOption(index)}
												color='blue'
												className={css.optionTag}
											>
												{option}
											</Tag>
										))}
										{currentPlaceholderOptions.length === 0 && (
											<span className={css.emptyOptions}>
												Chưa có options nào
											</span>
										)}
									</div>

									<div className={css.addOptionsSection}>
										<h5 style={{ marginBottom: '8px', color: '#666', fontSize: '13px', fontWeight: '500' }}>
											Thêm options mới:
										</h5>
										<div className={css.addOptionsForm}>
											<Input.TextArea
												placeholder='Nhập options mới (mỗi option một dòng)'
												value={newPlaceholderOptionsByKey}
												onChange={(e) => setNewPlaceholderOptionsByKey(e.target.value)}
												autoSize
												className={css.addOptionsTextarea}
											/>
											<Button 
												onClick={onAddOption} 
												type='primary'
												className={css.addOptionsButton}
											>
												Thêm
											</Button>
										</div>
									</div>
								</div>
							</div>
						) : (
							<div className={css.editSection}>
								<div className={css.editHeader}>
									<h4 className={css.editTitle}>Chọn key để chỉnh sửa</h4>
								</div>
								<div className={css.currentOptionsSection}>
									<div style={{ 
										textAlign: 'center', 
										padding: '40px 20px', 
										color: '#999',
										fontStyle: 'italic'
									}}>
										<p>Chọn một placeholder key từ danh sách bên trái</p>
										<p style={{ fontSize: '12px', marginTop: '8px' }}>
											để xem và chỉnh sửa các options
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Usage Guide */}
				{/*<div className={css.usageGuide}>*/}
				{/*	<h5 className={css.guideTitle}>💡 Hướng dẫn sử dụng:</h5>*/}
				{/*	<ul className={css.guideList}>*/}
				{/*		<li>Tạo placeholder key để định nghĩa các options cho template</li>*/}
				{/*		<li>Ví dụ: Tạo key <code>THÁNG</code> với options: Tháng 1, Tháng 2, ..., Tháng 12</li>*/}
				{/*		<li>Trong template, sử dụng <code>[THÁNG]</code> để tạo dropdown với các options này</li>*/}
				{/*		<li>Người dùng sẽ chọn từ dropdown thay vì nhập text</li>*/}
				{/*	</ul>*/}
				{/*</div>*/}
			</div>
		</Modal>
	);
} 