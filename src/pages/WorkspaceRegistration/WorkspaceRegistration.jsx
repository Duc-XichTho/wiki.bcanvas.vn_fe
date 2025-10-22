import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { createDemoSchemaPublicController } from '../../apis/public/publicService.jsx';
import { getSettingByType } from '../../apis/settingService';
import styles from './WorkspaceRegistration.module.css';

const WorkspaceRegistration = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [defaultVersion, setDefaultVersion] = useState(null);

    // Load default version khi component mount
    useEffect(() => {
        const loadDefaultVersion = async () => {
            try {
                const response = await getSettingByType('GLOBAL_SCHEMA_VERSIONS');
                const versions = response?.setting || [];
                if (versions.length > 0) {
                    setDefaultVersion(versions[0]); // Chọn version đầu tiên
                }
            } catch (error) {
                console.error('Lỗi khi lấy default version:', error);
            }
        };
        loadDefaultVersion();
    }, []);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const currentDate = new Date();
            const expiredDate = new Date(currentDate);
            expiredDate.setDate(expiredDate.getDate() + 90);

            const requestData = {
                email: values.email,
                phone: values.phone || null,
                schema: {
                    status: true,
                    description: defaultVersion?.name,
                    path: values.workspaceName,
                    created_at: currentDate.toISOString(),
                    expired_at: expiredDate.toISOString(),
                    // Auto apply default version nếu có
                    ...(defaultVersion && {
                        limit_user: defaultVersion.userNumberLimit,
                        version_id: defaultVersion.id,
                        version_data: {
                            contextInstruction: defaultVersion.contextInstruction,
                            tokenSize: defaultVersion.tokenSize,
                            rubikDataRowsLimit: defaultVersion.rubikDataRowsLimit,
                            rubikDataColumnsLimit: defaultVersion.rubikDataColumnsLimit,
                            userNumberLimit: defaultVersion.userNumberLimit,
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
                                    {
                                        pattern: /^[0-9+\-\s()]+$/,
                                        message: 'Số điện thoại không hợp lệ!'
                                    }
                                ]}
                            >
                                <Input
                                    placeholder="Số điện thoại (không bắt buộc)"
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



                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
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
