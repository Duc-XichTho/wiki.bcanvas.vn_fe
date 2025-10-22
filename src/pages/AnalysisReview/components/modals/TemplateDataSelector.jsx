import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Select, Tag, Typography, Button, Tooltip } from 'antd';
import { DatabaseOutlined, EyeOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

export default function TemplateDataSelector({ 
  section, 
  updateSection, 
  templateData, 
  templateKpis,
  fileNotesFull,
  kpi2Calculators 
}) {
  // Memoize the current data requirements to prevent unnecessary updates
  const currentDataRequirements = useMemo(() => {
    if (typeof section.dataRequirements === 'string') {
      // Handle old string format
      return section.dataRequirements ? section.dataRequirements.split(',').map(id => id.trim()) : [];
    } else if (section.dataRequirements && typeof section.dataRequirements === 'object') {
      // Handle new object format
      const kpiIds = section.dataRequirements.kpiSelected || [];
      const tableIds = section.dataRequirements.tableSelected || [];
      return [...kpiIds, ...tableIds];
    }
    return [];
  }, [section.dataRequirements]);

  const [selectedDataIds, setSelectedDataIds] = useState(() => {
    if (typeof section.dataRequirements === 'string') {
      // Handle old string format
      return section.dataRequirements ? section.dataRequirements.split(',').map(id => id.trim()) : [];
    } else if (section.dataRequirements && typeof section.dataRequirements === 'object') {
      // Handle new object format
      const kpiIds = section.dataRequirements.kpiSelected || [];
      const tableIds = section.dataRequirements.tableSelected || [];
      return [...kpiIds, ...tableIds];
    }
    return [];
  });

  const lastDataRequirementsRef = useRef(currentDataRequirements);
  const isUpdatingFromParentRef = useRef(false);

  // Update selectedDataIds when section.dataRequirements changes from parent
  useEffect(() => {
    // Skip if we're already updating from parent
    if (isUpdatingFromParentRef.current) return;
    
    // Check if data requirements actually changed
    if (JSON.stringify(lastDataRequirementsRef.current) === JSON.stringify(currentDataRequirements)) {
      return;
    }
    
    lastDataRequirementsRef.current = currentDataRequirements;
    
    if (JSON.stringify(selectedDataIds) !== JSON.stringify(currentDataRequirements)) {
      setSelectedDataIds(currentDataRequirements);
    }
  }, [currentDataRequirements, selectedDataIds]);

  // Update section when selectedDataIds change (only when user makes changes)
  const handleDataChange = useCallback((values) => {
    isUpdatingFromParentRef.current = true;
    setSelectedDataIds(values);
    
    // Separate KPI and table IDs
    const kpiIds = values.filter(id => templateKpis.includes(id));
    const tableIds = values.filter(id => templateData.includes(id));
    
    updateSection(section.id, 'dataRequirements', {
      kpiSelected: kpiIds,
      tableSelected: tableIds
    });
    
    // Reset flag after a short delay
    setTimeout(() => {
      isUpdatingFromParentRef.current = false;
    }, 100);
  }, [templateKpis, templateData, updateSection, section.id]);

  // Get display names for data - memoized
  const getDataDisplayName = useCallback((dataId) => {
    // Try to find in fileNotesFull first
    let fileNote = fileNotesFull.find(f => {
      const versionSuffix = f.id_version && f.id_version !== 1 ? `_v${f.id_version}` : '';
      const aiCompatibleId = `${f.id_template}${versionSuffix}`;
      return aiCompatibleId === dataId || f.id === dataId;
    });

    if (fileNote) {
      return fileNote.name;
    }

    // If not found, return the ID
    return dataId;
  }, [fileNotesFull]);

  // Get display names for KPIs - memoized
  const getKpiDisplayName = useCallback((kpiId) => {
    const kpi = kpi2Calculators.find(k => k.id === kpiId);
    return kpi ? kpi.name : kpiId;
  }, [kpi2Calculators]);

  const clearSelection = useCallback(() => {
    isUpdatingFromParentRef.current = true;
    setSelectedDataIds([]);
    updateSection(section.id, 'dataRequirements', {
      kpiSelected: [],
      tableSelected: []
    });
    
    // Reset flag after a short delay
    setTimeout(() => {
      isUpdatingFromParentRef.current = false;
    }, 100);
  }, [updateSection, section.id]);

  // Memoize the data options to prevent unnecessary re-renders
  const dataOptions = useMemo(() => {
    return templateData.map(dataId => ( 
      <Option key={dataId} value={dataId}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <DatabaseOutlined style={{ fontSize: '12px', color: '#1890ff' }} />
          {getDataDisplayName(dataId)}
        </div>
      </Option>
    ));
  }, [templateData, getDataDisplayName]);

  // Memoize the KPI options to prevent unnecessary re-renders
  const kpiOptions = useMemo(() => {
    return templateKpis.map(kpiId => ( 
      <Option key={kpiId} value={kpiId}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <EyeOutlined style={{ fontSize: '12px', color: '#52c41a' }} />
          {getKpiDisplayName(kpiId)}
        </div>
      </Option>
    ));
  }, [templateKpis, getKpiDisplayName]);

  // Memoize the selected items display
  const selectedItemsDisplay = useMemo(() => {
    if (selectedDataIds.length === 0) return null;

    return (
      <div style={{ marginTop: '8px' }}>
        <Text type="secondary" style={{ fontSize: '11px' }}>
          Đã chọn ({selectedDataIds.length}):
        </Text>
        <div style={{ 
          marginTop: '4px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px'
        }}>
          {selectedDataIds.map(id => {
            const isData = templateData.includes(id);
            const isKpi = templateKpis.includes(id);
            
            return (
              <Tooltip 
                key={id} 
                title={isData ? getDataDisplayName(id) : getKpiDisplayName(id)}
              >
                <Tag 
                  color={isData ? 'blue' : 'green'} 
                  size="small"
                  style={{ fontSize: '10px', maxWidth: '120px' }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {isData ? (
                      <DatabaseOutlined style={{ fontSize: '10px' }} />
                    ) : (
                      <EyeOutlined style={{ fontSize: '10px' }} />
                    )}
                    {isData ? getDataDisplayName(id) : getKpiDisplayName(id)}
                  </div>
                </Tag>
              </Tooltip>
            );
          })}
        </div>
      </div>
    );
  }, [selectedDataIds, templateData, templateKpis, getDataDisplayName, getKpiDisplayName]);

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <Text strong style={{ fontSize: '12px', color: '#666' }}>
          Chọn dữ liệu cho phần này:
        </Text>
        {selectedDataIds.length > 0 && (
          <Button 
            size="small" 
            onClick={clearSelection}
            style={{ fontSize: '10px', padding: '2px 6px' }}
          >
            Xóa tất cả
          </Button>
        )}
      </div>

      <Select
        mode="multiple"
        placeholder="Chọn dữ liệu từ template..."
        value={selectedDataIds}
        onChange={handleDataChange}
        style={{ width: '100%' }}
        size="small"
        maxTagCount={3}
        maxTagTextLength={20}
      >
        {/* Data options */}
        {templateData.length > 0 && (
          <Option key="data-header" disabled>
            <div style={{ 
              padding: '4px 0', 
              borderBottom: '1px solid #f0f0f0',
              marginBottom: '4px',
              fontWeight: 600,
              color: '#1890ff'
            }}>
              <DatabaseOutlined style={{ marginRight: '4px' }} />
              Bảng dữ liệu ({templateData.length})
            </div>
          </Option>
        )}
        
        {dataOptions}

        {/* KPI options */}
        {templateKpis.length > 0 && (
          <Option key="kpi-header" disabled>
            <div style={{ 
              padding: '4px 0', 
              borderBottom: '1px solid #f0f0f0',
              marginBottom: '4px',
              fontWeight: 600,
              color: '#52c41a'
            }}>
              <EyeOutlined style={{ marginRight: '4px' }} />
              KPI ({templateKpis.length})
            </div>
          </Option>
        )}
        
        {kpiOptions}
      </Select>

      {/* Show selected items */}
      {selectedItemsDisplay}

      {templateData.length === 0 && templateKpis.length === 0 && (
        <div style={{
          padding: '8px',
          backgroundColor: '#fff2e8',
          border: '1px solid #ffd591',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#d46b08'
        }}>
          ⚠️ Template chưa có dữ liệu nào được chọn. Vui lòng cấu hình dữ liệu cho template trước.
        </div>
      )}
    </div>
  );
}
