import React, {useEffect, useState} from "react";
import {Button, Form, Select, Typography, Modal} from "antd";
import css from './TemplateSalary.module.css';
import {BluePlusCircle, EditIconCoLe} from "../../../../../icon/IconSVG.js";
import {getSubStepDataById, updateSubStep} from "../../../../../apis/subStepService.jsx";
import {ACTION_BUTTON_LIST} from "../../../../../Consts/ACTION_BUTTON.js";
import BtnAction from "../../../CreateDanhMuc/CreateDanhMuc.jsx";

const TemplateSalary = ({sub_step_id, listSubStep}) => {
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editedSection, setEditedSection] = useState(null);
    const [init, setInit] = useState(null);
    const [load, setLoad] = useState(false);



    // Fetch data when sub_step_id changes
    useEffect(() => {
        if (sub_step_id) {
            getSubStepDataById(sub_step_id).then((data) => {
                setEditedSection(data);
                setInit(data)
            });
        }
    }, [sub_step_id,load]);

    // Handlers
    const handleShowDialogEdit = () => {
        setShowEditDialog(true);
    };

    const handleHideDialogEdit = () => {
        setEditedSection(init)
        setShowEditDialog(false);
    };

    const handleSelectAction = (value) => {
        setEditedSection((prev) => ({
            ...prev,
            action_list: value,
        }));
    };

    const handleSave = () => {
        updateSubStep(editedSection).then(() => {
                handleHideDialogEdit();
                setLoad(prevState => !prevState)
            }
        )

    };

    return (
        <div className={css.container}>
           <button className={css.btnAdd}><img src={BluePlusCircle} alt=""/>Xem bảng lương</button>
        </div>
    );
};

export default TemplateSalary;
