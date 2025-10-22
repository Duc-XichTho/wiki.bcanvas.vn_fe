import React, { useEffect, useState, useContext, useRef } from "react";
import css from "./LeftPanelCanvas.module.css";
import { MyContext } from "../../../../../MyContext";
// CONST
import { ProjectStepStatus } from "../../../../../CONST";
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
  Pencil, ChevronDown,
} from 'lucide-react';
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
  IconSoLuongDinhKem, ScrewIcon,
} from '../../../../../icon/IconSVG';
// COMPONENTS
import ProgressTracker from "./ProgressTracker/ProgressTracker";
import ProgressSettingsPopup from "./ProgressSettingsPopup/ProgressSettingsPopup";
import FilterSettingPopup from "./FilterSettingPopup/FilterSettingPopup";
import CreateTaskPopup from "./CreateTaskPopup/CreateTaskPopup";
// API
import { createProgress, deleteProgress, getAllProgress, updateProgress } from '../../../../../apis/progressService';
import {
  getAllProgressStep,
  createProgressStep,
  updateProgressStep,
  deleteProgressStep,
} from "../../../../../apis/progressStepService";
import {
  getAllProgressTask,
  createProgressTask,
  updateProgressTask,
} from "../../../../../apis/progressTaskService";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useNavigate } from 'react-router-dom';
import ProjectManager from '../../../../Admin2/Components/ProjectManager/ProjectManager.jsx';
import { Button } from 'antd';


