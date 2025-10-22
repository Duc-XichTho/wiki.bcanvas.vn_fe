import css from "./SubStep.module.css"
import { useState, useEffect } from "react";
import { Modal, Input, Popover, Button, message, Popconfirm, Collapse, Select } from "antd";
import { Plus } from "lucide-react";
import {
    EditOutlined,
    DeleteOutlined,
    SaveOutlined,
    RollbackOutlined,
    SettingOutlined,
    CaretRightOutlined,
    CaretUpOutlined,
    CaretDownOutlined,
} from '@ant-design/icons';
import {
    TYPE_ACTION,
    TYPE_CHECKLIST,
    TYPE_DK,
    TYPE_DK_PRO,
    TYPE_FORM,
    TYPE_NOTEPAD, TYPE_SALARY,
    TYPE_SHEET
} from '../../../../../Consts/SECTION_TYPE';
import { getAllSubStep, createNewSubStep, updateSubStep, deleteSubStep } from "../../../../../apis/subStepService";
import { FaSortNumericDown } from "react-icons/fa";
import TemplateInput from "../../../../../pages/Home/Template/TemplateStepDetail/TemplateInput/TemplateInput.jsx";
import TemplateNotePad from "../../../../../pages/Home/Template/TemplateStepDetail/TemplateNotepad/TemplateNotepad.jsx";
import TemplateChecklist from "../../../../../pages/Home/Template/TemplateStepDetail/TemplateChecklist/TemplateChecklist.jsx";
import TemplateDK from "../../../../../pages/Home/Template/TemplateStepDetail/TemplateDK/TemplateDK.jsx";
import TemplateDKPro from "../../../../../pages/Home/Template/TemplateStepDetail/TemplateDKPro/TemplateDKPro.jsx";
import TemplateSheet from "../../../../../pages/Home/Template/TemplateStepDetail/TemplateSheet/TemplateSheet.jsx";
import TemplateAction from "../../../../../pages/Home/Template/TemplateStepDetail/TemplateAction/TemplateAction.jsx";
import TemplateSalary from "../../../../Home/Template/TemplateStepDetail/TemplateSalary/TemplateSalary.jsx";

const SECTION_TYPES = [
    TYPE_DK,
    TYPE_SHEET,
    TYPE_ACTION,
    TYPE_CHECKLIST,
    TYPE_DK_PRO,
    TYPE_FORM,
    TYPE_NOTEPAD,
    TYPE_SALARY,
];

