import React from 'react';
import { Card, Typography, Tag, Divider } from 'antd';
import { FileTextOutlined, DatabaseOutlined, EyeOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export default function OutputPreview({ outputConfig, fileNotesFull = [], kpi2Calculators = [] }) {
  if (!outputConfig?.sections || outputConfig.sections.length === 0) {
    return null;
  }

  const getSectionLetter = (index) => {
    return String.fromCharCode(97 + index); // a, b, c, ...
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <Title level={5} style={{ margin: '0 0 12px 0' }}>
        📋 Cấu trúc đầu ra đã cấu hình
      </Title>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {outputConfig.sections.map((section, index) => (
          <Card
            key={section.id}
            size="small"
            style={{ 
              border: '1px solid #e8e8e8',
              borderRadius: '6px'
            }}
            bodyStyle={{ padding: '8px 12px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Tag color="blue" style={{ margin: 0, fontWeight: 'bold' }}>
                {getSectionLetter(index)}
              </Tag>
              <Text strong style={{ fontSize: '13px' }}>
                {section.title || `Phần ${getSectionLetter(index).toUpperCase()}`}
              </Text>
            </div>
            
            {section.content && (
              <div style={{ marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <FileTextOutlined style={{ fontSize: '10px', color: '#666' }} />
                  <Text type="secondary" style={{ fontSize: '11px' }}>Nội dung:</Text>
                </div>
                <Text style={{ fontSize: '12px', color: '#333', marginLeft: '14px' }}>
                  {section.content}
                </Text>
              </div>
            )}
            
            {section.dataRequirements && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <DatabaseOutlined style={{ fontSize: '10px', color: '#666' }} />
                  <Text type="secondary" style={{ fontSize: '11px' }}>Dữ liệu sử dụng:</Text>
                </div>
                <div style={{ marginLeft: '14px' }}>
                  {(() => {
                    let items = [];
                    
                    if (typeof section.dataRequirements === 'string') {
                      // Handle old string format
                      items = section.dataRequirements.split(',').map(item => ({
                        id: item.trim(),
                        type: 'unknown'
                      }));
                    } else if (section.dataRequirements && typeof section.dataRequirements === 'object') {
                      // Handle new object format
                      const kpiItems = (section.dataRequirements.kpiSelected || []).map(id => ({
                        id: id,
                        type: 'kpi'
                      }));
                      const tableItems = (section.dataRequirements.tableSelected || []).map(id => ({
                        id: id,
                        type: 'table'
                      }));
                      items = [...kpiItems, ...tableItems];
                    }
                    
                    return items.map((item, index) => {
                      let displayName = item.id;
                      let icon = <DatabaseOutlined style={{ fontSize: '10px' }} />;
                      
                      if (item.type === 'kpi') {
                        const kpi = kpi2Calculators?.find(k => k.id === item.id);
                        if (kpi) {
                          displayName = kpi.name;
                          icon = <EyeOutlined style={{ fontSize: '10px' }} />;
                        }
                      } else {
                        // Try to find display name for data
                        let fileNote = fileNotesFull?.find(f => {
                          const versionSuffix = f.id_version && f.id_version !== 1 ? `_v${f.id_version}` : '';
                          const aiCompatibleId = `${f.id_template}${versionSuffix}`;
                          return aiCompatibleId === item.id || f.id === item.id;
                        });
                        if (fileNote) {
                          displayName = fileNote.name;
                        }
                      }
                      
                      return (
                        <Tag 
                          key={index} 
                          size="small" 
                          style={{ fontSize: '10px', margin: '2px' }}
                        >
                          {icon} {displayName}
                        </Tag>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
      
      <Divider style={{ margin: '12px 0' }} />
      
      <div style={{
        padding: '8px 12px',
        backgroundColor: '#f6ffed',
        border: '1px solid #b7eb8f',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <Text type="success">
          ✅ Prompt đã được tự động tạo và sẽ hướng dẫn AI trả lời theo cấu trúc trên.
        </Text>
      </div>
    </div>
  );
}
