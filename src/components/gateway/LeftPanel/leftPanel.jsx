import React, { useState, useEffect } from "react";
import { FaChevronDown, FaChevronUp  } from "react-icons/fa";
import { CirclePlus } from "lucide-react";

import styles from "./leftPanel.module.css";
// CONSTANT
import {
  STATUS_PENDING,
  TYPE_CUSTOMER,
  TYPE_EMPLOYEE,
  TYPE_INTERNAL,
  STATUS_COLOR,
} from "../../../GATEWAY_CONST";
// ICONS
import {
  Bolt,
  Search,
  CircleCheck,
  X,
  Plus,
  Eye,
  Trash2,
  MessageSquare,
} from "lucide-react";
// API
import { createTicket } from "../../../apis/gateway/ticketService";
import {
  getAllTag,
  createTag,
  deleteTag,
} from "../../../apis/gateway/tagService";
// Import socketService
import socketService from "../service/socketService";

function LeftPanel({
  tickets,
  setTickets,
  tags,
  setTags,
  selectedTicket,
  setSelectedTicket,
  isLoading,
  selectedCompany,
  userList,
  currentUser,
  permission
}) {
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} giây trước`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} tiếng trước`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ngày trước`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} tháng trước`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} năm trước`;
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [filterMode, setFilterMode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);

  const [filteredTickets, setFilteredTickets] = useState(tickets);

  const getStatusColorByType = (type) => {
    switch (type) {
      case TYPE_CUSTOMER:
        return STATUS_COLOR[TYPE_CUSTOMER];
      case TYPE_EMPLOYEE:
        return STATUS_COLOR[TYPE_EMPLOYEE];
      case TYPE_INTERNAL:
        return STATUS_COLOR[TYPE_INTERNAL];
      default:
        return STATUS_COLOR[TYPE_CUSTOMER];
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: "",
    type: permission?.isGuest ? TYPE_CUSTOMER : TYPE_EMPLOYEE,
    pic: "",
    tag: "",
    deadline: new Date().toISOString().split("T")[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [showTagSettings, setShowTagSettings] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [tagError, setTagError] = useState("");
  const [isTagLoading, setIsTagLoading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    tagId: null,
    tagName: "",
  });

  const [ticketsWithMessages, setTicketsWithMessages] = useState(new Set());

  const loadTags = async () => {
    try {
      setIsTagLoading(true);
      const data = await getAllTag();
      setTags(data);
    } catch (error) {
      console.error("Error loading tags:", error);
    } finally {
      setIsTagLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  useEffect(() => {
    let result = tickets;

    // First check if user is a guest and filter ticket types accordingly
    if (permission?.isGuest) {
      result = result.filter(ticket =>
        ticket.type === TYPE_CUSTOMER || ticket.type === TYPE_EMPLOYEE
      );
    }

    // Then apply the existing filters
    if (typeFilter !== "all") {
      result = result.filter((ticket) => ticket.type === typeFilter);
    }
    if (filterMode === "PIC") {
      result = result.filter(
        (ticket) => ticket.pic && ticket.pic.trim() !== ""
      );
    } else if (filterMode === "TAG") {
      result = result.filter(
        (ticket) => ticket.tag && ticket.tag.trim() !== ""
      );
    }
    if (searchTerm.trim() !== "") {
      result = result.filter((ticket) => {
        const searchLower = searchTerm.toLowerCase();
        if (filterMode === "PIC") {
          return ticket.pic.toLowerCase().includes(searchLower);
        } else if (filterMode === "TAG") {
          return ticket.tag.toLowerCase().includes(searchLower);
        }
        return (
          ticket.title.toLowerCase().includes(searchLower) ||
          ticket.user.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredTickets(result);
  }, [typeFilter, filterMode, searchTerm, tickets, permission?.isGuest]);

  // Toggle dropdown
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleTypeFilter = (type) => {
    setTypeFilter(type === typeFilter ? "all" : type);
  };

  const handleFilterMode = (mode) => {
    setFilterMode(mode === filterMode ? null : mode);
  };

  const toggleSearchInput = () => {
    setShowSearchInput(!showSearchInput);
    if (!showSearchInput) {
      setTimeout(() => {
        const searchInput = document.getElementById("ticket-search");
        if (searchInput) searchInput.focus();
      }, 100);
    } else {
      setSearchTerm("");
      setFilterMode(null);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTickets([...tickets]);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [tickets]);

  useEffect(() => {
    // Get initial tickets with messages from socketService
    setTicketsWithMessages(new Set(socketService.getTicketsWithMessages()));

    // Setup a listener for new messages
    const handleNewMessage = (data) => {
      if (data.ticket_Id) {
        setTicketsWithMessages((prev) => new Set([...prev, data.ticket_Id]));
      }
    };

    // Subscribe to socket events
    socketService.onMessage(handleNewMessage);

    // Clear on unmount
    return () => {
      // If needed, add cleanup logic
    };
  }, []);

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    setErrorMessage("");
    setNewTicket(prev => ({
      ...prev,
      type: permission?.isGuest ? TYPE_CUSTOMER : TYPE_EMPLOYEE
    }));
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setNewTicket({
      title: "",
      type: permission?.isGuest ? TYPE_CUSTOMER : TYPE_EMPLOYEE,
      pic: "",
      tag: "",
      deadline: new Date().toISOString().split("T")[0],
    });
    setErrorMessage("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (permission?.isGuest && name === 'type') {
      return;
    }

    // For PIC, store the full email value
    if (name === 'pic') {
      setNewTicket((prev) => ({
        ...prev,
        [name]: value, // Store full email
      }));
    } else {
      setNewTicket((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      // Prepare ticket data, using full email for PIC
      const ticketData = {
        title: newTicket.title,
        type: newTicket.type,
        pic: newTicket.pic, // This is already the full email
        tag: newTicket.tag,
        deadline: newTicket.deadline,
        status: STATUS_PENDING,
        companyId: selectedCompany,
        user: currentUser.email.split("@")[0],
      };

      const response = await createTicket(ticketData);

      const completedTicket = {
        ...response,
        createdAt: response.createdAt || new Date().toISOString(),
        completed: response.completed || false,
        warning: response.warning || false,
        hasComments: response.hasComments || false,
        type: response.type || newTicket.type,
        deadline: response.deadline || newTicket.deadline,
      };

      setTickets((prev) => [completedTicket, ...prev]);

      handleCloseCreateModal();
    } catch (error) {
      console.error("Error creating ticket:", error);
      setErrorMessage(
        error.response?.data?.message || "Đã xảy ra lỗi khi tạo công việc mới."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenTagSettings = () => {
    if (!permission?.isEditor) {
      return;
    }
    setShowTagSettings(true);
    setNewTagName("");
    setTagSearchTerm("");
    setTagError("");
  };

  const handleCloseTagSettings = () => {
    setShowTagSettings(false);
    setConfirmDialog({ show: false, tagId: null, tagName: "" });
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      setTagError("Tên tag không được để trống");
      return;
    }

    if (
      tags.some((tag) => tag.name.toLowerCase() === newTagName.toLowerCase())
    ) {
      setTagError("Tag này đã tồn tại");
      return;
    }

    try {
      setIsTagLoading(true);
      setTagError("");

      const tagData = {
        name: newTagName.trim(),
      };

      const response = await createTag(tagData);

      setTags([...tags, response]);
      setNewTagName("");
    } catch (error) {
      console.error("Error creating tag:", error);
      setTagError(
        error.response?.data?.message || "Đã xảy ra lỗi khi tạo tag mới."
      );
    } finally {
      setIsTagLoading(false);
    }
  };

  const showDeleteConfirmation = (tagId, tagName) => {
    setConfirmDialog({
      show: true,
      tagId,
      tagName,
    });
  };

  const handleRemoveTag = async () => {
    if (confirmDialog.tagId) {
      try {
        setIsTagLoading(true);

        await deleteTag(confirmDialog.tagId);

        setTags(tags.filter((tag) => tag.id !== confirmDialog.tagId));

        setConfirmDialog({ show: false, tagId: null, tagName: "" });
      } catch (error) {
        console.error("Error deleting tag:", error);
        setTagError("Đã xảy ra lỗi khi xóa tag.");
      } finally {
        setIsTagLoading(false);
      }
    }
  };

  const cancelRemoveTag = () => {
    setConfirmDialog({ show: false, tagId: null, tagName: "" });
  };

  const availableTags = tags.map((tag) => tag.name);

  // Function to handle ticket selection
  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
  };

  const hasMessages = (ticketId) => {
    return (
      ticketsWithMessages.has(ticketId) || socketService.hasMessages(ticketId)
    );
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.leftHeader}>
      <div className={styles.headerLabel}>
        <div className={styles.headerLeft}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            Thẻ công việc/ ticket
          </div>
          {permission?.isEditor && (
              <button
                  className={styles.footerButtonAdd}
                  onClick={handleOpenCreateModal}
              >
                <CirclePlus size={16} className={styles.buttonIcon} />
                Tạo mới
              </button>
          )}
        </div>

        <button className={styles.dropdownButton} onClick={toggleDropdown}>
        {isDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>

        {isDropdownOpen && (
          <div className={styles.dropdownMenu}>
            {/* Các filter chính */}
            <div className={styles.filterTabs}>
              <button
                className={`${styles.filterTab} ${typeFilter === TYPE_CUSTOMER ? styles.activeTab : ""}`}
                onClick={() => handleTypeFilter(TYPE_CUSTOMER)}
              >
                Khách hàng
              </button>
              <button
                className={`${styles.filterTab} ${typeFilter === TYPE_EMPLOYEE ? styles.activeTab : ""}`}
                onClick={() => handleTypeFilter(TYPE_EMPLOYEE)}
              >
                Nhân viên
              </button>
              {!permission?.isGuest && (
                <button
                  className={`${styles.filterTab} ${typeFilter === TYPE_INTERNAL ? styles.activeTab : ""}`}
                  onClick={() => handleTypeFilter(TYPE_INTERNAL)}
                >
                  Nội bộ
                </button>
              )}
            </div>

            {showSearchInput && (
                <div className={styles.searchContainer}>
                  <input
                      id="ticket-search"
                      type="text"
                      className={styles.searchInput}
                      placeholder={
                        filterMode === "PIC"
                            ? "Tìm kiếm theo PIC...."
                            : filterMode === "TAG"
                                ? "Tìm kiếm theo TAG..."
                                : "Tìm kiếm theo tickets..."
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
            )}

            <div className={styles.secondaryTabs}>
              {showSearchInput && (
                <>
                  <button
                    className={`${styles.secondaryTab} ${filterMode === "PIC" ? styles.activeTab : ""}`}
                    onClick={() => handleFilterMode("PIC")}
                  >
                    PIC
                  </button>
                  <button
                    className={`${styles.secondaryTab} ${filterMode === "TAG" ? styles.activeTab : ""}`}
                    onClick={() => handleFilterMode("TAG")}
                  >
                    TAG
                  </button>
                  <Bolt
                      className={styles.settingIcon}
                      color="#454545"
                      size={20}
                      onClick={handleOpenTagSettings}
                      style={{
                        cursor: permission?.isEditor ? "pointer" : "not-allowed",
                        opacity: permission?.isEditor ? 1 : 0.5
                      }}
                      title={permission?.isEditor ? "Manage Tags" : "Need editor permission to manage tags"}
                  />
                </>
              )}
              <button className={styles.searchButton} onClick={toggleSearchInput}>
                {showSearchInput ? <X size={18} /> : <Search size={18} />}
              </button>
              {isDropdownOpen && (
                  <button className={styles.footerButton}>
                    <Eye size={16} className={styles.buttonIcon} />
                    Xem task đã ẩn
                  </button>
              )}
            </div>
          </div>
        )}



        <div className={styles.componentLabel}>
          <span className={styles.componentIcon}></span>
          Component{" "}
          <span className={styles.componentCount}>
            {filteredTickets.length}
          </span>
        </div>

        <div className={styles.ticketListContainer}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.loader}></div>
              <span>Đang tải dữ liệu...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className={styles.noResults}>No tickets found</div>
          ) : (
            <div className={styles.ticketList}>
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`${styles.ticketItem} ${styles[`${getStatusColorByType(ticket.type)}Ticket`]} ${selectedTicket?.id === ticket.id ? styles.selectedTicket : ""}`}
                  onClick={() => handleTicketSelect(ticket)}
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.ticketContent}>
                    {ticket.completed ? (
                      <div className={styles.ticketCheck}>
                        <CircleCheck color="green" size={20} />
                      </div>
                    ) : ticket.warning ? (
                      <div className={styles.warningIcon}>⚠</div>
                    ) : null}
                    <div
                      className={styles.ticketInfo}
                      style={
                        !ticket.completed && !ticket.warning
                          ? { marginLeft: "30px" }
                          : {}
                      }
                    >
                      <div className={styles.ticketTitleRow}>
                        <div className={styles.ticketTitle}>{ticket.title}</div>
                      </div>
                      <div className={`${styles.ticketMeta} `}>
                        <div className={styles.ticketStatus}></div>
                        {formatRelativeTime(ticket.createdAt)} ({ticket.user})
                        <span className={styles.ticketTags}>
                          {ticket.pic && (
                            <span
                              className={styles.ticketTag}
                              title={ticket.pic}
                            >
                              <span className={styles.tagValue}>
                                {ticket.pic.includes('@') ? ticket.pic.split('@')[0] : ticket.pic}
                              </span>
                            </span>
                          )}
                          {ticket.tag && (
                            <span
                              className={styles.ticketTag}
                              title={ticket.tag}
                            >
                              <span className={styles.tagValue}>
                                {ticket.tag}
                              </span>
                            </span>
                          )}
                        </span>
                        {ticket.hasComments && (
                          <div className={styles.commentIcon}>
                            <MessageSquare size={14} color="#0084ff" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with buttons */}

      </div>

      {/* Create Ticket Modal with tag dropdown */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Tạo công việc mới</h3>
              <button
                className={styles.closeButton}
                onClick={handleCloseCreateModal}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className={styles.createForm}>
              {errorMessage && (
                <div className={styles.errorMessage}>{errorMessage}</div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="title">Tiêu đề công việc *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newTicket.title}
                  onChange={handleInputChange}
                  placeholder="Nhập tiêu đề công việc"
                  required
                />
              </div>

              {permission?.isGuest ? (
                <input
                  type="hidden"
                  name="type"
                  value={TYPE_CUSTOMER}
                />
              ) : (
                <div className={styles.formGroup}>
                  <label htmlFor="type">Loại công việc *</label>
                  <select
                    id="type"
                    name="type"
                    value={newTicket.type}
                    onChange={handleInputChange}
                    required
                    className={
                      styles[
                      `select${newTicket.type.charAt(0).toUpperCase() +
                      newTicket.type.slice(1)}`
                      ]
                    }
                  >
                    <option value={TYPE_EMPLOYEE}>Nhân viên</option>
                    <option value={TYPE_INTERNAL}>Nội bộ</option>
                  </select>
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="pic">PIC (Người phụ trách)</label>
                <select
                  id="pic"
                  name="pic"
                  value={newTicket.pic}
                  onChange={handleInputChange}
                  className={styles.picSelect}
                >
                  <option value="">Chọn người phụ trách</option>
                  {userList &&
                    userList.map((user) => {
                      // Extract username from email for display
                      const username = user.email.split('@')[0].toLowerCase();
                      return (
                        <option key={user.id} value={user.email}>
                          {username}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tag">Tag</label>
                <select
                  id="tag"
                  name="tag"
                  value={newTicket.tag}
                  onChange={handleInputChange}
                >
                  <option value="">Chọn tag</option>
                  {availableTags.map((tag, index) => (
                    <option key={index} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="deadline">Hạn chót</label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={newTicket.deadline}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  className={styles.dateInput}
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCloseCreateModal}
                  disabled={isSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang xử lý..." : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tag Settings Modal */}
      {showTagSettings && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Quản lý Tag</h3>
              <button
                className={styles.closeButton}
                onClick={handleCloseTagSettings}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.tagSettingsContent}>
              {/* Add new tag */}
              <div className={styles.addTagSection}>
                <h4>Thêm tag mới</h4>
                {tagError && (
                  <div className={styles.errorMessage}>{tagError}</div>
                )}
                <div className={styles.addTagForm}>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Nhập tên tag mới"
                    className={styles.tagInput}
                    disabled={isTagLoading}
                  />
                  <button
                    onClick={handleAddTag}
                    className={styles.addTagButton}
                    disabled={isTagLoading}
                  >
                    {isTagLoading ? (
                      <span className={styles.buttonLoader}></span>
                    ) : (
                      <Plus size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Search and manage existing tags */}
              <div className={styles.manageTagsSection}>
                <h4>Danh sách tag</h4>
                <div className={styles.tagSearchBox}>
                  <Search size={16} className={styles.tagSearchIcon} />
                  <input
                    type="text"
                    value={tagSearchTerm}
                    onChange={(e) => setTagSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm tag"
                    className={styles.tagSearchInput}
                  />
                </div>

                <div className={styles.tagsList}>
                  {isTagLoading && filteredTags.length === 0 ? (
                    <div className={styles.loadingTags}>Đang tải...</div>
                  ) : filteredTags.length === 0 ? (
                    <div className={styles.noTagsFound}>
                      Không tìm thấy tag nào
                    </div>
                  ) : (
                    filteredTags.map((tag) => (
                      <div
                        key={tag.id}
                        className={`${styles.tagItem} ${confirmDialog.show && confirmDialog.tagId === tag.id
                          ? styles.tagItemHighlighted
                          : ""
                          }`}
                      >
                        <span>{tag.name}</span>
                        {confirmDialog.show &&
                          confirmDialog.tagId === tag.id ? (
                          <div className={styles.inlineConfirmation}>
                            <button
                              className={styles.confirmButton}
                              onClick={handleRemoveTag}
                              disabled={isTagLoading}
                            >
                              {isTagLoading ? (
                                <span className={styles.smallLoader}></span>
                              ) : (
                                "Xóa"
                              )}
                            </button>
                            <button
                              className={styles.cancelConfirmButton}
                              onClick={cancelRemoveTag}
                              disabled={isTagLoading}
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            className={styles.removeTagButton}
                            onClick={() =>
                              showDeleteConfirmation(tag.id, tag.name)
                            }
                            disabled={isTagLoading}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeftPanel;
