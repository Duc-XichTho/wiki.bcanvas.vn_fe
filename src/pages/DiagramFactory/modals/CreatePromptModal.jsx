import { Button, Col, Form, Input, Modal, Row, Tag, Select, Divider } from 'antd';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MODEL_AI_LIST } from '../../../CONST.js';
import { getDiagramFactoryDataById } from '../../../apis/diagramFactoryService';
import { getSettingByType } from '../../../apis/settingService';
const { TextArea } = Input;

export default function CreatePromptModal({
	visible,
	onCancel,
	onSave,
}) {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [selectedFile, setSelectedFile] = useState(null);
	const { fileId, contentId } = useParams();
	// Danh sách các file đã tạo - Load từ API

	// Template config cho từng type - Load từ API
	const [templateConfigs, setTemplateConfigs] = useState({
		image: {
			systemMessage: "",
			model: MODEL_AI_LIST[0].value,
			description: ""
		},
		html: {
			systemMessage: "",
			model: MODEL_AI_LIST[0].value,
			description: ""
		},
		// excalidraw: {
		// 	systemMessage: "",
		// 	model: MODEL_AI_LIST[0].value,
		// 	description: "",
		// 	reviewModel: MODEL_AI_LIST[0].value,
		// 	reviewSystemMessage: ""
		// }
	});

	// Load settings và files từ API khi component mount
	useEffect(() => {
		loadSettings();
	}, []);

	useEffect(() => {
		if (fileId) {
			loadDiagramFiles(fileId);
		}
	}, [fileId]);

	const loadDiagramFiles = async (id) => {
		try {
			const response = await getDiagramFactoryDataById(parseInt(id));
			if (response) {
				setSelectedFile(response);
			}
		} catch (error) {
			console.error('Lỗi khi load diagram files:', error);
		} 
	};

	const loadSettings = async () => {
		try {
			const settings = await getSettingByType('DIAGRAM_FACTORY');
			console.log('Settings from API:', settings);
			if (settings?.setting) {
				const newConfigs = {
					image: {
						...templateConfigs.image,
						...(settings.setting.image || {})
					},
					html: {
						...templateConfigs.html,
						...(settings.setting.html || {})
					},
					// excalidraw: {
					// 	...templateConfigs.excalidraw,
					// 	...(settings.setting.excalidraw || {})
					// }
				};
				console.log('New template configs:', newConfigs);
				setTemplateConfigs(newConfigs);
			}
		} catch (error) {
			console.error('Lỗi khi load settings:', error);
		}
	};

	const currentTemplate = selectedFile ? templateConfigs[selectedFile.type] : null;

	useEffect(() => {
		if (visible) {
			form.setFieldsValue({
				prompt: '',
				systemMessage: currentTemplate?.systemMessage || '',
				model: currentTemplate?.model || '',
				type: selectedFile?.type || 'text',
				// Tạm thời tắt cấu hình AI2 cho Excalidraw
				// reviewModel: currentTemplate?.reviewModel || 'gpt-4o-mini',
				// reviewSystemMessage: currentTemplate?.reviewSystemMessage || ''
			});
		}
	}, [visible, form, currentTemplate, selectedFile]);

	// Cập nhật form khi template configs thay đổi
	useEffect(() => {
		if (visible && currentTemplate) {
			form.setFieldsValue({
				systemMessage: currentTemplate.systemMessage || '',
				model: currentTemplate.model || '',
				reviewModel: currentTemplate.reviewModel || 'gpt-4o-mini',
				reviewSystemMessage: currentTemplate.reviewSystemMessage || ''
			});
		}
	}, [templateConfigs, visible, form, currentTemplate]);


	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();
			console.log('Form values:', values);
			setLoading(true);
			await onSave(values);
		} catch (error) {
			console.error('Validation failed:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		form.resetFields();
		onCancel();
	};

	// Get current template config
	return (
		<Modal
			title="Tạo Prompt Mới"
			open={visible}
			onCancel={handleCancel}
			footer={[
				<Button key="cancel" onClick={handleCancel}>
					Hủy
				</Button>,
				<Button
					key="submit"
					type="primary"
					loading={loading}
					onClick={handleSubmit}
				>
					🚀 Tạo {selectedFile?.type === 'image' ? 'Image' : 'HTML'}
				</Button>
			]}
			width={900}
		>
			{/* Template Info */}
			{selectedFile && currentTemplate && (
				<div style={{
					background: '#f8f9fa',
					border: '1px solid #e9ecef',
					padding: '12px 16px',
					borderRadius: '6px',
					marginBottom: '16px'
				}}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<span style={{ fontSize: '1.2rem' }}>
							{selectedFile.type === 'image' ? '🎨' : '🌐'}
						</span>
						<div style={{ flex: 1 }}>
							<div style={{
								fontSize: '0.95rem',
								fontWeight: '600',
								marginBottom: '4px',
								color: '#212529'
							}}>
								{selectedFile.name}
							</div>
							<div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
								<Tag color={selectedFile.type === 'image' ? 'blue' : 'green'}>
									{selectedFile.type === 'image' ? 'Image Generator' : 'HTML Generator'}
								</Tag>
								<Tag color="purple">
									AI: {currentTemplate.model}
								</Tag>
							</div>
						</div>
					</div>
				</div>
			)}

			<Form
				form={form}
				layout="vertical"
				initialValues={{
					prompt: '',
					systemMessage: currentTemplate?.systemMessage || '',
					model: currentTemplate?.model || '',
					type: selectedFile?.type || 'text'
				}}
			>
				{/* Hidden fields để submit model và type */}
				<Form.Item name="model" style={{ display: 'none' }}>
					<Input />
				</Form.Item>
				<Form.Item name="type" style={{ display: 'none' }}>
					<Input />
				</Form.Item>

				<Row gutter={16}>
					<Col span={12}>
						<Form.Item
							name="prompt"
							label="Prompt của bạn"
							rules={[
								{ required: true, message: 'Vui lòng nhập prompt!' },
								{ min: 1, message: 'Prompt không được để trống!' }
							]}
						>
							<TextArea
								rows={14}
								placeholder="Nhập prompt của bạn..."
								style={{ fontSize: '14px' }}
							/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							name="systemMessage"
							label="System Message AI1 (Tùy chỉnh)"
							extra="Có thể chỉnh sửa system message cho AI1"
						>
							<TextArea
								rows={14}
								placeholder="Nhập system message tùy chỉnh (tùy chọn)..."
								style={{ fontSize: '14px' }}
							/>
						</Form.Item>
					</Col>
				</Row>

				{/* Tạm thời tắt cấu hình AI2 cho Excalidraw */}
				{/* {selectedFile?.type === 'excalidraw' && (
					<>
						<Divider orientation="left" style={{ margin: '16px 0' }}>
							<span style={{ color: '#1890ff', fontWeight: 'bold' }}>
								🤖 AI2 - Review Syntax
							</span>
						</Divider>
						<Row gutter={16}>
							<Col span={12}>
								<Form.Item
									name="reviewModel"
									label="Model AI2 (Review Syntax)"
									extra="Model chuyên review và sửa lỗi syntax Excalidraw"
								>
									<Select placeholder="Chọn model cho AI2">
										{MODEL_AI_LIST.map(model => (
											<Select.Option key={model.value} value={model.value}>
												{model.label}
											</Select.Option>
										))}
									</Select>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									name="reviewSystemMessage"
									label="System Message AI2 (Tùy chỉnh)"
									extra="System message cho AI2 review syntax (tùy chọn)"
								>
									<TextArea
										rows={4}
										placeholder="Nhập system message tùy chỉnh cho AI2..."
										style={{ fontSize: '14px' }}
									/>
								</Form.Item>
							</Col>
						</Row>
					</>
				)} */}
			</Form>


		</Modal>
	);
}
