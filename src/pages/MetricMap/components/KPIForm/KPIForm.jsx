import React, { useState, useEffect } from 'react';
import styles from './KPIForm.module.css';

const KPIForm = ({ onSave, onCancel, initialData = {}, selectedCategory, currentData }) => {
  const [formula, setFormula] = useState('');
  const [variables, setVariables] = useState({});
  const [formulaError, setFormulaError] = useState('');
  const [selectedMeasures, setSelectedMeasures] = useState([]);

  // Parse initial calc data if exists
  useEffect(() => {
    if (initialData.calc) {
      try {
        const calcData = JSON.parse(initialData.calc);
        setFormula(calcData.formula || '');
        setVariables(calcData.variables || {});
      } catch (error) {
        console.error('Error parsing initial calc data:', error);
      }
    }
  }, [initialData.calc]);

  // Update selected measures when currentData changes
  useEffect(() => {
    if (initialData.measures && currentData?.measures) {
      setSelectedMeasures(initialData.measures);
    }
  }, [initialData.measures, currentData?.measures]);

  // Debug currentData
  useEffect(() => {
    console.log('KPIForm - currentData:', currentData);
    console.log('KPIForm - currentData.measures:', currentData?.measures);
  }, [currentData]);

  const handleFormulaChange = (value) => {
    setFormula(value.toLowerCase());
    
    // Tự động tạo biến dựa trên công thức
    const usedVariables = value.toLowerCase().match(/[a-z]/g) || [];
    const uniqueUsedVariables = [...new Set(usedVariables)];
    
    // Tạo object variables mới với các biến được sử dụng trong công thức
    const newVariables = {};
    uniqueUsedVariables.forEach(variable => {
      if (!variables[variable]) {
        newVariables[variable] = {
          type: 'measure',
          id: '',
        };
      } else {
        newVariables[variable] = variables[variable];
      }
    });
    
    setVariables(newVariables);
    validateFormula(value.toLowerCase(), newVariables);
  };

  const handleVariableChange = (variable, field, value) => {
    console.log('handleVariableChange:', { variable, field, value });
    setVariables((prev) => {
      const newVariables = {
        ...prev,
        [variable]: { ...prev[variable], [field]: value },
      };
      console.log('New variables:', newVariables);
      return newVariables;
    });
    validateFormula(formula, {
      ...variables,
      [variable]: { ...variables[variable], [field]: value },
    });
  };

  const validateFormula = (formula, variables) => {
    if (!formula.trim()) {
      setFormulaError('');
      return;
    }

    try {
      // Kiểm tra xem tất cả biến trong công thức đã được gán chưa
      const usedVariables = formula.match(/[a-z]/g) || [];
      const uniqueUsedVariables = [...new Set(usedVariables)];
      
      const missingVariables = uniqueUsedVariables.filter(variable => 
        !variables[variable] || !variables[variable].id
      );
      
      if (missingVariables.length > 0) {
        setFormulaError(`Chưa gán đo lường cho biến: ${missingVariables.join(', ')}`);
        return;
      }

      // Thử evaluate công thức với dữ liệu mẫu
      const testData = {};
      uniqueUsedVariables.forEach(variable => {
        testData[variable] = 1; // Giá trị test
      });
      
      // eslint-disable-next-line no-eval
      const result = eval(formula.replace(/[a-z]/g, match => testData[match]));
      
      if (typeof result !== 'number' || isNaN(result)) {
        setFormulaError('Công thức không hợp lệ');
        return;
      }
      
      setFormulaError('');
    } catch (error) {
      setFormulaError('Công thức không hợp lệ');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const measures = Array.from(formData.getAll('measures')).map(id => Number(id));

    // Thu thập dữ liệu benchmark 12 tháng
    const benchmarkData = {};
    for (let i = 1; i <= 12; i += 1) {
      const value = formData.get(`bm${i}`);
      benchmarkData[`col${i}`] = value ?? '';
    }

    // Tạo calc data nếu có formula
    let calcData = null;
    if (formula.trim()) {
      // Normalize variables để chỉ lưu những biến được sử dụng trong công thức
      const usedVariables = formula.match(/[a-z]/g) || [];
      const uniqueUsedVariables = [...new Set(usedVariables)];
      const normalizedVariables = {};
      
      uniqueUsedVariables.forEach(variable => {
        if (variables[variable] && variables[variable].id) {
          normalizedVariables[variable] = variables[variable];
        }
      });

      calcData = JSON.stringify({
        formula,
        variables: normalizedVariables,
      });
    }

    const kpiData = {
      name: formData.get('name'),
      description: formData.get('description'),
      category: formData.get('category'),
      business_category_id: selectedCategory,
      measures: measures,
      calc: calcData, // Thêm calc field
      // Đính kèm payload KPI Benchmark để parent xử lý tạo/cập nhật
      kpiBenchmarkPayload: {
        name: formData.get('name'),
        description: formData.get('description'),
        category: formData.get('category'),
        data: benchmarkData,
        info: {
          // Liên kết với KPI nếu đang sửa, parent có thể cập nhật lại sau khi tạo mới
          kpiId: initialData?.id || null,
          business_category_id: selectedCategory || null,
          source: 'MetricMap.KPIForm'
        }
      }
    };
    onSave(kpiData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>
          {initialData.id ? 'Chỉnh sửa KPI' : 'Thêm KPI mới'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Tên KPI</label>
            <input 
              name="name" 
              defaultValue={initialData.name || ''}
              className={styles.input} 
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Mô tả</label>
            <textarea 
              name="description" 
              defaultValue={initialData.description || ''}
              className={styles.textarea} 
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Danh mục</label>
            <select 
              name="category" 
              defaultValue={initialData.category || 'Tài chính'}
              className={styles.select}
            >
              <option>Tài chính</option>
              <option>Vận hành</option>
              <option>Khách hàng</option>
              <option>Nhân sự</option>
            </select>
                     </div>

           <div className={styles.formGroup}>
             <label className={styles.label}>Thống kê liên quan</label>
             <div className={styles.checkboxContainer}>
               {currentData?.measures?.map(measure => (
                 <label key={measure.id} className={styles.checkboxItem}>
                   <input 
                     type="checkbox" 
                     name="measures" 
                     value={measure.id}
                     defaultChecked={initialData.measures?.includes(measure.id)}
                     className={styles.checkbox} 
                   />
                   <span className={styles.checkboxLabel}>{measure.name}</span>
                 </label>
               ))}
             </div>
           </div>

           {/* Formula Section */}
           <div className={styles.formGroup}>
             <label className={styles.label}>Công thức tính toán (tùy chọn)</label>
             <div className={styles.formulaSection}>
               <div className={styles.formulaInputGroup}>
                 <input
                   type="text"
                   className={`${styles.formulaInput} ${formulaError ? styles.inputError : ''}`}
                   value={formula}
                   onChange={(e) => handleFormulaChange(e.target.value)}
                   placeholder="Nhập công thức (ví dụ: a/b, a+b, (a-b)/a)"
                 />
                 {formulaError && (
                   <p className={styles.errorText}>{formulaError}</p>
                 )}
                 <p className={styles.helpText}>
                   Sử dụng các biến là các chữ cái viết thường (a, b, c, d,...) và toán tử (+, -, *, /) để tính KPI
                 </p>
               </div>

               {/* Variables Assignment */}
               {Object.keys(variables).length > 0 && (
                 <div className={styles.variablesSection}>
                   <h4 className={styles.variablesTitle}>Gán đo lường cho biến:</h4>
                   {/* Debug info */}
                   <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                     Debug: Có {currentData?.measures?.length || 0} measures, {Object.keys(variables).length} biến
                   </div>
                   {Object.entries(variables).map(([variable, config]) => (
                     <div key={variable} className={styles.variableRow}>
                       <span className={styles.variableLabel}>Biến {variable}:</span>
                       <select
                         className={styles.variableSelect}
                         value={config.id}
                         onChange={(e) => handleVariableChange(variable, 'id', e.target.value)}
                       >
                         <option value="">Chọn đo lường</option>
                         {currentData?.measures?.length > 0 ? (
                           currentData.measures.map(measure => (
                             <option key={measure.id} value={measure.id}>
                               {measure.name}
                             </option>
                           ))
                         ) : (
                           <option value="" disabled>Không có đo lường nào</option>
                         )}
                       </select>
                       {/* Debug current selection */}
                       <span style={{ fontSize: '11px', color: '#999', marginLeft: '8px' }}>
                         Đã chọn: {config.id || 'Chưa chọn'}
                       </span>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Benchmark</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {Array.from({ length: 12 }, (_, i) => (
                  <div key={i}>
                    <label className={styles.label} style={{ fontSize: 12 }}>Tháng {i + 1}</label>
                    <input
                        name={`bm${i + 1}`}
                        defaultValue={initialData?.kpiBenchmarkPayload?.data?.[`col${i + 1}`] || ''}
                        className={styles.input}
                        placeholder={`Giá trị T${i + 1}`}
                    />
                  </div>
              ))}
            </div>
          </div>
           <div className={styles.actions}>
            <button type="submit" className={styles.saveButton}>
              Lưu
            </button>
            <button type="button" onClick={onCancel} className={styles.cancelButton}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KPIForm;
