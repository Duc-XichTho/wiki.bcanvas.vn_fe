import { useEffect, useState } from 'react';
import {
  createBusinessCategory,
  deleteBusinessCategory,
  fetchAllBusinessCategories,
  updateBusinessCategory,
} from '../../../apis/businessCategoryService';
import {
  createKpiMetric,
  deleteKpiMetric,
  deleteMultipleKpiMetrics,
  fetchAllKpiMetrics,
  updateKpiMetric,
} from '../../../apis/kpiMetricService';
import {
  createMeasure,
  deleteMeasure,
  deleteMultipleMeasures,
  fetchAllMeasures,
  updateMeasure,
} from '../../../apis/measureService';
import { exportMetricMapData } from '../functions/exportImportFunctions';

export const useMetricMapData = () => {
  const [businessCategories, setBusinessCategories] = useState([]);
  const [currentKpis, setCurrentKpis] = useState([]);
  const [currentMeasures, setCurrentMeasures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Load initial data - only business categories
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const categoriesResponse = await fetchAllBusinessCategories();
        setBusinessCategories(categoriesResponse);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load KPIs and Measures for selected category
  const loadCategoryData = async (categoryId) => {
    if (!categoryId) {
      setCurrentKpis([]);
      setCurrentMeasures([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Load KPIs and Measures for this category
      const [kpiResponse, measureResponse] = await Promise.all([
        fetchAllKpiMetrics({ business_category_id: categoryId, show: true }),
        fetchAllMeasures({ business_category_id: categoryId, show: true })
      ]);
      
      setCurrentKpis(kpiResponse);
      setCurrentMeasures(measureResponse);
      
    } catch (err) {
      console.error('Error loading category data:', err);
      setError(err.message || 'Failed to load category data');
    } finally {
      setLoading(false);
    }
  };

  // Business Category operations
  const handleAddCategory = async (categoryData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await createBusinessCategory(categoryData);
      setBusinessCategories(prev => [...prev, response]);
      return { success: true, data: response };
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err.message || 'Failed to add category');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (categoryData) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Updating category:', categoryData.id, 'with data:', categoryData);
      
      const response = await updateBusinessCategory(categoryData);
      
      console.log('✅ Category updated from API, updating state...');
      setBusinessCategories(prev => {
        const updated = prev.map(category => category.id === categoryData.id ? response : category);
        console.log('📋 Updated businessCategories:', updated.map(c => ({ id: c.id, name: c.name })));
        return updated;
      });
      
      console.log('✅ Category update completed');
      return { success: true, data: response };
    } catch (err) {
      console.error('❌ Error updating category:', err);
      setError(err.message || 'Failed to update category');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Deleting category:', categoryId);
      
      await deleteBusinessCategory(categoryId);
      
      console.log('✅ Category deleted from API, updating state...');
      setBusinessCategories(prev => {
        const updated = prev.filter(category => category.id !== categoryId);
        console.log('📋 Updated businessCategories:', updated.map(c => ({ id: c.id, name: c.name })));
        return updated;
      });
      
      setCurrentKpis([]);
      setCurrentMeasures([]);
      
      console.log('✅ Category deletion completed');
      return { success: true };
    } catch (err) {
      console.error('❌ Error deleting category:', err);
      setError(err.message || 'Failed to delete category');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // KPI operations
  const handleAddKPI = async (kpiData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await createKpiMetric(kpiData);
      setCurrentKpis(prev => [...prev, response]);
      return { success: true, data: response };
    } catch (err) {
      console.error('Error adding KPI:', err);
      setError(err.message || 'Failed to add KPI');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleEditKPI = async (kpiId, kpiData) => {
    try {
      console.log('KPI data:', kpiId);
      setLoading(true);
      setError(null);
      const response = await updateKpiMetric({ id: kpiId, ...kpiData });
      setCurrentKpis(prev => 
        prev.map(kpi => kpi.id === kpiId ? response : kpi)
      );
      return { success: true, data: response };
    } catch (err) {
      console.error('Error updating KPI:', err);
      setError(err.message || 'Failed to update KPI');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKPI = async (kpiId) => {
    try {
      setLoading(true);
      setError(null);
      await deleteKpiMetric([kpiId]);
      setCurrentKpis(prev => prev.filter(kpi => kpi.id !== kpiId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting KPI:', err);
      setError(err.message || 'Failed to delete KPI');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Measure operations
  const handleAddMeasure = async (measureData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await createMeasure(measureData);
      setCurrentMeasures(prev => [...prev, response]);
      return { success: true, data: response };
    } catch (err) {
      console.error('Error adding measure:', err);
      setError(err.message || 'Failed to add measure');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleEditMeasure = async (measureId, measureData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await updateMeasure({ id: measureId, ...measureData });
      setCurrentMeasures(prev => 
        prev.map(measure => measure.id === measureId ? response : measure)
      );
      return { success: true, data: response };
    } catch (err) {
      console.error('Error updating measure:', err);
      setError(err.message || 'Failed to update measure');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeasure = async (measureId) => {
    try {
      setLoading(true);
      setError(null);
      await deleteMeasure([measureId]);
      setCurrentMeasures(prev => prev.filter(measure => measure.id !== measureId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting measure:', err);
      setError(err.message || 'Failed to delete measure');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMultipleKPIs = async (kpiIds) => {
    try {
      setLoading(true);
      setError(null);
      await deleteMultipleKpiMetrics(kpiIds);
      setCurrentKpis(prev => prev.filter(kpi => !kpiIds.includes(kpi.id)));
      return { success: true };
    } catch (err) {
      console.error('Error deleting multiple KPIs:', err);
      setError(err.message || 'Failed to delete KPIs');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMultipleMeasures = async (measureIds) => {
    try {
      setLoading(true);
      setError(null);
      await deleteMultipleMeasures(measureIds);
      setCurrentMeasures(prev => prev.filter(measure => !measureIds.includes(measure.id)));
      return { success: true };
    } catch (err) {
      console.error('Error deleting multiple measures:', err);
      setError(err.message || 'Failed to delete measures');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Export functionality
  const handleExportData = async (format = 'json') => {
    try {
      setLoading(true);
      setError(null);
      const result = await exportMetricMapData(format);
      if (result.success) {
        return { success: true, message: result.message };
      } else {
        throw new Error(result.error || 'Failed to export data');
      }
    } catch (err) {
      console.error('Error exporting data:', err);
      setError(err.message || 'Failed to export data');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Import functionality
  const handleImportData = async (importResult) => {
    try {
      setLoading(true);
      setError(null);
      
      // importResult đã được xử lý ở frontend, chỉ cần refresh data
      if (importResult.success) {
        // Refresh current category data nếu có category được chọn
        if (selectedCategory) {
          await loadCategoryData(selectedCategory);
        }
        return { success: true, message: importResult.message };
      } else {
        throw new Error(importResult.error || 'Failed to import data');
      }
    } catch (err) {
      console.error('Error importing data:', err);
      setError(err.message || 'Failed to import data');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return {
    // State
    businessCategories,
    currentKpis,
    currentMeasures,
    loading,
    error,
    selectedCategory,
    setSelectedCategory,
    
    // Actions
    loadCategoryData,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleAddKPI,
    handleEditKPI,
    handleDeleteKPI,
    handleAddMeasure,
    handleEditMeasure,
    handleDeleteMeasure,
    handleDeleteMultipleKPIs,
    handleDeleteMultipleMeasures,
    handleExportData,
    handleImportData,
    clearError
  };
};
