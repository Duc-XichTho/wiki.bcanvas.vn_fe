import React, { useEffect, useMemo, useState } from 'react';
import { Card, Checkbox, Divider, List, Select, Space, Switch, Typography } from 'antd';
import { getAllFileNotePad } from '../../../../../apis/fileNotePadService.jsx';
import { getAllTemplateSheetTable } from '../../../../../apis/templateSettingService.jsx';
import { getAllApprovedVersion } from '../../../../../apis/approvedVersionTemp.jsx';

const { Text } = Typography;

// Props:
// - initialConfig: { sources?: [{ tableId:number, version?: number|null }], includeInput?: boolean }
// - onChange: (config) => void
// - availableTables: [{ id, name, fileNote_id }]
export default function UnionTablesConfig({ initialConfig = {}, onChange }) {
  const [loading, setLoading] = useState(false);
  const [availableTargetTables, setAvailableTargetTables] = useState([]);

  const config = useMemo(() => ({ sources: [], includeInput: true, ...(initialConfig || {}) }), [initialConfig]);

  // Fetch danh sách bảng và version giống JoinTableConfig
  useEffect(() => {
    const fetchTargetTables = async () => {
      setLoading(true);
      try {
        const [fileNotesData, templateTablesData] = await Promise.all([
          getAllFileNotePad(),
          getAllTemplateSheetTable(),
          // getAllApprovedVersion() // không bắt buộc cho union
        ]);

        const targetTables = [];

        fileNotesData.forEach(fileNote => {
          const noteTemplates = templateTablesData.filter(template => template.fileNote_id === fileNote.id);

          const versions = [];
          noteTemplates.forEach(template => {
            if (template.steps && Array.isArray(template.steps)) {
              template.steps.forEach((step) => {
                if (step && step.id) {
                  versions.push({
                    id: step.id,
                    name: `Version ${step.id}`,
                    stepData: step,
                    template: template
                  });
                }
              });
            }
          });

          noteTemplates.forEach(template => {
            targetTables.push({
              id: template.id.toString(),
              name: `${fileNote.name}`,
              table: fileNote.table,
              versions: versions.filter(v => v.template.id === template.id)
            });
          });
        });

        setAvailableTargetTables(targetTables);
      } catch (e) {
        setAvailableTargetTables([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTargetTables();
  }, []);

  useEffect(() => {
    if (!Array.isArray(config.sources)) {
      onChange({ ...config, sources: [] });
    }
  }, [config, onChange]);

  const handleTablesChange = (tableIds) => {
    const current = Array.isArray(config.sources) ? config.sources : [];
    const nextSources = tableIds.map(id => {
      const found = current.find(s => Number(s.tableId) === Number(id));
      return found ? found : { tableId: id, version: null };
    });
    onChange({ ...config, sources: nextSources });
  };

  const selectedTableIds = (config.sources || []).map(s => s.tableId?.toString());

  const handleVersionChange = (tableId, value) => {
    const v = (value === null || value === undefined || value === '') ? null : Number(value);
    const nextSources = (config.sources || []).map(s => (
      String(s.tableId) === String(tableId) ? { ...s, version: v } : s
    ));
    onChange({ ...config, sources: nextSources });
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Card size="small" title="Nguồn dữ liệu">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Chọn bảng để ghép (append):</Text>
            <Select
              mode="multiple"
              allowClear
              placeholder="Chọn một hoặc nhiều bảng"
              style={{ width: '100%', marginTop: 8 }}
              value={selectedTableIds}
              onChange={handleTablesChange}
              loading={loading}
              options={availableTargetTables.map(table => ({
                label: `${table.name} (#${table.id})`,
                value: table.id
              }))}
            />
          </div>

          {selectedTableIds.length > 0 && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <List
                size="small"
                dataSource={(config.sources || []).map(s => ({ ...s, tableId: s.tableId?.toString() }))}
                renderItem={(src) => {
                  const t = (availableTargetTables || []).find(x => String(x.id) === String(src.tableId));
                  return (
                    <List.Item style={{ alignItems: 'center' }}>
                      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text>{t ? `${t.name}` : `Table #${src.tableId}`}</Text>
                        <Space>
                          <Text type="secondary">Version:</Text>
                          <Select
                            placeholder="Gốc"
                            value={src.version === null || src.version === undefined ? null : Number(src.version)}
                            onChange={(val) => handleVersionChange(src.tableId, val)}
                            style={{ width: 180 }}
                            allowClear
                            options={[
                              { label: 'Gốc', value: null },
                              ...((t?.versions || []).map(v => ({ label: v.name, value: v.id })))
                            ]}
                          />
                          <Checkbox
                            checked={src.version === null || src.version === undefined}
                            onChange={(e) => handleVersionChange(src.tableId, e.target.checked ? null : (t?.versions?.[0]?.id || 1))}
                          >Gốc</Checkbox>
                        </Space>
                      </Space>
                    </List.Item>
                  );
                }}
              />
            </>
          )}
        </Space>
      </Card>

      <Card size="small" title="Tùy chọn">
        <Space>
          <Text>Ghép thêm dữ liệu của bước trước của dữ liệu hiện tại:</Text>
          <Switch
            checked={!!config.includeInput}
            onChange={(checked) => onChange({ ...config, includeInput: checked })}
            size="small"
          />
        </Space>
      </Card>
    </Space>
  );
}


