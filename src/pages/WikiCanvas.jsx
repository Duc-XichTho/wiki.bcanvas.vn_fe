import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { RotateCcw, Plus, Edit2, X, Check, MoreHorizontal, Palette, HelpCircle, Phone, ChevronDown, ChevronUp, Trash2, MessageSquare, HelpCircle as QuestionMark, ArrowUpDown, Search } from 'lucide-react';
import styles from './Dashboard.module.css';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AI_Meter, ICON_CROSSROAD_LIST } from '../icon/svg/IconSvg.jsx';
import { createSetting, getSettingByType, updateSetting, getSchemaResources, getSchemaBackground, updateSchemaTools, getTypeSchema } from '../apis/settingService.jsx';
import { sendRegistrationEmail } from '../apis/gateway/emailService.jsx';
import { Modal, Input, Button, Dropdown, ColorPicker, Select, Upload, Checkbox, Popconfirm, message, Divider } from 'antd';
import { getUserClassByEmail } from '../apis/userClassService.jsx';
import { MyContext } from '../MyContext.jsx';
import { Tooltip } from 'antd';
import { formatCurrency } from '../generalFunction/format.js';
import { SettingOutlined, UploadOutlined } from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext.jsx';
import ProfileSelect from './Home/SelectComponent/ProfileSelect.jsx';
import { useMediaQuery } from "@uidotdev/usehooks";
import { getAllPath, updatePath } from '../apis/adminPathService.jsx';
import instance, { updateSchemaHeader } from '../apis/axiosInterceptors.jsx';
import { getSchemaTools } from '../apis/settingService.jsx';
import { getAllKpiBenchmark, createNewKpiBenchmark, updateKpiBenchmark, deleteKpiBenchmark } from '../apis/kpiBenchmarkService.jsx';
import { Row, Col, Typography } from 'antd';
import FirstTimePopup from '../components/FirstTimePopup.jsx';
import { marked } from 'marked';
import Loading3DTower from '../components/Loading3DTower.jsx';
import { v4 as uuidv4 } from 'uuid';
import { SiN8N } from "react-icons/si";
import N8N from './N8N/N8N.jsx';
import ResourcePanel from '../components/ResourcePanel/index.js';
import TagManagementModal from '../components/TagManagementModal/TagManagementModal.jsx';
import TaskChecklistModal from '../components/TaskChecklistModal/TaskChecklistModal.jsx';
import TaskManagementModal from '../components/TaskManagementModal/TaskManagementModal.jsx';
import ToolReorderModal from '../components/ToolReorderModal/ToolReorderModal.jsx';
const { Text } = Typography;
import { FULL_DASHBOARD_APPS } from '../CONST.js';

const WikiCanvas = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dashboardApps = useMemo(() => FULL_DASHBOARD_APPS, [FULL_DASHBOARD_APPS]); // Empty dependency array để chỉ tạo một lần

  const { tab } = useParams();
  const [activeTab, setActiveTab] = useState('app');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tools, setTools] = useState([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  
  // Debug: Log tools state changes (can be removed in production)
  useEffect(() => {
  }, [tools]);
  const [editingTool, setEditingTool] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTool, setNewTool] = useState({ title: '', description: '', icon: '🛠️', tags: [], enterUrl: '', content1: '', content2: '', showSupport: false, showInfo: false, shortcut: '' });
  const [title, setTitle] = useState('Business Canvas');
  const [editingTitle, setEditingTitle] = useState(false);
  const [allowedAppIds, setAllowedAppIds] = useState([]);
  const [usedTokenApp, setUsedTokenApp] = useState([]);
  const [totalToken, setTotalToken] = useState(0);
  const [totalUsed, setTotalUsed] = useState(0);
  const [dashboardSettings, setDashboardSettings] = useState([]);
  const [researchBpoSettings, setResearchBpoSettings] = useState([]);
  const [trainingProductivitySettings, setTrainingProductivitySettings] = useState([]);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [newTotalToken, setNewTotalToken] = useState(0);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showTagManagementModal, setShowTagManagementModal] = useState(false);
  const [showToolReorderModal, setShowToolReorderModal] = useState(false);
  const [showTaskChecklistModal, setShowTaskChecklistModal] = useState(() => {
    try {
      const saved = localStorage.getItem('taskChecklistModalOpen');
      return saved === 'true';
    } catch (_) {
      return false;
    }
  });
  const [showTaskManagementModal, setShowTaskManagementModal] = useState(false);
  const [taskChecklistRefreshTrigger, setTaskChecklistRefreshTrigger] = useState(0);
  const [tagOptions, setTagOptions] = useState([]);
  const [tagSearch, setTagSearch] = useState('');
  const [selectedTagFilters, setSelectedTagFilters] = useState([]);

  // Trial apps states
  const [trialApps, setTrialApps] = useState([]);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [selectedTrialApp, setSelectedTrialApp] = useState(null);

  // Tool Settings states
  const [showToolSettingsModal, setShowToolSettingsModal] = useState(false);
  const [tempToolSettings, setTempToolSettings] = useState({});
  
  // Direct Download Modal states
  const [showDirectDownloadModal, setShowDirectDownloadModal] = useState(false);
  const [selectedDownloadTool, setSelectedDownloadTool] = useState(null);

  // Available apps that are not yet added - based on dashboardApps but only specific ones
  const availableApps = useMemo(() => {
    const allowedIds = ['data-manager', 'analysis-review', 'fdr', 'business-wikibook', 'metric-map', 'k9', 'ai-work-automation', 'khkd', 'ai-academic-assistant'];
    return dashboardApps.filter(app => allowedIds.includes(app.id));
  }, [dashboardApps]);
  
  const [selectedColors, setSelectedColors] = useState([
    { id: 1, color: '#13C2C2' },
    { id: 2, color: '#3196D1' },
    { id: 3, color: '#6DB8EA' },
    { id: 4, color: '#87D2EA' },
    { id: 5, color: '#9BAED7' },
    { id: 6, color: '#C695B7' },
    { id: 7, color: '#EDCCA1' },
    { id: 8, color: '#A4CA9C' }
  ]);
  const [dashboardColors, setDashboardColors] = useState({
    background: {
      gradient: ['#1e3c72', '#2980b9', '#6dd5fa'],
      gridColor: '#ff6b6b',
      gridOpacity: 0.15
    }
  });

  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showUnderDevelopmentModal, setShowUnderDevelopmentModal] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [availableSchemas, setAvailableSchemas] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [schemaError, setSchemaError] = useState(null);
  const [showFirstTimePopup, setShowFirstTimePopup] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showGuidelineModal, setShowGuidelineModal] = useState(false);
  const [guidelineImage, setGuidelineImage] = useState(null);
  const [guidelineMarkdown, setGuidelineMarkdown] = useState('');
  const [guidelineImageUrl, setGuidelineImageUrl] = useState('');

  // Context Instruction Settings states
  const [showContextInstructionModal, setShowContextInstructionModal] = useState(false);
  const [contextInstruction, setContextInstruction] = useState('');

  // KPI Benchmark states
  const [showKpiBenchmarkModal, setShowKpiBenchmarkModal] = useState(false);
  const [showKpiBenchmarkFormModal, setShowKpiBenchmarkFormModal] = useState(false);
  const [kpiBenchmarks, setKpiBenchmarks] = useState([]);
  const [editingKpiBenchmark, setEditingKpiBenchmark] = useState(null);
