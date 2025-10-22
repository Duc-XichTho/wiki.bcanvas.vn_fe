import React from 'react';
import { Card, Typography, Tag, Divider, Space } from 'antd';
import { DatabaseOutlined, EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function OutputConfigDisplay({ 
  outputConfig, 
  analysisResult, 
  templateData = [],
  templateKpis = [],
  fileNotesFull = [],
  kpi2Calculators = []
}) {
  if (!outputConfig || !outputConfig.sections || outputConfig.sections.length === 0) {
    return (
      <Card title="Kết quả phân tích" style={{ marginTop: 16 }}>
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {analysisResult}
        </div>
      </Card>
    );
  }

  // Parse analysis result into sections
  const parseResultIntoSections = (result, sections) => {
    const parsedSections = [];
    let currentSection = null;
    let currentContent = '';

    const lines = result.split('\n');
    
    for (const line of lines) {
      // Check if line matches any section title
      const matchingSection = sections.find(section => {
        const sectionTitle = section.title.toLowerCase();
        const lineLower = line.toLowerCase();
        return lineLower.includes(sectionTitle) || 
               lineLower.startsWith(`${getSectionLetter(sections.indexOf(section))}.`) ||
               lineLower.startsWith(`${getSectionLetter(sections.indexOf(section))})`);
      });

      if (matchingSection) {
        // Save previous section
        if (currentSection && currentContent.trim()) {
          parsedSections.push({
            ...currentSection,
            content: currentContent.trim()
          });
        }
        
        // Start new section
        currentSection = matchingSection;
        currentContent = line + '\n';
      } else if (currentSection) {
        currentContent += line + '\n';
      }
    }

    // Add last section
    if (currentSection && currentContent.trim()) {
      parsedSections.push({
        ...currentSection,
        content: currentContent.trim()
      });
    }

    return parsedSections;
  };

  const getSectionLetter = (index) => {
    return String.fromCharCode(97 + index); // a, b, c, ...
  };

  const getDataDisplayName = (dataId) => {
    let fileNote = fileNotesFull.find(f => {
      const versionSuffix = f.id_version && f.id_version !== 1 ? `_v${f.id_version}` : '';
      const aiCompatibleId = `${f.id_template}${versionSuffix}`;
      return aiCompatibleId === dataId || f.id === dataId;
    });

    if (fileNote) {
      return fileNote.name;
    }
    return dataId;
  };

  const getKpiDisplayName = (kpiId) => {
    const kpi = kpi2Calculators.find(k => k.id === kpiId);
    return kpi ? kpi.name : kpiId;
  };

  const parsedSections = parseResultIntoSections(analysisResult, outputConfig.sections);

  return (
    <div style={{ marginTop: 16 }}>
      <Title level={4}>Kết quả phân tích theo cấu trúc</Title>
      
      {outputConfig.sections.map((section, index) => {
        const parsedSection = parsedSections.find(s => s.id === section.id);
        const sectionLetter = getSectionLetter(index);
        
        return (
          <Card 
            key={section.id} 
            title={
              <Space>
                <span style={{ 
                  backgroundColor: '#1890ff', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '24px', 
                  height: '24px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {sectionLetter}
                </span>
                {section.title}
              </Space>
            }
            style={{ marginBottom: 16 }}
            size="small"
          >
            {/* Data requirements */}
            {section.dataRequirements && (
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: '12px', color: '#666' }}>
                  Dữ liệu sử dụng:
                </Text>
                <div style={{ marginTop: 4 }}>
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
                    
                    return items.map((item, idx) => {
                      let displayName = item.id;
                      let icon = <DatabaseOutlined style={{ fontSize: '10px' }} />;
                      let color = 'blue';
                      
                      if (item.type === 'kpi') {
                        const kpi = kpi2Calculators?.find(k => k.id === item.id);
                        if (kpi) {
                          displayName = kpi.name;
                          icon = <EyeOutlined style={{ fontSize: '10px' }} />;
                          color = 'green';
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
                          key={idx} 
                          color={color}
                          size="small"
                          style={{ margin: '2px' }}
                        >
                          <Space size={4}>
                            {icon}
                            {displayName}
                          </Space>
                        </Tag>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Content description */}
            {section.content && (
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: '12px', color: '#666' }}>
                  Yêu cầu nội dung:
                </Text>
                <div style={{ 
                  marginTop: 4, 
                  padding: '8px', 
                  backgroundColor: '#fafafa', 
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {section.content}
                </div>
              </div>
            )}

            <Divider style={{ margin: '8px 0' }} />

            {/* Analysis content */}
            <div>
              <Text strong style={{ fontSize: '12px', color: '#666', marginBottom: 8, display: 'block' }}>
                Kết quả phân tích:
              </Text>
              <div style={{ 
                whiteSpace: 'pre-wrap', 
                fontSize: '13px',
                lineHeight: '1.5',
                backgroundColor: parsedSection ? '#f6ffed' : '#fff2e8',
                padding: '12px',
                borderRadius: '4px',
                border: `1px solid ${parsedSection ? '#b7eb8f' : '#ffd591'}`
              }}>
                {parsedSection ? (
                  parsedSection.content
                ) : (
                  <Text type="secondary" style={{ fontStyle: 'italic' }}>
                    Chưa có nội dung cho phần này trong kết quả phân tích
                  </Text>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      {/* Raw result fallback */}
      {parsedSections.length === 0 && (
        <Card title="Kết quả phân tích (dạng thô)" style={{ marginTop: 16 }}>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {analysisResult}
          </div>
        </Card>
      )}
    </div>
  );
}
