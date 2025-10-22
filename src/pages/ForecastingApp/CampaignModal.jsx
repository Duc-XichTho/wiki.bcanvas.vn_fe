import React from 'react';
import { Modal, Button, Form, Input, Radio } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

export default function CampaignModal({
  showCampaignModal,
  setShowCampaignModal,
  form,
  handleCreateCampaign
}) {
  return (
    <Modal
      title="🎯 Create New Campaign"
      open={showCampaignModal}
      onCancel={() => setShowCampaignModal(false)}
      footer={[
        <Button key="cancel" onClick={() => setShowCampaignModal(false)}>
          Cancel
        </Button>,
        <Button key="create" type="primary" icon={<CheckOutlined />} onClick={handleCreateCampaign}>
          Create Campaign
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="type"
          label="Campaign Type"
          initialValue="promotion"
        >
          <Radio.Group>
            <Radio value="promotion">Promotion Campaign</Radio>
            <Radio value="branding">Branding Campaign</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="name"
          label="Campaign Name"
          rules={[{ required: true, message: 'Please enter campaign name!' }]}
        >
          <Input placeholder="e.g., Flash Sale 50%" />
        </Form.Item>

        <Form.Item
          name="category"
          label="Category"
        >
          <Input placeholder="e.g., Discount, Bundle" />
        </Form.Item>

        <Form.Item
          name="impact"
          label="Expected Impact"
        >
          <Input placeholder="e.g., +25% sales, +15% traffic" />
        </Form.Item>

        <Form.Item
          name="budget"
          label="Typical Budget Range"
        >
          <Input placeholder="e.g., 1,000,000 - 5,000,000 VND" />
        </Form.Item>

        <Form.Item
          name="target"
          label="Default Target"
        >
          <Input placeholder="e.g., North, South or specific stores" />
        </Form.Item>
      </Form>
    </Modal>
  );
} 