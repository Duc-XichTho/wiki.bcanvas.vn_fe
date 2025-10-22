import css from "./UserClassElement.module.css"
import { useEffect, useState } from 'react'
import {Table, Button, message, Popconfirm, Popover , List} from 'antd';
import {EditOutlined, DeleteOutlined, QuestionCircleOutlined} from "@ant-design/icons";
import { UsersRound } from 'lucide-react';
import { API_RESPONSE_CODE } from "../../../../../CONST.js";
import { getAllUser } from "../../../../../apis/userService.jsx";
import './UserClassElement.css';
import { FcDepartment } from "react-icons/fc";
import { FaRegBuilding } from "react-icons/fa";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { getAllSettingGroup } from "../../../../../apisKTQT/settingGroupService.jsx";
import { CANVAS_DATA_PACK } from "../../../../../CONST.js";
import {getAllCompany} from "../../../../../apis/companyService.jsx";
import {getAllUserClass} from "../../../../../apis/userClassService.jsx";
import {getAllFileNotePad} from "../../../../../apis/fileNotePadService.jsx";
import { log } from "mathjs";
import { Card , Avatar, Descriptions} from 'antd';
const { Meta } = Card;

const UserElement = ({
  userSelected,
  setUserSelected,
  fetchAllUserClass,
}) => {
  const listReportChart = CANVAS_DATA_PACK.filter((item) => item.isPermission === true && item.group === false);
  const [dataKenh, setDataKenh] = useState([]);
  const [dataCty, setDataCty] = useState([]);
  const [dataUnit, setDataUnit] = useState([]);
  const [dataKHUnit, setDataKHUnit] = useState([]);
  const [dataProduct, setDataProduct] = useState([]);
  const [dataProject, setDataProject] = useState([]);
  const [fileNotes, setFileNotes] = useState({
    fileUpload: [],
    kpi: [],
    template: []
  });

  const [userAccess, setUserAccess] = useState([])
  const [messageApi, contextHolder] = message.useMessage();
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [listUser, setListUser] = useState([]);
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

  const fetchFileNote = async () => {
    const fileNote = await getAllFileNotePad();
    const categorizedNotes = {
      fileUpload: fileNote.filter(note => note.table === 'FileUpLoad' &&
        note.userClass.some(uc => userClasses.map(c => c.id).includes(uc))),
      kpi: fileNote.filter(note => note.table === 'KPI' &&
        note.userClass.some(uc => userClasses.map(c => c.id).includes(uc))),
      template: fileNote.filter(note => note.table === 'Template' &&
        note.userClass.some(uc => userClasses.map(c => c.id).includes(uc)))
    };
    setFileNotes(categorizedNotes);
  };

useEffect(() => {
  fetchAllSettingGroup();
  fetchCompany();
  if (userSelected?.id) {
    fetchFileNote();
  }
}, [userSelected]);



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
    if (userSelected) {

    }
  }, [userSelected])

  useEffect(() => {
    if (userSelected?.userAccess?.length > 0 && listUser?.length > 0) {
      const additionalUserAccess = userSelected.userAccess.map(email =>
        listUser.find(user => user.email === email)
      );
      setUserAccess(additionalUserAccess);
    }
  }, [userSelected, listUser]);

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

  // Add new state for user classes
  const [userClasses, setUserClasses] = useState([]);

  // Function to get unique permissions across user classes
  const getUniquePermissions = (type) => {
    if (!userClasses || userClasses.length === 0) return [];
    return [...new Set(userClasses.flatMap(userClass =>
      userClass.reportChartGroup?.[type] || []
    ))];
  };

  // Add effect to fetch user classes for the selected user
  useEffect(() => {
    const fetchUserClasses = async () => {
      if (userSelected?.email) {
        try {
          const response = await getAllUserClass();
          console.log(response)
          const userClassList = response.filter(userClass =>
            userClass.userAccess?.includes(userSelected.email) &&
            userClass.module === 'CANVAS'
          );
          setUserClasses(userClassList);
        } catch (error) {
          console.error("Error fetching user classes:", error);
        }
      }
    };

    fetchUserClasses();
  }, [userSelected]);

  // Add effect to get unique report chart permissions
  const [uniqueReportCharts, setUniqueReportCharts] = useState([]);

  useEffect(() => {
    if (userClasses.length > 0) {
      const allReportCharts = userClasses.flatMap(userClass =>
        userClass.reportChart || []
      );
      setUniqueReportCharts([...new Set(allReportCharts)]);
    }
  }, [userClasses]);

  return (
    <>
      {contextHolder}
      <div className={css.main}>
        <div className={css.container}>
          <div className={css.header}>
            <div className={css.headerTitle}>
              <span>Thông tin User</span>
            </div>
            <div className={css.userName}>
              <span>{userSelected?.name}</span>
            </div>
          </div>

          <div className={css.body}>
            {/* User Basic Info */}


  {/* Style 2: Compact Table */}
  <Table
    showHeader={false}
    pagination={false}
    dataSource={[
      {
        key: 'basic',
        label: 'Thông tin cơ bản',
        value: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Avatar size={64} src={userSelected?.picture} />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{userSelected?.name}</div>
              <div style={{ color: '#1890ff' }}>{userSelected?.email}</div>
            </div>
          </div>
        )
      },
      {
        key: 'position',
        label: 'Chức vụ',
        value: userSelected?.info?.position?.label || "Chưa có chức vụ"
      },
      {
        key: 'department',
        label: 'Phòng ban',
        value: userSelected?.info?.department?.label || "Chưa có phòng ban"
      }
    ]}
    columns={[
      {
        title: 'Label',
        dataIndex: 'label',
        key: 'label',
        width: '150px',
        render: (text) => <strong>{text}</strong>
      },
      {
        title: 'Value',
        dataIndex: 'value',
        key: 'value'
      }
    ]}
  />


            {/* User Classes List */}
            <div className={css.chainAccess}>
              <div className={css.titleChainAccess}>
                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                  <UsersRound />
                  <span>Nhóm người dùng</span>
                </div>
              </div>
              <div className={css.valueChainAccess}>
                {userClasses.length > 0 ? (
                  <List
                    dataSource={userClasses}
                    renderItem={(userClass) => (
                      <List.Item>
                        <span>{userClass.name}</span>
                      </List.Item>
                    )}
                  />
                ) : (
                  <div>Chưa được gán vào nhóm người dùng nào</div>
                )}
              </div>
            </div>

