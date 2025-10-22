import React, { useEffect, useState } from "react";
import { Button, Form, Select, Modal } from "antd";
import css from './TemplateCustom.module.css';
import { EditIconCoLe } from "../../../../../icon/IconSVG.js";
import { getSubStepDataById, updateSubStep } from "../../../../../apis/subStepService.jsx";
import BtnAction from "../../../CreateDanhMuc/CreateDanhMuc.jsx";
import { LiST_COMPONENT_FOR_TYPE_TABLE } from "../../../../../Consts/LiST_COMPONENT_FOR_TYPE_TABLE.jsx";

const TemplateCustom = ({ sub_step_id }) => {
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editedSection, setEditedSection] = useState(null);
    const [init, setInit] = useState(null);
    const [load, setLoad] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState(null); // Store single selected component

    // Fetch data when sub_step_id changes
    useEffect(() => {
        if (sub_step_id) {
            getSubStepDataById(sub_step_id).then((data) => {
                setEditedSection(data);
                setInit(data);
                // Initialize selected component based on fetched data
                setSelectedComponent(data.action_list || null);
            });
        }
    }, [sub_step_id, load]);

    // Handlers
    const handleShowDialogEdit = () => {
        setShowEditDialog(true);
    };

    const handleHideDialogEdit = () => {
        setEditedSection(init);
        setSelectedComponent(init?.action_list || null); // Reset selected component
        setShowEditDialog(false);
    };

    const handleSelectAction = (value) => {
        console.log(value);
        setSelectedComponent(value); // Store selected component name
        setEditedSection((prev) => ({
            ...prev,
            action_list: value,
        }));
    };

    const handleSave = () => {
        updateSubStep({ ...editedSection, action_list: selectedComponent }).then(() => {
            handleHideDialogEdit();
            setLoad(prevState => !prevState);
        });
    };

    return (
        <div className={css.container}>
            <div className={css.setting}>
                <button className={css.btnAdd} onClick={handleShowDialogEdit}>
                    <img src={EditIconCoLe} alt="Edit Icon" />
                </button>
            </div>
            <div>
                <BtnAction item={editedSection} />
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
                    <Form.Item label="Chọn loại hành động">
                        <Select
                            value={selectedComponent}
                            allowClear
                            onChange={handleSelectAction}
                        >
                            {LiST_COMPONENT_FOR_TYPE_TABLE.map(e => (
                                <Select.Option key={e.name} value={e.name}>{e.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Render selected component */}
            <div>
                {selectedComponent && (
                    LiST_COMPONENT_FOR_TYPE_TABLE.map(component => {
                        if (component.name === selectedComponent) {
                            return React.cloneElement(component.component);
                        }
                        return null;
                    })
                )}
            </div>
        </div>
    );
};

export default TemplateCustom;
