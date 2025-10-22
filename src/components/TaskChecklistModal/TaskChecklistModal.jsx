import React, { useContext, useEffect, useState } from 'react';
import { createNewHistoryCheckListItem, deleteHistoryCheckListItem, getHistoryCheckListItemDataByEmailUser } from '../../apis/historyCheckListItemService';
import { getTaskCheckListItemDataByTaskCheckListId } from '../../apis/taskCheckListItemService';
import { getAllTaskCheckList } from '../../apis/taskCheckListService';
import {
  BackTask,
  CloseTaskCheckList,
  CollapseTaskCheckList,
  ExpandTaskCheckList,
  Link_HDSD,
  NextTask,
  TaskCheckList,
} from '../../icon/svg/IconSvg.jsx';
import { MyContext } from '../../MyContext';
import { Eye } from 'lucide-react';
import InfoViewerModal from './InfoViewerModal';
import styles from './TaskChecklistModal.module.css';

const TaskChecklistModal = ({ isOpen, onClose, showScrollButton, refreshTrigger }) => {
  const { currentUser } = useContext(MyContext);
  const [currentTask, setCurrentTask] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [historyRecords, setHistoryRecords] = useState(new Map()); // Lưu mapping taskId -> historyId
  const [isCollapsed, setIsCollapsed] = useState(false);


  const [taskCheckLists, setTaskCheckLists] = useState([]);
  const [currentTaskItems, setCurrentTaskItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInfoViewer, setShowInfoViewer] = useState(false);
  const [selectedInfoContent, setSelectedInfoContent] = useState('');

  // Load currentTask from localStorage khi component mount
  useEffect(() => {
    const savedCurrentTask = localStorage.getItem('taskChecklistCurrentTask');
    if (savedCurrentTask) {
      setCurrentTask(parseInt(savedCurrentTask));
    }
  }, []);

  // Reset collapsed state khi modal mở
  useEffect(() => {
    if (isOpen) {
      setIsCollapsed(false);
    }
  }, [isOpen]);

  // Fetch task checklists khi modal mở hoặc có refresh trigger
  useEffect(() => {
    if (isOpen) {
      fetchTaskCheckLists();
      fetchUserHistory();
    }
  }, [isOpen, refreshTrigger]);

  // Fetch task items khi currentTask thay đổi
  useEffect(() => {
    if (taskCheckLists.length > 0 && currentTask < taskCheckLists.length) {
      fetchTaskItems(taskCheckLists[currentTask].id);
    }
  }, [currentTask, taskCheckLists]);

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

  const fetchTaskItems = async (taskCheckListId) => {
    try {
      const data = await getTaskCheckListItemDataByTaskCheckListId(taskCheckListId);
      setCurrentTaskItems(data);
    } catch (err) {
      console.error('Lỗi khi lấy chi tiết task:', err);
      setError('Không thể tải chi tiết nhiệm vụ');
    }
  };

  const fetchUserHistory = async () => {
    if (!currentUser?.email) return;

    try {
      const historyData = await getHistoryCheckListItemDataByEmailUser(currentUser.email);
      // Lọc ra những task item đã completed và lưu mapping
      const completedTaskIds = [];
      const historyMap = new Map();

      historyData.forEach(item => {
        completedTaskIds.push(item.id_task_checklist_item);
        historyMap.set(item.id_task_checklist_item, item.id); // Lưu mapping taskId -> historyId
      });

      setCompletedTasks(new Set(completedTaskIds));
      setHistoryRecords(historyMap);
    } catch (err) {
      console.error('Lỗi khi lấy lịch sử user:', err);
      // Nếu API fail, vẫn dùng localStorage
    }
  };

  const handleTaskToggle = async (taskId) => {
    const newCompleted = new Set(completedTasks);
    const isCurrentlyCompleted = newCompleted.has(taskId);

    if (isCurrentlyCompleted) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }

    // Cập nhật UI ngay lập tức
    setCompletedTasks(newCompleted);

    // Gọi API để lưu/xóa trong database
    try {
      if (!isCurrentlyCompleted) {
        // Nếu tích thì tạo mới record
        const newRecord = {
          id_task_checklist_item: taskId,
          email_user: currentUser?.email,
        };
        const response = await createNewHistoryCheckListItem(newRecord);
        // Lưu historyId để sau này xóa
        setHistoryRecords(prev => {
          const newMap = new Map(prev);
          newMap.set(taskId, response.data.id);
          return newMap;
        });
      } else {
        // Nếu bỏ tích thì xóa record bằng historyId
        const historyId = historyRecords.get(taskId);
        if (historyId) {
          await deleteHistoryCheckListItem(historyId);
          // Xóa khỏi mapping
          setHistoryRecords(prev => {
            const newMap = new Map(prev);
            newMap.delete(taskId);
            return newMap;
          });
        }
      }
    } catch (error) {
      console.error('Lỗi khi lưu trạng thái task:', error);
      // Nếu API fail, rollback UI state
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

  const handleGuideClick = (taskId) => {
    // Tìm task item để lấy link
    const taskItem = currentTaskItems.find(item => item.id === taskId);
    if (taskItem && taskItem.link) {
      // Mở link trong tab mới
      window.open(taskItem.link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewInfo = (taskId) => {
    const taskItem = currentTaskItems.find(item => item.id === taskId);
    if (taskItem && taskItem.info) {
      try {
        let infoContent = '';
        if (typeof taskItem.info === 'string') {
          const infoData = JSON.parse(taskItem.info);
          infoContent = infoData.content || '';
        } else if (taskItem.info.content) {
          infoContent = taskItem.info.content;
        }
        
        if (infoContent) {
          setSelectedInfoContent(infoContent);
          setShowInfoViewer(true);
        }
      } catch (e) {
        console.error('Error parsing info:', e);
      }
    }
  };

  const handleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    // Không lưu vào localStorage vì modal luôn mở full size khi reopen
  };

  const handlePrevTask = () => {
    if (currentTask > 0) {
      const newCurrentTask = currentTask - 1;
      setCurrentTask(newCurrentTask);
      // Lưu vào localStorage
      localStorage.setItem('taskChecklistCurrentTask', newCurrentTask.toString());
    }
  };

  const handleNextTask = () => {
    if (currentTask < taskCheckLists.length - 1) {
      const newCurrentTask = currentTask + 1;
      setCurrentTask(newCurrentTask);
      // Lưu vào localStorage
      localStorage.setItem('taskChecklistCurrentTask', newCurrentTask.toString());
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalContainer} style={{ bottom: showScrollButton ? '60px' : '0px' }}>
      <div className={`${styles.modal} ${isCollapsed ? styles.collapsed : ''}`}>
        {/* Header Navigation */}
        <div className={styles.headerNav}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <TaskCheckList width={20} height={20} />
            <h4 style={{ color: '#565656', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
              {loading ? 'Đang tải...' :
                taskCheckLists.length > 0 ?
                  taskCheckLists[currentTask]?.name || `Nhiệm vụ ${currentTask + 1}` :
                  'Nhiệm vụ'}
            </h4>
          </div>

          <div className={styles.headerActions}>
            <button className={styles.exitButton} onClick={onClose}>
              <CloseTaskCheckList width={16} height={16} />
            </button>
            <button className={styles.collapseButton} onClick={handleCollapse}>
              {/* <CollapseTaskCheckList width={16} height={16} /> */}
              {!isCollapsed ?
                <CollapseTaskCheckList width={16} height={16} />
                : <ExpandTaskCheckList width={16} height={16} />

              }
            </button>
          </div>
        </div>



        {/* Content */}
        {!isCollapsed && (
          <div className={styles.content}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : error ? (
              <div className={styles.errorContainer}>
                <p style={{ color: '#dc2626' }}>{error}</p>
                <button
                  onClick={fetchTaskCheckLists}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Thử lại
                </button>
              </div>
            ) : (
              <>
                <p className={styles.instruction}>
                  {taskCheckLists.length > 0 ? taskCheckLists[currentTask]?.description || 'Mô tả nhiệm vụ' : 'Không có nhiệm vụ nào'}
                </p>

                <span className={styles.mainTitle}>
                  Hãy tick ô dưới đây khi bạn hoàn thành
                </span>

                {/* Task List */}
                <div className={styles.taskList}>
                  {currentTaskItems.length > 0 ? (
                    currentTaskItems.map((task, index) => (
                      <div key={task.id} className={styles.taskItem}>
                        <div className={styles.taskContent}>
                          <label className={styles.taskCheckbox}>
                            <input
                              type="checkbox"
                              checked={completedTasks.has(task.id)}
                              onChange={() => handleTaskToggle(task.id)}
                            />
                            <span className={styles.checkmark}></span>
                          </label>
                          <span className={styles.taskText}>{task.name}</span>
                        </div>
                        <div className={styles.taskActions}>
                          {task.link && (
                            <button
                              className={styles.guideLink}
                              onClick={() => handleGuideClick(task.id)}
                            >
                              <Link_HDSD width={16} height={16} />
                              Link hướng dẫn
                            </button>
                          )}
                          {task.info && (
                            <button
                              className={styles.infoButton}
                              onClick={() => handleViewInfo(task.id)}
                              title="Xem nội dung bổ sung"
                            >
                              <Eye size={16} />
                              Xem nội dung
                            </button>
                          )}
                        </div>
                        {index < currentTaskItems.length - 1 && <hr className={styles.taskSeparator} />}
                      </div>
                    ))
                  ) : (
                    <div className={styles.noTasks}>
                      <p>Không có nhiệm vụ nào trong danh sách này</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        <div className={styles.blueHeader}>
          <div className={styles.navButtons}>
            <button
              className={styles.navButton}
              onClick={handlePrevTask}
              disabled={currentTask === 0}
            >
              <BackTask width={18} height={18} />
              <span>Back</span>
            </button>
            <button
              className={styles.navButton}
              onClick={handleNextTask}
              disabled={currentTask === taskCheckLists.length - 1}
            >
              <NextTask width={18} height={18} />
              <span>Next</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Viewer Modal */}
      {
        showInfoViewer && (
          <InfoViewerModal
            isOpen={showInfoViewer}
            onClose={() => setShowInfoViewer(false)}
            content={selectedInfoContent}
          />
        )
      }
    </div>
  );
};

export default TaskChecklistModal;
