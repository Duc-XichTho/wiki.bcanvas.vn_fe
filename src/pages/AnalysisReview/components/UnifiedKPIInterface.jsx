import React, { useContext, useEffect, useState } from 'react';
import { message } from 'antd';
import { MyContext } from '../../../MyContext';
import styles from './UnifiedKPIInterface.module.css';
import { Search } from 'lucide-react';
// COMPONENT
// API
import { getAllApprovedVersion } from '../../../apis/approvedVersionTemp.jsx';
import {
  createKpi2Calculator,
  deleteKpi2Calculator,
  getAllKpi2Calculator,
  getKpi2CalculatorById,
  updateKpi2Calculator,
} from '../../../apis/kpi2CalculatorService';
import { createKpiCalculator, getAllKpiCalculator, getKpiCalculatorById } from '../../../apis/kpiCalculatorService';
import { getAllVar } from '../../../generalFunction/calculateDataBaoCao/getAllDataBaoCao';
import TagInput from '../../../components/TagInput/TagInput.jsx';
import { getSettingByType } from '../../../apis/settingService.jsx';
import { createTimestamp } from '../../../generalFunction/format.js';
import { fetchAllKpiMetrics } from '../../../apis/kpiMetricService';
import { fetchAllMeasures } from '../../../apis/measureService';
import { fetchAllBusinessCategories } from '../../../apis/businessCategoryService';
import { createDashBoardItem, getAllDashBoardItems } from '../../../apis/dashBoardItemService.jsx';
import { getAllKpiBenchmark } from '../../../apis/kpiBenchmarkService';
import { AgGridReact } from 'ag-grid-react';
import AG_GRID_LOCALE_VN from '../../Home/AgridTable/locale.jsx';
import KPI2Content from '../../Canvas/CanvasFolder/KPI2Calculator/KPI2Content.jsx';
import KPIContent from '../../Canvas/CanvasFolder/KPICalculator/KPIContent.jsx';

