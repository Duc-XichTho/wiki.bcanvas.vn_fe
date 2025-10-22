import React from 'react';
import { Modal, Form, Input, Checkbox } from 'antd';

export default function CreateWebPage({ open, onClose, onCreate }) {
	const [form] = Form.useForm();

	const handleOk = () => {
		form
			.validateFields()
			.then((values) => {
				onCreate(values);
				form.resetFields();
				onClose();
			})
			.catch((info) => {
				console.log('Validate Failed:', info);
			});
	};

	const handleCancel = () => {
		form.resetFields();
		onClose();
	};

	return (
		<Modal
			title="Tạo Web Page mới"
			open={open}
			onOk={handleOk}
			onCancel={handleCancel}
			okText="Tạo"
			cancelText="Hủy"
		>
			<Form form={form} layout="vertical">
				<Form.Item
					label="Tên Web Page"
					name="name"
					rules={[{ required: true, message: 'Vui lòng nhập tên trang!' }]}
				>
					<Input placeholder="Nhập tên trang" />
				</Form.Item>

				<Form.Item
					label="Tiêu đề Header"
					name="headerTitle"
					rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
				>
					<Input placeholder="Nhập tiêu đề trang" />
				</Form.Item>

				<Form.Item
					label="Quyền quản lý"
					name="editor"
					rules={[{ required: true, message: 'Chọn ít nhất một quyền quản lý!' }]}
				>
					<Checkbox.Group>
						<Checkbox value="Usergroup A">Usergroup A</Checkbox>
						<Checkbox value="Usergroup B">Usergroup B</Checkbox>
						<Checkbox value="Admin">Admin</Checkbox>
					</Checkbox.Group>
				</Form.Item>

				<Form.Item
					label="Mật khẩu"
					name="password"
					rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
				>
					<Input.Password placeholder="Nhập mật khẩu" />
				</Form.Item>
			</Form>
		</Modal>
	);
}
