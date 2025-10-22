import css from "./KeHoachKinhDoanh.module.css";
import { Button, Col, Layout, Row, Modal, List, Card, Typography, Form, Input, DatePicker, Checkbox, message } from "antd";
import { SearchOutlined, SettingOutlined } from '@ant-design/icons';
import React, { useState, useEffect, useContext } from "react";
import CreateCategories from "./Action/CreateCategories.jsx";
import PlanManagement from "./PlanManagement/PlanManagement.jsx";
import { getAllPMVPlan, createNewPMVPlan, getPMVPlanDataById } from "../../../../apis/pmvPlanService.jsx";
import { MyContext } from "../../../../MyContext.jsx";
import { createTimestamp } from "../../../../generalFunction/format.js";
import dayjs from 'dayjs';

const { Text } = Typography;

const KeHoachKinhDoanh = () => {
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [plans, setPlans] = useState([]);
    const [filteredPlans, setFilteredPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [isChangingPlan, setIsChangingPlan] = useState(false);
    const [form] = Form.useForm();
    const { currentUser } = useContext(MyContext);

    const handleOpenSetup = () => {
        setShowSetupModal(true);
    };

    const handleCloseSetup = () => {
        setShowSetupModal(false);
        // Refresh danh sách kế hoạch sau khi thiết lập
        loadPlans();
    };

    const handleSelectPlan = async (plan) => {
        // Nếu đang chọn cùng plan thì không làm gì
        if (selectedPlan?.id === plan.id) return;
        
        setIsChangingPlan(true);
        setLoadingPlan(true);
        try {
            // Gọi API để lấy dữ liệu mới nhất của plan
            const freshPlanData = await getPMVPlanDataById(plan.id);
            setSelectedPlan(freshPlanData);
            // Reset step khi chọn plan mới
            setCurrentStep(0);
        } catch (error) {
            console.error('Error loading plan details:', error);
            message.error('Không thể tải chi tiết kế hoạch');
            // Fallback về dữ liệu cũ nếu API lỗi
            setSelectedPlan(plan);
            setCurrentStep(0);
        } finally {
            setLoadingPlan(false);
            // Delay một chút để đảm bảo UI được cập nhật
            setTimeout(() => {
                setIsChangingPlan(false);
            }, 300);
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
        if (value.trim() === '') {
            setFilteredPlans(plans);
        } else {
            const filtered = plans.filter(plan => 
                plan.name?.toLowerCase().includes(value.toLowerCase()) ||
                plan.description?.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredPlans(filtered);
        }
    };

    const showCreate = () => setShowCreateModal(true);

    const cancelCreate = () => {
        setShowCreateModal(false);
        form.resetFields();
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();

            const formattedValues = {
                ...values,
                date_from: values.date_from ? values.date_from.format('DD/MM/YYYY') : '',
                date_to: values.date_to ? values.date_to.format('DD/MM/YYYY') : '',
                track_sku_details: values.topDown === true ? 'true' : 'false',
                created_at: createTimestamp(),
                user_create: currentUser.email,
            };

            await createNewPMVPlan(formattedValues);
            form.resetFields();
            await loadPlans();
            message.success('Lưu dữ liệu thành công!');
            cancelCreate();
        } catch (error) {
            console.error('Lỗi khi lưu dữ liệu:', error);
            message.error('Lỗi khi gửi dữ liệu. Vui lòng thử lại!');
        }
    };

    // Load danh sách kế hoạch
    const loadPlans = async () => {
        setLoading(true);
        try {
            const response = await getAllPMVPlan();
            console.log('API Response:', response);

            if (response.length > 0) {
                setPlans(response);
                setFilteredPlans(response);
            }
        } catch (error) {
            console.error('Error loading plans:', error);
            setPlans([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    return (
        <>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
            <Layout style={{ height: '100vh', background: '#fff' }}>
                <div style={{
                    height: '100%',
                    display: 'flex'
                }}>
                    {/* Sidebar */}
                    <div style={{
                        width: '300px',
                        borderRight: '1px solid #e8e8e8',
                        padding: '20px',
                        background: '#fafafa',
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Header với nút thiết lập */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <Button
                                    type="primary"
                                    icon={<SettingOutlined />}
                                    onClick={handleOpenSetup}
                                    size="small"
                                    style={{ flex: 1 }}
                                    disabled={loadingPlan || isChangingPlan}
                                >
                                    Thiết lập
                                </Button>
                                <Button
                                    type="dashed"
                                    onClick={showCreate}
                                    size="small"
                                    style={{ flex: 1 }}
                                    disabled={loadingPlan || isChangingPlan}
                                >
                                    Thêm mới
                                </Button>
                            </div>
                            
                            {/* Search */}
                            <Input
                                placeholder="Tìm kiếm kế hoạch..."
                                prefix={<SearchOutlined />}
                                value={searchText}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{ marginBottom: '12px' }}
                                disabled={loadingPlan || isChangingPlan}
                            />
                        </div>

                        {/* Danh sách plans */}
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                Đang tải...
                            </div>
                        ) : filteredPlans.length > 0 ? (
                            <List
                                dataSource={filteredPlans}
                                renderItem={(plan) => (
                                    <List.Item style={{ padding: '8px 0' }}>
                                        <Card
                                            size="small"
                                            hoverable={!loadingPlan && !isChangingPlan}
                                            onClick={() => !loadingPlan && !isChangingPlan && handleSelectPlan(plan)}
                                            style={{
                                                width: '100%',
                                                cursor: (loadingPlan || isChangingPlan) ? 'not-allowed' : 'pointer',
                                                border: selectedPlan?.id === plan.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                                backgroundColor: selectedPlan?.id === plan.id ? '#f0f8ff' : '#fff',
                                                opacity: (loadingPlan || isChangingPlan) ? 0.6 : 1
                                            }}
                                        >
                                            <div>
                                                <Text strong style={{ fontSize: '14px' }}>
                                                    {plan.name || plan.title || 'Kế hoạch không tên'}
                                                </Text>
                                                {plan.description && (
                                                    <div style={{ marginTop: '4px' }}>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                                            {plan.description.length > 50
                                                                ? `${plan.description.substring(0, 50)}...`
                                                                : plan.description}
                                                        </Text>
                                                    </div>
                                                )}
                                                {plan.created_at && (
                                                    <div style={{ marginTop: '4px' }}>
                                                        <Text type="secondary" style={{ fontSize: '11px' }}>
                                                            {new Date(plan.created_at).toLocaleDateString('vi-VN')}
                                                        </Text>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                                {searchText ? 'Không tìm thấy kế hoạch nào' : 'Chưa có kế hoạch nào'}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div style={{
                        flex: 1,
                        padding: '20px',
                        overflow: 'auto'
                    }}>
                        {loadingPlan || isChangingPlan ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                color: '#999'
                            }}>
                                <div style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    border: '3px solid #f3f3f3',
                                    borderTop: '3px solid #1890ff',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                    marginBottom: '16px'
                                }}></div>
                                <div>Đang tải chi tiết kế hoạch...</div>
                            </div>
                        ) : selectedPlan ? (
                            <PlanManagement
                                selectedPlan={selectedPlan}
                                onBack={() => setSelectedPlan(null)}
                                currentStep={currentStep}
                                setCurrentStep={setCurrentStep}
                                onPlanUpdate={(updatedPlan) => {
                                    // Cập nhật selectedPlan với dữ liệu mới
                                    setSelectedPlan(updatedPlan);
                                }}
                            />
                        ) : (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                color: '#999'
                            }}>
                                Chọn một kế hoạch từ sidebar để bắt đầu
                            </div>
                        )}
                    </div>
                </div>
            </Layout>

            {/* Setup Modal */}
            <Modal
                title="Thiết lập kế hoạch"
                open={showSetupModal}
                onCancel={handleCloseSetup}
                footer={null}
                width={1800}
            >
                <div style={{ width: '100%', height: '75vh' }}>
                    <CreateCategories onClose={handleCloseSetup} />
                </div>
            </Modal>

            {/* Create Plan Modal */}
            <Modal
                title="Nhập thông tin"
                open={showCreateModal}
                onCancel={cancelCreate}
                onOk={handleSave}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Tên"
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
                    >
                        <Input placeholder="Nhập tên" />
                    </Form.Item>

                    <Form.Item
                        label="Thời gian bắt đầu"
                        name="date_from"
                        initialValue={dayjs()}
                        rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu!' }]}
                    >
                        <DatePicker
                            format="DD/MM/YYYY"
                            style={{ width: '100%' }}
                            placeholder="Chọn thời gian bắt đầu"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Thời gian kết thúc"
                        name="date_to"
                        initialValue={dayjs()}
                        rules={[{ required: true, message: 'Vui lòng chọn thời gian kết thúc!' }]}
                    >
                        <DatePicker
                            format="DD/MM/YYYY"
                            style={{ width: '100%' }}
                            placeholder="Chọn thời gian kết thúc"
                        />
                    </Form.Item>

                    <Form.Item
                        name="topDown"
                        valuePropName="checked"
                    >
                        <Checkbox>TopDown</Checkbox>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default KeHoachKinhDoanh