{/*            /!* Report Charts Access *!/*/}
{/*            <div className={css.chainAccess}>*/}
{/*              <div className={css.titleChainAccess}>*/}
{/*                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>*/}
{/*                  <HiOutlineDocumentReport />*/}
{/*                  <span>Báo Cáo - Chart</span>*/}
{/*                </div>*/}
{/*              </div>*/}
{/*              <div className={css.valueChainAccess}>*/}
{/*                <div className={css.reportChartSelectWrap}>*/}
{/*                  {uniqueReportCharts.length > 0 ? (*/}
{/*                    listReportChart*/}
{/*                      .filter(item => uniqueReportCharts.includes(item.value))*/}
{/*                      .map(item => (*/}
{/*                        <article key={item.id} title={item.name}>*/}
{/*                          <div>*/}
{/*                            <span className={css.nameData}>{item.name}</span>*/}
{/*                          </div>*/}
{/*                        </article>*/}
{/*                      ))*/}
{/*                  ) : (*/}
{/*                    <div>Chưa được cấp quyền báo cáo</div>*/}
{/*                  )}*/}
{/*                </div>*/}
{/*              </div>*/}
{/*            </div>*/}

{/*            /!* Data Access Permissions *!/*/}
{/*            <div className={css.chainAccess}>*/}
{/*              <div className={css.titleChainAccess}>*/}
{/*                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>*/}
{/*                  <HiOutlineDocumentReport />*/}
{/*                  <span>Phân quyền dữ liệu báo cáo</span>*/}
{/*                </div>*/}
{/*              </div>*/}
{/*              <div className={css.valueChainAccess}>*/}
{/*                <div className={css.reportChartGroupSelect}>*/}
{/*                  /!* Companies *!/*/}
{/*                  <div className={css.reportChartGroupSub}>*/}
{/*                    <div className={css.reportChartGroupSubCheckAll}>*/}
{/*                      <Button>Công ty</Button>*/}
{/*                    </div>*/}
{/*                    <div className={css.reportChartGroupSubWrap}>*/}
{/*                      {dataCty*/}
{/*                        .filter(cty => getUniquePermissions('cty').includes(cty.id))*/}
{/*                        .map(cty => (*/}
{/*                          <article key={cty.id} title={cty.name}>*/}
{/*                            <div>*/}
{/*                              <span className={css.nameData}>{cty.name}</span>*/}
{/*                            </div>*/}
{/*                          </article>*/}
{/*                        ))}*/}
{/*                    </div>*/}
{/*                  </div>*/}

{/*                */}
{/*  /!* Channels *!/*/}
{/*  <div className={css.reportChartGroupSub}>*/}
{/*    <div className={css.reportChartGroupSubCheckAll}>*/}
{/*      <Button>Kênh</Button>*/}
{/*    </div>*/}
{/*    <div className={css.reportChartGroupSubWrap}>*/}
{/*      {dataKenh*/}
{/*        .filter(kenh => getUniquePermissions('kenh').includes(kenh.id))*/}
{/*        .map(kenh => (*/}
{/*          <article key={kenh.id} title={kenh.name}>*/}
{/*            <div>*/}
{/*              <span className={css.nameData}>{kenh.name}</span>*/}
{/*            </div>*/}
{/*          </article>*/}
{/*        ))}*/}
{/*    </div>*/}
{/*  </div>*/}

{/*  /!* Units *!/*/}
{/*  <div className={css.reportChartGroupSub}>*/}
{/*    <div className={css.reportChartGroupSubCheckAll}>*/}
{/*      <Button>Đơn vị</Button>*/}
{/*    </div>*/}
{/*    <div className={css.reportChartGroupSubWrap}>*/}
{/*      {dataUnit*/}
{/*        .filter(unit => getUniquePermissions('unit').includes(unit.id))*/}
{/*        .map(unit => (*/}
{/*          <article key={unit.id} title={unit.name}>*/}
{/*            <div>*/}
{/*              <span className={css.nameData}>{unit.name}</span>*/}
{/*            </div>*/}
{/*          </article>*/}
{/*        ))}*/}
{/*    </div>*/}
{/*  </div>*/}

