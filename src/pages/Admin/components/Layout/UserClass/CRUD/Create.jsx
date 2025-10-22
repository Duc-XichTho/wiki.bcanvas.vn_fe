import css from "./Create.module.css";
import React, { useState } from "react";
import { Tag, Input, Button } from "antd";
import Permission from "./Permission";
import TableTransfer from "./TableTransfer";

const Create = () => {
  const [userClassValue, setUserClassValue] = useState("");
  const [listUser, setListUser] = useState([]);
  const [infoUserClass, setInfoUserClass] = useState({});
  const [targetKeys, setTargetKeys] = useState([]);

  const mockTags = ["Giám Đốc", "Trưởng phòng", "Nhân viên"];
  const mockData = Array.from({
    length: 12,
  }).map((_, i) => ({
    key: i.toString(),
    title: `mr.people${i + 1}`,
    department: `department of mr.people${i + 1}`,
    tag: mockTags[i % 3],
  }));
  const columns = [
    {
      dataIndex: "title",
      title: "Name",
    },
    {
      dataIndex: "tag",
      title: "Tag",
      render: (tag) => (
        <Tag
          style={{
            marginInlineEnd: 0,
          }}
          color={
            tag === "Giám Đốc"
              ? "volcano"
              : tag === "Trưởng phòng"
              ? "geekblue"
              : "green"
          }
        >
          {tag}
        </Tag>
      ),
    },
    {
      dataIndex: "department",
      title: "Phòng ban",
    },
  ];

  const filterOption = (input, item) =>
    item.title?.includes(input) || item.tag?.includes(input);

  const onChangeTranfer = (nextTargetKeys) => {
    setTargetKeys(nextTargetKeys);
  };

  return (
    <div className={css.main}>
      <div className={css.container}>
        <div className={css.header}>Tạo User Class</div>

        <div className={css.info}>
          <div className={css.userclassname}>
            <Input
              style={{ width: "45%" }}
              size="large"
              placeholder="Nhập Tên"
            />
          </div>

          <div className={css.tranfer}>
            <TableTransfer
              dataSource={mockData}
              targetKeys={targetKeys}
              showSearch
              showSelectAll={false}
              onChange={onChangeTranfer}
              filterOption={filterOption}
              leftColumns={columns}
              rightColumns={columns}
            />
          </div>

          <div className={css.search}>
            <Input
              style={{ width: "45%" }}
              size="large"
              placeholder="Tìm kiếm"
            />
          </div>

          <div className={css.permission}>
            <Permission />
          </div>
          
        </div>

        <div className={css.footer}>
          <Button type="primary">TẠO MỚI</Button>
          <Button >HỦY BỎ</Button>
        </div>
      </div>
    </div>
  );
};

export default Create;