const UnifiedKPIInterface = () => {
  let { loadDataSoKeToan, listCompany, listYear, currentUser } = useContext(MyContext);
  
  // States for KPI2Calculator (Chỉ số)
  const [kpi2List, setKpi2List] = useState([]);
  const [selectedKpi2, setSelectedKpi2] = useState(null);
  const [kpi2SearchTerm, setKpi2SearchTerm] = useState('');
  const [kpi2Loading, setKpi2Loading] = useState(false);
  const [sortKpi2UpdatedAt, setSortKpi2UpdatedAt] = useState('desc');
  
  // States for KPICalculator (Đo lường)
  const [kpiList, setKpiList] = useState([]);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [kpiSearchTerm, setKpiSearchTerm] = useState('');
  const [kpiLoading, setKpiLoading] = useState(false);
  const [sortKpiUpdatedAt, setSortKpiUpdatedAt] = useState('desc');
  
  // Common states
  const [loading, setLoading] = useState(false);
  const [varList, setVarList] = useState([]);
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
  
  // Content states
  const [activeTab, setActiveTab] = useState("definition");
  const [contentType, setContentType] = useState(null); // 'kpi2' or 'kpi'
  
  // Highlight related KPIs
  const [highlightedKpiIds, setHighlightedKpiIds] = useState(new Set());
  // Highlight related KPI2 when a KPI is selected
  const [highlightedKpi2Ids, setHighlightedKpi2Ids] = useState(new Set());
  
  // Popup states for KPI2Calculator
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);
  const [kpi2ToDelete, setKpi2ToDelete] = useState(null);
  const [kpi2ToDuplicate, setKpi2ToDuplicate] = useState(null);
  const [duplicateKpi2Name, setDuplicateKpi2Name] = useState("");
  const [newKpi2Name, setNewKpi2Name] = useState("");
  const [newKpi2Tags, setNewKpi2Tags] = useState([]);
  const [duplicateKpi2Tags, setDuplicateKpi2Tags] = useState([]);
  const [showEditTagsPopup, setShowEditTagsPopup] = useState(false);
  const [kpi2ToEditTags, setKpi2ToEditTags] = useState(null);
  const [editKpi2Tags, setEditKpi2Tags] = useState([]);
  
  // Popup states for KPICalculator
  const [showCreateKpiPopup, setShowCreateKpiPopup] = useState(false);
  const [showDeleteKpiPopup, setShowDeleteKpiPopup] = useState(false);
  const [showDuplicateKpiPopup, setShowDuplicateKpiPopup] = useState(false);
  const [kpiToDelete, setKpiToDelete] = useState(null);
  const [kpiToDuplicate, setKpiToDuplicate] = useState(null);
  const [duplicateKpiName, setDuplicateKpiName] = useState("");
  const [newKpiName, setNewKpiName] = useState("");
  const [newKpiTags, setNewKpiTags] = useState([]);
  const [duplicateKpiTags, setDuplicateKpiTags] = useState([]);
  const [showEditKpiTagsPopup, setShowEditKpiTagsPopup] = useState(false);
  const [kpiToEditTags, setKpiToEditTags] = useState(null);
  const [editKpiTags, setEditKpiTags] = useState([]);
  
  // Additional states for KPI2Calculator features
  const [showKpiMapModal, setShowKpiMapModal] = useState(false);
  const [kpiMetrics, setKpiMetrics] = useState([]);
  const [selectedKpiMetrics, setSelectedKpiMetrics] = useState([]);
  const [kpiMapLoading, setKpiMapLoading] = useState(false);
  const [businessCategories, setBusinessCategories] = useState([]);
  const [selectedBusinessCategory, setSelectedBusinessCategory] = useState(null);
  const [filteredKpiMetrics, setFilteredKpiMetrics] = useState([]);
  const [allKpiMetrics, setAllKpiMetrics] = useState([]);
  const [allMeasures, setAllMeasures] = useState([]);
  const [existingKPIs, setExistingKPIs] = useState([]);
  const [kpiBenchmarks, setKpiBenchmarks] = useState([]);
  const [kpiMapSearchTerm, setKpiMapSearchTerm] = useState('');
  
  // Dashboard bulk create modal states
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [selectedDashboardKpis, setSelectedDashboardKpis] = useState([]);
  const [existingDashboardChartIds, setExistingDashboardChartIds] = useState(new Set());
  
  // Bulk benchmark editing modal states
  const [showBulkBenchmarkModal, setShowBulkBenchmarkModal] = useState(false);
  const [bulkBenchmarkLoading, setBulkBenchmarkLoading] = useState(false);
  const [bulkBenchmarkPeriod, setBulkBenchmarkPeriod] = useState('month');
  const [selectedBulkBenchmarkKpi, setSelectedBulkBenchmarkKpi] = useState(null);
  const [bulkBenchmarkTableData, setBulkBenchmarkTableData] = useState([]);
  const [bulkBenchmarkColDefs, setBulkBenchmarkColDefs] = useState([]);
  const [bulkBenchmarkRowData, setBulkBenchmarkRowData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Load color settings
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [kpi2Data, kpiData, vars] = await Promise.all([
        getAllKpi2Calculator(),
        getAllKpiCalculator(),
        getAllVar(listCompany, listYear, loadDataSoKeToan)
      ]);
      
      // Process KPI2Calculator data
      let approvedVersions = await getAllApprovedVersion();
      approvedVersions = approvedVersions.filter(version =>
        version.apps && version.apps.includes('analysis-review')
      );
      
      kpi2Data.forEach(e => {
        if (approvedVersions.some(version => e.id == version.id)) {
          e.created = true;
        }
      });
      
      setKpi2List(kpi2Data);
      setKpiList(kpiData);
      setVarList(vars);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // KPI2Calculator handlers
  const handleKpi2Select = async (kpi2) => {
    try {
      const kpi2Data = await getKpi2CalculatorById(kpi2.id);
      if (kpi2.created) {
        kpi2Data.created = true;
      }
      setSelectedKpi2(kpi2Data);
      setSelectedKpi(null); // Clear KPI selection
      setContentType('kpi2');
      
      // Highlight related KPICalculators
      if (kpi2Data.kpiList && Array.isArray(kpi2Data.kpiList)) {
        setHighlightedKpiIds(new Set(kpi2Data.kpiList));
      } else {
        setHighlightedKpiIds(new Set());
      }
      // Clear reverse highlights when focusing KPI2
      setHighlightedKpi2Ids(new Set());
    } catch (error) {
      console.error("Error fetching KPI2 details:", error);
    }
  };

  const handleKpi2Create = async () => {
    if (!newKpi2Name.trim()) return;

    try {
      setLoading(true);
      const newKpi2 = await createKpi2Calculator({
        name: newKpi2Name,
        tags: newKpi2Tags,
        created_at: createTimestamp(),
        updated_at: createTimestamp(),
      });
      setKpi2List([...kpi2List, { id: newKpi2.id, name: newKpi2.name, benchmark: {}, updated_at: createTimestamp() }]);
      await handleKpi2Select(newKpi2);
      setShowCreatePopup(false);
      setNewKpi2Name("");
      setNewKpi2Tags([]);
    } catch (error) {
      console.error("Error creating KPI2:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKpi2Delete = async () => {
    if (!kpi2ToDelete) return;

    try {
      setLoading(true);
      await deleteKpi2Calculator(kpi2ToDelete.id);
      setKpi2List((prevList) =>
        prevList.filter((kpi) => kpi.id !== kpi2ToDelete.id)
      );
      if (selectedKpi2?.id === kpi2ToDelete.id) {
        setSelectedKpi2(null);
        setContentType(null);
      }
    } catch (error) {
      console.error("Error deleting KPI2:", error);
    } finally {
      setShowDeletePopup(false);
      setKpi2ToDelete(null);
      setLoading(false);
    }
  };

  const handleKpi2Duplicate = async () => {
    if (!kpi2ToDuplicate || !duplicateKpi2Name.trim()) return;

    try {
      setLoading(true);
      const originalKpi2Data = await getKpi2CalculatorById(kpi2ToDuplicate.id);

      const newKpi2Data = {
        ...originalKpi2Data,
        name: duplicateKpi2Name,
        id: undefined,
        created_at: createTimestamp(),
        updated_at: createTimestamp(),
        kpiList: originalKpi2Data.kpiList || [],
        varList: originalKpi2Data.varList || [],
        period: originalKpi2Data.period || 'month',
        calc: originalKpi2Data.calc || '',
        benchmark: originalKpi2Data.benchmark || {},
        benchmark1_name: originalKpi2Data.benchmark1_name || '',
        benchmark2_name: originalKpi2Data.benchmark2_name || '',
        tags: duplicateKpi2Tags,
      };

      const duplicatedKpi2 = await createKpi2Calculator(newKpi2Data);
      setKpi2List((prevList) => [...prevList, duplicatedKpi2]);
      setSelectedKpi2(duplicatedKpi2);
      setContentType('kpi2');

      setShowDuplicatePopup(false);
      setKpi2ToDuplicate(null);
      setDuplicateKpi2Name("");
      setDuplicateKpi2Tags([]);
    } catch (error) {
      console.error("Error duplicating KPI2:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKpi2EditTags = async () => {
    if (!kpi2ToEditTags) return;

    try {
      setLoading(true);
      const updatedKpi2 = await updateKpi2Calculator({
        ...kpi2ToEditTags,
        tags: editKpi2Tags,
        updated_at: createTimestamp(),
      });

      setKpi2List((prevList) =>
        prevList.map((kpi) =>
          kpi.id === kpi2ToEditTags.id ? { ...kpi, tags: editKpi2Tags, updated_at: createTimestamp() } : kpi
        )
      );

      if (selectedKpi2?.id === kpi2ToEditTags.id) {
        setSelectedKpi2({ ...selectedKpi2, tags: editKpi2Tags });
      }

      setShowEditTagsPopup(false);
      setKpi2ToEditTags(null);
      setEditKpi2Tags([]);
    } catch (error) {
      console.error("Error updating KPI2 tags:", error);
    } finally {
      setLoading(false);
    }
  };

  // KPICalculator handlers
  const handleKpiSelect = async (kpi) => {
    try {
      const kpiData = await getKpiCalculatorById(kpi.id);
      setSelectedKpi(kpiData);
      setSelectedKpi2(null); // Clear KPI2 selection
      setContentType('kpi');
      setHighlightedKpiIds(new Set()); // Clear KPI highlights when selecting KPI
      // Highlight KPI2 calculators that contain this KPI id in their kpiList
      if (Array.isArray(kpi2List) && kpi?.id != null) {
        const related = kpi2List
          .filter(k2 => Array.isArray(k2.kpiList) && k2.kpiList.includes(kpi.id))
          .map(k2 => k2.id);
        setHighlightedKpi2Ids(new Set(related));
      } else {
        setHighlightedKpi2Ids(new Set());
      }
    } catch (error) {
      console.error("Error fetching KPI details:", error);
    }
  };

  const handleKpiCreate = async () => {
    if (!newKpiName.trim()) return;

    try {
      setLoading(true);
      const newKpi = await createKpiCalculator({
        name: newKpiName,
        tags: newKpiTags,
        created_at: createTimestamp(),
        updated_at: createTimestamp(),
      });
      setKpiList([...kpiList, { id: newKpi.id, name: newKpi.name, updated_at: createTimestamp() }]);
      await handleKpiSelect(newKpi);
      setShowCreateKpiPopup(false);
      setNewKpiName("");
      setNewKpiTags([]);
    } catch (error) {
      console.error("Error creating KPI:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKpiDelete = async () => {
    if (!kpiToDelete) return;

    try {
      setLoading(true);
      // Note: You'll need to implement deleteKpiCalculator API
      // await deleteKpiCalculator(kpiToDelete.id);
      setKpiList((prevList) =>
        prevList.filter((kpi) => kpi.id !== kpiToDelete.id)
      );
      if (selectedKpi?.id === kpiToDelete.id) {
        setSelectedKpi(null);
        setContentType(null);
      }
    } catch (error) {
      console.error("Error deleting KPI:", error);
    } finally {
      setShowDeleteKpiPopup(false);
      setKpiToDelete(null);
      setLoading(false);
    }
  };

  const handleKpiDuplicate = async () => {
    if (!kpiToDuplicate || !duplicateKpiName.trim()) return;

    try {
      setLoading(true);
      const originalKpiData = await getKpiCalculatorById(kpiToDuplicate.id);

      const newKpiData = {
        ...originalKpiData,
        name: duplicateKpiName,
        id: undefined,
        created_at: createTimestamp(),
        updated_at: createTimestamp(),
        tags: duplicateKpiTags,
      };

      const duplicatedKpi = await createKpiCalculator(newKpiData);
      setKpiList((prevList) => [...prevList, duplicatedKpi]);
      setSelectedKpi(duplicatedKpi);
      setContentType('kpi');

      setShowDuplicateKpiPopup(false);
      setKpiToDuplicate(null);
      setDuplicateKpiName("");
      setDuplicateKpiTags([]);
    } catch (error) {
      console.error("Error duplicating KPI:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKpiEditTags = async () => {
    if (!kpiToEditTags) return;

    try {
      setLoading(true);
      // Note: You'll need to implement updateKpiCalculator API
      // const updatedKpi = await updateKpiCalculator({
      //   ...kpiToEditTags,
      //   tags: editKpiTags,
      //   updated_at: createTimestamp(),
      // });

      setKpiList((prevList) =>
        prevList.map((kpi) =>
          kpi.id === kpiToEditTags.id ? { ...kpi, tags: editKpiTags, updated_at: createTimestamp() } : kpi
        )
      );

      if (selectedKpi?.id === kpiToEditTags.id) {
        setSelectedKpi({ ...selectedKpi, tags: editKpiTags });
      }

      setShowEditKpiTagsPopup(false);
      setKpiToEditTags(null);
      setEditKpiTags([]);
    } catch (error) {
      console.error("Error updating KPI tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKpi2NameUpdate = (kpi2Id, newName) => {
    setKpi2List((prevList) =>
      prevList.map((kpi) => {
        if (kpi.id == kpi2Id) {
          kpi = {
            ...kpi,
            name: newName,
            tableVersion: newName + ' - ' + new Date().toLocaleString(),
          };
        }
        return kpi;
      })
    );
  };

  const handleKpiNameUpdate = (kpiId, newName) => {
    setKpiList((prevList) =>
      prevList.map((kpi) => {
        if (kpi.id == kpiId) {
          kpi = {
            ...kpi,
            name: newName,
            tableVersion: newName + ' - ' + new Date().toLocaleString(),
          };
        }
        return kpi;
      })
    );
  };

  // KPI Map functions
  const handleOpenKpiMapModal = async () => {
    try {
      setKpiMapLoading(true);
      const [metrics, measures, categories, existingKPIs, benchmarks] = await Promise.all([
        fetchAllKpiMetrics(),
        fetchAllMeasures(),
        fetchAllBusinessCategories(),
        getAllKpi2Calculator(), // Lấy danh sách KPI2Calculator hiện có
        getAllKpiBenchmark() // Lấy danh sách KPI Benchmark
      ]);
      
      // Filter business categories based on user access
      let accessibleCategories = [];
      if (currentUser?.isAdmin || currentUser?.isSuperAdmin) {
        // Admin/SuperAdmin can access all categories
        accessibleCategories = categories;
      } else {
        // Regular users can only access categories they have permission for
        // This would need to be implemented based on your business logic
        // For now, we'll show all categories
        accessibleCategories = categories;
      }
      
      setBusinessCategories(accessibleCategories);
      setAllKpiMetrics(metrics);
      setAllMeasures(measures);
      setKpiBenchmarks(benchmarks);
      
      // Store existing KPIs for duplicate checking
      setExistingKPIs(existingKPIs);
      // Set first category as selected by default
      if (accessibleCategories.length > 0) {
        setSelectedBusinessCategory(accessibleCategories[0]);
        // Use accessibleCategories directly instead of state
        handleBusinessCategoryChangeWithData(accessibleCategories[0].id, accessibleCategories, metrics, measures);
        setKpiMapSearchTerm('');
      } else {
      }
      
      setShowKpiMapModal(true);
    } catch (error) {
      console.error('Error fetching KPI metrics:', error);
    } finally {
      setKpiMapLoading(false);
    }
  };

  const handleBusinessCategoryChangeWithData = (categoryId, categories, metrics, measures) => {
    const category = categories.find(cat => cat.id === categoryId);
    setSelectedBusinessCategory(category);
    
    // Filter metrics for this category
    const categoryMetrics = metrics.filter(metric => 
      metric.business_category_id === categoryId
    );
    
    // Enrich metrics with measure details
    const enrichedMetrics = categoryMetrics.map(metric => ({
      ...metric,
      measureDetails: metric.measures ? 
        metric.measures.map(measureId => 
          measures.find(measure => measure.id === measureId)
        ).filter(Boolean) : []
    }));
    
    setFilteredKpiMetrics(enrichedMetrics);
    setSelectedKpiMetrics([]); // Reset selection when changing category
    setKpiMapSearchTerm('');
  };

  const handleBusinessCategoryChange = (categoryId) => {
    const category = businessCategories.find(cat => cat.id === categoryId);
    setSelectedBusinessCategory(category);
    
    // Filter metrics for this category
    const categoryMetrics = allKpiMetrics.filter(metric => 
      metric.business_category_id === categoryId
    );
    
    // Enrich metrics with measure details
    const enrichedMetrics = categoryMetrics.map(metric => ({
      ...metric,
      measureDetails: metric.measures ? 
        metric.measures.map(measureId => 
          allMeasures.find(measure => measure.id === measureId)
        ).filter(Boolean) : []
    }));
    setFilteredKpiMetrics(enrichedMetrics);
    setSelectedKpiMetrics([]); // Reset selection when changing category
    setKpiMapSearchTerm('');
  };

  const handleKpiMetricSelect = (metricId) => {
    setSelectedKpiMetrics(prev => {
      if (prev.includes(metricId)) {
        return prev.filter(id => id !== metricId);
      } else {
        return [...prev, metricId];
      }
    });
  };

  const checkDuplicateNames = (name, existingItems) => {
    return existingItems.some(item => 
      item.name?.toLowerCase() === name.toLowerCase() ||
      item.tableVersion?.toLowerCase() === name.toLowerCase()
    );
  };

  const isKpiMetricAlreadyCreated = (metric, businessCategory) => {
    return existingKPIs.some(kpi => {
      const hasSameName = kpi.name?.toLowerCase() === metric.name.toLowerCase();
      const hasBusinessCategoryTag = kpi.tags?.includes(businessCategory.name);
      const hasMetricCategoryTag = kpi.tags?.includes(metric.category);
      
      return hasSameName && hasBusinessCategoryTag && hasMetricCategoryTag;
    });
  };

  const handleCreateFromKpiMap = async () => {
    if (selectedKpiMetrics.length === 0) return;

    try {
      setKpiMapLoading(true);
      
      // Get existing KPIs and KPICalculators for duplicate checking
      const existingKPIs = await getAllKpi2Calculator();
      const existingKpiCalculators = await getAllKpiCalculator();
      
      const createdKpi2Calculators = [];
      const duplicateNames = [];
      
      // Tạo KPI2Calculator cho mỗi KpiMetric được chọn
      for (const metricId of selectedKpiMetrics) {
        const metric = filteredKpiMetrics.find(m => m.id === metricId);
        if (metric && metric.measureDetails && metric.measureDetails.length > 0) {
          
          // Check for duplicate KPI2Calculator using same logic as isKpiMetricAlreadyCreated
          const businessCategoryTag = selectedBusinessCategory ? selectedBusinessCategory.name : '';
          const isAlreadyCreated = existingKPIs.some(kpi => {
            const hasSameName = kpi.name?.toLowerCase() === metric.name.toLowerCase();
            const hasBusinessCategoryTag = kpi.tags?.includes(businessCategoryTag);
            const hasMetricCategoryTag = kpi.tags?.includes(metric.category);
            
            return hasSameName && hasBusinessCategoryTag && hasMetricCategoryTag;
          });
          
          if (isAlreadyCreated) {
            duplicateNames.push(`KPI2Calculator: ${metric.name} (đã tồn tại với cùng business category và metric category)`);
            continue;
          }
          
           // Tạo KPICalculator cho mỗi Measure trong KpiMetric
           const kpiCalculatorsForKpiList = []; // Bao gồm cả mới tạo và đã tồn tại
           for (const measure of metric.measureDetails) {
             // Check for duplicate KPICalculator using same logic (name + tags)
             const existingKpiCalculator = existingKpiCalculators.find(kpi => {
               const hasSameName = kpi.name?.toLowerCase() === measure.name.toLowerCase() ||
                                   kpi.tableVersion?.toLowerCase() === measure.name.toLowerCase();
               const hasBusinessCategoryTag = kpi.tags?.includes(businessCategoryTag);
               const hasMetricCategoryTag = kpi.tags?.includes(metric.category);
               
               return hasSameName && hasBusinessCategoryTag && hasMetricCategoryTag;
             });
             
             if (existingKpiCalculator) {
               kpiCalculatorsForKpiList.push(existingKpiCalculator);
             } else {
               // Nếu chưa tồn tại, tạo mới
               const businessCategoryTag = selectedBusinessCategory ? selectedBusinessCategory.name : '';
               
               const kpiCalculatorData = {
                 name: measure.name,
                 description: measure.description || `Measure: ${measure.name}`,
                 tableVersion: measure.name,
                 tags: [
                   ...(measure.tags || []),
                   metric.category, // Sử dụng category thay vì tags
                   businessCategoryTag
                 ].filter(Boolean),
                created_at: createTimestamp(),
                updated_at: createTimestamp(),
              };
              
              const createdKpiCalculator = await createKpiCalculator(kpiCalculatorData);
              kpiCalculatorsForKpiList.push(createdKpiCalculator);
            }
          }

          if (kpiCalculatorsForKpiList.length > 0) {
            // Tạo KPI2Calculator với kpiList chứa các KPICalculator (Measures) vừa tạo
             const businessCategoryTag = selectedBusinessCategory ? selectedBusinessCategory.name : '';
             
            // Tự động tạo benchmark3 data cho mỗi KPI2Calculator
            const nowYear = new Date().getFullYear();
            let benchmarkData = {};

            // Lấy KPI Benchmark thực tế theo business category + kpiId (ưu tiên kpiId)
            const matchingBenchmark = kpiBenchmarks.find(bm => {
              const sameBusinessCategory = bm?.info?.business_category_id === selectedBusinessCategory?.id;
              const sameKpiById = bm?.info?.kpiId === metric.id; // ưu tiên khớp theo kpiId từ Metric Map
              const sameName = bm?.name?.toLowerCase?.() === metric.name?.toLowerCase?.();
              const sameCategory = bm?.category === metric.category;
              return sameBusinessCategory && (sameKpiById || (sameName && sameCategory));
            });

            const defaultBenchmarkValue = 100; // fallback
            for (let m = 1; m <= 12; m += 1) {
              const dateKey = `Tháng ${m}/${nowYear}`;
              const colKey = `col${m}`;
              const rawValue = matchingBenchmark?.data?.[colKey];
              const parsed = rawValue === undefined || rawValue === '' ? NaN : Number(rawValue);
              const value = Number.isFinite(parsed) ? parsed : defaultBenchmarkValue;
              benchmarkData[dateKey] = { benchmark3: value };
            }

            // Ghi kèm tên benchmark3
            benchmarkData.__benchmark3_name = `Market Benchmark`;

             // Lấy calc từ KpiMetrics nếu có, nếu không thì tạo mặc định
             let calcData = JSON.stringify({
               formula: '',
               variables: {}
             });
             
             if (metric.calc) {
               try {
                 // Parse calc từ KpiMetrics và chuyển đổi measure IDs sang KPI Calculator IDs
                 const parsedCalc = JSON.parse(metric.calc);
                 if (parsedCalc.formula && parsedCalc.variables) {
                   const convertedVariables = {};
                   
                   // Chuyển đổi measure IDs trong variables sang KPI Calculator IDs
                   Object.entries(parsedCalc.variables).forEach(([variable, config]) => {
                     if (config.type === 'measure' && config.id) {
                       // Tìm KPI Calculator tương ứng với measure ID
                       // Dựa vào thứ tự tạo KPI Calculator từ measureDetails
                       const measureIndex = metric.measureDetails.findIndex(measure => measure.id === parseInt(config.id));
                       if (measureIndex !== -1 && kpiCalculatorsForKpiList[measureIndex]) {
                         convertedVariables[variable] = {
                           type: 'kpi',
                           id: kpiCalculatorsForKpiList[measureIndex].id
                         };
                       }
                     } else {
                       // Giữ nguyên nếu không phải measure type
                       convertedVariables[variable] = config;
                     }
                   });
                   
                   calcData = JSON.stringify({
                     formula: parsedCalc.formula,
                     variables: convertedVariables
                   });
                 }
               } catch (error) {
                 console.error('Error parsing calc from KpiMetrics:', error);
                 // Sử dụng calc mặc định nếu có lỗi
               }
             }

             const kpi2CalculatorData = {
               name: metric.name,
               desc: metric.description,
               tags: [
                 metric.category, // Sử dụng category thay vì tags
                 businessCategoryTag
               ].filter(Boolean),
              kpiList: kpiCalculatorsForKpiList.map(kpi => kpi.id),
              varList: [],
              period: 'month',
              calc: calcData,
              benchmark: benchmarkData,
              benchmark3_name: `${metric.name} - Benchmark`,
              created_at: createTimestamp(),
              updated_at: createTimestamp(),
            };

            const newKpi2Calculator = await createKpi2Calculator(kpi2CalculatorData);
            createdKpi2Calculators.push(newKpi2Calculator);
          }
        }
      }
      
      // Show warning if there are duplicates
      if (duplicateNames.length > 0) {
        alert(`Các mục sau đã tồn tại và được bỏ qua:\n${duplicateNames.join('\n')}`);
      }
      
      // Cập nhật danh sách với tất cả KPI2Calculator vừa tạo
      if (createdKpi2Calculators.length > 0) {
        setKpi2List(prev => [...prev, ...createdKpi2Calculators]);

        // Refresh danh sách KPICalculators để hiển thị tên ngay ở KPI2Content
        try {
          const updatedKPICalculatorList = await getAllKpiCalculator();
          setKpiList(updatedKPICalculatorList);
        } catch (e) {
          console.error('Error refreshing KPICalculators after creation:', e);
        }

        // Chọn KPI2Calculator đầu tiên vừa tạo
        await handleKpi2Select(createdKpi2Calculators[0]);
      }
      
      // Đóng modal và reset
      setShowKpiMapModal(false);
      setSelectedKpiMetrics([]);
      
    } catch (error) {
      console.error('Error creating KPIs from KPI Map:', error);
    } finally {
      setKpiMapLoading(false);
    }
  };

  // Bulk benchmark editing functions
  const handleBulkBenchmarkKpiSelect = async (kpi) => {
    try {
      setBulkBenchmarkLoading(true);
      setSelectedBulkBenchmarkKpi(kpi);
      
      // Get detailed KPI data
      const kpiData = await getKpi2CalculatorById(kpi.id);
      
      // Generate table data based on period
      const tableData = generateBulkBenchmarkTableData(kpiData, bulkBenchmarkPeriod);
      setBulkBenchmarkTableData(tableData);
      
      // Generate column definitions
      const colDefs = generateBulkBenchmarkColDefs(tableData);
      setBulkBenchmarkColDefs(colDefs);
      
      // Generate row data for AgGrid
      const rowData = generateBulkBenchmarkRowData(kpiData, tableData);
      setBulkBenchmarkRowData(rowData);
      
    } catch (error) {
      console.error('Error loading KPI data for bulk benchmark editing:', error);
    } finally {
      setBulkBenchmarkLoading(false);
    }
  };

  const generateBulkBenchmarkTableData = (kpiData, period) => {
    // Generate date range based on period
    const dates = [];
    const currentYear = new Date().getFullYear();
    
    if (period === 'month') {
      for (let i = 1; i <= 12; i++) {
        dates.push(`Tháng ${i}/${currentYear}`);
      }
    } else if (period === 'week') {
      for (let i = 1; i <= 52; i++) {
        dates.push(`Tuần ${i}/${currentYear}`);
      }
    } else if (period === 'day') {
      // Generate last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        dates.push(`${day}/${month}/${year}`);
      }
    }
    
    return dates;
  };

  const generateBulkBenchmarkColDefs = (dates) => {
    return [
      {
        headerName: 'Benchmark',
        field: 'benchmark',
        editable: false,
        width: 150,
        valueGetter: params => {
          if (params?.data?.benchmark === 'benchmark1') {
            return selectedBulkBenchmarkKpi?.benchmark1_name || 'Target 1';
          }
          if (params?.data?.benchmark === 'benchmark2') {
            return selectedBulkBenchmarkKpi?.benchmark2_name || 'Target 2';
          }
          if (params?.data?.benchmark === 'benchmark3') {
            return 'Market Benchmark';
          }
          return params.value;
        },
      },
      ...dates.map(date => ({
        headerName: date,
        field: date,
        editable: true,
        width: 120,
        cellStyle: { textAlign: 'right' },
        cellRenderer: (params) => {
          return params.value !== null && params.value !== undefined ? 
            Number(params.value).toLocaleString('vn-VN') : '';
        },
      })),
    ];
  };

  const generateBulkBenchmarkRowData = (kpiData, dates) => {
    const benchmarkData = kpiData.benchmark || {};
    const rowData = [];

    // Benchmark 1
    if (kpiData.benchmark1_name && kpiData.benchmark1_name.trim() !== '') {
      rowData.push({
        benchmark: 'benchmark1',
        ...dates.reduce((acc, date) => {
          acc[date] = benchmarkData[date]?.benchmark1 || null;
          return acc;
        }, {}),
      });
    }

    // Benchmark 2
    if (kpiData.benchmark2_name && kpiData.benchmark2_name.trim() !== '') {
      rowData.push({
        benchmark: 'benchmark2',
        ...dates.reduce((acc, date) => {
          acc[date] = benchmarkData[date]?.benchmark2 || null;
          return acc;
        }, {}),
      });
    }

    // Benchmark 3 - Always show if there's any benchmark3 data
    const hasBenchmark3Data = dates.some(date => {
      const v = benchmarkData[date]?.benchmark3;
      return v !== undefined && v !== null && v !== '';
    });
    if (hasBenchmark3Data) {
      rowData.push({
        benchmark: 'benchmark3',
        ...dates.reduce((acc, date) => {
          acc[date] = benchmarkData[date]?.benchmark3 || null;
          return acc;
        }, {}),
      });
    }

    return rowData;
  };

  const handleBulkBenchmarkCellValueChanged = (params) => {
    const { colDef, newValue, data } = params;
    const dateField = colDef.field;
    const benchmarkType = data.benchmark;

    if (!selectedBulkBenchmarkKpi.benchmark) {
      selectedBulkBenchmarkKpi.benchmark = {};
    }
    if (!selectedBulkBenchmarkKpi.benchmark[dateField]) {
      selectedBulkBenchmarkKpi.benchmark[dateField] = {};
    }

    selectedBulkBenchmarkKpi.benchmark[dateField][benchmarkType] = newValue;
    
    // Update local state
    setSelectedBulkBenchmarkKpi({ ...selectedBulkBenchmarkKpi });
  };

  const handleBulkBenchmarkSave = async () => {
    if (!selectedBulkBenchmarkKpi) return;

    try {
      setBulkBenchmarkLoading(true);
      
      await updateKpi2Calculator({
        id: selectedBulkBenchmarkKpi.id,
        benchmark: selectedBulkBenchmarkKpi.benchmark,
      });

      // Update the main kpi2List
      setKpi2List(prev => prev.map(kpi => 
        kpi.id === selectedBulkBenchmarkKpi.id ? selectedBulkBenchmarkKpi : kpi
      ));

      // Update selectedKpi2 if it's the same one
      if (selectedKpi2?.id === selectedBulkBenchmarkKpi.id) {
        setSelectedKpi2(selectedBulkBenchmarkKpi);
      }

      message.success('Đã lưu benchmark thành công');
      
    } catch (error) {
      console.error('Error saving bulk benchmark:', error);
      message.error('Lỗi khi lưu benchmark');
    } finally {
      setBulkBenchmarkLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* KPI2Calculator Sidebar (20%) */}
      <div className={styles.kpi2Sidebar}>
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}>Chỉ số</h3>
            <div className={styles.headerButtons}>
              <button
                className={styles.createButton}
                onClick={() => setShowCreatePopup(true)}
              >
                + Tạo mới
              </button>
            </div>
          </div>

          <div className={styles.searchContainer}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Tìm chỉ số..."
              value={kpi2SearchTerm}
              onChange={(e) => setKpi2SearchTerm(e.target.value)}
            />
            <Search size={20} style={{ position: 'absolute', right: 15, top: 6, zIndex: 1000, color: '#13C2C2' }} />
          </div>

          <div className={styles.kpiList}>
            {kpi2Loading && <div className={styles.loading}>Loading...</div>}
            {!kpi2Loading && kpi2List.length === 0 && (
              <div className={styles.emptyState}>No KPIs found</div>
            )}
            {!kpi2Loading &&
              kpi2List
                .filter((k) => {
                  const searchTerm = kpi2SearchTerm.toLowerCase().trim();
                  if (!searchTerm) return true;
                  const nameMatch = (k.name || '').toString().toLowerCase().includes(searchTerm);
                  const tagMatch = (k.tags || []).some(tag => tag.toLowerCase().includes(searchTerm));
                  return nameMatch || tagMatch;
                })
                .sort((a, b) => {
                  // Prioritize KPI2 that contain the selected KPI
                  const aHighlighted = highlightedKpi2Ids.has(a.id);
                  const bHighlighted = highlightedKpi2Ids.has(b.id);
                  if (aHighlighted && !bHighlighted) return -1;
                  if (!aHighlighted && bHighlighted) return 1;
                  // Then fallback to updated time
                  const toMs = (v) => {
                    if (!v) return 0;
                    const t = new Date(v).getTime();
                    return isNaN(t) ? 0 : t;
                  };
                  const ams = toMs(a.updated_at);
                  const bms = toMs(b.updated_at);
                  return sortKpi2UpdatedAt === 'desc' ? bms - ams : ams - bms;
                })
                .map((kpi) => (
                  <div
                    key={kpi.id}
                    className={`${styles.kpiItem} ${selectedKpi2?.id === kpi.id ? styles.kpiItemActive : ""} ${highlightedKpi2Ids.has(kpi.id) ? styles.kpiItemHighlighted : ""}`}
                    onClick={() => handleKpi2Select(kpi)}
                  >
                    <div className={styles.kpiItemContent}>
                      <div className={styles.kpiItemNameContainer}>
                        <span className={styles.kpiItemName} title={kpi.name}>{kpi.name}</span>
                        {kpi.tags && kpi.tags.length > 0 && (
                          <div className={styles.kpiItemTags}>
                            {kpi.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className={styles.kpiTag} title={tag}>
                                {tag}
                              </span>
                            ))}
                            {kpi.tags.length > 3 && (
                              <span className={styles.kpiTagMore}>
                                +{kpi.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.kpiItemActions}>
                      <button
                        className={styles.editTagsButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setKpi2ToEditTags(kpi);
                          setEditKpi2Tags(kpi.tags || []);
                          setShowEditTagsPopup(true);
                        }}
                        title="Edit Tags"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className={styles.editTagsIcon}>
                          <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                        </svg>
                      </button>
                      <button
                        className={styles.duplicateButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setKpi2ToDuplicate(kpi);
                          setDuplicateKpi2Name(kpi.name + " - Copy");
                          setDuplicateKpi2Tags(kpi.tags || []);
                          setShowDuplicatePopup(true);
                        }}
                        title="Duplicate KPI"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className={styles.duplicateIcon}>
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setKpi2ToDelete(kpi);
                          setShowDeletePopup(true);
                        }}
                        title="Delete KPI"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.deleteIcon}>
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
          </div>
          
          <div className={styles.buttonGroup}>
            <button
              className={styles.kpiMapButton}
              onClick={handleOpenKpiMapModal}
              disabled={kpiMapLoading}
              title="Lấy chỉ số từ bản đồ KPI"
            >
              {kpiMapLoading ? 'Đang tải...' : 'Lấy chỉ số từ bản đồ KPI'}
            </button> <button
              className={styles.dashboardButton}
              onClick={async () => {
                try {
                  setDashboardLoading(true);
                  // Refresh KPI list to include newly created KPIs
                  await fetchData();
                  // Fetch existing dashboard items and build a set of idData for type 'chart'
                  const allItems = await getAllDashBoardItems();
                  const chartIds = new Set((Array.isArray(allItems) ? allItems : [])
                      .filter(it => it?.type === 'chart' && it?.idData != null)
                      .map(it => it.idData));
                  setExistingDashboardChartIds(chartIds);
                  setSelectedDashboardKpis([]);
                  setShowDashboardModal(true);
                } catch (e) {
                  console.error('Error loading dashboard items:', e);
                } finally {
                  setDashboardLoading(false);
                }
              }}
              disabled={dashboardLoading}
              title="Tạo thẻ chỉ số trong Dashboard"
          >
            {dashboardLoading ? 'Đang tải...' : 'Thẻ chỉ số trong Dashboard'}
          </button>
            <button
                className={styles.benchmarkButton}
                onClick={async () => {
                  try {
                    // Refresh KPI list to include newly created KPIs
                    await fetchData();
                    setShowBulkBenchmarkModal(true);
                    setSelectedBulkBenchmarkKpi(null);
                    setBulkBenchmarkTableData([]);
                    setBulkBenchmarkColDefs([]);
                    setBulkBenchmarkRowData([]);
                  } catch (error) {
                    console.error('Error refreshing KPIs for bulk benchmark modal:', error);
                    // Still open modal even if refresh fails
                    setShowBulkBenchmarkModal(true);
                    setSelectedBulkBenchmarkKpi(null);
                    setBulkBenchmarkTableData([]);
                    setBulkBenchmarkColDefs([]);
                    setBulkBenchmarkRowData([]);
                  }
                }}
                title="Chỉnh sửa benchmark hàng loạt"
            >
              Chỉnh sửa benchmark
            </button>
          </div>
        </div>
      </div>

      {/* KPICalculator Sidebar (20%) */}
      <div className={styles.kpiSidebar}>
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}>Đo lường</h3>
            <button
              className={styles.createButton}
              onClick={() => setShowCreateKpiPopup(true)}
            >
              + Tạo mới
            </button>
          </div>

          <div className={styles.searchContainer}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Tìm đo lường..."
              value={kpiSearchTerm}
              onChange={(e) => setKpiSearchTerm(e.target.value)}
            />
            <Search size={20} style={{ position: 'absolute', right: 15, top: 6, zIndex: 1000, color: '#13C2C2' }} />
          </div>

          <div className={styles.kpiList2}>
            {kpiLoading && <div className={styles.loading}>Loading...</div>}
            {!kpiLoading && kpiList.length === 0 && (
              <div className={styles.emptyState}>No KPIs found</div>
            )}
            {!kpiLoading &&
              kpiList
                .filter((k) => {
                  const searchTerm = kpiSearchTerm.toLowerCase().trim();
                  if (!searchTerm) return true;
                  const nameMatch = (k.name || '').toString().toLowerCase().includes(searchTerm);
                  const tagMatch = (k.tags || []).some(tag => tag.toLowerCase().includes(searchTerm));
                  return nameMatch || tagMatch;
                })
                .sort((a, b) => {
                  // Prioritize highlighted items first
                  const aHighlighted = highlightedKpiIds.has(a.id);
                  const bHighlighted = highlightedKpiIds.has(b.id);
                  
                  if (aHighlighted && !bHighlighted) return -1;
                  if (!aHighlighted && bHighlighted) return 1;
                  
                  // If both highlighted or both not highlighted, sort by date
                  const toMs = (v) => {
                    if (!v) return 0;
                    const t = new Date(v).getTime();
                    return isNaN(t) ? 0 : t;
                  };
                  const ams = toMs(a.updated_at);
                  const bms = toMs(b.updated_at);
                  return sortKpiUpdatedAt === 'desc' ? bms - ams : ams - bms;
                })
                .map((kpi) => (
                  <div
                    key={kpi.id}
                    className={`${styles.kpiItem} ${selectedKpi?.id === kpi.id ? styles.kpiItemActive : ""} ${highlightedKpiIds.has(kpi.id) ? styles.kpiItemHighlighted : ""}`}
                    onClick={() => handleKpiSelect(kpi)}
                  >
                    <div className={styles.kpiItemContent}>
                      <div className={styles.kpiItemNameContainer}>
                        <span className={styles.kpiItemName} title={kpi.name}>{kpi.name}</span>
                        {kpi.tags && kpi.tags.length > 0 && (
                          <div className={styles.kpiItemTags}>
                            {kpi.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className={styles.kpiTag} title={tag}>
                                {tag}
                              </span>
                            ))}
                            {kpi.tags.length > 3 && (
                              <span className={styles.kpiTagMore}>
                                +{kpi.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.kpiItemActions}>
                      <button
                        className={styles.editTagsButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setKpiToEditTags(kpi);
                          setEditKpiTags(kpi.tags || []);
                          setShowEditKpiTagsPopup(true);
                        }}
                        title="Edit Tags"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className={styles.editTagsIcon}>
                          <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                        </svg>
                      </button>
                      <button
                        className={styles.duplicateButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setKpiToDuplicate(kpi);
                          setDuplicateKpiName(kpi.name + " - Copy");
                          setDuplicateKpiTags(kpi.tags || []);
                          setShowDuplicateKpiPopup(true);
                        }}
                        title="Duplicate KPI"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className={styles.duplicateIcon}>
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setKpiToDelete(kpi);
                          setShowDeleteKpiPopup(true);
                        }}
                        title="Delete KPI"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.deleteIcon}>
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* Content Area (60%) */}
      <div className={styles.contentArea}>
        {contentType === 'kpi2' && selectedKpi2 ? (
          <KPI2Content
            selectedKpi={selectedKpi2}
            setSelectedKpi={setSelectedKpi2}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            KPICalculators={kpiList}
            varList={varList}
            fetchKPIs={fetchData}
            onNameUpdate={handleKpi2NameUpdate}
            selectedColors={selectedColors}
          />
        ) : contentType === 'kpi' && selectedKpi ? (
          <KPIContent
            selectedKpi={selectedKpi}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            monthlyData={selectedKpi}
            onSave={() => {}}
            onNameUpdate={handleKpiNameUpdate}
            templateList={[]}
            templateColumns={[]}
            templateData={[]}
            onTemplateChange={() => {}}
            selectedColors={selectedColors}
          />
        ) : (
          <div className={styles.emptyContent}>
            <div className={styles.emptyContentMessage}>
              <p>Vui lòng chọn một chỉ số hoặc đo lường từ danh sách bên trái để bắt đầu.</p>
            </div>
          </div>
        )}
      </div>

      {/* Popups for KPI2Calculator */}
      {showCreatePopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <h3 className={styles.popupTitle}>Tạo chỉ số mới</h3>
            <div className={styles.popupForm}>
              <label className={styles.label}>Tên chỉ số:</label>
              <input
                type="text"
                className={styles.input}
                value={newKpi2Name}
                onChange={(e) => setNewKpi2Name(e.target.value)}
                placeholder="Nhập tên chỉ số"
              />
              <label className={styles.label}>Tags:</label>
              <TagInput
                tags={newKpi2Tags}
                onTagsChange={setNewKpi2Tags}
                placeholder="Nhập tag và nhấn Enter"
                maxTags={10}
              />
            </div>
            <div className={styles.popupActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowCreatePopup(false);
                  setNewKpi2Name("");
                  setNewKpi2Tags([]);
                }}
              >
                Hủy
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleKpi2Create}
                disabled={!newKpi2Name.trim() || loading}
              >
                {loading ? "Đang tạo..." : "Tạo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeletePopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <h3 className={styles.popupTitle}>Xác nhận xóa</h3>
            <div className={styles.popupMessage}>
              Bạn có chắc chắn muốn xóa KPI "{kpi2ToDelete?.name}"?
              <br />
              <span className={styles.warningText}>
                Hành động này không thể hoàn tác.
              </span>
            </div>
            <div className={styles.popupActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowDeletePopup(false);
                  setKpi2ToDelete(null);
                }}
              >
                Hủy
              </button>
              <button
                className={`${styles.confirmButton} ${styles.deleteConfirmButton}`}
                onClick={handleKpi2Delete}
                disabled={loading}
              >
                {loading ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDuplicatePopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <h3 className={styles.popupTitle}>Sao chép KPI</h3>
            <div className={styles.popupForm}>
              <label className={styles.label}>Tên KPI sao chép:</label>
              <input
                type="text"
                className={styles.input}
                value={duplicateKpi2Name}
                onChange={(e) => setDuplicateKpi2Name(e.target.value)}
                placeholder="Nhập tên KPI sao chép"
              />
              <label className={styles.label}>Tags:</label>
              <TagInput
                tags={duplicateKpi2Tags}
                onTagsChange={setDuplicateKpi2Tags}
                placeholder="Nhập tag và nhấn Enter"
                maxTags={10}
              />
            </div>
            <div className={styles.popupActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowDuplicatePopup(false);
                  setKpi2ToDuplicate(null);
                  setDuplicateKpi2Name("");
                  setDuplicateKpi2Tags([]);
                }}
              >
                Hủy
              </button>
              <button
                className={`${styles.confirmButton} ${styles.duplicateConfirmButton}`}
                onClick={handleKpi2Duplicate}
                disabled={!duplicateKpi2Name.trim() || loading}
              >
                {loading ? "Đang sao chép..." : "Sao chép"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditTagsPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <h3 className={styles.popupTitle}>Chỉnh sửa Tags</h3>
            <div className={styles.popupForm}>
              <label className={styles.label}>KPI: {kpi2ToEditTags?.name}</label>
              <br />
              <label className={styles.label}>Tags:</label>
              <TagInput
                tags={editKpi2Tags}
                onTagsChange={setEditKpi2Tags}
                placeholder="Nhập tag và nhấn Enter"
                maxTags={10}
              />
            </div>
            <div className={styles.popupActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowEditTagsPopup(false);
                  setKpi2ToEditTags(null);
                  setEditKpi2Tags([]);
                }}
              >
                Hủy
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleKpi2EditTags}
                disabled={loading}
              >
                {loading ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popups for KPICalculator */}
      {showCreateKpiPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <h3 className={styles.popupTitle}>Tạo đo lường mới</h3>
            <div className={styles.popupForm}>
              <label className={styles.label}>Tên đo lường:</label>
              <input
                type="text"
                className={styles.input}
                value={newKpiName}
                onChange={(e) => setNewKpiName(e.target.value)}
                placeholder="Nhập tên đo lường"
              />
              <label className={styles.label}>Tags:</label>
              <TagInput
                tags={newKpiTags}
                onTagsChange={setNewKpiTags}
                placeholder="Nhập tag và nhấn Enter"
                maxTags={10}
              />
            </div>
            <div className={styles.popupActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowCreateKpiPopup(false);
                  setNewKpiName("");
                  setNewKpiTags([]);
                }}
              >
                Hủy
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleKpiCreate}
                disabled={!newKpiName.trim() || loading}
              >
                {loading ? "Đang tạo..." : "Tạo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteKpiPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <h3 className={styles.popupTitle}>Xác nhận xóa</h3>
            <div className={styles.popupMessage}>
              Bạn có chắc chắn muốn xóa đo lường "{kpiToDelete?.name}"?
              <br />
              <span className={styles.warningText}>
                Hành động này không thể hoàn tác.
              </span>
            </div>
            <div className={styles.popupActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowDeleteKpiPopup(false);
                  setKpiToDelete(null);
                }}
              >
                Hủy
              </button>
              <button
                className={`${styles.confirmButton} ${styles.deleteConfirmButton}`}
                onClick={handleKpiDelete}
                disabled={loading}
              >
                {loading ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDuplicateKpiPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <h3 className={styles.popupTitle}>Sao chép đo lường</h3>
            <div className={styles.popupForm}>
              <label className={styles.label}>Tên đo lường sao chép:</label>
              <input
                type="text"
                className={styles.input}
                value={duplicateKpiName}
                onChange={(e) => setDuplicateKpiName(e.target.value)}
                placeholder="Nhập tên đo lường sao chép"
              />
              <label className={styles.label}>Tags:</label>
              <TagInput
                tags={duplicateKpiTags}
                onTagsChange={setDuplicateKpiTags}
                placeholder="Nhập tag và nhấn Enter"
                maxTags={10}
              />
            </div>
            <div className={styles.popupActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowDuplicateKpiPopup(false);
                  setKpiToDuplicate(null);
                  setDuplicateKpiName("");
                  setDuplicateKpiTags([]);
                }}
              >
                Hủy
              </button>
              <button
                className={`${styles.confirmButton} ${styles.duplicateConfirmButton}`}
                onClick={handleKpiDuplicate}
                disabled={!duplicateKpiName.trim() || loading}
              >
                {loading ? "Đang sao chép..." : "Sao chép"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditKpiTagsPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <h3 className={styles.popupTitle}>Chỉnh sửa Tags</h3>
            <div className={styles.popupForm}>
              <label className={styles.label}>Đo lường: {kpiToEditTags?.name}</label>
              <br />
              <label className={styles.label}>Tags:</label>
              <TagInput
                tags={editKpiTags}
                onTagsChange={setEditKpiTags}
                placeholder="Nhập tag và nhấn Enter"
                maxTags={10}
              />
            </div>
            <div className={styles.popupActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowEditKpiTagsPopup(false);
                  setKpiToEditTags(null);
                  setEditKpiTags([]);
                }}
              >
                Hủy
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleKpiEditTags}
                disabled={loading}
              >
                {loading ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Map Modal */}
      {showKpiMapModal && (
        <div className={styles.popupOverlay}>
          <div className={styles.kpiMapModalContent}>
            <h3 className={styles.popupTitle}>Chọn chỉ số từ bản đồ KPI</h3>
            
            {kpiMapLoading ? (
              <div className={styles.loading}>Đang tải dữ liệu...</div>
            ) : (
              <>
                {/* Business Categories Tabs */}
                <div className={styles.businessCategoryTabs}>
                  {businessCategories.map((category) => (
                    <button
                      key={category.id}
                      className={`${styles.categoryTab} ${
                        selectedBusinessCategory?.id === category.id ? styles.categoryTabActive : ''
                      }`}
                      onClick={() => handleBusinessCategoryChange(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
                <div className={styles.searchContainer} style={{ marginTop: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Tìm kiếm theo tên..."
                    value={kpiMapSearchTerm}
                    onChange={(e) => setKpiMapSearchTerm(e.target.value)}
                  />
                  <Search size={18} style={{ position: 'absolute', right: 15, top: 6, zIndex: 1000, color: '#13C2C2' }} />
                </div>
                
                 <div className={styles.kpiMapList}>
                   {filteredKpiMetrics
                     .filter(metric => {
                       const term = kpiMapSearchTerm.toLowerCase().trim();
                       if (!term) return true;
                       const inName = (metric.name || '').toLowerCase().includes(term);
                       const inCategory = (metric.category || '').toLowerCase().includes(term);
                       return inName || inCategory;
                     })
                     .map((metric) => {
                     const isAlreadyCreated = isKpiMetricAlreadyCreated(metric, selectedBusinessCategory);
                     return (
                       <div
                         key={metric.id}
                         className={`${styles.kpiMapItem} ${
                           selectedKpiMetrics.includes(metric.id) ? styles.kpiMapItemSelected : ''
                         } ${isAlreadyCreated ? styles.kpiMapItemDisabled : ''}`}
                         onClick={() => !isAlreadyCreated && handleKpiMetricSelect(metric.id)}
                       >
                         <input
                           type="checkbox"
                           checked={selectedKpiMetrics.includes(metric.id)}
                           onChange={() => !isAlreadyCreated && handleKpiMetricSelect(metric.id)}
                           className={styles.kpiMapCheckbox}
                           disabled={isAlreadyCreated}
                         />
                       <div className={styles.kpiMapItemContent}>
                         <div className={styles.kpiMapItemName}>
                           {metric.name}
                           {isAlreadyCreated && (
                             <span className={styles.alreadyCreatedBadge}>Đã tạo</span>
                           )}
                         </div>
                         {metric.description && (
                           <div className={styles.kpiMapItemDescription}>{metric.description}</div>
                         )}
                        <div className={styles.kpiMapItemMeasures}>
                          {metric.measureDetails && metric.measureDetails.length > 0 && (
                            <div className={styles.measuresList}>
                              {metric.measureDetails.slice(0, 3).map((measure, index) => (
                                <span key={index} className={styles.measureTag}>
                                  {measure.name}
                                </span>
                              ))}
                              {metric.measureDetails.length > 3 && (
                                <span className={styles.measureTagMore}>
                                  +{metric.measureDetails.length - 3} khác
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {metric.tags && metric.tags.length > 0 && (
                          <div className={styles.kpiMapItemTags}>
                            {metric.tags.map((tag, index) => (
                              <span key={index} className={styles.kpiMapTag}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
                
                 <div className={styles.popupActions}>
                   <button
                     className={styles.cancelButton}
                     onClick={() => {
                       setShowKpiMapModal(false);
                       setSelectedKpiMetrics([]);
                     }}
                   >
                     Hủy
                   </button>
                   <button
                     className={styles.confirmButton}
                     onClick={handleCreateFromKpiMap}
                     disabled={selectedKpiMetrics.length === 0 || kpiMapLoading}
                   >
                     {kpiMapLoading ? 'Đang tạo...' : `Tạo ${selectedKpiMetrics.length} chỉ số`}
                   </button>
                 </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dashboard Bulk Create Modal */}
      {showDashboardModal && (
        <div className={styles.popupOverlay}>
          <div className={styles.kpiMapModalContent}>
            <h3 className={styles.popupTitle}>Chọn chỉ số để tạo thẻ Dashboard</h3>
            {dashboardLoading ? (
              <div className={styles.loading}>Đang tải dữ liệu...</div>
            ) : (
              <>
                <div className={styles.kpiMapList}>
                  {kpi2List.map((kpi) => {
                    const disabled = existingDashboardChartIds.has(kpi.id);
                    const checked = selectedDashboardKpis.includes(kpi.id);
                    return (
                      <div
                        key={kpi.id}
                        className={`${styles.kpiMapItem} ${checked ? styles.kpiMapItemSelected : ''} ${disabled ? styles.kpiMapItemDisabled : ''}`}
                        onClick={() => {
                          if (disabled) return;
                          setSelectedDashboardKpis(prev => prev.includes(kpi.id) ? prev.filter(id => id !== kpi.id) : [...prev, kpi.id]);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (disabled) return;
                            setSelectedDashboardKpis(prev => prev.includes(kpi.id) ? prev.filter(id => id !== kpi.id) : [...prev, kpi.id]);
                          }}
                          className={styles.kpiMapCheckbox}
                          disabled={disabled}
                        />
                        <div className={styles.kpiMapItemContent}>
                          <div className={styles.kpiMapItemName}>
                            {kpi.name}
                            {disabled && (
                              <span className={styles.alreadyCreatedBadge}>Đã có trong Dashboard</span>
                            )}
                          </div>
                          {kpi.tags && kpi.tags.length > 0 && (
                            <div className={styles.kpiMapItemTags}>
                              {kpi.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className={styles.kpiMapTag}>
                                  {tag}
                                </span>
                              ))}
                              {kpi.tags.length > 3 && (
                                <span className={styles.kpiMapTagMore}>
                                  +{kpi.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.popupActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowDashboardModal(false);
                      setSelectedDashboardKpis([]);
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    className={styles.confirmButton}
                    disabled={selectedDashboardKpis.length === 0 || dashboardLoading}
                    onClick={async () => {
                      try {
                        setDashboardLoading(true);
                        const payloads = selectedDashboardKpis
                          .filter(id => !existingDashboardChartIds.has(id))
                          .map(id => {
                            const k = kpi2List.find(x => x.id === id);
                            return {
                              name: k?.name || `KPI #${id}`,
                              type: 'chart',
                              idData: id,
                              userClasses: [],
                              settings: {
                                chartViewType: 'area',
                                recentPeriods: 24,
                              },
                              info: {
                                note: k.desc
                              }
                            };
                          });

                        await Promise.all(payloads.map(p => createDashBoardItem(p)));
                        if (payloads.length > 0) {
                          message.success(`Đã tạo ${payloads.length} thẻ chỉ số trong Dashboard`);
                        }
                        // Refresh existing set so disabled states are accurate
                        const allItems = await getAllDashBoardItems();
                        const chartIds = new Set((Array.isArray(allItems) ? allItems : [])
                          .filter(it => it?.type === 'chart' && it?.idData != null)
                          .map(it => it.idData));
                        setExistingDashboardChartIds(chartIds);
                        setShowDashboardModal(false);
                        setSelectedDashboardKpis([]);
                      } catch (e) {
                        console.error('Error creating dashboard items:', e);
                        message.error('Tạo thẻ Dashboard thất bại');
                      } finally {
                        setDashboardLoading(false);
                      }
                    }}
                  >
                    {dashboardLoading ? 'Đang tạo...' : `Tạo ${selectedDashboardKpis.length} thẻ`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bulk Benchmark Editing Modal */}
      {showBulkBenchmarkModal && (
        <div className={styles.popupOverlay}>
          <div className={styles.bulkBenchmarkModalContent}>
            <h3 className={styles.popupTitle}>Chỉnh sửa benchmark hàng loạt</h3>
            
            <div className={styles.bulkBenchmarkContainer}>
              {/* Period Tabs */}
              <div className={styles.bulkBenchmarkTabs}>
                <button
                  className={`${styles.bulkBenchmarkTab} ${bulkBenchmarkPeriod === 'day' ? styles.bulkBenchmarkTabActive : ''}`}
                  onClick={() => {
                    setBulkBenchmarkPeriod('day');
                    setSelectedBulkBenchmarkKpi(null);
                    setBulkBenchmarkTableData([]);
                    setBulkBenchmarkColDefs([]);
                    setBulkBenchmarkRowData([]);
                  }}
                >
                  Ngày
                </button>
                <button
                  className={`${styles.bulkBenchmarkTab} ${bulkBenchmarkPeriod === 'week' ? styles.bulkBenchmarkTabActive : ''}`}
                  onClick={() => {
                    setBulkBenchmarkPeriod('week');
                    setSelectedBulkBenchmarkKpi(null);
                    setBulkBenchmarkTableData([]);
                    setBulkBenchmarkColDefs([]);
                    setBulkBenchmarkRowData([]);
                  }}
                >
                  Tuần
                </button>
                <button
                  className={`${styles.bulkBenchmarkTab} ${bulkBenchmarkPeriod === 'month' ? styles.bulkBenchmarkTabActive : ''}`}
                  onClick={() => {
                    setBulkBenchmarkPeriod('month');
                    setSelectedBulkBenchmarkKpi(null);
                    setBulkBenchmarkTableData([]);
                    setBulkBenchmarkColDefs([]);
                    setBulkBenchmarkRowData([]);
                  }}
                >
                  Tháng
                </button>
              </div>

              <div className={styles.bulkBenchmarkContent}>
                {/* Left Panel - KPI2Calculator List */}
                <div className={styles.bulkBenchmarkLeftPanel}>
                  <h4>Danh sách chỉ số ({bulkBenchmarkPeriod})</h4>
                  <div className={styles.bulkBenchmarkKpiList}>
                    {kpi2List
                      .filter(kpi => kpi.period === bulkBenchmarkPeriod)
                      .map((kpi) => (
                        <div
                          key={kpi.id}
                          className={`${styles.bulkBenchmarkKpiItem} ${selectedBulkBenchmarkKpi?.id === kpi.id ? styles.bulkBenchmarkKpiItemActive : ''}`}
                          onClick={() => handleBulkBenchmarkKpiSelect(kpi)}
                        >
                          <div className={styles.bulkBenchmarkKpiName}>{kpi.name}</div>
                          {kpi.tags && kpi.tags.length > 0 && (
                            <div className={styles.bulkBenchmarkKpiTags}>
                              {kpi.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className={styles.bulkBenchmarkKpiTag}>
                                  {tag}
                                </span>
                              ))}
                              {kpi.tags.length > 2 && (
                                <span className={styles.bulkBenchmarkKpiTagMore}>
                                  +{kpi.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Right Panel - Benchmark Editing */}
                <div className={styles.bulkBenchmarkRightPanel}>
                  {selectedBulkBenchmarkKpi ? (
                    <div>
                      <h4>Chỉnh sửa benchmark: {selectedBulkBenchmarkKpi.name}</h4>
                      {bulkBenchmarkTableData.length > 0 ? (
                        <div className="ag-theme-quartz" style={{ height: '400px', width: '100%' }}>
                          <AgGridReact
                            enableRangeSelection={true}
                            rowData={bulkBenchmarkRowData}
                            defaultColDef={{
                              editable: true,
                              filter: true,
                              suppressMenu: true,
                              cellStyle: { fontSize: '14px' },
                              wrapHeaderText: true,
                              autoHeaderHeight: true,
                              width: 120,
                            }}
                            columnDefs={bulkBenchmarkColDefs}
                            onCellValueChanged={handleBulkBenchmarkCellValueChanged}
                            rowSelection="multiple"
                            localeText={AG_GRID_LOCALE_VN}
                          />
                        </div>
                      ) : (
                        <div className={styles.bulkBenchmarkNoData}>
                          Chưa có dữ liệu để chỉnh sửa benchmark
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.bulkBenchmarkNoSelection}>
                      Vui lòng chọn một chỉ số để chỉnh sửa benchmark
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.popupActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowBulkBenchmarkModal(false);
                    setSelectedBulkBenchmarkKpi(null);
                    setBulkBenchmarkTableData([]);
                    setBulkBenchmarkColDefs([]);
                    setBulkBenchmarkRowData([]);
                  }}
                >
                  Đóng
                </button>
                {selectedBulkBenchmarkKpi && (
                  <button
                    className={styles.confirmButton}
                    onClick={handleBulkBenchmarkSave}
                    disabled={bulkBenchmarkLoading}
                  >
                    {bulkBenchmarkLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedKPIInterface;
