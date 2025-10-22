import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { AgGridReact } from 'ag-grid-react';
import KPI2ContentView from '../../../Canvas/CanvasFolder/KPI2Calculator/KPI2ContentView.jsx';
import { Button, Collapse, Dropdown, message, Modal, Popconfirm, Spin, Switch, Radio, Pagination } from 'antd';
import DOMPurify from 'dompurify';
import { BookOpen, Clock, Edit2, History, Paperclip, Play, Plus, Settings, Trash2, Wrench } from 'lucide-react';
import { marked } from 'marked';
import React, { useContext, useEffect, useState, useMemo, useRef } from 'react';
import { evaluate } from 'mathjs';
import { createChatHistory, deleteChatHistory, getAllChatHistory, updateChatHistory } from '../../../../apis/aiChatHistoryService.jsx';
import { createChatExport } from '../../../../apis/aiChatExportService.jsx';
import { getAllApprovedVersion } from '../../../../apis/approvedVersionTemp.jsx';
import { analyzeData, analyzeDataFinal, drawChart } from '../../../../apis/botService.jsx';
import { createSetting, getSettingByType, updateSetting } from '../../../../apis/settingService.jsx';
import { getTemplateColumn, getTemplateRow, getTemplateVersion } from '../../../../apis/templateSettingService.jsx';
import { getAllKpi2Calculator, getKpi2CalculatorById } from '../../../../apis/kpi2CalculatorService.jsx';
import { getAllKpiCalculator, getKpiCalculatorById } from '../../../../apis/kpiCalculatorService.jsx';
import { MODEL_AI_LIST } from '../../../../CONST.js';
import { MyContext } from '../../../../MyContext.jsx';
import { getUserClassByEmail } from '../../../../apis/userClassService.jsx';
import DataModal from '../../../AI/DataModal';
import { defaultMessage1, defaultMessage2, defaultMessage3 } from '../../../AI/default.js';
import ChartComponent from '../../../AI/ChartComponent.jsx';
import styles from './ReportBuilderNonPD.module.css';
import EditJobModal from '../modals/EditJobModal';
import EditTemplateModal from '../modals/EditTemplateModal';
import NewTemplateModal from '../modals/NewTemplateModal';
import AIForm from '../../../AI/AIForm';
import Loading3DTower from '../../../../components/Loading3DTower';
import Editor from 'react-simple-code-editor';
import AG_GRID_LOCALE_VN from '../../../Home/AgridTable/locale.jsx';
// import 'prismjs/themes/prism.css';
import { FileText, Notebook } from 'lucide-react';
import {
	getApprovedVersionDataById
} from '../../../../apis/approvedVersionTemp.jsx';

import {
	PlusOutlined,
} from '@ant-design/icons';

// Add queue system
const analyzeQueue = [];
let isProcessingQueue = false;

// Utility functions for KPI data processing
const convertPeriodData = (kpiData, targetPeriod) => {
  const { period: sourcePeriod, tableData } = kpiData;

  if (sourcePeriod == targetPeriod) {
    return tableData;
  }

  const periodConversions = {
    weekToDay: (data) => {
      const result = [];
      data.forEach((item) => {
        const matches = item.date.match(/Tuần (\d+)\/(\d+)/);
        if (!matches) return;
        const weekNum = parseInt(matches[1]);
        const year = parseInt(matches[2]);
        const firstDayOfWeek = getFirstDayOfWeek(weekNum, year);
        const dailyValue = item.value / 7;
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(firstDayOfWeek);
          currentDate.setDate(firstDayOfWeek.getDate() + i);
          result.push({
            date: formatDate(currentDate),
            value: dailyValue,
          });
        }
      });
      return result;
    },
    monthToDay: (data) => {
      const result = [];
      data.forEach((item) => {
        const matches = item.date.match(/Tháng (\d+)\/(\d+)/);
        if (!matches) return;
        const monthNum = parseInt(matches[1]);
        const year = parseInt(matches[2]);
        const daysInMonth = getDaysInMonth(monthNum - 1, year);
        const dailyValue = item.value / daysInMonth;
        for (let i = 0; i < daysInMonth; i++) {
          const currentDate = new Date(year, monthNum - 1, i + 1);
          result.push({
            date: formatDate(currentDate),
            value: dailyValue,
          });
        }
      });
      return result;
    },
    monthToWeek: (data) => {
      const result = [];
      data.forEach((item) => {
        const matches = item.date.match(/Tháng (\d+)\/(\d+)/);
        if (!matches) return;
        const monthNum = parseInt(matches[1]);
        const year = parseInt(matches[2]);
        const weeksInMonth = 4;
        const weeklyValue = item.value / weeksInMonth;
        const weekNumbers = getWeeksInMonth(monthNum - 1, year);
        weekNumbers.forEach((weekNum) => {
          result.push({
            date: `Tuần ${weekNum}/${year}`,
            value: weeklyValue,
          });
        });
      });
      return result;
    },
    dayToWeek: (data) => {
      const weekMap = new Map();
      data.forEach((item) => {
        const [day, month, year] = item.date.split('/').map(Number);
        const weekNum = getWeekNumber(new Date(year, month - 1, day));
        const weekKey = `Tuần ${weekNum}/${year}`;
        if (weekMap.has(weekKey)) {
          weekMap.set(weekKey, weekMap.get(weekKey) + item.value);
        } else {
          weekMap.set(weekKey, item.value);
        }
      });
      return Array.from(weekMap.entries()).map(([date, value]) => ({
        date,
        value,
      }));
    },
    dayToMonth: (data) => {
      const monthMap = new Map();
      data.forEach((item) => {
        const [day, month, year] = item.date.split('/').map(Number);
        const monthKey = `Tháng ${month}/${year}`;
        if (monthMap.has(monthKey)) {
          monthMap.set(monthKey, monthMap.get(monthKey) + item.value);
        } else {
          monthMap.set(monthKey, item.value);
        }
      });
      return Array.from(monthMap.entries()).map(([date, value]) => ({
        date,
        value,
      }));
    },
    weekToMonth: (data) => {
      const monthMap = new Map();
      data.forEach((item) => {
        const matches = item.date.match(/Tuần (\d+)\/(\d+)/);
        if (!matches) return;
        const weekNum = parseInt(matches[1]);
        const year = parseInt(matches[2]);
        const monthNum = Math.ceil(weekNum / 4);
        const monthKey = `Tháng ${monthNum}/${year}`;
        if (monthMap.has(monthKey)) {
          monthMap.set(monthKey, monthMap.get(monthKey) + item.value);
        } else {
          monthMap.set(monthKey, item.value);
        }
      });
      return Array.from(monthMap.entries()).map(([date, value]) => ({
        date,
        value,
      }));
    },
  };

  function formatDate(date) {
    return `${String(date.getDate()).padStart(2, '0')}/${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}/${date.getFullYear()}`;
  }

  function getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfWeek(weekNum, year) {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (weekNum - 1) * 7;
    const firstDayOfWeek = new Date(firstDayOfYear);
    firstDayOfWeek.setDate(firstDayOfYear.getDate() + daysToAdd);
    return firstDayOfWeek;
  }

  function getWeekNumber(date) {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  }

  function getWeeksInMonth(month, year) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstWeek = getWeekNumber(firstDay);
    const lastWeek = getWeekNumber(lastDay);
    const weekNumbers = [];
    for (let week = firstWeek; week <= lastWeek; week++) {
      weekNumbers.push(week);
    }
    return weekNumbers;
  }

  const conversionKey = `${sourcePeriod}To${targetPeriod.charAt(0).toUpperCase() + targetPeriod.slice(1)
    }`;

  if (periodConversions[conversionKey]) {
    return periodConversions[conversionKey](tableData);
  } else {
    console.error(
      `Conversion from ${sourcePeriod} to ${targetPeriod} is not supported`,
    );
    return tableData;
  }
};

const convertVariableData = (varData, targetPeriod, year = new Date().getFullYear()) => {
  const monthlyData = [];
  for (let i = 1; i <= 12; i++) {
    const key = `t${i}`;
    if (varData[key] !== undefined) {
      monthlyData.push({
        date: `Tháng ${i}/${year}`,
        value: varData[key],
      });
    }
  }
  if (targetPeriod == 'month') {
    return monthlyData;
  } else if (targetPeriod == 'week') {
    return monthToWeek(monthlyData, year);
  } else if (targetPeriod == 'day') {
    return monthToDay(monthlyData);
  } else {
    console.error(`Conversion to ${targetPeriod} is not supported`);
    return monthlyData;
  }
};

function monthToDay(data) {
  const result = [];
  data.forEach((item) => {
    const matches = item.date.match(/Tháng (\d+)\/(\d+)/);
    if (!matches) return;
    const monthNum = parseInt(matches[1]);
    const year = parseInt(matches[2]);
    const daysInMonth = getDaysInMonth(monthNum - 1, year);
    const dailyValue = item.value / daysInMonth;
    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = new Date(year, monthNum - 1, i + 1);
      result.push({
        date: formatDate(currentDate),
        value: dailyValue,
      });
    }
  });
  return result;
}

function monthToWeek(data, year) {
  const result = [];
  data.forEach((item) => {
    const matches = item.date.match(/Tháng (\d+)\/(\d+)/);
    if (!matches) return;
    const monthNum = parseInt(matches[1]);
    const year = parseInt(matches[2]);
    const weeksInMonth = 4;
    const weeklyValue = item.value / weeksInMonth;
    const weekNumbers = getWeeksInMonth(monthNum - 1, year);
    weekNumbers.forEach((weekNum) => {
      result.push({
        date: `Tuần ${weekNum}/${year}`,
        value: weeklyValue,
      });
    });
  });
  return result;
}

