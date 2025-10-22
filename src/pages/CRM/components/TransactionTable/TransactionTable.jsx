import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Edit, Trash2, Save, X, AlertCircle, Check } from 'lucide-react';
import { message } from 'antd';
import styles from './TransactionTable.module.css';
import { createTimestamp } from '../../../../generalFunction/format';
import { createBulkTransactionsAPI, deleteBulkTransactionsAPI, updateBulkTransactionsAPI, getAllTransactions, createTransaction as createTransactionAPI, updateTransaction as updateTransactionAPI } from '../../../../apis/transactionCRMService';
// AG Grid imports
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const TransactionTable = ({ customers }) => {
  const gridRef = useRef();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [updatedData, setUpdatedData] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCount, setBulkCount] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customer_id: '',
    transaction_date: '',
    description: '',
    type: 'purchase',
    amount: '',
    status: 'completed'
  });

  // Load transactions from API
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllTransactions();
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      message.error('Lỗi khi tải dữ liệu giao dịch!');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load transactions on component mount
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // API Functions
  const createTransaction = async (transactionData) => {
    try {
      const response = await createTransactionAPI(transactionData);
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id, transactionData) => {
    try {
      const response = await updateTransactionAPI({ id, ...transactionData });
      return response.data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const response = await deleteBulkTransactionsAPI(id);
      return response.data;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  const bulkUpdateTransactions = async (transactions) => {
    try {
      const response = await updateBulkTransactionsAPI(transactions);
      return response;
    } catch (error) {
      console.error('Error updating bulk transactions:', error);
      throw error;
    }
  };

  const createBulkTransactions = async (transactions) => {
    try {
      const response = await createBulkTransactionsAPI(transactions);
      return response;
    } catch (error) {
      console.error('Error creating bulk transactions:', error);
      throw error;
    }
  };

  const deleteBulkTransactions = async (transactionIds) => {
    try {
      const response = await deleteBulkTransactionsAPI(transactionIds);
      return response;
    } catch (error) {
      console.error('Error deleting bulk transactions:', error);
      throw error;
    }
  };

  // Handle form input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save transaction
  const handleSaveTransaction = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validation
      if (!formData.customer_id || !formData.transaction_date || !formData.description || !formData.amount) {
        setError('Vui lòng nhập đầy đủ thông tin giao dịch.');
        return;
      }

      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        transaction_date: formData.transaction_date ? new Date(formData.transaction_date).toISOString() : new Date().toISOString()
      };

      let result;
      if (editingTransaction) {
        // Update existing transaction
        result = await updateTransaction(editingTransaction.id, transactionData);
        const updatedTransactions = transactions.map(t =>
          t.id === editingTransaction.id ? result : t
        );
        setTransactions(updatedTransactions);
        message.success('Cập nhật giao dịch thành công!');
      } else {
        // Add new transaction
        result = await createTransaction(transactionData);
        setTransactions(prev => [...prev, result]);
        message.success('Thêm giao dịch mới thành công!');
      }

      // Reset form
      setFormData({
        customer_id: '',
        transaction_date: '',
        description: '',
        type: 'purchase',
        amount: '',
        status: 'completed'
      });
      setEditingTransaction(null);
      setShowForm(false);
    } catch (error) {
      console.error('Lỗi khi lưu giao dịch:', error);
      setError('Lỗi khi lưu giao dịch. Vui lòng thử lại.');
      message.error('Lỗi khi lưu giao dịch!');
    } finally {
      setSaving(false);
    }
  };

  // Edit transaction
  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      customer_id: transaction.customer_id,
      transaction_date: transaction.transaction_date ? new Date(transaction.transaction_date).toISOString().slice(0, 16) : '',
      description: transaction.description || '',
      type: transaction.type || 'purchase',
      amount: transaction.amount || '',
      status: transaction.status || 'completed'
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  // Delete transaction
  const handleDeleteClick = (transactionId) => {
    const transaction = transactions.find(t => t.id === transactionId);
    setTransactionToDelete(transaction);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;

    try {
      setDeleting(true);
      await deleteTransaction(transactionToDelete.id);

      const updatedTransactions = transactions.filter(t => t.id !== transactionToDelete.id);
      setTransactions(updatedTransactions);

      message.success('Xóa giao dịch thành công!');
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
    } catch (error) {
      console.error('Lỗi khi xóa giao dịch:', error);
      message.error('Lỗi khi xóa giao dịch!');
    } finally {
      setDeleting(false);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setTransactionToDelete(null);
  };

  // Cancel form
  const handleCancel = () => {
    setFormData({
      customer_id: '',
      transaction_date: '',
      description: '',
      type: 'purchase',
      amount: '',
      status: 'completed'
    });
    setEditingTransaction(null);
    setShowForm(false);
    setError(null);
    setSuccess(null);
  };

  // Handle selection change
  const onSelectionChanged = useCallback(() => {
    if (!gridRef.current?.api) return;

    const selectedData = gridRef.current.api
      .getRenderedNodes()
      .filter(node => node.isSelected())
      .map(node => node.data.id);

    setSelectedRows(selectedData);
  }, []);

  // Handle cell value change
  const handleCellValueChanged = useCallback((event) => {
    const updatedRow = event.data;
    setUpdatedData(prevData => {
      const existingIndex = prevData.findIndex(item => item.id === updatedRow.id);
      if (existingIndex !== -1) {
        const next = [...prevData];
        next[existingIndex] = updatedRow;
        return next;
      }
      return [...prevData, updatedRow];
    });
    setHasChanges(true);
  }, []);

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) {
      message.warning('Vui lòng chọn giao dịch cần xóa!');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  // Confirm bulk delete
  const handleConfirmBulkDelete = async () => {
    try {
      setDeleting(true);
      await deleteBulkTransactions(selectedRows);

      // Remove deleted items from local data
      const newData = transactions.filter(item => !selectedRows.includes(item.id));
      setTransactions(newData);

      // Clear selection
      setSelectedRows([]);
      gridRef.current?.api.deselectAll();

      message.success(`Xóa thành công ${selectedRows.length} giao dịch!`);
      setShowBulkDeleteModal(false);
    } catch (error) {
      console.error('Error deleting bulk transactions:', error);
      message.error('Lỗi khi xóa giao dịch!');
    } finally {
      setDeleting(false);
    }
  };

  // Handle bulk create
  const handleBulkCreate = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Tạo mảng transactions dựa trên bulkCount
      const newTransactions = [];
      for (let i = 0; i < bulkCount; i++) {
        newTransactions.push({
          customer_id: customers.length > 0 ? customers[0].id : null, // Chọn customer đầu tiên làm mặc định
          transaction_date: new Date().toISOString(),
          description: `Giao dịch mẫu ${i + 1}`,
          type: 'purchase',
          amount: Math.floor(Math.random() * 1000) + 100, // Random amount từ 100-1100
          status: 'completed',
          created_at: createTimestamp(),
        });
      }

      const response = await createBulkTransactions(newTransactions);
      const createdItems = Array.isArray(response) ? response : (response?.data || []);

      if (createdItems.length) {
        const newData = [...transactions, ...createdItems];
        setTransactions(newData);
      }

      message.success(`Tạo thành công ${createdItems.length || bulkCount} giao dịch!`);
      setShowBulkModal(false);
      setBulkCount(1);
    } catch (error) {
      console.error('Error creating bulk transactions:', error);
      setError('Lỗi khi tạo giao dịch hàng loạt!');
      message.error('Lỗi khi tạo giao dịch!');
    } finally {
      setSaving(false);
    }
  };

  // Handle bulk update
  const handleBulkUpdate = async () => {
    if (updatedData.length === 0) {
      message.warning('Không có thay đổi nào để lưu!');
      return;
    }

    try {
      setSaving(true);
      await bulkUpdateTransactions(updatedData);

      // Merge updates into local transactions
      setTransactions(prev => prev.map(item => {
        const found = updatedData.find(u => u.id === item.id);
        return found ? { ...item, ...found } : item;
      }));

      message.success(`Cập nhật thành công ${updatedData.length} giao dịch!`);
      setUpdatedData([]);
      setHasChanges(false);
    } catch (error) {
      console.error('Error updating bulk transactions:', error);
      message.error('Lỗi khi cập nhật giao dịch!');
    } finally {
      setSaving(false);
    }
  };

  // Default column definition
  const defaultColDef = useMemo(() => {
    return {
      editable: false,
      filter: true,
      suppressMenu: true,
      cellStyle: { fontSize: '14px' },
      wrapHeaderText: true,
      autoHeaderHeight: true,
    };
  }, []);

  // Status bar configuration
  const statusBar = useMemo(() => ({
    statusPanels: [{ statusPanel: 'agAggregationComponent' }]
  }), []);

  // Column definitions
  const columnDefs = useMemo(() => [
    {
      field: 'checkbox',
      headerCheckboxSelection: true,
      checkboxSelection: true,
      width: 150,
      pinned: 'left',
      suppressMenu: true,
      editable: false,
      cellStyle: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
    },
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      filter: 'agNumberColumnFilter',
      editable: false,
      pinned: 'left',
    },
    {
      field: 'transactionCRM_date',
      headerName: 'Date & Time',
      width: 180,
      filter: 'agDateColumnFilter',
      editable: true,
      cellEditor: 'agDateCellEditor',
      cellEditorParams: {
        format: 'yyyy-mm-ddThh:mm'
      },
      cellRenderer: (params) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        return date.toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
    },
    {
      field: 'customer_name',
      headerName: 'Customer',
      width: 200,
      filter: 'agSetColumnFilter',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: customers.map(c => c.email || c.name)
      },
      valueGetter: (params) => {
        const customer = customers.find(c => c.id == params.data.customer_id);
        return customer?.email || customer?.name || 'Unknown';
      },
      valueSetter: (params) => {
        // Tìm customer_id từ email hoặc tên được chọn
        const selectedCustomer = customers.find(c => c.email == params.newValue || c.name == params.newValue);
        if (selectedCustomer) {
          params.data.customer_id = selectedCustomer.id;
        }
        return true;
      },
      cellRenderer: (params) => {
        const customer = customers.find(c => c.id == params.data.customer_id);
        return customer?.email || customer?.name || 'Unknown';
      },
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 250,
      filter: 'agTextColumnFilter',
      editable: true,
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      filter: 'agSetColumnFilter',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['purchase', 'refund', 'exchange', 'service']
      },
      cellRenderer: (params) => {
        return (
          <span className={styles.typeBadge}>
            {params.value}
          </span>
        );
      },
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 150,
      filter: 'agNumberColumnFilter',
      editable: true,
      cellRenderer: (params) => {
        return (
          <span className={styles.amount}>
            ${params.value?.toLocaleString() || 0}
          </span>
        );
      },
      cellClass: 'text-right',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      filter: 'agSetColumnFilter',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['completed', 'pending', 'cancelled']
      },
      cellRenderer: (params) => {
        return (
          <span className={`${styles.statusBadge} ${params.value === 'completed'
              ? styles.statusCompleted
              : styles.statusPending
            }`}>
            {params.value}
          </span>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      filter: false,
      editable: false,
      cellRenderer: (params) => {
        return (
          <div className={styles.actionButtons}>
            <button
              onClick={() => handleEditTransaction(params.data)}
              className={styles.editButton}
              title="Chỉnh sửa"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => handleDeleteClick(params.data.id)}
              className={styles.deleteButton}
              title="Xóa"
              disabled={deleting}
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      },
    },
  ], [customers, deleting]);

  return (
    <div className={styles.tableContainer} style={{ height: '85vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className={styles.tableHeader}>
        <div className={styles.headerTop}>
          <h3 className={styles.tableTitle}>Thống kê giao dịch</h3>
          <div className={styles.headerActions}>
            <button
              onClick={() => setShowForm(true)}
              className={styles.addBtn}
            >
              <Plus size={14} />
              Thêm
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className={styles.addBtn}
            >
              <Plus size={14} />
              Thêm hàng loạt
            </button>
            {hasChanges && (
              <button
                onClick={handleBulkUpdate}
                className={styles.saveBtn}
                disabled={saving}
              >
                <Save size={14} />
                Lưu ({updatedData.length})
              </button>
            )}
            {selectedRows.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className={styles.deleteBtn}
                disabled={deleting}
              >
                <Trash2 size={14} />
                Xóa ({selectedRows.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className={styles.alertError}>
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className={styles.closeAlert}>
            <X size={14} />
          </button>
        </div>
      )}

      {success && (
        <div className={styles.alertSuccess}>
          <Check size={16} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className={styles.closeAlert}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Transaction Form */}
      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h3 className={styles.formTitle}>
              {editingTransaction ? 'Chỉnh sửa Giao dịch' : 'Thêm Giao dịch Mới'}
            </h3>
            <button onClick={handleCancel} className={styles.closeFormButton}>
              <X size={20} />
            </button>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Khách hàng <span className={styles.required}>*</span>
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => handleInputChange('customer_id', e.target.value)}
                className={styles.input}
                required
              >
                <option value="">Chọn khách hàng</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.email})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Ngày giờ giao dịch <span className={styles.required}>*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.transaction_date}
                onChange={(e) => handleInputChange('transaction_date', e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Loại giao dịch <span className={styles.required}>*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className={styles.input}
              >
                <option value="purchase">Mua hàng</option>
                <option value="refund">Hoàn tiền</option>
                <option value="exchange">Đổi hàng</option>
                <option value="service">Dịch vụ</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Số tiền <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className={styles.input}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Trạng thái <span className={styles.required}>*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className={styles.input}
              >
                <option value="completed">Hoàn thành</option>
                <option value="pending">Đang xử lý</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Mô tả <span className={styles.required}>*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={styles.textarea}
              placeholder="Mô tả chi tiết về giao dịch..."
              rows={3}
              required
            />
          </div>

          <div className={styles.formActions}>
            <button
              onClick={handleCancel}
              className={styles.cancelButton}
              disabled={saving}
            >
              Hủy
            </button>
            <button
              onClick={handleSaveTransaction}
              disabled={saving || !formData.customer_id || !formData.transaction_date || !formData.description || !formData.amount}
              className={styles.saveButton}
            >
              <Save size={16} />
              {saving ? 'Đang lưu...' : (editingTransaction ? 'Cập nhật' : 'Thêm Giao dịch')}
            </button>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className={styles.tableWrapper} style={{ flex: 1, minHeight: 0 }}>
        <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
          <AgGridReact
            ref={gridRef}
            rowData={transactions}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            statusBar={statusBar}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            onSelectionChanged={onSelectionChanged}
            onCellValueChanged={handleCellValueChanged}
            enableRangeSelection={true}
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
          />
        </div>
      </div>

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className={styles.confirmModal}>
          <div className={styles.confirmContent}>
            <div className={styles.confirmHeader}>
              <h3>Tạo Giao Dịch Hàng Loạt</h3>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkCount(1);
                }}
                className={styles.closeConfirmButton}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.confirmBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Số lượng giao dịch cần tạo:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
                  className={styles.input}
                />
              </div>
              <p className={styles.warningText}>
                Sẽ tạo {bulkCount} giao dịch mới với dữ liệu mẫu
              </p>
            </div>
            <div className={styles.confirmActions}>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkCount(1);
                }}
                className={styles.cancelConfirmButton}
                disabled={saving}
              >
                Hủy
              </button>
              <button
                onClick={handleBulkCreate}
                className={styles.saveButton}
                disabled={saving}
              >
                {saving ? 'Đang tạo...' : `Tạo ${bulkCount} Giao Dịch`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.confirmModal}>
          <div className={styles.confirmContent}>
            <div className={styles.confirmHeader}>
              <h3>Xác nhận xóa</h3>
              <button onClick={handleCancelDelete} className={styles.closeConfirmButton}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.confirmBody}>
              <div className={styles.warningIcon}>
                <AlertCircle size={48} />
              </div>
              <p>Bạn có chắc muốn xóa giao dịch <strong>"{transactionToDelete?.description}"</strong>?</p>
              <p className={styles.warningText}>Hành động này không thể hoàn tác.</p>
            </div>
            <div className={styles.confirmActions}>
              <button
                onClick={handleCancelDelete}
                className={styles.cancelConfirmButton}
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className={styles.confirmDeleteButton}
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className={styles.confirmModal}>
          <div className={styles.confirmContent}>
            <div className={styles.confirmHeader}>
              <h3>Xác nhận xóa hàng loạt</h3>
              <button onClick={() => setShowBulkDeleteModal(false)} className={styles.closeConfirmButton}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.confirmBody}>
              <div className={styles.warningIcon}>
                <AlertCircle size={48} />
              </div>
              <p>Bạn có chắc muốn xóa <strong>{selectedRows.length}</strong> giao dịch đã chọn?</p>
              <p className={styles.warningText}>Hành động này không thể hoàn tác.</p>
            </div>
            <div className={styles.confirmActions}>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className={styles.cancelConfirmButton}
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className={styles.confirmDeleteButton}
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : `Xóa ${selectedRows.length} giao dịch`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
