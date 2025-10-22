import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Space, Typography, message } from 'antd';
import { getSettingByType, createSetting, updateSetting } from '../../../../apis/settingService.jsx';

const { Text } = Typography;

const TagSettingsModal = ({ 
	open, 
	onCancel, 
	onSave, 
	businessTags = [], 
	storeTags = [] 
}) => {
	const [editingBusinessTags, setEditingBusinessTags] = useState('');
	const [editingStoreTags, setEditingStoreTags] = useState('');
	const [loading, setLoading] = useState(false);

	// Initialize editing values when modal opens
	useEffect(() => {
		if (open) {
			// Remove 'All' from display as it will be auto-added
			const businessTagsForEdit = businessTags.filter(tag => tag !== 'All').join(', ');
			const storeTagsForEdit = storeTags.filter(tag => tag !== 'All').join(', ');
			setEditingBusinessTags(businessTagsForEdit);
			setEditingStoreTags(storeTagsForEdit);
		}
	}, [open, businessTags, storeTags]);

	const handleSave = async () => {
		setLoading(true);
		try {
			const businessTagsArray = editingBusinessTags.split(',').map(tag => tag.trim()).filter(tag => tag);
			const storeTagsArray = editingStoreTags.split(',').map(tag => tag.trim()).filter(tag => tag);

			// Ensure 'All' tag is always first
			if (!businessTagsArray.includes('All')) {
				businessTagsArray.unshift('All');
			}
			if (!storeTagsArray.includes('All')) {
				storeTagsArray.unshift('All');
			}

			// Save business tags
			const existingBusinessTags = await getSettingByType('BUSINESS_TAGS');
			if (existingBusinessTags && existingBusinessTags.id) {
				await updateSetting({
					...existingBusinessTags,
					setting: businessTagsArray,
				});
			} else {
				await createSetting({
					type: 'BUSINESS_TAGS',
					setting: businessTagsArray,
				});
			}

			// Save store tags
			const existingStoreTags = await getSettingByType('STORE_TAGS');
			if (existingStoreTags && existingStoreTags.id) {
				await updateSetting({
					...existingStoreTags,
					setting: storeTagsArray,
				});
			} else {
				await createSetting({
					type: 'STORE_TAGS',
					setting: storeTagsArray,
				});
			}

			message.success('Đã lưu tags thành công!');
			onSave(businessTagsArray, storeTagsArray);
		} catch (error) {
			console.error('Error saving tags:', error);
			message.error('Lỗi khi lưu tags!');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			title="Cài đặt Tags"
			open={open}
			onCancel={onCancel}
			footer={[
				<Button key="cancel" onClick={onCancel}>
					Hủy
				</Button>,
				<Button key="save" type="primary" onClick={handleSave} loading={loading}>
					Lưu
				</Button>,
			]}
			width={600}
		>
			<Space direction="vertical" style={{ width: '100%' }} size="large">
				<div>
					<Text strong>Function Tags</Text>
					<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
						Nhập các tags phân cách bằng dấu phẩy
					</Text>
					<Input.TextArea
						value={editingBusinessTags}
						onChange={(e) => setEditingBusinessTags(e.target.value)}
						placeholder="Ví dụ: All, Revenue, Conversion, Cost, Efficiency, Quality"
						rows={3}
						style={{ marginTop: 8 }}
					/>
				</div>

				<div>
					<Text strong>Unit Tags</Text>
					<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
						Nhập các tags phân cách bằng dấu phẩy
					</Text>
					<Input.TextArea
						value={editingStoreTags}
						onChange={(e) => setEditingStoreTags(e.target.value)}
						placeholder="Ví dụ: All, Sales, Inventory, Customer, Staff, Finance"
						rows={3}
						style={{ marginTop: 8 }}
					/>
				</div>
			</Space>
		</Modal>
	);
};

export default TagSettingsModal; 