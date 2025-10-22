// ProjectManagerCanvas.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import css from "./ProjectManager.module.css";
import { MyContext } from "../../MyContext";
// COMPONENTS
import PJHeader from "./PJHeader/PJHeader";
import LeftPanel from "./LeftPanel/LeftPanel";
import RightPanel from "./RightPanel/RightPanel";
import WikiStorage from "../Home/WikiStorage/WikiStorage";
// API
import { updateProgressTask } from "../../apis/progressTaskService";
import { getUserClassByEmail } from "../../apis/userClassService";

const ProjectManager = () => {
  const { projectId, stepId, taskId } = useParams();
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState({});
  const [selectedProgressStep, setSelectedProgressStep] = useState(null);
  const [selectedProgressTask, setSelectedProgressTask] = useState(null);
  const [status, setStatus] = useState(false);
  const { currentUser } = useContext(MyContext);
  const [permission, setPermission] = useState({});
  const [taskDetails, setTaskDetails] = useState({
    id: 0,
    cat: "",
    pic: "",
    tag: "",
    deadline: "",
  });
  const [viewMode, setViewMode] = useState("project");
  const [updateProgressStep, setUpdateProgressStep] = useState(false);

  useEffect(() => {
    if (stepId && selectedProject && selectedProject.steps) {
      const step = selectedProject.steps.find(
        (step) => step.id === parseInt(stepId) || step.id === stepId
      );
      if (step) {
        setSelectedProgressStep(step);
      }
    } else if (
      selectedProject &&
      selectedProject.steps &&
      selectedProject.steps.length > 0 &&
      !stepId
    ) {
      setSelectedProgressStep(selectedProject.steps[0]);
    }
  }, [stepId, selectedProject]);

  useEffect(() => {
    if (taskId && selectedProgressStep && selectedProgressStep.tasks) {
      const task = selectedProgressStep.tasks.find(
        (task) => task.id === parseInt(taskId) || task.id === taskId
      );
      if (task) {
        setSelectedProgressTask(task);
      }
    }
  }, [taskId, selectedProgressStep]);

  useEffect(() => {
    if (selectedProgressTask) {
      fetchUserPermission();
    }
  }, [selectedProgressTask]);

  const fetchUserPermission = async () => {
    try {
      const permissions = await getUserClassByEmail();
      const PJPermission = permissions.filter((item) => {
        const progressTasks =
          typeof item.progressTaskAccess === "string"
            ? JSON.parse(item.progressTaskAccess)
            : item.progressTaskAccess;

        return (
          item.module === "PROJECT-MANAGER" &&
          item.progressTaskAccess !== null &&
          item.userAccess?.includes(currentUser.email) &&
          Object.values(progressTasks).some(
            (task) => task.id === selectedProgressTask.id
          )
        );
      });

      if (PJPermission.length > 0) {
        const progressTasks =
          typeof PJPermission[0].progressTaskAccess === "string"
            ? JSON.parse(PJPermission[0].progressTaskAccess)
            : PJPermission[0].progressTaskAccess;

        const matchingTask = Object.values(progressTasks).find(
          (task) => task.id === selectedProgressTask.id
        );
        setPermission(matchingTask.permissions);
      }
    } catch (error) {
      console.error("Error fetching user permission:", error);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    const updatedTask = await updateProgressTask(taskId, updates);
    setSelectedProgressTask(updatedTask);
    setTaskDetails({
      id: updatedTask.id,
      cat: updatedTask.cat,
      pic: updatedTask.pic,
      tag: updatedTask.tag,
      deadline: updatedTask.deadline,
    });
  };

  const handleStatusUpdate = (newStatus) => {
    setStatus(newStatus);
  };

  const handleProjectChange = (project) => {
    setSelectedProject(project);
    // const handleNavigation = (projectId, stepId, taskId) => {
      // if (stepId && taskId) {
      //   navigate(`/canvas/${companySelect}/${buSelect}/cong-cu/project-manager/${projectId}/step/${stepId}/task/${taskId}`);
      // } else {
        navigate(`/project-manager/${project.id}`);
      // }
    // }
    setSelectedProgressStep(null);
    setSelectedProgressTask(null);
  };

  const handleStepChange = (step) => {
    setSelectedProgressStep(step);
    if (step) {
      navigate(`/project-manager/${selectedProject.id}/step/${step.id}`);
    }
    setSelectedProgressTask(null);
  };

  const handleTaskChange = (task) => {
    if (task && selectedProgressStep) {
      setSelectedProgressTask(task);
      navigate(
        `/project-manager/${selectedProject.id}/step/${selectedProgressStep.id}/task/${task.id}`,
      );
    }
  };

  return (
    <>
      <PJHeader
        selectedProject={selectedProject}
        setSelectedProject={handleProjectChange}
        projectId={projectId}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      <div className={css.mainContent}>
        {viewMode === "project" ? (
          selectedProject &&
          selectedProject.id && (
            <>
              <LeftPanel
                progress={selectedProject}
                setSelectedProject={handleProjectChange}
                selectedProgressStep={selectedProgressStep}
                setSelectedProgressStep={handleStepChange}
                selectedProgressTask={selectedProgressTask}
                setSelectedProgressTask={handleTaskChange}
                taskDetails={taskDetails}
                stepId={stepId}
                taskId={taskId}
                reloadProgressStep={updateProgressStep}
                setUpdateProgressStep={setUpdateProgressStep}
              />
              <RightPanel
                selectedProgressStep={selectedProgressStep}
                selectedProgressTask={selectedProgressTask}
                onUpdateTask={handleUpdateTask}
                onStatusUpdate={handleStatusUpdate}
                permission={permission}
                setTaskDetails={setTaskDetails}
                setUpdateProgressStep={setUpdateProgressStep}
              />
            </>
          )
        ) : (
          <WikiStorage />
        )}
      </div>
    </>
  );
};

export default ProjectManager;
