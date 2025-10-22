import css from "../Sidebar/SidebarNew.module.css";
import { Button, message, Modal, Popover, Select } from "antd";
import {
    API,
    ChartTemplateIcon,
    FilterCustom,
    FolderCustom,
    KPI,
    Note,
    Template,
    UserUpload
} from "../../../../icon/svg/IconSvg.jsx";
import {
    ChuoiNghiepVu,
    IconCloseFolder,
    IconCongMoi,
    IconOpenFolder,
    OffFavoriteIcon,
    OnFavoriteIcon,
    SearchIcon
} from "../../../../icon/IconSVG.js";
import { Settings } from "lucide-react";
import DialogSettingTag from "../Dialog/DialogSettingTag.jsx";
import { createTimestamp, formatDateISO } from "../../../../generalFunction/format.js";
import React, { useContext, useEffect, useState } from "react";
import { MyContext } from "../../../../MyContext.jsx";
import AddDataHub from "../Sidebar/Action/AddDataHub.jsx";
import AddFolder from "../Sidebar/Action/AddFolder.jsx";
import EditFileNote from "../Sidebar/Action/EditFileNote.jsx";
import { useNavigate, useParams } from "react-router-dom";
import { deleteFileNotePad, getAllFileNotePad, updateFileNotePad } from "../../../../apis/fileNotePadService.jsx";
import { getCurrentUserLogin, updateUser } from "../../../../apis/userService.jsx";
import { getAllKpi2Calculator } from "../../../../apis/kpi2CalculatorService.jsx";
import { getAllChartTemplate } from "../../../../apis/chartTemplateService.jsx";
import { createFileTab, getAllFileTab, updateFileTab } from "../../../../apis/fileTabService.jsx";
import { findRecordsByConditions } from "../../../../apis/searchModelService.jsx";
import { IconButton } from "@mui/material";
import { getAllTag } from "../../../../apis/tagService.jsx";
import { CANVAS_DATA_PACK } from "../../../../CONST.js";