const LeftPanelCanvas = ({
  progress,
  setSelectedProject, selectedProject,
  selectedProgressStep,
  setSelectedProgressStep,
  selectedProgressTask,
  setSelectedProgressTask,
  taskDetails,
  stepId,
  taskId,
  reloadProgressStep,
  setUpdateProgressStep,
                           projectId,
                           viewMode,
                           setViewMode,

}) => {
  const progressId = progress.id;
  const [isFilterSettingsOpen, setIsFilterSettingsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(true);
  const [progressSteps, setProgressSteps] = useState([]);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [showHiddenTasks, setShowHiddenTasks] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingName, setEditingName] = useState("");
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  const statusOptions = ["Đang triển khai", "Hoàn thành", "Tạm dừng"];
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
    loadProject();
  }, []);

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
    if (selectedProgressTask) {
      const { pic, status } = selectedProgressTask;
      if (pic && !status ) {
        handleUpdateTaskCategory(selectedProgressTask.id, "Do-ing");
      }
    }
  }, [selectedProgressTask]);


  useEffect(() => {
    if (selectedProgressTask) {
      const { status } = selectedProgressTask;
      if (status) {
        handleUpdateTaskCategory(selectedProgressTask.id, "Hoàn Thành");
      }
    }
  }, [selectedProgressTask]);


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
  const handleProjectChange = (event) => {
    const selectedProjectId = event.target.value;
    const project = progress.find((p) => p.id === parseInt(selectedProjectId));
    setSelectedProject(project);
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
      const allTasks = [];
      for (const step of data) {
        const tasks = await getAllProgressTask(step.id);
        step.pendingNum = getPendingTaskCount(step.id, tasks);
        allTasks.push(...tasks.map(task => ({ ...task, stepId: step.id })));
      }

      setProgressSteps(data);
      setAllTasks(allTasks);

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

    try {
      const newStep = await createProgressStep(newStepData);

      // Update the step with a position equal to its id
      const updatedStep = { ...newStep, position: newStep.id };
      await updateProgressStep(newStep.id, { position: newStep.id });

      setProgressSteps([...progressSteps, updatedStep]);
    } catch (error) {
      console.error("Error creating step:", error);
    }
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
      cat: "To-do",
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
            {/*<span style={{fontSize:'10px'}}>Tạo mới</span>*/}
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
  // const tagSection = () => {
  //   const tags = getFilterOptions("tag"); // Get all unique tags from tasks
  //
  //   return (
  //       <div className={css.tagSection}>
  //         <button
  //             className={css.clearButton}
  //             style={{ padding: '2px 8px 2px 8px' }}
  //             onClick={() => setFilters({ pic: '', category: '', tag: '' })}
  //         >
  //           All
  //         </button>
  //         {tags.map((tag) => (
  //             <button style={{ padding: '2px 8px 2px 8px' }}
  //                 key={tag}
  //                 className={`${css.tagButton} ${
  //                     filters.tag === tag ? css.activeTagButton : ''
  //                 }`}
  //                 onClick={() =>
  //                     setFilters((prev) => ({
  //                       ...prev,
  //                       tag: prev.tag === tag ? '' : tag, // Toggle tag filter
  //                     }))
  //                 }
  //             >
  //               {tag}
  //             </button>
  //         ))}
  //       </div>
  //   );
  // };
  const categorySection = () => {
    const categories = ["To-do", "Do-ing", "Hoàn Thành", "Backlog"];
    const categoryColors = {
      "Backlog": "#82d5e3",
      "To-do": "#70cfa1",
      "Do-ing": "#fbb77c",
      "Hoàn Thành": "#b0b9ca",
    };

    const getCategoryCount = (category) => {
      return tasks.filter((task) => task.cat === category).length;
    };

    const handleCategoryClick = (category) => {
      setFilters((prev) => ({
        ...prev,
        category: prev.category === category ? "" : category,
      }));
    };

    return (
        <div className={css.categorySection} style={{ padding: "2px 4px 2px 4px" }}>
          {categories.map((category) => (
              <button
                  key={category}
                  style={{
                    padding: "2px 4px 2px 4px",
                    backgroundColor: categoryColors[category],
                    color: "black",
                    fontWeight: filters.category === category ? "bold" : "normal",
                    border: "none",
                    borderRadius: "4px",
                    margin: "0 1px",
                  }}
                  className={`${css.categoryButton} ${
                      filters.category === category ? css.activeCategoryButton : ""
                  }`}
                  onClick={() => handleCategoryClick(category)}
              >
                {category} ({getCategoryCount(category)})
              </button>
          ))}
        </div>
    );
  };

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

  const handleStepSelect = (stepId, updatedSteps) => {
    const selectedStep = progressSteps.find((step) => step.id === stepId);
    if (selectedStep) {
      setSelectedProgressStep(selectedStep);
      localStorage.setItem("selectedProgressSteps", JSON.stringify(selectedStep));
      loadTasks(selectedStep.id); // Load tasks for the selected step
    }
    if (updatedSteps) {
      // Update progressSteps with the new order
      setProgressSteps(updatedSteps);
    }
  };
  const loadProject = async () => {
    try {
      const data = await getAllProgress();
      setProjects(data);

      if (data.length === 0) return;

      let target = null;

      if (projectId) {
        target = data.find((project) => project.id == projectId);
      } else {
        const storedData = localStorage.getItem("selectedProgressProject");
        if (storedData) {
          const storedProject = JSON.parse(storedData);
          target = data.find((project) => project.id === storedProject.id);
        }
      }

      const selectedProject = target || data[0];
      setSelectedProject(selectedProject);
      localStorage.setItem(
          "selectedProgressProject",
          JSON.stringify(selectedProject)
      );
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      const newProjectData = {
        name: newProjectName,
        status: "Đang triển khai",
      };
      try {
        const newProject = await createProgress(newProjectData);
        setProjects([...projects, newProject]);
        setSelectedProject(newProject);
        localStorage.setItem(
            "selectedProgressProject",
            JSON.stringify(newProject)
        );
        setNewProjectName("");
        setIsModalOpen(false);
        setIsDropdownOpen(false);
      } catch (error) {
        console.error("Error creating project:", error);
      }
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (editingName.trim()) {
      const updatedData = {
        ...selectedProject,
        name: editingName,
      };
      try {
        const updatedProject = await updateProgress(updatedData);
        const updatedProjects = projects.map((project) =>
            project.id === selectedProject.id ? updatedProject : project
        );
        setProjects(updatedProjects);
        setSelectedProject(updatedProject);
        localStorage.setItem(
            "selectedProgressProject",
            JSON.stringify(updatedProject)
        );
        setIsProjectSettingsOpen(false);
      } catch (error) {
        console.error("Error updating project:", error);
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    const updatedData = {
      ...selectedProject,
      status: newStatus,
    };
    try {
      const updatedProject = await updateProgress(updatedData);
      const updatedProjects = projects.map((project) =>
          project.id === selectedProject.id ? updatedProject : project
      );
      setProjects(updatedProjects);
      setSelectedProject(updatedProject);
      localStorage.setItem(
          "selectedProgressProject",
          JSON.stringify(updatedProject)
      );
    } catch (error) {
      console.error("Error updating project status:", error);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProgress(selectedProject.id);
      const updatedProjects = projects.filter(
          (project) => project.id !== selectedProject.id
      );
      setProjects(updatedProjects);
      if (updatedProjects.length > 0) {
        setSelectedProject(updatedProjects[0]);
        localStorage.setItem(
            "selectedProgressProject",
            JSON.stringify(updatedProjects[0])
        );
      } else {
        setSelectedProject({});
        localStorage.removeItem("selectedProgressProject");
      }
      setIsProjectSettingsOpen(false);
    } catch (error) {
      console.error("Error deleting project:", error);
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

  const handleUpdateTaskCategory = async (taskId, newCategory) => {
    try {
      const updatedTask = await updateProgressTask(taskId, { cat: newCategory });
      setTasks((prevTasks) =>
          prevTasks.map((task) =>
              task.id === taskId ? { ...task, cat: newCategory } : task
          )
      );
    } catch (error) {
      console.error("Error updating task category:", error);
    }
  };

  return (
      <div className={css.leftPanel}>
        <div className={css.progressHeader}>

          <div className={css.progressLeftContainer}>
            {/*{isEditingTitle ? (*/}
            {/*    <div className={css.titleEditContainer}>*/}
            {/*      <input*/}
            {/*          ref={titleEditInputRef}*/}
            {/*          type="text"*/}
            {/*          value={editedTitle}*/}
            {/*          onChange={(e) => setEditedTitle(e.target.value)}*/}
            {/*          className={css.titleEditInput}*/}
            {/*          onKeyPress={(e) => {*/}
            {/*            if (e.key === 'Enter') {*/}
            {/*              handleTitleUpdate();*/}
            {/*            }*/}
            {/*          }}*/}
            {/*      />*/}

            {/*      <div className={css.titleEditButtons}>*/}
            {/*        <Check*/}
            {/*            size={16}*/}
            {/*            className={css.titleEditIcon}*/}
            {/*            onClick={handleTitleUpdate}*/}
            {/*        />*/}
            {/*        <X*/}
            {/*            size={16}*/}
            {/*            className={css.titleEditIcon}*/}
            {/*            onClick={handleTitleEditCancel}*/}
            {/*        />*/}
            {/*      </div>*/}
            {/*    </div>*/}
            {/*) : (*/}
            {/*    <div className={css.titleContainer}>*/}
            {/*      <h2 className={css.progressTitle} title={progress.title}>*/}
            {/*        {progress.title}*/}
            {/*      </h2>*/}
            {/*      <Pencil*/}
            {/*          size={16}*/}
            {/*          className={css.editIcon}*/}
            {/*          onClick={() => setIsEditingTitle(true)}*/}
            {/*      />*/}
            {/*    </div>*/}
            {/*)}*/}
            <div className={css.dropdown}>
              <button
                  className={css.dropdownButton}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {selectedProject.name}
                <ChevronDown size={20} />
              </button>

              {isDropdownOpen && (
                  <div className={css.dropdownContent}>
                    <div
                        className={css.createNewProject}
                        onClick={() => {
                          setIsModalOpen(true);
                          setIsDropdownOpen(false);
                        }}
                    >
                      Create new Project
                    </div>
                    <div className={css.dropdownDivider} />
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className={css.dropdownItem}
                            onClick={() => {
                              setSelectedProject(project);
                              console.log(project);
                              localStorage.setItem(
                                  'selectedProgressProject',
                                  JSON.stringify(project),
                              );
                              setIsDropdownOpen(false);
                            }}
                        >
                          {project.name}
                        </div>
                    ))}
                  </div>
              )}
              {isModalOpen && (
                  <div className={css.modalOverlay}>
                    <div className={css.modal}>
                      <div className={css.modalHeader}>
                        <h2>Create New Project</h2>
                        <button
                            className={css.closeButton}
                            onClick={() => setIsModalOpen(false)}
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <form onSubmit={handleCreateProject}>
                        <div className={css.modalContent}>
                          <label htmlFor="projectName">Project Name</label>
                          <input
                              id="projectName"
                              type="text"
                              value={newProjectName}
                              onChange={(e) => setNewProjectName(e.target.value)}
                              placeholder="Enter project name"
                          />
                        </div>
                        <div className={css.modalFooter}>
                          <button
                              type="button"
                              className={css.cancelButton}
                              onClick={() => setIsModalOpen(false)}
                          >
                            Cancel
                          </button>
                          <button type="submit" className={css.createButton}>
                            Create
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
              )}
            </div>
            <div className={css.statusBox}>
              <span>{selectedProject.status}</span>
            </div>
            
          </div>
          <div className={css.headerActions}>
            <div className={css.settingsContainer}>
              <button
                  className={css.settingsButton}
                  onClick={() =>
                      setIsSettingsDropdownOpen(!isSettingsDropdownOpen)
                  }
              >
                <img src={ScrewIcon} alt="" size={20} />
              </button>
              {isSettingsDropdownOpen && (
                  <div className={css.settingsDropdown}>
                    <div
                        className={css.settingsOption}
                        onClick={() => {
                          setIsProjectSettingsOpen(true);
                          setEditingName(selectedProject.name);
                          setIsSettingsDropdownOpen(false);
                        }}
                    >
                      Project Settings
                    </div>
                    <div
                        className={css.settingsOption}
                        onClick={() => {
                          setIsAdminSettingsOpen(true);
                          setIsSettingsDropdownOpen(false);
                        }}
                    >
                      Admin Settings
                    </div>
                  </div>
              )}
              {isProjectSettingsOpen && (
                  <div className={css.modalOverlay}>
                    <div className={css.modal}>
                      <div className={css.modalHeader}>
                        <h2>Project Settings</h2>
                        <button
                            className={css.closeButton}
                            onClick={() => setIsProjectSettingsOpen(false)}
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <form onSubmit={handleUpdateProject}>
                        <div className={css.modalContent}>
                          <div className={css.formGroup}>
                            <label htmlFor="editName">Project Name</label>
                            <input
                                id="editName"
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                placeholder="Enter project name"
                            />
                          </div>

                          <div className={css.formGroup}>
                            <label>Project Status</label>
                            <div className={css.statusOptions}>
                              {statusOptions.map((status) => (
                                  <button
                                      key={status}
                                      type="button"
                                      className={`${css.statusOption} ${selectedProject.status === status
                                          ? css.statusOptionActive
                                          : ''
                                      }`}
                                      onClick={() => handleStatusChange(status)}
                                  >
                                    {status}
                                  </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className={css.modalFooter}>
                          <button
                              type="button"
                              className={css.deleteButton}
                              onClick={handleDeleteProject}
                          >
                            Delete Project
                          </button>
                          <div className={css.modalActions}>
                            <button
                                type="button"
                                className={css.cancelButton}
                                onClick={() => setIsProjectSettingsOpen(false)}
                            >
                              Cancel
                            </button>
                            <button type="submit" className={css.createButton}>
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
              )}
              {isAdminSettingsOpen && (
                  <div className={css.modalOverlay}>
                    <div className={`${css.modal} ${css.adminSettingsModal}`}>
                      <div className={css.modalHeader}>
                        <h2>Admin Settings</h2>
                        <button
                            className={css.closeButton}
                            onClick={() => setIsAdminSettingsOpen(false)}
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className={css.modalContent}>
                        <ProjectManager />
                      </div>
                    </div>
                  </div>
              )}
            </div>


            {/*<Settings*/}
            {/*    size={16}*/}
            {/*    className={css.settingsIcon}*/}
            {/*    onClick={() => setIsSettingsOpen(true)}*/}
            {/*/>*/}
            {/*{isTrackerOpen ? (*/}
            {/*    <ArrowUpToLine*/}
            {/*        size={16}*/}
            {/*        onClick={() => setIsTrackerOpen(false)}*/}
            {/*    />*/}
            {/*) : (*/}
            {/*    <ArrowDownToLine*/}
            {/*        size={16}*/}
            {/*        onClick={() => setIsTrackerOpen(true)}*/}
            {/*    />*/}
            {/*)}*/}
          </div>
        </div>
        <div className={css.progressAndTaskContainer}>
          <div className={css.progressTracker}>

            {isTrackerOpen && progressSteps.length > 0 && (
                <ProgressTracker
                    steps={progressSteps}
                    onStepSelect={handleStepSelect}
                    Status={ProjectStepStatus}
                    setSelectedProgressStep={setSelectedProgressStep}
                    tasks={tasks}
                    allTasks={allTasks}
                />
            )}
            <button
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  fontSize: '70px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: 'auto',
                  backgroundColor: '#ffffff',
                  color: '#c6c2c2',
                  border: 'none',
                  cursor: 'pointer',
                  transform: 'translateX(-9px)',
                }}
                onClick={() => setIsSettingsOpen(true)}
            >
              <span
                  style={{
                    display: 'inline-block',
                    transform: 'translateY(-5px)',
                  }}
              >
               +
              </span>
            </button>
          </div>

          <div
              className={css.taskListContainer}
              style={{
                // height: isTrackerOpen ? 'calc(100% - 232px)' : 'calc(100% - 80px)',
              }}
          >
            <TaskListHeader />
            {/*{tagSection()}*/}
            {categorySection()}

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
                                              : ''
                                          }
                                                            ${snapshot.isDragging
                                              ? css.dragging
                                              : ''
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
                                                    className={`${css.errorIcon} ${task.isHide ? css.iconGrey : ''}`}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleToggleTaskVisibility(task.id, task.isHide);
                                                    }}
                                                />
                                                <select
                                                    className={css.categoryDropdown}
                                                    value={task.cat || 'Default'} // Default value
                                                    onChange={(e) => {
                                                      e.stopPropagation();
                                                      const newCategory = e.target.value;
                                                      handleUpdateTaskCategory(task.id, newCategory);
                                                    }}
                                                >
                                                  <option value="To-do">To-do</option>
                                                  <option value="Do-ing">Do-ing</option>
                                                  <option value="Hoàn Thành">Hoàn Thành</option>
                                                  <option value="Backlog">Backlog</option>
                                                </select>
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
      </div>
        );
        };

        export default LeftPanelCanvas;
