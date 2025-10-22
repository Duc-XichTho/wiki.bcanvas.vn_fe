import React, {useContext, useEffect, useState} from "react";
import {Col, DatePicker, Form, Input, message, Modal, Row, Select, Typography} from "antd";
import css from './CreateQuick.module.css'
import {DANH_MUC_LIST} from "../../../Consts/DANH_MUC_LIST.js";
import {AgGridReact} from "ag-grid-react";
import {filter} from "../AgridTable/FilterAgrid.jsx";
import {createTimestamp} from "../../../generalFunction/format.js";
import {MyContext} from "../../../MyContext.jsx";

const {Title} = Typography;

export default function CreateQuickDanhMuc({onClose, open, keySelect, typeSelect}) {
    const {setLoadData, loadData} = useContext(MyContext)
    const [loading, setLoading] = useState(false);
    const [formValues, setFormValues] = useState({});
    const [tableData, setTableData] = useState([]);
    const [columnDefs, setColumnDefs] = useState([]);
    const [fieldUsed, setFieldUsed] = useState(null);

    useEffect(() => {
        if (keySelect) {
            const selectedDMData = DANH_MUC_LIST.find((dm) => dm.key === keySelect);
            setFieldUsed(selectedDMData)
            if (selectedDMData) {
                // Cập nhật cấu trúc cột
                const fields = selectedDMData.fields.filter(field => field.type && field.field !== 'id');
                const columns = fields.map(field => ({
                    headerName: field.headerName,
                    field: field.field,
                    sortable: true,

                    ...filter(),

                }));
                setColumnDefs(columns);
                selectedDMData.getAllApi().then(data => {
                    setTableData(data);
                });
            }
        }
    }, [keySelect, loadData]);

    const handleInputChange = (fieldKey, value) => {
        setFormValues((prev) => ({
            ...prev,
            [fieldKey]: value,
            created_at: createTimestamp(),
            // user_create: currentUser.email
        }));
    };

    const checkCodeUnique = async (newCode) => {
        try {
            const response = await fieldUsed.getAllApi()
            const existingCodes = await response.map(e => e.code)
            return !existingCodes.includes(newCode);
        } catch (error) {
            console.error("Error checking code uniqueness:", error);
            return false;
        }
    };

    const handleSave = async () => {
        setLoading(true);
        if (!fieldUsed || !fieldUsed.createApi) {
            message.error("Danh mục không hợp lệ hoặc thiếu API tạo.");
            setLoading(false);
            return;
        }
        if (!formValues.code || formValues.code == '') {
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
                message.error("Trường thông tin 'Code' là bắt buộc. Vui lòng nhập!");
            }, 1000)

            return;
        }
        // Kiểm tra tính duy nhất của mã
        const isCodeUnique = await checkCodeUnique(formValues.code); // Giả sử 'code' là trường bạn muốn kiểm tra
        if (!isCodeUnique) {
            message.error("Code đã tồn tại. Vui lòng nhập mã khác.");
            setLoading(true);
            return;
        }

        fieldUsed.createApi(formValues)
            .then((response) => {
                if (response.status === 201) {
                    setTimeout(() => {
                        message.success("Danh mục đã được tạo thành công!");
                        onClose();
                        setLoadData(pre => !pre);
                        setFormValues({});
                    }, 1000);
                }
            })
            .catch((err) => {
                console.error(err);
                message.error("Không thể tạo danh mục.");
            })
            .finally(() => {
                setLoading(false); // Dừng loading
            });
    };


    return (
        <Modal
            title={keySelect ? DANH_MUC_LIST.find(e => e.key == keySelect)?.label : ''}
            centered
            open={open}
            onCancel={onClose}
            width={1400}
            cancelText="Đóng"
            okText="Tạo"
            confirmLoading={loading}
            onOk={handleSave}
        >

            {/*<h4>Danh mục</h4>*/}
            <Form layout="vertical">

                <div
                    className={`${keySelect ? `${css.active} ${css.modalcontent}` : `${css.modalcontent}`}`}
                    style={{display: `${keySelect ? 'block' : 'none'}`}}
                >
                    <Row aria-colspan={12} style={{display: 'flex', position: "relative"}}>


                        {/* Phần bên phải: Trống để xử lý */}
                        <Col span={18} style={{padding: '5px'}}>
                            <div className="ag-theme-quartz" style={{height: '680px', width: '100%', padding: '5px'}}>
                                <AgGridReact
                                    columnDefs={columnDefs}
                                    rowData={tableData}
                                    enableRangeSelection
                                />
                            </div>
                        </Col>

                        {/* Phần bên trái: Hiện các trường hiện tại */}
                        <Col span={6} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '10px',
                            height: "680px",
                            overflow: "auto"
                        }}>
                            {keySelect &&
                                DANH_MUC_LIST.find((dm) => dm.key === keySelect)?.fields
                                    .filter((field) => field.type && field.field !== 'id')
                                    .map((field) => (
                                        <Form.Item key={field.field} label={field.headerName}
                                                   style={{flex: '1 0 auto', padding: '5px'}}>
                                            {field.type === 'text' && (
                                                <Input
                                                    value={formValues[field.field] || ''}
                                                    onChange={(e) => handleInputChange(field.field, e.target.value)}
                                                />
                                            )}
                                            {field.type === 'number' && (
                                                <Input
                                                    type="number"
                                                    value={formValues[field.field] || ''}
                                                    onChange={(e) => handleInputChange(field.field, e.target.value)}
                                                />
                                            )}
                                            {field.type === 'date' && (
                                                <DatePicker
                                                    style={{width: '100%'}}
                                                    format={'DD/MM/YYYY'}
                                                    value={formValues[field.field] || ''}
                                                    onChange={(date) => handleInputChange(field.field, date)}
                                                />
                                            )}
                                            {field.type === 'select' && (
                                                <Select
                                                    showSearch
                                                    value={formValues[field.field] || ''}
                                                    onChange={(value) => handleInputChange(field.field, value)}
                                                >
                                                    {(columnDefs[field.field] || []).map((option) => (
                                                        <Select.Option key={option.value} value={option.label}>
                                                            {option.label}
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            )}
                                        </Form.Item>
                                    ))}
                        </Col>
                    </Row>
                </div>

            </Form>
        </Modal>
    );
}
