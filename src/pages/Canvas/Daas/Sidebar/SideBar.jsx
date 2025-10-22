import React, { useContext, useEffect, useState } from "react";
import { Input, Menu, message, Modal, Select } from "antd";
import css from "./Sidebar.module.css";
import { IconButton } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useNavigate, useParams } from "react-router-dom";
import { MyContext } from "../../../../MyContext.jsx";
import {
  ChuoiNghiepVu,
  OffFavoriteIcon,
  OnFavoriteIcon,
  SearchIcon,
} from "../../../../icon/IconSVG.js";
// API
import {
  createNewFileNotePad,
  deleteFileNotePad,
  getAllFileNotePad,
  updateFileNotePad,
} from "../../../../apis/fileNotePadService.jsx";
import { getAllFileTab, updateFileTab, createFileTab, deleteFileTab } from "../../../../apis/fileTabService.jsx";
// CONSTANT
import { CANVAS_DATA_PACK } from "../../../../CONST.js";
import {
  getItemFromIndexedDB,
  setItemInIndexedDB,
} from "../../../../storage/storageService.js";
import { findRecordsByConditions } from "../../../../apis/searchModelService.jsx";
import { getAllSettingGroup } from "../../../../apisKTQT/settingGroupService.jsx";
import { getCurrentUserLogin } from "../../../../apis/userService.jsx";
import { KHONG_THE_TRUY_CAP } from "../../../../Consts/TITLE_HEADER.js";

const { confirm } = Modal;