// Thêm hàm highlightPrompt phía trên component ReportBuilderNonPD
const highlightPrompt = (code) => {
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Highlight <...>
  html = html.replace(/(&lt;[^&]*&gt;)/g, '<span class="highlight-special">$1</span>');
  // Highlight _..._
  html = html.replace(/(_[^_\s]*_)/g, '<span class="highlight-special">$1</span>');
  // Highlight #...#
  html = html.replace(/(#[^#\s]*#)/g, '<span class="highlight-special">$1</span>');
  // Highlight @...@
  html = html.replace(/(@[^@\s]*@)/g, '<span class="highlight-special">$1</span>');
  return html;
};

const ReportBuilderNonPD = () => {
  const gridRef = useRef(null);
  const { currentUser, listUC_CANVAS, uCSelected_CANVAS, loadDataDuLieu, setLoadDataDuLieu, updateReportBuilder, setUpdateReportBuilder } = useContext(MyContext);
  const [currentUserClasses, setCurrentUserClasses] = useState([]);
  const statusBar = useMemo(() => ({
    statusPanels: [{
      statusPanel: 'agAggregationComponent',
      statusPanelParams: {
        aggFuncs: ['count', 'sum'], // Only show average, count, and sum
      },
    }],
  }), []);
  // State for modals
  const [editingJob, setEditingJob] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', prompt: '' });
  const [formModalOpen, setFormModalOpen] = useState(false);
  // Add state for analysis result modal
  const [analysisResultModalOpen, setAnalysisResultModalOpen] = useState(false);

  // Main state from AI.jsx
  const [fileNotesFull, setFileNotesFull] = useState([]);
  const [fileNotes, setFileNotes] = useState([]);
  const [allFileNotes, setAllFileNotes] = useState([]);
  const [dataAI1, setDataAI1] = useState([]);
  // Data from DataTab (approved versions)
  const [approvedVersionData, setApprovedVersionData] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('Kết quả AI trả lời');
  const [isLoading, setIsLoading] = useState(false);
  const [filteredData, setFilteredData] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFileNote, setSelectedFileNote] = useState(null);
  const [checkedItems, setCheckedItems] = useState([]);
  const [systemMessage1, setSystemMessage1] = useState(defaultMessage1);
  const [systemMessage2, setSystemMessage2] = useState(defaultMessage2);
  const [systemMessage3, setSystemMessage3] = useState(defaultMessage3);
  const [outputConfigSystemMessage, setOutputConfigSystemMessage] = useState('');
  const [autoGeneratedPrompt, setAutoGeneratedPrompt] = useState('');
  const [model1, setModel1] = useState(MODEL_AI_LIST[0].value);
  const [model2, setModel2] = useState(MODEL_AI_LIST[0].value);
  const [model3, setModel3] = useState(MODEL_AI_LIST[0].value);
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [viewingData, setViewingData] = useState({});
  const [usedDataIds, setUsedDataIds] = useState([]);
  const [modelToken1, setModelToken1] = useState('');
  const [modelToken2, setModelToken2] = useState('');
  const [modelToken3, setModelToken3] = useState('');
  const [totalToken, setTotalToken] = useState(0);
  const [data, setData] = useState([]);
  const [chartConfig, setChartConfig] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const [queueLength, setQueueLength] = useState(0);
  const [selectedQueueItem, setSelectedQueueItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [activeTab, setActiveTab] = useState('report'); // 'report' or 'data'
  const [kpi2Calculators, setKpi2Calculators] = useState([]);
  const [selectedFileNotes, setSelectedFileNotes] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [tableColumns, setTableColumns] = useState([]);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(5000);
  const [totalRows, setTotalRows] = useState(0);

  const handlePageChange = (page, size) => {
    setTablePage(page);
    if (size !== tablePageSize) {
      setTablePageSize(size);
    }
  };

  // Function to get KPI data as table format
  const getKpiTableData = async (kpiId) => {
    try {
      const [kpi, listKpiGoc, varList] = await Promise.all([
        getKpi2CalculatorById(kpiId),
        getAllKpiCalculator(),
        getAllKpiCalculator(), // For variable data
      ]);

      if (!kpi) {
        console.error('KPI not found:', kpiId);
        return null;
      }

      const kpiList = Array.isArray(kpi.kpiList) ? kpi.kpiList : [];
      const varListIds = Array.isArray(kpi.varList) ? kpi.varList : [];
      const period = kpi.period || 'day';

      // Parse calculation data
      let formula = '';
      let variables = {};
      if (kpi.calc) {
        try {
          const calcData = JSON.parse(kpi.calc);
          formula = calcData.formula || '';
          variables = calcData.variables || {};
        } catch (error) {
          console.error('Error parsing KPI calc data:', error);
        }
      }

      const rawDataByVariable = {};

      // Process KPI data
      for (const kpiId of kpiList) {
        const kpiData = await getKpiCalculatorById(kpiId);
        if (kpiData.period && kpiData.tableData) {
          const convertedData = convertPeriodData(kpiData, period);
          const variableKey = Object.keys(variables).find(
            (key) => variables[key].type == 'kpi' && variables[key].id == kpiId,
          );
          if (variableKey) rawDataByVariable[variableKey] = convertedData;
        }
      }

      // Process variable data
      for (const varId of varListIds) {
        const varData = varList.find((va) => va.code == varId);
        if (varData) {
          let convertedData;
          if (varData.t1 !== undefined || varData.t2 !== undefined) {
            convertedData = convertVariableData(varData, period, new Date().getFullYear());
          } else if (varData.period && varData.tableData) {
            convertedData = convertPeriodData(varData, period);
          }

          if (convertedData) {
            const variableKey = Object.keys(variables).find(
              (key) => variables[key].type == 'var' && variables[key].id == varId,
            );
            if (variableKey) rawDataByVariable[variableKey] = convertedData;
          }
        }
      }

      // Get all unique dates
      const allDates = new Set();
      Object.values(rawDataByVariable).forEach((dataArray) =>
        dataArray.forEach((item) => allDates.add(item.date)),
      );

      // Sort dates
      const sortedDates = Array.from(allDates).sort((a, b) => {
        if (a.startsWith('Tuần') && b.startsWith('Tuần')) {
          const [aWeek, aYear] = a.replace('Tuần ', '').split('/').map(Number);
          const [bWeek, bYear] = b.replace('Tuần ', '').split('/').map(Number);
          return aYear !== bYear ? aYear - bYear : aWeek - bWeek;
        } else if (a.startsWith('Tháng') && b.startsWith('Tháng')) {
          const [aMonth, aYear] = a.replace('Tháng ', '').split('/').map(Number);
          const [bMonth, bYear] = b.replace('Tháng ', '').split('/').map(Number);
          return aYear !== bYear ? aYear - bYear : aMonth - bMonth;
        } else if (
          a.includes('/') &&
          b.includes('/') &&
          a.split('/').length == 3 &&
          b.split('/').length == 3
        ) {
          const [aDay, aMonth, aYear] = a.split('/').map(Number);
          const [bDay, bMonth, bYear] = b.split('/').map(Number);
          if (aYear !== bYear) return aYear - bYear;
          if (aMonth !== bMonth) return aMonth - bMonth;
          return aDay - bDay;
        }
        return a.localeCompare(b);
      });

      // Calculate final values using formula
      const result = sortedDates.map((date) => {
        const row = { date };
        Object.keys(variables).forEach((varKey) => {
          if (rawDataByVariable[varKey]) {
            const dataPoint = rawDataByVariable[varKey].find(
              (item) => item.date == date,
            );
            row[varKey] = dataPoint ? dataPoint.value : 0;
          } else {
            row[varKey] = 0;
          }
        });

        // Calculate final value using formula
        try {
          row.value = evaluate(formula, row);
        } catch (error) {
          console.error('Error evaluating formula:', error);
          row.value = 0;
        }

        return row;
      });

      // Add benchmark data if available
      if (kpi.benchmark) {
        result.forEach((item) => {
          const date = item.date;
          if (kpi.benchmark1_name && kpi.benchmark1_name.trim() !== '') {
            item.benchmark1 = parseFloat(kpi.benchmark[date]?.benchmark1) || null;
          }
          if (kpi.benchmark2_name && kpi.benchmark2_name.trim() !== '') {
            item.benchmark2 = parseFloat(kpi.benchmark[date]?.benchmark2) || null;
          }
        });
      }

      return {
        name: kpi.name,
        data: result,
        period: period,
        formula: formula,
        variables: variables,
        benchmark1_name: kpi.benchmark1_name,
        benchmark2_name: kpi.benchmark2_name
      };

    } catch (error) {
      console.error('Error getting KPI table data:', error);
      return null;
    }
  };

  // Function to get KPI data for template (similar to mapToDataAICheck)
  const getKpiDataForTemplate = async (kpiIds) => {
    const kpiData = {};

    for (const kpiId of kpiIds) {
      try {
        const kpiTableData = await getKpiTableData(kpiId);
        if (kpiTableData) {
          kpiData[kpiTableData.name] = kpiTableData.data;
        }
      } catch (error) {
        console.error(`Error getting KPI data for ${kpiId}:`, error);
      }
    }

    return kpiData;
  };
  const [isFirstLoading, setIsFirstLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadedFileData, setUploadedFileData] = useState(null);
  const [isUsingUploadedData, setIsUsingUploadedData] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [saveFileName, setSaveFileName] = useState('');
  const [saveFolder, setSaveFolder] = useState(undefined);
  const [tabs, setTabs] = useState([]);
  const [multipleCharts, setMultipleCharts] = useState([]);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishingHistoryId, setPublishingHistoryId] = useState(null);

  // Additional states for AI.jsx compatibility
  const [useCreateChart, setUseCreateChart] = useState(false); // Always create charts by default
  const [questSetting, setQuestSetting] = useState(null);
  const [usePivotConfig, setUsePivotConfig] = useState(false);

  // Keep existing template state
  const [currentJob, setCurrentJob] = useState('');
  const [inProgressJobs, setInProgressJobs] = useState([]);
  const [jobHistory, setJobHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]); // Tổng số template trước khi lọc
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Template selection state for DataModal and main workflow
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateBasedAnalysis, setTemplateBasedAnalysis] = useState(true); // Always use template-based analysis

  // Fetch current user's user classes
  useEffect(() => {
    async function fetchCurrentUserClasses() {
      try {
        const userClasses = await getUserClassByEmail();
        setCurrentUserClasses(userClasses);
      } catch (error) {
        console.error('Error fetching current user classes:', error);
        setCurrentUserClasses([]);
      }
    }
    fetchCurrentUserClasses();
  }, []);

  // Load data and system messages
  useEffect(() => {
    console.log('🏁 [AI NonPD] Component initialized, loading all data...', {
      user: currentUser?.email,
      listUC_CANVAS: listUC_CANVAS?.length,
      uCSelected_CANVAS
    });

    loadData();
    loadApprovedVersionData();
    loadSystemMessages();
    loadChatHistory();
    loadKpi2Calculators();
  }, [listUC_CANVAS, uCSelected_CANVAS, currentUser, updateReportBuilder]);

  useEffect(() => {
    setIsFirstLoading(true);
    loadData();
    loadApprovedVersionData();
    loadChatHistory();
    setTimeout(() => {
      setIsFirstLoading(false);
    }, 1000);
  }, []);
  // Load templates when currentUserClasses changes
  useEffect(() => {
    if (currentUserClasses.length >= 0) { // Load even if empty array
      loadTemplates();
    }
  }, [currentUserClasses]);

  useEffect(() => {
    if (selectedId) {
      // First try to find in approved version data   
      let fileNote = approvedVersionData.find(note => note.id === selectedId);
      // If not found, try in fileNotesFull
      if (!fileNote) {
        fileNote = fileNotesFull.find(note => note.id === selectedId);
      }

      // If found and it's an approved version, load the actual data
      if (fileNote && (!fileNote.rows || fileNote.rows.length === 0)) {
        loadApprovedVersionDetails(fileNote);
      } else {
        setSelectedFileNote(fileNote);
      }
    } else {
      setSelectedFileNote(null);
    }
  }, [selectedId, fileNotesFull, approvedVersionData]);

  const loadApprovedVersionDetails = async (approvedVersion) => {
    try {
      // Get template columns and rows for the approved version
      const columns = await getTemplateColumn(approvedVersion.id_template, approvedVersion.id_version);
      const rowVersionResponse = await getTemplateRow(
        approvedVersion.id_template,
        approvedVersion.id_version == 1 ? null : approvedVersion.id_version
      );
      const rowVersion = rowVersionResponse.rows || [];
      const version = await getTemplateVersion(approvedVersion.id_template, approvedVersion.id_version);
      const rowData = rowVersion.map(row => ({ ...row.data, rowId: row.id }));
      const shuffled = [...rowData].sort(() => 0.5 - Math.random());

      const updatedNote = {
        ...approvedVersion,
        rows: rowData,
        rowDemo: shuffled.slice(0, 30),
        templateColumns: columns,
        desc: version?.desc || ''
      };
      setSelectedFileNote(updatedNote);

      // Update the approved version data with loaded details
      setApprovedVersionData(prev =>
        prev.map(note =>
          note.id === approvedVersion.id ? updatedNote : note,
        ),
      );
    } catch (error) {
      console.error('Error loading approved version details:', error);
      setSelectedFileNote(approvedVersion);
    }
  };

  const filterFileNotes = (notes, checkedIds) => {
    return notes.filter(item => {
      const versionSuffix = item.id_version && item.id_version !== 1 ? `_v${item.id_version}` : '';
      const aiId = `${item.id_template}${versionSuffix}`;
      return (item.rows.length > 0 || item.id_template) && checkedIds.some(id => id == aiId);
    });
  };

  const mapToDataAICheck = (notes) => {
    return notes.map(item => {
      // Create AI ID format: template_id + version (to match AI1 response format like "13_v2")
      const versionSuffix = item.id_version && item.id_version !== 1 ? `_v${item.id_version}` : '';
      const aiCompatibleId = `${item.id_template}${versionSuffix}`;

      console.log(`�� [AI NonPD] Mapping data for AI:`, {
        approvedVersionId: item.id,
        templateId: item.id_template,
        version: item.id_version,
        aiId: aiCompatibleId,
        name: item.name
      });

      return {
        id: aiCompatibleId, // Use template_id + version format for AI (matches AI1 response)
        originalId: item.id, // Keep original approved version ID for reference
        name: item.name,
        tab: item.tab || 'Unknown',
        created_at: item.created_at,
        rowDemo: item.rowDemo || [],
        description: item.desc || '',
        mother_table_id: item.mother_table_id,
        table_id: item.id_template,
        id_template: item.id_template,
        id_version: item.id_version
      };
    });
  };

  const updateFilteredStates = (notes, checkedIds) => {
    const filteredNotes = filterFileNotes(notes, checkedIds);
    const dataAICheck = mapToDataAICheck(filteredNotes);
    setFileNotes(filteredNotes);
    setDataAI1(dataAICheck);
  };

  const handleFileNoteUpdate = (updatedNote) => {
    setSelectedFileNote(updatedNote);

    // Update approved version data
    setApprovedVersionData(prev =>
      prev.map(note =>
        note.id === updatedNote.id ? updatedNote : note,
      ),
    );

    // Update fileNotesFull
    setFileNotesFull(prev =>
      prev.map(note =>
        note.id === updatedNote.id ? updatedNote : note,
      ),
    );

    // Update fileNotes
    setFileNotes(prev =>
      prev.map(note =>
        note.id === updatedNote.id ? updatedNote : note,
      ),
    );

    // Update dataAI1
    setDataAI1(prev =>
      prev.map(item =>
        item.id === updatedNote.id ? {
          ...item,
          description: updatedNote.desc,
        } : item,
      ),
    );
  };

  async function loadData() {
    console.log('📁 [AI NonPD] Loading approved version data...');
    const loadStartTime = Date.now();

    try {
      // Load approved version data with details
      const allData = await getAllApprovedVersion();
      console.log('📊 [AI NonPD] Raw approved versions loaded:', {
        totalCount: allData.length,
        loadTime: `${Date.now() - loadStartTime}ms`
      });

      // Filter data where apps includes 'ai-document'
      const data = allData.filter(item =>
        (Array.isArray(item.apps) && item.apps?.includes('analysis-review'))
      );

      console.log('🔍 [AI NonPD] Filtered for analysis-review:', {
        filteredCount: data.length,
        originalCount: allData.length
      });

      const approvedVersionsWithDetails = [];

      // Load details for each approved version
      for (const item of data) {
        try {
          console.log(`📋 [AI NonPD] Loading details for: ${item.name} (ID: ${item.id})`);

          // Get template columns and rows for the approved version
          const columns = await getTemplateColumn(item.id_template, item.id_version);
          const rowVersionResponse = await getTemplateRow(
            item.id_template,
            item.id_version == 1 ? null : item.id_version
          );
          const rowVersion = rowVersionResponse.rows || []; 
          const version = await getTemplateVersion(item.id_template, item.id_version);

          const rowData = rowVersion.map(row => ({ ...row.data, rowId: row.id }));
          const shuffled = [...rowData].sort(() => 0.5 - Math.random());

          const detailedItem = {
            ...item,
            name: item.name,
            rows: rowData,
            rowDemo: shuffled.slice(0, 30),
            templateColumns: columns,
            desc: version?.desc || '',
            tab: 'Approved Version'
          };

          console.log(`✅ [AI NonPD] Loaded details for ${item.name}:`, {
            rowCount: rowData.length,
            columnsCount: columns.length,
            demoRowCount: shuffled.slice(0, 30).length
          });

          approvedVersionsWithDetails.push(detailedItem);
        } catch (error) {
          console.error(`❌ [AI NonPD] Error loading details for approved version ${item.id}:`, error);
          // Add item without details if loading fails
          approvedVersionsWithDetails.push({
            ...item,
            name: item.fileNoteName,
            rows: [],
            rowDemo: [],
            desc: item.desc || '',
            tab: 'Approved Version'
          });
        }
      }

      console.log('📈 [AI NonPD] Approved versions with details loaded:', {
        totalItems: approvedVersionsWithDetails.length,
        itemsWithData: approvedVersionsWithDetails.filter(item => item.rows.length > 0).length,
        totalLoadTime: `${Date.now() - loadStartTime}ms`
      });
      

      const settings = await getSettingByType('FILE_NOTE_FOR_AI');
      if (settings) {
        console.log('⚙️ [AI NonPD] FILE_NOTE_FOR_AI settings found:', {
          checkedItemsCount: settings.setting?.length || 0,
          checkedItems: settings.setting
        });
        setCheckedItems(settings.setting);
        updateFilteredStates(approvedVersionsWithDetails, settings.setting);
      } else {
        console.log('⚠️ [AI NonPD] No FILE_NOTE_FOR_AI settings found');
      }
      setFileNotesFull(approvedVersionsWithDetails);
      setApprovedVersionData(approvedVersionsWithDetails);
    } catch (error) {
      console.error('❌ [AI NonPD] Error loading data:', error);
    }
  }

  const loadKpi2Calculators = async () => {
    try {
      const kpis = await getAllKpi2Calculator();
      console.log('🔍 [AI NonPD] KPI2 calculators:', kpis);
      if (kpis && kpis.length > 0) {
        setKpi2Calculators(kpis);
      }
    } catch (error) {
      console.error('Error loading KPI2 calculators:', error);
    }
  };

  const loadSystemMessages = async () => {
    console.log('⚙️ [AI NonPD] Loading system messages and models...');
    try {
      const message1 = await getSettingByType('SYSTEM_MESSAGE_1');
      if (message1) setSystemMessage1(message1.setting);
      const message2 = await getSettingByType('SYSTEM_MESSAGE_2');
      if (message2) setSystemMessage2(message2.setting);
      const message3 = await getSettingByType('SYSTEM_MESSAGE_3');
      if (message3) setSystemMessage3(message3.setting);
      const bot1 = await getSettingByType('MODEL_AI_1');
      if (bot1) setModel1(bot1.setting);
      const bot2 = await getSettingByType('MODEL_AI_2');
      if (bot2) setModel2(bot2.setting);
      const bot3 = await getSettingByType('MODEL_AI_3');
      if (bot3) setModel3(bot3.setting);

      console.log('✅ [AI NonPD] System messages loaded:', {
        model1: bot1?.setting || 'default',
        model2: bot2?.setting || 'default',
        model3: bot3?.setting || 'default',
        message1Length: message1?.setting?.length || 0,
        message2Length: message2?.setting?.length || 0,
        message3Length: message3?.setting?.length || 0
      });
    } catch (error) {
      console.error('❌ [AI NonPD] Error loading system messages:', error);
    }
  };

  // Kiểm tra quyền truy cập template
  const canAccessTemplate = (template) => {
    // Admin, Editor, SuperAdmin có quyền truy cập tất cả templates
    if (currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) {
      return true;
    }

    // Kiểm tra userClass của template có khớp với userClass của user không
    if (template?.userClass && Array.isArray(template.userClass) && template.userClass.length > 0) {
      const userClassIds = currentUserClasses.map(uc => uc.id);
      const hasAccess = template.userClass.some(templateUserClassId => userClassIds.includes(templateUserClassId));

      console.log(`🔍 [AI NonPD] Template "${template.name}" access check:`, {
        templateUserClassIds: template.userClass,
        userUserClassIds: userClassIds,
        hasAccess,
        templateId: template.id
      });

      return hasAccess;
    }

    // Nếu template không có userClass restriction, cho phép truy cập
    console.log(`🔍 [AI NonPD] Template "${template.name}" - no userClass restriction, allowing access`);
    return true;
  };

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const templatesSetting = await getSettingByType('AI_ANALYSIS_TEMPLATES_NON_PD');
      if (templatesSetting && templatesSetting.setting) {
        const savedTemplates = templatesSetting.setting;
        console.log('📂 [AI NonPD] Loading templates:', {
          totalTemplates: savedTemplates.length,
          templatesWithData: savedTemplates.filter(t => (t.data_selected || []).length > 0).length
        });

        // Ensure all templates have required fields for backward compatibility
        const templatesWithFullData = savedTemplates.map(template => ({
          ...template,
          data_selected: template.data_selected || [],
          userClass: template.userClass || [], // Ensure userClass field exists
          created_at: template.created_at || new Date().toISOString(),
          updated_at: template.updated_at || new Date().toISOString()
        }));

        // Store all templates for reference
        setAllTemplates(templatesWithFullData);

        // Filter templates based on user permissions
        let accessibleTemplates = templatesWithFullData;
        const isAdminUser = currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin;

        console.log('🔒 [AI NonPD] Template filtering info:', {
          isAdminUser,
          currentUserRole: {
            isAdmin: currentUser?.isAdmin,
            isEditor: currentUser?.isEditor,
            isSuperAdmin: currentUser?.isSuperAdmin
          },
          totalTemplates: templatesWithFullData.length,
          userClassIds: currentUserClasses.map(uc => uc.id),
          userClassNames: currentUserClasses.map(uc => uc.name),
          userEmail: currentUser?.email
        });

        if (!isAdminUser) {
          accessibleTemplates = templatesWithFullData.filter(template => canAccessTemplate(template));
          console.log('🔒 [AI NonPD] Filtered templates by permissions:', {
            totalTemplates: templatesWithFullData.length,
            accessibleTemplates: accessibleTemplates.length,
            filteredOut: templatesWithFullData.length - accessibleTemplates.length,
            userClassIds: currentUserClasses.map(uc => uc.id),
            userClassNames: currentUserClasses.map(uc => uc.name)
          });
        } else {
          console.log('🔒 [AI NonPD] Admin user - showing all templates');
        }

        setTemplates(accessibleTemplates);

        // Log templates with linked data
        const templatesWithLinkedData = accessibleTemplates.filter(t => t.data_selected.length > 0);
        if (templatesWithLinkedData.length > 0) {
          console.log('🔗 [AI NonPD] Templates with linked data:',
            templatesWithLinkedData.map(t => ({
              name: t.name,
              dataCount: t.data_selected.length,
              dataIds: t.data_selected,
              lastUpdated: t.updated_at,
              userClass: t.userClass || []
            }))
          );
        }
      } else {
        console.log('📂 [AI NonPD] No templates found, initializing empty array');
        setTemplates([]);
      }
    } catch (error) {
      console.error('❌ [AI NonPD] Error loading templates:', error);
      message.error('Lỗi khi tải templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const saveTemplates = async (templatesToSave) => {
    try {
      const templatesSetting = await getSettingByType('AI_ANALYSIS_TEMPLATES_NON_PD');

      if (templatesSetting) {
        await updateSetting({ ...templatesSetting, setting: templatesToSave });
      } else {
        await createSetting({
          type: 'AI_ANALYSIS_TEMPLATES_NON_PD',
          setting: templatesToSave,
        });
      }
    } catch (error) {
      console.error('Error saving templates:', error);
      message.error('Lỗi khi lưu templates');
    }
  };

  const loadChatHistory = async () => {
    console.log('📜 [AI NonPD] Loading chat history...');
    const historyStartTime = Date.now();

    try {
      setLoadingHistory(true);
      const history = await getAllChatHistory();

      const filteredHistory = history.filter(item =>
        item.userCreated === currentUser?.email &&
        item.more_info?.analysisType === 'non-powerdrill'
      );

      console.log('✅ [AI NonPD] Chat history loaded:', {
        totalHistory: history.length,
        filteredForUser: history.filter(item => item.userCreated === currentUser?.email).length,
        nonPowerdrillHistory: filteredHistory.length,
        loadTime: `${Date.now() - historyStartTime}ms`,
        user: currentUser?.email
      });

      // Log details of recent history items
      const recentHistory = filteredHistory.slice(0, 5);
      if (recentHistory.length > 0) {
        console.log('📋 [AI NonPD] Recent chat history items:',
          recentHistory.map(item => ({
            id: item.id,
            questPreview: item.quest?.substring(0, 50) + '...',
            timestamp: item.create_at,
            hasMoreInfo: !!item.more_info,
            processingTime: item.more_info?.processingTime
          }))
        );
      }

      setChatHistory(filteredHistory);
    } catch (error) {
      console.error('❌ [AI NonPD] Error loading chat history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return `${diffInDays} days ago`;
    }
  };

  const loadApprovedVersionData = async () => {
    // This function is now handled by loadData() which loads approved versions with full details
    console.log('loadApprovedVersionData is deprecated - use loadData() instead');
  };

  // AI Analysis handlers from AI.jsx
  const handleSelectHistory = (item) => {
    if (!item) {
      console.log('🔄 [AI NonPD] Clearing history selection');
      setPrompt('');
      setResult('Kết quả AI trả lời');
      setSelectedHistoryId(null);
      setViewingData(filteredData);
      setUsedDataIds([]);
      setSelectedQueueItem(null);
      setIsUsingUploadedData(false);
      setUploadedFileData(null);
      setUploadedFiles([]);
      return;
    }

    console.log('📋 [AI NonPD] Selecting history item:', {
      id: item.id,
      questPreview: item.quest?.substring(0, 100) + '...',
      timestamp: item.create_at,
      hasMoreInfo: !!item.more_info,
      processingTime: item.more_info?.processingTime,
      analysisType: item.more_info?.analysisType
    });
    setPrompt(item.quest);

    let resultToDisplay = item.result;
    if (item.more_info?.analysisResult) {
      // Use parsed JSON result if available
      resultToDisplay = item.more_info.analysisResult;
    } else if (typeof item.result === 'string') {
      try {
        // Try to parse JSON from string (handle markdown code blocks)
        let cleanResult = item.result;
        if (item.result.includes('```json')) {
          cleanResult = item.result.replace(/```json\s*/, '').replace(/\s*```$/, '');
        } else if (item.result.includes('```')) {
          cleanResult = item.result.replace(/```\s*/, '').replace(/\s*```$/, '');
        }

        const jsonMatch = cleanResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed && typeof parsed === 'object') {
            resultToDisplay = parsed;
          }
        }
      } catch (e) {
        // Keep as string if parsing fails
      }
    }

    console.log('📄 [AI NonPD] Setting result from history:', {
      historyId: item.id,
      originalResultType: typeof item.result,
      finalResultType: typeof resultToDisplay,
      hasAnalysisResult: !!item.more_info?.analysisResult,
      resultPreview: typeof resultToDisplay === 'string'
        ? resultToDisplay.substring(0, 100) + '...'
        : typeof resultToDisplay === 'object'
          ? `Object with keys: ${Object.keys(resultToDisplay || {}).join(', ')}`
          : String(resultToDisplay)
    });

    setResult(resultToDisplay);
    setSelectedHistoryId(item.id);
    setSelectedQueueItem(null);

    if (item.more_info?.files && item.more_info.files.length > 0) {
      setUploadedFiles(item.more_info.files);
      setIsUsingUploadedData(item.more_info.isUploadedData || false);
      if (item.more_info?.originalData && item.more_info.isUploadedData) {
        setUploadedFileData(item.more_info.originalData);
      } else {
        setUploadedFileData(null);
      }
    } else {
      setUploadedFiles([]);
      setIsUsingUploadedData(false);
      setUploadedFileData(null);
    }

    if (item.more_info?.filteredData) {
      const processedData = item.more_info.filteredData;
      if (item.more_info?.tableDescriptions) {
        processedData._descriptions = item.more_info.tableDescriptions;
      }
      setViewingData(processedData);
    } else if (item.more_info?.originalData) {
      setViewingData(item.more_info.originalData);
    } else {
      setViewingData(filteredData);
    }

    if (item.more_info?.used_data) {
      setUsedDataIds(item.more_info.used_data);
    } else {
      setUsedDataIds([]);
    }

    // Load charts from history (check both charts and multipleCharts for backward compatibility)
    if (item.more_info?.multipleCharts) {
      console.log('📊 [AI NonPD] Loading multipleCharts from history:', {
        historyId: item.id,
        chartsCount: item.more_info.multipleCharts.length,
        chartData: item.more_info.multipleCharts.map(chart => ({
          tableName: chart.tableName,
          hasChartData: !!chart.chartData,
          hasChartConfig: !!chart.chartConfig,
          chartType: chart.chartConfig?.chart_type,
          dataLength: Array.isArray(chart.chartData) ? chart.chartData.length : 0
        }))
      });
      setMultipleCharts(item.more_info.multipleCharts);
    } else if (item.more_info?.charts) {
      console.log('📊 [AI NonPD] Loading charts from history (legacy field):', {
        historyId: item.id,
        chartsCount: item.more_info.charts.length
      });
      setMultipleCharts(item.more_info.charts);
    } else {
      console.log('📊 [AI NonPD] No charts found in history item:', { historyId: item.id });
      setMultipleCharts([]);
    }

    // Load single chart data (legacy support)
    if (item.chartData && item.chartConfig) {
      console.log('📊 [AI NonPD] Loading legacy single chart from history:', {
        historyId: item.id,
        hasChartData: !!item.chartData,
        hasChartConfig: !!item.chartConfig,
        chartType: item.chartConfig?.chart_type,
        dataLength: Array.isArray(item.chartData) ? item.chartData.length : 0
      });
      setData(item.chartData);
      setChartConfig(item.chartConfig);
    } else {
      setData([]);
      setChartConfig(null);
    }
  };

  const handleDeleteHistory = async (id) => {
    console.log('🗑️ [AI NonPD] Deleting history item:', { id });

    try {
      const historyItem = chatHistory.find(item => item.id === id);
      if (historyItem) {
        console.log('📋 [AI NonPD] Deleting item details:', {
          id: historyItem.id,
          questPreview: historyItem.quest?.substring(0, 100) + '...',
          timestamp: historyItem.create_at
        });
      }

      await deleteChatHistory(id);
      console.log('✅ [AI NonPD] History item deleted successfully');

      await loadChatHistory();
      if (selectedHistoryId === id) {
        console.log('🔄 [AI NonPD] Deleted item was selected, clearing selection');
        handleSelectHistory(null);
      }
    } catch (error) {
      console.error('❌ [AI NonPD] Error deleting chat history:', error);
    }
  };

  // Main handlers
  const handleNewJob = () => {
    setSelectedTemplate(null);
    setTemplateBasedAnalysis(false); // Disable template-based analysis
    setPrompt('');
    setResult('Kết quả AI trả lời');
    setSelectedHistoryId(null);
    setSelectedQueueItem(null);
    setViewingData({});
    setData([]);
    setChartConfig(null);
    setMultipleCharts([]);
  };

  const handleRunJob = () => {
    if (!selectedTemplate) {
      message.warning('Vui lòng chọn template trước khi chạy');
      return;
    }

    if (prompt.trim()) {
      analyze();
    }
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);

    // Only use the original prompt from template, not the generated one
    setPrompt(template.prompt || '');
    setTemplateBasedAnalysis(true); // Enable template-based analysis

    // Update checkedItems to match template's data_selected
    const templateDataIds = template.data_selected || [];
    setCheckedItems(templateDataIds);
    updateFilteredStates(approvedVersionData, templateDataIds);

    // Load auto-generated prompt if available (with fallback to generatedPrompt for backward compatibility)
    if (template.outputConfig) {
      const autoPrompt = template.outputConfig.autoGeneratedPrompt || template.outputConfig.generatedPrompt;
      if (autoPrompt) {
        console.log('📋 [AI NonPD] Loading auto-generated prompt from template:', {
          templateName: template.name,
          autoGeneratedPromptLength: autoPrompt.length,
          autoGeneratedPromptPreview: autoPrompt.substring(0, 100) + '...',
          source: template.outputConfig.autoGeneratedPrompt ? 'autoGeneratedPrompt' : 'generatedPrompt (fallback)'
        });
        setAutoGeneratedPrompt(autoPrompt);
      } else {
        console.log('⚠️ [AI NonPD] No auto-generated prompt found in template:', {
          templateName: template.name,
          hasOutputConfig: !!template.outputConfig,
          outputConfigKeys: template.outputConfig ? Object.keys(template.outputConfig) : []
        });
        setAutoGeneratedPrompt('');
      }
    } else {
      console.log('⚠️ [AI NonPD] No outputConfig found in template:', {
        templateName: template.name
      });
      setAutoGeneratedPrompt('');
    }
  };

  const handleSelectHistoryJob = (job) => {
    setPrompt(job.prompt);
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
    console.log('🔍 [AI NonPD] Prompt changed:', e.target.value);
    setSelectedHistoryId(null);
    setSelectedQueueItem(null);
    setMultipleCharts([]);
    // Note: Keep templateBasedAnalysis as true since we always use templates now
  };

  // Handle template run from DataModal (deprecated - kept for compatibility)
  const handleTemplateRun = (template, linkedDataIds) => {
    console.log('🎯 [AI NonPD] Template run triggered from DataModal (deprecated):', {
      templateName: template.name
    });
    // This function is no longer used as template selection is now handled in main UI
  };

  // Function to highlight special characters in template
  const highlightSpecialChars = (text) => {
    if (!text) return '';

    // Define special character patterns
    const specialPatterns = [
      { pattern: /<[^>]*>/g, style: { color: '#ff4d4f', backgroundColor: '#fff2f0', padding: '2px 4px', borderRadius: '3px', fontWeight: '600' } }, // <text>
      { pattern: /_[^_\s]*_/g, style: { color: '#ff4d4f', backgroundColor: '#fff2f0', padding: '2px 4px', borderRadius: '3px', fontWeight: '600' } }, // _text_
      { pattern: /#[^#\s]*#/g, style: { color: '#ff4d4f', backgroundColor: '#fff2f0', padding: '2px 4px', borderRadius: '3px', fontWeight: '600' } }, // #text#
      { pattern: /@[^@\s]*@/g, style: { color: '#ff4d4f', backgroundColor: '#fff2f0', padding: '2px 4px', borderRadius: '3px', fontWeight: '600' } }, // @text@
    ];

    let highlighted = text;
    let offset = 0;
    const highlights = [];

    // Find all matches first
    specialPatterns.forEach(({ pattern, style }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        highlights.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          style: style
        });
      }
    });

    // Sort by position
    highlights.sort((a, b) => a.start - b.start);

    // Convert to JSX elements
    if (highlights.length === 0) {
      return text;
    }

    const parts = [];
    let lastEnd = 0;

    highlights.forEach((highlight, index) => {
      // Add text before highlight
      if (highlight.start > lastEnd) {
        parts.push(text.substring(lastEnd, highlight.start));
      }

      // Add highlighted text
      parts.push(
        <span key={`highlight-${index}`} style={highlight.style}>
          {highlight.text}
        </span>
      );

      lastEnd = highlight.end;
    });

    // Add remaining text
    if (lastEnd < text.length) {
      parts.push(text.substring(lastEnd));
    }

    return parts;
  };

  // Function to check if prompt contains unresolved special characters
  const hasUnresolvedSpecialChars = (text) => {
    if (!text) return false;

    const specialPatterns = [
      /<[^>]*>/g, // <text>
      /_[^_\s]*_/g, // _text_
      /#[^#\s]*#/g, // #text#
      /@[^@\s]*@/g, // @text@
    ];

    return specialPatterns.some(pattern => pattern.test(text));
  };

  // Function to get list of unresolved special characters
  const getUnresolvedSpecialChars = (text) => {
    if (!text) return [];

    const specialPatterns = [
      /<[^>]*>/g, // <text>
      /_[^_\s]*_/g, // _text_
      /#[^#\s]*#/g, // #text#
      /@[^@\s]*@/g, // @text@
    ];

    const unresolved = [];
    specialPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        unresolved.push(...matches);
      }
    });

    return [...new Set(unresolved)]; // Remove duplicates
  };

  // Template handlers
  const handleEditTemplate = (template) => {
    setEditingTemplate({ ...template });
  };

  const handleSaveTemplate = async (updatedTemplate) => {
    const templateToSave = updatedTemplate || editingTemplate;

    const updatedTemplates = templates.map(template =>
      template.id === templateToSave.id ? {
        ...templateToSave,
        data_selected: template.data_selected || [], // Preserve existing data_selected
        userClass: templateToSave.userClass || [], // Ensure userClass is saved
        outputConfig: templateToSave.outputConfig || { sections: [], generatedPrompt: '' }, // Ensure outputConfig is saved
        updated_at: new Date().toISOString()
      } : template
    );

    console.log('💾 [AI NonPD] Saving updated template with userClass and outputConfig:', {
      templateName: templateToSave.name,
      templateId: templateToSave.id,
      userClass: templateToSave.userClass,
      userClassLength: templateToSave.userClass.length,
      outputConfigSections: templateToSave.outputConfig?.sections?.length || 0
    });

    setTemplates(updatedTemplates);
    await saveTemplates(updatedTemplates);
    setEditingTemplate(null);
    message.success('Đã cập nhật template');
  };

  const handleCancelTemplateEdit = () => {
    setEditingTemplate(null);
  };

  const handleNewTemplate = () => {
    setShowNewTemplate(true);
    setNewTemplate({ name: '', prompt: '', userClass: [], outputConfig: { sections: [], generatedPrompt: '', autoGeneratedPrompt: '' } });
  };

  const handleSaveNewTemplate = async (updatedTemplate) => {
    const templateToSave = updatedTemplate || newTemplate;

    if (templateToSave.name.trim() && templateToSave.prompt.trim()) {
      const template = {
        ...templateToSave,
        id: Math.max(...templates.map(t => t.id), 0) + 1,
        data_selected: [], // Initialize empty data selection
        userClass: templateToSave.userClass || [], // Ensure userClass is saved
        outputConfig: templateToSave.outputConfig || { sections: [], generatedPrompt: '', autoGeneratedPrompt: '' }, // Ensure outputConfig is saved
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 [AI NonPD] Saving new template with userClass and outputConfig:', {
        templateName: template.name,
        userClass: template.userClass,
        userClassLength: template.userClass.length,
        outputConfigSections: template.outputConfig?.sections?.length || 0
      });

      const updatedTemplates = [template, ...templates];
      setTemplates(updatedTemplates);
      await saveTemplates(updatedTemplates);
      setNewTemplate({ name: '', prompt: '', userClass: [], outputConfig: { sections: [], generatedPrompt: '', autoGeneratedPrompt: '' } });
      setShowNewTemplate(false);
      message.success('Đã tạo template mới');
    } else {
      message.error('Vui lòng nhập đầy đủ tên và nội dung template');
    }
  };

  const handleCancelNewTemplate = () => {
    setShowNewTemplate(false);
    setNewTemplate({ name: '', prompt: '', userClass: [], outputConfig: { sections: [], generatedPrompt: '', autoGeneratedPrompt: '' } });
  };

  const handleAutoGeneratedPromptCreated = (autoPrompt) => {
    setAutoGeneratedPrompt(autoPrompt);
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      const updatedTemplates = templates.filter(template => template.id !== templateId);
      setTemplates(updatedTemplates);
      await saveTemplates(updatedTemplates);
      message.success('Đã xóa template');
    } catch (error) {
      console.error('Error deleting template:', error);
      message.error('Lỗi khi xóa template');
    }
  };

  // Job handlers
  const handleEditJob = (job) => {
    setEditingJob({ ...job });
  };

  const handleSaveJob = () => {
    setJobHistory(prev => prev.map(job =>
      job.id === editingJob.id ? editingJob : job
    ));
    setEditingJob(null);
  };

  const handleCancelEdit = () => {
    setEditingJob(null);
  };



  // Helper functions from AI.jsx
  const generateTableDescription = (fileNote, config, configIndex) => {
    if (!config) {
      return `Dữ liệu ${fileNote.name}`;
    }

    let description = '';
    let filterContext = '';
    let timeContext = '';

    // Extract time context from filters
    if (config.filters) {
      // Check for month filters
      const monthFilter = config.filters['Tháng'] || config.filters['month'] || config.filters['Month'];
      if (monthFilter) {
        if (Array.isArray(monthFilter)) {
          timeContext = ` cho tháng ${monthFilter.join(', ')}`;
        } else {
          timeContext = ` cho tháng ${monthFilter}`;
        }
      }

      // Check for other filters to understand data type (Thu nhập vs Chi phí)
      const typeFilter = config.filters['Loại'] || config.filters['Type'] || config.filters['type'];
      if (typeFilter) {
        if (Array.isArray(typeFilter) && typeFilter.length === 1) {
          filterContext = ` - ${typeFilter[0]}`;
        } else if (typeof typeFilter === 'string') {
          filterContext = ` - ${typeFilter}`;
        }
      }

      // Check for status filters
      const statusFilter = config.filters['Trạng thái'] || config.filters['Status'] || config.filters['status'];
      if (statusFilter) {
        const statusText = Array.isArray(statusFilter) ? statusFilter.join(', ') : statusFilter;
        filterContext += ` (${statusText})`;
      }
    }

    switch (config.type) {
      case 'aggregation':
        if (config.operation && config.target_column) {
          const operationNames = {
            'sum': 'Tổng',
            'average': 'Trung bình',
            'count': 'Số lượng',
            'max': 'Giá trị lớn nhất',
            'min': 'Giá trị nhỏ nhất',
          };

          const operationName = operationNames[config.operation] || config.operation;

          if (config.group_by && config.group_by.length > 0) {
            description = `${operationName} ${config.target_column} theo ${config.group_by.join(', ')}${filterContext}${timeContext}`;
          } else {
            description = `${operationName} ${config.target_column}${filterContext}${timeContext}`;
          }
        }
        break;
      case 'ranking':
        if (config.operation && config.target_column) {
          const rankingNames = {
            'top_n': 'Top',
            'bottom_n': 'Bottom',
          };

          const rankingName = rankingNames[config.ranking_type] || 'Ranking';
          const limit = config.limit || 'N';

          if (config.group_by && config.group_by.length > 0) {
            description = `${rankingName} ${limit} ${config.target_column} theo ${config.group_by.join(', ')}${filterContext}${timeContext}`;
          } else {
            description = `${rankingName} ${limit} ${config.target_column}${filterContext}${timeContext}`;
          }
        }
        break;
      case 'filter':
        if (config.operation === 'distinct' && config.group_by) {
          description = `Dữ liệu duy nhất theo ${config.group_by.join(', ')}${filterContext}${timeContext}`;
        } else {
          description = `Dữ liệu đã lọc${filterContext}${timeContext}`;
        }
        break;
      default:
        description = `Dữ liệu ${fileNote.name}${filterContext}${timeContext}`;
    }

    return `${description} (${fileNote.name})`;
  };

  const processDataWithAnalysisConfigs = (fileNotes, result, dataForAI1 = []) => {
    let transformedData = {};
    let tableDescriptions = {};

    if (result && result.matched_ids) {
      let tableCounter = 1;

      result.matched_ids.forEach(id => {

        // Parse AI ID format "13_v2" to extract template_id and version
        const parseAIId = (aiId) => {
          const parts = aiId.split('_v');
          if (parts.length === 2) {
            return {
              templateId: parseInt(parts[0]),
              version: parseInt(parts[1])
            };
          } else {
            return {
              templateId: parseInt(aiId),
              version: 1 // default version
            };
          }
        };

        // Check if this is a KPI ID (format: "kpi_KPIName")
        if (id.startsWith('kpi_')) {
          const kpiName = id.replace('kpi_', '');

          // Find KPI data in dataForAI1 (we need to pass this data to the function)
          const kpiData = dataForAI1?.find(item => item.id === id);

          if (kpiData && kpiData.fullData) {
            const tableName = `Table${tableCounter}`;
            transformedData[tableName] = kpiData.fullData;
            tableDescriptions[tableName] = `KPI: ${kpiName}`;
            tableCounter++;

            console.log(`📊 [AI NonPD] Added KPI data to transformed data:`, {
              kpiName: kpiName,
              tableName: tableName,
              dataRows: kpiData.fullData.length,
              sampleData: kpiData.fullData.slice(0, 3)
            });
          }
          return;
        }

        const { templateId, version } = parseAIId(id);

        // Find fileNote by template_id and version
        const fileNote = fileNotes.find(note =>
          note.id_template === templateId &&
          (note.id_version === version || (version === 1 && !note.id_version))
        );

        console.log(`🔍 [DEBUG] Looking for template_id=${templateId}, version=${version}:`, {
          id: id,
          parsed: { templateId, version },
          fileNotesAvailable: fileNotes.map(note => ({
            id: note.id,
            id_template: note.id_template,
            id_version: note.id_version,
            name: note.name,
            rowsCount: note.rows?.length || 0
          })),
          foundFileNote: !!fileNote,
          fileNoteDetails: fileNote ? {
            id: fileNote.id,
            id_template: fileNote.id_template,
            id_version: fileNote.id_version,
            name: fileNote.name,
            rowsCount: fileNote.rows?.length || 0,
            sampleRow: fileNote.rows?.[0]
          } : null
        });

        if (fileNote) {
          if (!fileNote.rows || fileNote.rows.length === 0) {
            console.log(`❌ [DEBUG] FileNote found but no rows: ${fileNote.name}`);
            return;
          }

          const usefulColumns = result.useful_columns || [];
          let cleanedRows = fileNote.rows.map(row => {
            const cleanedRow = {};
            usefulColumns.forEach(column => {
              if (column in row) {
                cleanedRow[column] = row[column];
              }
            });
            return cleanedRow;
          });

          console.log(`🧹 [DEBUG] After cleaning with useful columns:`, {
            originalRowsCount: fileNote.rows.length,
            cleanedRowsCount: cleanedRows.length,
            usefulColumns: usefulColumns,
            originalRowSample: fileNote.rows[0],
            cleanedRowSample: cleanedRows[0],
            allFieldsInOriginal: Object.keys(fileNote.rows[0] || {}),
            allFieldsInCleaned: Object.keys(cleanedRows[0] || {})
          });

          // Remove empty rows
          const beforeEmptyFilter = cleanedRows.length;
          cleanedRows = cleanedRows.filter(row => !isRowEmpty(row));

          console.log(`🔄 [DEBUG] After removing empty rows:`, {
            beforeCount: beforeEmptyFilter,
            afterCount: cleanedRows.length
          });

          // Apply filters if they exist
          if (result.filters && result.filters[id] && result.filters[id].conditions) {
            const conditions = result.filters[id].conditions;
            const beforeGlobalFilter = cleanedRows.length;

            console.log(`🎯 [DEBUG] Applying global filters:`, {
              conditions: conditions,
              beforeCount: beforeGlobalFilter,
              sampleRowToFilter: cleanedRows[0],
              availableFields: Object.keys(cleanedRows[0] || {})
            });

            cleanedRows = cleanedRows.filter(row => {
              const filterResults = Object.entries(conditions).map(([key, filterConfig]) => {
                const rowValue = row[key];
                let passed = false;

                // Handle both old format (simple value) and new format (object with operator)
                if (typeof filterConfig === 'object' && filterConfig.operator) {
                  passed = applyFilter(rowValue, filterConfig);
                } else {
                  // Backward compatibility with old format
                  const rowValueForCompare = !isNaN(rowValue) ? Number(rowValue) : rowValue;
                  if (Array.isArray(filterConfig)) {
                    passed = filterConfig.some(v => {
                      const arrayValue = !isNaN(v) ? Number(v) : v;
                      return arrayValue === rowValueForCompare;
                    });
                  } else {
                    const conditionValue = !isNaN(filterConfig) ? Number(filterConfig) : filterConfig;
                    passed = conditionValue === rowValueForCompare;
                  }
                }

                return { key, rowValue, filterConfig, passed };
              });

              const allPassed = filterResults.every(r => r.passed);

              // Log first few failed rows for debugging
              if (!allPassed && cleanedRows.indexOf(row) < 3) {
                console.log(`❌ [DEBUG] Row ${cleanedRows.indexOf(row)} failed global filter:`, {
                  rowData: row,
                  filterResults: filterResults
                });
              }

              return allPassed;
            });

            console.log(`📊 [DEBUG] After global filters:`, {
              beforeCount: beforeGlobalFilter,
              afterCount: cleanedRows.length,
              sampleFilteredRow: cleanedRows[0]
            });
          }

          // Process analysis_configs if they exist
          if (result.analysis_configs && result.analysis_configs.length > 0) {
            console.log(`🔧 [AI NonPD] Processing ${result.analysis_configs.length} analysis_configs for ${fileNote.id}`);

            result.analysis_configs.forEach((config, configIndex) => {
              console.log(`📊 [AI NonPD] Processing config ${configIndex + 1}:`, {
                dataset: config.dataset,
                matchesCurrentId: config.dataset === id,
                type: config.type,
                operation: config.operation,
                targetColumn: config.target_column,
                groupBy: config.group_by,
                filtersCount: config.filters ? Object.keys(config.filters).length : 0
              });

              if (config.dataset === id) {
                // Apply config-specific filters
                let filteredRows = cleanedRows;
                console.log(`🔍 [AI NonPD] Before config filters for ${fileNote.id}, config ${configIndex + 1}:`, {
                  rowsCount: filteredRows.length,
                  sampleRow: filteredRows[0]
                });

                if (config.filters && Object.keys(config.filters).length > 0) {
                  filteredRows = filteredRows.filter(row => {
                    return Object.entries(config.filters).every(([key, filterConfig]) => {
                      const rowValue = row[key];

                      if (typeof filterConfig === 'object' && filterConfig.operator) {
                        return applyFilter(rowValue, filterConfig);
                      } else {
                        const rowValueForCompare = !isNaN(rowValue) ? Number(rowValue) : rowValue;
                        if (Array.isArray(filterConfig)) {
                          return filterConfig.some(v => {
                            const arrayValue = !isNaN(v) ? Number(v) : v;
                            return arrayValue === rowValueForCompare;
                          });
                        }
                        const conditionValue = !isNaN(filterConfig) ? Number(filterConfig) : filterConfig;
                        return conditionValue === rowValueForCompare;
                      }
                    });
                  });
                }

                // Handle different types of operations
                if (config.type === 'aggregation' && config.operation && config.target_column) {
                  if (config.group_by && config.group_by.length > 0) {
                    const groupedData = {};
                    filteredRows.forEach(row => {
                      const groupKey = config.group_by.map(col => row[col]).join('|');
                      if (!groupedData[groupKey]) {
                        groupedData[groupKey] = {
                          ...config.group_by.reduce((acc, col) => {
                            acc[col] = row[col];
                            return acc;
                          }, {}),
                          [config.target_column]: 0,
                          count: 0,
                        };
                      }

                      const value = parseFloat(row[config.target_column]) || 0;
                      groupedData[groupKey][config.target_column] += value;
                      groupedData[groupKey].count += 1;
                    });

                    const aggregatedRows = Object.values(groupedData).map(group => {
                      const result = { ...group };
                      delete result.count;

                      if (config.operation === 'average') {
                        result[config.target_column] = group.count > 0 ?
                          result[config.target_column] / group.count : 0;
                      }

                      return result;
                    });

                    const tableName = `T${configIndex + 1}`;
                    const tableDescription = generateTableDescription(fileNote, config, configIndex);
                    transformedData[tableName] = aggregatedRows;
                    tableDescriptions[tableName] = tableDescription;
                  } else {
                    let aggregatedValue = 0;
                    filteredRows.forEach(row => {
                      const value = parseFloat(row[config.target_column]) || 0;
                      switch (config.operation) {
                        case 'sum':
                          aggregatedValue += value;
                          break;
                        case 'average':
                          aggregatedValue += value;
                          break;
                        case 'count':
                          aggregatedValue += 1;
                          break;
                        case 'max':
                          aggregatedValue = Math.max(aggregatedValue, value);
                          break;
                        case 'min':
                          aggregatedValue = Math.min(aggregatedValue, value);
                          break;
                        default:
                          aggregatedValue += value;
                      }
                    });

                    if (config.operation === 'average' && filteredRows.length > 0) {
                      aggregatedValue = aggregatedValue / filteredRows.length;
                    }

                    const tableName = `T${configIndex + 1}`;
                    const tableDescription = generateTableDescription(fileNote, config, configIndex);
                    const singleRowResult = [{
                      [config.target_column]: aggregatedValue,
                      operation: config.operation,
                      record_count: filteredRows.length,
                    }];
                    transformedData[tableName] = singleRowResult;
                    tableDescriptions[tableName] = tableDescription;
                  }
                } else if (config.type === 'ranking' && config.operation && config.target_column) {
                  if (config.group_by && config.group_by.length > 0) {
                    const groupedData = {};
                    filteredRows.forEach(row => {
                      const groupKey = config.group_by.map(col => row[col]).join('|');
                      if (!groupedData[groupKey]) {
                        groupedData[groupKey] = {
                          ...config.group_by.reduce((acc, col) => {
                            acc[col] = row[col];
                            return acc;
                          }, {}),
                          [config.target_column]: 0,
                          count: 0,
                        };
                      }

                      const value = parseFloat(row[config.target_column]) || 0;
                      groupedData[groupKey][config.target_column] += value;
                      groupedData[groupKey].count += 1;
                    });

                    const aggregatedGroups = Object.values(groupedData).map(group => {
                      const result = { ...group };
                      delete result.count;

                      if (config.operation === 'average') {
                        result[config.target_column] = group.count > 0 ?
                          result[config.target_column] / group.count : 0;
                      }

                      return result;
                    });

                    const sortedGroups = aggregatedGroups.sort((a, b) => {
                      const aValue = parseFloat(a[config.target_column]) || 0;
                      const bValue = parseFloat(b[config.target_column]) || 0;
                      return config.ranking_type === 'top_n' ? bValue - aValue : aValue - bValue;
                    });

                    const limit = config.limit || sortedGroups.length;
                    const limitedGroups = sortedGroups.slice(0, limit);

                    const tableName = `T${configIndex + 1}`;
                    const tableDescription = generateTableDescription(fileNote, config, configIndex);
                    transformedData[tableName] = limitedGroups;
                    tableDescriptions[tableName] = tableDescription;
                  } else {
                    let aggregatedValue = 0;
                    filteredRows.forEach(row => {
                      const value = parseFloat(row[config.target_column]) || 0;
                      switch (config.operation) {
                        case 'sum':
                          aggregatedValue += value;
                          break;
                        case 'average':
                          aggregatedValue += value;
                          break;
                        case 'count':
                          aggregatedValue += 1;
                          break;
                        default:
                          aggregatedValue += value;
                      }
                    });

                    if (config.operation === 'average' && filteredRows.length > 0) {
                      aggregatedValue = aggregatedValue / filteredRows.length;
                    }

                    const tableName = `T${configIndex + 1}`;
                    const tableDescription = generateTableDescription(fileNote, config, configIndex);
                    const singleRankResult = [{
                      [config.target_column]: aggregatedValue,
                      operation: config.operation,
                      record_count: filteredRows.length,
                    }];
                    transformedData[tableName] = singleRankResult;
                    tableDescriptions[tableName] = tableDescription;
                  }
                } else if (config.type === 'filter' && config.operation) {
                  let filteredResult = filteredRows;

                  if (config.operation === 'distinct' && config.group_by) {
                    const distinctMap = new Map();
                    filteredRows.forEach(row => {
                      const key = config.group_by.map(col => row[col]).join('|');
                      if (!distinctMap.has(key)) {
                        distinctMap.set(key, row);
                      }
                    });
                    filteredResult = Array.from(distinctMap.values());
                  }

                  if (config.limit && filteredResult.length > config.limit) {
                    filteredResult = filteredResult.slice(0, config.limit);
                  }

                  const tableName = `T${configIndex + 1}`;
                  const tableDescription = generateTableDescription(fileNote, config, configIndex);
                  transformedData[tableName] = filteredResult;
                  tableDescriptions[tableName] = tableDescription;
                } else {
                  let resultData = filteredRows;

                  if (config.limit && resultData.length > config.limit) {
                    resultData = resultData.slice(0, config.limit);
                  }

                  const tableName = `T${configIndex + 1}`;
                  const tableDescription = generateTableDescription(fileNote, config, configIndex);
                  transformedData[tableName] = resultData;
                  tableDescriptions[tableName] = tableDescription;
                }
              }
            });
          } else {
            // No analysis_configs, return original filtered data
            const tableName = `Table${tableCounter}`;
            const tableDescription = `${generateTableDescription(fileNote, null, 0)} (${fileNote.name})`;
            transformedData[tableName] = cleanedRows;
            tableDescriptions[tableName] = tableDescription;
            tableCounter++;
          }
        } else {
          console.log(`❌ [AI NonPD] FileNote with id ${id} not found`);
        }
      });
    } else {
      console.log(`⚠️ [AI NonPD] No matched_ids found in result`);
    }

    transformedData._descriptions = tableDescriptions;
    return transformedData;
  };

  const getRecommendedChartType = (data, tableName, tableData, config) => {
    if (!Array.isArray(tableData) || tableData.length === 0) return 'bar';

    const sampleRow = tableData[0];
    const keys = Object.keys(sampleRow);
    const numericKeys = keys.filter(key => typeof sampleRow[key] === 'number');

    // If we have aggregation config with group_by, use bar chart
    if (config && config.type === 'aggregation' && config.group_by) {
      return 'bar';
    }

    // If we have time-related data, use line chart
    const timeKeys = keys.filter(key =>
      key.toLowerCase().includes('time') ||
      key.toLowerCase().includes('date') ||
      key.toLowerCase().includes('year') ||
      key.toLowerCase().includes('month')
    );
    if (timeKeys.length > 0) {
      return 'line';
    }

    // If we have many categories, use bar chart
    if (keys.length > 2 && numericKeys.length >= 1) {
      return 'bar';
    }

    // Default to bar chart
    return 'bar';
  };

  const createChartPrompt = (originalPrompt, recommendedChartType, tableName, tableData, config) => {
    const chartTypeMapping = {
      'bar': 'biểu đồ cột',
      'line': 'biểu đồ đường',
      'pie': 'biểu đồ tròn',
      'scatter': 'biểu đồ phân tán'
    };

    const chartTypeName = chartTypeMapping[recommendedChartType] || 'biểu đồ cột';

    return `${originalPrompt}\n\nTạo ${chartTypeName} để minh họa dữ liệu từ bảng ${tableName}. Chọn trục X và Y phù hợp với dữ liệu.`;
  };

  const mergeTablesForChart = (data) => {
    const mergedData = { ...data };
    delete mergedData._descriptions;

    const tableNames = Object.keys(mergedData);
    if (tableNames.length <= 1) {
      return mergedData;
    }

    // If multiple tables, merge them for combined chart
    const allRows = [];
    tableNames.forEach(tableName => {
      const tableData = mergedData[tableName];
      if (Array.isArray(tableData)) {
        tableData.forEach(row => {
          allRows.push({ ...row, _source_table: tableName });
        });
      }
    });

    return {
      'Combined_Data': allRows
    };
  };

  // AI processing functions (simplified from AI.jsx)
  const isRowEmpty = (row) => {
    if (!row || typeof row !== 'object') return true;
    return Object.values(row).every(
      val => val === '' || val === 0 || val === null || val === undefined,
    );
  };

  const applyFilter = (rowValue, filterConfig) => {
    const { operator, value } = filterConfig;

    if (operator === 'is_null') {
      return rowValue === null || rowValue === undefined || rowValue === '';
    }
    if (operator === 'is_not_null') {
      return rowValue !== null && rowValue !== undefined && rowValue !== '';
    }

    const numericRowValue = !isNaN(rowValue) ? Number(rowValue) : rowValue;
    const stringRowValue = String(rowValue || '').toLowerCase();

    switch (operator) {
      case 'equals':
        const numericValue = !isNaN(value) ? Number(value) : value;
        return numericRowValue === numericValue;
      case 'not_equals':
        const numericValue2 = !isNaN(value) ? Number(value) : value;
        return numericRowValue !== numericValue2;
      case 'greater_than':
        return numericRowValue > Number(value);
      case 'less_than':
        return numericRowValue < Number(value);
      case 'greater_equal':
        return numericRowValue >= Number(value);
      case 'less_equal':
        return numericRowValue <= Number(value);
      case 'contains':
        return stringRowValue.includes(String(value).toLowerCase());
      case 'not_contains':
        return !stringRowValue.includes(String(value).toLowerCase());
      case 'starts_with':
        return stringRowValue.startsWith(String(value).toLowerCase());
      case 'ends_with':
        return stringRowValue.endsWith(String(value).toLowerCase());
      case 'in':
        const valueList = String(value).split(',').map(v => v.trim());
        return valueList.some(v => {
          const numericV = !isNaN(v) ? Number(v) : v;
          return numericRowValue === numericV;
        });
      case 'not_in':
        const valueList2 = String(value).split(',').map(v => v.trim());
        return !valueList2.some(v => {
          const numericV = !isNaN(v) ? Number(v) : v;
          return numericRowValue === numericV;
        });
      default:
        return true;
    }
  };

  // Process queue with AI.jsx flow
  const processQueue = async () => {
    if (isProcessingQueue || analyzeQueue.length === 0) return;

    isProcessingQueue = true;
    const { prompt, sm1, sm2, sm3, m1, m2, m3, questSetting, outputConfig } = analyzeQueue[0];
    const startTime = Date.now();

    // Lưu trạng thái xử lý vào localStorage
    const processingData = {
      isProcessing: true,
      user: currentUser?.email,
      prompt: prompt,
      startTime: startTime,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('reportBuilderProcessing', JSON.stringify(processingData));

    console.log('🤖 [AI NonPD] Starting AI Analysis with AI1->AI2->AI3 flow:', {
      timestamp: new Date().toISOString(),
      prompt: prompt,
      queueLength: analyzeQueue.length,
      user: currentUser?.email,
      models: { m1, m2, m3 },
      hasQuestSetting: !!questSetting,
      templateSelected: selectedTemplate?.name,
      note: 'AI1 will filter data, then AI2 analyzes, then AI3 creates charts'
    });

    try {
      setIsLoading(true);
      setSelectedQueueItem(analyzeQueue[0]);
      setSelectedHistoryId(null);
      setViewingData({});

      // Initialize dataForAI1 for later use
      let dataForAI1 = dataAI1;

      // --- LOGIC MỚI: Nếu có manualConfigEnabled ---
      if (questSetting?.manualConfigEnabled && Array.isArray(questSetting.manualConfigs)) {
        console.log('🔧 [AI NonPD] Using manual config mode');

        let transformedData = {};
        let tableDescriptions = {};

        questSetting.manualConfigs.forEach((config, idx) => {
          const fileNote = fileNotes.find(note => note.id === config.dataset);
          if (!fileNote) return;
          let rows = fileNote.rows || [];

          console.log(`Processing manual config ${idx + 1}:`, config);

          // Apply filters if exist
          if (config.filters && Object.keys(config.filters).length > 0) {
            rows = rows.filter(row => {
              return Object.entries(config.filters).every(([key, filterConfig]) => {
                if (typeof filterConfig === 'object' && filterConfig.operator) {
                  return applyFilter(row[key], filterConfig);
                } else {
                  const rowValueForCompare = !isNaN(row[key]) ? Number(row[key]) : row[key];
                  if (Array.isArray(filterConfig)) {
                    return filterConfig.some(v => {
                      const arrayValue = !isNaN(v) ? Number(v) : v;
                      return arrayValue === rowValueForCompare;
                    });
                  }
                  const conditionValue = !isNaN(filterConfig) ? Number(filterConfig) : filterConfig;
                  return conditionValue === rowValueForCompare;
                }
              });
            });
          }

          let resultRows = rows;
          if (config.type === 'aggregation' && config.operation && config.target_column) {
            const targetColumns = Array.isArray(config.target_column) ? config.target_column : [config.target_column];

            if (config.group_by && config.group_by.length > 0) {
              const groupedData = {};
              rows.forEach(row => {
                const groupKey = config.group_by.map(col => row[col]).join('|');
                if (!groupedData[groupKey]) {
                  groupedData[groupKey] = {
                    ...config.group_by.reduce((acc, col) => {
                      acc[col] = row[col];
                      return acc;
                    }, {}),
                    ...targetColumns.reduce((acc, col) => {
                      acc[col] = 0;
                      return acc;
                    }, {}),
                    count: 0,
                  };
                }

                targetColumns.forEach(col => {
                  const value = parseFloat(row[col]) || 0;
                  groupedData[groupKey][col] += value;
                });
                groupedData[groupKey].count += 1;
              });

              resultRows = Object.values(groupedData).map(group => {
                const result = { ...group };
                delete result.count;

                if (config.operation === 'average') {
                  targetColumns.forEach(col => {
                    result[col] = group.count > 0 ? result[col] / group.count : 0;
                  });
                }
                return result;
              });
            } else {
              const aggregatedValues = targetColumns.reduce((acc, col) => {
                acc[col] = 0;
                return acc;
              }, {});

              rows.forEach(row => {
                targetColumns.forEach(col => {
                  const value = parseFloat(row[col]) || 0;
                  switch (config.operation) {
                    case 'sum': aggregatedValues[col] += value; break;
                    case 'average': aggregatedValues[col] += value; break;
                    case 'count': aggregatedValues[col] += 1; break;
                    case 'max': aggregatedValues[col] = Math.max(aggregatedValues[col], value); break;
                    case 'min': aggregatedValues[col] = Math.min(aggregatedValues[col], value); break;
                    default: aggregatedValues[col] += value;
                  }
                });
              });

              if (config.operation === 'average' && rows.length > 0) {
                targetColumns.forEach(col => {
                  aggregatedValues[col] = aggregatedValues[col] / rows.length;
                });
              }

              resultRows = [{
                ...aggregatedValues,
                operation: config.operation,
                record_count: rows.length,
              }];
            }
          }

          const tableName = `Table${idx + 1}`;
          transformedData[tableName] = resultRows;
          tableDescriptions[tableName] = config.datasetName || fileNote.name;
        });

        transformedData._descriptions = tableDescriptions;
        setFilteredData(transformedData);
        setViewingData(transformedData);

        // Call AI 3 (analyzeDataFinal) for manual config
        let allCharts = [];
        let aiResult = '';
        let totalTokens = 0;

        const dataForAI = { ...transformedData };
        delete dataForAI._descriptions;

        if (useCreateChart && Object.keys(dataForAI).length > 0) {
          const tableNames = Object.keys(dataForAI);
          const tableDescriptions = transformedData._descriptions || {};

          for (let i = 0; i < tableNames.length; i++) {
            const tableName = tableNames[i];
            const tableData = dataForAI[tableName];
            const tableDescription = tableDescriptions[tableName] || `Dữ liệu ${tableName}`;
            const chartName = `C${i + 1} - ${tableDescription}`;

            if (Array.isArray(tableData) && tableData.length > 0) {
              try {
                const recommendedChartType = getRecommendedChartType(dataForAI, tableName, tableData, questSetting.manualConfigs[i]);
                const chartPrompt = createChartPrompt(prompt, recommendedChartType, tableName, tableData, questSetting.manualConfigs[i]);

                if (!(await checkTokenQuota())) continue;
                const singleChartRS = await drawChart({
                  data: { [tableName]: tableData },
                  prompt: chartPrompt,
                  model: m3,
                  systemMessage: sm3,
                  desc: '',
                });

                if (singleChartRS.chartData && singleChartRS.chartConfig) {
                  allCharts.push({
                    tableName: chartName,
                    chartData: singleChartRS.chartData,
                    chartConfig: singleChartRS.chartConfig,
                    usage: singleChartRS.usage,
                    recommendedType: recommendedChartType,
                  });
                  totalTokens += singleChartRS.usage?.total_tokens || 0;
                }
                await updateUsedTokenApp(singleChartRS);
              } catch (error) {
                console.error(`Error creating chart for ${chartName}:`, error);
              }
            }
          }

          setMultipleCharts(allCharts);
          if (allCharts.length > 0) {
            setData(allCharts[0].chartData);
            setChartConfig(allCharts[0].chartConfig);
          }
        } else {
          // Không tạo chart, set empty charts
          setMultipleCharts([]);
          setData([]);
          setChartConfig(null);
        }

        // Call AI 3 for final analysis (luôn gọi để có kết quả phân tích)
        try {
          // Create enhanced description for manual config
          let enhancedDesc = 'Phân tích dữ liệu từ cấu hình thủ công';
          const tableDescriptions = transformedData._descriptions || {};

          if (Object.keys(tableDescriptions).length > 0) {
            enhancedDesc += '\n\n--- CHI TIẾT CÁC BẢNG DỮ LIỆU (MANUAL CONFIG) ---\n';
            Object.entries(tableDescriptions).forEach(([tableName, description]) => {
              const tableData = transformedData[tableName];
              const rowCount = Array.isArray(tableData) ? tableData.length : 0;
              const sampleColumns = Array.isArray(tableData) && tableData.length > 0
                ? Object.keys(tableData[0]).join(', ')
                : 'N/A';

              enhancedDesc += `\n• ${tableName}: ${description}`;
              enhancedDesc += `\n  - Số dòng: ${rowCount}`;
              enhancedDesc += `\n  - Các cột: ${sampleColumns}`;

              if (Array.isArray(tableData) && tableData.length > 0) {
                enhancedDesc += `\n  - Dữ liệu mẫu: ${JSON.stringify(tableData[0])}`;
              }
            });
            enhancedDesc += '\n\n--- HẾT CHI TIẾT BẢNG ---\n';
          }

          if (!(await checkTokenQuota())) return;

          console.log('🤖 [AI NonPD] Calling AI2 with SM2:', {
            sm2Length: sm2.length,
            sm2Preview: sm2.substring(0, 200) + '...',
            hasAutoGeneratedPrompt: sm2.includes('CẤU TRÚC ĐẦU RA YÊU CẦU') || sm2.includes('Hãy phân tích và trả lời theo cấu trúc')
          });

          const rs2 = await analyzeDataFinal(dataForAI, prompt, sm2, m2, enhancedDesc);
          aiResult = rs2?.result || 'Có lỗi xảy ra khi AI phân tích dữ liệu!';
          setResult(aiResult);
          totalTokens += rs2.usage?.total_tokens || 0;
          await updateUsedTokenApp(rs2);
        } catch (error) {
          aiResult = 'Có lỗi xảy ra khi AI phân tích dữ liệu!';
          setResult(aiResult);
        }

        // Save history for manual config
        await createChatHistory({
          quest: prompt,
          result: aiResult,
          create_at: new Date().toISOString(),
          show: true,
          model2: m1,
          model3: m2,
          token2: 0, // No AI1 for manual config
          token3: totalTokens,
          userClass: selectedTemplate?.userClass || [], // Gắn userClass từ template
          output_config: selectedTemplate?.outputConfig || null, // Lưu output config từ template
          more_info: {
            filteredData: transformedData,
            dataAI1: dataAI1,
            used_data: dataAI1.map(item => item.id), // Use all data for manual config
            systemMessages: { sm1, sm2, sm3 },
            multipleCharts: allCharts,
            tableDescriptions: transformedData._descriptions || {},
            analysisType: 'non-powerdrill',
            manualConfig: true,
            templateBased: templateBasedAnalysis,
            templateId: selectedTemplate?.id,
            templateName: selectedTemplate?.name,
            processingTime: Date.now() - startTime
          },
          chartData: allCharts.length > 0 ? allCharts[0].chartData : null,
          chartConfig: allCharts.length > 0 ? allCharts[0].chartConfig : null,
          userCreated: currentUser.email,
        });

        // Save tokens
        const usedTokens = await getSettingByType('USED_TOKEN');
        const totalUsedTokens = (usedTokens?.setting || 0) + totalTokens;
        if (usedTokens) {
          await updateSetting({ ...usedTokens, setting: totalUsedTokens });
        } else {
          await createSetting({
            type: 'USED_TOKEN',
            setting: totalUsedTokens,
          });
        }

        await loadChatHistory();
        return;
      }

      // --- AI 1, AI 2, AI 3 Flow ---
      console.log('🔄 [AI NonPD] Using AI flow with template-filtered data');

      // Use the dataForAI1 initialized earlier
      dataForAI1 = dataAI1;

      // If template is selected, filter dataAI1 to only include template's selected data and KPI
      if (selectedTemplate) {
        const templateDataIds = selectedTemplate.data_selected || [];
        const templateKpiIds = selectedTemplate.kpiSelected || [];

        console.log('🎯 [AI NonPD] Template-based analysis - filtering data and KPI for AI1:', {
          templateName: selectedTemplate.name,
          templateDataIds: templateDataIds,
          templateKpiIds: templateKpiIds,
          originalDataCount: dataAI1.length
        });

        // Filter dataAI1 to only include template's selected data with sample rows
        let filteredDataAI1 = dataAI1.filter(item => {
          // Check if item ID is in template's selected data
          const isSelected = templateDataIds.includes(item.id) ||
            templateDataIds.includes(item.originalId) ||
            templateDataIds.some(selectedId => {
              // Check if selectedId matches the AI-compatible format
              const versionSuffix = item.id_version && item.id_version !== 1 ? `_v${item.id_version}` : '';
              const aiCompatibleId = `${item.id}${versionSuffix}`;
              return selectedId === aiCompatibleId;
            });

          console.log(`🔍 [AI NonPD] Checking item for template filter:`, {
            itemId: item.id,
            itemOriginalId: item.originalId,
            templateDataIds: templateDataIds,
            isSelected: isSelected
          });

          return isSelected;
        }).map(item => {
          // Limit to ~30 rows for AI1 analysis
          const sampleRowDemo = item.rowDemo ? item.rowDemo.slice(0, 30) : [];
          return {
            ...item,
            rowDemo: sampleRowDemo
          };
        });

        // Add KPI data to dataForAI1
        if (templateKpiIds.length > 0) {
          try {
            const kpiData = await getKpiDataForTemplate(templateKpiIds);
            console.log('📊 [AI NonPD] KPI data for template:', {
              kpiCount: Object.keys(kpiData).length,
              kpiNames: Object.keys(kpiData)
            });

            // Convert KPI data to AI1 format
            const kpiDataForAI1 = Object.entries(kpiData).map(([kpiName, kpiTableData]) => ({
              id: `kpi_${kpiName}`,
              name: kpiName,
              type: 'kpi',
              rowDemo: kpiTableData.slice(0, 30), // Limit to 30 rows for AI1
              fullData: kpiTableData,
              description: `Dữ liệu KPI: ${kpiName}`
            }));

            dataForAI1 = [...filteredDataAI1, ...kpiDataForAI1];
          } catch (error) {
            console.error('❌ [AI NonPD] Error loading KPI data for template:', error);
            dataForAI1 = filteredDataAI1;
          }
        } else {
          dataForAI1 = filteredDataAI1;
        }

        console.log('🎯 [AI NonPD] Filtered data and KPI for AI1:', {
          filteredDataCount: dataForAI1.length,
          dataItems: dataForAI1.filter(item => item.type !== 'kpi').map(item => ({
            id: item.id,
            name: item.name,
            rowDemoCount: item.rowDemo?.length || 0
          })),
          kpiItems: dataForAI1.filter(item => item.type === 'kpi').map(item => ({
            id: item.id,
            name: item.name,
            rowDemoCount: item.rowDemo?.length || 0
          }))
        });
      } else {
        console.log('🔄 [AI NonPD] No template selected, using all available data for AI1:', {
          totalDataCount: dataForAI1.length
        });
      }

      // Run AI1 with filtered/original data
      console.log('Input AI 1: ', { dataForAI1, prompt, sm1, m1 });

      if (!(await checkTokenQuota())) return;
      const result = await analyzeData(dataForAI1, prompt, sm1, m1);
      await updateUsedTokenApp(result);
      console.log('Output AI 1: ', result);

      let transformedData = processDataWithAnalysisConfigs(fileNotes, result, dataForAI1);
      console.log('Dữ liệu sau lọc: ', transformedData);

      // Create enhanced description for AI2 including table descriptions
      let enhancedDesc = result.desc || '';
      const tableDescriptions = transformedData._descriptions || {};

      if (Object.keys(tableDescriptions).length > 0) {
        enhancedDesc += '\n\n--- CHI TIẾT CÁC BẢNG DỮ LIỆU ---\n';

        // Check if any tables have zero rows (indicating potential field mapping issues)
        const emptyTables = Object.entries(transformedData)
          .filter(([key, data]) => key !== '_descriptions' && Array.isArray(data) && data.length === 0);

        if (emptyTables.length > 0) {
          enhancedDesc += '\n⚠️ LƯU Ý QUAN TRỌNG:\n';
          enhancedDesc += `- ${emptyTables.length} bảng có 0 dòng dữ liệu do không tìm thấy field "Loại" để phân biệt Doanh thu/Chi phí\n`;
          enhancedDesc += '- Dữ liệu gốc có thể không phân biệt loại giao dịch hoặc sử dụng cách phân biệt khác\n';
          enhancedDesc += '- Khuyến nghị: Phân tích dữ liệu tổng thể thay vì phân tách theo loại\n';
        }

        Object.entries(tableDescriptions).forEach(([tableName, description]) => {
          const tableData = transformedData[tableName];
          const rowCount = Array.isArray(tableData) ? tableData.length : 0;
          const sampleColumns = Array.isArray(tableData) && tableData.length > 0
            ? Object.keys(tableData[0]).join(', ')
            : 'N/A';

          enhancedDesc += `\n• ${tableName}: ${description}`;
          enhancedDesc += `\n  - Số dòng: ${rowCount}`;
          enhancedDesc += `\n  - Các cột: ${sampleColumns}`;

          // Add warning for empty tables
          if (rowCount === 0) {
            enhancedDesc += `\n  - ⚠️ BẢNG RỖNG: Có thể do thiếu field phân loại hoặc filter quá strict`;
          }

          // Add sample data for better understanding
          if (Array.isArray(tableData) && tableData.length > 0) {
            enhancedDesc += `\n  - Dữ liệu mẫu: ${JSON.stringify(tableData[0])}`;
          }
        });
        enhancedDesc += '\n\n--- HẾT CHI TIẾT BẢNG ---\n';
      }

      console.log('Input AI 2: ', {
        transformedData,
        prompt,
        sm2,
        m2,
        originalDesc: result.desc || '',
        enhancedDesc: enhancedDesc,
        tableDescriptions: tableDescriptions
      });

      console.log('🤖 [AI NonPD] Calling AI2 with SM2 (normal flow):', {
        sm2Length: sm2.length,
        sm2Preview: sm2.substring(0, 200) + '...',
        hasAutoGeneratedPrompt: sm2.includes('CẤU TRÚC ĐẦU RA YÊU CẦU') || sm2.includes('Hãy phân tích và trả lời theo cấu trúc')
      });

      if (!(await checkTokenQuota())) return;
      let rs2 = await analyzeDataFinal(transformedData, prompt, sm2, m2, enhancedDesc);
      await updateUsedTokenApp(rs2);
      console.log('Output AI 2:', rs2);

      const aiResult = rs2?.result || 'Có lỗi xảy ra khi AI phân tích dữ liệu!';
      setResult(aiResult);

      // Parse JSON result if available
      let parsedAnalysisResult = null;
      try {
        if (aiResult && typeof aiResult === 'string') {
          // Remove markdown code block if present
          let cleanResult = aiResult;
          if (aiResult.includes('```json')) {
            cleanResult = aiResult.replace(/```json\s*/, '').replace(/\s*```$/, '');
          } else if (aiResult.includes('```')) {
            cleanResult = aiResult.replace(/```\s*/, '').replace(/\s*```$/, '');
          }

          // Try to parse as JSON
          const jsonMatch = cleanResult.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedAnalysisResult = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (error) {
        console.error('Error parsing AI result as JSON:', error);
      }
      setFilteredData(transformedData);
      setViewingData(transformedData);

      let allCharts = [];

      if (useCreateChart && Object.keys(transformedData).length > 0) {
        const tableNames = Object.keys(transformedData).filter(name => name !== '_descriptions');
        const tableDescriptions = transformedData._descriptions || {};

        // Create charts for all tables
        for (let i = 0; i < tableNames.length; i++) {
          const tableName = tableNames[i];
          const tableData = transformedData[tableName];
          const tableDescription = tableDescriptions[tableName] || `Dữ liệu ${tableName}`;
          const chartName = `C${i + 1} - ${tableDescription}`;

          if (Array.isArray(tableData) && tableData.length > 0) {
            try {
              const recommendedChartType = getRecommendedChartType(transformedData, tableName, tableData, null);
              const chartPrompt = createChartPrompt(prompt, recommendedChartType, tableName, tableData, null);

              if (!(await checkTokenQuota())) continue;
              const singleChartRS = await drawChart({
                data: { [tableName]: tableData },
                prompt: chartPrompt,
                model: m3,
                systemMessage: sm3,
                desc: result.desc || '',
              });
              await updateUsedTokenApp(singleChartRS);

              console.log(`Output AI chart for ${chartName}: `, singleChartRS);

              if (singleChartRS.chartData && singleChartRS.chartConfig) {
                allCharts.push({
                  tableName: chartName,
                  chartData: singleChartRS.chartData,
                  chartConfig: singleChartRS.chartConfig,
                  usage: singleChartRS.usage,
                  recommendedType: recommendedChartType,
                });
              }
            } catch (error) {
              console.error(`Error creating chart for ${chartName}:`, error);
            }
          }
        }

        // Create combined chart
        try {
          const mergedDataForChart = mergeTablesForChart(transformedData);

          console.log('Input AI chart tổng hợp: ', {
            data: mergedDataForChart,
            prompt,
            model: m3,
            systemMessage: sm3,
            desc: result.desc || '',
          });

          if (!(await checkTokenQuota())) return;
          const chartRS = await drawChart({
            data: mergedDataForChart,
            prompt,
            model: m3,
            systemMessage: sm3,
            desc: result.desc || '',
          });
          await updateUsedTokenApp(chartRS);

          console.log('Output AI chart tổng hợp: ', chartRS);

          if (chartRS.chartData && chartRS.chartConfig) {
            allCharts.push({
              tableName: `C${tableNames.length + 1} - Biểu đồ tổng hợp`,
              chartData: chartRS.chartData,
              chartConfig: chartRS.chartConfig,
              usage: chartRS.usage,
            });
          }
        } catch (error) {
          console.error('Error creating combined chart:', error);
        }

        setMultipleCharts(allCharts);

        if (allCharts.length > 0) {
          setData(allCharts[0].chartData);
          setChartConfig(allCharts[0].chartConfig);
        }
      } else if (useCreateChart && Object.keys(transformedData).length === 0) {
        // Không có dữ liệu để tạo chart
        setMultipleCharts([]);
        setData([]);
        setChartConfig(null);
      } else if (!useCreateChart) {
        // Không tạo chart (user đã tắt tính năng tạo chart)
        setMultipleCharts([]);
        setData([]);
        setChartConfig(null);
      }

      await createChatHistory({
        quest: prompt,
        result: aiResult,
        create_at: new Date().toISOString(),
        show: true,
        model2: m1,
        model3: m2,
        token2: (result.usage?.total_tokens || 0), // Always include AI1 tokens
        token3: (rs2.usage?.total_tokens || 0) + (allCharts.reduce((sum, chart) => sum + (chart.usage?.total_tokens || 0), 0)),
        userClass: selectedTemplate?.userClass || [], // Gắn userClass từ template
        output_config: outputConfig || selectedTemplate?.outputConfig || null, // Lưu output config từ queue hoặc template
        more_info: {
          filteredData: transformedData,
          dataAI1: dataForAI1, // Use the filtered data that was sent to AI1
          used_data: result.matched_ids || [], // Use AI1 result
          systemMessages: { sm1, sm2, sm3 },
          multipleCharts: allCharts,
          tableDescriptions: transformedData._descriptions || {},
          analysisType: 'non-powerdrill',
          templateBased: templateBasedAnalysis,
          templateId: selectedTemplate?.id,
          templateName: selectedTemplate?.name,
          processingTime: Date.now() - startTime,
          analysisResult: parsedAnalysisResult // Add parsed JSON result
        },
        chartData: allCharts.length > 0 ? allCharts[0].chartData : null,
        chartConfig: allCharts.length > 0 ? allCharts[0].chartConfig : null,
        userCreated: currentUser.email,
      });

      await loadChatHistory();

      // Save used tokens to settings (AI1 + AI2 + AI3 charts)
      const totalChartTokens = allCharts.reduce((sum, chart) => sum + (chart.usage?.total_tokens || 0), 0);
      const usedTokens = await getSettingByType('USED_TOKEN');
      const totalUsedTokens = (usedTokens?.setting || 0) + (result.usage?.total_tokens || 0) + (rs2.usage?.total_tokens || 0) + totalChartTokens;

      console.log('💰 [AI NonPD] Token usage summary:', {
        ai1Tokens: result.usage?.total_tokens || 0,
        ai2Tokens: rs2.usage?.total_tokens || 0,
        ai3ChartTokens: totalChartTokens,
        totalThisRequest: (result.usage?.total_tokens || 0) + (rs2.usage?.total_tokens || 0) + totalChartTokens,
        totalAccumulated: totalUsedTokens
      });

      if (usedTokens) {
        await updateSetting({ ...usedTokens, setting: totalUsedTokens });
      } else {
        await createSetting({
          type: 'USED_TOKEN',
          setting: totalUsedTokens,
        });
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ [AI NonPD] AI Analysis Error:', {
        processingTime: `${processingTime}ms`,
        error: error,
        errorMessage: error?.message,
        errorData: error?.response?.data,
        prompt: prompt,
        models: { m1, m2, m3 }
      });

      let errorMessage = 'Có lỗi xảy ra khi phân tích dữ liệu!';
      const errorData = error?.response?.data?.error;
      if (
        (typeof errorData === 'string' && errorData.includes('Error code: 529')) ||
        (typeof errorData === 'string' && errorData.includes('overloaded'))
      ) {
        errorMessage = 'Hệ thống AI đang quá tải, vui lòng thử lại sau!';
      } else {
        errorMessage = 'Xảy ra lỗi trong quá trình đọc dữ liệu: ' + errorData;
      }
      setResult(errorMessage);
    } finally {
      setIsLoading(false);
      analyzeQueue.shift();
      setQueueLength(analyzeQueue.length);
      isProcessingQueue = false;
      setSelectedQueueItem(null);

      // Xóa trạng thái xử lý khỏi localStorage
      localStorage.removeItem('reportBuilderProcessing');
      setUpdateReportBuilder(!updateReportBuilder);
      console.log('🏁 [AI NonPD] Process completed:', {
        remainingQueue: analyzeQueue.length,
        totalTime: `${Date.now() - startTime}ms`
      });

      processQueue();
    }
  };

  // Main analyze function with AI.jsx flow
  async function analyze() {
    console.log('🚀 [AI NonPD] Starting analyze function:', {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      promptLength: prompt.length,
      timestamp: new Date().toISOString()
    });

    let sm1 = systemMessage1;
    let sm2 = systemMessage2;
    let sm3 = systemMessage3;
    let m1 = model1;
    let m2 = model2;
    let m3 = model3;

    console.log('⚙️ [AI NonPD] Loading latest settings...');
    const message1 = await getSettingByType('SYSTEM_MESSAGE_1');
    if (message1) sm1 = message1.setting;
    const message2 = await getSettingByType('SYSTEM_MESSAGE_2');
    if (message2) sm2 = message2.setting;
    const message3 = await getSettingByType('SYSTEM_MESSAGE_3');
    if (message3) sm3 = message3.setting;

    // Add auto-generated prompt to AI 2 if available (after loading settings)
    if (autoGeneratedPrompt && autoGeneratedPrompt.trim()) {
      console.log('🔧 [AI NonPD] Adding auto-generated prompt to SM2:', {
        autoGeneratedPromptLength: autoGeneratedPrompt.length,
        autoGeneratedPromptPreview: autoGeneratedPrompt.substring(0, 100) + '...'
      });

      sm2 = sm2 + '\n\n' + autoGeneratedPrompt;

      // Add JSON format requirement
      sm2 = sm2 + '\n\nYÊU CẦU ĐỊNH DẠNG ĐẦU RA:\nBạn phải trả về kết quả dưới dạng JSON với cấu trúc sau:\n\n{\n  "sections": [\n    {\n      "order": 1,\n      "title": "TÊN PHẦN",\n      "textResult": "Nội dung phân tích cho phần này",\n      "dataRequirements": {\n        "kpiSelected": [id_kpi_1, id_kpi_2],\n        "tableSelected": ["table_id_1", "table_id_2"]\n      }\n    }\n  ]\n}\n\nTrong đó:\n- order: thứ tự phần (1, 2, 3...)\n- title: tên phần từ cấu hình\n- textResult: nội dung phân tích AI cho phần đó\n- dataRequirements: lấy từ cấu hình template cho phần đó\n\nLưu ý: Chỉ trả về JSON, không có text giải thích thêm.';
    } else {
      console.log('⚠️ [AI NonPD] No auto-generated prompt available for SM2');
    }
    const bot1 = await getSettingByType('MODEL_AI_1');
    if (bot1) m1 = bot1.setting;
    const bot2 = await getSettingByType('MODEL_AI_2');
    if (bot2) m2 = bot2.setting;
    const bot3 = await getSettingByType('MODEL_AI_3');
    if (bot3) m3 = bot3.setting;

    console.log('🔧 [AI NonPD] Settings loaded:', {
      model1: m1,
      model2: m2,
      model3: m3,
      systemMessage1Changed: sm1 !== systemMessage1,
      systemMessage2Changed: sm2 !== systemMessage2,
      systemMessage3Changed: sm3 !== systemMessage3
    });

    let finalPrompt = prompt;
    if (selectedTemplate?.outputConfig?.sections && selectedTemplate.outputConfig.sections.length > 0) {
      const sectionsContent = selectedTemplate.outputConfig.sections
        .map(section => section.content)
        .filter(content => content && content.trim() !== '')
        .join('\n- ');
      
      if (sectionsContent) {
        finalPrompt += '\n\nYêu cầu phân tích chi tiết cho từng phần:\n- ' + sectionsContent;
      }
    }

    if (!finalPrompt.trim()) {
      console.log('⚠️ [AI NonPD] Empty prompt, aborting analyze');
      return;
    }

    const queueItem = {
      prompt: finalPrompt,
      sm1,
      sm2,
      sm3,
      m1,
      m2,
      m3,
      questSetting, // Add questSetting to queue
      outputConfig: selectedTemplate?.outputConfig || null, // Add output config
      timestamp: new Date().toISOString(),
    };

    console.log('📝 [AI NonPD] Adding to queue:', {
      queuePosition: analyzeQueue.length,
      queueItem: {
        promptLength: queueItem.prompt.length,
        model1: queueItem.m1,
        model2: queueItem.m2,
        model3: queueItem.m3,
        hasQuestSetting: !!queueItem.questSetting,
        timestamp: queueItem.timestamp
      }
    });

    analyzeQueue.push(queueItem);
    setQueueLength(analyzeQueue.length);
    setSelectedQueueItem(queueItem);
    setSelectedHistoryId(null);
    setViewingData({}); // Clear viewing data when adding to queue
    setData([]); // Clear chart data
    setChartConfig(null); // Clear chart config
    setMultipleCharts([]); // Clear multiple charts

    console.log('🔄 [AI NonPD] Queue updated, starting processQueue');
    processQueue();
  }

  const handleAnalyze = () => {
    setSelectedHistoryId(null);
    setSelectedQueueItem(null);
    if (!isUsingUploadedData) {
      setViewingData(filteredData);
    }
    setData([]);
    setChartConfig(null);
    setMultipleCharts([]);
    analyze();
  };

  const handlePublish = () => {
    if (selectedHistoryId) {
      setPublishingHistoryId(selectedHistoryId);
      setPublishModalOpen(true);
    } else {
      message.warning('Vui lòng chọn một lịch sử phân tích để xuất bản');
    }
  };

  const confirmPublish = async () => {
    console.log('📤 [AI NonPD] Publishing history item:', { publishingHistoryId });

    try {
      if (!publishingHistoryId) {
        console.log('❌ [AI NonPD] No publishing history ID found');
        message.error('Không tìm thấy lịch sử để xuất bản');
        return;
      }

      // Find the history item
      const historyItem = chatHistory.find(item => item.id === publishingHistoryId);
      if (!historyItem) {
        console.log('❌ [AI NonPD] History item not found in chat history');
        message.error('Không tìm thấy lịch sử phân tích');
        return;
      }

      console.log('📋 [AI NonPD] Publishing item details:', {
        id: historyItem.id,
        questPreview: historyItem.quest?.substring(0, 100) + '...',
        timestamp: historyItem.create_at,
        hasAnalysisResult: !!historyItem.more_info?.analysisResult,
        hasOutputConfig: !!historyItem.output_config
      });

      // Parse the analysis result to create Tiptap blocks
      let tiptapBlocks = [];
      let content = '';

      if (historyItem.more_info?.analysisResult) {
        try {
          // Parse JSON result if it's a string
          let analysisResult = historyItem.more_info.analysisResult;
          if (typeof analysisResult === 'string') {
            // Remove markdown code blocks if present
            let cleanResult = analysisResult;
            if (analysisResult.includes('```json')) {
              cleanResult = analysisResult.replace(/```json\s*/, '').replace(/\s*```$/, '');
            } else if (analysisResult.includes('```')) {
              cleanResult = analysisResult.replace(/```\s*/, '').replace(/\s*```$/, '');
            }

            const jsonMatch = cleanResult.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              analysisResult = JSON.parse(jsonMatch[0]);
            } else {
              analysisResult = JSON.parse(cleanResult);
            }
          }

          // Create Tiptap blocks from sections
          if (analysisResult.sections && Array.isArray(analysisResult.sections)) {
            tiptapBlocks = analysisResult.sections
              .sort((a, b) => a.order - b.order)
              .map((section, index) => {
                // Convert markdown content to HTML
                const htmlContent = marked(section.textResult || '');

                return {
                  type: 'MESSAGE',
                  group_name: section.title,
                  content: htmlContent,
                  order: section.order,
                  dataRequirements: section.dataRequirements || null
                };
              });

            // Create main content by combining all sections
            content = tiptapBlocks.map(block => block.content).join('\n\n');
          }
        } catch (error) {
          console.error('❌ [AI NonPD] Error parsing analysis result:', error);
          // Fallback to original result
          if (typeof historyItem.result === 'string') {
            content = marked(historyItem.result);
          } else if (typeof historyItem.result === 'object') {
            content = marked(`\`\`\`json\n${JSON.stringify(historyItem.result, null, 2)}\n\`\`\``);
          }
        }
      } else {
        // Fallback for old format
        if (typeof historyItem.result === 'string') {
          content = marked(historyItem.result);
        } else if (typeof historyItem.result === 'object') {
          content = marked(`\`\`\`json\n${JSON.stringify(historyItem.result, null, 2)}\n\`\`\``);
        }
      }

      // Prepare charts data
      let chartData = null;
      let chartConfig = null;
      if (historyItem.more_info?.multipleCharts && historyItem.more_info.multipleCharts.length > 0) {
        // Use first chart as main chart
        const firstChart = historyItem.more_info.multipleCharts[0];
        chartData = firstChart.chartData;
        chartConfig = firstChart.chartConfig;
      } else if (historyItem.chartData && historyItem.chartConfig) {
        chartData = historyItem.chartData;
        chartConfig = historyItem.chartConfig;
      }

      // Prepare tables data for tables field
      let tables = [];
      if (historyItem.more_info?.filteredData) {
        const tableDescriptions = historyItem.more_info.tableDescriptions || {};
        tables = Object.entries(historyItem.more_info.filteredData)
          .filter(([key]) => key !== '_descriptions')
          .map(([tableName, tableData]) => ({
            name: tableDescriptions[tableName] || tableName,
            url: null,
            data: tableData,
            description: tableDescriptions[tableName] || tableName,
            type: 'TABLE'
          }));
      }

      // Convert output_config textResult from markdown to HTML before saving
      let processedOutputConfig = null;
      console.log('moi', {
        historyItem
      });

      // Get textResult from analysisResult.sections and merge with output_config.sections
      if (historyItem.output_config && historyItem.output_config.sections && historyItem.more_info?.analysisResult?.sections) {
        const analysisSections = historyItem.more_info.analysisResult.sections;
        const outputSections = historyItem.output_config.sections;

        processedOutputConfig = {
          ...historyItem.output_config,
          sections: outputSections.map((outputSection, index) => {
            // Get matching section in analysisResult by index
            const matchingAnalysisSection = analysisSections[index];

            return {
              ...outputSection,
              textResult: matchingAnalysisSection?.textResult ? marked(matchingAnalysisSection.textResult) : null
            };
          })
        };
      }

      // Create new aiChatExport record
      const exportData = {
        content: content,
        chart_data: chartData,
        chart_config: chartConfig,
        tables: tables,
        output_config: processedOutputConfig || null, // Lưu output_config đã chuyển đổi từ history
        user_create: currentUser?.email || historyItem.userCreated,
        create_at: new Date().toISOString(),
        update_at: new Date().toISOString(),
        show: true,
        model: historyItem.model3 || 'unknown',
        userClass: historyItem.userClass || [],
        more_info: {
          originalHistoryId: historyItem.id,
          quest: historyItem.quest,
          title: historyItem.quest,
          publishedAt: new Date().toISOString(),
          publishedBy: currentUser?.email,
          multipleCharts: historyItem.more_info?.multipleCharts || [],
          tableDescriptions: historyItem.more_info?.tableDescriptions || {},
          templateBased: historyItem.more_info?.templateBased,
          templateId: historyItem.more_info?.templateId,
          templateName: historyItem.more_info?.templateName,
          systemMessages: historyItem.more_info?.systemMessages,
          processingTime: historyItem.more_info?.processingTime,
          analysisResult: historyItem.more_info?.analysisResult || null,
          tiptapBlocks: tiptapBlocks // Lưu Tiptap blocks để hiển thị
        },
        xuat_ban: {
          published: true,
          publishedAt: new Date().toISOString(),
          publishedBy: currentUser?.email
        }
      };

      await createChatExport(exportData);

      console.log('✅ [AI NonPD] Report published to aiChatExport successfully');
      message.success('Xuất bản thành công!');

      // Close modal and reset state
      setPublishModalOpen(false);
      setPublishingHistoryId(null);
    } catch (error) {
      console.error('❌ [AI NonPD] Error publishing report:', error);
      message.error('Có lỗi xảy ra khi xuất bản. Vui lòng thử lại.');
    }
  };

  // When filteredData changes, update viewingData if not viewing a history
  useEffect(() => {
    if (!selectedHistoryId && !selectedQueueItem && Object.keys(viewingData).length > 0 && !isUsingUploadedData) {
      setViewingData(filteredData);
    }
  }, [filteredData, selectedHistoryId, selectedQueueItem, isUsingUploadedData]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      setViewingData({});
      setFilteredData({});
      setData([]);
      setChartConfig(null);
      setMultipleCharts([]);
      setSaveFileName('');
      setSaveFolder(undefined);
    };
  }, []);

  // --- Helper: Update USED_TOKEN_APP after AI call ---
  async function updateUsedTokenApp(aiResult) {
    try {
      const usedTokens = aiResult?.usage?.total_tokens || aiResult?.total_tokens || aiResult?.usage?.totalTokens || 0;
      if (!usedTokens) return;
      let settingObj = await getSettingByType('USED_TOKEN_APP');
      let arr = Array.isArray(settingObj?.setting) ? [...settingObj.setting] : [];
      const idx = arr.findIndex(item => item.app === 'analysis-review');
      if (idx >= 0) {
        arr[idx].usedToken = (arr[idx].usedToken || 0) + usedTokens;
      } else {
        arr.push({ app: 'analysis-review', usedToken: usedTokens });
      }
      if (settingObj && settingObj.id) {
        await updateSetting({ ...settingObj, setting: arr });
      } else {
        await createSetting({ type: 'USED_TOKEN_APP', setting: arr });
      }
    } catch (err) {
      // Không chặn luồng chính nếu lỗi
      console.error('Lỗi lưu USED_TOKEN_APP:', err);
    }
  }

  // --- Helper: Check token quota before AI call ---
  async function checkTokenQuota() {
    const usedTokenSetting = await getSettingByType('USED_TOKEN_APP');
    const totalTokenSetting = await getSettingByType('TOTAL_TOKEN');
    const arr = Array.isArray(usedTokenSetting?.setting) ? usedTokenSetting.setting : [];
    const appObj = arr.find(item => item.app === 'analysis-review');
    const totalUsed = appObj?.usedToken || 0;
    const totalToken = typeof totalTokenSetting?.setting === 'number' ? totalTokenSetting.setting : 0;
    if (totalToken > 0 && totalUsed >= totalToken) {
      message.error('Bạn không thể yêu cầu do đã vượt quá token');
      return false;
    }
    return true;
  }

  const autoSizeAll = () => {
    const allColumnIds = gridRef.current.columnApi.getAllColumns().map(col => col.getId());
    gridRef.current.columnApi.autoSizeColumns(allColumnIds);
  };

  const handleOpenCreateReportModal = async () => {

		if (selectedKpis.length === 0 && selectedFileNotes.length === 0) {
			message.warning('Vui lòng chọn ít nhất một KPI hoặc file note để tạo báo cáo');
			return;
		}
		try {
			setLoadingTable(true);
			const columns = await getTemplateColumn(selectedApprovedVersion.id_template);
			const response = await getTemplateRow(
				selectedApprovedVersion.id_template,
				selectedApprovedVersion.id_version == 1 ? null : selectedApprovedVersion.id_version,
				false,
				tablePage,
				tablePageSize
			);
			
			if (response && response.rows) {
				const rowData = response.rows.map(row => ({ ...row.data, rowId: row.id }));
				setTableData(rowData);
				setTotalRows(response.count);
			} else {
				setTableData([]);
				setTotalRows(0);
			}

			setTableColumns(columns);
		} catch (error) {
			console.error('Lỗi khi tải dữ liệu bảng:', error);
		} finally {
			setLoadingTable(false);
		}
	}

	const columns = useMemo(() => {
		if (tableColumns.length === 0) return [];
		// ... existing code ...
		return (
			<div>
				<div style={{
					backgroundColor: '#f5f5f5',
					padding: '8px 12px',
					borderRadius: '4px',
					marginBottom: '12px',
					fontSize: '13px',
					color: '#666'
				}}>
					Tổng cộng: {tableData.length} dòng • {Object.keys(tableData[0] || {}).length} cột
				</div>
				<div
					className="ag-theme-quartz"
					style={{
						height: '400px',
						width: '100%',
						border: '1px solid #d9d9d9',
						borderRadius: '6px',
						overflow: 'hidden',
						position: 'relative'
					}}
				>
					<AgGridReact
						statusBar={statusBar}
						enableRangeSelection={true}
						rowData={tableData}
						columnDefs={Object.keys(tableData[0] || {}).map(key => ({
							field: key,
							headerName: key,
							width: 150,
							sortable: true,
							filter: true,
							resizable: true,
							valueFormatter: (params) => {
								if (typeof params.value === 'object') {
									return JSON.stringify(params.value);
								}
								return String(params.value || '');
							}
						}))}
						defaultColDef={{
							sortable: true,
							filter: true,
							resizable: true,
							minWidth: 100,
						}}
						onGridReady={params => {
							try {
								params.api.autoSizeAllColumns();
							} catch (error) {
								console.warn('Error in grid ready:', error);
							}
						}}
						onFirstDataRendered={params => {
							try {
								params.api.autoSizeAllColumns();
							} catch (error) {
								console.warn('Error in first data rendered:', error);
							}
						}}
						localeText={AG_GRID_LOCALE_VN}
					/>
				</div>
				<div style={{ marginTop: '16px', textAlign: 'right' }}>
					<Pagination
						current={tablePage}
						pageSize={tablePageSize}
						total={totalRows}
						onChange={handlePageChange}
						showSizeChanger
						pageSizeOptions={[1000, 2000, 5000, 10000]}
						showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
					/>
				</div>
			</div>
		);
	}, [tableData, tablePage, tablePageSize, totalRows, statusBar]);

  return (
    <>
      <div className={styles.reportBuilderLayout} style={{ position: 'relative' }}>
        {isFirstLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
          }}>
            <Loading3DTower />
          </div>
        )}
        {/* Left Panel - Prompt Input */}
        <div className={styles.reportBuilderLeft}>
        <div className={styles.jobPromptSection}>
        <div className={styles.templatesSection}>
              <div className={styles.templatesHeader}>
                <div className={styles.flexItemsCenterGap2}>
                  <BookOpen className={`${styles.h4} ${styles.w4} ${styles.iconGray500}`} />
                  <span className={styles.panelSubHeader}>Templates</span>
                  <span className={styles.templateCount}>({templates.length})</span>
                  {!(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && allTemplates.length > templates.length && (
                    <span style={{
                      fontSize: '10px',
                      color: '#666',
                      marginLeft: '4px'
                    }}>
                      (đã lọc từ {allTemplates.length} template)
                    </span>
                  )}
                </div>
                <button
                  onClick={handleNewTemplate}
                  className={styles.newButton}
                  title="Tạo template mới"
                  style={{
                    backgroundColor: '#fff',
                    color: '#696969',
                    padding: '5px 5px',
                    borderRadius: '10px',
                    border: '2px solid #D3D3D3',
                  }}
                >
                  <Plus className={`${styles.h3} ${styles.w3}`} size={20} strokeWidth={2} />
                </button>
              </div>

              {loadingTemplates ? (
                <div className={styles.loadingTemplates}>
                  <Spin size="small" />
                  <span>Đang tải templates...</span>
                </div>
              ) : (
                <div className={styles.templatesList}>
                  {templates.length > 0 ? (
                    templates.map((template) => {
                      const isSelected = selectedTemplate?.id === template.id;

                      return (
                        <div key={template.id} className={styles.templateItem}
                          style={{
                            border: isSelected ? '1px solid #1677ff' : '1px solid     #d9d9d9',
                          }}
                        >
                          <button
                            onClick={() => handleSelectTemplate(template)}
                            className={styles.templateButton}
                            title={
                              template.outputConfig?.sections?.length > 0
                                ? `Prompt: ${template.prompt}\n\nCấu trúc đầu ra:\n${template.outputConfig.sections.map((section, index) =>
                                  `${String.fromCharCode(97 + index)}) ${section.title || `Phần ${String.fromCharCode(97 + index).toUpperCase()}`}`
                                ).join('\n')}`
                                : template.prompt
                            }
                            style={{


                              borderWidth: '2px'
                            }}
                          >
                            <div className={styles.templateContent}>
                              <div className={styles.templateName}>{template.name}</div>
                              <div style={{
                                fontSize: '10px',
                                color: '#8c8c8c',
                                marginTop: '4px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px'
                              }}>
                                <span>{(template.data_selected || []).length} dữ liệu</span>
                                {template.outputConfig?.sections?.length > 0 && (
                                  <span style={{ color: '#1890ff', fontWeight: '500' }}>
                                    📋 {template.outputConfig.sections.length} phần cấu trúc
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                          <div className={styles.templateActions}>
                            <button
                              onClick={() => handleEditTemplate(template)}
                              className={styles.templateEditButton}
                              title="Chỉnh sửa template"
                            >
                              <Edit2 className={`${styles.h3} ${styles.w3} ${styles.iconBlue600}`} />
                            </button>
                            <Popconfirm
                              title="Xóa template"
                              description="Bạn có chắc chắn muốn xóa template này?"
                              onConfirm={() => handleDeleteTemplate(template.id)}
                              okText="Xóa"
                              cancelText="Hủy"
                            >
                              <button
                                className={styles.templateDeleteButton}
                                title="Xóa template"
                              >
                                <Trash2 className={`${styles.h3} ${styles.w3} ${styles.iconRed600}`} />
                              </button>
                            </Popconfirm>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className={styles.emptyTemplates}>
                      <BookOpen size={24} />
                      <span>Tạo template để liên kết dữ liệu trước khi phân tích</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={styles.promptHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 className={styles.textHeader}>Job Prompt

                </h3>

                {/* <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type='checkbox'
                    checked={useCreateChart}
                    onChange={e => setUseCreateChart(e.target.checked)}
                    id='createChartCheckbox'
                    title="Tự động tạo biểu đồ từ kết quả phân tích"
                  />
                  <label htmlFor='createChartCheckbox' style={{ fontSize: '14px', cursor: 'pointer' }} title="Tự động tạo biểu đồ từ kết quả phân tích">
                    📊 Tạo chart
                  </label>
                </div> */}
              </div>

              <button
                onClick={handleNewJob}
                className={styles.newButton}
                style={{
                  backgroundColor: '#fff',
                  color: '#696969',
                  padding: '5px 5px',
                  borderRadius: '10px',
                  border: '2px solid #D3D3D3',
                }}
              >
                <Plus className={`${styles.h3} ${styles.w3}`} size={20} strokeWidth={2} />
              </button>
            </div>



            <div className={styles.promptContainer}>
              <Editor
                value={prompt}
                onValueChange={val => handlePromptChange({ target: { value: val } })}
                highlight={highlightPrompt}
                padding={12}
                style={{
                  height: 200,
                  maxHeight: 200,
                  fontFamily: 'inherit',
                  fontSize: 14,
                  background: '#fff',
                  border: '1px solid #d9d9d9',
                  overflow: 'auto',
                  borderRadius: 4,
                  width: '100%',
                  ...(!selectedTemplate && { background: '#f5f5f5', color: '#aaa' })
                }}
                disabled={!selectedTemplate}
              />
            </div>

            <div className={styles.flexGap2}>
              <div
                style={{
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center'
                }}
              >

                <Button
                  onClick={() => setModalOpen(true)}
                  type='link'
                  style={{
                    backgroundColor: '#fff',
                    color: '#1E5FAD',
                    border: 'none',
                    boxShadow: 'none'
                  }}
                >
                  Cấu hình dữ liệu
                </Button>
                {currentUser?.isSuperAdmin && (
                  <Button
                    type='link'
                    onClick={() => setFormModalOpen(true)}
                    title="Cấu hình AI"
                    style={{
                      backgroundColor: '#fff',
                      color: '#1E5FAD',
                      border: 'none',
                      boxShadow: 'none'
                    }}
                  >
                    AI Config
                  </Button>
                )}
              </div>
              <button
                onClick={handleRunJob}
                disabled={!prompt.trim() || !selectedTemplate || hasUnresolvedSpecialChars(prompt)}
                className={styles.runButton}
                title={
                  !selectedTemplate
                    ? 'Vui lòng chọn template'
                    : !prompt.trim()
                      ? 'Vui lòng nhập prompt'
                      : hasUnresolvedSpecialChars(prompt)
                        ? `Vui lòng thay thế các ký tự đặc biệt: ${getUnresolvedSpecialChars(prompt).join(', ')}`
                        : 'Chạy phân tích'
                }
              >
                <Play className={`${styles.h3} ${styles.w3}`} />
                Run
              </button>
            </div>

           
          </div>
        </div>

        {/* Main Panel - Content */}
        <div className={styles.reportBuilderMain}>
          {/* <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            marginBottom: '16px',
            padding: '8px 0'
          }}>
            {result !== 'Kết quả AI trả lời' && (
              <>
                
                <button
                  className={styles.publishButton}
                  style={{ backgroundColor: '#52c41a' }}
                  onClick={() => setAnalysisResultModalOpen(true)}
                >
                  Xem kết quả phân tích
                </button>
               
              </>
            )}

          </div> 
          */}

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '250px 20px 20px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Loading3DTower />
              <div style={{ marginTop: '10px' }}>Đang xử lý yêu cầu...</div>
            </div>
          ) : result !== 'Kết quả AI trả lời' ? (
            <div className={styles.aiMainBottom} >
              {/* Tab Navigation and Publish Button */}
              <div style={{
                backgroundColor: '#1D5FAD',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#fff',
                borderRadius: '8px 8px 0 0',

              }}>
                {/* Tab Buttons - 50% width */}
                <div style={{
                  display: 'flex',
                  width: '50%'
                }}>
                  <button
                    onClick={() => setActiveTab('report')}
                    style={{
                      padding: '12px 20px',
                      marginRight: '8px',
                      border: 'none',
                      background: activeTab === 'report' ? '#1E5FAD' : '#f5f5f5',
                      color: activeTab === 'report' ? 'white' : '#666',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderRadius: '6px 6px 0 0',
                      borderBottom: activeTab === 'report' ? '3px solid #1E5FAD' : '3px solid transparent'
                    }}
                  >
                    NỘI DUNG
                  </button>
                  <button
                    onClick={() => setActiveTab('data')}
                    style={{
                      padding: '12px 20px',
                      border: 'none',
                      background: activeTab === 'data' ? '#1E5FAD' : '#f5f5f5',
                      color: activeTab === 'data' ? 'white' : '#666',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderRadius: '6px 6px 0 0',
                      borderBottom: activeTab === 'data' ? '3px solid #1E5FAD' : '3px solid transparent'
                    }}
                  >
                    DỮ LIỆU
                  </button>
                </div>

                {/* Publish Button - 50% width */}
                <div style={{
                  width: '50%',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    className={styles.publishButton}
                    onClick={handlePublish}
                  >
                    XUẤT BẢN
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div style={{
                background: '#fff',
                borderRadius: '0 0 8px 8px',
                borderTop: 'none',

              }}>
                {/* Report Tab */}
                {activeTab === 'report' && (
                  <div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: 24,
                      marginBottom: 12,
                      letterSpacing: 1,
                      color: '#fff',
                      padding: '20px 0 20px 15px',
                      backgroundColor: '#1D5FAD'
                    }}>

                      BÁO CÁO PHÂN TÍCH
                    </div>
                    <div>
                      {console.log(result)}
                    </div>
                    <div className={styles.aiAnswerContent}>
                      {/* Display JSON result with sections */}
                      {(() => {
                        try {
                          // Parse result to get sections
                          let parsedResult = null;
                          if (typeof result === 'string') {
                            // Remove markdown code block if present
                            let cleanResult = result;
                            if (result.includes('```json')) {
                              cleanResult = result.replace(/```json\s*/, '').replace(/\s*```$/, '');
                            } else if (result.includes('```')) {
                              cleanResult = result.replace(/```\s*/, '').replace(/\s*```$/, '');
                            }

                            // Try to parse JSON
                            const jsonMatch = cleanResult.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                              parsedResult = JSON.parse(jsonMatch[0]);
                            } else {
                              parsedResult = JSON.parse(cleanResult);
                            }
                          } else if (typeof result === 'object' && result !== null) {
                            parsedResult = result;
                          }

                          // Display sections if available
                          if (parsedResult && parsedResult.sections && Array.isArray(parsedResult.sections)) {
                            return (
                              <div>
                                {parsedResult.sections
                                  .sort((a, b) => a.order - b.order)
                                  .map((section, index) => (
                                    <div key={section.order} style={{ marginBottom: '30px', boxShadow: '0 0 10px 0#d2d2d2', borderRadius: '3px', border: '1px solid #d9d9d9' }}>
                                      {/* Section Title */}
                                      <div style={{
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        color: '#454545',
                                        marginBottom: '16px',
                                        padding: '12px 16px',
                                        backgroundColor: '#f2f2f2',
                                        borderRadius: '3px 3px 0 0',
                                        borderBottom: '3px solid #d9d9d9'
                                      }}>
                                        {section.order}. {section.title}
                                      </div>

                                      {/* Section Content */}
                                      <div
                                        className={styles.markedContent}
                                        style={{
                                          fontSize: '14px',
                                          lineHeight: '1.6',
                                          marginBottom: '16px'
                                        }}
                                        dangerouslySetInnerHTML={{
                                          __html: DOMPurify.sanitize(marked(section.textResult || ''))
                                        }}
                                      />

                                      {/* Data Requirements */}
                                      {section.dataRequirements && (
                                        <div style={{ marginTop: '16px' }}>

                                          {/* Display KPI Data */}
                                          {(section.dataRequirements.kpiSelected || []).map((kpiId, idx) => {
                                            const kpi = kpi2Calculators.find(k => k.id == kpiId);
                                            console.log('🔍 [AI NonPD] KPI:', kpi);
                                            if (!kpi) return null;

                                            return (
                                              <div key={`kpi-${kpiId}`} style={{ margin: '0 5px 16px 5px', backgroundColor: '#f2f2f2', borderRadius: '8px', padding: '5px', }}>
                                                <div style={{
                                                  padding: '8px 12px',
                                                  borderRadius: '6px',
                                                  marginBottom: '8px'
                                                }}>
                                                  <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    marginBottom: '4px'
                                                  }}>
                                                    <span style={{
                                                      fontWeight: '600',
                                                      color: '#1890ff',
                                                      fontSize: '13px'
                                                    }}>
                                                      {kpi.name}
                                                    </span>
                                                  </div>
                                                </div>

                                                {/* KPI Content Display */}
                                                <div style={{
                                                  borderRadius: '6px',
                                                  padding: '10px',
                                                  overflow: 'auto'
                                                }}>
                                                  <KPI2ContentView
                                                    selectedKpiId={kpiId}
                                                    showChart={true}
                                                    compact={true}
                                                  />
                                                </div>
                                              </div>
                                            );
                                          })}

                                          {/* Display Table Data */}
                                          {(section.dataRequirements.tableSelected || []).map((tableId, idx) => {
                                            let fileNote = approvedVersionData.find(f => {
                                              const versionSuffix = f.id_version && f.id_version !== 1 ? `_v${f.id_version}` : '';
                                              const aiCompatibleId = `${f.id_template}${versionSuffix}`;
                                              return aiCompatibleId === tableId || f.id === tableId;
                                            });

                                            if (!fileNote) return null;

                                            const dynamicColumnDefs = Object.keys(fileNote?.rows?.[0] || {}).map(key => {
                                              const sampleValue = fileNote.rows?.[0]?.[key];
                                              const isNumeric = typeof sampleValue === 'number' || !isNaN(Number(sampleValue));

                                              return {
                                                headerName: key,
                                                field: key,
                                                minWidth: 100,
                                                resizable: true,
                                                ...(isNumeric && {
                                                  aggFunc: 'sum',
                                                  enableValue: true,
                                                  cellDataType: 'numericColumn'
                                                })
                                              };
                                            });

                                            return (
                                              <div key={`table-${tableId}`} style={{ margin: '0 5px 16px 5px', backgroundColor: '#f2f2f2', borderRadius: '8px', padding: '5px' }}>
                                                <div style={{
                                                  padding: '8px 12px',
                                                  borderRadius: '6px',
                                                  marginBottom: '8px'
                                                }}>
                                                  <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    marginBottom: '4px'
                                                  }}>

                                                    <span style={{
                                                      fontWeight: '600',
                                                      color: '#1890ff',
                                                      fontSize: '13px'
                                                    }}>
                                                      {fileNote.name}
                                                    </span>
                                                  </div>
                                                </div>

                                                {/* Table Content Display */}

                                                <div className="ag-theme-quartz" style={{
                                                  height: '400px',
                                                  width: '100%',
                                                  overflow: 'hidden',
                                                  padding: '5px',
                                                  position: 'relative'
                                                }}>
                                                  <AgGridReact
                                                    statusBar={statusBar}
                                                    enableRangeSelection={true}
                                                    rowData={fileNote.rows || []}
                                                    columnDefs={dynamicColumnDefs}
                                                    pagination={false}
                                                    defaultColDef={{
                                                      resizable: true,
                                                      sortable: true,
                                                      filter: true,
                                                    }}
                                                    onGridReady={params => {
                                                      try {
                                                        params.api.autoSizeAllColumns();
                                                      } catch (error) {
                                                        console.warn('Error in grid ready:', error);
                                                      }
                                                    }}
                                                    onFirstDataRendered={params => {
                                                      try {
                                                        params.api.autoSizeAllColumns();
                                                      } catch (error) {
                                                        console.warn('Error in first data rendered:', error);
                                                      }
                                                    }}
                                                    localeText={AG_GRID_LOCALE_VN}
                                                  />
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            );
                          }
                        } catch (error) {
                          console.error('Error parsing result:', error);
                        }

                        // Fallback to normal display
                        return (
                          <div
                            className={styles.markedContent}
                            dangerouslySetInnerHTML={{
                              __html: (() => {
                                try {
                                  let contentToRender = '';
                                  if (typeof result === 'string') {
                                    contentToRender = result;
                                  } else if (typeof result === 'object' && result !== null) {
                                    contentToRender = `\u0060\u0060\u0060json\n${JSON.stringify(result, null, 2)}\n\u0060\u0060\u0060`;
                                  } else {
                                    contentToRender = String(result || '');
                                  }
                                  return DOMPurify.sanitize(marked(contentToRender));
                                } catch (error) {
                                  const fallbackContent = typeof result === 'string'
                                    ? result
                                    : JSON.stringify(result, null, 2);
                                  return DOMPurify.sanitize(`<pre>${fallbackContent}</pre>`);
                                }
                              })()
                            }}
                          />
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Data Tab */}
                {activeTab === 'data' && (
                  <div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: 24,
                      marginBottom: 12,
                      letterSpacing: 1,
                      color: '#fff',
                      padding: '20px 0 20px 15px',
                      backgroundColor: '#1D5FAD'
                    }}>
                      PHỤ LỤC DỮ LIỆU
                    </div>
                    {Object.entries(viewingData)
                      .filter(([key]) => key !== '_descriptions')
                      .map(([tableName, tableData], tableIndex) => {
                        let displayTableName = tableName;
                        const tMatch = /^T(\d+)$/.exec(tableName);
                        if (tMatch) {
                          displayTableName = `Bảng ${tMatch[1]}`;
                        }
                        const description = viewingData._descriptions?.[tableName] || displayTableName;
                        const rowCount = Array.isArray(tableData) ? tableData.length : 0;
                        const sampleRow = Array.isArray(tableData) && tableData.length > 0 ? tableData[0] : {};
                        const columnCount = Object.keys(sampleRow).length;
                        return (
                          <div key={tableName} style={{
                            marginBottom: '24px',
                            padding: '16px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '8px',
                            backgroundColor: '#fafafa'
                          }}>
                            <div style={{ marginBottom: '12px' }}>
                              <h6 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#333' }}>
                                📋 {displayTableName}
                              </h6>
                              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>{description}</div>
                              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#888' }}>
                                <span>📊 {rowCount} dòng</span>
                                <span>📋 {columnCount} cột</span>
                              </div>
                            </div>
                            <div style={{ width: '100%' }}>
                              {Array.isArray(tableData) && tableData.length > 0 ? (
                                <div>
                                  <div style={{
                                    backgroundColor: '#f5f5f5',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    marginBottom: '12px',
                                    fontSize: '13px',
                                    color: '#666'
                                  }}>
                                    Tổng cộng: {tableData.length} dòng • {Object.keys(tableData[0] || {}).length} cột
                                  </div>
                                  <div
                                    className="ag-theme-quartz"
                                    style={{
                                      height: '400px',
                                      width: '100%',
                                      border: '1px solid #d9d9d9',
                                      borderRadius: '6px',
                                      overflow: 'hidden',
                                      position: 'relative'
                                    }}
                                  >
                                    <AgGridReact
                                      statusBar={statusBar}
                                      enableRangeSelection={true}
                                      rowData={tableData}
                                      columnDefs={Object.keys(tableData[0] || {}).map(key => ({
                                        field: key,
                                        headerName: key,
                                        width: 150,
                                        sortable: true,
                                        filter: true,
                                        resizable: true,
                                        valueFormatter: (params) => {
                                          if (typeof params.value === 'object') {
                                            return JSON.stringify(params.value);
                                          }
                                          return String(params.value || '');
                                        }
                                      }))}
                                      defaultColDef={{
                                        sortable: true,
                                        filter: true,
                                        resizable: true,
                                        minWidth: 100,
                                      }}
                                      onGridReady={params => {
                                        try {
                                          params.api.autoSizeAllColumns();
                                        } catch (error) {
                                          console.warn('Error in grid ready:', error);
                                        }
                                      }}
                                      onFirstDataRendered={params => {
                                        try {
                                          params.api.autoSizeAllColumns();
                                        } catch (error) {
                                          console.warn('Error in first data rendered:', error);
                                        }
                                      }}
                                      localeText={AG_GRID_LOCALE_VN}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                  Không có dữ liệu để hiển thị
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Wrench className={styles.emptyStateIcon} />
              <p className={styles.emptyStateText}>Run a job to see analysis results</p>
              {prompt && (
                <div className={styles.currentPrompt}>
                  <p className={styles.currentPromptLabel}>Current prompt:</p>
                  <p className={styles.currentPromptText}>
                    {highlightSpecialChars(prompt)}
                  </p>
                  {hasUnresolvedSpecialChars(prompt) && (
                    <div style={{
                      marginTop: '8px',
                      padding: '6px 8px',
                      backgroundColor: '#fff7e6',
                      border: '1px solid #ffd591',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#d48806'
                    }}>
                      ⚠️ Template chưa hoàn thành: {getUnresolvedSpecialChars(prompt).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Progress & History */}
        <div className={styles.reportBuilderRight}>
          <div className={styles.progressSection}>
            {/* Queue Progress */}
            {queueLength > 0 && (
              <div className={styles.progressPanel}>
                <div className={styles.progressHeader}>
                  <Clock className={`${styles.h4} ${styles.w4} ${styles.iconBlue500}`} />
                  <h4 className={styles.panelSubHeader}>Đang xử lý ({queueLength} yêu cầu)</h4>
                </div>
                <div className={styles.progressList}>
                  {analyzeQueue.map((item, index) => (
                    <div key={index} className={styles.progressItem}>
                      <div className={styles.progressTitle}>
                        {item.prompt.substring(0, 30)}...
                      </div>
                      <div className={styles.progressTime}>
                        {new Date(item.timestamp).toLocaleTimeString('vi-VN')}
                      </div>
                      <div className={styles.mt1}>
                        <div className={styles.progressBar}>
                          <div className={styles.progressBarFill} style={{ width: index === 0 ? '70%' : '10%' }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis History */}
            <div className={styles.progressPanel}>
              <div className={styles.progressHeader}>
                <History className={`${styles.h4} ${styles.w4} ${styles.iconGray500}`} />
                <h4 className={styles.panelSubHeader}>Lịch sử phân tích</h4>
              </div>
              <div className={styles.progressList}>
                {loadingHistory ? (
                  <Spin size="small" />
                ) : chatHistory.length === 0 ? (
                  <p className={`${styles.textXs} ${styles.textGray500}`}>Chưa có lịch sử phân tích</p>
                ) : (
                  chatHistory.map((item) => {
                    const hasFiles = item.more_info?.files && item.more_info.files.length > 0;
                    return (
                      <Dropdown
                        key={item.id}
                        menu={{
                          items: [
                            hasFiles && {
                              key: 'useFiles',
                              label: (
                                <div
                                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                  onClick={() => {
                                    setUploadedFiles(item.more_info.files);
                                    setIsUsingUploadedData(true);
                                    if (item.more_info?.originalData && item.more_info.isUploadedData) {
                                      setUploadedFileData(item.more_info.originalData);
                                      setViewingData(item.more_info.originalData);
                                    }
                                    setPrompt('');
                                    setResult('Kết quả AI trả lời');
                                    setSelectedHistoryId(null);
                                    setSelectedQueueItem(null);
                                    setData([]);
                                    setChartConfig(null);
                                    setMultipleCharts([]);
                                    message.success(`Đã tái sử dụng ${item.more_info.files.length} file từ lịch sử`);
                                  }}
                                >
                                  <Paperclip size={16} />
                                  <span>Dùng file này</span>
                                </div>
                              ),
                            },
                            {
                              key: 'delete',
                              danger: true,
                              label: (
                                <Popconfirm
                                  title='Xóa lịch sử'
                                  description='Bạn có chắc chắn muốn xóa lịch sử này?'
                                  onConfirm={() => handleDeleteHistory(item.id)}
                                  okText='Có'
                                  cancelText='Không'
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Trash2 size={16} />
                                    <span>Xóa</span>
                                  </div>
                                </Popconfirm>
                              ),
                            }
                          ].filter(Boolean)
                        }}
                        trigger={['contextMenu']}
                      >
                        <div className={styles.historyItem}>
                          <button
                            onClick={() => handleSelectHistory(item)}
                            className={styles.historyButton}
                            style={{
                              backgroundColor: selectedHistoryId === item.id ? '#e6f7ff' : 'transparent',
                              borderColor: selectedHistoryId === item.id ? '#1677ff' : 'transparent',
                            }}
                          >
                            <div className={styles.historyTitle}>
                              {hasFiles && (
                                <span style={{
                                  color: '#1890ff',
                                  marginRight: 4,
                                  fontSize: '12px'
                                }}>
                                  📎
                                </span>
                              )}
                              {item.more_info?.templateBased && (
                                <span style={{
                                  color: '#52c41a',
                                  marginRight: 4,
                                  fontSize: '13px'
                                }} title={`Template: ${item.more_info.templateName}`}>
                                  <FileText size={17} color="#555" />
                                </span>
                              )}
                              <span style={{fontSize: '15px'}}> {item.quest.length > 80
                                ? `${item.quest.substring(0, 80)}...`
                                : item.quest
                              }

                              </span>
                             
                            </div>
                            <div className={styles.historyTime}>
                              {formatTimeAgo(item.create_at)}
                              {hasFiles && (
                                <span style={{
                                  color: '#52c41a',
                                  fontSize: '10px',
                                  marginLeft: '8px'
                                }}>
                                  {item.more_info.files.length} file
                                </span>
                              )}
                              {item.more_info?.templateBased && (
                                <span style={{
                                  color: '#52c41a',
                                  fontSize: '10px',
                                  marginLeft: '8px'
                                }}>
                                  T: {item.more_info.templateName}
                                </span>
                              )}
                            </div>
                          </button>
                        </div>
                      </Dropdown>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditJobModal
        editingJob={editingJob}
        setEditingJob={setEditingJob}
        onSave={handleSaveJob}
        onCancel={handleCancelEdit}
      />

      <EditTemplateModal
        editingTemplate={editingTemplate}
        setEditingTemplate={setEditingTemplate}
        onSave={handleSaveTemplate}
        onCancel={handleCancelTemplateEdit}
        fileNotesFull={approvedVersionData}
        kpi2Calculators={kpi2Calculators}
        onAutoGeneratedPromptCreated={handleAutoGeneratedPromptCreated}
      />

      <NewTemplateModal
        showNewTemplate={showNewTemplate}
        newTemplate={newTemplate}
        setNewTemplate={setNewTemplate}
        onSave={handleSaveNewTemplate}
        onCancel={handleCancelNewTemplate}
        fileNotesFull={approvedVersionData}
        kpi2Calculators={kpi2Calculators}
        onAutoGeneratedPromptCreated={handleAutoGeneratedPromptCreated}
      />

      <DataModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          // Don't reset selectedTemplate here - keep current selection
        }}
        fileNotesFull={approvedVersionData}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        selectedFileNote={selectedFileNote}
        checkedItems={checkedItems}
        setCheckedItems={setCheckedItems}
        onFileNoteUpdate={handleFileNoteUpdate}
        updateFilteredStates={updateFilteredStates}
        templates={templates}
        onTemplateRun={handleTemplateRun}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        onTemplatesUpdate={setTemplates}
      />

      {/* Publish Confirmation Modal */}
      <Modal
        title="Xác nhận xuất bản báo cáo"
        open={publishModalOpen}
        onOk={confirmPublish}
        onCancel={() => {
          setPublishModalOpen(false);
          setPublishingHistoryId(null);
        }}
        okText="Xuất bản"
        cancelText="Hủy"
        okButtonProps={{
          style: { backgroundColor: '#1890ff', borderColor: '#1890ff' }
        }}
      >
        <p>Bạn có chắc chắn muốn xuất bản phân tích này thành báo cáo?</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          Báo cáo sẽ được tạo mới và hiển thị trong tab Reports với khả năng chỉnh sửa.
        </p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          Báo cáo bao gồm: nội dung phân tích, biểu đồ và bảng dữ liệu.
        </p>
      </Modal>

      {/* AI Configuration Modal */}
      <AIForm
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          loadSystemMessages(); // Reload system messages after closing
        }}
        prompt={prompt}
        setPrompt={setPrompt}
        systemMessage1={systemMessage1}
        setSystemMessage1={setSystemMessage1}
        systemMessage2={systemMessage2}
        setSystemMessage2={setSystemMessage2}
        systemMessage3={systemMessage3}
        setSystemMessage3={setSystemMessage3}
        onAnalyze={() => analyze().then()}
        onViewData={() => setModalOpen(true)}
        autoGeneratedPrompt={autoGeneratedPrompt}
      />
      <style>{`
        .highlight-special {
          color: #ff4d4f;
          background: #fff2f0;
          font-weight: 600;
          border-radius: 3px;
        }
        .react-simple-code-editor {
          white-space: pre-wrap;
          word-break: break-word;
        }
      `}</style>
    </>
  );
};

export default ReportBuilderNonPD;
