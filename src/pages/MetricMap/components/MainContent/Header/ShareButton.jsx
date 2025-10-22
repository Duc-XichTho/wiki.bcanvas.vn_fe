import React, { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import styles from './ShareButton.module.css';

const ShareButton = ({ selectedCategory, businessCategories }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/metric/${selectedCategory}`;
  };

  const copyToClipboard = async () => {
    try {
      const shareLink = generateShareLink();
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const handleCloseModal = () => {
    setShowShareModal(false);
    setCopied(false);
  };

  const selectedCategoryData = businessCategories?.find(
    category => category.id === selectedCategory
  );

  return (
    <>
      <button
        className={styles.shareButton}
        onClick={handleShareClick}
        title="Chia sẻ công khai"
      >
        <Share2 size={16} />
        <span>Chia sẻ</span>
      </button>

      {showShareModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Chia sẻ công khai</h3>
              <button className={styles.closeButton} onClick={handleCloseModal}>
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.categoryInfo}>
                <h4>Danh mục: {selectedCategoryData?.name || 'Không xác định'}</h4>
                <p className={styles.description}>
                  Liên kết này sẽ cho phép xem công khai danh mục này mà không cần đăng nhập.
                </p>
              </div>
              
              <div className={styles.linkSection}>
                <label>Liên kết chia sẻ:</label>
                <div className={styles.linkContainer}>
                  <input
                    type="text"
                    value={generateShareLink()}
                    readOnly
                    className={styles.linkInput}
                  />
                  <button
                    className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Đã sao chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
              
              <div className={styles.warning}>
                <p>⚠️ Lưu ý: Liên kết này sẽ hiển thị dữ liệu công khai. Chỉ chia sẻ với những người bạn tin tưởng.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareButton;
