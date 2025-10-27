import React, { useState, useEffect, useContext } from 'react';
import {
  Modal,
  Table,
  Input,
  Button,
  Checkbox,
  Typography,
  Space,
  Tag,
  Tooltip,
  Flex,
  Empty,
  Badge,
  message
} from 'antd';
import {
  SearchOutlined,
  FolderOutlined,
  FileTextOutlined,
  EyeOutlined,
  DownOutlined,
  RightOutlined,
  CloseOutlined,
    TableOutlined
} from '@ant-design/icons';
import styles from './DataPermission.module.css';
import { MyContext } from '../../MyContext.jsx';
import { getFileTabByTypeData } from '../../apis/fileTabService.jsx';
import { getAllFileNotePad } from '../../apis/fileNotePadService.jsx';
import { getAllTemplateSheetTable } from '../../apis/templateSettingService.jsx';
import { getSettingByType, getSchemaTools } from '../../apis/settingService.jsx';
import { getAllApprovedVersion, updateApprovedVersion } from '../../apis/approvedVersionTemp.jsx';
import { getAllPath } from '../../apis/adminPathService.jsx';
import { ICON_CROSSROAD_LIST } from '../../icon/svg/IconSvg.jsx';

// Function to get icon path using ICON_CROSSROAD_LIST (same as Dashboard)
const getIconPath = (iconName) => {
  if (!iconName) return undefined;
  
  const found = ICON_CROSSROAD_LIST.find(item => item.id === iconName);
  if (!found) {
    console.warn(`Icon not found for: ${iconName}`);
  }
  return found ? found.icon : undefined;
};

const { Title, Text } = Typography;
const { Search } = Input;

/**
 * Component quản lý quyền truy cập dữ liệu
 * Sử dụng thuộc tính apps (JSON) của approvedVersion để lưu trữ thông tin về việc version nào được sử dụng ở app nào
 * - apps: Array chứa các app ID được phép truy cập version này
 * - Khi người dùng thay đổi permission, thuộc tính apps sẽ được cập nhật trong database
 */
