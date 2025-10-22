import React, { useEffect, useState, useContext, useRef } from "react";
import css from "./LeftPanel.module.css";
import { MyContext } from "../../../MyContext";
// CONST
import { ProjectStepStatus } from "../../../CONST";
// ICON
import {
  Settings,
  ArrowUpToLine,
  ArrowDownToLine,
  EyeOff,
  Eye,
  X,
  Check,
  Hourglass,
  Pencil,
} from "lucide-react";
import {
  HideProgressTaskIcon,
  AddProgressTaskIcon,
  IconPMAccept,
  IconPMOne,
  IconPMAll,
  IconPMCat,
  IconPMPic,
  IconPMTag,
  IconPMTimeline,
  IconSoLuongDinhKem,
} from "../../../icon/IconSVG";
// COMPONENTS
import ProgressTracker from "./ProgressTracker/ProgressTracker";
import ProgressSettingsPopup from "./ProgressSettingsPopup/ProgressSettingsPopup";
import FilterSettingPopup from "./FilterSettingPopup/FilterSettingPopup";
import CreateTaskPopup from "./CreateTaskPopup/CreateTaskPopup";
// API
import { updateProgress } from "../../../apis/progressService";
import {
  getAllProgressStep,
  createProgressStep,
  updateProgressStep,
  deleteProgressStep,
} from "../../../apis/progressStepService";
import {
  getAllProgressTask,
  createProgressTask,
  updateProgressTask,
} from "../../../apis/progressTaskService";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const LeftPanel = ({
  progress,
  setSelectedProject,
  selectedProgressStep,
  setSelectedProgressStep,
  selectedProgressTask,
  setSelectedProgressTask,
  taskDetails,
  stepId,
  taskId,
  reloadProgressStep,
  setUpdateProgressStep,
}) => {
  const progressId = progress.id;
  const [isFilterSettingsOpen, setIsFilterSettingsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(true);
  const [progressSteps, setProgressSteps] = useState([]);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [showHiddenTasks, setShowHiddenTasks] = useState(false);
  const [tasks, setTasks] = useState([]);
  const { currentUser, loadData, setLoadData } = useContext(MyContext);
  const [filters, setFilters] = useState({
    pic: "",
    category: "",
    tag: "",
  });
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const titleInputRef = useRef(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(progress.title || "");
  const titleEditInputRef = useRef(null);

  useEffect(() => {
    if (isEditingTitle && titleEditInputRef.current) {
      titleEditInputRef.current.focus();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (filteredTasks.length > 0 && !selectedProgressTask) {
      const parseTask = localStorage.getItem("selectedProgressTask");
      if (parseTask) {
        const parsedTask = JSON.parse(parseTask);
        const matchTask = filteredTasks.find(
          (task) => task.id == parsedTask.id
        );
        setSelectedProgressTask(matchTask);
      } else {
        setSelectedProgressTask(filteredTasks[0]);
      }
    }
  }, [filteredTasks]);

  useEffect(() => {
    loadProgressSteps();
  }, [progressId, showHiddenTasks]);

  useEffect(() => {
    if (taskDetails.id !== 0) {
      let matchTask = tasks.find((task) => task.id == taskDetails.id);
      if (matchTask) {
        matchTask.cat = taskDetails.cat;
        matchTask.pic = taskDetails.pic;
        matchTask.tag = taskDetails.tag;
        matchTask.deadline = taskDetails.deadline;
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id == taskDetails.id ? matchTask : task
          )
        );
      }
    }
    loadProgressSteps();
  }, [taskDetails, reloadProgressStep]);

  useEffect(() => {
    const filtered = tasks.filter((task) => {
      const matchesPic = !filters.pic || task.pic === filters.pic;
      const matchesCategory =
        !filters.category || task.cat === filters.category;
      const matchesTag = !filters.tag || task.tag === filters.tag;
      const matchesVisibility =
        !task.isHide == (showHiddenTasks ? false : true);
      return matchesPic && matchesCategory && matchesTag && matchesVisibility;
    });

    const sortedTasks = filtered.sort((a, b) => {
      if (a.position !== null && b.position !== null) {
        return a.position - b.position;
      }
      if (a.position !== null) return -1;
      if (b.position !== null) return 1;
      return a.id - b.id;
    });

    setFilteredTasks(sortedTasks);
  }, [filters, tasks]);

  useEffect(() => {
    if (selectedProgressStep) {
      loadTasks(selectedProgressStep.id);
      setIsLocked(selectedProgressStep.isLocked);
    }
  }, [selectedProgressStep, loadData]);

  useEffect(() => {
    if (selectedProgressTask) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === selectedProgressTask.id ? selectedProgressTask : task
        )
      );
    }
  }, [selectedProgressTask]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const allTasks = await getAllProgressTask(progressId);
        setTasks(allTasks); // This will now contain ALL tasks
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    if (progressId) {
      fetchTasks();
    }
  }, [progressId]);

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      // Sort tasks by position and preserve the order
      const sortedTasks = [...tasks].sort((a, b) => a.position - b.position);
      setFilteredTasks(sortedTasks);
    }
  }, [tasks]); // Only run when tasks prop changes

  const handleTitleUpdate = async () => {
    try {
      const progressUpdate = await updateProgress({
        ...progress,
        title: editedTitle,
      });
      setSelectedProject(progressUpdate);
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Error updating progress title:", error);
    }
  };

  const handleTitleEditCancel = () => {
    setEditedTitle(progress.title || "");
    setIsEditingTitle(false);
  };

  const handleToggleTaskVisibility = async (taskId, isHide) => {
    const updatedTask = {
      isHide: !isHide,
      updateUser: currentUser.email.split("@")[0],
    };
    const newTaskUpdate = await updateProgressTask(taskId, updatedTask);

    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? newTaskUpdate : task))
    );

    if (selectedProgressStep) {
      loadTasks(selectedProgressStep.id);
    }
  };

  const getPendingTaskCount = (stepId, tasks) => {
    if (!tasks) return 0;
    return tasks.filter(
      (task) => task.stepId === stepId && !task.status && !task.isHide
    ).length;
  };

  const loadProgressSteps = async () => {
    try {
      let data = await getAllProgressStep(progressId);

      for (const step of data) {
        const tasks = await getAllProgressTask(step.id);
        step.pendingNum = getPendingTaskCount(step.id, tasks);
      }
      setProgressSteps(data);

      if (data.length === 0) {
        setSelectedProgressStep(null);
        setSelectedProgressTask(null);
        setTasks([]);
        localStorage.removeItem("selectedProgressSteps");
        localStorage.removeItem("selectedProgressTask");
        return;
      }

      let targetStep = null;

      if (stepId) {
        targetStep = data.find((step) => step.id == stepId);
      } else {
        const storedData = localStorage.getItem("selectedProgressSteps");
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          targetStep = data.find((step) => step.id == parsedData.id);
        }
      }

      const selectedStep = targetStep || data[0];
      setSelectedProgressStep(selectedStep);
      localStorage.setItem(
        "selectedProgressSteps",
        JSON.stringify(selectedStep)
      );
      setUpdateProgressStep(false);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin:", error);
    }
  };

  const loadTasks = async (stepId) => {
    try {
      let data = await getAllProgressTask(stepId);
      data = data.filter((task) => task.isHide == showHiddenTasks);
      setTasks(data);

      if (data.length === 0) {
        setSelectedProgressTask(null);
        localStorage.removeItem("selectedProgressTask");
        await handleUpdateStep(stepId, { status: ProjectStepStatus.ONGOING });
      } else {
        const allTasksCompleted = data
          .filter((task) => task.isHide === false)
          .every(
            (task) =>
              task.status === true &&
              task.AConfirm === true &&
              task.BConfirm === true
          );
        const hasIncompleteTasks = data
          .filter((task) => task.isHide === false)
          .some(
            (task) =>
              task.status === false ||
              task.AConfirm === true ||
              task.BConfirm === true
          );

        if (allTasksCompleted) {
          await handleUpdateStep(stepId, {
            status: ProjectStepStatus.COMPLETED,
          });
        } else if (hasIncompleteTasks) {
          await handleUpdateStep(stepId, { status: ProjectStepStatus.ONGOING });
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin:", error);
    }
  };

  const handleUpdateStep = async (stepId, updates) => {
    await updateProgressStep(stepId, updates);
    setProgressSteps((steps) =>
      steps.map((step) => (step.id === stepId ? { ...step, ...updates } : step))
    );
  };

  const handleRemoveStep = async (stepId) => {
    await deleteProgressStep(stepId);
    setProgressSteps((steps) => steps.filter((step) => step.id !== stepId));
  };

  const handleCreateStep = async (title) => {
    const newStepData = {
      progressId,
      title,
      status: ProjectStepStatus.ONGOING,
    };
    const newStep = await createProgressStep(newStepData);
    setProgressSteps([...progressSteps, newStep]);
  };

  const handleUpdateProgress = async (updatedProgress) => {
    try {
      await updateProgressStep(updatedProgress.id, updatedProgress);
      setSelectedProgressStep(updatedProgress);
      localStorage.setItem(
        "selectedProgressSteps",
        JSON.stringify(updatedProgress)
      );
      setProgressSteps((steps) =>
        steps.map((step) =>
          step.id === updatedProgress.id ? updatedProgress : step
        )
      );
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const getStatusIcon = (task) => {
    if (!task.status) {
      return (
        <div className={`${css.statusIcon} ${css.pendingIcon}`}>
          <Hourglass
            size={16}
            className={`${css.icon} ${css.pendingIconColor}`}
          />
        </div>
      );
    }

    if (task.status) {
      if (task.AConfirm && task.BConfirm && task.status) {
        return (
          <div className={`${css.statusIcon} ${css.completedIcon}`}>
            <img src={IconPMAll} className={css.icon} alt="All confirmed" />
          </div>
        );
      }
      if ((task.AConfirm || task.BConfirm) && task.status) {
        return (
          <div className={`${css.statusIcon} ${css.completedIcon}`}>
            <img src={IconPMOne} className={css.icon} alt="One confirmed" />
          </div>
        );
      }

      return (
        <div className={`${css.statusIcon} ${css.completedIcon}`}>
          <img src={IconPMAccept} className={css.icon} alt="Status complete" />
        </div>
      );
    }
  };

  const handleCreateTask = async (newTask) => {
    const newTaskData = {
      stepId: selectedProgressStep.id,
      ...newTask,
    };
    const task = await createProgressTask(newTaskData);
    setTasks((prevTasks) => [...prevTasks, task]);
  };

  const getFilterOptions = (filterType) => {
    const options = new Set(
      tasks.map((task) => {
        switch (filterType) {
          case "pic":
            return task.pic;
          case "category":
            return task.cat;
          case "tag":
            return task.tag;
          default:
            return "";
        }
      })
    );
    return Array.from(options).filter(Boolean);
  };

  const updateAtFormat = (time) => {
    if (!time) return "";
    const date = new Date(time);
    const options = {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "numeric",
      year: "2-digit",
    };
    const formatted = new Intl.DateTimeFormat("en-GB", options).format(date);

    const parts = formatted.split(", ");
    return `${parts[1]} ${parts[0]}`;
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`; // Format to dd-mm-yyyy
  };

  const TaskListHeader = () => (
    <div className={css.taskListHeader}>
      <FilterSection />
      <div className={css.headerIcons}>
        {showHiddenTasks ? (
          <EyeOff
            size={16}
            className={css.icon}
            onClick={() => setShowHiddenTasks(false)}
          />
        ) : (
          <Eye
            size={16}
            className={css.icon}
            onClick={() => setShowHiddenTasks(true)}
          />
        )}
        <Settings
          size={16}
          className={css.icon}
          onClick={() => setIsFilterSettingsOpen(true)}
        />
        <div className={css.tooltipContainer}>
          <button
            className={css.headerCreateButton}
            onClick={() => setIsCreateTaskOpen(true)}
            disabled={isLocked}
          >
            <img src={AddProgressTaskIcon} size={20} />
            <span>Tạo mới</span>
          </button>
          {isLocked && (
            <div className={css.tooltipText}>Step này đã bị khóa</div>
          )}
        </div>
      </div>
    </div>
  );

  const FilterSection = () => (
    <div className={css.filterSection}>
      <div className={css.filterGroup}>
        <img src={IconPMPic} alt="" style={{ width: 20, height: 20 }} />
        <select
          value={filters.pic}
          onChange={(e) => handleFilterChange("pic", e.target.value)}
          className={css.filterSelect}
        >
          <option value="">All PICs</option>
          {getFilterOptions("pic").map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* <div className={css.filterGroup}>
        <img src={IconPMCat} alt="" style={{ width: 20, height: 20 }} />
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange("category", e.target.value)}
          className={css.filterSelect}
        >
          <option value="">All Categories</option>
          {getFilterOptions("category").map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div> */}

      <div className={css.filterGroup}>
        <img src={IconPMTag} alt="" style={{ width: 20, height: 20 }} />
        <select
          value={filters.tag}
          onChange={(e) => handleFilterChange("tag", e.target.value)}
          className={css.filterSelect}
        >
          <option value="">All Tags</option>
          {getFilterOptions("tag").map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <X
          size={16}
          className={css.clearFiltersIcon}
          onClick={() => setFilters({ pic: "", category: "", tag: "" })}
        />
      </div>
    </div>
  );

  useEffect(() => {
    if (isCreateTaskOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isCreateTaskOpen]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(filteredTasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions for all tasks
    const updatedItems = items.map((task, index) => ({
      ...task,
      position: index + 1,
    }));

    // Update both filteredTasks and tasks states immediately for UI update
    setFilteredTasks(updatedItems);
    setTasks((prevTasks) => {
      const updatedTasks = prevTasks.map((task) => {
        const updatedItem = updatedItems.find((item) => item.id === task.id);
        return updatedItem || task;
      });
      return updatedTasks;
    });

    // Update all affected tasks in the database
    try {
      const updatePromises = updatedItems.map((task) =>
        updateProgressTask(task.id, {
          position: task.position,
          updateUser: currentUser.email.split("@")[0],
        })
      );
      await Promise.all(updatePromises);

      // After successful database update, update the selected task if it exists
      if (selectedProgressTask) {
        const updatedSelectedTask = updatedItems.find(
          (task) => task.id === selectedProgressTask.id
        );
        if (updatedSelectedTask) {
          setSelectedProgressTask(updatedSelectedTask);
          localStorage.setItem(
            "selectedProgressTask",
            JSON.stringify(updatedSelectedTask)
          );
        }
      }
    } catch (error) {
      console.error("Error updating task positions:", error);
      // Optionally revert the UI changes if the database update fails
      loadTasks(selectedProgressStep.id);
    }
  };

  const handleStepSelect = (stepId) => {
    const selectedStep = progressSteps.find((step) => step.id === stepId);
    if (selectedStep) {
      setSelectedProgressStep(selectedStep);
      localStorage.setItem(
        "selectedProgressSteps",
        JSON.stringify(selectedStep)
      );
    }
  };

  const handleTaskClick = async (task) => {
    try {
      // Create a copy of the task with its current position
      const taskWithPosition = {
        ...task,
        position:
          filteredTasks.find((t) => t.id === task.id)?.position ||
          task.position,
      };

      setSelectedProgressTask(taskWithPosition);
      localStorage.setItem(
        "selectedProgressTask",
        JSON.stringify(taskWithPosition)
      );

      // When fetching tasks after selection, maintain their current order
      const updatedTasks = filteredTasks.map((t) => ({
        ...t,
        isSelected: t.id === task.id,
      }));

      setFilteredTasks(updatedTasks);
    } catch (error) {
      console.error("Error selecting task:", error);
    }
  };

  return (
    <div className={css.leftPanel}>
      <div className={css.progressTracker}>
        <div className={css.progressHeader}>
          {isEditingTitle ? (
            <div className={css.titleEditContainer}>
              <input
                ref={titleEditInputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className={css.titleEditInput}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleTitleUpdate();
                  }
                }}
              />
              <div className={css.titleEditButtons}>
                <Check
                  size={16}
                  className={css.titleEditIcon}
                  onClick={handleTitleUpdate}
                />
                <X
                  size={16}
                  className={css.titleEditIcon}
                  onClick={handleTitleEditCancel}
                />
              </div>
            </div>
          ) : (
            <div className={css.titleContainer}>
              <h2 className={css.progressTitle} title={progress.title}>
                {progress.title}
              </h2>
              <Pencil
                size={16}
                className={css.editIcon}
                onClick={() => setIsEditingTitle(true)}
              />
            </div>
          )}
          <div className={css.headerActions}>
            <Settings
              size={16}
              className={css.settingsIcon}
              onClick={() => setIsSettingsOpen(true)}
            />
            {isTrackerOpen ? (
              <ArrowUpToLine
                size={16}
                onClick={() => setIsTrackerOpen(false)}
              />
            ) : (
              <ArrowDownToLine
                size={16}
                onClick={() => setIsTrackerOpen(true)}
              />
            )}
          </div>
        </div>
        {isTrackerOpen && progressSteps.length > 0 && (
          <ProgressTracker
            steps={progressSteps}
            onStepSelect={handleStepSelect}
            Status={ProjectStepStatus}
            setSelectedProgressStep={setSelectedProgressStep}
            tasks={tasks}
          />
        )}
      </div>

      <div
        className={css.taskListContainer}
        style={{
          height: isTrackerOpen ? "calc(100% - 230px)" : "calc(100% - 51px)",
        }}
      >
        <TaskListHeader />
        <div className={css.contentWrapper}>
          {!selectedProgressStep || filteredTasks.length === 0 ? (
            <div className={css.noTasksMessage}>No tasks available</div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="taskList">
                {(provided) => (
                  <div
                    className={css.taskList}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {filteredTasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id.toString()}
                        index={index}
                        isDragDisabled={isLocked}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${css.taskItem} 
                                                            ${selectedProgressTask?.id ===
                                task.id
                                ? css.selectedTask
                                : ""
                              }
                                                            ${snapshot.isDragging
                                ? css.dragging
                                : ""
                              }`}
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className={css.taskContent}>
                              <div className={css.leftColumn}>
                                {getStatusIcon(task)}
                              </div>
                              <div className={css.mainInfo}>
                                <div className={css.titleRow}>
                                  <h3 className={css.taskTitle}>
                                    {task.title}
                                  </h3>
                                  <div className={css.metaInfo}>
                                    {task.countFile > 0 && (
                                      <div className={css.countFile}>
                                        <img src={IconSoLuongDinhKem} alt="" />
                                        <span>{task.countFile} đính kèm</span>
                                      </div>
                                    )}
                                    <img
                                      src={HideProgressTaskIcon}
                                      className={`${css.errorIcon} ${task.isHide ? css.iconGrey : ""}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleTaskVisibility(task.id, task.isHide);
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className={css.bottomRow}>
                                  <div className={css.info}>
                                    {task.tag && (
                                      <span className={css.tag}>
                                        <img
                                          src={IconPMTag}
                                          alt=""
                                          style={{
                                            width: 13.5,
                                            height: 13.5,
                                            marginRight: 5,
                                          }}
                                        />
                                        {task.tag}
                                      </span>
                                    )}
                                    {task.deadline && (
                                      <span className={css.deadline}>
                                        <img
                                          src={IconPMTimeline}
                                          alt=""
                                          style={{
                                            width: 13.5,
                                            height: 13.5,
                                            marginRight: 5,
                                          }}
                                        />
                                        {formatDate(task.deadline)}
                                      </span>
                                    )}
                                  </div>
                                  <div className={css.pic}>
                                    {task.pic}
                                    <img
                                      src={IconPMPic}
                                      alt=""
                                      style={{
                                        width: 13.5,
                                        height: 13.5,
                                        marginLeft: 5,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>

      <ProgressSettingsPopup
        progressSteps={progressSteps}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateStep={handleUpdateStep}
        onRemoveStep={handleRemoveStep}
        onCreateStep={handleCreateStep}
      />

      <FilterSettingPopup
        isOpen={isFilterSettingsOpen}
        onClose={() => setIsFilterSettingsOpen(false)}
        progress={selectedProgressStep}
        onUpdateProgress={handleUpdateProgress}
      />

      <CreateTaskPopup
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        selectedProgressStep={selectedProgressStep}
        onCreateTask={handleCreateTask}
        currentUser={currentUser.email}
        ref={titleInputRef}
      />
    </div>
  );
};

export default LeftPanel;
