import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Spin } from 'antd';
import { getTemplateInfoByTableId, getAllTemplateTableInfo } from '../../../apis/templateSettingService.jsx';

const { Option } = Select;

const LookupConfig = ({
  availableTables = [],
  currentTableColumns = [],
  initialConfig = {},
  onChange,
}) => {
  const [newColumnName, setNewColumnName] = useState(initialConfig.newColumnName || '');
  const [lookupTable, setLookupTable] = useState(initialConfig.lookupTable || '');
  const [lookupTableInfo, setLookupTableInfo] = useState(null);
  const [lookupTableColumns, setLookupTableColumns] = useState([]);
  const [joinColumn, setJoinColumn] = useState(initialConfig.joinColumn || '');
  const [lookupColumn, setLookupColumn] = useState(initialConfig.lookupColumn || '');
  const [returnColumn, setReturnColumn] = useState(initialConfig.returnColumn || '');
  const [loadingTable, setLoadingTable] = useState(false);
  const [templateTableList, setTemplateTableList] = useState([]);
  const [availableVersions, setAvailableVersions] = useState([]);
  const [lookupTableVersion, setLookupTableVersion] = useState(initialConfig.lookupTableVersion !== undefined ? initialConfig.lookupTableVersion : null);
  const [changingVersion, setChangingVersion] = useState(false);

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
      setJoinColumn(initialConfig.joinColumn || '');
      setLookupColumn(initialConfig.lookupColumn || '');
      setReturnColumn(initialConfig.returnColumn || '');
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

  // Debug log để kiểm tra version changes
  useEffect(() => {
    console.log('LookupConfig - Version changed:', {
      lookupTable,
      lookupTableVersion,
      availableVersions: availableVersions.length,
      lookupTableColumns: lookupTableColumns.length
    });
  }, [lookupTableVersion, lookupTable, availableVersions.length, lookupTableColumns.length]);

  // Gửi config lên parent
  useEffect(() => {
    onChange && onChange({
      newColumnName,
      lookupTable,
      lookupTableVersion,
      joinColumn,
      lookupColumn,
      returnColumn,
    });
    // eslint-disable-next-line
  }, [newColumnName, lookupTable, lookupTableVersion, joinColumn, lookupColumn, returnColumn]);

  // Validation: Kiểm tra xem có đủ thông tin để tạo step không
  const isValid = newColumnName && lookupTable && lookupTableVersion !== undefined && joinColumn && lookupColumn && returnColumn;

  return (
    <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 320 }}>
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
            setLookupColumn('');
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
            virtual={false}
            placeholder="Chọn phiên bản"
            value={lookupTableVersion}
            onChange={(value) => {
              setChangingVersion(true);
              setLookupTableVersion(value);
              // Reset columns when version changes
              setLookupColumn('');
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
      
      <Form.Item label="Cột nối từ bảng hiện tại" required>
        <Select
          virtual={false}
          placeholder="Chọn cột nối"
          value={joinColumn}
          onChange={setJoinColumn}
          showSearch
          optionFilterProp="children"
        >
          {currentTableColumns.map(col => (
            <Option key={col} value={col}>{col}</Option>
          ))}
        </Select>
      </Form.Item>
      
      {/* Chỉ hiển thị cột tra cứu khi đã chọn version */}
      {lookupTable && lookupTableVersion !== undefined && (
        <Form.Item label="Cột tra cứu từ bảng tham chiếu" required>
          <Select
            placeholder={loadingTable || changingVersion ? 'Đang tải...' : 'Chọn cột lookup'}
            value={lookupColumn}
            onChange={setLookupColumn}
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
      
      {/* Chỉ hiển thị cột trả về khi đã chọn version */}
      {lookupTable && lookupTableVersion !== undefined && (
        <Form.Item label="Cột trả về từ bảng tham chiếu" required>
          <Select
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
      
      {/* Validation message */}
      {!isValid && (
        <div style={{ 
          marginTop: 16, 
          padding: 8, 
          backgroundColor: '#fff2e8', 
          border: '1px solid #ffbb96', 
          borderRadius: 4,
          fontSize: '12px',
          color: '#d46b08'
        }}>
          Vui lòng điền đầy đủ thông tin: tên cột mới, bảng tra cứu, phiên bản, cột nối, cột tra cứu và cột trả về
        </div>
      )}
    </Form>
  );
};

export default LookupConfig; 