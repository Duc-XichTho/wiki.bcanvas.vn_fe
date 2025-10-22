import React, {useContext, useState} from 'react';
import {Modal, Form, Input, Select, Button, message} from 'antd';
import {MyContext} from "../../../../../MyContext.jsx";
import {sendRequestEmail} from "../../../../../apis/gateway/emailService.jsx";

const {TextArea} = Input;
const {Option} = Select;

const RequestSideBar = ({open, onClose,}) => {
    const {currentUser,} = useContext(MyContext);
    const [loading, setLoading] = useState(false);

    const [form] = Form.useForm();

    const handleFinish = async (values) => {
        setLoading(true);  // Bật hiệu ứng loading

        const formData = {
            ...values,
            userCreate: currentUser
        };
        try {
            await sendRequestEmail(formData);
            message.success('Yêu cầu tùy biến của bạn đã được gửi thành công!');
        } catch (error) {
            console.error('Lỗi khi gửi email:', error);
            message.error('Gửi yêu cầu thất bại, vui lòng thử lại!');
        } finally {
            setLoading(false);
            onClose()
        }
    };


    return (
        <Modal
            title="Yêu cầu tùy biến"
            visible={open}
            onCancel={onClose}
            footer={null} // Ẩn footer mặc định của modal
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{customType: 'Tùy biến công cụ sẵn có',}}

            >
                <Form.Item
                    label="Tiêu đề"
                    name="title"
                    rules={[{required: true, message: 'Vui lòng nhập tiêu đề'}]}
                >
                    <Input placeholder="Nhập tiêu đề"/>
                </Form.Item>

                <Form.Item
                    label="Loại tùy biến"
                    name="customType"
                    rules={[{required: true, message: 'Vui lòng chọn loại tùy biến'}]}
                >
                    <Select defaultValue="Tùy biến công cụ sẵn có">
                        <Option value="Tùy biến công cụ sẵn có">Tùy biến công cụ sẵn có</Option>
                        <Option value="Xây dựng công cụ mới">Xây dựng công cụ mới</Option>
                        <Option value="Hỗ trợ thiết lập/ cấu hình">Hỗ trợ thiết lập/ cấu hình</Option>
                        <Option value="Cài đặt thêm công cụ SAB">Cài đặt thêm công cụ SAB</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Mô tả nội dung"
                    name="description"
                    rules={[{required: true, message: 'Vui lòng nhập mô tả nội dung'}]}
                >
                    <TextArea rows={4} placeholder="Nhập mô tả nội dung"/>
                </Form.Item>

                <Form.Item
                    label="SDT liên hệ lại"
                    name="phone"
                    rules={[{required: true, message: 'Vui lòng nhập số điện thoại'}]}
                >
                    <Input placeholder="Nhập số điện thoại"/>
                </Form.Item>

                <div style={{display: 'flex', justifyContent: 'end', gap: '10px'}}>
                    <Button onClick={onClose}>Hủy</Button>
                    <Button loading={loading} // Thêm hiệu ứng loading
                            type="primary"
                            htmlType="submit"
                            style={{backgroundColor: 'rgba(45, 158, 104, 1)'}}
                    >Gửi yêu cầu
                    </Button>
                </div>

                <p style={{marginTop: 12, fontSize: 12, color: '#666'}}>
                    Yêu cầu sẽ được xác nhận qua email của bạn và sẽ được phản hồi/liên hệ lại trong vòng 24-48 giờ.
                </p>
            </Form>
        </Modal>
    );
};

export default RequestSideBar;
