import {useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {createNewSubStep, deleteSubStep, getAllSubStep, updateSubStep} from "../../../../apis/subStepService.jsx";
import {Input, Modal, Select} from 'antd';
import css from './TemplateStepDetail.module.css';
import {
    TYPE_ACTION,
    TYPE_CHECKLIST, TYPE_CUSTOM,
    TYPE_DK,
    TYPE_DK_PRO,
    TYPE_FORM,
    TYPE_NOTEPAD, TYPE_SALARY,
    TYPE_SHEET
} from "../../../../Consts/SECTION_TYPE.js";
// COMPONENTS
import TemplateInput from "./TemplateInput/TemplateInput.jsx";
import TemplateNotePad from "./TemplateNotepad/TemplateNotepad.jsx";
import TemplateChecklist from "./TemplateChecklist/TemplateChecklist.jsx";
import TemplateDK from "./TemplateDK/TemplateDK.jsx";
import TemplateDKPro from "./TemplateDKPro/TemplateDKPro.jsx";
import TemplateSheet from "./TemplateSheet/TemplateSheet.jsx";
import {BluePlusCircle, EditIcon, ICONDOWN, ICONUP, SaveTron, UnSaveTron} from "../../../../icon/IconSVG.js";
import PopUpDeleteTemplate from "../../popUpDelete/popUpDeleteTemplate.jsx";
import {toast} from "react-toastify";
import TemplateAction from "./TemplateAction/TemplateAction.jsx";
import TemplateSalary from "./TemplateSalary/TemplateSalary.jsx";
import TemplateCustom from "./TemplateCustom/TemplateCustom.jsx";
import {getAllStep} from "../../../../apis/stepService.jsx";

const TemplateStepDetail = () => {
    const {idStep} = useParams();
    const [listSubStep, setListSubStep] = useState([]);
    const [editingSubStep, setEditingSubStep] = useState(null);
    const [newSubStepName, setNewSubStepName] = useState('');
    const [newSubStepType, setNewSubStepType] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        loadList();
    }, [idStep]);

    function loadList() {
        getAllStep().then(steps => {
            let selectedStep = steps.find(item => item.id == idStep);
            let mau;
            if (selectedStep && selectedStep.type && !selectedStep.type.includes('M|')) {
                mau = steps.find(item => item.type == 'M|' + selectedStep.type);
            }
            if (mau) {
                getAllSubStep().then(data => {
                    const filteredSubSteps = data.filter(item => item.step_id == mau.id);
                    filteredSubSteps.sort((a, b) => a.position - b.position);
                    setListSubStep(filteredSubSteps);
                });
            } else {
                getAllSubStep().then(data => {
                    const filteredSubSteps = data.filter(item => item.step_id == idStep);
                    filteredSubSteps.sort((a, b) => a.position - b.position);
                    setListSubStep(filteredSubSteps);
                });
            }
        })
    }

    const handleAddSubStep = () => {
        setIsModalVisible(true);
    };

    const handleModalOk = () => {
        if (newSubStepName && newSubStepType) {
            const newSubStep = {
                step_id: idStep,
                name: newSubStepName,
                subStepType: newSubStepType,
                position: listSubStep.length
            };
            createNewSubStep(newSubStep).then(() => {
                loadList();
                setIsModalVisible(false);
                setNewSubStepName('');
                setNewSubStepType('');
            });
        } else {
            toast.warn("Please fill all fields!", {autoClose: 1000});
        }
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        setNewSubStepName('');
        setNewSubStepType('');
    };

    const handleEditSubStep = (subStepId) => {
        const subStepToEdit = listSubStep.find(subStep => subStep.id === subStepId);
        setNewSubStepName(subStepToEdit.name); // Cập nhật tên substep vào input
        setEditingSubStep(subStepId);
    };

    const handleSaveEdit = (subStepId) => {
        const updatedSubStep = listSubStep.find(subStep => subStep.id === subStepId);
        updatedSubStep.name = newSubStepName != '' ? newSubStepName : updatedSubStep.name;

        updateSubStep(updatedSubStep).then(() => {
            setListSubStep(prevList => prevList.map(subStep =>
                subStep.id === subStepId ? updatedSubStep : subStep
            ));
            setEditingSubStep(null);
            setNewSubStepName('');
        });
    };

    const handleCancelEdit = () => {
        setEditingSubStep(null);
        setNewSubStepName('');
    };

    const handleDeleteSubStep = (subStepId) => {
        deleteSubStep(subStepId)
            .then(() => {
                setListSubStep(prevList => prevList.filter(subStep => subStep.id !== subStepId));
            })
            .catch((error) => {
                console.error("Error deleting sub-step:", error);
            });
    };

    const handleMoveSubStepUp = (index) => {
        if (index > 0) {
            const updatedList = [...listSubStep];
            const [movedSubStep] = updatedList.splice(index, 1);
            updatedList.splice(index - 1, 0, movedSubStep);
            const newList = updatedList.map((subStep, idx) => ({
                ...subStep,
                position: idx
            }));

            setListSubStep(newList);
            updateSubStepPositions(newList);
        }
    };

    const handleMoveSubStepDown = (index) => {
        if (index < listSubStep.length - 1) {
            const updatedList = [...listSubStep];
            const [movedSubStep] = updatedList.splice(index, 1);
            updatedList.splice(index + 1, 0, movedSubStep);
            const newList = updatedList.map((subStep, idx) => ({
                ...subStep,
                position: idx
            }));
            setListSubStep(newList);
            updateSubStepPositions(newList);
        }
    };

    const updateSubStepPositions = (subSteps) => {
        const promises = subSteps.map((subStep, index) => {
            const updatedSubStep = {...subStep, position: index};
            return updateSubStep(updatedSubStep);
        });

        Promise.all(promises).then(() => {
            loadList();
        });
    };

    return (
        <div className={css.subStepContainer}>
            <div className={css.btnAdd} onClick={handleAddSubStep}><img src={BluePlusCircle} alt=""/>Mới</div>
            <div className={css.listContainer}>
                {listSubStep.map((subStep, index) => (
                    <div key={subStep.id} className={css.itemContainer}>
                        {editingSubStep === subStep.id ? (
                            <div className={css.itemName}>
                                <Input
                                    type="text"
                                    value={newSubStepName}
                                    onChange={(e) => setNewSubStepName(e.target.value)}
                                />
                                <button className={css.btnSave} onClick={() => handleSaveEdit(subStep.id)}>
                                    <img src={SaveTron} alt=""/>
                                </button>
                                <button className={css.btnSave} onClick={handleCancelEdit}>
                                    <img src={UnSaveTron} alt=""/>
                                </button>
                            </div>
                        ) : (
                            <div className={css.itemNameView}>
                                <span>
                                    {subStep.name}
                                    <button className={css.btnAdd} onClick={() => handleEditSubStep(subStep.id)}><img
                                        src={EditIcon} alt=""/></button>
                                </span>
                                <div className={css.btnRightContainer}>
                                    <button
                                        onClick={() => handleMoveSubStepUp(index)}
                                        disabled={index === 0}
                                        className={css.btnAdd}
                                    >
                                        <img src={ICONUP} alt=""/>
                                    </button>
                                    <button
                                        onClick={() => handleMoveSubStepDown(index)}
                                        disabled={index === listSubStep.length - 1}
                                        className={css.btnAdd}
                                    >
                                        <img src={ICONDOWN} alt=""/>
                                    </button>
                                    <PopUpDeleteTemplate
                                        id={subStep.id}
                                        handleDeleteSubStep={handleDeleteSubStep}
                                    />
                                </div>
                            </div>
                        )}
                        {subStep.subStepType === TYPE_FORM && <TemplateInput sub_step_id={subStep.id}/>}
                        {subStep.subStepType === TYPE_NOTEPAD && <TemplateNotePad sub_step_id={subStep.id}/>}
                        {subStep.subStepType === TYPE_CHECKLIST && <TemplateChecklist sub_step_id={subStep.id}/>}
                        {subStep.subStepType === TYPE_DK &&
                            <TemplateDK sub_step_id={subStep.id} listSubStep={listSubStep}/>}
                        {subStep.subStepType === TYPE_DK_PRO &&
                            <TemplateDKPro sub_step_id={subStep.id} listSubStep={listSubStep}/>}
                        {subStep.subStepType === TYPE_SHEET &&
                            <TemplateSheet sub_step_id={subStep.id} listSubStep={listSubStep}/>}
                        {subStep.subStepType === TYPE_ACTION &&
                            <TemplateAction sub_step_id={subStep.id} listSubStep={listSubStep}/>}
                        {subStep.subStepType === TYPE_SALARY &&
                            <TemplateSalary sub_step_id={subStep.id} listSubStep={listSubStep}/>}
                        {subStep.subStepType === TYPE_CUSTOM &&
                            <TemplateCustom sub_step_id={subStep.id} listSubStep={listSubStep}/>}
                    </div>
                ))}
            </div>
            <Modal
                title="Add New SubStep"
                visible={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
            >
                <div>
                    <Input
                        placeholder="SubStep Name"
                        value={newSubStepName}
                        onChange={(e) => setNewSubStepName(e.target.value)}
                    />
                    <Select
                        placeholder="Select SubStep Type"
                        value={newSubStepType}
                        onChange={(value) => setNewSubStepType(value)}
                        style={{width: '100%', marginTop: 10}}
                    >
                        <Select.Option value={TYPE_FORM}>{TYPE_FORM}</Select.Option>
                        {/* <Select.Option value={TYPE_DK}>{TYPE_DK}</Select.Option> */}
                        <Select.Option value={TYPE_DK_PRO}>{TYPE_DK_PRO}</Select.Option>
                        <Select.Option value={TYPE_NOTEPAD}>{TYPE_NOTEPAD}</Select.Option>
                        <Select.Option value={TYPE_CHECKLIST}>{TYPE_CHECKLIST}</Select.Option>
                        <Select.Option value={TYPE_SHEET}>{TYPE_SHEET}</Select.Option>
                        <Select.Option value={TYPE_ACTION}>{TYPE_ACTION}</Select.Option>
                        <Select.Option value={TYPE_SALARY}>{TYPE_SALARY}</Select.Option>
                        <Select.Option value={TYPE_CUSTOM}>{TYPE_CUSTOM}</Select.Option>
                    </Select>
                </div>
            </Modal>
        </div>
    );
};

export default TemplateStepDetail;
