import { Modal, Form, Input } from 'antd';
import { useEffect } from 'react';

export default function CreateStoryWebPage({ open, onClose, onCreate }) {
	const [form] = Form.useForm();

	// Reset form mỗi lần mở
	useEffect(() => {
		if (open) {
			form.resetFields();
		}
	}, [open]);

	const handleOk = () => {
		form.validateFields()
			.then(values => {
				onCreate(values); // Truyền dữ liệu ra ngoài
				onClose();        // Đóng modal
			})
			.catch(info => {
				console.log('Validate Failed:', info);
			});
	};

	return (
		<Modal
			open={open}
			title="Tạo Story mới"
			onCancel={onClose}
			onOk={handleOk}
			okText="Tạo"
			cancelText="Hủy"
		>
			<Form form={form} layout="vertical">
				<Form.Item
					label="Tên Story"
					name="title"
					rules={[{ required: true, message: 'Vui lòng nhập tên story!' }]}
				>
					<Input placeholder="Nhập tên story" />
				</Form.Item>
			</Form>
		</Modal>
	);
}
