import { Modal, Input, Button, message, Popconfirm } from 'antd';
import { useState, useEffect } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { updateSetting, createSetting, getSettingByType } from '../../../../../../apis/settingService.jsx';

const FILE_TEMPLATE_SETTING_TYPE = 'FILE_LAYOUT_TEMPLATE';

export default function FileTemplateModal({ isOpen, onClose, onSelectTemplate, currentUser, onSuccess }) {
	const [templates, setTemplates] = useState([]);
	const [newTemplate, setNewTemplate] = useState({ name: '', prompt: '' });
	const [selectedTemplate, setSelectedTemplate] = useState(null);
	const [settingId, setSettingId] = useState(null);
	const [editingTemplate, setEditingTemplate] = useState(null);

	useEffect(() => {
		if (isOpen) {
			loadTemplates();
		}
	}, [isOpen]);

	const loadTemplates = async () => {
		try {
			const data = await getSettingByType(FILE_TEMPLATE_SETTING_TYPE);
			if (data) {
				setTemplates(data.setting || []);
				setSettingId(data.id);
			} else {
				setTemplates([]);
				setSettingId(null);
			}
		} catch (error) {
			console.error('Error loading templates:', error);
			message.error('Không thể tải danh sách template');
		}
	};

	const handleAddTemplate = async () => {
		if (!newTemplate.name.trim() || !newTemplate.prompt.trim()) {
			message.warning('Vui lòng nhập tên và prompt');
			return;
		}
		if (!currentUser?.isAdmin) {
			message.error('Chỉ quản trị viên mới có thể thêm template');
			return;
		}
		try {
			const newTemplateObj = {
				id: uuidv4(),
				name: newTemplate.name.trim(),
				prompt: newTemplate.prompt.trim(),
				createdAt: new Date().toISOString(),
				createdBy: currentUser.email,
			};
			const updatedTemplates = [...templates, newTemplateObj];
			if (settingId) {
				await updateSetting({
					id: settingId,
					type: FILE_TEMPLATE_SETTING_TYPE,
					setting: updatedTemplates,
				});
			} else {
				const response = await createSetting({
					type: FILE_TEMPLATE_SETTING_TYPE,
					setting: updatedTemplates,
				});
				setSettingId(response.id);
			}
			setTemplates(updatedTemplates);
			setNewTemplate({ name: '', prompt: '' });
			message.success('Đã thêm template thành công');
			onSuccess?.();
		} catch (error) {
			console.error('Error adding template:', error);
			message.error('Không thể thêm template');
		}
	};

	const handleEditTemplate = async (template) => {
		if (!currentUser?.isAdmin) {
			message.error('Chỉ quản trị viên mới có thể chỉnh sửa template');
			return;
		}
		try {
			const updatedTemplates = templates.map(t =>
				t.id === template.id ? { ...t, ...editingTemplate } : t,
			);
			await updateSetting({
				id: settingId,
				type: FILE_TEMPLATE_SETTING_TYPE,
				setting: updatedTemplates,
			});
			setTemplates(updatedTemplates);
			setEditingTemplate(null);
			message.success('Đã cập nhật template thành công');
			onSuccess?.();
		} catch (error) {
			console.error('Error updating template:', error);
			message.error('Không thể cập nhật template');
		}
	};

	const handleDeleteTemplate = async (templateId) => {
		if (!currentUser?.isAdmin) {
			message.error('Chỉ quản trị viên mới có thể xóa template');
			return;
		}
		try {
			const updatedTemplates = templates.filter(t => t.id !== templateId);
			await updateSetting({
				id: settingId,
				type: FILE_TEMPLATE_SETTING_TYPE,
				setting: updatedTemplates,
			});
			setTemplates(updatedTemplates);
			if (selectedTemplate?.id === templateId) {
				setSelectedTemplate(null);
			}
			message.success('Đã xóa template thành công');
			onSuccess?.();
		} catch (error) {
			console.error('Error deleting template:', error);
			message.error('Không thể xóa template');
		}
	};

	const handleSelectTemplate = (template) => {
		setSelectedTemplate(template.id === selectedTemplate?.id ? null : template);
	};

	const handleApplyTemplate = () => {
		if (selectedTemplate) {
			onSelectTemplate(selectedTemplate.prompt);
			onClose();
		}
	};

	return (
		<Modal
			title="Template cho File"
			open={isOpen}
			onCancel={onClose}
			footer={null}
			width={'80vw'}
		>
			<div style={{ display: 'flex', gap: 24, minHeight: 400 }}>
				<div style={{ flex: 1, overflowY: 'auto', padding: 8, border: '1px solid #e9ecef', borderRadius: 8 }}>
					<div style={{ fontWeight: 500, fontSize: 16, marginBottom: 12 }}>Danh sách template</div>
					{templates.map(template => (
						<div
							key={template.id}
							style={{
								border: selectedTemplate?.id === template.id ? '1.5px solid #1677ff' : '1px solid #e5e7eb',
								background: selectedTemplate?.id === template.id ? '#e6f4ff' : '#fff',
								borderRadius: 6,
								padding: 12,
								marginBottom: 10,
								cursor: 'pointer',
								transition: 'all 0.2s',
							}}
							onClick={() => handleSelectTemplate(template)}
						>
							<div style={{ fontWeight: 600, fontSize: 15 }}>{editingTemplate?.id === template.id ? (
								<Input
									value={editingTemplate.name}
									onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
									style={{ marginBottom: 6 }}
									onClick={e => e.stopPropagation()}
								/>
							) : template.name}</div>
							<div style={{ color: '#444', margin: '6px 0' }}>
								{editingTemplate?.id === template.id ? (
									<Input.TextArea
										value={editingTemplate.prompt}
										onChange={e => setEditingTemplate({
											...editingTemplate,
											prompt: e.target.value,
										})}
										autoSize={{ minRows: 2 }}
										onClick={e => e.stopPropagation()}
									/>
								) : template.prompt}
							</div>
							<div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
								Thêm
								bởi {template.createdBy} vào {new Date(template.createdAt).toLocaleDateString('vi-VN')}
							</div>
							{currentUser?.isAdmin && (
								<div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
									{editingTemplate?.id === template.id ? (
										<>
											<Button size="small" type="primary"
													onClick={() => handleEditTemplate(template)}>Lưu</Button>
											<Button size="small" onClick={() => setEditingTemplate(null)}>Hủy</Button>
										</>
									) : (
										<>
											<Button
												type="text"
												icon={<EditOutlined />}
												onClick={() => setEditingTemplate(template)}
											/>
											<Popconfirm
												title="Xóa template"
												description="Bạn có chắc chắn muốn xóa template này?"
												onConfirm={() => handleDeleteTemplate(template.id)}
												okText="Có"
												cancelText="Không"
											>
												<Button
													type="text"
													icon={<DeleteOutlined />}
												/>
											</Popconfirm>
										</>
									)}
								</div>
							)}
						</div>
					))}
				</div>
				{currentUser?.isAdmin && (
					<div style={{ flex: 1, padding: 8, border: '1px solid #e9ecef', borderRadius: 8 }}>
						<div style={{ fontWeight: 500, fontSize: 16, marginBottom: 12 }}>Thêm template mới</div>
						<Input
							value={newTemplate.name}
							onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
							placeholder="Tên template"
							style={{ marginBottom: 8 }}
						/>
						<Input.TextArea
							value={newTemplate.prompt}
							onChange={e => setNewTemplate({ ...newTemplate, prompt: e.target.value })}
							placeholder="Prompt cho template..."
							autoSize={{ minRows: 4 }}
							style={{ marginBottom: 8 }}
						/>
						<Button
							type="primary"
							icon={<PlusOutlined />}
							onClick={handleAddTemplate}
						>
							Thêm template
						</Button>
					</div>
				)}
			</div>
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
				<Button onClick={onClose}>Đóng</Button>
				<Button type="primary" onClick={handleApplyTemplate} disabled={!selectedTemplate}>Áp dụng</Button>
			</div>
		</Modal>
	);
}
