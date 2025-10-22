import React from 'react';
import { Card, Table, Flex, Typography, Button, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function ResultsTable({ 
  tableData, 
  lastRunTime, 
  lastRunParameters, 
  onViewParameters 
}) {
  const tableColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 100,
    },
    {
      title: 'Day',
      dataIndex: 'day',
      key: 'day',
      width: 80,
    },
    {
      title: 'Forecast',
      dataIndex: 'forecast',
      key: 'forecast',
      align: 'right',
      width: 120,
    },
    {
      title: 'Actual',
      dataIndex: 'actual',
      key: 'actual',
      align: 'right',
      width: 120,
      render: (text, record) => (
        <Text strong={text !== '-'}>{text}</Text>
      ),
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      align: 'right',
      width: 120,
      render: (text) => {
        if (text === '-') return <Text type="secondary">-</Text>;
        const value = parseFloat(text);
        let color = 'red';
        if (value >= 90) color = 'green';
        else if (value >= 85) color = 'orange';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Accuracy',
      dataIndex: 'accuracy',
      key: 'accuracy',
      align: 'right',
      width: 120,
      render: (text) => {
        if (text === '-') return <Text type="secondary">-</Text>;
        const value = parseFloat(text);
        const color = value >= 97 ? 'green' : 'orange';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      width: 100,
      render: (text) => text && <Tag color="blue">{text}</Tag>,
    },
  ];

  return (
    <Card>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>📋 Detailed Results</Title>
        <Flex gap={16} align="center">
          <Text type="secondary">Updated: {lastRunTime}</Text>
          {lastRunParameters && (
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={onViewParameters}
            >
              View parameters
            </Button>
          )}
        </Flex>
      </Flex>
      
      <Table
        columns={tableColumns}
        dataSource={tableData}
        pagination={false}
        scroll={{ y: 384 }}
        size="small"
        rowClassName={(record) => record.isForecastPeriod ? 'ant-table-row-forecast' : ''}
      />
    </Card>
  );
} 