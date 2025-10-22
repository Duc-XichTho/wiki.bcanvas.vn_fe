import React, { useEffect, useState } from "react";
import { Form, Input, Select, Row, Col, message } from "antd";
import styles from './TemplateDK.module.css';
import { IconButton, Tooltip } from "@mui/material";
import { EditIconCoLe } from "../../../../../icon/IconSVG.js";
// API
import {
    createNewDinhKhoan,
    deleteDinhKhoan,
    getAllDinhKhoan,
    updateDinhKhoan
} from "../../../../../apis/dinhKhoanService.jsx";
import { getAllTaiKhoan } from "../../../../../apis/taiKhoanService.jsx";
import { getAllInput } from "../../../../../apis/inputService.jsx";
// COMPONENT
import SettingPopup from "./SettingPopup/SettingPopup";
import TemplateInput from "../TemplateInput/TemplateInput.jsx";

const TemplateDK = ({ sub_step_id, listSubStep }) => {
    const [form] = Form.useForm();
    const [formStep, setFormStep] = useState(null);
    const [listDinhKhoan, setListDinhKhoan] = useState([]);
    const [dinhKhoan, setDinhKhoan] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editedDinhKhoan, setEditedDinhKhoan] = useState(null);
    const [accountList, setAccountList] = useState([]);
    const [currentChuThich, setCurrentChuThich] = useState('');

    useEffect(() => {
        const formSubStep = listSubStep.filter(item => item.subStepType == "Form");
        setFormStep(formSubStep);
    }, [listSubStep])

    const loadDinhKhoanData = async () => {
        try {
            const dinhKhoans = await getAllDinhKhoan();
            const existingDinhKhoan = dinhKhoans.find(dk => dk.sub_step_id === sub_step_id && dk.card_id == null);

            if (existingDinhKhoan) {
                setDinhKhoan(existingDinhKhoan);
                setCurrentChuThich(existingDinhKhoan.chu_thich || '');

                form.setFieldsValue({
                    dien_giai: existingDinhKhoan.dien_giai || '',
                    chu_thich: existingDinhKhoan.chu_thich || '',
                    tai_khoan_no: existingDinhKhoan.TkNo || undefined,
                    tai_khoan_co: existingDinhKhoan.TkCo || undefined,
                    so_tien: existingDinhKhoan.so_tien || ''
                });
            } else {
                const newDinhKhoan = {
                    sub_step_id,
                    position: 0,
                };
                const createdDinhKhoan = await createNewDinhKhoan(newDinhKhoan);
                setDinhKhoan(createdDinhKhoan);
            }
        } catch (error) {
            console.error("Failed to load Dinh Khoan data:", error);
            message.error("Failed to load Dinh Khoan data");
        }
    };

    useEffect(() => {
        const fetchTaiKhoan = async () => {
            try {
                const response = await getAllTaiKhoan();
                const formattedAccounts = response.map(account => ({
                    label: `${account.name}`
                }));
                setAccountList(formattedAccounts);
            } catch (error) {
                console.error("Failed to fetch Tai Khoan list:", error);
                message.error("Failed to fetch Tai Khoan list");
            }
        };

        loadDinhKhoanData();
        fetchTaiKhoan();
    }, [sub_step_id]);

    const handleAccountChange = async (fieldName, value) => {
        if (!dinhKhoan) return;

        try {
            const updatePayload = {
                ...dinhKhoan,
                [fieldName]: value
            };

            const updatedDinhKhoan = await updateDinhKhoan(updatePayload);

            setDinhKhoan(updatedDinhKhoan);

        } catch (error) {
            console.error(`Failed to update ${fieldName}:`, error);
            message.error(`Failed to update ${fieldName}`);

            form.setFieldValue(fieldName, dinhKhoan[fieldName]);
        }
    };

    const handleChuThichChange = (e) => {
        const value = e.target.value;
        setCurrentChuThich(value);
    };

    const handleChuThichBlur = async () => {
        if (!dinhKhoan) return;
        if (currentChuThich !== dinhKhoan.chu_thich) {
            try {
                const updatePayload = {
                    ...dinhKhoan,
                    chu_thich: currentChuThich
                };

                const updatedDinhKhoan = await updateDinhKhoan(updatePayload);

                setDinhKhoan(updatedDinhKhoan);
                form.setFieldValue('chu_thich', currentChuThich);
            } catch (error) {
                console.error('Failed to update Chú thích:', error);
                message.error('Failed to update Chú thích');

                setCurrentChuThich(dinhKhoan.chu_thich || '');
                form.setFieldValue('chu_thich', dinhKhoan.chu_thich || '');
            }
        }
    };

    const handleOpenSettings = () => {
        setOpenDialog(true);
        form.resetFields();
    };

    const handleCancel = () => {
        setOpenDialog(false);
        setEditedDinhKhoan(null);
    };

    const handleSubmit = async (values) => {
        try {
            if (editedDinhKhoan) {
                await updateDinhKhoan(editedDinhKhoan.id, values);
            } else {
                await createNewDinhKhoan(values);
            }

            const response = await getAllDinhKhoan();
            setListDinhKhoan(response.data);

            setOpenDialog(false);
            form.resetFields();
        } catch (error) {
            console.error("Failed to submit Dinh Khoan:", error);
            message.error("Failed to submit Dinh Khoan");
        }
    };

    return (
        <div className={styles.container}>
            <Tooltip title="Chỉnh sửa cột" >
                <IconButton className={styles.settingsButton} onClick={handleOpenSettings} size="small">
                    <img src={EditIconCoLe} alt="Edit Columns" />
                </IconButton>
            </Tooltip>

            <div className={styles.outsideFormContainer}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className={styles.outsideForm}
                >
                    <Row gutter={16} className={styles.formRowTop}>
                        <Col span={12}>
                            <Form.Item
                                name="dien_giai"
                                label="Diễn giải"
                                className={styles.formItem}
                            >
                                <Input
                                    disabled
                                    placeholder="Diễn giải"
                                    className={styles.disabledInput}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                name="chu_thich"
                                label="Chú thích"
                                className={styles.formItem}
                            >
                                <Input
                                    placeholder="Chú thích"
                                    className={styles.inputField}
                                    onChange={handleChuThichChange}
                                    onBlur={handleChuThichBlur}
                                    value={currentChuThich}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16} className={styles.formRowBottom}>
                        <Col span={8}>
                            <Form.Item
                                name="tai_khoan_no"
                                label="Tài khoản nợ"
                                className={styles.formItem}
                                rules={[{ required: true, message: 'Hãy chọn tài khoản' }]}
                            >
                                <Select
                                    placeholder="Select Nợ Account"
                                    options={accountList}
                                    className={styles.selectInput}
                                    onChange={(value) => handleAccountChange('TkNo', value)}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item
                                name="tai_khoan_co"
                                label="Tài khoản có"
                                className={styles.formItem}
                                rules={[{ required: true, message: 'Hãy chọn tài khoản' }]}
                            >
                                <Select
                                    placeholder="Select Có Account"
                                    options={accountList}
                                    className={styles.selectInput}
                                    onChange={(value) => handleAccountChange('TkCo', value)}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item
                                name="so_tien"
                                label="Số tiền"
                                className={styles.formItem}
                            >
                                <Input
                                    disabled
                                    placeholder="Số tiền"
                                    className={styles.disabledInput}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </div>
            {dinhKhoan &&
                <SettingPopup
                    styles={styles}
                    openDialog={openDialog}
                    handleCancel={handleCancel}
                    handleSubmit={handleSubmit}
                    form={form}
                    accountList={accountList}
                    sub_step_id={sub_step_id}
                    formStep={formStep}
                    dinhKhoanId={dinhKhoan.id}
                />
            }
            <TemplateInput sub_step_id={sub_step_id} />
        </div>
    );
};

export default TemplateDK;
