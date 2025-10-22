import React from 'react';
import { Lock, AlertTriangle } from 'lucide-react';

const AccessDenied = ({ message, icon = 'lock' }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '300px',
      color: '#ff4d4f',
      fontSize: '16px',
      fontWeight: '500',
      textAlign: 'center',
      padding: '20px'
    }}>
      {icon === 'lock' ? (
        <Lock size={48} style={{ marginBottom: '16px', opacity: 0.7 }} />
      ) : (
        <AlertTriangle size={48} style={{ marginBottom: '16px', opacity: 0.7 }} />
      )}
      <div style={{ marginBottom: '8px' }}>
        <strong>Không có quyền truy cập</strong>
      </div>
      <div style={{ 
        color: '#666', 
        fontSize: '14px', 
        fontWeight: 'normal',
        maxWidth: '400px'
      }}>
        {message}
      </div>
    </div>
  );
};

export default AccessDenied; 