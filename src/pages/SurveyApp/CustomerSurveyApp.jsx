import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FileText, Plus, Settings, X, Table, Trash } from 'lucide-react';
import { toast } from 'react-toastify';
import { Tooltip } from 'antd';
import styles from './CustomerSurveyApp.module.css';
import { createSurveyTemplate, getAllSurveyTemplates, updateSurveyTemplate, deleteSurveyTemplate } from '../../apis/surveyTemplateService';
import { createSurvey, getAllSurveys, getSurveyById, updateSurvey, deleteSurvey, getDeletedSurveys, restoreSurvey as restoreSurveyService } from '../../apis/surveyService';
import { BackCanvas, ICON_CROSSROAD_LIST } from '../../icon/svg/IconSvg.jsx';
import { getSettingByType, getSchemaTools } from '../../apis/settingService.jsx';
import FileList from './components/FileList';
import { CreateTemplateModal } from './components/TemplateComponents.jsx';
import { EmptyState, MobileMenu, TemplateSelector } from './components/ModalComponents.jsx';
import { SurveyView, TemplateSettingsView } from './components/ViewComponents.jsx';
import TableDataFormat from './components/TableDataFormat';

const CustomerSurveyApp = () => {
  const navigate = useNavigate(); 
  const location = useLocation();
  const { surveyId } = useParams();
  
  // Utility function to generate unique IDs
  const generateUniqueId = (prefix = '') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
  };
  
  const [currentView, setCurrentView] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newTemplateItem, setNewTemplateItem] = useState(null);
  const [newTemplateSection, setNewTemplateSection] = useState(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedActionStatus, setSelectedActionStatus] = useState('all');
  const [editingTags, setEditingTags] = useState(null);
  
  // Add new state for template creation modal
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState({
    title: '',
    descriptions: '' // Using 'descriptions' as requested
  });

  // Add state for delete confirmation modal
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  // Add state for navigation confirmation modal
  const [showNavigationConfirmModal, setShowNavigationConfirmModal] = useState(false);

  // Add state for delete survey confirmation modal
  const [showDeleteSurveyConfirmModal, setShowDeleteSurveyConfirmModal] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState(null);

  // Add state for TableDataFormat view
  const [showTableDataView, setShowTableDataView] = useState(false);

  // Add state for deleted surveys modal
  const [showDeletedSurveysModal, setShowDeletedSurveysModal] = useState(false);
  const [deletedSurveys, setDeletedSurveys] = useState([]);
  const [deletedSurveysLoading, setDeletedSurveysLoading] = useState(false);

  // Template loading state
  const [templatesLoading, setTemplatesLoading] = useState(false);
  // Survey files loading state
  const [surveyFilesLoading, setSurveyFilesLoading] = useState(false);
  // Survey items loading state
  const [surveyItemsLoading, setSurveyItemsLoading] = useState(false);
  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const titleInputRef = useRef(null);

  const [surveyFiles, setSurveyFiles] = useState([]);

  const [templates, setTemplates] = useState([]);

  // Header state for dynamic title and icon
  const [nameTable, setNameTable] = useState(null);
  const [tool, setTool] = useState(null);
  const [masterTool, setMasterTool] = useState(null);

  const [templateItems, setTemplateItems] = useState([]);
  const [templateSections, setTemplateSections] = useState([]);

  const [surveyItems, setSurveyItems] = useState([]);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const loadingSurveyRef = useRef(false);
  const currentSurveyIdRef = useRef(null);

  // Handle window resize to keep sidebar open on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debounced save function for text inputs
  const debouncedSave = useCallback((updatedItems) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    const timeout = setTimeout(async () => {
      setIsSaving(true);
      await saveSurveyItemsToDatabase(updatedItems);
      setIsSaving(false);
    }, 500); // 500ms delay
    setSaveTimeout(timeout);
  }, [saveTimeout]);

  // Helper functions
  const getFileItems = (fileId) => {
    return surveyItems.filter(item => item.fileId === fileId).sort((a, b) => a.order - b.order);
  };

  const getTemplateItems = (templateId) => {
    // First check if this template uses the new section format
    const templateSections = getTemplateSections(templateId);
    
    if (templateSections.length > 0) {
      // New format: get all items from all sections
      const allItems = [];
      templateSections.forEach(section => {
        if (section.items && Array.isArray(section.items)) {
          allItems.push(...section.items);
        }
      });
      return allItems.sort((a, b) => a.order - b.order);
    } else {
      // Old format: get items directly from templateItems
      return templateItems.filter(item => item.templateId === templateId).sort((a, b) => a.order - b.order);
    }
  };

  const getTemplateSections = (templateId) => {
    return templateSections.filter(section => section.templateId === templateId).sort((a, b) => a.order - b.order);
  };

  const getAllTags = () => {
    const allTags = surveyFiles.flatMap(file => file.tags);
    return [...new Set(allTags)].sort();
  };

  // Header functionality
  
  // Hàm kết hợp với thông tin từ schema master
  const combineWithMasterInfo = async (currentTool) => {
    try {
      const masterResponse = await getSchemaTools('master');
      const masterAppsList = masterResponse?.setting || [];
      
      if (masterAppsList && masterAppsList.length > 0) {
        const masterApp = masterAppsList.find(masterApp => masterApp.id === currentTool.id);
        if (masterApp) {
          console.log(`CustomerSurveyApp: Combining tool ${currentTool.id} with master info`);
          return {
            ...currentTool,
            name: masterApp.name,
            icon: masterApp.icon
          };
        }
      }
      return currentTool;
    } catch (error) {
      console.error('Error getting master apps for survey app:', error);
      return currentTool;
    }
  };
  
  useEffect(() => {
    const getDashboardSetting = async () => {
      try {
        const res = await getSettingByType('DASHBOARD_SETTING');
        if (res.setting.length > 0) {
          // Look for survey-app specifically since the path might be /survey-app or similar
          let dashboardSetting = res.setting.find(item => item.id === 'survey-app');
          if (dashboardSetting) {
            // Kết hợp với thông tin từ schema master
            const combinedTool = await combineWithMasterInfo(dashboardSetting);
            setNameTable(combinedTool.name);
            setTool(combinedTool);
            setMasterTool(combinedTool);
          } else {
            // Fallback for Survey App page
            setNameTable('Customer Survey App');
          }
        }
      } catch (error) {
        console.error('Error loading dashboard setting for survey app:', error);
      }
    };
    
    getDashboardSetting();
  }, [location]);

  // Handle surveyId from URL parameter
  useEffect(() => {
    if (surveyId) {
      console.log('🔄 useEffect [surveyId, surveyFiles, selectedFile] triggered');
      console.log('📍 surveyId:', surveyId);
      console.log('📍 currentSurveyIdRef.current:', currentSurveyIdRef.current);
      
      // Find the survey in the loaded files
      const survey = surveyFiles.find(file => file.id.toString() === surveyId);
      if (survey) {
        // Only update if the selected file is different or if no file is selected
        if (!selectedFile || selectedFile.id.toString() !== surveyId) {
          console.log('🔄 Setting new selectedFile and currentView');
          setSelectedFile(survey);
          setCurrentView('survey');
        } else if (currentSurveyIdRef.current !== surveyId && !loadingSurveyRef.current) {
          // If we're already on this survey but haven't loaded the data yet
          console.log('🔄 Loading survey data for existing selectedFile');
          loadSurveyDataSafely(survey.id);
        }
      } else {
        // If survey not found in loaded files, try to load it from API
        if (currentSurveyIdRef.current !== surveyId && !loadingSurveyRef.current) {
          console.log('🔄 Survey not found in files, loading from API');
          loadSurveyDataSafely(surveyId);
        }
      }
    }
  }, [surveyId, surveyFiles, selectedFile]);

  const getIconSrcById = (tool) => {
    const found = ICON_CROSSROAD_LIST.find(item => item.id == tool.icon);
    return found ? found.icon : undefined;
  };

  // Helper function to get action date status
  const getActionDateStatus = (actionDate) => {
    if (!actionDate) return 'none';
    
    try {
      const actionDateTime = new Date(actionDate);
      if (isNaN(actionDateTime.getTime())) return 'none';
      
      const now = new Date();
      const diffTime = actionDateTime.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        return 'future';
      } else if (diffDays === 1) {
        return 'today';
      } else {
        return 'overdue';
      }
    } catch (error) {
      return 'none';
    }
  };

  const getFilteredFiles = () => {
    let filtered = surveyFiles;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file => {
        const nameMatch = file.name.toLowerCase().includes(query);
        const tagMatch = file.tags.some(tag => tag.toLowerCase().includes(query));
        return nameMatch || tagMatch;
      });
    }
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter(file => {
        return selectedTags.every(tag => file.tags.includes(tag));
      });
    }
    
    if (selectedActionStatus !== 'all') {
      filtered = filtered.filter(file => {
        const actionStatus = getActionDateStatus(file.actionDate);
        return actionStatus === selectedActionStatus;
      });
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // Helper function to transform template items to survey items with notes
  const transformTemplateItemsToSurveyItems = (templateItems, fileId = null) => {
    return templateItems.map((item, index) => ({
      ...item,
      id: generateUniqueId(`item_${index}`),
      fileId: fileId,
      completed: false,
      selectedOptions: item.type === 'mcq' ? [] : undefined,
      choiceNotes: item.type === 'mcq' ? (item.optionNotes || {}) : undefined,
      answer: item.type === 'qa' ? '' : undefined,
      noteValue: item.type === 'title_desc' ? '' : undefined
    }));
  };

  // Helper function to transform template sections to survey items with notes
  const transformTemplateSectionsToSurveyItems = (templateSections, fileId = null) => {
    const allItems = [];
    let globalIndex = 0;
    
    templateSections.forEach(section => {
      // Add section title/description as a special item if it exists
      if (section.title || section.description) {
        allItems.push({
          id: generateUniqueId(`section_${globalIndex}`),
          type: 'section_header',
          title: section.title || '',
          description: section.description || '',
          sectionId: section.id,
          fileId: fileId,
          completed: false,
          order: globalIndex++
        });
      }
      
      // Add all items from this section
      if (section.items && Array.isArray(section.items)) {
        section.items.forEach(item => {
          allItems.push({
            ...item,
            id: generateUniqueId(`item_${globalIndex}`),
            fileId: fileId,
            sectionId: section.id,
            completed: false,
            selectedOptions: item.type === 'mcq' ? [] : undefined,
            choiceNotes: item.type === 'mcq' ? (item.optionNotes || {}) : undefined,
            answer: item.type === 'qa' ? '' : undefined,
            noteValue: item.type === 'title_desc' ? '' : undefined,
            order: globalIndex++
          });
        });
      }
    });
    
    return allItems;
  };

  const createSurveyFromTemplate = (templateId, fileId) => {
    const templateSections = getTemplateSections(templateId);
    
    if (templateSections.length > 0) {
      // New format: use sections
      const newSurveyItems = transformTemplateSectionsToSurveyItems(templateSections, fileId);
      setSurveyItems(prev => [...prev, ...newSurveyItems]);
    } else {
      // Old format: use individual items
      const items = getTemplateItems(templateId);
      const newSurveyItems = transformTemplateItemsToSurveyItems(items, fileId);
      setSurveyItems(prev => [...prev, ...newSurveyItems]);
    }
  };

  const saveSurveyItemsToDatabase = async (updatedItems = null) => {
    console.log('🔄 saveSurveyItemsToDatabase called');
    console.log('📍 Scroll position before save:', window.scrollY);
    
    if (!selectedFile) {
      console.log('❌ No selectedFile, returning early');
      return;
    }
    
    try {
      const surveyFile = surveyFiles.find(file => file.id === selectedFile.id);
      if (!surveyFile) {
        console.error('Survey file not found:', selectedFile.id);
        return;
      }

      // Use provided updatedItems or fall back to current surveyItems
      const itemsToSave = updatedItems || surveyItems;
      console.log('📄 Items to save:', itemsToSave.length);

      // Calculate completion status (for display only, not saved to DB)
      const sectionCompletion = calculateSectionCompletion(itemsToSave);
      const overallCompletion = getOverallSurveyCompletion();

      // Save only the survey items, not the completion metadata
      const contentToSave = itemsToSave;

      const surveyData = {
        id: selectedFile.id,
        title: surveyFile.name,
        tags: surveyFile.tags,
        template_id: surveyFile.templateId,
        date_created: surveyFile.createdAt,
        completed: overallCompletion.isCompleted, // Update based on actual completion status
        status: surveyFile.status,
        content: contentToSave, // Save only survey items, not completion metadata
        template: surveyFile.template,
        successScore: parseInt(surveyFile.successScore) || 0, // Convert to integer
        summary_notes: surveyFile.summaryNotes,
        next_action: surveyFile.nextAction,
        actionDate: surveyFile.actionDate ? new Date(surveyFile.actionDate).toISOString() : null // Convert to ISO date string
      };

      console.log('💾 Calling updateSurvey API...');
      await updateSurvey(surveyData);
      console.log('✅ Survey items saved successfully (completion calculated on display)');
      console.log('📊 Current section completion (display only):', sectionCompletion);
      console.log('📈 Current overall completion (display only):', overallCompletion);
      console.log('📍 Scroll position after save:', window.scrollY);
    } catch (error) {
      console.error('❌ Error saving survey items:', error);
      console.log('📍 Scroll position after error:', window.scrollY);
    }
  };

  // Function to calculate section completion status
  const calculateSectionCompletion = (items) => {
    const sectionStatus = {};
    
    items.forEach(item => {
      if (item.sectionId && item.type !== 'section_header') {
        if (!sectionStatus[item.sectionId]) {
          sectionStatus[item.sectionId] = {
            totalItems: 0,
            completedItems: 0,
            completed: false
          };
        }
        sectionStatus[item.sectionId].totalItems++;
        if (item.completed) {
          sectionStatus[item.sectionId].completedItems++;
        }
      }
    });
    
    // Calculate completion percentage for each section
    Object.keys(sectionStatus).forEach(sectionId => {
      const section = sectionStatus[sectionId];
      section.completed = section.totalItems > 0 && section.completedItems === section.totalItems;
      section.completionPercentage = section.totalItems > 0 ? (section.completedItems / section.totalItems) * 100 : 0;
    });
    
    return sectionStatus;
  };

  // Function to get current section completion status (for UI use)
  const getCurrentSectionCompletion = () => {
    return calculateSectionCompletion(surveyItems);
  };

  // Function to get overall survey completion status
  const getOverallSurveyCompletion = () => {
    const totalItems = surveyItems.filter(item => item.type !== 'section_header').length;
    const completedItems = surveyItems.filter(item => item.type !== 'section_header' && item.completed).length;
    const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    
    return {
      totalItems,
      completedItems,
      completionPercentage,
      isCompleted: totalItems > 0 && completedItems === totalItems
    };
  };

  // Helper function to update survey file sections in real-time
  const updateSurveyFileSections = useCallback((updatedItems) => {
    console.log('🔄 updateSurveyFileSections called');
    console.log('📍 Scroll position before updateSurveyFileSections:', window.scrollY);
    
    if (!selectedFile) {
      console.log('❌ No selectedFile, returning early');
      return;
    }
    
    const sectionCompletion = calculateSectionCompletion(updatedItems);
    const updatedSections = [];
    
    Object.keys(sectionCompletion).forEach(sectionId => {
      const section = sectionCompletion[sectionId];
      const sectionTitle = updatedItems.find(item => item.sectionId === sectionId && item.type === 'section_header')?.title || `Section ${sectionId}`;
      updatedSections.push({
        id: sectionId,
        title: sectionTitle,
        completedItems: section.completedItems,
        totalItems: section.totalItems,
        completed: section.completed,
        completionPercentage: section.completionPercentage
      });
    });
    
    console.log('📊 Updated sections calculated:', updatedSections);
    
    // Update the survey file in the surveyFiles state only if sections have changed
    setSurveyFiles(prev => {
      console.log('🔄 setSurveyFiles called');
      const currentFile = prev.find(file => file.id === selectedFile.id);
      if (currentFile && JSON.stringify(currentFile.sections) === JSON.stringify(updatedSections)) {
        console.log('✅ No change needed, returning prev');
        return prev; // No change needed
      }
      console.log('🔄 Updating survey file sections');
      return prev.map(file => 
        file.id === selectedFile.id 
          ? { ...file, sections: updatedSections }
          : file
      );
    });
    
    console.log('📍 Scroll position after updateSurveyFileSections:', window.scrollY);
  }, [selectedFile]);

  const toggleItemCompleted = useCallback(async (itemId) => {
    console.log('🔄 toggleItemCompleted called with itemId:', itemId);
    console.log('📍 Current scroll position:', window.scrollY);
    console.log('📄 Current surveyItems length:', surveyItems.length);
    
    const updatedItems = surveyItems.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    
    console.log('✅ Updated items created, setting surveyItems state...');
    // Batch state updates to prevent multiple re-renders
    setSurveyItems(updatedItems);
    
    console.log('🔄 Calling updateSurveyFileSections...');
    updateSurveyFileSections(updatedItems);
    
    // Calculate and log section completion status in real-time
    const sectionCompletion = calculateSectionCompletion(updatedItems);
    console.log('📊 Section Completion Status:', sectionCompletion);
    
    // Log detailed completion info for each section
    Object.keys(sectionCompletion).forEach(sectionId => {
      const section = sectionCompletion[sectionId];
      const sectionTitle = updatedItems.find(item => item.sectionId === sectionId && item.type === 'section_header')?.title || `Section ${sectionId}`;
      console.log(`📋 ${sectionTitle}: ${section.completedItems}/${section.totalItems} items completed (${section.completionPercentage.toFixed(1)}%) - ${section.completed ? '✅ COMPLETED' : '⏳ IN PROGRESS'}`);
    });
    
    console.log('💾 Starting database save...');
    // Save immediately to database
    setIsSaving(true);
    await saveSurveyItemsToDatabase(updatedItems);
    setIsSaving(false);
    console.log('✅ Database save completed');
    console.log('📍 Final scroll position:', window.scrollY);
  }, [surveyItems, selectedFile]);

  const toggleNote = (itemId) => {
    setExpandedNotes(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const updateMCQSelection = useCallback(async (itemId, option) => {
    const updatedItems = surveyItems.map(item => {
      if (item.id === itemId) {
        const selectedOptions = item.selectedOptions || [];
        const isSelected = selectedOptions.includes(option);
        return {
          ...item,
          selectedOptions: isSelected 
            ? selectedOptions.filter(opt => opt !== option)
            : [...selectedOptions, option]
        };
      }
      return item;
    });
    
    // Batch state updates to prevent multiple re-renders
    setSurveyItems(updatedItems);
    updateSurveyFileSections(updatedItems);
    
    // Save immediately to database
    setIsSaving(true);
    await saveSurveyItemsToDatabase(updatedItems);
    setIsSaving(false);
  }, [surveyItems, selectedFile]);

  const updateChoiceNote = useCallback(async (itemId, option, note) => {
    const updatedItems = surveyItems.map(item => {
      if (item.id === itemId) {
        const choiceNotes = item.choiceNotes || {};
        return {
          ...item,
          choiceNotes: {
            ...choiceNotes,
            [option]: note
          }
        };
      }
      return item;
    });
    setSurveyItems(updatedItems);
    // Use debounced save for text inputs
    debouncedSave(updatedItems);
  }, [surveyItems, debouncedSave]);

  const updateQAAnswer = useCallback(async (itemId, answer) => {
    const updatedItems = surveyItems.map(item =>
      item.id === itemId ? { ...item, answer } : item
    );
    setSurveyItems(updatedItems);
    // Use debounced save for text inputs
    debouncedSave(updatedItems);
  }, [surveyItems, debouncedSave]);

  const updateNoteValue = useCallback(async (itemId, noteValue) => {
    const updatedItems = surveyItems.map(item =>
      item.id === itemId ? { ...item, noteValue } : item
    );
    setSurveyItems(updatedItems);
    // Use debounced save for text inputs
    debouncedSave(updatedItems);
  }, [surveyItems, debouncedSave]);

  const updateSurveyTitle = async (newTitle) => {
    if (!selectedFile) return;
    
    try {
      const surveyFile = surveyFiles.find(file => file.id === selectedFile.id);
      if (!surveyFile) {
        console.error('Survey file not found:', selectedFile.id);
        return;
      }

      // Calculate current completion status (for display only, not saved to DB)
      const sectionCompletion = calculateSectionCompletion(surveyItems);
      const overallCompletion = getOverallSurveyCompletion();

      // Save only the survey items, not the completion metadata
      const contentToSave = surveyItems;

      const surveyData = {
        id: selectedFile.id,
        title: newTitle,
        tags: surveyFile.tags,
        template_id: surveyFile.templateId,
        date_created: surveyFile.createdAt,
        completed: overallCompletion.isCompleted, // Update based on actual completion status
        status: surveyFile.status,
        content: contentToSave, // Save only survey items, not completion metadata
        template: surveyFile.template,
        successScore: parseInt(surveyFile.successScore) || 0, // Convert to integer
        summary_notes: surveyFile.summaryNotes,
        next_action: surveyFile.nextAction,
        actionDate: surveyFile.actionDate ? new Date(surveyFile.actionDate).toISOString() : null // Convert to ISO date string
      };

      await updateSurvey(surveyData);
      
      // Update local state
      setSurveyFiles(prev =>
        prev.map(file =>
          file.id === selectedFile.id ? { ...file, name: newTitle } : file
        )
      );
      
      // Update selected file
      setSelectedFile(prev => prev ? { ...prev, name: newTitle } : null);
      
      console.log('✅ Survey title and completion status updated successfully');
    } catch (error) {
      console.error('❌ Error updating survey title:', error);
    }
  };

  const updateFileTags = async (fileId, newTags) => {
    try {
      // Find the survey file to get its current data
      const surveyFile = surveyFiles.find(file => file.id === fileId);
      if (!surveyFile) {
        console.error('Survey file not found:', fileId);
        return;
      }

      // Prepare survey data for update
      const surveyData = {
        id: fileId,
        title: surveyFile.name,
        tags: newTags,
        template_id: surveyFile.templateId,
        date_created: surveyFile.createdAt,
        completed: surveyFile.completed,
        successScore: parseInt(surveyFile.successScore) || 0, // Convert to integer
        summary_notes: surveyFile.summaryNotes,
        next_action: surveyFile.nextAction,
        actionDate: surveyFile.actionDate ? new Date(surveyFile.actionDate).toISOString() : null, // Convert to ISO date string
        status: surveyFile.status
      };

      // Update survey in database
      await updateSurvey(surveyData);
      
      // Update local state
      setSurveyFiles(prev =>
        prev.map(file =>
          file.id === fileId ? { ...file, tags: newTags } : file
        )
      );
      
      console.log('Survey tags updated successfully');
    } catch (error) {
      console.error('Error updating survey tags:', error);
      // You might want to show an error message to the user here
    }
  };

  const updateFileSalesInfo = async (fileId, salesInfo) => {
    try {
      // Find the survey file to get its current data
      const surveyFile = surveyFiles.find(file => file.id === fileId);
      if (!surveyFile) {
        console.error('Survey file not found:', fileId);
        return;
      }

      // Prepare survey data for update with proper data types
      const surveyData = {
        id: fileId,
        title: surveyFile.name,
        tags: surveyFile.tags,
        template_id: surveyFile.templateId,
        date_created: surveyFile.createdAt,
        completed: surveyFile.completed,
        status: salesInfo.status, // Use the new status from salesInfo
        content: surveyItems, // Save current survey items to content
        template: surveyFile.template,
        successScore: parseInt(salesInfo.successScore) || 0, // Convert to integer
        summary_notes: salesInfo.summaryNotes,
        next_action: salesInfo.nextAction,
        actionDate: salesInfo.actionDate ? new Date(salesInfo.actionDate).toISOString() : null // Convert to ISO date string
      };

      // Update survey in database
      await updateSurvey(surveyData);
      
      // Update local state with the new sales info
      setSurveyFiles(prev =>
        prev.map(file =>
          file.id === fileId ? { 
            ...file, 
            successScore: parseInt(surveyData.successScore) || 0,
            summaryNotes: surveyData.summary_notes,
            nextAction: surveyData.next_action,
            actionDate: surveyData.actionDate,
            status: surveyData.status
          } : file
        )
      );
      
      // Update selected file if it's the current one
      if (selectedFile && selectedFile.id === fileId) {
        setSelectedFile(prev => prev ? {
          ...prev,
          successScore: parseInt(surveyData.successScore) || 0,
          summaryNotes: surveyData.summary_notes,
          nextAction: surveyData.next_action,
          actionDate: surveyData.actionDate,
          status: surveyData.status
        } : null);
      }
      
      console.log('Survey evaluation updated successfully');
    } catch (error) {
      console.error('Error updating survey evaluation:', error);
      // You might want to show an error message to the user here
    }
  };

  const addNewFile = () => {
    setCurrentView('create');
    setShowTemplateSelector(true);
  };

  const toggleSidebar = () => {
    // On desktop, sidebar should always be open
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const createFileWithTemplate = async (templateId) => {
    if (!templateId) {
      setShowTemplateSelector(false);
      setCurrentView(null); // Return to default view when cancelled
      return;
    }
    
    try {
      const template = templates.find(t => t.id === templateId);
      const templateSections = getTemplateSections(templateId);
      
      let surveyItems;
      let templateData;
      
      if (templateSections.length > 0) {
        // New format: use sections
        surveyItems = transformTemplateSectionsToSurveyItems(templateSections);
        templateData = templateSections; // Save sections as template data
      } else {
        // Old format: use individual items
        const templateItems = getTemplateItems(templateId);
        surveyItems = transformTemplateItemsToSurveyItems(templateItems);
        templateData = templateItems; // Save items as template data
      }
      
      // Prepare survey data for database
      const surveyData = {
        title: `${template.name} - ${new Date().toLocaleDateString('vi-VN')}`,
        date_created: new Date().toISOString(),
        status: "waiting",
        content: surveyItems, // Survey items with notes as content
        template: template.name, // Set template column as template title
        template_id: templateId // Reference to the original template
      };

      // Create survey in database
      const response = await createSurvey(surveyData);
      
      // Create local file object
      const newFile = {
        id: response.id || Date.now(),
        name: surveyData.title,
        tags: [],
        templateId: templateId,
        createdAt: new Date().toISOString().split('T')[0],
        completed: false,
        // Initialize sales tracking fields
        successScore: 0,
        summaryNotes: "",
        nextAction: "",
        actionDate: "",
        status: "waiting",
        sections: [] // Initialize empty sections for new surveys
      };
      
      setSurveyFiles(prev => [newFile, ...prev]);
      setSurveyItems(surveyItems); // Set the survey items directly with notes
      setShowTemplateSelector(false);
      
      // Immediately navigate to the newly created form
      setSelectedFile(newFile);
      setCurrentView('survey');
      navigate(`/survey-app/${newFile.id}`);
      
      console.log('Survey created successfully:', response);
    } catch (error) {
      console.error('Error creating survey:', error);
      // You might want to show an error message to the user here
    }
  };

  // Function to save template items to database
  const saveTemplateItemsToDatabase = async (templateId, items) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        console.error('Template not found:', templateId);
        return;
      }

      // Filter items to only include items for this specific template
      const templateSpecificItems = items.filter(item => item.templateId === templateId);

      // Remove templateId from items since they're already associated with this template
      const itemsWithoutTemplateId = templateSpecificItems.map(item => {
        const { templateId, ...itemWithoutTemplateId } = item;
        return itemWithoutTemplateId;
      });

      // Prepare the template data for update
      const templateData = {
        id: templateId,
        title: template.name,
        descriptions: template.description,
        template: itemsWithoutTemplateId // Save items to the JSONB template column
      };

      await updateSurveyTemplate(templateData);
      console.log('Template items saved successfully');
    } catch (error) {
      console.error('Error saving template items:', error);
      // You might want to show an error message to the user here
    }
  };

  // Function to save template sections to database
  const saveTemplateSectionsToDatabase = async (templateId, sections) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        console.error('Template not found:', templateId);
        return;
      }

      // Filter sections to only include sections for this specific template
      const templateSpecificSections = sections.filter(section => section.templateId === templateId);

      // Remove templateId from sections since they're already associated with this template
      const sectionsWithoutTemplateId = templateSpecificSections.map(section => {
        const { templateId, ...sectionWithoutTemplateId } = section;
        return sectionWithoutTemplateId;
      });

      // Prepare the template data for update - save sections to the template JSONB column
      const templateData = {
        id: templateId,
        title: template.name,
        descriptions: template.description,
        template: sectionsWithoutTemplateId // Save sections to the existing template JSONB column
      };

      await updateSurveyTemplate(templateData);
      console.log('Template sections saved successfully');
    } catch (error) {
      console.error('Error saving template sections:', error);
      // You might want to show an error message to the user here
    }
  };

  // Template management functions
  const addTemplateSection = async (templateId) => {
    const existingSections = getTemplateSections(templateId);
    const newOrder = existingSections.length + 1;
    
    const newSection = {
      id: generateUniqueId('template_section'),
      templateId: templateId,
      title: 'Section mới',
      description: 'Mô tả section',
      order: newOrder,
      items: []
    };
    
    setTemplateSections(prev => [...prev, newSection]);
    setNewTemplateSection(newSection.id);
    
    // Save to database
    await saveTemplateSectionsToDatabase(templateId, [...existingSections, newSection]);
  };

  const addTemplateItem = async (templateId, sectionId, type) => {
    const section = templateSections.find(s => s.id === sectionId);
    if (!section) return;
    
    const existingItems = section.items || [];
    const newOrder = existingItems.length + 1;
    
    const newItem = {
      id: generateUniqueId('template_item'),
      sectionId: sectionId,
      templateId: templateId,
      type: type,
      title: type === 'mcq' ? 'Câu hỏi chọn lựa mới' : type === 'qa' ? 'Câu hỏi mới' : 'Tiêu đề mới',
      description: type === 'title_desc' ? 'Mô tả' : undefined,
      note: type === 'title_desc' ? 'Ghi chú' : undefined,
      options: type === 'mcq' ? ['Tùy chọn 1', 'Tùy chọn 2'] : undefined,
      optionNotes: type === 'mcq' ? {} : undefined,
      order: newOrder
    };
    
    const updatedSections = templateSections.map(s => 
      s.id === sectionId 
        ? { ...s, items: [...(s.items || []), newItem] }
        : s
    );
    
    setTemplateSections(updatedSections);
    setNewTemplateItem(newItem.id);
    
    // Save to database
    await saveTemplateSectionsToDatabase(templateId, updatedSections);
  };

  const updateTemplateItem = async (itemId, updates) => {
    // Find the section containing this item
    const section = templateSections.find(s => s.items && s.items.find(item => item.id === itemId));
    if (!section) return;
    
    const updatedSections = templateSections.map(s => {
      if (s.id === section.id) {
        const updatedItems = s.items.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        );
        return { ...s, items: updatedItems };
      }
      return s;
    });
    
    setTemplateSections(updatedSections);
    await saveTemplateSectionsToDatabase(section.templateId, updatedSections);
  };

  const deleteTemplateItem = async (itemId) => {
    // Find the section containing this item
    const section = templateSections.find(s => s.items && s.items.find(item => item.id === itemId));
    if (!section) return;
    
    const updatedSections = templateSections.map(s => {
      if (s.id === section.id) {
        const updatedItems = s.items.filter(item => item.id !== itemId);
        return { ...s, items: updatedItems };
      }
      return s;
    });
    
    setTemplateSections(updatedSections);
    await saveTemplateSectionsToDatabase(section.templateId, updatedSections);
  };

  const updateTemplateSection = async (sectionId, updates) => {
    const updatedSections = templateSections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    
    setTemplateSections(updatedSections);
    
    // Find the template ID for this section
    const section = templateSections.find(section => section.id === sectionId);
    if (section) {
      await saveTemplateSectionsToDatabase(section.templateId, updatedSections);
    }
  };

  const deleteTemplateSection = async (sectionId) => {
    const section = templateSections.find(section => section.id === sectionId);
    if (!section) return;
    
    const updatedSections = templateSections.filter(section => section.id !== sectionId);
    setTemplateSections(updatedSections);
    
    await saveTemplateSectionsToDatabase(section.templateId, updatedSections);
  };

  const moveTemplateItem = async (itemId, direction) => {
    // Find the section containing this item
    const section = templateSections.find(s => s.items && s.items.find(item => item.id === itemId));
    if (!section) return;
    
    const items = section.items.sort((a, b) => a.order - b.order);
    const currentIndex = items.findIndex(item => item.id === itemId);
    
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === items.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const updatedItems = [...items];
    [updatedItems[currentIndex], updatedItems[newIndex]] = [updatedItems[newIndex], updatedItems[currentIndex]];
    
    // Update order for all items
    updatedItems.forEach((item, index) => {
      item.order = index + 1;
    });
    
    // Update local state
    const updatedSections = templateSections.map(s => 
      s.id === section.id ? { ...s, items: updatedItems } : s
    );
    setTemplateSections(updatedSections);
    
    // Save to database
    await saveTemplateSectionsToDatabase(section.templateId, updatedSections);
  };

  // Function to load template sections from database
  const loadTemplateSectionsFromDatabase = async (templateId) => {
    try {
      const response = await getAllSurveyTemplates();
      if (response && Array.isArray(response)) {
        const template = response.find(t => t.id === templateId);
        if (template && template.template && Array.isArray(template.template)) {
          // Check if template.template contains sections (new format) or items (old format)
          const firstItem = template.template[0];
          
          if (firstItem && firstItem.items) {
            // New format: template.template contains sections with items
            const transformedSections = template.template.map(section => ({
              ...section,
              templateId: templateId
            }));
            setTemplateSections(prev => {
              // Remove existing sections for this template and add new ones
              const otherSections = prev.filter(section => section.templateId !== templateId);
              return [...otherSections, ...transformedSections];
            });
          } else {
            // Old format: template.template contains individual items
            // Transform the template items to match our local format
            const transformedItems = template.template.map(item => ({
              ...item,
              templateId: templateId
            }));
            setTemplateItems(prev => {
              // Remove existing items for this template and add new ones
              const otherItems = prev.filter(item => item.templateId !== templateId);
              return [...otherItems, ...transformedItems];
            });
          }
        } else {
          // If no template data exists, clear any existing data for this template
          setTemplateSections(prev => prev.filter(section => section.templateId !== templateId));
          setTemplateItems(prev => prev.filter(item => item.templateId !== templateId));
        }
      }
    } catch (error) {
      console.error('Error loading template sections:', error);
    }
  };

  // Fetch templates and surveys from API
  useEffect(() => {
    const fetchData = async () => {
      setTemplatesLoading(true);
      setSurveyFilesLoading(true);
      
      try {
        // Fetch templates
        const templatesResponse = await getAllSurveyTemplates();
        if (templatesResponse && Array.isArray(templatesResponse)) {
          const transformedTemplates = templatesResponse.map(template => ({
            id: template.id,
            name: template.title || template.name,
            description: template.descriptions || template.description,
            template: template.template || []
          }));
          setTemplates(transformedTemplates);
          
          // Load template sections and items for all templates
          const allTemplateSections = [];
          const allTemplateItems = [];
          templatesResponse.forEach(template => {
            if (template.template && Array.isArray(template.template)) {
              const firstItem = template.template[0];
              
              if (firstItem && firstItem.items) {
                // New format: template.template contains sections with items
                const transformedSections = template.template.map(section => ({
                  ...section,
                  templateId: template.id
                }));
                allTemplateSections.push(...transformedSections);
              } else {
                // Old format: template.template contains individual items
                const transformedItems = template.template.map(item => ({
                  ...item,
                  templateId: template.id
                }));
                allTemplateItems.push(...transformedItems);
              }
            }
          });
          setTemplateSections(allTemplateSections);
          setTemplateItems(allTemplateItems);
        } else {
          setTemplates([]);
          setTemplateItems([]);
        }

        // Fetch surveys
        const surveysResponse = await getAllSurveys();
        console.log('Raw surveys response:', surveysResponse);
        if (surveysResponse && Array.isArray(surveysResponse)) {
          const transformedSurveys = surveysResponse.map(survey => {
            // Parse content to get section information
            let sectionInfo = [];
            if (survey.content) {
              try {
                let contentArray = survey.content;
                if (typeof contentArray === 'string') {
                  contentArray = JSON.parse(contentArray);
                }
                
                if (Array.isArray(contentArray)) {
                  // Standard format - array of items (completion calculated on display)
                  const sectionCompletion = calculateSectionCompletion(contentArray);
                  
                  // Extract section information
                  const sections = [];
                  Object.keys(sectionCompletion).forEach(sectionId => {
                    const section = sectionCompletion[sectionId];
                    const sectionTitle = contentArray.find(item => item.sectionId === sectionId && item.type === 'section_header')?.title || `Section ${sectionId}`;
                    sections.push({
                      id: sectionId,
                      title: sectionTitle,
                      completedItems: section.completedItems,
                      totalItems: section.totalItems,
                      completed: section.completed,
                      completionPercentage: section.completionPercentage
                    });
                  });
                  sectionInfo = sections;
                }
              } catch (error) {
                console.error('Error parsing survey content for sections:', error);
              }
            }

            const transformed = {
              id: survey.id,
              name: survey.title,
              tags: survey.tags || [],
              template: survey.template || null, // Add template field
              templateId: survey.templateId,
              createdAt: survey.dateCreated || survey.created_at || new Date().toISOString(), // Keep full timestamp
              completed: survey.completed || false,
              successScore: survey.successScore || 0,
              summaryNotes: survey.summary_notes || "",
              nextAction: survey.next_action || "",
              actionDate: survey.actionDate || "",
              status: survey.status || "waiting",
              sections: sectionInfo // Add section information
            };
            console.log('Transformed survey:', {
              id: transformed.id,
              name: transformed.name,
              originalSuccessScore: survey.successScore,
              transformedSuccessScore: transformed.successScore,
              successScoreType: typeof transformed.successScore,
              sections: transformed.sections
            });
            return transformed;
          });
          console.log('Final transformed surveys:', transformedSurveys);
          setSurveyFiles(transformedSurveys);
        } else {
          setSurveyFiles([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setTemplates([]);
        setTemplateItems([]);
        setSurveyFiles([]);
      } finally {
        setTemplatesLoading(false);
        setSurveyFilesLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch survey data when survey view is opened or selected file changes
  useEffect(() => {
    console.log('🔄 useEffect [currentView, selectedFile] triggered');
    console.log('📍 currentView:', currentView);
    console.log('📍 selectedFile id:', selectedFile?.id);
    console.log('📍 currentSurveyIdRef.current:', currentSurveyIdRef.current);
    console.log('📍 Scroll position:', window.scrollY);
    console.log('📍 loadingSurveyRef.current:', loadingSurveyRef.current);
    
    // Only handle view changes, not survey data loading
    if (currentView === 'survey' && selectedFile) {
      console.log('✅ Survey view is active with selectedFile');
    }
  }, [currentView, selectedFile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  // Load deleted surveys when modal opens
  useEffect(() => {
    if (showDeletedSurveysModal) {
      loadDeletedSurveys();
    }
  }, [showDeletedSurveysModal]);

  // Log section completion status when survey items change
  useEffect(() => {
    console.log('🔄 useEffect [surveyItems] triggered');
    console.log('📍 Scroll position in useEffect:', window.scrollY);
    console.log('📄 surveyItems length:', surveyItems.length);
    
    if (surveyItems.length > 0) {
      const sectionCompletion = calculateSectionCompletion(surveyItems);
      console.log('🔄 Survey Items Updated - Section Completion Status:', sectionCompletion);
      
      // Log overall survey completion
      const totalItems = surveyItems.filter(item => item.type !== 'section_header').length;
      const completedItems = surveyItems.filter(item => item.type !== 'section_header' && item.completed).length;
      const overallCompletion = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
      
      console.log(`📈 Overall Survey Progress: ${completedItems}/${totalItems} items completed (${overallCompletion.toFixed(1)}%)`);
      
      // Log each section's status
      Object.keys(sectionCompletion).forEach(sectionId => {
        const section = sectionCompletion[sectionId];
        const sectionTitle = surveyItems.find(item => item.sectionId === sectionId && item.type === 'section_header')?.title || `Section ${sectionId}`;
        console.log(`📋 ${sectionTitle}: ${section.completedItems}/${section.totalItems} items completed (${section.completionPercentage.toFixed(1)}%) - ${section.completed ? '✅ COMPLETED' : '⏳ IN PROGRESS'}`);
      });
    }
  }, [surveyItems]);

  // Handle file click to load survey content
  const handleFileClick = async (file) => {
    // Set the selected file and view immediately
    setSelectedFile(file);
    setCurrentView('survey');
    
    // Navigate to the survey URL
    navigate(`/survey-app/${file.id}`);
  };

  // Centralized function to load survey data with duplicate prevention
  const loadSurveyDataSafely = useCallback(async (surveyId) => {
    console.log('🔄 loadSurveyDataSafely called with surveyId:', surveyId);
    console.log('📍 currentSurveyIdRef.current:', currentSurveyIdRef.current);
    console.log('📍 loadingSurveyRef.current:', loadingSurveyRef.current);
    
    // Prevent duplicate calls
    if (loadingSurveyRef.current) {
      console.log('❌ Already loading survey data, skipping');
      return;
    }
    
    if (currentSurveyIdRef.current === surveyId && surveyItems.length > 0) {
      console.log('✅ Survey data already loaded, skipping');
      return;
    }
    
    console.log('🔄 Proceeding with loadSurveyData');
    currentSurveyIdRef.current = surveyId;
    loadingSurveyRef.current = true;
    
    try {
      await loadSurveyData(surveyId);
    } finally {
      loadingSurveyRef.current = false;
    }
  }, [surveyItems.length]);

  // Load survey data from API
  const loadSurveyData = async (surveyId) => {
    console.log('🔄 loadSurveyData called with surveyId:', surveyId);
    setSurveyItemsLoading(true);
    
    try {
      // Fetch survey content from API
      const surveyResponse = await getSurveyById(surveyId);
      if (surveyResponse && surveyResponse.content) {
        // If content is a string, parse it to array
        let contentArray = surveyResponse.content;
        if (typeof contentArray === 'string') {
          try {
            contentArray = JSON.parse(contentArray);
          } catch (e) {
            console.error('Error parsing survey content:', e);
            contentArray = [];
          }
        }
        
        // Handle content - now just an array of items (no completion metadata saved)
        if (Array.isArray(contentArray)) {
          // Standard format - array of items
          console.log('📋 Loading survey items (completion calculated on display)');
          setSurveyItems(contentArray);
          
          // Calculate and update file card sections with loaded data
          const sectionCompletion = calculateSectionCompletion(contentArray);
          const updatedSections = [];
          Object.keys(sectionCompletion).forEach(sectionId => {
            const section = sectionCompletion[sectionId];
            const sectionTitle = contentArray.find(item => item.sectionId === sectionId && item.type === 'section_header')?.title || `Section ${sectionId}`;
            updatedSections.push({
              id: sectionId,
              title: sectionTitle,
              completedItems: section.completedItems,
              totalItems: section.totalItems,
              completed: section.completed,
              completionPercentage: section.completionPercentage
            });
          });
          
          // Update the survey file in surveyFiles state only if sections have changed
          setSurveyFiles(prev => {
            const currentFile = prev.find(file => file.id.toString() === surveyId.toString());
            if (currentFile && JSON.stringify(currentFile.sections) === JSON.stringify(updatedSections)) {
              return prev; // No change needed
            }
            return prev.map(file => 
              file.id.toString() === surveyId.toString()
                ? { ...file, sections: updatedSections }
                : file
            );
          });
          
        } else {
          console.error('Survey content format not recognized:', contentArray);
          setSurveyItems([]);
        }
        
        // If we don't have the survey in local files, create a file object from the API response
        if (!surveyFiles.find(file => file.id.toString() === surveyId.toString())) {
          const surveyFile = {
            id: surveyResponse.id,
            name: surveyResponse.title,
            tags: surveyResponse.tags || [],
            templateId: surveyResponse.template_id,
            createdAt: surveyResponse.date_created,
            completed: surveyResponse.completed || false,
            successScore: surveyResponse.successScore || 0,
            summaryNotes: surveyResponse.summary_notes || '',
            nextAction: surveyResponse.next_action || '',
            actionDate: surveyResponse.actionDate,
            status: surveyResponse.status || 'waiting'
          };
          setSelectedFile(surveyFile);
          setCurrentView('survey');
        }
      } else {
        // Fallback to template items if no content
        const surveyFile = surveyFiles.find(file => file.id === surveyId);
        if (surveyFile) {
          const fileTemplateItems = templateItems.filter(item => item.templateId === surveyFile.templateId);
          // Transform template items to survey items with notes
          const surveyItems = transformTemplateItemsToSurveyItems(fileTemplateItems);
          setSurveyItems(surveyItems);
        } else {
          setSurveyItems([]);
        }
      }
    } catch (error) {
      console.error('Error fetching survey content:', error);
      // Fallback to template items on error
      const surveyFile = surveyFiles.find(file => file.id === surveyId);
      if (surveyFile) {
        const fileTemplateItems = templateItems.filter(item => item.templateId === surveyFile.templateId);
        // Transform template items to survey items with notes
        const surveyItems = transformTemplateItemsToSurveyItems(fileTemplateItems);
        setSurveyItems(surveyItems);
      } else {
        setSurveyItems([]);
      }
    } finally {
      setSurveyItemsLoading(false);
    }
  };

  // Handle create template function
  const handleCreateTemplate = async (templateData) => {
    try {
      // Make API call to create the template
      const response = await createSurveyTemplate({
        title: templateData.title,
        descriptions: templateData.descriptions
      });

      // Refresh templates list and template items from API
      const templatesResponse = await getAllSurveyTemplates();
      if (templatesResponse && Array.isArray(templatesResponse)) {
        const transformedTemplates = templatesResponse.map(template => ({
          id: template.id,
          name: template.title || template.name,
          description: template.descriptions || template.description
        }));
        setTemplates(transformedTemplates);
        
        // Load template sections and items for all templates
        const allTemplateSections = [];
        const allTemplateItems = [];
        templatesResponse.forEach(template => {
          if (template.template && Array.isArray(template.template)) {
            const firstItem = template.template[0];
            
            if (firstItem && firstItem.items) {
              // New format: template.template contains sections with items
              const transformedSections = template.template.map(section => ({
                ...section,
                templateId: template.id
              }));
              allTemplateSections.push(...transformedSections);
            } else {
              // Old format: template.template contains individual items
              const transformedItems = template.template.map(item => ({
                ...item,
                templateId: template.id
              }));
              allTemplateItems.push(...transformedItems);
            }
          }
        });
        setTemplateSections(allTemplateSections);
        setTemplateItems(allTemplateItems);
      }

      // Refresh surveys list from API
      const surveysResponse = await getAllSurveys();
      if (surveysResponse && Array.isArray(surveysResponse)) {
        const transformedSurveys = surveysResponse.map(survey => {
          // Parse content to get section information
          let sectionInfo = [];
          if (survey.content) {
            try {
              let contentArray = survey.content;
              if (typeof contentArray === 'string') {
                contentArray = JSON.parse(contentArray);
              }
              
              if (Array.isArray(contentArray)) {
                // Standard format - array of items (completion calculated on display)
                const sectionCompletion = calculateSectionCompletion(contentArray);
                
                // Extract section information
                const sections = [];
                Object.keys(sectionCompletion).forEach(sectionId => {
                  const section = sectionCompletion[sectionId];
                  const sectionTitle = contentArray.find(item => item.sectionId === sectionId && item.type === 'section_header')?.title || `Section ${sectionId}`;
                  sections.push({
                    id: sectionId,
                    title: sectionTitle,
                    completedItems: section.completedItems,
                    totalItems: section.totalItems,
                    completed: section.completed,
                    completionPercentage: section.completionPercentage
                  });
                });
                sectionInfo = sections;
              }
            } catch (error) {
              console.error('Error parsing survey content for sections:', error);
            }
          }

          return {
          id: survey.id,
          name: survey.title,
          tags: survey.tags || [],
          templateId: survey.templateId,
          createdAt: survey.dateCreated ? new Date(survey.dateCreated).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          completed: survey.completed || false,
          successScore: survey.successScore || 0,
          summaryNotes: survey.summary_notes || "",
          nextAction: survey.next_action || "",
          actionDate: survey.actionDate || "",
            status: survey.status || "waiting",
            sections: sectionInfo
          };
        });
        setSurveyFiles(transformedSurveys);
      }

      console.log('Template created successfully:', response);
      
      // Close the modal and reset form data
      setShowCreateTemplateModal(false);
      setNewTemplateData({ title: '', descriptions: '' });
    } catch (error) {
      console.error('Error creating template:', error);
      // You might want to show an error message to the user here
      // For example, using a toast notification or error state
    }
  };

  // Event handlers
  const handleSearchChange = (value) => setSearchQuery(value);
  const handleTagFilter = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };
  const handleClearTags = () => setSelectedTags([]);
  
  const handleActionStatusFilter = (status) => {
    setSelectedActionStatus(status);
  };
  const handleBackToFiles = () => {
    setCurrentView(null);
    setSelectedFile(null);
    navigate('/survey-app');
  };
  const handleViewChange = (view) => setCurrentView(view);
  const handleToggleMobileMenu = () => setShowMobileMenu(!showMobileMenu);
  const handleShowCreateTemplateModal = () => setShowCreateTemplateModal(true);
  const handleEditTemplate = async (templateId) => {
    if (editingTemplate === templateId) {
      setEditingTemplate(null);
      setNewTemplateItem(null);
      setNewTemplateSection(null);
    } else {
      setEditingTemplate(templateId);
      setNewTemplateItem(null);
      setNewTemplateSection(null);
      await loadTemplateSectionsFromDatabase(templateId);
    }
  };

  // Handle delete template function
  const handleDeleteTemplate = async (templateId) => {
    // Find the template to get its name for confirmation
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setTemplateToDelete(template);
      setShowDeleteConfirmModal(true);
    }
  };

  // Handle confirm delete template function
  const handleConfirmDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      // Make API call to delete the template
      await deleteSurveyTemplate(templateToDelete.id);

      // Refresh templates list from API
      const templatesResponse = await getAllSurveyTemplates();
      if (templatesResponse && Array.isArray(templatesResponse)) {
        const transformedTemplates = templatesResponse.map(template => ({
          id: template.id,
          name: template.title || template.name,
          description: template.descriptions || template.description,
          template: template.template || []
        }));
        setTemplates(transformedTemplates);
        
        // Load template sections and items for all templates
        const allTemplateSections = [];
        const allTemplateItems = [];
        templatesResponse.forEach(template => {
          if (template.template && Array.isArray(template.template)) {
            const firstItem = template.template[0];
            
            if (firstItem && firstItem.items) {
              // New format: template.template contains sections with items
              const transformedSections = template.template.map(section => ({
                ...section,
                templateId: template.id
              }));
              allTemplateSections.push(...transformedSections);
            } else {
              // Old format: template.template contains individual items
              const transformedItems = template.template.map(item => ({
                ...item,
                templateId: template.id
              }));
              allTemplateItems.push(...transformedItems);
            }
          }
        });
        setTemplateSections(allTemplateSections);
        setTemplateItems(allTemplateItems);
      }

      // Show success notification
      toast.success(`Template "${templateToDelete.name}" đã được xóa thành công!`);
      
      // Close modal and reset state
      setShowDeleteConfirmModal(false);
      setTemplateToDelete(null);
      
      console.log('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      // Show error notification
      toast.error('Có lỗi xảy ra khi xóa template. Vui lòng thử lại!');
    }
  };

  // Handle cancel delete template function
  const handleCancelDeleteTemplate = () => {
    setShowDeleteConfirmModal(false);
    setTemplateToDelete(null);
  };

  // Handle delete survey function
  const handleDeleteSurvey = (survey) => {
    setSurveyToDelete(survey);
    setShowDeleteSurveyConfirmModal(true);
  };

  // Handle confirm delete survey function
  const handleConfirmDeleteSurvey = async () => {
    if (!surveyToDelete) return;

    try {
      // Make API call to delete the survey
      await deleteSurvey(surveyToDelete.id);

      // Remove from local state
      setSurveyFiles(prev => prev.filter(file => file.id !== surveyToDelete.id));
      
      // If the deleted survey was selected, clear selection
      if (selectedFile && selectedFile.id === surveyToDelete.id) {
        setSelectedFile(null);
        setCurrentView(null);
        setSurveyItems([]);
      }

      // Show success notification
      toast.success(`Survey "${surveyToDelete.name}" đã được xóa thành công!`);
      
      // Close modal and reset state
      setShowDeleteSurveyConfirmModal(false);
      setSurveyToDelete(null);
      
      console.log('Survey deleted successfully');
    } catch (error) {
      console.error('Error deleting survey:', error);
      // Show error notification
      toast.error('Có lỗi xảy ra khi xóa survey. Vui lòng thử lại!');
    }
  };

  // Handle cancel delete survey function
  const handleCancelDeleteSurvey = () => {
    setShowDeleteSurveyConfirmModal(false);
    setSurveyToDelete(null);
  };

  // Function to load deleted surveys
  const loadDeletedSurveys = async () => {
    console.log('🔍 Loading deleted surveys...');
    setDeletedSurveysLoading(true);
    try {
      const response = await getDeletedSurveys();
      console.log('📊 Raw deleted surveys response:', response);
      
      if (response && Array.isArray(response)) {
        console.log('✅ Response is valid array, length:', response.length);
        console.log('🗑️ Deleted surveys data:', response);
        setDeletedSurveys(response);
      } else {
        console.log('❌ Response is not valid array:', response);
        setDeletedSurveys([]);
      }
    } catch (error) {
      console.error('❌ Error loading deleted surveys:', error);
      toast.error('Có lỗi xảy ra khi tải surveys đã xóa');
    } finally {
      setDeletedSurveysLoading(false);
    }
  };

  // Function to load survey files from API
  const loadSurveyFiles = async () => {
    try {
      const surveysResponse = await getAllSurveys();
      if (surveysResponse && Array.isArray(surveysResponse)) {
        const transformedSurveys = surveysResponse.map(survey => {
          // Parse content to get section information
          let sectionInfo = [];
          if (survey.content) {
            try {
              let contentArray = survey.content;
              if (typeof contentArray === 'string') {
                contentArray = JSON.parse(contentArray);
              }
              
              if (Array.isArray(contentArray)) {
                // Standard format - array of items (completion calculated on display)
                const sectionCompletion = calculateSectionCompletion(contentArray);
                
                // Extract section information
                const sections = [];
                Object.keys(sectionCompletion).forEach(sectionId => {
                  const section = sectionCompletion[sectionId];
                  const sectionTitle = contentArray.find(item => item.sectionId === sectionId && item.type === 'section_header')?.title || `Section ${sectionId}`;
                  sections.push({
                    id: sectionId,
                    title: sectionTitle,
                    completedItems: section.completedItems,
                    totalItems: section.totalItems,
                    completed: section.completed,
                    completionPercentage: section.completionPercentage
                  });
                });
                sectionInfo = sections;
              }
            } catch (error) {
              console.error('Error parsing survey content for sections:', error);
            }
          }

          return {
            id: survey.id,
            name: survey.title,
            tags: survey.tags || [],
            templateId: survey.templateId,
            createdAt: survey.dateCreated ? new Date(survey.dateCreated).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            completed: survey.completed || false,
            successScore: survey.successScore || 0,
            summaryNotes: survey.summary_notes || "",
            nextAction: survey.next_action || "",
            actionDate: survey.actionDate || "",
            status: survey.status || "waiting",
            sections: sectionInfo
          };
        });
        setSurveyFiles(transformedSurveys);
      }
    } catch (error) {
      console.error('Error loading survey files:', error);
    }
  };

  // Function to restore a survey
  const restoreSurvey = async (surveyId) => {
    try {
      // Use the new restoreSurvey service function
      const response = await restoreSurveyService(surveyId);
      console.log('Restore survey response:', response);
      
      // Remove from deleted surveys list
      setDeletedSurveys(prev => prev.filter(survey => survey.id !== surveyId));
      
      // Refresh the main survey files list
      await loadSurveyFiles();
      
      // Use the message from the API response if available
      const successMessage = 'Survey đã được khôi phục thành công';
      toast.success(successMessage);
    } catch (error) {
      console.error('Error restoring survey:', error);
      toast.error('Có lỗi xảy ra khi khôi phục survey');
    }
  };

  // Handle update template function
  const handleUpdateTemplate = async (templateId, updatedTemplate) => {
    try {
      // Find the current template to get all existing data
      const currentTemplate = templates.find(t => t.id === templateId);
      if (!currentTemplate) {
        throw new Error('Template not found');
      }

      // Prepare the update data with all required fields
      const updateData = {
        id: templateId,
        title: updatedTemplate.name,
        descriptions: updatedTemplate.description,
        // Include any other fields that might be required by the API
        template: currentTemplate.template || []
      };

      console.log('Updating template with data:', updateData);

      // Make API call to update the template
      await updateSurveyTemplate(updateData);

      // Update local state
      setTemplates(prevTemplates => 
        prevTemplates.map(template => 
          template.id === templateId 
            ? { ...template, name: updatedTemplate.name, description: updatedTemplate.description }
            : template
        )
      );

      // Show success notification
      toast.success('Template đã được cập nhật thành công!');
    } catch (error) {
      console.error('Error updating template:', error);
      // Show error notification
      toast.error('Có lỗi xảy ra khi cập nhật template. Vui lòng thử lại!');
    }
  };

  // Confirm Delete Template Modal
  const ConfirmDeleteTemplateModal = () => {
    if (!showDeleteConfirmModal || !templateToDelete) return null;

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>Xóa Template</h3>
            <button
              onClick={handleCancelDeleteTemplate}
              className={styles.modalCloseButton}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className={styles.modalForm}>
            <div className={styles.formGroup}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Bạn có chắc chắn muốn xóa template <strong>"{templateToDelete.name}"</strong>?
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>
                Hành động này sẽ không thể hoàn tác và sẽ xóa tất cả các items trong template.
              </p>
            </div>
          </div>
          <div className={styles.modalActions} style={{ 
            justifyContent: 'flex-end', 
            paddingTop: '1rem',
            marginTop: '-0.5rem',
            marginBottom: '1rem',
            marginRight: '1rem'
          }}>
            <button
              onClick={handleCancelDeleteTemplate}
              className={styles.cancelButton}
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmDeleteTemplate}
              className={styles.submitButton}
              style={{ backgroundColor: '#dc2626' }}
            >
              Xóa Template
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.appContainer}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1}}>
          <div 
            className={styles.backCanvas}
            onClick={() => setShowNavigationConfirmModal(true)}
            title="Back to Dashboard"
          >
            <BackCanvas height={20} width={20} />
          </div>
          {masterTool && (
            <>
              {masterTool.icon ? (
                (() => {
                  const iconSrc = getIconSrcById(masterTool);
                  return iconSrc ? (
                    <img src={iconSrc} alt={masterTool.name} width={30} height={30} />
                  ) : (
                    <span style={{ fontSize: '20px' }}>{masterTool.icon}</span>
                  );
                })()
              ) : (
                <span style={{ fontSize: '20px' }}>🛠️</span>
              )}
            </>
          )}
          <h1 className={styles.topBarTitle}>{masterTool ? masterTool.name : (nameTable || 'Customer Survey App')}</h1>
        </div>
        
        {/* Middle Tabs */}
        <div className={styles.topBarTabs}>
            {/* <button
              onClick={() => {
                // Only open sidebar, don't change currentView if we're viewing a survey
                if (!sidebarOpen) {
                  setSidebarOpen(true);
                }
              }}
              className={`${styles.topBarTab} ${
                sidebarOpen ? styles.topBarTabActive : ''
              }`}
            >
              <FileText className={styles.topBarTabIcon} />
              <span>Danh sách Form</span>
            </button> */}
          <button
            onClick={addNewFile}
            className={`${styles.topBarTab} ${
              currentView === 'create' ? styles.topBarTabActive : ''
            }`}
          >
            <Plus className={styles.topBarTabIcon} />
            <span>Tạo mới Form</span>
          </button>
          <button
            onClick={() => setCurrentView('templates')}
            className={`${styles.topBarTab} ${
              currentView === 'templates' ? styles.topBarTabActive : ''
            }`}
          >
            <Settings className={styles.topBarTabIcon} />
            <span>Cài Template</span>
          </button>
          <button
            onClick={() => {
              setShowTableDataView(true);
              setCurrentView('tableData');
            }}
            className={`${styles.topBarTab} ${
              currentView === 'tableData' ? styles.topBarTabActive : ''
            }`}
          >
            <Table className={styles.topBarTabIcon} />
            <span>Xem dữ liệu dạng bảng</span>
          </button>
        </div>
        
        <div style={{display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1}}>
          <button
            onClick={handleToggleMobileMenu}
            className={styles.mobileMenuButton}
          >
            <span>☰</span>
          </button>
        </div>
      </div>

      <div className={styles.mainLayout}>
        {/* Sidebar Backdrop for mobile */}
        {sidebarOpen && window.innerWidth < 1024 && (
          <div 
            className={styles.sidebarBackdrop}
            onClick={toggleSidebar}
          />
        )}
        
        <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarHeaderContent}>
              <div className={styles.sidebarTitleContainer}>
                <h2 className={styles.sidebarTitle}>Danh sách Form</h2>
                <Tooltip title="Xem form đã xoá" placement="bottom">
                <button
                  onClick={() => setShowDeletedSurveysModal(true)}
                  className={styles.trashButton}
                >
                  <Trash className="w-4 h-4" />
                </button>
                </Tooltip>
              </div>
              <button
                onClick={toggleSidebar}
                className={styles.sidebarCloseButton}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* <div className={styles.sidebarMenu}>
              <button
                onClick={() => setCurrentView('templates')}
                className={`${styles.sidebarButton} ${
                  currentView === 'templates' ? styles.active : ''
                }`}
              >
                <Settings className={styles.sidebarButtonIcon} />
                Template Settings
              </button>
            </div> */}
          </div>
          
          <FileList 
          surveyFiles={getFilteredFiles()}
          allSurveyFiles={surveyFiles}
            selectedFile={selectedFile}
            searchQuery={searchQuery}
            selectedTags={selectedTags}
          selectedActionStatus={selectedActionStatus}
            surveyFilesLoading={surveyFilesLoading}
            onFileClick={handleFileClick}
            onUpdateTags={updateFileTags}
            onUpdateSalesInfo={updateFileSalesInfo}
            onSearchChange={handleSearchChange}
            onTagFilter={handleTagFilter}
            onClearTags={handleClearTags}
          onActionStatusFilter={handleActionStatusFilter}
            onDeleteSurvey={handleDeleteSurvey}
          />
        </div>

        <div className={styles.mainContent}>
          <div className={styles.contentArea}>
            {currentView === 'survey' && selectedFile ? (
              <SurveyView 
                selectedFile={selectedFile}
                surveyItems={surveyItems}
                surveyItemsLoading={surveyItemsLoading}
                expandedNotes={expandedNotes}
                isSaving={isSaving}
                onBackToFiles={handleBackToFiles}
                onToggleCompleted={toggleItemCompleted}
                onToggleNote={toggleNote}
                onUpdateMCQSelection={updateMCQSelection}
                onUpdateChoiceNote={updateChoiceNote}
                onUpdateQAAnswer={updateQAAnswer}
                onUpdateNoteValue={updateNoteValue}
                onUpdateSalesInfo={updateFileSalesInfo}
                onRefetchSurveyData={() => loadSurveyDataSafely(selectedFile.id)}
                onUpdateTitle={updateSurveyTitle}
                onUpdateTags={updateFileTags}
              />
            ) : currentView === 'templates' ? (
              <TemplateSettingsView 
                templates={templates}
                templatesLoading={templatesLoading}
                templateItems={templateItems}
                templateSections={templateSections}
                editingTemplate={editingTemplate}
                showCreateTemplateModal={showCreateTemplateModal}
                newTemplateData={newTemplateData}
                onShowCreateTemplateModal={handleShowCreateTemplateModal}
                onCreateTemplate={handleCreateTemplate}
                onUpdateTemplateData={setNewTemplateData}
                onEditTemplate={handleEditTemplate}
                onAddTemplateSection={addTemplateSection}
                onAddTemplateItem={addTemplateItem}
                onUpdateTemplateItem={updateTemplateItem}
                onDeleteTemplateItem={deleteTemplateItem}
                onMoveTemplateItem={moveTemplateItem}
                onUpdateTemplateSection={updateTemplateSection}
                onDeleteTemplateSection={deleteTemplateSection}
                onDeleteTemplate={handleDeleteTemplate}
                onUpdateTemplate={handleUpdateTemplate}
              />
            ) : currentView === 'tableData' ? (
              <TableDataFormat
                surveyFiles={surveyFiles}
                templates={templates}
                onClose={() => {
                  setShowTableDataView(false);
                  setCurrentView(null);
                }}
              />
            ) : (
              <EmptyState 
                text="Chọn file khảo sát để bắt đầu"
                subtext=""
              />
            )}
          </div>
        </div>
      </div>

              <MobileMenu
          showMobileMenu={showMobileMenu}
          currentView={currentView}
          onToggleMobileMenu={handleToggleMobileMenu}
          onViewChange={handleViewChange}
          onAddNewFile={addNewFile}
          onOpenSidebar={() => setSidebarOpen(true)}
          sidebarOpen={sidebarOpen}
        >
        <FileList 
          surveyFiles={getFilteredFiles()}
          allSurveyFiles={surveyFiles}
          selectedFile={selectedFile}
          searchQuery={searchQuery}
          selectedTags={selectedTags}
          selectedActionStatus={selectedActionStatus}
          surveyFilesLoading={surveyFilesLoading}
          onFileClick={handleFileClick}
          onUpdateTags={updateFileTags}
          onUpdateSalesInfo={updateFileSalesInfo}
          onSearchChange={handleSearchChange}
          onTagFilter={handleTagFilter}
          onClearTags={handleClearTags}
          onActionStatusFilter={handleActionStatusFilter}
          onDeleteSurvey={handleDeleteSurvey}
        />
      </MobileMenu>

      <TemplateSelector 
        showTemplateSelector={showTemplateSelector}
        templates={templates}
        templatesLoading={templatesLoading}
        onCreateFileWithTemplate={createFileWithTemplate}
      />

      {/* Create Template Modal */}
      {showCreateTemplateModal && (
        <CreateTemplateModal 
          isOpen={showCreateTemplateModal}
          onClose={() => setShowCreateTemplateModal(false)}
          onSubmit={handleCreateTemplate}
          data={newTemplateData}
          onChange={setNewTemplateData}
        />
      )}

      {/* Delete Template Confirmation Modal */}
      <ConfirmDeleteTemplateModal />

      {/* Delete Survey Confirmation Modal */}
      {showDeleteSurveyConfirmModal && surveyToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Xóa Survey</h3>
              <button
                onClick={handleCancelDeleteSurvey}
                className={styles.modalCloseButton}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={styles.modalForm}>
              <div className={styles.formGroup}>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                  Bạn có chắc chắn muốn xóa survey <strong>"{surveyToDelete.name}"</strong>?
                </p>
                <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>
                  Hành động này sẽ không thể hoàn tác và sẽ xóa tất cả dữ liệu của survey này.
                </p>
              </div>
            </div>
            <div className={styles.modalActions} style={{ 
              justifyContent: 'flex-end', 
              paddingTop: '1rem',
              marginTop: '-0.5rem',
              marginBottom: '1rem',
              marginRight: '1rem'
            }}>
              <button
                onClick={handleCancelDeleteSurvey}
                className={styles.cancelButton}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDeleteSurvey}
                className={styles.submitButton}
                style={{ backgroundColor: '#dc2626' }}
              >
                Xóa Survey
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Confirmation Modal */}
      {showNavigationConfirmModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Xác nhận rời khỏi ứng dụng</h3>
              <button
                onClick={() => setShowNavigationConfirmModal(false)}
                className={styles.modalCloseButton}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={styles.modalForm}>
            
            </div>
            <div className={styles.modalActions} style={{ 
              justifyContent: 'flex-end', 
              paddingTop: '1rem',
              marginTop: '-0.5rem',
              marginBottom: '1rem',
              marginRight: '1rem'
            }}>
              <button
                onClick={() => setShowNavigationConfirmModal(false)}
                className={styles.cancelButton}
              >
                Hủy
              </button>
                             <button
                 onClick={() => {
                   setShowNavigationConfirmModal(false);
                   navigate('/dashboard');
                 }}
                 className={styles.submitButton}
                 style={{ backgroundColor: '#dc2626' }}
               >
                 Rời khỏi ứng dụng
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Deleted Surveys Modal */}
      {showDeletedSurveysModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '800px', width: '90%' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Surveys Đã Xóa</h3>
              <button
                onClick={() => setShowDeletedSurveysModal(false)}
                className={styles.modalCloseButton}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={styles.modalBody} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {(() => {
                console.log('🎭 Modal render state:', {
                  deletedSurveysLoading,
                  deletedSurveysLength: deletedSurveys.length,
                  deletedSurveys: deletedSurveys
                });
                
                if (deletedSurveysLoading) {
                  return (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <div className={styles.loadingSpinner}></div>
                      <p>Đang tải surveys đã xóa...</p>
                    </div>
                  );
                } else if (deletedSurveys.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <p>Không có surveys nào đã xóa</p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                        Debug: {deletedSurveysLoading ? 'Loading...' : 'Not loading'} | 
                        Count: {deletedSurveys.length}
                      </p>
                    </div>
                  );
                } else {
                  return (
                <div className={styles.deletedSurveysList}>
                  {deletedSurveys.map((survey) => (
                    <div key={survey.id} className={styles.deletedSurveyItem}>
                      <div className={styles.deletedSurveyInfo}>
                        <h4 className={styles.deletedSurveyTitle}>{survey.title}</h4>
                        <p className={styles.deletedSurveyDate}>
                          Ngày tạo: {new Date(survey.date_created).toLocaleDateString('vi-VN')}
                        </p>
                        {survey.tags && survey.tags.length > 0 && (
                          <div className={styles.deletedSurveyTags}>
                            {survey.tags.map((tag, index) => (
                              <span key={index} className={styles.deletedSurveyTag}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => restoreSurvey(survey.id)}
                        className={styles.restoreButton}
                      >
                        Khôi phục
                      </button>
                    </div>
                  ))}
                </div>
                  );
                }
              })()}
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={() => setShowDeletedSurveysModal(false)}
                className={styles.cancelButton}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerSurveyApp;