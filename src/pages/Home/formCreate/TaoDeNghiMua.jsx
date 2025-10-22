import css from './TaoDeNghiMua.module.css';
import dayjs from 'dayjs';
import { useEffect, useState, useContext } from "react";
import { useParams } from 'react-router-dom';
import { Col, Card, Input, Row, Select, Button, Table, Typography, DatePicker, Space, Divider, Flex, ConfigProvider, Tag, InputNumber, message } from "antd";
import { CheckCircleOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { DeleteIcon } from "../../../icon/IconSVG.js";
import { v4 as uuidv4 } from 'uuid';
import { createDonMuaHang, getDonMuaHangByCode, updateDonMuaHang } from "../../../apis/donMuaHangService";
import { createDonMuaHangDetail, updateDonMuaHangDetail, deleteDonMuaHangDetail } from "../../../apis/donMuaHangDetailService";
import { getAllBusinessUnit } from "../../../apis/businessUnitService";
import { getAllNhanVien } from "../../../apis/nhanVienService";
import { getAllHangHoa } from "../../../apis/hangHoaService";
import { getAllDuAn } from "../../../apis/duAnService";
import { getAllKmf } from "../../../apis/kmfService";
import { getAllKmtc } from "../../../apis/kmtcService";

const { Text } = Typography;
import { MyContext } from "../../../MyContext.jsx";
import { CODE_DH, CODE_DNM, genCode } from "../../../generalFunction/genCode/genCode.js";
import { getCardDataById } from "../../../apis/cardService";
import { updateCard } from "../../../apis/cardService";
import { updateCardDetails } from "../SubStep/SubStepItem/Mau/cardUtils.js";

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

const TaoDeNghiMua = () => {
  const { loadData, selectedCompany, currentYear, chainTemplate2Selected, setChainTemplate2Selected, setLoadData } = useContext(MyContext);
  const { idCard } = useParams();
  const codeDonMuaHang = `DH|${idCard}`;
  const codeDonMuaHang2 = genCode(CODE_DNM, idCard, currentYear);
  const isTemplatesChain = window.location.href.includes("templates-chain");
  const [dataBusinessUnit, setDataBusinessUnit] = useState([]);
  const [dataNhanVien, setDataNhanVien] = useState([]);
  const [dataHangHoa, setDataHangHoa] = useState([]);
  const [dataVuViec, setDataVuViec] = useState([]);
  const [dataKmf, setDataKmf] = useState([]);
  const [dataKmns, setDataKmns] = useState([]);
  const [dataTable, setDataTable] = useState([]);
  const [dataTableOld, setDataTableOld] = useState([]);
  const [valueBoPhanDeNghiSelect, setValueBoPhanDeNghiSelect] = useState(null);
  const [valueNhanVienSelect, setValueNhanVienSelect] = useState(null);
  const [valueNgayMuaHang, setValueNgayMuaHang] = useState(null);
  const [valueDienGiaiInput, setValueDienGiaiInput] = useState(null);
  const [tienTruocThue, setTienTruocThue] = useState(0);
  const [tienThue, setTienThue] = useState(0);
  const [tienSauThue, setTienSauThue] = useState(0);
  const [dataDonMuaHangByCode, setDataDonMuaHangByCode] = useState(null);

  const fetchData = async (APIFunciton, setDataAPI, errorMessageAPI) => {
    try {
      const data = await APIFunciton();
      setDataAPI(data);
    } catch (error) {
      console.error(errorMessageAPI, error);
    }
  };

  const fetchDonMuaHangByCode = async () => {
    try {
      const data = await getDonMuaHangByCode(codeDonMuaHang);
      if (data && Object.keys(data).length > 0) {
        setDataDonMuaHangByCode(data);
        setValueNgayMuaHang(dayjs(data.ngay_mua_hang, 'DD-MM-YYYY'));
        setValueBoPhanDeNghiSelect(data.code_bo_phan_de_nghi);
        setValueNhanVienSelect(data.code_nhan_vien);
        setValueDienGiaiInput(data.dien_giai || '');
        setDataTable(data.chi_tiet_don_mua_hang);
        setDataTableOld(data.chi_tiet_don_mua_hang);
        setTienTruocThue(data.tien_truoc_thue || 0);
        setTienThue(data.tien_thue || 0);
        setTienSauThue((Number(data.tien_truoc_thue) || 0) + (Number(data.tien_thue) || 0));
      } else {
        setDataDonMuaHangByCode(null);
        setValueNgayMuaHang(null);
        setValueBoPhanDeNghiSelect(null);
        setValueNhanVienSelect(null);
        setValueDienGiaiInput(null);
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

  useEffect(() => {
    Promise.all([
      fetchData(getAllBusinessUnit, setDataBusinessUnit, "Error fetching Business Unit"),
      fetchData(getAllNhanVien, setDataNhanVien, "Error fetching Nhan Vien"),
      fetchData(getAllHangHoa, setDataHangHoa, "Error fetching Hang Hoa"),
      fetchData(getAllDuAn, setDataVuViec, "Error fetching Du An"),
      fetchData(getAllKmf, setDataKmf, "Error fetching Kmf"),
      fetchData(getAllKmtc, setDataKmns, "Error fetching Kmtc"),
      fetchDonMuaHangByCode(),
    ]).catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    fetchDonMuaHangByCode();
  }, [loadData, codeDonMuaHang]);

  const handleChangeBoPhanDeNghiSelect = (value) => {
    setValueBoPhanDeNghiSelect(value);
  };

  const handleChangeNhanVienSelect = (value) => {
    setValueNhanVienSelect(value);
  };

  const handleChangeNgayMuaHang = (date) => {
    setValueNgayMuaHang(date);
  };

  const handleChangeDienGiaiInput = (e) => {
    setValueDienGiaiInput(e.target.value);
  };

  const handleAddRow = () => {
    const newRow = {
      id: uuidv4(),
      key: uuidv4(),
      name_hang_hoa: "",
      so_luong: 0,
      gia_ban: 0,
      name_kmf: "",
      name_kmns: "",
      name_vu_viec: "",
      thue_vat: 0,
      tong_tien: 0,
    };
    setDataTable([...dataTable, newRow]);
  }

  const handleDeleteRow = (record) => {
    const newDataTable = dataTable.filter((item) => item.id !== record.id);
    setDataTable(newDataTable);

    const toanBoTienTruocThue = newDataTable.reduce((acc, item) => acc + item.so_luong * item.gia_ban, 0);
    const toanBoTienThue = newDataTable.reduce((acc, item) => acc + item.so_luong * item.gia_ban * item.thue_vat / 100, 0);
    const toanBoTienSauThue = toanBoTienTruocThue + toanBoTienThue;

    setTienTruocThue(toanBoTienTruocThue);
    setTienThue(toanBoTienThue);
    setTienSauThue(toanBoTienSauThue);
  }

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
          }
        }

        if (field === 'name_kmf') {
          const kmf = dataKmf.find((kmf) => kmf.id === value);
          if (kmf) {
            updatedItem.code_kmf = kmf.code;
            updatedItem.name_kmf = kmf.name;
          }
        }

        if (field === 'name_kmns') {
          const kmtc = dataKmns.find((kmtc) => kmtc.id === value);
          if (kmtc) {
            updatedItem.code_kmns = kmtc.code;
            updatedItem.name_kmns = kmtc.name;
          }
        }

        if (field === 'name_vu_viec') {
          const vuViec = dataVuViec.find((vv) => vv.id === value);
          if (vuViec) {
            updatedItem.code_vu_viec = vuViec.code;
            updatedItem.name_vu_viec = vuViec.name;
          }
        }

        const tienTruocThue = updatedItem.so_luong * (updatedItem.gia_ban || 0);
        const tax = tienTruocThue * (updatedItem.thue_vat || 0) / 100;
        updatedItem.tien_truoc_thue = tienTruocThue;
        updatedItem.thue_vat_value = tax;
        updatedItem.tong_tien = tienTruocThue + tax;

        return updatedItem;
      }
      return item;
    });

    setDataTable(newData);

    const toanBoTienTruocThue = newData.reduce((acc, item) => acc + item.so_luong * item.gia_ban, 0);
    const toanBoTienThue = newData.reduce((acc, item) => acc + item.so_luong * item.gia_ban * item.thue_vat / 100, 0);
    const toanBoTienSauThue = toanBoTienTruocThue + toanBoTienThue;

    setTienTruocThue(toanBoTienTruocThue);
    setTienThue(toanBoTienThue);
    setTienSauThue(toanBoTienSauThue);
  }

  const handleCreateDonMuaHang = async () => {
    let idDonMuaHang;
    try {
      idDonMuaHang = uuidv4();
      const data = {
        id: idDonMuaHang,
        code2: genCode(CODE_DNM, idCard, currentYear),
        code: codeDonMuaHang,
        ngay_mua_hang: dayjs(valueNgayMuaHang).format('DD-MM-YYYY'),
        trang_thai: 'doing',
        code_bo_phan_de_nghi: valueBoPhanDeNghiSelect,
        name_bo_phan_de_nghi: dataBusinessUnit.find((item) => item.code === valueBoPhanDeNghiSelect)?.name,
        code_nhan_vien: valueNhanVienSelect,
        name_nhan_vien: dataNhanVien.find((item) => item.code === valueNhanVienSelect)?.name,
        dien_giai: valueDienGiaiInput,
        tien_truoc_thue: tienTruocThue,
        tien_thue: tienThue,
        dinh_kem: null,
        company: selectedCompany
      }

      await createDonMuaHang(data)
      await handleCreateDonMuaHangDetail(idDonMuaHang);
      await fetchDonMuaHangByCode();

      const created_at = dayjs(Date.now()).format('DD-MM-YYYY');
      const dataBoPhanDeNghiSelect = dataBusinessUnit.find(({code}) => code === valueBoPhanDeNghiSelect)
      const dataBoPhanApi = dataBoPhanDeNghiSelect
      ? `${dataBoPhanDeNghiSelect.code} | ${dataBoPhanDeNghiSelect.name}`
      : ""
      await updateCardDetails(idCard, created_at, tienSauThue, dataBoPhanApi, codeDonMuaHang2);

      setChainTemplate2Selected({
        type: 'chain2',
        data: {
          ...chainTemplate2Selected.data,
          selectedTemplate: {
            ...chainTemplate2Selected.data.selectedTemplate,
            cards: chainTemplate2Selected.data.selectedTemplate.cards.map((item) => item.id == idCard ? { ...item, mo_ta: created_at, so_tien: tienSauThue, mo_ta2: dataBoPhanApi, name: codeDonMuaHang2 } : item)
          }
        }
      });

      setLoadData(!loadData)

      message.success("Tạo Đơn mua hàng thành công.");
    } catch (error) {
      console.error("Có lỗi xảy ra handleCreateDonMuaHang:", error);
    }
  }

  const handleCreateDonMuaHangDetail = async (idDonMuaHang) => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    try {
      const data = dataTable.map((item) => ({
        id: item.id,
        id_don_mua_hang: idDonMuaHang,
        id_hang_hoa: item.id_hang_hoa,
        code_hang_hoa: item.code_hang_hoa,
        name_hang_hoa: item.name_hang_hoa,
        so_luong: item.so_luong,
        gia_ban: item.gia_ban,
        code_kmf: item.code_kmf,
        name_kmf: item.name_kmf,
        code_kmns: item.code_kmns,
        name_kmns: item.name_kmns,
        code_vu_viec: item.code_vu_viec,
        name_vu_viec: item.name_vu_viec,
        thue_vat: item.thue_vat,
        thue_vat_value: item.thue_vat_value,
        tong_tien: item.tong_tien,
        created_at: Date.now(),
      }))

      for (const record of data) {
        await createDonMuaHangDetail(record);
        await delay(10);
      }

      console.log("Tất cả các bản ghi DonMuaHangDetail đã được tạo thành công!");

    } catch (error) {
      console.error("Có lỗi xảy ra handleCreateDonHangDetail:", error);
    }
  }

  const handleUpdateDonMuaHang = async () => {
    try {
      const dataUpdateDonHang = {
        ...dataDonMuaHangByCode,
        ngay_mua_hang: dayjs(valueNgayMuaHang).format('DD-MM-YYYY'),
        code_bo_phan_de_nghi: valueBoPhanDeNghiSelect,
        name_bo_phan_de_nghi: dataBusinessUnit.find((item) => item.code === valueBoPhanDeNghiSelect)?.name,
        code_nhan_vien: valueNhanVienSelect,
        name_nhan_vien: dataNhanVien.find((item) => item.code === valueNhanVienSelect)?.name,
        dien_giai: valueDienGiaiInput,
        tien_truoc_thue: tienTruocThue,
        tien_thue: tienThue,
      }

      await updateDonMuaHang(dataDonMuaHangByCode.id, dataUpdateDonHang);
      await handleUpdateDonMuaHangDetail();
      await fetchDonMuaHangByCode();

      const dataCard = await getCardDataById(idCard);
      const created_at = dataCard.mo_ta
      const dataBoPhanDeNghiSelect = dataBusinessUnit.find(({code}) => code === valueBoPhanDeNghiSelect)
      const dataBoPhanApi = dataBoPhanDeNghiSelect
      ? `${dataBoPhanDeNghiSelect.code} | ${dataBoPhanDeNghiSelect.name}`
      : ""
      await updateCardDetails(idCard, created_at, tienSauThue, dataBoPhanApi);

      setChainTemplate2Selected({
        type: 'chain2',
        data: {
          ...chainTemplate2Selected.data,
          selectedTemplate: {
            ...chainTemplate2Selected.data.selectedTemplate,
            cards: chainTemplate2Selected.data.selectedTemplate.cards.map((item) => item.id == idCard ? { ...item, mo_ta: created_at, so_tien: tienSauThue, mo_ta2: dataBoPhanApi } : item)
          }
        }
      });

      message.success("Cập nhật Đơn mua hàng thành công.");
    } catch (error) {
      console.error("Có lỗi xảy ra handleUpdateDonMuaHang:", error);
    }
  }

  const handleUpdateDonMuaHangDetail = async () => {
    try {
      const newRows = dataTable.filter((newItem) => !dataTableOld.some((oldItem) => oldItem.id === newItem.id));
      const removeRows = dataTableOld.filter((oldItem) => !dataTable.some((newItem) => newItem.id === oldItem.id));
      const updateRows = dataTable.filter((newItem) => {
        const oldItem = dataTableOld.find((oldItem) => oldItem.id === newItem.id);
        return oldItem && JSON.stringify(oldItem) !== JSON.stringify(newItem);
      })

      for (const item of updateRows) {
        const dataUpdate = {
          ...item,
          id_hang_hoa: item.id_hang_hoa,
          code_hang_hoa: item.code_hang_hoa,
          name_hang_hoa: item.name_hang_hoa,
          so_luong: item.so_luong,
          gia_ban: item.gia_ban,
          code_kmf: item.code_kmf,
          name_kmf: item.name_kmf,
          code_kmns: item.code_kmns,
          name_kmns: item.name_kmns,
          code_vu_viec: item.code_vu_viec,
          name_vu_viec: item.name_vu_viec,
          thue_vat: item.thue_vat,
          thue_vat_value: item.thue_vat_value,
          tong_tien: item.tong_tien,
        }
        await updateDonMuaHangDetail(item.id, dataUpdate);
      }

      for (const item of newRows) {
        const newData = {
          id: item.id,
          id_don_mua_hang: dataDonMuaHangByCode.id,
          id_hang_hoa: item.id_hang_hoa,
          code_hang_hoa: item.code_hang_hoa,
          name_hang_hoa: item.name_hang_hoa,
          so_luong: item.so_luong,
          gia_ban: item.gia_ban,
          code_kmf: item.code_kmf,
          name_kmf: item.name_kmf,
          code_kmns: item.code_kmns,
          name_kmns: item.name_kmns,
          code_vu_viec: item.code_vu_viec,
          name_vu_viec: item.name_vu_viec,
          thue_vat: item.thue_vat,
          thue_vat_value: item.thue_vat_value,
          tong_tien: item.tong_tien,
          created_at: Date.now(),
        }
        await createDonMuaHangDetail(newData);
      }

      for (const item of removeRows) {
        await deleteDonMuaHangDetail(item.id);
      }

    } catch (error) {
      console.error("Có lỗi xảy ra handleUpdateDonMuaHangDetail:", error);
    }
  }

  const handleDuyet = async () => {
    try {
      const dataUpdate = {
        ...dataDonMuaHangByCode,
        trang_thai: 'done'
      }
      await updateDonMuaHang(dataDonMuaHangByCode.id, dataUpdate)
      fetchDonMuaHangByCode()
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
        <h3 style={{marginBottom: 10}} >{dataDonMuaHangByCode ? dataDonMuaHangByCode.code2  : codeDonMuaHang2}</h3>
        <Flex vertical gap={15}>
          <Row gutter={16}>
            <Col xs={24} sm={5}>
              <Flex vertical gap={5}>
                <Text>Mã đơn hàng</Text>
                <ConfigProvider
                  theme={{
                    token: {
                      borderRadiusLG: 0
                    },
                  }}
                >
                  <Card>
                    <Card.Grid style={gridStyle2}>
                      <Text strong>{ dataDonMuaHangByCode ? dataDonMuaHangByCode.code2  : codeDonMuaHang2}</Text>
                    </Card.Grid>
                  </Card>
                </ConfigProvider>
              </Flex>
            </Col>
            <Col xs={24} sm={5}>
              <Flex vertical gap={5}>
                <Text>Ngày mua hàng</Text>
                {dataDonMuaHangByCode?.trang_thai === 'done'
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
                          <Text strong>
                            {dayjs(valueNgayMuaHang).isValid() ? dayjs(valueNgayMuaHang).format("DD-MM-YYYY") : "-"}
                          </Text>

                        </Card.Grid>
                      </Card>
                    </ConfigProvider>
                  ) : (
                    <DatePicker
                      placeholder='Chọn'
                      format={'DD-MM-YYYY'}
                      style={{ width: '100%' }}
                      value={dayjs(valueNgayMuaHang).isValid() ? dayjs(valueNgayMuaHang) : null}
                      onChange={handleChangeNgayMuaHang}
                    />
                  )
                }
              </Flex>
            </Col>
            <Col xs={24} sm={8}>
              <Flex vertical gap={5}>
                <Text>Diễn giải</Text>
                {dataDonMuaHangByCode?.trang_thai === 'done'
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
                            <Text strong >
                              {valueDienGiaiInput || "-"}
                            </Text>                          </Space>
                        </Card.Grid>
                      </Card>
                    </ConfigProvider>
                  )
                  : (
                    <Input
                      placeholder="Nhập"
                      value={valueDienGiaiInput}
                      onChange={handleChangeDienGiaiInput}
                      readOnly={dataDonMuaHangByCode?.trang_thai === 'done'}
                    />
                  )
                }
              </Flex>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Flex vertical gap={5}>
                <Text>Bộ phận đề nghị</Text>
                {dataDonMuaHangByCode?.trang_thai === 'done'
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
                          <Text strong>{valueBoPhanDeNghiSelect} - {dataBusinessUnit.find((item) => item.code === valueBoPhanDeNghiSelect)?.name}</Text>
                        </Card.Grid>
                      </Card>
                    </ConfigProvider>
                  ) : (
                    <Select
                      showSearch
                      placeholder="Chọn"
                      style={{ width: '100%' }}
                      value={valueBoPhanDeNghiSelect}
                      onChange={handleChangeBoPhanDeNghiSelect}
                      options={dataBusinessUnit.map(bu => ({
                        label: (
                          <Space>
                            {bu.code}-{bu.name}
                          </Space>
                        ),
                        value: bu.code,
                        name: bu.name,
                      }))}
                      filterOption={(input, option) =>
                        option?.name.toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  )
                }
              </Flex>
            </Col>
            <Col xs={24} sm={12}>
              <Flex vertical gap={5}>
                <Text>Tạo bởi nhân viên</Text>
                {dataDonMuaHangByCode?.trang_thai === 'done'
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
                          <Text strong>{valueNhanVienSelect} - {dataNhanVien.find((item) => item.code === valueNhanVienSelect)?.name}</Text>
                        </Card.Grid>
                      </Card>
                    </ConfigProvider>
                  ) : (
                    <Select
                      showSearch
                      placeholder="Chọn"
                      style={{ width: '100%' }}
                      value={valueNhanVienSelect}
                      onChange={handleChangeNhanVienSelect}
                      options={dataNhanVien.map((nv) => ({
                        label: (
                          <Space>
                            {nv.code}-{nv.name}
                          </Space>
                        ),
                        value: nv.code,
                        name: nv.name,
                      }))}
                      filterOption={(input, option) =>
                        option?.name.toLowerCase().includes(input.toLowerCase())
                      }
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
          {dataDonMuaHangByCode?.trang_thai === 'done'
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
          scroll={{ x: 'max-content', y: 350 }}
          className={css.tableWrapper}
        >
          <Table.Column
            key="name_hang_hoa"
            title="Tên hàng hóa"
            dataIndex="name_hang_hoa"
            width="250px"
            render={(text, record) => (
              dataDonMuaHangByCode?.trang_thai === 'done'
                ? (
                  <Space>
                    <Text strong>{dataHangHoa.find((item) => item.name == text)?.code} - {text}</Text>
                  </Space>
                ) : (
                  <Select
                    placeholder="Chọn"
                    showSearch
                    value={text ? `${record.code_hang_hoa} - ${record.name_hang_hoa}` : null}
                    style={{ width: '100%' }}
                    onChange={(value) => updateRowValue(record.id, 'name_hang_hoa', value)}
                    options={dataHangHoa.map((item) => ({
                      label: (
                        <Space title={`${item.code} - ${item.name}`}>
                          {item.code}-{item.name}
                        </Space>
                      ),
                      value: item.id,
                      name: item.name,
                    }))}
                    filterOption={(input, option) =>
                      option?.name.toLowerCase().includes(input.toLowerCase())
                    }
                  />
                )
            )}
          />
          <Table.Column
            key="name_kmf"
            title="KMF"
            dataIndex="name_kmf"
            width="250px"
            render={(text, record) => (
              dataDonMuaHangByCode?.trang_thai === 'done'
                ? (
                  <Space>
                    <Text strong>{dataKmf.find((item) => item.name == text)?.code} - {text}</Text>
                  </Space>
                ) : (
                  <Select
                    placeholder="Chọn"
                    showSearch
                    value={text ? `${record.code_kmf} - ${record.name_kmf}` : null}
                    style={{ width: '100%' }}
                    onChange={(value) => updateRowValue(record.id, 'name_kmf', value)}
                    options={dataKmf.map((item) => ({
                      label: (
                        <Space title={`${item.code} - ${item.name}`}>
                          {item.code}-{item.name}
                        </Space>
                      ),
                      value: item.id,
                      name: item.name,
                    }))}
                    filterOption={(input, option) =>
                      option?.name.toLowerCase().includes(input.toLowerCase())
                    }
                  />
                )
            )}
          />
          <Table.Column
            key="name_kmns"
            title="KMTC"
            dataIndex="name_kmns"
            width="250px"
            render={(text, record) => (
              dataDonMuaHangByCode?.trang_thai === 'done'
                ? (
                  <Space>
                    <Text strong>{dataKmns.find((item) => item.name == text)?.code} - {text}</Text>
                  </Space>
                ) : (
                  <Select
                    placeholder="Chọn"
                    showSearch
                    value={text ? `${record.code_kmns} - ${record.name_kmns}` : null}
                    style={{ width: '100%' }}
                    onChange={(value) => updateRowValue(record.id, 'name_kmns', value)}
                    options={dataKmns.map((item) => ({
                      label: (
                        <Space title={`${item.code} - ${item.name}`}>
                          {item.code}-{item.name}
                        </Space>
                      ),
                      value: item.id,
                      name: item.name,
                    }))}
                    filterOption={(input, option) =>
                      option?.name.toLowerCase().includes(input.toLowerCase())
                    }
                  />
                )
            )}
          />
          <Table.Column
            key="name_vu_viec"
            title="Vụ việc"
            dataIndex="name_vu_viec"
            width="250px"
            render={(text, record) => (
              dataDonMuaHangByCode?.trang_thai === 'done'
                ? (
                  <Space>
                    <Text strong>{dataVuViec.find((item) => item.name == text)?.code} - {text}</Text>
                  </Space>
                ) : (
                  <Select
                    placeholder="Chọn"
                    showSearch
                    value={text ? `${record.code_vu_viec} - ${record.name_vu_viec}` : null}
                    style={{ width: '100%' }}
                    onChange={(value) => updateRowValue(record.id, 'name_vu_viec', value)}
                    options={dataVuViec.map((item) => ({
                      label: (
                        <Space title={`${item.code} - ${item.name}`}>
                          {item.code}-{item.name}
                        </Space>
                      ),
                      value: item.id,
                      name: item.name,
                    }))}
                    filterOption={(input, option) =>
                      option?.name.toLowerCase().includes(input.toLowerCase())
                    }
                  />
                )
            )}
          />
          <Table.Column
            key="so_luong"
            title="Số lượng"
            dataIndex="so_luong"
            width="120px"
            render={(text, record) => (
              dataDonMuaHangByCode?.trang_thai === 'done'
                ? (
                  <span>{text || 0}</span>
                )
                : (
                  <InputNumber
                    value={record.so_luong}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value?.replace(/,/g, '')}
                    onChange={(value) => updateRowValue(record.id, 'so_luong', value)}
                    style={{ width: '100%' }}
                    readOnly={dataDonMuaHangByCode?.trang_thai === 'done'}
                  />
                )
            )}
          />
          <Table.Column
            key="gia_ban"
            title="Giá bán"
            dataIndex="gia_ban"
            width="180px"
            render={(text, record) => (
              dataDonMuaHangByCode?.trang_thai === 'done'
                ? (
                  <span>{Number(text)?.toLocaleString('vi-VN') || 0}</span>
                ) : (
                  <InputNumber
                    value={record.gia_ban}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value?.replace(/,/g, '')}
                    onChange={(value) => updateRowValue(record.id, 'gia_ban', value)}
                    style={{ width: '100%' }}
                    readOnly={dataDonMuaHangByCode?.trang_thai === 'done'}
                  />
                )
            )}
          />

          <Table.Column
            key="thue_vat"
            title="Thuế (%)"
            dataIndex="thue_vat"
            width="120px"
            render={(text, record) => (
              dataDonMuaHangByCode?.trang_thai === 'done'
                ? (
                  <span>{Number(text)?.toLocaleString('vi-VN') || 0}</span>
                )
                : (
                  <Input
                    type="number"
                    value={record.thue_vat}
                    onChange={(e) => updateRowValue(record.id, 'thue_vat', Number(e.target.value))}
                    readOnly={dataDonMuaHangByCode?.trang_thai === 'done'}
                  />
                )
            )}
          />
          <Table.Column
            key="tong_tien"
            title="Tổng tiền"
            dataIndex="tong_tien"
            width="80px"
            render={(text) => (
              <Space>{Number(text)?.toLocaleString('vi-VN') || 0}</Space>
            )}
          />
          <Table.Column
            title="Actions"
            width="80px"
            render={(text, record) => (
              <Button
                danger
                onClick={() => handleDeleteRow(record)}
                disabled={dataDonMuaHangByCode?.trang_thai === 'done'}
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
              {dataDonMuaHangByCode?.trang_thai !== 'done' && <Divider />}
              <Flex justify={'center'} align={'center'}>
                {!dataDonMuaHangByCode ? (
                  <Button onClick={handleCreateDonMuaHang}>
                    Tạo đơn hàng
                  </Button>
                ) : dataDonMuaHangByCode?.trang_thai === 'doing' ? (
                  <Button onClick={handleUpdateDonMuaHang}>
                    Cập nhật đơn hàng
                  </Button>
                ) : null}
              </Flex>
            </>
          )
          : (<></>)
      }
      <Divider />

      {!dataDonMuaHangByCode
        ? (
          <></>
        )
        : (
          <>
            <Flex justify={'center'} align={'center'}>
              <Button
                type={dataDonMuaHangByCode?.trang_thai === 'doing' ? 'primary' : 'default'}
                onClick={() => handleDuyet()}
                disabled={dataDonMuaHangByCode?.trang_thai === 'done'}
              >
                {dataDonMuaHangByCode?.trang_thai === 'doing' ? 'Duyệt phiếu' : 'Đã duyệt'}
              </Button>
            </Flex>

            <Divider />
          </>
        )
      }
    </>
  )
}

export default TaoDeNghiMua
