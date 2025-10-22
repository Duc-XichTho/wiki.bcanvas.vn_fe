import React, { useState, useEffect, useContext } from 'react';
import { X, Plus, Edit2, Trash2, ChevronDown, ChevronRight, Save, X as CloseIcon, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import styles from './TaskManagementModal.module.css';
import { 
  getAllTaskCheckList, 
  createNewTaskCheckList, 
  updateTaskCheckList, 
  deleteTaskCheckList 
} from '../../apis/taskCheckListService';
import { 
  getAllTaskCheckListItem, 
  getTaskCheckListItemDataByTaskCheckListId,
  createNewTaskCheckListItem,
  updateTaskCheckListItem,
  deleteTaskCheckListItem
} from '../../apis/taskCheckListItemService';
import { createTimestamp } from '../../generalFunction/format';
import { MyContext } from '../../MyContext';
import SimpleEditor from './SimpleEditor';
const TaskManagementModal = ({ isOpen, onClose, onDataChanged }) => {
  const { currentUser } = useContext(MyContext);
  const [taskCheckLists, setTaskCheckLists] = useState([]);
  const [taskItems, setTaskItems] = useState([]);
  const [selectedTaskList, setSelectedTaskList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Form states
  const [showTaskListForm, setShowTaskListForm] = useState(false);
  const [showTaskItemForm, setShowTaskItemForm] = useState(false);
  const [editingTaskList, setEditingTaskList] = useState(null);
  const [editingTaskItem, setEditingTaskItem] = useState(null);
  
  // Task List form
  const [taskListForm, setTaskListForm] = useState({
    name: '',
    description: ''
  });
  
  // Task Item form
  const [taskItemForm, setTaskItemForm] = useState({
    name: '',
    link: '',
    info: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchTaskCheckLists();
    }
  }, [isOpen]);

  const fetchTaskCheckLists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllTaskCheckList();
      setTaskCheckLists(data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách task checklist:', err);
      setError('Không thể tải danh sách task checklist');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskItems = async (taskListId) => {
    try {
      const data = await getTaskCheckListItemDataByTaskCheckListId(taskListId);
      setTaskItems(data);
    } catch (err) {
      console.error('Lỗi khi lấy task items:', err);
      setError('Không thể tải chi tiết task items');
    }
  };

  const handleSelectTaskList = (taskList) => {
    setSelectedTaskList(taskList);
    fetchTaskItems(taskList.id);
  };

  const handleCreateTaskList = async () => {
    try {
      const data = {
        ...taskListForm,
        created_at: createTimestamp(),
        user_create: currentUser?.email
      }
      await createNewTaskCheckList(data);
      setTaskListForm({ name: '', description: '' });
      setShowTaskListForm(false);
      setHasChanges(true);
      fetchTaskCheckLists();
    } catch (err) {
      console.error('Lỗi khi tạo task list:', err);
      setError('Không thể tạo task list');
    }
  };

  const handleUpdateTaskList = async () => {
    try {
      const data = {
        ...editingTaskList,
        ...taskListForm,
        updated_at: createTimestamp(),
        user_update: currentUser?.email
      }
      await updateTaskCheckList(data);
      setTaskListForm({ name: '', description: '' });
      setEditingTaskList(null);
      setShowTaskListForm(false);
      setHasChanges(true);
      fetchTaskCheckLists();
    } catch (err) {
      console.error('Lỗi khi cập nhật task list:', err);
      setError('Không thể cập nhật task list');
    }
  };

  const handleDeleteTaskList = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa task list này?')) {
      try {
        await deleteTaskCheckList(id);
        setHasChanges(true);
        fetchTaskCheckLists();
        if (selectedTaskList?.id === id) {
          setSelectedTaskList(null);
          setTaskItems([]);
        }
      } catch (err) {
        console.error('Lỗi khi xóa task list:', err);
        setError('Không thể xóa task list');
      }
    }
  };

  const handleCreateTaskItem = async () => {
    try {
      const infoData = taskItemForm.info ? { content: taskItemForm.info } : {};
      await createNewTaskCheckListItem({
        ...taskItemForm,
        info:infoData,
        id_task_checklist: selectedTaskList.id,
        created_at: createTimestamp(),
        user_create: currentUser?.email
      });
      setTaskItemForm({ name: '', link: '', info: '' });
      setShowTaskItemForm(false);
      setHasChanges(true);
      fetchTaskItems(selectedTaskList.id);
    } catch (err) {
      console.error('Lỗi khi tạo task item:', err);
      setError('Không thể tạo task item');
    }
  };

  const handleUpdateTaskItem = async () => {
    try {
      const infoData = taskItemForm.info ? { content: taskItemForm.info } : {};
      const data = {
        ...editingTaskItem,
        ...taskItemForm,
        info:infoData,
        updated_at: createTimestamp(),
        user_update: currentUser?.email
      }
      await updateTaskCheckListItem(data);
      setTaskItemForm({ name: '', link: '', info: '' });
      setEditingTaskItem(null);
      setShowTaskItemForm(false);
      setHasChanges(true);
      fetchTaskItems(selectedTaskList.id);
    } catch (err) {
      console.error('Lỗi khi cập nhật task item:', err);
      setError('Không thể cập nhật task item');
    }
  };

  const handleDeleteTaskItem = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa task item này?')) {
      try {
        await deleteTaskCheckListItem(id);
        setHasChanges(true);
        fetchTaskItems(selectedTaskList.id);
      } catch (err) {
        console.error('Lỗi khi xóa task item:', err);
        setError('Không thể xóa task item');
      }
    }
  };

  const openEditTaskList = (taskList) => {
    setEditingTaskList(taskList);
    setTaskListForm({
      name: taskList.name || '',
      description: taskList.description || ''
    });
    setShowTaskListForm(true);
  };

  const openEditTaskItem = (taskItem) => {
    setEditingTaskItem(taskItem);
    let infoContent = '';
    try {
      if (taskItem.info) {
        const infoData = taskItem.info;
        infoContent = infoData.content || '';
      }
    } catch (e) {
      console.error('Error parsing info:', e);
    }
    setTaskItemForm({
      name: taskItem.name || '',
      link: taskItem.link || '',
      info: infoContent
    });
    setShowTaskItemForm(true);
  };

  const resetForms = () => {
    setTaskListForm({ name: '', description: '' });
    setTaskItemForm({ name: '', link: '', info: '' });
    setEditingTaskList(null);
    setEditingTaskItem(null);
    setShowTaskListForm(false);
    setShowTaskItemForm(false);
  };

  const handleMoveTaskList = async (taskList, direction) => {
    try {
      const currentIndex = taskCheckLists.findIndex(item => item.id === taskList.id);
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex < 0 || targetIndex >= taskCheckLists.length) return;
      
      const targetTaskList = taskCheckLists[targetIndex];
      
      // Swap positions
      await updateTaskCheckList({
        ...taskList,
        position: targetTaskList.position
      });
      
      await updateTaskCheckList({
        ...targetTaskList,
        position: taskList.position
      });
      
      fetchTaskCheckLists();
    } catch (err) {
      console.error('Lỗi khi di chuyển task list:', err);
      setError('Không thể di chuyển task list');
    }
  };

  const handleMoveTaskItem = async (taskItem, direction) => {
    try {
      const currentIndex = taskItems.findIndex(item => item.id === taskItem.id);
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex < 0 || targetIndex >= taskItems.length) return;
      
      const targetTaskItem = taskItems[targetIndex];
      
      // Swap positions
      await updateTaskCheckListItem({
        ...taskItem,
        position: targetTaskItem.position
      });
      
      await updateTaskCheckListItem({
        ...targetTaskItem,
        position: taskItem.position
      });
      
      fetchTaskItems(selectedTaskList.id);
    } catch (err) {
      console.error('Lỗi khi di chuyển task item:', err);
      setError('Không thể di chuyển task item');
    }
  };

  const handleClose = () => {
    // Nếu có thay đổi, trigger callback để refresh TaskChecklistModal
    if (hasChanges && onDataChanged) {
      onDataChanged();
    }
    
    // Dispatch event để refresh TaskChecklistModal ở AuthRoute
    if (hasChanges) {
      window.dispatchEvent(new CustomEvent('taskChecklistRefresh'));
    }
    
    // Reset hasChanges
    setHasChanges(false);
    
    // Đóng modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h2>Quản lý Task Checklist</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className={styles.errorMessage}>
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className={styles.content}>
          {/* Left Panel - Task Lists */}
          <div className={styles.leftPanel}>
            <div className={styles.panelHeader}>
              <h3>Danh sách Task Checklist</h3>
              <button 
                className={styles.addButton}
                onClick={() => {
                  resetForms();
                  setShowTaskListForm(true);
                }}
              >
                <Plus size={16} />
                Thêm mới
              </button>
            </div>

            {loading ? (
              <div className={styles.loading}>Đang tải...</div>
            ) : (
              <div className={styles.taskListContainer}>
                {taskCheckLists.map((taskList, index) => (
                  <div 
                    key={taskList.id} 
                    className={`${styles.taskListItem} ${selectedTaskList?.id === taskList.id ? styles.selected : ''}`}
                    onClick={() => handleSelectTaskList(taskList)}
                  >
                    <div className={styles.taskListInfo}>
                      <h4>{taskList.name}</h4>
                      <p>{taskList.description}</p>
                      {/* <span className={styles.position}>Vị trí: {taskList.position}</span> */}
                    </div>
                    <div className={styles.taskListActions}>
                      <div className={styles.positionButtons}>
                        <button 
                          className={styles.moveButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveTaskList(taskList, 'up');
                          }}
                          disabled={index === 0}
                          title="Di chuyển lên"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button 
                          className={styles.moveButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveTaskList(taskList, 'down');
                          }}
                          disabled={index === taskCheckLists.length - 1}
                          title="Di chuyển xuống"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>
                      <button 
                        className={styles.editButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditTaskList(taskList);
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTaskList(taskList.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Task Items */}
          <div className={styles.rightPanel}>
            {selectedTaskList ? (
              <>
                <div className={styles.panelHeader}>
                  <h3>Chi tiết: {selectedTaskList.name}</h3>
                  <button 
                    className={styles.addButton}
                    onClick={() => {
                      resetForms();
                      setShowTaskItemForm(true);
                    }}
                  >
                    <Plus size={16} />
                    Thêm Task Item
                  </button>
                </div>

                <div className={styles.taskItemsContainer}>
                  {taskItems.map((taskItem, index) => (
                    <div key={taskItem.id} className={styles.taskItem}>
                      <div className={styles.taskItemInfo}>
                        <h4>{taskItem.name}</h4>
                        {taskItem.link && (
                          <a href={taskItem.link} target="_blank" rel="noopener noreferrer">
                            {taskItem.link}
                          </a>
                        )}
                        {/* <span className={styles.position}>Vị trí: {taskItem.position}</span> */}
                      </div>
                      <div className={styles.taskItemActions}>
                        <div className={styles.positionButtons}>
                          <button 
                            className={styles.moveButton}
                            onClick={() => handleMoveTaskItem(taskItem, 'up')}
                            disabled={index === 0}
                            title="Di chuyển lên"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button 
                            className={styles.moveButton}
                            onClick={() => handleMoveTaskItem(taskItem, 'down')}
                            disabled={index === taskItems.length - 1}
                            title="Di chuyển xuống"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                        <button 
                          className={styles.editButton}
                          onClick={() => openEditTaskItem(taskItem)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className={styles.deleteButton}
                          onClick={() => handleDeleteTaskItem(taskItem.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.noSelection}>
                <p>Chọn một Task Checklist để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>

        {/* Task List Form Modal */}
        {showTaskListForm && (
          <div className={styles.formOverlay}>
            <div className={styles.formModal}>
              <div className={styles.formHeader}>
                <h3>{editingTaskList ? 'Chỉnh sửa Task List' : 'Thêm mới Task List'}</h3>
                <button onClick={resetForms}>
                  <CloseIcon size={20} />
                </button>
              </div>
              <div className={styles.formContent}>
                <div className={styles.formGroup}>
                  <label>Tên Task List *</label>
                  <input
                    type="text"
                    value={taskListForm.name}
                    onChange={(e) => setTaskListForm({...taskListForm, name: e.target.value})}
                    placeholder="Nhập tên task list"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Mô tả</label>
                  <textarea
                    value={taskListForm.description}
                    onChange={(e) => setTaskListForm({...taskListForm, description: e.target.value})}
                    placeholder="Nhập mô tả"
                    rows={3}
                  />
                </div>
                <div className={styles.formActions}>
                  <button 
                    className={styles.cancelButton}
                    onClick={resetForms}
                  >
                    Hủy
                  </button>
                  <button 
                    className={styles.saveButton}
                    onClick={editingTaskList ? handleUpdateTaskList : handleCreateTaskList}
                    disabled={!taskListForm.name.trim()}
                  >
                    <Save size={16} />
                    {editingTaskList ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task Item Form Modal */}
        {showTaskItemForm && (
          <div className={styles.formOverlay}>
            <div className={styles.formModal}>
              <div className={styles.formHeader}>
                <h3>{editingTaskItem ? 'Chỉnh sửa Task Item' : 'Thêm mới Task Item'}</h3>
                <button onClick={resetForms}>
                  <CloseIcon size={20} />
                </button>
              </div>
              <div className={styles.formContent}>
                <div className={styles.formGroup}>
                  <label>Tên Task Item *</label>
                  <textarea
                    value={taskItemForm.name}
                    onChange={(e) => setTaskItemForm({...taskItemForm, name: e.target.value})}
                    placeholder="Nhập tên task item"
                    rows={3}
                  
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Link hướng dẫn</label>
                  <input
                    type="url"
                    value={taskItemForm.link}
                    onChange={(e) => setTaskItemForm({...taskItemForm, link: e.target.value})}
                    placeholder="Nhập link hướng dẫn"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Nội dung bổ sung</label>
                  <SimpleEditor
                    content={taskItemForm.info}
                    onChange={(content) => setTaskItemForm({...taskItemForm, info: content})}
                    placeholder="Nhập nội dung bổ sung (có thể paste ảnh, text...)"
                  />
                </div>
                <div className={styles.formActions}>
                  <button 
                    className={styles.cancelButton}
                    onClick={resetForms}
                  >
                    Hủy
                  </button>
                  <button 
                    className={styles.saveButton}
                    onClick={editingTaskItem ? handleUpdateTaskItem : handleCreateTaskItem}
                    disabled={!taskItemForm.name.trim()}
                  >
                    <Save size={16} />
                    {editingTaskItem ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManagementModal;
