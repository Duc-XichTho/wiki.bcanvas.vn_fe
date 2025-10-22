import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAllTaskCheckList } from '../apis/taskCheckListService';
import { getTaskCheckListItemDataByTaskCheckListId } from '../apis/taskCheckListItemService';
import { getHistoryCheckListItemDataByEmailUser, createNewHistoryCheckListItem, deleteHistoryCheckListItem } from '../apis/historyCheckListItemService';
import { MyContext } from '../MyContext';

const TaskChecklistContext = createContext();

export const useTaskChecklist = () => {
  const context = useContext(TaskChecklistContext);
  if (!context) {
    throw new Error('useTaskChecklist must be used within TaskChecklistProvider');
  }
  return context;
};

export const TaskChecklistProvider = ({ children }) => {
  const { currentUser } = useContext(MyContext);
  
  // Global states
  const [isModalOpen, setIsModalOpen] = useState(() => {
    try {
      return localStorage.getItem('taskChecklistModalOpen') === 'true';
    } catch {
      return false;
    }
  });
  
  const [currentTask, setCurrentTask] = useState(() => {
    try {
      return parseInt(localStorage.getItem('taskChecklistCurrentTask') || '0');
    } catch {
      return 0;
    }
  });
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('taskChecklistCollapsed') || 'false');
    } catch {
      return false;
    }
  });
  
  const [taskCheckLists, setTaskCheckLists] = useState([]);
  const [currentTaskItems, setCurrentTaskItems] = useState([]);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [historyRecords, setHistoryRecords] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch task checklists
  const fetchTaskCheckLists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllTaskCheckList();
      setTaskCheckLists(data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách task checklist:', err);
      setError('Không thể tải danh sách nhiệm vụ');
    } finally {
      setLoading(false);
    }
  };

  // Fetch task items
  const fetchTaskItems = async (taskCheckListId) => {
    try {
      const data = await getTaskCheckListItemDataByTaskCheckListId(taskCheckListId);
      setCurrentTaskItems(data);
    } catch (err) {
      console.error('Lỗi khi lấy chi tiết task:', err);
      setError('Không thể tải chi tiết nhiệm vụ');
    }
  };

  // Fetch user history
  const fetchUserHistory = async () => {
    if (!currentUser?.email) return;
    
    try {
      const historyData = await getHistoryCheckListItemDataByEmailUser(currentUser.email);
      const completedTaskIds = [];
      const historyMap = new Map();
      
      historyData.forEach(item => {
        completedTaskIds.push(item.id_task_checklist_item);
        historyMap.set(item.id_task_checklist_item, item.id);
      });
      
      setCompletedTasks(new Set(completedTaskIds));
      setHistoryRecords(historyMap);
    } catch (err) {
      console.error('Lỗi khi lấy lịch sử user:', err);
    }
  };

  // Toggle task completion
  const handleTaskToggle = async (taskId) => {
    const newCompleted = new Set(completedTasks);
    const isCurrentlyCompleted = newCompleted.has(taskId);
    
    if (isCurrentlyCompleted) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    
    setCompletedTasks(newCompleted);
    
    try {
      if (!isCurrentlyCompleted) {
        const newRecord = {
          id_task_checklist_item: taskId,
          email_user: currentUser?.email,
        };
        const response = await createNewHistoryCheckListItem(newRecord);
        setHistoryRecords(prev => {
          const newMap = new Map(prev);
          newMap.set(taskId, response.data.id);
          return newMap;
        });
      } else {
        const historyId = historyRecords.get(taskId);
        if (historyId) {
          await deleteHistoryCheckListItem(historyId);
          setHistoryRecords(prev => {
            const newMap = new Map(prev);
            newMap.delete(taskId);
            return newMap;
          });
        }
      }
    } catch (error) {
      console.error('Lỗi khi lưu trạng thái task:', error);
      setCompletedTasks(prev => {
        const rollback = new Set(prev);
        if (isCurrentlyCompleted) {
          rollback.add(taskId);
        } else {
          rollback.delete(taskId);
        }
        return rollback;
      });
    }
  };

  // Open modal
  const openModal = () => {
    setIsModalOpen(true);
    localStorage.setItem('taskChecklistModalOpen', 'true');
    fetchTaskCheckLists();
    fetchUserHistory();
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    localStorage.setItem('taskChecklistModalOpen', 'false');
  };

  // Navigate tasks
  const goToPrevTask = () => {
    if (currentTask > 0) {
      const newCurrentTask = currentTask - 1;
      setCurrentTask(newCurrentTask);
      localStorage.setItem('taskChecklistCurrentTask', newCurrentTask.toString());
    }
  };

  const goToNextTask = () => {
    if (currentTask < taskCheckLists.length - 1) {
      const newCurrentTask = currentTask + 1;
      setCurrentTask(newCurrentTask);
      localStorage.setItem('taskChecklistCurrentTask', newCurrentTask.toString());
    }
  };

  // Toggle collapse
  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem('taskChecklistCollapsed', JSON.stringify(newCollapsed));
  };

  // Fetch task items when currentTask changes
  useEffect(() => {
    if (taskCheckLists.length > 0 && currentTask < taskCheckLists.length) {
      fetchTaskItems(taskCheckLists[currentTask].id);
    }
  }, [currentTask, taskCheckLists]);

  const value = {
    // States
    isModalOpen,
    currentTask,
    isCollapsed,
    taskCheckLists,
    currentTaskItems,
    completedTasks,
    historyRecords,
    loading,
    error,
    
    // Actions
    openModal,
    closeModal,
    goToPrevTask,
    goToNextTask,
    toggleCollapse,
    handleTaskToggle,
    fetchTaskCheckLists,
    fetchUserHistory
  };

  return (
    <TaskChecklistContext.Provider value={value}>
      {children}
    </TaskChecklistContext.Provider>
  );
};
