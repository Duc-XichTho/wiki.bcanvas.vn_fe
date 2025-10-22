import React, { useContext, useEffect, useState, useRef } from "react";
import css from "./RightPanel.module.css";
import { MyContext } from "../../../MyContext";
// QUILL
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import ImageResize from "quill-image-resize";
// API
import { updateProgressTask } from "../../../apis/progressTaskService";
import {
    createProgressTaskPost,
    getAllProgressTaskPost,
    deleteProgressTaskPost,
    updateProgressTaskPost,
} from "../../../apis/progressTaskPostService";
import UploadFileForm from "../File/UploadFileForm.jsx";
import { findRecordsByConditions } from "../../../apis/searchModelService.jsx";
import { uploadFileService } from "../../../apis/uploadFileService.jsx";
import { FileALL } from "../../../Consts/MODEL_CALL_API.js";
import PreviewComponent from "../Preview/PreviewComponent.jsx";
import PopUpDelete from "../PopUpDelete/PopUpDelete.jsx";
import { createNewActionLog, getAllActionLog } from "../../../apis/actionLogService";
import { ChevronDown, ChevronUp, Pencil, Check, X, Trash } from "lucide-react";
// ICON
import {
    IconPMCat,
    IconPMPic,
    IconPMTag,
    IconPMTimeline,
} from "../../../icon/IconSVG.js";

Quill.register("modules/imageResize", ImageResize);
import { Tag, Space, Modal } from "antd";
import { uploadFiles } from "../../../apis/uploadManyFIleService.jsx";

const Block = Quill.import("blots/block");
Block.tagName = "div";
Quill.register(Block);

const CustomTooltip = ({ children, show }) => {
    if (!show) return children;

    return (
        <div className={css.tooltipWrapper}>
            {children}
            <div className={css.tooltip}>Step này đã bị khóa</div>
        </div>
    );
};

