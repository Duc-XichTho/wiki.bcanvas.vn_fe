import React from 'react';
import { Modal, Flex, Typography, Button, Table, Card, Space, Select, Input } from 'antd';
import { PlayCircleOutlined, PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

export default function ForecastModal({
  showRunModal,
  setShowRunModal,
  forecastParameters,
  handleParameterChange,
  handlePromotionChange,
  promotionTypes,
  brandingTypes,
  onRunForecast,
  onCreateCampaign
}) {
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      fixed: 'left',
    },
    {
      title: 'Day',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      width: 80,
      fixed: 'left',
    },
    {
      title: 'Promotion 1',
      key: 'promotion1',
      width: 200,
      render: (_, record) => (
        <Card size="small" style={{ backgroundColor: record.promotion1.type ? '#e6f7ff' : '#fafafa' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              placeholder="No promotion"
              value={record.promotion1.type}
              onChange={(value) => handlePromotionChange(record.id, 1, 'type', value)}
              style={{ width: '100%' }}
            >
              {promotionTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
            
            {record.promotion1.type && (
              <>
                <Input
                  placeholder="Tags (North, South) or Stores (Store 1, Store 2)"
                  value={record.promotion1.target}
                  onChange={(e) => handlePromotionChange(record.id, 1, 'target', e.target.value)}
                />
                <Input
                  placeholder="Impact % (e.g., 15%)"
                  value={record.promotion1.impact}
                  onChange={(e) => handlePromotionChange(record.id, 1, 'impact', e.target.value)}
                />
              </>
            )}
          </Space>
        </Card>
      ),
    },
    {
      title: 'Promotion 2',
      key: 'promotion2',
      width: 200,
      render: (_, record) => (
        <Card size="small" style={{ backgroundColor: record.promotion2.type ? '#f6ffed' : '#fafafa' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              placeholder="No promotion"
              value={record.promotion2.type}
              onChange={(value) => handlePromotionChange(record.id, 2, 'type', value)}
              style={{ width: '100%' }}
            >
              {promotionTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
            
            {record.promotion2.type && (
              <>
                <Input
                  placeholder="Tags (North, South) or Stores (Store 1, Store 2)"
                  value={record.promotion2.target}
                  onChange={(e) => handlePromotionChange(record.id, 2, 'target', e.target.value)}
                />
                <Input
                  placeholder="Impact % (e.g., 10%)"
                  value={record.promotion2.impact}
                  onChange={(e) => handlePromotionChange(record.id, 2, 'impact', e.target.value)}
                />
              </>
            )}
          </Space>
        </Card>
      ),
    },
    {
      title: 'Branding Campaign',
      key: 'branding',
      width: 200,
      render: (_, record) => (
        <Card size="small" style={{ backgroundColor: (record.branding.type || record.branding.expense) ? '#f9f0ff' : '#fafafa' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              placeholder="No branding campaign"
              value={record.branding.type}
              onChange={(value) => handleParameterChange(record.id, 'branding', 'type', value)}
              style={{ width: '100%' }}
            >
              {brandingTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
            
            <Input
              placeholder="Budget (VND) e.g., 1,000,000"
              value={record.branding.expense}
              onChange={(e) => handleParameterChange(record.id, 'branding', 'expense', e.target.value)}
            />
            
            {(record.branding.type || record.branding.expense) && (
              <Input
                placeholder="Tags (North, South) or Stores (Store 1, Store 2)"
                value={record.branding.target}
                onChange={(e) => handleParameterChange(record.id, 'branding', 'target', e.target.value)}
              />
            )}
          </Space>
        </Card>
      ),
    },
  ];

  return (
    <Modal
      title="⚙️ Configure Forecast Parameters"
      open={showRunModal}
      onCancel={() => setShowRunModal(false)}
      width="95vw"
      style={{ top: 20 }}
      footer={[
        <Button key="cancel" onClick={() => setShowRunModal(false)}>
          Cancel
        </Button>,
        <Button key="run" type="primary" icon={<PlayCircleOutlined />} onClick={onRunForecast}>
          Run Forecast
        </Button>,
      ]}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Configure promotion campaigns and branding expenses for the next 9 days. Use tags (North, South, Central) or specific store names.
          </Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreateCampaign}
          >
            Create Campaign
          </Button>
        </Flex>
        
        <Flex gap={16} style={{ marginBottom: 16 }}>
          <Flex align="center" gap={8}>
            <div style={{ width: 12, height: 12, backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 2 }}></div>
            <Text style={{ fontSize: 12 }}>Promotion 1</Text>
          </Flex>
          <Flex align="center" gap={8}>
            <div style={{ width: 12, height: 12, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 2 }}></div>
            <Text style={{ fontSize: 12 }}>Promotion 2</Text>
          </Flex>
          <Flex align="center" gap={8}>
            <div style={{ width: 12, height: 12, backgroundColor: '#f9f0ff', border: '1px solid #d3adf7', borderRadius: 2 }}></div>
            <Text style={{ fontSize: 12 }}>Branding Campaign</Text>
          </Flex>
        </Flex>

        <Table
          columns={columns}
          dataSource={forecastParameters}
          pagination={false}
          scroll={{ x: 800 }}
          size="small"
        />
      </div>
    </Modal>
  );
} 