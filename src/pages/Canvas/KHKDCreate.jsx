import React, { useState, useEffect } from 'react';
import {
    Button,
    Checkbox,
    Form,
    Input,
    Modal,
    Select,
    Space,
    message
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { createKHKD, getAllKHKD } from '../../apis/khkdService';
import { createKHKDElement } from '../../apis/khkdElementService';
import { createKHKDTongHop } from '../../apis/khkdTongHopService';

const KHKDCreate = () => {
    // State variables
    const [isKHKDModalOpen, setIsKHKDModalOpen] = useState(false);
    const [isKHKDElementModalOpen, setIsKHKDElementModalOpen] = useState(false);
    const [isKHKDTongHopModalOpen, setIsKHKDTongHopModalOpen] = useState(false);
    const [khkdForm] = Form.useForm();
    const [khkdElementForm] = Form.useForm();
    const [khkdTongHopForm] = Form.useForm();
    const [khkdList, setKhkdList] = useState([]);
    const [khkdLoading, setKhkdLoading] = useState(false);

    // Fetch KHKD list when element modal is opened
    useEffect(() => {
        if (isKHKDElementModalOpen) {
            fetchKHKDList();
        }
    }, [isKHKDElementModalOpen]);

    // Fetch KHKD list function
    const fetchKHKDList = async () => {
        try {
            setKhkdLoading(true);
            const data = await getAllKHKD();
            setKhkdList(data || []);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách KHKD:', error);
        } finally {
            setKhkdLoading(false);
        }
    };

    return (
        <>
            {/* Buttons section */}
            <Space style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsKHKDModalOpen(true)}
                >
                    Tạo mới KHKD
                </Button>

                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsKHKDElementModalOpen(true)}
                >
                    Tạo mới KHKDElement
                </Button>

                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsKHKDTongHopModalOpen(true)}
                >
                    Tạo mới KHKDTongHop
                </Button>
            </Space>

            {/* Modal tạo mới KHKD */}
            <Modal
                title="Tạo mới kế hoạch kinh doanh"
                open={isKHKDModalOpen}
                onCancel={() => {
                    khkdForm.resetFields();
                    setIsKHKDModalOpen(false);
                }}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={khkdForm}
                    layout="vertical"
                    onFinish={async (values) => {
                        try {
                            const response = await createKHKD(values);
                            if (response && response.status === 200) {
                                message.success('Tạo mới KHKD thành công!');
                                khkdForm.resetFields();
                                setIsKHKDModalOpen(false);
                            }
                        } catch (error) {
                            message.error('Có lỗi xảy ra khi tạo KHKD: ' + error.message);
                        }
                    }}
                >
                    <Form.Item
                        name="name"
                        label="Tên kế hoạch"
                        rules={[{ required: true, message: 'Vui lòng nhập tên kế hoạch!' }]}
                    >
                        <Input placeholder="Nhập tên kế hoạch kinh doanh" />
                    </Form.Item>

                    {/* <Form.Item
                        name="description"
                        label="Mô tả"
                    >
                        <Input.TextArea placeholder="Nhập mô tả cho kế hoạch" rows={4} />
                    </Form.Item> */}

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Tạo mới
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal tạo mới KHKDElement */}
            <Modal
                title="Tạo mới thành phần kế hoạch kinh doanh"
                open={isKHKDElementModalOpen}
                onCancel={() => {
                    khkdElementForm.resetFields();
                    setIsKHKDElementModalOpen(false);
                }}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={khkdElementForm}
                    layout="vertical"
                    onFinish={async (values) => {
                        try {
                            const response = await createKHKDElement(values);
                            if (response && response.status === 200) {
                                message.success('Tạo mới KHKDElement thành công!');
                                khkdElementForm.resetFields();
                                setIsKHKDElementModalOpen(false);
                            }
                        } catch (error) {
                            message.error('Có lỗi xảy ra khi tạo KHKDElement: ' + error.message);
                        }
                    }}
                >
                    <Form.Item
                        name="name"
                        label="Tên thành phần"
                        rules={[{ required: true, message: 'Vui lòng nhập tên thành phần!' }]}
                    >
                        <Input placeholder="Nhập tên thành phần" />
                    </Form.Item>

                    <Form.Item
                        name="khoanMuc"
                        label="Khoản mục"
                        rules={[{ required: true, message: 'Vui lòng chọn khoản mục!' }]}
                    >
                        <Select placeholder="Chọn khoản mục">
                            <Select.Option value="khoanMuc1">Khoản mục 1</Select.Option>
                            <Select.Option value="khoanMuc2">Khoản mục 2</Select.Option>
                            <Select.Option value="khoanMuc3">Khoản mục 3</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="boPhan"
                        label="Bộ phận"
                        rules={[{ required: true, message: 'Vui lòng chọn bộ phận!' }]}
                    >
                        <Select placeholder="Chọn bộ phận">
                            <Select.Option value="boPhan1">Bộ phận 1</Select.Option>
                            <Select.Option value="boPhan2">Bộ phận 2</Select.Option>
                            <Select.Option value="boPhan3">Bộ phận 3</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="labelSoLuong"
                        label="Label số lượng"
                    >
                        <Input placeholder="Nhập label số lượng" />
                    </Form.Item>

                    <Form.Item
                        name="theoDoi"
                        valuePropName="checked"
                        label="Theo dõi"
                    >
                        <Checkbox>Theo dõi</Checkbox>
                    </Form.Item>

                    <Form.Item
                        name="idKHKD"
                        label="Kế hoạch kinh doanh"
                        rules={[{ required: true, message: 'Vui lòng chọn kế hoạch kinh doanh!' }]}
                    >
                        <Select
                            placeholder="Chọn kế hoạch kinh doanh"
                            loading={khkdLoading}
                        >
                            {khkdList?.length > 0 && khkdList.map(item => (
                                <Select.Option key={item.id} value={item.id}>
                                    {item.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Tạo mới
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal tạo mới KHKDTongHop */}
            <Modal
                title="Tạo mới tổng hợp kế hoạch kinh doanh"
                open={isKHKDTongHopModalOpen}
                onCancel={() => {
                    khkdTongHopForm.resetFields();
                    setIsKHKDTongHopModalOpen(false);
                }}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={khkdTongHopForm}
                    layout="vertical"
                    onFinish={async (values) => {
                        try {
                            // Chuẩn bị dữ liệu để gửi đi
                            const postData = {
                                name: values.name,
                                setting: values.setting ? JSON.parse(values.setting) : {},
                                settingDongTien: values.settingDongTien ? JSON.parse(values.settingDongTien) : {}
                            };
                            
                            const response = await createKHKDTongHop(postData);
                            if (response && response.status === 200) {
                                message.success('Tạo mới KHKDTongHop thành công!');
                                khkdTongHopForm.resetFields();
                                setIsKHKDTongHopModalOpen(false);
                            }
                        } catch (error) {
                            message.error('Có lỗi xảy ra khi tạo KHKDTongHop: ' + error.message);
                        }
                    }}
                >
                    <Form.Item
                        name="name"
                        label="Tên tổng hợp kế hoạch"
                        rules={[{ required: true, message: 'Vui lòng nhập tên tổng hợp kế hoạch!' }]}
                    >
                        <Input placeholder="Nhập tên tổng hợp kế hoạch kinh doanh" />
                    </Form.Item>

                    {/* <Form.Item
                        name="setting"
                        label="Cấu hình"
                    >
                        <Input.TextArea 
                            placeholder="Nhập cấu hình dạng JSON" 
                            rows={4}
                            onChange={(e) => {
                                try {
                                    // Kiểm tra nếu là JSON hợp lệ
                                    if (e.target.value) {
                                        JSON.parse(e.target.value);
                                    }
                                } catch (error) {
                                    message.warning('Cấu hình nhập vào không phải là JSON hợp lệ!');
                                }
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="settingDongTien"
                        label="Cấu hình dòng tiền"
                    >
                        <Input.TextArea 
                            placeholder="Nhập cấu hình dòng tiền dạng JSON" 
                            rows={4}
                            onChange={(e) => {
                                try {
                                    // Kiểm tra nếu là JSON hợp lệ
                                    if (e.target.value) {
                                        JSON.parse(e.target.value);
                                    }
                                } catch (error) {
                                    message.warning('Cấu hình dòng tiền nhập vào không phải là JSON hợp lệ!');
                                }
                            }}
                        />
                    </Form.Item> */}

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Tạo mới
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default KHKDCreate; 