const SubStep = ({
    stepSelected,
    subStepSelected,
    setSubStepSelected
}) => {
    const [allSubSteps, setAllSubSteps] = useState([]);
    const [listSubStepFilter, setListSubStepFilter] = useState([]);
    const [messageApi, contextHolder] = message.useMessage();
    const [openModalCreate, setOpenModalCreate] = useState(false);
    const [openModalUpdate, setOpenModalUpdate] = useState(false);
    const [openPopovers, setOpenPopovers] = useState({});
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmLoadingUpdate, setConfirmLoadingUpdate] = useState(false);
    const [valueNameSubStep, setValueNameSubStep] = useState('');
    const [valueNameSubStepUpdate, setValueNameSubStepUpdate] = useState('');
    const [editPositionSubStepMode, setEditPositonSubStepMode] = useState(false);
    const [updatedListSubStepFilter, setUpdatedListSubStepFilter] = useState([]);
    const [originalListSubStepFilter, setOriginalListSubStepFilter] = useState([]);
    const [subStepType, setSubStepType] = useState('');

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const showNotification = (type, content) => {
        messageApi.open({
            type,
            content,
        });
    };

    const fetchAllSubStep = async () => {
        try {
            const data = await getAllSubStep();
            setAllSubSteps(data);
        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    };

    useEffect(() => {
        setEditPositonSubStepMode(false);
        const filteredData = allSubSteps.filter(substep => substep.step_id === stepSelected.id);
        setListSubStepFilter(filteredData);
        setUpdatedListSubStepFilter(filteredData);
        setOriginalListSubStepFilter(filteredData);
    }, [stepSelected, allSubSteps]);

    useEffect(() => {
        fetchAllSubStep();
    }, []);

    const handleChange = (value) => {
        setSubStepType(value);
    };

    const handleCancelCreate = () => {
        setValueNameSubStep('');
        setOpenModalCreate(false);
    };

    const handleCancelUpdate = () => {
        setValueNameSubStepUpdate('');
        setOpenModalUpdate(false);
    };

    const handleOpenChange = (newOpen, id) => {
        setOpenPopovers((prevState) => ({
            ...prevState,
            [id]: newOpen,
        }));
    };

    const handleCreateSubStep = async () => {
        try {
            setConfirmLoading(true);
            const data = {
                step_id: stepSelected.id,
                name: valueNameSubStep,
                subStepType: subStepType
            }
            const response = await createNewSubStep(data);

            await delay(2000);

            switch (response.status) {
                case 201:
                    showNotification("success", "Tạo thành công.");
                    setValueNameSubStep('');
                    await fetchAllSubStep();
                    break;
                default:
                    showNotification("error", "Có lỗi xảy ra");
                    break;
            }

        } catch (error) {
            console.log("Error:", error);
            showNotification("error", "Có lỗi xảy ra");
        } finally {
            setConfirmLoading(false);
            setOpenModalCreate(false);
        }
    };

    const handleDeleteSubStep = async (item) => {
        try {
            const response = await deleteSubStep(item.id);
            await delay(2000);
            switch (response.status) {
                case 200:
                    showNotification("success", "Xóa thành công.");
                    setSubStepSelected(null);
                    await fetchAllSubStep();
                    break;
                default:
                    showNotification("error", "Có lỗi xảy ra");
                    break;
            }
        } catch (error) {
            console.log("Error:", error);
            showNotification("error", "Có lỗi xảy ra");
        }
    };

    const handleUpdateSubStep = async () => {
        try {
            setConfirmLoadingUpdate(true);
            const data = {
                id: subStepSelected.id,
                name: valueNameSubStepUpdate,
            }
            const response = await updateSubStep(data);

            await delay(2000);
            switch (response.status) {
                case 200:
                    showNotification("success", "Cập nhật thành công.");
                    setValueNameSubStepUpdate('');
                    await fetchAllSubStep();
                    break;
                default:
                    showNotification("error", "Có lỗi xảy ra");
                    break;
            }
        } catch (error) {
            console.log("Error:", error);
            showNotification("error", "Có lỗi xảy ra");
        } finally {
            setConfirmLoadingUpdate(false);
            setOpenModalUpdate(false);
        }
    }

    const handleOpenPopoverUpdate = (item) => {
        setSubStepSelected(item);
        setValueNameSubStepUpdate(item.name)
        setOpenPopovers(false);
        setOpenModalUpdate(true);
    }

    const popoverContent = (item) => {
        return (
            <div
                className={css.popoverContent}
                onClick={(event) => {
                    event.stopPropagation();
                }}
            >
                <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleOpenPopoverUpdate(item)}
                />
                <Popconfirm
                    title="Xóa Sub-Step"
                    description="Bạn có chắc chắn muốn xóa không?"
                    okText="Xóa"
                    cancelText="Hủy"
                    onConfirm={async () => await handleDeleteSubStep(item)}
                    placement="bottom"
                >
                    <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                    />
                </Popconfirm>
            </div>
        )
    };

    const handleEditClick = () => {
        setEditPositonSubStepMode(true);
        setUpdatedListSubStepFilter([...listSubStepFilter]);
        setOriginalListSubStepFilter([...listSubStepFilter]);
    }

    const handleCancelChangePosition = () => {
        showNotification("warning", "Hủy sắp xếp");
        setEditPositonSubStepMode(false);
        setListSubStepFilter([...originalListSubStepFilter]);
        setUpdatedListSubStepFilter([...originalListSubStepFilter]);
    };

    const handleSaveChangePosition = async () => {
        try {
            const updatePromises = updatedListSubStepFilter.map((subStep, index) => {
                const data = {
                    id: subStep.id,
                    position: index,
                };
                return updateSubStep(data);
            });
            const responses = await Promise.all(updatePromises);
            const errorResponses = responses.filter((response) => response.status !== 200);
            if (errorResponses.length > 0) {
                const errorMessage = `Có lỗi xảy ra khi cập nhật ${errorResponses.length} bước.`;
                showNotification("error", errorMessage);
            } else {
                showNotification("success", "Lưu thành công!");
                setEditPositonSubStepMode(false);
                await fetchAllSubStep();
            }
        } catch (error) {
            console.error("Error saving steps:", error);
            showNotification("error", "Có lỗi xảy ra khi lưu");
        }
    }

    const moveSubStepUp = (id) => {
        const currentIndex = listSubStepFilter.findIndex((item) => item.id === id);
        if (currentIndex > 0) {
            const newItems = [...listSubStepFilter];
            [newItems[currentIndex], newItems[currentIndex - 1]] = [newItems[currentIndex - 1], newItems[currentIndex]];
            setUpdatedListSubStepFilter(newItems);
            setListSubStepFilter(newItems);
        }
    }

    const moveSubStepDown = (id) => {
        const currentIndex = listSubStepFilter.findIndex((item) => item.id === id);
        if (currentIndex < listSubStepFilter.length - 1) {
            const newItems = [...listSubStepFilter];
            [newItems[currentIndex], newItems[currentIndex + 1]] = [newItems[currentIndex + 1], newItems[currentIndex]];
            setUpdatedListSubStepFilter(newItems);
            setListSubStepFilter(newItems);
        }
    }

    const genExtra = (item) => (
        <Popover
            content={popoverContent(item)}
            trigger="click"
            placement="right"
            open={!!openPopovers[item.id]}
            onClick={(event) => {
                event.stopPropagation();
            }}
            onOpenChange={(e) => handleOpenChange(e, item.id)}
        >
            <Button type="text" size="small" icon={<SettingOutlined />} />
        </Popover>
    );

    const labelRender = (item) => {
        const listToRender = editPositionSubStepMode ? updatedListSubStepFilter : listSubStepFilter;

        const currentItem = listToRender.find((subStep) => subStep.id === item.id);

        return (
            editPositionSubStepMode ? (
                <div className={css.subStepHeaderEditMode}>
                    <div className={css.subStepNameEditMode}>
                        <div className={css.subStepNameWrap}>
                            <span>Tên: <b>{currentItem.name}</b></span>
                        </div>
                        <div
                            className={css.subStepNameArrow}
                            onClick={(event) => {
                                event.stopPropagation();
                            }}
                        >
                            <Button type="text" size="small" icon={<CaretUpOutlined />} onClick={() => moveSubStepUp(item.id)} />
                            <Button type="text" size="small" icon={<CaretDownOutlined />} onClick={() => moveSubStepDown(item.id)} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className={css.subStepHeader}>
                    <div className={css.subStepName}>
                        <span>Tên: <b>{item.name}</b></span>
                    </div>
                    <div className={css.subStepType}>
                        <span>Kiểu: <b>{item.subStepType}</b></span>
                    </div>
                </div>
            )
        );
    };

    const getItems = listSubStepFilter.map((item) => ({
        key: item.id,
        label: labelRender(item),
        children:
            <div className={css.subStepBody}>
                {item.subStepType === TYPE_FORM && <TemplateInput sub_step_id={item.id} />}
                {item.subStepType === TYPE_NOTEPAD && <TemplateNotePad sub_step_id={item.id} />}
                {item.subStepType === TYPE_CHECKLIST && <TemplateChecklist sub_step_id={item.id} />}
                {item.subStepType === TYPE_DK &&
                    <TemplateDK sub_step_id={item.id} listSubStep={listSubStepFilter} />}
                {item.subStepType === TYPE_DK_PRO &&
                    <TemplateDKPro sub_step_id={item.id} listSubStep={listSubStepFilter} />}
                {item.subStepType === TYPE_SHEET &&
                    <TemplateSheet sub_step_id={item.id} listSubStep={listSubStepFilter} />}
                {item.subStepType === TYPE_ACTION &&
                    <TemplateAction sub_step_id={item.id} listSubStep={listSubStepFilter} />}
                {item.subStepType === TYPE_SALARY &&
                    <TemplateSalary sub_step_id={item.id} listSubStep={listSubStepFilter} />}
            </div>,
        extra: genExtra(item),
    }));

    return (
        <>
            {contextHolder}
            <div className={css.main}>
                <div className={css.menuGroup}>
                    <div className={css.menuHeader}>
                        <div className={css.menuTitle}>
                            <span><b>Quản lý Sub-Step</b></span>
                        </div>
                        <div className={css.changePosition}>
                            {!editPositionSubStepMode
                                ? (
                                    <>
                                        <Button type="text" icon={<Plus />} onClick={() => setOpenModalCreate(true)} />
                                        <Button type="text" icon={<FaSortNumericDown size={20} />} onClick={handleEditClick} />
                                    </>
                                )
                                : (
                                    <>
                                        <Button type="text" icon={<SaveOutlined />} onClick={handleSaveChangePosition} />
                                        <Button type="text" icon={<RollbackOutlined />} onClick={handleCancelChangePosition} />
                                    </>
                                )}
                        </div>
                    </div>
                    <div className={css.menuContent}>
                        <Collapse
                            items={getItems}
                            expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
                        />
                    </div>
                </div>
            </div>
            <Modal
                centered
                title="Tạo Sub-Step"
                okText="Tạo"
                cancelText="Hủy"
                open={openModalCreate}
                onOk={async () => await handleCreateSubStep()}
                confirmLoading={confirmLoading}
                onCancel={handleCancelCreate}
            >
                <div className={css.modalCreate}>
                    <Input
                        placeholder="nhập tên"
                        value={valueNameSubStep}
                        onChange={(e) => setValueNameSubStep(e.target.value)}
                    />
                    <Select
                        placeholder="chọn kiểu"
                        style={{ width: '100%' }}
                        onChange={handleChange}
                        options={SECTION_TYPES.map(type => ({
                            value: type,
                            label: type,
                        }))}
                    />
                </div>

            </Modal>
            <Modal
                centered
                title="Sửa tên Sub-Step"
                okText="Lưu"
                cancelText="Hủy"
                open={openModalUpdate}
                onOk={async () => await handleUpdateSubStep()}
                confirmLoading={confirmLoadingUpdate}
                onCancel={handleCancelUpdate}
            >
                <Input
                    placeholder="nhập tên"
                    value={valueNameSubStepUpdate}
                    onChange={(e) => setValueNameSubStepUpdate(e.target.value)}
                />
            </Modal>
        </>
    )
}

export default SubStep
