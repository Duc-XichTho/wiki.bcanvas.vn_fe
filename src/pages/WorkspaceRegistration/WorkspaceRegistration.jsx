import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { createDemoSchemaPublicController } from '../../apis/public/publicService.jsx';
import styles from './WorkspaceRegistration.module.css';

// Hardcoded versions configurations
const HARDCODED_VERSIONS = [
    {
        id: 'express',
        name: 'Express',
        rubikDataRowsLimit: 50000, // 50K dòng/1 file
        rubikDataColumnsLimit: 20,
        rubikDataTotalRowsLimit: 250000, // 250K dòng total
        contextInstruction: 'Express package with basic features'
    },
    {
        id: 'one',
        name: 'One',
        rubikDataRowsLimit: 150000, // 150K dòng/1 file
        rubikDataColumnsLimit: 25,
        rubikDataTotalRowsLimit: 1000000, // 1M dòng total
        contextInstruction: 'One package with enhanced features'
    },
    {
        id: 'pro',
        name: 'Pro',
        rubikDataRowsLimit: 250000, // 250K dòng/1 file
        rubikDataColumnsLimit: 30,
        rubikDataTotalRowsLimit: 3000000, // 3M dòng total
        contextInstruction: 'Pro package with professional features'
    },
    {
        id: 'premium',
        name: 'Premium',
        rubikDataRowsLimit: 450000, // 450K dòng/1 file
        rubikDataColumnsLimit: 40,
        rubikDataTotalRowsLimit: 5000000, // 5M dòng total
        contextInstruction: 'Premium package with enterprise features'
    }
];

