import React from 'react';
import { Modal, Button, Table, Space, Typography } from 'antd';

const { Text } = Typography;

export default function ParameterLogModal({
  showParameterLog,
  setShowParameterLog,
  lastRunParameters
}) {
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 100,
    },
    {
      title: 'Day',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      width: 80,
    },
    {
      title: 'Promotions',
      key: 'promotions',
      render: (_, record) => (
        <Space direction="vertical" style={{ width: '100%' }}>
          {record.promotion1.type && (
            <div>
              <Text strong>{record.promotion1.type}</Text>
              {record.promotion1.target && (
                <Text type="secondary"> → {record.promotion1.target}</Text>
              )}
              {record.promotion1.impact && (
                <Text type="primary"> ({record.promotion1.impact})</Text>
              )}
            </div>
          )}
          {record.promotion2.type && (
            <div>
              <Text strong>{record.promotion2.type}</Text>
              {record.promotion2.target && (
                <Text type="secondary"> → {record.promotion2.target}</Text>
              )}
              {record.promotion2.impact && (
                <Text type="success"> ({record.promotion2.impact})</Text>
              )}
            </div>
          )}
          {!record.promotion1.type && !record.promotion2.type && (
            <Text type="secondary">No promotions</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Branding',
      key: 'branding',
      render: (_, record) => (
        <Space direction="vertical" style={{ width: '100%' }}>
          {record.branding.type && (
            <div>
              <Text strong>{record.branding.type}</Text>
              {record.branding.expense && (
                <Text type="primary"> ({record.branding.expense} VND)</Text>
              )}
              {record.branding.target && (
                <Text type="secondary"> → {record.branding.target}</Text>
              )}
            </div>
          )}
          {record.branding.expense && !record.branding.type && (
            <div>
              <Text strong>{record.branding.expense} VND</Text>
              {record.branding.target && (
                <Text type="secondary"> → {record.branding.target}</Text>
              )}
            </div>
          )}
          {!record.branding.type && !record.branding.expense && (
            <Text type="secondary">No branding</Text>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={`📋 Last Run Parameters - ${lastRunParameters?.timestamp}`}
      open={showParameterLog}
      onCancel={() => setShowParameterLog(false)}
      width="80%"
      footer={[
        <Button key="close" type="primary" onClick={() => setShowParameterLog(false)}>
          Close
        </Button>,
      ]}
    >
      {lastRunParameters && (
        <Table
          columns={columns}
          dataSource={lastRunParameters.parameters}
          pagination={false}
          size="small"
        />
      )}
    </Modal>
  );
} 