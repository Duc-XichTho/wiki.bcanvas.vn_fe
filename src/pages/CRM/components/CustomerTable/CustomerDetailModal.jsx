import React from 'react';
import styles from './CustomerDetailModal.module.css';

const CustomerDetailModal = ({ 
  open, 
  onCancel, 
  customerData, 
  columnConfig 
}) => {
  if (!open || !customerData) return null;

  // Parse info if it's a string
  const getInfo = () => {
    if (!customerData.info) return {};
    return typeof customerData.info === 'string' 
      ? JSON.parse(customerData.info) 
      : customerData.info;
  };

  const info = getInfo();

  // Check if info section has any data
  const hasInfoData = Object.keys(info).some(key => {
    const value = info[key];
    return value && (Array.isArray(value) ? value.length > 0 : value.toString().trim() !== '');
  });

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Chi tiết khách hàng</h3>
          <button onClick={onCancel} className={styles.closeBtn}>×</button>
        </div>

        <div className={styles.modalBody}>
          {/* Basic Information */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Thông tin cơ bản</h4>
            
            {customerData.id && (
              <div className={styles.field}>
                <label className={styles.label}>ID:</label>
                <span className={styles.value}>{customerData.id}</span>
              </div>
            )}
            
            {customerData.name && (
              <div className={styles.field}>
                <label className={styles.label}>Tên:</label>
                <span className={styles.value}>{customerData.name}</span>
              </div>
            )}
            
            {customerData.email && (
              <div className={styles.field}>
                <label className={styles.label}>Email:</label>
                <span className={styles.value}>{customerData.email}</span>
              </div>
            )}
            
            {customerData.company && (
              <div className={styles.field}>
                <label className={styles.label}>Công ty:</label>
                <span className={styles.value}>{customerData.company}</span>
              </div>
            )}
            
            {customerData.phone && (
              <div className={styles.field}>
                <label className={styles.label}>Số điện thoại:</label>
                <span className={styles.value}>{customerData.phone}</span>
              </div>
            )}
            
            {customerData.note && (
              <div className={styles.field}>
                <label className={styles.label}>Ghi chú:</label>
                <span className={styles.value}>{customerData.note}</span>
              </div>
            )}
            
            {customerData.total_spent && (
              <div className={styles.field}>
                <label className={styles.label}>Tổng chi tiêu:</label>
                <span className={styles.value}>${customerData.total_spent.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Additional Information */}
          {hasInfoData && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Thông tin bổ sung</h4>
              
              {/* Groups */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                const key = `group${num}`;
                const value = info[key];
                const displayValue = Array.isArray(value) ? value.join(', ') : value;
                if (!displayValue) return null;
                
                return (
                  <div key={key} className={styles.field}>
                    <label className={styles.label}>
                      {columnConfig[key]?.displayName || `Group ${num}`}:
                    </label>
                    <span className={styles.value}>{displayValue}</span>
                  </div>
                );
              })}
              
              {/* Text Fields */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                const key = `text${num}`;
                const value = info[key];
                if (!value || value.toString().trim() === '') return null;
                
                return (
                  <div key={key} className={styles.field}>
                    <label className={styles.label}>
                      {columnConfig[key]?.displayName || `Text Field ${num}`}:
                    </label>
                    <span className={styles.value}>{value}</span>
                  </div>
                );
              })}
              
              {/* Date Fields */}
              {[1, 2, 3].map(num => {
                const key = `date${num}`;
                const value = info[key];
                if (!value) return null;
                
                let displayDate = value;
                try {
                  displayDate = new Date(value).toLocaleDateString('vi-VN');
                } catch (e) {
                  // keep original value
                }
                
                return (
                  <div key={key} className={styles.field}>
                    <label className={styles.label}>
                      {columnConfig[key]?.displayName || `Date Field ${num}`}:
                    </label>
                    <span className={styles.value}>{displayDate}</span>
                  </div>
                );
              })}
              
              {/* Care Script */}
              {info.care_script && (
                <div className={styles.field}>
                  <label className={styles.label}>Kịch bản chăm sóc:</label>
                  <span className={styles.value}>
                    {Array.isArray(info.care_script) ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {info.care_script.map((script, idx) => (
                          <span
                            key={idx}
                            style={{
                              color: '#10b981',
                              backgroundColor: '#f0fdf4',
                              fontWeight: 'bold',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '13px'
                            }}
                          >
                            {script}
                          </span>
                        ))}
                      </div>
                    ) : (
                      info.care_script
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Email History Summary */}
          {customerData.emailHistory && customerData.emailHistory.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Lịch sử email</h4>
              <div className={styles.field}>
                <label className={styles.label}>Tổng số email:</label>
                <span className={styles.value}>{customerData.emailHistory.length}</span>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email gần nhất:</label>
                <span className={styles.value}>
                  {(() => {
                    const sortedEmails = [...customerData.emailHistory].sort((a, b) => 
                      new Date(b.email_date) - new Date(a.email_date)
                    );
                    const lastEmail = sortedEmails[0];
                    return new Date(lastEmail.email_date).toLocaleDateString('vi-VN');
                  })()}
                </span>
              </div>
            </div>
          )}

          {/* Care Event History Summary */}
          {customerData.careEventHistory && customerData.careEventHistory.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Lịch sử sự kiện chăm sóc</h4>
              <div className={styles.field}>
                <label className={styles.label}>Tổng số sự kiện:</label>
                <span className={styles.value}>{customerData.careEventHistory.length}</span>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Sự kiện gần nhất:</label>
                <span className={styles.value}>
                  {(() => {
                    const sortedEvents = [...customerData.careEventHistory].sort((a, b) => 
                      new Date(b.created_at) - new Date(a.created_at)
                    );
                    const lastEvent = sortedEvents[0];
                    return `${lastEvent.title} - ${new Date(lastEvent.created_at).toLocaleDateString('vi-VN')}`;
                  })()}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onCancel} className={styles.cancelBtn}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailModal;

