import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Select, Input, message, DatePicker, Row, Col } from "antd";
import css from './CreateDanhMuc.module.css';
import { ACTION_BUTTON_LIST } from "../../../Consts/ACTION_BUTTON.js";
import { DANH_MUC_LIST } from "../../../Consts/DANH_MUC_LIST.js";
import moment from 'moment';
import { createTimestamp } from "../../../generalFunction/format.js";
import { getCurrentUserLogin } from "../../../apis/userService.jsx";
import { Box, Collapse, FormControl, InputLabel, MenuItem, TextField, Typography } from "@mui/material";
import PopUpFormCreatePhieu from "../formCreate/formCreatePhieu.jsx";
import { getAllSubStep, getSubStepDataById, updateSubStep } from "../../../apis/subStepService.jsx"; // Import moment for date formatting

const BtnAction = ({ item }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [dialogContent, setDialogContent] = useState(null);

    //Tạo danh mục
    const [selectedDM, setSelectedDM] = useState('');
    const [formValues, setFormValues] = useState({});
    const [selectOptions, setSelectOptions] = useState({});
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const [isModalPhieuOpen, setIsModalPhieuOpen] = useState(false);


    useEffect(() => {
        getSubStepDataById(item?.id).then((a) => {
            setSelectedDM(a.value_create_dm)
        })
    }, [isModalOpen]);
    // Mở modal
    const handleClickBtn = (key) => {
        if (!['tao_phieu_nhap', 'tao_phieu_xuat'].includes(key)) {
            setIsModalOpen(true);

        }
        else {
            setIsModalPhieuOpen(true)
        }
        setDialogContent(key);
    };
    const fetchCurrentUser = async () => {
        const { data, error } = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };
    // Lấy tùy chọn cho các trường select
    useEffect(() => {

        fetchCurrentUser();
        if (selectedDM) {

            const selectedFields = DANH_MUC_LIST.find((dm) => dm.key === selectedDM)?.fields || [];
            selectedFields.forEach((field) => {
                if (field.type === 'select' && typeof field.getAllApi === 'function') {
                    field.getAllApi().then((data) => {

                        setSelectOptions((prev) => ({
                            ...prev,
                            [field.field]: data.map((item) => ({
                                label: item[field.key],
                                value: item.id,
                            })),
                        }));
                    }).catch(err => console.error(`Error fetching data for ${field.field}:`, err));
                }
            });
        }
    }, [selectedDM]);

    // Xử lý thay đổi input
    const handleInputChange = (fieldKey, value) => {
        setFormValues((prev) => ({
            ...prev,
            [fieldKey]: value,
            created_at: createTimestamp(),
            user_create: currentUser.email
        }));
    };

    // Lưu dữ liệu form
    const handleSaveDM = () => {
        setLoading(true); // Bắt đầu loading
        const selectedDMData = DANH_MUC_LIST.find((dm) => dm.key === selectedDM && !dm.isNotDM);

        if (!selectedDMData || !selectedDMData.createApi) {
            message.error("Danh mục không hợp lệ hoặc thiếu API tạo.");
            setLoading(false);
            return;
        }

        selectedDMData.createApi(formValues)
            .then((response) => {
                if (response.status === 201) {
                    setTimeout(() => {
                        message.success("Danh mục đã được tạo thành công!");
                        handleCloseModal();
                    }, 200);
                }
            })
            .catch((err) => {
                console.error(err);
                message.error("Không thể tạo danh mục.");
            })
            .finally(() => {
                setLoading(false);
            });
    };
    const handleChangeListDMSelected = (value) => {

        item = {
            ...item,
            value_create_dm: value
        }
        updateSubStep(item).then(r => {
            console.log(r.data)
        })
        setSelectedDM(value)
        message.success('Lưu cài đặt thành công')

    }
    // Đóng modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setDialogContent(null);
        setSelectedDM('');
        setFormValues({});
        setSelectOptions({});
    };

    // Render nội dung form động
    const RenderContent = () => {
        switch (dialogContent) {
            case 'tao_danh_muc':
                return (<>
                    {/* Modal */}
                    <Modal
                        title="Tạo danh mục"
                        centered
                        open={isModalOpen}
                        onCancel={handleCloseModal}
                        width={500}
                        style={{ maxHeight: '700px', overflowY: "hidden" }}
                        cancelText="Đóng"
                        // okText="Tạo"
                        confirmLoading={loading} // Hiện loading khi đang lưu
                        // onOk={handleSaveDM}
                        footer={(<>
                        <Button onClick={handleCloseModal}>Đóng</Button>
                        </>)}
                    >

                        {/*<h4>Danh mục</h4>*/}
                        <Form layout="vertical">
                            {/* Dropdown chọn danh mục */}
                            <Form.Item label="Chọn danh mục cần tạo">
                                <Select
                                    showSearch
                                    value={selectedDM}
                                    onChange={(value) => handleChangeListDMSelected(value)
                                    }
                                >
                                    {DANH_MUC_LIST.filter((dm) => !dm.isNotDM).map((dm) => (
                                        <Select.Option key={dm.key} value={dm.key}>
                                            {dm.label}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            {/*<div className={`${selectedDM ? `${css.active} ${css.modalcontent}` : `${css.modalcontent}`}`}*/}
                            {/*    style={{ display: `${selectedDM ? 'block' : 'none'}` }}>*/}
                            {/*    <Row aria-colspan={12} style={{ display: 'flex' }}>*/}
                            {/*        {selectedDM &&*/}
                            {/*            DANH_MUC_LIST.find((dm) => dm.key === selectedDM)?.fields*/}
                            {/*                .filter((field) => field.type && field.field !== 'id')*/}
                            {/*                .map((field) => (*/}
                            {/*                    <Col key={field.field} span={12} style={{*/}
                            {/*                        display: 'flex',*/}
                            {/*                        justifyContent: 'space-between',*/}
                            {/*                        padding: '5px'*/}
                            {/*                    }}>*/}
                            {/*                        <Form.Item label={field.headerName} style={{ flex: '1 0 48%' }}>*/}
                            {/*                            {field.type === 'text' && (*/}
                            {/*                                <Input*/}
                            {/*                                    value={formValues[field.field] || ''}*/}
                            {/*                                    onChange={(e) => handleInputChange(field.field, e.target.value)}*/}
                            {/*                                />*/}
                            {/*                            )}*/}
                            {/*                            {field.type === 'number' && (*/}
                            {/*                                <Input*/}
                            {/*                                    type="number"*/}
                            {/*                                    value={formValues[field.field] || ''}*/}
                            {/*                                    onChange={(e) => handleInputChange(field.field, e.target.value)}*/}
                            {/*                                />*/}
                            {/*                            )}*/}
                            {/*                            {field.type === 'date' && (*/}
                            {/*                                <DatePicker*/}
                            {/*                                    style={{ width: '100%' }}*/}
                            {/*                                    format={'DD/MM/YYYY'}*/}
                            {/*                                    value={formValues[field.field] || ''}*/}
                            {/*                                    onChange={(date) => handleInputChange(field.field, date)}*/}
                            {/*                                />*/}
                            {/*                            )}*/}
                            {/*                            {field.type === 'select' && (*/}
                            {/*                                <Select*/}
                            {/*                                    showSearch*/}
                            {/*                                    value={formValues[field.field] || ''}*/}
                            {/*                                    onChange={(value) => handleInputChange(field.field, value)}*/}
                            {/*                                >*/}
                            {/*                                    {(selectOptions[field.field] || []).map((option) => {*/}
                            {/*                                        return (*/}
                            {/*                                            <>*/}

                            {/*                                                <Select.Option key={option.value}*/}
                            {/*                                                    value={option.label}>*/}
                            {/*                                                    {option.label}*/}
                            {/*                                                </Select.Option>*/}
                            {/*                                            </>*/}

                            {/*                                        )*/}
                            {/*                                    })}*/}
                            {/*                                </Select>*/}
                            {/*                            )}*/}
                            {/*                        </Form.Item>*/}
                            {/*                    </Col>*/}
                            {/*                ))}*/}
                            {/*    </Row>*/}
                            {/*</div>*/}
                        </Form>
                    </Modal>
                </>
                );
            case 'tao_phieu_nhap':

                return (<>
                    {/*<PopUpFormCreatePhieu*/}
                    {/*    table="PhieuNhap"*/}
                    {/*    onClose={() => setIsModalPhieuOpen(false)}*/}
                    {/*    open={isModalPhieuOpen}*/}
                    {/*    reload={() => { }}*/}
                    {/*    currentUser={currentUser}*/}
                    {/*/>*/}
                </>

                );

            case 'tao_phieu_xuat':
                return (
                    <>
                        <PopUpFormCreatePhieu
                            table="PhieuXuat"
                            onClose={() => setIsModalPhieuOpen(false)}
                            open={isModalPhieuOpen}
                            reload={() => { }}
                            currentUser={currentUser}
                        />
                    </>

                );
        }
    };

    return (
        <div className={css.container}>
            {ACTION_BUTTON_LIST.map((e) => {
                if (item?.action_list.includes(e.key)) {
                    return (
                        <Button
                            key={e.key}
                            className={css.btnAdd}
                            onClick={() => handleClickBtn(e.key)}
                        >
                            <img src={e.icon} alt="" /> {e.label}
                        </Button>
                    );
                }
                return null;
            })}


            {RenderContent()}

        </div>
    );
};

export default BtnAction;
