import React, {useEffect, useState} from "react";
import css from "./TemplateStepList.module.css";
import {createNewStep, deleteStep, getAllStep, updateStep} from "../../../../apis/stepService.jsx"; // Import the updateStep service
import {EditIcon, IconBack, IconForward, XRedIcon} from "../../../../icon/IconSVG.js";
import {useNavigate} from "react-router-dom";
import {IconButton} from "@mui/material";
import Mapping from "./Mapping/Mapping.jsx";
import {message, Modal, Select} from "antd";
import {LIST_STEP_TYPE} from "../../../../Consts/LIST_STEP_TYPE.js";

const TemplateStepList = ({idTemp, template}) => {

    const [steps, setSteps] = useState([]);
    const [initSteps, setInitSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [selectedType, setSelectedType] = useState(false);
    const navigate = useNavigate();
    const getData = () => {
        getAllStep().then(data => {
            let filteredData = data.filter(e => e?.template_id == idTemp);
            filteredData.sort((a, b) => a.position - b.position);
            setSteps(data.filter(e => e?.template_id == idTemp));
        });
    };

    useEffect(() => {
        getData();
    }, [idTemp]);

    const handleStepClick = (step) => {
        setCurrentStep(step);
        navigate(`steps/${step.id}`);
    };

    const handleSetEdit = () => {
        setIsEditing(true);
        setInitSteps(steps);  // Save the current state for canceling later
    };

    const handleOpenModal = () => {
        setOpenModal(true);
    };
    const handleCloseModal = () => {
        setOpenModal(false);
    };
    const handleSelectType = (value) => {
        setSelectedType(value)
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        getData();
    };

    const handleSaveEdit = () => {

        const newSteps = steps.filter((step) => !step.id);
        const editedSteps = steps.filter((step) => step.id && step.modified);
        const deletedSteps = steps.filter((step) => step.deleted);
        Promise.all([
            ...newSteps.map((step) => createNewStep(step)),
            ...editedSteps.map((step) => updateStep(step)),
            ...deletedSteps.map((step) => deleteStep(step.id)),
        ])
            .then(() => {
                message.success("Đã lưu cài đặt!");
                setIsEditing(false);
                getData();
            })
            .catch((error) => console.error("Error saving changes:", error));
    };

    const handleAddStep = () => {
        const newStep = {
            name: `Bước ${steps.length + 1}`,
            position: steps.length + 1,
            type: selectedType || "mac_dinh",
            template_id: idTemp,
        };
        setSteps([...steps, newStep]);
        setOpenModal(false);
    };

    const handleDeleteStep = (step) => {
        if (step.id) {
            setSteps((prevSteps) =>
                prevSteps.map((s) =>
                    s.id == step.id ? {...s, deleted: true} : s
                )
            );
        } else {
            setSteps((prevSteps) =>
                prevSteps.filter((s) => s.position !== step.position)
            );
        }
    };


    const handleRenameStep = (value, step) => {
        if (step.id) {
            setSteps((prevSteps) =>
                prevSteps.map((s) =>
                    s.id == step.id ? {...s, name: value, modified: true} : s
                )
            );
        } else {
            // Cập nhật tên cho bước không có ID
            setSteps((prevSteps) =>
                prevSteps.map((s) =>
                    s.position == step.position ? {...s, name: value} : s
                )
            );
        }
    };


    const moveStep = (step, direction) => {
        if (step.id) {
            setSteps((prevSteps) => {
                const index = prevSteps.findIndex((s) => s.id == step.id);
                if (index == -1) return prevSteps;

                const newSteps = [...prevSteps];
                const targetIndex = index + direction;

                if (targetIndex >= 0 && targetIndex < newSteps.length) {
                    [newSteps[index], newSteps[targetIndex]] = [
                        newSteps[targetIndex],
                        newSteps[index],
                    ];

                    newSteps[index].position = index + 1;
                    newSteps[targetIndex].position = targetIndex + 1;
                }

                return newSteps;
            });
        } else {
            setSteps((prevSteps) => {
                const index = prevSteps.findIndex((s) => s.position == step.position);
                if (index == -1) return prevSteps;

                const newSteps = [...prevSteps];
                const targetIndex = index + direction;

                if (targetIndex >= 0 && targetIndex < newSteps.length) {
                    [newSteps[index], newSteps[targetIndex]] = [
                        newSteps[targetIndex],
                        newSteps[index],
                    ];

                    newSteps[index].position = index + 1;
                    newSteps[targetIndex].position = targetIndex + 1;
                }

                return newSteps;
            });
        }

    };

    const handleToggleSkipable = (stepId, isSkipable) => {
        setSteps((prevSteps) =>
            prevSteps.map((step) =>
                step.id == stepId
                    ? {...step, skipable: isSkipable, modified: true}
                    : step
            )
        );
    };

    return (
        <>
            <div className={css.list_header}>
                <span>{template.name} {currentStep ? `${"-" + " " + currentStep.name}` : null}</span>
                {!isEditing && (
                    <IconButton onClick={handleSetEdit} size="small">
                        <img src={EditIcon} alt=""/>
                    </IconButton>
                )}
                {isEditing && (
                    <>
                        <div className={css.newButton} onClick={handleSaveEdit}>
                            <p>Lưu</p>
                        </div>

                        <div className={css.newButton} onClick={handleCancelEdit}>
                            <p>Hủy</p>
                        </div>
                        <div className={css.newButton} onClick={handleOpenModal}>
                            <p>+ Bước</p>
                        </div>
                        <div className={css.newButton} onClick={() => {
                            setOpenDialog(true)
                        }}>
                            <p>Mapping</p>
                        </div>
                    </>
                )}
            </div>
            <div className={css.stepListWrapper}>
                <div className={css.stepWrapper}>
                    {steps.map((step, index) => (
                        <>
                            {
                                !step.deleted && <div key={step.id} className={css.step}>
                                    <div>
                                        <div style={{
                                            width: '100%',
                                            display: "flex",
                                            justifyContent: 'center'
                                        }}>Loại: {!step.type || step.type == 'mac_dinh' ? 'Mặc định' : step.type}</div>
                                        <div
                                            onClick={() => handleStepClick(step)}
                                            className={`${css.stepIconWrapper} ${
                                                currentStep?.id == step.id ? css.highlight : ""
                                            }`}
                                        >

                                            {isEditing && (
                                                <div
                                                    className={css.deleteButton}
                                                    onClick={() => handleDeleteStep(step)}  // Trigger the delete function on click
                                                >
                                                    <img className={css.edit_icon} src={XRedIcon} alt="Delete Step"/>
                                                </div>
                                            )}

                                            {isEditing ? (
                                                // Show input field when editing
                                                <input
                                                    type="text"
                                                    value={step.name}
                                                    onChange={(e) => handleRenameStep(e.target.value, step)}
                                                    className={css.editInput}
                                                />
                                            ) : (
                                                <p>{step.name}</p>
                                            )}
                                        </div>


                                        <div className={`${css.moveStep} ${isEditing && css.showMove} `}>
                                            <img
                                                src={IconBack}
                                                alt=""
                                                onClick={() => moveStep(step, -1)} // Move step back
                                                className={`${index == 0 && css.hideMove}`}
                                            />
                                            <img
                                                src={IconForward}
                                                alt=""
                                                onClick={() => moveStep(step, 1)} // Move step forward
                                                className={`${index == steps.length - 1 && css.hideMove}`}
                                            />
                                        </div>
                                        <div className={css.skip}>
                                            {isEditing && (
                                                <>
                                                    <input
                                                        type="checkbox"
                                                        checked={step.skipable || false}
                                                        onChange={(e) => handleToggleSkipable(step.id, e.target.checked)}
                                                    />
                                                    Có thể bỏ qua
                                                </>
                                            )}
                                            {!isEditing && (
                                                <div>
                                                    {step.skipable ? 'Có thể bỏ qua' : 'Không thể bỏ qua'}
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    {index < steps.length - 1 && (
                                        <div className={css.arrowConnector}>
                                            <img src="/animated-arrow.svg" alt=""/>
                                        </div>
                                    )}
                                </div>
                            }
                        </>

                    ))}
                </div>
            </div>
            {
                openDialog && <Mapping idTemp={idTemp} openDialog={openDialog} setOpenDialog={setOpenDialog}/>
            }
            <Modal
                title={'Chọn loại bước'}
                open={openModal}
                onCancel={handleCloseModal}
                width={600}
                onOk={handleAddStep}
            >
                <Select
                    style={{width: '100%'}}
                    onChange={handleSelectType}
                >
                    {LIST_STEP_TYPE.map(e => (
                        <Select.Option value={e}>{e}</Select.Option>
                    ))}
                </Select>
            </Modal>
        </>
    );
};

export default TemplateStepList;
