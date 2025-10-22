import css from './TaoDonHang.module.css';
import dayjs from 'dayjs';
import { useEffect, useState, useContext } from "react";
import { useParams } from 'react-router-dom';
import { Col, Card, Input, Row, Select, Button, Table, Typography, DatePicker, Space, Divider, Flex, ConfigProvider, Tag, InputNumber, message } from "antd";
import { CheckCircleOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { DeleteIcon } from "../../../icon/IconSVG.js";
import { v4 as uuidv4 } from 'uuid';
import { createDonHang, getDonHangByCode, updateDonHang } from "../../../apis/donHangService";
import { createDonHangDetail, updateDonHangDetail, deleteDonHangDetail } from "../../../apis/donHangDetailService";
import { getAllHangHoa } from "../../../apis/hangHoaService";
import { getAllDuAn } from "../../../apis/duAnService";
import { getAllKhachHang } from "../../../apis/khachHangService";

const { Text } = Typography;
import { MyContext } from "../../../MyContext.jsx";
import { CODE_DH, genCode } from "../../../generalFunction/genCode/genCode.js";
import { getCardDataById } from "../../../apis/cardService";
import { updateCardDetails } from "../SubStep/SubStepItem/Mau/cardUtils.js";
import { updateCard } from "../../../apis/cardService";

const gridStyle = {
  width: '100%',
  padding: '10px',
};

const gridStyle2 = {
  width: '100%',
  padding: '5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const TaoDonHang = () => {
  const { loadData, selectedCompany, currentYear, chainTemplate2Selected, setChainTemplate2Selected } = useContext(MyContext);
  const { idCard } = useParams();
  const codeDonHang = `DH|${idCard}`;
  const codeDonHang2 = genCode(CODE_DH, idCard, currentYear);
  const isTemplatesChain = window.location.href.includes("templates-chain");
  const [dataHangHoa, setDataHangHoa] = useState([]);
  const [dataDuAn, setDataDuAn] = useState([]);
  const [dataKhachHang, setDataKhachHang] = useState([]);
  const [dataTable, setDataTable] = useState([]);
  const [dataTableOld, setDataTableOld] = useState([]);
  const [valueVuViecSelect, setValueVuViecSelect] = useState(null);
  const [valueKhachHangSelect, setValueKhachHangSelect] = useState(null);
  const [valueHinhThucThanhToanSelect, setValueHinhThucThanhToanSelect] = useState(null);
  const [valueNgayDatHang, setValueNgayDatHang] = useState(null);
  const [valueDieuKhoanThanhToanInput, setValueDieuKhoanThanhToanInput] = useState(null);
  const [valueDiaDiemGiaoHangInput, setValueDiaDiemGiaoHangInput] = useState(null);
  const [tienTruocThue, setTienTruocThue] = useState(0);
  const [tienThue, setTienThue] = useState(0);
  const [tienSauThue, setTienSauThue] = useState(0);
  const [dataDonHangByCode, setDataDonHangByCode] = useState(null);

  const fetchDonHangByCode = async () => {
    try {
      const data = await getDonHangByCode(codeDonHang);
      if (data && Object.keys(data).length > 0) {
        setDataDonHangByCode(data);
        setValueNgayDatHang(dayjs(data.ngay_dat_hang, 'DD-MM-YYYY'));
        setValueVuViecSelect(data.code_vu_viec);
        setValueKhachHangSelect(data.code_khach_hang);
        setValueHinhThucThanhToanSelect(data.hinh_thuc_thanh_toan);
        setValueDieuKhoanThanhToanInput(data.dieu_khoan_thanh_toan);
        setValueDiaDiemGiaoHangInput(data.dia_diem_giao_hang);
        setDataTable(data.chi_tiet_don_hang);
        setDataTableOld(data.chi_tiet_don_hang);
        setTienTruocThue(data.tien_truoc_thue || 0);
        setTienThue(data.tien_thue || 0);
        setTienSauThue((Number(data.tien_truoc_thue) || 0) + (Number(data.tien_thue) || 0));
      } else {
        setDataDonHangByCode(null);
        setValueNgayDatHang(null);
        setValueVuViecSelect(null);
        setValueKhachHangSelect(null);
        setValueHinhThucThanhToanSelect(null);
        setValueDieuKhoanThanhToanInput(null);
        setValueDiaDiemGiaoHangInput(null);
        setDataTable([]);
        setDataTableOld([]);
        setTienTruocThue(0);
        setTienThue(0);
        setTienSauThue(0);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllHangHoa = async () => {
    try {
      const data = await getAllHangHoa();
      setDataHangHoa(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllDuAn = async () => {
    try {
      const data = await getAllDuAn();
      setDataDuAn(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllKhachHang = async () => {
    try {
      const data = await getAllKhachHang();
      setDataKhachHang(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchAllHangHoa(),
      fetchAllDuAn(),
      fetchAllKhachHang(),
      fetchDonHangByCode(),
    ])
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    fetchDonHangByCode();
  }, [loadData, codeDonHang]);

  const handleChangeDatePicker = (date) => {
    setValueNgayDatHang(date);
  };

  const handleChangeVuViec = (value) => {
    setValueVuViecSelect(value);
  };

  const handleChangeKhachHang = (value) => {
    setValueKhachHangSelect(value);
  };

  const handleChangeHinhThucThanhToan = (value) => {
    setValueHinhThucThanhToanSelect(value);
  };

  const handleChangeDieuKhoanThanhToan = (e) => {
    setValueDieuKhoanThanhToanInput(e.target.value);
  };

  const handleChangeDiaDiemGiaoHang = (e) => {
    setValueDiaDiemGiaoHangInput(e.target.value);
  }

  const optionsSelectHinhThucThanhToan = [
    { value: 'chuyen_khoan', label: 'Chuyển khoản' },
    { value: 'tien_mat', label: 'Tiền mặt' }
  ];

  const handleAddRow = () => {
    const newRow = {
      id: uuidv4(),
      key: uuidv4(),
      name_hang_hoa: '',
      so_luong: 0,
      gia_ban: 0,
      chiet_khau: 0,
      thue_vat: 0,
      tong_tien: 0,
    };
    setDataTable([...dataTable, newRow]);
  };

  const handleDeleteRow = (record) => {
    const newDataTable = dataTable.filter((item) => item.id !== record.id);
    setDataTable(newDataTable);

    const toanBoTienTruocThue = newDataTable.reduce((acc, item) => acc + (item.so_luong * item.gia_ban - item.chiet_khau), 0);
    const toanBoTienThue = newDataTable.reduce((acc, item) => acc + (item.so_luong * item.gia_ban - item.chiet_khau) * item.thue_vat / 100, 0);
    const toanBoTienSauThue = toanBoTienTruocThue + toanBoTienThue;

    setTienTruocThue(toanBoTienTruocThue);
    setTienThue(toanBoTienThue);
    setTienSauThue(toanBoTienSauThue);
  };

  const updateRowValue = (recordId, field, value) => {
    const newData = dataTable.map((item) => {
      if (item.id === recordId) {
        const updatedItem = { ...item, [field]: value };

        if (field === 'name_hang_hoa') {
          const hangHoa = dataHangHoa.find((hh) => hh.id === value);
          if (hangHoa) {
            updatedItem.id_hang_hoa = hangHoa.id;
            updatedItem.code_hang_hoa = hangHoa.code;
            updatedItem.name_hang_hoa = hangHoa.name;
            updatedItem.gia_ban = Number(hangHoa.gia_ban);
            updatedItem.thue_vat = Number(hangHoa.thue_vat);
          }
        }

        const tienTruocThue = (updatedItem.so_luong * updatedItem.gia_ban - updatedItem.chiet_khau) || 0;
        const tax = tienTruocThue * (updatedItem.thue_vat || 0) / 100;
        updatedItem.tong_tien = tienTruocThue + tax;
        updatedItem.thue_vat_value = tax;

        return updatedItem;
      }
      return item;
    });

    setDataTable(newData);

    const toanBoTienTruocThue = newData.reduce((acc, item) => acc + item.so_luong * item.gia_ban - item.chiet_khau, 0);
    const toanBoTienThue = newData.reduce((acc, item) => acc + (item.so_luong * item.gia_ban - item.chiet_khau) * item.thue_vat / 100, 0);
    const toanBoTienSauThue = toanBoTienTruocThue + toanBoTienThue;

    setTienTruocThue(toanBoTienTruocThue);
    setTienThue(toanBoTienThue);
    setTienSauThue(toanBoTienSauThue);
  };

  const handleCreateDonHang = async () => {
    let idDonHang;
    try {
      idDonHang = uuidv4();
      const data = {
        id: idDonHang,
        code: codeDonHang,
        code2: genCode(CODE_DH, idCard, currentYear),
        ngay_dat_hang: dayjs(valueNgayDatHang).format('DD-MM-YYYY'),
        trang_thai: 'doing',
        code_vu_viec: valueVuViecSelect,
        name_vu_viec: dataDuAn.find((item) => item.code === valueVuViecSelect)?.name,
        code_khach_hang: valueKhachHangSelect,
        name_khach_hang: dataKhachHang.find((item) => item.code === valueKhachHangSelect)?.name,
        tien_truoc_thue: tienTruocThue,
        tien_thue: tienThue,
        hinh_thuc_thanh_toan: valueHinhThucThanhToanSelect,
        dieu_khoan_thanh_toan: valueDieuKhoanThanhToanInput,
        dia_diem_giao_hang: valueDiaDiemGiaoHangInput,
        dinh_kem: null,
        company: selectedCompany
      }
      await createDonHang(data)
      await handleCreateDonHangDetail(idDonHang);
      await fetchDonHangByCode();

      const created_at = dayjs(Date.now()).format('DD-MM-YYYY');
      const dataKhachHangSelect = dataKhachHang.find(({ code }) => code === valueKhachHangSelect);
      const dataKhachHangApi = dataKhachHangSelect
        ? `${dataKhachHangSelect.code} | ${dataKhachHangSelect.name}`
        : "";

      await updateCardDetails(idCard, created_at, tienSauThue, dataKhachHangApi, genCode(CODE_DH, idCard, currentYear));

      setChainTemplate2Selected({
        type: 'chain2',
        data: {
          ...chainTemplate2Selected.data,
          selectedTemplate: {
            ...chainTemplate2Selected.data.selectedTemplate,
            cards: chainTemplate2Selected.data.selectedTemplate.cards.map((item) => item.id == idCard ? { ...item, mo_ta: created_at, so_tien: tienSauThue, mo_ta2: dataKhachHangApi, name: genCode(CODE_DH, idCard, currentYear) } : item)
          }
        }
      });

      message.success("Tạo đơn hàng thành công.");
    } catch (error) {
      console.error("Có lỗi xảy ra handleCreateDonHang:", error);
    }
  }

  const handleCreateDonHangDetail = async (idDonHang) => {
    try {
      const data = dataTable.map((item) => ({
        id: item.id,
        id_don_hang: idDonHang,
        id_hang_hoa: item.id_hang_hoa,
        code_hang_hoa: item.code_hang_hoa,
        name_hang_hoa: item.name_hang_hoa,
        so_luong: item.so_luong,
        gia_ban: item.gia_ban,
        chiet_khau: item.chiet_khau,
        thue_vat: item.thue_vat,
        thue_vat_value: item.thue_vat_value,
        tong_tien: item.tong_tien
      }));

      const createPromises = data.map((record) => createDonHangDetail(record));
      await Promise.all(createPromises);
    } catch (error) {
      console.error("Có lỗi xảy ra handleCreateDonHangDetail:", error);
    }
  };

  const handleUpdateDonHang = async () => {
    try {
      const dataUpdateDonHang = {
        ngay_dat_hang: dayjs(valueNgayDatHang).format('DD-MM-YYYY'),
        code_vu_viec: valueVuViecSelect,
        name_vu_viec: dataDuAn.find((item) => item.code === valueVuViecSelect).name,
        code_khach_hang: valueKhachHangSelect,
        name_khach_hang: dataKhachHang.find((item) => item.code === valueKhachHangSelect).name,
        tien_truoc_thue: tienTruocThue,
        tien_thue: tienThue,
        hinh_thuc_thanh_toan: valueHinhThucThanhToanSelect,
        dieu_khoan_thanh_toan: valueDieuKhoanThanhToanInput,
        dia_diem_giao_hang: valueDiaDiemGiaoHangInput,
        dinh_kem: null,
      }
      await updateDonHang(dataDonHangByCode.id, dataUpdateDonHang)
      await handleUpdateDonHangDetail();
      await fetchDonHangByCode();

      const dataCard = await getCardDataById(idCard);
      const created_at = dataCard.mo_ta
      const dataKhachHangSelect = dataKhachHang.find(({ code }) => code === valueKhachHangSelect);
      const dataKhachHangApi = dataKhachHangSelect
        ? `${dataKhachHangSelect.code} | ${dataKhachHangSelect.name}`
        : "";

      await updateCardDetails(idCard, created_at, tienSauThue, dataKhachHangApi);

      setChainTemplate2Selected({
        type: 'chain2',
        data: {
          ...chainTemplate2Selected.data,
          selectedTemplate: {
            ...chainTemplate2Selected.data.selectedTemplate,
            cards: chainTemplate2Selected.data.selectedTemplate.cards.map((item) => item.id == idCard ? { ...item, mo_ta: created_at, so_tien: tienSauThue, mo_ta2: dataKhachHangApi } : item)
          }
        }
      });

      message.success("Cập nhật thành công.");
    } catch (error) {
      console.error("Có lỗi xảy ra handleUpdateDonHang:", error);
    }
  }

  const handleUpdateDonHangDetail = async () => {
    try {

      const newRows = dataTable.filter((newItem) => !dataTableOld.some((oldItem) => oldItem.id === newItem.id));
      const removeRows = dataTableOld.filter((oldItem) => !dataTable.some((newItem) => newItem.id === oldItem.id));
      const updateRows = dataTable.filter((newItem) => {
        const oldItem = dataTableOld.find((oldItem) => oldItem.id === newItem.id);
        return oldItem && JSON.stringify(oldItem) !== JSON.stringify(newItem);
      })

      for (const item of updateRows) {
        const dataUpdate = {
          id_don_hang: dataDonHangByCode.id,
          id_hang_hoa: item.id_hang_hoa,
          code_hang_hoa: item.code_hang_hoa,
          name_hang_hoa: item.name_hang_hoa,
          so_luong: item.so_luong,
          gia_ban: item.gia_ban,
          chiet_khau: item.chiet_khau,
          thue_vat: item.thue_vat,
          thue_vat_value: item.thue_vat_value,
          tong_tien: item.tong_tien
        }
        await updateDonHangDetail(item.id, dataUpdate);
      }

      for (const item of newRows) {
        const newData = {
          id: item.id,
          id_don_hang: dataDonHangByCode.id,
          id_hang_hoa: item.id_hang_hoa,
          code_hang_hoa: item.code_hang_hoa,
          name_hang_hoa: item.name_hang_hoa,
          so_luong: item.so_luong,
          gia_ban: item.gia_ban,
          chiet_khau: item.chiet_khau,
          thue_vat: item.thue_vat,
          thue_vat_value: item.thue_vat_value,
          tong_tien: item.tong_tien
        };
        await createDonHangDetail(newData);
      }

      for (const item of removeRows) {
        await deleteDonHangDetail(item.id);
      }

    } catch (error) {
      console.error("Có lỗi xảy ra handleUpdateDonHangDetail:", error);
    }
  }

  const handleDuyet = async () => {
    try {
      const dataUpdate = {
        ...dataDonHangByCode,
        trang_thai: 'done'
      }
      await updateDonHang(dataDonHangByCode.id, dataUpdate)
      fetchDonHangByCode()
      await updateCard({ id: idCard, trang_thai: 'Hoàn thành' })
      setChainTemplate2Selected({
        type: 'chain2',
        data: {
          ...chainTemplate2Selected.data,
          selectedTemplate: {
            ...chainTemplate2Selected.data.selectedTemplate,
            cards: chainTemplate2Selected.data.selectedTemplate.cards.map((item) => item.id == idCard ? { ...item, trang_thai: 'Hoàn thành' } : item)
          }
        }
      })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      <Flex vertical  style={{padding: 10}}>
        <h3 style={{marginBottom: 10}} >{codeDonHang2}</h3>
        <Flex vertical gap={15}>
          <Row gutter={16}>
            <Col xs={24} sm={5}>
              <Flex vertical gap={5}>
                <Text>Ngày bán hàng</Text>
                {dataDonHangByCode?.trang_thai === 'done'
                  ? (
                    <ConfigProvider
                      theme={{
                        token: {
                          borderRadiusLG: 0
                        },
                      }}
                    >
                      <Card>
                        <Card.Grid style={gridStyle2}>
                          <Text strong>{dayjs(valueNgayDatHang).format('DD-MM-YYYY')}</Text>
                        </Card.Grid>
                      </Card>
                    </ConfigProvider>
                  ) : (
                    <DatePicker
                      placeholder='Chọn'
                      format={'DD-MM-YYYY'}
                      style={{ width: '100%' }}
                      value={valueNgayDatHang}
                      onChange={handleChangeDatePicker}
                    />
                  )
                }
              </Flex>
            </Col>
            <Col xs={8} sm={8}>
              <Flex vertical gap={5}>
                <Text>Vụ việc</Text>
                {dataDonHangByCode?.trang_thai === 'done'
                  ? (
                    <ConfigProvider
                      theme={{
                        token: {
                          borderRadiusLG: 0
                        },
                      }}
                    >
                      <Card>
                        <Card.Grid style={gridStyle2}>
                          <Space>
                            <Text strong>{valueVuViecSelect} - {dataDuAn.find((item) => item.code === valueVuViecSelect)?.name}</Text>
                          </Space>
                        </Card.Grid>
                      </Card>
                    </ConfigProvider>
                  ) : (
                    <Select
                      placeholder="Chọn"
                      style={{ width: '100%' }}
                      value={valueVuViecSelect}
                      onChange={handleChangeVuViec}
                      options={dataDuAn.map((duAn) => ({
                        label: (
                          <Space>
                            {duAn.code}-{duAn.name}
                          </Space>
                        ),
                        value: duAn.code,
                      }))}
                    />
                  )}
              </Flex>
            </Col>
            <Col xs={8} sm={8}>
              <Flex vertical gap={5}>
                <Text>Khách hàng</Text>
                {dataDonHangByCode?.trang_thai === 'done'
                  ? (
                    <ConfigProvider
                      theme={{
                        token: {
                          borderRadiusLG: 0
                        },
                      }}
                    >
                      <Card>
                        <Card.Grid style={gridStyle2}>
                          <Space>
                            <Text strong>{valueKhachHangSelect} - {dataKhachHang.find((item) => item.code === valueKhachHangSelect)?.name}</Text>
                          </Space>
                        </Card.Grid>
                      </Card>
                    </ConfigProvider>
                  ) : (
                    <Select
                      placeholder="Chọn"
                      style={{ width: '100%' }}
                      value={valueKhachHangSelect}
                      onChange={handleChangeKhachHang}
                      options={dataKhachHang.map((khachHang) => ({
                        label: (
                          <Space>
                            {khachHang.code}-{khachHang.name}
                          </Space>
                        ),
                        value: khachHang.code,
                      }))}
                    />
                  )
                }
              </Flex>
            </Col>
          </Row>
        </Flex>
      </Flex>

      <Flex vertical>
        <Divider orientation="left" orientationMargin="0">
          Điều khoản
        </Divider>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Flex vertical gap={5}>
              <Text>Hình thức thanh toán</Text>
              {dataDonHangByCode?.trang_thai === 'done'
                ? (
                  <ConfigProvider
                    theme={{
                      token: {
                        borderRadiusLG: 0
                      },
                    }}
                  >
                    <Card>
                      <Card.Grid style={gridStyle2}>
                        <Space>
                          <Text strong>{valueHinhThucThanhToanSelect === 'chuyen_khoan' ? 'Chuyển khoản' : 'Tiền mặt'}</Text>
                        </Space>
                      </Card.Grid>
                    </Card>
                  </ConfigProvider>
                )
                : (
                  <Select
                    placeholder="Chọn"
                    style={{ width: '100%' }}
                    value={valueHinhThucThanhToanSelect}
                    onChange={handleChangeHinhThucThanhToan}
                    options={optionsSelectHinhThucThanhToan}
                  />
                )
              }

            </Flex>
          </Col>
          <Col xs={24} sm={8}>
            <Flex vertical gap={5}>
              <Text>Điều khoản thanh toán</Text>
              {dataDonHangByCode?.trang_thai === 'done'
                ? (
                  <ConfigProvider
                    theme={{
                      token: {
                        borderRadiusLG: 0
                      },
                    }}
                  >
                    <Card>
                      <Card.Grid style={{ ...gridStyle2, justifyContent: 'flex-start' }}>
                        <Space>
                          <Text strong>{valueDieuKhoanThanhToanInput}</Text>
                        </Space>
                      </Card.Grid>
                    </Card>
                  </ConfigProvider>
                )
                : (
                  <Input
                    placeholder="Nhập"
                    value={valueDieuKhoanThanhToanInput}
                    onChange={handleChangeDieuKhoanThanhToan}
                    readOnly={dataDonHangByCode?.trang_thai === 'done'}
                  />
                )
              }
            </Flex>
          </Col>
          <Col xs={24} sm={8}>
            <Flex vertical gap={5}>
              <Text>Địa điểm giao hàng</Text>
              {dataDonHangByCode?.trang_thai === 'done'
                ? (
                  <ConfigProvider
                    theme={{
                      token: {
                        borderRadiusLG: 0
                      },
                    }}
                  >
                    <Card>
                      <Card.Grid style={{ ...gridStyle2, justifyContent: 'flex-start' }}>
                        <Space>
                          <Text strong>{valueDiaDiemGiaoHangInput}</Text>
                        </Space>
                      </Card.Grid>
                    </Card>
                  </ConfigProvider>
                )
                : (
                  <Input
                    placeholder="Nhập"
                    value={valueDiaDiemGiaoHangInput}
                    onChange={handleChangeDiaDiemGiaoHang}
                    readOnly={dataDonHangByCode?.trang_thai === 'done'}
                  />
                )
              }
            </Flex>
          </Col>
        </Row>
      </Flex>

      <Flex vertical>
        <Divider orientation="left" orientationMargin="0">
          {dataDonHangByCode?.trang_thai === 'done'
            ? (
              <Text strong>Thông tin hàng hóa</Text>
            )
            : (
              <Button type="dashed" icon={<PlusOutlined />} iconPosition={'start'} onClick={handleAddRow}>Hàng hóa</Button>
            )
          }
        </Divider>

        <Table
          rowKey="id"
          dataSource={dataTable}
          pagination={false}
          style={{ width: '100%' }}
          scroll={{ x: 'max-content', y: 350 }}
          className={css.tableWrapper}
          bordered
        >
          <Table.Column
            key="name_hang_hoa"
            title="Tên hàng hóa"
            dataIndex="name_hang_hoa"
            width="25%"
            render={(text, record) => (
              dataDonHangByCode?.trang_thai === 'done'
                ? (
                  <div className={css.nameHangHoa} title={dataHangHoa.find((item) => item.name == text)?.name}>
                    <span>{dataHangHoa.find((item) => item.name == text)?.code} - {text}</span>
                  </div>
                ) : (
                  <Select
                    placeholder="Chọn"
                    showSearch
                    value={record.name_hang_hoa ? `${record.code_hang_hoa} - ${record.name_hang_hoa}` : null}
                    style={{ width: '100%' }}
                    onChange={(value) => updateRowValue(record.id, 'name_hang_hoa', value)}
                    options={dataHangHoa.map((hanghoa) => ({
                      label: (
                        <Space>
                          {hanghoa.code}-{hanghoa.name}
                        </Space>
                      ),
                      value: hanghoa.id,
                    }))}
                  />
                )
            )}
          />
          <Table.Column
            key="so_luong"
            title="Số lượng"
            dataIndex="so_luong"
            width="10%"
            render={(text, record) => (
              dataDonHangByCode?.trang_thai === 'done'
                ? (
                      <span>{text || 0}</span>
                )
                : (
                  <Input
                    type="number"
                    value={record.so_luong}
                    onChange={(e) => updateRowValue(record.id, 'so_luong', Number(e.target.value))}
                    readOnly={dataDonHangByCode?.trang_thai === 'done'}
                  />
                )
            )}
          />
          <Table.Column
            key="gia_ban"
            title="Giá bán"
            dataIndex="gia_ban"
            width="17.5%"
            render={(text) => (
              <span>{parseInt(text)?.toLocaleString('en-US') || 0}</span>
            )}
          />
          <Table.Column
            key="chiet_khau"
            title="Chiết khấu"
            dataIndex="chiet_khau"
            width="15%"
            render={(text, record) => (
              dataDonHangByCode?.trang_thai === 'done'
                ? (
                      <span>{parseInt(text)?.toLocaleString('en-US') || 0}</span>
                ) : (
                  <InputNumber
                    value={record.chiet_khau}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value?.replace(/,/g, '')}
                    onChange={(value) => updateRowValue(record.id, 'chiet_khau', value)}
                    style={{ width: '100%' }}
                    readOnly={dataDonHangByCode?.trang_thai === 'done'}
                  />
                )
            )}
          />
          <Table.Column
            key="thue_vat"
            title="Thuế (%)"
            dataIndex="thue_vat"
            width="10%"
            render={(text) => (
                <span>{parseInt(text)?.toLocaleString('en-US') || 0}</span>
            )}
          />
          <Table.Column
            key="tong_tien"
            title="Tổng tiền"
            dataIndex="tong_tien"
            width="17.5%"
            render={(text) => (
                <span>{parseInt(text)?.toLocaleString('en-US') || 0}</span>
            )}
          />
          <Table.Column
            title=""
            width="5%"
            render={(text, record) => (
              <Button
                danger
                onClick={() => handleDeleteRow(record)}
                disabled={dataDonHangByCode?.trang_thai === 'done'}
              >
                <img src={DeleteIcon} alt="" />
              </Button>
            )}
          />
        </Table>
      </Flex >

      <Flex vertical>
        <Divider orientation="left" orientationMargin="0">
          Tổng cộng
        </Divider>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Flex vertical gap={5}>
              <Text>Tiền trước thuế</Text>
              <ConfigProvider
                theme={{
                  token: {
                    borderRadiusLG: 0
                  },
                }}
              >
                <Card>
                  <Card.Grid style={gridStyle}>
                    <Text strong>{Number(tienTruocThue).toLocaleString('vi-VN')}</Text>
                  </Card.Grid>
                </Card>
              </ConfigProvider>
            </Flex>
          </Col>
          <Col xs={24} sm={8}>
            <Flex vertical gap={5}>
              <Text>Thuế</Text>
              <ConfigProvider
                theme={{
                  token: {
                    borderRadiusLG: 0
                  },
                }}
              >
                <Card>
                  <Card.Grid style={gridStyle}>
                    <Text strong>{Number(tienThue).toLocaleString('vi-VN')}</Text>
                  </Card.Grid>
                </Card>
              </ConfigProvider>
            </Flex>
          </Col>
          <Col xs={24} sm={8}>
            <Flex vertical gap={5}>
              <Text>Tiền sau thuế</Text>
              <ConfigProvider
                theme={{
                  token: {
                    borderRadiusLG: 0
                  },
                }}
              >
                <Card>
                  <Card.Grid style={gridStyle}>
                    <Text strong>{Number(tienSauThue).toLocaleString('vi-VN')}</Text>
                  </Card.Grid>
                </Card>
              </ConfigProvider>
            </Flex>
          </Col>
        </Row>
      </Flex>

      {
        !isTemplatesChain
          ? (
            <>
              {dataDonHangByCode?.trang_thai !== 'done' && <Divider />}
              <Flex justify={'center'} align={'center'}>
                {!dataDonHangByCode ? (
                  <Button onClick={handleCreateDonHang}>
                    Tạo đơn hàng
                  </Button>
                ) : dataDonHangByCode?.trang_thai === 'doing' ? (
                  <Button onClick={handleUpdateDonHang}>
                    Cập nhật đơn hàng
                  </Button>
                ) : null}
              </Flex>
            </>
          )
          : (<></>)
      }
      <Divider />

      {!dataDonHangByCode
        ? (
          <></>
        )
        : (
          <>
            <Flex justify={'center'} align={'center'}>
              <Button
                type={dataDonHangByCode?.trang_thai === 'doing' ? 'primary' : 'default'}
                onClick={() => handleDuyet()}
                disabled={dataDonHangByCode?.trang_thai === 'done'}
              >
                {dataDonHangByCode?.trang_thai === 'doing' ? 'Duyệt phiếu' : 'Đã duyệt'}
              </Button>
            </Flex>

            <Divider />
          </>
        )
      }

    </>
  );
};

export default TaoDonHang;
