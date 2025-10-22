import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';

const { Option } = Select;

export default function CreateFileModal({ visible, onCancel, onSave }) {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);
			await onSave(values);
			form.resetFields();
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

	return (
		<Modal
			title="Tạo File Mới"
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
					Tạo File
				</Button>
			]}
			width={500}
		>
			<Form
				form={form}
				layout="vertical"
				initialValues={{
					type: 'image'
				}}
			>
				<Form.Item
					name="name"
					label="Tên File"
					rules={[
						{ required: true, message: 'Vui lòng nhập tên file!' },
						{ min: 1, message: 'Tên file không được để trống!' }
					]}
				>
					<Input placeholder="Nhập tên file..." />
				</Form.Item>

				<Form.Item
					name="type"
					label="Loại"
					rules={[{ required: true, message: 'Vui lòng chọn loại!' }]}
				>
					<Select placeholder="Chọn loại file">
						<Option value="image">🎨 Tạo Image</Option>
						<Option value="html">🌐 Tạo HTML Image</Option>
						{/* <Option value="excalidraw">🎨 Tạo Excalidraw Diagram</Option> */}
					</Select>
				</Form.Item>
			</Form>
		</Modal>
	);
}
