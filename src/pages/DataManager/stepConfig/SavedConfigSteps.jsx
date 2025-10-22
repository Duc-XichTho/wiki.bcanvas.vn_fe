import React from 'react';
import { List, Card, Tag, Typography } from 'antd';

const { Text } = Typography;

const stepTypeName = {
  0: 'Data Source',
  1: 'Remove Duplicate',
  2: 'Fill Missing',
  3: 'Outlier Detection',
  4: 'Lookup',
  5: 'Calculated Column',
  6: 'Add Column',
  7: 'Cross-table Mapping',
  8: 'Smart Fill',
  9: 'Filter',
  10: 'Aggregate',
  11: 'Code-based New column',
};

function getStepSummary(step) {
  switch (step.type) {
    case 0:
      return `Source: ${step.config?.sourceType || ''}`;
    case 1:
      return `Columns: ${(step.config?.columns || []).join(', ')} | Keep: ${step.config?.keepFirst ? 'First' : 'Last'}`;
    case 2:
      return `Column: ${step.config?.column}, Fill: ${step.config?.fillType}`;
    case 3:
      return `Column: ${step.config?.column}, Method: ${step.config?.method}`;
    case 4:
      return `Lookup: ${step.config?.lookupTable} → ${step.config?.returnColumn}`;
    case 5:
      return `New: ${step.config?.newColumnName}, Formula: ${step.config?.formula}`;
    case 6:
      return `Add: ${step.config?.columnName}, Type: ${step.config?.dataType}`;
    case 7:
      return `Map: ${step.config?.sourceColumn} → ${step.config?.mappingColumn}`;
    case 8:
      return `Smart Fill: ${step.config?.targetColumn}`;
    case 9:
      return `Filter: ${step.config?.conditions?.length || 0} conditions`;
    case 10:
      return `Group by: ${step.config?.groupBy}`;
    case 11:
      return `Add: ${step.config?.columnName}, JS: ${step.config?.expression}`;
    default:
      return '';
  }
}

const SavedConfigSteps = ({ steps = [] }) => (
  <Card title="Các bước xử lý đã lưu" style={{ marginBottom: 24 }}>
    <List
      dataSource={steps}
      renderItem={(step, idx) => (
        <List.Item>
          <List.Item.Meta
            title={<span><Tag color="blue">{stepTypeName[step.type] || 'Unknown'}</Tag> Bước {idx + 1}</span>}
            description={<Text type="secondary">{getStepSummary(step)}</Text>}
          />
        </List.Item>
      )}
      locale={{ emptyText: 'Chưa có bước nào.' }}
    />
  </Card>
);

export default SavedConfigSteps; 