const WorkspaceRegistration = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [versions] = useState(HARDCODED_VERSIONS);
    const [selectedVersion, setSelectedVersion] = useState(HARDCODED_VERSIONS[0]);
    const [formValues, setFormValues] = useState({});

    // Function to check if form is valid
    const isFormValid = () => {
        const { email, phone, workspaceName, version } = formValues;
        return email && phone && workspaceName && version && versions.length > 0;
    };

    // Track form values changes
    const handleFormChange = (changedValues, allValues) => {
        setFormValues(allValues);
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const currentDate = new Date();
            const expiredDate = new Date(currentDate);
            expiredDate.setDate(expiredDate.getDate() + 90);

            // Lấy version được chọn từ form hoặc selectedVersion
            const chosenVersion = versions.find(v => v.id === values.version) || selectedVersion;

            const requestData = {
                email: values.email,
                phone: values.phone || null,
                schema: {
                    status: true,
                    description: chosenVersion?.name,
                    path: values.workspaceName,
                    created_at: currentDate.toISOString(),
                    expired_at: expiredDate.toISOString(),
                    // Auto apply chosen version nếu có
                    ...(chosenVersion && {
                        limit_user: chosenVersion.userNumberLimit,
                        version_id: chosenVersion.id,
                        version_data: {
                            contextInstruction: chosenVersion.contextInstruction,
                            tokenSize: chosenVersion.tokenSize,
                            rubikDataRowsLimit: chosenVersion.rubikDataRowsLimit,
                            rubikDataColumnsLimit: chosenVersion.rubikDataColumnsLimit,
                            rubikDataTotalRowsLimit: chosenVersion.rubikDataTotalRowsLimit,
                            userNumberLimit: chosenVersion.userNumberLimit,
                        }
                    })
                }
            };

            const response = await createDemoSchemaPublicController(requestData);
            message.success('Đăng ký thành công!');
            setRegistrationSuccess(true);
        } catch (error) {
            message.error(error.response?.data?.error || 'Có lỗi xảy ra. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = () => {
        const currentPath = '/login-success';
        window.open(`${import.meta.env.VITE_API_URL}/login?redirect=${encodeURIComponent(currentPath)}`, '_self');
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.header}>
                    <div className={styles.logo}>
                        <img src="/logo_bcanvas_05_10.png" alt="B-Canvas" width={32} height={32} />
                        <span>B-Canvas</span>
                    </div>
                    <h1 className={styles.title}>Đăng ký Workspace</h1>
                </div>

                <div className={styles.formCard}>
                    {!registrationSuccess ? (
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            onValuesChange={handleFormChange}
                            className={styles.form}
                        >
                            <Form.Item
                                name="email"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email!' },
                                    { type: 'email', message: 'Email không hợp lệ!' }
                                ]}
                            >
                                <Input
                                    placeholder="Email"
                                    className={styles.input}
                                />
                            </Form.Item>
                            <Form.Item
                                name="phone"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập số điện thoại!' },
                                    {
                                        pattern: /^[0-9+\-\s()]+$/,
                                        message: 'Số điện thoại không hợp lệ!'
                                    }
                                ]}
                            >
                                <Input
                                    placeholder="Số điện thoại"
                                    className={styles.input}
                                />
                            </Form.Item>
                            <Form.Item
                                name="workspaceName"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập tên workspace!' },
                                    { min: 3, message: 'Tên workspace phải có ít nhất 3 ký tự!' }
                                ]}
                            >
                                <Input
                                    placeholder="Tên workspace"
                                    className={styles.input}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Chọn gói dịch vụ"
                                name="version"
                                rules={[
                                    { required: true, message: 'Vui lòng chọn gói dịch vụ!' }
                                ]}
                                initialValue={selectedVersion?.id}
                            >
                                {versions.length === 0 ? (
                                    <div className={styles.noVersionsMessage}>
                                        <div className={styles.noVersionsIcon}>⚠️</div>
                                        <div className={styles.noVersionsText}>
                                            <strong>Không có gói dịch vụ nào khả dụng</strong>
                                            <br />
                                            Vui lòng liên hệ quản trị viên để được hỗ trợ.
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.versionCards}>
                                        {versions.map(version => (
                                        <div
                                            key={version.id}
                                            className={`${styles.versionCard} ${
                                                selectedVersion?.id === version.id ? styles.selected : ''
                                            }`}
                                            onClick={() => {
                                                setSelectedVersion(version);
                                                form.setFieldsValue({ version: version.id });
                                            }}
                                        >
                                            <div className={styles.versionHeader}>
                                                <div className={styles.versionName}>{version.name}</div>
                                                <div className={styles.versionBadge}>
                                                    {selectedVersion?.id === version.id ? '✓' : ''}
                                                </div>
                                            </div>
                                            
                                            <div className={styles.versionDetails}>
                                                <div className={styles.versionFeature}>
                                                    <span className={styles.featureIcon}>📊</span>
                                                    <span>{version.rubikDataRowsLimit.toLocaleString()} dòng/1 file</span>
                                                </div>
                                                <div className={styles.versionFeature}>
                                                    <span className={styles.featureIcon}>🗂️</span>
                                                    <span>Tổng {version.rubikDataTotalRowsLimit.toLocaleString()} dòng rubik</span>
                                                </div>
                                                <div className={styles.versionFeature}>
                                                    <span className={styles.featureIcon}>📋</span>
                                                    <span>{version.rubikDataColumnsLimit} cột dữ liệu</span>
                                                </div>
                                            </div>
                                            
                                         
                                        </div>
                                        ))}
                                    </div>
                                )}
                            </Form.Item>



                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                disabled={!isFormValid()}
                                className={styles.submitButton}
                                block
                            >
                                Đăng ký
                            </Button>
                        </Form>
                    ) : (
                        <div className={styles.successContent}>
                            <div className={styles.successIcon}>✅</div>
                            <h2 className={styles.successTitle}>Đăng ký thành công!</h2>
                            <p className={styles.successMessage}>
                                Workspace của bạn đã được tạo thành công. Bây giờ bạn có thể đăng nhập để bắt đầu sử dụng.
                            </p>
                            <Button
                                onClick={handleLogin}
                                className={styles.loginButton}
                                block
                            >
                                Đăng nhập ngay
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkspaceRegistration;
