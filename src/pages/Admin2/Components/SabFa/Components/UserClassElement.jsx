import css from "./UserClassElement.module.css"
import { useEffect, useState } from 'react'
import { Table, Checkbox, Button, message, Popconfirm } from 'antd';
import { CaretRightOutlined, CaretDownOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getAllChainTemplateStepSubStep } from '../../../../../apis/chainService.jsx';
import { UsersRound, Link } from 'lucide-react';
import { API_RESPONSE_CODE } from "../../../../../CONST";
import { deleteUserClass } from "../../../../../apis/userClassService";
import UpdateUserClass from "./CRUD/Update/UpdateUserClass.jsx";
import { FileSearch, FilePen, FilePlus2, FileMinus2, FileCheck2, Check } from 'lucide-react';
import { getAllUser } from "../../../../../apis/userService";
import {FcEditImage, FcViewDetails} from "react-icons/fc";
import { getAllCompany } from '../../../../../apis/companyService.jsx';

const UserClassElement = ({
  userClassSelected,
  setUserClassSelected,
  fetchAllUserClass,
  setStatusDeleteUserClass,
  setResponseMessageDelete,
}) => {
  const [userAccess, setUserAccess] = useState([])
  const [dataChain, setDataChain] = useState([]);
  const [checkedChainAndChild, setCheckedChainAndChild] = useState({
    chain: [],
    template: [],
    step: [],
    subStep: []
  });
  const [expandedNodes, setExpandedNodes] = useState({});
  const [messageApi, contextHolder] = message.useMessage();
  const [showUpdateUserClass, setShowUpdateUserClass] = useState(false);
  const [statusUpdateUserClass, setStatusUpdateUserClass] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [listUser, setListUser] = useState([]);
  const [listCompany, setListCompany] = useState([]);
  const checkboxOptions = [
    {id: 'view', label: 'Xem', icon: <FcViewDetails/>},
    {id: 'edit', label: 'Sửa', icon: <FcEditImage/>},
  ];
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

  const fetchAllChainTemplateStepSubStep = async () => {
    try {
      const response = await getAllChainTemplateStepSubStep();
      setDataChain(response.result);
    } catch (error) {
      console.log("Error:", error);
    }
  }

  const fetchAllCompany = async () => {
    try {
      const response = await getAllCompany();
      setListCompany(response);
    } catch (error) {
      console.log("Error:", error);
    }
  }

  useEffect(() => {
    fetchAllUser();
    fetchAllChainTemplateStepSubStep();
    fetchAllCompany();
  }, []);

  useEffect(() => {
    if (statusUpdateUserClass) {
      showNotification("success", responseMessage);
      setStatusUpdateUserClass(false);
    }
  }, [statusUpdateUserClass, responseMessage]);

  useEffect(() => {
    if (userClassSelected) {
      setCheckedChainAndChild({
        chain: userClassSelected?.chainAccess,
        template: userClassSelected?.templateAccess,
        step: userClassSelected?.stepAccess,
        subStep: userClassSelected?.subStepAccess
      })
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

  const renderCheckboxGroup = (level, id) => {
    const findNode = (array, nodeId) => array.find((item) => item.id === nodeId);
    const node = findNode(checkedChainAndChild[level], id);
    const permissions = node?.permissions || {};

    return (
      <div className={css.checkboxGroup}>
        <Checkbox checked={permissions.read} disabled={!(permissions.read)}><FileSearch size={20} /></Checkbox>
        <Checkbox checked={permissions.create} disabled={!(permissions.create)}><FilePlus2 size={20} /></Checkbox>
        <Checkbox checked={permissions.update} disabled={!(permissions.update)}><FilePen size={20} /></Checkbox>
        <Checkbox checked={permissions.delete} disabled={!(permissions.delete)}><FileMinus2 size={20} /></Checkbox>
        <Checkbox checked={permissions.confirm} disabled={!(permissions.confirm)}><FileCheck2 size={20} /></Checkbox>
        <Checkbox checked={permissions.approve1} disabled={!(permissions.approve1)}><img src="/Approve1.svg" alt="" width={20} height={20} /></Checkbox>
        <Checkbox checked={permissions.approve2} disabled={!(permissions.approve2)}><img src="/Approve2.svg" alt="" width={20} height={20} /></Checkbox>
      </div>
    );
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const isChainVisible = (chain) => {
    const checkSubSteps = (subSteps) => {
      return subSteps.some(subStep => {
        const permissions = checkedChainAndChild.subStep.find(item => item.id === subStep.id)?.permissions || {};
        return Object.values(permissions).some(isChecked => isChecked);
      });
    };

    const checkSteps = (steps) => {
      return steps.some(step => {
        return checkSubSteps(step.subSteps)
      })
    }

    const checkTemplates = (templates) => {
      return templates.some(template => {
        return checkSteps(template.steps)
      })
    }

    return checkTemplates(chain.templates);
  };

  const renderTreeNode = (node, level, depth = 0) => {
    const nodeId = node.id;
    const isExpanded = expandedNodes[nodeId];
    const hasChildren =
      level !== "subStep" &&
      node[
        level === "chain"
          ? "templates"
          : level === "template"
            ? "steps"
            : "subSteps"
      ]?.length > 0;

    return (
      <div
        key={nodeId}
        className={css.treeNode}
        style={{ marginLeft: `${depth * 8}px` }}
      >
        <div className={css.nodeHeader}>
          {hasChildren && (
            <span className={css.expandIcon} onClick={() => toggleNode(nodeId)}>
              {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
            </span>
          )}
          <span className={css.nodeName}>{node.name}</span>
          {renderCheckboxGroup(level, nodeId)}
        </div>

        {hasChildren && isExpanded && (
          <div className={css.nodeChildren}>
            {level === "chain" &&
              node.templates.map((template) =>
                renderTreeNode(template, "template", depth + 1)
              )}
            {level === "template" &&
              node.steps.map((step) => renderTreeNode(step, "step", depth + 1))}
            {level === "step" &&
              node.subSteps.map((subStep) =>
                renderTreeNode(subStep, "subStep", depth + 1)
              )}
          </div>
        )}
      </div>
    );
  };

  const chuThichRender = [
    { icon: <FileSearch size={20} />, label: "Xem" },
    { icon: <FilePlus2 size={20} />, label: "Tạo" },
    { icon: <FilePen size={20} />, label: "Sửa" },
    { icon: <FileMinus2 size={20} />, label: "Xóa" },
    { icon: <FileCheck2 size={20} />, label: "Xác nhận" },
    { icon: <img src="/Approve1.svg" alt="" width={20} height={20} />, label: "Duyệt 1" },
    { icon: <img src="/Approve2.svg" alt="" width={20} height={20} />, label: "Duyệt 2" },
  ]

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
                <UsersRound/>
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
                <div style={{display: "flex", gap: "5px", alignItems: "center"}}>
                  <Link/>
                  <span>Dữ liệu công ty</span>
                </div>
              </div>
              <div className={css.valueChainAccess}>
                {userClassSelected?.info && userClassSelected.info.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {userClassSelected.info.map((code) => {
                      if (code === 'HQ') {
                        return (
                          <div className="checkbox2" key={code}>
                            <label className="checkbox-wrapper2">
                              <span className="checkbox-tile2">
                                <span className="checkbox-label2">HQ</span>
                              </span>
                            </label>
                          </div>
                        );
                      }
                      const company = listCompany?.find(company => company.code === code);
                      return (
                        <div className="checkbox2" key={code}>
                          <label className="checkbox-wrapper2">
                            <span className="checkbox-tile2">
                              <span className="checkbox-label2">
                                {company?.name || code}
                              </span>
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
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
