import React, { useEffect, useState } from "react";
import { Lock, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { IconPMDoing } from "../../../../../../icon/IconSVG";
import styles from "./ProgressTracker.module.css";
// API
import { updateProgressStep } from "../../../../../../apis/progressStepService";

const ProgressTracker = ({
                           steps,
                           onStepSelect,
                           Status,
                           setSelectedProgressStep,
                           tasks,
                           allTasks,
                         }) => {
  const [selectedStepId, setSelectedStepId] = useState(steps[0]?.id);
  const [localSteps, setLocalSteps] = useState([]);

  useEffect(() => {
    // Sort steps by position (null values last) then by id
    const sorted = [...steps].sort((a, b) => {
      if (a.position === null && b.position === null) return a.id - b.id;
      if (a.position === null) return 1;
      if (b.position === null) return -1;
      return a.position - b.position;
    });
    setLocalSteps(sorted);
  }, [steps]);

  useEffect(() => {
    const storedStep = localStorage.getItem("selectedProgressSteps");
    if (storedStep && storedStep !== "undefined") {
      const matchStep = steps.find(
          (step) => step.id == JSON.parse(storedStep).id
      );
      setSelectedStepId(matchStep?.id || steps[0]?.id);
    } else {
      setSelectedStepId(steps[0]?.id);
    }
  }, [steps]);

  const getPendingTaskCount = (stepId) => {
    if (!tasks) return 0;
    return tasks.filter(
        (task) => task.stepId === stepId && !task.status && !task.isHide
    ).length;
  };

  const getTaskCounts = (stepId) => {
    if (!allTasks) return { total: 0, backlog: 0, todo: 0, doing: 0, completed: 0 };
    const stepTasks = allTasks.filter((task) => task.stepId === stepId && !task.isHide);
    return {
      total: stepTasks.length,
      backlog: stepTasks.filter((task) => task.cat === "Backlog").length,
      todo: stepTasks.filter((task) => task.cat === "To-do").length,
      doing: stepTasks.filter((task) => task.cat === "Do-ing").length,
      completed: stepTasks.filter((task) => task.cat === "Hoàn Thành").length,
    };
  };

  const handleStepClick = (step) => {
    setSelectedStepId(step.id);
    if (onStepSelect) {
      onStepSelect(step.id);
    }
    setSelectedProgressStep(step);
    localStorage.setItem("selectedProgressSteps", JSON.stringify(step));
  };

  const handlePositionChange = async (step, direction) => {

    const currentIndex = localSteps.findIndex((s) => s.id === step.id);

    if (currentIndex === -1) {
      console.error("Step not found in localSteps");
      return;
    }

    if (
        (direction === "left" && currentIndex === 0) ||
        (direction === "right" && currentIndex === localSteps.length - 1)
    ) {
      return;
    }

    try {
      // Create a deep copy of localSteps
      const updatedSteps = localSteps.map((s) => ({ ...s }));
      const targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

      // Assign default positions if null
      updatedSteps[currentIndex].position =
          updatedSteps[currentIndex].position ?? currentIndex + 1;
      updatedSteps[targetIndex].position =
          updatedSteps[targetIndex].position ?? targetIndex + 1;

      // Swap positions
      const temp = updatedSteps[currentIndex].position;
      updatedSteps[currentIndex].position = updatedSteps[targetIndex].position;
      updatedSteps[targetIndex].position = temp;

      // Sort steps by position
      const sorted = [...updatedSteps].sort((a, b) => {
        if (a.position === null && b.position === null) return a.id - b.id;
        if (a.position === null) return 1;
        if (b.position === null) return -1;
        return a.position - b.position;
      });

      // Optimistically update UI
      setLocalSteps(sorted);

      // Update database
      const promises = [
        updateProgressStep(updatedSteps[currentIndex].id, {
          position: updatedSteps[currentIndex].position,
        }),
        updateProgressStep(updatedSteps[targetIndex].id, {
          position: updatedSteps[targetIndex].position,
        }),
      ];

      const results = await Promise.all(promises);

      // Notify parent component with updated steps
      if (onStepSelect) {
        onStepSelect(step.id, sorted);
      }
    } catch (error) {
      console.error("Failed to update positions:", error);
      // Revert UI to original state
      setLocalSteps([...localSteps]);
      alert("Failed to update step positions. Please try again.");
    }
  };

  return (
      <div className={styles.containerWrapper}>
        <div className={styles.container}>
          {localSteps.map((step, index) => {
            const taskCounts = getTaskCounts(step.id);
            return (
                <div
                    key={step.id}
                    className={`${styles.step}
              ${step.status === Status.COMPLETED ? styles.completed : ""}
              ${step.status === Status.ONGOING ? styles.ongoing : ""}
              ${step.id === selectedStepId ? styles.selected : ""}`}
                    onClick={() => handleStepClick(step)}
                >
                  <div className={styles.title}>
                    {step.title}
                    {step.isLocked && <Lock className={styles.lockIcon} size={16} />}
                  </div>
                  <div className={styles.taskCount}>
                    {taskCounts.total} mục việc
                    <br />
                    {`Backlog: ${taskCounts.backlog}`}
                    <br />
                    {`To-do: ${taskCounts.todo}`}
                    <br />
                    {`Do-ing: ${taskCounts.doing}`}
                    <br />
                    {`Hoàn Thành: ${taskCounts.completed}`}
                  </div>
                  <div className={styles.arrows}>
                    {index > 0 && (
                        <ArrowUp
                            className={styles.arrowIcon}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePositionChange(step, "left");
                            }}
                        />
                    )}
                    {index < localSteps.length - 1 && (
                        <ArrowDown
                            className={styles.arrowIcon}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePositionChange(step, "right");
                            }}
                        />
                    )}
                  </div>
                </div>
            );
          })}
        </div>
      </div>
  );
};

export default ProgressTracker;