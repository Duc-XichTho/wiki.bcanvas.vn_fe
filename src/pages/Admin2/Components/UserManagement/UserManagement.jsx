import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect, useContext } from "react";
import { Table, Radio, message, Button, Modal, Switch, Tag, Space, Select, Input } from "antd";
import {
  getAllUser,
  createUser,
  updateUser,
  deleteUser,
} from "../../../../apis/userService";
import { getAllPath } from "../../../../apis/adminPathService";
import CreateUser from "./components/CreateUser";
import UpdateUser from "./components/UpdateUser";
import css from "./UserManagement.module.css";
import { API_RESPONSE_CODE } from "../../../../CONST";
import { POSITION_OPTIONS, DEPARTMENT_OPTIONS } from "../../../../CONST";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  LinkOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Warning } from "./ICON.jsx";
import { MyContext } from '../../../../MyContext.jsx';

const { Option } = Select;
const { Search } = Input;

const UserManagement = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [listUser, setListUser] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [listUserSelected, setListUserSelected] = useState([]);
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);
  const [isModalUpdateOpen, setIsModalUpdateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectionType, setSelectionType] = useState("radio");
  const [open, setOpen] = useState(false);
  const [availablePaths, setAvailablePaths] = useState([]);
  const [searchText, setSearchText] = useState("");
  const { currentUser } = useContext(MyContext);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Hàm tìm kiếm users
  const filterUsers = (users, searchValue) => {
    if (!searchValue.trim()) {
      return users;
    }

    const searchLower = searchValue.toLowerCase();
    return users.filter(user => {
      // Tìm theo tên
      if (user.name && user.name.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Tìm theo email
      if (user.email && user.email.toLowerCase().includes(searchLower)) {
        return true;
      }
    
      
      return false;
    });
  };

  // Cập nhật filtered users khi searchText hoặc listUser thay đổi
  useEffect(() => {
    const filtered = filterUsers(listUser, searchText);
    setFilteredUsers(filtered);
  }, [searchText, listUser]);

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

  const fetchAvailablePaths = async () => {
    try {
      const response = await getAllPath();
      if (response && response.data) {
        setAvailablePaths(response.data);
      }
    } catch (error) {
      console.log("Error fetching paths:", error);
    }
  };

  useEffect(() => {
    fetchAllUser();
    fetchAvailablePaths();
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

  // Hàm xử lý tìm kiếm
  const handleSearch = (value) => {
    setSearchText(value);
  };

  // Hàm xử lý thay đổi input tìm kiếm
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  // Hàm toggle quyền admin - cho phép Admin và Super Admin
  const handleToggleAdmin = async (user) => {
    try {
      setLoading(true);
      const updatedData = {
        ...user,
        isAdmin: !user.isAdmin,
      };
      
      const response = await updateUser(user.email, updatedData);
      await delay(1000);

      switch (response.code) {
        case API_RESPONSE_CODE.UPDATED:
          showNotification("success", `Đã ${user.isAdmin ? 'tắt' : 'bật'} quyền Admin cho ${user.name}`);
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
      showNotification("error", "Có lỗi xảy ra khi cập nhật quyền Admin");
    } finally {
      setLoading(false);
    }
  };

  // Hàm toggle quyền super admin - chỉ cho Super Admin
  const handleToggleSuperAdmin = async (user) => {
    try {
      setLoading(true);
      const updatedData = {
        ...user,
        isSuperAdmin: !user.isSuperAdmin,
      };
      
      const response = await updateUser(user.email, updatedData);
      await delay(1000);

      switch (response.code) {
        case API_RESPONSE_CODE.UPDATED:
          showNotification("success", `Đã ${user.isSuperAdmin ? 'tắt' : 'bật'} quyền Super Admin cho ${user.name}`);
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
      showNotification("error", "Có lỗi xảy ra khi cập nhật quyền Super Admin");
    } finally {
      setLoading(false);
    }
  };

  // Hàm cập nhật schema cho user - chỉ cho Super Admin
  const handleUpdateSchema = async (user, newSchema) => {
    try {
      setLoading(true);
      const updatedData = {
        ...user,
        schema: newSchema,
      };
      
      const response = await updateUser(user.email, updatedData);
      await delay(1000);

      switch (response.code) {
        case API_RESPONSE_CODE.UPDATED:
          showNotification("success", `Đã cập nhật schema cho ${user.name}`);
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
      showNotification("error", "Có lỗi xảy ra khi cập nhật schema");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Thông tin",
      dataIndex: "info",
      width: 200,
      fixed: 'left',
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
      title: 'Chức vụ',
      dataIndex: 'position',
      width: 120,
      render: (_, user) => user?.info?.position?.label || 'Chưa có',
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      width: 120,
      render: (_, user) => user?.info?.department?.label || "Chưa có",
    },
    {
      title: 'Quyền Editor',
      dataIndex: 'isEditor',
      width: 120,
      render: (_, user) => (
        <span style={{ 
          color: user?.isEditor ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {user?.isEditor ? 'Có' : 'Không'}
        </span>
      ),
    },
    // Cột Schema - luôn hiển thị nhưng chỉ cho phép sửa nếu là Super Admin
    ...(currentUser?.isSuperAdmin ? [{
    
      title: 'Schema',
      dataIndex: 'schema',
      key: 'schema',
      width: 210,
      render: (schema, user) => (
        <Space>
          <Tag 
            color={schema ? 'green' : 'default'}
            icon={schema ? <LinkOutlined /> : null}
          >
            {schema || 'Chưa có'}
          </Tag>
          {currentUser?.isSuperAdmin && (
            <Select
              placeholder="Chọn schema"
              style={{ width: 100 }}
              value={schema}
              onChange={(value) => handleUpdateSchema(user, value)}
              allowClear
              loading={loading}
              disabled={user.email === currentUser.email}
            >
              {availablePaths.map(path => (
                <Option key={path.path} value={path.path}>
                  {path.path}
                </Option>
              ))}
            </Select>
          )}
        </Space>
      ),
    }] : []),

  (currentUser?.isSuperAdmin || currentUser?.isAdmin) ? {
      title: 'Quyền Admin',
      dataIndex: 'isAdmin',
      key: 'isAdmin',
      width: 150,
      render: (isAdmin, user) => (
        <Space>
          <Tag 
            color={isAdmin ? 'blue' : 'default'}
            icon={isAdmin ? <SafetyCertificateOutlined /> : null}
          >
            {isAdmin ? 'Admin' : 'User'}
          </Tag>
          {( currentUser?.isSuperAdmin) && (
            <Switch
              checked={isAdmin || false}
              onChange={() => handleToggleAdmin(user)}
              size="small"
              loading={loading}
              disabled={user.email === currentUser.email}
            />
          )}
        </Space>
      ),
    } : {},
    // Cột quyền Super Admin - luôn hiển thị nhưng chỉ cho phép sửa nếu là Super Admin
  //   ...(currentUser?.isSuperAdmin ? [{
  //     title: 'Super Admin',
  //     dataIndex: 'isSuperAdmin',
  //     key: 'isSuperAdmin',
  //     width: 150,
  //     render: (isSuperAdmin, user) => (
  //       <Space>
  //         <Tag 
  //           color={isSuperAdmin ? 'purple' : 'default'}
  //           icon={isSuperAdmin ? <CrownOutlined /> : null}
  //         >
  //           {isSuperAdmin ? 'Super Admin' : 'Admin/User'}
  //         </Tag>
  //         {currentUser?.isSuperAdmin && (
  //           <Switch
  //             checked={isSuperAdmin || false}
  //             onChange={() => handleToggleSuperAdmin(user)}
  //             size="small"
  //             loading={loading}
  //             disabled={user.email === currentUser.email}
  //           />
  //         )}
  //       </Space>
  //     ),
  //   }
  // ] : []),
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      // Lọc bỏ currentUser khỏi danh sách được chọn
      const filteredRows = selectedRows.filter(user => user.email !== currentUser.email);
      const filteredKeys = selectedRowKeys.filter(key => key !== currentUser.email);
      
      setSelectedRowKeys(filteredKeys);
      setListUserSelected(filteredRows);
    },
    getCheckboxProps: (record) => ({
      disabled: record.email === currentUser.email, // Disable checkbox cho chính mình
    }),
  };

  // Hàm xử lý click vào dòng để toggle selection
  const handleRowClick = (record) => {
    // Không cho phép chọn chính mình
    if (record.email === currentUser.email) {
      return;
    }

    const isSelected = selectedRowKeys.includes(record.id);
    
    if (selectionType === "radio") {
      // Với radio, chỉ chọn 1 item
      if (!isSelected) {
        setSelectedRowKeys([record.id]);
        setListUserSelected([record]);
      }
    } else {
      // Với checkbox, có thể chọn nhiều item
      if (isSelected) {
        // Bỏ chọn
        const newSelectedKeys = selectedRowKeys.filter(key => key !== record.id);
        const newSelectedRows = listUserSelected.filter(user => user.id !== record.id);
        setSelectedRowKeys(newSelectedKeys);
        setListUserSelected(newSelectedRows);
      } else {
        // Thêm vào danh sách chọn
        setSelectedRowKeys([...selectedRowKeys, record.id]);
        setListUserSelected([...listUserSelected, record]);
      }
    }
  };

  const handleCreateUser = async (values) => {
    try {
      setLoading(true);
      
      // Kiểm tra giới hạn người dùng của schema
      if (currentUser.schema) {
        const selectedSchema = availablePaths.find(path => path.path == currentUser.schema);
        if (selectedSchema && selectedSchema.limit_user) {
          // Đếm số user hiện tại của schema này
          const currentUserCount = listUser.filter(user => user.schema == currentUser.schema).length;
          if (currentUserCount >= selectedSchema.limit_user) {
            showNotification("error", `Workspace "${currentUser.schema}" đã đạt giới hạn tối đa ${selectedSchema.limit_user} người dùng!`);
            return;
          }
        }
      }
      
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
        isEditor: values.isEditor || false,
        isAdmin: values.isAdmin || false,
        isSuperAdmin: values.isSuperAdmin || false,
        schema: values.schema || 'xichtho',
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
        isEditor: values.isEditor || false,
        isAdmin: values.isAdmin || false,
        // isSuperAdmin: values.isSuperAdmin || false,
        // schema: values.schema || null,
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

      // Kiểm tra xem có đang cố gắng xóa chính mình không
      const isDeletingSelf = listUserSelected.some(user => user.email === currentUser.email);
      if (isDeletingSelf) {
        showNotification("error", "Bạn không thể xóa chính mình!");
        setLoadingDelete(false);
        return;
      }

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
            <div className={css.headerLeft}>
              <Radio.Group
                value={selectionType}
                onChange={(e) => setSelectionType(e.target.value)}
              >
                <Radio value="radio">Chọn một</Radio>
                <Radio value="checkbox">Chọn nhiều</Radio>
              </Radio.Group>
              <Search
                placeholder="Tìm kiếm theo tên, email, chức vụ, phòng ban..."
                prefix={<SearchOutlined />}
                style={{ width: 300, marginLeft: 16 }}
                onSearch={handleSearch}
                onChange={handleSearchChange}
                allowClear
                value={searchText}
              />
            </div>
            <div className={css.actions}>
               { currentUser.isAdmin && !currentUser.isSuperAdmin && currentUser.schema && availablePaths.find(path => path.path == currentUser.schema)?.limit_user && (
                  <>
                  <Tag color="default" style={{display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>Số người dùng:</span>
                    <span>{listUser.filter(user => user.schema == currentUser.schema).length}/{availablePaths.find(path => path.path == currentUser.schema)?.limit_user}</span>
                  </Tag>
                  </>
                 )
               }
              <Button
                color="default"
                variant="filled"
                shape='circle'
                icon={<PlusOutlined />}
                iconPosition={"start"}
                onClick={() => setIsModalCreateOpen(true)}
              />
              <Button
                color="default"
                variant="filled"
                shape='circle'
                icon={<EditOutlined />}
                iconPosition={"start"}
                onClick={showModalUpdate}
              />
              <Button
                color="default"
                variant="filled"
                shape='circle'
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
              />
            </div>
          </div>
          <div className={css.table}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredUsers}
              rowSelection={{
                ...rowSelection,
                selectedRowKeys,
                type: selectionType,
              }}
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: 'pointer' }
              })}
              pagination={{
                pageSize: 9,
              }}
              scroll={{ x: 1200 }}
            />
          </div>
        </div>
      </div>

      <CreateUser
        open={isModalCreateOpen}
        onCancel={() => setIsModalCreateOpen(false)}
        onFinish={handleCreateUser}
        loading={loading}
        currentUser={currentUser}
        availablePaths={availablePaths}
      />

      <UpdateUser
        open={isModalUpdateOpen}
        onCancel={() => setIsModalUpdateOpen(false)}
        onFinish={handleUpdateUser}
        loading={loading}
        userSelected={listUserSelected[0]}
        currentUser={currentUser}
        availablePaths={availablePaths}
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
