import React, { useContext, useEffect, useState } from "react";
import { getSubStepDataById, updateSubStep } from "../../../../../apis/subStepService.jsx";
import { getCurrentUserLogin } from "../../../../../apis/userService.jsx";
import { DANH_MUC_LIST } from "../../../../../Consts/DANH_MUC_LIST.js";
import { createTimestamp } from "../../../../../generalFunction/format.js";
import { Button, Col, DatePicker, Form, Input, message, Modal, Row, Select, Table } from "antd";
import PopUpFormCreatePhieu from "../../../formCreate/formCreatePhieu.jsx";
import css from "../../../CreateDanhMuc/CreateDanhMuc.module.css";
import { ACTION_BUTTON_LIST } from "../../../../../Consts/ACTION_BUTTON.js";
import { MyContext } from "../../../../../MyContext.jsx";
import { AgGridReact } from "ag-grid-react";
import { filter } from "../../../AgridTable/FilterAgrid.jsx";
import { BluePlusCircle } from "../../../../../icon/IconSVG.js";
import Luong from "../../../AgridTable/Luong/Luong.jsx";


const SubStepSalary = ({ sub_step_id, idCard, listSubStep, permissionsSubStep }) => {
    const UPDATE_PERMISSION = permissionsSubStep?.update;

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
    }, [sub_step_id, load]);

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
        <>
            <div className={css.container}>
                {UPDATE_PERMISSION
                    ? (
                        <button onClick={handleShowDialogEdit} className={css.btnAdd}><img src={BluePlusCircle} alt="" />
                            Xem bảng lương
                        </button>
                    )
                    : (<></>)
                }
            </div>
            <Modal
                centered
                open={showEditDialog}
                onCancel={handleHideDialogEdit}
                width={1400}
                title={"Lương"}
                footer={(<>
                    <Button onClick={handleHideDialogEdit}>Đóng</Button>
                </>)}
            >
                <div className={css.container_content}>
                    <Luong />
                </div>

            </Modal>
        </>

    );
};
export default SubStepSalary;
