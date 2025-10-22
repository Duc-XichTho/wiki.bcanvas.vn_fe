import css from "./UserClassElement.module.css"
import { useEffect, useState } from 'react'
import {Table, Button, message, Popconfirm, Popover , List , Checkbox , Select} from 'antd';
import {EditOutlined, DeleteOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { UsersRound, Link } from 'lucide-react';
import { API_RESPONSE_CODE } from "../../../../../CONST";
import { deleteUserClass } from "../../../../../apis/userClassService";
import UpdateUserClass from "./CRUD/Update/UpdateUserClass.jsx";
import { getAllUser } from "../../../../../apis/userService";
import './UserClassElement.css';
import { FcDepartment } from "react-icons/fc";
import { FaRegBuilding } from "react-icons/fa";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { getAllSettingGroup } from "../../../../../apisKTQT/settingGroupService";
import { CANVAS_DATA_PACK } from "../../../../../CONST";
import {getAllCompany} from "../../../../../apis/companyService.jsx";

const UserClassElement = ({
  userClassSelected,
  setUserClassSelected,
  fetchAllUserClass,
  setStatusDeleteUserClass,
  setResponseMessageDelete,
}) => {
  const listReportChart = CANVAS_DATA_PACK.filter((item) => item.isPermission === true && item.group === false);
  const [dataKenh, setDataKenh] = useState([]);
  const [dataCty, setDataCty] = useState([]);
  const [dataUnit, setDataUnit] = useState([]);
  const [dataKHUnit, setDataKHUnit] = useState([]);
  const [dataProduct, setDataProduct] = useState([]);
  const [dataProject, setDataProject] = useState([]);

  const [userAccess, setUserAccess] = useState([])
  const [messageApi, contextHolder] = message.useMessage();
  const [showUpdateUserClass, setShowUpdateUserClass] = useState(false);
  const [statusUpdateUserClass, setStatusUpdateUserClass] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [listUser, setListUser] = useState([]);
  const [listCompany, setListCompany] = useState([]);

  const [companyOptions, setCompanyOptions] = useState([{ id: 'all', label: 'Hợp nhất', name: 'Hợp nhất', icon: <FcDepartment /> }])

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function fetchCompany() {
    let listCompany = await getAllCompany();
    let rs = []
    listCompany.filter((item) => {
      rs.push({
        id: item.code,
        label: item.name,
        icon: <FcDepartment />,
        ...item
      })
    });
    setDataCty([...rs, ...companyOptions])
  }
  const fetchAllSettingGroup = async () => {
    try {
      const data = await getAllSettingGroup();
      const valueFilter = ['kmf', 'kh_kmf', 'kmns'];

      const filteredData = data.filter((e) =>
        !valueFilter.some((keyword) => e.type.includes(keyword))
      );

      const result = {
        kenh: filteredData.filter((e) => e.type === 'kenh'),
        unit: filteredData.filter((e) => e.type === 'unit'),
        kh_unit: filteredData.filter((e) => e.type === 'kh_unit'),
        product: filteredData.filter((e) => e.type === 'product'),
        project: filteredData.filter((e) => e.type === 'project'),
      };
      setDataKenh(result.kenh);
      setDataUnit(result.unit);
      setDataKHUnit(result.kh_unit);
      setDataProduct(result.product);
      setDataProject(result.project);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin:', error);
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
    { id: 'all', label: 'Toàn bộ', icon: <FcDepartment /> },
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
                  pageSize: 5,
                }}
              />

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

            {/*<div className={css.chainAccess}>*/}
            {/*  <div className={css.titleChainAccess}>*/}
            {/*    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>*/}
            {/*      <FaRegBuilding />*/}
            {/*      <span>Công ty</span>*/}
            {/*    </div>*/}

            {/*  </div>*/}
            {/*  <div className={css.valueChainAccess}>*/}
            {/*    {userClassSelected?.company ? (*/}
            {/*      (() => {*/}
            {/*        const option = checkboxOptions.find((opt) => opt.id === userClassSelected.company);*/}
            {/*        if (option) {*/}
            {/*          return (*/}
            {/*            <div className="checkbox2" key={option.id}>*/}
            {/*              <label className="checkbox-wrapper2">*/}
            {/*                <span className="checkbox-tile2">*/}
            {/*                  <span className="checkbox-icon2">{option.icon}</span>*/}
            {/*                  <span className="checkbox-label2">{option.label}</span>*/}
            {/*                </span>*/}
            {/*              </label>*/}
            {/*            </div>*/}
            {/*          );*/}
            {/*        }*/}
            {/*        return null;*/}
            {/*      })()*/}
            {/*    ) : (*/}
            {/*      <div>Chưa có công ty</div>*/}
            {/*    )}*/}
            {/*  </div>*/}
            {/*</div>*/}

            {/*<div className={css.chainAccess}>*/}
            {/*  <div className={css.titleChainAccess}>*/}
            {/*    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>*/}
            {/*      <HiOutlineDocumentReport />*/}
            {/*      <span>Báo Cáo - Chart</span>*/}
            {/*    </div>*/}

            {/*  </div>*/}
            {/*  <div className={css.valueChainAccess}>*/}
            {/*    <div className={css.reportChartSelectWrap}>*/}
            {/*      {listReportChart.filter((item) => userClassSelected.reportChart.includes(item.value)).length > 0 ? (*/}
            {/*        listReportChart*/}
            {/*          .filter((item) => userClassSelected.reportChart.includes(item.value))*/}
            {/*          .map((item) => (*/}
            {/*            <article key={item.id} title={item.name}>*/}
            {/*              <input id={item.id} />*/}
            {/*              <div>*/}
            {/*                <span className={css.nameData}>{item.name}</span>*/}
            {/*              </div>*/}
            {/*            </article>*/}
            {/*          ))*/}
            {/*      ) : (*/}
            {/*        <div>Chưa cấp quyền</div>*/}
            {/*      )}*/}
            {/*    </div>*/}
            {/*  </div>*/}
            {/*</div>*/}

            {/*<div className={css.chainAccess}>*/}
            {/*  <div className={css.titleChainAccess}>*/}
            {/*    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>*/}
            {/*      <HiOutlineDocumentReport />*/}
            {/*      <span>Phân quyền dữ liệu báo cáo</span>*/}
            {/*    </div>*/}


            {/*  </div>*/}
            {/*  <div className={css.valueChainAccess}>*/}
            {/*    <div className={css.reportChartGroupSelect}>*/}
            {/*      <div className={css.reportChartGroupSub}>*/}
            {/*        <div className={css.reportChartGroupSubCheckAll}>*/}
            {/*          <Button>Công ty</Button>*/}
            {/*        </div>*/}
            {/*        <div className={css.reportChartGroupSubWrap}>*/}
            {/*          {*/}
            {/*            userClassSelected?.reportChartGroup?.cty?.length > 0 ? (*/}
            {/*              dataCty*/}
            {/*                .filter((cty) => userClassSelected.reportChartGroup.cty.includes(cty.id))*/}
            {/*                .map((cty) => (*/}
            {/*                  <article key={cty.id} title={cty.name}>*/}
            {/*                    <input*/}
            {/*                      id={cty.id}*/}
            {/*                    />*/}
            {/*                    <div>*/}
            {/*                      <span className={css.nameData}>*/}
            {/*                        {cty.name}*/}
            {/*                      </span>*/}
            {/*                    </div>*/}
            {/*                  </article>*/}
            {/*                ))*/}
            {/*            ) : (*/}
            {/*              <div>Chưa cấp quyền</div>*/}
            {/*            )*/}
            {/*          }*/}
            {/*        </div>*/}
            {/*      </div>*/}
            {/*      <div className={css.reportChartGroupSub}>*/}
            {/*        <div className={css.reportChartGroupSubCheckAll}>*/}
            {/*          <Button>Kênh</Button>*/}
            {/*        </div>*/}
            {/*        <div className={css.reportChartGroupSubWrap}>*/}
            {/*          {*/}
            {/*            userClassSelected?.reportChartGroup?.kenh?.length > 0 ? (*/}
            {/*              dataKenh*/}
            {/*                .filter((kenh) => userClassSelected.reportChartGroup.kenh.includes(kenh.id))*/}
            {/*                .map((kenh) => (*/}
            {/*                  <article key={kenh.id} title={kenh.name}>*/}
            {/*                    <input*/}
            {/*                      id={kenh.id}*/}
            {/*                    />*/}
            {/*                    <div>*/}
            {/*                      <span className={css.nameData}>*/}
            {/*                        {kenh.name}*/}
            {/*                      </span>*/}
            {/*                    </div>*/}
            {/*                  </article>*/}
            {/*                ))*/}
            {/*            ) : (*/}
            {/*              <div>Chưa cấp quyền</div>*/}
            {/*            )*/}
            {/*          }*/}
            {/*        </div>*/}
            {/*      </div>*/}

            {/*      <div className={css.reportChartGroupSub}>*/}
            {/*        <div className={css.reportChartGroupSubCheckAll}>*/}
            {/*          <Button >Đơn vị</Button>*/}
            {/*        </div>*/}
            {/*        <div className={css.reportChartGroupSubWrap}>*/}
            {/*          {*/}
            {/*            userClassSelected?.reportChartGroup?.unit?.length > 0 ? (*/}
            {/*              dataUnit*/}
            {/*                .filter((unit) => userClassSelected.reportChartGroup.unit.includes(unit.id))*/}
            {/*                .map((unit) => (*/}
            {/*                  <article key={unit.id} title={unit.name}>*/}
            {/*                    <input*/}
            {/*                      id={unit.id}*/}
            {/*                    />*/}
            {/*                    <div>*/}
            {/*                      <span className={css.nameData}>*/}
            {/*                        {unit.name}*/}
            {/*                      </span>*/}
            {/*                    </div>*/}
            {/*                  </article>*/}
            {/*                ))*/}
            {/*            ) : (*/}
            {/*              <div>Chưa cấp quyền</div>*/}
            {/*            )*/}
            {/*          }*/}
            {/*        </div>*/}
            {/*      </div>*/}

            {/*      <div className={css.reportChartGroupSub}>*/}
            {/*        <div className={css.reportChartGroupSubCheckAll}>*/}
            {/*          <Button  >Kế hoạch đơn vị</Button>*/}
            {/*        </div>*/}
            {/*        <div className={css.reportChartGroupSubWrap}>*/}
            {/*          {*/}
            {/*            userClassSelected?.reportChartGroup?.kh_unit?.length > 0 ? (*/}
            {/*              dataKHUnit*/}
            {/*                .filter((kh_unit) => userClassSelected.reportChartGroup.kh_unit.includes(kh_unit.id))*/}
            {/*                .map((kh_unit) => (*/}
            {/*                  <article key={kh_unit.id} title={kh_unit.name}>*/}
            {/*                    <input*/}
            {/*                      id={kh_unit.id}*/}
            {/*                    />*/}
            {/*                    <div>*/}
            {/*                      <span className={css.nameData}>*/}
            {/*                        {kh_unit.name}*/}
            {/*                      </span>*/}
            {/*                    </div>*/}
            {/*                  </article>*/}
            {/*                ))*/}
            {/*            ) : (*/}
            {/*              <div>Chưa cấp quyền</div>*/}
            {/*            )*/}
            {/*          }*/}
            {/*        </div>*/}
            {/*      </div>*/}

            {/*      <div className={css.reportChartGroupSub}>*/}
            {/*        <div className={css.reportChartGroupSubCheckAll}>*/}
            {/*          <Button  >Sản phẩm</Button>*/}
            {/*        </div>*/}
            {/*        <div className={css.reportChartGroupSubWrap}>*/}
            {/*          {*/}
            {/*            userClassSelected?.reportChartGroup?.product?.length > 0 ? (*/}
            {/*              dataProduct*/}
            {/*                .filter((product) => userClassSelected.reportChartGroup.product.includes(product.id))*/}
            {/*                .map((product) => (*/}
            {/*                  <article key={product.id} title={product.name}>*/}
            {/*                    <input*/}
            {/*                      id={product.id}*/}
            {/*                    />*/}
            {/*                    <div>*/}
            {/*                      <span className={css.nameData}>*/}
            {/*                        {product.name}*/}
            {/*                      </span>*/}
            {/*                    </div>*/}
            {/*                  </article>*/}
            {/*                ))*/}
            {/*            ) : (*/}
            {/*              <div>Chưa cấp quyền</div>*/}
            {/*            )*/}
            {/*          }*/}
            {/*        </div>*/}
            {/*      </div>*/}

            {/*      <div className={css.reportChartGroupSub}>*/}
            {/*        <div className={css.reportChartGroupSubCheckAll}>*/}
            {/*          <Button  >Vụ việc</Button>*/}
            {/*        </div>*/}
            {/*        <div className={css.reportChartGroupSubWrap}>*/}
            {/*          {*/}
            {/*            userClassSelected?.reportChartGroup?.project?.length > 0 ? (*/}
            {/*              dataProject*/}
            {/*                .filter((project) => userClassSelected.reportChartGroup.project.includes(project.id))*/}
            {/*                .map((project) => (*/}
            {/*                  <article key={project.id} title={project.name}>*/}
            {/*                    <input*/}
            {/*                      id={project.id}*/}
            {/*                    />*/}
            {/*                    <div>*/}
            {/*                      <span className={css.nameData}>*/}
            {/*                        {project.name}*/}
            {/*                      </span>*/}
            {/*                    </div>*/}
            {/*                  </article>*/}
            {/*                ))*/}
            {/*            ) : (*/}
            {/*              <div>Chưa cấp quyền</div>*/}
            {/*            )*/}
            {/*          }*/}
            {/*        </div>*/}
            {/*      </div>*/}

            {/*    </div>*/}
            {/*  </div>*/}
            {/*</div>*/}

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
