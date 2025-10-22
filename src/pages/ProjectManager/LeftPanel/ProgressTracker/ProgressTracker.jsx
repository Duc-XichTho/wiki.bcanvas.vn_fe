import React, { useEffect, useState } from "react";
import { Lock, ArrowLeft, ArrowRight } from "lucide-react";
import { IconPMDoing } from "../../../../icon/IconSVG";
import styles from "./ProgressTracker.module.css";
// API
import { updateProgressStep } from "../../../../apis/progressStepService";

const ProgressTracker = ({
  steps,
  onStepSelect,
  Status,
  setSelectedProgressStep,
  tasks,
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
      setSelectedStepId(matchStep.id);
    } else {
      setSelectedStepId(steps[0].id);
    }
  }, [steps]);

  const getPendingTaskCount = (stepId) => {
    if (!tasks) return 0;
    return tasks.filter(
      (task) => task.stepId === stepId && !task.status && !task.isHide
    ).length;
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
    if (
      (direction === "left" && currentIndex === 0) ||
      (direction === "right" && currentIndex === localSteps.length - 1)
    )
      return;

    try {
      const updatedSteps = [...localSteps];
      if (direction === "left") {
        // Swap positions with the step to the left
        const temp = updatedSteps[currentIndex].position;
        updatedSteps[currentIndex].position = updatedSteps[currentIndex - 1].position;
        updatedSteps[currentIndex - 1].position = temp;
      } else {
        // Swap positions with the step to the right
        const temp = updatedSteps[currentIndex].position;
        updatedSteps[currentIndex].position = updatedSteps[currentIndex + 1].position;
        updatedSteps[currentIndex + 1].position = temp;
      }

      // Sort the steps by position
      const sorted = updatedSteps.sort((a, b) => {
        if (a.position === null && b.position === null) return a.id - b.id;
        if (a.position === null) return 1;
        if (b.position === null) return -1;
        return a.position - b.position;
      });

      // Update all affected steps in the database
      const promises = [
        updateProgressStep(updatedSteps[currentIndex].id, updatedSteps[currentIndex]),
        direction === "left"
          ? updateProgressStep(updatedSteps[currentIndex - 1].id, updatedSteps[currentIndex - 1])
          : updateProgressStep(updatedSteps[currentIndex + 1].id, updatedSteps[currentIndex + 1])
      ];

      await Promise.all(promises);
      setLocalSteps(sorted);

      // Notify parent component
      if (onStepSelect) {
        onStepSelect(step.id, true);
      }
    } catch (error) {
      console.error("Failed to update positions:", error);
    }
  };

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        {localSteps.map((step, index) => (
          <div
            key={step.id}
            className={`${styles.step} 
                            ${step.status === Status.COMPLETED
                ? styles.completed
                : ""
              } 
                            ${step.status === Status.ONGOING
                ? styles.ongoing
                : ""
              } 
                            ${step.id === selectedStepId ? styles.selected : ""
              }`}
            onClick={() => handleStepClick(step)}
          >
            <div className={styles.arrows}>
              {index !== 0 && (
                <div
                  className={styles.arrowButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePositionChange(step, "left");
                  }}
                >
                  <ArrowLeft className={styles.arrowIcon} size={16} />
                </div>
              )}
              {index !== localSteps.length - 1 && (
                <div
                  className={styles.arrowButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePositionChange(step, "right");
                  }}
                >
                  <ArrowRight className={styles.arrowIcon} size={16} />
                </div>
              )}
            </div>
            <div className={styles.title}>
              {step.title}
              {step.isLocked && <Lock className={styles.lockIcon} size={16} />}
            </div>
            <div className={styles.indicator}>
              {step.status === Status.COMPLETED && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  viewBox="0 0 48 48"
                >
                  <path
                    fill="#c8e6c9"
                    d="M44,24c0,11.045-8.955,20-20,20S4,35.045,4,24S12.955,4,24,4S44,12.955,44,24z"
                  ></path>
                  <path
                    fill="#4caf50"
                    d="M34.586,14.586l-13.57,13.586l-5.602-5.586l-2.828,2.828l8.434,8.414l16.395-16.414L34.586,14.586z"
                  ></path>
                </svg>
              )}
              {step.status === Status.ONGOING && (
                <>
                  {step.pendingNum === 0 ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      x="0px"
                      y="0px"
                      width="100"
                      height="100"
                      viewBox="0 0 48 48"
                    >
                      <path
                        fill="#c8e6c9"
                        d="M44,24c0,11.045-8.955,20-20,20S4,35.045,4,24S12.955,4,24,4S44,12.955,44,24z"
                      ></path>
                      <path
                        fill="#4caf50"
                        d="M34.586,14.586l-13.57,13.586l-5.602-5.586l-2.828,2.828l8.434,8.414l16.395-16.414L34.586,14.586z"
                      ></path>
                    </svg>
                  ) : (
                    <img
                      src={IconPMDoing}
                      alt=""
                      style={{ width: 30, height: 30 }}
                    />
                  )}
                </>
              )}
            </div>
            {step.status !== Status.COMPLETED && (
              <div className={styles.taskCount}>
                {step.pendingNum} task chờ PIC xác nhận
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;
