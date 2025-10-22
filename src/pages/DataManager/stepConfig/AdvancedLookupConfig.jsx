import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Spin, Button, Card, Space, Divider, message } from 'antd';
import { PlusOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getTemplateInfoByTableId, getAllTemplateTableInfo } from '../../../apis/templateSettingService.jsx';

const { Option } = Select;

const AdvancedLookupConfig = ({
    availableTables = [],
    currentTableColumns = [],
    initialConfig = {},
    onChange,
}) => {
    const [newColumnName, setNewColumnName] = useState(initialConfig.newColumnName || '');
    const [lookupTable, setLookupTable] = useState(initialConfig.lookupTable || '');
    const [lookupTableInfo, setLookupTableInfo] = useState(null);
    const [lookupTableColumns, setLookupTableColumns] = useState([]);
    const [loadingTable, setLoadingTable] = useState(false);
    const [templateTableList, setTemplateTableList] = useState([]);
    const [availableVersions, setAvailableVersions] = useState([]);
    const [lookupTableVersion, setLookupTableVersion] = useState(initialConfig.lookupTableVersion !== undefined ? initialConfig.lookupTableVersion : null);
    const [changingVersion, setChangingVersion] = useState(false);

    // Các điều kiện lookup
    const [lookupConditions, setLookupConditions] = useState(
        initialConfig.lookupConditions || [
            { currentColumn: '', lookupColumn: '', operator: '=' }
        ]
    );

    // Cột trả về
    const [returnColumn, setReturnColumn] = useState(initialConfig.returnColumn || '');

    // Xử lý lỗi
    const [errorHandling, setErrorHandling] = useState(initialConfig.errorHandling || 'error');
    const [customValue, setCustomValue] = useState(initialConfig.customValue || '');

    // Load danh sách bảng
    useEffect(() => {
        getAllTemplateTableInfo().then(res => {
            setTemplateTableList(res.data || []);
        });
    }, []);

    // Xử lý initialConfig khi edit step
    useEffect(() => {
        if (initialConfig.lookupTable) {
            setLookupTable(initialConfig.lookupTable);
            setLookupTableVersion(initialConfig.lookupTableVersion !== undefined ? initialConfig.lookupTableVersion : null);
            setNewColumnName(initialConfig.newColumnName || '');
            setReturnColumn(initialConfig.returnColumn || '');
            setLookupConditions(initialConfig.lookupConditions || [
                { currentColumn: '', lookupColumn: '', operator: '=' }
            ]);
            setErrorHandling(initialConfig.errorHandling || 'error');
            setCustomValue(initialConfig.customValue || '');
        }
    }, [initialConfig]);

    // Khi chọn bảng tra cứu, fetch thông tin bảng và lấy danh sách version
    useEffect(() => {
        if (lookupTable) {
            setLoadingTable(true);
            getTemplateInfoByTableId(lookupTable).then(tableInfo => {
                setLookupTableInfo(tableInfo);

                // Extract available versions from table info
                if (tableInfo.versions && Array.isArray(tableInfo.versions)) {
                    setAvailableVersions(tableInfo.versions);
                    // Nếu chưa chọn version, tự động chọn version gốc (null) hoặc version đầu tiên
                    if (lookupTableVersion === null && !initialConfig.lookupTableVersion) {
                        const defaultVersion = tableInfo.versions.find(v => v.version === null) || tableInfo.versions[0];
                        setLookupTableVersion(defaultVersion?.version !== undefined ? defaultVersion.version : null);
                    }
                } else {
                    setAvailableVersions([]);
                }
                setLoadingTable(false);
            }).catch(() => {
                setLookupTableInfo(null);
                setLookupTableColumns([]);
                setAvailableVersions([]);
                setLoadingTable(false);
            });
        } else {
            setLookupTableInfo(null);
            setLookupTableColumns([]);
            setAvailableVersions([]);
            setLookupTableVersion(null);
        }
    }, [lookupTable]);

    // Khi version thay đổi, lấy danh sách cột từ version đó
    useEffect(() => {
        if (lookupTable && lookupTableInfo && lookupTableVersion !== undefined) {
            setLoadingTable(true);

            // Find the specific version data
            const versionData = lookupTableInfo.versions?.find(v => v.version === lookupTableVersion);

            if (versionData && versionData.columns) {
                let columns = [];
                if (Array.isArray(versionData.columns)) {
                    columns = versionData.columns;
                } else {
                    columns = versionData.columns.map(col => {
                        if (typeof col === 'string') {
                            return col;
                        } else if (col && typeof col === 'object') {
                            return col.name || col.column_name;
                        }
                        return col;
                    });
                }
                setLookupTableColumns(columns);
            } else {
                setLookupTableColumns([]);
            }
            setLoadingTable(false);
        } else {
            setLookupTableColumns([]);
        }
    }, [lookupTable, lookupTableInfo, lookupTableVersion]);

    // Gửi config lên parent
    useEffect(() => {
        onChange && onChange({
            newColumnName,
            lookupTable,
            lookupTableVersion,
            lookupConditions,
            returnColumn,
            errorHandling,
            customValue,
        });
        // eslint-disable-next-line
    }, [newColumnName, lookupTable, lookupTableVersion, lookupConditions, returnColumn, errorHandling, customValue]);

    // Thêm điều kiện lookup mới
    const addLookupCondition = () => {
        setLookupConditions([
            ...lookupConditions,
            { currentColumn: '', lookupColumn: '', operator: '=' }
        ]);
    };

    // Xóa điều kiện lookup
    const removeLookupCondition = (index) => {
        if (lookupConditions.length > 1) {
            const newConditions = lookupConditions.filter((_, i) => i !== index);
            setLookupConditions(newConditions);
        } else {
            message.warning('Phải có ít nhất một điều kiện lookup');
        }
    };

    // Cập nhật điều kiện lookup
    const updateLookupCondition = (index, field, value) => {
        const newConditions = [...lookupConditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        setLookupConditions(newConditions);
    };

    // Validation: Kiểm tra xem có đủ thông tin để tạo step không
    const isValid = newColumnName &&
        lookupTable &&
        lookupTableVersion !== undefined &&
        returnColumn &&
        lookupConditions.every(condition =>
            condition.currentColumn && condition.lookupColumn && condition.operator
        );

    return (
        <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 400 }}>
            <Form.Item label="Tên cột mới" required>
                <Input
                    placeholder="New column name"
                    value={newColumnName}
                    onChange={e => setNewColumnName(e.target.value)}
                />
            </Form.Item>

            <Form.Item label="Chọn bảng tra cứu" required>
                <Select
                    placeholder="Chọn bảng tra cứu"
                    value={lookupTable}
                    onChange={value => {
                        setLookupTable(value);
                        setLookupConditions([{ currentColumn: '', lookupColumn: '', operator: '=' }]);
                        setReturnColumn('');
                        setLookupTableVersion(null);
                    }}
                    showSearch
                    optionFilterProp="children"
                >
                    {templateTableList.map(table => (
                        <Option key={table.id} value={table.id}>{table.name}</Option>
                    ))}
                </Select>
            </Form.Item>

            {/* Version Selection */}
            {lookupTable && availableVersions.length > 0 && (
                <Form.Item label="Phiên bản bảng tra cứu" required>
                    <Select
                        placeholder="Chọn phiên bản"
                        value={lookupTableVersion}
                        onChange={(value) => {
                            setChangingVersion(true);
                            setLookupTableVersion(value);
                            // Reset conditions when version changes
                            setLookupConditions([{ currentColumn: '', lookupColumn: '', operator: '=' }]);
                            setReturnColumn('');
                            // Force re-render after a short delay to ensure state is updated
                            setTimeout(() => {
                                setChangingVersion(false);
                            }, 100);
                        }}
                        showSearch
                        optionFilterProp="children"
                    >
                        {availableVersions.map(version => (
                            <Option key={version.version} value={version.version}>
                                Phiên bản {version.version === null ? "gốc" : version.version}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            )}

                  {/* Điều kiện lookup */}
      <Card 
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#1890ff' }} />
            Điều kiện lookup (nhiều điều kiện)
          </Space>
        }
        size="small"
      >
      

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lookupConditions.map((condition, index) => (
            <div key={index} style={{ 
              display: 'grid',
              gridTemplateColumns: '80px 1fr 100px 1fr 40px',
              gap: '8px',
              alignItems: 'center',
              padding: '12px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {/* Số thứ tự điều kiện */}
              <div style={{
                fontSize: '12px',
                color: '#666',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                Điều kiện {index + 1}
              </div>
              
              {/* Cột từ bảng hiện tại */}
              <div style={{ position: 'relative' }}>
                <Select
                  virtual={false}
                  placeholder="Chọn cột bảng gốc"
                  value={condition.currentColumn}
                  onChange={(value) => updateLookupCondition(index, 'currentColumn', value)}
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="children"
                >
                  {currentTableColumns.map(col => (
                    <Option key={col} value={col}>{col}</Option>
                  ))}
                </Select>
                <div style={{
                  position: 'absolute',
                  top: '-18px',
                  left: '8px',
                  fontSize: '10px',
                  color: '#1890ff',
                  backgroundColor: '#ffffff',
                  padding: '0 4px'
                }}>
                  Bảng gốc
                </div>
              </div>
              
              {/* Toán tử so sánh */}
              <Select
                value={condition.operator}
                onChange={(value) => updateLookupCondition(index, 'operator', value)}
                style={{ width: '100%' }}
              >
                <Option value="=">=</Option>
                <Option value="!=">!= (khác)</Option>
                <Option value=">">{'>'}</Option>
                <Option value="<">{'<'}</Option>
                <Option value=">=">{'>='}</Option>
                <Option value="<=">{'<='}</Option>
                <Option value="contains">chứa</Option>
                <Option value="starts_with">bắt đầu với</Option>
                <Option value="ends_with">kết thúc với</Option>
              </Select>
              
              {/* Cột từ bảng lookup */}
              <div style={{ position: 'relative' }}>
                <Select
                  virtual={false}
                  placeholder="Chọn cột tham chiếu"
                  value={condition.lookupColumn}
                  onChange={(value) => updateLookupCondition(index, 'lookupColumn', value)}
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="children"
                  disabled={loadingTable || changingVersion || !lookupTableColumns.length}
                >
                  {lookupTableColumns.map(col => (
                    <Option key={col} value={col}>{col}</Option>
                  ))}
                </Select>
                <div style={{
                  position: 'absolute',
                  top: '-18px',
                  left: '8px',
                  fontSize: '10px',
                  color: '#52c41a',
                  backgroundColor: '#ffffff',
                  padding: '0 4px'
                }}>
                  Bảng tham chiếu
                </div>
              </div>
              
              {/* Nút xóa điều kiện */}
              <div style={{ textAlign: 'center' }}>
                {lookupConditions.length > 1 && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeLookupCondition(index)}
                    size="small"
                    title="Xóa điều kiện này"
                  />
                )}
              </div>
            </div>
          ))}
          
          <Button
            type="dashed"
            onClick={addLookupCondition}
            icon={<PlusOutlined />}
            style={{ marginTop: 8, alignSelf: 'center' }}
          >
            Thêm điều kiện mới
          </Button>
        </div>

       
      </Card>

            {/* Cột trả về */}
            {lookupTable && lookupTableVersion !== undefined && (
                <Form.Item label="Cột trả về từ bảng tham chiếu" required>
                    <Select
                        virtual={false}
                        placeholder={loadingTable || changingVersion ? 'Đang tải...' : 'Chọn cột trả về'}
                        value={returnColumn}
                        onChange={setReturnColumn}
                        loading={loadingTable || changingVersion}
                        disabled={loadingTable || changingVersion || !lookupTableColumns.length}
                        showSearch
                        optionFilterProp="children"
                    >
                        {lookupTableColumns.map(col => (
                            <Option key={col} value={col}>{col}</Option>
                        ))}
                    </Select>
                </Form.Item>
            )}

            {/* Xử lý lỗi */}
            <Form.Item label="Xử lý khi không tìm thấy kết quả">
                <Select
                    value={errorHandling}
                    onChange={setErrorHandling}
                >
                    <Option value="error">Trả về "Error"</Option>
                    <Option value="null">Trả về null</Option>
                    <Option value="empty">Trả về chuỗi rỗng</Option>
                    <Option value="custom">Giá trị tùy chỉnh</Option>
                </Select>
            </Form.Item>

            {/* Giá trị tùy chỉnh */}
            {errorHandling === 'custom' && (
                <Form.Item label="Giá trị tùy chỉnh">
                    <Input
                        placeholder="Nhập giá trị tùy chỉnh"
                        value={customValue}
                        onChange={e => setCustomValue(e.target.value)}
                    />
                </Form.Item>
            )}

                  {/* Validation message */}
      {!isValid && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          backgroundColor: '#fff2e8', 
          border: '1px solid #ffbb96', 
          borderRadius: 6,
          fontSize: '12px',
          color: '#d46b08'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            ⚠️ Vui lòng điền đầy đủ thông tin:
          </div>
          <div style={{ marginLeft: '16px' }}>
            <div>• Tên cột mới</div>
            <div>• Bảng tra cứu</div>
            <div>• Phiên bản bảng tra cứu</div>
            <div>• Các điều kiện lookup (cột bảng gốc, toán tử, cột bảng tham chiếu)</div>
            <div>• Cột trả về từ bảng tham chiếu</div>
          </div>
        </div>
      )}

                  {/* Preview config */}
      {isValid && (
        <Card title="Xem trước cấu hình" size="small" style={{ backgroundColor: '#f6ffed' }}>
          <div style={{ fontSize: '12px', color: '#52c41a' }}>
            <div><strong>Tên cột mới:</strong> {newColumnName}</div>
            <div><strong>Bảng tra cứu:</strong> {templateTableList.find(t => t.id === lookupTable)?.name}</div>
            <div><strong>Phiên bản:</strong> {lookupTableVersion === null ? 'gốc' : lookupTableVersion}</div>
            <div><strong>Điều kiện lookup:</strong></div>
            <div style={{ 
              marginLeft: 16, 
              marginTop: 8,
              padding: '8px',
              backgroundColor: '#ffffff',
              borderRadius: '4px',
              border: '1px solid #b7eb8f'
            }}>
              {lookupConditions.map((condition, index) => (
                <div key={index} style={{ 
                  marginBottom: '4px',
                  padding: '4px 8px',
                  backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff',
                  borderRadius: '3px',
                  border: '1px solid #e8e8e8'
                }}>
                  <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                   {condition.currentColumn}
                  </span>
                  <span style={{ margin: '0 8px', color: '#666' }}>
                    {condition.operator}
                  </span>
                  <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    {condition.lookupColumn}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8 }}><strong>Cột trả về:</strong> {returnColumn}</div>
            <div><strong>Xử lý lỗi:</strong> {errorHandling}{errorHandling === 'custom' ? ` (${customValue})` : ''}</div>
          </div>
        </Card>
      )}
        </Form>
    );
};

export default AdvancedLookupConfig;
