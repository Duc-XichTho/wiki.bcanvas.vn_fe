import React, { useState, useEffect, useContext } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Folder,
  FileText,
  FolderPlus,
  FilePlus,
  ChevronsUpDown,
  MoreVertical,
  Edit,
  Trash2,
  Users
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAllCustomerFolder, updateCustomerFolder, deleteCustomerFolder } from '../../../../apis/customerFolderService';
import { updateCustomerItem, deleteCustomerItem } from '../../../../apis/customerItemService';
import AddFolderModal from './AddFolderModal';
import AddItemModal from './AddItemModal';
import AddItemGlobalModal from './AddItemGlobalModal';
import UserManagementModal from './UserManagementModal';
import styles from './Sidebar.module.css';
import { MyContext } from '../../../../MyContext';
const Sidebar = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [folders, setFolders] = useState([]);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddItemGlobalModal, setShowAddItemGlobalModal] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [isAllExpanded, setIsAllExpanded] = useState(true);
  
  // User management states
  const { currentUser } = useContext(MyContext);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [selectedItemForUserManagement, setSelectedItemForUserManagement] = useState(null);
  
  // Kiểm tra quyền
  const isAdminOrSuperAdmin = currentUser?.isAdmin || currentUser?.isSuperAdmin;
  
  // Kiểm tra quyền cho item (admin/superadmin hoặc trong allowed_users)
  const hasItemAccess = (item) => {
    if (!item || !currentUser) return false;
    if (isAdminOrSuperAdmin) return true;
    
    const allowedUsers = item.info?.allowed_users || [];
    return allowedUsers.includes(currentUser.email);
  };
  
  // Context menu states
  const [contextMenu, setContextMenu] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);


  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu) {
        // Check if click is outside the context menu and sidebar
        const contextMenuElement = document.querySelector(`.${styles.contextMenu}`);
        const sidebarElement = document.querySelector(`.${styles.sidebar}`);
        
        if (contextMenuElement && !contextMenuElement.contains(event.target) &&
            sidebarElement && !sidebarElement.contains(event.target)) {
          closeContextMenu();
        }
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [contextMenu]);

  const loadData = async () => {
    try {
      setLoading(true);
      const foldersData = await getAllCustomerFolder();
      setFolders(foldersData);

      // Extract all items from folders
      const allItems = foldersData.flatMap(folder => 
        folder.customerItem || []
      );
      setItems(allItems);

      // Auto expand all folders initially
      const allFolderIds = new Set(foldersData.map(f => f.id));
      setExpandedFolders(allFolderIds);
      setIsAllExpanded(true);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  const filteredFolders = folders.filter(folder =>
    folder.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get filtered items from filtered folders
  const filteredItems = filteredFolders.flatMap(folder => 
    (folder.customerItem || []).filter(item =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Folder operations
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const toggleAllFolders = () => {
    if (isAllExpanded) {
      setExpandedFolders(new Set());
      setIsAllExpanded(false);
    } else {
      const allFolderIds = new Set(folders.map(f => f.id));
      setExpandedFolders(allFolderIds);
      setIsAllExpanded(true);
    }
  };

  // Item click handler
  const handleItemClick = (itemId) => {
    console.log('Clicking item:', itemId);
    navigate(`/crm/detail/${itemId}`);
  };

  // Add folder handler
  const handleAddFolder = () => {
    setShowAddFolderModal(true);
  };

  // Add item handler
  const handleAddItem = (folderId) => {
    setSelectedFolderId(folderId);
    setShowAddItemModal(true);
  };

  // Add item global handler
  const handleAddItemGlobal = () => {
    setShowAddItemGlobalModal(true);
  };

  // Context menu handlers
  const handleContextMenu = (e, type, data) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      data
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Improved item click with debouncing and loading state
  const [navigating, setNavigating] = useState(false);
  
  const handleItemClickDebounced = (itemId) => {
    // Prevent multiple clicks
    if (navigating) return;
    
    setNavigating(true);
    
    // Close context menu first to avoid conflicts
    if (contextMenu) {
      closeContextMenu();
      setTimeout(() => {
        console.log('Clicking item:', itemId);
        navigate(`/crm/detail/${itemId}`);
        // Reset navigating state after navigation
        setTimeout(() => setNavigating(false), 500);
      }, 100);
    } else {
      console.log('Clicking item:', itemId);
      navigate(`/crm/detail/${itemId}`);
      // Reset navigating state after navigation
      setTimeout(() => setNavigating(false), 500);
    }
  };

  // Rename handlers
  const handleRenameFolder = (folder) => {
    setEditingFolder(folder);
    closeContextMenu();
  };

  const handleRenameItem = (item) => {
    setEditingItem(item);
    closeContextMenu();
  };

  const handleSaveRename = async (type, id, newName) => {
    try {
      if (type === 'folder') {
        await updateCustomerFolder( {id : id, name: newName });
        setEditingFolder(null);
      } else if (type === 'item') {
        await updateCustomerItem( {id : id, name: newName });
        setEditingItem(null);
      }
      await loadData();
    } catch (error) {
      console.error('Error renaming:', error);
    }
  };

  const handleCancelRename = () => {
    setEditingFolder(null);
    setEditingItem(null);
  };

  // Delete handlers
  const handleDeleteFolder = (folder) => {
    setDeleteTarget({ type: 'folder', data: folder });
    setShowDeleteConfirm(true);
    closeContextMenu();
  };

  const handleDeleteItem = (item) => {
    setDeleteTarget({ type: 'item', data: item });
    setShowDeleteConfirm(true);
    closeContextMenu();
  };

  const confirmDelete = async () => {
    try {
      if (deleteTarget.type === 'folder') {
        await deleteCustomerFolder(deleteTarget.data.id);
      } else if (deleteTarget.type === 'item') {
        await deleteCustomerItem(deleteTarget.data.id);
      }
      await loadData();
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  // User management handlers
  const handleManageUsers = (item) => {
    setSelectedItemForUserManagement(item);
    setShowUserManagementModal(true);
    closeContextMenu();
  };

  const closeUserManagementModal = () => {
    setShowUserManagementModal(false);
    setSelectedItemForUserManagement(null);
  };

  const handleUserManagementSuccess = () => {
    // Không cần reload toàn bộ data, chỉ cần cập nhật item hiện tại
    // loadData(); // Comment out để tránh nháy modal
  };


  if (loading) {
    return (
      <div className={styles.sidebar}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className={styles.sidebar} onClick={closeContextMenu}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>Customer Folders</h2>
        <div className={styles.sidebarActions}>
          <button
            onClick={toggleAllFolders}
            className={styles.actionButton}
            title={isAllExpanded ? "Thu gọn tất cả" : "Mở rộng tất cả"}
          >
            <ChevronsUpDown size={16} />
          </button>
          {isAdminOrSuperAdmin && (
            <>
              <button
                onClick={handleAddItemGlobal}
                className={styles.actionButton}
                title="Thêm item"
              >
                <FilePlus size={16} />
              </button>
              <button
                onClick={handleAddFolder}
                className={styles.actionButton}
                title="Thêm folder"
              >
                <FolderPlus size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchContainer}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>


      {/* Folder List */}
      <div className={styles.folderList}>
        {filteredFolders.map((folder) => {
          const isExpanded = expandedFolders.has(folder.id);
          const folderItems = (folder.customerItem || []).filter(item =>
            item.name?.toLowerCase().includes(searchTerm.toLowerCase())
          );

          return (
            <div key={folder.id} className={styles.folderContainer}>
              <div 
                className={styles.folderHeader}
                onContextMenu={(e) => handleContextMenu(e, 'folder', folder)}
              >
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className={styles.folderToggle}
                >
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                <Folder size={16} className={styles.folderIcon} />
                
                {editingFolder?.id === folder.id ? (
                  <input
                    type="text"
                    defaultValue={folder.name}
                    className={styles.editInput}
                    autoFocus
                    onBlur={(e) => handleSaveRename('folder', folder.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveRename('folder', folder.id, e.target.value);
                      } else if (e.key === 'Escape') {
                        handleCancelRename();
                      }
                    }}
                  />
                ) : (
                  <span className={styles.folderName}>{folder.name}</span>
                )}
                
                <div className={styles.folderActions}>
                  {isAdminOrSuperAdmin && (
                    <button
                      onClick={() => handleAddItem(folder.id)}
                      className={styles.addItemButton}
                      title="Thêm item"
                    >
                      <FilePlus size={14} />
                    </button>
                  )}
                  {isAdminOrSuperAdmin && (
                    <button
                      onClick={(e) => handleContextMenu(e, 'folder', folder)}
                      className={styles.moreButton}
                      title="Tùy chọn"
                    >
                      <MoreVertical size={14} />
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className={styles.itemsList}>
                  {folderItems.map((item) => (
                    <div
                      key={item.id}
                      className={`${styles.item} ${id === item.id.toString() ? styles.itemActive : ''} ${navigating ? styles.itemNavigating : ''}`}
                      onContextMenu={(e) => {
                        if (!editingItem || editingItem.id !== item.id) {
                          handleContextMenu(e, 'item', item);
                        }
                      }}
                    >
                      <div 
                        className={styles.itemContent}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!editingItem || editingItem.id !== item.id) {
                            handleItemClickDebounced(item.id);
                          }
                        }}
                        style={{
                          cursor: navigating ? 'wait' : 'pointer',
                          opacity: navigating ? 0.7 : 1
                        }}
                      >
                        <FileText size={14} className={styles.itemIcon} />
                        
                        {editingItem?.id === item.id ? (
                          <input
                            type="text"
                            defaultValue={item.name}
                            className={styles.editInput}
                            autoFocus
                            onBlur={(e) => handleSaveRename('item', item.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveRename('item', item.id, e.target.value);
                              } else if (e.key === 'Escape') {
                                handleCancelRename();
                              }
                            }}
                          />
                        ) : (
                          <span className={styles.itemName}>{item.name}</span>
                        )}
                      </div>
                      
                      {hasItemAccess(item) && (
                        <button
                          onClick={(e) => handleContextMenu(e, 'item', item)}
                          className={styles.itemMoreButton}
                          title="Tùy chọn"
                        >
                          <MoreVertical size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {folderItems.length === 0 && (
                    <div className={styles.emptyFolder}>
                      Không có item nào
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredFolders.length === 0 && (
          <div className={styles.emptyState}>
            {searchTerm ? 'Không tìm thấy folder nào' : 'Chưa có folder nào'}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000
          }}
          onClick={closeContextMenu}
        >
          {/* Đổi tên - chỉ admin/superadmin hoặc có quyền với item */}
          {((contextMenu.type === 'folder' && isAdminOrSuperAdmin) || 
            (contextMenu.type === 'item' && hasItemAccess(contextMenu.data))) && (
            <div className={styles.contextMenuItem} onClick={() => {
              if (contextMenu.type === 'folder') {
                handleRenameFolder(contextMenu.data);
              } else if (contextMenu.type === 'item') {
                handleRenameItem(contextMenu.data);
              }
            }}>
              <Edit size={14} />
              <span>Đổi tên</span>
            </div>
          )}
          
          {/* Quản lý user - chỉ admin/superadmin hoặc có quyền với item */}
          {contextMenu.type === 'item' && hasItemAccess(contextMenu.data) && (
            <div className={styles.contextMenuItem} onClick={() => {
              handleManageUsers(contextMenu.data);
            }}>
              <Users size={14} />
              <span>Quản lý user</span>
            </div>
          )}
          
          {/* Xóa - chỉ admin/superadmin hoặc có quyền với item */}
          {(isAdminOrSuperAdmin || hasItemAccess(contextMenu.data)) && (
            <div className={styles.contextMenuItem} onClick={() => {
              if (contextMenu.type === 'folder') {
                handleDeleteFolder(contextMenu.data);
              } else if (contextMenu.type === 'item') {
                handleDeleteItem(contextMenu.data);
              }
            }}>
              <Trash2 size={14} />
              <span>Xóa</span>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Xác nhận xóa</h3>
            </div>
            <div className={styles.modalBody}>
              <p>
                Bạn có chắc muốn xóa {deleteTarget.type === 'folder' ? 'folder' : 'item'} 
                <strong> "{deleteTarget.data.name}"</strong>?
              </p>
              {deleteTarget.type === 'folder' && (
                <p className={styles.warningText}>
                  ⚠️ Tất cả items trong folder này cũng sẽ bị xóa!
                </p>
              )}
            </div>
            <div className={styles.modalActions}>
              <button onClick={cancelDelete} className={styles.cancelButton}>
                Hủy
              </button>
              <button onClick={confirmDelete} className={styles.deleteButton}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddFolderModal 
        isVisible={showAddFolderModal}
        onClose={() => setShowAddFolderModal(false)}
        onSuccess={loadData}
      />
      <AddItemModal 
        isVisible={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        onSuccess={loadData}
        selectedFolderId={selectedFolderId}
      />
      <AddItemGlobalModal 
        isVisible={showAddItemGlobalModal}
        onClose={() => setShowAddItemGlobalModal(false)}
        onSuccess={loadData}
        folders={folders}
      />
      
      {/* User Management Modal */}
      {showUserManagementModal && selectedItemForUserManagement && currentUser && (
        <UserManagementModal
          visible={showUserManagementModal}
          onClose={closeUserManagementModal}
          item={selectedItemForUserManagement}
          currentUser={currentUser}
          onSuccess={handleUserManagementSuccess}
        />
      )}
    </div>
  );
};

export default Sidebar;
