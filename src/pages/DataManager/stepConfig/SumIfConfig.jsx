import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Form, Input, Select, Button, Space } from 'antd';

const { Option } = Select;

const SumIfConfig = ({ initialConfig = {}, onChange, availableColumns = [], inputStepId, templateData, getTemplateRow, stepIndex, normalizedSteps }) => {
  console.log('[SumIfConfig] props:', {
    hasTemplateData: !!templateData,
    inputStepId,
    hasGetTemplateRow: typeof getTemplateRow === 'function',
    stepIndex,
    normalizedStepsLen: Array.isArray(normalizedSteps) ? normalizedSteps.length : 0,
    availableColumnsLen: Array.isArray(availableColumns) ? availableColumns.length : 0
  });

  const [newColumnName, setNewColumnName] = useState(initialConfig.newColumnName || 'sum_if');
  const [valueColumn, setValueColumn] = useState(initialConfig.valueColumn || '');
  const [conditions, setConditions] = useState(() => {
    const base = Array.isArray(initialConfig.conditions) ? initialConfig.conditions : [{ column: '', value: '' }];
    return base.map(c => ({ mode: c.mode || 'constant', column: c.column || '', value: c.value || '', valueColumn: c.valueColumn || '' }));
  });

  const [inputColumns, setInputColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const lastColsRef = useRef(null);

  // Fetch columns from previous step similar to AggregateConfig
  useEffect(() => {
    let cancelled = false;
    const stableAvail = Array.isArray(availableColumns) ? availableColumns : [];
    const getInputColumns = async () => {
      setLoading(true);
      try {
        console.log('[SumIfConfig] getInputColumns() start');
        // Resolve actualInputStepId and sourceStep
        let actualInputStep = null;
        let sourceStep = null;
        const steps = Array.isArray(normalizedSteps) ? normalizedSteps : [];

        if (stepIndex !== null && stepIndex !== undefined && steps.length > 0) {
          const currentStep = steps[stepIndex];
          console.log('[SumIfConfig] currentStep:', currentStep?.id, 'useCustomInput:', currentStep?.useCustomInput);
          if (currentStep?.useCustomInput) {
            actualInputStep = currentStep.inputStepId;
            sourceStep = steps.find(s => s.id === actualInputStep);
          } else {
            if (stepIndex === 0) {
              actualInputStep = 0; // original data
            } else {
              actualInputStep = steps[stepIndex - 1]?.id;
              sourceStep = steps[stepIndex - 1];
            }
          }
        } else {
          if (inputStepId !== null && inputStepId !== undefined) {
            actualInputStep = inputStepId;
            sourceStep = steps.find(s => s.id === inputStepId);
          } else {
            if (steps.length > 0) {
              sourceStep = steps[steps.length - 1];
              actualInputStep = sourceStep?.id;
            } else {
              actualInputStep = 0;
            }
          }
        }

        console.log('[SumIfConfig] resolved actualInputStepId:', actualInputStep, 'sourceStepId:', sourceStep?.id);

        // 1) Prefer previous step outputColumns when present
        if (sourceStep && sourceStep.config && Array.isArray(sourceStep.config.outputColumns) && sourceStep.config.outputColumns.length > 0) {
          const outputColumns = sourceStep.config.outputColumns;
          console.log('[SumIfConfig] Using outputColumns from previous step config:', outputColumns);
          const columns = outputColumns.map(col => typeof col === 'string' ? col : (col?.name || col?.title || String(col)));
          if (!cancelled) {
            const same = Array.isArray(lastColsRef.current) && columns.length === lastColsRef.current.length && columns.every((c, i) => c === lastColsRef.current[i]);
            if (!same) {
              lastColsRef.current = columns;
              setInputColumns(columns);
            }
          }
          return;
        }

        // 2) If original data, use availableColumns; if empty, fetch from DB (version null)
        if (actualInputStep === 0) {
          if (stableAvail.length > 0) {
            console.log('[SumIfConfig] Using availableColumns (original data):', stableAvail);
            if (!cancelled) {
              const same = Array.isArray(lastColsRef.current) && stableAvail.length === lastColsRef.current.length && stableAvail.every((c, i) => c === lastColsRef.current[i]);
              if (!same) {
                lastColsRef.current = stableAvail;
                setInputColumns(stableAvail);
              }
            }
            return;
          }
          // availableColumns empty -> try getTemplateRow version null
          if (templateData && typeof getTemplateRow === 'function') {
            try {
              console.log('[SumIfConfig] Original data & empty availableColumns -> fetch version=null');
              const resp = await getTemplateRow(templateData.id, null, false, 1, 5);
              const rows = resp?.rows || [];
              console.log('[SumIfConfig] getTemplateRow(null) rows:', rows.length);
              if (rows.length > 0) {
                const inputData = rows.map(r => ({ ...r.data, rowId: r.id }));
                const columns = Object.keys(inputData[0]).filter(col => col !== 'rowId');
                if (!cancelled) {
                  const same = Array.isArray(lastColsRef.current) && columns.length === lastColsRef.current.length && columns.every((c, i) => c === lastColsRef.current[i]);
                  if (!same) {
                    lastColsRef.current = columns;
                    setInputColumns(columns);
                  }
                }
                return;
              }
            } catch (e) {
              console.log('[SumIfConfig] Error fetching original version columns:', e?.message);
            }
          }
          // fallback if still nothing
          if (!cancelled) {
            const same = Array.isArray(lastColsRef.current) && stableAvail.length === lastColsRef.current.length && stableAvail.every((c, i) => c === lastColsRef.current[i]);
            if (!same) {
              lastColsRef.current = stableAvail;
              setInputColumns(stableAvail);
            }
          }
          return;
        }

        // 3) Fallback: try API to infer columns for specific step
        if (templateData && typeof getTemplateRow === 'function' && actualInputStep) {
          try {
            console.log('[SumIfConfig] Fallback fetch via getTemplateRow:', { templateId: templateData.id, stepId: actualInputStep });
            const resp = await getTemplateRow(templateData.id, actualInputStep, false, 1, 5);
            const rows = resp?.rows || [];
            console.log('[SumIfConfig] getTemplateRow response rows:', rows.length);
            if (rows.length > 0) {
              const inputData = rows.map(r => ({ ...r.data, rowId: r.id }));
              const columns = Object.keys(inputData[0]).filter(col => col !== 'rowId');
              if (!cancelled) {
                const same = Array.isArray(lastColsRef.current) && columns.length === lastColsRef.current.length && columns.every((c, i) => c === lastColsRef.current[i]);
                if (!same) {
                  lastColsRef.current = columns;
                  setInputColumns(columns);
                }
              }
              return;
            }
          } catch (e) {
            console.log('[SumIfConfig] Error fetching API fallback:', e?.message);
          }
        }

        // 4) Last resort: availableColumns (even if empty)
        console.log('[SumIfConfig] Last resort availableColumns:', stableAvail);
        if (!cancelled) {
          const same = Array.isArray(lastColsRef.current) && stableAvail.length === lastColsRef.current.length && stableAvail.every((c, i) => c === lastColsRef.current[i]);
          if (!same) {
            lastColsRef.current = stableAvail;
            setInputColumns(stableAvail);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    getInputColumns();
    return () => { cancelled = true; };
    // Limit deps to stable primitives to avoid re-trigger storms
  }, [
    Array.isArray(availableColumns) ? availableColumns.length : 0,
    templateData ? templateData.id : null,
    typeof inputStepId === 'number' ? inputStepId : null,
    typeof stepIndex === 'number' ? stepIndex : null,
    Array.isArray(normalizedSteps) ? normalizedSteps.length : 0
  ]);

  useEffect(() => {
    onChange && onChange({ newColumnName, valueColumn, conditions });
    // eslint-disable-next-line
  }, [newColumnName, valueColumn, JSON.stringify(conditions)]);

  const columnOptions = useMemo(() => {
    const cols = (inputColumns && inputColumns.length > 0) ? inputColumns : (Array.isArray(availableColumns) ? availableColumns : []);
    return cols.map(col => {
      const label = typeof col === 'string' ? col : (col.name || col.title || col);
      const value = typeof col === 'string' ? col : (col.name || col.title || col);
      return { label, value };
    });
  }, [inputColumns, Array.isArray(availableColumns) ? availableColumns.length : 0]);

  const updateCondition = (index, key, val) => {
    setConditions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: val };
      // Reset peer field when switching mode
      if (key === 'mode') {
        if (val === 'constant') {
          next[index].valueColumn = '';
        } else {
          next[index].value = '';
        }
      }
      return next;
    });
  };

  const addCondition = () => setConditions(prev => [...prev, { mode: 'constant', column: '', value: '', valueColumn: '' }]);
  const removeCondition = (index) => setConditions(prev => prev.filter((_, i) => i !== index));

  return (
    <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 320 }}>
      <Form.Item label="Tên cột mới" required>
        <Input placeholder="Tên cột chứa tổng" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} />
      </Form.Item>
      <Form.Item label="Cột giá trị để cộng (Sum column)" required>
        <Select virtual={false} placeholder="Chọn cột giá trị" value={valueColumn} onChange={setValueColumn} showSearch optionFilterProp="children" loading={loading}>
          {columnOptions.map(opt => (
            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
          ))}
        </Select>
      </Form.Item>
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Điều kiện (Field = Value)</div>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {conditions.map((cond, idx) => (
            <Space key={idx} style={{ width: '100%' }} wrap>
              <Select
                style={{ minWidth: 160 }}
                placeholder="Chọn cột"
                value={cond.column}
                onChange={(v) => updateCondition(idx, 'column', v)}
                showSearch
                optionFilterProp="children"
                loading={loading}
              >
                {columnOptions.map(opt => (<Option key={opt.value} value={opt.value}>{opt.label}</Option>))}
              </Select>
              <Select
                style={{ width: 140 }}
                value={cond.mode}
                onChange={(v) => updateCondition(idx, 'mode', v)}
              >
                <Option value="constant">= Giá trị</Option>
                <Option value="column">= Cột</Option>
              </Select>
              {cond.mode === 'constant' ? (
                <Input style={{ minWidth: 180 }} placeholder="Giá trị cần khớp" value={cond.value} onChange={(e) => updateCondition(idx, 'value', e.target.value)} />
              ) : (
                <Select
                  style={{ minWidth: 180 }}
                  placeholder="Chọn cột so sánh"
                  value={cond.valueColumn}
                  onChange={(v) => updateCondition(idx, 'valueColumn', v)}
                  showSearch
                  optionFilterProp="children"
                  loading={loading}
                >
                  {columnOptions.map(opt => (<Option key={opt.value} value={opt.value}>{opt.label}</Option>))}
                </Select>
              )}
              <Button danger onClick={() => removeCondition(idx)}>Xóa</Button>
            </Space>
          ))}
          <Button type="dashed" onClick={addCondition}>Thêm điều kiện</Button>
        </Space>
      </div>
    </Form>
  );
};

export default SumIfConfig;


