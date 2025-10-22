import React from "react";
import { Table, Typography } from "antd";

const { Title } = Typography;

const dataSource = [
  {
    key: "1",
    name: "Nguyễn Văn A",
    age: 28,
    address: "Hà Nội",
  },
  {
    key: "2",
    name: "Trần Thị B",
    age: 32,
    address: "Đà Nẵng",
  },
  {
    key: "3",
    name: "Lê Văn C",
    age: 24,
    address: "TP. Hồ Chí Minh",
  },
  {
    key: "4",
    name: "Phạm Thị D",
    age: 30,
    address: "Cần Thơ",
  },
];


const columns = [
  {
    title: "Tên",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Tuổi",
    dataIndex: "age",
    key: "age",
    responsive: ["sm"],
  },
  {
    title: "Địa chỉ",
    dataIndex: "address",
    key: "address",
  },
];

const Child1 = () => {
  return (
    <div style={{ width: "100%", height: "100%", padding: "16px" }}>
      <Title level={3} style={{ textAlign: "center", marginBottom: "16px" }}>
        Bảng dữ liệu
      </Title>
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={{ pageSize: 5 }}
        scroll={{ x: "max-content" }}
        bordered
        style={{ width: "100%" }}
      />
    </div>
  );
};


export default Child1