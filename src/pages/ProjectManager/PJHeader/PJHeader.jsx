import React, {useState, useEffect} from "react";
import {ChevronDown, Settings, X} from "lucide-react";
import css from "./PJHeader.module.css";
import ChangeMode from "../../Home/SelectComponent/ChangeMode";
import {Switch} from "antd";
// ICON
import {ScrewIcon} from "../../../icon/IconSVG";
// API
import {
    getAllProgress,
    createProgress,
    updateProgress,
    deleteProgress,
} from "../../../apis/progressService";
import ProjectManager from "../../Admin2/Components/ProjectManager/ProjectManager";
import {BackCanvas} from "../../../icon/svg/IconSvg.jsx";
import { useNavigate } from 'react-router-dom';

const PJHeader = ({
                      selectedProject,
                      setSelectedProject,
                      projectId,
                      viewMode,
                      setViewMode,
                  }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
    const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [editingName, setEditingName] = useState("");
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();

    const statusOptions = ["Đang triển khai", "Hoàn thành", "Tạm dừng"];

    useEffect(() => {
        loadProject();
    }, []);

    const loadProject = async () => {
        try {
            const data = await getAllProgress();
            setProjects(data);

            if (data.length === 0) return;

            let target = null;

            if (projectId) {
                target = data.find((project) => project.id == projectId);
            } else {
                const storedData = localStorage.getItem("selectedProgressProject");
                if (storedData) {
                    const storedProject = JSON.parse(storedData);
                    target = data.find((project) => project.id === storedProject.id);
                }
            }

            const selectedProject = target || data[0];
            setSelectedProject(selectedProject);
            localStorage.setItem(
                "selectedProgressProject",
                JSON.stringify(selectedProject)
            );
        } catch (error) {
            console.error("Error loading projects:", error);
        }
    };
    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (newProjectName.trim()) {
            const newProjectData = {
                name: newProjectName,
                status: "Đang triển khai",
            };
            try {
                const newProject = await createProgress(newProjectData);
                setProjects([...projects, newProject]);
                setSelectedProject(newProject);
                localStorage.setItem(
                    "selectedProgressProject",
                    JSON.stringify(newProject)
                );
                setNewProjectName("");
                setIsModalOpen(false);
                setIsDropdownOpen(false);
            } catch (error) {
                console.error("Error creating project:", error);
            }
        }
    };

    const handleUpdateProject = async (e) => {
        e.preventDefault();
        if (editingName.trim()) {
            const updatedData = {
                ...selectedProject,
                name: editingName,
            };
            try {
                const updatedProject = await updateProgress(updatedData);
                const updatedProjects = projects.map((project) =>
                    project.id === selectedProject.id ? updatedProject : project
                );
                setProjects(updatedProjects);
                setSelectedProject(updatedProject);
                localStorage.setItem(
                    "selectedProgressProject",
                    JSON.stringify(updatedProject)
                );
                setIsSettingsOpen(false);
            } catch (error) {
                console.error("Error updating project:", error);
            }
        }
    };

    const handleStatusChange = async (newStatus) => {
        const updatedData = {
            ...selectedProject,
            status: newStatus,
        };
        try {
            const updatedProject = await updateProgress(updatedData);
            const updatedProjects = projects.map((project) =>
                project.id === selectedProject.id ? updatedProject : project
            );
            setProjects(updatedProjects);
            setSelectedProject(updatedProject);
            localStorage.setItem(
                "selectedProgressProject",
                JSON.stringify(updatedProject)
            );
        } catch (error) {
            console.error("Error updating project status:", error);
        }
    };

    const handleDeleteProject = async () => {
        try {
            await deleteProgress(selectedProject.id);
            const updatedProjects = projects.filter(
                (project) => project.id !== selectedProject.id
            );
            setProjects(updatedProjects);
            if (updatedProjects.length > 0) {
                setSelectedProject(updatedProjects[0]);
                localStorage.setItem(
                    "selectedProgressProject",
                    JSON.stringify(updatedProjects[0])
                );
            } else {
                setSelectedProject({});
                localStorage.removeItem("selectedProgressProject");
            }
            setIsSettingsOpen(false);
        } catch (error) {
            console.error("Error deleting project:", error);
        }
    };

    return (
        <>
            <div className={css.headerContainer}>
                <div className={css.headerContent}>
                    <div className={css.leftSection}>
                        {/*<ChangeMode/>*/}
                        <div className={css.backCanvas}
                             onClick={() =>
                                 navigate('/canvas')
                                 // (window.location.href = `${import.meta.env.VITE_DOMAIN_URL}/canvas`)
                             }
                        >
                            <BackCanvas height={20} width={20}/>
                        </div>
                        <span className={css.nameApp}>To-do</span>

                        {/* <span className={css.headerName}>PandaWork</span> */}
                        {/* <Switch
              checked={viewMode === "wiki"}
              onChange={(checked) => setViewMode(checked ? "wiki" : "project")}
              checkedChildren="Wiki"
              unCheckedChildren="Project"
              className={css.viewSwitch}
            /> */}
                        {/* <div className={css.buttonView}>
              <button
                className={`${css.tab} ${viewMode == "project" ? css.active : ""
                  }`}
                onClick={() => setViewMode("project")}
              >
                Quản lý việc
              </button>
              <button
                className={`${css.tab} ${viewMode == "wiki" ? css.active : ""}`}
                onClick={() => setViewMode("wiki")}
              >
                Kho tài liệu
              </button>
            </div> */}

                        {viewMode === "project" && (
                            <div className={css.dropdown}>
                                <button
                                    className={css.dropdownButton}
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    {selectedProject.name}
                                    <ChevronDown size={20}/>
                                </button>
                                {isDropdownOpen && (
                                    <div className={css.dropdownContent}>
                                        <div
                                            className={css.createNewProject}
                                            onClick={() => {
                                                setIsModalOpen(true);
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            Create new Project
                                        </div>
                                        <div className={css.dropdownDivider}/>
                                        {projects.map((project) => (
                                            <div
                                                key={project.id}
                                                className={css.dropdownItem}
                                                onClick={() => {
                                                    setSelectedProject(project);
                                                    localStorage.setItem(
                                                        "selectedProgressProject",
                                                        JSON.stringify(project)
                                                    );
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                {project.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {viewMode === "project" && selectedProject.status && (
                            <div className={css.statusBox}>
                                <span>{selectedProject.status}</span>
                            </div>
                        )}
                    </div>

                    {viewMode === "project" && (
                        <div className={css.settingsContainer}>
                            <button
                                className={css.settingsButton}
                                onClick={() =>
                                    setIsSettingsDropdownOpen(!isSettingsDropdownOpen)
                                }
                            >
                                <img src={ScrewIcon} alt="" size={20}/>
                            </button>
                            {isSettingsDropdownOpen && (
                                <div className={css.settingsDropdown}>
                                    <div
                                        className={css.settingsOption}
                                        onClick={() => {
                                            setIsSettingsOpen(true);
                                            setEditingName(selectedProject.name);
                                            setIsSettingsDropdownOpen(false);
                                        }}
                                    >
                                        Project Settings
                                    </div>
                                    <div
                                        className={css.settingsOption}
                                        onClick={() => {
                                            setIsAdminSettingsOpen(true);
                                            setIsSettingsDropdownOpen(false);
                                        }}
                                    >
                                        Admin Settings
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className={css.modalOverlay}>
                    <div className={css.modal}>
                        <div className={css.modalHeader}>
                            <h2>Create New Project</h2>
                            <button
                                className={css.closeButton}
                                onClick={() => setIsModalOpen(false)}
                            >
                                <X size={20}/>
                            </button>
                        </div>
                        <form onSubmit={handleCreateProject}>
                            <div className={css.modalContent}>
                                <label htmlFor="projectName">Project Name</label>
                                <input
                                    id="projectName"
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="Enter project name"
                                />
                            </div>
                            <div className={css.modalFooter}>
                                <button
                                    type="button"
                                    className={css.cancelButton}
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className={css.createButton}>
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isSettingsOpen && (
                <div className={css.modalOverlay}>
                    <div className={css.modal}>
                        <div className={css.modalHeader}>
                            <h2>Project Settings</h2>
                            <button
                                className={css.closeButton}
                                onClick={() => setIsSettingsOpen(false)}
                            >
                                <X size={20}/>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProject}>
                            <div className={css.modalContent}>
                                <div className={css.formGroup}>
                                    <label htmlFor="editName">Project Name</label>
                                    <input
                                        id="editName"
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        placeholder="Enter project name"
                                    />
                                </div>

                                <div className={css.formGroup}>
                                    <label>Project Status</label>
                                    <div className={css.statusOptions}>
                                        {statusOptions.map((status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                className={`${css.statusOption} ${selectedProject.status === status
                                                    ? css.statusOptionActive
                                                    : ""
                                                }`}
                                                onClick={() => handleStatusChange(status)}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className={css.modalFooter}>
                                <button
                                    type="button"
                                    className={css.deleteButton}
                                    onClick={handleDeleteProject}
                                >
                                    Delete Project
                                </button>
                                <div className={css.modalActions}>
                                    <button
                                        type="button"
                                        className={css.cancelButton}
                                        onClick={() => setIsSettingsOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className={css.createButton}>
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAdminSettingsOpen && (
                <div className={css.modalOverlay}>
                    <div className={`${css.modal} ${css.adminSettingsModal}`}>
                        <div className={css.modalHeader}>
                            <h2>Admin Settings</h2>
                            <button
                                className={css.closeButton}
                                onClick={() => setIsAdminSettingsOpen(false)}
                            >
                                <X size={20}/>
                            </button>
                        </div>
                        <div className={css.modalContent}>
                            <ProjectManager/>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PJHeader;
