import css from './TableTransferUser.module.css';
import { useState, useEffect } from 'react';
import { Table, Transfer, Skeleton, message, Tag } from 'antd';
import { API_RESPONSE_CODE } from '../../../../../../CONST';
import { getAllUser } from '../../../../../../apis/userService';

const CustomTableTransfer = (props) => {
  const { leftColumns, rightColumns, ...restProps } = props;

  return (
    <Transfer
      titles={[<Tag color="geekblue">Danh sách khả dụng</Tag>, <Tag color="cyan">Danh sách đã chọn</Tag>]}
      selectAllLabels={[
        ({ selectedCount, totalCount }) => (
          <span>
            Đã chọn {selectedCount} trong {totalCount}&nbsp;
            <Tag color="geekblue">Nhân viên</Tag>
          </span>
        ), ({ selectedCount, totalCount }) => (
          <span>
            Đã chọn {selectedCount} trong {totalCount}&nbsp;
            <Tag color="cyan">Nhân viên</Tag>
          </span>
        )
      ]}
      style={{
        width: '100%',
      }}
      {...restProps}
    >
      {({
        direction,
        filteredItems,
        onItemSelect,
        onItemSelectAll,
        selectedKeys: listSelectedKeys,
        disabled: listDisabled,
      }) => {
        const columns = direction === 'left' ? leftColumns : rightColumns;
        const rowSelection = {
          getCheckboxProps: () => ({
            disabled: listDisabled,
          }),
          onChange(selectedRowKeys) {
            onItemSelectAll(selectedRowKeys, 'replace');
          },
          selectedRowKeys: listSelectedKeys,
          selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
        };
        return (
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredItems}
            size="small"
            style={{
              pointerEvents: listDisabled ? 'none' : undefined,
            }}
            onRow={({ key, disabled: itemDisabled }) => ({
              onClick: () => {
                if (itemDisabled || listDisabled) {
                  return;
                }
                onItemSelect(key, !listSelectedKeys.includes(key));
              },
            })}
            pagination={{
              pageSize: 8,
            }}
          />
        );
      }}
    </Transfer>
  );
};

const TableTransferUser = ({ targetKeys, setTargetKeys }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [listUser, setListUser] = useState([]);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const showNotification = (type, content) => {
    messageApi.open({
      type,
      content,
    });
  };

  const fetchAllUser = async () => {
    try {
      setShowSkeleton(true);
      const response = await getAllUser();
      await delay(2000);
      switch (response.code) {
        case API_RESPONSE_CODE.SUCCESS:
          setListUser(response.result);
          break;
        case API_RESPONSE_CODE.NOT_FOUND:
          showNotification("warning", response.message);
          setListUser([]);
          break;
        default:
          showNotification("error", "Có lỗi xảy ra khi lấy dữ liệu User");
          setListUser([]);
          break;
      }
    } catch (error) {
      console.log(error);
      showNotification("error", "Không thể tải danh sách người dùng");
    } finally {
      setShowSkeleton(false);
    }
  };

  useEffect(() => {
    fetchAllUser();
  }, []);

  const dataTable = listUser.map((user) => ({
    key: user.email,
    name: user.name,
    email: user.email,
    picture: user.picture,
    info: {
      position: user.info?.position,
      department: user.info?.department
    }
  }));

  const columns = [
    {
      dataIndex: 'info',
      title: 'Thông tin',
      render: (_, record) => (
        <div className={css.userInfo}>
          <img src={record.picture} alt={record.name} className={css.userAvatar} />
          <div className={css.userDetails}>
            <div className={css.userName}>{record.name}</div>
            <div className={css.userEmail}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      width: '25%',
      dataIndex: 'position',
      title: 'Chức vụ',
      render: (_, record) => record.info.position?.label || "Chưa có",
    },
    {
      width: '25%',
      dataIndex: 'department',
      title: 'Phòng ban',
      render: (_, record) => record.info.department?.label || "Chưa có",
    },
  ];

  const filterOption = (input, item) => item.title?.includes(input) || item.tag?.includes(input);

  const onChange = (nextTargetKeys) => {
    setTargetKeys(nextTargetKeys);
  };

  return (
    <>
      {contextHolder}
      {showSkeleton
        ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexDirection: "column" }}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton.Button key={index} size="small" block active shape="round" />
            ))}
            <div style={{ width: "100%", display: "flex", justifyContent: "spaceBetween", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <Skeleton.Button size="small" block active shape="round" />
              </div>
              <div style={{ width: "maxContent", display: "flex", alignItems: "center" }}>
                <span>Đang lấy dữ liệu Nhân viên</span>
              </div>
              <div style={{ flex: 1 }}>
                <Skeleton.Button size="small" block active shape="round" />
              </div>
            </div>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton.Button key={index} size="small" block active shape="round" />
            ))}
          </div>
        )
        : (
          <CustomTableTransfer
            dataSource={dataTable}
            targetKeys={targetKeys}
            showSearch
            showSelectAll={false}
            onChange={onChange}
            filterOption={filterOption}
            leftColumns={columns}
            rightColumns={columns}
          />
        )
      }
    </>
  );
};
export default TableTransferUser;
