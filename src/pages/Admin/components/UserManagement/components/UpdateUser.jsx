import React from "react";
import { Modal, Form, Input, Select } from "antd";
import { POSITION_OPTIONS, DEPARTMENT_OPTIONS } from "../../../../../CONST";
import css from "./Style.module.css";

const UpdateUser = ({ open, onCancel, onFinish, loading, userSelected }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (userSelected) {
      form.setFieldsValue({
        email: userSelected.email,
        position: userSelected.info?.position?.value,
        department: userSelected.info?.department?.value,
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
      </Form>
    </Modal>
  );
};

export default UpdateUser;
