import { message, Select } from 'antd';
import { Calendar, ClipboardList, Cog, Eye, Mail, Plus, Save, Trash2, Upload, Download } from 'lucide-react';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MyContext } from '../../../../MyContext';
import { createNewCareEventHistory, deleteCareEventHistory, updateCareEventHistory } from '../../../../apis/careEventHistoryService';
import { createBulkCustomers, deleteCustomer, updateCustomer, updateBulkCustomers, getCustomerById } from '../../../../apis/customerCRMService';
import { scheduleEmailAdvanced } from '../../../../apis/emailSchedulerService';
import { getSettingByType, updateSetting } from '../../../../apis/settingService';
import { getAllEmailSchedulerScript } from '../../../../apis/emailSchedulerScriptService';
import { getAllScriptEmailTemplate, createNewScriptEmailTemplate, updateScriptEmailTemplate, deleteScriptEmailTemplate, getScriptEmailTemplatesByScriptId } from '../../../../apis/scriptEmailTemplateService';
import { createNewCustomerScript, updateCustomerScript, deleteCustomerScript, bulkUpdateCustomerScripts } from '../../../../apis/customerScriptService';
import CareEventDetailModal from './CareEventDetailModal';
import CareEventModal from './CareEventModal';
import ColumnConfigModal from './ColumnConfigModal';
import CustomerDetailModal from './CustomerDetailModal';
import ImportModal from './ImportModal';
import styles from './CustomerTable.module.css';
import GroupSelectionModal from './GroupSelectionModal';
import ScriptSelectionModal from './ScriptSelectionModal';
import ScriptConfigModal from './ScriptConfigModal';
import ScriptDetailModal from './ScriptDetailModal';


