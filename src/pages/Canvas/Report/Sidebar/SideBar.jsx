import React, { useContext, useEffect, useState } from "react";
import { Button, Checkbox, Input, message, Modal, Popover, Select, Tooltip } from "antd";
import css from "./Sidebar.module.css";
import { IconButton } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { useNavigate, useParams } from "react-router-dom";
import { MyContext } from "../../../../MyContext.jsx";
import {
    ChuoiNghiepVu,
    IconCloseFolder,
    IconCollapGreen,
    IconOpenFolder,
    OffFavoriteIcon,
    OnFavoriteIcon,
    SearchIcon,
} from "../../../../icon/IconSVG.js";
// API
import { createFileTab, deleteFileTab, getAllFileTab, updateFileTab } from "../../../../apis/fileTabService.jsx";
// CONSTANT
import { findRecordsByConditions } from "../../../../apis/searchModelService.jsx";
import { createTimestamp, formatDateISO } from "../../../../generalFunction/format.js";
import { Settings } from "lucide-react";
import DialogSettingTag from "../Dialog/DialogSettingTag.jsx";
import {
    createNewReportCanvas,
    deleteReportCanvas,
    getAllReportCanvas,
    updateReportCanvas
} from "../../../../apis/reportCanvasService.jsx";
import { getAllTag } from "../../../../apis/tagService.jsx";
import { FaEllipsisV } from "react-icons/fa";
import { updateUser } from "../../../../apis/userService.jsx";
import { FilterCustom, FolderCustom } from "../../../../icon/svg/IconSvg.jsx";
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";

