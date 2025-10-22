import React from "react";
import { Modal, Form, Input, Select, Checkbox } from "antd";
import { POSITION_OPTIONS, DEPARTMENT_OPTIONS } from "../../../../../CONST";
import css from "./Style.module.css";

const { Option } = Select;

const UpdateUser = ({ open, onCancel, onFinish, loading, userSelected, currentUser, availablePaths }) => {
  const [form] = Form.useForm();
  React.useEffect(() => {
    if (userSelected) {
      form.setFieldsValue({
        email: userSelected.email,
        position: userSelected.info?.position?.value,
        department: userSelected.info?.department?.value,
        isEditor: userSelected.isEditor || false,
        isAdmin: userSelected.isAdmin || false,
        isSuperAdmin: userSelected.isSuperAdmin || false,
        schema: userSelected.schema || null,
      });
    }
  }, [userSelected, form]);

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Cập nhật thông tin"
      okText="Lưu"
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
        name="updateUser"
        labelCol={{ span: 4 }}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item label="Email" name="email">
          <Input disabled />
        </Form.Item>

        <Form.Item label="Chức vụ" name="position">
          <Select placeholder="chọn" options={POSITION_OPTIONS} allowClear />
        </Form.Item>

        <Form.Item label="Phòng ban" name="department">
          <Select placeholder="chọn" options={DEPARTMENT_OPTIONS} allowClear />
        </Form.Item>

        <Form.Item label="" name="isEditor" valuePropName="checked">
          <Checkbox>Cấp quyền Editor</Checkbox>
        </Form.Item>

        {/* Chỉ hiển thị khi currentUser là Admin hoặc Super Admin */}
        {((currentUser?.isSuperAdmin) || (currentUser?.isAdmin)) && (
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

export default UpdateUser;
