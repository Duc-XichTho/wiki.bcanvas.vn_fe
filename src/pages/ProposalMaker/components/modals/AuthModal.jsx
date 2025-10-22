import React from 'react';
import styles from '../../ProposalMaker.module.css';
import { X } from 'lucide-react';

const AuthModal = ({
  open,
  authCredentials,
  setAuthCredentials,
  onAuthenticate,
  onClose
}) => {
  if (!open) return null;
  const canSubmit = authCredentials.username.trim() && authCredentials.password.trim();
  return (
    <div className={styles.overlay}>
      <div className={styles.modalCardSm}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Xác thực truy cập</h3>
          <button
            onClick={() => {
              onClose();
              setAuthCredentials({ username: '', password: '' });
            }}
            className={styles.modalClose}
          >
            <X className={styles.iconMd} />
          </button>
        </div>

        <div className={styles.p6}>
          <div className={styles.mb4}>
            <label className={styles.labelSm}>Tên người dùng</label>
            <input
              type="text"
              value={authCredentials.username}
              onChange={(e) => setAuthCredentials({ ...authCredentials, username: e.target.value })}
              className={styles.inputText}
              placeholder="Nhập tên của bạn..."
              autoFocus
            />
          </div>

          <div className={styles.mb4}>
            <label className={styles.labelSm}>Mật khẩu</label>
            <input
              type="password"
              value={authCredentials.password}
              onChange={(e) => setAuthCredentials({ ...authCredentials, password: e.target.value })}
              className={styles.inputText}
              placeholder="Nhập mật khẩu..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onAuthenticate();
                }
              }}
            />
          </div>

          <div className={styles.inlineGap2}>
            <button onClick={onAuthenticate} disabled={!canSubmit} className={styles.btnPrimary}>
              Truy cập
            </button>
            <button
              onClick={() => {
                onClose();
                setAuthCredentials({ username: '', password: '' });
              }}
              className={styles.btnOutline}
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;


