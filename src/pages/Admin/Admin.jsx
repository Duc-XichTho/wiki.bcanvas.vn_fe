import css from "./Admin.module.css";
import { useState, useEffect } from "react";
import { Modal, Input, Popover, Button, message, Popconfirm } from "antd";
import { Plus, Undo2, House } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserManagement from "./components/UserManagement/UserManagement";
import UserClassElement from "./components/UserClassElement/UserClassElement";
import CreateUserClass from "./components/UserClassElement/CRUD/Create/CreateUserClass";
import ChainElement from './components/ChainElement/ChainElement';
import { MoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getAllUserClass } from "../../apis/userClassService";
import { getAllUser } from "../../apis/userService";
import {
  getAllChain,
  createNewChain,
  updateChain,
  deleteChain
} from '../../apis/chainService';

const Admin = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [statusCreateUserClass, setStatusCreateUserClass] = useState(false);
  const [statusDeleteUserClass, setStatusDeleteUserClass] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [responseMessageDelete, setResponseMessageDelete] = useState("");
  const [showFormCreateUserClass, setShowFormCreateUserClass] = useState(false);
  const [tabSelected, setTabSelected] = useState({
    type: "user",
    data: null,
  });
  const [listUser, setListUser] = useState([]);
  const [listUserClass, setListUserClass] = useState([]);
  const [openModalCreateChain, setOpenModalCreateChain] = useState(false);
  const [openModalUpdateChain, setOpenModalUpdateChain] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmLoadingUpdate, setConfirmLoadingUpdate] = useState(false);
  const [openPopovers, setOpenPopovers] = useState({});
  const [listChain, setListChain] = useState([]);
  const [valueNameChain, setValueNameChain] = useState('');
  const [valueNameChainUpdate, setValueNameChainUpdate] = useState('');

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const showNotification = (type, content) => {
    messageApi.open({
      type,
      content,
    });
  };

  const fetchAllChain = async () => {
    try {
      const data = await getAllChain();
      setListChain(data);
    } catch (error) {
      console.log("Error:", error);
    }
  }

  const fetchAllUser = async () => {
    try {
      const response = await getAllUser();
      setListUser(response.result);
    } catch (error) {
      console.log("Error:", error);
    }
  };

  const fetchAllUserClass = async () => {
    try {
      const data = await getAllUserClass();
      setListUserClass(data);
    } catch (error) {
      console.log("Error:", error);
    }
  };

  useEffect(() => {
    fetchAllChain();
    fetchAllUser();
    fetchAllUserClass();
  }, []);

  useEffect(() => {
    if (statusCreateUserClass) {
      showNotification("success", responseMessage);
      setStatusCreateUserClass(false);
    }
  }, [statusCreateUserClass, responseMessage]);

  useEffect(() => {
    if (statusDeleteUserClass) {
      showNotification("success", responseMessageDelete);
      setStatusDeleteUserClass(false);
    }
  }, [statusDeleteUserClass, responseMessageDelete]);

  const redirectHome = () => {
    navigate("/accounting", { replace: true });
  };

  const handleOpenChange = (newOpen, id) => {
    setOpenPopovers((prevState) => ({
      ...prevState,
      [id]: newOpen,
    }));
  };

  const handleTabSelect = (type, data) => {
    setTabSelected({ type, data });
  };

  const handleCreateChain = async () => {
    try {
      setConfirmLoading(true);
      const data = {
        name: valueNameChain,
      }
      const response = await createNewChain(data);

      await delay(2000);

      switch (response.status) {
        case 201:
          showNotification("success", "Tạo thành công.");
          setValueNameChain('');
          await fetchAllChain();
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
      setOpenModalCreateChain(false);
    }
  };

  const handleUpdateChain = async () => {
    try {
      setConfirmLoadingUpdate(true);
      const data = {
        id: tabSelected.data.id,
        name: valueNameChainUpdate,
      }
      const response = await updateChain(data);
      await delay(2000);
      switch (response.status) {
        case 200:
          showNotification("success", "Cập nhật thành công.");
          setValueNameChainUpdate('');
          await fetchAllChain();
          break;
        default:
          showNotification("error", "Có lỗi xảy ra");
          break;
      }
    } catch (error) {
      console.log("Error:", error);
      showNotification("error", "Có lỗi xảy ra");
    } finally {
      setConfirmLoadingUpdate(false);
      setOpenModalUpdateChain(false);
    }
  }

  const handleDeleteChain = async (item) => {
    try {
      const response = await deleteChain(item.id);
      await delay(2000);
      switch (response.status) {
        case 200:
          showNotification("success", "Xóa thành công.");
          setTabSelected({
            type: "",
            data: null,
          });
          await fetchAllChain();
          break;
        default:
          showNotification("error", "Có lỗi xảy ra");
          break;
      }
    } catch (error) {
      console.log("Error:", error);
      showNotification("error", "Có lỗi xảy ra");
    }
  };


  const handleOpenPopoverUpdate = (item) => {
    setValueNameChainUpdate(item.name)
    setOpenPopovers(false);
    setOpenModalUpdateChain(true)
  }

  const popoverContent = (item) => {

    return (
      <div className={css.popoverContent}>
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleOpenPopoverUpdate(item)}
        />
        <Popconfirm
          title="Xóa Chain"
          description="Bạn có chắc chắn muốn xóa không?"
          okText="Xóa"
          cancelText="Hủy"
          onConfirm={async () => await handleDeleteChain(item)}
          placement="bottom"
        >
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
          />
        </Popconfirm>
      </div>
    )
  };

  return (
    <>
      {contextHolder}
      <div className={css.main}>
        <div className={css.sidebar}>
          <div className={css.backHome}>
            <div className={css.backHomeItem} onClick={redirectHome}>
              <Undo2 /><House />
            </div>
          </div>
          <div className={css.menu}>
            <div
              className={`${css.menuItem} ${tabSelected.type === "user" ? css.selected : ""
                }`}
              onClick={() => handleTabSelect("user", { name: "user" })}
            >
              <span><b>Quản lý nhân viên</b></span>
            </div>

            <div className={css.menuUserClass}>
              <div className={css.menuHeader}>
                <div className={css.menuTitle}>
                  <div>
                    <span><b>Quản lý nhóm nhân viên</b></span>
                  </div>
                </div>
                <div className={css.changePosition}>
                  <Button type="text" icon={<Plus />} onClick={() => setShowFormCreateUserClass(true)} />
                </div>
              </div>
              <div className={css.menuContent}>
                {listUserClass.map((item) => (
                  <div
                    key={item.id}
                    className={`${css.menuData} ${tabSelected?.data?.id === item.id
                      ? css.selected
                      : ""
                      }`}
                    onClick={() => handleTabSelect('group', item)}
                  >
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={css.menuChain}>
              <div className={css.menuHeader}>
                <div className={css.menuTitle}>
                  <div>
                    <span><b>Quản lý Chuỗi</b></span>
                  </div>
                </div>
                <div className={css.changePosition}>
                  <Button type="text" icon={<Plus />} onClick={() => setOpenModalCreateChain(true)} />
                </div>
              </div>
              <div className={css.menuContent}>
                {listChain.map((item) => (
                  <div
                    key={item.id}
                    className={`${css.menuData} ${tabSelected?.data?.id === item.id
                      ? css.selected
                      : ""
                      }`}
                    onClick={() =>
                      handleTabSelect('chain', item)
                    }
                  >
                    <div className={css.chainInfoContainer}>
                      <div className={css.chainInfo}>
                        <span>{item.name}</span>
                      </div>
                      <div className={css.chainAction}>
                        <Popover
                          content={popoverContent(item)}
                          trigger="click"
                          placement="right"
                          open={!!openPopovers[item.id]}
                          onOpenChange={(e) => handleOpenChange(e, item.id)}
                        >
                          <Button type="text" size="small" icon={<MoreOutlined />} />
                        </Popover>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className={css.content}>
          {tabSelected.type.includes("user") && <UserManagement />}
          {tabSelected.type.includes("group")
            && <UserClassElement
              listUser={listUser}
              userClassSelected={tabSelected.data}
              fetchAllUserClass={fetchAllUserClass}
              setTabSelected={setTabSelected}
              setStatusDeleteUserClass={setStatusDeleteUserClass}
              setResponseMessageDelete={setResponseMessageDelete}
              handleTabSelect={handleTabSelect}
            />}
          {tabSelected.type.includes("chain")
            && <ChainElement
              chainSelected={tabSelected.data}
              fetchAllChain={fetchAllChain}
            />}
        </div>
      </div>
      {showFormCreateUserClass && (
        <CreateUserClass
          onClose={() => setShowFormCreateUserClass(false)}
          fetchAllUserClass={fetchAllUserClass}
          setStatusCreateUserClass={setStatusCreateUserClass}
          setResponseMessage={setResponseMessage}
        />
      )}
      <Modal
        centered
        title="Tạo Chuỗi"
        okText="Tạo"
        cancelText="Hủy"
        open={openModalCreateChain}
        onOk={async () => await handleCreateChain()}
        confirmLoading={confirmLoading}
        onCancel={() => setOpenModalCreateChain(false)}
      >
        <Input
          placeholder="nhập tên"
          value={valueNameChain}
          onChange={(e) => setValueNameChain(e.target.value)}
        />
      </Modal>
      <Modal
        centered
        title="Sửa tên Chuỗi"
        okText="Lưu"
        cancelText="Hủy"
        open={openModalUpdateChain}
        onOk={async () => await handleUpdateChain()}
        confirmLoading={confirmLoadingUpdate}
        onCancel={() => setOpenModalUpdateChain(false)}
      >
        <Input
          placeholder="nhập tên"
          value={valueNameChainUpdate}
          onChange={(e) => setValueNameChainUpdate(e.target.value)}
        />
      </Modal>
    </>
  );
};

export default Admin;
