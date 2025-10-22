import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Tabs, message } from 'antd';
import { MODEL_AI_LIST } from '../../../CONST.js';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

export default function ConfigTemplateModal({ 
	visible, 
	onCancel, 
	onSave, 
	templateConfigs = {},
	configType = 'image',
	setConfigType 
}) {
	const [imageForm] = Form.useForm();
	const [htmlForm] = Form.useForm();
	// const [excalidrawForm] = Form.useForm(); // Tạm thời tắt
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (visible && templateConfigs[configType]) {
			if (configType === 'image') {
				imageForm.setFieldsValue(templateConfigs[configType]);
			} else if (configType === 'html') {
				htmlForm.setFieldsValue(templateConfigs[configType]);
			}
			// } else if (configType === 'excalidraw') {
			// 	excalidrawForm.setFieldsValue(templateConfigs[configType]);
			// }
		}
	}, [visible, configType, templateConfigs, imageForm, htmlForm]);

	const handleSubmit = async () => {
		try {
			let values;
			if (configType === 'image') {
				values = await imageForm.validateFields();
			} else if (configType === 'html') {
				values = await htmlForm.validateFields();
			}
			// } else if (configType === 'excalidraw') {
			// 	values = await excalidrawForm.validateFields();
			// }
			setLoading(true);
			await onSave(values, configType);
		} catch (error) {
			console.error('Validation failed:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		imageForm.resetFields();
		htmlForm.resetFields();
		// excalidrawForm.resetFields(); // Tạm thời tắt
		onCancel();
	};

	const handleTabChange = (key) => {
		setConfigType(key);
		// Reset tất cả forms
		imageForm.resetFields();
		htmlForm.resetFields();
		// excalidrawForm.resetFields(); // Tạm thời tắt
		// Set values cho tab mới với delay để đảm bảo form đã reset
		setTimeout(() => {
			if (templateConfigs[key]) {
				if (key === 'image') {
					imageForm.setFieldsValue(templateConfigs[key]);
				} else if (key === 'html') {
					htmlForm.setFieldsValue(templateConfigs[key]);
				}
				// } else if (key === 'excalidraw') {
				// 	excalidrawForm.setFieldsValue(templateConfigs[key]);
				// }
			}
		}, 100);
	};

	return (
		<Modal
			title="Cấu hình Template"
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
					Lưu Cấu hình
				</Button>
			]}
			width={700}
		>
			<Tabs activeKey={configType} onChange={handleTabChange}>
				<TabPane tab="🎨 Image Template" key="image">
					<Form
						form={imageForm}
						layout="vertical"
						initialValues={{
							systemMessage: '',
							imageModel: 'gpt-3.5-turbo',
							captionSystemMessage: '',
							captionModel: 'gpt-3.5-turbo'
						}}
					>
						{/* AI Tạo Ảnh */}
						<div style={{ marginBottom: 24, padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
							<h4 style={{ margin: '0 0 16px 0', color: '#495057' }}>🖼️ AI Tạo Ảnh</h4>
							
							<Form.Item
								name="systemMessage"
								label="System Message (Tạo Ảnh)"
								rules={[{ required: true, message: 'Vui lòng nhập system message cho AI tạo ảnh!' }]}
							>
								<TextArea
									rows={3}
									placeholder="Nhập system message cho AI tạo ảnh..."
								/>
							</Form.Item>

							<Form.Item
								name="imageModel"
								label="Model (Tạo Ảnh)"
								rules={[{ required: true, message: 'Vui lòng chọn model cho AI tạo ảnh!' }]}
							>
								<Select placeholder="Chọn model AI tạo ảnh">
									{MODEL_AI_LIST.map(model => (
										<Option key={model.value} value={model.value}>
											{model.label}
										</Option>
									))}
								</Select>
							</Form.Item>
						</div>

						{/* AI Tạo Chú Thích */}
						<div style={{ padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
							<h4 style={{ margin: '0 0 16px 0', color: '#495057' }}>📝 AI Tạo Chú Thích</h4>
							
							<Form.Item
								name="captionSystemMessage"
								label="System Message (Tạo Chú Thích)"
								rules={[{ required: true, message: 'Vui lòng nhập system message cho AI tạo chú thích!' }]}
							>
								<TextArea
									rows={3}
									placeholder="Nhập system message cho AI tạo chú thích..."
								/>
							</Form.Item>

							<Form.Item
								name="captionModel"
								label="Model (Tạo Chú Thích)"
								rules={[{ required: true, message: 'Vui lòng chọn model cho AI tạo chú thích!' }]}
							>
								<Select placeholder="Chọn model AI tạo chú thích">
									{MODEL_AI_LIST.map(model => (
										<Option key={model.value} value={model.value}>
											{model.label}
										</Option>
									))}
								</Select>
							</Form.Item>
						</div>
					</Form>
				</TabPane>

				<TabPane tab="🌐 HTML Template" key="html">
					<Form
						form={htmlForm}
						layout="vertical"
						initialValues={{
							systemMessage: '',
							model: 'gpt-3.5-turbo',
							description: ''
						}}
					>
						<Form.Item
							name="systemMessage"
							label="System Message"
							rules={[{ required: true, message: 'Vui lòng nhập system message!' }]}
						>
							<TextArea
								rows={4}
								placeholder="Nhập system message cho HTML Generator..."
							/>
						</Form.Item>

						<Form.Item
							name="model"
							label="Model"
							rules={[{ required: true, message: 'Vui lòng chọn model!' }]}
						>
							<Select placeholder="Chọn model AI">
								{MODEL_AI_LIST.map(model => (
									<Option key={model.value} value={model.value}>
										{model.label}
									</Option>
								))}
							</Select>
						</Form.Item>

				
					</Form>
				</TabPane>

				{/* Tạm thời tắt tab Excalidraw */}
				{/* <TabPane tab="🎨 Excalidraw Template" key="excalidraw">
					<Form
						form={excalidrawForm}
						layout="vertical"
						initialValues={{
							systemMessage: '',
							model: '',
							reviewModel: '',
							reviewSystemMessage: '' ,
						}}
					>
						{/* AI1 - Tạo dữ liệu Excalidraw */}
						{/* <div style={{ marginBottom: 24, padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
							<h4 style={{ margin: '0 0 16px 0', color: '#495057' }}>🤖 AI1 - Tạo dữ liệu Excalidraw</h4>
							
							<Form.Item
								name="systemMessage"
								label="System Message (AI1 - Tạo dữ liệu)"
								rules={[{ required: true, message: 'Vui lòng nhập system message cho AI1!' }]}
							>
								<TextArea
									rows={3}
									placeholder="Nhập system message cho AI1 tạo dữ liệu Excalidraw..."
								/>
							</Form.Item>

							<Form.Item
								name="model"
								label="Model (AI1 - Tạo dữ liệu)"
								rules={[{ required: true, message: 'Vui lòng chọn model cho AI1!' }]}
							>
								<Select placeholder="Chọn model AI1">
									{MODEL_AI_LIST.map(model => (
										<Option key={model.value} value={model.value}>
											{model.label}
										</Option>
									))}
								</Select>
							</Form.Item>
						</div>

						{/* AI2 - Review syntax */}
						{/* <div style={{ padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
							<h4 style={{ margin: '0 0 16px 0', color: '#495057' }}>🔍 AI2 - Review Syntax</h4>
							
							<Form.Item
								name="reviewSystemMessage"
								label="System Message (AI2 - Review syntax)"
								rules={[{ required: true, message: 'Vui lòng nhập system message cho AI2!' }]}
							>
								<TextArea
									rows={3}
									placeholder="Nhập system message cho AI2 review syntax..."
								/>
							</Form.Item>

							<Form.Item
								name="reviewModel"
								label="Model (AI2 - Review syntax)"
								rules={[{ required: true, message: 'Vui lòng chọn model cho AI2!' }]}
							>
								<Select placeholder="Chọn model AI2">
									{MODEL_AI_LIST.map(model => (
										<Option key={model.value} value={model.value}>
											{model.label}
										</Option>
									))}
								</Select>
							</Form.Item>
						</div>
					</Form>
				</TabPane> */}
			</Tabs>
		</Modal>
	);
}
