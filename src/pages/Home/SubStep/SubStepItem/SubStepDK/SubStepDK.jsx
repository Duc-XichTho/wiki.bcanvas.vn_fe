import React, { useEffect, useState } from "react";
import { Button, Input, Select, Row, Col, message, Popconfirm } from "antd";
import styles from './SubStepDK.module.css';
import { IconButton } from "@mui/material";
import { XRedIcon } from "../../../../../icon/IconSVG.js";
// API
import {
    createNewDinhKhoan,
    deleteDinhKhoan,
    getAllDinhKhoan,
    updateDinhKhoan
} from "../../../../../apis/dinhKhoanService.jsx";
import { getAllTaiKhoan } from "../../../../../apis/taiKhoanService.jsx";
// COMPONENT
import SubStepInput from "../SubStepInput/SubStepInput.jsx";

const SubStepDK = ({ sub_step_id, idCard }) => {
    const [listDinhKhoan, setListDinhKhoan] = useState([]);
    const [accountList, setAccountList] = useState([]);
    const [formValues, setFormValues] = useState({});

    const loadDinhKhoanData = async () => {
        try {
            const dinhKhoans = await getAllDinhKhoan();
            const filteredDinhKhoans = dinhKhoans.filter(
                dk => dk.sub_step_id == sub_step_id && dk.card_id == idCard
            ).sort((a, b) => a.id - b.id);

            if (filteredDinhKhoans.length === 0) {
                await createTemplateDinhKhoan();
            } else {
                setListDinhKhoan(filteredDinhKhoans);

                // Initialize form values for each Dinh Khoan
                const initialFormValues = filteredDinhKhoans.reduce((acc, dinhKhoan) => {
                    acc[dinhKhoan.id] = {
                        dien_giai: dinhKhoan.dien_giai || '',
                        tai_khoan_no: dinhKhoan.TkNo || undefined,
                        tai_khoan_co: dinhKhoan.TkCo || undefined,
                        so_tien: dinhKhoan.so_tien || ''
                    };
                    return acc;
                }, {});
                setFormValues(initialFormValues);
            }
        } catch (error) {
            console.error("Failed to load Dinh Khoan data:", error);
            message.error("Failed to load Dinh Khoan data");
        }
    };

    const createTemplateDinhKhoan = async () => {
        try {
            const dinhKhoans = await getAllDinhKhoan();
            const templateDinhKhoans = dinhKhoans.filter(
                cl => cl.sub_step_id == sub_step_id
            );

            if (templateDinhKhoans.length > 0) {
                const templateDinhKhoan = templateDinhKhoans[0];
                const { id, ...templateWithoutId } = templateDinhKhoan;
                const newDinhKhoan = {
                    ...templateWithoutId,
                    card_id: idCard,
                    position: 0,
                };
                const createdDinhKhoan = await createNewDinhKhoan(newDinhKhoan);
                setListDinhKhoan([createdDinhKhoan]);

                // Initialize form values for the new Dinh Khoan
                setFormValues({
                    [createdDinhKhoan.id]: {
                        dien_giai: '',
                        tai_khoan_no: undefined,
                        tai_khoan_co: undefined,
                        so_tien: ''
                    }
                });
            }
        } catch (error) {
            console.error("Failed to create template Dinh Khoan:", error);
            message.error("Failed to create template Dinh Khoan");
        }
    };

    useEffect(() => {
        const fetchTaiKhoan = async () => {
            try {
                const response = await getAllTaiKhoan();
                const formattedAccounts = response.map(account => ({
                    value: account.code,
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
    }, [sub_step_id, idCard]);

    const handleAccountChange = async (dinhKhoanId, fieldName, value) => {
        try {
            const currentDinhKhoan = listDinhKhoan.find(dk => dk.id === dinhKhoanId);
            if (!currentDinhKhoan) return;
            const updatePayload = {
                ...currentDinhKhoan,
                [fieldName]: value
            };
            const updatedDinhKhoan = await updateDinhKhoan(updatePayload);
            setListDinhKhoan(prevList =>
                prevList.map(dk =>
                    dk.id === dinhKhoanId ? updatedDinhKhoan : dk
                )
            );
            setFormValues(prev => ({
                ...prev,
                [dinhKhoanId]: {
                    ...prev[dinhKhoanId],
                    [fieldName === 'TkNo' ? 'tai_khoan_no' : 'tai_khoan_co']: value
                }
            }));
        } catch (error) {
            console.error(`Failed to update ${fieldName}:`, error);
            message.error(`Failed to update ${fieldName}`);
        }
    };

    const handleAddDK = async () => {
        try {
            const templateDinhKhoans = await getAllDinhKhoan();
            const templateDinhKhoan = templateDinhKhoans.find(
                cl => cl.sub_step_id == sub_step_id
            );
            if (templateDinhKhoan) {
                const { id, ...templateWithoutId } = templateDinhKhoan;
                const newDinhKhoan = {
                    ...templateWithoutId,
                    card_id: idCard,
                    position: listDinhKhoan.length,
                };
                const createdDinhKhoan = await createNewDinhKhoan(newDinhKhoan);

                setListDinhKhoan(prevList => [...prevList, createdDinhKhoan]);

                // Add form values for the new Dinh Khoan
                setFormValues(prev => ({
                    ...prev,
                    [createdDinhKhoan.id]: {
                        dien_giai: '',
                        tai_khoan_no: undefined,
                        tai_khoan_co: undefined,
                        so_tien: ''
                    }
                }));
            }
        } catch (error) {
            console.error("Failed to add new Dinh Khoan:", error);
            message.error("Failed to add new Dinh Khoan");
        }
    };

    const handleDeleteDK = async (dinhKhoanId) => {
        try {
            await deleteDinhKhoan(dinhKhoanId);

            setListDinhKhoan(prevList =>
                prevList.filter(dk => dk.id !== dinhKhoanId)
            );

            setFormValues(prev => {
                const { [dinhKhoanId]: removed, ...rest } = prev;
                return rest;
            });

            message.success("Dinh Khoan deleted successfully");
        } catch (error) {
            console.error("Failed to delete Dinh Khoan:", error);
            message.error("Failed to delete Dinh Khoan");
        }
    };

    return (
        <div className={styles.container}>
            <Button
                className={styles.settingsButton}
                type="primary"
                onClick={handleAddDK}
            >
                +
            </Button>

            {listDinhKhoan.map((dinhKhoan, index) => (
                <div key={dinhKhoan.id} className={styles.dinhKhoanEntry}>
                    <div className={styles.deleteButtonContainer}>
                        <Popconfirm
                            title="Are you sure you want to delete this Dinh Khoan?"
                            onConfirm={() => handleDeleteDK(dinhKhoan.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <IconButton size="small">
                                <img src={XRedIcon} alt="" />
                            </IconButton>
                        </Popconfirm>
                    </div>

                    <div className={styles.outsideFormContainer}>
                        <div layout="vertical" className={styles.outsideForm}>
                            <Row gutter={16} className={styles.formRow}>
                                <Col span={6}>
                                    <div className={styles.formItem}>
                                        <label>Diễn giải</label>
                                        <Input
                                            disabled
                                            placeholder="Diễn giải"
                                            className={styles.disabledInput}
                                            value={formValues[dinhKhoan.id]?.dien_giai || ''}
                                        />
                                    </div>
                                </Col>

                                <Col span={6}>
                                    <div className={styles.formItem}>
                                        <label>Tài khoản nợ</label>
                                        <Select
                                            placeholder="Select Nợ Account"
                                            options={accountList}
                                            className={styles.selectInput}
                                            value={formValues[dinhKhoan.id]?.tai_khoan_no}
                                            onChange={(value) => handleAccountChange(dinhKhoan.id, 'TkNo', value)}
                                        />
                                    </div>
                                </Col>

                                <Col span={6}>
                                    <div className={styles.formItem}>
                                        <label>Tài khoản có</label>
                                        <Select
                                            placeholder="Select Có Account"
                                            options={accountList}
                                            className={styles.selectInput}
                                            value={formValues[dinhKhoan.id]?.tai_khoan_co}
                                            onChange={(value) => handleAccountChange(dinhKhoan.id, 'TkCo', value)}
                                        />
                                    </div>
                                </Col>

                                <Col span={6}>
                                    <div className={styles.formItem}>
                                        <label>Số tiền</label>
                                        <Input
                                            disabled
                                            placeholder="Số tiền"
                                            className={styles.disabledInput}
                                            value={formValues[dinhKhoan.id]?.so_tien || ''}
                                        />
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </div>

                    {/* {index === listDinhKhoan.length - 1 && (
                        <SubStepInput sub_step_id={sub_step_id} idCard={idCard} />
                    )} */}
                </div>
            ))}
        </div>
    )
}

export default SubStepDK;
