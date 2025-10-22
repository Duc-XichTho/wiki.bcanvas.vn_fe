import React, { useEffect, useMemo, useState } from 'react';
import styles from './CategoryForm.module.css';
import { getAllPath } from '../../../../apis/adminPathService.jsx';
import { MyContext } from '../../../../MyContext.jsx';
import { useContext } from 'react';

const CategoryForm = ({ onSave, onCancel, initialData }) => {
  const isEditing = !!initialData;
  const [allSchemas, setAllSchemas] = useState([]);
  const [schemaSearch, setSchemaSearch] = useState('');
  const [selectedSchemas, setSelectedSchemas] = useState([]);
  const { currentUser } = useContext(MyContext);

  useEffect(() => {
    setSelectedSchemas(Array.isArray(initialData?.schemaAccess) ? initialData.schemaAccess : []);
  }, [initialData?.id]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const list = await getAllPath();
        console.log('list', list);
        if (ignore) return;
        const opts = Array.isArray(list.data) ? list.data.map(p => ({
          label: p?.name || p?.path || p?.id || 'unknown',
          value: p?.name || p?.path || p?.id
        })) : [];
        setAllSchemas(opts);
      } catch (e) {
        setAllSchemas([]);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const filteredSchemas = useMemo(() => {
    const q = schemaSearch.trim().toLowerCase();
    if (!q) return allSchemas;
    return allSchemas.filter(o => String(o.label).toLowerCase().includes(q));
  }, [schemaSearch, allSchemas]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const categoryData = {
      name: formData.get('name'),
      description: formData.get('description'),
      key_factors: formData.get('key_factors'),
      color: 'bg-gray-50 border-gray-200',
      schemaAccess: selectedSchemas
    };

    // Nếu đang edit, thêm id vào data
    if (isEditing) {
      categoryData.id = initialData.id;
    }

    onSave(categoryData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>
          {isEditing ? 'Sửa mô hình kinh doanh' : 'Thêm mô hình kinh doanh mới'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formContainer}>
            <div className={styles.leftPanel}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tên mô hình</label>
                <input
                  name="name"
                  className={styles.input}
                  required
                  defaultValue={initialData?.name || ''}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Mô tả</label>
                <textarea
                  name="description"
                  className={styles.textarea}
                  required
                  defaultValue={initialData?.description || ''}
                />
              </div>

              {
                (currentUser?.isSuperAdmin) && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Chia sẻ schema</label>
                    <input
                      placeholder="Tìm kiếm schema..."
                      className={styles.input}
                      value={schemaSearch}
                      onChange={(e) => setSchemaSearch(e.target.value)}
                    />
                    <div className={styles.checkboxContainer}>
                      {filteredSchemas.length === 0 && (
                        <div style={{ color: '#6b7280', fontSize: 13 }}>Không có schema</div>
                      )}
                      {filteredSchemas.map(opt => (
                          <label key={opt.value} className={styles.checkboxContainerLabel}>
                            <input
                              type="checkbox"
                              checked={selectedSchemas.includes(opt.value)}
                            onChange={() => setSelectedSchemas(prev => prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value])}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              }
            </div>

            <div className={styles.rightPanel}>
              <div className={styles.formGroup} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label className={styles.label}>Phân tích mô hình kinh doanh</label>
                <textarea
                  name="key_factors"
                  className={styles.textareaFullHeight}
                  required
                  defaultValue={initialData?.key_factors || ''}
                />
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.saveButton}>
              {isEditing ? 'Cập nhật' : 'Lưu'}
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

export default CategoryForm;