export default function SideBar({
  isCollapsed,
  onToggle,
  togglePinSidebar,
  isPinSideBar,
}) {
  const [listChain, setListChain] = useState([]);
  const navigate = useNavigate();
  const { companySelect, buSelect, tabSelect } = useParams();
  const [searchText, setSearchText] = useState("");
  const {
    selectedTapCanvas,
    setSelectedTapCanvas,
    loadData,
    userClasses,
    fetchUserClasses,
    uCSelected_CANVAS,
  } = useContext(MyContext);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newCardCode, setNewCardCode] = useState("");
  const [newCardName, setNewCardName] = useState("");
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedDataType, setSelectedDataType] = useState(null);
  const [openKeys, setOpenKeys] = useState([]);
  const [tabs, setTabs] = useState([
    {
      key: "tapFavorite",
      label: "Danh sách yêu thích",
      alt: "Favorite",
    },
  ]);
  const [isModalFolderVisible, setIsModalFolderVisible] = useState(false);
  const [newFolderData, setNewFolderData] = useState({
    key: '',
    label: '',
    alt: ''
  });

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
      let data = await getAllFileNotePad();
      const user = await getCurrentUserLogin();
      const setting = await getAllSettingGroup();

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
          reportChartTypes.includes(item?.type)
        );
      }

      setListChain(userAccess);
    } catch (error) {
      console.error("Error fetching card data:", error);
    }
  };

  const loadFileTab = async () => {
    const fileTabs = await getAllFileTab();
    fileTabs.sort((a, b) => a.position - b.position);
    setTabs([
      {
        key: "tapFavorite",
        label: "Danh sách yêu thích",
        alt: "Favorite",
      },
      ...fileTabs
    ]);
  };

  const handleDelete = async (e, id, itemName) => {
    e.stopPropagation();

    confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa "${itemName}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      centered: true,
      async onOk() {
        try {
          await deleteFileNotePad(id);
          message.success("Xóa thành công");
          fetchData();
        } catch (error) {
          console.error("Error deleting file:", error);
          message.error("Có lỗi xảy ra khi xóa");
        }
      },
    });
  };

  const tables = [
    { value: "FileUpLoad", label: "File Upload" },
    { value: "NotePad", label: "Document" },
    { value: "Data", label: "Dữ liệu" },
  ];

  const handleMenuClick = (e) => {
    const path = e.keyPath[1];
    setSelectedTapCanvas(path);
    setSelectedKey(e.key);
    const newPath = `/canvas/${companySelect}/${buSelect}/${tabSelect}/daas/${e.key}`;
    navigate(newPath);
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

  const [hoveredId, setHoveredId] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [listFavorite, setListFavorite] = useState([]);

  const handleFavoriteClick = async (id) => {
    try {
      let existingFavorites =
        (await getItemFromIndexedDB("FavoriteDaas")) || [];
      if (existingFavorites.includes(id)) {
        existingFavorites = existingFavorites.filter((favId) => favId !== id);
        const updatedFavorites = listFavorite.filter((fav) => fav.id !== id);
        setListFavorite(updatedFavorites);
      } else {
        existingFavorites.push(id);
        await finDataByFavorites(existingFavorites);
      }
      await setItemInIndexedDB("FavoriteDaas", existingFavorites);
      setFavoriteIds(existingFavorites);
    } catch (error) {
      console.error("Lỗi khi cập nhật IndexedDB:", error);
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

  useEffect(() => {
    const fetchFavorites = async () => {
      const favorites = (await getItemFromIndexedDB("FavoriteDaas")) || [];
      await finDataByFavorites(favorites);
      setFavoriteIds(favorites);
    };
    fetchFavorites();
  }, []);

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

  const handleMoveTab = async (tabKey, direction) => {
    const currentTabs = [...tabs];
    const tabIndex = currentTabs.findIndex(tab => tab.key === tabKey);
    if (tabIndex === -1) return;

    // Skip first tab (Favorite) for reordering
    if (tabIndex === 0) return;

    // Prevent moving beyond bounds
    if (direction === 'up' && tabIndex <= 1) return;
    if (direction === 'down' && tabIndex >= currentTabs.length - 1) return;

    const newIndex = direction === 'up' ? tabIndex - 1 : tabIndex + 1;

    // Swap positions
    const temp = currentTabs[tabIndex].position;
    currentTabs[tabIndex].position = currentTabs[newIndex].position;
    currentTabs[newIndex].position = temp;

    // Swap elements
    [currentTabs[tabIndex], currentTabs[newIndex]] = [currentTabs[newIndex], currentTabs[tabIndex]];

    // Update state
    setTabs(currentTabs);

    // Update positions in database
    try {
      await Promise.all([
        updateFileTab({ id: currentTabs[tabIndex].id, position: currentTabs[tabIndex].position }),
        updateFileTab({ id: currentTabs[newIndex].id, position: currentTabs[newIndex].position })
      ]);
    } catch (error) {
      console.error('Error updating tab positions:', error);
      message.error('Có lỗi khi cập nhật vị trí');
      // Revert changes on error
      loadFileTab();
    }
  };

  const handleMoveItem = async (itemId, tabKey, direction) => {
    const itemsInTab = listChain
      .filter(item => item.tab === tabKey)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    const itemIndex = itemsInTab.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    // Prevent moving beyond bounds
    if (direction === 'up' && itemIndex === 0) return;
    if (direction === 'down' && itemIndex === itemsInTab.length - 1) return;

    const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    const currentItem = itemsInTab[itemIndex];
    const swapItem = itemsInTab[newIndex];

    try {
      // Update both items in the database
      await Promise.all([
        updateFileNotePad({
          ...currentItem,
          position: swapItem.position
        }),
        updateFileNotePad({
          ...swapItem,
          position: currentItem.position
        })
      ]);

      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error updating item positions:', error);
      message.error('Có lỗi khi cập nhật vị trí');
    }
  };

  const createChainLabel = (
    chain,
    favoriteIds,
    hoveredId,
    handleFavoriteClick,
    handleDelete
  ) => {
    // Determine if item is first or last in its tab
    const itemsInSameTab = listChain
      .filter(item => item.tab === chain.tab)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    const isFirst = itemsInSameTab[0]?.id === chain.id;
    const isLast = itemsInSameTab[itemsInSameTab.length - 1]?.id === chain.id;

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
        onMouseEnter={() => setHoveredId(chain.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            marginRight: 8,
          }}
        >
          {chain.code ? `${chain.code} - ${chain.name}` : chain.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {(favoriteIds.includes(chain.id) || hoveredId === chain.id) && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleFavoriteClick(chain.id);
              }}
            >
              <img
                src={
                  favoriteIds.includes(chain.id)
                    ? OnFavoriteIcon
                    : OffFavoriteIcon
                }
                alt=""
              />
            </IconButton>
          )}

          {hoveredId === chain.id && chain.tab !== 'tapFavorite' && (
            <>
              {!isFirst && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveItem(chain.id, chain.tab, 'up');
                  }}
                >
                  <KeyboardArrowUpIcon fontSize="small" />
                </IconButton>
              )}
              {!isLast && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveItem(chain.id, chain.tab, 'down');
                  }}
                >
                  <KeyboardArrowDownIcon fontSize="small" />
                </IconButton>
              )}
            </>
          )}

          <IconButton
            size="small"
            onClick={(e) => handleDelete(e, chain.id, chain.name)}
            style={{ padding: 4, flexShrink: 0 }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </div>
      </div>
    );
  };

  const [hoveredTab, setHoveredTab] = useState(null);

  const filteredList = tabs
    .map((tab) => {
      const filteredChildren =
        tab.key === "tapFavorite"
          ? listFavorite
            .filter((chain) => filterChainBySearchText(chain, searchText))
            .map((chain) => ({
              key: chain.id,
              label: createChainLabel(
                chain,
                favoriteIds,
                hoveredId,
                handleFavoriteClick,
                handleDelete
              ),
            }))
          : listChain
            .filter(
              (chain) =>
                chain.tab === tab.key &&
                filterChainBySearchText(chain, searchText)
            )
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map((chain) => ({
              key: chain.id,
              label: createChainLabel(
                chain,
                favoriteIds,
                hoveredId,
                handleFavoriteClick,
                handleDelete
              ),
            }));

      return filteredChildren.length > 0 || searchText.trim() === ""
        ? {
          key: tab.key,
          icon: <img src={ChuoiNghiepVu} alt={tab.alt} />,
          label: (
            <div
              style={{ display: 'flex', alignItems: 'center', width: '100%' }}
              onMouseEnter={() => setHoveredTab(tab.key)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <span style={{ flex: 1 }}>{tab.label}</span>
              {hoveredTab === tab.key && tab.key !== 'tapFavorite' && (
                <div style={{ display: 'flex', marginLeft: 8 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveTab(tab.key, 'up');
                    }}
                  >
                    <KeyboardArrowUpIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveTab(tab.key, 'down');
                    }}
                  >
                    <KeyboardArrowDownIcon fontSize="small" />
                  </IconButton>
                </div>
              )}
            </div>
          ),
          children:
            filteredChildren.length > 0
              ? filteredChildren
              : [{ key: "empty", label: "Không có dữ liệu" }],
          mode: "inline",
        }
        : null;
    })
    .filter((item) => item !== null);
  const handleOpenChange = (key, keys) => {
    setOpenKeys((prev) => ({
      ...prev,
      [key]: keys,
    }));
  };

  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setNewCardCode("");
    setNewCardName("");
    setSelectedTemplate(null);
    setSelectedTable(null);
    setSelectedDataType(null);
  };

  const handleCreate = async () => {
    if (!newCardCode || !newCardName || !selectedTemplate || !selectedTable) {
      message.error("Vui lòng chọn đầy đủ thông tin");
      return;
    }

    if (selectedTable === "Data") {
      if (!selectedDataType) {
        message.error("Vui lòng chọn loại dữ liệu");
        return;
      }
    }

    // Find the minimum position in the selected tab
    const itemsInSelectedTab = listChain
      .filter(item => item.tab === selectedTemplate)
      .map(item => item.position || 0);

    const minPosition = itemsInSelectedTab.length > 0
      ? Math.min(...itemsInSelectedTab)
      : 0;

    // Set new item position to be less than the current minimum
    const newPosition = minPosition - 1;

    await createNewFileNotePad({
      code: newCardCode,
      name: newCardName,
      tab: selectedTemplate,
      table: selectedTable,
      type: selectedTable === "Data" ? selectedDataType : null,
      position: newPosition
    });

    fetchData();
    handleCloseModal();
  };

  const isItemSelected = (itemKey, tabKey) => {
    return selectedKey === itemKey && tabKey === selectedTapCanvas;
  };

  const handleCreateFolder = async () => {
    // Check for spaces, slashes, and Vietnamese characters in key
    const hasVietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(newFolderData.key);
    const hasInvalidChars = /[\s/]/.test(newFolderData.key);

    if (hasVietnameseChars || hasInvalidChars) {
      message.error("Key không được chứa khoảng trắng, dấu '/' hoặc ký tự tiếng Việt");
      return;
    }

    if (!newFolderData.key || !newFolderData.label || !newFolderData.alt) {
      message.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      // Get max position
      const maxPosition = Math.max(...tabs.map(tab => tab.position || 0), 0);

      await createFileTab({
        ...newFolderData,
        position: maxPosition + 1,
        table : 'report'
      });

      message.success("Tạo thư mục thành công");
      loadFileTab();
      setIsModalFolderVisible(false);
      setNewFolderData({ key: '', label: '', alt: '' });
    } catch (error) {
      console.error("Error creating folder:", error);
      message.error("Có lỗi xảy ra khi tạo thư mục");
    }
  };

  return (
    <div
      className={`${css.sidebar} ${isCollapsed ? css.sidebarCollapsed : ""}`}
    >
      {!isCollapsed ? (
        <>
          <div
            className={css.button}
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingLeft: "20px",
              paddingRight: "10px",
            }}
          >
            <div style={{ display: "flex", gap: "10px" }}>
              <div className={css.buttonWrapper} onClick={() => setIsModalFolderVisible(true)}>
                <span>{"+ Folder"}</span>
              </div>
              <div className={css.buttonWrapper} onClick={handleOpenModal}>
                <span>{"+ Dữ liệu"}</span>
              </div>
            </div>
            <IconButton onClick={onToggle} size="small">
              <ChevronLeftIcon />
            </IconButton>
          </div>
          <div className={css.buttonSearch}>
            <img src={SearchIcon} alt="" />
            <input
              type="text"
              className={css.quickFilterInput}
              value={searchText}
              placeholder="Tìm kiếm"
              onChange={handleSearchChange}
            />
          </div>
        </>
      ) : (
        <>
          <div className={css.button}>
            <IconButton onClick={onToggle} size="small">
              <ChevronRightIcon />
            </IconButton>
          </div>
          <div className={css.button}>
            <div className={css.buttonWrapper} onClick={handleOpenModal}>
              <span>{"+"}</span>
            </div>
          </div>
        </>
      )}

      <div className={css.tabs}>
        {filteredList.map((item) => (
          <Menu
            key={item?.key}
            onClick={handleMenuClick}
            style={{
              width: !isCollapsed ? 290 : 70,
            }}
            selectedKeys={item.key == selectedTapCanvas && [selectedKey]}
            inlineCollapsed={isCollapsed}
            openKeys={openKeys[item?.key] || []}
            onOpenChange={(keys) => handleOpenChange(item?.key, keys)}
            mode={item?.mode}
          >
            {item?.children[0].key != "empty" && (
              <Menu.SubMenu
                key={item?.key}
                icon={item?.icon}
                title={
                  <span style={{ fontWeight: "bold" }}>{item?.label}</span>
                }
              >
                {item.children.map((subItem) => (
                  <Menu.Item
                    key={subItem.key}
                    style={{
                      color:
                        item.key == selectedTapCanvas &&
                          subItem.key == selectedKey
                          ? "#249E57"
                          : "unset",
                      fontWeight:
                        item.key == selectedTapCanvas &&
                          subItem.key == selectedKey
                          ? 450
                          : "unset",
                    }}
                  >
                    {subItem.label}
                  </Menu.Item>
                ))}
              </Menu.SubMenu>
            )}
          </Menu>
        ))}
      </div>
      <Modal
        title="Tạo Mới"
        visible={isModalVisible}
        onOk={handleCreate}
        onCancel={handleCloseModal}
        okText="Tạo"
        cancelText="Hủy"
      >
        <div className={css.modalContent}>
          <Input
            placeholder="Nhập mã"
            value={newCardCode}
            onChange={(e) => setNewCardCode(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          {selectedTable !== "Data" && (
            <Input
              placeholder="Nhập tên"
              value={newCardName}
              onChange={(e) => setNewCardName(e.target.value)}
              style={{ marginBottom: 10 }}
            />
          )}
          <Select
            placeholder="Chọn bảng"
            value={selectedTable}
            onChange={(value) => setSelectedTable(value)}
            style={{ width: "100%", marginBottom: 10 }}
          >
            {tables.map((table) => (
              <Select.Option key={table.value} value={table.value}>
                {table.label}
              </Select.Option>
            ))}
          </Select>
          {selectedTable === "Data" && (
            <Select
              placeholder="Chọn loại dữ liệu"
              allowClear
              showSearch
              value={selectedDataType}
              onChange={(value) => {
                setSelectedDataType(value);
                setNewCardName(
                  CANVAS_DATA_PACK.find((e) => e.value == value).name
                );
              }}
              style={{ width: "100%", marginBottom: 10 }}
            >
              {CANVAS_DATA_PACK.map((type) => (
                <Select.Option key={type.id} value={type.value}>
                  {type.name}
                </Select.Option>
              ))}
            </Select>
          )}
          <Select
            placeholder="Chọn mục muốn thêm"
            value={selectedTemplate}
            onChange={(value) => setSelectedTemplate(value)}
            style={{ width: "100%" }}
          >
            {tempParentLabels.map((template) => (
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
          setNewFolderData({ key: '', label: '', alt: '' });
        }}
        okText="Tạo"
        cancelText="Hủy"
      >
        <div className={css.modalContent}>
          <Input
            placeholder="Nhập key"
            value={newFolderData.key}
            onChange={(e) => setNewFolderData(prev => ({ ...prev, key: e.target.value }))}
            style={{ marginBottom: 10 }}
          />
          <Input
            placeholder="Nhập label"
            value={newFolderData.label}
            onChange={(e) => setNewFolderData(prev => ({ ...prev, label: e.target.value }))}
            style={{ marginBottom: 10 }}
          />
          <Input
            placeholder="Nhập alt"
            value={newFolderData.alt}
            onChange={(e) => setNewFolderData(prev => ({ ...prev, alt: e.target.value }))}
            style={{ marginBottom: 10 }}
          />

          <div style={{ marginTop: 20 }}>
            <h4>Danh sách thư mục hiện tại:</h4>
            {tabs.map((tab, index) => (
              index !== 0 && (
                <div key={tab.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span>{tab.label}</span>
                  <IconButton
                    size="small"
                    onClick={async () => {
                      try {
                        await deleteFileTab(tab.id);
                        message.success("Xóa thành công");
                        loadFileTab();
                      } catch (error) {
                        console.error("Error deleting tab:", error);
                        message.error("Có lỗi xảy ra khi xóa");
                      }
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </div>
              )
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
