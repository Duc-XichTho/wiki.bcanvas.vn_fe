import React, { useContext, useEffect, useState } from 'react';
import { Edit3, Eye, EyeOff } from 'lucide-react';
import ShareButton from './ShareButton';
import styles from './Header.module.css';
import { MyContext } from '../../../../../MyContext.jsx';

const Header = ({
  unPublic,
  selectedCategory,
  businessCategories,
  isEditing,
  setIsEditing,
  onUpdateCategory
}) => {
  const { currentUser } = useContext(MyContext);
  const currentCategory = businessCategories.find(cat => cat.id === selectedCategory);

  // Local UI state for lock/password
  const [lockEnabledInput, setLockEnabledInput] = useState(false);
  const [lockPasswordInput, setLockPasswordInput] = useState('');
  const [showLockPassword, setShowLockPassword] = useState(false);

  useEffect(() => {
    setLockEnabledInput(Boolean(currentCategory?.isLock));
    setLockPasswordInput(currentCategory?.password || '');
  }, [currentCategory?.id, currentCategory?.isLock, currentCategory?.password]);

  const handleSaveLockSettings = () => {
    if (!currentCategory) return;
    const updated = {
      ...currentCategory,
      isLock: lockEnabledInput,
      password: lockPasswordInput
    };
    if (onUpdateCategory) onUpdateCategory(updated);
  };

  return (
    <div className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>
            {currentCategory?.name || 'Chọn mô hình kinh doanh'}
          </h2>
          <p className={styles.description}>
            {currentCategory?.description || 'Vui lòng chọn một mô hình kinh doanh từ sidebar'}
          </p>
        </div>
        <div className={styles.actions}>
          {/* {
            !unPublic && (
              <>
                <ShareButton
                  selectedCategory={selectedCategory}
                  businessCategories={businessCategories}
                />
                {currentCategory && (
                  <div className={styles.lockContainer}>
                    <span className={styles.lockLabel}>Khóa:</span>
                    <label className={styles.lockToggle}>
                      <input
                        type="checkbox"
                        checked={lockEnabledInput}
                        onChange={(e) => setLockEnabledInput(e.target.checked)}
                      />
                      <span className={styles.lockToggleText}>{lockEnabledInput ? 'Đang khóa' : 'Không khóa'}</span>
                    </label>
                    <div className={styles.lockPasswordWrapper}>
                      <input
                        type={showLockPassword ? 'text' : 'password'}
                        placeholder="Mật khẩu (tùy chọn)"
                        value={lockPasswordInput}
                        onChange={(e) => setLockPasswordInput(e.target.value)}
                        className={styles.lockPasswordInput}
                      />
                      <button
                        type="button"
                        className={styles.lockToggleVisibilityButton}
                        onClick={() => setShowLockPassword(v => !v)}
                        title={showLockPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showLockPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button
                      onClick={handleSaveLockSettings}
                      className={styles.lockSaveButton}
                      title={'Lưu thay đổi khóa'}
                    >
                      Lưu
                    </button>
                  </div>
                )}

              </>

            )
          } */}
          {(currentUser?.isAdmin || currentUser?.isSuperAdmin) &&
              <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`${styles.editButton} ${isEditing ? styles.editButtonActive : ''}`}
              >
                <Edit3 className={styles.editIcon} />
                {isEditing ? 'Thoát chỉnh sửa' : 'Chế độ chỉnh sửa'}
              </button>
          }
        </div>

      </div>
    </div>
  );
};

export default Header;
