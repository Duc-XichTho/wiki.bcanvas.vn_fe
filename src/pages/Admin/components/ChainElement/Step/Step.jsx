import css from "./Step.module.css"
import { useState, useEffect } from "react";
import { Modal, Input, Popover, Button, message, Popconfirm, Switch } from "antd";
import { Plus, SkipForward } from "lucide-react";
import {
    MoreOutlined,
    EditOutlined,
    DeleteOutlined,
    SaveOutlined,
    RollbackOutlined,
    CaretUpOutlined,
    CaretDownOutlined,
} from '@ant-design/icons';
import { getAllStep, createNewStep, updateStep, deleteStep } from "../../../../../apis/stepService.jsx";
import Mapping from '../../../../Home/Template/TemplateStepList/Mapping/Mapping.jsx';
import { FaLink } from "react-icons/fa";
import { FaSortNumericDown } from "react-icons/fa";

const Step = ({
    templateSelected,
    stepSelected,
    setStepSelected,
}) => {
    const [allSteps, setAllSteps] = useState([]);
    const [listStepFilter, setListStepFilter] = useState([]);
    const [messageApi, contextHolder] = message.useMessage();
    const [openModalCreate, setOpenModalCreate] = useState(false);
    const [openModalUpdate, setOpenModalUpdate] = useState(false);
    const [openPopovers, setOpenPopovers] = useState({});
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmLoadingUpdate, setConfirmLoadingUpdate] = useState(false);
    const [valueNameStep, setValueNameStep] = useState('');
    const [valueNameStepUpdate, setValueNameStepUpdate] = useState('');

    const [editPositionStepMode, setEditPositonStepMode] = useState(false);
    const [updatedListStepFilter, setUpdatedListStepFilter] = useState([]);
    const [originalListStepFilter, setOriginalListStepFilter] = useState([]);
    const [skipableCreate, setSkipableCreate] = useState(false);
    const [skipableUpdate, setSkipableUpdate] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const showNotification = (type, content) => {
        messageApi.open({
            type,
            content,
        });
    };

    const fetchAllStep = async () => {
        try {
            const data = await getAllStep();
            setAllSteps(data);
        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    };

    useEffect(() => {
        setEditPositonStepMode(false);
        const filteredData = allSteps.filter(step => step.template_id === templateSelected.id);
        setListStepFilter(filteredData);
        setUpdatedListStepFilter(filteredData);
        setOriginalListStepFilter(filteredData);
    }, [templateSelected, allSteps]);

    useEffect(() => {
        fetchAllStep();
    }, []);

    useEffect(() => {
        if (!editPositionStepMode) {
            setListStepFilter(updatedListStepFilter);
        }
    }, [editPositionStepMode, updatedListStepFilter]);

    const handleOpenChange = (newOpen, id) => {
        setOpenPopovers((prevState) => ({
            ...prevState,
            [id]: newOpen,
        }));
    };

    const handleCreateStep = async () => {
        try {
            setConfirmLoading(true);
            const data = {
                template_id: templateSelected.id,
                name: valueNameStep,
                skipable: skipableCreate
            }
            const response = await createNewStep(data);

            await delay(2000);

            switch (response.status) {
                case 201:
                    showNotification("success", "Tạo thành công.");
                    setValueNameStep('');
                    await fetchAllStep();
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

    const handleUpdateStep = async () => {
        try {
            setConfirmLoadingUpdate(true);
            const data = {
                id: stepSelected.id,
                name: valueNameStepUpdate,
                skipable: skipableUpdate
            }
            const response = await updateStep(data);

            await delay(2000);
            switch (response.status) {
                case 200:
                    showNotification("success", "Cập nhật thành công.");
                    setValueNameStepUpdate('');
                    setSkipableUpdate(false);
                    await fetchAllStep();
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

    const handleDeleteStep = async (item) => {
        try {
            const response = await deleteStep(item.id);
            await delay(2000);
            switch (response.status) {
                case 200:
                    showNotification("success", "Xóa thành công.");
                    setStepSelected(null);
                    await fetchAllStep();
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

    const handleEditClick = () => {
        setEditPositonStepMode(true);
        setUpdatedListStepFilter([...listStepFilter]);
        setOriginalListStepFilter([...listStepFilter]);
    };

    const handleCancelChangePosition = () => {
        showNotification("warning", "Hủy sắp xếp");
        setEditPositonStepMode(false);
        setListStepFilter([...originalListStepFilter]);
        setUpdatedListStepFilter([...originalListStepFilter]);
    };

    const handleSaveChangePosition = async () => {
        try {
            const updatePromises = updatedListStepFilter.map((step, index) => {
                const data = {
                    id: step.id,
                    position: index,
                };
                return updateStep(data);
            });

            const responses = await Promise.all(updatePromises);

            const errorResponses = responses.filter((response) => response.status !== 200);
            if (errorResponses.length > 0) {
                const errorMessage = `Có lỗi xảy ra khi cập nhật ${errorResponses.length} bước.`;
                showNotification("error", errorMessage);
            } else {
                showNotification("success", "Lưu thành công!");
                setEditPositonStepMode(false);
                await fetchAllStep();
            }
        } catch (error) {
            console.error("Error saving steps:", error);
            showNotification("error", "Có lỗi xảy ra khi lưu");
        }
    };

    const moveStepUp = (id) => {
        const currentIndex = updatedListStepFilter.findIndex((item) => item.id === id);
        if (currentIndex > 0) {
            const newItems = [...updatedListStepFilter];
            [newItems[currentIndex], newItems[currentIndex - 1]] = [newItems[currentIndex - 1], newItems[currentIndex]];
            setUpdatedListStepFilter(newItems);
        }
    };

    const moveStepDown = (id) => {
        const currentIndex = updatedListStepFilter.findIndex((item) => item.id === id);
        if (currentIndex < updatedListStepFilter.length - 1) {
            const newItems = [...updatedListStepFilter];
            [newItems[currentIndex], newItems[currentIndex + 1]] = [newItems[currentIndex + 1], newItems[currentIndex]];
            setUpdatedListStepFilter(newItems);
        }
    };

    const handleOpenPopoverUpdate = (item) => {
        setValueNameStepUpdate(item.name)
        setSkipableUpdate(item.skipable)
        setOpenPopovers(false);
        setOpenModalUpdate(true);
    }

    const popoverContent = (item) => {
        return (
            <div className={css.popoverContent}>
                <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleOpenPopoverUpdate(item)}
                />
                <Popconfirm
                    title="Xóa Step"
                    description="Bạn có chắc chắn muốn xóa không?"
                    okText="Xóa"
                    cancelText="Hủy"
                    onConfirm={async () => await handleDeleteStep(item)}
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

    return (
        <>
            {contextHolder}
            <div className={css.main}>
                <div className={css.menuGroup}>
                    <div className={css.menuHeader}>
                        <div className={css.menuTitle}>
                            <div>
                                <span><b>Quản lý Step</b></span>
                            </div>
                        </div>
                        <div className={css.changePosition}>
                            {!editPositionStepMode
                                ? (
                                    <>
                                        <Button type="text" icon={<Plus />} onClick={() => setOpenModalCreate(true)} />
                                        <Button type="text" icon={<FaLink />} onClick={() => setOpenDialog(true)} />
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
                        {editPositionStepMode
                            ? (
                                updatedListStepFilter.map((item) => (
                                    <div key={item.id} className={`${css.menuData} ${stepSelected?.id === item.id ? css.selected : ""}`} onClick={() => setStepSelected(item)}>
                                        <div className={css.stepInfoContainer}>
                                            <div className={css.stepInfo}>
                                                <span>{item.name}</span>
                                            </div>
                                            <div className={css.stepAction}>
                                                <Button type="text" size="small" icon={<CaretUpOutlined />} onClick={() => moveStepUp(item.id)} />
                                                <Button type="text" size="small" icon={<CaretDownOutlined />} onClick={() => moveStepDown(item.id)} />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                            : (
                                listStepFilter.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`${css.menuData} ${stepSelected?.id === item.id
                                            ? css.selected
                                            : ""
                                            }`}
                                        onClick={() => setStepSelected(item)}
                                    >
                                        <div className={css.stepInfoContainer}>
                                            <div className={css.stepInfo}>
                                                <span>{item.name}</span>
                                            </div>
                                            <div className={css.stepAction}>
                                                {(item.skipable) && <SkipForward size={15} />}
                                                <Popover
                                                    content={popoverContent(item)}
                                                    trigger="click"
                                                    placement="right"
                                                    open={!!openPopovers[item.id]}
                                                    onOpenChange={(e) => handleOpenChange(e, item.id)}
                                                >
                                                    <Button type="text" size="small" icon={<MoreOutlined />} />
                                                </Popover>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                        }
                    </div>
                </div>
            </div>
            <Modal
                centered
                title="Tạo Step"
                okText="Tạo"
                cancelText="Hủy"
                open={openModalCreate}
                onOk={async () => await handleCreateStep()}
                confirmLoading={confirmLoading}
                onCancel={() => setOpenModalCreate(false)}
            >
                <div className={css.fieldStep}>
                    <div className={css.fieldStepInput}>
                        <Input
                            placeholder="nhập tên"
                            value={valueNameStep}
                            onChange={(e) => setValueNameStep(e.target.value)}
                        />
                    </div>
                    <div className={css.fieldStepSwitch}>
                        <Switch
                            checkedChildren="Có thể bỏ qua"
                            unCheckedChildren="Không thể bỏ qua"
                            onChange={(checked) => setSkipableCreate(checked)}
                        />
                    </div>
                </div>
            </Modal>
            <Modal
                centered
                title="Cập nhật Step"
                okText="Lưu"
                cancelText="Hủy"
                open={openModalUpdate}
                onOk={async () => await handleUpdateStep()}
                confirmLoading={confirmLoadingUpdate}
                onCancel={() => setOpenModalUpdate(false)}
            >
                <div className={css.fieldStep}>
                    <div className={css.fieldStepInput}>
                        <Input
                            placeholder="nhập tên"
                            value={valueNameStepUpdate}
                            onChange={(e) => setValueNameStepUpdate(e.target.value)}
                        />
                    </div>
                    <div className={css.fieldStepSwitch}>
                        <Switch
                            checkedChildren="Có thể bỏ qua"
                            unCheckedChildren="Không thể bỏ qua"
                            checked={skipableUpdate}
                            onChange={(checked) => setSkipableUpdate(checked)}
                        />
                    </div>
                </div>
            </Modal>
            {openDialog && <Mapping idTemp={templateSelected?.id} openDialog={openDialog} setOpenDialog={setOpenDialog} />}
        </>
    )
}

export default Step