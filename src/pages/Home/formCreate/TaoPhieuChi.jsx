import dayjs from 'dayjs';
import React, {useContext, useEffect, useState} from "react";
import {useParams} from 'react-router-dom';
import {
    Col,
    Card,
    Input,
    Row,
    Select,
    Button,
    Table,
    Typography,
    DatePicker,
    Space,
    Divider,
    Flex,
    ConfigProvider,
    Tag,
    InputNumber,
    message, Form
} from "antd";
import {DeleteIcon} from "../../../icon/IconSVG.js";
import {v4 as uuidv4} from 'uuid';
import {createPhieuChi2, getAllPhieuChi2, updatePhieuChi2} from "../../../apis/phieuChi2Service.jsx";
import {createPhieuChi2Detail} from "../../../apis/phieuChi2DetailService.jsx";
import {getAllTamUngNew, updateTamUng} from "../../../apis/tamUngService";
import {formatCurrency} from "../../../generalFunction/format.js";
import {getAllNhanVien, getNhanVienDataById} from "../../../apis/nhanVienService.jsx";
import {MyContext} from "../../../MyContext.jsx";
import {LIST_HINH_THUC_TT, LIST_LOAI_PHIEU_CHI} from "../../../Consts/LIST_LOAI_PHIEU.js";
import {CODE_PC, CODE_PC2, CODE_PTU, genCode} from "../../../generalFunction/genCode/genCode.js";
import {getAllDeNghiThanhToan, getDeNghiThanhToanNew} from "../../../apis/deNghiThanhToanService.jsx";
import {DONE, PENDING} from "../../../Consts/STEP_STATUS.js";
import {updateCardDetails} from "../SubStep/SubStepItem/Mau/cardUtils.js";
import {getSubStepDKIdInCardByType} from "../../../generalFunction/logicMau/logicMau.js";
import {SH, SN} from "../../../Consts/LIST_STEP_TYPE.js";
import {getDinhKhoanProDataByStepId} from "../../../apis/dinhKhoanProService.jsx";
import {createNewDinhKhoanProData} from "../../../apis/dinhKhoanProDataService.jsx";
import styles from "../InvoicePopup/InvoicePopup.module.css";
import css from "./formCreate.module.css";
import PopUpUploadFile from "../../../components/UploadFile/PopUpUploadFile.jsx";
import {PhieuLQ} from "../SubStep/SubStepItem/Mau/PhieuLQ/PhieuLQ.jsx";

const {Text} = Typography;

const gridStyle = {
    width: '100%',
    padding: '10px',
};

