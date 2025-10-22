import React, { useState, useEffect } from 'react';
import { Checkbox, Radio, Form, Space } from 'antd';

const RemoveDuplicateConfig = ({ availableColumns = [], initialConfig = {}, onChange }) => {
  const [selectedColumns, setSelectedColumns] = useState(initialConfig.columns || []);
  const [keepFirst, setKeepFirst] = useState(
    typeof initialConfig.keepFirst === 'boolean' ? initialConfig.keepFirst : true
  );

  useEffect(() => {
    if (onChange) onChange({ columns: selectedColumns, keepFirst });
    // eslint-disable-next-line
  }, [selectedColumns, keepFirst]);

  return (
    <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 320 }}>
      <Form.Item label="Chọn các cột để kiểm tra trùng lặp" required>
        <Checkbox.Group
          options={availableColumns.map(col => ({ label: col, value: col }))}
          value={selectedColumns}
          onChange={setSelectedColumns}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        />
      </Form.Item>
      <Form.Item label="Giữ lại bản ghi" required>
        <Radio.Group
          value={keepFirst}
          onChange={e => setKeepFirst(e.target.value)}
          style={{ display: 'flex', flexDirection: 'row', gap: 24 }}
        >
          <Radio value={true}>Giữ bản ghi đầu tiên</Radio>
          <Radio value={false}>Giữ bản ghi cuối cùng</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  );
};

export default RemoveDuplicateConfig; 