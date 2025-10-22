import * as React from "react";
import { useEffect, useState } from "react";
import { Modal, Table, Checkbox, Button, message } from 'antd';
import { getSettingByType, updateSetting } from "../../../apis/settingService.jsx";

const CauHinhPPTGT = ({ showCauHinhPPTGT, setShowCauHinhPPTGT }) => {
  const [dataSettingPPTGT, setDataSettingPPTGT] = useState({});
  const [checkedData, setCheckedData] = useState([]);

  const fetchSettingPPTGT = async () => {
    try {
      const data = await getSettingByType('PhuongPhapTinhGiaThanh');
      setDataSettingPPTGT(data);
      if (data?.setting) {
        const initialCheckedData = data.setting.reduce((acc, item) => {
          acc[item.code] = { ...item.thoigian };
          return acc;
        }, {});
        setCheckedData(initialCheckedData);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin:', error);
    }
  };

  useEffect(() => {
    fetchSettingPPTGT();
  }, [showCauHinhPPTGT]);

  const handleSaveSetting = async () => {
    try {
      const updatedSettings = dataSettingPPTGT.setting.map(item => ({
        ...item,
        thoigian: checkedData[item.code] || item.thoigian,
      }));

      const payload = {
        id: dataSettingPPTGT.id,
        type: dataSettingPPTGT.type,
        setting: updatedSettings,
      };
      await updateSetting(payload);
      setShowCauHinhPPTGT(false);
      message.success('Cài đặt thành công');
    } catch (error) {
      console.error('Lỗi khi lưu dữ liệu:', error);
    }
  };

  const handleCheckboxChange = (key, month) => {
    setCheckedData(prevState => ({
      ...prevState,
      [key]: {
        ...prevState[key],
        [month]: !prevState[key][month],
      },
    }));
  };

  const columns = [
    {
      title: 'Phương pháp',
      dataIndex: 'phuongphap',
      key: 'phuongphap',
      width: '20%',
    },
    {
      title: 'Giải thích',
      dataIndex: 'giaithich',
      key: 'giaithich',
      width: '20%',
    },
    ...Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        title: `T${i + 1}`,
        dataIndex: month,
        key: month,
        width: '5%',
        render: (_, record) => (
          <Checkbox
            checked={checkedData[record.key]?.[month] || false}
            onChange={() => handleCheckboxChange(record.key, month)}
          />
        ),
      };
    }),
  ];

  const tableData = dataSettingPPTGT?.setting?.map(item => ({
    key: item.code,
    phuongphap: item.phuongphap,
    giaithich: item.giaithich,
  }));


  return (
    <Modal
      title="Cấu Hình Phương Pháp Tính Giá Thành"
      centered
      open={showCauHinhPPTGT}
      onCancel={() => setShowCauHinhPPTGT(false)}
      footer={
        <Button type="primary" onClick={handleSaveSetting}>Lưu lại</Button>
      }
      width='75%'
    >
      <Table
        columns={columns}
        dataSource={tableData}
        rowKey="key"
        pagination={false}
      />
    </Modal>
  )
}

export default CauHinhPPTGT