import { Button, Form, Input, Modal, Select, Switch } from 'antd';
import { MODEL_AI_LIST } from '../../../CONST.js';

const ModelConfigModal = ({ isOpen, onClose, config, onSave }) => {
    const [form] = Form.useForm();

    const handleSave = () => {
        form.validateFields().then(values => {
            onSave(values);
            onClose();
        });
    };

    return (
        <Modal
            title="Cấu hình AI Model"
            open={isOpen}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Hủy
                </Button>,
                <Button key="save" type="primary" onClick={handleSave}>
                    Lưu
                </Button>
            ]}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={config}
            >
                <Form.Item
                    name="model"
                    label="Model"
                    rules={[{ required: true, message: 'Vui lòng chọn model' }]}
                >
                    <Select>
                        {MODEL_AI_LIST.map(model => (
                            <Select.Option key={model.value} value={model.value}>
                                {model.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="enable_web_search"
                    label="Bật tìm kiếm web"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>

                <Form.Item
                    name="system_message"
                    label="System Message"
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="Nhập system message (tùy chọn)"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModelConfigModal; 