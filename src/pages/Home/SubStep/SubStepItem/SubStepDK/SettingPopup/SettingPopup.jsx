import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Input, Select, Row, Col } from "antd";
// API

const SettingPopup = ({
    styles,
    openDialog,
    handleCancel,
    handleSubmit,
    form,
    accountList
}) => {
    return (
        <Modal
            className={styles.settingsModal}
            title="Settings"
            open={openDialog}
            onCancel={handleCancel}
            footer={null}
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                className={styles.settingsForm}
            >
                <Row gutter={16} className={styles.formRow}>
                    {/* Diễn giải (Non-editable) */}
                    <Col span={6}>
                        <Form.Item
                            name="dien_giai"
                            label="Diễn giải"
                            className={styles.formItem}
                        >
                            <Input
                                disabled
                                placeholder="Automatically generated"
                                className={styles.disabledInput}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={6}>
                        <Form.Item
                            name="tai_khoan_no"
                            label="Tài khoản nợ"
                            className={styles.formItem}
                            rules={[{ required: true, message: 'Please select an account' }]}
                        >
                            <Select
                                placeholder="Select Nợ Account"
                                options={accountList}
                                className={styles.selectInput}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={6}>
                        <Form.Item
                            name="tai_khoan_co"
                            label="Tài khoản có"
                            className={styles.formItem}
                            rules={[{ required: true, message: 'Please select an account' }]}
                        >
                            <Select
                                placeholder="Select Có Account"
                                options={accountList}
                                className={styles.selectInput}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={6}>
                        <Form.Item
                            name="so_tien"
                            label="Số tiền"
                            className={styles.formItem}
                        >
                            <Input
                                disabled
                                placeholder="Automatically generated"
                                className={styles.disabledInput}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                className={styles.submitButton}
                            >
                                Save
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    )
};

export default SettingPopup;