const ConfirmDeletePopup = ({ onConfirm, onCancel }) => {
    return (
        <div className={css.confirmDeletePopup}>
            <div className={css.confirmDeleteContent}>
                <h3>Confirm Deletion</h3>
                <p>Are you sure you want to delete this post?</p>
                <div className={css.confirmDeleteActions}>
                    <button onClick={onConfirm} className={css.confirmButton}>
                        Yes, Delete
                    </button>
                    <button onClick={onCancel} className={css.cancelButton}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

const usePasteHandler = (quillMainRef, onPasteImage) => {
    useEffect(() => {
        const quillEditor = quillMainRef.current?.getEditor();
        if (!quillEditor) return;

        const handleImagePaste = async (file) => {
            if (!file.type.startsWith("image/")) {
                console.warn("File is not an image:", file);
                return;
            }

            try {
                const timestamp = Date.now();
                const newFileName = `image-${timestamp}${file.name.slice(
                    file.name.lastIndexOf(".")
                )}`;
                const newFile = new File([file], newFileName, { type: file.type });

                const uploadedImageUrls = await uploadFiles([newFile]);
                if (uploadedImageUrls.files.length > 0) {
                    const imageUrl = uploadedImageUrls.files[0].fileUrl;
                    onPasteImage(imageUrl);
                }
            } catch (error) {
                console.error("Error uploading image:", error);
            }
        };

        const handlePaste = (event) => {
            const clipboardData = event.clipboardData;
            if (clipboardData && clipboardData.files.length > 0) {
                Array.from(clipboardData.files).forEach((file) => {
                    if (file.type.startsWith("image/")) {
                        event.preventDefault();
                        handleImagePaste(file);
                    }
                });
            }
        };

        quillEditor.root.addEventListener("paste", handlePaste);

        return () => {
            quillEditor.root.removeEventListener("paste", handlePaste);
        };
    }, [quillMainRef, onPasteImage]);
};

const RightPanel = ({
    selectedProgressStep,
    selectedProgressTask,
    onUpdateTask,
    onStatusUpdate,
    permission,
    setTaskDetails,
    setUpdateProgressStep,
}) => {
    const table = "ProgressTask";
    const [showPicDropdown, setShowPicDropdown] = useState(false);
    const [showCatDropdown, setShowCatDropdown] = useState(false);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedDescription, setEditedDescription] = useState("");
    const [description, setDescription] = useState(selectedProgressTask?.description || "");
    const [viewType, setViewType] = useState(false);
    const [editorContent, setEditorContent] = useState("");
    const { currentUser, loadData, setLoadData } = useContext(MyContext);
    const [taskPosts, setTaskPosts] = useState([]);

    const [selectedPic, setSelectedPic] = useState(
        selectedProgressTask?.pic || "Chọn PIC"
    );
    const [selectedCat, setSelectedCat] = useState(
        selectedProgressTask?.cat || "Chọn CAT"
    );
    const [selectedTag, setSelectedTag] = useState(
        selectedProgressTask?.tag || "Chọn TAG"
    );
    const [deadline, setDeadline] = useState(
        selectedProgressTask?.deadline || ""
    );

    const [status, setStatus] = useState(selectedProgressTask?.status || false);
    const [AConfirm, setAConfirm] = useState(
        selectedProgressTask?.AConfirm || false
    );
    const [BConfirm, setBConfirm] = useState(
        selectedProgressTask?.BConfirm || false
    );
    const [isLocked, setIsLocked] = useState(false);
    const [taskName, setTaskName] = useState("");

    const [listFile, setListFile] = useState([]);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");

    const [isEditorExpanded, setIsEditorExpanded] = useState(false);
    const [isLogModalVisible, setIsLogModalVisible] = useState(false);
    const [actionLogs, setActionLogs] = useState([]);

    const quillMainRef = useRef(null);

    const [editingPostId, setEditingPostId] = useState(null);
    const [editPostContent, setEditPostContent] = useState("");
    //
    // const [isKHKDModalVisible, setIsKHKDModalVisible] = useState(false);
    // const openKHKDModal = () => setIsKHKDModalVisible(true);
    // const closeKHKDModal = () => setIsKHKDModalVisible(false);
    //
    // const [isKHKDTongHopModalVisible, setIsKHKDTongHopModalVisible] = useState(false);
    //
    // const openKHKDTongHopModal = () => setIsKHKDTongHopModalVisible(true);
    // const closeKHKDTongHopModal = () => setIsKHKDTongHopModalVisible(false);

    const handlePasteImage = (pastedImage) => {
        const range = quillMainRef.current?.getEditor().getSelection();
        if (range) {
            quillMainRef.current
                ?.getEditor()
                .insertEmbed(range.index, "image", pastedImage);
            quillMainRef.current?.getEditor().setSelection(range.index + 1);
        }
    };

    usePasteHandler(quillMainRef, handlePasteImage);

    const isCurrentUserPost = (post) => {
        const currentUserName = currentUser.email.split("@")[0];
        return post.createUser === currentUserName;
    };

    const handleDeletePost = async (postId) => {
        try {
            await deleteProgressTaskPost(postId);
            await loadTaskPosts();
        } catch (error) {
            console.error("Error deleting post:", error);
        }
    };

    const fetchData = async () => {
        if (selectedProgressTask) {
            const conditions = {
                table: table,
                table_id: String(selectedProgressTask.id),
            };
            const data = await findRecordsByConditions(FileALL, conditions);
            setListFile(data);
        }
    };

    const handleUpdateProgressTask = async () => {
        try {
            await updateProgressTask(selectedProgressTask.id, {
                updateUser: currentUser.email.split("@")[0],
            });
            setLoadData(!loadData);
            // setTaskDetails((prev) => ({...prev, updateUser: currentUser.email.split('@')[0] }));
            await fetchData();
        } catch (error) {
            console.error("Lỗi khi cập nhật tiến độ task:", error);
        }
    };

    useEffect(() => {
        if (selectedProgressStep) {
            setIsLocked(selectedProgressStep?.isLocked);
        }
    }, [selectedProgressStep]);

    // useEffect(() => {
    //     setViewType(false);
    //     if (selectedProgressTask) {
    //         setTaskName(selectedProgressTask.title);
    //         setEditedTitle(selectedProgressTask.title);
    //         setEditorContent("");
    //     }
    //     fetchData();
    // }, [selectedProgressTask]);

    useEffect(() => {
        if (selectedProgressTask) {
            const taskTitle = selectedProgressTask.title;
            const taskDescription = selectedProgressTask.description;
            setTaskName(taskTitle || "");
            setDescription(taskDescription || "");
        }
    }, [selectedProgressTask]);

    useEffect(() => {
        if (viewType) {
            fetchData();
        }
    }, [viewType]);

    const modules = {
        toolbar: [
            [
                { header: [1, 2, 3, false] },
                "bold",
                "italic",
                "underline",
                "strike",
                { color: [] },
                { background: [] },
                { list: "ordered" },
                { list: "bullet" },
                { align: [] },
                { indent: "-1" },
                { indent: "+1" },
            ],
        ],
        imageResize: {},
        clipboard: {
            matchVisual: true,
        },
    };

    useEffect(() => {
        if (selectedProgressTask) {
            setSelectedPic(selectedProgressTask.pic || "Chọn PIC");
            setSelectedCat(selectedProgressTask.cat || "Chọn CAT");
            setSelectedTag(selectedProgressTask.tag || "Chọn TAG");
            setDeadline(selectedProgressTask.deadline || "");
            setStatus(selectedProgressTask.status || false);
            setAConfirm(selectedProgressTask.AConfirm || false);
            setBConfirm(selectedProgressTask.BConfirm || false);
            loadTaskPosts();
        }
    }, [selectedProgressTask]);

    useEffect(() => {
        const handleClickOutside = () => {
            setShowPicDropdown(false);
            setShowCatDropdown(false);
            setShowTagDropdown(false);
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const loadTaskPosts = async () => {
        const posts = await getAllProgressTaskPost(selectedProgressTask.id);
        setTaskPosts(posts);
    };

    const handleDropdownClick = (e, setter) => {
        if (isLocked) return;
        e.stopPropagation();
        setter((prev) => !prev);
    };

    const handleDeadlineChange = async (e) => {
        if (isLocked) return;
        const newDeadline = e.target.value;
        setDeadline(newDeadline);
        await updateProgressTask(selectedProgressTask.id, {
            deadline: newDeadline,
        });
        setTaskDetails((prev) => ({ ...prev, deadline: newDeadline }));
    };

    const handlePicSelect = async (item) => {
        if (isLocked) return;
        setSelectedPic(item);
        await updateProgressTask(selectedProgressTask.id, { pic: item });
        setTaskDetails((prev) => ({ ...prev, pic: item }));
        setShowPicDropdown(false);
    };

    const handleCatSelect = async (item) => {
        if (isLocked) return;
        setSelectedCat(item);
        await updateProgressTask(selectedProgressTask.id, { cat: item });
        setTaskDetails((prev) => ({ ...prev, cat: item }));
        setShowCatDropdown(false);
    };

    const handleTagSelect = async (item) => {
        if (isLocked) return;
        setSelectedTag(item);
        await updateProgressTask(selectedProgressTask.id, { tag: item });
        setTaskDetails((prev) => ({ ...prev, tag: item }));
        setShowTagDropdown(false);
    };
    const handleStartEditingDescription = () => {
        if (!isLocked) {
            setIsEditingDescription(true);
            setEditedDescription(description);
        }
    };

    const handleSaveDescription = async () => {
        const trimmedDescription = editedDescription.trim();
        if (!trimmedDescription) return;

        try {
            const updatedTitle = `${taskName} ||| ${trimmedDescription}`;
            await updateProgressTask(selectedProgressTask.id, { title: updatedTitle });

            setTaskName(updatedTitle);
            setTaskDetails((prev) => ({ ...prev, title: updatedTitle }));
            onUpdateTask(selectedProgressTask.id, { title: updatedTitle });
            setIsEditingDescription(false);
        } catch (error) {
            console.error("Failed to update task description:", error);
        }
    };

    const handleCancelEditDescription = () => {
        setIsEditingDescription(false);
        setEditedDescription(description);
    };

    const getButtonStyle = (type) => {
        const defaultStyle = css.actionButton;
        const confirmedStyle = css.actionButtonConfirmed;
        const disabledStyle = isLocked ? css.actionButtonDisabled : "";
        if (type === "status" && status) {
            return `${defaultStyle} ${confirmedStyle} ${disabledStyle}`;
        }
        if (type === "AConfirm" && AConfirm) {
            return `${defaultStyle} ${confirmedStyle} ${disabledStyle}`;
        }
        if (type === "BConfirm" && BConfirm) {
            return `${defaultStyle} ${confirmedStyle} ${disabledStyle}`;
        }
        return `${defaultStyle} ${disabledStyle}`;
    };

    const canConfirmStatus = () => {
        const currentUserName = currentUser.email.split("@")[0];
        return currentUserName === selectedProgressTask?.pic;
    };

    const logActionToDatabase = async (action, description) => {
        try {
            const logData = {
                company: currentUser.company || "",
                table: "ProgressTask", // Table name
                target_id: selectedProgressTask.id, // Task ID
                mo_ta: description || `User performed action: ${action}`, // Description
                trang_thai: action, // Action name
                created_at: new Date().toISOString(), // Timestamp
                user_create: currentUser.email.split("@")[0], // Current user
            };

            await createNewActionLog(logData);
        } catch (error) {
            console.error("Error logging action to database:", error);
        }
    };

    const handleStatusConfirm = async () => {
        if (!canConfirmStatus() || status) return; // Log only if status is false
        try {
            const newStatus = true;
            await updateProgressTask(selectedProgressTask.id, { status: newStatus });
            setStatus(newStatus);
            selectedProgressTask.status = newStatus;
            onStatusUpdate(newStatus);
            setUpdateProgressStep(true);

            logActionToDatabase("Xác nhận", "Status confirmed for the task");
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleAConfirm = async () => {
        if (AConfirm) return; // Log only if AConfirm is false
        try {
            const newAConfirm = true;
            onUpdateTask(selectedProgressTask.id, { AConfirm: newAConfirm });
            setAConfirm(newAConfirm);
            selectedProgressTask.AConfirm = newAConfirm;

            logActionToDatabase("Duyệt 1", "Approval 1 confirmed for the task");
        } catch (error) {
            console.error("Error updating A confirmation:", error);
        }
    };

    const handleBConfirm = async () => {
        if (BConfirm) return; // Log only if BConfirm is false
        try {
            const newBConfirm = true;
            onUpdateTask(selectedProgressTask.id, {
                BConfirm: newBConfirm,
                AConfirm: newBConfirm ? true : AConfirm,
            });
            setBConfirm(newBConfirm);
            if (newBConfirm) setAConfirm(true);

            logActionToDatabase("Duyệt 2", "Approval 2 confirmed for the task");
        } catch (error) {
            console.error("Error updating B confirmation:", error);
        }
    };

    const handleEditorChange = (content) => {
        if (editingPostId) {
            setEditPostContent(content);
        } else {
            setEditorContent(content);
        }
    };

    const handlePost = async () => {
        if (!editorContent.trim()) return;
        try {
            const newPost = {
                progressTaskId: selectedProgressTask.id,
                content: editorContent,
                createUser: currentUser.email.split("@")[0] || "Anonymous",
            };

            await createProgressTaskPost(newPost);
            setEditorContent("");
            await loadTaskPosts();
        } catch (error) {
            console.error("Error creating post:", error);
        }
    };

    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const date = new Date(timestamp);
        const seconds = Math.floor((now - date) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(months / 12);

        if (years > 0) {
            return `${years} ${years === 1 ? "year" : "years"} ago`;
        }
        if (months > 0) {
            return `${months} ${months === 1 ? "month" : "months"} ago`;
        }
        if (days > 0) {
            return `${days} ${days === 1 ? "day" : "days"} ago`;
        }
        if (hours > 0) {
            return `${hours}h ago`;
        }
        if (minutes > 0) {
            return `${minutes}m trước`;
        }
        return `${seconds}s trước`;
    };

    const confirmDeletePost = (postId) => {
        setPostToDelete(postId);
        setShowConfirmDelete(true);
    };

    const handleConfirmDelete = () => {
        if (postToDelete) {
            handleDeletePost(postToDelete);
            setPostToDelete(null);
        }
        setShowConfirmDelete(false);
    };

    const handleStartEditing = () => {
        if (!isLocked) {
            setIsEditingTitle(true);
            setEditedTitle(taskName);
        }
    };

    const handleSaveTitle = async () => {
        const trimmedTitle = editedTitle.trim();
        if (!trimmedTitle) return;

        try {
            const updatedTitle = `${trimmedTitle} ||| ${description}`;
            await updateProgressTask(selectedProgressTask.id, { title: updatedTitle });

            setTaskName(updatedTitle);
            setTaskDetails((prev) => ({ ...prev, title: updatedTitle }));
            onUpdateTask(selectedProgressTask.id, { title: updatedTitle });
            setIsEditingTitle(false);
        } catch (error) {
            console.error("Failed to update task title:", error);
        }
    };

    const handleCancelEdit = () => {
        setIsEditingTitle(false);
        setEditedTitle(taskName);
    };

    const [visible, setVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleOpen = (file) => {
        setSelectedFile(file);
        setVisible(true);
    };

    const handleClose = () => {
        setSelectedFile(null);
        setVisible(false);
    };

    const isPostEditable = (post) => {
        return isCurrentUserPost(post) && (!AConfirm || !BConfirm);
    };

    const handleEditPost = (post) => {
        setEditingPostId(post.id);
        setEditPostContent(post.content);
        setIsEditorExpanded(true);
    };

    const handleUpdatePost = async () => {
        if (!editPostContent.trim()) return;
        try {
            await updateProgressTaskPost({
                id: editingPostId,
                content: editPostContent,
                updateUser: currentUser.email.split("@")[0],
            });

            setEditingPostId(null);
            setEditPostContent("");

            await loadTaskPosts();
        } catch (error) {
            console.error("Error updating post:", error);
        }
    };

    const cancelEditPost = () => {
        setEditingPostId(null);
        setEditPostContent("");
    };

    useEffect(() => {
        if (editingPostId) {
            setEditorContent(editPostContent);
        } else {
            setEditorContent("");
        }
    }, [editingPostId, editPostContent]);

    const handleDownload = async (url, fileName) => {
        try {
            const response = await fetch(url, {
                mode: 'cors', // Handle cross-origin requests
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error downloading file:', error);
            // Optionally show an error message to the user
        }
    };

    const handleResetStatus = async () => {
        if (isLocked) return;
        try {
            await updateProgressTask(selectedProgressTask.id, {
                status: false,
                AConfirm: false,
                BConfirm: false,
                updateUser: currentUser.email.split("@")[0],
            });

            setStatus(false);
            setAConfirm(false);
            setBConfirm(false);

            selectedProgressTask.status = false;
            selectedProgressTask.AConfirm = false;
            selectedProgressTask.BConfirm = false;

            onStatusUpdate(false);
            setUpdateProgressStep(true);
        } catch (error) {
            console.error("Error resetting status:", error);
        }
    };
    const openLogModal = async () => {
        try {
            const logs = await getAllActionLog();
            const filteredLogs = logs.filter(
                (log) => log.target_id === selectedProgressTask.id && log.table === "ProgressTask"
            );
            setActionLogs(filteredLogs);
            setIsLogModalVisible(true);
        } catch (error) {
            console.error("Error fetching logs:", error);
        }
    };

    const closeLogModal = () => {
        setIsLogModalVisible(false);
    };


    return (
        <>
            {showConfirmDelete && (
                <ConfirmDeletePopup
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setShowConfirmDelete(false)}
                />
            )}
            {selectedProgressTask ? (
                viewType ? (
                    <div className={css.rightPanel}>
                        <div className={css.header}>
                            <div className={css.titleHeader}>
                                <div className={css.titleName}>
                                    <div className={css.title}>{taskName}</div>
                                    <CustomTooltip show={isLocked}>
                                        <div>
                                            <UploadFileForm
                                                id={String(selectedProgressTask.id)}
                                                table={table}
                                                style={{ fontSize: 15 }}
                                                onGridReady={handleUpdateProgressTask}
                                                disabled={isLocked}
                                            />
                                        </div>
                                    </CustomTooltip>
                                </div>
                                <div className={css.buttonView}>
                                    <button
                                        className={`${css.tab} ${!viewType ? css.active : ''}`}
                                        onClick={() => setViewType(false)}
                                    >
                                        Chi tiết
                                    </button>
                                    <button
                                        className={`${css.tab} ${viewType ? css.active : ''}`}
                                        onClick={() => setViewType(true)}
                                    >
                                        Đính kèm
                                        {listFile.length > 0 ? (
                                            <span className={css.badge}> {listFile.length}</span>
                                        ) : (
                                            ''
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '10px',
                                alignItems: 'center',
                            }}
                        >
                            {listFile.map((file) => (
                                <Tag
                                    key={file.id}
                                    onClick={() => handleOpen(file)}
                                    style={{
                                        height: '40px',
                                        cursor: 'pointer',
                                        backgroundColor: '#f5f5f5',
                                        color: '#333',
                                        borderRadius: '16px',
                                        padding: '6px 12px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'all 0.3s ease',
                                        border: '1px solid #ddd',
                                    }}
                                >
                                    {file.name}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginLeft: '8px',
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {file.url && (
                                            <button
                                                onClick={() => handleDownload(file.url, file.name)}
                                                className={css.downloadButton}
                                            >
                                                Tải về
                                            </button>
                                        )}
                                        <PopUpDelete
                                            id={file.id}
                                            reload={() => fetchData()}
                                            table={table}
                                            currentUser={currentUser}
                                        />
                                    </div>
                                </Tag>
                            ))}

                            <Modal
                                open={visible}
                                onCancel={() => handleClose()}
                                footer={null}
                                title={selectedFile?.name}
                                width={1200}
                                bodyStyle={{
                                    height: '70vh',
                                    // overflowY: "auto",
                                }}
                            >
                                {selectedFile && <PreviewComponent data={selectedFile} />}
                            </Modal>
                        </div>
                    </div>
                ) : (
                    <div className={css.rightPanel}>
                        <div className={css.header}>
                            <div className={css.titleHeader}>
                                {isEditingTitle ? (
                                    <div className={css.titleEditContainer}>
                                        <input
                                            type="text"
                                            value={editedTitle}
                                            onChange={(e) => setEditedTitle(e.target.value)}
                                            className={css.titleInput}
                                        />
                                        <button
                                            onClick={handleSaveTitle}
                                            className={`${css.titleEditButton} ${css.saveButton}`}
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className={`${css.titleEditButton} ${css.cancelButton}`}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className={css.titleViewContainer}>
                                        <div className={css.title}>{taskName}</div>
                                        <CustomTooltip show={isLocked}>
                                            <button
                                                onClick={handleStartEditing}
                                                className={`${css.editButton} ${isLocked ? css.disabled : ''}`}
                                                disabled={isLocked}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        </CustomTooltip>
                                    </div>
                                )}
                                <div className={css.buttonView}>
                                    <button
                                        className={`${css.tab} ${!viewType ? css.active : ''}`}
                                        onClick={() => setViewType(false)}
                                    >
                                        Chi tiết
                                    </button>
                                    <button
                                        className={`${css.tab} ${viewType ? css.active : ''}`}
                                        onClick={() => setViewType(true)}
                                    >
                                        Đính kèm
                                        {listFile.length > 0 ? (
                                            <span className={css.badge}> {listFile.length}</span>
                                        ) : (
                                            ''
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className={css.metaSection}>
                                <div className={css.metaGroup}>
                                    <img
                                        src={IconPMPic}
                                        alt=""
                                        style={{ width: 20, height: 20 }}
                                    />
                                    <CustomTooltip show={isLocked}>
                                        <div className={css.dropdownContainer}>
                                            <button
                                                className={`${css.dropdownButton} ${isLocked ? css.disabled : ''
                                                }`}
                                                onClick={(e) =>
                                                    handleDropdownClick(e, setShowPicDropdown)
                                                }
                                                disabled={isLocked}
                                            >
                                                {selectedPic}
                                            </button>
                                            {showPicDropdown &&
                                                selectedProgressStep?.pic?.length > 0 && (
                                                    <div className={css.dropdownMenu}>
                                                        {selectedProgressStep.pic.map((item, index) => (
                                                            <div
                                                                key={index}
                                                                className={css.dropdownItem}
                                                                onClick={() => handlePicSelect(item)}
                                                            >
                                                                {item}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                        </div>
                                    </CustomTooltip>
                                </div>

                                {/* <div className={css.metaGroup}>
                                    <img
                                        src={IconPMCat}
                                        alt=""
                                        style={{ width: 20, height: 20 }}
                                    />
                                    <CustomTooltip show={isLocked}>
                                        <div className={css.dropdownContainer}>
                                            <button
                                                className={css.dropdownButton}
                                                onClick={(e) =>
                                                    handleDropdownClick(e, setShowCatDropdown)
                                                }
                                                disabled={isLocked}
                                            >
                                                {selectedCat}
                                            </button>
                                            {showCatDropdown &&
                                                selectedProgressStep?.cat?.length > 0 && (
                                                    <div className={css.dropdownMenu}>
                                                        {selectedProgressStep.cat.map((item, index) => (
                                                            <div
                                                                key={index}
                                                                className={css.dropdownItem}
                                                                onClick={() => handleCatSelect(item)}
                                                            >
                                                                {item}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                        </div>
                                    </CustomTooltip>
                                </div> */}

                                <div className={css.metaGroup}>
                                    <img
                                        src={IconPMTag}
                                        alt=""
                                        style={{ width: 20, height: 20 }}
                                    />
                                    <CustomTooltip show={isLocked}>
                                        <div className={css.dropdownContainer}>
                                            <button
                                                className={css.dropdownButton}
                                                onClick={(e) =>
                                                    handleDropdownClick(e, setShowTagDropdown)
                                                }
                                                disabled={isLocked}
                                            >
                                                {selectedTag}
                                            </button>
                                            {showTagDropdown &&
                                                selectedProgressStep?.tag?.length > 0 && (
                                                    <div className={css.dropdownMenu}>
                                                        {selectedProgressStep.tag.map((item, index) => (
                                                            <div
                                                                key={index}
                                                                className={css.dropdownItem}
                                                                onClick={() => handleTagSelect(item)}
                                                            >
                                                                {item}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                        </div>
                                    </CustomTooltip>
                                </div>

                                <div className={css.metaGroup}>
                                    <img
                                        src={IconPMTimeline}
                                        alt=""
                                        style={{ width: 20, height: 20 }}
                                    />
                                    <CustomTooltip show={isLocked}>
                                        <input
                                            type="date"
                                            value={deadline}
                                            onChange={handleDeadlineChange}
                                            className={`${css.dateInput} ${isLocked ? css.disabled : ''
                                            }`}
                                            disabled={isLocked}
                                        />
                                    </CustomTooltip>
                                </div>
                            </div>
                            <div className={css.descriptionSection}>
                                {isEditingDescription ? (
                                    <div className={css.descriptionEditContainer}>
            <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className={css.descriptionInput}
                placeholder="Nhập ghi chú"
            />
                                        <button
                                            onClick={handleSaveDescription}
                                            className={`${css.descriptionEditButton} ${css.saveButton}`}
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={handleCancelEditDescription}
                                            className={`${css.descriptionEditButton} ${css.cancelButton}`}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className={css.descriptionViewContainer}>
                                        <div
                                            className={css.description}>{description || 'Chưa có ghi chú'}</div>
                                        <CustomTooltip show={isLocked}>
                                            <button
                                                onClick={handleStartEditingDescription}
                                                className={`${css.editButton} ${isLocked ? css.disabled : ''}`}
                                                disabled={isLocked}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        </CustomTooltip>
                                    </div>
                                )}
                            </div>

                        </div>

                        <div className={css.content}>
                            <div
                                className={css.blockList}
                                style={{
                                    height: isEditorExpanded ? '40%' : '85%',
                                    transition: 'height 0.3s ease-in-out',
                                }}
                            >
                                <div className={css.scrollContainer}>
                                    {taskPosts.map((post, index) => (
                                        <div key={index} className={css.postWrapper}>
                                            <div
                                                className={css.postBlock}
                                                style={{
                                                    backgroundColor: isCurrentUserPost(post)
                                                        ? '#F3F7FF'
                                                        : '#FFFAF3',
                                                    border: isCurrentUserPost(post)
                                                        ? '1px solid #87BEEC'
                                                        : '1px solid #E9CBAA',
                                                    color: isCurrentUserPost(post)
                                                        ? "#234883"
                                                        : "#84523F",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        marginBottom: "10px",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: "10px",
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        <span className={css.postUser}>
                                                            {post.createUser}
                                                        </span>
                                                        <span className={css.postTimestamp}>
                                                            {formatTimestamp(post.updatedAt)}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", gap: "5px" }}>
                                                        {isPostEditable(post) && (
                                                            <button
                                                                onClick={() => handleEditPost(post)}
                                                                style={{
                                                                    background: "none",
                                                                    border: "none",
                                                                    color: "#666",
                                                                    fontSize: "20px",
                                                                    cursor: "pointer",
                                                                    padding: "0 5px",
                                                                    lineHeight: 1,
                                                                    opacity: 0.6,
                                                                    transition: "opacity 0.2s",
                                                                }}
                                                            >
                                                                <Pencil size={20} />
                                                            </button>
                                                        )}
                                                        {isCurrentUserPost(post) && (
                                                            <button
                                                                onClick={() => confirmDeletePost(post.id)}
                                                                style={{
                                                                    background: "none",
                                                                    border: "none",
                                                                    color: "#666",
                                                                    fontSize: "20px",
                                                                    cursor: "pointer",
                                                                    padding: "0 5px",
                                                                    lineHeight: 1,
                                                                    opacity: 0.6,
                                                                    transition: "opacity 0.2s",
                                                                }}
                                                            >
                                                                <Trash size={20} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div
                                                    className={css.postContent}
                                                    dangerouslySetInnerHTML={{ __html: post.content }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className={css.editorContainer}>
                                <button
                                    className={css.collapseButton}
                                    onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                                >
                                    {isEditorExpanded ? (
                                        <>
                                            <ChevronDown size={20} />
                                            <span>Collapse Editor</span>
                                        </>
                                    ) : (
                                        <>
                                            <ChevronUp size={20} />
                                            <span>Expand Editor</span>
                                        </>
                                    )}
                                </button>

                                <div
                                    className={css.textBlock}
                                    style={{
                                        height: isEditorExpanded ? "300px" : "0px",
                                        visibility: isEditorExpanded ? "visible" : "hidden",
                                        opacity: isEditorExpanded ? 1 : 0,
                                        transition: "all 0.3s ease-in-out",
                                        position: "relative",
                                    }}
                                >
                                    <ReactQuill
                                        ref={quillMainRef}
                                        value={editingPostId ? editPostContent : editorContent}
                                        onChange={handleEditorChange}
                                        modules={modules}
                                        placeholder="Type your text here..."
                                        theme="snow"
                                    />

                                    <div
                                        className={css.editorActions}
                                        style={{
                                            position: "absolute",
                                            bottom: "0",
                                            left: "0",
                                            right: "0",
                                            background: "white",
                                            zIndex: 1,
                                            display: "flex",
                                            gap: "10px",
                                        }}
                                    >
                                        <CustomTooltip show={isLocked}>
                                            <button
                                                className={`${css.actionButton} ${isLocked ? css.disabled : ""
                                                    }`}
                                                onClick={editingPostId ? handleUpdatePost : handlePost}
                                                disabled={isLocked}
                                                style={{
                                                    opacity: isEditorExpanded ? 1 : 0,
                                                    visibility: isEditorExpanded ? "visible" : "hidden",
                                                    transition: "opacity 0.3s ease-in-out",
                                                }}
                                            >
                                                {editingPostId ? "Update" : "Post"}
                                            </button>
                                        </CustomTooltip>
                                        {editingPostId && (
                                            <button
                                                className={css.actionButton}
                                                onClick={cancelEditPost}
                                                style={{
                                                    opacity: isEditorExpanded ? 1 : 0,
                                                    visibility: isEditorExpanded ? "visible" : "hidden",
                                                    transition: "opacity 0.3s ease-in-out",
                                                    backgroundColor: "#f5f5f5",
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={css.actions}>
                            {permission && (
                                <>
                                    {/*<button className={css.actionButton} onClick={openKHKDModal}>*/}
                                    {/*    KHKD*/}
                                    {/*</button>*/}
                                    {/*<button*/}
                                    {/*    className={css.actionButton}*/}
                                    {/*    onClick={openKHKDTongHopModal}*/}
                                    {/*>*/}
                                    {/*    KHKD Tổng Hợp*/}
                                    {/*</button>*/}
                                    <button
                                        className={css.actionButton}
                                        onClick={openLogModal}
                                    >
                                        Log
                                    </button>
                                    <Modal
                                        title="Action Logs"
                                        open={isLogModalVisible}
                                        onCancel={closeLogModal}
                                        footer={null}
                                    >
                                        <ul>
                                            {actionLogs.map((log, index) => (
                                                <li key={index}>
                                                    <strong>{log.user_create}</strong> performed <em>{log.trang_thai}</em> on
                                                    task ID {log.target_id} at{' '}
                                                    {new Date(log.created_at).toLocaleString()}
                                                </li>
                                            ))}
                                        </ul>
                                    </Modal>

                                    <CustomTooltip show={isLocked}>
                                        <button
                                            className={getButtonStyle('status')}
                                            onClick={handleStatusConfirm}
                                            disabled={
                                                isLocked || !permission.confirm || !canConfirmStatus()
                                            }
                                        >
                                            {status ? 'Đã xác nhận' : 'xác nhận'}
                                        </button>
                                    </CustomTooltip>
                                    <CustomTooltip show={isLocked}>
                                        <button
                                            className={getButtonStyle('AConfirm')}
                                            disabled={
                                                !status ||
                                                isLocked ||
                                                !permission.approve1 ||
                                                (BConfirm && !currentUser.isAdmin)
                                            }
                                            onClick={handleAConfirm}
                                        >
                                            Duyệt 1
                                        </button>
                                    </CustomTooltip>
                                    <CustomTooltip show={isLocked}>
                                        <button
                                            className={getButtonStyle('BConfirm')}
                                            disabled={
                                                !status ||
                                                isLocked ||
                                                !permission.approve2 ||
                                                (!AConfirm && !currentUser.isAdmin)
                                            }
                                            onClick={handleBConfirm}
                                        >
                                            Duyệt 2
                                        </button>
                                    </CustomTooltip>
                                    <CustomTooltip show={isLocked}>
                                        <button
                                            className={`${css.actionButton} ${css.resetButton}`}
                                            onClick={handleResetStatus}
                                            disabled={isLocked || (!currentUser.isAdmin && !canConfirmStatus())}
                                        >
                                            Reset Trạng thái
                                        </button>
                                    </CustomTooltip>
                                </>
                            )}
                        </div>
                    </div>
                )
            ) : (
                <div className={css.rightPanel}>
                    <div className={css.header}>
                        <div className={css.titleHeader}>
                            <div className={css.title}>Select a task to view</div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RightPanel;
