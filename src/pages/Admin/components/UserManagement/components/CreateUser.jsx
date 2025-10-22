import { Modal, Form, Input, Select } from "antd";
import { POSITION_OPTIONS, DEPARTMENT_OPTIONS } from "../../../../../CONST";
import css from "./Style.module.css";

const CreateUser = ({ open, onCancel, onFinish, loading }) => {
  const [form] = Form.useForm();

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Thêm nhân viên"
      okText="Thêm"
      cancelText="Hủy"
      open={open}
      onOk={form.submit}
      onCancel={handleCancel}
      maskClosable={false}
      confirmLoading={loading}
      className={css.modal}
    >
      <Form
        form={form}
        name="createUser"
        labelCol={{
          span: 4,
        }}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              message: "Vui lòng không bỏ trống",
            },
            {
              type: "email",
              message: "Email không đúng định dạng",
            },
          ]}
        >
          <Input placeholder="example@email.com" />
        </Form.Item>

        <Form.Item label="Chức vụ" name="position">
          <Select
            placeholder="chọn"
            options={POSITION_OPTIONS}
            allowClear
          />
        </Form.Item>

        <Form.Item label="Phòng ban" name="department">
          <Select
            placeholder="chọn"
            options={DEPARTMENT_OPTIONS}
            allowClear
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateUser;