const [masterAppsList, setMasterAppsList] = useState([]);
  // Topbar Theme states
  const [showTopbarThemeModal, setShowTopbarThemeModal] = useState(false);
  const [topbarTheme, setTopbarTheme] = useState({
    name: 'light',
    background: '#FFFFFF',
    textColor: '#454545',
    superAdminColor: '#66A2E7',
    iconApp: '/LogoC.png'
  });

  // Status Bar Theme states
  const [showStatusBarThemeModal, setShowStatusBarThemeModal] = useState(false);
  const [statusBarTheme, setStatusBarTheme] = useState({
    background: '#303237',
    textColor: '#A5A5A5'
  });
  const [tempStatusBarTheme, setTempStatusBarTheme] = useState({
    background: '#303237',
    textColor: '#A5A5A5'
  });

  // Topbar background image setting
  const [topbarBgImageUrl, setTopbarBgImageUrl] = useState('');
  const [showTopbarBgModal, setShowTopbarBgModal] = useState(false);
  const [topbarBgDraftUrl, setTopbarBgDraftUrl] = useState('');
  const [topbarBgPendingFile, setTopbarBgPendingFile] = useState(null);
  const [topbarBgPreviewUrl, setTopbarBgPreviewUrl] = useState('');

  // Topbar text color setting
  const [topbarTextColor, setTopbarTextColor] = useState('');
  const [showTopbarTextColorModal, setShowTopbarTextColorModal] = useState(false);
  const [tempTopbarTextColor, setTempTopbarTextColor] = useState('');

  // Theme Settings Modal states
  const [themeSettingsModalVisible, setThemeSettingsModalVisible] = useState(false);
  const [themeSettings, setThemeSettings] = useState({
    backgroundColor: '#FFFFFF',
    textColor: '#454545',
    description: '',
    backgroundType: 'solid', // 'solid' or 'gradient'
    gradientColors: ['#1e3c72', '#2980b9', '#6dd5fa'],
    gradientDirection: '135deg' // CSS gradient direction
  });
  const [tempThemeSettings, setTempThemeSettings] = useState({
    backgroundColor: '#FFFFFF',
    textColor: '#454545',
    backgroundType: 'solid',
    gradientColors: ['#1e3c72', '#2980b9', '#6dd5fa'],
    gradientDirection: '135deg'
  });

  // Days remaining helpers (recompute when currentTime changes)
  const { daysInMonth, daysInYear } = useMemo(() => {
    const now = currentTime instanceof Date ? currentTime : new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth(); // 0-11
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
    const daysRemainingInMonth = Math.max(0, lastDayOfMonth - now.getDate());
    const endOfYear = new Date(year, 11, 31);
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysRemainingInYear = Math.max(0, Math.ceil((endOfYear - now) / msPerDay));
    return { daysInMonth: daysRemainingInMonth, daysInYear: daysRemainingInYear };
  }, [currentTime]);

  // Cấu hình màu text cho 2 thẻ số liệu (lưu trong bảng setting)
  const [daysCountdownTextColors, setDaysCountdownTextColors] = useState('#6b6b6b');
  const [showDaysCountdownColorModal, setShowDaysCountdownColorModal] = useState(false);
  // Countdown items (user-defined)
  const [countdownItems, setCountdownItems] = useState([]);
  // Cài đặt hiển thị cho 2 countdown cố định
  const [showFixedCountdowns, setShowFixedCountdowns] = useState({
    month: true,
    year: true
  });
  const [showAddCountdownModal, setShowAddCountdownModal] = useState(false);
  const [showEditCountdownModal, setShowEditCountdownModal] = useState(false);
  const [editingCountdown, setEditingCountdown] = useState(null);
  const [newCountdown, setNewCountdown] = useState({ description: '', target: '', unit: 'days' });
 const [visibleTools, setVisibleTools] = useState([]);
 const [blockedTools, setBlockedTools] = useState([]);
 const [trialTools, setTrialTools] = useState([]);
  // Load màu text từ Setting API khi component mount
  useEffect(() => {
    const loadDaysCountdownColors = async () => {
      try {
        const settings = await getSettingByType('DASHBOARD_COUNTDOWN_COLORS');
        if (settings?.setting?.color) {
          setDaysCountdownTextColors(settings.setting.color);
        }
      } catch (error) {
        console.error('Error loading days widget colors:', error);
      }
    };
    loadDaysCountdownColors();
  }, []);

  // Save màu text vào Setting API
  const saveDaysCountdownColors = async (colors) => {
    try {
      const currentSettings = await getSettingByType('DASHBOARD_COUNTDOWN_COLORS') || {};
      const updatedSettings = {
        ...currentSettings,
        setting: { color: colors }
      };
      await updateSetting(updatedSettings);
      setDaysCountdownTextColors(colors);
    } catch (error) {
      console.error('Error saving days widget colors:', error);
    }
  };

  // Load saved countdown items from settings
  useEffect(() => {
    const loadCountdownItems = async () => {
      try {
        const existing = await getSettingByType('DASHBOARD_COUNTDOWN_ITEMS');
        if (existing && Array.isArray(existing.setting)) {
          setCountdownItems(existing.setting);
        }
      } catch (e) {
        // ignore if not found
      }
    };
    loadCountdownItems();
  }, []);

  // Load countdown display settings
  useEffect(() => {
    const loadCountdownDisplaySettings = async () => {
      try {
        const setting = await getSettingByType('DASHBOARD_FIXED_COUNTDOWN_DISPLAY');
        if (setting && setting.setting) {
          setShowFixedCountdowns(setting.setting);
        }
      } catch (e) {
        // ignore if not found
      }
    };
    loadCountdownDisplaySettings();
  }, []);

  // Load theme settings
  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        const setting = await getSettingByType('THEME_BAGE_NAVBAR');
        if (setting && setting.setting) {
          const themeData = setting.setting;
          // Lấy description từ selectedSchema nếu có
          if (selectedSchema?.description) {
            themeData.description = selectedSchema.description;
          }
          setThemeSettings(themeData);
          setTempThemeSettings(themeData);
        }
      } catch (e) {
        // ignore if not found
      }
    };
    loadThemeSettings();
  }, [selectedSchema]);

  // Save countdown items to settings
  const saveCountdownItems = async (items) => {
    try {
      const existing = await getSettingByType('DASHBOARD_COUNTDOWN_ITEMS');
      if (existing && existing.id) {
        await updateSetting({ ...existing, setting: items });
      } else {
        await createSetting({ type: 'DASHBOARD_COUNTDOWN_ITEMS', setting: items });
      }
      setCountdownItems(items);
    } catch (e) {
      console.error('Error saving countdown items', e);
    }
  };

  // Add new countdown
  const handleAddCountdown = async () => {
    if (!newCountdown.target) return;
    const item = {
      id: uuidv4(),
      description: newCountdown.description || 'Countdown',
      target: newCountdown.target, // ISO string
      unit: newCountdown.unit || 'days',
      isHidden: false, // Default không ẩn
    };
    const updated = [...countdownItems, item];
    await saveCountdownItems(updated);
    setShowAddCountdownModal(false);
    setNewCountdown({ description: '', target: '', unit: 'days' });
  };

  // Edit countdown
  const handleEditCountdown = (item) => {
    setEditingCountdown(item);
    setNewCountdown({
      description: item.description,
      target: item.target,
      unit: item.unit
    });
    setShowEditCountdownModal(true);
  };

  // Save edited countdown
  const handleSaveEditCountdown = async () => {
    if (!newCountdown.target || !editingCountdown) return;
    const updated = countdownItems.map(item =>
      item.id === editingCountdown.id
        ? { ...item, ...newCountdown }
        : item
    );
    await saveCountdownItems(updated);
    setShowEditCountdownModal(false);
    setEditingCountdown(null);
    setNewCountdown({ description: '', target: '', unit: 'days' });
  };

  // Delete countdown
  const handleDeleteCountdown = async (id) => {
    const updated = countdownItems.filter((it) => it.id !== id);
    await saveCountdownItems(updated);
  };

  // Toggle hide/show countdown
  const handleToggleCountdownVisibility = async (id) => {
    const updated = countdownItems.map(item =>
      item.id === id
        ? { ...item, isHidden: !item.isHidden }
        : item
    );
    await saveCountdownItems(updated);
  };

  // Save countdown display settings
  const saveCountdownDisplaySettings = async (newSettings) => {
    try {
      const existing = await getSettingByType('DASHBOARD_FIXED_COUNTDOWN_DISPLAY');
      if (existing && existing.id) {
        await updateSetting({ ...existing, setting: newSettings });
      } else {
        await createSetting({ type: 'DASHBOARD_FIXED_COUNTDOWN_DISPLAY', setting: newSettings });
      }
    } catch (e) {
      console.error('Error saving countdown display settings', e);
    }
  };

  // Toggle fixed countdown display
  const handleToggleFixedCountdown = async (type) => {
    const newSettings = {
      ...showFixedCountdowns,
      [type]: !showFixedCountdowns[type]
    };
    setShowFixedCountdowns(newSettings);
    await saveCountdownDisplaySettings(newSettings);
  };

  // Theme Settings handlers
  const handleThemeSettingsChange = (field, value) => {
    setTempThemeSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveThemeSettings = async () => {
    try {
      // Lưu theme settings vào setting table
      const existing = await getSettingByType('THEME_BAGE_NAVBAR');
      if (existing && existing.id) {
        await updateSetting({ ...existing, setting: tempThemeSettings });
      } else {
        await createSetting({ type: 'THEME_BAGE_NAVBAR', setting: tempThemeSettings });
      }

      // Cập nhật description vào schema record
      if (selectedSchema && tempThemeSettings.description) {
        const updatedSchema = {
          ...selectedSchema,
          description: tempThemeSettings.description,
          updated_at: new Date().toISOString()
        };

        // Gọi API update path
        await updatePath(updatedSchema);

        // Cập nhật local state
        setSelectedSchema(updatedSchema);
      }

      setThemeSettings(tempThemeSettings);
      setThemeSettingsModalVisible(false);
    } catch (e) {
      console.error('Error saving theme settings', e);
    }
  };

  const handleCancelThemeSettings = () => {
    setTempThemeSettings(themeSettings);
    setThemeSettingsModalVisible(false);
  };

  // Compute remaining value by unit
  const computeRemaining = (targetISO, unit) => {
    if (!targetISO) return 0;
    const now = currentTime instanceof Date ? currentTime : new Date();
    const target = new Date(targetISO);
    const diffMs = Math.max(0, target - now);
    if (unit === 'hours') return Math.floor(diffMs / (1000 * 60 * 60));
    if (unit === 'hm') {
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return `${h}:${String(m).padStart(2, '0')}`;
    }
    // default days
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // UI helpers for sidebar widgets
  const monthDisplay = useMemo(() => {
    const now = currentTime instanceof Date ? currentTime : new Date();
    return now.getMonth() + 1; // 1-12
  }, [currentTime]);

  const yearDisplay = useMemo(() => {
    const now = currentTime instanceof Date ? currentTime : new Date();
    return now.getFullYear();
  }, [currentTime]);

  const getGradient = useCallback((c1Idx, c2Idx) => {
    const c1 = selectedColors[c1Idx]?.color || '#36d1dc';
    const c2 = selectedColors[c2Idx]?.color || '#5b86e5';
    return `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`;
  }, [selectedColors]);

  // Background settings state
  const [showBackgroundSettingsModal, setShowBackgroundSettingsModal] = useState(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('/simple_background.png');

  // Resource Panel state
  const [pinnedResourceId, setPinnedResourceId] = useState(null);
  const [resources, setResources] = useState([
    {
      id: '1',
      name: 'Dashboard Resources',
      description: 'Comprehensive resource management for dashboard tools and utilities.',
      content1: `# Dashboard Resource Features

## Core Features
- **Resource Management**: Create, edit, and delete resources
- **Markdown Support**: Rich text editing with live preview
- **Icon Integration**: Choose from available icon library
- **Schema Integration**: Resources tied to specific schemas

## Usage
- Click cards to view detailed information
- Edit resources with inline editing
- Add new resources with the "Add New" button`,
      content2: `## Integration Benefits

### For Administrators
- **Centralized Management**: All resources in one place
- **Schema-specific**: Resources can be configured per schema
- **Rich Content**: Markdown support for detailed documentation

### For Users  
- **Easy Access**: Quick access to important resources
- **Visual Interface**: Clean card-based layout
- **Responsive Design**: Works on all screen sizes

> **Note**: Resources are automatically saved and synced with the backend API.`,
      logo: '',
      icon: 'analytics_9410993',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-20T14:45:00Z'
    }
  ]);

  // Store the setting ID for DASHBOARD_RESOURCES
  const [resourcesSettingId, setResourcesSettingId] = useState(null);
  const [showToolsLoading, setShowToolsLoading] = useState(true);
  const [isSwitchingSchema, setIsSwitchingSchema] = useState(false);
  const [showAddFormResearchBpo, setShowAddFormResearchBpo] = useState(false);
  const [newToolResearchBpo, setNewToolResearchBpo] = useState({ name: '', description: '', icon: '🛠️', tags: [], enterUrl: '', content1: '', content2: '', showSupport: false, showInfo: false, shortcut: '' });
  const [showAddFormTrainingProductivity, setShowAddFormTrainingProductivity] = useState(false);
  const [newToolTrainingProductivity, setNewToolTrainingProductivity] = useState({ name: '', description: '', icon: '🛠️', tags: [], enterUrl: '', content1: '', content2: '', showSupport: false, showInfo: false, shortcut: '' });

  // State cho modal đăng ký tư vấn
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    jobTitle: '',
    fullName: '',
    contactInfo: '',
    preferredChannel: 'call', // 'call', 'zalo', 'message'
    notes: ''
  });

  const { currentUser, userClasses, setCurrentUser } = useContext(MyContext);
  const { theme, changeTheme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Log currentUser state changes for debugging
  useEffect(() => {
    console.log('=== WikiCanvas: currentUser state ===');
    console.log('Current user:', currentUser);
    console.log('Is Admin:', currentUser?.isAdmin);
    console.log('Is Super Admin:', currentUser?.isSuperAdmin);
    console.log('Is Editor:', currentUser?.isEditor);
    console.log('Schema:', currentUser?.schema);
    console.log('Will show login button?', !currentUser);
  }, [currentUser]);

  useEffect(() => {
    if (isMobile) {
      setSelectedTagFilters([]);
    }
  }, [isMobile]);

  // Thay thế commonIcons bằng icon từ ICON_CROSSROAD_LIST
  const commonIcons = ICON_CROSSROAD_LIST;

  // Danh sách mặc định khi chưa có setting - sử dụng useMemo để tránh tạo mới mỗi lần render

  // Helper function để lọc apps theo schema
  const filterAppsBySchema = useCallback((apps, schema) => {
    if (!schema || schema === 'master') {
      return apps;
    }

    return apps.filter(app => {
      if (schema.path === 'dev') {
        return true; // Schema dev: hiển thị tất cả app
      } else if (schema.path === 'test') {
        return ['data-manager', 'k9', 'adminApp'].includes(app.id); // Schema test: chỉ hiển thị một số app cơ bản
      } else if (schema.path === 'staging') {
        return app.tag !== 'under-development'; // Schema staging: hiển thị app production
      } else {
        return app.tag === 'Working' || app.tag === 'On-demand'; // Schema khác: hiển thị app theo quy tắc mặc định
      }
    });
  }, []);

  // Xóa useEffect gây infinite loop - thay vào đó xử lý trực tiếp trong onChange
  const fetchDashboardSetting = async () => {
    if (isLoadingTools) {
      return;
    }
    
    try {
      setIsLoadingTools(true);
      let existing;
      if (activeTab === 'app') {
        existing = await getSettingByType('DASHBOARD_SETTING');
      } else if (activeTab === 'research-bpo') {
        existing = await getSettingByType('RESEARCH_BPO_SETTING');
      } else if (activeTab === 'training-productivity') {
        existing = await getSettingByType('TRAINING_PRODUCTIVITY_SETTING');
      } else {
        existing = await getSettingByType('DASHBOARD_SETTING');
      }

      // Load resources from backend using getSchemaResources
      try {
        const resourcesData = await getSchemaResources('master');

        if (resourcesData && resourcesData.setting) {

          // Check if the setting is the new format (with pinnedResourceId) or old format (just resources array)
          if (resourcesData.setting.resources && resourcesData.setting.pinnedResourceId !== undefined) {
            setResources(resourcesData.setting.resources);
            setPinnedResourceId(resourcesData.setting.pinnedResourceId);
          } else if (Array.isArray(resourcesData.setting)) {
            setResources(resourcesData.setting);
            setPinnedResourceId(null);

          } else {
            setResources(resourcesData.setting);
            setPinnedResourceId(null);
          }
          setResourcesSettingId(resourcesData.id); // Store the setting ID
        } else {
          // Create DASHBOARD_RESOURCES setting if it doesn't exist
          const newSetting = await createSetting({
            type: 'DASHBOARD_RESOURCES',
            setting: {
              resources: resources, // Use current default resources
              pinnedResourceId: null
            }
          });
          setResourcesSettingId(newSetting.id); // Store the new setting ID
        }
      } catch (error) {
        console.error('❌ [DEBUG] Error loading resources:', error);
        try {
          // Create DASHBOARD_RESOURCES setting if it doesn't exist
          const newSetting = await createSetting({
            type: 'DASHBOARD_RESOURCES',
            setting: {
              resources: resources, // Use current default resources
              pinnedResourceId: null
            }
          });
          setResourcesSettingId(newSetting.id); // Store the new setting ID
        } catch (createError) {
          console.error('❌ [DEBUG] Error creating DASHBOARD_RESOURCES setting:', createError);
        }
      }

      if (existing.setting) {
        console.log('Setting tools from existing setting:', existing.setting);

        // Luôn sử dụng array format, thêm order field nếu chưa có
        let toolsToProcess = Array.isArray(existing.setting) ? existing.setting : Object.values(existing.setting).filter(tool => tool && tool.id);

        // Thêm order field cho tools chưa có
        toolsToProcess = toolsToProcess.map((tool, index) => ({
          ...tool,
          order: tool.order !== undefined ? tool.order : index
        }));

        // Sắp xếp theo order field
        toolsToProcess.sort((a, b) => (a.order || 0) - (b.order || 0));


       

        const combinedTools = await combineAppsWithMasterInfo(toolsToProcess);
        console.log('combinedTools', combinedTools);
        setTools(combinedTools);
      } else {
        console.log('Creating new dashboard setting');
        // Tạo array format với order field
        const toolsWithOrder = dashboardApps.map((tool, index) => ({
          ...tool,
          order: index
        }));

        await updateSetting({
          ...existing,
          setting: toolsWithOrder
        }).then(res => {
          console.log('Updated:', res);
        });
        
 
        const combinedTools = await combineAppsWithMasterInfo(toolsWithOrder);
        setTools(combinedTools);
      }
    } catch (error) {
      console.error('Lỗi khi lấy/tạo data', error);
      setTools(dashboardApps);
    } finally {
      setIsLoadingTools(false);
    }
  };
  useEffect(() => {
    if (activeTab) {
      // Load dashboard setting cho user thường hoặc super admin với tab khác 'app'
      // Super admin với tab 'app' sẽ được xử lý bởi useEffect khác dựa trên selectedSchema
      if (!currentUser?.isSuperAdmin || activeTab !== 'app') {
        fetchDashboardSetting();
      }
    }
  }, [activeTab, currentUser]); // Chỉ chạy khi activeTab hoặc user thay đổi

  useEffect(() => {
    loadTagOptions();
  }, []);

  useEffect(() => {
    loadTrialApps();
  }, [selectedSchema, activeTab]);

  const loadResourcesForSchema = async () => {
    try {
      const resourcesData = await getSchemaResources('master');

      if (resourcesData && resourcesData.setting) {
        setResources(resourcesData.setting);
        setResourcesSettingId(resourcesData.id);
      }
    } catch (error) {
      console.log('Error loading master schema resources:', error);
    }
  };
  // Khởi tạo tools theo schema hiện tại khi component mount
  useEffect(() => {
    if (currentUser?.isSuperAdmin && selectedSchema && selectedSchema !== 'master' && activeTab === 'app') {
      console.log('Initializing tools for schema:', selectedSchema.path);
      // Lấy tools thực tế được cấu hình cho schema này
      const initializeToolsForSchema = async () => {
        setIsSwitchingSchema(true);
        try {
          const schemaToolsResponse = await getSchemaTools(selectedSchema.path);
          console.log('Initial schema tools response:', schemaToolsResponse);

          if (schemaToolsResponse && schemaToolsResponse.setting && schemaToolsResponse.setting.length > 0) {
            // Kết hợp với thông tin từ schema master
            const combinedApps = await combineAppsWithMasterInfo(schemaToolsResponse.setting);
            setTools(combinedApps);
            console.log(`Initialized with configured tools for schema ${selectedSchema.path}: ${combinedApps.length} apps`);
          } else {
            // Fallback: sử dụng logic lọc cũ nếu chưa có cấu hình
            let schemaSpecificApps;
            if (selectedSchema.path === 'dev') {
              schemaSpecificApps = dashboardApps;
            } else if (selectedSchema.path === 'test') {
              schemaSpecificApps = dashboardApps.filter(app =>
                ['data-manager', 'k9', 'adminApp'].includes(app.id)
              );
            } else if (selectedSchema.path === 'staging') {
              schemaSpecificApps = dashboardApps.filter(app =>
                app.tag !== 'under-development'
              );
            } else {
              schemaSpecificApps = dashboardApps.filter(app =>
                app.tag === 'Working' || app.tag === 'On-demand'
              );
            }
            // Kết hợp với thông tin từ schema master
            const combinedApps = await combineAppsWithMasterInfo(schemaSpecificApps);
            setTools(combinedApps);
            console.log(`Initialized with fallback filtered tools for schema ${selectedSchema.path}, showing ${combinedApps.length} apps`);
          }
        } catch (error) {
          console.error('Lỗi khi khởi tạo tools cho schema:', error);
          // Fallback: sử dụng logic lọc cũ
          let schemaSpecificApps;
          if (selectedSchema.path === 'dev') {
            schemaSpecificApps = dashboardApps;
          } else if (selectedSchema.path === 'test') {
            schemaSpecificApps = dashboardApps.filter(app =>
              ['data-manager', 'k9', 'adminApp'].includes(app.id)
            );
          } else if (selectedSchema.path === 'staging') {
            schemaSpecificApps = dashboardApps.filter(app =>
              app.tag !== 'under-development'
            );
          } else {
            schemaSpecificApps = dashboardApps.filter(app =>
              app.tag === 'Working' || app.tag === 'On-demand'
            );
          }
          // Kết hợp với thông tin từ schema master
          const combinedApps = await combineAppsWithMasterInfo(schemaSpecificApps);
          setTools(combinedApps);
          console.log(`Error fallback initialization: using filtered tools for schema ${selectedSchema.path}, showing ${combinedApps.length} apps`);
        } finally {
          setIsSwitchingSchema(false);
        }
      };

      initializeToolsForSchema();

      // Load resources from master schema for non-master schemas


      loadResourcesForSchema();
    }
  }, [currentUser?.isSuperAdmin, selectedSchema, activeTab]); // Chỉ chạy khi user, schema hoặc activeTab thay đổi

  const loadMasterSchemaTools = async () => {
    setIsSwitchingSchema(true);
    try {
      // Load tools từ setting của schema master
      await fetchDashboardSetting();
      console.log('Loaded master schema tools from settings');
    } catch (error) {
      console.error('Error loading master schema tools:', error);
    } finally {
      setIsSwitchingSchema(false);
    }
  };
  // Xử lý khi selectedSchema là 'master' - load từ setting và kết hợp với master info
  useEffect(() => {
    if (currentUser?.isSuperAdmin && selectedSchema === 'master' && activeTab === 'app') {

      loadMasterSchemaTools();
    }
  }, [selectedSchema, activeTab]);


  useEffect(() => {
    async function fetchUserClass() {
      try {
        const userClasses = await getUserClassByEmail(); // No argument needed
        const allStepAccess = userClasses
          .filter(cls => Array.isArray(cls.stepAccess))
          .flatMap(cls => cls.stepAccess);
        setAllowedAppIds([...new Set(allStepAccess)]);
      } catch (error) {
        setAllowedAppIds([]);
      }
    };
    fetchUserClass();
  }, []);

  useEffect(() => {
    async function fetchTokenSettings() {
      try {
        const used = await getSettingByType('USED_TOKEN_APP');
        const total = await getSettingByType('TOTAL_TOKEN');
        const dashboard = await getSettingByType('DASHBOARD_SETTING');
        const researchBpo = await getSettingByType('RESEARCH_BPO_SETTING');
        const trainingProductivity = await getSettingByType('TRAINING_PRODUCTIVITY_SETTING');
        const arr = Array.isArray(used?.setting) ? used.setting : [];
        setUsedTokenApp(arr);
        setTotalToken(typeof total?.setting === 'number' ? total.setting : 0);
        setTotalUsed(arr.reduce((sum, item) => sum + (item.usedToken || 0), 0));
        setDashboardSettings(Array.isArray(dashboard?.setting) ? dashboard.setting : []);
        setResearchBpoSettings(Array.isArray(researchBpo?.setting) ? researchBpo.setting : []);
        setTrainingProductivitySettings(Array.isArray(trainingProductivity?.setting) ? trainingProductivity.setting : []);
      } catch (error) {
        console.error('Error fetching token settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    }
    fetchTokenSettings();
  }, []);

  // Load color settings on component mount
  useEffect(() => {
    const loadColorSettings = async () => {
      try {
        const existing = await getSettingByType('SettingColor');

        if (existing && existing.setting && Array.isArray(existing.setting)) {
          const isValidColorArray = existing.setting.every(item =>
            item && typeof item === 'object' &&
            typeof item.id === 'number' &&
            typeof item.color === 'string'
          );

          if (isValidColorArray) {
            setSelectedColors(existing.setting);
          }
        }
      } catch (error) {
        console.error('Error loading initial color settings:', error);
      }
    };

    loadColorSettings();
  }, []);

  // Load dashboard color settings on component mount
  useEffect(() => {
    const loadDashboardColorSettings = async () => {
      try {
        const existing = await getSettingByType('DASHBOARD_COLORS');
        console.log('Loading dashboard colors:', existing);

        if (existing && existing.setting && typeof existing.setting === 'object') {
          const { background } = existing.setting;
          if (background && background.gradient && background.gridColor !== undefined && background.gridOpacity !== undefined) {
            console.log('Setting dashboard colors:', existing.setting);
            setDashboardColors({ background });
          } else {
            console.log('Invalid dashboard colors structure, using defaults');
          }
        } else {
          console.log('No existing dashboard colors found, using defaults');
        }
      } catch (error) {
        console.error('Error loading initial dashboard color settings:', error);
      }
    };

    loadDashboardColorSettings();
  }, []);

  // Load background settings on component mount
  useEffect(() => {
    const loadBackgroundSettings = async () => {
      try {
        const existing = await getSchemaBackground('master');
        if (existing && existing.setting && typeof existing.setting === 'string') {
          setBackgroundImageUrl(existing.setting);
        } else {
          setBackgroundImageUrl('/simple_background.png');
        }
      } catch (error) {
        console.error('Error loading initial dashboard background settings:', error);
        setBackgroundImageUrl('/simple_background.png');
      }
    };

    loadBackgroundSettings();
  }, []);

  // Load topbar theme settings on component mount
  useEffect(() => {
    const loadTopbarTheme = async () => {
      try {
        const existing = await getSettingByType('TOPBAR_THEME');
        console.log('Loading topbar theme:', existing);

        if (existing && existing.setting) {
          setTopbarTheme(existing.setting);
        }
      } catch (error) {
        console.error('Error loading topbar theme settings:', error);
      }
    };

    const loadStatusBarTheme = async () => {
      try {
        const existing = await getSettingByType('STATUS_BAR_THEME');
        console.log('Loading status bar theme:', existing);

        if (existing && existing.setting) {
          setStatusBarTheme(existing.setting);
        }
      } catch (error) {
        console.error('Error loading status bar theme settings:', error);
      }
    };

    const loadTopbarBgImage = async () => {
      try {
        const existing = await getSettingByType('TOPBAR_BG_IMAGE');
        if (existing && typeof existing.setting === 'string') {
          setTopbarBgImageUrl(existing.setting);
        }
      } catch (error) {
        // ignore if not found
      }
    };

    const loadTopbarTextColor = async () => {
      try {
        const existing = await getSettingByType('TOPBAR_TEXT_COLOR');
        if (existing && typeof existing.setting === 'string') {
          setTopbarTextColor(existing.setting);
        }
      } catch (error) {
        // ignore if not found
      }
    };

    // loadTopbarTheme();
    loadStatusBarTheme();
    loadTopbarBgImage();
    loadTopbarTextColor();
  }, []);

  // Default to "Tất cả Module" on mobile
  useEffect(() => {
    if (isMobile) {
      setSelectedTagFilters([]);
    }
  }, [isMobile]);

  // Reload settings when component re-renders
  // useEffect(() => {
  //   const reloadSettings = async () => {
  //     try {
  //       // Reload dashboard colors
  //       const dashboardColorsSetting = await getSettingByType('DASHBOARD_COLORS');
  //       if (dashboardColorsSetting?.setting?.background) {
  //         const { background } = dashboardColorsSetting.setting;
  //         if (background.gradient && background.gridColor !== undefined && background.gridOpacity !== undefined) {
  //           setDashboardColors({ background });
  //         }
  //       }

  //       // Reload theme colors
  //       const themeColorsSetting = await getSettingByType('SettingColor');
  //       if (themeColorsSetting?.setting && Array.isArray(themeColorsSetting.setting)) {
  //         const isValidColorArray = themeColorsSetting.setting.every(item =>
  //           item && typeof item === 'object' &&
  //           typeof item.id === 'number' &&
  //           typeof item.color === 'string'
  //         );
  //         if (isValidColorArray) {
  //           setSelectedColors(themeColorsSetting.setting);
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error reloading settings:', error);
  //     }
  //   };

  //   reloadSettings();
  // }, []);

  // Fetch available schemas for super admin
  useEffect(() => {
    const fetchSchemas = async () => {
      if (currentUser?.isSuperAdmin) {
        try {
          setLoadingSchemas(true);
          setSchemaError(null);
          const data = await getAllPath();
          const schemas = data?.data || [];
          console.log('Schemas:', schemas);
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
              if (savedSchemaId && savedSchemaId !== 'master') {
                const savedSchema = activeSchemas.find(s => s.id.toString() === savedSchemaId);
                if (savedSchema) {
                  setSelectedSchema(savedSchema);
                  // Update currentUser context
                  if (setCurrentUser) {
                    setCurrentUser(prev => ({
                      ...prev,
                      schema: savedSchema.name || savedSchema.path
                    }));
                  }
                  // Update axios header
                  updateSchemaHeader(savedSchema.id.toString());
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
                  // Save to localStorage
                  localStorage.setItem('selectedSchemaId', existingSchema.id.toString());
                  // Update axios header
                  updateSchemaHeader(existingSchema.id.toString());
                } else {
                  // Nếu không tìm thấy schema, chuyển về schema gốc
                  setSelectedSchema('master');
                  localStorage.removeItem('selectedSchemaId');
                  updateSchemaHeader(null);
                }
              } else {
                // Sử dụng schema gốc
                setSelectedSchema('master');
                localStorage.removeItem('selectedSchemaId');
                updateSchemaHeader(null);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching schemas:', error);
          setSchemaError('Lỗi khi tải danh sách schemas');
        } finally {
          setLoadingSchemas(false);
        }
      }
    };

    fetchSchemas();

    // Cleanup function
    return () => {
      // Cleanup if needed
    };
  }, [currentUser?.isSuperAdmin, currentUser?.schema, selectedSchema]);

  // Clear schema state when user is not super admin
  useEffect(() => {
    if (!currentUser?.isSuperAdmin) {
      setAvailableSchemas([]);
      setSelectedSchema(null);
      // Clear schema header
      updateSchemaHeader(null);
      // Clear localStorage
      localStorage.removeItem('selectedSchemaId');
    }
  }, [currentUser?.isSuperAdmin]);

  // Check if this is the first time visiting dashboard
  useEffect(() => {
    if (settingsLoaded) {
      const hasVisitedDashboard = localStorage.getItem('firstTimeDashboardPopup');
      console.log("hasVisitedDashboard", hasVisitedDashboard);
      if (!hasVisitedDashboard) {
        setShowFirstTimePopup(true);
      }
    }
  }, [settingsLoaded]);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      const contentContainer = document.querySelector(`.${styles.contentContainer}`);
      if (contentContainer) {
        const { scrollTop, scrollHeight, clientHeight } = contentContainer;
        const isTop = scrollTop === 0;
        const isBottom = scrollTop + clientHeight >= scrollHeight - 1;

        setIsAtTop(isTop);
        setIsAtBottom(isBottom);

        // Chỉ hiện nút khi có thể scroll và không ở vị trí đầu hoặc cuối
        const canScroll = scrollHeight > clientHeight;
        const shouldShowButton = canScroll && (!isTop || !isBottom);
        setShowScrollButton(shouldShowButton);
      }
    };

    const contentContainer = document.querySelector(`.${styles.contentContainer}`);
    if (contentContainer) {
      contentContainer.addEventListener('scroll', handleScroll);
      handleScroll(); // Kiểm tra ngay lập tức
    }

    return () => {
      if (contentContainer) {
        contentContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Helper functions for trial apps

  // Get trial apps that should be displayed
  const getActiveTrialApps = () => {
    const activeTrials = trialApps.filter(trial => {
      if (!trial.isActive) return false;
      return !isTrialExpired(trial);
    });
    return activeTrials;
  };

  // Get expired trial apps
  const getExpiredTrialApps = () => {
    return trialApps.filter(trial => {
      if (!trial.isActive) return false;
      return isTrialExpired(trial);
    });
  };

  // Get available apps (not in current tools and not in any trial - active or expired)
  const getAvailableApps = () => {
    const currentToolIds = tools.map(tool => tool.id);
    const activeTrialAppIds = getActiveTrialApps().map(trial => trial.id);
    const expiredTrialAppIds = getExpiredTrialApps().map(trial => trial.id);

    // Filter available apps
    let apps = availableApps.filter(app =>
      !currentToolIds.includes(app.id) &&
      !activeTrialAppIds.includes(app.id) &&
      !expiredTrialAppIds.includes(app.id)
    );

    // Add trial tools that are not yet activated but have visibility: 'trial'
    const trialToolsNotActivated = tools.filter(tool => {
      // Only show if tool is enabled
      if (tool.enabled === false) return false;
      
      const visibility = tool.visibility || 'public';
      if (visibility !== 'trial') return false;
      
      // Check if user has permission to see trial tools
      if (!currentUser || !currentUser.email) return false;
      if (!currentUser?.isSuperAdmin && !currentUser?.isAdmin && allowedAppIds.length === 0) return false;
      
      // Check if tool is not in active trial
      const activeTrialApps = getActiveTrialApps();
      return !activeTrialApps.some(trial => trial.id === tool.id);
    });

    return [...apps, ...trialToolsNotActivated];
  };

  // Get expired trial apps for display in bottom section
  const getExpiredAppsForDisplay = () => {
    const expiredTrialApps = getExpiredTrialApps();
    const currentToolIds = tools.map(tool => tool.id);
    // Only show expired apps that are NOT already in the current schema tools
    return expiredTrialApps
      .filter(expired => !currentToolIds.includes(expired.id))
      .map(expired => ({
        id: expired.id,
        name: expired.name,
        description: expired.description,
        icon: expired.icon,
        isExpired: true
      }));
  };

  // Apply tool settings visibility logic first, then apply permission logic
  useEffect(() => {
    if (!tools || tools.length === 0) {
      setVisibleTools([]);
      setBlockedTools([]);
      setTrialTools([]);
      return;
    }

    // Apply tool settings visibility logic first, then apply permission logic
    let newVisibleTools = tools.filter(tool => {
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
          // For trial tools, check if user is logged in AND has permission AND tool is in active trial
          if (!currentUser || !currentUser.email) return false;
          if (!currentUser?.isSuperAdmin && !currentUser?.isAdmin && allowedAppIds.length === 0) return false;
          const activeTrialApps = getActiveTrialApps();
          return activeTrialApps.some(trial => trial.id === tool.id);
        default:
          return true;
      }
    });
    
    // Apply permission logic after tool settings
    newVisibleTools = newVisibleTools.filter(tool => {
      // Super admin can see all tools (except data-factory and process-guide)
      if (currentUser?.isSuperAdmin) {
        return tool.id !== 'data-factory' && tool.id !== 'process-guide';
      }

      // Admin can see all tools (except data-factory and process-guide)
      if (currentUser?.isAdmin) {
        return tool.id !== 'data-factory' && tool.id !== 'process-guide';
      }

      // For regular users, check allowedAppIds
      if (allowedAppIds.length > 0) {
        return allowedAppIds.includes(tool.id) &&
          tool.id !== 'data-factory' &&
          tool.id !== 'process-guide';
      }

      // If no allowedAppIds and user is not logged in, only show public tools
      // (this case is handled by the visibility logic above)
      return true;
    });
    // Create blocked tools list for visual feedback
    let newBlockedTools = tools.filter(tool => {
      // Check if tool is disabled
      if (tool.enabled === false) return false; // Don't show disabled tools in blocked list

      const visibility = tool.visibility || 'public';
      
      // Check if tool requires login but user is not logged in
      if (visibility === 'login-required' && (!currentUser || !currentUser.email)) return true;
      
      // Check if tool is trial but not activated
      if (visibility === 'trial') {
        if (!currentUser || !currentUser.email) return true; // Not logged in
        if (!currentUser?.isSuperAdmin && !currentUser?.isAdmin && allowedAppIds.length === 0) return true; // No permission
        const activeTrialApps = getActiveTrialApps();
        return !activeTrialApps.some(trial => trial.id === tool.id); // Not in active trial
      }

      return false;
    });

    // Only apply trial logic if NOT in master schema
    let newTrialTools = [];
    if (selectedSchema !== 'master') {
      // Add active trial apps to visible tools (only for admin/superAdmin or users with permissions)
      const activeTrialApps = getActiveTrialApps();
      
      // Replace tools with trial versions if they exist in active trials AND tool is enabled
      newVisibleTools = newVisibleTools.map(tool => {
        const trialVersion = activeTrialApps.find(trial => trial.id === tool.id);
        if (trialVersion && tool.enabled !== false) { // Only replace if tool is enabled
          return {
            ...trialVersion,
            tag: "Trial",
            isTrial: true,
            trialEndDate: trialVersion.endDate
          };
        }
        return tool;
      });

      // Add trial tools that are not in visibleTools yet (only if original tool is enabled)
    }
    // Chỉ hiển thị trial apps chưa hết hạn
    newTrialTools = trialApps
      .filter(trial => {
        // Kiểm tra trial còn active và chưa hết hạn
        if (!trial.isActive) return false;
        return !isTrialExpired(trial);
      })
      .map(trial => ({
        ...trial,
        tag: "Trial",
        isTrial: true,
        trialEndDate: trial.endDate
      }));
    // Add process-guide tool
    newVisibleTools = [...newVisibleTools, ...newTrialTools, 
    //   {
    //   id: "process-guide",
    //   tag: "Working",
    //   icon: "case-file_10256079",
    //   name: "TLSD BCanvas",
    //   viewCount: 120,
    //   description: "Hướng dẫn quy trình và các tài liệu sử dụng platform BCanvas",
    // }
  ];

    // Filter by selected tags if any
    if (selectedTagFilters.length > 0) {
      newVisibleTools = newVisibleTools.filter(t => Array.isArray(t.tags) && t.tags.some(tag => selectedTagFilters.includes(tag)));
    }

    // Filter by search term if any
    if (tagSearch && tagSearch.trim() !== '') {
      newVisibleTools = newVisibleTools.filter(t => {
        const name = (t.name || '').toLowerCase();
        const description = (t.description || '').toLowerCase();
        const searchTerm = tagSearch.toLowerCase();
        return name.includes(searchTerm) || description.includes(searchTerm);
      });

      // Also filter blocked tools and trial tools
      newBlockedTools = newBlockedTools.filter(t => {
        const name = (t.name || '').toLowerCase();
        const description = (t.description || '').toLowerCase();
        const searchTerm = tagSearch.toLowerCase();
        return name.includes(searchTerm) || description.includes(searchTerm);
      });

      newTrialTools = newTrialTools.filter(t => {
        const name = (t.name || '').toLowerCase();
        const description = (t.description || '').toLowerCase();
        const searchTerm = tagSearch.toLowerCase();
        return name.includes(searchTerm) || description.includes(searchTerm);
      });
    }

    // Sort visibleTools by order field
    newVisibleTools = newVisibleTools.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Update states
    console.log('newVisibleTools', newVisibleTools);
    setVisibleTools(newVisibleTools);
    setBlockedTools(newBlockedTools);
    setTrialTools(newTrialTools);
  }, [tools, currentUser, allowedAppIds, selectedTagFilters, selectedSchema, tagSearch]);

  const handleToolNavigation = (toolId) => {
    const tool = tools.find(app => app.id === toolId);
    
    // Check if this is a Direct Download tool
    if (tool && tool.directDownload) {
      setSelectedDownloadTool(tool);
      setShowDirectDownloadModal(true);
      return;
    }
    
    if (tool && tool.tag === 'under-development') {
      setShowUnderDevelopmentModal(true);
    } else {
      navigate('/' + toolId)
    }
  };
  const handleEdit = (tool) => {
    setEditingTool({ ...tool });
  };

  const handleSave = async () => {
    const updatedTools = tools.map(tool =>
      tool.id === editingTool.id ? { ...editingTool, tag: editingTool.tag ?? null } : tool
    );
    console.log('Saving tools:', updatedTools);
    setTools(updatedTools);
    setEditingTool(null);

    // Tách trial data ra khỏi tools data
    const toolsWithoutTrialData = updatedTools.map(tool => {
      const { isTrial, startDate, endDate, trialEndDate, ...toolWithoutTrial } = tool;
      return toolWithoutTrial;
    });

    // Lưu tools data (không có trial data) lên backend
    try {
      const existing = await getTypeSchema('master', 'DASHBOARD_SETTING');
      console.log('existing', existing);
      console.log('updatedTools without trial data', toolsWithoutTrialData);
      const response = await updateSchemaTools('master', toolsWithoutTrialData, existing.id);
      console.log('response', response);
      console.log(`Đã lưu tools vào schema: master`);
    } catch (error) {
      console.error('Lỗi khi cập nhật setting:', error);
    }

    // Lưu trial data riêng biệt vào DASHBOARD_TRIAL_APPS (chỉ cho schema hiện tại, không phải master)
    if (selectedSchema && selectedSchema !== 'master') {
      try {
        const trialData = updatedTools
          .filter(tool => tool.isTrial)
          .map(tool => ({
            id: tool.id,
            name: tool.name,
            description: tool.description,
            icon: tool.icon,
            startDate: tool.startDate,
            endDate: tool.endDate || tool.trialEndDate,
            isActive: true
          }));

        // Lưu trial data vào DASHBOARD_TRIAL_APPS cho schema hiện tại
        let existingTrial;
        try {
          existingTrial = await getSettingByType('DASHBOARD_TRIAL_APPS');
        } catch (error) {
          // Nếu chưa có setting, tạo mới
          existingTrial = { setting: [] };
        }

        const updatedTrialSettings = {
          ...existingTrial,
          type: 'DASHBOARD_TRIAL_APPS',
          setting: trialData
        };

        if (existingTrial?.id) {
          await updateSetting(updatedTrialSettings);
        } else {
          await createSetting(updatedTrialSettings);
        }
        
        console.log(`Đã lưu trial data vào DASHBOARD_TRIAL_APPS cho schema: ${selectedSchema}`, trialData);
      } catch (error) {
        console.error('Lỗi khi cập nhật trial data:', error);
      }
    } else {
      console.log('Master schema - không lưu trial data');
    }
  };

  const handleSaveToolReorder = async (reorderedTools) => {
    setTools(reorderedTools);

    // Tách trial data ra khỏi tools data
    const toolsWithoutTrialData = reorderedTools.map(tool => {
      const { isTrial, startDate, endDate, trialEndDate, ...toolWithoutTrial } = tool;
      return toolWithoutTrial;
    });

    // Lưu lên backend - sử dụng schema-specific API nếu không phải master schema
    try {
      // Tạo array mới với thứ tự đã sắp xếp và cập nhật order field
      const toolsWithOrder = toolsWithoutTrialData.map((tool, index) => ({
        ...tool,
        order: index
      }));

      if (selectedSchema && selectedSchema !== 'master') {
        // Sử dụng updateSchemaTools cho schema cụ thể
        await updateSchemaTools(selectedSchema, toolsWithOrder);
        console.log(`Đã lưu thứ tự tools vào schema: ${selectedSchema}`);
      } else {
        // Sử dụng updateSetting cho master schema
        let existing;
        if (activeTab === 'app') {
          existing = await getSettingByType('DASHBOARD_SETTING');
        } else if (activeTab === 'research-bpo') {
          existing = await getSettingByType('RESEARCH_BPO_SETTING');
        } else if (activeTab === 'training-productivity') {
          existing = await getSettingByType('TRAINING_PRODUCTIVITY_SETTING');
        } else {
          existing = await getSettingByType('DASHBOARD_SETTING');
        }

        // Cập nhật setting với array format
        const updatedSetting = {
          ...existing,
          setting: toolsWithOrder
        };

        await updateSetting(updatedSetting);
        console.log('Đã lưu thứ tự tools vào master schema');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật thứ tự tools:', error);
      throw error;
    }
  };
  const handleDeleteTool = async (tool) => {
    // Xóa tool khỏi danh sách
    const updatedTools = tools.filter(t => t.id !== tool.id);
    console.log('Deleting tool:', tool.name, 'Remaining tools:', updatedTools.length);
    setTools(updatedTools);

    // Lưu lên backend - sử dụng schema-specific API nếu không phải master schema
    try {
      if (selectedSchema && selectedSchema !== 'master') {
        // Sử dụng updateSchemaTools cho schema cụ thể
        await updateSchemaTools(selectedSchema, updatedTools);
        console.log(`Đã xóa tool khỏi schema: ${selectedSchema}`);
      } else {
        // Sử dụng updateSetting cho master schema
        let existing;
        if (activeTab === 'app') {
          existing = await getSettingByType('DASHBOARD_SETTING');
        } else if (activeTab === 'research-bpo') {
          existing = await getSettingByType('RESEARCH_BPO_SETTING');
        } else if (activeTab === 'training-productivity') {
          existing = await getSettingByType('TRAINING_PRODUCTIVITY_SETTING');
        } else {
          existing = await getSettingByType('DASHBOARD_SETTING');
        }

        await updateSetting({
          ...existing,
          setting: updatedTools
        });
        console.log('Tool deleted successfully from master schema');
      }
    } catch (error) {
      console.error('Lỗi khi xóa tool:', error);
      // Rollback nếu có lỗi
      setTools(tools);
    }
  };

  // Resource Panel handlers
  const handleUpdateResource = async (updatedResource) => {
    // Update local state immediately
    const updatedResources = resources.map(resource =>
      resource.id === updatedResource.id ? updatedResource : resource
    );
    setResources(updatedResources);

    // Save to backend
    try {
      const resourceData = {
        resources: updatedResources,
        pinnedResourceId: pinnedResourceId
      };

      await updateSetting({
        id: resourcesSettingId,
        type: 'DASHBOARD_RESOURCES',
        setting: resourceData
      });
    } catch (error) {
      console.error('Error updating resource:', error);
      // Rollback on error
      setResources(resources);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    // Update local state immediately
    const updatedResources = resources.filter(resource => resource.id !== resourceId);
    setResources(updatedResources);

    // If the deleted resource was pinned, unpin it
    const newPinnedResourceId = pinnedResourceId === resourceId ? null : pinnedResourceId;
    setPinnedResourceId(newPinnedResourceId);

    // Save to backend
    try {
      const resourceData = {
        resources: updatedResources,
        pinnedResourceId: newPinnedResourceId
      };

      await updateSetting({
        id: resourcesSettingId,
        type: 'DASHBOARD_RESOURCES',
        setting: resourceData
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      // Rollback on error
      setResources(resources);
      setPinnedResourceId(pinnedResourceId);
    }
  };

  const handleCreateResource = async (newResource) => {
    // Update local state immediately
    const updatedResources = [...resources, newResource];
    setResources(updatedResources);

    // Save to backend
    try {
      const resourceData = {
        resources: updatedResources,
        pinnedResourceId: pinnedResourceId
      };

      await updateSetting({
        id: resourcesSettingId,
        type: 'DASHBOARD_RESOURCES',
        setting: resourceData
      });
    } catch (error) {
      console.error('Error creating resource:', error);
      // Rollback on error
      setResources(resources);
    }
  };

  const handleUpdatePinnedResource = async (newPinnedResourceId) => {

    setPinnedResourceId(newPinnedResourceId);

    // Save pinned resource info to settings
    try {
      const resourceData = {
        resources: resources,
        pinnedResourceId: newPinnedResourceId
      };


      const result = await updateSetting({
        id: resourcesSettingId,
        type: 'DASHBOARD_RESOURCES',
        setting: resourceData
      });

    } catch (error) {
     
    }
  };
  const handleCancel = () => {
    setEditingTool(null);
  };

  const handleAdd = () => {
    if (newTool.name.trim() && newTool.description.trim() && newTool.description.length <= 50) {
      const tool = {
        ...newTool,
        id: `tool-${Date.now()}`,
        tags: newTool.tags || [],
      };
      const updatedTools = [...tools, tool];
      setTools(updatedTools);
      setNewTool({ title: '', description: '', icon: '🛠️', tags: [] });
      setShowAddForm(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewTool({ title: '', description: '', icon: '🛠️', tags: [], enterUrl: '', content1: '', content2: '', showSupport: false, showInfo: false });
  };

  // Handle tag selection for multiple tags
  const handleTagToggle = (tagValue, isEditing = false) => {
    console.log('handleTagToggle called with:', tagValue, isEditing);
    if (isEditing) {
      setEditingTool(prev => {
        const currentTags = prev.tags || [];
        const newTags = currentTags.includes(tagValue)
          ? currentTags.filter(tag => tag !== tagValue)
          : [...currentTags, tagValue];
        return { ...prev, tags: newTags };
      });
    } else {
      setNewTool(prev => {
        const currentTags = prev.tags || [];
        const newTags = currentTags.includes(tagValue)
          ? currentTags.filter(tag => tag !== tagValue)
          : [...currentTags, tagValue];
        return { ...prev, tags: newTags };
      });
    }
  };

  // Load tag options from settings
  const loadTagOptions = async () => {
    try {
      const response = await getSettingByType('TAG_MODULE_MANAGEMENT_SETTING');
      const tags = response.setting;
      setTagOptions(tags);

    } catch (error) {
      console.error('Error loading tag options:', error);
      // Keep default options if loading fails
    }
  };

  // Load trial apps from settings
  const loadTrialApps = async () => {
    try {
      const response = await getSettingByType('DASHBOARD_TRIAL_APPS');
      console.log('response', response);
      if (response?.setting && response.setting.length > 0) {
        setTrialApps(response.setting);
      } else {
        setTrialApps([]);
      }
    } catch (error) {
      console.error('Error loading trial apps:', error);
    }
  };

  // Save trial apps to settings
  const saveTrialApps = async (trialAppsData) => {
    try {
      const existing = await getSettingByType('DASHBOARD_TRIAL_APPS');
      const updatedSettings = {
        ...existing,
        type: 'DASHBOARD_TRIAL_APPS',
        setting: trialAppsData
      };

      if (existing?.id) {
        await updateSetting(updatedSettings);
      } else {
        await createSetting(updatedSettings);
      }

      setTrialApps(trialAppsData);
    } catch (error) {
      console.error('Error saving trial apps:', error);
    }
  };

  // Start trial for an app
  const handleStartTrial = async (app) => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days trial

    const newTrialApp = {
      id: app.id,
      name: app.name,
      description: app.description,
      icon: app.icon,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isActive: true
    };

    const updatedTrialApps = [...trialApps, newTrialApp];
    await saveTrialApps(updatedTrialApps);
    setShowTrialModal(false);
    setSelectedTrialApp(null);
  };

  // Check if app is in trial
  const isAppInTrial = (appId) => {
    return trialApps.some(trial => trial.id === appId && trial.isActive);
  };

  // Handle app click to show appropriate modal
  const handleAppClick = (app) => {
    const existingTrial = trialApps.find(trial => trial.id === app.id);
    if (existingTrial) {
      // App is already in trial, show status
      setSelectedTrialApp({
        ...app,
        isActive: true,
        startDate: existingTrial.startDate,
        endDate: existingTrial.endDate
      });
    } else {
      // App is not in trial, show trial offer
      setSelectedTrialApp({
        ...app,
        isActive: false
      });
    }
    setShowTrialModal(true);
  };

  // Helper: kiểm tra icon là SVG (import từ ICON_CROSSROAD_LIST) hay emoji
  const isSvgIcon = (icon) => typeof icon === 'string' && icon.endsWith('.svg');

  const getIconSrcById = (tool) => {
    if (!tool || !tool.icon) return undefined;

    const found = ICON_CROSSROAD_LIST.find(item => item.id === tool.icon);
    if (!found) {
      console.warn(`Icon not found for tool ${tool.name || tool.id}: ${tool.icon}`);
    }
    return found ? found.icon : undefined;
  };

  // Helper: kiểm tra trial app có hết hạn không
  const isTrialExpired = (trialApp) => {
    return new Date() > new Date(trialApp.endDate);
  };

  // Helper: kết hợp danh sách app từ schema hiện tại với tên/icon từ schema master
  const combineAppsWithMasterInfo = async (currentSchemaApps) => {
    try {
      
      // Lấy trial data từ DASHBOARD_TRIAL_APPS (chỉ từ schema hiện tại, không phải master)
      let trialData = [];
      if (selectedSchema && selectedSchema !== 'master') {
        try {
          const trialResponse = await getSettingByType('DASHBOARD_TRIAL_APPS');
          trialData = trialResponse?.setting || [];
          
          // Filter active trials (theo logic của Dashboard.jsx)
          const activeTrials = trialData.filter(trial => {
            if (!trial.isActive) return false;
            return !isTrialExpired(trial);
          });
          trialData = activeTrials;
        } catch (error) {
        }
      }
      
      // Nếu đang ở schema master, chỉ đảm bảo có đầy đủ thông tin (không có trial data)
      if (selectedSchema === 'master') {
        // Khi ở master schema, currentSchemaApps đã là dữ liệu từ master
        // Chỉ cần đảm bảo có đầy đủ các field cần thiết
        const enhancedApps = currentSchemaApps.map(app => ({
          ...app,
          // Đảm bảo có đầy đủ các field cần thiết
          name: app.name || app.title || 'Unnamed App',
          description: app.description || '',
          icon: app.icon || '🛠️',
          content1: app.content1 || '',
          shortcut: app.shortcut || '',
          tags: app.tags || [],
          order: app.order || 0,
          visibility: app.visibility !== undefined ? app.visibility : true,
          enabled: app.enabled !== undefined ? app.enabled : true,
        }));
        return enhancedApps;
      }
      
      // Gọi API lấy danh sách app từ schema master
      const masterResponse = await getSchemaTools('master');
      const masterAppsList = masterResponse?.setting || [];
 setMasterAppsList(masterAppsList);

      if (!masterAppsList || masterAppsList.length === 0) {

        return currentSchemaApps;
      }

      // Kết hợp current apps với master data và trial data
      const combinedApps = currentSchemaApps.map(currentApp => {
        // Tìm app tương ứng trong master apps
        const masterApp = masterAppsList.find(masterApp => masterApp.id === currentApp.id);
        
        // Tìm trial data cho app này (chỉ từ schema hiện tại)
        const trialInfo = trialData.find(trial => trial.id === currentApp.id);

        if (masterApp) {
          // Nếu có trial version, thay thế bằng trial version
          if (trialInfo) {
            return {
              ...trialInfo,
              // Giữ lại các field từ current app
              tag: "Trial",
              isTrial: true,
              trialEndDate: trialInfo.endDate,
              // Lấy các field từ master
              content1: masterApp.content1,
              shortcut: masterApp.shortcut,
              tags: masterApp.tags,
              order: masterApp.order,
              visibility: masterApp.visibility,
              enabled: masterApp.enabled,
            };
          }
          
          // Nếu không có trial, kết hợp với master data
          return {
            ...currentApp,
            name: masterApp.name,
            description: masterApp.description,
            icon: masterApp.icon,
            content1: masterApp.content1,
            shortcut: masterApp.shortcut,
            tags: masterApp.tags,
            order: masterApp.order,
            visibility: masterApp.visibility,
            enabled: masterApp.enabled,
          };
        }

        // Nếu không tìm thấy trong master, nhưng có trial data
        if (trialInfo) {
          return {
            ...trialInfo,
            // Giữ lại các field từ current app
            tag: "Trial",
            isTrial: true,
            trialEndDate: trialInfo.endDate,
          };
        }

        // Nếu không có master data và không có trial data, giữ nguyên
        return currentApp;
      });

      // Thêm trial apps chưa có trong currentSchemaApps (chỉ nếu chưa có trong DASHBOARD_SETTING)
      const currentAppIds = currentSchemaApps.map(app => app.id);
      const newTrialApps = trialData
        .filter(trial => {
          // Chỉ thêm nếu:
          // 1. Chưa có trong currentSchemaApps
          // 2. Chưa có trong masterAppsList (chưa có trong DASHBOARD_SETTING)
          return !currentAppIds.includes(trial.id) && 
                 !masterAppsList.some(masterApp => masterApp.id === trial.id);
        })
        .map(trial => {
          const masterApp = masterAppsList.find(masterApp => masterApp.id === trial.id);
          return {
            ...trial,
            tag: "Trial",
            isTrial: true,
            trialEndDate: trial.endDate,
            // Lấy các field từ master nếu có
            ...(masterApp && {
              content1: masterApp.content1,
              shortcut: masterApp.shortcut,
              tags: masterApp.tags,
              order: masterApp.order,
              visibility: masterApp.visibility,
              enabled: masterApp.enabled,
            })
          };
        });

      // Kết hợp tất cả apps
      const finalApps = [...combinedApps, ...newTrialApps];

      return finalApps;
    } catch (error) {
      console.error('❌ [DEBUG] Error in combineAppsWithMasterInfo:', error);
      // Nếu có lỗi, trả về danh sách gốc
      return currentSchemaApps;
    }
  };

  // Thêm hàm xử lý lưu TOTAL_TOKEN
  const handleSaveTotalToken = async () => {
    const value = Number(newTotalToken.replace(/,/g, ''));
    if (isNaN(value) || value < 0) {
      Modal.error({ title: 'Lỗi', content: 'Vui lòng nhập số hợp lệ!' });
      return;
    }
    const total = await getSettingByType('TOTAL_TOKEN');
    if (total && total.id) {
      await updateSetting({ ...total, setting: value });
    } else {
      await createSetting({ type: 'TOTAL_TOKEN', setting: value });
    }
    setTotalToken(value);
    setShowTokenModal(false);
  };

  // Hàm xử lý thay đổi theme
  const handleThemeChange = (newTheme) => {
    changeTheme(newTheme);
  };

  // Hàm xử lý mở modal chọn màu
  const handleOpenColorModal = async () => {
    try {
      const existing = await getSettingByType('SettingColor');
      console.log('Fetched color setting:', existing);

      if (existing && existing.setting && Array.isArray(existing.setting)) {
        // Validate that each item has id and color properties
        const isValidColorArray = existing.setting.every(item =>
          item && typeof item === 'object' &&
          typeof item.id === 'number' &&
          typeof item.color === 'string'
        );

        if (isValidColorArray) {
          setSelectedColors(existing.setting);
          console.log('Setting colors:', existing.setting);
        } else {
          console.log('Invalid color array structure, using defaults');
        }
      } else {
        console.log('No existing color setting found or invalid format');
      }
    } catch (error) {
      console.error('Lỗi khi lấy cài đặt màu:', error);
    }
    setShowColorModal(true);
  };

  // Hàm xử lý lưu màu
  const handleSaveColors = async () => {
    try {
      console.log('Saving colors:', selectedColors);
      const existing = await getSettingByType('SettingColor');
      console.log('Existing setting:', existing);

      if (existing && existing.id) {
        const updatedSetting = { ...existing, setting: selectedColors };
        console.log('Updating setting:', updatedSetting);
        await updateSetting(updatedSetting);
      } else {
        const newSetting = { type: 'SettingColor', setting: selectedColors };
        console.log('Creating new setting:', newSetting);
        await createSetting(newSetting);
      }
      setShowColorModal(false);
    } catch (error) {
      console.error('Lỗi khi lưu cài đặt màu:', error);
    }
  };

  // Hàm xử lý mở modal dashboard colors
  const handleOpenBackgroundModal = async () => {
    try {
      const existing = await getSettingByType('DASHBOARD_COLORS');
      console.log('Fetched dashboard color setting:', existing);

      if (existing && existing.setting && typeof existing.setting === 'object') {
        const { background } = existing.setting;
        if (background && background.gradient && background.gridColor !== undefined && background.gridOpacity !== undefined) {
          setDashboardColors({ background });
          console.log('Setting dashboard colors:', existing.setting);
        } else {
          console.log('Invalid dashboard colors structure, using current state');
        }
      } else {
        console.log('No existing dashboard color setting found, using current state');
      }
    } catch (error) {
      console.error('Lỗi khi lấy cài đặt màu dashboard:', error);
    }
    setShowBackgroundModal(true);
  };

  // Hàm xử lý lưu dashboard colors
  const handleSaveBackgroundColors = async () => {
    try {
      console.log('Saving dashboard colors:', dashboardColors);
      const existing = await getSettingByType('DASHBOARD_COLORS');
      console.log('Existing dashboard setting:', existing);

      if (existing && existing.id) {
        const updatedSetting = { ...existing, setting: dashboardColors };
        console.log('Updating dashboard setting:', updatedSetting);
        await updateSetting(updatedSetting);
      } else {
        const newSetting = { type: 'DASHBOARD_COLORS', setting: dashboardColors };
        console.log('Creating new dashboard setting:', newSetting);
        await createSetting(newSetting);
      }
      setShowBackgroundModal(false);
    } catch (error) {
      console.error('Lỗi khi lưu cài đặt màu dashboard:', error);
    }
  };

  // Hàm xử lý hướng dẫn sử dụng
  const handleShowGuide = () => {
    setShowGuideModal(true);
  };

  // Hàm xử lý liên hệ
  const handleContact = () => {
    setShowContactModal(true);
  };

  // Hàm xử lý mở modal guideline settings
  const handleOpenGuidelineModal = async () => {
    try {
      console.log('Opening guideline modal...');
      const existing = await getSettingByType('GUIDELINE_SETTING');
      console.log('Existing guideline setting:', existing);

      if (existing && existing.setting) {
        const { imageUrl, markdownText } = existing.setting;
        console.log('Loading existing guideline data:', { imageUrl, markdownText });
        setGuidelineImageUrl(imageUrl || '');
        setGuidelineMarkdown(markdownText || '');
      } else {
        console.log('No existing guideline setting found, using defaults');
        setGuidelineImageUrl('');
        setGuidelineMarkdown('');
      }
    } catch (error) {
      console.error('Error loading guideline settings:', error);
      setGuidelineImageUrl('');
      setGuidelineMarkdown('');
    }
    setShowGuidelineModal(true);
  };

  // Hàm xử lý upload image
  const handleImageUpload = (file) => {
    console.log('Image upload triggered:', file);
    if (file && file.type.startsWith('image/')) {
      console.log('Valid image file detected:', file.name, file.type, file.size);
      setGuidelineImage(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('Image preview URL created');
        setGuidelineImageUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      console.log('Invalid file type:', file?.type);
      Modal.error({ title: 'Lỗi', content: 'Vui lòng chọn file hình ảnh!' });
    }
    return false; // Prevent default upload behavior
  };

  // Handle file select: only set preview and remember file. Upload happens on Save
  const handleTopbarBgFileUpload = (file) => {
    if (!file || !file.type?.startsWith('image/')) {
      Modal.error({ title: 'Lỗi', content: 'Vui lòng chọn file hình ảnh!' });
      return false;
    }
    setTopbarBgPendingFile(file);
    // File preview
    const localUrl = URL.createObjectURL(file);
    setTopbarBgPreviewUrl(localUrl);
    setTopbarBgDraftUrl('');
    return false; // Prevent default upload
  };

  // Hàm xử lý lưu guideline settings
  const handleSaveGuideline = async () => {
    try {
      console.log('Saving guideline settings...');
      console.log('Current state:', {
        guidelineImage,
        guidelineMarkdown,
        guidelineImageUrl
      });

      // For now, we'll use the preview URL as the image URL
      // In a real implementation, you'd upload the file to a server
      const imageUrl = guidelineImageUrl;

      const guidelineData = {
        imageUrl,
        markdownText: guidelineMarkdown
      };

      console.log('Guideline data to save:', guidelineData);

      const existing = await getSettingByType('GUIDELINE_SETTING');
      console.log('Existing setting for update:', existing);

      if (existing && existing.id) {
        const updatedSetting = { ...existing, setting: guidelineData };
        console.log('Updating existing setting:', updatedSetting);
        await updateSetting(updatedSetting);
        console.log('Guideline setting updated successfully');
      } else {
        const newSetting = { type: 'GUIDELINE_SETTING', setting: guidelineData };
        console.log('Creating new setting:', newSetting);
        await createSetting(newSetting);
        console.log('Guideline setting created successfully');
      }

      setShowGuidelineModal(false);
      Modal.success({ title: 'Thành công', content: 'Cài đặt guideline đã được lưu!' });
    } catch (error) {
      console.error('Error saving guideline settings:', error);
      Modal.error({ title: 'Lỗi', content: 'Có lỗi xảy ra khi lưu cài đặt guideline!' });
    }
  };

  // Hàm xử lý mở modal background settings
  const handleOpenBackgroundSettingsModal = async () => {
    try {
      const existing = await getSchemaBackground('master');
      console.log('Fetched dashboard background setting from master schema:', existing);

      if (existing && existing.setting && typeof existing.setting === 'string') {
        setBackgroundImageUrl(existing.setting);
        console.log('Setting background URL:', existing.setting);
      } else {
        setBackgroundImageUrl('/simple_background.png');
        console.log('No existing background found, using default');
      }
    } catch (error) {
      console.error('Lỗi khi lấy cài đặt background dashboard:', error);
      setBackgroundImageUrl('/simple_background.png');
    }
    setShowBackgroundSettingsModal(true);
  };

  // Hàm xử lý lưu background settings
  const handleSaveBackgroundSettings = async () => {
    try {
      console.log('Saving dashboard background:', backgroundImageUrl);

      // Check if setting already exists using regular getSettingByType
      const existing = await getSettingByType('DASHBOARD_BACKGROUND');

      if (existing && existing.id) {
        console.log('Updating existing background setting...');
        await updateSetting({
          id: existing.id,
          type: 'DASHBOARD_BACKGROUND',
          setting: backgroundImageUrl
        });
      } else {
        console.log('Creating new background setting...');
        await createSetting({
          type: 'DASHBOARD_BACKGROUND',
          setting: backgroundImageUrl
        });
      }

      setShowBackgroundSettingsModal(false);
      Modal.success({ title: 'Thành công', content: 'Cài đặt hình nền đã được lưu!' });
    } catch (error) {
      console.error('Lỗi khi lưu cài đặt background dashboard:', error);
      Modal.error({ title: 'Lỗi', content: 'Có lỗi xảy ra khi lưu cài đặt hình nền!' });
    }
  };

  // Hàm xử lý scroll
  const handleScroll = (direction) => {
    const contentContainer = document.querySelector(`.${styles.contentContainer}`);
    if (contentContainer) {
      const { scrollTop, scrollHeight, clientHeight } = contentContainer;

      if (direction === 'down') {
        // Scroll xuống 300px hoặc đến cuối
        const targetScroll = Math.min(scrollTop + 300, scrollHeight - clientHeight);
        contentContainer.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      } else {
        // Scroll lên 300px hoặc đến đầu
        const targetScroll = Math.max(scrollTop - 300, 0);
        contentContainer.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
    }
  };
  const isSchemaMaster = localStorage.getItem('selectedSchemaId');

  const resetDuLieuDemo = async () => {
    try {
      const BASE_URL = import.meta.env.VITE_API_URL;
      const resp = await instance.post(`${BASE_URL}/api/path/reset-from-external-db`);
      if (resp.data.data.success) {
        Modal.success({ title: 'Thành công', content: 'Đã reset dữ liệu thành công.' });
        navigate('/');
      }

    } catch (err) {
      console.error('Reset dữ liệu demo lỗi:', err);
      Modal.error({ title: 'Lỗi', content: err.message || 'Reset dữ liệu thất bại' });
    }
  };

  // Function để refresh tools từ schema hiện tại
  const refreshToolsFromSchema = async () => {
    if (currentUser?.isSuperAdmin && selectedSchema) {
      setIsSwitchingSchema(true);
      try {
        if (selectedSchema === 'master') {
          // Load từ setting cho schema master
          await fetchDashboardSetting();
        } else {
          const schemaToolsResponse = await getSchemaTools(selectedSchema.path);

          if (schemaToolsResponse && schemaToolsResponse.setting && schemaToolsResponse.setting.length > 0) {
            // Kết hợp với thông tin từ schema master
            const combinedApps = await combineAppsWithMasterInfo(schemaToolsResponse.setting);
            setTools(combinedApps);
          } else {
            // Fallback: sử dụng logic lọc cũ
            let schemaSpecificApps;
            if (selectedSchema.path === 'dev') {
              schemaSpecificApps = dashboardApps;
            } else if (selectedSchema.path === 'test') {
              schemaSpecificApps = dashboardApps.filter(app =>
                ['data-manager', 'k9', 'adminApp'].includes(app.id)
              );
            } else if (selectedSchema.path === 'staging') {
              schemaSpecificApps = dashboardApps.filter(app =>
                app.tag !== 'under-development'
              );
            } else {
              schemaSpecificApps = dashboardApps.filter(app =>
                app.tag === 'Working' || app.tag === 'On-demand'
              );
            }
            // Kết hợp với thông tin từ schema master
            const combinedApps = await combineAppsWithMasterInfo(schemaSpecificApps);
            setTools(combinedApps);
          }
        }
      } catch (error) {
        console.error('Lỗi khi refresh tools từ schema:', error);
        // Fallback: sử dụng logic lọc cũ
        let schemaSpecificApps;
        if (selectedSchema.path === 'dev') {
          schemaSpecificApps = dashboardApps;
        } else if (selectedSchema.path === 'test') {
          schemaSpecificApps = dashboardApps.filter(app =>
            ['data-manager', 'k9', 'adminApp'].includes(app.id)
          );
        } else if (selectedSchema.path === 'staging') {
          schemaSpecificApps = dashboardApps.filter(app =>
            app.tag !== 'under-development'
          );
        } else {
          schemaSpecificApps = dashboardApps.filter(app =>
            app.tag === 'Working' || app.tag === 'On-demand'
          );
        }
        // Kết hợp với thông tin từ schema master
        const combinedApps = await combineAppsWithMasterInfo(schemaSpecificApps);
        setTools(combinedApps);
      } finally {
        setIsSwitchingSchema(false);
      }
    }
  };

  // Thêm useEffect để hiển thị loading 1 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowToolsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Sync active tab from URL param
  // useEffect(() => {
  //   if (tab) {
  //     setActiveTab(tab);
  //     navigate(`/dashboard/${tab}`);
  //   } else {
  //     setActiveTab('app');
  //     navigate(`/dashboard/app`);
  //   }
  // }, [tab]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    navigate(`/dashboard/${newTab}`);
  };

  // Real-time clock
  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const activeTabMeta = useMemo(() => {
    if (activeTab === 'app') {
      return {
        title: '',
        desc: ''
      };
    }
    if (activeTab === 'research-bpo') {
      return {
        title: 'DV Nghiên cứu & BPO',
        desc: 'Nghiên cứu thị trường, phân tích chuyên sâu mô hình kinh doanh & các dịch vụ bảo đảm/ hỗ trợ Outsource'
      };
    }
    if (activeTab === 'training-productivity') {
      return {
        title: 'Đào tạo & Năng suất 4.0',
        desc: 'Đào tạo ứng dụng AI & các công nghệ 4.0 nhằm gia tăng năng suất công việc cho nhân viên'
      };
    }
    if (activeTab === 'n8n') {
      return {
        title: 'N8N Workflow Automation',
        desc: 'Tự động hóa quy trình làm việc với N8N'
      };
    }
    return { title: 'App Dashboard', desc: '' };
  }, [activeTab]);

  const formatVietnameseDateTime = (date) => {
    const twoDigit = (num) => String(num).padStart(2, '0');
    const hours = twoDigit(date.getHours());
    const minutes = twoDigit(date.getMinutes());
    const seconds = twoDigit(date.getSeconds());
    const dayOfMonth = date.getDate();
    const monthNumber = date.getMonth() + 1;
    const fullYear = date.getFullYear();
    return `${hours}:${minutes}:${seconds}  Ngày ${dayOfMonth} Tháng ${monthNumber} Năm ${fullYear}`;
  };

  // Hàm xử lý cho tab Research BPO
  const handleAddResearchBpo = async () => {
    if (newToolResearchBpo.name.trim() && newToolResearchBpo.description.trim() && newToolResearchBpo.description.length <= 50) {
      const tool = {
        ...newToolResearchBpo,
        id: uuidv4(), // Sử dụng UUID
        tags: newToolResearchBpo.tags || [],
      };
      const updatedTools = [...tools, tool];
      setTools(updatedTools);
      setNewToolResearchBpo({ name: '', description: '', icon: '🛠️', tags: [], enterUrl: '', content1: '', content2: '', showSupport: false, showInfo: false });
      setShowAddFormResearchBpo(false);

      // Lưu lên backend - sử dụng schema-specific API nếu không phải master schema
      try {
        if (selectedSchema && selectedSchema !== 'master') {
          // Sử dụng updateSchemaTools cho schema cụ thể
          await updateSchemaTools(selectedSchema, updatedTools);
          console.log(`Đã thêm tool vào schema: ${selectedSchema}`);
        } else {
          // Sử dụng updateSetting cho master schema
          const existing = await getSettingByType('RESEARCH_BPO_SETTING');
          await updateSetting({
            ...existing,
            setting: updatedTools
          });
          console.log('Đã thêm tool vào master schema');
        }
      } catch (error) {
        console.error('Lỗi khi lưu RESEARCH_BPO_SETTING:', error);
      }
    }
  };

  const handleCancelAddResearchBpo = () => {
    setShowAddFormResearchBpo(false);
    setNewToolResearchBpo({ name: '', description: '', icon: '🛠️', tags: [], enterUrl: '', content1: '', content2: '', showSupport: false, showInfo: false });
  };

  // Hàm xử lý cho tab Training Productivity
  const handleAddTrainingProductivity = async () => {
    if (newToolTrainingProductivity.name.trim() && newToolTrainingProductivity.description.trim() && newToolTrainingProductivity.description.length <= 50) {
      const tool = {
        ...newToolTrainingProductivity,
        id: uuidv4(), // Sử dụng UUID
        tags: newToolTrainingProductivity.tags || [],
      };
      const updatedTools = [...tools, tool];
      setTools(updatedTools);
      setNewToolTrainingProductivity({ name: '', description: '', icon: '🛠️', tags: [], enterUrl: '', content1: '', content2: '', showSupport: false, showInfo: false });
      setShowAddFormTrainingProductivity(false);

      // Lưu lên backend - sử dụng schema-specific API nếu không phải master schema
      try {
        if (selectedSchema && selectedSchema !== 'master') {
          // Sử dụng updateSchemaTools cho schema cụ thể
          await updateSchemaTools(selectedSchema, updatedTools);
          console.log(`Đã thêm tool vào schema: ${selectedSchema}`);
        } else {
          // Sử dụng updateSetting cho master schema
          const existing = await getSettingByType('TRAINING_PRODUCTIVITY_SETTING');
          await updateSetting({
            ...existing,
            setting: updatedTools
          });
          console.log('Đã thêm tool vào master schema');
        }
      } catch (error) {
        console.error('Lỗi khi lưu TRAINING_PRODUCTIVITY_SETTING:', error);
      }
    }
  };

  const handleCancelAddTrainingProductivity = () => {
    setShowAddFormTrainingProductivity(false);
    setNewToolTrainingProductivity({ name: '', description: '', icon: '🛠️', tags: [], enterUrl: '', content1: '', content2: '', showSupport: false, showInfo: false });
  };

  // Handler cho modal đăng ký tư vấn
  const handleOpenRegistrationModal = (tool) => {
    setRegistrationForm({
      jobTitle: tool.name || '',
      fullName: '',
      contactInfo: '',
      preferredChannel: 'call',
      notes: ''
    });
    setShowRegistrationModal(true);
  };

  const handleRegistrationFormChange = (field, value) => {
    setRegistrationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitRegistration = async () => {
    // Validate form
    if (!registrationForm.fullName.trim()) {
      Modal.error({ title: 'Lỗi', content: 'Vui lòng nhập Họ & Tên!' });
      return;
    }
    if (!registrationForm.contactInfo.trim()) {
      Modal.error({ title: 'Lỗi', content: 'Vui lòng nhập thông tin liên hệ!' });
      return;
    }

    try {
      // Gửi email đăng ký
      await sendRegistrationEmail(registrationForm);

      Modal.success({
        title: 'Đăng ký thành công',
        content: 'Cảm ơn bạn đã đăng ký! Chúng tôi sẽ liên hệ lại sớm nhất có thể.'
      });

      setShowRegistrationModal(false);
      setRegistrationForm({
        jobTitle: '',
        fullName: '',
        contactInfo: '',
        preferredChannel: 'call',
        notes: ''
      });
    } catch (error) {
      console.error('Error submitting registration:', error);
      Modal.error({ title: 'Lỗi', content: 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại!' });
    }
  };

  const handleCancelRegistration = () => {
    setShowRegistrationModal(false);
    setRegistrationForm({
      jobTitle: '',
      fullName: '',
      contactInfo: '',
      preferredChannel: 'call',
      notes: ''
    });
  };

  // KPI Benchmark handlers
  const loadKpiBenchmarks = async () => {
    try {
      const data = await getAllKpiBenchmark();
      setKpiBenchmarks(data);
    } catch (error) {
      console.error('Lỗi khi tải KPI Benchmark:', error);
      Modal.error({ title: 'Lỗi', content: 'Không thể tải danh sách KPI Benchmark' });
    }
  };

  const handleOpenKpiBenchmarkModal = async () => {
    await loadKpiBenchmarks();
    setShowKpiBenchmarkModal(true);
  };

  const handleCloseKpiBenchmarkModal = () => {
    setShowKpiBenchmarkModal(false);
  };

  const handleOpenKpiBenchmarkFormModal = (benchmark = null) => {
    if (benchmark) {
      setEditingKpiBenchmark(benchmark);
    } else {
      setEditingKpiBenchmark({
        name: '',
        code: '',
        description: '',
        category: '',
        data: {
          col1: '', col2: '', col3: '', col4: '', col5: '', col6: '',
          col7: '', col8: '', col9: '', col10: '', col11: '', col12: ''
        }
      });
    }
    setShowKpiBenchmarkFormModal(true);
  };

  const handleCloseKpiBenchmarkFormModal = () => {
    setShowKpiBenchmarkFormModal(false);
    setEditingKpiBenchmark(null);
  };

  const handleCreateKpiBenchmark = async () => {
    try {
      const dataToSend = {
        ...editingKpiBenchmark,
        user_create: currentUser?.email || 'unknown',
        created_at: new Date().toISOString()
      };

      await createNewKpiBenchmark(dataToSend);
      await loadKpiBenchmarks();
      handleCloseKpiBenchmarkFormModal();
      Modal.success({ title: 'Thành công', content: 'Tạo KPI Benchmark thành công' });
    } catch (error) {
      console.error('Lỗi khi tạo KPI Benchmark:', error);
      Modal.error({ title: 'Lỗi', content: 'Không thể tạo KPI Benchmark' });
    }
  };

  const handleEditKpiBenchmark = (benchmark) => {
    handleOpenKpiBenchmarkFormModal(benchmark);
  };

  const handleUpdateKpiBenchmark = async () => {
    try {
      await updateKpiBenchmark(editingKpiBenchmark);
      await loadKpiBenchmarks();
      handleCloseKpiBenchmarkFormModal();
      Modal.success({ title: 'Thành công', content: 'Cập nhật KPI Benchmark thành công' });
    } catch (error) {
      console.error('Lỗi khi cập nhật KPI Benchmark:', error);
      Modal.error({ title: 'Lỗi', content: 'Không thể cập nhật KPI Benchmark' });
    }
  };

  const handleDeleteKpiBenchmark = async (id) => {
    try {
      await deleteKpiBenchmark(id);
      await loadKpiBenchmarks();
      Modal.success({ title: 'Thành công', content: 'Xóa KPI Benchmark thành công' });
    } catch (error) {
      console.error('Lỗi khi xóa KPI Benchmark:', error);
      Modal.error({ title: 'Lỗi', content: 'Không thể xóa KPI Benchmark' });
    }
  };

  // Hàm xử lý mở modal context instruction settings
  const handleOpenContextInstructionModal = async () => {
    try {
      const existing = await getSettingByType('CONTEXT_INSTRUCTION_SETTING');

      if (existing && existing.setting) {
        setContextInstruction(existing.setting.instruction || '');
      } else {
        setContextInstruction('');
      }

      setShowContextInstructionModal(true);
    } catch (error) {
      console.error('Error loading context instruction settings:', error);
      setContextInstruction('');
      setShowContextInstructionModal(true);
    }
  };

  // Hàm xử lý mở modal topbar theme settings
  const handleOpenTopbarThemeModal = async () => {
    try {
      const existing = await getSettingByType('TOPBAR_THEME');
      if (existing && existing.setting) {
        setTopbarTheme(existing.setting);
      }
      setShowTopbarThemeModal(true);
    } catch (error) {
      console.error('Error loading topbar theme settings:', error);
      setShowTopbarThemeModal(true);
    }
  };

  // Hàm xử lý mở modal status bar theme settings
  const handleOpenStatusBarThemeModal = async () => {
    try {
      const existing = await getSettingByType('STATUS_BAR_THEME');
      if (existing && existing.setting) {
        setStatusBarTheme(existing.setting);
        setTempStatusBarTheme(existing.setting);
      } else {
        setTempStatusBarTheme(statusBarTheme);
      }
      setShowStatusBarThemeModal(true);
    } catch (error) {
      console.error('Error loading status bar theme settings:', error);
      setTempStatusBarTheme(statusBarTheme);
      setShowStatusBarThemeModal(true);
    }
  };

  // Hàm xử lý lưu topbar theme settings
  const handleSaveTopbarTheme = async (selectedTheme) => {
    try {

      const existing = await getSettingByType('TOPBAR_THEME');

      if (existing && existing.id) {
        await updateSetting({
          ...existing,
          setting: selectedTheme
        });
      } else {
        await createSetting({
          type: 'TOPBAR_THEME',
          setting: selectedTheme
        });
      }

      setTopbarTheme(selectedTheme);
      setShowTopbarThemeModal(false);
      Modal.success({ title: 'Thành công', content: 'Đã lưu theme topbar!' });
    } catch (error) {
      console.error('Error saving topbar theme:', error);
      Modal.error({ title: 'Lỗi', content: 'Có lỗi xảy ra khi lưu theme topbar!' });
    }
  };

  // Hàm xử lý lưu status bar theme settings
  const handleSaveStatusBarTheme = async (selectedTheme) => {
    try {

      const existing = await getSettingByType('STATUS_BAR_THEME');

      if (existing && existing.id) {
        await updateSetting({
          ...existing,
          setting: selectedTheme
        });
      }

      setStatusBarTheme(selectedTheme);
      setShowStatusBarThemeModal(false);
      Modal.success({ title: 'Thành công', content: 'Đã lưu theme status bar!' });
    } catch (error) {
      console.error('Error saving status bar theme:', error);
      Modal.error({ title: 'Lỗi', content: 'Có lỗi xảy ra khi lưu theme status bar!' });
    }
  };

  // Hàm xử lý hủy status bar theme settings
  const handleCancelStatusBarTheme = () => {
    setTempStatusBarTheme(statusBarTheme);
    setShowStatusBarThemeModal(false);
  };

  // Hàm xử lý lưu context instruction settings
  const handleSaveContextInstruction = async () => {
    try {
      const settingData = {
        type: 'CONTEXT_INSTRUCTION_SETTING',
        setting: {
          instruction: contextInstruction
        }
      };
      const existing = await getSettingByType('CONTEXT_INSTRUCTION_SETTING');

      let result;
      if (existing && existing.id) {
        result = await updateSetting({
          ...settingData,
          id: existing.id
        });
      } else {
        result = await createSetting(settingData);
      }

      setShowContextInstructionModal(false);

      // Show success message
    } catch (error) {
      console.error('Error saving context instruction settings:', error);
    }
  };

  // Tool Settings functions
  const handleOpenToolSettingsModal = async () => {
    try {
      // Initialize temp settings from current tools
      const tempSettings = {};
      tools.forEach(tool => {
        tempSettings[tool.id] = {
          visibility: tool.visibility || 'public',
          enabled: tool.enabled !== false,
          featured: tool.featured || false,
          directDownload: tool.directDownload || false,
          downloadUrl: tool.downloadUrl || ""
        };
      });
      setTempToolSettings(tempSettings);
      setShowToolSettingsModal(true);
    } catch (error) {
      console.error('Error loading tool settings:', error);
    }
  };

  const handleToolSettingChange = (toolId, field, value) => {
    setTempToolSettings(prev => ({
      ...prev,
      [toolId]: {
        ...prev[toolId],
        [field]: value
      }
    }));
  };

  const handleSaveToolSettings = async () => {
    try {
      // Update tools with new settings
      const updatedTools = tools.map(tool => {
        const toolSetting = tempToolSettings[tool.id];
        if (toolSetting) {
          return {
            ...tool,
            visibility: toolSetting.visibility,
            enabled: toolSetting.enabled,
            featured: toolSetting.featured,
            directDownload: toolSetting.directDownload,
            downloadUrl: toolSetting.downloadUrl
          };
        }
        return tool;
      });

      // Update DASHBOARD_SETTING
      const settingData = {
        type: 'DASHBOARD_SETTING',
        setting: updatedTools
      };

      const existing = await getSettingByType('DASHBOARD_SETTING');
      let result;
      if (existing && existing.id) {
        result = await updateSetting({
          ...settingData,
          id: existing.id
        });
      } else {
        result = await createSetting(settingData);
      }

      // Update local tools state
      setTools(updatedTools);
      setShowToolSettingsModal(false);
      message.success('Cài đặt tool đã được lưu thành công!');
    } catch (error) {
      console.error('Error saving tool settings:', error);
      message.error('Có lỗi khi lưu cài đặt tool!');
    }
  };

  const handleCancelToolSettings = () => {
    setTempToolSettings({});
    setShowToolSettingsModal(false);
  };

  // Menu items cho Settings dropdown
  const settingsMenuItems = [
    ...(currentUser?.isSuperAdmin ? [{
      key: 'tool-reorder',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowUpDown size={16} />
          <span>Sắp xếp công cụ</span>
        </div>
      ),
      onClick: () => setShowToolReorderModal(true),
    }] : []),
    ...(currentUser?.isSuperAdmin ? [{
      key: 'task-checklist',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <QuestionMark size={16} />
          <span>Task Checklist</span>
        </div>
      ),
      onClick: () => setShowTaskManagementModal(true),
    }] : []),
    ...(currentUser?.isSuperAdmin ? [{
      key: 'topbar-bg-image',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={16} />
          <span>Cài đặt ảnh nền Topbar</span>
        </div>
      ),
      onClick: () => {
        // Initialize draft with current value; reset temp states
        setTopbarBgDraftUrl(topbarBgImageUrl || '');
        if (topbarBgPreviewUrl) URL.revokeObjectURL(topbarBgPreviewUrl);
        setTopbarBgPreviewUrl('');
        setTopbarBgPendingFile(null);
        setShowTopbarBgModal(true);
      },
    }] : []),
    ...(currentUser?.isSuperAdmin ? [{
      key: 'topbar-text-color',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={16} />
          <span>Cài đặt màu chữ Topbar</span>
        </div>
      ),
      onClick: () => {
        setTempTopbarTextColor(topbarTextColor || '');
        setShowTopbarTextColorModal(true);
      },
    }] : []),
    ...(currentUser?.isSuperAdmin ? [{
      key: 'statusbar-theme',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={16} />
          <span>Theme Status Bar</span>
        </div>
      ),
      onClick: handleOpenStatusBarThemeModal,
    }] : []),
    ...(currentUser?.isSuperAdmin ? [{
      key: 'tag-management-settings',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined size={16} />
          <span>Cài đặt Tag Module</span>
        </div>
      ),
      onClick: () => setShowTagManagementModal(true),
    }] : []),
    ...(currentUser?.isSuperAdmin ? [{
      key: 'tool-settings',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined size={16} />
          <span>Cài đặt Tool</span>
        </div>
      ),
      onClick: handleOpenToolSettingsModal,
    }] : []),
  ];

  return (
    <div
      className={styles.dashboardRoot}
      style={{
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        '--custom-hover-color': selectedColors[0]?.color || '#13C2C2'
        // '--dashboard-grid-color': dashboardColors.background.gridColor,
        // '--dashboard-grid-opacity': dashboardColors.background.gridOpacity
      }}
    >
      {/* Header - ẩn khi activeTab === 'n8n' */}
      {activeTab !== 'n8n' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '5rem',
          background: topbarBgImageUrl ? `url(${topbarBgImageUrl})` : topbarTheme.background,
          backgroundSize: topbarBgImageUrl ? 'cover' : undefined,
          backgroundPosition: topbarBgImageUrl ? 'center' : undefined,
          ...(topbarTheme.name === 'light' && {
            borderBottom: '4px solid #E0E0E0'
          }),

        }}>
          <div className={styles.headerWrapper} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 1rem', height: '5rem' }}>
            <div className={styles.headerContent}>
              {editingTitle ? (
                <div className={styles.headerEditRow}>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={styles.headerInput}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingTitle(false);
                      if (e.key === 'Escape') {
                        setTitle('Business Canvas');
                        setEditingTitle(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => setEditingTitle(false)}
                    className={styles.headerCheckBtn}
                  >
                    <Check className={styles.iconCheck} />
                  </button>
                </div>
              ) : (
                <div className={styles.headerRow}>
                  <img src={topbarTheme.iconApp} alt="logo" width={30} height={30} />
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: topbarTextColor || (topbarTheme?.name === 'dark' ? topbarTheme?.superAdminColor : topbarTheme?.textColor) }}>WIKI CANVAS </span>
                  {currentUser?.isSuperAdmin && (
                        <span onClick={e => { navigate('/admin-path') }}
                          style={{
                            // backgroundColor: 'var(--bg-tertiary)',
                            padding: '5px 10px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            color:topbarTextColor ||   topbarTheme.superAdminColor,
                          }}>
                          Super Admin
                          {/* <SettingOutlined style={{ fontSize: 18, cursor: 'pointer' }} /> */}
                        </span>
                      )}
                </div>
              )}

            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {
                isMobile ? (
                  <>
                    {/* <Select
                      options={[
                        {
                          label: 'Canvas Dashboard',
                          value: 'app'
                        },

                        {
                          label: 'DV Nghiên cứu & BPO',
                          value: 'research-bpo'
                        },


                        {
                          label: 'Đào tạo & Năng suất',
                          value: 'training-productivity'
                        },
                      ]}
                      value={activeTab}
                      onChange={(value) => handleTabChange(value)}
                    /> */}
                  </>
                ) : (
                  <>
                    {/* <button
                      className={`${styles.tabButtonInline} ${activeTab === 'app' ? styles.tabActiveInline : ''}`}
                      onClick={() => handleTabChange('app')}
                    >
                      <span>Canvas Dashboard</span>
                    </button> */}
                    {/* <button
                      className={`${styles.tabButtonInline} ${activeTab === 'research-bpo' ? styles.tabActiveInline : ''}`}
                      onClick={() => handleTabChange('research-bpo')}
                    >
                      <span>DV Nghiên cứu & BPO</span>
                    </button>
                    <button
                      className={`${styles.tabButtonInline} ${activeTab === 'training-productivity' ? styles.tabActiveInline : ''}`}
                      onClick={() => handleTabChange('training-productivity')}
                    >
                      <span>Đào tạo & Năng suất</span>
                    </button> */}
                  </>
                )
              }

            </div>
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              {
                !isMobile && <>
                  {/* <Button
                    onClick={() => {
                      window.open(`${import.meta.env.VITE_DOMAIN_URL}/process-guide`, '_blank');
                    }}
                    style={{ color: topbarTheme.textColor, backgroundColor: topbarTheme.background, border: 'none' }}
                  >
                    <span style={{
                      fontSize: '16px',
                      color: topbarTheme.textColor,
                    }}>
                      Tài liệu Sản phẩm
                    </span>
                  </Button>
                  <Tooltip
                    title={
                      <div style={{ width: 500 }}>
                        {usedTokenApp.length === 0 ? 'Chưa có dữ liệu token' : (
                          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            {usedTokenApp.map(item => {
                              const appInfo = dashboardSettings.find(s => s.id === item.app);
                              return (
                                <li key={item.app}>
                                  {appInfo ? appInfo.name : item.app}: <b>{formatCurrency(item.usedToken || 0)}</b>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    }
                  >
                    <span onClick={e => {
                      if (currentUser?.isSuperAdmin) {
                        e.stopPropagation();
                        setNewTotalToken(totalToken);
                        setShowTokenModal(true);
                      }
                    }
                    }
                      style={{

                        color: topbarTheme.textColor,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        // backgroundColor: theme === 'dark' ? '#334155' : '#EBEBEB',
                        padding: '3px 10px',
                        borderRadius: '10px',
                        width: isMobile ? '170px' : '200px',
                        fontSize: '16px'
                      }}>
                      {/* {(currentUser?.isSuperAdmin) && !isMobile && (
                        <Tooltip title="Cài đặt tổng token">
                          <AI_Meter style={{ marginLeft: 8, fontSize: 18, cursor: 'pointer' }} />
                        </Tooltip>
                      )} */}
                  {/* AICU: {formatCurrency(totalUsed)} / {formatCurrency(totalToken)}*/}
                  {/* {
                      isMobile ? (
                        <span>
                          AI Meter: {((totalUsed / totalToken) * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span>
                          AI Meter
                          (AICU) &nbsp;&nbsp;                          {((totalUsed / totalToken) * 100).toFixed(0)}%

                        </span>
                      )}

                    </span>
                  </Tooltip> */}
                  {( currentUser?.isSuperAdmin) &&
                    <Dropdown
                      menu={{ items: settingsMenuItems }}
                      trigger={['click']}
                      placement="bottomRight"
                    >
                      <Button type="text" style={{ color: topbarTheme.textColor }}>
                        <span style={{
                          fontSize: '16px',
                          color: topbarTextColor,
                        }}>Setting
                        </span>
                      </Button>
                    </Dropdown>}

                  {/* <Button
                    // icon={<SiN8N />}
                    onClick={() => {
                      // setActiveTab('n8n');
                      // navigate('/dashboard/n8n');
                      window.open('https://n8n.sab.io.vn', '_blank');
                    }}
                    style={{ color: topbarTheme.textColor, backgroundColor: topbarTheme.background, border: 'none' }}
                  >
                         <span style={{
                         fontSize: '16px',
                         color: topbarTheme.textColor,
                       }}>                    N8N Playground

                        </span>
                  </Button> */}
                </>
              }

              {/* <ProfileSelect color={topbarTheme.textColor} /> */}

              {
                currentUser ? (
                  <>
                    <div>
                      {/* <Button type="text" style={{ color: topbarTheme.textColor }}>
                        <span style={{ fontSize: '16px', color: topbarTheme.textColor }}>
                          {currentUser?.name + ' - Power User'}
                        </span>
                      </Button> */}
                      <ProfileSelect color={topbarTextColor} />

                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Button type="text" style={{ color: topbarTextColor || topbarTheme.textColor }} onClick={() => {
                        const currentPath = '/login-success';
                        window.open(`${import.meta.env.VITE_API_URL}/login?redirect=${encodeURIComponent(currentPath)}`, '_self');
                      }}>Đăng nhập </Button>
                      {/*<Button type="text" style={{ color: topbarTextColor || topbarTheme.textColor }} onClick={() => {*/}
                      {/*  navigate('/workspace-registration');*/}
                      {/*}}>Đăng ký Power User </Button>*/}
                    </div>
                  </>
                )
              }
            </div>
          </div>
        </div>
      )}

      {/* N8N Full Screen - hiển thị toàn bộ màn hình với hiệu ứng trượt */}
      {activeTab === 'n8n' ? (
        <N8N />
      ) : (
        <>
          {/* Status bar: active tab name (left) and real-time clock (right) */}
          {!isMobile && (
            <div className={styles.tabStatusBarContainer} >
              <div className={styles.tabStatusBar} style={{ backgroundColor: statusBarTheme.background }}>
                {/*<div className={styles.tabStatusLeft}>*/}
                {/*  <span className={styles.tabStatusTitle}>{activeTabMeta.title}</span>*/}
                {/*  {activeTabMeta.desc && <span className={styles.tabStatusSep}> | </span>}*/}
                {/*  {activeTabMeta.desc && <span className={styles.tabStatusDesc}>{activeTabMeta.desc}</span>}*/}
                {/*</div>*/}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {(() => {
                    const filtered = tagOptions?.length > 0 ? tagOptions.filter(opt => (opt.label || '').toLowerCase().includes(tagSearch.toLowerCase())) : [];
                    const maxInline = 6;
                    const inline = filtered.slice(0, maxInline);
                    const overflow = filtered.slice(maxInline);

                    return (
                      <>
                        {/* All option */}
                        <button
                          onClick={() => setSelectedTagFilters([])}
                          style={{
                            padding: '4px 15px',
                            fontSize: 15.5,
                            fontWeight: 600,
                            // border: selectedTagFilters.length === 0 ? `1px solid ${statusBarTheme.textColor}` : '1px solid transparent',
                            borderRadius: 10,
                            background: selectedTagFilters.length === 0 ? ('#E8E8E8' || statusBarTheme.background) : '#ffffff',
                            color: selectedTagFilters.length === 0 ? ('#66666C' || statusBarTheme.textColor) : '#66666C',
                            cursor: 'pointer',
                            boxShadow: selectedTagFilters.length === 0 ? '0px 4px 4px 0px #00000040' : 'none',

                          }}
                        >
                          Tất cả Module
                        </button>

                        {/* Inline tags */}
                        {inline.map(opt => {
                          const isSelected = selectedTagFilters.includes(opt.value);
                          return (
                            <button
                              key={opt.value}
                              onClick={() => {
                                setSelectedTagFilters(prev =>
                                  prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                                );
                              }}
                              style={{
                                // padding: '7px 15px',
                                // fontSize: 15.5,
                                // fontWeight: 600,
                                // border: isSelected ? `1px solid ${statusBarTheme.textColor}` : '1px solid transparent',
                                // borderRadius: 3,
                                // background: statusBarTheme.background,
                                // color: statusBarTheme.textColor,
                                // cursor: 'pointer',

                                padding: '4px 15px',
                                fontSize: 15.5,
                                fontWeight: 600,
                                // border: selectedTagFilters.length === 0 ? `1px solid ${statusBarTheme.textColor}` : '1px solid transparent',
                                borderRadius: 10,
                                background: isSelected ? ('#E8E8E8' || statusBarTheme.background) : '#ffffff',
                                color: isSelected ? ('#66666C' || statusBarTheme.textColor) : '#66666C',
                                cursor: 'pointer',
                                boxShadow: isSelected ? '0px 4px 4px 0px #00000040' : 'none',

                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}

                        {/* 3-dots dropdown for overflow */}
                        {overflow.length > 0 && (
                          <Dropdown
                            trigger={["click"]}
                            placement="bottomLeft"
                            menu={{
                              items: overflow.map(opt => ({
                                key: opt.value,
                                label: (
                                  (() => {
                                    const isSelected = selectedTagFilters.includes(opt.value);
                                    return (
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTagFilters(prev =>
                                            prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                                          );
                                        }}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 10,
                                          padding: '6px 10px',
                                          borderRadius: 10,
                                          background: isSelected ? 'rgba(255,255,255,0.12)' : 'transparent',
                                          border: isSelected ? '1px solid #fff' : '1px solid transparent',
                                          color: 'black'
                                        }}
                                      >
                                        {isSelected && <Check size={14} />}

                                        <span style={{ flex: 1 }}>{opt.label}</span>
                                      </div>
                                    );
                                  })()
                                )
                              }))
                            }}
                          >
                            <Button type="text" icon={<MoreHorizontal size={18} />} style={{ color: 'white' }} />
                          </Dropdown>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className={styles.tabStatusRight} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, minWidth: '25%', maxWidth: '30%', color: statusBarTheme.textColor }}>
                  <div style={{ 
                    position: 'relative', 
                    flex: 1, 
                    minWidth: '150px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      position: 'relative',
                      width: '100%'
                    }}>
                      <svg 
                        width="18" 
                        height="21.6" 
                        viewBox="0 0 25 30" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ 
                          position: 'absolute', 
                          left: '10px', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          zIndex: 1
                        }}
                      >
                        <mask id="mask0_8834_115" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="30">
                          <path d="M21.874 1H2.3916C2.02253 1 1.66857 1.14661 1.40759 1.40759C1.14662 1.66857 1 2.02253 1 2.3916V27.4404C1 27.8095 1.14662 28.1635 1.40759 28.4244C1.66857 28.6854 2.02253 28.832 2.3916 28.832H21.874C22.2431 28.832 22.5971 28.6854 22.858 28.4244C23.119 28.1635 23.2656 27.8095 23.2656 27.4404V2.3916C23.2656 2.02253 23.119 1.66857 22.858 1.40759C22.5971 1.14661 22.2431 1 21.874 1Z" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14.915 9.34694C14.915 10.3071 14.5254 11.1769 13.8957 11.8066C13.3265 12.3757 12.5775 12.7297 11.7765 12.8085C10.9755 12.8873 10.1719 12.6858 9.50272 12.2386C8.83355 11.7913 8.34018 11.1258 8.10666 10.3555C7.87315 9.58524 7.91394 8.75782 8.2221 8.01425C8.53025 7.27068 9.0867 6.65697 9.79663 6.27768C10.5066 5.89839 11.326 5.77699 12.1154 5.93418C12.9048 6.09136 13.6153 6.5174 14.1258 7.13969C14.6363 7.76199 14.9152 8.54205 14.915 9.34694Z" fill="white"/>
                          <path d="M16.3071 14.2206L13.8962 11.8097M13.8962 11.8097C14.2259 11.4881 14.4886 11.1043 14.6688 10.6805C14.8491 10.2566 14.9434 9.80122 14.9463 9.34065C14.9492 8.88008 14.8606 8.42352 14.6856 7.99745C14.5107 7.57139 14.2529 7.1843 13.9272 6.85865C13.6015 6.53299 13.2144 6.27525 12.7883 6.10037C12.3622 5.9255 11.9056 5.83696 11.4451 5.83992C10.9845 5.84287 10.5291 5.93724 10.1053 6.11756C9.68146 6.29788 9.29767 6.56057 8.97617 6.89037C8.32854 7.54388 7.96615 8.42731 7.9683 9.34736C7.97044 10.2674 8.33694 11.1491 8.98761 11.7996C9.63828 12.4501 10.5201 12.8164 11.4402 12.8183C12.3602 12.8201 13.2429 12.4575 13.8962 11.8097ZM7.26172 19.0912H17.0029M7.26172 23.266H12.1323" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </mask>
                        <g mask="url(#mask0_8834_115)">
                          <path d="M-4.56641 -1.78516H28.832V31.6133H-4.56641V-1.78516Z" fill="#AAAAAA"/>
                        </g>
                      </svg>
                      <Input
                        placeholder="Tìm kiếm"
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        style={{
                          paddingLeft: '40px',
                          borderRadius: '20px',
                          border: 'none',
                          background: '#F5F5F5',
                          height: '36px'
                        }}
                        styles={{
                          input: {
                            color: '#66666C',
                          }
                        }}
                        className="wiki-canvas-search-input"
                      />
                    </div>
                  </div>
                  <span style={{ fontWeight: 600 }}>{formatVietnameseDateTime(currentTime)}</span>
                </div>
              </div>
            </div>
          )}
          {/* Tool/List or Tab Content by Path */}
          <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 130px)' }}>

            <div className={styles.contentContainer} style={{ flex: 1 }}>
              {activeTab === 'app' || activeTab === 'research-bpo' || activeTab === 'training-productivity' ? (
                (showToolsLoading || isSwitchingSchema) ? (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '50vh',
                    flexDirection: 'column',
                    gap: '20px'
                  }}>
                    <Loading3DTower />
                    <div style={{
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '500',
                      textAlign: 'center'
                    }}>
                      {isSwitchingSchema ? 'Đang chuyển schema...' : 'Đang tải các công cụ...'}
                    </div>
                  </div>
                ) : (
                  <div className={styles.toolsWrapper}>
                    <div className={styles.toolsList}>
                      {visibleTools.map((tool) => {
                        const isEditing = editingTool && editingTool.id === tool.id;
                        if (activeTab === 'research-bpo' || activeTab === 'training-productivity') {
                          if (tool.id === "process-guide") return null; // bỏ qua tool này
                        }
                        return (
                          <div
                            key={tool.id}
                            className={styles.toolCard + ' ' + (!isEditing ? styles.toolCardHover : '')}
                            onClick={() => { if (activeTab === 'app') { handleToolNavigation(tool.id) } }}
                          >
                            {/* Edit Button */}
                            {currentUser?.isSuperAdmin && selectedSchema == 'master' && tool.id !== 'process-guide' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(tool);
                                  }}
                                  className={styles.toolEditBtn}
                                >
                                  <Edit2 className={styles.iconEdit} />
                                </button>

                                {activeTab !== 'app' && (
                                  <Popconfirm
                                    title="Xóa tool"
                                    description={`Bạn có chắc chắn muốn xóa tool "${tool.name}"?`}
                                    onConfirm={(e) => {
                                      e?.stopPropagation();
                                      handleDeleteTool(tool);
                                    }}
                                    onCancel={(e) => {
                                      e?.stopPropagation();
                                    }}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                  >
                                    <button
                                      className={styles.toolDeleteBtn}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      <Trash2 className={styles.iconDelete} />
                                    </button>
                                  </Popconfirm>
                                )}
                              </>

                            )}
                           <div className={styles.toolCardItem} style={{ alignItems: 'flex-start', textAlign: 'left', width: '100%' }}>
                              <div className={styles.toolIcon} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', marginLeft: '15px', justifyContent: 'flex-start' }}>
                                {tool.icon ? (
                                  (() => {
                                    const iconSrc = getIconSrcById(tool);
                                    return iconSrc ? (
                                      <img src={iconSrc} alt={tool.name} height={40} width={'auto'} />
                                    ) : (
                                      <span style={{ fontSize: '30px' }}>{tool.icon}</span>
                                    );
                                  })()
                                ) : (
                                  <span style={{ fontSize: '30px' }}>🛠️</span>
                                )}
                                <div className={styles.box} style={{ margin: 0 }}>
                                  <h3 className={styles.toolTitleItem} style={{ margin: 0, textAlign: 'left' }}>{tool.name}</h3>
                                </div>
                              </div>


                              {/* Trial Tag and Expiry Date */}
                              {tool.isTrial && (
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  left: '8px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px'
                                }}>
                                  <span style={{
                                    background: '#3b82f6',
                                    color: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 'bold'
                                  }}>
                                    TRIAL
                                  </span>
                                  <span style={{
                                    background: 'rgba(0,0,0,0.7)',
                                    color: 'white',
                                    padding: '2px 4px',
                                    borderRadius: '3px',
                                    fontSize: '9px',
                                    textAlign: 'center'
                                  }}>
                                    {new Date(tool.trialEndDate).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                              )}
                              
                              <div className={styles.toolCardDesc}>
                                <p className={styles.toolDescItem}>{tool.description}</p>
                              </div>
                              {/* New: action buttons at card bottom - always show when available */}


                              {/* New: Display info content directly on card when available */}
                              {tool.content1 && (
                                <div className={styles.toolInfoSection}>
                                  <div
                                    className={styles.toolInfoContent}
                                    dangerouslySetInnerHTML={{
                                      __html: marked(tool.content1)
                                    }}
                                  />
                                </div>
                              )}

                              {tool.content2 && (
                                <div className={styles.toolSupportSection}>
                                  <div
                                    className={styles.toolSupportContent}
                                    dangerouslySetInnerHTML={{
                                      __html: marked(tool.content2)
                                    }}
                                  />
                                </div>
                              )}



                            </div>
                            {/* View Count Badge */}
                            <div style={{
                              position: 'absolute',
                              bottom: '8px',
                              right: '12px',
                              fontSize: '11px',
                              color: '#666',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              justifyContent: 'flex-end'
                            }}>
                              {tool.viewCount || 0} views
                              {tool.featured && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  marginLeft: '8px'
                                }}>
                                  <svg width="22" height="19" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.7235 16.2406C12.6998 16.3919 12.7612 16.4816 12.8689 16.4816C12.9084 16.4816 12.954 16.4696 13.0038 16.4443L15.5301 15.1639C15.6233 15.1167 15.7463 15.093 15.8691 15.093C15.992 15.093 16.1149 15.1167 16.2081 15.1639L18.7344 16.4443C18.7843 16.4696 18.8298 16.4816 18.8692 16.4816C18.977 16.4816 19.0384 16.3919 19.0148 16.2406L18.5778 13.4424C18.5455 13.2358 18.6398 12.9456 18.7872 12.7975L20.7855 10.7905C20.933 10.6425 20.8849 10.4942 20.6785 10.461L17.8821 10.0119C17.6758 9.97883 17.4289 9.79942 17.3336 9.61335L16.0424 7.09268C15.9947 6.99964 15.932 6.95312 15.8692 6.95312C15.8064 6.95312 15.7436 6.99964 15.6959 7.09268L14.4047 9.61335C14.3094 9.79942 14.0626 9.97883 13.8562 10.0119L11.0598 10.461C10.8534 10.4942 10.8052 10.6425 10.9527 10.7905L12.951 12.7975C13.0985 12.9456 13.1929 13.2358 13.1606 13.4424L12.7235 16.2406Z" fill="#F8BB4A"/>
                                    <path d="M21.1513 9.49222C21.7143 8.28504 22 7.07548 22 5.88007C22 2.63778 19.3622 0 16.1199 0C13.927 0 12.0107 1.20637 11 2.99052C9.98911 1.20637 8.07289 0 5.88 0C2.63778 0 0 2.63778 0 5.88007C0 7.58993 0.581259 9.32882 1.72763 11.0483C2.61756 12.3832 3.85089 13.7118 5.39341 14.9972C7.99126 17.1621 10.5523 18.4525 10.6601 18.5064C10.767 18.56 10.8836 18.5867 11 18.5867C11.1164 18.5867 11.2329 18.56 11.3399 18.5064C11.3942 18.4793 12.0719 18.1378 13.063 17.5287C12.9987 17.5386 12.934 17.5441 12.869 17.5441C12.5135 17.5441 12.1788 17.3913 11.9509 17.125C11.7093 16.8428 11.6104 16.4696 11.6721 16.0747L12.0844 13.4339L10.1987 11.5399C9.842 11.1817 9.71578 10.7004 9.86133 10.2523C10.0068 9.80422 10.3917 9.48874 10.891 9.40844L13.5301 8.98467L14.7487 6.6057C14.9792 6.15585 15.3981 5.88719 15.8691 5.88719C16.3402 5.88719 16.7591 6.15585 16.9896 6.60578L18.2081 8.98474L21.1513 9.49222Z" fill="#F8BB4A"/>
                                  </svg>
                                  <span style={{ color: '#F8BB4A', fontWeight: 600 }}>Featured</span>
                                </div>
                              )}
                            </div>
                            {/* Shortcut display */}
                            {tool.shortcut && (
                              <div className={styles.toolShortcut}>
                                {tool.shortcut}
                              </div>
                            )}
                            <div className={styles.toolActionButtons} onClick={(e) => e.stopPropagation()}>
                              {/* Display Tags - moved to bottom */}
                              {/* {tool.tags && tool.tags.length > 0 && (
                                <div style={{ width: '100%', marginTop: 'auto', paddingTop: '12px', display: 'flex', justifyContent: 'start' }}>
                                  <div className={styles.toolTags}>
                                    {tool.tags.map(tagValue => {
                                      const tagOption = tagOptions?.find(option => option.value === tagValue);
                                      return tagOption ? (
                                        <span
                                          key={tagValue}
                                          className={styles.toolTag}
                                          style={{
                                            borderRadius: 3,
                                            backgroundColor: tagOption.fillColor || tagOption.color,
                                            color: tagOption.textColor || 'white',
                                            borderColor: tagOption.borderColor,
                                            border: `1px solid ${tagOption.borderColor}`
                                          }}
                                        >
                                          {tagOption.label}
                                        </span>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )} */}
                              {tool.content2 && (
                                <button
                                  className={`${styles.toolActionButton} ${styles.support}`}
                                  onClick={() => handleOpenRegistrationModal(tool)}
                                >
                                  Đăng ký
                                </button>
                              )}

                              {tool.showInfo && <button
                                className={`${styles.toolActionButton} ${styles.info}`}
                                onClick={() => Modal.info({
                                  title: `Thông tin chi tiết: ${tool.name}`,
                                  content: (
                                    <div style={{ padding: '20px' }}>
                                      <h3 style={{ color: '#1e293b', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                                        {tool.name}
                                      </h3>

                                      <div style={{ marginBottom: '16px' }}>
                                        <strong style={{ color: '#475569' }}>Mô tả:</strong>
                                        <p style={{ margin: '8px 0', color: '#64748b' }}>{tool.description}</p>
                                      </div>

                                      {tool.content1 && (
                                        <div style={{
                                          marginBottom: '10px',
                                          padding: '16px',
                                          background: '#f8fafc',
                                          borderRadius: '8px',
                                          border: '1px solid #e2e8f0'
                                        }}>

                                          <div style={{
                                            color: '#475569',
                                            lineHeight: '1.6',
                                            fontSize: '13px',
                                            paddingLeft: '20px'
                                          }} dangerouslySetInnerHTML={{ __html: marked(tool.content1) }} />
                                        </div>
                                      )}

                                      {tool.content2 && (
                                        <div style={{
                                          marginBottom: '20px',
                                          padding: '16px',
                                          background: '#fefefe',
                                          borderRadius: '8px',
                                          border: '1px solid #e2e8f0',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                        }}>

                                          <div style={{
                                            color: '#475569',
                                            lineHeight: '1.6',
                                            fontSize: '13px',
                                            paddingLeft: '20px'
                                          }} dangerouslySetInnerHTML={{ __html: marked(tool.content2) }} />
                                        </div>
                                      )}

                                      {tool.enterUrl && (
                                        <div style={{ marginBottom: '16px' }}>
                                          <strong style={{ color: '#475569' }}>URL ứng dụng:</strong>
                                          <p style={{ margin: '8px 0', color: '#64748b' }}>
                                            <a href={tool.enterUrl} target="_blank" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                              {tool.enterUrl}
                                            </a>
                                          </p>
                                        </div>
                                      )}

                                      <div style={{ marginBottom: '16px' }}>
                                        <strong style={{ color: '#475569' }}>Trạng thái:</strong>
                                        <span style={{ marginLeft: '8px', padding: '4px 8px', background: tool.tag === 'Working' ? '#10b981' : tool.tag === 'On-demand' ? '#f59e0b' : '#ef4444', color: 'white', borderRadius: '4px', fontSize: '12px' }}>
                                          {tool.tag || 'Không có'}
                                        </span>
                                      </div>
                                    </div>
                                  ),
                                  width: 600
                                })}
                              >
                                Thông tin
                              </button>
                              }
                              {/* {tool.enterUrl && (
                                <a href={tool.enterUrl} target="_blank" rel="noopener noreferrer">
                                  <button className={`${styles.toolActionButton} ${styles.enterApp}`}>
                                    To App
                                  </button>
                                </a>
                              )} */}
                            </div>
                          </div>
                        );
                      })}
                      {/* Add New Tool Card */}
                      {showAddForm ? (
                        <div className={styles.toolCardDashed}>
                          <div className={styles.toolCardContent}>
                            {/* Icon Selector */}
                            <div className={styles.iconSelectorWrapper}>
                              <div className={styles.iconSelectorList}>
                                {commonIcons.map(icon => (
                                  <button
                                    key={icon.id}
                                    onClick={() => setNewTool({ ...newTool, icon: icon.id })}
                                    className={styles.iconSelectorBtn + ' ' + (newTool.icon === icon.id ? styles.iconSelectorBtnActive : '')}
                                  >
                                    {icon.icon ? (
                                      <img src={icon.icon} alt="icon" width={32} height={32} />
                                    ) : icon.id}
                                  </button>
                                ))}
                              </div>
                              <div className={styles.iconPreview}>
                                {newTool.icon && typeof newTool.icon === 'string' ? (
                                  (() => {
                                    const iconSrc = getIconSrcById({ icon: newTool.icon });
                                    return iconSrc ? (
                                      <img src={iconSrc} alt="icon" width={40} height={40} />
                                    ) : (
                                      <span style={{ fontSize: '30px' }}>{newTool.icon}</span>
                                    );
                                  })()
                                ) : (
                                  <span style={{ fontSize: '30px' }}>{newTool.icon || '🛠️'}</span>
                                )}
                              </div>
                            </div>
                            {/* Multiple Tag Selector */}
                            <div className={styles.tagSelectorWrapper}>
                              <label className={styles.tagLabel}>Tags:</label>
                              <div className={styles.tagOptions}>
                                {tagOptions?.length > 0 && tagOptions.map(tag => (
                                  <label key={tag.value} className={styles.tagOption}>
                                    <input
                                      type="checkbox"
                                      checked={newTool.tags?.includes(tag.value) || false}
                                      onChange={() => handleTagToggle(tag.value)}
                                      className={styles.tagCheckbox}
                                    />
                                    <span
                                      className={styles.tagLabel}
                                      style={{
                                        backgroundColor: newTool.tags?.includes(tag.value) ? tag.color : '#f5f5f5',
                                        color: newTool.tags?.includes(tag.value) ? 'white' : '#666'
                                      }}
                                    >
                                      {tag.label}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            {/* Title Input */}
                            <input
                              type="text"
                              placeholder="Tool name"
                              value={newTool.name}
                              onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                              className={styles.toolTitleInput}
                              autoFocus
                            />
                            {/* Description Input */}
                            <textarea
                              placeholder="Tool description"
                              value={newTool.description}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= 50) {
                                  setNewTool({ ...newTool, description: value });
                                }
                              }}
                              className={styles.toolDescInput}
                              rows="2"
                              maxLength="50"
                            />
                            {/* New: Extra fields below */}
                            <div className={styles.formGridOne}>
                              <Input
                                placeholder="EnterApp URL"
                                value={newTool.enterUrl}
                                onChange={(e) => setNewTool({ ...newTool, enterUrl: e.target.value })}
                                className={styles.dashboardInput}
                              />
                            </div>
                            <div className={styles.formGridOne}>
                              <Input
                                placeholder="Shortcut (e.g., Ctrl+Alt+S)"
                                value={newTool.shortcut}
                                onChange={(e) => setNewTool({ ...newTool, shortcut: e.target.value })}
                                className={styles.dashboardInput}
                              />
                            </div>
                            <div className={styles.formGridOne}>
                              <Input.TextArea
                                placeholder="Nội dung 1"
                                value={newTool.content1 || ''}
                                onChange={(e) => setNewTool({ ...newTool, content1: e.target.value })}
                                rows={4}
                                className={styles.dashboardInput}
                              />
                            </div>
                            <div className={styles.formGridOne}>
                              <Input.TextArea
                                placeholder="Nội dung 2"
                                value={newTool.content2 || ''}
                                onChange={(e) => setNewTool({ ...newTool, content2: e.target.value })}
                                rows={4}
                                className={styles.dashboardInput}
                              />
                            </div>
                            <div className={styles.formCheckRow}>
                              <Checkbox
                                checked={!!newTool.showSupport}
                                onChange={(e) => setNewTool({ ...newTool, showSupport: e.target.checked })}
                              >
                                Hiện nút Gửi yêu cầu hỗ trợ
                              </Checkbox>
                              <Checkbox
                                checked={!!newTool.showInfo}
                                onChange={(e) => setNewTool({ ...newTool, showInfo: e.target.checked })}
                              >
                                Hiện nút Thông tin
                              </Checkbox>
                            </div>
                            {/* Action Buttons */}
                            <div className={styles.toolActionRow}>
                              <button
                                onClick={handleAdd}
                                className={styles.saveBtn}
                              >
                                <Check className={styles.iconCheckSmall} />
                                Add
                              </button>
                              <button
                                onClick={handleCancelAdd}
                                className={styles.cancelBtn}
                              >
                                <X className={styles.iconCancelSmall} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <></>
                      )}

                      {/* Add New Tool Card cho tab Research BPO */}
                      {activeTab === 'research-bpo' && !showAddFormResearchBpo && (currentUser?.isSuperAdmin || currentUser?.isAdmin) && (
                        <div className={styles.toolCardDashed}>
                          <div className={styles.toolCardContent}>
                            <button
                              onClick={() => setShowAddFormResearchBpo(true)}
                              className={styles.addNewToolBtn}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                color: '#666',
                                fontSize: '16px'
                              }}
                            >
                              <Plus size={40} />
                              <span>Cộng mới</span>
                            </button>
                          </div>
                        </div>
                      )}



                      {/* Add New Tool Card cho tab Training Productivity */}
                      {activeTab === 'training-productivity' && !showAddFormTrainingProductivity && (currentUser?.isSuperAdmin || currentUser?.isAdmin) && (
                        <div className={styles.toolCardDashed}>
                          <div className={styles.toolCardContent}>
                            <button
                              onClick={() => setShowAddFormTrainingProductivity(true)}
                              className={styles.addNewToolBtn}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                color: '#666',
                                fontSize: '16px'
                              }}
                            >
                              <Plus size={40} />
                              <span>Cộng mới</span>
                            </button>
                          </div>
                        </div>
                      )}


                    </div>

                    {/* Blocked Tools Section (visible for non-logged-in users only) */}
                    {activeTab === 'app' && blockedTools.length > 0 && !currentUser?.email && (
                      <div className={styles.toolsList} style={{ marginTop: '20px' }}>
                        {blockedTools.map((tool) => (
                          <div
                            key={tool.id}
                            className={styles.toolCard}
                            // style={{
                            //   opacity: 0.5,
                            //   filter: 'grayscale(100%)',
                            //   cursor: 'not-allowed',
                            //   position: 'relative'
                            // }}
                            onClick={(e) => {
                              e.preventDefault();
                              if (tool.visibility === 'trial') {
                                if (!currentUser || !currentUser.email) {
                                  message.warning('Vui lòng đăng nhập để truy cập tool này!');
                                } else if (!currentUser?.isSuperAdmin && !currentUser?.isAdmin && allowedAppIds.length === 0) {
                                  message.warning('Bạn không có quyền truy cập tool này!');
                                } else {
                                  message.warning('Vui lòng kích hoạt trial để truy cập tool này!');
                                }
                              } else {
                                message.warning('Vui lòng đăng nhập để truy cập tool này!');
                              }
                            }}
                          >
                            <div className={styles.toolCardItem} style={{ alignItems: 'flex-start', textAlign: 'left', width: '100%' }}>
                              <div className={styles.toolIcon} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', marginLeft: '15px', justifyContent: 'flex-start' }}>
                                {tool.icon ? (
                                  (() => {
                                    const iconSrc = getIconSrcById(tool);
                                    return iconSrc ? (
                                      <img src={iconSrc} alt={tool.name} height={40} width={'auto'} />
                                    ) : (
                                      <span style={{ fontSize: '30px' }}>{tool.icon}</span>
                                    );
                                  })()
                                ) : (
                                  <span style={{ fontSize: '30px' }}>🛠️</span>
                                )}
                                <div className={styles.box} style={{ margin: 0 }}>
                                  <h3 className={styles.toolTitleItem} style={{ margin: 0, textAlign: 'left' }}>{tool.name}</h3>
                                </div>
                              </div>

                              {/* Trial Tag and Expiry Date */}
                              {tool.isTrial && (
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  left: '8px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px'
                                }}>
                                  <span style={{
                                    background: '#3b82f6',
                                    color: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 'bold'
                                  }}>
                                    TRIAL
                                  </span>
                                  <span style={{
                                    background: 'rgba(0,0,0,0.7)',
                                    color: 'white',
                                    padding: '2px 4px',
                                    borderRadius: '3px',
                                    fontSize: '9px',
                                    textAlign: 'center'
                                  }}>
                                    {new Date(tool.trialEndDate).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                              )}

                              {/* Lock Badge */}
                              <div style={{
                                position: 'absolute',
                                bottom: '8px',
                                left: '24px',
                                background: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                opacity: 0.5
                              }}>
                                {tool.visibility === 'trial' ? 
                                  (!currentUser || !currentUser.email ? '🔒 Cần đăng nhập' : 
                                   (!currentUser?.isSuperAdmin && !currentUser?.isAdmin && allowedAppIds.length === 0 ? '🚫 Không có quyền' : '🧪 Cần kích hoạt trial')) : 
                                  '🔒 Cần đăng nhập'}
                              </div>

                              <div className={styles.toolCardDesc}>
                                <p className={styles.toolDescItem}>{tool.description}</p>
                              </div>

                              {/* Info content on card when available */}
                              {tool.content1 && (
                                <div className={styles.toolInfoSection}>
                                  <div
                                    className={styles.toolInfoContent}
                                    dangerouslySetInnerHTML={{
                                      __html: marked(tool.content1)
                                    }}
                                  />
                                </div>
                              )}

                              {tool.content2 && (
                                <div className={styles.toolSupportSection}>
                                  <div
                                    className={styles.toolSupportContent}
                                    dangerouslySetInnerHTML={{
                                      __html: marked(tool.content2)
                                    }}
                                  />
                                </div>
                              )}
                            {/* View Count and Featured (bottom right) */}
                            <div style={{
                              position: 'absolute',
                              bottom: '8px',
                              right: '12px',
                              fontSize: '11px',
                              color: '#666',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              justifyContent: 'flex-end'
                            }}>
                              
                              {tool.viewCount || 0} views
                              {tool.featured && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  marginLeft: '8px'
                                }}>
                                  <svg width="22" height="19" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.7235 16.2406C12.6998 16.3919 12.7612 16.4816 12.8689 16.4816C12.9084 16.4816 12.954 16.4696 13.0038 16.4443L15.5301 15.1639C15.6233 15.1167 15.7463 15.093 15.8691 15.093C15.992 15.093 16.1149 15.1167 16.2081 15.1639L18.7344 16.4443C18.7843 16.4696 18.8298 16.4816 18.8692 16.4816C18.977 16.4816 19.0384 16.3919 19.0148 16.2406L18.5778 13.4424C18.5455 13.2358 18.6398 12.9456 18.7872 12.7975L20.7855 10.7905C20.933 10.6425 20.8849 10.4942 20.6785 10.461L17.8821 10.0119C17.6758 9.97883 17.4289 9.79942 17.3336 9.61335L16.0424 7.09268C15.9947 6.99964 15.932 6.95312 15.8692 6.95312C15.8064 6.95312 15.7436 6.99964 15.6959 7.09268L14.4047 9.61335C14.3094 9.79942 14.0626 9.97883 13.8562 10.0119L11.0598 10.461C10.8534 10.4942 10.8052 10.6425 10.9527 10.7905L12.951 12.7975C13.0985 12.9456 13.1929 13.2358 13.1606 13.4424L12.7235 16.2406Z" fill="#F8BB4A"/>
                                    <path d="M21.1513 9.49222C21.7143 8.28504 22 7.07548 22 5.88007C22 2.63778 19.3622 0 16.1199 0C13.927 0 12.0107 1.20637 11 2.99052C9.98911 1.20637 8.07289 0 5.88 0C2.63778 0 0 2.63778 0 5.88007C0 7.58993 0.581259 9.32882 1.72763 11.0483C2.61756 12.3832 3.85089 13.7118 5.39341 14.9972C7.99126 17.1621 10.5523 18.4525 10.6601 18.5064C10.767 18.56 10.8836 18.5867 11 18.5867C11.1164 18.5867 11.2329 18.56 11.3399 18.5064C11.3942 18.4793 12.0719 18.1378 13.063 17.5287C12.9987 17.5386 12.934 17.5441 12.869 17.5441C12.5135 17.5441 12.1788 17.3913 11.9509 17.125C11.7093 16.8428 11.6104 16.4696 11.6721 16.0747L12.0844 13.4339L10.1987 11.5399C9.842 11.1817 9.71578 10.7004 9.86133 10.2523C10.0068 9.80422 10.3917 9.48874 10.891 9.40844L13.5301 8.98467L14.7487 6.6057C14.9792 6.15585 15.3981 5.88719 15.8691 5.88719C16.3402 5.88719 16.7591 6.15585 16.9896 6.60578L18.2081 8.98474L21.1513 9.49222Z" fill="#F8BB4A"/>
                                  </svg>
                                  <span style={{ color: '#F8BB4A', fontWeight: 600 }}>Featured</span>
                                </div>
                              )}
                            </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Divider and Available Apps Section */}
                    {activeTab === 'app' &&
                      (currentUser?.isSuperAdmin || currentUser?.isAdmin || allowedAppIds.length > 0) &&
                      (() => {
                        const availableApps = getAvailableApps();
                        const expiredApps = getExpiredAppsForDisplay();
                        return availableApps.length > 0 || expiredApps.length > 0;
                      })() && (
                        <>
                          <div style={{
                            width: '100%',
                            margin: '20px 0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <div style={{
                              width: '85%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '20px'
                            }}>
                              <div style={{
                                flex: 1,
                                height: '3px',
                                background: '#64748b'
                              }}></div>
                              <span style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#64748b',
                                whiteSpace: 'nowrap',
                                padding: '0 10px'
                              }}>
                                Kho ứng dụng / tài nguyên chưa sử dụng / Quá hạn
                              </span>
                              <div style={{
                                flex: 1,
                                height: '2px',
                                background: '#64748b'
                              }}></div>
                            </div>
                          </div>

                          <div className={styles.toolsWrapper}>
                            <div className={styles.toolsList}>
                              {/* Available apps (not in trial) */}
                              {(  () => {
                                const availableApps = getAvailableApps();
                                return availableApps.map((app) => {
                                // Tìm thông tin từ master schema để hiển thị đúng icon và nội dung
                                const masterApp = masterAppsList.find(tool => tool.id === app.id);
                                const displayApp = masterApp ? {
                                  ...app,
                                  name: masterApp.name,
                                  description: masterApp.description,
                                  icon: masterApp.icon,
                                  content1: masterApp.content1,
                                  content2: masterApp.content2
                                } : app;

                                return (
                                  <div
                                    key={app.id}
                                    className={styles.toolCard + ' ' + styles.toolCardHover}
                                    onClick={() => {
                                      if (currentUser.isSuperAdmin || currentUser.isAdmin) {
                                        handleAppClick(app);
                                      } else {
                                        message.error('Bạn cần có quyền admin để kích hoạt');
                                      }
                                    }}
                                    style={{
                                      cursor: 'pointer',
                                      opacity: 0.8,
                                      border: '2px dashed #A3A3A3'
                                    }}
                                  >
                                    <div className={styles.toolCardItem}>
                                      <div className={styles.toolIcon}>
                                        {displayApp.icon ? (
                                          (() => {
                                            const iconSrc = getIconSrcById(displayApp);
                                            return iconSrc ? (
                                              <img src={iconSrc} alt={displayApp.name} height={55} width={'auto'} />
                                            ) : (
                                              <span style={{ fontSize: '40px' }}>{displayApp.icon}</span>
                                            );
                                          })()
                                        ) : (
                                          <span style={{ fontSize: '40px' }}>🛠️</span>
                                        )}
                                      </div>
                                      <div className={styles.box}>
                                        <h3 className={styles.toolTitleItem}>{displayApp.name}</h3>
                                      </div>
                                      <div className={styles.toolCardDesc}>
                                        <p className={styles.toolDescItem}>{displayApp.description}</p>
                                      </div>
                                    </div>

                                  <div className={styles.toolActionButtons} onClick={(e) => e.stopPropagation()}>
                                    {app.isExpired ? (
                                      <button
                                        className={`${styles.toolActionButton} ${styles.expired}`}
                                        disabled
                                        style={{
                                          background: '#ef4444',
                                          color: 'white',
                                          border: 'none',
                                          width: '100%',
                                          opacity: 0.7
                                        }}
                                      >
                                        Đã hết hạn dùng thử
                                      </button>
                                    ) : (
                                      <button
                                        className={`${styles.toolActionButton} ${styles.trial}`}
                                        onClick={() => {
                                          if (currentUser.isSuperAdmin || currentUser.isAdmin) {
                                            handleAppClick(app);
                                          } else {
                                            message.error('Bạn cần có quyền admin để kích hoạt');
                                          }
                                        }}
                                        style={{
                                          background: app.visibility === 'trial' ? '#DEE0E5' : '#E5F3FF',
                                          color: app.visibility === 'trial' ? '#4363AA' : '#1890ff',
                                          border: 'none',
                                          width: '100%'
                                        }}
                                      >
                                        {app.visibility === 'trial' ? 'Kích hoạt trial' : 'Dùng thử 30 ngày'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                );
                                });
                              })()}

                              {/* Expired trial apps */}
                              {getExpiredAppsForDisplay().map((app) => {
                                // Tìm thông tin từ master schema để hiển thị đúng icon và nội dung
                      
                                const masterApp = masterAppsList.find(tool => tool.id === app.id);
                                console.log('masterApp', masterApp);
                                const displayApp = masterApp ? {
                                  ...app,
                                  name: masterApp.name,
                                  description: masterApp.description,
                                  icon: masterApp.icon,
                                  content1: masterApp.content1,
                                  content2: masterApp.content2
                                } : app;

                                return (
                                  <div
                                    key={app.id}
                                    className={styles.toolCard + ' ' + styles.toolCardHover}
                                    onClick={() => {
                                      handleAppClick(app);
                                    }}
                                    style={{
                                      cursor: 'pointer',
                                      border: '2px dashed #ef4444'
                                    }}
                                  >
                                    <div className={styles.toolCardItem}>
                                      <div className={styles.toolIcon}>
                                        {displayApp.icon ? (
                                          (() => {
                                            const iconSrc = getIconSrcById(displayApp);
                                            return iconSrc ? (
                                              <img src={iconSrc} alt={displayApp.name} height={55} width={'auto'} />
                                            ) : (
                                              <span style={{ fontSize: '40px' }}>{displayApp.icon}</span>
                                            );
                                          })()
                                        ) : (
                                          <span style={{ fontSize: '40px' }}>🛠️</span>
                                        )}
                                      </div>
                                      <div className={styles.box}>
                                        <h3 className={styles.toolTitleItem}>{displayApp.name}</h3>
                                      </div>
                                      <div className={styles.toolCardDesc}>
                                        <p className={styles.toolDescItem}>{displayApp.description}</p>
                                      </div>
                                    </div>

                                  <div className={styles.toolActionButtons} onClick={(e) => e.stopPropagation()}>
                                    <button
                                      className={`${styles.toolActionButton} ${styles.expired}`}
                                      onClick={() => {
                                        handleAppClick(app);
                                      }}
                                      // disabled
                                      style={{
                                        background: ' #ef4444',
                                        color: 'white',
                                        border: 'none',
                                        width: '100%',
                                        opacity: 0.7
                                      }}
                                    >
                                      Đã hết hạn dùng thử
                                    </button>
                                  </div>
                                </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                  </div>
                )
              ) : (
                <div className={styles.tabEmpty}>
                  {activeTab === 'research-bpo' ? 'DV Nghiên cứu & BPO' : 'Đào tạo & Năng suất'} — nội dung sẽ được cập nhật.
                </div>
              )}
            </div>

            {/* Resource Panel - Right Sidebar */}
            {/* {activeTab !== 'n8n' && !isMobile && (
              <div style={{
                flexShrink: 0,
                height: '100%',
                overflowY: 'auto'
              }}>
                <ResourcePanel
                  currentUser={currentUser}
                />
              </div>
            )} */}
          </div>
        </>
      )}
      {/* Modal sửa tool */}
      <Modal
        open={!!editingTool}
        title="Edit Tool"
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        className={styles.dashboardModal}
        style={{ top: 20 }}
      >
        {editingTool && (
          <>
            {/* Icon Selector */}
            <div className={styles.iconSelectorWrapper}>
              <div className={styles.iconSelectorList}>
                {commonIcons.map(icon => (
                  <button
                    key={icon.id}
                    onClick={() => setEditingTool({ ...editingTool, icon: icon.id })}
                    className={styles.iconSelectorBtn + ' ' + (editingTool.icon === icon.id ? styles.iconSelectorBtnActive : '')}
                  >
                    {icon.icon ? (
                      <img src={icon.icon} alt="icon" width={32} height={32} />
                    ) : (
                      <span>{icon.id}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <input
              type="text"
              value={editingTool.name}
              onChange={(e) => setEditingTool({ ...editingTool, name: e.target.value })}
              className={styles.toolTitleInput}
              autoFocus
            />
            {/* Description Input */}
            <textarea
              value={editingTool.description}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 120) {
                  setEditingTool({ ...editingTool, description: value });
                }
              }}
              className={styles.toolDescInput}
              rows="2"
              maxLength="120"
              placeholder="Max 120 characters"
            />
            {/* New: Extra fields below */}
            <div className={styles.formGridOne}>
              <Input
                placeholder="EnterApp URL"
                value={editingTool.enterUrl || ''}
                onChange={(e) => setEditingTool({ ...editingTool, enterUrl: e.target.value })}
                className={styles.dashboardInput}
              />
            </div>
            <div className={styles.formGridOne}>
              <Input
                placeholder="Shortcut (e.g., Ctrl+Alt+S)"
                value={editingTool.shortcut || ''}
                onChange={(e) => setEditingTool({ ...editingTool, shortcut: e.target.value })}
                className={styles.dashboardInput}
              />
            </div>
            {/* Multiple Tag Selector */}
            <div className={styles.tagSelectorWrapper}>
              <label className={styles.tagLabel}>Tags Module:</label>
              <div className={styles.tagOptions}>
                {tagOptions?.length > 0 && tagOptions.map(tag => (
                  <label key={tag.value} className={styles.tagOption}>
                    <input
                      type="checkbox"
                      checked={editingTool?.tags?.includes(tag.value) || false}
                      onChange={() => handleTagToggle(tag.value, true)}
                      className={styles.tagCheckbox}
                    />
                    <span
                      className={styles.tagLabel}
                      style={{
                        backgroundColor: editingTool?.tags?.includes(tag.value) ? tag.color : '#f5f5f5',
                        color: editingTool?.tags?.includes(tag.value) ? 'white' : '#666'
                      }}
                    >
                      {tag.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.formGridOne}>
              <Input.TextArea
                placeholder="Nội dung 1"
                value={editingTool.content1 || ''}
                onChange={(e) => setEditingTool({ ...editingTool, content1: e.target.value })}
                rows={4}
                className={styles.dashboardInput}
              />
            </div>
            <div className={styles.formGridOne}>
              <Input.TextArea
                placeholder="Nội dung 2"
                value={editingTool.content2 || ''}
                onChange={(e) => setEditingTool({ ...editingTool, content2: e.target.value })}
                rows={4}
                className={styles.dashboardInput}
              />
            </div>
            <div className={styles.formCheckRow}>
              <Checkbox
                checked={!!editingTool.showSupport}
                onChange={(e) => setEditingTool({ ...editingTool, showSupport: e.target.checked })}
              >
                Hiện nút Gửi yêu cầu hỗ trợ
              </Checkbox>
              <Checkbox
                checked={!!editingTool.showInfo}
                onChange={(e) => setEditingTool({ ...editingTool, showInfo: e.target.checked })}
              >
                Hiện nút Thông tin
              </Checkbox>
            </div>
            <div className={styles.formCheckRow}>
              <Checkbox
                checked={!!editingTool.featured}
                onChange={(e) => setEditingTool({ ...editingTool, featured: e.target.checked })}
              >
                Featured
              </Checkbox>
              <Checkbox
                checked={!!editingTool.directDownload}
                onChange={(e) => setEditingTool({ ...editingTool, directDownload: e.target.checked })}
              >
                Direct Download
              </Checkbox>
            </div>
            {/* Show download URL input when Direct Download is checked */}
            {editingTool.directDownload && (
              <div className={styles.formGridOne}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Download URL or Upload File:
                </label>
                <Input
                  value={editingTool.downloadUrl || ''}
                  onChange={(e) => setEditingTool({ ...editingTool, downloadUrl: e.target.value })}
                  placeholder="Enter download URL"
                  className={styles.dashboardInput}
                />
                <Upload
                  beforeUpload={(file) => {
                    const uploadFile = async () => {
                      try {
                        const { uploadFileService } = await import('../apis/uploadFileService.jsx');
                        const response = await uploadFileService([file]);
                        if (response && response.files && response.files.length > 0) {
                          setEditingTool({ ...editingTool, downloadUrl: response.files[0].fileUrl });
                          message.success('File uploaded successfully!');
                        }
                      } catch (error) {
                        console.error('Upload error:', error);
                        message.error('Failed to upload file');
                      }
                    };
                    uploadFile();
                    return false; // Prevent auto upload
                  }}
                  showUploadList={false}
                >
                  <Button type="default" icon={<UploadOutlined />} style={{ marginTop: '8px', width: '100%' }}>
                    Upload File
                  </Button>
                </Upload>
                {editingTool.downloadUrl && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    Current: {editingTool.downloadUrl}
                  </div>
                )}
              </div>
            )}
            {/* Action Buttons */}
            <div className={styles.toolActionRow}>
              <button
                onClick={handleSave}
                className={styles.saveBtn}
              >
                <Check className={styles.iconCheckSmall} />
                Save
              </button>
              <button
                onClick={handleCancel}
                className={styles.cancelBtn}
              >
                <X className={styles.iconCancelSmall} />
                Cancel
              </button>
            </div>
          </>
        )}
      </Modal>
      <Modal
        title="Cài đặt ảnh nền Topbar"
        open={showTopbarBgModal}
        onCancel={() => {
          // cleanup preview object url
          if (topbarBgPreviewUrl) URL.revokeObjectURL(topbarBgPreviewUrl);
          setTopbarBgPreviewUrl('');
          setTopbarBgPendingFile(null);
          setTopbarBgDraftUrl('');
          setShowTopbarBgModal(false);
        }}
        onOk={async () => {
          try {
            let finalUrl = topbarBgDraftUrl?.trim();
            // If user selected a file, upload now
            if (topbarBgPendingFile) {
              const { uploadFileService } = await import('../apis/uploadFileService.jsx');
              const response = await uploadFileService([topbarBgPendingFile]);
              if (!response || !response.files || response.files.length === 0) {
                throw new Error('Upload failed');
              }
              finalUrl = response.files[0].fileUrl;
            }
            if (!finalUrl) {
              Modal.error({ title: 'Thiếu dữ liệu', content: 'Vui lòng nhập URL hoặc chọn ảnh.' });
              return;
            }
            const existing = await getSettingByType('TOPBAR_BG_IMAGE');
            if (existing && existing.id) {
              await updateSetting({ ...existing, setting: finalUrl });
            } else {
              await createSetting({ type: 'TOPBAR_BG_IMAGE', setting: finalUrl });
            }
            // apply to external state
            setTopbarBgImageUrl(finalUrl);
            // cleanup and close
            if (topbarBgPreviewUrl) URL.revokeObjectURL(topbarBgPreviewUrl);
            setTopbarBgPreviewUrl('');
            setTopbarBgPendingFile(null);
            setTopbarBgDraftUrl('');
            setShowTopbarBgModal(false);
            Modal.success({ title: 'Thành công', content: 'Đã lưu ảnh nền Topbar' });
          } catch (e) {
            Modal.error({ title: 'Lỗi', content: 'Không thể lưu ảnh nền Topbar' });
          }
        }}
        okText="Lưu"
        cancelText="Hủy"
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>URL ảnh nền Topbar:</div>
            <Input
              value={topbarBgDraftUrl}
              onChange={(e) => setTopbarBgDraftUrl(e.target.value)}
              placeholder="/simple_background.png hoặc URL đầy đủ"
            />
          </div>
          <div>
            <div style={{ margin: '8px 0 6px', fontWeight: 500 }}>Tải ảnh từ máy:</div>
            <Upload
              beforeUpload={handleTopbarBgFileUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
              Chọn ảnh để xem trước. Ảnh chỉ được upload khi bấm Lưu.
            </div>
          </div>
          {(topbarBgPreviewUrl || topbarBgDraftUrl) && (
            <div>
              <div style={{ marginBottom: 6, fontWeight: 500 }}>Xem trước:</div>
              <div style={{
                width: '100%',
                height: 80,
                backgroundImage: `url(${topbarBgPreviewUrl || topbarBgDraftUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '1px solid var(--border-secondary)',
                borderRadius: 8
              }} />
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title="Cài đặt màu chữ Topbar"
        open={showTopbarTextColorModal}
        onCancel={() => {
          setTempTopbarTextColor('');
          setShowTopbarTextColorModal(false);
        }}
        onOk={async () => {
          try {
            const existing = await getSettingByType('TOPBAR_TEXT_COLOR');
            if (existing && existing.id) {
              await updateSetting({ ...existing, setting: tempTopbarTextColor });
            } else {
              await createSetting({ type: 'TOPBAR_TEXT_COLOR', setting: tempTopbarTextColor });
            }
            setTopbarTextColor(tempTopbarTextColor);
            setTempTopbarTextColor('');
            setShowTopbarTextColorModal(false);
            Modal.success({ title: 'Thành công', content: 'Đã lưu màu chữ Topbar' });
          } catch (e) {
            Modal.error({ title: 'Lỗi', content: 'Không thể lưu màu chữ Topbar' });
          }
        }}
        okText="Lưu"
        cancelText="Hủy"
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>Màu chữ Topbar:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="color"
                value={tempTopbarTextColor || '#454545'}
                onChange={(e) => setTempTopbarTextColor(e.target.value)}
                style={{ width: 50, height: 40, border: '1px solid #d9d9d9', borderRadius: 6, cursor: 'pointer' }}
              />
              <Input
                value={tempTopbarTextColor}
                onChange={(e) => setTempTopbarTextColor(e.target.value)}
                placeholder="#454545 hoặc tên màu"
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
              Chọn màu hoặc nhập mã màu hex/tên màu CSS.
            </div>
          </div>
          {tempTopbarTextColor && (
            <div>
              <div style={{ marginBottom: 6, fontWeight: 500 }}>Xem trước:</div>
              <div style={{
                padding: '12px',
                backgroundColor: '#f5f5f5',
                border: '1px solid var(--border-secondary)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <img src={topbarTheme.iconApp} alt="logo" width={24} height={24} />
                <span style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: tempTopbarTextColor
                }}>
                  WIKI CANVAS
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title="Cài đặt tổng token cho AI"
        open={showTokenModal}
        onOk={handleSaveTotalToken}
        onCancel={() => setShowTokenModal(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: 12, color: 'var(--text-primary)' }}>Nhập tổng token mới:</div>
        <Input
          value={newTotalToken}
          onChange={e => setNewTotalToken(e.target.value.replace(/[^\d,]/g, ''))}
          placeholder="Nhập số token"
          autoFocus
        />
      </Modal>

      {/* Modal thêm countdown */}
      <Modal
        title="Thêm countdown"
        open={showAddCountdownModal}
        onCancel={() => setShowAddCountdownModal(false)}
        onOk={handleAddCountdown}
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ minWidth: 120 }}>Diễn giải:</label>
            <input
              type="text"
              value={newCountdown.description}
              onChange={(e) => setNewCountdown(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ví dụ: Hết quý IV"
              style={{ flex: 1, height: 36, border: '1px solid #d9d9d9', borderRadius: 6, padding: '0 10px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ minWidth: 120 }}>Target date:</label>
            <input
              type="datetime-local"
              value={newCountdown.target}
              onChange={(e) => setNewCountdown(prev => ({ ...prev, target: e.target.value }))}
              style={{ flex: 1, height: 36, border: '1px solid #d9d9d9', borderRadius: 6, padding: '0 10px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ minWidth: 120 }}>Đơn vị:</label>
            <select
              value={newCountdown.unit}
              onChange={(e) => setNewCountdown(prev => ({ ...prev, unit: e.target.value }))}
              style={{ flex: 1, height: 36, border: '1px solid #d9d9d9', borderRadius: 6, padding: '0 10px' }}
            >
              <option value="days">Ngày</option>
              <option value="hours">Giờ</option>
              <option value="hm">Giờ + Phút</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Modal sửa countdown */}
      <Modal
        title="Sửa countdown"
        open={showEditCountdownModal}
        onCancel={() => {
          setShowEditCountdownModal(false);
          setEditingCountdown(null);
          setNewCountdown({ description: '', target: '', unit: 'days' });
        }}
        onOk={handleSaveEditCountdown}
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ minWidth: 120 }}>Diễn giải:</label>
            <input
              type="text"
              value={newCountdown.description}
              onChange={(e) => setNewCountdown(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ví dụ: Hết quý IV"
              style={{ flex: 1, height: 36, border: '1px solid #d9d9d9', borderRadius: 6, padding: '0 10px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ minWidth: 120 }}>Target date:</label>
            <input
              type="datetime-local"
              value={newCountdown.target}
              onChange={(e) => setNewCountdown(prev => ({ ...prev, target: e.target.value }))}
              style={{ flex: 1, height: 36, border: '1px solid #d9d9d9', borderRadius: 6, padding: '0 10px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ minWidth: 120 }}>Đơn vị:</label>
            <select
              value={newCountdown.unit}
              onChange={(e) => setNewCountdown(prev => ({ ...prev, unit: e.target.value }))}
              style={{ flex: 1, height: 36, border: '1px solid #d9d9d9', borderRadius: 6, padding: '0 10px' }}
            >
              <option value="days">Ngày</option>
              <option value="hours">Giờ</option>
              <option value="hm">Giờ + Phút</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Custom Guide Modal */}
      <Modal
        open={showGuideModal}
        title="Hướng dẫn sử dụng"
        onCancel={() => setShowGuideModal(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setShowGuideModal(false)}>
            Đã hiểu
          </Button>
        ]}
        className={styles.dashboardModal}
        width={600}
      >
        <div style={{ color: 'var(--text-primary)' }}>
          <p style={{ marginBottom: '12px', fontWeight: '500' }}>Hướng dẫn sử dụng hệ thống:</p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>Click vào các tool cards để truy cập</li>
            <li style={{ marginBottom: '8px' }}>Sử dụng nút Edit để chỉnh sửa thông tin tool</li>
            <li style={{ marginBottom: '8px' }}>Thêm tool mới bằng nút "Add New Tool"</li>
            <li style={{ marginBottom: '8px' }}>Theo dõi token usage qua AICU counter</li>
          </ul>
        </div>
      </Modal>

      {/* Custom Contact Modal */}
      <Modal
        open={showContactModal}
        title="Liên hệ hỗ trợ"
        onCancel={() => setShowContactModal(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setShowContactModal(false)}>
            Đóng
          </Button>
        ]}
        className={styles.dashboardModal}
      >
        <div style={{ color: 'var(--text-primary)' }}>
          <p style={{ marginBottom: '12px', fontWeight: '500' }}>Thông tin liên hệ:</p>
          <ul style={{ margin: 0, paddingLeft: '20px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}>Email: <span style={{ color: 'var(--accent-primary)' }}>support@example.com</span></li>
            <li style={{ marginBottom: '8px' }}>Hotline: <span style={{ color: 'var(--accent-primary)' }}>1900-xxxx</span></li>
            <li style={{ marginBottom: '8px' }}>Giờ làm việc: 8:00 - 18:00 (Thứ 2 - Thứ 6)</li>
          </ul>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', margin: 0, fontStyle: 'italic' }}>
            * Chức năng này sẽ được phát triển trong tương lai
          </p>
        </div>
      </Modal>

      {/* Custom Color Selection Modal */}
      <Modal
        open={showColorModal}
        title="Tùy chỉnh màu sắc"
        onCancel={() => setShowColorModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowColorModal(false)}>
            Hủy
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveColors}>
            Lưu
          </Button>
        ]}
        className={styles.dashboardModal}
        width={600}
      >
        <div style={{ color: 'var(--text-primary)' }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ marginBottom: '12px', fontWeight: '500' }}>Chọn màu sắc cho giao diện:</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Color 1 */}
            <div key="color-1">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Màu 1:
              </label>
              <ColorPicker
                value={selectedColors[0].color}
                onChange={(color) => {
                  const newColors = [...selectedColors];
                  newColors[0] = { ...newColors[0], color: color.toHexString() };
                  setSelectedColors(newColors);
                }}
                showText
                style={{ width: '100%' }}
              />
            </div>

            {/* Color 2 */}
            <div key="color-2">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Màu 2:
              </label>
              <ColorPicker
                value={selectedColors[1].color}
                onChange={(color) => {
                  const newColors = [...selectedColors];
                  newColors[1] = { ...newColors[1], color: color.toHexString() };
                  setSelectedColors(newColors);
                }}
                showText
                style={{ width: '100%' }}
              />
            </div>

            {/* Color 3 */}
            <div key="color-3">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Màu 3:
              </label>
              <ColorPicker
                value={selectedColors[2].color}
                onChange={(color) => {
                  const newColors = [...selectedColors];
                  newColors[2] = { ...newColors[2], color: color.toHexString() };
                  setSelectedColors(newColors);
                }}
                showText
                style={{ width: '100%' }}
              />
            </div>

            {/* Color 4 */}
            <div key="color-4">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Màu 4:
              </label>
              <ColorPicker
                value={selectedColors[3].color}
                onChange={(color) => {
                  const newColors = [...selectedColors];
                  newColors[3] = { ...newColors[3], color: color.toHexString() };
                  setSelectedColors(newColors);
                }}
                showText
                style={{ width: '100%' }}
              />
            </div>

            {/* Color 5 */}
            <div key="color-5">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Màu 5:
              </label>
              <ColorPicker
                value={selectedColors[4].color}
                onChange={(color) => {
                  const newColors = [...selectedColors];
                  newColors[4] = { ...newColors[4], color: color.toHexString() };
                  setSelectedColors(newColors);
                }}
                showText
                style={{ width: '100%' }}
              />
            </div>

            {/* Color 6 */}
            <div key="color-6">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Màu 6:
              </label>
              <ColorPicker
                value={selectedColors[5].color}
                onChange={(color) => {
                  const newColors = [...selectedColors];
                  newColors[5] = { ...newColors[5], color: color.toHexString() };
                  setSelectedColors(newColors);
                }}
                showText
                style={{ width: '100%' }}
              />
            </div>

            {/* Color 7 */}
            <div key="color-7">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Màu 7:
              </label>
              <ColorPicker
                value={selectedColors[6].color}
                onChange={(color) => {
                  const newColors = [...selectedColors];
                  newColors[6] = { ...newColors[6], color: color.toHexString() };
                  setSelectedColors(newColors);
                }}
                showText
                style={{ width: '100%' }}
              />
            </div>

            {/* Color 8 */}
            <div key="color-8">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Màu 8:
              </label>
              <ColorPicker
                value={selectedColors[7].color}
                onChange={(color) => {
                  const newColors = [...selectedColors];
                  newColors[7] = { ...newColors[7], color: color.toHexString() };
                  setSelectedColors(newColors);
                }}
                showText
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Preview Section */}
          <div style={{ marginTop: '20px', padding: '15px', border: '1px solid var(--border-secondary)', borderRadius: '8px' }}>
            <p style={{ marginBottom: '10px', fontWeight: '500' }}>Xem trước các màu đã chọn:</p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
              marginBottom: '15px'
            }}>
              {selectedColors.map((colorObj, index) => (
                <div
                  key={colorObj.id}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    backgroundColor: colorObj.color,
                    color: '#ffffff',
                    textAlign: 'center',
                    fontWeight: '500',
                    fontSize: '12px',
                    border: '1px solid var(--border-secondary)'
                  }}
                >
                  Màu {colorObj.id}
                </div>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
              Các màu này sẽ được lưu vào cơ sở dữ liệu và có thể sử dụng trong ứng dụng.
            </p>
          </div>
        </div>
      </Modal>

      {/* Custom Dashboard Colors Modal */}
      <Modal
        open={showBackgroundModal}
        title="Cấu hình màu sắc Dashboard"
        onCancel={() => setShowBackgroundModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowBackgroundModal(false)}>
            Hủy
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveBackgroundColors}>
            Lưu
          </Button>
        ]}
        width={600}
      >
        <div style={{ color: 'var(--text-primary)' }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ marginBottom: '12px', fontWeight: '500' }}>Chọn màu sắc cho Dashboard:</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Background Gradient Colors */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Màu nền 1 (Gradient Color 1):
              </label>
              <ColorPicker
                value={dashboardColors.background.gradient[0]}
                onChange={(color) => {
                  const newGradient = [...dashboardColors.background.gradient];
                  newGradient[0] = color.toHexString();
                  setDashboardColors(prev => ({
                    ...prev,
                    background: { ...prev.background, gradient: newGradient }
                  }));
                }}
                showText
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Màu nền 2 (Gradient Color 2):
              </label>
              <ColorPicker
                value={dashboardColors.background.gradient[1]}
                onChange={(color) => {
                  const newGradient = [...dashboardColors.background.gradient];
                  newGradient[1] = color.toHexString();
                  setDashboardColors(prev => ({
                    ...prev,
                    background: { ...prev.background, gradient: newGradient }
                  }));
                }}
                showText
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Màu nền 3 (Gradient Color 3):
              </label>
              <ColorPicker
                value={dashboardColors.background.gradient[2]}
                onChange={(color) => {
                  const newGradient = [...dashboardColors.background.gradient];
                  newGradient[2] = color.toHexString();
                  setDashboardColors(prev => ({
                    ...prev,
                    background: { ...prev.background, gradient: newGradient }
                  }));
                }}
                showText
                style={{ width: '100%' }}
              />
            </div>

            {/* Grid Pattern Color */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Màu đường kẻ ô vuông (Grid Color):
              </label>
              <ColorPicker
                value={dashboardColors.background.gridColor}
                onChange={(color) => {
                  setDashboardColors(prev => ({
                    ...prev,
                    background: { ...prev.background, gridColor: color.toHexString() }
                  }));
                }}
                showText
                style={{ width: '100%' }}
              />
            </div>

            {/* Grid Pattern Opacity */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Độ trong suốt đường kẻ ô vuông (Grid Opacity):
              </label>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.01"
                value={dashboardColors.background.gridOpacity}
                onChange={(e) => {
                  const opacity = parseFloat(e.target.value);
                  setDashboardColors(prev => ({
                    ...prev,
                    background: {
                      ...prev.background,
                      gridOpacity: opacity
                    }
                  }));
                }}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {dashboardColors.background.gridOpacity}
              </span>
            </div>


          </div>

          {/* Preview Section */}
          <div style={{ marginTop: '20px', padding: '15px', border: '1px solid var(--border-secondary)', borderRadius: '8px' }}>
            <p style={{ marginBottom: '10px', fontWeight: '500' }}>Xem trước:</p>
            <div style={{
              height: '60px',
              background: `linear-gradient(45deg, ${dashboardColors.background.gradient.join(', ')})`,
              borderRadius: '8px',
              marginBottom: '10px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Grid Pattern Preview */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `linear-gradient(90deg, ${dashboardColors.background.gridColor} 1px, transparent 1px), linear-gradient(${dashboardColors.background.gridColor} 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
                opacity: dashboardColors.background.gridOpacity,
                pointerEvents: 'none'
              }} />
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
              Gradient: {dashboardColors.background.gradient.join(' → ')} | Grid: {dashboardColors.background.gridColor}
            </p>
          </div>
        </div>
      </Modal>

      {/* Custom Under-Development Modal */}
      <Modal
        open={showUnderDevelopmentModal}
        title="Ứng dụng đang phát triển"
        onCancel={() => setShowUnderDevelopmentModal(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setShowUnderDevelopmentModal(false)}>
            Đóng
          </Button>
        ]}
        width={400}
      >
        <div style={{ color: 'var(--text-primary)' }}>
          <p style={{ marginBottom: '12px', fontWeight: '500' }}>Ứng dụng này đang được phát triển. Bạn có thể theo dõi tiến độ tại đây.</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', margin: 0, fontStyle: 'italic' }}>
            * Chức năng này sẽ được phát triển trong tương lai
          </p>
        </div>
      </Modal>

      {/* Task Checklist Button - Always visible on desktop */}
      {/* {!isMobile && (
        <button
          onClick={() => {
            setShowTaskChecklistModal(true);
            try { localStorage.setItem('taskChecklistModalOpen', 'true'); } catch (_) {}
          }}
          style={{
            position: 'fixed',
            bottom:  '20px',
            right: '20px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: '#f0f8ff',
            border: 'none',
            color: '#1890ff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s ease',
            zIndex: 1000
          }}

          title="Xem danh sách nhiệm vụ"
        >
          <QuestionMark size={18} />
        </button>
      )} */}

      {/* Scroll Button - Chỉ hiện khi có thể scroll và không ở đầu/cuối */}
      {/* {showScrollButton && !isMobile && (
        <button
          onClick={() => handleScroll(isAtTop ? 'down' : 'up')}
          className={styles.scrollButton}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: '#ddf7f7',
            border: 'none',
            color: '#13C2C2',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s ease',
            zIndex: 1000
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
        >
          {isAtTop ? <ChevronDown size={18} style={{ background: 'none' }} /> : <ChevronUp size={18} style={{ background: 'none' }} />}
        </button>
      )} */}

      {/* Guideline Settings Modal */}
      <Modal
        open={showGuidelineModal}
        title="Cài đặt Guideline"
        onCancel={() => setShowGuidelineModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowGuidelineModal(false)}>
            Hủy
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveGuideline}>
            Lưu
          </Button>
        ]}
        width={600}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
        destroyOnClose
      >
        <div style={{ color: 'var(--text-primary)' }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ marginBottom: '12px', fontWeight: '500' }}>Cấu hình Guideline:</p>
          </div>

          {/* Image Upload Section */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Hình ảnh Guideline:
            </label>
            <Upload
              beforeUpload={handleImageUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Chọn hình ảnh</Button>
            </Upload>
            {guidelineImageUrl && (
              <div style={{ marginTop: '10px' }}>
                <img
                  src={guidelineImageUrl}
                  alt="Guideline Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-secondary)'
                  }}
                />
              </div>
            )}
          </div>

          {/* Markdown Text Input */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Nội dung Guideline (Markdown):
            </label>
            <Input.TextArea
              value={guidelineMarkdown}
              onChange={(e) => {
                setGuidelineMarkdown(e.target.value);
              }}
              placeholder="Nhập nội dung guideline bằng markdown..."
              rows={8}
              style={{ fontFamily: 'monospace' }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Hỗ trợ định dạng Markdown (**, *, #, ##, etc.)
            </p>
          </div>

          {/* Preview Section */}
          {guidelineMarkdown && (
            <div style={{ marginTop: '20px', padding: '15px', border: '1px solid var(--border-secondary)', borderRadius: '8px' }}>
              <p style={{ marginBottom: '10px', fontWeight: '500' }}>Xem trước:</p>
              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: 'var(--text-primary)'
                }}
                dangerouslySetInnerHTML={{
                  __html: marked(guidelineMarkdown)
                }}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Context Instruction Settings Modal */}
      <Modal
        open={showContextInstructionModal}
        title="Cài đặt Context Instruction"
        onCancel={() => setShowContextInstructionModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowContextInstructionModal(false)}>
            Hủy
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveContextInstruction}>
            Lưu
          </Button>
        ]}
        width={600}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
        destroyOnClose
      >
        <div style={{ color: 'var(--text-primary)' }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ marginBottom: '12px', fontWeight: '500' }}>Cấu hình Context Instruction:</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Context Instruction sẽ được sử dụng để cung cấp hướng dẫn và ngữ cảnh cho AI khi xử lý các tác vụ.
            </p>
          </div>

          {/* Context Instruction Text Input */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Nội dung Context Instruction:
            </label>
            <Input.TextArea
              value={contextInstruction}
              onChange={(e) => {
                setContextInstruction(e.target.value);
              }}
              placeholder="Nhập nội dung context instruction..."
              rows={12}
              style={{ fontFamily: 'monospace' }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Hướng dẫn này sẽ được sử dụng để cung cấp ngữ cảnh cho AI trong các tác vụ xử lý dữ liệu và phân tích.
            </p>
          </div>

          {/* Preview Section */}
          {contextInstruction && (
            <div style={{ marginTop: '20px', padding: '15px', border: '1px solid var(--border-secondary)', borderRadius: '8px' }}>
              <p style={{ marginBottom: '10px', fontWeight: '500' }}>Xem trước:</p>
              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {contextInstruction}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Background Settings Modal */}
      <Modal
        open={showBackgroundSettingsModal}
        title="Cài đặt hình nền Dashboard"
        onCancel={() => setShowBackgroundSettingsModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowBackgroundSettingsModal(false)}>
            Hủy
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveBackgroundSettings}>
            Lưu
          </Button>
        ]}
        width={500}
        destroyOnClose
      >
        <div style={{ color: 'var(--text-primary)' }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ marginBottom: '12px', fontWeight: '500' }}>Cấu hình hình nền Dashboard:</p>
          </div>

          {/* Background URL Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              URL hình nền:
            </label>
            <Input
              value={backgroundImageUrl}
              onChange={(e) => setBackgroundImageUrl(e.target.value)}
              placeholder="/simple_background.png"
              style={{ marginBottom: '10px' }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Nhập đường dẫn đến hình ảnh (ví dụ: /simple_background.png hoặc URL đầy đủ)
            </p>
          </div>

          {/* Background Preview */}
          {backgroundImageUrl && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ marginBottom: '10px', fontWeight: '500' }}>Xem trước:</p>
              <div
                style={{
                  width: '100%',
                  height: '200px',
                  backgroundImage: `url(${backgroundImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  borderRadius: '8px',
                  border: '1px solid var(--border-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '14px'
                }}
              >
                {backgroundImageUrl === '/simple_background.png' ? 'Hình nền mặc định' : 'Hình nền tùy chỉnh'}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* First Time Popup */}
      <FirstTimePopup
        visible={showFirstTimePopup}
        onClose={() => {
          setShowFirstTimePopup(false);
          // The FirstTimePopup component handles localStorage internally
        }}
      />

      {/* Modal thêm mới tool cho tab Research BPO */}
      <Modal
        open={showAddFormResearchBpo}
        title="Thêm mới tool - DV Nghiên cứu & BPO"
        onCancel={handleCancelAddResearchBpo}
        footer={null}
        destroyOnClose
        className={styles.dashboardModal}
        style={{ top: 20 }}
        width={600}
      >
        <div style={{ padding: '20px 0' }}>
          {/* Icon Selector */}
          <div className={styles.iconSelectorWrapper}>
            <div className={styles.iconSelectorList}>
              {commonIcons.map(icon => (
                <button
                  key={icon.id}
                  onClick={() => setNewToolResearchBpo({ ...newToolResearchBpo, icon: icon.id })}
                  className={styles.iconSelectorBtn + ' ' + (newToolResearchBpo.icon === icon.id ? styles.iconSelectorBtnActive : '')}
                >
                  {icon.icon ? (
                    <img src={icon.icon} alt="icon" width={32} height={32} />
                  ) : icon.id}
                </button>
              ))}
            </div>

          </div>
          {/* Multiple Tag Selector */}
          <div className={styles.tagSelectorWrapper}>
            <label className={styles.tagLabel}>Tags:</label>
            <div className={styles.tagOptions}>
              {tagOptions?.length > 0 && tagOptions.map(tag => (
                <label key={tag.value} className={styles.tagOption}>
                  <input
                    type="checkbox"
                    checked={newToolResearchBpo.tags?.includes(tag.value) || false}
                    onChange={() => {
                      const currentTags = newToolResearchBpo.tags || [];
                      const newTags = currentTags.includes(tag.value)
                        ? currentTags.filter(t => t !== tag.value)
                        : [...currentTags, tag.value];
                      setNewToolResearchBpo({ ...newToolResearchBpo, tags: newTags });
                    }}
                    className={styles.tagCheckbox}
                  />
                  <span
                    className={styles.tagLabel}
                    style={{
                      backgroundColor: newToolResearchBpo.tags?.includes(tag.value) ? tag.color : '#f5f5f5',
                      color: newToolResearchBpo.tags?.includes(tag.value) ? 'white' : '#666'
                    }}
                  >
                    {tag.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          {/* Title Input */}
          <input
            type="text"
            placeholder="Tool name"
            value={newToolResearchBpo.name}
            onChange={(e) => setNewToolResearchBpo({ ...newToolResearchBpo, name: e.target.value })}
            className={styles.toolTitleInput}
            autoFocus
          />
          {/* Description Input */}
          <textarea
            placeholder="Tool description"
            value={newToolResearchBpo.description}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 50) {
                setNewToolResearchBpo({ ...newToolResearchBpo, description: value });
              }
            }}
            className={styles.toolDescInput}
            rows="2"
            maxLength="50"
          />
          {/* Extra fields */}
          <div className={styles.formGridOne}>
            <Input
              placeholder="EnterApp URL"
              value={newToolResearchBpo.enterUrl}
              onChange={(e) => setNewToolResearchBpo({ ...newToolResearchBpo, enterUrl: e.target.value })}
              className={styles.dashboardInput}
            />
          </div>
          <div className={styles.formGridOne}>
            <Input
              placeholder="Shortcut (e.g., Ctrl+Alt+S)"
              value={newToolResearchBpo.shortcut}
              onChange={(e) => setNewToolResearchBpo({ ...newToolResearchBpo, shortcut: e.target.value })}
              className={styles.dashboardInput}
            />
          </div>
          <div className={styles.formGridOne}>
            <Input.TextArea
              placeholder="Nội dung 1"
              value={newToolResearchBpo.content1 || ''}
              onChange={(e) => setNewToolResearchBpo({ ...newToolResearchBpo, content1: e.target.value })}
              rows={4}
              className={styles.dashboardInput}
            />
          </div>
          <div className={styles.formGridOne}>
            <Input.TextArea
              placeholder="Nội dung 2"
              value={newToolResearchBpo.content2 || ''}
              onChange={(e) => setNewToolResearchBpo({ ...newToolResearchBpo, content2: e.target.value })}
              rows={4}
              className={styles.dashboardInput}
            />
          </div>
          <div className={styles.formCheckRow}>
            <Checkbox
              checked={!!newToolResearchBpo.showSupport}
              onChange={(e) => setNewToolResearchBpo({ ...newToolResearchBpo, showSupport: e.target.checked })}
            >
              Hiện nút Gửi yêu cầu hỗ trợ
            </Checkbox>
            <Checkbox
              checked={!!newToolResearchBpo.showInfo}
              onChange={(e) => setNewToolResearchBpo({ ...newToolResearchBpo, showInfo: e.target.checked })}
            >
              Hiện nút Thông tin
            </Checkbox>
          </div>
          {/* Action Buttons */}
          <div className={styles.toolActionRow}>
            <button
              onClick={handleAddResearchBpo}
              className={styles.saveBtn}
            >
              <Check className={styles.iconCheckSmall} />
              Add
            </button>
            <button
              onClick={handleCancelAddResearchBpo}
              className={styles.cancelBtn}
            >
              <X className={styles.iconCancelSmall} />
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal thêm mới tool cho tab Training Productivity */}
      <Modal
        open={showAddFormTrainingProductivity}
        title="Thêm mới tool - Đào tạo & Năng suất"
        onCancel={handleCancelAddTrainingProductivity}
        footer={null}
        destroyOnClose
        className={styles.dashboardModal}
        style={{ top: 20 }}
        width={600}
      >
        <div style={{ padding: '20px 0' }}>
          {/* Icon Selector */}
          <div className={styles.iconSelectorWrapper}>
            <div className={styles.iconSelectorList}>
              {commonIcons.map(icon => (
                <button
                  key={icon.id}
                  onClick={() => setNewToolTrainingProductivity({ ...newToolTrainingProductivity, icon: icon.id })}
                  className={styles.iconSelectorBtn + ' ' + (newToolTrainingProductivity.icon === icon.id ? styles.iconSelectorBtnActive : '')}
                >
                  {icon.icon ? (
                    <img src={icon.icon} alt="icon" width={32} height={32} />
                  ) : icon.id}
                </button>
              ))}
            </div>

          </div>
          {/* Multiple Tag Selector */}
          <div className={styles.tagSelectorWrapper}>
            <label className={styles.tagLabel}>Tags:</label>
            <div className={styles.tagOptions}>
              {tagOptions?.length > 0 && tagOptions.map(tag => (
                <label key={tag.value} className={styles.tagOption}>
                  <input
                    type="checkbox"
                    checked={newToolTrainingProductivity.tags?.includes(tag.value) || false}
                    onChange={() => {
                      const currentTags = newToolTrainingProductivity.tags || [];
                      const newTags = currentTags.includes(tag.value)
                        ? currentTags.filter(t => t !== tag.value)
                        : [...currentTags, tag.value];
                      setNewToolTrainingProductivity({ ...newToolTrainingProductivity, tags: newTags });
                    }}
                    className={styles.tagCheckbox}
                  />
                  <span
                    className={styles.tagLabel}
                    style={{
                      backgroundColor: newToolTrainingProductivity.tags?.includes(tag.value) ? tag.color : '#f5f5f5',
                      color: newToolTrainingProductivity.tags?.includes(tag.value) ? 'white' : '#666'
                    }}
                  >
                    {tag.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          {/* Title Input */}
          <input
            type="text"
            placeholder="Tool name"
            value={newToolTrainingProductivity.name}
            onChange={(e) => setNewToolTrainingProductivity({ ...newToolTrainingProductivity, name: e.target.value })}
            className={styles.toolTitleInput}
            autoFocus
          />
          {/* Description Input */}
          <textarea
            placeholder="Tool description"
            value={newToolTrainingProductivity.description}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 50) {
                setNewToolTrainingProductivity({ ...newToolTrainingProductivity, description: value });
              }
            }}
            className={styles.toolDescInput}
            rows="2"
            maxLength="50"
          />
          {/* Extra fields */}
          <div className={styles.formGridOne}>
            <Input
              placeholder="EnterApp URL"
              value={newToolTrainingProductivity.enterUrl}
              onChange={(e) => setNewToolTrainingProductivity({ ...newToolTrainingProductivity, enterUrl: e.target.value })}
              className={styles.dashboardInput}
            />
          </div>
          <div className={styles.formGridOne}>
            <Input
              placeholder="Shortcut (e.g., Ctrl+Alt+S)"
              value={newToolTrainingProductivity.shortcut}
              onChange={(e) => setNewToolTrainingProductivity({ ...newToolTrainingProductivity, shortcut: e.target.value })}
              className={styles.dashboardInput}
            />
          </div>
          <div className={styles.formGridOne}>
            <Input.TextArea
              placeholder="Nội dung 1"
              value={newToolTrainingProductivity.content1 || ''}
              onChange={(e) => setNewToolTrainingProductivity({ ...newToolTrainingProductivity, content1: e.target.value })}
              rows={4}
              className={styles.dashboardInput}
            />
          </div>
          <div className={styles.formGridOne}>
            <Input.TextArea
              placeholder="Nội dung 2"
              value={newToolTrainingProductivity.content2 || ''}
              onChange={(e) => setNewToolTrainingProductivity({ ...newToolTrainingProductivity, content2: e.target.value })}
              rows={4}
              className={styles.dashboardInput}
            />
          </div>
          <div className={styles.formCheckRow}>
            <Checkbox
              checked={!!newToolTrainingProductivity.showSupport}
              onChange={(e) => setNewToolTrainingProductivity({ ...newToolTrainingProductivity, showSupport: e.target.checked })}
            >
              Hiện nút Gửi yêu cầu hỗ trợ
            </Checkbox>
            <Checkbox
              checked={!!newToolTrainingProductivity.showInfo}
              onChange={(e) => setNewToolTrainingProductivity({ ...newToolTrainingProductivity, showInfo: e.target.checked })}
            >
              Hiện nút Thông tin
            </Checkbox>
          </div>
          {/* Action Buttons */}
          <div className={styles.toolActionRow}>
            <button
              onClick={handleAddTrainingProductivity}
              className={styles.saveBtn}
            >
              <Check className={styles.iconCheckSmall} />
              Add
            </button>
            <button
              onClick={handleCancelAddTrainingProductivity}
              className={styles.cancelBtn}
            >
              <X className={styles.iconCancelSmall} />
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal đăng ký tư vấn/tham gia */}
      <Modal
        title="Đăng ký tư vấn/tham gia"
        open={showRegistrationModal}
        onCancel={handleCancelRegistration}
        footer={[
          <Button key="cancel" onClick={handleCancelRegistration}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmitRegistration}>
            Đăng ký
          </Button>
        ]}
        width={600}
      >
        <div style={{ padding: '20px 0' }}>
          {/* Mục việc */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Đăng ký tư vấn/tham gia - Mục việc
            </label>
            <Input
              value={registrationForm.jobTitle}
              onChange={(e) => handleRegistrationFormChange('jobTitle', e.target.value)}
              placeholder="Nhập mục việc bạn quan tâm"
              className={styles.dashboardInput}
            />
          </div>

          {/* Họ & Tên */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Họ & Tên <span style={{ color: 'red' }}>*</span>
            </label>
            <Input
              value={registrationForm.fullName}
              onChange={(e) => handleRegistrationFormChange('fullName', e.target.value)}
              placeholder="Nhập họ và tên đầy đủ"
              className={styles.dashboardInput}
            />
          </div>

          {/* Mobile/Zalo liên hệ */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Mobile/Zalo liên hệ <span style={{ color: 'red' }}>*</span>
            </label>
            <Input
              value={registrationForm.contactInfo}
              onChange={(e) => handleRegistrationFormChange('contactInfo', e.target.value)}
              placeholder="Nhập số điện thoại hoặc Zalo"
              className={styles.dashboardInput}
            />
          </div>

          {/* Kênh ưu tiên */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Kênh ưu tiên
            </label>
            <Select
              value={registrationForm.preferredChannel}
              onChange={(value) => handleRegistrationFormChange('preferredChannel', value)}
              style={{ width: '100%' }}
              className={styles.dashboardInput}
            >
              <Select.Option value="call">Call trực tiếp</Select.Option>
              <Select.Option value="zalo">Nhắn tin Zalo</Select.Option>
              <Select.Option value="message">Tin nhắn</Select.Option>
            </Select>
          </div>

          {/* Chú thích/thông tin khác */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Chú thích/thông tin khác
            </label>
            <Input.TextArea
              value={registrationForm.notes}
              onChange={(e) => handleRegistrationFormChange('notes', e.target.value)}
              placeholder="Nhập thông tin bổ sung hoặc câu hỏi của bạn"
              rows={4}
              className={styles.dashboardInput}
            />
          </div>
        </div>
      </Modal>

      {/* Modal cài đặt màu thẻ số liệu */}
      <Modal
        title="Cài đặt countdown"
        open={showDaysCountdownColorModal}
        onCancel={() => setShowDaysCountdownColorModal(false)}
        onOk={() => {
          saveDaysCountdownColors(daysCountdownTextColors);
          setShowDaysCountdownColorModal(false);
        }}
        width={700}
      >
        <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Phần cài đặt màu */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>Màu chữ countdown</h4>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ minWidth: 140, fontWeight: 600 }}>Màu chữ (HEX):</label>
              <input
                type="text"
                value={daysCountdownTextColors}
                onChange={(e) => {
                  const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                  setDaysCountdownTextColors(v);
                }}
                placeholder="#FFFFFF"
                style={{ flex: 1, height: 36, border: '1px solid #d9d9d9', borderRadius: 6, padding: '0 10px' }}
              />
              <input
                type="color"
                value={daysCountdownTextColors}
                onChange={(e) => {
                  const v = e.target.value;
                  setDaysCountdownTextColors(v);
                }}
                style={{ width: 42, height: 36, border: '1px solid #d9d9d9', borderRadius: 6 }}
              />
            </div>

            {/* Preview: chỉ hiển thị mã màu và swatch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 4, background: daysCountdownTextColors, border: '1px solid #e5e7eb' }} />
              <span style={{ fontFamily: 'monospace' }}>{daysCountdownTextColors}</span>
            </div>
          </div>

          {/* Phần cài đặt countdown cố định */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>Countdown cố định</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6 }}>
                <span style={{ fontWeight: 500 }}>Countdown tháng</span>
                <button
                  onClick={() => handleToggleFixedCountdown('month')}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: showFixedCountdowns.month ? '#52c41a' : '#ff4d4f',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {showFixedCountdowns.month ? 'Hiện' : 'Ẩn'}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6 }}>
                <span style={{ fontWeight: 500 }}>Countdown năm</span>
                <button
                  onClick={() => handleToggleFixedCountdown('year')}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: showFixedCountdowns.year ? '#52c41a' : '#ff4d4f',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {showFixedCountdowns.year ? 'Hiện' : 'Ẩn'}
                </button>
              </div>
            </div>
          </div>

          {/* Phần quản lý countdown items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Danh sách countdown</h4>
              <button
                onClick={() => setShowAddCountdownModal(true)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                + Thêm countdown
              </button>
            </div>

            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: 6 }}>
              {countdownItems.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                  Chưa có countdown nào
                </div>
              ) : (
                countdownItems.map((item) => (
                  <div key={item.id} style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    // opacity: item.isHidden ? 0.5 : 1
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 500,
                        marginBottom: 4,
                        textDecoration: item.isHidden ? 'line-through' : 'none'
                      }}>
                        {item.description}
                        {item.isHidden && <span style={{ color: '#999', fontSize: '12px', marginLeft: 8 }}>(Đã ẩn)</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(item.target).toLocaleDateString('vi-VN')} - {item.unit}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleToggleCountdownVisibility(item.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: item.isHidden ? '#52c41a' : '#faad14',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        title={item.isHidden ? 'Hiện' : 'Ẩn'}
                      >
                        {item.isHidden ? 'Hiện' : 'Ẩn'}
                      </button>
                      <button
                        onClick={() => handleEditCountdown(item)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#f0f0f0',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteCountdown(item.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ff4d4f',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* KPI Benchmark Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📊 Cấu hình KPI Benchmark</span>
            <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
              ({kpiBenchmarks.length} mục)
            </span>
          </div>
        }
        open={showKpiBenchmarkModal}
        onCancel={handleCloseKpiBenchmarkModal}
        width={1400}
        footer={null}
        styles={{
          body: { padding: '20px' }
        }}
      >
        {/* Header với nút thêm mới */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          padding: '12px 16px',
          backgroundColor: '#f8f9fa',
          borderRadius: 8,
          border: '1px solid #e9ecef'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#495057' }}>
              Quản lý KPI Benchmark
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6c757d' }}>
              Tạo và quản lý các tiêu chí đánh giá hiệu suất
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<span style={{ fontSize: '16px' }}>➕</span>}
            onClick={() => handleOpenKpiBenchmarkFormModal()}
            style={{
              height: '40px',
              borderRadius: 8,
              fontWeight: 500
            }}
          >
            Thêm KPI Benchmark
          </Button>
        </div>


        {/* Danh sách KPI Benchmark - Cải thiện UI */}
        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
          {kpiBenchmarks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: '#8c8c8c',
              backgroundColor: '#fafafa',
              borderRadius: 12,
              border: '2px dashed #d9d9d9'
            }}>
              <div style={{ fontSize: '48px', marginBottom: 16 }}>📊</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#595959' }}>Chưa có KPI Benchmark nào</h3>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Nhấn nút "Thêm KPI Benchmark" để bắt đầu tạo tiêu chí đánh giá đầu tiên
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {kpiBenchmarks.map((benchmark, index) => (
                <div key={benchmark.id} style={{
                  border: '1px solid #e8e8e8',
                  borderRadius: 12,
                  padding: 20,
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.2s ease',
                  ':hover': {
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)'
                  }
                }}>
                  {/* Header của mỗi item */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 16
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{
                          display: 'inline-block',
                          width: 24,
                          height: 24,
                          backgroundColor: '#1890ff',
                          color: 'white',
                          borderRadius: '50%',
                          textAlign: 'center',
                          lineHeight: '24px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </span>
                        <h4 style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#262626'
                        }}>
                          {benchmark.name}
                        </h4>
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: 12,
                          fontSize: '12px',
                          color: '#666',
                          fontWeight: 500
                        }}>
                          {benchmark.code}
                        </span>
                      </div>
                      {benchmark.description && (
                        <p style={{
                          margin: '0 0 8px 0',
                          color: '#595959',
                          fontSize: '14px',
                          lineHeight: 1.5
                        }}>
                          {benchmark.description}
                        </p>
                      )}
                      {benchmark.category && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>🏷️</span>
                          <span style={{
                            fontSize: '12px',
                            color: '#1890ff',
                            backgroundColor: '#e6f7ff',
                            padding: '2px 8px',
                            borderRadius: 4
                          }}>
                            {benchmark.category}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        size="small"
                        icon={<span>✏️</span>}
                        onClick={() => handleEditKpiBenchmark(benchmark)}
                        style={{ borderRadius: 6 }}
                      >
                        Sửa
                      </Button>
                      <Popconfirm
                        title="Xóa KPI Benchmark"
                        description="Bạn có chắc chắn muốn xóa KPI Benchmark này không?"
                        onConfirm={() => handleDeleteKpiBenchmark(benchmark.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<span>🗑️</span>}
                          style={{ borderRadius: 6 }}
                        >
                          Xóa
                        </Button>
                      </Popconfirm>
                    </div>
                  </div>

                  {/* Hiển thị dữ liệu 12 cột - Cải thiện */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: 8,
                    padding: 12,
                    backgroundColor: '#fafafa',
                    borderRadius: 8,
                    border: '1px solid #f0f0f0'
                  }}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <div key={i} style={{
                        padding: '8px 12px',
                        backgroundColor: '#fff',
                        borderRadius: 6,
                        border: '1px solid #e8e8e8',
                        minHeight: 60,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#1890ff',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Cột {i + 1}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: '#262626',
                          wordBreak: 'break-word',
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {benchmark.data?.[`col${i + 1}`] || (
                            <span style={{ color: '#bfbfbf', fontStyle: 'italic' }}>Trống</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* KPI Benchmark Form Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{editingKpiBenchmark?.id ? '✏️' : '➕'}</span>
            <span>{editingKpiBenchmark?.id ? 'Chỉnh sửa KPI Benchmark' : 'Thêm KPI Benchmark mới'}</span>
          </div>
        }
        open={showKpiBenchmarkFormModal}
        onCancel={handleCloseKpiBenchmarkFormModal}
        width={1000}
        footer={null}
        styles={{
          body: { padding: '24px' }
        }}
      >
        <div style={{
          border: '2px solid #1890ff',
          borderRadius: 12,
          padding: 24,
          backgroundColor: '#f0f8ff',
          boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)'
        }}>
          {/* Thông tin cơ bản */}
          <div style={{ marginBottom: 24 }}>
            <h5 style={{ margin: '0 0 16px 0', color: '#262626', fontSize: '16px', fontWeight: 600 }}>
              📝 Thông tin cơ bản
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#262626' }}>
                  Tên KPI Benchmark <span style={{ color: 'red' }}>*</span>
                </label>
                <Input
                  value={editingKpiBenchmark?.name || ''}
                  onChange={(e) => setEditingKpiBenchmark({ ...editingKpiBenchmark, name: e.target.value })}
                  placeholder="Ví dụ: KPI Doanh thu Q1"
                  size="large"
                  style={{ borderRadius: 8 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#262626' }}>
                  Mã định danh <span style={{ color: 'red' }}>*</span>
                </label>
                <Input
                  value={editingKpiBenchmark?.code || ''}
                  onChange={(e) => setEditingKpiBenchmark({ ...editingKpiBenchmark, code: e.target.value })}
                  placeholder="Ví dụ: KPI_REVENUE_Q1"
                  size="large"
                  style={{ borderRadius: 8 }}
                />
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#262626' }}>
                Mô tả chi tiết
              </label>
              <Input.TextArea
                value={editingKpiBenchmark?.description || ''}
                onChange={(e) => setEditingKpiBenchmark({ ...editingKpiBenchmark, description: e.target.value })}
                placeholder="Mô tả chi tiết về KPI Benchmark này..."
                rows={3}
                style={{ borderRadius: 8 }}
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#262626' }}>
                Danh mục
              </label>
              <Input
                value={editingKpiBenchmark?.category || ''}
                onChange={(e) => setEditingKpiBenchmark({ ...editingKpiBenchmark, category: e.target.value })}
                placeholder="Ví dụ: Doanh thu, Marketing, Nhân sự..."
                size="large"
                style={{ borderRadius: 8 }}
              />
            </div>
          </div>

          {/* Dữ liệu 12 cột */}
          <div style={{ marginBottom: 24 }}>
            <h5 style={{ margin: '0 0 16px 0', color: '#262626', fontSize: '16px', fontWeight: 600 }}>
              📊 Dữ liệu KPI (12 cột)
            </h5>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              padding: 20,
              backgroundColor: '#fff',
              borderRadius: 8,
              border: '1px solid #d9d9d9'
            }}>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <label style={{
                    fontSize: '13px',
                    color: '#666',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: 18,
                      height: 18,
                      backgroundColor: '#1890ff',
                      color: 'white',
                      borderRadius: '50%',
                      textAlign: 'center',
                      lineHeight: '18px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {i + 1}
                    </span>
                    Cột {i + 1}
                  </label>
                  <Input
                    value={editingKpiBenchmark?.data?.[`col${i + 1}`] || ''}
                    onChange={(e) => setEditingKpiBenchmark({
                      ...editingKpiBenchmark,
                      data: {
                        ...editingKpiBenchmark.data,
                        [`col${i + 1}`]: e.target.value
                      }
                    })}
                    placeholder={`Dữ liệu ${i + 1}`}
                    size="small"
                    style={{ borderRadius: 6 }}
                  />
                </div>
              ))}
            </div>
            <p style={{
              margin: '12px 0 0 0',
              fontSize: '13px',
              color: '#8c8c8c',
              fontStyle: 'italic'
            }}>
              💡 Mẹo: Bạn có thể để trống các cột không cần thiết
            </p>
          </div>

          {/* Nút hành động */}
          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
            paddingTop: 20,
            borderTop: '1px solid #d9d9d9'
          }}>
            <Button
              size="large"
              onClick={handleCloseKpiBenchmarkFormModal}
              style={{ borderRadius: 8 }}
            >
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={editingKpiBenchmark?.id ? handleUpdateKpiBenchmark : handleCreateKpiBenchmark}
              style={{ borderRadius: 8 }}
              disabled={!editingKpiBenchmark?.name || !editingKpiBenchmark?.code}
            >
              {editingKpiBenchmark?.id ? '💾 Cập nhật' : '✅ Tạo mới'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Tag Management Modal */}
      <TagManagementModal
        visible={showTagManagementModal}
        onClose={() => setShowTagManagementModal(false)}
        tagOptions={tagOptions}
        setTagOptions={setTagOptions}
      />

      {/* Topbar Theme Settings Modal */}
      <Modal
        title="Cài đặt Theme Topbar"
        open={showTopbarThemeModal}
        onCancel={() => setShowTopbarThemeModal(false)}
        footer={null}
        width={600}
      >
        <div style={{ padding: '20px 0' }}>
          <h4 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600 }}>Chọn theme cho thanh topbar</h4>

          {/* Theme Light */}
          <div
            onClick={() => {
              const lightTheme = {
                name: 'light',
                background: '#FFFFFF',
                textColor: '#454545',
                superAdminColor: '#66A2E7',
                iconApp: '/LogoC.png'
              };
              handleSaveTopbarTheme(lightTheme);
            }}
            style={{
              padding: 20,
              border: topbarTheme.name === 'light' ? '3px solid #1890ff' : '2px solid #e8e8e8',
              borderRadius: 12,
              marginBottom: 16,
              cursor: 'pointer',
              backgroundColor: topbarTheme.name === 'light' ? '#f0f8ff' : '#fff',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: topbarTheme.name === 'light' ? '6px solid #1890ff' : '2px solid #d9d9d9',
                transition: 'all 0.3s ease'
              }} />
              <h5 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Theme Light (Hiện tại)</h5>
            </div>

            {/* Preview */}
            <div style={{
              padding: 16,
              background: '#FFFFFF',
              border: '1px solid #e8e8e8',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 30,
                  height: 30,
                  backgroundColor: '#f4f4f4',
                  borderRadius: 4
                }} />
                <span style={{ fontSize: 18, fontWeight: 'bold', color: '#454545' }}>WIKI CANVAS </span>
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
              <div>• Nền: Trắng (#FFFFFF)</div>
              <div>• Chữ: Xám (#454545)</div>
            </div>
          </div>

          {/* Theme Dark */}
          <div
            onClick={() => {
              const darkTheme = {
                name: 'dark',
                background: '#192039',
                textColor: '#FFFFFF',
                superAdminColor: '#66A2E7',
                iconApp: '/LogoB.png'
              };
              handleSaveTopbarTheme(darkTheme);
            }}
            style={{
              padding: 20,
              border: topbarTheme.name === 'dark' ? '3px solid #1890ff' : '2px solid #e8e8e8',
              borderRadius: 12,
              cursor: 'pointer',
              backgroundColor: topbarTheme.name === 'dark' ? '#f0f8ff' : '#fff',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: topbarTheme.name === 'dark' ? '6px solid #1890ff' : '2px solid #d9d9d9',
                transition: 'all 0.3s ease'
              }} />
              <h5 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Theme Dark</h5>
            </div>

            {/* Preview */}
            <div style={{
              padding: 16,
              background: '#192039',
              border: '1px solid #192039',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 30,
                  height: 30,
                  backgroundColor: '#2a3650',
                  borderRadius: 4
                }} />
                <span style={{ fontSize: 18, fontWeight: 'bold', color: '#94BEF2' }}>WIKI CANVAS </span>
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
              <div>• Nền: Navy Blue (#192039)</div>
              <div>• Chữ: Trắng (#94BEF2)</div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Status Bar Theme Settings Modal */}
      <Modal
        title="Cài đặt Màu Status Bar"
        open={showStatusBarThemeModal}
        onCancel={() => setShowStatusBarThemeModal(false)}
        footer={null}
        width={500}
      >
        <div style={{ padding: '20px 0' }}>
          <h4 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600 }}>Tùy chỉnh màu sắc cho thanh status bar</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Màu nền */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                Màu nền:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="color"
                  value={tempStatusBarTheme.background}
                  onChange={(e) => setTempStatusBarTheme(prev => ({
                    ...prev,
                    background: e.target.value
                  }))}
                  style={{
                    width: 50,
                    height: 40,
                    border: '1px solid #d9d9d9',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={tempStatusBarTheme.background}
                  onChange={(e) => setTempStatusBarTheme(prev => ({
                    ...prev,
                    background: e.target.value
                  }))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="#303237"
                />
              </div>
            </div>

            {/* Màu chữ */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                Màu chữ:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="color"
                  value={tempStatusBarTheme.textColor}
                  onChange={(e) => setTempStatusBarTheme(prev => ({
                    ...prev,
                    textColor: e.target.value
                  }))}
                  style={{
                    width: 50,
                    height: 40,
                    border: '1px solid #d9d9d9',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={tempStatusBarTheme.textColor}
                  onChange={(e) => setTempStatusBarTheme(prev => ({
                    ...prev,
                    textColor: e.target.value
                  }))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="#A5A5A5"
                />
              </div>
            </div>

            {/* Preview */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                Xem trước:
              </label>
              <div style={{
                padding: 16,
                background: tempStatusBarTheme.background,
                border: '1px solid #e8e8e8',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button style={{
                    padding: '7px 15px',
                    fontSize: 15.5,
                    fontWeight: 600,
                    border: `1px solid ${tempStatusBarTheme.textColor}`,
                    borderRadius: 3,
                    background: 'transparent',
                    color: tempStatusBarTheme.textColor,
                    cursor: 'pointer'
                  }}>
                    Tất cả Module
                  </button>
                  <button style={{
                    padding: '7px 15px',
                    fontSize: 15.5,
                    fontWeight: 500,
                    border: '1px solid transparent',
                    borderRadius: 3,
                    background: 'transparent',
                    color: tempStatusBarTheme.textColor,
                    cursor: 'pointer'
                  }}>
                    CRM
                  </button>
                </div>
                <div style={{ color: tempStatusBarTheme.textColor }}>14:30 13/10/2025</div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={handleCancelStatusBarTheme}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => handleSaveStatusBarTheme(tempStatusBarTheme)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: 6,
                  background: '#1890ff',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Bottom left corner running text */}
      <div className={styles.bottomLeftTicker}>
        <span className={styles.bottomLeftTickerText}>
          {/*Bcanvas Data & Analytics SaaS.*/}
        </span>
      </div>

      {/* Theme Settings Modal */}
      <Modal
        title="🎨 Cài đặt Theme Badge Navbar"
        open={themeSettingsModalVisible}
        onOk={handleSaveThemeSettings}
        onCancel={handleCancelThemeSettings}
        width={600}
        okText="Lưu"
        cancelText="Hủy"
      >
        <div style={{ padding: '20px 0' }}>
          {/* Background Type */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              Loại nền:
            </label>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="backgroundType"
                  value="solid"
                  checked={tempThemeSettings.backgroundType === 'solid'}
                  onChange={(e) => handleThemeSettingsChange('backgroundType', e.target.value)}
                />
                <span>Màu đơn</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="backgroundType"
                  value="gradient"
                  checked={tempThemeSettings.backgroundType === 'gradient'}
                  onChange={(e) => handleThemeSettingsChange('backgroundType', e.target.value)}
                />
                <span>Gradient</span>
              </label>
            </div>

            {/* Solid Color */}
            {tempThemeSettings.backgroundType === 'solid' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="color"
                  value={tempThemeSettings.backgroundColor}
                  onChange={(e) => handleThemeSettingsChange('backgroundColor', e.target.value)}
                  style={{
                    width: 40,
                    height: 40,
                    border: '1px solid #d9d9d9',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={tempThemeSettings.backgroundColor}
                  onChange={(e) => handleThemeSettingsChange('backgroundColor', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="#FFFFFF"
                />
              </div>
            )}

            {/* Gradient Colors */}
            {tempThemeSettings.backgroundType === 'gradient' && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 500 }}>
                    Hướng gradient:
                  </label>
                  <select
                    value={tempThemeSettings.gradientDirection}
                    onChange={(e) => handleThemeSettingsChange('gradientDirection', e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: 6,
                      fontSize: 14,
                      width: '100%'
                    }}
                  >
                    <option value="0deg">Trên → Dưới</option>
                    <option value="90deg">Trái → Phải</option>
                    <option value="135deg">Góc trên trái → Dưới phải</option>
                    <option value="180deg">Dưới → Trên</option>
                    <option value="270deg">Phải → Trái</option>
                    <option value="45deg">Góc trên phải → Dưới trái</option>
                  </select>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 500 }}>
                    Màu gradient (tối đa 3 màu):
                  </label>
                  {tempThemeSettings.gradientColors.map((color, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...tempThemeSettings.gradientColors];
                          newColors[index] = e.target.value;
                          handleThemeSettingsChange('gradientColors', newColors);
                        }}
                        style={{
                          width: 40,
                          height: 40,
                          border: '1px solid #d9d9d9',
                          borderRadius: 6,
                          cursor: 'pointer'
                        }}
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...tempThemeSettings.gradientColors];
                          newColors[index] = e.target.value;
                          handleThemeSettingsChange('gradientColors', newColors);
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #d9d9d9',
                          borderRadius: 6,
                          fontSize: 14
                        }}
                        placeholder="#1e3c72"
                      />
                      {tempThemeSettings.gradientColors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newColors = tempThemeSettings.gradientColors.filter((_, i) => i !== index);
                            handleThemeSettingsChange('gradientColors', newColors);
                          }}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ff4d4f',
                            borderRadius: 6,
                            background: '#fff2f0',
                            color: '#ff4d4f',
                            cursor: 'pointer'
                          }}
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  ))}
                  {tempThemeSettings.gradientColors.length < 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newColors = [...tempThemeSettings.gradientColors, '#ffffff'];
                        handleThemeSettingsChange('gradientColors', newColors);
                      }}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #1890ff',
                        borderRadius: 6,
                        background: '#f0f8ff',
                        color: '#1890ff',
                        cursor: 'pointer'
                      }}
                    >
                      + Thêm màu
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Text Color */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              Màu chữ:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="color"
                value={tempThemeSettings.textColor}
                onChange={(e) => handleThemeSettingsChange('textColor', e.target.value)}
                style={{
                  width: 40,
                  height: 40,
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              />
              <input
                type="text"
                value={tempThemeSettings.textColor}
                onChange={(e) => handleThemeSettingsChange('textColor', e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  fontSize: 14
                }}
                placeholder="#454545"
              />
            </div>
          </div>

          {/* Description */}
          {
            selectedSchema == 'master' ? null : (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                  Mô tả:
                </label>
                <textarea
                  value={tempThemeSettings.description || ''}
                  onChange={(e) => handleThemeSettingsChange('description', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: 6,
                    fontSize: 14,
                    minHeight: 80,
                    resize: 'vertical'
                  }}
                  placeholder="Nhập mô tả cho theme này..."
                  rows={3}
                />
              </div>
            )
          }


          {/* Preview */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              Xem trước Description:
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: 16,
              border: '1px solid #e8e8e8',
              borderRadius: 8,
              backgroundColor: topbarTheme?.background,
              gap: 12,
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: topbarTheme?.name === 'dark' ? topbarTheme?.superAdminColor : topbarTheme?.textColor
              }}>
                WIKI CANVAS
              </div>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                background: tempThemeSettings.backgroundType === 'gradient'
                  ? `linear-gradient(${tempThemeSettings.gradientDirection}, ${tempThemeSettings.gradientColors.join(', ')})`
                  : tempThemeSettings.backgroundColor,
                color: tempThemeSettings.textColor,
                fontSize: 14
              }}>
                {tempThemeSettings.description || 'Mô tả mặc định'}
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Task Checklist Modal */}
    

      {/* Task Management Modal */}
      {
        showTaskManagementModal && (
          <TaskManagementModal
            isOpen={showTaskManagementModal}
            onClose={() => setShowTaskManagementModal(false)}
            onDataChanged={() => setTaskChecklistRefreshTrigger(prev => prev + 1)}
          />
        )
      }

      {/* Trial Modal */}
      <Modal
        title="Dùng thử ứng dụng"
        open={showTrialModal}
        onOk={() => handleStartTrial(selectedTrialApp)}
        onCancel={() => {
          setShowTrialModal(false);
          setSelectedTrialApp(null);
        }}
        okButtonProps={{
          disabled: selectedTrialApp?.isActive || false,
          style: selectedTrialApp?.isActive ? { display: 'none' } : {}
        }}
        cancelButtonProps={{
          style: selectedTrialApp?.isActive ? { display: 'none' } : {}
        }}
        width={500}
      >
        {selectedTrialApp && (
          <div style={{ padding: '20px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                {selectedTrialApp.icon ? (
                  (() => {
                      const masterApp = masterAppsList.find(tool => tool.id === selectedTrialApp.id);
                      const displayApp = masterApp ? {
                        ...selectedTrialApp,
                        name: masterApp.name,
                        description: masterApp.description,
                        icon: masterApp.icon,
                        content1: masterApp.content1,
                        content2: masterApp.content2
                      } : selectedTrialApp;
                    const iconSrc = getIconSrcById(displayApp);
                    return iconSrc ? (
                      <img src={iconSrc} alt={selectedTrialApp.name} height={55} width={'auto'} />
                    ) : (
                      <span style={{ fontSize: '40px' }}>{selectedTrialApp.icon}</span>
                    );
                  })()
                ) : (
                  <span style={{ fontSize: '40px' }}>🛠️</span>
                )}
              </div>
              <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>
                {selectedTrialApp.name}
              </h3>
              <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>
                {selectedTrialApp.description}
              </p>
            </div>

            {/* Trial Status Section */}
            {selectedTrialApp.isActive ? (
              <div style={{
                background: isTrialExpired(selectedTrialApp) ? '#fef2f2' : '#f0f9ff',
                padding: '16px',
                borderRadius: '8px',
                border: `1px solid ${isTrialExpired(selectedTrialApp) ? '#fecaca' : '#bae6fd'}`,
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <h4 style={{
                  margin: '0 0 10px 0',
                  color: isTrialExpired(selectedTrialApp) ? '#dc2626' : '#0369a1'
                }}>
                  {isTrialExpired(selectedTrialApp) ? 'Đã hết hạn dùng thử' : 'Đang dùng thử'}
                </h4>
                <p style={{
                  margin: '0 0 10px 0',
                  color: isTrialExpired(selectedTrialApp) ? '#991b1b' : '#0c4a6e',
                  fontSize: '14px'
                }}>
                  {isTrialExpired(selectedTrialApp)
                    ? `Hết hạn ngày: ${new Date(selectedTrialApp.endDate).toLocaleDateString('vi-VN')}`
                    : `Còn lại: ${Math.ceil((new Date(selectedTrialApp.endDate) - new Date()) / (1000 * 60 * 60 * 24))} ngày`
                  }
                </p>
                {isTrialExpired(selectedTrialApp) && (
                  <>
                    <p style={{
                      margin: '0',
                      color: '#991b1b',
                      fontSize: '12px',
                      fontStyle: 'italic'
                    }}>
                      Ứng dụng không thể tiếp tục truy cập ở chế độ TRIAL
                    </p>
                    <p style={{
                      margin: '0',
                      color: '#991b1b',
                      fontSize: '12px',
                      fontStyle: 'italic'
                    }}>
                      Vui lòng liên hệ admin để được hỗ trợ và tránh mất dữ liệu
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#475569' }}>
                    Thông tin dùng thử
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b' }}>
                    <li>Thời gian dùng thử: <strong>30 ngày</strong></li>
                    <li>Quyền truy cập đầy đủ các tính năng</li>
                    <li>Hỗ trợ kỹ thuật trong thời gian dùng thử</li>
                    <li>Không yêu cầu thanh toán trước</li>
                  </ul>
                </div>

                <div style={{
                  background: '#fef3c7',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #f59e0b',
                  color: '#92400e',
                  fontSize: '14px'
                }}>
                  <strong>Lưu ý:</strong> Sau 30 ngày, ứng dụng sẽ tự động hết hạn dùng thử và không thể truy cập được nữa.
                </div>
              </>
            )}

            {/* Close button for active trials */}
            {selectedTrialApp.isActive && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  onClick={() => {
                    setShowTrialModal(false);
                    setSelectedTrialApp(null);
                  }}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '8px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Tool Reorder Modal */}
      <ToolReorderModal
        isOpen={showToolReorderModal}
        onClose={() => setShowToolReorderModal(false)}
        tools={tools}
        onSave={handleSaveToolReorder}
      />

      {/* Tool Settings Modal */}
      <Modal
        title="Cài đặt Tool"
        open={showToolSettingsModal}
        onCancel={handleCancelToolSettings}
        width={800}
        footer={[
          <Button key="cancel" onClick={handleCancelToolSettings}>
            Hủy
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveToolSettings}>
            Lưu
          </Button>
        ]}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {tools.map((tool) => (
            <div key={tool.id} style={{
              marginBottom: '16px',
              padding: '16px',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>

                <div>
                  <h4 style={{ margin: 0, fontSize: '16px' }}>{tool.name}</h4>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{tool.description}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Trạng thái hiển thị:
                  </label>
                  <Select
                    value={tempToolSettings[tool.id]?.visibility || 'public'}
                    onChange={(value) => handleToolSettingChange(tool.id, 'visibility', value)}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'public', label: 'Công khai (Tất cả đều truy cập được)' },
                      { value: 'login-required', label: 'Yêu cầu đăng nhập (Chỉ user đăng nhập mới truy cập được)' },
                      { value: 'trial', label: 'Dùng thử (Chỉ hiển thị cho Admin/Super Admin và cần kích hoạt trial)' }
                    ]}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Bật/Tắt:
                  </label>
                  <Checkbox
                    checked={tempToolSettings[tool.id]?.enabled !== false}
                    onChange={(e) => handleToolSettingChange(tool.id, 'enabled', e.target.checked)}
                  >
                    Kích hoạt
                  </Checkbox>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <Checkbox
                  checked={tempToolSettings[tool.id]?.featured || false}
                  onChange={(e) => handleToolSettingChange(tool.id, 'featured', e.target.checked)}
                >
                  Featured
                </Checkbox>
                <Checkbox
                  checked={tempToolSettings[tool.id]?.directDownload || false}
                  onChange={(e) => handleToolSettingChange(tool.id, 'directDownload', e.target.checked)}
                >
                  Direct Download
                </Checkbox>
              </div>

              {/* Show download URL input when Direct Download is checked */}
              {tempToolSettings[tool.id]?.directDownload && (
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Download URL or Upload File:
                  </label>
                  <Input
                    value={tempToolSettings[tool.id]?.downloadUrl || ""}
                    onChange={(e) => handleToolSettingChange(tool.id, 'downloadUrl', e.target.value)}
                    placeholder="Enter download URL"
                  />
                  <Upload
                    beforeUpload={(file) => {
                      const uploadFile = async () => {
                        try {
                          const { uploadFileService } = await import('../apis/uploadFileService.jsx');
                          const response = await uploadFileService([file]);
                          if (response && response.files && response.files.length > 0) {
                            handleToolSettingChange(tool.id, 'downloadUrl', response.files[0].fileUrl);
                            message.success('File uploaded successfully!');
                          }
                        } catch (error) {
                          console.error('Upload error:', error);
                          message.error('Failed to upload file');
                        }
                      };
                      uploadFile();
                      return false; // Prevent auto upload
                    }}
                    showUploadList={false}
                  >
                    <Button type="default" icon={<UploadOutlined />} style={{ marginTop: '8px', width: '100%' }}>
                      Upload File
                    </Button>
                  </Upload>
                  {tempToolSettings[tool.id]?.downloadUrl && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>
                      Current: {tempToolSettings[tool.id]?.downloadUrl}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* Direct Download Modal */}
      <Modal
        title="Tài liệu Download"
        open={showDirectDownloadModal}
        onCancel={() => setShowDirectDownloadModal(false)}
        width={500}
        footer={[
          <Button key="cancel" onClick={() => setShowDirectDownloadModal(false)}>
            Hủy
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            onClick={() => {
              if (selectedDownloadTool?.downloadUrl) {
                window.open(selectedDownloadTool.downloadUrl, '_blank');
              }
              setShowDirectDownloadModal(false);
            }}
          >
            Xác nhận tải về
          </Button>
        ]}
      >
        {selectedDownloadTool && (
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Tài liệu: {selectedDownloadTool.name}
            </h3>
            {selectedDownloadTool.description && (
              <p style={{ marginBottom: '16px', color: '#666', lineHeight: '1.6' }}>
                {selectedDownloadTool.description}
              </p>
            )}
            {selectedDownloadTool.downloadUrl && (
              <div style={{ 
                padding: '12px', 
                background: '#f5f5f5', 
                borderRadius: '4px',
                marginTop: '16px'
              }}>
                <strong>Download URL:</strong>
                <div style={{ 
                  marginTop: '4px',
                  wordBreak: 'break-all'
                }}>
                  {selectedDownloadTool.downloadUrl}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default WikiCanvas;