import React, { useContext, useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { getCustomerCRMByCustomerItemId } from '../../../../apis/customerCRMService';
import { getCustomerFolderDataById } from '../../../../apis/customerFolderService';
import { getCustomerItemDataById } from '../../../../apis/customerItemService';
import { MyContext } from '../../../../MyContext';
import CustomerTable from '../CustomerTable/CustomerTable';
import styles from './Detail.module.css';
import { message } from 'antd';

const Detail = () => {
  const { id } = useParams();
  const outletContext = useOutletContext();
  const { currentUser } = useContext(MyContext);
  const [item, setItem] = useState(null);
  const [folder, setFolder] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Kiểm tra quyền truy cập
  const hasAccess = React.useMemo(() => {
    if (!item || !currentUser) return false;
    
    // Admin hoặc SuperAdmin luôn có quyền
    if (currentUser.isAdmin || currentUser.isSuperAdmin) {
      return true;
    }
    
    // Kiểm tra email trong allowed_users
    const allowedUsers = item.info?.allowed_users || [];
    return allowedUsers.includes(currentUser.email);
  }, [item, currentUser]);

  // Kiểm tra quyền xem - nếu không có quyền thì không được xem gì cả
  const hasViewAccess = hasAccess;

  useEffect(() => {
    if (item && currentUser && !hasViewAccess) {
      message.warning('Bạn không có quyền truy cập vào item này. Liên hệ admin để được cấp quyền.');
    }
  }, [item, currentUser, hasViewAccess]);

  // Extract context data
  const {
    emailTemplates = [],
    showEmailHistory = {},
    selectedCustomers = [],
    filters = {},
    onSelectionChange,
    onToggleEmailHistory,
    onToggleEmailPanel,
    onToggleCareEventPanel,
    onFiltersChange,
    showEmailPanel,
    showCareEventPanel,
    getEmailHistory,
    getEmailHistoryDisplay,
    getDaysSinceContact,
    getContactStatusColor
  } = outletContext || {};

  useEffect(() => {
    if (id) {
      loadItemDetail();
    }
  }, [id]);

  const loadItemDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load item data
      const itemData = await getCustomerItemDataById(id);
      if (!itemData.show) {
        message.warning('Item không hiển thị');
        return;
      }
      setItem(itemData);
      
      // Load folder information if item has customerFolder_id
      if (itemData.customerFolder_id) {
        try {
          const folderData = await getCustomerFolderDataById(itemData.customerFolder_id);
          setFolder(folderData);
        } catch (folderError) {
          console.warn('Could not load folder data:', folderError);
        }
      }

      // Load customers data
      try {
        const customersData = await getCustomerCRMByCustomerItemId(id);
        setCustomers(customersData || []);
      } catch (customersError) {
        console.warn('Could not load customers data:', customersError);
        setCustomers([]);
      }
    } catch (err) {
      console.error('Error loading item detail:', err);
      setError('Không thể tải thông tin item');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.detailContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.detailContainer}>
        <div className={styles.error}>
          <h3>Lỗi</h3>
          <p>{error}</p>
          <button onClick={loadItemDetail} className={styles.retryButton}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className={styles.detailContainer}>
        <div className={styles.empty}>
          <h3>Không tìm thấy item</h3>
          <p>Item với ID {id} không tồn tại</p>
        </div>
      </div>
    );
  }

  
  // Nếu không có quyền xem, hiển thị màn hình thông báo
  if (item && currentUser && !hasViewAccess) {
    return (
      <div className={styles.noAccessContainer}>
        <div className={styles.noAccessCard}>
          <div className={styles.noAccessIcon}>
            <div className={styles.noAccessIconInner}></div>
          </div>
          
          <h2 className={styles.noAccessTitle}>
            Truy cập bị hạn chế
          </h2>
          
          <p className={styles.noAccessMessage}>
            Bạn không có quyền truy cập vào item này. 
            Vui lòng liên hệ admin để được cấp quyền xem dữ liệu.
          </p>
          
          <button
            onClick={loadItemDetail}
            className={styles.noAccessButton}
          >
            Làm mới
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      <CustomerTable 
        customers={customers}
        loading={loading}
        onRefresh={loadItemDetail}
        emailTemplates={emailTemplates}
        showEmailHistory={showEmailHistory}
        selectedCustomers={selectedCustomers}
        filters={filters}
        onSelectionChange={onSelectionChange}
        onToggleEmailHistory={onToggleEmailHistory}
        onToggleEmailPanel={onToggleEmailPanel}
        onToggleCareEventPanel={onToggleCareEventPanel}
        onFiltersChange={onFiltersChange}
        getEmailHistory={getEmailHistory}
        getEmailHistoryDisplay={getEmailHistoryDisplay}
        getDaysSinceContact={getDaysSinceContact}
        getContactStatusColor={getContactStatusColor}
        hasAccess={hasAccess}
        hasViewAccess={hasViewAccess}
        item={item}
        currentUser={currentUser}
        tableCol={`CustomerTableCol`}
      />
    </div>
  );
};

export default Detail;
