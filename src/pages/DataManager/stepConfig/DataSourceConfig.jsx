import React, { useState } from 'react';
import { Form, Select, Upload, Button, Checkbox, Space, message } from 'antd';
import { UploadOutlined, GoogleOutlined } from '@ant-design/icons';

const { Option } = Select;

const DataSourceConfig = ({ initialConfig = {}, onChange }) => {
  const [form] = Form.useForm();
  const [sourceType, setSourceType] = useState(initialConfig.sourceType || '');
  const [file, setFile] = useState(initialConfig.file || null);
  const [connection, setConnection] = useState(initialConfig.connection || null);
  const [postProcessing, setPostProcessing] = useState({
    trimColumns: initialConfig.postProcessing?.trimColumns || false,
    sentenceCase: initialConfig.postProcessing?.sentenceCase || false,
  });

  // Mock connection object for GSheet
  const mockGSheetConnection = { id: 'gsheet-123', name: 'Demo Google Sheet' };

  const handleSourceTypeChange = (value) => {
    setSourceType(value);
    setFile(null);
    setConnection(null);
    setPostProcessing({ trimColumns: false, sentenceCase: false });
    if (onChange) onChange({ sourceType: value, file: null, connection: null, postProcessing: { trimColumns: false, sentenceCase: false } });
    form.setFieldsValue({ file: undefined });
  };

  const handleFileChange = (info) => {
    if (info.file.status === 'done' || info.file.status === 'uploading') {
      setFile(info.file.originFileObj);
      if (onChange) onChange({ sourceType, file: info.file.originFileObj, connection, postProcessing });
    }
  };

  const handleConnectGSheet = () => {
    setConnection(mockGSheetConnection);
    message.success('Connected to Google Sheets!');
    if (onChange) onChange({ sourceType, file, connection: mockGSheetConnection, postProcessing });
  };

  const handlePostProcessingChange = (e) => {
    const { name, checked } = e.target;
    const next = { ...postProcessing, [name]: checked };
    setPostProcessing(next);
    if (onChange) onChange({ sourceType, file, connection, postProcessing: next });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 400 }}
      initialValues={{
        sourceType,
        file,
        postProcessing,
      }}
    >
      <Form.Item
        label="Source Type"
        name="sourceType"
        rules={[{ required: true, message: 'Please select a source type' }]}
        style={{ marginBottom: 0 }}
      >
        <Select placeholder="Select source type" onChange={handleSourceTypeChange} value={sourceType} allowClear>
          <Option value="excel">Upload Excel</Option>
          <Option value="api">Make API</Option>
          <Option value="gsheet">Connect GSheet</Option>
          <Option value="file">File (PDF/Doc)</Option>
          <Option value="text">Text Document</Option>
        </Select>
      </Form.Item>

      {(sourceType === 'excel' || sourceType === 'gsheet') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {sourceType === 'excel' ? (
            <Form.Item name="file" valuePropName="fileList" getValueFromEvent={e => e && e.fileList} noStyle>
              <Upload
                beforeUpload={() => false}
                maxCount={1}
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                showUploadList={file ? [{ name: file.name }] : false}
              >
                <Button icon={<UploadOutlined />}>Upload Excel File</Button>
              </Upload>
            </Form.Item>
          ) : (
            <Button icon={<GoogleOutlined />} type="primary" onClick={handleConnectGSheet}>
              {connection ? 'Connected: ' + connection.name : 'Connect to Google Sheets'}
            </Button>
          )}
        </div>
      )}

      {(sourceType === 'excel' || sourceType === 'gsheet') && (
        <div className="post-processing-section" style={{ display: 'flex', gap: 24, marginTop: 8 }}>
          <Checkbox
            name="trimColumns"
            checked={postProcessing.trimColumns}
            onChange={handlePostProcessingChange}
          >
            Trim all columns
          </Checkbox>
          <Checkbox
            name="sentenceCase"
            checked={postProcessing.sentenceCase}
            onChange={handlePostProcessingChange}
          >
            Transform to Sentence Case
          </Checkbox>
        </div>
      )}
    </Form>
  );
};

export default DataSourceConfig; 