{/*  /!* Products *!/*/}
{/*  <div className={css.reportChartGroupSub}>*/}
{/*    <div className={css.reportChartGroupSubCheckAll}>*/}
{/*      <Button>Sản phẩm</Button>*/}
{/*    </div>*/}
{/*    <div className={css.reportChartGroupSubWrap}>*/}
{/*      {dataProduct*/}
{/*        .filter(product => getUniquePermissions('product').includes(product.id))*/}
{/*        .map(product => (*/}
{/*          <article key={product.id} title={product.name}>*/}
{/*            <div>*/}
{/*              <span className={css.nameData}>{product.name}</span>*/}
{/*            </div>*/}
{/*          </article>*/}
{/*        ))}*/}
{/*    </div>*/}
{/*  </div>*/}


{/*  /!* Projects *!/*/}
{/*  <div className={css.reportChartGroupSub}>*/}
{/*    <div className={css.reportChartGroupSubCheckAll}>*/}
{/*      <Button>Vụ việc</Button>*/}
{/*    </div>*/}
{/*    <div className={css.reportChartGroupSubWrap}>*/}
{/*      {dataProject*/}
{/*        .filter(project => getUniquePermissions('project').includes(project.id))*/}
{/*        .map(project => (*/}
{/*          <article key={project.id} title={project.name}>*/}
{/*            <div>*/}
{/*              <span className={css.nameData}>{project.name}</span>*/}
{/*            </div>*/}
{/*          </article>*/}
{/*        ))}*/}
{/*    </div>*/}
{/*  </div>*/}
{/*  */}
{/*                </div>*/}
{/*                /!* Add new sections after Data Access Permissions *!/*/}
{/*/!* File Upload Section *!/*/}
{/*<div className={css.chainAccess}>*/}
{/*  <div className={css.titleChainAccess}>*/}
{/*    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>*/}
{/*      <HiOutlineDocumentReport />*/}
{/*      <span>File Upload</span>*/}
{/*    </div>*/}
{/*  </div>*/}
{/*  <div className={css.valueChainAccess}>*/}
{/*    <div className={css.reportChartSelectWrap}>*/}
{/*      {fileNotes.fileUpload.length > 0 ? (*/}
{/*        fileNotes.fileUpload.map(file => (*/}
{/*          <article key={file.id} title={file.name}>*/}
{/*            <div>*/}
{/*              <span className={css.nameData}>{file.name}</span>*/}
{/*            </div>*/}
{/*          </article>*/}
{/*        ))*/}
{/*      ) : (*/}
{/*        <div>Chưa được cấp quyền file upload</div>*/}
{/*      )}*/}
{/*    </div>*/}
{/*  </div>*/}
{/*</div>*/}

{/*/!* KPI Section *!/*/}
{/*<div className={css.chainAccess}>*/}
{/*  <div className={css.titleChainAccess}>*/}
{/*    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>*/}
{/*      <HiOutlineDocumentReport />*/}
{/*      <span>KPI</span>*/}
{/*    </div>*/}
{/*  </div>*/}
{/*  <div className={css.valueChainAccess}>*/}
{/*    <div className={css.reportChartSelectWrap}>*/}
{/*      {fileNotes.kpi.length > 0 ? (*/}
{/*        fileNotes.kpi.map(kpi => (*/}
{/*          <article key={kpi.id} title={kpi.name}>*/}
{/*            <div>*/}
{/*              <span className={css.nameData}>{kpi.name}</span>*/}
{/*            </div>*/}
{/*          </article>*/}
{/*        ))*/}
{/*      ) : (*/}
{/*        <div>Chưa được cấp quyền KPI</div>*/}
{/*      )}*/}
{/*    </div>*/}
{/*  </div>*/}
{/*</div>*/}

{/*/!* Template Section *!/*/}
{/*<div className={css.chainAccess}>*/}
{/*  <div className={css.titleChainAccess}>*/}
{/*    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>*/}
{/*      <HiOutlineDocumentReport />*/}
{/*      <span>Template</span>*/}
{/*    </div>*/}
{/*  </div>*/}
{/*  <div className={css.valueChainAccess}>*/}
{/*    <div className={css.reportChartSelectWrap}>*/}
{/*      {fileNotes.template.length > 0 ? (*/}
{/*        fileNotes.template.map(template => (*/}
{/*          <article key={template.id} title={template.name}>*/}
{/*            <div>*/}
{/*              <span className={css.nameData}>{template.name}</span>*/}
{/*            </div>*/}
{/*          </article>*/}
{/*        ))*/}
{/*      ) : (*/}
{/*        <div>Chưa được cấp quyền template</div>*/}
{/*      )}*/}
{/*    </div>*/}
{/*  </div>*/}
{/*</div>*/}
{/*              </div>*/}
{/*            </div>*/}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserElement;
