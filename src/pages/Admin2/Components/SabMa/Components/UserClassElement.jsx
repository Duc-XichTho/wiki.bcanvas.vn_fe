import css from "./UserClassElement.module.css"
import { useEffect, useState } from 'react'
import { Table, Button, message, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { UsersRound, Link } from 'lucide-react';
import { API_RESPONSE_CODE } from "../../../../../CONST";
import { deleteUserClass } from "../../../../../apis/userClassService";
import UpdateUserClass from "./CRUD/Update/UpdateUserClass.jsx";
import { getAllUser } from "../../../../../apis/userService";
import './UserClassElement.css';
import { FcManager } from "react-icons/fc";
import { FcBusinessman } from "react-icons/fc";
const UserClassElement = ({
  userClassSelected,
  setUserClassSelected,
  fetchAllUserClass,
  setStatusDeleteUserClass,
  setResponseMessageDelete,
}) => {
  const [userAccess, setUserAccess] = useState([])
  const [messageApi, contextHolder] = message.useMessage();
  const [showUpdateUserClass, setShowUpdateUserClass] = useState(false);
  const [statusUpdateUserClass, setStatusUpdateUserClass] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [listUser, setListUser] = useState([]);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const showNotification = (type, content) => {
    messageApi.open({
      type,
      content,
    });
  };

  const showPopconfirm = () => {
    setOpen(true);
  };

  const handleOk = async () => {
    try {
      setConfirmLoading(true)

      const response = await deleteUserClass(userClassSelected.id);

      await delay(2000);

      switch (response.code) {
        case API_RESPONSE_CODE.DELETED:
          setOpen(false);
          setConfirmLoading(false);
          setStatusDeleteUserClass(true);
          setResponseMessageDelete(response.message);
          await fetchAllUserClass();
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
      setConfirmLoading(false);
    }
  }


  const handleCancel = () => {
    console.log('Clicked cancel button');
    setOpen(false);
  };

  const fetchAllUser = async () => {
    try {
      const response = await getAllUser();
      setListUser(response.result);
    } catch (error) {
      console.log("Error:", error);
    }
  };

  useEffect(() => {
    fetchAllUser();
  }, []);

  useEffect(() => {
    if (statusUpdateUserClass) {
      showNotification("success", responseMessage);
      setStatusUpdateUserClass(false);
    }
  }, [statusUpdateUserClass, responseMessage]);

  useEffect(() => {
    if (userClassSelected) {

    }
  }, [userClassSelected])

  useEffect(() => {
    if (userClassSelected?.userAccess?.length > 0 && listUser?.length > 0) {
      const additionalUserAccess = userClassSelected.userAccess.map(email =>
        listUser.find(user => user.email === email)
      );
      setUserAccess(additionalUserAccess);
    }
  }, [userClassSelected, listUser]);

  const checkboxOptions = [
    { id: 'manager', label: 'Manager', icon: <FcManager /> },
    { id: 'ceo', label: 'CEO', icon: <FcBusinessman /> },
  ];

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
            </div>
          </>}
        </div>
      ),
    },
    {
      width: "25%",
      title: "Chức vụ",
      dataIndex: "position",
      render: (_, user) => user?.info?.position?.label || "Chưa có",
    },
    {
      width: "25%",
      title: "Phòng ban",
      dataIndex: "department",
      render: (_, user) => user?.info?.department?.label || "Chưa có",
    },
  ];


  return (
    <>
      {contextHolder}
      <div className={css.main}>
        <div className={css.container}>
          <div className={css.header}>
            <div className={css.headerTitle}>
              <span>Thông tin User Class</span>
            </div>
            <div className={css.userClassName}>
              <span>{userClassSelected?.name}</span>
            </div>
            <div className={css.actionUpdate}>
              <Button
                color="default"
                variant="filled"
                shape="circle"
                icon={<EditOutlined />}
                onClick={() => setShowUpdateUserClass(true)}
              >
              </Button>
              <Popconfirm
                title="Xóa User Class"
                description="Bạn có chắc chắn muốn xóa không?"
                okText="Xóa"
                cancelText="Hủy"
                open={open}
                onConfirm={async () => await handleOk()}
                okButtonProps={{
                  loading: confirmLoading,
                }}
                onCancel={handleCancel}
                placement="bottomLeft"
              >
                <Button
                  color="default"
                  variant="filled"
                  shape="circle"
                  icon={<DeleteOutlined />}
                  onClick={showPopconfirm}
                >
                </Button>
              </Popconfirm>
            </div>

          </div>
          <div className={css.body}>

            <div className={css.userAccess}>
              <div className={css.titleUserAccess}>
                <UsersRound />
                <span>Danh sách Nhân viên</span>
              </div>
              <Table
                columns={columns}
                dataSource={userAccess}
                pagination={{
                  pageSize: 30,
                }}
              />
            </div>

            <div className={css.chainAccess}>
              <div className={css.titleChainAccess}>
                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                  <Link />
                  <span>Quyền hạn</span>
                </div>

              </div>
              <div className={css.valueChainAccess}>
                {userClassSelected?.info && userClassSelected.info.length > 0 ? (
                  userClassSelected.info.map((id) => {
                    const option = checkboxOptions.find((opt) => opt.id === id);
                    if (option) {
                      return (
                        <div className="checkbox2" key={option.id}>
                          <label className="checkbox-wrapper2">
                            <span className="checkbox-tile2">
                              <span className="checkbox-icon2">{option.icon}</span>
                              <span className="checkbox-label2">{option.label}</span>
                            </span>
                          </label>
                        </div>
                      );
                    }
                    return null;
                  })
                ) : (
                  <div>Chưa cấp quyền</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showUpdateUserClass && (
        <UpdateUserClass
          onClose={() => setShowUpdateUserClass(false)}
          setStatusUpdateUserClass={setStatusUpdateUserClass}
          setResponseMessage={setResponseMessage}
          fetchAllUserClass={fetchAllUserClass}
          userClassSelected={userClassSelected}
          setUserClassSelected={setUserClassSelected}
        />
      )}
    </>
  )
}

export default UserClassElement
