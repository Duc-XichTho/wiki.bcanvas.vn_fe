import { Button, Form, Input, message, Modal } from 'antd';
import { createKHKD } from '../../../../../apis/khkdService.jsx';
import React, { useContext } from 'react';
import { MyContext } from '../../../../../MyContext.jsx';

export default function CreateLapKH({isKHKDModalOpen , setIsKHKDModalOpen , khkdForm , fetchData}) {
	const {
		uCSelected_CANVAS,
		currentUser,
		listUC_CANVAS,
	} = useContext(MyContext);
	return (
		<Modal
			title="Tạo mới kế hoạch kinh doanh"
			open={isKHKDModalOpen}
			onCancel={() => {
				khkdForm.resetFields();
				setIsKHKDModalOpen(false);
			}}
			footer={null}
			destroyOnClose
		>
			<Form
				form={khkdForm}
				layout="vertical"
				onFinish={async (values) => {
					try {
						let nameUC = listUC_CANVAS?.find(item => item.id == uCSelected_CANVAS)?.name;
						values.userClass = [nameUC];
						values.userCreated = currentUser?.email;
						const response = await createKHKD(values);
						if (response && response.status === 201) {
							message.success('Tạo mới KHKD thành công!');
							khkdForm.resetFields();
							setIsKHKDModalOpen(false);
							await fetchData()
						}
					} catch (error) {
						message.error('Có lỗi xảy ra khi tạo KHKD: ' + error.message);
					}
				}}
			>
				<Form.Item
					name="name"
					label="Tên kế hoạch"
					rules={[{ required: true, message: 'Vui lòng nhập tên kế hoạch!' }]}
				>
					<Input placeholder="Nhập tên kế hoạch kinh doanh" />
				</Form.Item>

				{/* <Form.Item
                        name="description"
                        label="Mô tả"
                    >
                        <Input.TextArea placeholder="Nhập mô tả cho kế hoạch" rows={4} />
                    </Form.Item> */}

				<Form.Item>
					<Button type="primary" htmlType="submit" block>
						Tạo mới
					</Button>
				</Form.Item>
			</Form>
		</Modal>
	);
}
