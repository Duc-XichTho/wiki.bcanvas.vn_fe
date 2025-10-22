import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect } from "react";
import { Table, Radio, message, Button, Modal } from "antd";
import {
  getAllUser,
  createUser,
  updateUser,
  deleteUser,
} from "../../../../apis/userService";
import CreateUser from "./components/CreateUser";
import UpdateUser from "./components/UpdateUser";
import css from "./UserManagement.module.css";
import { API_RESPONSE_CODE } from "../../../../CONST";
import { POSITION_OPTIONS, DEPARTMENT_OPTIONS } from "../../../../CONST";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Warning } from "./ICON.jsx";

const UserManagement = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [listUser, setListUser] = useState([]);
  const [listUserSelected, setListUserSelected] = useState([]);
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);
  const [isModalUpdateOpen, setIsModalUpdateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectionType, setSelectionType] = useState("radio");
  const [open, setOpen] = useState(false);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const showModal = () => {
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const showNotification = (type, content) => {
    messageApi.open({
      type,
      content,
    });
  };

  const fetchAllUser = async () => {
    try {
      const response = await getAllUser();
      setListUser(response.result);
    } catch (error) {
      console.log(error);
      showNotification("error", "Không thể tải danh sách người dùng");
    }
  };

  useEffect(() => {
    fetchAllUser();
  }, []);

  const showModalUpdate = () => {
    if (listUserSelected.length > 1) {
      showNotification("warning", "Chọn tối đa 1 nhân viên");
      return;
    }
    if (listUserSelected.length === 0) {
      showNotification("warning", "Vui lòng chọn 1 nhân viên");
      return;
    }
    setIsModalUpdateOpen(true);
  };

  const columns = [
    {
      title: "Thông tin",
      dataIndex: "info",
      render: (_, user) => (
        <div className={css.userInfo}>
          {user && <>
            <img src={user.picture} alt={user.name} className={css.userAvatar} />
            <div className={css.userDetails}>
              <div className={css.userName}>{user.name}</div>
              <div className={css.userEmail}>{user.email}</div>
            </div></>}
        </div>
      ),
    },
    {
      title: "Chức vụ",
      dataIndex: "position",
      render: (_, user) => user?.info?.position?.label || "Chưa có",
    },
    {
      title: "Phòng ban",
      dataIndex: "department",
      render: (_, user) => user?.info?.department?.label || "Chưa có",
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys);
      setListUserSelected(selectedRows);
    },
  };

  const handleCreateUser = async (values) => {
    try {
      setLoading(true);
      const selectedPosition = POSITION_OPTIONS.find(
        (pos) => pos.value === values.position
      );
      const selectedDepartment = DEPARTMENT_OPTIONS.find(
        (dep) => dep.value === values.department
      );

      const data = {
        id: uuidv4(),
        email: values.email,
        name: values.email.split('@')[0],
        picture: 'https://placehold.co/200x200?text=Avatar',
        info: {
          position: selectedPosition
            ? {
                value: selectedPosition.value,
                label: selectedPosition.label,
              }
            : null,
          department: selectedDepartment
            ? {
                value: selectedDepartment.value,
                label: selectedDepartment.label,
              }
            : null,
        },
      };
      const response = await createUser(data);
      await delay(2000);

      switch (response.code) {
        case API_RESPONSE_CODE.USER_EXIST:
          showNotification("warning", response.message);
          break;
        case API_RESPONSE_CODE.USER_CREATED:
          showNotification("success", response.message);
          setIsModalCreateOpen(false);
          await fetchAllUser();
          break;
        default:
          showNotification("error", "Có lỗi xảy ra");
          break;
      }
    } catch (error) {
      console.log("Error:", error);
      showNotification("error", "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (values) => {
    try {
      setLoading(true);
      const selectedPosition = POSITION_OPTIONS.find(
        (pos) => pos.value === values.position
      );
      const selectedDepartment = DEPARTMENT_OPTIONS.find(
        (dep) => dep.value === values.department
      );

      const data = {
        info: {
          position: selectedPosition
            ? {
                value: selectedPosition.value,
                label: selectedPosition.label,
              }
            : null,
          department: selectedDepartment
            ? {
                value: selectedDepartment.value,
                label: selectedDepartment.label,
              }
            : null,
        },
      };
      const response = await updateUser(listUserSelected[0].email, data);
      await delay(2000);

      switch (response.code) {
        case API_RESPONSE_CODE.UPDATED:
          showNotification("success", response.message);
          setIsModalUpdateOpen(false);
          setSelectedRowKeys([]);
          setListUserSelected([]);
          await fetchAllUser();
          break;
        case API_RESPONSE_CODE.NOT_FOUND:
          showNotification("warning", response.message);
          break;
        default:
          showNotification("error", "Có lỗi xảy ra");
          break;
      }
    } catch (error) {
      console.log("Error:", error);
      showNotification("error", "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setLoadingDelete(true);

      const data = listUserSelected.map((user) => user.email);

      const response = await deleteUser(data);

      await delay(2000);

      switch (response.code) {
        case API_RESPONSE_CODE.NOT_FOUND:
          showNotification("warning", response.message);
          break;
        case API_RESPONSE_CODE.DELETED:
          showNotification("success", response.message);
          setOpen(false);
          setSelectedRowKeys([]);
          setListUserSelected([]);
          await fetchAllUser();
          break;
        default:
          showNotification("error", "Có lỗi xảy ra");
          break;
      }
    } catch (error) {
      console.log("Error:", error);
      showNotification("error", "Có lỗi xảy ra");
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div className={css.main}>
        <div className={css.container}>
          <div className={css.header}>
            <div className={css.actions}>
              <Button
                icon={<PlusOutlined />}
                iconPosition={"start"}
                onClick={() => setIsModalCreateOpen(true)}
              >
                Thêm
              </Button>
              <Button
                icon={<EditOutlined />}
                iconPosition={"start"}
                onClick={showModalUpdate}
              >
                Sửa
              </Button>
              <Button
                icon={<DeleteOutlined />}
                iconPosition={"start"}
                onClick={() => {
                  if (listUserSelected.length === 0) {
                    showNotification("warning", "Chọn tối thiểu 1 nhân viên");
                    return;
                  } else {
                    showModal();
                  }
                }}
              >
                Xóa
              </Button>
            </div>
            <Radio.Group
              value={selectionType}
              onChange={(e) => setSelectionType(e.target.value)}
            >
              <Radio value="radio">Chọn một</Radio>
              <Radio value="checkbox">Chọn nhiều</Radio>
            </Radio.Group>
          </div>
          <div className={css.table}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={listUser}
              rowSelection={{
                ...rowSelection,
                selectedRowKeys,
                type: selectionType,
              }}
              pagination={{
                pageSize: 9,
              }}
            />
          </div>
        </div>
      </div>

      <CreateUser
        open={isModalCreateOpen}
        onCancel={() => setIsModalCreateOpen(false)}
        onFinish={handleCreateUser}
        loading={loading}
      />

      <UpdateUser
        open={isModalUpdateOpen}
        onCancel={() => setIsModalUpdateOpen(false)}
        onFinish={handleUpdateUser}
        loading={loading}
        userSelected={listUserSelected[0]}
      />

      <Modal
        open={open}
        title={
          <div className={css.warning}>
            <div>
              <Warning />
            </div>
            <div>Xóa {listUserSelected.length} nhân viên</div>
          </div>
        }
        onOk={handleDeleteUser}
        onCancel={handleCancel}
        footer={[
          <Button
            key="submit"
            type="primary"
            loading={loadingDelete}
            onClick={async () => await handleDeleteUser()}
          >
            Xóa
          </Button>,
        ]}
      >
        <p>Dữ liệu liên quan đến nhân viên sẽ được lưu trữ.</p>
      </Modal>
    </>
  );
};

export default UserManagement;
