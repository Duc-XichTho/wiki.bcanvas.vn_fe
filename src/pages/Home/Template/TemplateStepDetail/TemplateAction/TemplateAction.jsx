import React, {useEffect, useState} from "react";
import {Button, Form, Select, Typography, Modal} from "antd";
import css from './TemplateAction.module.css';
import {EditIconCoLe} from "../../../../../icon/IconSVG.js";
import {getSubStepDataById, updateSubStep} from "../../../../../apis/subStepService.jsx";
import {ACTION_BUTTON_LIST} from "../../../../../Consts/ACTION_BUTTON.js";
import BtnAction from "../../../CreateDanhMuc/CreateDanhMuc.jsx";

const TemplateAction = ({sub_step_id, listSubStep}) => {
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
            <div className={css.setting}>
                <button className={css.btnAdd} onClick={handleShowDialogEdit}>
                    <img src={EditIconCoLe} alt="Edit Icon"/>
                </button>
            </div>
            <div>
                <BtnAction item={editedSection}/>
            </div>

            <Modal
                title="Chỉnh sửa hành động"
                centered
                open={showEditDialog}
                onCancel={handleHideDialogEdit}
                okText={'Lưu'}
                cancelText={'Hủy'}
                onOk={handleSave}
            >
                <Form layout="vertical">
                    <Form.Item
                        label="Chọn loại hành động (Có thể chọn nhiều)"

                    >
                        <Select
                            mode="multiple"
                            value={editedSection?.action_list || []}
                            allowClear
                            onChange={handleSelectAction}
                        >
                            {ACTION_BUTTON_LIST.map(e => (
                                <Select.Option value={e.key}>{e.label}</Select.Option>
                            ))}

                            {/* Add more options as needed */}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TemplateAction;
