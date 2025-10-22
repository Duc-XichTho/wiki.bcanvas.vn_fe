import { Modal, Form, Input, Select, Checkbox } from "antd";
import { POSITION_OPTIONS, DEPARTMENT_OPTIONS } from "../../../../../CONST";
import css from "./Style.module.css";

const { Option } = Select;

const CreateUser = ({ open, onCancel, onFinish, loading, currentUser, availablePaths }) => {
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

        <Form.Item name="isEditor" valuePropName="checked">
          <Checkbox>Cấp quyền Editor</Checkbox>
        </Form.Item>

        {/* Chỉ hiển thị khi currentUser là Admin hoặc Super Admin */}
        {(currentUser?.isSuperAdmin || currentUser?.isAdmin) && (
          <Form.Item name="isAdmin" valuePropName="checked">
            <Checkbox>Cấp quyền Admin</Checkbox>
          </Form.Item>
        )}

        {/* Chỉ hiển thị khi currentUser là Super Admin */}
        {/* {currentUser?.isSuperAdmin && (
          <>
            <Form.Item label="Schema" name="schema">
              <Select
                placeholder="Chọn schema"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {availablePaths?.map(path => (
                  <Option key={path.path} value={path.path}>
                    {path.path}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="isSuperAdmin" valuePropName="checked">
              <Checkbox>Cấp quyền Super Admin</Checkbox>
            </Form.Item>
          </>
        )} */}
      </Form>
    </Modal>
  );
};

export default CreateUser;
