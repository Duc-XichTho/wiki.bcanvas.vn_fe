import React, { useState } from 'react';
import { Button, Modal, Form, Input, Select, Checkbox, message, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { createKHKD } from '../../apis/khkdService';
import { createKHKDElement } from '../../apis/khkdElementService';

const KHKDForms = () => {
	// State quản lý trạng thái hiển thị của các modal
	const [isKHKDModalOpen, setIsKHKDModalOpen] = useState(false);
	const [isKHKDElementModalOpen, setIsKHKDElementModalOpen] = useState(false);

	// Khởi tạo form
	const [khkdForm] = Form.useForm();
	const [khkdElementForm] = Form.useForm();

	// Xử lý mở/đóng modal KHKD
	const showKHKDModal = () => {
		setIsKHKDModalOpen(true);
	};

	const handleKHKDCancel = () => {
		khkdForm.resetFields();
		setIsKHKDModalOpen(false);
	};

	// Xử lý mở/đóng modal KHKDElement
	const showKHKDElementModal = () => {
		setIsKHKDElementModalOpen(true);
	};

	const handleKHKDElementCancel = () => {
		khkdElementForm.resetFields();
		setIsKHKDElementModalOpen(false);
	};

	// Xử lý submit form KHKD
	const handleKHKDSubmit = async (values) => {
		try {
			const response = await createKHKD(values);
			if (response && response.status === 200) {
				message.success('Tạo mới KHKD thành công!');
				khkdForm.resetFields();
				setIsKHKDModalOpen(false);
			}
		} catch (error) {
			message.error('Có lỗi xảy ra khi tạo KHKD: ' + error.message);
		}
	};

	// Xử lý submit form KHKDElement
	const handleKHKDElementSubmit = async (values) => {
		try {
			const response = await createKHKDElement(values);
			if (response && response.status === 200) {
				message.success('Tạo mới KHKDElement thành công!');
				khkdElementForm.resetFields();
				setIsKHKDElementModalOpen(false);
			}
		} catch (error) {
			message.error('Có lỗi xảy ra khi tạo KHKDElement: ' + error.message);
		}
	};

	return (
		<div style={{ marginBottom: 16 }}>
			<Space>
				{/* Nút tạo mới KHKD */}
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={showKHKDModal}
				>
					Tạo mới KHKD
				</Button>

				{/* Nút tạo mới KHKDElement */}
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={showKHKDElementModal}
				>
					Tạo mới KHKDElement
				</Button>
			</Space>

			{/* Modal tạo mới KHKD */}
			<Modal
				title="Tạo mới kế hoạch kinh doanh"
				open={isKHKDModalOpen}
				onCancel={handleKHKDCancel}
				footer={null}
				destroyOnClose
			>
				<Form
					form={khkdForm}
					layout="vertical"
					onFinish={handleKHKDSubmit}
				>
					<Form.Item
						name="name"
						label="Tên kế hoạch"
						rules={[{ required: true, message: 'Vui lòng nhập tên kế hoạch!' }]}
					>
						<Input placeholder="Nhập tên kế hoạch kinh doanh" />
					</Form.Item>

					<Form.Item
						name="description"
						label="Mô tả"
					>
						<Input.TextArea placeholder="Nhập mô tả cho kế hoạch" rows={4} />
					</Form.Item>

					<Form.Item>
						<Button type="primary" htmlType="submit" block>
							Tạo mới
						</Button>
					</Form.Item>
				</Form>
			</Modal>

			{/* Modal tạo mới KHKDElement */}
			<Modal
				title="Tạo mới thành phần kế hoạch kinh doanh"
				open={isKHKDElementModalOpen}
				onCancel={handleKHKDElementCancel}
				footer={null}
				destroyOnClose
			>
				<Form
					form={khkdElementForm}
					layout="vertical"
					onFinish={handleKHKDElementSubmit}
				>
					<Form.Item
						name="name"
						label="Tên thành phần"
						rules={[{ required: true, message: 'Vui lòng nhập tên thành phần!' }]}
					>
						<Input placeholder="Nhập tên thành phần" />
					</Form.Item>

					<Form.Item
						name="khoanMuc"
						label="Khoản mục"
						rules={[{ required: true, message: 'Vui lòng chọn khoản mục!' }]}
					>
						<Select placeholder="Chọn khoản mục">
							<Select.Option value="khoanMuc1">Khoản mục 1</Select.Option>
							<Select.Option value="khoanMuc2">Khoản mục 2</Select.Option>
							<Select.Option value="khoanMuc3">Khoản mục 3</Select.Option>
						</Select>
					</Form.Item>

					<Form.Item
						name="boPhan"
						label="Bộ phận"
						rules={[{ required: true, message: 'Vui lòng chọn bộ phận!' }]}
					>
						<Select placeholder="Chọn bộ phận">
							<Select.Option value="boPhan1">Bộ phận 1</Select.Option>
							<Select.Option value="boPhan2">Bộ phận 2</Select.Option>
							<Select.Option value="boPhan3">Bộ phận 3</Select.Option>
						</Select>
					</Form.Item>

					<Form.Item
						name="labelSoLuong"
						label="Label số lượng"
					>
						<Input placeholder="Nhập label số lượng" />
					</Form.Item>

					<Form.Item
						name="theoDoi"
						valuePropName="checked"
						label="Theo dõi"
					>
						<Checkbox>Theo dõi</Checkbox>
					</Form.Item>

					<Form.Item
						name="khkdId"
						label="Kế hoạch kinh doanh"
						rules={[{ required: true, message: 'Vui lòng chọn kế hoạch kinh doanh!' }]}
					>
						<Select placeholder="Chọn kế hoạch kinh doanh">
							<Select.Option value="khkd1">KHKD 1</Select.Option>
							<Select.Option value="khkd2">KHKD 2</Select.Option>
							<Select.Option value="khkd3">KHKD 3</Select.Option>
						</Select>
					</Form.Item>

					<Form.Item>
						<Button type="primary" htmlType="submit" block>
							Tạo mới
						</Button>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
};

export default KHKDForms;