const { confirm } = Modal;
export default function SideBar({ isCollapsed, onToggle, togglePinSidebar, isPinSideBar, }) {
    const [listChain, setListChain] = useState([]);
    const navigate = useNavigate();
    const { companySelect, buSelect, tabSelect, siderId } = useParams();
    const [searchText, setSearchText] = useState("");
    const {
        selectedTapCanvas,
        setSelectedTapCanvas,
        loadData,
        currentUser,
        setCurrentUser,
        listUC_CANVAS
    } = useContext(MyContext);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newCardName, setNewCardName] = useState("");
    const [newCardCode, setNewCardCode] = useState("");
    const [selectedKey, setSelectedKey] = useState(null);
    const [selectedTable, setSelectedTable] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedDataType, setSelectedDataType] = useState(null);
    const [isModalFolderVisible, setIsModalFolderVisible] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [tags, setTags] = useState([])
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);
    const [favoriteIds, setFavoriteIds] = useState([]);
    const [listFavorite, setListFavorite] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hideFilter, setHideFilter] = useState(false);
    const [openPopoverId, setOpenPopoverId] = useState(null);
    const [openPopoverTab, setOpenPopoverTab] = useState(null);
    const [tabs, setTabs] = useState([]);
    const [newFolderData, setNewFolderData] = useState({ label: '', });


    useEffect(() => {
        loadFileTab();
    }, []);


    useEffect(() => {
        fetchData();
    }, [loadData]);

    useEffect(() => {
        if (selectedTable !== "Data") {
            setSelectedDataType(null);
        }
    }, [selectedTable]);

    const fetchData = async () => {
        try {
            let data = await getAllReportCanvas();
            // const user = await getCurrentUserLogin();
            setListChain(data);
        } catch (error) {
            console.error("Error fetching card data:", error);
        }
    };

    const loadFileTab = async () => {
        const fileTabs = await getAllFileTab();
        const filteredTabs = fileTabs.filter(tab => tab.table === "report");
        filteredTabs.sort((a, b) => a.position - b.position);

        setTabs([
            {
                id: 0,
                key: "tapFavorite",
                label: "Danh sách yêu thích",
                alt: "Favorite",
            },
            ...filteredTabs
        ]);
    };


    const hasVietnameseTones = (str) => {
        const regex = /[\u0300-\u036f\u1ea0-\u1eff]/;
        return regex.test(str);
    };

    const removeVietnameseTones = (str) => {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toLowerCase();
    };

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };


    const handleFavoriteClick = async (id) => {
        try {
            let existingFavorites = currentUser?.info?.bookmark_report || [];

            if (existingFavorites.includes(id)) {
                existingFavorites = existingFavorites.filter((favId) => favId !== id);
                const updatedFavorites = listFavorite.filter((fav) => fav.id !== id);
                setListFavorite(updatedFavorites);
            } else {
                existingFavorites.push(id);
                await finDataByFavorites(existingFavorites);
            }

            const updatedUser = {
                ...currentUser,
                info: {
                    ...currentUser.info,
                    bookmark_report: existingFavorites
                }
            };
            setCurrentUser(updatedUser);
            await updateUser(currentUser.email, updatedUser);


            setFavoriteIds(existingFavorites);
        } catch (error) {
            console.error("Lỗi khi cập nhật bookmark_report:", error);
        }
    };


    const finDataByFavorites = async (favorites) => {
        const dataFavorite = await findRecordsByConditions("ReportCanvas", {
            id: favorites,
        });
        const sortedDataFavorite = dataFavorite.sort((a, b) => {
            return favorites.indexOf(a.id) - favorites.indexOf(b.id);
        });
        setListFavorite(sortedDataFavorite);
    };

    const fetchFavorites = async () => {
        try {
            const favorites = currentUser?.info?.bookmark_report || [];
            await finDataByFavorites(favorites);
            setFavoriteIds(favorites);
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu bookmark:", error);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, [currentUser]);


    const tempParentLabels = tabs;

    const filterChainBySearchText = (chain, searchText) => {
        return (
            searchText.trim() === "" ||
            (hasVietnameseTones(searchText)
                ? chain.name.toLowerCase().includes(searchText.toLowerCase())
                : removeVietnameseTones(chain.name).includes(
                    removeVietnameseTones(searchText)
                ))
        );
    };

    const createChainLabel = (chain) => {
        return (
            <div style={{ display: "flex", alignItems: "center", width: "100%", height: '30px' }}>
                <span
                    title={chain.name}
                    style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        width: '90%',
                    }}
                >
                    {chain.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', width: '10%', justifyContent: "end" }}>
                    {(favoriteIds.includes(chain.id) || hoveredId === chain.id) && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleFavoriteClick(chain.id);
                            }}
                        >
                            <img
                                src={favoriteIds.includes(chain.id) ? OnFavoriteIcon : OffFavoriteIcon}
                                alt=""
                                width={16}
                                height={16}
                            />
                        </IconButton>
                    )}
                </div>
            </div>
        );
    };


    const filteredList = tabs.map((tab) => {
        const getFilteredChildren = () => {
            const sourceList = tab.key === "tapFavorite" ? listFavorite : listChain;

            return sourceList
                .filter((chain) =>
                    (tab.key === "tapFavorite" || chain.tab === tab.key) &&
                    filterChainBySearchText(chain, searchText) &&
                    (currentUser.isAdmin || listUC_CANVAS.some(item => chain.userClass?.includes(item.id)))
                )
                .sort((a, b) => (a.position || 0) - (b.position || 0))
                .map((chain) => ({
                    key: chain.id,
                    label: createChainLabel(chain),
                    value: chain,
                }));
        };

        const filteredChildren = getFilteredChildren();

        return filteredChildren.length > 0 || searchText.trim() === ""
            ? {
                key: tab.key,
                id: tab.id,
                icon: <img src={ChuoiNghiepVu} alt={tab.alt} />,
                label: (
                    <div className={css.nameTab}>
                        <span title={tab.label}>{tab.label}</span>
                    </div>
                ),
                children: filteredChildren.length > 0
                    ? filteredChildren
                    : [{ key: "empty", label: "Không có dữ liệu" }],
                mode: "inline",
            }
            : null;
    }).filter((item) => item !== null);


    const handleOpenModal = () => {
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setNewCardName("");
        setSelectedTemplate(null);
        setSelectedTable(null);
        setSelectedDataType(null);
    };

    const handleCreate = async () => {
        if (!newCardName || !selectedTemplate || !selectedTable) {
            message.error("Vui lòng chọn đầy đủ thông tin");
            return;
        }

        const itemsInSelectedTab = listChain
            .filter(item => item.tab === selectedTemplate)
            .map(item => item.position || 0);

        const minPosition = itemsInSelectedTab.length > 0
            ? Math.min(...itemsInSelectedTab)
            : 0;

        const newPosition = minPosition - 1;

        await createNewReportCanvas({
            name: newCardName,
            code: newCardCode,
            tab: selectedTemplate,
            type: selectedTable || null,
            position: newPosition,
            user_create: currentUser.email,
            created_at: createTimestamp(),
        });

        handleCloseModal();
        fetchData();
    };


    const toggleTag = (tag) => {
        setSelectedTags((prevTags) =>
            prevTags.includes(tag) ? prevTags.filter(t => t !== tag) : [...prevTags, tag]
        );
    };

    const fetchTag = async () => {
        const data = await getAllTag();
        const filteredData = data.filter(tag => tag.table == 'report');
        setTags(filteredData);
    };


    useEffect(() => {
        fetchTag()
    }, []);

    function getTypeColor(type) {
        const typeColors = {
            cl: "#234F96",
            ql: "#3FA073",
            vh: "#FF7C73"
        };

        return typeColors[type] || "#000000";
    }

    const listType = [
        { color: "#234F96", text: "Chiến lược", value: 'cl' },
        { color: "#3FA073", text: "Quản lý", value: 'ql' },
        { color: "#FF7C73", text: "Vận hành", value: 'vh' }
    ];


    const handleCardClick = (parentKey, subItemKey) => {
        localStorage.setItem("tabSelectCanvas", parentKey);
        setSelectedTapCanvas(parentKey);
        setSelectedKey(subItemKey);
        const newPath = `/canvas/${companySelect}/${buSelect}/${tabSelect}/dashboard/${subItemKey}`;
        navigate(newPath);
    };


    const handleEdit = async (data) => {
        await updateReportCanvas(data);
        setSelectedFile(data);
        await fetchData();
        await fetchFavorites();
        setIsSaving(false);

    };


    const handleDeleteFile = () => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa mục dữ liệu này không?',
            okText: 'Đồng ý',
            cancelText: 'Hủy',
            onOk: async () => {
                if (selectedFile) {
                    await deleteReportCanvas(selectedFile.id);
                    await fetchData();
                    await fetchFavorites();
                    navigate(`/canvas/${companySelect}/${buSelect}/${tabSelect}/dashboard`);
                }
            },
        });
    };


    const handleEditToggle = async () => {
        if (isEditing) {
            setIsSaving(true);
            await handleEdit(selectedFile);
            setOpenPopoverId(null)
            setOpenPopoverTab(null)
        }
        setIsEditing(!isEditing);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleChange = (field, value) => {
        setSelectedFile(prev => ({
            ...prev,
            [field]: field === "list_tag" || field === "user_class"
                ? prev[field]?.includes(value)
                    ? prev[field].filter(id => id !== value)
                    : [...(prev[field] || []), value]
                : value
        }));
    };


    const popoverContent = (
        <div className={css.popoverContainer}>
            <div className={css.editFields}>
                <div className={css.inputGroup}>
                    <label className={css.label}>Tên báo cáo:</label>
                    <Input
                        className={css.inputField}
                        placeholder="Nhập tên báo cáo"
                        value={selectedFile?.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        disabled={!isEditing}
                    />
                </div>

                <div className={css.inputGroup}>
                    <label className={css.label}>Mã báo cáo:</label>
                    <Input
                        className={css.inputField}
                        placeholder="Nhập mã báo cáo"
                        value={selectedFile?.code}
                        onChange={(e) => handleChange("code", e.target.value)}
                        disabled={!isEditing}
                    />
                </div>
            </div>

            <div className={css.checkboxGroup}>
                <label className={css.label}>Chọn loại:</label>
                {listType.map((item) => (
                    <div className={css.checkboxItem}>
                        <Checkbox
                            checked={selectedFile?.type == item.value}
                            onChange={() => handleChange("type", item.value)}
                            disabled={!isEditing}
                        >
                            {item.text}
                        </Checkbox>
                    </div>
                ))}
            </div>

            <div className={css.popoverTags}>
                <label className={css.label}>Danh sách thẻ:</label>
                <div className={css.tagsContainer}>
                    {tags.map(item => (
                        <span
                            key={item.id}
                            onClick={() => isEditing && handleChange("list_tag", item.id)}
                            className={`${css.tagPopUp} ${selectedFile?.list_tag?.includes(item.id) ? css.selectedTag : ''} ${!isEditing ? css.disabled : ''}`}
                        >
                            # {item.name}
                        </span>
                    ))}
                </div>
            </div>

            <div className={css.popoverTags}>
                <label className={css.label}>Danh sách nhóm người dùng:</label>
                <div className={css.tagsContainer}>
                    {listUC_CANVAS.map(item => (
                        <span
                            key={item.id}
                            onClick={() => isEditing && handleChange("user_class", item.id)}
                            className={`${css.tagPopUp} ${selectedFile?.user_class?.includes(item.id) ? css.selectedTag : ''} ${!isEditing ? css.disabled : ''}`}
                        >
                            # {item.name}
                        </span>
                    ))}
                </div>
            </div>


            <div className={css.deleteOption}>
                {isEditing ? (
                    <>
                        <Button type="primary" onClick={handleEditToggle} loading={isSaving}>Lưu</Button>
                        <Button onClick={handleCancel}>Hủy</Button>
                    </>
                ) : (
                    <>
                        {currentUser && currentUser.isAdmin &&
                            <>
                                <Button onClick={handleEditToggle}>Sửa</Button>
                                <Button
                                    onClick={handleDeleteFile}
                                    style={{
                                        color: '#d9534f',
                                        borderColor: '#c9302c'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#c9302c'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
                                    onFocus={(e) => e.currentTarget.style.borderColor = '#c9302c'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = ''}
                                >
                                    Xóa
                                </Button>
                            </>
                        }

                    </>
                )}
            </div>

        </div>
    );


    const handleOpenPopover = (file, event, item) => {
        setOpenPopoverTab(item.key)
        setOpenPopoverId(prevId => prevId === file.id ? null : file.id);
        event.stopPropagation();
        setSelectedFile(file);
        setIsEditing(false)
    };


    const handleCreateFolder = async () => {
        // Check for spaces, slashes, and Vietnamese characters in key
        const hasVietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(newFolderData.key);
        const hasInvalidChars = /[\s/]/.test(newFolderData.key);

        if (hasVietnameseChars || hasInvalidChars) {
            message.error("Key không được chứa khoảng trắng, dấu '/' hoặc ký tự tiếng Việt");
            return;
        }

        if (!newFolderData.label) {
            message.error("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        try {
            // Get max position
            const maxPosition = Math.max(...tabs.map(tab => tab.position || 0), 0);

            await createFileTab({
                ...newFolderData,
                position: maxPosition + 1,
                table: 'report'
            });

            message.success("Tạo thư mục thành công");
            await loadFileTab();
            setIsModalFolderVisible(false);
            setNewFolderData({ label: '' });
        } catch (error) {
            console.error("Error creating folder:", error);
            message.error("Có lỗi xảy ra khi tạo thư mục");
        }
    };


    const handleSelectType = (item) => {
        setSelectedType(prev => (prev === item ? null : item));
    };
    const toggleFilter = () => {
        setHideFilter(prev => !prev);
    };


    const [openCategories, setOpenCategories] = useState({});

    const toggleCategory = (key) => {
        setOpenCategories((prev) => ({
            ...prev,
            [key]: !prev[key] // Đảo trạng thái mở/đóng
        }));
    };

    const swapPosition = async (tab1, tab2) => {
        if (!tab1 || !tab2) return;

        try {
            await updateFileTab({ id: tab1.id, position: tab2.position });
            await updateFileTab({ id: tab2.id, position: tab1.position });
            await loadFileTab();
        } catch (error) {
            console.error("Error swapping position:", error);
            message.error("Có lỗi xảy ra khi đổi vị trí");
        }
    };

    const [editTabId, setEditTabId] = useState(null);
    const [editTabName, setEditTabName] = useState("");


    const updateTabName = async (tabId, newName) => {
        try {
            await updateFileTab({ id: tabId, label: newName });
            await loadFileTab();
            setEditTabId(null);
        } catch (error) {
            console.error("Lỗi khi cập nhật:", error);
            message.error("Có lỗi xảy ra khi cập nhật");
        }
    };


    return (
        <div className={`${css.sidebar} ${isCollapsed ? css.sidebarCollapsed : ""}`}>
            {!isCollapsed ? (
                <>
                    <div className={css.headerSidebar}>
                        <div className={css.headerName}>
                            <span>PHÂN TÍCH QUẢN TRỊ</span>
                        </div>
                        <IconButton onClick={onToggle} size="small">
                            <ChevronLeftIcon />
                        </IconButton>


                    </div>
                    <div className={css.buttonRight}>
                        <Button
                            onClick={toggleFilter}
                            style={{ padding: '5px 8px', height: '28px' }}
                        >
                            <FilterCustom width={12} height={12} />
                            <span className={css.advancedFilter}>Bộ lọc</span>
                        </Button>

                        {currentUser.isAdmin && (
                            <Button
                                onClick={() => setIsModalFolderVisible(true)}
                                style={{ padding: '5px 8px', height: '28px' }}
                            >
                                <FolderCustom width={12} height={12} />
                                <span className={css.advancedFilter}>Folder</span>
                            </Button>
                        )}
                        {currentUser.isAdmin &&
                            <Button
                                onClick={handleOpenModal}
                                style={{ padding: '4px 8px', height: '28px' }}
                            >
                                <span className={css.advancedFilter}>+ Data</span>
                            </Button>
                        }
                        <div className={css.searchContainer}>
                            <div className={css.buttonSearch}>
                                <img src={SearchIcon} alt="" width={16} height={16} />
                                <input
                                    type="text"
                                    className={css.quickFilterInput}
                                    value={searchText}
                                    // placeholder="Tìm kiếm"
                                    onChange={handleSearchChange}
                                />
                            </div>
                        </div>
                    </div>

                </>
            ) : (
                <>
                    <div className={css.button}>
                        <IconButton onClick={onToggle} size="small" className={css.iconButton}>
                            <ChevronRightIcon className={css.defaultIcon} />
                            <img src={IconCollapGreen} alt="collapsed icon" className={css.hoverIcon} />
                        </IconButton>

                    </div>
                </>
            )}
            {!isCollapsed && (
                <>
                    {
                        hideFilter &&
                        <>

                            <div className={css.listType}>
                                {listType.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`${css.type} ${selectedType == item.value ? css.activeType : ""}`}
                                        onClick={() => handleSelectType(item.value)}
                                    >
                                        <span className={css.colorBox} style={{ backgroundColor: item.color }}></span>
                                        {item.text}
                                    </div>
                                ))}
                                <div className={css.setting}>
                                    {currentUser.isAdmin && (
                                        <Settings className={css.settingIcon} size={18}
                                            onClick={() => setIsDialogOpen(true)} />
                                    )}
                                </div>
                                <DialogSettingTag visible={isDialogOpen} onClose={() => setIsDialogOpen(false)}
                                    setTags={setTags} />
                            </div>


                            <div className={css.listTag}>
                                <div className={css.tagContainer}>
                                    {tags.map((tag) => (
                                        <span
                                            key={tag.id}
                                            className={`${css.tag} ${selectedTags.includes(tag) ? css.activeTag : ""}`}
                                            onClick={() => toggleTag(tag)}
                                        >
                                            #{tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </>
                    }


                    <div className={css.tabs} style={{ height: hideFilter ? '69%' : '83%' }}>
                        {filteredList.map((item) => {
                            return (
                                item?.children[0].key !== "empty" && (
                                    <div key={item.key} className={css.category}>
                                        <div
                                            className={css.categoryTitle}
                                            style={{
                                                cursor: "pointer",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center"
                                            }}
                                        >
                                            {item.label}
                                            <img onClick={() => toggleCategory(item.id)}
                                                src={openCategories[item.id] ? IconOpenFolder : IconCloseFolder}
                                                alt="" />
                                        </div>

                                        {openCategories[item.id] && (
                                            item.children
                                                .filter(subItem =>
                                                    (selectedTags.length === 0 || selectedTags.some(tag => subItem.value.list_tag?.includes(tag.id))) &&
                                                    (selectedType === null || subItem.value.type === selectedType)
                                                )
                                                .map((subItem) => {
                                                    const type = subItem.value.type ?? "Không xác định";
                                                    const color = getTypeColor(type);
                                                    const checkSelected =
                                                        item.key == (selectedTapCanvas || localStorage.getItem("tabSelectCanvas")) &&
                                                        subItem.key == (selectedKey || siderId);

                                                    return subItem.key !== "empty" ? (
                                                        <div key={subItem.key}
                                                            className={`${css.card} ${checkSelected ? css.activeCard : ""}`}
                                                            style={{ borderLeft: `5px solid ${color}` }}
                                                            onMouseEnter={() => setHoveredId(subItem.value.id)}
                                                            onMouseLeave={() => setHoveredId(null)}
                                                            onClick={() => handleCardClick(item.key, subItem.key)}
                                                        >
                                                            <div className={css.cardContent}>
                                                                <div className={css.cardTitle}
                                                                    style={{ fontWeight: "bold" }}>
                                                                    {subItem.label}
                                                                </div>
                                                                <div className={css.cardInfo}>
                                                                    <div className={css.cardInfoLeft}>
                                                                        <span>{subItem.value.code || ""}</span>
                                                                        <span>
                                                                            {subItem.value.list_tag?.length
                                                                                ? subItem.value.list_tag.reduce((acc, id) => {
                                                                                    const tag = tags.find(tag => tag.id === id)?.name;
                                                                                    return tag ? [...acc, `#${tag}`] : acc;
                                                                                }, []).join(", ")
                                                                                : ""}
                                                                        </span>
                                                                    </div>
                                                                    <div className={css.cardInfoRight}>
                                                                        <span>{formatDateISO(subItem.value.updated_at || subItem.value.created_at)}</span>
                                                                        {currentUser.isAdmin && (
                                                                            <Popover
                                                                                content={popoverContent}
                                                                                trigger="click"
                                                                                placement="right"
                                                                                open={openPopoverId == subItem.value.id && openPopoverTab == item.key}
                                                                                onOpenChange={setOpenPopoverId}
                                                                            >
                                                                                <FaEllipsisV
                                                                                    className={css.optionsIcon}
                                                                                    style={{
                                                                                        width: "12px",
                                                                                        height: "12px",
                                                                                        cursor: "pointer",
                                                                                    }}
                                                                                    onClick={(e) => handleOpenPopover(subItem.value, e, item)}
                                                                                />
                                                                            </Popover>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div key={subItem.key} className={css.emptyMessage}>
                                                            Không có dữ liệu
                                                        </div>
                                                    );
                                                })
                                        )}
                                    </div>
                                )
                            );
                        })}
                    </div>
                </>
            )}

            <Modal
                title="Tạo Mới"
                open={isModalVisible}
                onOk={handleCreate}
                onCancel={handleCloseModal}
                okText="Tạo"
                cancelText="Hủy"
                okButtonProps={{ disabled: !(selectedTable && newCardName && selectedTemplate) }}
            >
                <div className={css.modalContent}>
                    <Select
                        showSearch
                        placeholder="Chọn loại dữ liệu"
                        value={selectedTable}
                        onChange={(value) => {
                            setSelectedTable(value);
                            if (value === 'Data') {
                                setNewCardName('Data ' + Date.now());
                            }
                        }}
                        style={{ width: "100%", marginBottom: 10 }}
                        filterOption={(input, option) =>
                            option.children
                                ?.toString()
                                ?.toLowerCase()
                                ?.includes(input.toLowerCase())
                        }
                    >
                        {listType.map((table) => (
                            <Select.Option key={table.value} value={table.value}>
                                {table.text}
                            </Select.Option>
                        ))}
                    </Select>


                    {selectedTable !== "Data" && (
                        <Input
                            placeholder="Nhập tên"
                            value={newCardName}
                            onChange={(e) => setNewCardName(e.target.value)}
                            style={{ marginBottom: 10 }}
                        />
                    )}
                    <Select
                        showSearch
                        placeholder="Chọn mục muốn thêm"
                        value={selectedTemplate}
                        onChange={(value) => setSelectedTemplate(value)}
                        style={{ width: "100%" }}
                        filterOption={(input, option) =>
                            option.children
                                ?.toString()
                                ?.toLowerCase()
                                ?.includes(input.toLowerCase())
                        }
                    >
                        {tempParentLabels
                            .filter((template) => template.key !== "tapFavorite")
                            .map((template) => (
                                <Select.Option key={template.key} value={template.key}>
                                    {template.label}
                                </Select.Option>
                            ))}
                    </Select>

                </div>
            </Modal>


            <Modal
                title="Quản lý thư mục"
                visible={isModalFolderVisible}
                onOk={handleCreateFolder}
                onCancel={() => {
                    setIsModalFolderVisible(false);
                    setNewFolderData({ label: '' });
                }}
                okText="Tạo"
                cancelText="Hủy"
                bodyStyle={{
                    height: '60vh',
                }}
                okButtonProps={{ disabled: !(newFolderData.label) }}
            >
                <div className={css.modalContent}>
                    <div className={css.labelCreate}>
                        <Input
                            placeholder="Nhập label"
                            value={newFolderData.label}
                            onChange={(e) => setNewFolderData(prev => ({ ...prev, label: e.target.value }))}
                            style={{ marginBottom: 10 }}
                        />

                    </div>
                    <h4>Danh sách thư mục hiện tại:</h4>
                    <div className={css.listTab}>
                        <div className={css.listTabContainer}>
                            {
                                tabs.filter((template) => template.key !== "tapFavorite")
                                    .sort((a, b) => (a.position || 0) - (b.position || 0))
                                    .map((tab, index, array) => (
                                        <div
                                            key={tab.key}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '12px 12px',
                                                backgroundColor: '#f9f9f9',
                                                borderRadius: '8px',
                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                                marginBottom: 17,
                                                gap: 5
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                {editTabId === tab.id ? (
                                                    <Input
                                                        value={editTabName}
                                                        onChange={(e) => setEditTabName(e.target.value)}
                                                        onPressEnter={async () => {
                                                            await updateTabName(tab.id, editTabName);
                                                        }}
                                                        onBlur={async () => await updateTabName(tab.id, editTabName)}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span style={{ fontWeight: 500 }}>{tab.label}</span>
                                                )}

                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', }}>
                                                <Tooltip title="Lên">
                                                    <ArrowUpOutlined
                                                        onClick={() => swapPosition(tab, array[index - 1])}
                                                        style={{
                                                            color: index === 0 ? '#ccc' : '#1890ff',
                                                            cursor: index === 0 ? 'not-allowed' : 'pointer'
                                                        }}
                                                    />
                                                </Tooltip>

                                                <Tooltip title="Xuống">
                                                    <ArrowDownOutlined
                                                        onClick={() => swapPosition(tab, array[index + 1])}
                                                        style={{
                                                            color: index === array.length - 1 ? '#ccc' : '#1890ff',
                                                            cursor: index === array.length - 1 ? 'not-allowed' : 'pointer'
                                                        }}
                                                    />
                                                </Tooltip>

                                                <Tooltip title="Sửa">
                                                    <EditOutlined
                                                        onClick={() => {
                                                            setEditTabId(tab.id);
                                                            setEditTabName(tab.label);
                                                        }}
                                                        style={{ color: '#52c41a', cursor: 'pointer' }}
                                                    />
                                                </Tooltip>

                                                <Tooltip title="Xóa">
                                                    <DeleteOutlined
                                                        onClick={async () => {
                                                            try {
                                                                await deleteFileTab(tab.id);
                                                                message.success("Xóa thành công");
                                                                await loadFileTab();
                                                            } catch (error) {
                                                                console.error("Error deleting tab:", error);
                                                                message.error("Có lỗi xảy ra khi xóa");
                                                            }
                                                        }}
                                                        style={{ color: '#f5222d', cursor: 'pointer' }}
                                                    />
                                                </Tooltip>
                                            </div>
                                        </div>
                                    ))
                            }
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
        ;
}
