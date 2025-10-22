import { Modal, Input, Button, message, Form } from 'antd';
import { useState } from 'react';

const DOC_ANALYST_CONFIG_TYPE = 'DOC_ANALYST_CONFIG';

export default function DocAnalystConfigModal({ isOpen, onClose, config, onSave }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();
            onSave(values);
            onClose();
        } catch (error) {
            console.error('Error saving config:', error);
            message.error('Không thể lưu cấu hình');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Cấu hình system message"
            open={isOpen}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Hủy
                </Button>,
                <Button key="save" type="primary" onClick={handleSave} loading={loading}>
                    Lưu
                </Button>,
            ]}
            width={900}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={config}
            >
                <Form.Item
                    label="System Message"
                    name="setting"
                    rules={[{ required: true, message: 'Vui lòng nhập system message' }]}
                >
                    <Input.TextArea
                        rows={6}
                        placeholder="Nhập system message cho việc phân tích tài liệu..."
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
