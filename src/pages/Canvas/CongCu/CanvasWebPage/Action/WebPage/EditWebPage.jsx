import { Modal, Form, Input, Radio } from 'antd';

 export default function EditWebpage ({ openType, onClose, page })  {
	const [form] = Form.useForm();

	const handleOk = () => {
		form.validateFields().then(values => {
			console.log('Giá trị form:', values);
			onClose();
		});
	};

	const renderFormFields = () => {
		switch (openType) {
			case 'editor':
				return (
					<Form.Item name="editor" label="Chọn Editor" rules={[{ required: true }]}>
						<Radio.Group>
							<Radio value="Nguyễn Văn A">Nguyễn Văn A</Radio>
							<Radio value="Trần Thị B">Trần Thị B</Radio>
							<Radio value="Lê Văn C">Lê Văn C</Radio>
						</Radio.Group>
					</Form.Item>
				);
			case 'header':
				return (
					<Form.Item name="headerTitle" label="Header trang" rules={[{ required: true }]}>
						<Input placeholder="Nhập header mới" />
					</Form.Item>
				);
			case 'password':
				return (
					<Form.Item name="password" label="Mật khẩu mới" rules={[{ required: true }]}>
						<Input.Password placeholder="Nhập mật khẩu mới" />
					</Form.Item>
				);
			default:
				return null;
		}
	};

	return (
		<Modal
			open={!!openType}
			onCancel={onClose}
			onOk={handleOk}
			title={
				openType === 'editor'
					? 'Thông tin Editor'
					: openType === 'header'
						? 'Header trang'
						: 'Cài mật khẩu'
			}
		>
			<Form
				form={form}
				layout="vertical"
				initialValues={{
					editor: page?.editor || '',
					headerTitle: page?.headerTitle || '',
					password: page?.password || '',
				}}
			>
				{renderFormFields()}
			</Form>

		</Modal>
	);
};
