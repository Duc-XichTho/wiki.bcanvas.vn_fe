import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import CategoryForm from '../CategoryForm/CategoryForm';
import AntdDropdown from '../AntdDropdown/AntdDropdown';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import styles from './CategorySidebar.module.css';
import { getSettingByType, getSchemaTools } from '../../../../apis/settingService.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { BackCanvas, ICON_CROSSROAD_LIST } from '../../../../icon/svg/IconSvg.jsx';

const CategorySidebar = ({
  businessCategories,
  selectedCategory,
  setSelectedCategory,
  setSelectedKPI,
  isEditing,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}) => {
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [nameTable, setNameTable] = useState(null);
  const [tool, setTool] = useState(null);
  const [masterTool, setMasterTool] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Hàm kết hợp với thông tin từ schema master
  const combineWithMasterInfo = async (currentTool) => {
    try {
      const masterResponse = await getSchemaTools('master');
      const masterAppsList = masterResponse?.setting || [];
      
      if (masterAppsList && masterAppsList.length > 0) {
        const masterApp = masterAppsList.find(masterApp => masterApp.id === currentTool.id);
        if (masterApp) {
          console.log(`CategorySidebar: Combining tool ${currentTool.id} with master info`);
          return {
            ...currentTool,
            name: masterApp.name,
            icon: masterApp.icon
          };
        }
      }
      return currentTool;
    } catch (error) {
      console.error('Error getting master apps for category sidebar:', error);
      return currentTool;
    }
  };

  const getDashboardSetting = async () => {
    try {
      const res = await getSettingByType('DASHBOARD_SETTING');
      if (res.setting.length > 0) {
        let dashboardSetting = res.setting.find(item => location.pathname.includes(item.id));
        if (dashboardSetting) {
          // Kết hợp với thông tin từ schema master
          const combinedTool = await combineWithMasterInfo(dashboardSetting);
          setNameTable(combinedTool.name);
          setTool(combinedTool);
          setMasterTool(combinedTool);
        }
        else {
          setNameTable('DATA MANAGER');
        }
      }
    } catch (error) {
      console.log('error', error);
    }
  }

  useEffect(() => {
    getDashboardSetting();
  }, [location]);


  const getIconSrcById = (tool) => {
    const found = ICON_CROSSROAD_LIST.find(item => item.id == tool.icon);
    return found ? found.icon : undefined;
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedKPI(null);
  };

  const handleAddCategory = async (categoryData) => {
    try {
      await onAddCategory(categoryData);
      setShowCategoryForm(false);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
  };

  const handleUpdateCategory = async (categoryData) => {
    try {
      await onUpdateCategory(categoryData);
      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = (category) => {
    setDeletingCategory(category);
  };

  const confirmDeleteCategory = async () => {
    try {
      const result = await onDeleteCategory(deletingCategory.id);
      setDeletingCategory(null);
      
      if (result.success) {
        // Nếu category đang được chọn bị xóa, chọn category đầu tiên
        if (selectedCategory === deletingCategory.id) {
          // Tính toán remaining categories ngay lập tức
          const remainingCategories = businessCategories.filter(cat => cat.id !== deletingCategory.id);
          if (remainingCategories.length > 0) {
            setSelectedCategory(remainingCategories[0].id);
          } else {
            setSelectedCategory(null);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.backCanvas}
          onClick={() =>
            navigate('/dashboard')
          }
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

        <div className={styles.headerLogo}>
          {masterTool ? masterTool.name : nameTable}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              Mô hình kinh doanh
            </h3>
            {isEditing && (
              <button
                onClick={() => setShowCategoryForm(true)}
                className={styles.addButton}
              >
                <Plus className={styles.addIcon} />
              </button>
            )}
          </div>

          <div className={styles.categoryList}>
            {businessCategories.map((category) => (
              <div
                key={category.id}
                className={`${styles.categoryItemContainer} ${selectedCategory === category.id
                  ? `${styles.selected} ${category.color}`
                  : styles.default
                  }`}
              >
                <button
                  onClick={() => handleCategorySelect(category.id)}
                  className={styles.categoryItem}
                >
                  <h4 className={styles.categoryName}>{category.name}</h4>
                  <p className={styles.categoryDescription}>{category.description}</p>
                </button>
                {isEditing && (
                  <AntdDropdown
                    onEdit={() => handleEditCategory(category)}
                    onDelete={() => handleDeleteCategory(category)}
                    itemName="danh mục"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCategoryForm && (
        <CategoryForm
          onSave={handleAddCategory}
          onCancel={() => setShowCategoryForm(false)}
        />
      )}

      {editingCategory && (
        <CategoryForm
          initialData={editingCategory}
          onSave={handleUpdateCategory}
          onCancel={() => setEditingCategory(null)}
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={confirmDeleteCategory}
        title="Xác nhận xóa danh mục"
        message={`Bạn có chắc chắn muốn xóa danh mục "${deletingCategory?.name}" không? Hành động này sẽ xóa tất cả KPI và chỉ số liên quan.`}
      />
    </div>
  );
};

export default CategorySidebar;