export default function ListFileNote({
    setSelectedKey,
    selectedKey,
    selectedTap,
    setSelectedTap,
    setSelectedType,
    selectedType
}) {
    const [listChain, setListChain] = useState([]);
    const navigate = useNavigate();
    const { companySelect, buSelect, tabSelect, id } = useParams();
    const [searchText, setSearchText] = useState("");
    const {
        selectedTapCanvas,
        setSelectedTapCanvas,
        loadData,
        userClasses,
        fetchUserClasses,
        uCSelected_CANVAS,
        currentUser,
        setCurrentUser,
        listUC_CANVAS
    } = useContext(MyContext);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newCardName, setNewCardName] = useState("");
    const [newCardCode, setNewCardCode] = useState("");
    const [selectedTable, setSelectedTable] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedDataType, setSelectedDataType] = useState(null);
    const [openKeys, setOpenKeys] = useState([]);
    const [openLink, setOpenLink] = useState(false);
    const [hoveredId, setHoveredId] = useState(null);
    const [favoriteIds, setFavoriteIds] = useState([]);
    const [listFavorite, setListFavorite] = useState([]);
    const [typeData, setTypeData] = useState(null);
    const [selectedData, setSelectedData] = useState(false);
    const [nameMoi, setNameMoi] = useState(false);
    const [newFolderData, setNewFolderData] = useState({ label: '', });
    const [isModalFolderVisible, setIsModalFolderVisible] = useState(false);
    const [tabs, setTabs] = useState([]);
    const [kpiList, setKpiList] = useState([]);
    const [ctList, setCtList] = useState([]);
    const [hideFilter, setHideFilter] = useState(false);
    const [isShowModalChangeName, setIsShowModalChangeName] = useState(false);
    const [name, setName] = useState('');
    const [openPopoverId, setOpenPopoverId] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [tags, setTags] = useState([])
    const [openCategories, setOpenCategories] = useState({});
    const [editTabId, setEditTabId] = useState(null);
    const [editTabName, setEditTabName] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

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
                table: 'dass'
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

    const handleChangeName = async () => {
        updateFileNotePad({ ...selectedFile, name }).then(data => {
            message.success("Đổi tên thành công");
            setIsShowModalChangeName(false);
            fetchData();
        })
    }

    const toggleCategory = (key) => {
        setOpenCategories((prev) => ({
            ...prev,
            [key]: !prev[key] // Đảo trạng thái mở/đóng
        }));
    };


    const toggleFilter = () => {
        setHideFilter(prev => !prev);
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

    const toggleTag = (tag) => {
        setSelectedTags((prevTags) =>
            prevTags.includes(tag) ? prevTags.filter(t => t !== tag) : [...prevTags, tag]
        );
    };

    const fetchTag = async () => {
        const data = await getAllTag();
        const filteredData = data.filter(tag => tag.table == 'dass');
        setTags(filteredData)
    }

    useEffect(() => {
        fetchTag()
    }, []);

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
            const [data, user, , kpis, cts] = await Promise.all([
                getAllFileNotePad(),
                getCurrentUserLogin(),
                getAllKpi2Calculator(),
                getAllChartTemplate()
            ])

            setKpiList(kpis)
            setCtList(cts)
            if (!(userClasses?.length > 0)) {
                fetchUserClasses();
            }

            let userAccess = [];

            if (user.data?.isAdmin) {
                userAccess = data; // Admin có quyền truy cập tất cả
            } else {
                let reportChartTypes = [];
                for (const e of userClasses) {
                    if (e?.module === "CANVAS" && e.id == uCSelected_CANVAS) {
                        reportChartTypes = reportChartTypes.concat(e?.reportChart || []);
                    }
                }
                userAccess = data.filter((item) =>
                    reportChartTypes.includes(item?.type) || listUC_CANVAS.every(uc => item.userClass?.includes(uc.id)) || item?.table === 'NotePad' || item?.table === 'KPI'
                );
            }
            setListChain(userAccess);
        } catch (error) {
            console.error("Error fetching card data:", error);
        }
    };

    const loadFileTab = async () => {
        const fileTabs = await getAllFileTab();
        const filteredTabs = fileTabs.filter(tab => tab.table === "dass");
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
            let existingFavorites = currentUser?.info?.bookmark_dass || [];

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
                    bookmark_dass: existingFavorites
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
        const dataFavorite = await findRecordsByConditions("FileNotePad", {
            id: favorites,
        });
        const sortedDataFavorite = dataFavorite.sort((a, b) => {
            return favorites.indexOf(a.id) - favorites.indexOf(b.id);
        });
        setListFavorite(sortedDataFavorite);
    };

    const fetchFavorites = async () => {
        try {
            const favorites = currentUser?.info?.bookmark_dass || [];
            await finDataByFavorites(favorites);
            setFavoriteIds(favorites);
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu bookmark:", error);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, [currentUser]);

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
            <div style={{ display: "flex", alignItems: "center", width: "102%", height: '30px', gap: '3px' }}>
                <span
                    title={chain.name}
                    style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        width: '95%',
                    }}
                >
                    {chain.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', width: '5%', justifyContent: "end" }}>
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleFavoriteClick(chain.id);
                                }}
                            />
                        </IconButton>
                    )}
                </div>
            </div>
        );
    };


    const filteredList = tabs.filter(e => !e.hide).map((tab) => {
        const getFilteredChildren = () => {
            const sourceList = tab.key === "tapFavorite" ? listFavorite : listChain;

            return sourceList
                .filter((chain) =>
                    (tab.key === "tapFavorite" || chain.tab === tab.key) &&
                    filterChainBySearchText(chain, searchText)
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
    const handleCloseModalUpdate = () => {
        setOpenLink(false)
    };

    const handleUpdateData = async () => {
        if ((!typeData || !selectedData) && selectedFile?.table !== "KPI" && selectedFile?.table !== "ChartTemplate") {
            message.error("Vui lòng chọn đầy đủ thông tin");
            return;
        }
        await updateFileNotePad({
            ...selectedFile,
            // name: nameMoi,
            code: typeData ? `${typeData}_${selectedFile.id}` : `KPI_${selectedFile.id}`,
            type: selectedData,
            updated_at: createTimestamp(),
        });

        await fetchData();
        const newPath = `/canvas/${companySelect}/${buSelect}/${tabSelect}/daas`;
        navigate(newPath);
        handleCloseModalUpdate()
    };

    function getUpdateStatusColor(isoString) {
        const updatedDate = new Date(isoString);
        const now = new Date();
        const diffInMs = now - updatedDate;
        const diffInHours = diffInMs / (1000 * 60 * 60);
        const diffInDays = diffInHours / 24;

        if (diffInHours <= 24) {
            return { status: "Cập nhật 24 giờ qua", color: "#FF7B69" };
        } else if (diffInDays <= 7) {
            return { status: "Cập nhật 7 ngày qua", color: "#4CAF50" };
        } else if (diffInDays <= 30) {
            return { status: "Cập nhật 30 ngày qua", color: "#438BFF" };
        } else {
            return { status: "Không có cập nhật trong 30 ngày qua", color: "#8090AA" };
        }
    }

    const handleCardClick = (type, parentKey, subItemKey) => {
        localStorage.setItem("tabSelectCanvas", parentKey);
        localStorage.setItem("typeSelectCanvas", type);
        setSelectedType(type)
        setSelectedTap(parentKey);
        setSelectedKey(subItemKey);
        const newPath = `/canvas/${companySelect}/${buSelect}/${tabSelect}/daas/${subItemKey}`;
        navigate(newPath);
    };


    const handleEdit = async (data) => {
        const updatedFile = {
            ...selectedFile,
            tag_id: data.id
        };
        await updateFileNotePad(updatedFile);
        setSelectedFile(updatedFile);
        await fetchFavorites();
        await fetchData()
    };


    const handleDeleteFile = () => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa mục dữ liệu này không?',
            okText: 'Đồng ý',
            cancelText: 'Hủy',
            onOk: async () => {
                if (selectedFile) {
                    await deleteFileNotePad(selectedFile.id);
                    await fetchData();
                    await fetchFavorites();
                    navigate(`/canvas/${companySelect}/${buSelect}/${tabSelect}/daas`);
                }
            },
        });
    };

    const handleChangeNameFile = () => {
        setIsShowModalChangeName(true)
    };

    const handleOpenLink = () => {
        setOpenLink(false)
        setTypeData(null)
        setSelectedData(null)
        setNameMoi(null)
    }


    const popoverContent = (
        <div className={css.popoverContainer}>
            <div className={css.popoverTags}>
                {
                    tags.map(item => (
                        <span onClick={() => handleEdit(item)}
                            className={`${css.tagPopUp} ${selectedFile?.tag_id == item.id ? css.selectedTag : ''}`}
                        ># {item.name}
                        </span>
                    ))
                }

            </div>
            {(selectedFile?.table == "Data" || selectedFile?.table == "KPI" || selectedFile?.table == "ChartTemplate") &&
                <div className={css.deleteOption}>
                    <Button onClick={() => setOpenLink(true)}>
                        Kết nối
                    </Button>
                </div>
            }

            <div className={css.deleteOption} onClick={handleChangeNameFile}>
                Đổi tên dữ liệu
            </div>
            <div className={css.deleteOption} onClick={handleDeleteFile}>
                Xóa mục dữ liệu
            </div>
            <Modal
                title="Kết nối dữ liệu"
                open={openLink}
                onOk={handleUpdateData}
                onCancel={() => handleOpenLink()}
                okText="Tạo"
                cancelText="Hủy"
            >
                {selectedFile?.table == "KPI" &&
                    <Select
                        placeholder="Chọn KPI"
                        allowClear
                        showSearch
                        value={selectedData?.type}
                        onChange={(value) => {
                            setSelectedData(value);
                        }}
                        style={{ width: "100%", marginBottom: 10 }}
                    >
                        {kpiList.map((kpi) => (
                            <Select.Option key={kpi.id} value={kpi.id}>
                                {kpi.name}
                            </Select.Option>
                        ))}
                    </Select>
                }
                {selectedFile?.table == "ChartTemplate" &&
                    <Select
                        placeholder="Chọn Chart Template"
                        allowClear
                        showSearch
                        value={selectedData?.type}
                        onChange={(value) => {
                            setSelectedData(value);
                        }}
                        style={{ width: "100%", marginBottom: 10 }}
                    >
                        {ctList?.map((kpi) => (
                            <Select.Option key={kpi.id} value={kpi.id}>
                                {kpi.name}
                            </Select.Option>
                        ))}
                    </Select>
                }

                {selectedFile?.table == "Data" && <div>

                    <Select
                        placeholder="Chọn loại dữ liệu"
                        allowClear
                        showSearch
                        value={typeData}
                        onChange={(value) => setTypeData(value)}
                        style={{ width: "100%", marginBottom: 10 }}
                    >
                        <Select.Option key={'TABLE'} value={'B'}>Báo cáo</Select.Option>
                        <Select.Option key={'CHART'} value={'C'}>Biểu đồ</Select.Option>
                        <Select.Option key={'DM'} value={'DM'}>Danh mục</Select.Option>
                    </Select>
                    {typeData &&
                        <Select
                            placeholder="Chọn nguồn dữ liệu"
                            allowClear
                            showSearch
                            value={selectedData}
                            onChange={(value) => {
                                setSelectedData(value);
                                setNameMoi(
                                    CANVAS_DATA_PACK.find((e) => e.value == value).name
                                );
                            }}
                            style={{ width: "100%", marginBottom: 10 }}
                        >
                            {CANVAS_DATA_PACK.filter(e => typeData && typeData === 'C' ? e.isChart :
                                typeData && typeData === 'DM' ? e.isDM :
                                    typeData && typeData === 'B' ? !e.isDM && !e.isChart : null
                            ).map((type) => (
                                <Select.Option key={type.id} value={type.value}>
                                    {type.name}
                                </Select.Option>
                            ))}
                        </Select>
                    }


                </div>}
            </Modal>
        </div>
    );

    const handleOpenPopover = (file, event) => {
        setSelectedFile(file);
        setName(file.name)
        setOpenPopoverId(file.id);
    };

    const renderIcon = (value) => {
        switch (value) {
            case 'Data':
                return <API height={20} width={19} />;
            case 'Template':
                return <Template height={20} width={15}></Template>;
            case 'FileUpLoad':
                return <UserUpload height={20} width={20} />;
            case 'KPI':
                return <KPI height={20} width={18} />;
            case 'NotePad':
                return <Note height={20} width={17} />;
            case 'Tiptap':
                return <Note height={20} width={17} />;
            case 'ChartTemplate':
                return <ChartTemplateIcon height={20} width={17} />;
            default:
                return null; // Không hiển thị gì nếu không khớp giá trịF
        }
    };


    const renderText = (value) => {
        switch (value) {
            case 'Data':
                return <span className={css.baoCaoText}>Dữ liệu (API)</span>;
            case 'Template':
                return <span className={css.templateText}>Bảng dữ liệu</span>;
            case 'FileUpLoad':
                return <span className={css.fileText}>Kho File</span>;
            case 'KPI':
                return <span className={css.kpiText}>KPI / Đo lường</span>;
            case 'NotePad':
                return <span className={css.noteText}>Văn Bản</span>;
            case 'Tiptap':
                return <span className={css.noteText}>Văn Bản</span>;
            case 'ChartTemplate':
                return <span className={css.chartTemplateText}>Biểu đồ từ bảng</span>;
            default:
                return null; // Không hiển thị gì nếu không khớp giá trị
        }
    };

    return (
        <div>
            <div className={css.buttonRight}>
                <Button
                    onClick={toggleFilter}
                    style={{ padding: '5px 8px', height: '28px' }}
                >
                    <FilterCustom width={12} height={12} />
                    <span className={css.advancedFilter}>Bộ lọc</span>
                </Button>

                {currentUser?.isAdmin && (
                    <Button
                        onClick={() => setIsModalFolderVisible(true)}
                        style={{ padding: '5px 8px', height: '28px' }}
                    >
                        <FolderCustom width={12} height={12} />
                        <span className={css.advancedFilter}>Folder</span>
                    </Button>
                )}

                <Button
                    onClick={handleOpenModal}
                    style={{ padding: '4px 8px', fontSize: '12px', height: '28px' }}
                >
                    <span className={css.advancedFilter}>+ Data</span>
                </Button>

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
            {
                hideFilter &&
                <div className={css.filter}>
                    <div className={css.listTag}>
                        <div className={css.tagContainer}>
                            {tags.map((tag) => (
                                <span key={tag.id}
                                    className={`${css.tag} ${selectedTags.includes(tag) ? css.activeTag : ""}`}
                                    onClick={() => toggleTag(tag)}
                                >#{tag.name}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className={css.setting}>
                        {currentUser.isAdmin && (
                            <Settings className={css.settingIcon} size={18}
                                onClick={() => setIsDialogOpen(true)} />
                        )}
                    </div>
                    <DialogSettingTag visible={isDialogOpen}
                        onClose={() => setIsDialogOpen(false)}
                        setTags={setTags} />
                </div>

            }
            {filteredList.map((item) => {
                return (
                    item?.children[0].key != "empty" &&
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
                        {
                            openCategories[item.id] && (
                                item.children.filter(subItem =>
                                    selectedTags.length === 0 || selectedTags.some(tag => tag.id == subItem.value?.tag_id)
                                ).map((subItem) => {
                                    const updatedAt = subItem.value.updated_at || subItem.value.created_at;
                                    const color = subItem.value.table == "Data" ? {
                                        status: "Cập nhật 24 giờ qua",
                                        color: "#6A8BD2"
                                    } : getUpdateStatusColor(updatedAt);
                                    const checkSelected = ("FileNote" == (selectedType || localStorage.getItem("typeSelectCanvas")) && item.key == (selectedTap || localStorage.getItem("tabSelectCanvas")) && subItem.key == (selectedKey || id));
                                    return subItem.key !== "empty" ? (
                                        <div key={subItem.key}
                                            className={`${css.card} ${(checkSelected)
                                                ? css.activeCard
                                                : ""
                                                }`}
                                            onMouseEnter={() => setHoveredId(subItem.value.id)}
                                            onMouseLeave={() => setHoveredId(null)}
                                            onClick={() => handleCardClick("FileNote", item.key, subItem.key)}

                                        >
                                            <div className={css.notification}>
                                                <div className={css.statusIcon}
                                                // style={{ backgroundColor: color.color }}
                                                //  title={color.status}
                                                >
                                                    {renderIcon(subItem.value.table)}
                                                </div>
                                            </div>
                                            <div className={css.cardContent}>
                                                <div className={css.cardTitle}
                                                // style={{fontWeight: checkSelected ? "bold" : "normal"}}
                                                >{subItem.label}</div>
                                                <div className={css.cardInfo}>
                                                    <div className={css.cardInfoLeft}>
                                                        {renderText(subItem.value.table)}
                                                        <span>{tags.find(tag => tag.id == subItem.value.tag_id)?.name ? `#${tags.find(tag => tag.id == subItem.value.tag_id)?.name}` : ''}</span>
                                                    </div>
                                                    <div className={css.cardInfoRight}>
                                                        <span>{subItem.value.table == "Data" ? 'sync' : formatDateISO(subItem.value.updated_at || subItem.value.created_at)}</span>
                                                        <Popover
                                                            content={popoverContent}
                                                            trigger="click"
                                                            placement="right"
                                                            open={openPopoverId === subItem.value.id}
                                                            onOpenChange={(visible) => setOpenPopoverId(visible ? subItem.value.id : null)}
                                                        >
                                                            <img src={IconCongMoi} alt=""
                                                                onClick={() => handleOpenPopover(subItem.value)}
                                                                style={{
                                                                    width: '12px',
                                                                    height: '12px',
                                                                    cursor: 'pointer'
                                                                }}
                                                            />
                                                        </Popover>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={subItem.key} className={css.emptyMessage}>
                                            Không có dữ liệu
                                        </div>
                                    )
                                })
                            )}
                    </div>
                )
            })}
            {isModalVisible && <AddDataHub isModalVisible={isModalVisible}
                handleCloseModal={handleCloseModal}
                tabs={tabs}
                listUC_CANVAS={listUC_CANVAS}
                uCSelected_CANVAS={uCSelected_CANVAS}
                fetchData={fetchData}
                kpiList={kpiList}
                ctList={ctList}
                listFileNote={listChain}

            />}
            {isModalFolderVisible && <AddFolder isModalFolderVisible={isModalFolderVisible}
                setIsModalFolderVisible={setIsModalFolderVisible}
                handleCreateFolder={handleCreateFolder}
                setNewFolderData={setNewFolderData}
                newFolderData={newFolderData}
                tabs={tabs}
                editTabName={editTabName}
                editTabId={editTabId}
                setEditTabName={setEditTabName}
                updateTabName={updateTabName}
                swapPosition={swapPosition}
                setEditTabId={setEditTabId}
                loadFileTab={loadFileTab}
            />}

            {isShowModalChangeName && <EditFileNote isShowModalChangeName={isShowModalChangeName}
                handleChangeName={handleChangeName}
                setIsShowModalChangeName={setIsShowModalChangeName}
                setName={setName}
                name={name}
            />}
        </div>

    )
}