// AG Grid imports
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { useParams } from 'react-router-dom';
import { createTimestamp } from '../../../../generalFunction/format';
import * as XLSX from 'xlsx';
import { loadColumnState, saveColumnStateToLocalStorage } from '../../../Home/AgridTable/logicColumnState/columnState.jsx';
import { getItemFromIndexedDB, deleteItemFromIndexedDB } from '../../../../storage/storageService.js';
import { log } from 'mathjs';
ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const CustomerTable = ({
  showEmailHistory = {},
  onToggleEmailHistory,
  getEmailHistory,
  getEmailHistoryDisplay,
  getDaysSinceContact,
  getContactStatusColor,
  onToggleEmailPanel,
  onToggleCareEventPanel,
  emailTemplates = [],
  filters = {},
  onFiltersChange,
  onSelectionChange,
  customers: propCustomers,
  loading: propLoading,
  onRefresh,
  // Thêm props cho quyền
  hasAccess = true,
  hasViewAccess = true,
  item = null,
  currentUser = null,
  // Props cho lưu vị trí cột
  tableCol = 'CustomerTableCol',
}) => {
  const gridRef = useRef();
  const lastFocusedCellRef = useRef(null);
  const { id } = useParams();
  const [customers, setCustomers] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]); // Array of {id, email} objects
  const [searchTerm, setSearchTerm] = useState(''); // Thêm search term
  const [colDefs, setColDefs] = useState([]); // State để quản lý column definitions
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickField, setLastClickField] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCount, setBulkCount] = useState(1);
  const [updatedData, setUpdatedData] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [errorRows, setErrorRows] = useState(new Set()); // Track customer IDs with errors
  const [showEmailDetailModal, setShowEmailDetailModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Sử dụng props từ Detail.jsx
  const finalHasAccess = hasAccess;

  // Hiển thị thông báo khi không có quyền


  // Care Event states
  const [showCareEventModal, setShowCareEventModal] = useState(false);
  const [selectedCustomerForCare, setSelectedCustomerForCare] = useState([]);
  const [showCareEventDetail, setShowCareEventDetail] = useState(false);
  const [selectedCareEvent, setSelectedCareEvent] = useState(null);
  const [isEditingCareEvent, setIsEditingCareEvent] = useState(false);
  const [careEventForm, setCareEventForm] = useState({
    title: '',
    content: '',
    event_type: 'call'
  });
  const [creatingCareEvent, setCreatingCareEvent] = useState(false);
  const [updatingCareEvent, setUpdatingCareEvent] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showScriptConfigModal, setShowScriptConfigModal] = useState(false);
  const [scriptOptions, setScriptOptions] = useState([]);
  const [newScriptOption, setNewScriptOption] = useState('');
  const [idSettingScriptOptions, setIdSettingScriptOptions] = useState(null);
  const [showScriptDetailModal, setShowScriptDetailModal] = useState(false);
  const [selectedScript, setSelectedScript] = useState(null);
  const [scriptType, setScriptType] = useState(null);
  const [scriptTemplates, setScriptTemplates] = useState([]);
  const [originalScriptTemplates, setOriginalScriptTemplates] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    template_id: '',
    scheduled_time: null
  });
  const [scriptConfigurations, setScriptConfigurations] = useState({});
  const [idSettingScriptConfigurations, setIdSettingScriptConfigurations] = useState(null);

  // Column configuration states
  const [showColumnConfigModal, setShowColumnConfigModal] = useState(false);
  const [columnConfig, setColumnConfig] = useState({
    group1: {
      displayName: 'Group 1',
      options: []
    },
    group2: {
      displayName: 'Group 2',
      options: []
    },
    group3: {
      displayName: 'Group 3',
      options: []
    },
    group4: {
      displayName: 'Group 4',
      options: []
    },
    group5: {
      displayName: 'Group 5',
      options: []
    },
    group6: {
      displayName: 'Group 6',
      options: []
    },
    group7: {
      displayName: 'Group 7',
      options: []
    },
    group8: {
      displayName: 'Group 8',
      options: []
    },
    group9: {
      displayName: 'Group 9',
      options: []
    },
    group10: {
      displayName: 'Group 10',
      options: []
    },
    script_status: {
      displayName: 'Trạng thái Kịch bản',
      options: ['Đang chạy', 'Tạm dừng']
    },
    text1: {
      displayName: 'Text Field 1'
    },
    text2: {
      displayName: 'Text Field 2'
    },
    text3: {
      displayName: 'Text Field 3'
    },
    text4: {
      displayName: 'Text Field 4'
    },
    text5: {
      displayName: 'Text Field 5'
    },
    text6: {
      displayName: 'Text Field 6'
    },
    text7: {
      displayName: 'Text Field 7'
    },
    text8: {
      displayName: 'Text Field 8'
    },
    text9: {
      displayName: 'Text Field 9'
    },
    text10: {
      displayName: 'Text Field 10'
    },
    date1: {
      displayName: 'Date Field 1'
    },
    date2: {
      displayName: 'Date Field 2'
    },
    date3: {
      displayName: 'Date Field 3'
    }
  });
  const [idSettingColumnConfig, setIdSettingColumnConfig] = useState(null);

  // Group selection modal states
  const [showGroupSelectionModal, setShowGroupSelectionModal] = useState(false);
  const [selectedGroupType, setSelectedGroupType] = useState(null);
  const [selectedCustomerForGroup, setSelectedCustomerForGroup] = useState(null);

  // Script selection modal states (for care_script multi-select)
  const [showScriptSelectionModal, setShowScriptSelectionModal] = useState(false);
  const [selectedCustomerForScript, setSelectedCustomerForScript] = useState(null);

  // Bulk script assignment modal states
  const [showBulkScriptModal, setShowBulkScriptModal] = useState(false);

  // Customer detail modal states
  const [showCustomerDetailModal, setShowCustomerDetailModal] = useState(false);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);

  // Import/Export states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);

  // Group filter states
  const [groupFilters, setGroupFilters] = useState({
    group1: [],
    group2: [],
    group3: [],
    group4: [],
    group5: [],
    group6: [],
    group7: [],
    group8: [],
    group9: [],
    group10: [],
    care_script: [],
    script_status: []
  });

  // Handle cell click for group columns and care_script with double click detection
  const handleCellClick = (params) => {
    const { colDef, data } = params;
    const field = colDef.field;

    // Check if it's a group column or care_script column
    if (
      field === 'group1' ||
      field === 'group2' ||
      field === 'group3' ||
      field === 'group4' ||
      field === 'group5' ||
      field === 'group6' ||
      field === 'group7' ||
      field === 'group8' ||
      field === 'group9' ||
      field === 'group10' ||
      field === 'care_script'
    ) {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastClickTime;

      // Check if this is a double click (within 300ms and same field)
      if (timeDiff < 300 && field === lastClickField) {
        // Ghi nhớ ô đang focus để trả focus sau khi đóng modal
        lastFocusedCellRef.current = { rowIndex: params.rowIndex, colKey: field };

        if (field === 'care_script') {
          // Open script selection modal
          setSelectedCustomerForScript(data);
          setShowScriptSelectionModal(true);
        } else {
          // Open group selection modal
          setSelectedGroupType(field);
          setSelectedCustomerForGroup(data);
          setShowGroupSelectionModal(true);
        }

        // Reset click tracking
        setLastClickTime(0);
        setLastClickField(null);
      } else {
        // Update click tracking
        setLastClickTime(currentTime);
        setLastClickField(field);
      }
    }
  };

  // Trả focus về ô trong grid sau khi đóng modal để Tab hoạt động lại
  const refocusGridCell = () => {
    const api = gridRef.current?.api;
    const cell = lastFocusedCellRef.current;
    if (!api || !cell) return;
    setTimeout(() => {
      try {
        api.ensureIndexVisible(cell.rowIndex);
        api.ensureColumnVisible(cell.colKey);
        api.setFocusedCell(cell.rowIndex, cell.colKey);
      } catch (e) {
        // no-op
      }
    }, 100);
  };

  // Handle group filter change
  const handleGroupFilterChange = (field, selectedValues) => {
    setGroupFilters(prev => ({
      ...prev,
      [field]: selectedValues
    }));
  };

  // Clear all search and filters
  const clearAllSearchAndFilters = () => {
    // Clear search term
    setSearchTerm('');

    // Clear group filters
    setGroupFilters({
      group1: [],
      group2: [],
      group3: [],
      group4: [],
      group5: [],
      group6: [],
      group7: [],
      group8: [],
      group9: [],
      group10: [],
      care_script: [],
      script_status: []
    });

    // Clear other filters
    onFiltersChange('status', '');
    onFiltersChange('company', '');
    onFiltersChange('minSpent', '');
    onFiltersChange('lastContactDays', '');
  };


  // Handle group selection save
  const handleGroupSelectionSave = async (selectedValues) => {
    if (!selectedCustomerForGroup || !selectedGroupType) return;

    // Update the customer data
    const updatedCustomers = customers.map(customer => {
      if (customer.id === selectedCustomerForGroup.id) {
        const updatedInfo = { ...customer.info };
        updatedInfo[selectedGroupType] = selectedValues;
        return { ...customer, info: updatedInfo };
      }
      return customer;
    });
    await updateBulkCustomers(updatedCustomers);

    setCustomers(updatedCustomers);

    // Update the grid
    if (gridRef.current) {
      gridRef.current.api.refreshCells();
    }
  };

  // Handle script selection save
  const handleScriptSelectionSave = async (scriptData) => {
    if (!selectedCustomerForScript) return;

    try {
      // Validation
      if (!selectedCustomerForScript.id) {
        throw new Error('Customer ID không hợp lệ');
      }


      // Sử dụng API bulk update
      const result = await bulkUpdateCustomerScripts(selectedCustomerForScript, scriptData);


      // Lấy dữ liệu khách hàng mới từ server
      const updatedCustomer = await getCustomerById(result.customerId);

      // Update the customer data với dữ liệu mới từ server
      const updatedCustomers = customers.map(customer => {
        if (customer.id === selectedCustomerForScript.id) {
          return updatedCustomer;
        }
        return customer;
      });

      setCustomers(updatedCustomers);

      // Update the grid
      if (gridRef.current) {
        gridRef.current.api.refreshCells();
      }

      message.success(`Đã cập nhật kịch bản chăm sóc! Thêm: ${result.added}, Xóa: ${result.removed}`);
    } catch (error) {
      console.error('Error saving script selection:', error);
      message.error('Lỗi khi cập nhật kịch bản chăm sóc khách hàng!');
    }
  };

  // Handle bulk script assignment
  const handleBulkScriptAssignment = async (scriptData) => {
    try {
      if (selectedRows.length === 0) {
        message.warning('Vui lòng chọn khách hàng!');
        return;
      }

      const selectedIds = selectedRows.map(item => item.id);

      // Cập nhật care_script cho từng khách hàng đã chọn
      for (const customerId of selectedIds) {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
          await bulkUpdateCustomerScripts(customer, scriptData);
        }
      }

      // Reload dữ liệu từ server
      const updatedCustomers = await Promise.all(
        selectedIds.map(async (customerId) => {
          return await getCustomerById(customerId);
        })
      );

      // Cập nhật local state với dữ liệu mới từ server
      const finalCustomers = customers.map(customer => {
        const updatedCustomer = updatedCustomers.find(uc => uc.id === customer.id);
        return updatedCustomer || customer;
      });

      setCustomers(finalCustomers);

      // Update the grid
      if (gridRef.current) {
        gridRef.current.api.refreshCells({ force: true });
      }

      message.success(`Đã gắn kịch bản cho ${selectedRows.length} khách hàng!`);
      setShowBulkScriptModal(false);
    } catch (error) {
      console.error('Error updating bulk care script:', error);
      message.error(`${error?.response?.data?.message || 'Lỗi khi gắn kịch bản cho khách hàng!'}`);
    }
  };

  // Handle clear all scripts for selected customers
  const handleClearAllScripts = async () => {
    try {
      if (selectedRows.length === 0) {
        message.warning('Vui lòng chọn khách hàng!');
        return;
      }

      const selectedIds = selectedRows.map(item => item.id);

      // Xóa tất cả kịch bản cho từng khách hàng đã chọn
      for (const customerId of selectedIds) {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
          // Truyền object với selected rỗng và unselected chứa tất cả kịch bản hiện có
          const currentScripts = customer.care_script || [];
          await bulkUpdateCustomerScripts(customer, {
            selected: [],
            unselected: currentScripts
          });
        }
      }

      // Reload dữ liệu từ server
      const updatedCustomers = await Promise.all(
        selectedIds.map(async (customerId) => {
          return await getCustomerById(customerId);
        })
      );

      // Cập nhật local state với dữ liệu mới từ server
      const finalCustomers = customers.map(customer => {
        const updatedCustomer = updatedCustomers.find(uc => uc.id === customer.id);
        return updatedCustomer || customer;
      });

      setCustomers(finalCustomers);

      // Update the grid
      if (gridRef.current) {
        gridRef.current.api.refreshCells({ force: true });
      }

      message.success(`Đã xóa tất cả kịch bản của ${selectedRows.length} khách hàng!`);
    } catch (error) {
      console.error('Error clearing all scripts:', error);
      message.error(`${error?.response?.data?.message || 'Lỗi khi xóa kịch bản của khách hàng!'}`);
    }
  };

  // Handle toggle script status
  const handleToggleScriptStatus = async (customer) => {
    try {
      const newStatus = !customer.script_status;
      // Chỉ cập nhật bản ghi đang thao tác để tránh lỗi đồng bộ
      await updateCustomer({ id: customer.id, script_status: newStatus });

      // Cập nhật local state cho đúng một customer
      setCustomers(prev => prev.map(c => (c.id === customer.id ? { ...c, script_status: newStatus } : c)));

      // Update the grid
      if (gridRef.current) {
        gridRef.current.api.refreshCells();
      }

      message.success(`Đã ${newStatus ? 'kích hoạt' : 'tạm dừng'} kịch bản cho khách hàng!`);
    } catch (error) {
      console.error('Error toggling script status:', error);
      message.error('Lỗi khi cập nhật trạng thái kịch bản!');
    }
  };



  useEffect(() => {
    Promise.all([
      loadScriptOptions(),
      loadScriptConfigurations(),
      loadColumnConfig()
    ]).then(() => {
      if (propCustomers.length > 0) {
        setCustomers(propCustomers || []);
      }
    });
  }, [propCustomers]);



  // Load script options from emailSchedulerScript API
  const loadScriptOptions = async () => {
    try {
      const data = await getAllEmailSchedulerScript();
      if (data && Array.isArray(data)) {
        // Lưu cả script objects để có thể truy cập ID
        setScriptOptions(data);

      }
    } catch (error) {
      console.error('Error loading script options:', error);
      // Keep default values if loading fails
    }
  };

  // Load script configurations from scriptEmailTemplate API
  const loadScriptConfigurations = async () => {
    try {
      const data = await getAllScriptEmailTemplate();
      if (data && Array.isArray(data)) {
        // Group configurations by script_id
        const configurations = {};
        data.forEach(item => {
          if (item.script_id) {
            if (!configurations[item.script_id]) {
              configurations[item.script_id] = [];
            }
            configurations[item.script_id].push({
              email_template_id: item.email_template_id,
              delay_hours: item.delay_hours,
              scheduled_time: item.scheduled_time
            });
          }
        });
        setScriptConfigurations(configurations);
      }
    } catch (error) {
      console.error('Error loading script configurations:', error);
      setScriptConfigurations({});
    }
  };

  // Load column configuration from setting table
  const loadColumnConfig = async () => {
    try {
      const data = await getSettingByType('customer_column_config');
      if (data) {
        if (data?.setting) {
          setColumnConfig(data?.setting);
        }
        setIdSettingColumnConfig(data?.id);
      }
    } catch (error) {
      console.error('Error loading column config:', error);
      // Keep default values if loading fails
    }
  };

  // Save column configuration to setting table
  const saveColumnConfig = async (newConfig) => {
    try {
      await updateSetting({
        id: idSettingColumnConfig,
        type: 'customer_column_config',
        setting: newConfig
      });
      setColumnConfig(newConfig);
      message.success('Cấu hình cột đã được lưu!');
    } catch (error) {
      console.error('Error saving column config:', error);
      message.error('Lỗi khi lưu cấu hình cột!');
    }
  };


  // Save script options - now handled by ScriptConfigModal directly
  const saveScriptOptions = async (newOptions) => {
    // This function is now handled by the ScriptConfigModal component
    // which directly calls the emailSchedulerScriptService API
    setScriptOptions(newOptions);
  };

  // Save script configurations - now handled by ScriptDetailModal directly
  const saveScriptConfigurations = async (newConfigurations) => {
    // This function is now handled by the ScriptDetailModal component
    // which directly calls the scriptEmailTemplateService API
    setScriptConfigurations(newConfigurations);
  };

  // Add new script option - now handled by ScriptConfigModal
  const handleAddScriptOption = () => {
    // This function is now handled by the ScriptConfigModal component
    // which directly calls the emailSchedulerScriptService API
    message.info('Vui lòng sử dụng nút "Cấu hình Kịch bản" để thêm kịch bản mới');
  };

  // Remove script option - now handled by ScriptConfigModal
  const handleRemoveScriptOption = async (optionToRemove) => {
    // This function is now handled by the ScriptConfigModal component
    // which directly calls the emailSchedulerScriptService API
    message.info('Vui lòng sử dụng nút "Cấu hình Kịch bản" để xóa kịch bản');
  };

  // Handle open script detail modal
  const handleOpenScriptDetail = async (script) => {
    setSelectedScript(script.name || script);
    setScriptType(script.type);
    try {
      // Load existing templates for this script from scriptEmailTemplate API
      const scriptId = script.id;
      if (scriptId) {
        // Gọi API để lấy templates theo script ID
        const templates = await getScriptEmailTemplatesByScriptId(scriptId);
        if (templates && Array.isArray(templates)) {
          // Sử dụng trực tiếp dữ liệu từ API
          setScriptTemplates(templates);
          setOriginalScriptTemplates(templates); // Deep copy
          setHasUnsavedChanges(false);
          setShowScriptDetailModal(true);
        } else {
          // Nếu không có templates, khởi tạo mảng rỗng
          setScriptTemplates([]);
          setOriginalScriptTemplates([]);
          setHasUnsavedChanges(false);
          setShowScriptDetailModal(true);
        }
      } else {
        message.error('Không tìm thấy ID của kịch bản');
      }
    } catch (error) {
      console.error('Error loading script templates:', error);
      message.error('Lỗi khi tải cấu hình email cho kịch bản');
    }
  };

  // Check if there are unsaved changes
  const checkForChanges = (newTemplates) => {
    const hasChanges = JSON.stringify(newTemplates) !== JSON.stringify(originalScriptTemplates);
    setHasUnsavedChanges(hasChanges);
  };



  // Add template to script
  const handleAddTemplateToScript = async (templateId, scheduledTime, delayDays = null, sendTime = null) => {
    try {
      // Tìm script ID từ selectedScript
      const script = scriptOptions.find(s => s.name === selectedScript);
      if (!script || !script.id) {
        message.error('Không tìm thấy script ID');
        return;
      }

      let templateData;

      // Cấu hình dựa trên loại script
      if (script.type === 'delay' && delayDays && sendTime) {
        // Loại "Delay" - sử dụng delay_days và send_time
        templateData = {
          script_id: parseInt(script.id),
          email_template_id: parseInt(templateId),
          delay_days: delayDays, // Sử dụng delay_days
          send_time: sendTime.format('HH:mm'),
          scheduled_time: null
        };
      } else {
        // Loại "Schedule" - sử dụng scheduled_time
        templateData = {
          script_id: parseInt(script.id),
          email_template_id: parseInt(templateId),
          delay_hours: null,
          scheduled_time: scheduledTime ? scheduledTime.toISOString() : null
        };
      }

      await createNewScriptEmailTemplate(templateData);

      // Reload templates
      const templates = await getScriptEmailTemplatesByScriptId(script.id);
      setScriptTemplates(templates);

      message.success('Đã thêm template vào kịch bản!');
    } catch (error) {
      console.error('Error adding template:', error);
      message.error('Lỗi khi thêm template!');
    }
  };

  // Remove template from script
  const handleRemoveTemplateFromScript = async (templateId) => {
    try {
      await deleteScriptEmailTemplate(templateId);

      // Reload templates
      const script = scriptOptions.find(s => s.name === selectedScript);
      if (script && script.id) {
        const templates = await getScriptEmailTemplatesByScriptId(script.id);
        setScriptTemplates(templates);
      }

      message.success('Đã xóa template khỏi kịch bản!');
    } catch (error) {
      console.error('Error removing template:', error);
      message.error('Lỗi khi xóa template!');
    }
  };

  // Update template scheduled time
  const handleUpdateTemplateTime = async (templateId, scheduledTime) => {
    try {
      if (!scheduledTime) return;

      // Tìm script ID từ selectedScript
      const script = scriptOptions.find(s => s.name === selectedScript);
      if (!script || !script.id) {
        message.error('Không tìm thấy script ID');
        return;
      }

      const templateData = {
        id: templateId,
        scheduled_time: scheduledTime.toISOString()
      };

      await updateScriptEmailTemplate(templateData);

      // Reload templates
      const templates = await getScriptEmailTemplatesByScriptId(script.id);
      setScriptTemplates(templates);

      message.success('Đã cập nhật thời gian template!');
    } catch (error) {
      console.error('Error updating template time:', error);
      message.error('Lỗi khi cập nhật thời gian template!');
    }
  };

  // Update template delay days
  const handleUpdateTemplateDelayDays = async (templateId, delayDays) => {
    try {
      if (!delayDays) return;

      // Tìm script ID từ selectedScript
      const script = scriptOptions.find(s => s.name === selectedScript);
      if (!script || !script.id) {
        message.error('Không tìm thấy script ID');
        return;
      }

      const templateData = {
        id: templateId,
        delay_days: delayDays // Sử dụng delay_days
      };

      await updateScriptEmailTemplate(templateData);

      // Reload templates
      const templates = await getScriptEmailTemplatesByScriptId(script.id);
      setScriptTemplates(templates);

      message.success('Đã cập nhật số ngày delay!');
    } catch (error) {
      console.error('Error updating template delay days:', error);
      message.error('Lỗi khi cập nhật số ngày delay!');
    }
  };

  // Update template send time
  const handleUpdateTemplateSendTime = async (templateId, sendTime) => {
    try {
      if (!sendTime) return;

      // Tìm script ID từ selectedScript
      const script = scriptOptions.find(s => s.name === selectedScript);
      if (!script || !script.id) {
        message.error('Không tìm thấy script ID');
        return;
      }

      const templateData = {
        id: templateId,
        send_time: sendTime.format('HH:mm')
      };

      await updateScriptEmailTemplate(templateData);

      // Reload templates
      const templates = await getScriptEmailTemplatesByScriptId(script.id);
      setScriptTemplates(templates);

      message.success('Đã cập nhật giờ gửi!');
    } catch (error) {
      console.error('Error updating template send time:', error);
      message.error('Lỗi khi cập nhật giờ gửi!');
    }
  };

  // Helper function để lấy care_script từ info field (JSONB) - trả về array
  const getCareScripts = (customer) => {
    try {


      // Sử dụng trường care_script riêng biệt thay vì trong info
      const careScripts = customer.care_script || [];

      // Đảm bảo trả về array
      if (!Array.isArray(careScripts)) {
        return [];
      }

      return careScripts;
    } catch (error) {
      console.error('Error parsing care_script:', error);
      return [];
    }
  };

  // Activate script directly without opening modal
  const handleActivateScriptDirectly = async () => {
    if (selectedRows.length === 0) {
      message.warning('Vui lòng chọn khách hàng!');
      return;
    }

    // Lấy thông tin khách hàng được chọnk
    const selectedIds = selectedRows.map(item => item.id);

    // Logic mới: chỉ cập nhật trạng thái script_status = true và time_run_script cho các khách hàng đã chọn
    try {
      const currentTimestamp = createTimestamp();
      const updatedCustomers = customers.map(customer => {
        if (selectedIds.includes(customer.id)) {
          // Chỉ cập nhật nếu script_status chưa là true
          if (!customer.script_status) {
            return {
              ...customer,
              script_status: true,
              time_run_script: currentTimestamp
            };
          }
        }
        return customer;
      });

      // Kiểm tra xem có customer nào thực sự được cập nhật không
      const hasUpdates = updatedCustomers.some((customer, index) =>
        selectedIds.includes(customer.id) &&
        customer.script_status !== customers[index].script_status
      );

      if (hasUpdates) {
        const res = await updateBulkCustomers(updatedCustomers);
        setCustomers(updatedCustomers);

        if (gridRef.current) {
          gridRef.current.api.refreshCells();
        }

        message.success(`Đã kích hoạt kịch bản cho ${selectedRows.length} khách hàng!`);
      } else {
        message.info('Tất cả khách hàng đã được chọn đã có kịch bản đang chạy!');
      }
    } catch (error) {
      console.error('Error activating script status:', error);
      message.error('Lỗi khi cập nhật trạng thái kịch bản!');
    }
  };


  // Filter và search customers
  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Apply filters
    if (filters && Object.keys(filters).length > 0) {
      result = result.filter(customer => {
        if (filters.status && customer.status !== filters.status) return false;
        if (filters.company && !customer.company?.toLowerCase()?.includes(filters.company?.toLowerCase())) return false;
        if (filters.minSpent && customer.total_spent < parseInt(filters?.minSpent)) return false;
        if (filters.lastContactDays) {
          // Lấy email gần nhất từ emailHistory
          const emailHistory = customer.emailHistory;
          if (!emailHistory || !Array.isArray(emailHistory) || emailHistory.length === 0) {
            return false; // Không có email = không match
          }

          // Lấy email gần nhất dựa vào email_date
          const latestEmail = emailHistory.reduce((latest, current) => {
            const latestDate = new Date(latest.email_date);
            const currentDate = new Date(current.email_date);
            return currentDate > latestDate ? current : latest;
          });

          if (latestEmail.email_date) {
            const daysSinceContact = Math.floor((new Date() - new Date(latestEmail.email_date)) / (1000 * 60 * 60 * 24));
            if (daysSinceContact > parseInt(filters.lastContactDays)) return false;
          } else {
            return false; // Không có email_date = không match
          }
        }
        return true;
      });
    }

    // Apply group filters
    if (groupFilters && Object.keys(groupFilters).some(key => groupFilters[key].length > 0)) {
      result = result.filter(customer => {
        try {
          const info = customer.info;
          let customerGroup1 = [], customerGroup2 = [], customerGroup3 = [], customerGroup4 = [], customerGroup5 = [], customerGroup6 = [], customerGroup7 = [], customerGroup8 = [], customerGroup9 = [], customerGroup10 = [], customerCareScript = [];

          // Parse info data
          if (typeof info === 'object' && info !== null) {
            customerGroup1 = Array.isArray(info.group1) ? info.group1 : (info.group1 ? [info.group1] : []);
            customerGroup2 = Array.isArray(info.group2) ? info.group2 : (info.group2 ? [info.group2] : []);
            customerGroup3 = Array.isArray(info.group3) ? info.group3 : (info.group3 ? [info.group3] : []);
            customerGroup4 = Array.isArray(info.group4) ? info.group4 : (info.group4 ? [info.group4] : []);
            customerGroup5 = Array.isArray(info.group5) ? info.group5 : (info.group5 ? [info.group5] : []);
            customerGroup6 = Array.isArray(info.group6) ? info.group6 : (info.group6 ? [info.group6] : []);
            customerGroup7 = Array.isArray(info.group7) ? info.group7 : (info.group7 ? [info.group7] : []);
            customerGroup8 = Array.isArray(info.group8) ? info.group8 : (info.group8 ? [info.group8] : []);
            customerGroup9 = Array.isArray(info.group9) ? info.group9 : (info.group9 ? [info.group9] : []);
            customerGroup10 = Array.isArray(info.group10) ? info.group10 : (info.group10 ? [info.group10] : []);
            // Sử dụng trường care_script riêng biệt thay vì trong info
            customerCareScript = Array.isArray(customer.care_script) ? customer.care_script : (customer.care_script ? [customer.care_script] : []);
          } else if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            customerGroup1 = Array.isArray(parsed.group1) ? parsed.group1 : (parsed.group1 ? [parsed.group1] : []);
            customerGroup2 = Array.isArray(parsed.group2) ? parsed.group2 : (parsed.group2 ? [parsed.group2] : []);
            customerGroup3 = Array.isArray(parsed.group3) ? parsed.group3 : (parsed.group3 ? [parsed.group3] : []);
            customerGroup4 = Array.isArray(parsed.group4) ? parsed.group4 : (parsed.group4 ? [parsed.group4] : []);
            customerGroup5 = Array.isArray(parsed.group5) ? parsed.group5 : (parsed.group5 ? [parsed.group5] : []);
            customerGroup6 = Array.isArray(parsed.group6) ? parsed.group6 : (parsed.group6 ? [parsed.group6] : []);
            customerGroup7 = Array.isArray(parsed.group7) ? parsed.group7 : (parsed.group7 ? [parsed.group7] : []);
            customerGroup8 = Array.isArray(parsed.group8) ? parsed.group8 : (parsed.group8 ? [parsed.group8] : []);
            customerGroup9 = Array.isArray(parsed.group9) ? parsed.group9 : (parsed.group9 ? [parsed.group9] : []);
            customerGroup10 = Array.isArray(parsed.group10) ? parsed.group10 : (parsed.group10 ? [parsed.group10] : []);
            // Sử dụng trường care_script riêng biệt thay vì trong info
            customerCareScript = Array.isArray(customer.care_script) ? customer.care_script : (customer.care_script ? [customer.care_script] : []);
          }

          // Check group1 filter
          if (groupFilters.group1.length > 0) {
            const hasAllGroup1 = groupFilters.group1.every(filterValue =>
              customerGroup1.includes(filterValue)
            );
            if (!hasAllGroup1) return false;
          }

          // Check group2 filter
          if (groupFilters.group2.length > 0) {
            const hasAllGroup2 = groupFilters.group2.every(filterValue =>
              customerGroup2.includes(filterValue)
            );
            if (!hasAllGroup2) return false;
          }

          // Check group3 filter
          if (groupFilters.group3.length > 0) {
            const hasAllGroup3 = groupFilters.group3.every(filterValue =>
              customerGroup3.includes(filterValue)
            );
            if (!hasAllGroup3) return false;
          }

          // Check group4 filter
          if (groupFilters.group4.length > 0) {
            const hasAllGroup4 = groupFilters.group4.every(filterValue =>
              customerGroup4.includes(filterValue)
            );
            if (!hasAllGroup4) return false;
          }

          // Check group5 filter
          if (groupFilters.group5.length > 0) {
            const hasAllGroup5 = groupFilters.group5.every(filterValue =>
              customerGroup5.includes(filterValue)
            );
            if (!hasAllGroup5) return false;
          }

          // Check group6 filter
          if (groupFilters.group6.length > 0) {
            const hasAllGroup6 = groupFilters.group6.every(filterValue =>
              customerGroup6.includes(filterValue)
            );
            if (!hasAllGroup6) return false;
          }

          // Check group7 filter
          if (groupFilters.group7.length > 0) {
            const hasAllGroup7 = groupFilters.group7.every(filterValue =>
              customerGroup7.includes(filterValue)
            );
            if (!hasAllGroup7) return false;
          }

          // Check group8 filter
          if (groupFilters.group8.length > 0) {
            const hasAllGroup8 = groupFilters.group8.every(filterValue =>
              customerGroup8.includes(filterValue)
            );
            if (!hasAllGroup8) return false;
          }

          // Check group9 filter
          if (groupFilters.group9.length > 0) {
            const hasAllGroup9 = groupFilters.group9.every(filterValue =>
              customerGroup9.includes(filterValue)
            );
            if (!hasAllGroup9) return false;
          }

          // Check group10 filter
          if (groupFilters.group10.length > 0) {
            const hasAllGroup10 = groupFilters.group10.every(filterValue =>
              customerGroup10.includes(filterValue)
            );
            if (!hasAllGroup10) return false;
          }

          // Check care_script filter
          if (groupFilters.care_script.length > 0) {
            // Map id -> name từ scriptOptions để so sánh
            const idToName = new Map((scriptOptions || []).map(s => [s.id, s.name]));
            const nameSet = new Set((scriptOptions || []).map(s => s.name));
            
            // Convert customer care_script to names for comparison
            const customerScriptNames = customerCareScript.map(item => {
              if (typeof item === 'object' && item !== null) {
                const mappedName = idToName.get(item.emailSchedulerScript_id);
                return mappedName || item.script_name || item.script_short_name || '';
              }
              if (typeof item === 'string') {
                return item;
              }
              return '';
            }).filter(name => name);
            
            const hasAllCareScript = groupFilters.care_script.every(filterValue =>
              customerScriptNames.includes(filterValue)
            );
            if (!hasAllCareScript) return false;
          }

          // Check script_status filter
          if (groupFilters.script_status && groupFilters.script_status.length > 0) {
            const customerScriptStatus = customer.script_status ? 'Đang chạy' : 'Tạm dừng';
            const hasScriptStatus = groupFilters.script_status.includes(customerScriptStatus);
            if (!hasScriptStatus) return false;
          }

          return true;
        } catch (error) {
          return false;
        }
      });
    }

    // Apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      result = result.filter(customer => {
        // Get group1, group2 from info field và care_script từ trường riêng biệt
        let group1 = '', group2 = '', care_script = '';
        try {
          const info = customer.info;
          // JSONB thường đã được parse thành object
          if (typeof info === 'object' && info !== null) {
            group1 = info?.group1 || '';
            group2 = info?.group2 || '';
          } else if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            group1 = parsed?.group1 || '';
            group2 = parsed?.group2 || '';
          }

          // Sử dụng trường care_script riêng biệt và lấy tên scripts
          const careScripts = customer.care_script || [];
          care_script = careScripts.map(script =>
            script.script_name || script.script_short_name || script
          ).join(' ');
        } catch (error) {
          // Ignore parsing errors
        }

        return customer.name?.toLowerCase().includes(search) ||
          customer.email?.toLowerCase().includes(search) ||
          customer.company?.toLowerCase().includes(search) ||
          customer.phone?.toLowerCase().includes(search) ||
          customer.note?.toLowerCase().includes(search)

      });
    }

    return result;
  }, [customers, filters, searchTerm, groupFilters, scriptOptions]);

  // Đơn giản hóa - chỉ sync selection khi cần thiết
  useEffect(() => {
    if (gridRef.current?.api && selectedRows.length > 0) {
      setTimeout(() => {
        // Chỉ select những items còn tồn tại trong filtered data
        const filteredIds = filteredCustomers.map(c => c.id);
        const validSelectedData = selectedRows.filter(item => filteredIds.includes(item.id));

        if (validSelectedData.length !== selectedRows.length) {
          setSelectedRows(validSelectedData);
        }
      }, 100);
    }
  }, [filteredCustomers]);


  // Handle email item click
  const handleEmailItemClick = (email) => {
    setSelectedEmail(email);
    setShowEmailDetailModal(true);
  };

  // Handle care event item click
  const handleCareEventItemClick = (event) => {
    setSelectedCareEvent(event);
    setShowCareEventDetail(true);
  };

  // Handle open edit care event modal
  const handleOpenEditCareEvent = (event) => {
    // Kiểm tra quyền sửa - chỉ user tạo mới được sửa
    if (event.user_create !== currentUser.email) {
      message.error('Bạn chỉ có thể sửa event do chính mình tạo!');
      return;
    }

    setSelectedCareEvent(event);
    setCareEventForm({
      title: event.title,
      content: event.content,
      event_type: event.event_type
    });
    setIsEditingCareEvent(true);
  };

  // Handle care event form change
  const handleCareEventFormChange = (field, value) => {
    setCareEventForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle create care event
  const handleCreateCareEvent = async () => {
    if (!selectedCustomerForCare.length) return;

    try {
      setCreatingCareEvent(true);
      for (const customer of selectedCustomerForCare) {
        const newEventData = {
          customer_id: customer.id,
          title: careEventForm.title,
          content: careEventForm.content,
          event_type: careEventForm.event_type,
          created_at: createTimestamp(),
          user_create: currentUser.email,
          show: true
        };

        const response = await createNewCareEventHistory(newEventData);
      }

      // Reload customers để cập nhật dữ liệu mới
      if (onRefresh) {
        await onRefresh();
      }

      message.success('Tạo event chăm sóc thành công!');
      setShowCareEventModal(false);
      setCareEventForm({ title: '', content: '', event_type: 'call' });
      setSelectedCustomerForCare([]);
    } catch (error) {
      console.error('Error creating care event:', error);
      message.error('Lỗi khi tạo event chăm sóc!');
    } finally {
      setCreatingCareEvent(false);
    }
  };

  // Handle save content from editor
  const handleSaveContent = async (htmlContent) => {
    setCareEventForm(prev => ({
      ...prev,
      content: htmlContent
    }));
    setShowEditor(false);
  };

  // Handle update care event
  const handleUpdateCareEvent = async () => {
    if (!selectedCareEvent) return;

    try {
      setUpdatingCareEvent(true);

      const updateData = {
        id: selectedCareEvent.id,
        customer_id: selectedCareEvent.customer_id,
        title: careEventForm.title,
        content: careEventForm.content,
        event_type: careEventForm.event_type,
        updated_at: createTimestamp(),
        user_update: currentUser.email,
        show: true
      };

      await updateCareEventHistory(updateData);

      // Reload customers để cập nhật dữ liệu mới
      if (onRefresh) {
        await onRefresh();
      }

      message.success('Cập nhật event chăm sóc thành công!');
      setIsEditingCareEvent(false);
      setShowCareEventDetail(false);
      setSelectedCareEvent(null);
      setCareEventForm({ title: '', content: '', event_type: 'call' });
    } catch (error) {
      console.error('Error updating care event:', error);
      message.error('Lỗi khi cập nhật event chăm sóc!');
    } finally {
      setUpdatingCareEvent(false);
    }
  };

  // Handle delete care event
  const handleDeleteCareEvent = async (eventId, customerId) => {
    try {
      // Kiểm tra quyền xóa - chỉ user tạo mới được xóa
      if (selectedCareEvent && selectedCareEvent.user_create !== currentUser.email) {
        message.error('Bạn chỉ có thể xóa event do chính mình tạo!');
        return;
      }

      await deleteCareEventHistory(eventId);

      // Reload customers để cập nhật dữ liệu mới
      if (onRefresh) {
        await onRefresh();
      }

      setShowCareEventDetail(false);
      setSelectedCareEvent(null);
      message.success('Xóa event chăm sóc thành công!');
    } catch (error) {
      console.error('Error deleting care event:', error);
      message.error('Lỗi khi xóa event chăm sóc!');
    }
  };

  // Handle open care event modal
  const handleOpenCareEventModal = (customers) => {
    setSelectedCustomerForCare(customers);
    setCareEventForm({
      title: '',
      content: '',
      event_type: 'call'
    });
    setShowCareEventModal(true);
  };


  // Default column definition
  const defaultColDef = useMemo(() => {
    return {
      editable: finalHasAccess, // Chỉ cho phép edit khi có quyền
      filter: true,
      suppressMenu: true,
      cellStyle: { fontSize: '14px' },
      wrapHeaderText: true,
      autoHeaderHeight: true,
    };
  }, [finalHasAccess]);

  // Status bar configuration
  const statusBar = useMemo(() => ({
    statusPanels: [{ statusPanel: 'agAggregationComponent' }]
  }), []);

  function filter() {
    return {
      filter: 'agMultiColumnFilter',
      floatingFilter: true,
      filterParams: {
        filters: [
          {
            filter: 'agTextColumnFilter',
          },
          {
            filter: 'agSetColumnFilter',
          },
        ],
      },
    };
  }
  // Load column position from localStorage
  useEffect(() => {
    const loadColumnPosition = async () => {
      try {
        const savedColumnState = await getItemFromIndexedDB(tableCol) || [];
        const baseColumnDefs = getBaseColumnDefs();

        if (savedColumnState.length > 0) {
          const updatedColDefs = loadColumnState(baseColumnDefs, savedColumnState);
          setColDefs(updatedColDefs);
        } else {
          setColDefs(baseColumnDefs);
        }
      } catch (error) {
        console.error('Error loading column position:', error);
        setColDefs(getBaseColumnDefs());
      }
    };

    loadColumnPosition();
  }, [tableCol, finalHasAccess, columnConfig, scriptOptions, scriptConfigurations]);

  // Reset column position to default
  const handleResetColumns = async () => {
    try {
      // Clear saved column state from IndexedDB
      await deleteItemFromIndexedDB(tableCol);

      // Reset to base column definitions
      const baseColumnDefs = getBaseColumnDefs();
      setColDefs(baseColumnDefs);

      // Apply to grid if available
      if (gridRef.current?.api) {
        gridRef.current.api.setColumnDefs(baseColumnDefs);
      }

      message.success('Đã khôi phục vị trí cột về mặc định!');
    } catch (error) {
      console.error('Error resetting columns:', error);
      message.error('Lỗi khi khôi phục vị trí cột!');
    }
  };

  // Base column definitions function
  const getBaseColumnDefs = () => [
    {
      field: 'actions',
      headerName: 'Actions',
      editable: false,
      width: 120,
      pinned: 'left',
      filter: false,
      cellRenderer: (params) => {
        const handleViewClick = () => {
          if (onToggleEmailHistory) {
            try {
              onToggleEmailHistory(params.data.id);
              console.log('Email history toggled successfully');
            } catch (error) {
              console.error('Error toggling email history:', error);
            }
          } else {
            console.warn('onToggleEmailHistory function is not available');
          }
        };

        const handleDetailClick = () => {
          setSelectedCustomerDetail(params.data);
          setShowCustomerDetailModal(true);
        };

        return (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={handleViewClick}
              className={styles.viewBtn}
              style={{ padding: '2px 6px', fontSize: '12px' }}
            >
              <Eye size={12} /> View
            </button>
            <button
              onClick={handleDetailClick}
              className={styles.viewBtn}
              style={{ padding: '2px 6px', fontSize: '12px' }}
            >
              Detail
            </button>
          </div>
        );
      },
    },
    {
      field: 'checkbox',
      headerName: '',
      headerCheckboxSelection: true,
      checkboxSelection: true,
      width: 50,
      pinned: 'left',
      suppressMenu: true,
      editable: false,
      cellStyle: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
      ...filter(),
    },
    {
      field: 'id',
      headerName: 'ID',
      width: 60,
      filter: 'agNumberColumnFilter',
      editable: false,
      pinned: 'left',
      ...filter(),

    },
    {
      field: 'name',
      headerName: 'Name',
      pinned: 'left',
      width: 200,
      editable: finalHasAccess,
      ...filter(),
    },
    {
      field: 'email',
      headerName: 'Email',
      pinned: 'left',
      width: 180,
      editable: finalHasAccess,
      ...filter(),
    },
    {
      field: 'company',
      headerName: 'Company',
      width: 200,
      editable: finalHasAccess,
      ...filter(),
    },
    {
      field: 'phone',
      headerName: 'Số điện thoại',
      width: 110,
      editable: finalHasAccess,
      ...filter(),
    },
    {
      field: 'note',
      headerName: 'Ghi chú',
      width: 200,
      editable: finalHasAccess,
      ...filter(),
    },
    {
      field: 'group1',
      editable: finalHasAccess,
      headerName: columnConfig?.group1?.displayName,
      width: 150,
      cellStyle: { cursor: 'pointer' },
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          let value = [];
          if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            value = parsed?.group1 || [];
          } else if (typeof info === 'object' && info !== null) {
            value = info?.group1 || [];
          }

          // Kiểm tra giá trị nào không tồn tại trong danh sách (so sánh sau khi trim + lowercase)
          const normalize = (s) => (s ?? '').toString().trim();
          const validOptions = (columnConfig?.group1?.options || []).map(normalize);
          const invalidValues = (Array.isArray(value) ? value : [value])
            .map(v => v?.toString()?.trim() || '')
            .filter(v => !validOptions.includes(normalize(v)));

          // Lưu thông tin invalid values vào data để sử dụng trong cellRenderer
          params.data._invalidGroup1 = invalidValues;

          return Array.isArray(value) ? value.join(', ') : value || '';
        } catch (error) {
          return '';
        }
      },
      cellRenderer: (params) => {
        const value = params.value;
        const invalidValues = params.data._invalidGroup1 || [];

        if (!value) return '';

        const values = value.split(', ').map(v => v.trim());

        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
            {values.map((val, index) => {
              const isInvalid = invalidValues.includes(val);
              return (
                <span
                  key={index}
                  style={{
                    color: isInvalid ? '#ff4d4f' : '#10b981',
                    backgroundColor: isInvalid ? '#fff2f0' : '#f0fdf4',
                    fontWeight: 'bold',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                >
                  {val}
                </span>
              );
            })}
          </div>
        );
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};

          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }

          // Handle multiple selection - convert to array if needed
          if (Array.isArray(newValue)) {
            parsedInfo.group1 = newValue;
          } else if (typeof newValue === 'string' && newValue.includes(',')) {
            parsedInfo.group1 = newValue.split(',').map(v => v.trim()).filter(v => v);
          } else {
            parsedInfo.group1 = newValue ? [newValue] : [];
          }

          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting group1:', error);
          return false;
        }
      },
    },
    {
      field: 'group2',
      headerName: columnConfig?.group2?.displayName,
      editable: finalHasAccess,

      width: 150,
      cellStyle: { cursor: 'pointer' },
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          let value = [];
          if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            value = parsed?.group2 || [];
          } else if (typeof info === 'object' && info !== null) {
            value = info?.group2 || [];
          }

          // Kiểm tra giá trị nào không tồn tại trong danh sách (so sánh sau khi trim + lowercase)
          const normalize = (s) => (s ?? '').toString().trim();
          const validOptions = (columnConfig?.group2?.options || []).map(normalize);
          const invalidValues = (Array.isArray(value) ? value : [value])
            .map(v => v?.toString()?.trim() || '')
            .filter(v => !validOptions.includes(normalize(v)));

          // Lưu thông tin invalid values vào data để sử dụng trong cellRenderer
          params.data._invalidGroup2 = invalidValues;

          return Array.isArray(value) ? value.join(', ') : value || '';
        } catch (error) {
          return '';
        }
      },
      cellRenderer: (params) => {
        const value = params.value;
        const invalidValues = params.data._invalidGroup2 || [];

        if (!value) return '';

        const values = value.split(', ').map(v => v.trim());

        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
            {values.map((val, index) => {
              const isInvalid = invalidValues.includes(val);
              return (
                <span
                  key={index}
                  style={{
                    color: isInvalid ? '#ff4d4f' : '#10b981',
                    backgroundColor: isInvalid ? '#fff2f0' : '#f0fdf4',
                    fontWeight: 'bold',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                >
                  {val}
                </span>
              );
            })}
          </div>
        );
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};

          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }

          // Handle multiple selection - convert to array if needed
          if (Array.isArray(newValue)) {
            parsedInfo.group2 = newValue;
          } else if (typeof newValue === 'string' && newValue.includes(',')) {
            parsedInfo.group2 = newValue.split(',').map(v => v.trim()).filter(v => v);
          } else {
            parsedInfo.group2 = newValue ? [newValue] : [];
          }

          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting group2:', error);
          return false;
        }
      },
    },
    {
      field: 'group3',
      headerName: columnConfig?.group3?.displayName,
      editable: finalHasAccess,

      width: 150,
      cellStyle: { cursor: 'pointer' },
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          let value = [];
          if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            value = parsed?.group3 || [];
          } else if (typeof info === 'object' && info !== null) {
            value = info?.group3 || [];
          }

          // Kiểm tra giá trị nào không tồn tại trong danh sách (so sánh sau khi trim + lowercase)
          const normalize = (s) => (s ?? '').toString().trim();
          const validOptions = (columnConfig?.group3?.options || []).map(normalize);
          const invalidValues = (Array.isArray(value) ? value : [value])
            .map(v => v?.toString()?.trim() || '')
            .filter(v => !validOptions.includes(normalize(v)));

          // Lưu thông tin invalid values vào data để sử dụng trong cellRenderer
          params.data._invalidGroup3 = invalidValues;

          return Array.isArray(value) ? value.join(', ') : value || '';
        } catch (error) {
          return '';
        }
      },
      cellRenderer: (params) => {
        const value = params.value;
        const invalidValues = params.data._invalidGroup3 || [];

        if (!value) return '';

        const values = value.split(', ').map(v => v.trim());

        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
            {values.map((val, index) => {
              const isInvalid = invalidValues.includes(val);
              return (
                <span
                  key={index}
                  style={{
                    color: isInvalid ? '#ff4d4f' : '#10b981',
                    backgroundColor: isInvalid ? '#fff2f0' : '#f0fdf4',
                    fontWeight: 'bold',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                >
                  {val}
                </span>
              );
            })}
          </div>
        );
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};

          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }

          // Handle multiple selection - convert to array if needed
          if (Array.isArray(newValue)) {
            parsedInfo.group3 = newValue;
          } else if (typeof newValue === 'string' && newValue.includes(',')) {
            parsedInfo.group3 = newValue.split(',').map(v => v.trim()).filter(v => v);
          } else {
            parsedInfo.group3 = newValue ? [newValue] : [];
          }

          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting group3:', error);
          return false;
        }
      },
    },

    // Additional group columns
    {
      field: 'group4',
      headerName: columnConfig?.group4?.displayName,
      editable: finalHasAccess,

      width: 150,
      cellStyle: { cursor: 'pointer' },
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          let value = [];
          if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            value = parsed?.group4 || [];
          } else if (typeof info === 'object' && info !== null) {
            value = info?.group4 || [];
          }

          const normalize = (s) => (s ?? '').toString().trim();
          const validOptions = (columnConfig?.group4?.options || []).map(normalize);
          const invalidValues = (Array.isArray(value) ? value : [value])
            .map(v => v?.toString()?.trim() || '')
            .filter(v => !validOptions.includes(normalize(v)));
          params.data._invalidGroup4 = invalidValues;
          return Array.isArray(value) ? value.join(', ') : value || '';
        } catch (error) {
          return '';
        }
      },
      cellRenderer: (params) => {
        const value = params.value;
        const invalidValues = params.data._invalidGroup4 || [];
        if (!value) return '';
        const values = value.split(', ').map(v => v.trim());
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
            {values.map((val, index) => {
              const isInvalid = invalidValues.includes(val);
              return (
                <span
                  key={index}
                  style={{
                    color: isInvalid ? '#ff4d4f' : '#10b981',
                    backgroundColor: isInvalid ? '#fff2f0' : '#f0fdf4',
                    fontWeight: 'bold',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                >
                  {val}
                </span>
              );
            })}
          </div>
        );
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};
          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }
          if (Array.isArray(newValue)) {
            parsedInfo.group4 = newValue;
          } else if (typeof newValue === 'string' && newValue.includes(',')) {
            parsedInfo.group4 = newValue.split(',').map(v => v.trim()).filter(v => v);
          } else {
            parsedInfo.group4 = newValue ? [newValue] : [];
          }
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting group4:', error);
          return false;
        }
      },
    },
    {
      field: 'group5',
      headerName: columnConfig?.group5?.displayName,
      editable: finalHasAccess,

      width: 150,
      cellStyle: { cursor: 'pointer' },
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          let value = [];
          if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            value = parsed?.group5 || [];
          } else if (typeof info === 'object' && info !== null) {
            value = info?.group5 || [];
          }
          const normalize = (s) => (s ?? '').toString().trim();
          const validOptions = (columnConfig?.group5?.options || []).map(normalize);
          const invalidValues = (Array.isArray(value) ? value : [value])
            .map(v => v?.toString()?.trim() || '')
            .filter(v => !validOptions.includes(normalize(v)));
          params.data._invalidGroup5 = invalidValues;
          return Array.isArray(value) ? value.join(', ') : value || '';
        } catch (error) {
          return '';
        }
      },
      cellRenderer: (params) => {
        const value = params.value;
        const invalidValues = params.data._invalidGroup5 || [];
        if (!value) return '';
        const values = value.split(', ').map(v => v.trim());
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
            {values.map((val, index) => {
              const isInvalid = invalidValues.includes(val);
              return (
                <span
                  key={index}
                  style={{
                    color: isInvalid ? '#ff4d4f' : '#10b981',
                    backgroundColor: isInvalid ? '#fff2f0' : '#f0fdf4',
                    fontWeight: 'bold',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                >
                  {val}
                </span>
              );
            })}
          </div>
        );
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};
          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }
          if (Array.isArray(newValue)) {
            parsedInfo.group5 = newValue;
          } else if (typeof newValue === 'string' && newValue.includes(',')) {
            parsedInfo.group5 = newValue.split(',').map(v => v.trim()).filter(v => v);
          } else {
            parsedInfo.group5 = newValue ? [newValue] : [];
          }
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting group5:', error);
          return false;
        }
      },
    },
    {
      field: 'group6',
      headerName: columnConfig?.group6?.displayName,
      editable: finalHasAccess,

      width: 150,
      cellStyle: { cursor: 'pointer' },
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          let value = [];
          if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            value = parsed?.group6 || [];
          } else if (typeof info === 'object' && info !== null) {
            value = info?.group6 || [];
          }
          const normalize = (s) => (s ?? '').toString().trim();
          const validOptions = (columnConfig?.group6?.options || []).map(normalize);
          const invalidValues = (Array.isArray(value) ? value : [value])
            .map(v => v?.toString()?.trim() || '')
            .filter(v => !validOptions.includes(normalize(v)));
          params.data._invalidGroup6 = invalidValues;
          return Array.isArray(value) ? value.join(', ') : value || '';
        } catch (error) {
          return '';
        }
      },
      cellRenderer: (params) => {
        const value = params.value;
        const invalidValues = params.data._invalidGroup6 || [];
        if (!value) return '';
        const values = value.split(', ').map(v => v.trim());
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
            {values.map((val, index) => {
              const isInvalid = invalidValues.includes(val);
              return (
                <span
                  key={index}
                  style={{
                    color: isInvalid ? '#ff4d4f' : '#10b981',
                    backgroundColor: isInvalid ? '#fff2f0' : '#f0fdf4',
                    fontWeight: 'bold',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                >
                  {val}
                </span>
              );
            })}
          </div>
        );
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};
          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }
          if (Array.isArray(newValue)) {
            parsedInfo.group6 = newValue;
          } else if (typeof newValue === 'string' && newValue.includes(',')) {
            parsedInfo.group6 = newValue.split(',').map(v => v.trim()).filter(v => v);
          } else {
            parsedInfo.group6 = newValue ? [newValue] : [];
          }
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting group6:', error);
          return false;
        }
      },
    },
    {
      field: 'group7',
      headerName: columnConfig?.group7?.displayName,
      editable: finalHasAccess,

      width: 150,
      cellStyle: { cursor: 'pointer' },
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          let value = [];
          if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            value = parsed?.group7 || [];
          } else if (typeof info === 'object' && info !== null) {
            value = info?.group7 || [];
          }
          const normalize = (s) => (s ?? '').toString().trim();
          const validOptions = (columnConfig?.group7?.options || []).map(normalize);
          const invalidValues = (Array.isArray(value) ? value : [value])
            .map(v => v?.toString()?.trim() || '')
            .filter(v => !validOptions.includes(normalize(v)));
          params.data._invalidGroup7 = invalidValues;
          return Array.isArray(value) ? value.join(', ') : value || '';
        } catch (error) {
          return '';
        }
      },
      cellRenderer: (params) => {
        const value = params.value;
        const invalidValues = params.data._invalidGroup7 || [];
        if (!value) return '';
        const values = value.split(', ').map(v => v.trim());
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
            {values.map((val, index) => {
              const isInvalid = invalidValues.includes(val);
              return (
                <span
                  key={index}
                  style={{
                    color: isInvalid ? '#ff4d4f' : '#10b981',
                    backgroundColor: isInvalid ? '#fff2f0' : '#f0fdf4',
                    fontWeight: 'bold',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                >
                  {val}
                </span>
              );
            })}
          </div>
        );
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};
          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }
          if (Array.isArray(newValue)) {
            parsedInfo.group7 = newValue;
          } else if (typeof newValue === 'string' && newValue.includes(',')) {
            parsedInfo.group7 = newValue.split(',').map(v => v.trim()).filter(v => v);
          } else {
            parsedInfo.group7 = newValue ? [newValue] : [];
          }
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting group7:', error);
          return false;
        }
      },
    },
    {
      field: 'group8',
      headerName: columnConfig?.group8?.displayName,
      editable: finalHasAccess,

      width: 150,
      cellStyle: { cursor: 'pointer' },
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          let value = [];
          if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            value = parsed?.group8 || [];
          } else if (typeof info === 'object' && info !== null) {
            value = info?.group8 || [];
          }
          const normalize = (s) => (s ?? '').toString().trim();
          const validOptions = (columnConfig?.group8?.options || []).map(normalize);
          const invalidValues = (Array.isArray(value) ? value : [value])
            .map(v => v?.toString()?.trim() || '')
            .filter(v => !validOptions.includes(normalize(v)));
          params.data._invalidGroup8 = invalidValues;
          return Array.isArray(value) ? value.join(', ') : value || '';
        } catch (error) {
          return '';
        }
      },
      cellRenderer: (params) => {
        const value = params.value;
        const invalidValues = params.data._invalidGroup8 || [];
        if (!value) return '';
        const values = value.split(', ').map(v => v.trim());
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
            {values.map((val, index) => {
              const isInvalid = invalidValues.includes(val);
              return (
                <span
                  key={index}
                  style={{
                    color: isInvalid ? '#ff4d4f' : '#10b981',
                    backgroundColor: isInvalid ? '#fff2f0' : '#f0fdf4',
                    fontWeight: 'bold',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                >
                  {val}
                </span>
              );
            })}
          </div>
        );
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};
          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }
          if (Array.isArray(newValue)) {
            parsedInfo.group8 = newValue;
          } else if (typeof newValue === 'string' && newValue.includes(',')) {
            parsedInfo.group8 = newValue.split(',').map(v => v.trim()).filter(v => v);
          } else {
            parsedInfo.group8 = newValue ? [newValue] : [];
          }
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting group8:', error);
          return false;
        }
      },
    },
    {
      field: 'group9',
      headerName: columnConfig?.group9?.displayName,
      editable: finalHasAccess,

      width: 150,
      cellStyle: { cursor: 'pointer' },
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          let value = [];
          if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            value = parsed?.group9 || [];
          } else if (typeof info === 'object' && info !== null) {
            value = info?.group9 || [];
          }
          const normalize = (s) => (s ?? '').toString().trim();
          const validOptions = (columnConfig?.group9?.options || []).map(normalize);
          const invalidValues = (Array.isArray(value) ? value : [value])
            .map(v => v?.toString()?.trim() || '')
            .filter(v => !validOptions.includes(normalize(v)));
          params.data._invalidGroup9 = invalidValues;
          return Array.isArray(value) ? value.join(', ') : value || '';
        } catch (error) {
          return '';
        }
      },
      cellRenderer: (params) => {
        const value = params.value;
        const invalidValues = params.data._invalidGroup9 || [];
        if (!value) return '';
        const values = value.split(', ').map(v => v.trim());
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
            {values.map((val, index) => {
              const isInvalid = invalidValues.includes(val);
              return (
                <span
                  key={index}
                  style={{
                    color: isInvalid ? '#ff4d4f' : '#10b981',
                    backgroundColor: isInvalid ? '#fff2f0' : '#f0fdf4',
                    fontWeight: 'bold',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                >
                  {val}
                </span>
              );
            })}
          </div>
        );
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};
          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }
          if (Array.isArray(newValue)) {
            parsedInfo.group9 = newValue;
          } else if (typeof newValue === 'string' && newValue.includes(',')) {
            parsedInfo.group9 = newValue.split(',').map(v => v.trim()).filter(v => v);
          } else {
            parsedInfo.group9 = newValue ? [newValue] : [];
          }
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting group9:', error);
          return false;
        }
      },
    },
    {
      field: 'group10',
      headerName: columnConfig?.group10?.displayName,
      editable: finalHasAccess,

      width: 150,
      cellStyle: { cursor: 'pointer' },
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          let value = [];
          if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            value = parsed?.group10 || [];
          } else if (typeof info === 'object' && info !== null) {
            value = info?.group10 || [];
          }
          const normalize = (s) => (s ?? '').toString().trim();
          const validOptions = (columnConfig?.group10?.options || []).map(normalize);
          const invalidValues = (Array.isArray(value) ? value : [value])
            .map(v => v?.toString()?.trim() || '')
            .filter(v => !validOptions.includes(normalize(v)));
          params.data._invalidGroup10 = invalidValues;
          return Array.isArray(value) ? value.join(', ') : value || '';
        } catch (error) {
          return '';
        }
      },
      cellRenderer: (params) => {
        const value = params.value;
        const invalidValues = params.data._invalidGroup10 || [];
        if (!value) return '';
        const values = value.split(', ').map(v => v.trim());
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
            {values.map((val, index) => {
              const isInvalid = invalidValues.includes(val);
              return (
                <span
                  key={index}
                  style={{
                    color: isInvalid ? '#ff4d4f' : '#10b981',
                    backgroundColor: isInvalid ? '#fff2f0' : '#f0fdf4',
                    fontWeight: 'bold',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                >
                  {val}
                </span>
              );
            })}
          </div>
        );
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};
          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }
          if (Array.isArray(newValue)) {
            parsedInfo.group10 = newValue;
          } else if (typeof newValue === 'string' && newValue.includes(',')) {
            parsedInfo.group10 = newValue.split(',').map(v => v.trim()).filter(v => v);
          } else {
            parsedInfo.group10 = newValue ? [newValue] : [];
          }
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting group10:', error);
          return false;
        }
      },
    },

    // Text columns
    {
      field: 'text1',
      headerName: columnConfig?.text1?.displayName || 'Text Field 1',
      width: 150,
      editable: finalHasAccess,
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          if (typeof info === 'object' && info !== null) {
            return info?.text1 || '';
          } else if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            return parsed?.text1 || '';
          }
          return '';
        } catch (error) {
          return '';
        }
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};

          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }

          parsedInfo.text1 = newValue;
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting text1:', error);
          return false;
        }
      },
    },
    {
      field: 'text2',
      headerName: columnConfig?.text2?.displayName || 'Text Field 2',
      width: 150,
      editable: finalHasAccess,
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          if (typeof info === 'object' && info !== null) {
            return info?.text2 || '';
          } else if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            return parsed?.text2 || '';
          }
          return '';
        } catch (error) {
          return '';
        }
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};

          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }

          parsedInfo.text2 = newValue;
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting text2:', error);
          return false;
        }
      },
    },
    {
      field: 'text3',
      headerName: columnConfig?.text3?.displayName || 'Text Field 3',
      width: 150,
      editable: finalHasAccess,
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          if (typeof info === 'object' && info !== null) {
            return info?.text3 || '';
          } else if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            return parsed?.text3 || '';
          }
          return '';
        } catch (error) {
          return '';
        }
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};

          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }

          parsedInfo.text3 = newValue;
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting text3:', error);
          return false;
        }
      },
    },
    {
      field: 'text4',
      headerName: columnConfig?.text4?.displayName || 'Text Field 4',
      width: 150,
      editable: finalHasAccess,
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          if (typeof info === 'object' && info !== null) {
            return info?.text4 || '';
          } else if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            return parsed?.text4 || '';
          }
          return '';
        } catch (error) {
          return '';
        }
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};

          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }

          parsedInfo.text4 = newValue;
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting text4:', error);
          return false;
        }
      },
    },
    {
      field: 'text5',
      headerName: columnConfig?.text5?.displayName || 'Text Field 5',
      width: 150,
      editable: finalHasAccess,
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          if (typeof info === 'object' && info !== null) {
            return info?.text5 || '';
          } else if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            return parsed?.text5 || '';
          }
          return '';
        } catch (error) {
          return '';
        }
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};

          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }

          parsedInfo.text5 = newValue;
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting text5:', error);
          return false;
        }
      },
    },
    {
      field: 'text6',
      headerName: columnConfig?.text6?.displayName || 'Text Field 6',
      width: 150,
      editable: finalHasAccess,
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          if (typeof info === 'object' && info !== null) {
            return info?.text6 || '';
          } else if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            return parsed?.text6 || '';
          }
          return '';
        } catch (error) {
          return '';
        }
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};

          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }

          parsedInfo.text6 = newValue;
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting text6:', error);
          return false;
        }
      },
    },
    {
      field: 'text7',
      headerName: columnConfig?.text7?.displayName || 'Text Field 7',
      width: 150,
      editable: finalHasAccess,
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          if (typeof info === 'object' && info !== null) {
            return info?.text7 || '';
          } else if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            return parsed?.text7 || '';
          }
          return '';
        } catch (error) {
          return '';
        }
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};

          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }

          parsedInfo.text7 = newValue;
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting text7:', error);
          return false;
        }
      },
    },
    {
      field: 'text8',
      headerName: columnConfig?.text8?.displayName || 'Text Field 8',
      width: 150,
      editable: finalHasAccess,
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          if (typeof info === 'object' && info !== null) {
            return info?.text8 || '';
          } else if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            return parsed?.text8 || '';
          }
          return '';
        } catch (error) {
          return '';
        }
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};

          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }

          parsedInfo.text8 = newValue;
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting text8:', error);
          return false;
        }
      },
    },
    {
      field: 'text9',
      headerName: columnConfig?.text9?.displayName || 'Text Field 9',
      width: 150,
      editable: finalHasAccess,
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          if (typeof info === 'object' && info !== null) {
            return info?.text9 || '';
          } else if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            return parsed?.text9 || '';
          }
          return '';
        } catch (error) {
          return '';
        }
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};

          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }

          parsedInfo.text9 = newValue;
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting text9:', error);
          return false;
        }
      },
    },
    {
      field: 'text10',
      headerName: columnConfig?.text10?.displayName || 'Text Field 10',
      width: 150,
      editable: finalHasAccess,
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          if (typeof info === 'object' && info !== null) {
            return info?.text10 || '';
          } else if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            return parsed?.text10 || '';
          }
          return '';
        } catch (error) {
          return '';
        }
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};

          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }

          parsedInfo.text10 = newValue;
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting text10:', error);
          return false;
        }
      },
    },

    // Date columns
    {
      field: 'date1',
      headerName: columnConfig?.date1?.displayName || 'Date Field 1',
      width: 150,
      editable: finalHasAccess,
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          if (typeof info === 'object' && info !== null) {
            return info?.date1 || '';
          } else if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            return parsed?.date1 || '';
          }
          return '';
        } catch (error) {
          return '';
        }
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};

          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }

          parsedInfo.date1 = newValue;
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting date1:', error);
          return false;
        }
      },
      cellRenderer: (params) => {
        const value = params.value;
        if (!value) return '';

        try {
          const date = new Date(value);
          return date.toLocaleDateString('vi-VN');
        } catch (error) {
          return value;
        }
      },
      cellEditor: 'agDateCellEditor',
      cellEditorParams: {
        format: 'yyyy-mm-dd',
        min: '1900-01-01',
        max: '2100-12-31'
      },
    },
    {
      field: 'date2',
      headerName: columnConfig?.date2?.displayName || 'Date Field 2',
      width: 150,
      editable: finalHasAccess,
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          if (typeof info === 'object' && info !== null) {
            return info?.date2 || '';
          } else if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            return parsed?.date2 || '';
          }
          return '';
        } catch (error) {
          return '';
        }
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};

          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }

          parsedInfo.date2 = newValue;
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting date2:', error);
          return false;
        }
      },
      cellRenderer: (params) => {
        const value = params.value;
        if (!value) return '';

        try {
          const date = new Date(value);
          return date.toLocaleDateString('vi-VN');
        } catch (error) {
          return value;
        }
      },
      cellEditor: 'agDateCellEditor',
      cellEditorParams: {
        format: 'yyyy-mm-dd',
        min: '1900-01-01',
        max: '2100-12-31'
      },
    },
    {
      field: 'date3',
      headerName: columnConfig?.date3?.displayName || 'Date Field 3',
      width: 150,
      editable: finalHasAccess,
      ...filter(),
      valueGetter: (params) => {
        try {
          const info = params.data.info;
          if (typeof info === 'object' && info !== null) {
            return info?.date3 || '';
          } else if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            return parsed?.date3 || '';
          }
          return '';
        } catch (error) {
          return '';
        }
      },
      valueSetter: (params) => {
        try {
          const newValue = params.newValue;
          const currentInfo = params.data.info;
          let parsedInfo = {};

          if (typeof currentInfo === 'string') {
            parsedInfo = JSON.parse(currentInfo);
          } else if (typeof currentInfo === 'object' && currentInfo !== null) {
            parsedInfo = { ...currentInfo };
          }

          parsedInfo.date3 = newValue;
          params.data.info = parsedInfo;
          return true;
        } catch (error) {
          console.error('Error setting date3:', error);
          return false;
        }
      },
      cellRenderer: (params) => {
        const value = params.value;
        if (!value) return '';

        try {
          const date = new Date(value);
          return date.toLocaleDateString('vi-VN');
        } catch (error) {
          return value;
        }
      },
      cellEditor: 'agDateCellEditor',
      cellEditorParams: {
        format: 'yyyy-mm-dd',
        min: '1900-01-01',
        max: '2100-12-31'
      },
    },

    {
      field: 'total_spent',
      headerName: 'Total Spent',
      width: 150,
      filter: 'agNumberColumnFilter',
      editable: finalHasAccess,
      cellRenderer: (params) => `$${params.value?.toLocaleString() || 0}`,
      cellClass: 'text-right',
      ...filter(),
    },
    {
      field: 'last_contact',
      editable: false,

      headerName: 'Last Contact',
      width: 150,
      ...filter(),
      cellRenderer: (params) => {
        const emailHistory = params.data.emailHistory;
        if (!emailHistory || !Array.isArray(emailHistory) || emailHistory.length === 0) {
          return <span className="text-muted">Chưa gửi</span>;
        }

        // Lấy email gần nhất dựa vào email_date
        const latestEmail = emailHistory.reduce((latest, current) => {
          const latestDate = new Date(latest.email_date);
          const currentDate = new Date(current.email_date);
          return currentDate > latestDate ? current : latest;
        });

        if (latestEmail.email_date) {
          const date = new Date(latestEmail.email_date);
          return <span>{date.toLocaleDateString('vi-VN')}</span>;
        }

        return <span className="text-muted">Chưa gửi</span>;
      },
    },


    {
      field: 'care_script',
      headerName: 'Kịch bản chăm sóc',
      width: 350,
      editable: false,
      cellStyle: { cursor: 'pointer' },
      ...filter(),

      cellRenderer: (params) => {
        const careScripts = params.data.care_script || [];
        if (!Array.isArray(careScripts) || careScripts.length === 0) {
          return '';
        }

        // Map id -> latest name từ scriptOptions
        const idToName = new Map((scriptOptions || []).map(s => [s.id, s.name]));
        const nameSet = new Set((scriptOptions || []).map(s => s.name));

        const items = careScripts.map(item => {
          if (typeof item === 'object' && item !== null) {
            const mappedName = idToName.get(item.emailSchedulerScript_id);
            const displayName = mappedName || item.script_name || item.script_short_name || '';
            const isValid = mappedName ? true : (item.emailSchedulerScript_id ? idToName.has(item.emailSchedulerScript_id) : nameSet.has(displayName));
            return { name: displayName, isValid };
          }
          if (typeof item === 'string') {
            return { name: item, isValid: nameSet.has(item) };
          }
          return { name: '', isValid: false };
        }).filter(x => x.name);

        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
            {items.map((it, index) => (
              <span
                key={index}
                style={{
                  color: it.isValid ? '#10b981' : '#ff4d4f',
                  backgroundColor: it.isValid ? '#f0fdf4' : '#fff2f0',
                  fontWeight: 'bold',
                  padding: '1px 4px',
                  borderRadius: '2px',
                  fontSize: '12px'
                }}
                title={it.name}
              >
                {it.name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      field: 'script_status',
      headerName: 'Trạng thái Kịch bản',
      width: 200,
      editable: false,
      cellStyle: { cursor: 'pointer' },
      ...filter(),
      valueGetter: (params) => {
        return params.data.script_status ? 'Đang chạy' : 'Tạm dừng';
      },
      cellRenderer: (params) => {
        const isActive = params.data.script_status;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              style={{
                backgroundColor: isActive ? '#10b981' : '#6b7280',
                color: 'white',
                padding: '12px 8px',
                borderRadius: '1px',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              {isActive ? '🟢 Đang chạy' : '⏸️ Tạm dừng'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleScriptStatus(params.data);
              }}
              style={{
                background: isActive ? '#fee2e2' : '#f0fdf4',
                border: isActive ? '1px solid #fecaca' : '1px solid #bbf7d0',
                color: isActive ? '#dc2626' : '#16a34a',
                padding: '12px 8px',
                borderRadius: '1px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              title={isActive ? 'Tạm dừng kịch bản' : 'Kích hoạt kịch bản'}
            >
              {isActive ? '⏸️ Tạm dừng' : '▶️ Kích hoạt'}
            </button>
          </div>
        );
      },
    },
    {
      field: 'careEventStatus',
      headerName: 'Care Event Status',
      editable: false,
      width: 150,
      ...filter(),
      cellRenderer: (params) => {
        const careEventHistory = params.data.careEventHistory || [];
        const careEventStatus = getCareEventStatus(careEventHistory);

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: careEventStatus.color,
                flexShrink: 0
              }}
            />
            <span style={{
              fontSize: '12px',
              color: careEventStatus.color,
              fontWeight: '500'
            }}>
              {careEventStatus.text}
            </span>
          </div>
        );
      },
    },
    {
      field: 'careEventHistory',
      headerName: 'Care Event History',
      editable: false,
      width: 200,
      ...filter(),
      cellRenderer: (params) => {
        const customerCareEvents = params.data.careEventHistory || [];

        return (
          <div className={styles.eventContainer}>
            {customerCareEvents.length === 0 ? (
              <span className={styles.noHistory}>No events</span>
            ) : (
              <>
                {customerCareEvents.slice(0, 3).map((event, index) => {
                  // Hiển thị tiêu đề thay vì thời gian
                  const eventTitle = event.title || 'Event';
                  const daysFromToday = getDaysFromToday(event.created_at);

                  return (
                    <div
                      key={event.id || index}
                      className={styles.eventItem}
                      title={`${event.title} - ${event.created_at}`}
                      onClick={() => handleCareEventItemClick(event)}
                    >
                      <Calendar size={12} style={{ color: '#10b981' }} />
                      <span className={styles.eventTime}>{eventTitle}</span>
                      {daysFromToday && (
                        <span style={{
                          fontSize: '10px',
                          color: '#666',
                          marginLeft: '4px',
                          backgroundColor: '#f0f0f0',
                          padding: '1px 4px',
                          borderRadius: '2px'
                        }}>
                          {daysFromToday}
                        </span>
                      )}
                    </div>
                  );
                })}
                {customerCareEvents.length > 3 && (
                  <span className={styles.moreHistory}>+{customerCareEvents.length - 3} more</span>
                )}
              </>
            )}
          </div>
        );
      },
    },
    {
      field: 'emailStatus',
      headerName: 'Email Status',
      editable: false,
      width: 150,
      ...filter(),
      cellRenderer: (params) => {
        const emailHistory = params.data.emailHistory || [];
        const emailStatus = getEmailStatus(emailHistory);

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: emailStatus.color,
                flexShrink: 0
              }}
            />
            <span style={{
              fontSize: '12px',
              color: emailStatus.color,
              fontWeight: '500'
            }}>
              {emailStatus.text}
            </span>
          </div>
        );
      },
    },
    {
      field: 'emailHistory',
      headerName: 'Email History',
      editable: false,
      width: 550,
      ...filter(),
      cellRenderer: (params) => {
        const emailHistory = params.data.emailHistory || [];

        return (
          <div className={styles.historyContainer}>
            {emailHistory.length === 0 ? (
              <span className={styles.noHistory}>No emails</span>
            ) : (
              <>
                {emailHistory.slice(0, 5).map((email, index) => {
                  // Map template_id để lấy thông tin template
                  const templateId = email.template_id || email.templateId;
                  const template = emailTemplates.find(t => t.id == templateId);

                  // Ưu tiên: template.short_name > email.short_name > email.template_short_name > subject
                  const shortName = template?.short_name ||
                    email.short_name ||
                    email.template_short_name ||
                    template?.name ||
                    email.subject?.substring(0, 10) + '...' ||
                    'Email';

                  const daysFromToday = getDaysFromToday(email.email_date);

                  return (
                    <div
                      key={email.id || index}
                      className={styles.historyItem}
                      title={`${email.subject} - ${email.email_date}${template ? ` (Template: ${template.name})` : ''}`}
                      onClick={() => handleEmailItemClick(email)}
                    >
                      <Mail size={10} />
                      <span>{shortName}</span>
                      {daysFromToday && (
                        <span style={{
                          fontSize: '10px',
                          color: '#666',
                          marginLeft: '4px',
                          backgroundColor: '#f0f0f0',
                          padding: '1px 4px',
                          borderRadius: '2px'
                        }}>
                          {daysFromToday}
                        </span>
                      )}
                    </div>
                  );
                })}
                {emailHistory.length > 5 && (
                  <span className={styles.moreHistory}>+{emailHistory.length - 5} more</span>
                )}
              </>
            )}
          </div>
        );
      },
    },
  ];

  // Handle selection change - đơn giản hóa
  const onSelectionChanged = useCallback(() => {
    if (!gridRef.current?.api) return;

    // Lấy tất cả dữ liệu đã chọn, không chỉ những gì đang render
    const selectedData = gridRef.current.api
      .getSelectedNodes()
      .map(node => ({
        id: node.data.id,
        email: node.data.email
      }));

    setSelectedRows(selectedData);

    // Notify parent component about selection change (only IDs for backward compatibility)
    if (onSelectionChange) {
      onSelectionChange(selectedData);
    }
  }, [onSelectionChange]);

  // Handle select all - đơn giản hóa
  const handleSelectAll = useCallback(() => {
    if (!gridRef.current?.api) return;
    const visibleData = filteredCustomers.map(c => ({ id: c.id, email: c.email }));
    const visibleIds = visibleData.map(item => item.id);
    const selectedIds = selectedRows.map(item => item.id);
    const allVisibleSelected = visibleIds.every(id => selectedIds.includes(id));

    if (allVisibleSelected && visibleIds.length > 0) {
      // Deselect all visible rows
      const newSelectedData = selectedRows.filter(item => !visibleIds.includes(item.id));
      setSelectedRows(newSelectedData);
      gridRef.current.api.deselectAll();
    } else {
      // Select all visible rows
      const newSelectedData = [...selectedRows];
      visibleData.forEach(item => {
        if (!selectedIds.includes(item.id)) {
          newSelectedData.push(item);
        }
      });
      setSelectedRows(newSelectedData);
      gridRef.current.api.selectAll();
    }
  }, [selectedRows, filteredCustomers]);

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

    // Clear error rows when user makes changes
    if (errorRows.size > 0) {
      setErrorRows(new Set());
    }
  }, [errorRows]);

  // Handle bulk create
  const handleBulkCreate = async () => {
    if (bulkCount <= 0) {
      message.warning('Số lượng khách hàng phải lớn hơn 0!');
      return;
    }

    try {
      // Tạo mảng customers dựa trên bulkCount
      const newCustomers = [];
      for (let i = 0; i < bulkCount; i++) {
        newCustomers.push({
          created_at: createTimestamp(),
          user_create: currentUser.email,
          customerItem_id: id,
        });
      }

      const response = await createBulkCustomers(newCustomers);
      const createdItems = Array.isArray(response) ? response : (response?.data || []);
      if (createdItems.length) {
        createdItems.sort((a, b) => b.id - a.id);
        const newData = [...createdItems, ...customers];
        console.log(newData);
        setCustomers(newData);
      }
      message.success(`Tạo thành công ${createdItems.length || bulkCount} khách hàng!`);
      setShowBulkModal(false);
      setBulkCount(1);
    } catch (error) {
      console.error('Error creating bulk customers:', error);
      message.error('Lỗi khi tạo khách hàng!');
    }
  };

  // Handle bulk update
  const handleBulkUpdate = async () => {
    if (updatedData.length === 0) {
      message.warning('Không có thay đổi nào để lưu!');
      return;
    }

    try {
      const response = await updateBulkCustomers(updatedData);

      // Xử lý response từ backend
      if (response.success) {
        // Thành công - cập nhật local state
        setCustomers(prev => prev.map(item => {
          const found = updatedData.find(u => u.id === item.id);
          return found ? { ...item, ...found } : item;
        }));
        message.success(response.message);
        setUpdatedData([]);
        setHasChanges(false);
        setErrorRows(new Set()); // Clear error rows
      } else {
        // Có lỗi validation hoặc update
        if (response.type === 'validation_error') {
          // Highlight các dòng bị lỗi - sử dụng ID thay vì index
          const errorIds = new Set();
          response.errors.forEach(error => {
            error.indexes.forEach(index => {
              // Lấy ID từ updatedData theo index
              if (updatedData[index]) {
                errorIds.add(updatedData[index].id);
              }
            });
          });

          // Set error rows để highlight
          setErrorRows(errorIds);

          // Thông báo lỗi chi tiết
          const errorMessages = response.errors.map(error => error.message).join('; ');
          message.error(`Có ${response.totalErrors} lỗi validation: ${errorMessages}`);

        } else if (response.type === 'update_error') {
          // Lỗi trong quá trình update
          const errorMessages = response.errors.map(error => error.message).join('; ');
          message.error(`Có lỗi khi cập nhật: ${errorMessages}`);

        } else {
          // Lỗi hệ thống
          message.error(response.message);
        }

        // Không clear updatedData khi có lỗi để user có thể sửa và thử lại
      }
    } catch (error) {
      console.error('Error updating bulk customers:', error);
      message.error('Lỗi khi cập nhật khách hàng!');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) {
      message.warning('Vui lòng chọn khách hàng cần xóa!');
      return;
    }
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      const selectedIds = selectedRows.map(item => item.id);
      await deleteCustomer(selectedIds);

      // Remove deleted items from local data
      const newData = customers.filter(item => !selectedIds.includes(item.id));
      setCustomers(newData);

      // Clear selection
      setSelectedRows([]);
      gridRef.current?.api.deselectAll();

      message.success(`Xóa thành công ${selectedRows.length} khách hàng!`);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting customers:', error);
      message.error('Lỗi khi xóa khách hàng!');
    } finally {
      setDeleting(false);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Helper function to format date for export
  const formatDateForExport = (dateValue) => {
    if (!dateValue) return '';

    try {
      // Nếu đã là format YYYY-MM-DD thì giữ nguyên
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }

      // Thử parse và format lại
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        // Sử dụng local date để tránh timezone offset
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      return dateValue; // Fallback to original value
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateValue;
    }
  };

  // Function to calculate days difference from today
  const getDaysFromToday = (dateString) => {
    if (!dateString) return '';

    try {
      const emailDate = new Date(dateString);
      const today = new Date();

      // Reset time to start of day for accurate day comparison
      today.setHours(0, 0, 0, 0);
      emailDate.setHours(0, 0, 0, 0);

      // Calculate difference in days (always negative for past emails)
      const diffTime = today.getTime() - emailDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return '0';
      if (diffDays === 1) return '-1 d';
      if (diffDays > 0) return `-${diffDays} d`;

      return '';
    } catch (error) {
      console.error('Error calculating days from today:', error);
      return '';
    }
  };

  // Function to get email status based on last email date
  const getEmailStatus = (emailHistory) => {
    if (!emailHistory || emailHistory.length === 0) {
      return {
        status: 'no-email',
        color: '#ff4d4f',
        text: 'Chưa gửi email',
        days: null
      };
    }

    // Get the most recent email
    const sortedEmails = emailHistory.sort((a, b) => new Date(b.email_date) - new Date(a.email_date));
    const lastEmail = sortedEmails[0];
    const daysFromToday = getDaysFromToday(lastEmail.email_date);

    // Parse days from the result
    let days = 0;
    if (daysFromToday === '0') {
      days = 0;
    } else if (daysFromToday === '-1 d') {
      days = 1;
    } else if (daysFromToday && daysFromToday.includes('-') && daysFromToday.includes(' d')) {
      days = parseInt(daysFromToday.replace('-', '').replace(' d', ''));
    }

    if (days <= 10) {
      return {
        status: 'good',
        color: '#52c41a',
        text: `${days === 0 ? 'Hôm nay' : days === 1 ? 'Hôm qua' : `${days} ngày trước`}`,
        days: days
      };
    } else if (days <= 20) {
      return {
        status: 'warning',
        color: '#faad14',
        text: `${days} ngày trước`,
        days: days
      };
    } else {
      return {
        status: 'danger',
        color: '#ff4d4f',
        text: `${days} ngày trước`,
        days: days
      };
    }
  };

  // Function to get care event status based on last care event date
  const getCareEventStatus = (careEventHistory) => {
    if (!careEventHistory || careEventHistory.length === 0) {
      return {
        status: 'no-event',
        color: '#ff4d4f',
        text: 'Chưa có sự kiện',
        days: null
      };
    }

    // Get the most recent care event
    const sortedEvents = careEventHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const lastEvent = sortedEvents[0];
    const daysFromToday = getDaysFromToday(lastEvent.created_at);

    // Parse days from the result
    let days = 0;
    if (daysFromToday === '0') {
      days = 0;
    } else if (daysFromToday === '-1 d') {
      days = 1;
    } else if (daysFromToday && daysFromToday.includes('-') && daysFromToday.includes(' d')) {
      days = parseInt(daysFromToday.replace('-', '').replace(' d', ''));
    }

    if (days <= 10) {
      return {
        status: 'good',
        color: '#52c41a',
        text: `${days === 0 ? 'Hôm nay' : days === 1 ? 'Hôm qua' : `${days} ngày trước`}`,
        days: days
      };
    } else if (days <= 20) {
      return {
        status: 'warning',
        color: '#faad14',
        text: `${days} ngày trước`,
        days: days
      };
    } else {
      return {
        status: 'danger',
        color: '#ff4d4f',
        text: `${days} ngày trước`,
        days: days
      };
    }
  };

  // Export data to Excel
  const handleExportToExcel = () => {
    try {
      // Chuẩn bị dữ liệu để export
      const exportData = filteredCustomers.map(customer => {
        // Lấy thông tin từ info field và care_script từ trường riêng biệt
        let group1 = '', group2 = '', group3 = '', group4 = '', group5 = '', group6 = '', group7 = '', group8 = '', group9 = '', group10 = '', care_script = '';
        let text1 = '', text2 = '', text3 = '', text4 = '', text5 = '';
        let text6 = '', text7 = '', text8 = '', text9 = '', text10 = '';
        let date1 = '', date2 = '', date3 = '';
        try {
          const info = customer.info;
          if (typeof info === 'object' && info !== null) {
            group1 = Array.isArray(info.group1) ? info.group1.join(', ') : (info.group1 || '');
            group2 = Array.isArray(info.group2) ? info.group2.join(', ') : (info.group2 || '');
            group3 = Array.isArray(info.group3) ? info.group3.join(', ') : (info.group3 || '');
            group4 = Array.isArray(info.group4) ? info.group4.join(', ') : (info.group4 || '');
            group5 = Array.isArray(info.group5) ? info.group5.join(', ') : (info.group5 || '');
            group6 = Array.isArray(info.group6) ? info.group6.join(', ') : (info.group6 || '');
            group7 = Array.isArray(info.group7) ? info.group7.join(', ') : (info.group7 || '');
            group8 = Array.isArray(info.group8) ? info.group8.join(', ') : (info.group8 || '');
            group9 = Array.isArray(info.group9) ? info.group9.join(', ') : (info.group9 || '');
            group10 = Array.isArray(info.group10) ? info.group10.join(', ') : (info.group10 || '');
            // Sử dụng trường care_script riêng biệt và lấy tên scripts
            const careScripts = customer.care_script || [];
            care_script = careScripts.map(script =>
              script.script_name || script.script_short_name || script
            ).join(', ');
            text1 = info.text1 || '';
            text2 = info.text2 || '';
            text3 = info.text3 || '';
            text4 = info.text4 || '';
            text5 = info.text5 || '';
            text6 = info.text6 || '';
            text7 = info.text7 || '';
            text8 = info.text8 || '';
            text9 = info.text9 || '';
            text10 = info.text10 || '';
            // Format date fields consistently
            date1 = info.date1 ? formatDateForExport(info.date1) : '';
            date2 = info.date2 ? formatDateForExport(info.date2) : '';
            date3 = info.date3 ? formatDateForExport(info.date3) : '';
          } else if (typeof info === 'string') {
            const parsed = JSON.parse(info);
            group1 = Array.isArray(parsed.group1) ? parsed.group1.join(', ') : (parsed.group1 || '');
            group2 = Array.isArray(parsed.group2) ? parsed.group2.join(', ') : (parsed.group2 || '');
            group3 = Array.isArray(parsed.group3) ? parsed.group3.join(', ') : (parsed.group3 || '');
            group4 = Array.isArray(parsed.group4) ? parsed.group4.join(', ') : (parsed.group4 || '');
            group5 = Array.isArray(parsed.group5) ? parsed.group5.join(', ') : (parsed.group5 || '');
            group6 = Array.isArray(parsed.group6) ? parsed.group6.join(', ') : (parsed.group6 || '');
            group7 = Array.isArray(parsed.group7) ? parsed.group7.join(', ') : (parsed.group7 || '');
            group8 = Array.isArray(parsed.group8) ? parsed.group8.join(', ') : (parsed.group8 || '');
            group9 = Array.isArray(parsed.group9) ? parsed.group9.join(', ') : (parsed.group9 || '');
            group10 = Array.isArray(parsed.group10) ? parsed.group10.join(', ') : (parsed.group10 || '');
            // Sử dụng trường care_script riêng biệt và lấy tên scripts
            const careScripts = customer.care_script || [];
            care_script = careScripts.map(script =>
              script.script_name || script.script_short_name || script
            ).join(', ');
            text1 = parsed.text1 || '';
            text2 = parsed.text2 || '';
            text3 = parsed.text3 || '';
            text4 = parsed.text4 || '';
            text5 = parsed.text5 || '';
            text6 = parsed.text6 || '';
            text7 = parsed.text7 || '';
            text8 = parsed.text8 || '';
            text9 = parsed.text9 || '';
            text10 = parsed.text10 || '';
            // Format date fields consistently
            date1 = parsed.date1 ? formatDateForExport(parsed.date1) : '';
            date2 = parsed.date2 ? formatDateForExport(parsed.date2) : '';
            date3 = parsed.date3 ? formatDateForExport(parsed.date3) : '';
          }
        } catch (error) {
          // Ignore parsing errors
        }

        return {
          'Name': customer.name || '',
          'Email': customer.email || '',
          'Company': customer.company || '',
          'Số điện thoại': customer.phone || '',
          'Ghi chú': customer.note || '',
          'Total Spent': customer.total_spent || 0,
          'Group 1': group1,
          'Group 2': group2,
          'Group 3': group3,
          'Group 4': group4,
          'Group 5': group5,
          'Group 6': group6,
          'Group 7': group7,
          'Group 8': group8,
          'Group 9': group9,
          'Group 10': group10,
          'Text Field 1': text1,
          'Text Field 2': text2,
          'Text Field 3': text3,
          'Text Field 4': text4,
          'Text Field 5': text5,
          'Text Field 6': text6,
          'Text Field 7': text7,
          'Text Field 8': text8,
          'Text Field 9': text9,
          'Text Field 10': text10,
          'Date Field 1': date1,
          'Date Field 2': date2,
          'Date Field 3': date3,
          'Kịch bản chăm sóc': care_script,
        };
      });

      // Tạo workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Đặt độ rộng cột
      const colWidths = [
        { wch: 8 },  // ID
        { wch: 20 }, // Name
        { wch: 30 }, // Email
        { wch: 25 }, // Company
        { wch: 15 }, // Số điện thoại
        { wch: 30 }, // Ghi chú
        { wch: 15 }, // Total Spent
        { wch: 15 }, // Group 1
        { wch: 15 }, // Group 2
        { wch: 15 }, // Group 3
        { wch: 15 }, // Group 4
        { wch: 15 }, // Group 5
        { wch: 15 }, // Group 6
        { wch: 15 }, // Group 7
        { wch: 15 }, // Group 8
        { wch: 15 }, // Group 9
        { wch: 15 }, // Group 10
        { wch: 15 }, // Text Field 1
        { wch: 15 }, // Text Field 2
        { wch: 15 }, // Text Field 3
        { wch: 15 }, // Text Field 4
        { wch: 15 }, // Text Field 5
        { wch: 15 }, // Text Field 6
        { wch: 15 }, // Text Field 7
        { wch: 15 }, // Text Field 8
        { wch: 15 }, // Text Field 9
        { wch: 15 }, // Text Field 10
        { wch: 15 }, // Date Field 1
        { wch: 15 }, // Date Field 2
        { wch: 15 }, // Date Field 3
        { wch: 20 }, // Kịch bản chăm sóc
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Customer Data');

      // Xuất file
      const fileName = `Customer_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      message.success(`Đã xuất ${exportData.length} dòng dữ liệu thành công!`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      message.error('Lỗi khi xuất dữ liệu!');
    }
  };

  // Import data from Excel
  const handleImportFromExcel = async (importData) => {
    try {
      setImporting(true);

      // Lấy danh sách email hiện có trong customers
      const existingEmails = new Set(customers.map(customer => customer.email?.toLowerCase()));
      console.log('Current customerItem_id:', id);
      console.log('Existing customers:', customers.map(c => ({ id: c.id, email: c.email, customerItem_id: c.customerItem_id })));

      // Phân loại dữ liệu import
      const customersToCreate = [];
      const customersToUpdate = [];

      importData.forEach(customer => {
        const email = customer.email?.toLowerCase();
        if (existingEmails.has(email)) {
          // Email đã tồn tại → cập nhật
          const existingCustomer = customers.find(c => c.email?.toLowerCase() === email);
          console.log('Found existing customer:', existingCustomer);
          // Chỉ gửi những trường có dữ liệu (không null/undefined/empty)
          const updateData = {
            id: existingCustomer.id,
            customerItem_id: existingCustomer.customerItem_id  // Luôn cần customerItem_id
          };

          // Chỉ cập nhật các trường khi DB trống hoặc rỗng
          if (customer.name !== null && customer.name !== undefined && customer.name.trim() !== '') {
            const currentName = existingCustomer.name || '';
            if (currentName.trim() === '') {
              updateData.name = customer.name;
            }
          }
          if (customer.email !== null && customer.email !== undefined && customer.email.trim() !== '') {
            updateData.email = customer.email; // Email luôn được cập nhật để đảm bảo tính nhất quán
          }
          if (customer.company !== null && customer.company !== undefined && customer.company.trim() !== '') {
            const currentCompany = existingCustomer.company || '';
            if (currentCompany.trim() === '') {
              updateData.company = customer.company;
            }
          }
          if (customer.phone !== null && customer.phone !== undefined && customer.phone.trim() !== '') {
            const currentPhone = existingCustomer.phone || '';
            if (currentPhone.trim() === '') {
              updateData.phone = customer.phone;
            }
          }
          if (customer.note !== null && customer.note !== undefined && customer.note.trim() !== '') {
            const currentNote = existingCustomer.note || '';
            if (currentNote.trim() === '') {
              updateData.note = customer.note;
            }
          }
          if (customer.info !== null && customer.info !== undefined) {
            // Merge info fields thông minh - ưu tiên dữ liệu trong DB
            const currentInfo = existingCustomer.info || {};
            const newInfo = { ...currentInfo }; // Giữ lại dữ liệu cũ

            // Merge từng trường một cách có chọn lọc - chỉ cập nhật khi DB trống
            Object.keys(customer.info).forEach(key => {
              const importValue = customer.info[key];
              const currentValue = currentInfo[key];

              if (importValue !== null && importValue !== undefined) {
                if (Array.isArray(importValue)) {
                  // Đối với array (group1-10): chỉ cập nhật nếu DB trống hoặc rỗng
                  if (importValue.length > 0 && (!currentValue || currentValue.length === 0)) {
                    newInfo[key] = importValue;
                  }
                } else {
                  // Đối với string (text1-10, care_script): chỉ cập nhật nếu DB trống hoặc rỗng
                  const importStr = importValue.toString().trim();
                  const currentStr = currentValue ? currentValue.toString().trim() : '';

                  if (importStr !== '' && currentStr === '') {
                    newInfo[key] = importValue;
                  }
                }
              }
            });

            // Chỉ cập nhật info nếu có thay đổi
            if (JSON.stringify(newInfo) !== JSON.stringify(currentInfo)) {
              updateData.info = newInfo;
            }
          }

          customersToUpdate.push(updateData);
        } else {
          // Email chưa tồn tại → tạo mới
          // Chỉ gửi những trường có dữ liệu (không null/undefined/empty)
          const createData = {
            created_at: createTimestamp(),
            user_create: currentUser.email,
            customerItem_id: id
          };

          // Chỉ thêm các trường có dữ liệu
          if (customer.name !== null && customer.name !== undefined && customer.name.trim() !== '') {
            createData.name = customer.name;
          }
          if (customer.email !== null && customer.email !== undefined && customer.email.trim() !== '') {
            createData.email = customer.email;
          }
          if (customer.company !== null && customer.company !== undefined && customer.company.trim() !== '') {
            createData.company = customer.company;
          }
          if (customer.phone !== null && customer.phone !== undefined && customer.phone.trim() !== '') {
            createData.phone = customer.phone;
          }
          if (customer.note !== null && customer.note !== undefined && customer.note.trim() !== '') {
            createData.note = customer.note;
          }
          if (customer.info !== null && customer.info !== undefined) {
            // Tạo info object chỉ với các trường có dữ liệu
            const newInfo = {};

            // Thêm từng trường một cách có chọn lọc
            Object.keys(customer.info).forEach(key => {
              const value = customer.info[key];
              if (value !== null && value !== undefined) {
                if (Array.isArray(value)) {
                  // Đối với array (group1, group2, group3): chỉ thêm nếu có dữ liệu
                  if (value.length > 0) {
                    newInfo[key] = value;
                  }
                } else {
                  // Đối với string (text1-10, care_script): chỉ thêm nếu không rỗng
                  if (value.toString().trim() !== '') {
                    newInfo[key] = value;
                  }
                }
              }
            });

            // Chỉ thêm info nếu có ít nhất 1 trường có dữ liệu
            if (Object.keys(newInfo).length > 0) {
              createData.info = newInfo;
            }
          }

          customersToCreate.push(createData);
        }
      });

      let newCount = 0;
      let updateCount = 0;
      let errorMessages = [];

      // Tạo mới khách hàng
      if (customersToCreate.length > 0) {
        try {
          console.log('customersToCreate:', customersToCreate);
          const createResponse = await createBulkCustomers(customersToCreate);
          console.log('createResponse:', createResponse);
          const createdItems = Array.isArray(createResponse) ? createResponse : (createResponse?.data || []);
          newCount = createdItems.length;
        } catch (error) {
          console.error('Error creating customers:', error);
          errorMessages.push(`Lỗi tạo mới: ${error.message}`);
        }
      }

      // Cập nhật khách hàng
      if (customersToUpdate.length > 0) {
        try {
          const updateResponse = await updateBulkCustomers(customersToUpdate);
          console.log('customersToUpdate:', customersToUpdate);
          console.log('updateResponse:', updateResponse);

          if (updateResponse.success) {
            updateCount = updateResponse.totalUpdated || customersToUpdate.length;
          } else {
            errorMessages.push(`Lỗi cập nhật: ${updateResponse.message}`);
          }
        } catch (error) {
          console.error('Error updating customers:', error);
          errorMessages.push(`Lỗi cập nhật: ${error.message}`);
        }
      }

      // Refresh data để lấy dữ liệu mới nhất
      if (onRefresh) {
        await onRefresh();
      }

      // Hiển thị kết quả
      if (newCount > 0 || updateCount > 0) {
        let successMessage = '';
        if (newCount > 0 && updateCount > 0) {
          successMessage = `Import thành công: ${newCount} khách hàng mới, ${updateCount} khách hàng được cập nhật!`;
        } else if (newCount > 0) {
          successMessage = `Import thành công ${newCount} khách hàng mới!`;
        } else if (updateCount > 0) {
          successMessage = `Cập nhật thành công ${updateCount} khách hàng!`;
        }

        message.success(successMessage);
        setShowImportModal(false);
      }

      // Hiển thị lỗi nếu có
      if (errorMessages.length > 0) {
        errorMessages.forEach(msg => message.error(msg));
      }

      if (newCount === 0 && updateCount === 0 && errorMessages.length === 0) {
        message.error('Không có dữ liệu nào được import!');
      }

    } catch (error) {
      console.error('Error importing from Excel:', error);
      message.error('Lỗi khi import dữ liệu!');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className={styles.tableContainer} style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
      <div className={styles.tableHeader}>
        {
          finalHasAccess && (
            <>  <div className={styles.headerTop}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h3 className={styles.tableTitle} style={{ marginRight: 8 }}>Customer Data</h3>
                {hasChanges && (
                  <>
                    <button
                      onClick={handleBulkUpdate}
                      className={styles.saveBtn}
                    >
                      <Save size={14} />
                      Lưu ({updatedData.length})
                    </button>
                    <span className={styles.unsavedNotice}>
                      Dữ liệu có thay đổi, vui lòng lưu trước khi thoát ra
                    </span>
                  </>
                )}
              </div>
              <div className={styles.headerActions}>
                <button
                  onClick={() => setShowBulkModal(true)}
                  className={styles.addBtn}
                >
                  <Plus size={14} />
                  Thêm
                </button>
                <button
                  onClick={handleExportToExcel}
                  className={styles.exportBtn}
                  title="Xuất dữ liệu ra Excel"
                >
                  <Download size={14} />
                  Export
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className={styles.importBtn}
                  title="Import dữ liệu từ Excel"
                >
                  <Upload size={14} />
                  Import
                </button>
                <button
                  onClick={handleResetColumns}
                  className={styles.resetBtn}
                  title="Khôi phục vị trí cột về mặc định"
                >
                  <Cog size={14} />
                  Reset Cột
                </button>


                {selectedRows.length > 0 && (
                  <>
                    <button
                      onClick={onToggleEmailPanel}
                      className={styles.emailBtn}
                    >
                      <Mail size={14} />
                      Email ({selectedRows.length})
                    </button>
                    <button
                      onClick={() => {
                        const selectedIds = selectedRows.map(item => item.id);
                        const selectedCustomers = customers.filter(c => selectedIds.includes(c.id));
                        if (selectedCustomers.length > 0) {
                          handleOpenCareEventModal(selectedCustomers); // Tạo event cho customer đầu tiên
                        }
                      }}
                      className={styles.careEventBtn}
                    >
                      <ClipboardList size={14} />
                      Event chăm sóc ({selectedRows.length})
                    </button>
                    <button
                      onClick={handleActivateScriptDirectly}
                      className={styles.scriptBtn}
                      title="Chạy kịch bản email ngay"
                    >
                      <Mail size={14} />
                      Chạy kịch bản ({selectedRows.length})
                    </button>
                    <button
                      onClick={() => setShowBulkScriptModal(true)}
                      className={styles.scriptBtn}
                      title="Gắn kịch bản cho nhiều khách hàng"
                      style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
                    >
                      <ClipboardList size={14} />
                      Gắn kịch bản ({selectedRows.length})
                    </button>
                    <button
                      onClick={handleClearAllScripts}
                      className={styles.deleteBtn}
                      title="Xóa tất cả kịch bản của khách hàng đã chọn"
                    >
                      <Trash2 size={14} />
                      Xóa kịch bản ({selectedRows.length})
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className={styles.deleteBtn}
                      disabled={deleting}
                    >
                      <Trash2 size={14} />
                      Xóa ({selectedRows.length})
                    </button>

                  </>
                )}
                <button
                  onClick={() => setShowScriptConfigModal(true)}
                  className={styles.configBtn}
                  title="Cấu hình kịch bản chăm sóc"
                >
                  <Cog size={14} />
                  Kịch bản
                </button>
                <button
                  onClick={() => setShowColumnConfigModal(true)}
                  className={styles.configBtn}
                  title="Cấu hình cột"
                >
                  <Cog size={14} />
                  Cột
                </button>
                <button
                  onClick={handleSelectAll}
                  className={styles.selectAllBtn}
                >
                  {(() => {
                    const visibleIds = filteredCustomers.map(c => c.id);
                    const selectedIds = selectedRows.map(item => item.id);
                    const allVisibleSelected = visibleIds.every(id => selectedIds.includes(id));
                    return allVisibleSelected && filteredCustomers.length > 0 ? 'Deselect All' : 'Select All';
                  })()}
                </button>
              </div>
            </div>
            </>
          )
        }



        {/* Search và Filters */}
        <div className={styles.filtersContainer}>
          <div className={styles.searchAndFiltersRow}>
            <div className={styles.searchAndFiltersInputs}>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, công ty, SĐT, ghi chú."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {/* <select
                value={filters.status}
                onChange={(e) => onFiltersChange('status', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select> */}
              <input
                type="text"
                placeholder="Company contains..."
                value={filters.company}
                onChange={(e) => onFiltersChange('company', e.target.value)}
                className={styles.filterInput}
              />
              <input
                type="number"
                placeholder="Min spent ($)"
                value={filters.minSpent}
                onChange={(e) => onFiltersChange('minSpent', e.target.value)}
                className={styles.filterInput}
              />
              <input
                type="number"
                placeholder="Last contact ≤ (days)"
                value={filters.lastContactDays}
                onChange={(e) => onFiltersChange('lastContactDays', e.target.value)}
                className={styles.filterInput}
              />
            </div>

            {/* Clear All Button */}
            <button
              onClick={clearAllSearchAndFilters}
              className={styles.clearAllBtn}
              disabled={
                !searchTerm &&
                !filters.status &&
                !filters.company &&
                !filters.minSpent &&
                !filters.lastContactDays &&
                Object.values(groupFilters).every(filter => filter.length === 0)
              }
              title="Xóa tất cả tìm kiếm và bộ lọc"
            >
              🗑️ Clear All
            </button>
          </div>

          {/* Group Filters */}
          <div className={styles.groupFiltersRow}>
            <span className={styles.groupFiltersTitle}> Lọc nhóm khách hàng:</span>
            {['group1', 'group2', 'group3', 'group4', 'group5', 'group6', 'group7', 'group8', 'group9', 'group10'].map((key, idx) => (
              <div className={styles.groupFilterItem} key={key}>
                <Select
                  mode="multiple"
                  placeholder={`${columnConfig?.[key]?.displayName || key}`}
                  value={groupFilters[key]}
                  onChange={(values) => handleGroupFilterChange(key, values)}
                  options={(columnConfig?.[key]?.options || []).map(option => ({ label: option, value: option }))}
                  style={{ minWidth: 215 }}
                  allowClear
                  maxTagCount="responsive"
                />
              </div>
            ))}
            <div className={styles.groupFilterItem}>
              <Select
                mode="multiple"
                placeholder="📝 Kịch bản"
                value={groupFilters.care_script}
                onChange={(values) => handleGroupFilterChange('care_script', values)}
                options={(() => {
                  const options = scriptOptions?.map(option => ({
                    label: option.name || option,
                    value: option.name || option
                  })) || [];
                  return options;
                })()}
                style={{ minWidth: 400 }}
                allowClear
                maxTagCount="responsive"
              />
            </div>
            <div className={styles.groupFilterItem}>
              <Select
                mode="multiple"
                placeholder="⚡ Trạng thái Kịch bản"
                value={groupFilters.script_status}
                onChange={(values) => handleGroupFilterChange('script_status', values)}
                options={[
                  { label: '🟢 Đang chạy', value: 'Đang chạy' },
                  { label: '⏸️ Tạm dừng', value: 'Tạm dừng' }
                ]}
                style={{ minWidth: 200 }}
                allowClear
                maxTagCount="responsive"
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper} style={{ flex: 1, minHeight: 0 }}>
        <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
          <AgGridReact
            key={`grid-${customers.length}`}
            ref={gridRef}
            rowData={filteredCustomers}
            columnDefs={colDefs}
            defaultColDef={defaultColDef}
            statusBar={statusBar}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            onSelectionChanged={onSelectionChanged}
            onCellValueChanged={handleCellValueChanged}
            onCellClicked={handleCellClick}
            enableRangeSelection={true}
            animateRows={true}
            pagination={true}
            paginationPageSize={10000}
            paginationPageSizeSelector={[10000, 20000, 50000, 100000]}
            suppressLoadingOverlay={true}
            suppressNoRowsOverlay={true}
            getRowStyle={(params) => {
              // Highlight rows with errors - so sánh theo ID thay vì rowIndex
              if (errorRows.has(params.data.id)) {
                return { backgroundColor: '#ffebee' };
              }
              return null;
            }}
            onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
            onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
          />
        </div>
      </div>

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className={styles.bulkModal}>
          <div className={styles.bulkModalContent}>
            <h3 className={styles.bulkModalTitle}>Tạo Khách Hàng Hàng Loạt</h3>
            <div className={styles.bulkModalBody}>
              <div className={styles.bulkInputSection}>
                <label className={styles.label}>Số lượng khách hàng cần tạo:</label>
                <div className={styles.bulkInputRow}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={bulkCount}
                    onChange={(e) => setBulkCount(parseInt(e.target.value) || 0)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleBulkCreate();
                      }
                    }}
                    className={styles.bulkInput}
                  />
                </div>
              </div>

              <p className={styles.bulkNote}>
                Sẽ tạo {bulkCount} khách hàng mới với thông tin mặc định
              </p>
            </div>
            <div className={styles.bulkModalActions}>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkCount(1);
                }}
                className={styles.cancelBtn}
              >
                Hủy
              </button>
              <button
                onClick={handleBulkCreate}
                className={styles.confirmBtn}
                disabled={bulkCount <= 0}
              >
                Tạo {bulkCount} Khách Hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email History Modal/Expansion */}
      {Object.keys(showEmailHistory).map(customerId => {
        if (showEmailHistory[customerId]) {
          const customerIdNum = parseInt(customerId);
          const customer = customers.find(c => c.id === customerIdNum);
          console.log('customer', customer);
          const customerEmailHistory = customer?.emailHistory || [];
          const customerCareEventHistory = customer?.careEventHistory || [];

          return (
            <div key={customerId} className={styles.emailHistoryModal}>
              <div className={styles.emailHistoryContent}>
                <h4 className={styles.emailHistoryTitle}>Customer Details - {customer?.name || 'Unknown'}</h4>

                {/* Customer Info Section */}
                <div className={styles.customerInfoSection}>
                  <div className={styles.customerInfoRow}>
                    <span className={styles.customerInfoLabel}>Email:</span>
                    <span className={styles.customerInfoValue}>{customer?.email || 'N/A'}</span>
                  </div>
                  <div className={styles.customerInfoRow}>
                    <span className={styles.customerInfoLabel}>Company:</span>
                    <span className={styles.customerInfoValue}>{customer?.company || 'N/A'}</span>
                  </div>
                  <div className={styles.customerInfoRow}>
                    <span className={styles.customerInfoLabel}>Status:</span>
                    <span className={styles.customerInfoValue}>{customer?.status || 'N/A'}</span>
                  </div>
                </div>

                {/* Transactions Section */}
                {/* <div className={styles.transactionsSection}>
                  <h5 className={styles.sectionTitle}>Transactions</h5>
                  {customer?.transactions && customer.transactions.length > 0 ? (
                    <div className={styles.transactionsList}>
                      <div className={styles.transactionSummary}>
                        <span className={styles.transactionCount}>
                          Total: {customer.transactions.length} giao dịch
                        </span>
                        <span className={styles.transactionAmount}>
                          ${customer.transactions.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}
                        </span>
                      </div>
                      <div className={styles.transactionItems}>
                        {customer.transactions.map(transaction => (
                          <div key={transaction.id} className={styles.transactionItem}>
                            <div className={styles.transactionDate}>
                              {new Date(transaction.transactionCRM_date).toLocaleDateString('vi-VN')}
                            </div>
                            <div className={styles.transactionDetails}>
                              <span className={styles.transactionDescription}>
                                {transaction.description}
                              </span>
                              <span className={styles.transactionType}>
                                {transaction.type}
                              </span>
                            </div>
                            <div className={styles.transactionAmount}>
                              ${transaction.amount?.toLocaleString() || 0}
                            </div>
                            <div className={styles.transactionStatus}>
                              {transaction.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className={styles.noTransactions}>No transactions found</p>
                  )}
                </div> */}

                {/* Email History Section */}
                <div className={styles.emailHistorySection}>
                  <h5 className={styles.sectionTitle}>Email History</h5>
                  {customerEmailHistory.length === 0 ? (
                    <p className={styles.noHistory}>No email history</p>
                  ) : (
                    <div className={styles.emailHistoryList}>
                      {customerEmailHistory.map(email => {
                        // Map template_id để lấy thông tin template
                        const templateId = email.template_id;
                        const template = emailTemplates.find(t => t.id == templateId);

                        const displayEmail = template?.name || email.short_name || email.subject;
                        const daysFromToday = getDaysFromToday(email.email_date);

                        return (
                          <div
                            key={email.id}
                            className={styles.emailHistoryItem}
                            onClick={() => handleEmailItemClick(email)}
                          >
                            <span>{displayEmail} - {email.email_date}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {daysFromToday && (
                                <span style={{
                                  fontSize: '11px',
                                  color: '#666',
                                  backgroundColor: '#f0f0f0',
                                  padding: '2px 6px',
                                  borderRadius: '3px'
                                }}>
                                  {daysFromToday}
                                </span>
                              )}
                              <span className={styles.emailStatus}>
                                {email.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Care Event History Section */}
                <div className={styles.emailHistorySection}>
                  <h5 className={styles.sectionTitle}>Care Event History</h5>
                  {customerCareEventHistory.length > 0 ? (
                    <div className={styles.emailHistoryList}>
                      {customerCareEventHistory.map(event => {
                        const daysFromToday = getDaysFromToday(event.created_at);

                        return (
                          <div
                            key={event.id}
                            className={styles.emailHistoryItem}
                            onClick={() => handleCareEventItemClick(event)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Calendar size={14} style={{ color: '#10b981' }} />
                              <span style={{ fontWeight: '500' }}>{event.title}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                                {daysFromToday && (
                                  <span style={{
                                    fontSize: '11px',
                                    color: '#666',
                                    backgroundColor: '#f0f0f0',
                                    padding: '2px 6px',
                                    borderRadius: '3px'
                                  }}>
                                    {daysFromToday}
                                  </span>
                                )}
                                <span style={{
                                  fontSize: '12px',
                                  color: '#6b7280'
                                }}>
                                  {new Date(event.created_at).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              marginTop: '4px'
                            }}>
                              {event.event_type === 'call' && 'Gọi điện'}
                              {event.event_type === 'zalo' && 'Zalo'}
                              {event.event_type === 'meeting' && 'Gặp mặt'}
                              {event.event_type === 'email' && 'Email'}
                              {event.event_type === 'other' && 'Khác'}
                              {event.user_create === currentUser.email && (
                                <span style={{ color: '#059669', marginLeft: '8px' }}>(Bạn)</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className={styles.noHistory}>No care event history</p>
                  )}
                </div>

                <button
                  onClick={() => onToggleEmailHistory && onToggleEmailHistory(customerIdNum)}
                  className={styles.closeBtn}
                >
                  Close
                </button>
              </div>
            </div>
          );
        }
        return null;
      })}

      {/* Email Detail Modal */}
      {showEmailDetailModal && selectedEmail && (
        <div className={styles.emailDetailModal}>
          <div className={styles.emailDetailContent}>
            <div className={styles.emailDetailHeader}>
              <h3 className={styles.emailDetailTitle}>Email Details</h3>
              <button
                onClick={() => {
                  setShowEmailDetailModal(false);
                  setSelectedEmail(null);
                }}
                className={styles.closeBtn}
              >
                ×
              </button>
            </div>

            <div className={styles.emailDetailBody}>
              <div className={styles.emailDetailField}>
                <label className={styles.emailDetailLabel}>Subject:</label>
                <span className={styles.emailDetailValue}>{selectedEmail.subject}</span>
              </div>

              <div className={styles.emailDetailField}>
                <label className={styles.emailDetailLabel}>Date:</label>
                <span className={styles.emailDetailValue}>{selectedEmail.email_date}</span>
              </div>

              <div className={styles.emailDetailField}>
                <label className={styles.emailDetailLabel}>Status:</label>
                <span className={`${styles.emailDetailValue} ${styles.emailStatus} ${styles[`status${selectedEmail.status?.charAt(0).toUpperCase() + selectedEmail.status?.slice(1)}`]}`}>
                  {selectedEmail.status}
                </span>
              </div>

              {selectedEmail.recipient && (
                <div className={styles.emailDetailField}>
                  <label className={styles.emailDetailLabel}>Recipient:</label>
                  <span className={styles.emailDetailValue}>{selectedEmail.recipient}</span>
                </div>
              )}

              {selectedEmail.content && (
                <div className={styles.emailDetailField}>
                  <label className={styles.emailDetailLabel}>Content:</label>
                  <div className={styles.emailContent}>
                    {selectedEmail.content}
                  </div>
                </div>
              )}

              {selectedEmail.template_id && (
                <div className={styles.emailDetailField}>
                  <label className={styles.emailDetailLabel}>Template:</label>
                  <span className={styles.emailDetailValue}>
                    {(() => {
                      const templateId = selectedEmail.template_id || selectedEmail.templateId;
                      const template = emailTemplates.find(t => t.id === templateId);
                      return template ? `${template.name} (ID: ${templateId})` : `ID: ${templateId}`;
                    })()}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.emailDetailFooter}>
              <button
                onClick={() => {
                  setShowEmailDetailModal(false);
                  setSelectedEmail(null);
                }}
                className={styles.cancelBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Care Event Modal */}
      <CareEventModal
        open={showCareEventModal}
        onCancel={() => {
          setShowCareEventModal(false);
          setSelectedCustomerForCare(null);
          setCareEventForm({ title: '', content: '', event_type: 'call' });
        }}
        careEventForm={careEventForm}
        onFormChange={handleCareEventFormChange}
        onSave={handleCreateCareEvent}
        creatingCareEvent={creatingCareEvent}
        onSaveContent={handleSaveContent}
        showEditor={setShowEditor}
      />


      {/* Care Event Detail Modal */}
      <CareEventDetailModal
        open={showCareEventDetail}
        onCancel={() => {
          setShowCareEventDetail(false);
          setSelectedCareEvent(null);
          setIsEditingCareEvent(false);
          setCareEventForm({ title: '', content: '', event_type: 'call' });
        }}
        selectedCareEvent={selectedCareEvent}
        isEditingCareEvent={isEditingCareEvent}
        careEventForm={careEventForm}
        onFormChange={handleCareEventFormChange}
        onUpdate={handleUpdateCareEvent}
        onDelete={handleDeleteCareEvent}
        onOpenEdit={handleOpenEditCareEvent}
        updatingCareEvent={updatingCareEvent}
        onSaveContent={handleSaveContent}
        currentUser={currentUser}
      />



      {/* Script Configuration Modal */}
      <ScriptConfigModal
        open={showScriptConfigModal}
        onCancel={() => {
          setShowScriptConfigModal(false);
          setNewScriptOption('');
        }}
        onOpenScriptDetail={handleOpenScriptDetail}
        scriptOptions={scriptOptions}
        onRefreshScripts={loadScriptOptions}
      />

      {/* Script Detail Configuration Modal */}
      <ScriptDetailModal
        open={showScriptDetailModal}
        onCancel={() => {
          setShowScriptDetailModal(false);
          setSelectedScript(null);
          setScriptTemplates([]);
          setNewTemplate({
            template_id: '',
            scheduled_time: null
          });
        }}
        selectedScript={selectedScript}
        scriptTemplates={scriptTemplates}
        setScriptTemplates={setScriptTemplates}
        emailTemplates={emailTemplates}
        onAddTemplate={handleAddTemplateToScript}
        onRemoveTemplate={handleRemoveTemplateFromScript}
        onUpdateTemplateTime={handleUpdateTemplateTime}
        onUpdateTemplateDelayDays={handleUpdateTemplateDelayDays}
        onUpdateTemplateSendTime={handleUpdateTemplateSendTime}
        scriptType={scriptType}
      />

      {/* Column Configuration Modal */}
      <ColumnConfigModal
        open={showColumnConfigModal}
        onCancel={() => setShowColumnConfigModal(false)}
        columnConfig={columnConfig}
        setColumnConfig={setColumnConfig}
        onSave={saveColumnConfig}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.deleteModal}>
          <div className={styles.deleteModalContent}>
            <div className={styles.deleteModalHeader}>
              <h3>Xác nhận xóa</h3>
              <button onClick={handleCancelDelete} className={styles.closeDeleteBtn}>
                ×
              </button>
            </div>
            <div className={styles.deleteModalBody}>
              <div className={styles.warningIcon}>
                ⚠️
              </div>
              <p>Bạn có chắc muốn xóa <strong>{selectedRows.length}</strong> khách hàng đã chọn?</p>
              <p className={styles.warningText}>Hành động này không thể hoàn tác.</p>
            </div>
            <div className={styles.deleteModalActions}>
              <button
                onClick={handleCancelDelete}
                className={styles.cancelDeleteBtn}
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className={styles.confirmDeleteBtn}
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Selection Modal */}
      <GroupSelectionModal
        open={showGroupSelectionModal && finalHasAccess}
        onCancel={() => {
          setShowGroupSelectionModal(false);
          setSelectedGroupType(null);
          setSelectedCustomerForGroup(null);
          refocusGridCell();
        }}
        onSave={handleGroupSelectionSave}
        groupType={selectedGroupType}
        groupConfig={selectedGroupType ? columnConfig[selectedGroupType] : null}
        currentValues={selectedCustomerForGroup?.info?.[selectedGroupType] || []}
        customerData={selectedCustomerForGroup}
      />

      {/* Script Selection Modal */}
      <ScriptSelectionModal
        open={showScriptSelectionModal && finalHasAccess}
        onCancel={() => {
          setShowScriptSelectionModal(false);
          setSelectedCustomerForScript(null);
          refocusGridCell();
        }}
        onSave={handleScriptSelectionSave}
        scriptOptions={scriptOptions || []}
        currentValues={(() => {
          const careScripts = selectedCustomerForScript?.care_script || [];
          // Truyền trực tiếp care_script objects
          return careScripts;
        })()}
        customerData={selectedCustomerForScript}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        open={showCustomerDetailModal}
        onCancel={() => {
          setShowCustomerDetailModal(false);
          setSelectedCustomerDetail(null);
        }}
        customerData={selectedCustomerDetail}
        columnConfig={columnConfig}
      />

      {/* Import Modal */}
      <ImportModal
        open={showImportModal}
        onCancel={() => setShowImportModal(false)}
        onImport={handleImportFromExcel}
        loading={importing}
      />

      {/* Bulk Script Assignment Modal */}
      <ScriptSelectionModal
        open={showBulkScriptModal}
        onCancel={() => {
          setShowBulkScriptModal(false);
        }}
        onSave={handleBulkScriptAssignment}
        scriptOptions={scriptOptions || []}
        currentValues={[]}
        customerData={null}
        title="Gắn kịch bản cho nhiều khách hàng"
        description={`Đang gắn kịch bản cho ${selectedRows.length} khách hàng đã chọn`}
      />
    </div>
  );
};

export default CustomerTable;