const TaoPhieuChi = ({fetchAllPhieuChi}) => {
    const {idCard} = useParams();
    const isTemplatesChain = window.location.href.includes("templates-chain");
    const [dataTable, setDataTable] = useState([]);
    const [dataTamUngLienQuan, setDataTamUngLienQuan] = useState([]);
    const [dataDeNghiLienQuan, setDataDeNghiLienQuan] = useState([]);
    const [dataNhanVien, setDataNhanVien] = useState([]);
    const [valueNgayChi, setValueNgayChi] = useState(null);
    const [valueHinhThuc, setValueHinhThuc] = useState(null);
    const [valueTamUngLienQuan, setValueTamUngLienQuan] = useState([]);
    const [valueDeNghiLienQuan, setValueDeNghiLienQuan] = useState([]);
    const [valueTaiKhoanNhanTien, setValueTaiKhoanNhanTien] = useState(null);
    const [valueTenChuTaiKhoan, setValueTenChuTaiKhoan] = useState(null);
    const [tongTien, setTongTien] = useState(0);
    const [valueLyDo, setValueLyDo] = useState(null);
    const [valueType, setValueType] = useState('PHIEU_CHI');
    const [valueHTTT, setValueHTTT] = useState(null);
    const [valueThanhToanCongNo, setValueThanhToanCongNo] = useState(null);
    const [valueNhanVien, setValueNhanVien] = useState(null);
    const [isOpenPhieuLQ, setIsOpenPhieuLQ] = useState(false);
    const [selectedPhieuCodes, setSelectedPhieuCodes] = useState([]);
    const {
        selectedCompany,
        currentYear,
        setChainTemplate2Selected,
        chainTemplate2Selected,
        setLoadData,
        loadData
    } = useContext(MyContext);
    const fetchData = async (APIFunciton, setDataAPI, errorMessageAPI) => {
        try {
            const data = await APIFunciton();
            setDataAPI(data);
        } catch (error) {
            console.error(errorMessageAPI, error);
        }
    };

    useEffect(() => {
        fetchData(getAllTamUngNew, setDataTamUngLienQuan, "Lỗi khi lấy dữ liệu tạm ứng liên quan");
        fetchData(getDeNghiThanhToanNew, setDataDeNghiLienQuan, "Lỗi khi lấy dữ liệu đề nghị liên quan");
        fetchData(getAllNhanVien, setDataNhanVien, "Lỗi khi lấy dữ liệu nhân viên");
    }, []);

    const handleChangeNgayChi = (data) => {
        setValueNgayChi(data);
    }

    const handleChangeHinhThuc = (e) => {
        setValueHinhThuc(e.target.value);
    }

    const handleChangeTamUngLienQuan = (selectedValues) => {
        setValueDeNghiLienQuan([])
        setValueTamUngLienQuan([selectedValues]);
    };

    const handleChangeDeNghiLienQuan = (selectedValues) => {
        setValueTamUngLienQuan([])
        setValueDeNghiLienQuan([selectedValues]);
    };

    useEffect(() => {
        if (valueTamUngLienQuan && valueTamUngLienQuan.length === 0 && valueDeNghiLienQuan && valueDeNghiLienQuan.length === 0) {
            setDataTable([]);
            setTongTien(0);
        } else if (valueTamUngLienQuan && valueTamUngLienQuan.length > 0) {
            const tamUng = dataTamUngLienQuan.filter((item) => valueTamUngLienQuan.includes(item.id));
            const pushDataTable = tamUng.flatMap((item) => {
                return item.chi_tiet_tam_ung
                    .map((chiTiet) => {
                        return {
                            ...chiTiet,
                            key: uuidv4(),
                        };
                    })
                    .filter((chiTiet) => chiTiet.id_hang_hoa);
            });
            setDataTable(pushDataTable);
            const toanBoTongTien = pushDataTable.reduce((acc, item) => acc + Number(item.tong_tien), 0);
            setTongTien(toanBoTongTien);
        } else if (valueDeNghiLienQuan && valueDeNghiLienQuan.length > 0) {
            const tamUng = dataDeNghiLienQuan.filter((item) => valueDeNghiLienQuan.includes(item.id));
            const danhSachHangHoa = tamUng.flatMap(item =>
                item.danh_sach_hang_hoa.map(hangHoa => ({
                    ...hangHoa,
                    name_hang_hoa: hangHoa.name,
                    code_hang_hoa: hangHoa.code,
                }))
            );
            const tongTien = tamUng.reduce((sum, item) => sum + item.tong_tien, 0);
            setDataTable(danhSachHangHoa);
            setTongTien(tongTien);
        }
    }, [valueTamUngLienQuan, valueDeNghiLienQuan]);


    const handleChangeNhanVien = (value) => {
        setValueNhanVien(value);
    }

    const handleChangeTaiKhoanNhanTien = (e) => {
        setValueTaiKhoanNhanTien(e.target.value);
    }

    const handleChangeTenChuTaiKhoan = (e) => {
        setValueTenChuTaiKhoan(e.target.value);
    }

    const handleChangeLyDo = (e) => {
        setValueLyDo(e.target.value);
    }
    const handleChangeType = (e) => {
        setValueType(e);
    }

    const handleChangeHTTT = (e) => {
        setValueHTTT(e);
    }

    const handleChangeThanhToanCongNo = (e) => {
        setValueThanhToanCongNo(e.target.value);
    }

    const handleDeleteRow = (record) => {
        const newData = dataTable.filter((item) => item.key !== record.key);
        setDataTable(newData);

        const toanBoTongTien = newData.reduce((acc, item) => acc + Number(item.tong_tien), 0);
        setTongTien(toanBoTongTien);
    };

    const updateRowValue = (key, field, value) => {
        const newData = dataTable.map((item) => {
            if (item.key === key) {
                const updatedItem = {...item, [field]: value};

                if (field === 'so_luong') {
                    updatedItem.tong_tien = updatedItem.so_luong * updatedItem.don_gia
                }

                return updatedItem;
            }
            return item;
        });

        const toanBoTongTien = newData.reduce((acc, item) => acc + item.tong_tien, 0);
        setTongTien(toanBoTongTien);
        setDataTable(newData);
    }

    const handleCreatePhieuChi = async () => {
        try {
            const created_at = dayjs(Date.now()).format('DD-MM-YYYY');
            const data = {
                id_card_create: idCard,
                id_nhan_vien: valueNhanVien,
                ngay_chi: dayjs(valueNgayChi).format('DD-MM-YYYY'),
                hinh_thuc: valueHinhThuc,
                tam_ung_lien_quan: valueTamUngLienQuan,
                de_nghi_lien_quan: valueDeNghiLienQuan,
                ten_chu_tai_khoan: valueTenChuTaiKhoan,
                tai_khoan_nhan_tien: valueTaiKhoanNhanTien,
                so_tien: tongTien,
                ly_do: valueLyDo,
                type: valueType,
                thanh_toan_cong_no: valueThanhToanCongNo,
                created_at: created_at,
                company: selectedCompany,
                phieu_lq: selectedPhieuCodes,
            }
            const requestCreate = await createPhieuChi2(data)
            await handleCreatePhieuChiDetail(requestCreate.data.id)
            if (valueType === 'UN_CHI') {
                requestCreate.data.code = genCode(CODE_PC2, requestCreate.data.id, currentYear);
            } else {
                requestCreate.data.code = genCode(CODE_PC, requestCreate.data.id, currentYear);
            }
            await updatePhieuChi2(requestCreate.data.id, requestCreate.data);
            await handleChangeStatus(PENDING, requestCreate.data)
            message.success("Tạo Phiếu thành công.");
            fetchAllPhieuChi();
            setLoadData(!loadData)
        } catch (error) {
            console.error("Có lỗi xảy ra handleCreatePhieuChi:", error);
        }
    }

    const handleCreatePhieuChiDetail = async (idPhieuChi) => {
        try {
            const data = dataTable.map((item) => {
                return {
                    id_phieu_chi: idPhieuChi,
                    id_hang_hoa: item.id_hang_hoa,
                    code_hang_hoa: item.code_hang_hoa,
                    name_hang_hoa: item.name_hang_hoa,
                    so_luong: item.so_luong,
                    gia_ban: item.don_gia,
                    tong_tien: item.tong_tien,
                    created_at: Date.now(),
                    tien_nguyen_te: item.tien_nguyen_te,
                    ty_gia: item.ty_gia,
                    tong_tien_nguyen_te: item.tong_tien_nguyen_te,
                }
            })
            for (let i = 0; i < data.length; i++) {
                data[i].created_at = Date.now() + i;
                await createPhieuChi2Detail(data[i])
            }
        } catch (error) {
            console.error("Có lỗi xảy ra handleCreatePhieuChiDetail:", error);
        } finally {
            setValueNgayChi(null);
            setValueHinhThuc(null);
            setValueTamUngLienQuan([]);
            setValueTaiKhoanNhanTien(null);
            setValueTenChuTaiKhoan(null);
            setValueLyDo(null);
            setValueThanhToanCongNo(null);
            setDataTable([]);
            setTongTien(0);
        }
    }

    async function handleChangeStatus(status, phieu) {

        let data = await getAllPhieuChi2()
        let pc = data.find((item) => item.id == phieu.id);

        if (pc) {
            await updatePhieuChi2(pc.id, {...pc, trang_thai: status})
            if (status === PENDING) {

                await updateCardDetails(idCard, pc.created_at, pc.so_tien, pc.ly_do, pc.code, selectedPhieuCodes)
                setChainTemplate2Selected({
                    type: 'chain2',
                    data: {
                        ...chainTemplate2Selected.data,
                        selectedTemplate: {
                            ...chainTemplate2Selected.data.selectedTemplate,
                            cards: chainTemplate2Selected.data.selectedTemplate.cards.map((item) => item.id == idCard ? {
                                ...item,
                                mo_ta: pc.created_at,
                                so_tien: pc.so_tien,
                                mo_ta2: pc.ly_do,
                                name: pc.code,
                                phieu_lq: selectedPhieuCodes,
                            } : item)
                        }
                    }
                })
                message.success("Đã xác nhận");

            }
        }

    }

    const [showNgoaiTe, setShowNgoaiTe] = useState(false);


    return (
        <>
            <Flex vertical>
                <Divider orientation="left" orientationMargin="0">
                    <h3 style={{fontSize : '16px'}}>Tạo mới</h3>
                </Divider>
                <Flex vertical gap={15}>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={5}>
                                <Text>Ngày chi</Text>
                                <DatePicker
                                    placeholder="Chọn"
                                    format="DD-MM-YYYY"
                                    style={{width: '100%'}}
                                    value={valueNgayChi}
                                    onChange={handleChangeNgayChi}
                                />

                            </Flex>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={5}>
                                <Text>Nhân viên</Text>
                                <Select
                                    showSearch
                                    allowClear
                                    placeholder="Chọn"
                                    style={{width: '100%'}}
                                    value={valueNhanVien}
                                    onChange={handleChangeNhanVien}
                                    options={dataNhanVien.map(nhanVien => ({
                                        label: (
                                            <Space>
                                                {nhanVien.code} - {nhanVien.name}
                                            </Space>
                                        ),
                                        value: nhanVien.id,
                                        name: nhanVien.name,
                                    }))}
                                    filterOption={(input, option) =>
                                        option?.name.toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </Flex>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={5}>
                                <Text>Tên chủ tài khoản nhận tiền</Text>
                                <Input
                                    placeholder="Nhập"
                                    value={valueTenChuTaiKhoan}
                                    onChange={handleChangeTenChuTaiKhoan}
                                />
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={5}>
                                <Text>Tài khoản nhận tiền</Text>
                                <Input
                                    placeholder="Nhập"
                                    value={valueTaiKhoanNhanTien}
                                    onChange={handleChangeTaiKhoanNhanTien}
                                />
                            </Flex>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={5}>
                                <Text>Hình thức</Text>
                                <Select
                                    placeholder="Chọn"
                                    onChange={handleChangeHTTT}
                                    showSearch
                                    value={valueHTTT}
                                    options={LIST_HINH_THUC_TT.map(e => ({
                                        label: (
                                            <Space>
                                                {e.label}
                                            </Space>
                                        ),
                                        value: e.code,

                                    }))}
                                />
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={5}>
                                <Text>Thanh toán công nợ</Text>
                                <Input
                                    placeholder="Nhập"
                                    value={valueThanhToanCongNo}
                                    onChange={handleChangeThanhToanCongNo}
                                />
                            </Flex>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={5}>
                                <Text>Lý do</Text>
                                <Input
                                    placeholder="Nhập"
                                    value={valueLyDo}
                                    onChange={handleChangeLyDo}
                                />
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={5}>
                                <Text>Kiểu</Text>
                                <Select
                                    placeholder="Chọn"
                                    onChange={handleChangeType}
                                    showSearch
                                    value={valueType}
                                    options={LIST_LOAI_PHIEU_CHI.map(e => ({
                                        label: (
                                            <Space>
                                                {e.label}
                                            </Space>
                                        ),
                                        value: e.code,

                                    }))}
                                />

                            </Flex>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} sm={24}>
                            <Flex gap={16} justify="space-between">
                                <Flex vertical gap={5} style={{flex: 1}}>
                                    <Text>Tạm ứng liên quan</Text>
                                    <Select
                                        showSearch
                                        allowClear
                                        // mode="multiple"
                                        placeholder="Chọn"
                                        style={{width: '100%'}}
                                        value={valueTamUngLienQuan}
                                        onChange={handleChangeTamUngLienQuan}
                                        options={dataTamUngLienQuan.map(tamUng => ({
                                            label: (
                                                <Space>
                                                    TU {tamUng.id}: tổng tiền {formatCurrency(tamUng.tong_tien)}₫
                                                    {/*{tamUng.de_nghi_mua ? ', đơn mua liên quan ' + tamUng.de_nghi_mua.code : ''}*/}
                                                </Space>
                                            ),
                                            value: tamUng.id,
                                        }))}
                                    />
                                </Flex>

                                <Flex vertical gap={5} style={{flex: 1}}>
                                    <Text>Đề nghị liên quan</Text>
                                    <Select
                                        showSearch
                                        allowClear
                                        // mode="multiple"
                                        placeholder="Chọn"
                                        style={{width: '100%'}}
                                        value={valueDeNghiLienQuan}
                                        onChange={handleChangeDeNghiLienQuan}
                                        options={dataDeNghiLienQuan.map(tamUng => ({
                                            label: (
                                                <Space>
                                                    DNTT {tamUng.id}: tổng tiền {formatCurrency(tamUng.tong_tien)}₫
                                                    {/*{tamUng.de_nghi_mua ? ', đơn mua liên quan ' + tamUng.de_nghi_mua.code : ''}*/}
                                                </Space>
                                            ),
                                            value: tamUng.id,
                                        }))}
                                    />
                                </Flex>

                            </Flex>
                        </Col>
                    </Row> <Row gutter={16}>
                        <Col xs={24} sm={24}>
                            <Flex gap={16} justify="space-between">
                                <Flex vertical gap={5} style={{flex: 1}}>
                                    <div>
                                        <Form.Item label={'Phiếu liên quan'}>
                                            {selectedPhieuCodes.length > 0 &&
                                                <>
                                                    Các phiếu đang chọn: <i>{selectedPhieuCodes.toString()}</i>
                                                    <button onClick={() => {
                                                        setSelectedPhieuCodes([])
                                                    }}>Bỏ chọn toàn bộ
                                                    </button>
                                                </>
                                            }
                                            <Button
                                                onClick={() => setIsOpenPhieuLQ(true)}
                                            >
                                                Thêm phiếu LQ
                                            </Button>
                                        </Form.Item>
                                    </div>
                                </Flex>

                            </Flex>
                        </Col>
                    </Row>
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Chọn ngoại tệ <input
                            type="checkbox"
                            checked={showNgoaiTe}
                            onChange={() => setShowNgoaiTe(!showNgoaiTe)}
                        /></h3>
                    </div>

                </Flex>
            </Flex>

            <Flex vertical>
                <Divider orientation="left" orientationMargin="0">
                    <ConfigProvider
                        theme={{
                            token: {
                                borderRadiusLG: 0
                            },
                        }}
                    >
                        <Card>
                            <Card.Grid style={gridStyle}>
                                <Text strong>Tổng
                                    tiền: &nbsp;&nbsp;&nbsp;{Number(tongTien).toLocaleString('vi-VN')}</Text>
                            </Card.Grid>
                        </Card>
                    </ConfigProvider>
                </Divider>

                <Table
                    rowKey="id"
                    dataSource={dataTable}
                    pagination={false}
                    className={css.tableDetail}
                    scroll={{ x: 'max-content' }}
                >
                    <Table.Column
                        key="name_hang_hoa"
                        title="Tên hàng hóa"
                        dataIndex="name_hang_hoa"
                        width={370}
                        render={(text) => (
                            <Text strong>{text}</Text>
                        )}
                    />


                    <Table.Column
                        key="so_luong"
                        title="Số lượng"
                        dataIndex="so_luong"
                        width={110}
                        render={(text, record) => (
                            <InputNumber
                                value={record.so_luong}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value?.replace(/,/g, '')}
                                onChange={(value) => updateRowValue(record.key, 'so_luong', value)}
                                style={{width: '100%'}}
                            />
                        )}
                    />
                    <Table.Column
                        key="don_gia"
                        title="Giá bán"
                        dataIndex="don_gia"
                        width={110}
                        render={(text) => (
                            <span>{Number(text)?.toLocaleString('vi-VN') || 0}</span>
                        )}
                    />

                    <Table.Column
                        key="tong_tien"
                        title="Tổng tiền"
                        dataIndex="tong_tien"
                        width={110}
                        render={(text) => (
                            <span>{Number(text)?.toLocaleString('vi-VN') || 0}</span>
                        )}
                    />
                    <Table.Column
                        key="dinh_kem"
                        title="Đính kèm"
                        dataIndex="dinh_kem"
                        width={200}
                        render={(value, record, index) => {
                            
                            return (
                                <PopUpUploadFile
                                    id={record?.id_hang_hoa}
                                    table={`card_PC_${idCard}`}
                                    onGridReady={() => setLoadData(!loadData)}
                                    card={idCard}
                                />
                            )
                        }}
                    />
                    {
                        showNgoaiTe && (
                            <>
                                <Table.Column
                                    title="Tiền nguyên tệ"
                                    render={(text, record) => (
                                        <InputNumber
                                            style={{backgroundColor: 'white', width: '120px', height: '36px'}}
                                            onChange={(value) => updateRowValue(record.key, 'tien_nguyen_te', value)}

                                        />


                                    )}
                                />
                                <Table.Column
                                    title="Tỷ giá"
                                    render={(text, record) => (
                                        <InputNumber
                                            style={{backgroundColor: 'white', width: '120px', height: '36px'}}
                                            onChange={(value) => updateRowValue(record.key, 'ty_gia', value)}

                                        />


                                    )}
                                />
                                <Table.Column
                                    title="Tổng tiền nguyên tệ"
                                    render={(text, record) => (
                                        <InputNumber
                                            style={{backgroundColor: 'white', width: '150px', height: '36px'}}
                                            onChange={(value) => updateRowValue(record.key, 'tong_tien_nguyen_te', value)}
                                        />


                                    )}
                                />
                            </>


                        )
                    }

                    <Table.Column
                        title="Actions"
                        width="50px"
                        render={(text, record) => (
                            <Button
                                danger
                                onClick={() => handleDeleteRow(record)}
                            >
                                <img src={DeleteIcon} alt=""/>
                            </Button>
                        )}
                    />
                </Table>
                {isOpenPhieuLQ && <PhieuLQ isOpenPhieuLQ={isOpenPhieuLQ} setIsOpenPhieuLQ={setIsOpenPhieuLQ}
                                           selectedPhieuCodes={selectedPhieuCodes}
                                           setSelectedPhieuCodes={setSelectedPhieuCodes}/>}

            </Flex>

            {
                !isTemplatesChain
                    ? (
                        <>
                            <Divider/>
                            <Flex justify={'center'} align={'center'}>
                                <Button onClick={handleCreatePhieuChi}>
                                    Tạo Phiếu
                                </Button>
                            </Flex>
                        </>
                    )
                    : (<></>)
            }
            <Divider/>
        </>
    )
}

export default TaoPhieuChi
