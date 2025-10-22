import { Button, Form, Input, message, Modal } from 'antd';
import { createKHKD } from '../../../../../apis/khkdService.jsx';
import React from 'react';
import { createKHKDTongHop } from '../../../../../apis/khkdTongHopService.jsx';

export default function CreateHopKH({
										isKHKDTongHopModalOpen,
										setIsKHKDTongHopModalOpen,
										khkdTongHopForm,
										fetchData,
										title = 'Tạo bản kế hoạch hợp nhất mới',
										isOnlyTH = false,
										duyet = false,
									}) {
	return (
		<Modal
			title={title}
			open={isKHKDTongHopModalOpen}
			onCancel={() => {
				khkdTongHopForm.resetFields();
				setIsKHKDTongHopModalOpen(false);
			}}
			footer={null}
			destroyOnClose
		>
			<Form
				form={khkdTongHopForm}
				layout="vertical"
				onFinish={async (values) => {
					try {
						// Chuẩn bị dữ liệu để gửi đi
						const postData = {
							name: values.name,
							setting: values.setting ? JSON.parse(values.setting) : {},
							settingDongTien: values.settingDongTien ? JSON.parse(values.settingDongTien) : {},
							isOnlyTH: isOnlyTH,
							duyet: duyet,
						};

						const response = await createKHKDTongHop(postData);
						if (response && response.status === 201) {
							message.success('Tạo mới thành công!');
							khkdTongHopForm.resetFields();
							setIsKHKDTongHopModalOpen(false);
							fetchData();
						}
					} catch (error) {
						message.error('Có lỗi xảy ra khi tạo KHKDTongHop: ' + error.message);
					}
				}}
			>
				<Form.Item
					name="name"
					label="Tên"
					rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
				>
					<Input placeholder="Nhập tên" />
				</Form.Item>

				<Form.Item>
					<Button type="primary" htmlType="submit" block>
						Tạo mới
					</Button>
				</Form.Item>
			</Form>
		</Modal>
	);
}