const DataPermission = ({ isOpen, onClose }) => {
  const { currentUser, listUC_CANVAS, uCSelected_CANVAS } = useContext(MyContext);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [expandedDatasets, setExpandedDatasets] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileTabs, setFileTabs] = useState([]);
  const [fileNotes, setFileNotes] = useState([]);
  const [templateTables, setTemplateTables] = useState([]);
  const [apps, setApps] = useState([]);
  const [approvedVersions, setApprovedVersions] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [availableSchemas, setAvailableSchemas] = useState([]);

  // Danh sách app mặc định (tương tự AdminPath.jsx và Dashboard.jsx)
  const defaultApps = [
    {
      "id": "data-manager",
      "tag": "Working",
      "icon": "cloud-database_9517778",
      "name": "Data Rubik",
      "description": "Tích hợp,làm sạch, chuẩn hóa dữ liệu ứng dụng AI"
    },
    {
      "id": "forecast",
      "tag": "under-development",
      "icon": "business-report_9461193",
      "name": "Mô hình dự báo kinh doanh",
      "description": "Dự báo số liệu kinh doanh 7-15 ngày tới"
    },
    {
      "id": "analysis-review",
      "tag": "Working",
      "icon": "online-analytical_10064427",
      "name": "Phân tích - Thống kê",
      "description": "Đo chỉ số - phân tích kinh doanh thông minh"
    },
    {
      "id": "fdr",
      "tag": "On-demand",
      "icon": "calculations_3696447",
      "name": "Phân tích lãi lỗ đa chiều (FDR)",
      "description": "Công cụ xử lý phân bổ số liệu tài chính"
    },
    {
      "id": "data-factory",
      "tag": null,
      "icon": "data-management_9672269",
      "name": "SDS - Thám báo Social Network",
      "description": "Tổng hợp dữ liệu từ các FBGroup/Page thường xuyên"
    },
    {
      "id": "business-wikibook",
      "tag": "Working",
      "icon": "cubes_741101",
      "name": "AI MBA",
      "description": "Business Knowledge Platform for Reference"
    },
    {
      "id": "k9",
      "tag": "Working",
      "icon": "communications_9635461",
      "name": "AI ExpertBot",
      "title": "",
      "description": "Trợ lý chatbot nhanh, ngắn gọn, chuyên sâu"
    },
    {
      "id": "x-app",
      "tag": null,
      "icon": "calendar_5602981",
      "name": "Trợ lý thời tiết-sự kiện (F&B)",
      "description": "Hoạch định tuần tới tốt hơn với dữ liệu sự kiện"
    },
    {
      "id": "scrape",
      "tag": "Working",
      "icon": "analytics_9410993",
      "name": "B-Crawler",
      "description": "Công cụ cập nhập diễn biến từ FB Page/Group"
    },
    {
      "id": "metric-map",
      "tag": "Working",
      "icon": "target_9410976",
      "name": "KPI Map",
      "description": "Hệ thống chỉ số theo mô hình kinh doanh"
    },
    {
      "id": "proposal-maker",
      "tag": "Working",
      "icon": "logistic_11860936",
      "name": "Proposal Maker",
      "description": "Hệ thống chỉ số theo mô hình kinh doanh"
    },
    {
      "id": "adminApp",
      "tag": "Working",
      "icon": "energy_11991460",
      "name": "Admin",
      "title": "",
      "description": "Admin dashboard and settings userclass"
    },
    {
      "id": "survey-app",
      "tag": "Working",
      "icon": "list_10781334",
      "name": "Khảo sát & Thông tin bán hàng",
      "description": "Tạo và quản lý khảo sát khách hàng với template tùy chỉnh"
    }
  ];

  // Fetch schemas for super admin
  const fetchSchemas = async () => {
    if (currentUser?.isSuperAdmin) {
      try {
        const data = await getAllPath();
        const schemas = data?.data || [];
        if (schemas && Array.isArray(schemas)) {
          // Lọc chỉ những schema có status = "true" và show = true
          const activeSchemas = schemas.filter(schema =>
            schema.status === "true" && schema.show === true
          );
          setAvailableSchemas(activeSchemas);

          // Set default selected schema if none is selected
          if (!selectedSchema && activeSchemas.length > 0) {
            // Check localStorage first
            const savedSchemaId = localStorage.getItem('selectedSchemaId');
            if (savedSchemaId && savedSchemaId !== 'default') {
              const savedSchema = activeSchemas.find(s => s.id.toString() === savedSchemaId);
              if (savedSchema) {
                setSelectedSchema(savedSchema);
                return;
              }
            }

            // If currentUser already has a schema, try to find and select it
            if (currentUser.schema && currentUser.schema !== ('master' || 'Schema gốc')) {
              const existingSchema = activeSchemas.find(s =>
                s.name === currentUser.schema || s.path === currentUser.schema || s.id.toString() === currentUser.schema
              );
              if (existingSchema) {
                setSelectedSchema(existingSchema);
              } else {
                // Nếu không tìm thấy schema, chuyển về schema gốc
                setSelectedSchema('default');
              }
            } else {
              // Sử dụng schema gốc
              setSelectedSchema('default');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching schemas:', error);
      }
    }
  };

  // Get visible tools/apps similar to WikiCanvas logic
  const getVisibleTools = async () => {
    try {
      // First, get the master schema's DASHBOARD_SETTING to get the complete app list with icons
      const masterResponse = await getSchemaTools('master');
      const masterAppsList = masterResponse?.setting || [];
      console.log('Master apps loaded for DataPermission:', masterAppsList.length, 'apps');
      
      let visibleTools = masterAppsList.filter(tool => {
        // Check if tool is enabled (default to true if not set)
        if (tool.enabled === false) return false;

        // Check visibility based on user authentication (default to 'public' if not set)
        const visibility = tool.visibility || 'public';
        switch (visibility) {
          case 'public':
            return true; // Always visible
          case 'login-required':
            return currentUser && currentUser.email; // Only visible if logged in
          case 'trial':
            // For trial tools, check if user is logged in AND has permission
            if (!currentUser || !currentUser.email) return false;
            if (!currentUser?.isSuperAdmin && !currentUser?.isAdmin) return false;
            return true; // For now, allow trial tools for admin/superAdmin
          default:
            return true;
        }
      });
      
      // Apply permission logic after tool settings
      visibleTools = visibleTools.filter(tool => {
        // Super admin can see all tools (except data-manager, adminApp, data-factory and process-guide)
        if (currentUser?.isSuperAdmin) {
          return tool.id !== 'data-manager' && tool.id !== 'adminApp' && 
                 tool.id !== 'data-factory' && tool.id !== 'process-guide';
        }

        // Admin can see all tools (except data-manager, adminApp, data-factory and process-guide)
        if (currentUser?.isAdmin) {
          return tool.id !== 'data-manager' && tool.id !== 'adminApp' && 
                 tool.id !== 'data-factory' && tool.id !== 'process-guide';
        }

        // For regular users, check allowedAppIds (if available)
        // For now, show all tools except restricted ones
        return tool.id !== 'data-manager' && tool.id !== 'adminApp' && 
               tool.id !== 'data-factory' && tool.id !== 'process-guide';
      });

      // Sort by order field
      visibleTools = visibleTools.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      console.log('Visible tools for DataPermission:', visibleTools.length, 'tools');
      setApps(visibleTools);
      
    } catch (error) {
      console.error('Lỗi khi lấy visible tools:', error);
      // Fallback: sử dụng danh sách app mặc định
      const filteredApps = defaultApps.filter(app => app.id !== 'data-manager' && app.id !== 'adminApp');
      setApps(filteredApps);
      console.log('DataPermission: Error fallback to default apps:', filteredApps.length);
    }
  };

  // Fetch data from API
  const fetchData = async () => {
    try {
      const [tabsData, notesData, templatesData, approvedVersionsData] = await Promise.all([
        getFileTabByTypeData(),
        getAllFileNotePad(),
        getAllTemplateSheetTable(),
        getAllApprovedVersion()
      ]);
      console.log('Approved versions data:', approvedVersionsData);
      console.log('Apps data from approved versions:', approvedVersionsData.map(av => ({
        id: av.id,
        id_fileNote: av.id_fileNote,
        id_version: av.id_version,
        apps: av.apps || []
      })));
      
      // Filter and sort file tabs
      let filteredTabs = tabsData.filter((tab) => tab.position < 100 && tab.table == 'du-lieu-dau-vao' && tab.type == 'data');
      filteredTabs.sort((a, b) => a.position - b.position);
      setFileTabs(filteredTabs);

      // Filter file notes based on user permissions
      let filteredNotes = notesData;
      if (!currentUser?.isAdmin) {
        const ucObj = listUC_CANVAS?.find(uc => uc.id == uCSelected_CANVAS);
        const ucName = ucObj?.name;
        filteredNotes = notesData.filter((item) => {
          if (!item.userClass || !Array.isArray(item.userClass) || item.userClass.length === 0) {
            return false;
          }
          return item.userClass.includes(ucName);
        });
      }
      setFileNotes(filteredNotes);
      setTemplateTables(templatesData);
      setApprovedVersions(approvedVersionsData);

      // Initialize permissions from approved versions
      initializePermissionsFromApprovedVersions(approvedVersionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set default apps on error (excluding data-manager and adminApp)
      const filteredApps = defaultApps.filter(app => app.id !== 'data-manager' && app.id !== 'adminApp');
      setApps(filteredApps);
    }
  };

  // Initialize permissions from approved versions
  // Sử dụng thuộc tính apps (JSON) của approvedVersion để lưu trữ thông tin về việc version nào được sử dụng ở app nào
  const initializePermissionsFromApprovedVersions = (approvedVersionsData) => {
    const initialPermissions = {};
    
    console.log('Initializing permissions from approved versions:', approvedVersionsData);
    
    approvedVersionsData.forEach(approvedVersion => {
      const key = `${approvedVersion.id_fileNote}-${approvedVersion.id_version}`;
      const appsData = approvedVersion.apps || [];
      
      console.log('Processing approved version:', {
        id: approvedVersion.id,
        id_fileNote: approvedVersion.id_fileNote,
        id_version: approvedVersion.id_version,
        tên: approvedVersion.tên,
        name: approvedVersion.name,
        key: key,
        apps: appsData
      });
      
      if (appsData.length > 0) {
        initialPermissions[key] = new Set(appsData);
      } else {
        initialPermissions[key] = new Set();
      }
    });
    
    console.log('Initial permissions set:', initialPermissions);
    setPermissions(initialPermissions);
  };

  // Fetch schemas when component mounts or user changes
  useEffect(() => {
    if (isOpen) {
      fetchSchemas();
    }
  }, [isOpen, currentUser?.isSuperAdmin]);

  // Fetch visible tools when modal opens
  useEffect(() => {
    if (isOpen) {
      getVisibleTools();
    }
  }, [isOpen, currentUser]);

  // Fetch main data when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, fetching data...');
      fetchData();
    }
  }, [isOpen, currentUser, listUC_CANVAS, uCSelected_CANVAS]);

  // Function to check if a version is approved
  const isVersionApproved = (idVersion, idTemplate, idFileNote) => {
    return approvedVersions.some(approved =>
      approved.id_version === idVersion &&
      approved.id_fileNote === idFileNote
    );
  };

  // Function to get approved version object
  const getApprovedVersionObject = (idVersion, idTemplate, idFileNote) => {
    const found = approvedVersions.find(approved =>
      approved.id_version === idVersion &&
      approved.id_fileNote === idFileNote
    );
    return found;
  };

  // Build data structure from API data
  const buildDataStructure = () => {
    return fileTabs.map(tab => {
      const tabFileNotes = fileNotes.filter(note => note.tab === tab.key);

      const datasets = tabFileNotes.map(note => {
          // Find template tables for this file note
          const noteTemplates = templateTables.filter(template => template.fileNote_id === note.id);

          // Get versions from steps of template tables
          const versions = [];
          noteTemplates.forEach(template => {
            if (template.steps && Array.isArray(template.steps)) {
              template.steps.forEach((step, stepIndex) => {
                const stepType = step.type || step.stepType;
                const stepName = stepTypeName[stepType] || step.name || `Step ${stepIndex + 1}`;
                const stepSummary = getStepSummary(step);

                // Check if this version is approved - use stepIndex + 1 to match id_version
                const isApproved = isVersionApproved(stepIndex + 1, template.id, note.id);

                // Only add approved versions
                if (isApproved) {
                  // Get the approved version object to get its name
                  const approvedVersion = getApprovedVersionObject(stepIndex + 1, template.id, note.id);
                  const versionName = approvedVersion?.tên || approvedVersion?.name || stepName;
                  
                  versions.push({
                    id: stepIndex + 1, // Use stepIndex + 1 as version ID to match approvedVersion.id_version
                    name: versionName, // Use name from approvedVersion
                    step: stepTypeName[stepType] || step.type || step.name || 'Step',
                    summary: stepSummary,
                    date: step.created_at ? new Date(step.created_at).toLocaleDateString() :
                          template.created_at ? new Date(template.created_at).toLocaleDateString() : 'N/A',
                    template: template,
                    stepData: step,
                    stepIndex: stepIndex,
                    stepType: stepType,
                    isApproved: true,
                    approvedVersion: approvedVersion // Store the approved version object for reference
                  });
                }
              });
            } else {
              // Fallback: if no steps, check if template itself is approved
              const isApproved = isVersionApproved(1, template.id, note.id); // Use 1 as version index for template

              if (isApproved) {
                // Get the approved version object to get its name
                const approvedVersion = getApprovedVersionObject(1, template.id, note.id);
                const versionName = approvedVersion?.tên || approvedVersion?.name || template.name || 'Template';
                
                versions.push({
                  id: 1, // Use 1 as version ID for template without steps
                  name: versionName, // Use name from approvedVersion
                  step: template.type || 'Template',
                  summary: '',
                  date: template.created_at ? new Date(template.created_at).toLocaleDateString() : 'N/A',
                  template: template,
                  isApproved: true,
                  approvedVersion: approvedVersion // Store the approved version object for reference
                });
              }
            }
          });

          // Only return dataset if it has approved versions
          if (versions.length > 0) {
            return {
              id: note.id.toString(),
              name: note.name,
              type: 'dataset',
              folder: tab.label,
              table: note.table,
              versions: versions
            };
          }
          return null;
        }).filter(dataset => dataset !== null); // Filter out null datasets

      // Only return folder if it has approved datasets
      if (datasets.length > 0) {
        return {
          id: tab.id.toString(),
          name: tab.label,
          type: 'folder',
          children: datasets
        };
      }
      return null;
    }).filter(folder => folder !== null); // Filter out null folders
  };

  // Step type mapping
  const stepTypeName = {
    1: 'Bỏ duplicate',
    2: 'Điền giá trị thiếu',
    3: 'Phát hiện ngoại lệ',
    4: 'Lookup',
    5: 'Thêm cột tính toán',
    8: 'Điền có điều kiện',
    7: 'Validation & Mapping',
    9: 'Lọc tách bảng',
    10: 'Aggregate',
    12: 'Tạo mới',
    13: 'Column Split',
    14: 'Date Converter',
    15: 'Smart Rule Fill',
    16: 'Column Filter',
  };

  // Function to get step summary (similar to PipelineSteps.jsx)
  const getStepSummary = (step) => {
    const config = step.config || {};

    switch (step.type) {
      case 1:
        return `Columns: ${(config.columns || []).join(', ')} | Keep: ${config.keepFirst ? 'First' : 'Last'}`;
      case 2:
        const newColInfo = config.newColumn ? ` → ${config.columnName}` : '';
        return `Column: ${config.column}${newColInfo}, Fill: ${config.fillType}`;
      case 3:
        const outlierAction = config.action === 'remove' ? 'Remove' : config.action === 'flag' ? 'Flag' : 'Cap';
        const outlierNewColInfo = config.newColumn && config.columnName ? ` → ${config.columnName}` : '';
        const outlierMethodName = config.method === 'iqr' ? 'IQR' : config.method === 'zscore' ? 'Z-Score' :
                                 config.method === 'mad' ? 'MAD' : config.method === 'isolation' ? 'Isolation' :
                                 config.method === 'percentile' ? 'Percentile' : config.method;
        return `Column: ${config.column}, Method: ${outlierMethodName}, Action: ${outlierAction}${outlierNewColInfo}`;
      case 4: {
        const tableStr = String(config.lookupTable ?? '').slice(0, 20);
        const returnColStr = String(config.returnColumn ?? '').slice(0, 20);
        const joinColStr = String(config.joinColumn ?? '').slice(0, 20);
        const lookupColStr = String(config.lookupColumn ?? '').slice(0, 20);
        const newColStr = String(config.newColumnName ?? '').slice(0, 20);

        const trunc = (str, max = 18) => {
          if (!str) return '';
          return str.length > max ? str.slice(0, max) + '...' : str;
        };

        const line1 = `Lookup: ${trunc(tableStr)} → ${trunc(returnColStr)}`;
        const line2 = `Join: ${trunc(joinColStr)}=${trunc(lookupColStr)} → ${trunc(newColStr)}`;
        return `${line1}\n${line2}`;
      }
      case 5:
        return `New: ${config.newColumnName}, Formula: ${config.formula}`;
      case 7:
        const targetCol = config.targetColumn || 'N/A';
        const mappingMethod = config.mappingAction || 'similarity';
        const outputCol = config.createNewColumn && config.newColumnName ? config.newColumnName :
          config.overwriteOriginal ? `${targetCol} (overwrite)` : 'N/A';

        let methodSummary = '';
        switch (mappingMethod) {
          case 'similarity':
            const threshold = config.similarityThreshold || '85';
            methodSummary = `Similarity ${threshold}%`;
            break;
          case 'ai_assisted':
            methodSummary = 'AI Assisted';
            break;
          case 'manual':
            const ruleCount = config.manualRules?.filter(r => r.input && r.output).length || 0;
            methodSummary = `Manual (${ruleCount} rules)`;
            break;
          default:
            methodSummary = mappingMethod;
        }

        let referenceSummary = '';
        if (config.referenceType === 'list') {
          const listItems = config.referenceList?.split(',').length || 0;
          referenceSummary = `List (${listItems} items)`;
        } else if (config.referenceType === 'table') {
          const version = config.referenceTableVersion === null ? 'gốc' : config.referenceTableVersion;
          referenceSummary = `Table v${version}`;
        } else {
          referenceSummary = 'Chưa cấu hình';
        }

        return `${targetCol} → ${outputCol} | ${methodSummary}${mappingMethod === 'manual' ? '' : ` | Ref: ${referenceSummary}`}`;
      case 8:
        const smartFillTargetCol = config.createNewColumn && config.newColumnName
          ? config.newColumnName
          : config.targetColumn;
        if (config.useAI) {
          return `Smart Fill (AI): ${smartFillTargetCol} - "${config.aiPrompt?.substring(0, 50)}..."`;
        } else {
          const conditionCount = config.conditions?.length || 0;
          return `Smart Fill: ${smartFillTargetCol} (${conditionCount} điều kiện)`;
        }
      case 9:
        return `Filter: ${config.conditions?.length || 0} conditions`;
      case 10:
        const aggCount = config.aggregations?.length || 0;
        const groupByCols = config.groupBy || [];
        const groupByText = Array.isArray(groupByCols) ? groupByCols.join(' → ') : (typeof groupByCols === 'string' ? groupByCols : 'N/A');
        return `Group by: ${groupByText} | Aggregations: ${aggCount}`;
      case 13:
        const splitMethod = config.splitMethod || 'separator';
        const targetCol13 = config.targetColumn || 'N/A';
        if (splitMethod === 'separator') {
          const separator = config.separator || ',';
          return `Split: ${targetCol13} by "${separator}"`;
        } else {
          const position = config.position || 'left';
          const length = config.length || 1;
          return `Split: ${targetCol13} ${position.toUpperCase()} ${length} chars`;
        }
      case 14:
        const yearCol = config.yearColumn || 'N/A';
        const monthCol = config.monthColumn || 'N/A';
        const dayCol = config.dayColumn || 'N/A';
        const dateOutputCol = config.outputColumn || 'date';
        return `Date: ${yearCol}/${monthCol}/${dayCol} → ${dateOutputCol}`;
      case 15:
        const smartRuleInputCols = config.inputColumns || [];
        const smartRuleOutputCol = config.createNewColumn ? config.newColumnName : config.outputColumn;
        const exampleCount = config.exampleIdentifier?.values?.length || 0;
        return `Smart Rule: [${smartRuleInputCols.join(', ')}] → ${smartRuleOutputCol} (${exampleCount} examples)`;
      case 16:
        const filterMode = config.filterMode === 'include' ? 'Giữ lại' : 'Loại bỏ';
        const selectedCount = config.selectedColumns?.length || 0;
        const selectedCols = config.selectedColumns || [];
        const colsPreview = selectedCols.length > 3
          ? `${selectedCols.slice(0, 3).join(', ')}...`
          : selectedCols.join(', ');
        return `${filterMode}: ${selectedCount} cột${selectedCount > 0 ? ` (${colsPreview})` : ''}`;
      default:
        return '';
    }
  };

  const dataStructure = buildDataStructure();

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const toggleDataset = (datasetId) => {
    const newExpanded = new Set(expandedDatasets);
    if (newExpanded.has(datasetId)) {
      newExpanded.delete(datasetId);
    } else {
      newExpanded.add(datasetId);
    }
    setExpandedDatasets(newExpanded);
  };

  const togglePermission = (dataId, versionId, appId) => {
    const key = `${dataId}-${versionId}`;
    const newPermissions = { ...permissions };

    if (!newPermissions[key]) {
      newPermissions[key] = new Set();
    }

    const appPermissions = new Set(newPermissions[key]);
    if (appPermissions.has(appId)) {
      appPermissions.delete(appId);
    } else {
      appPermissions.add(appId);
    }

    newPermissions[key] = appPermissions;
    console.log('Permission toggled:', { dataId, versionId, appId, key, newPermissions: newPermissions[key] });
    setPermissions(newPermissions);
  };

  const filterData = (data, query) => {
    if (!query.trim()) return data;

    const lowerQuery = query.toLowerCase();

    return data.map(folder => {
      const folderMatches = folder.name.toLowerCase().includes(lowerQuery);

      if (folder.children) {
        const filteredChildren = folder.children.filter(dataset => {
          const datasetMatches = dataset.name.toLowerCase().includes(lowerQuery);
          const versionMatches = dataset.versions.some(version =>
            version.name.toLowerCase().includes(lowerQuery) ||
            version.step.toLowerCase().includes(lowerQuery)
          );
          return datasetMatches || versionMatches;
        });

        if (folderMatches || filteredChildren.length > 0) {
          return {
            ...folder,
            children: filteredChildren
          };
        }
      }

      return folderMatches ? folder : null;
    }).filter(Boolean);
  };

  const filteredData = filterData(dataStructure, searchQuery);

  // Auto-expand folders when search results are found
  useEffect(() => {
    if (searchQuery.trim()) {
      const newExpandedFolders = new Set(expandedFolders);
      const newExpandedDatasets = new Set(expandedDatasets);

      filteredData.forEach(folder => {
        if (folder.children && folder.children.length > 0) {
          newExpandedFolders.add(folder.id);
          folder.children.forEach(dataset => {
            newExpandedDatasets.add(dataset.id);
          });
        }
      });

      setExpandedFolders(newExpandedFolders);
      setExpandedDatasets(newExpandedDatasets);
    }
  }, [searchQuery, filteredData]);

  const getPermissionKey = (dataId, versionId) => {
    const key = `${dataId}-${versionId}`;
    console.log('Generated permission key:', { dataId, versionId, key });
    return key;
  };

  // Generate table data
  const generateTableData = () => {
    const tableData = [];
    let index = 0;

    filteredData.forEach((folder) => {
      // Add folder row
      tableData.push({
        key: `folder-${folder.id}`,
        id: folder.id,
        type: 'folder',
        name: folder.name,
        version: null,
        isExpanded: expandedFolders.has(folder.id),
        level: 0,
        index: index++
      });

      // Add dataset rows if folder is expanded
      if (expandedFolders.has(folder.id) && folder.children) {
        folder.children.forEach((dataset) => {
          // Add dataset header row
          tableData.push({
            key: `dataset-${dataset.id}`,
            id: dataset.id,
            type: 'dataset',
            name: dataset.name,
            version: null,
            isExpanded: expandedDatasets.has(dataset.id),
            level: 1,
            versionsCount: dataset.versions.length,
            index: index++
          });

          // Add version rows if dataset is expanded
          if (expandedDatasets.has(dataset.id)) {
            dataset.versions.forEach((version, versionIndex) => {
              tableData.push({
                key: `version-${dataset.id}-${version.id}`,
                id: dataset.id,
                type: 'version',
                name: version.name,
                version: version,
                versionIndex: versionIndex + 1,
                level: 2,
                step: version.step,
                summary: version.summary,
                date: version.date,
                index: index++
              });
            });
          }
        });
      }
    });

    return tableData;
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      // Cập nhật thuộc tính apps (JSON) của mỗi approvedVersion với thông tin permission
      const updatePromises = [];
      
      console.log('Current permissions to save:', permissions);
      console.log('Available approved versions:', approvedVersions);
      
      Object.entries(permissions).forEach(([key, appSet]) => {
        const [fileNoteId, versionId] = key.split('-');
        console.log('Processing key:', key, 'fileNoteId:', fileNoteId, 'versionId:', versionId);
        
        const approvedVersion = getApprovedVersionObject(parseInt(versionId), null, parseInt(fileNoteId));
        
        if (approvedVersion) {
          const appsArray = Array.from(appSet);
          const updateData = {
            ...approvedVersion,
            apps: appsArray
          };
          
          console.log('Updating approved version:', approvedVersion.id, 'with apps:', appsArray);
          updatePromises.push(updateApprovedVersion(updateData));
        } else {
          console.warn('Approved version not found for:', { fileNoteId, versionId });
        }
      });
      
      if (updatePromises.length === 0) {
        console.warn('No updates to perform');
        message.warning('Không có thay đổi nào để lưu!');
        setLoading(false);
        return;
      }
      
      console.log('Executing', updatePromises.length, 'update promises');
      await Promise.all(updatePromises);
      console.log('Permissions saved successfully:', permissions);
      
      // Refresh approved versions data
      const updatedApprovedVersions = await getAllApprovedVersion();
      setApprovedVersions(updatedApprovedVersions);
      
      message.success('Đã lưu cấu hình quyền truy cập thành công!');
      setLoading(false);
      onClose();
    } catch (error) {
      console.error('Error saving permissions:', error);
      message.error('Lỗi khi lưu cấu hình quyền truy cập!');
      setLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Thư mục / Dữ liệu / Step',
      dataIndex: 'name',
      key: 'name',
      width: 350,
      render: (text, record) => {
        const paddingLeft = record.level * 20;

        if (record.type === 'folder') {
          return (
            <div style={{ paddingLeft: `${paddingLeft}px` }}>
              <Flex align="center" gap={8}>
                <Button
                  type="text"
                  size="small"
                  icon={record.isExpanded ? <DownOutlined /> : <RightOutlined />}
                  onClick={() => toggleFolder(record.id)}
                  style={{ padding: 0, minWidth: 16 }}
                />
                <FolderOutlined style={{ color: '#1890ff' }} />
                <Text strong>{text}</Text>
              </Flex>
            </div>
          );
        } else if (record.type === 'dataset') {
          return (
            <div style={{ paddingLeft: `${paddingLeft}px` }}>
              <Flex align="center" justify="space-between">
                <Flex align="center" gap={8}>
                  <Button
                    type="text"
                    size="small"
                    icon={record.isExpanded ? <DownOutlined /> : <RightOutlined />}
                    onClick={() => toggleDataset(record.id)}
                    style={{ padding: 0, minWidth: 16 }}
                  />
                  <TableOutlined style={{ color: '#1890ff' }} />
                  <Flex vertical gap={2}>
                    <Text strong>{text}</Text>
                  </Flex>
                </Flex>
                {/*<Tooltip title="Preview Data">*/}
                {/*  <Button*/}
                {/*    type="text"*/}
                {/*    size="small"*/}
                {/*    icon={<EyeOutlined />}*/}
                {/*    onClick={() => console.log('Preview:', text)}*/}
                {/*  />*/}
                {/*</Tooltip>*/}
              </Flex>
            </div>
          );
        } else {
          return (
            <div style={{ paddingLeft: `${paddingLeft}px` }}>
              <Flex vertical gap={2}>
                <Text>{text}</Text>
                {/*<Text type="secondary" style={{ fontSize: 12 }}>*/}
                {/*  {record.stepType ? stepTypeName[record.stepType] || record.step : record.step} • {record.date}*/}
                {/*</Text>*/}
                {record.summary && (
                  <Text type="secondary" style={{ fontSize: 11, color: '#666', fontStyle: 'italic' }}>
                    {record.summary}
                  </Text>
                )}
              </Flex>
            </div>
          );
        }
      }
    },
    {
      title: 'Apps đã cấu hình',
      dataIndex: 'configuredApps',
      key: 'configuredApps',
      width: 150,
      align: 'center',
      render: (_, record) => {
        if (record.type === 'version') {
          const permissionKey = getPermissionKey(record.id, record.version.id);
          const configuredApps = permissions[permissionKey] || new Set();
          const count = configuredApps.size;
          
          if (count === 0) {
            return <Text type="secondary" style={{ fontSize: 12 }}>Chưa cấu hình</Text>;
          }
          
          const appNames = Array.from(configuredApps).map(appId => {
            const app = apps.find(a => a.id === appId);
            return app ? app.name : appId;
          });
          
          return (
            <Tooltip title={`Apps đã cấu hình: ${appNames.join(', ')}`}>
              <Badge count={count} size="small" style={{ backgroundColor: '#52c41a' }}>
                <Text style={{ fontSize: 12 }}>{count} app{count > 1 ? 's' : ''}</Text>
              </Badge>
            </Tooltip>
          );
        }
        return null;
      }
    },
    ...apps.map(app => ({
        title: (
          <Flex vertical align="center" gap={4}>
            <img
              src={getIconPath(app.icon)}
              alt={app.name}
              style={{ width: 24, height: 24 }}
            />
          <Text style={{ fontSize: 11, textAlign: 'center', lineHeight: 1.2 }}>
            {app.name}
          </Text>
          {app.content1 && (
            <Tooltip title={app.content1} placement="top">
              <Text 
                style={{ 
                  fontSize: 9, 
                  color: '#666', 
                  textAlign: 'center', 
                  lineHeight: 1.1,
                  maxWidth: '80px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {app.content1.length > 20 ? `${app.content1.substring(0, 20)}...` : app.content1}
              </Text>
            </Tooltip>
          )}
        </Flex>
      ),
      dataIndex: app.id,
      key: app.id,
      // width: 120,
      flex:1,
      align: 'center',
      render: (_, record) => {
        if (record.type === 'version') {
          const permissionKey = getPermissionKey(record.id, record.version.id);
          const hasPermission = permissions[permissionKey]?.has(app.id) || false;

          console.log('Rendering checkbox for:', { 
            recordId: record.id, 
            versionId: record.version.id, 
            appId: app.id, 
            permissionKey, 
            hasPermission,
            allPermissions: permissions
          });

          return (
            <Tooltip title={`${hasPermission ? 'Bỏ' : 'Cấp'} quyền truy cập cho ${app.name}${app.content1 ? `\n\nNội dung: ${app.content1}` : ''}`}>
              <Checkbox
                checked={hasPermission}
                onChange={() => togglePermission(record.id, record.version.id, app.id)}
              />
            </Tooltip>
          );
        }
        return null;
      }
    }))
  ];

  const tableData = generateTableData();

  return (
    <Modal
        title={
          <Flex align="center" gap={12}>
            <Title level={4} style={{ margin: 0 }}>
              Cấu hình quyền truy cập dữ liệu
            </Title>
          </Flex>
        }
        open={isOpen}
        onCancel={onClose}
        width="90%"
        footer={null}
        centered
        closeIcon={<CloseOutlined />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
          {/* Search Section */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid #f0f0f0',
            backgroundColor: '#fafafa'
          }}>
            <Flex align="center" gap={16}>
              <Search
                placeholder="Tìm kiếm dữ liệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={setSearchQuery}
                style={{ maxWidth: 400 }}
                allowClear
              />
              {searchQuery && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {filteredData.reduce((total, folder) => total + (folder.children?.length || 0), 0)} dữ liệu được tìm thấy
                </Text>
              )}
            </Flex>
          </div>

          {/* Table Section */}
          <div>
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={false}
              size="small"
              scroll={{ x: 'max-content', y: 'calc(80vh - 200px)' }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span>
                        Không tìm thấy dữ liệu phù hợp với "{searchQuery}"
                      </span>
                    }
                  />
                )
              }}
              rowClassName={(record) => {
                if (record.type === 'folder') return styles['folder-row'];
                if (record.type === 'dataset') return styles['dataset-row'];
                return styles['version-row'];
              }}
            />
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #f0f0f0',
            backgroundColor: '#fafafa'
          }}>
            <Flex justify="flex-end" gap={12}>
              <Button onClick={onClose}>
                Hủy
              </Button>
              <Button
                type="primary"
                loading={loading}
                onClick={handleSaveChanges}
              >
                Lưu thay đổi
              </Button>
            </Flex>
          </div>
        </div>
      </Modal>
  );
};

export default DataPermission;
