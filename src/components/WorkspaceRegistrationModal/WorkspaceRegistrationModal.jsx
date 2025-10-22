import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { createDemoSchemaPublicController } from '../../apis/public/publicService.jsx';
import styles from './WorkspaceRegistrationModal.module.css';

const WorkspaceRegistrationModal = ({ visible, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const currentDate = new Date();
            const expiredDate = new Date(currentDate);
            expiredDate.setDate(expiredDate.getDate() + 90);

            const requestData = {
                email: values.email,
                schema: {
                    path: values.workspaceName,
                    created_at: currentDate.toISOString(),
                    expired_at: expiredDate.toISOString()
                }
            };

            await createDemoSchemaPublicController(requestData);
            message.success('Đăng ký workspace thành công!');
            form.resetFields();
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Lỗi khi đăng ký workspace:', error);
            message.error('Có lỗi xảy ra khi đăng ký workspace. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            title="Đăng ký dùng thử Workspace"
            open={visible}
            onCancel={handleCancel}
            footer={null}
            className={styles.modal}
            width={500}
            centered
        >
            <div className={styles.modalContent}>
                <p className={styles.description}>
                    Đăng ký để sử dụng thử workspace miễn phí trong 90 ngày
                </p>
                
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className={styles.form}
                >
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                    >
                        <Input 
                            placeholder="Nhập email của bạn"
                            size="large"
                            className={styles.input}
                        />
                    </Form.Item>

                    <Form.Item
                        name="workspaceName"
                        label="Tên Workspace"
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên workspace!' },
                            { min: 3, message: 'Tên workspace phải có ít nhất 3 ký tự!' }
                        ]}
                    >
                        <Input 
                            placeholder="Nhập tên workspace"
                            size="large"
                            className={styles.input}
                        />
                    </Form.Item>

                    <div className={styles.buttonGroup}>
                        <Button 
                            onClick={handleCancel}
                            size="large"
                            className={styles.cancelButton}
                        >
                            Hủy
                        </Button>
                        <Button 
                            type="primary" 
                            htmlType="submit"
                            loading={loading}
                            size="large"
                            className={styles.submitButton}
                        >
                            Đăng ký
                        </Button>
                    </div>
                </Form>
            </div>
        </Modal>
    );
};

export default WorkspaceRegistrationModal;
