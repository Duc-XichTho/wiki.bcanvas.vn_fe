import React, { useState, useContext, useEffect, useRef } from 'react';
import styles from './header.module.css';
import { MyContext } from '../../../MyContext';
// ICON
import { ChevronDown, Settings, Plus, X, Edit2, LogOut, User, Save, Bell, Shield, UserPlus, CheckSquare, ToggleLeft, ToggleRight, Trash2, Users, Building, RefreshCw, Check, History } from 'lucide-react';
// API
import { createCompany, updateCompany, deleteCompany } from '../../../apis/gateway/companyService';
import { logout } from '../../../apis/userService';
import { updateUser } from '../../../apis/userService';
import { getNotificationsByUser, markAsRead } from "../../../apis/gateway/notificationService";
import { getPermissionsByCompanyId, createPermission, updatePermission, deletePermission } from '../../../apis/gateway/permissonService';
import {BackCanvas} from "../../../icon/svg/IconSvg.jsx";

function Header({
	companyList,
	selectedCompany,
	setSelectedCompany,
	currentUser,
	fetchCurrentUserLogin,
	tickets,
	setSelectedTicket,
	userList
}) {
	const { fetchCompanyList } = useContext(MyContext);
	const [showDropdown, setShowDropdown] = useState(false);
	const [showUserDropdown, setShowUserDropdown] = useState(false);
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);
	const [newCompanyName, setNewCompanyName] = useState('');
	const [editCompanyId, setEditCompanyId] = useState(null);
	const [editCompanyName, setEditCompanyName] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [nickname, setNickname] = useState('');
	const [isUpdating, setIsUpdating] = useState(false);
	const [updateError, setUpdateError] = useState('');
	const [updateSuccess, setUpdateSuccess] = useState('');
	const dropdownRef = useRef(null);
	const userDropdownRef = useRef(null);
	const [showNotifications, setShowNotifications] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
	const notificationRef = useRef(null);
	const [showAdminDropdown, setShowAdminDropdown] = useState(false);
	const [showPermissionModal, setShowPermissionModal] = useState(false);
	const [selectedCompanyForPermissions, setSelectedCompanyForPermissions] = useState('');
	const [permissions, setPermissions] = useState([]);
	const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
	const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
	const adminDropdownRef = useRef(null);
	const [permissionsChanged, setPermissionsChanged] = useState(false);
	const [editedPermissions, setEditedPermissions] = useState({});
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
	const [permissionToDelete, setPermissionToDelete] = useState(null);
	const [isSendEmail, setIsSendEmail] = useState(false);
	const [isSendEmailMessage, setIsSendEmailMessage] = useState(false);
	const [isLoadingTicket, setIsLoadingTicket] = useState(false);
	const [showLogs, setShowLogs] = useState(false);
	const [logs, setLogs] = useState([]);
	const [isLoadingLogs, setIsLoadingLogs] = useState(false);
	const logRef = useRef(null);

	// Find the selected company name
	const selectedCompanyName =
		companyList.find((c) => c.id === selectedCompany)?.name || 'Select Company';

	// Set initial nickname when currentUser changes
	useEffect(() => {
		if (currentUser?.nickName) {
			setNickname(currentUser.nickName);
		} else if (currentUser?.email) {
			// Default to email username if nickname doesn't exist
			setNickname(currentUser.email.split('@')[0]);
		}
		setIsSendEmail(currentUser?.isSendEmail || false);
		setIsSendEmailMessage(currentUser?.isSendEmailMessage || false);
	}, [currentUser]);

	// Fetch notifications when the component mounts or currentUser changes
	useEffect(() => {
		if (currentUser?.email) {
			fetchNotifications();
		}
	}, [currentUser]);

	// Function to fetch notifications
	const fetchNotifications = async () => {
		try {
			setIsLoadingNotifications(true);
			const notificationsData = await getNotificationsByUser(currentUser.email);

			// Filter only notifications that should be shown and are not logs
			const visibleNotifications = notificationsData.filter(noti =>
				noti.show && !noti.isLog
			);

			setNotifications(visibleNotifications);
		} catch (error) {
			console.error("Error fetching notifications:", error);
		} finally {
			setIsLoadingNotifications(false);
		}
	};

	const toggleDropdown = () => {
		setShowDropdown(!showDropdown);
	};

	const toggleUserDropdown = () => {
		setShowUserDropdown(!showUserDropdown);
	};

	const toggleSettingsModal = () => {
		setShowSettingsModal(!showSettingsModal);
	};

	const openAccountSettingsModal = () => {
		setShowAccountSettingsModal(true);
		setShowUserDropdown(false);
		// Reset status messages
		setUpdateError('');
		setUpdateSuccess('');
	};

	const closeAccountSettingsModal = () => {
		setShowAccountSettingsModal(false);
	};

	const handleCompanySelect = (companyId) => {
		setSelectedCompany(companyId);
		setShowDropdown(false);
	};

	const handleLogout = async () => {
		try {
			await logout();
			window.location.href = '/login';
		} catch (error) {
			console.error('Logout failed:', error);
		}
	};

	const addCompany = async () => {
		if (!newCompanyName.trim()) {
			setError('Tên công ty không được để trống');
			return;
		}

		if (
			companyList.some(
				(company) => company.name.toLowerCase() === newCompanyName.toLowerCase()
			)
		) {
			setError('Công ty này đã tồn tại');
			return;
		}

		try {
			setIsLoading(true);
			setError('');

			const companyData = {
				name: newCompanyName.trim(),
			};

			await createCompany(companyData);
			await fetchCompanyList(); // Refresh the company list from the server

			setNewCompanyName('');
		} catch (error) {
			console.error('Error creating company:', error);
			setError(error.response?.data?.message || 'Đã xảy ra lỗi khi tạo công ty mới.');
		} finally {
			setIsLoading(false);
		}
	};

	const startEditCompany = (company) => {
		setEditCompanyId(company.id);
		setEditCompanyName(company.name);
		setError('');
	};

	const cancelEditCompany = () => {
		setEditCompanyId(null);
		setEditCompanyName('');
	};

	const saveEditCompany = async (companyId) => {
		if (!editCompanyName.trim()) {
			setError('Tên công ty không được để trống');
			return;
		}

		if (
			companyList.some(
				(company) =>
					company.id !== companyId &&
					company.name.toLowerCase() === editCompanyName.toLowerCase()
			)
		) {
			setError('Công ty này đã tồn tại');
			return;
		}

		try {
			setIsLoading(true);
			setError('');

			const companyData = {
				id: companyId,
				name: editCompanyName.trim(),
			};

			await updateCompany(companyData);
			await fetchCompanyList(); // Refresh the company list from the server

			setEditCompanyId(null);
			setEditCompanyName('');
		} catch (error) {
			console.error('Error updating company:', error);
			setError(error.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật tên công ty.');
		} finally {
			setIsLoading(false);
		}
	};

	const removeCompany = async (companyId) => {
		try {
			setIsLoading(true);
			setError('');

			await deleteCompany(companyId);
			await fetchCompanyList(); // Refresh the company list from the server

			// If we removed the selected company, select the first one in the updated list
			if (companyId === selectedCompany) {
				if (companyList.length > 1) {
					// Find the next available company
					const nextCompany = companyList.find((company) => company.id !== companyId);
					if (nextCompany) {
						setSelectedCompany(nextCompany.id);
					} else {
						setSelectedCompany('');
					}
				} else {
					setSelectedCompany('');
				}
			}
		} catch (error) {
			console.error('Error deleting company:', error);
			setError(error.response?.data?.message || 'Đã xảy ra lỗi khi xóa công ty.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdateNickname = async (e) => {
		e.preventDefault();

		if (!nickname.trim()) {
			setUpdateError('Tên hiển thị không được để trống');
			return;
		}

		try {
			setIsUpdating(true);
			setUpdateError('');
			setUpdateSuccess('');

			// Update the API call to include both email notification preferences
			await updateUser(currentUser.email, {
				nickName: nickname.trim(),
				isSendEmail: isSendEmail, // Status changes notifications
				isSendEmailMessage: isSendEmailMessage // Message notifications
			});

			// Refresh the current user data
			await fetchCurrentUserLogin();

			setUpdateSuccess('Cập nhật thành công!');
			setTimeout(() => {
				closeAccountSettingsModal();
				setUpdateSuccess('');
			}, 2000);
		} catch (error) {
			console.error('Error updating user settings:', error);
			setUpdateError('Không thể cập nhật. Vui lòng thử lại.');
		} finally {
			setIsUpdating(false);
		}
	};

	// Toggle notifications dropdown
	const toggleNotifications = () => {
		setShowNotifications(!showNotifications);

		// If opening the dropdown, fetch fresh notifications
		if (!showNotifications) {
			fetchNotifications();
		}
	};

	// Modified handleNotificationClick function
	const handleNotificationClick = async (notification) => {
		try {
			setIsLoadingTicket(true);
			// Mark as read on the server
			await markAsRead(notification.id);

			// Update local state to mark as read
			setNotifications(
				notifications.map(noti =>
					noti.id === notification.ticket_id ? { ...noti, read: true } : noti
				)
			);

			// Find and select the corresponding ticket
			const ticketToSelect = tickets.find(ticket => ticket.id === notification.ticket_id);
			if (ticketToSelect) {
				setSelectedTicket(ticketToSelect);
				setShowNotifications(false);
			} else {
				try {
					const foundTicket = tickets.find(t => t.id == notification.ticket_id);

					if (foundTicket) {
						setSelectedTicket(foundTicket);
						setShowNotifications(false);
					} else {
						alert('Không tìm thấy ticket này');
					}
				} catch (error) {
					console.error('Error fetching ticket:', error);
					alert('Có lỗi xảy ra khi tìm ticket');
				}
			}
		} catch (error) {
			console.error("Error handling notification:", error);
		} finally {
			setIsLoadingTicket(false);
		}
	};

	// Mark all notifications as read
	const markAllAsRead = async () => {
		try {
			// We'll mark each notification as read individually
			const updatePromises = notifications
				.filter(noti => !noti.read)
				.map(noti => markAsRead(noti.id));

			await Promise.all(updatePromises);

			// Update local state
			setNotifications(
				notifications.map(noti => ({ ...noti, read: true }))
			);
		} catch (error) {
			console.error("Error marking all notifications as read:", error);
		}
	};

	// Format time to relative time (e.g., "5 minutes ago")
	const formatTimeAgo = (createdAt) => {
		const date = new Date(createdAt);
		const now = new Date();
		const diffInSeconds = Math.floor((now - date) / 1000);

		if (diffInSeconds < 60) {
			return 'vừa xong';
		} else if (diffInSeconds < 3600) {
			const minutes = Math.floor(diffInSeconds / 60);
			return `${minutes} phút trước`;
		} else if (diffInSeconds < 86400) {
			const hours = Math.floor(diffInSeconds / 3600);
			return `${hours} giờ trước`;
		} else if (diffInSeconds < 604800) {
			const days = Math.floor(diffInSeconds / 86400);
			return `${days} ngày trước`;
		} else {
			return date.toLocaleDateString('vi-VN');
		}
	};

	// Count unread notifications
	const unreadCount = notifications.filter(noti => !noti.read).length;

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setShowDropdown(false);
			}
			if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
				setShowUserDropdown(false);
			}
			if (notificationRef.current && !notificationRef.current.contains(event.target)) {
				setShowNotifications(false);
			}
			if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
				setShowAdminDropdown(false);
			}
			if (logRef.current && !logRef.current.contains(event.target)) {
				setShowLogs(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	// Get user initial for fallback avatar
	const getUserInitial = () => {
		if (currentUser?.name) return currentUser.name.charAt(0).toUpperCase();
		if (currentUser?.email) return currentUser.email.charAt(0).toUpperCase();
		return 'U';
	};

	// Toggle admin dropdown
	const toggleAdminDropdown = () => {
		setShowAdminDropdown(!showAdminDropdown);
	};

	// Open permissions modal - convert ID to integer
	const openPermissionsModal = async () => {
		setShowPermissionModal(true);
		setShowAdminDropdown(false);
		setPermissionsChanged(false);
		setEditedPermissions({});

		// Set default selected company
		if (companyList.length > 0) {
			const companyId = parseInt(companyList[0].id, 10); // Ensure integer
			setSelectedCompanyForPermissions(companyId);
			await fetchPermissions(companyId);
		}
	};

	// Close permissions modal with confirmation if changes are unsaved
	const closePermissionsModal = () => {
		if (permissionsChanged) {
			if (confirm("You have unsaved changes. Are you sure you want to close?")) {
				setShowPermissionModal(false);
				setSelectedUserToAdd('');
				setPermissionsChanged(false);
				setEditedPermissions({});
			}
		} else {
			setShowPermissionModal(false);
			setSelectedUserToAdd('');
		}
	};

	// Fetch permissions - updated to work with company_id
	const fetchPermissions = async (companyId) => {
		try {
			setIsLoadingPermissions(true);
			setPermissionsChanged(false);
			setEditedPermissions({});

			// Use getPermissionsByTicketId but filter for company_id instead
			// NOTE: Ideally, your API would have a getPermissionsByCompany method
			const allPermissions = await getPermissionsByCompanyId(companyId);

			// Filter permissions with matching company_id
			const companyPermissions = allPermissions.filter(permission =>
				permission.company_id === companyId
			);

			setPermissions(companyPermissions);
		} catch (error) {
			console.error("Error fetching permissions:", error);
		} finally {
			setIsLoadingPermissions(false);
		}
	};

	// Handle company selection - convert ID to integer
	const handleCompanyPermissionSelect = async (companyId) => {
		// Convert to integer
		const newCompanyId = parseInt(companyId, 10);

		// Check for unsaved changes
		if (permissionsChanged) {
			if (confirm("You have unsaved changes. Changing company will discard these changes. Continue?")) {
				setSelectedCompanyForPermissions(newCompanyId);
				await fetchPermissions(newCompanyId);
			}
		} else {
			setSelectedCompanyForPermissions(newCompanyId);
			await fetchPermissions(newCompanyId);
		}
	};

	// Add user permission - ensure company_id is integer
	const addUserPermission = async () => {
		if (!selectedUserToAdd) return;

		try {
			setIsLoadingPermissions(true);

			const newPermission = {
				company_id: parseInt(selectedCompanyForPermissions, 10),
				user_email: selectedUserToAdd,
				role: 'user',
				isEditor: false,
				isResetStatus: false,
				isConfirm: false,
				isGuest: false,
				show: true
			};

			const result = await createPermission(newPermission);

			// Update local state
			setPermissions(prev => [...prev, result]);

			// Reset selected user
			setSelectedUserToAdd('');
		} catch (error) {
			console.error("Error adding user permission:", error);
		} finally {
			setIsLoadingPermissions(false);
		}
	};

	// Update the toggle editor function to handle multiple changes
	const toggleEditorPermission = (permission) => {
		// Track this permission as edited
		const newValue = !getPermissionValue(permission, 'isEditor');

		setEditedPermissions(prev => ({
			...prev,
			[permission.id]: {
				...permission, // Use the original permission as base
				...prev[permission.id], // Keep any other edited values
				isEditor: newValue,
				// If turning off editor, also turn off reset status
				isResetStatus: newValue ? (prev[permission.id]?.isResetStatus ?? permission.isResetStatus) : false
			}
		}));

		setPermissionsChanged(true);
	};

	// Also update the other toggle functions to use getPermissionValue
	const toggleResetStatusPermission = (permission) => {
		// Only proceed if the user is an editor
		const isEditor = getPermissionValue(permission, 'isEditor');
		if (!isEditor) return;

		const newValue = !getPermissionValue(permission, 'isResetStatus');

		setEditedPermissions(prev => ({
			...prev,
			[permission.id]: {
				...permission, // Use the original permission as base
				...prev[permission.id], // Keep any other edited values
				isResetStatus: newValue
			}
		}));

		setPermissionsChanged(true);
	};

	const toggleConfirmPermission = (permission) => {
		const newValue = !getPermissionValue(permission, 'isConfirm');

		setEditedPermissions(prev => ({
			...prev,
			[permission.id]: {
				...permission, // Use the original permission as base
				...prev[permission.id], // Keep any other edited values
				isConfirm: newValue
			}
		}));

		setPermissionsChanged(true);
	};

	const toggleGuestPermission = (permission) => {
		const newValue = !getPermissionValue(permission, 'isGuest');

		setEditedPermissions(prev => ({
			...prev,
			[permission.id]: {
				...permission, // Use the original permission as base
				...prev[permission.id], // Keep any other edited values
				isGuest: newValue
			}
		}));

		setPermissionsChanged(true);
	};

	// Save all edited permissions
	const savePermissionChanges = async () => {
		try {
			setIsLoadingPermissions(true);

			// Create an array of promises for all updates
			const updatePromises = Object.values(editedPermissions).map(permission =>
				updatePermission(permission)
			);

			// Wait for all updates to complete
			await Promise.all(updatePromises);

			// Refresh permissions from server
			await fetchPermissions(selectedCompanyForPermissions);

			// Reset changed state
			setPermissionsChanged(false);
			setEditedPermissions({});

		} catch (error) {
			console.error("Error saving permission changes:", error);
			alert("Failed to save changes. Please try again.");
		} finally {
			setIsLoadingPermissions(false);
		}
	};

	// Helper function to get current permission value (edited or original)
	const getPermissionValue = (permission, field) => {
		return editedPermissions[permission.id]?.[field] ?? permission[field];
	};

	// Show delete confirmation modal instead of browser alert
	const confirmDeletePermission = (permission) => {
		setPermissionToDelete(permission);
		setShowDeleteConfirmModal(true);
	};

	// Cancel delete action
	const cancelDeletePermission = () => {
		setShowDeleteConfirmModal(false);
		setPermissionToDelete(null);
	};

	// Confirm and execute delete
	const executeDeletePermission = async () => {
		if (!permissionToDelete) return;

		try {
			setIsLoadingPermissions(true);

			await deletePermission(permissionToDelete.id);

			// Update local state
			setPermissions(prev => prev.filter(p => p.id !== permissionToDelete.id));

			// Remove from edited permissions if present
			if (editedPermissions[permissionToDelete.id]) {
				const newEditedPermissions = { ...editedPermissions };
				delete newEditedPermissions[permissionToDelete.id];
				setEditedPermissions(newEditedPermissions);
			}

			// Close the confirmation modal
			setShowDeleteConfirmModal(false);
			setPermissionToDelete(null);
		} catch (error) {
			console.error("Error removing user permission:", error);
		} finally {
			setIsLoadingPermissions(false);
		}
	};

	// Get users not already in permissions list
	const getAvailableUsers = () => {
		if (!userList) return [];

		const existingUserEmails = permissions.map(p => p.user_email);

		return userList.filter(user => {
			const email = user.email.split('@')[0].toLowerCase();
			return !existingUserEmails.includes(email);
		});
	};

	// Add function to fetch logs
	const fetchLogs = async () => {
		try {
			setIsLoadingLogs(true);
			const notificationsData = await getNotificationsByUser(currentUser.email);

			// Filter only notifications that are logs and should be shown
			const logNotifications = notificationsData.filter(noti => noti.show && noti.isLog);

			setLogs(logNotifications);
		} catch (error) {
			console.error("Error fetching logs:", error);
		} finally {
			setIsLoadingLogs(false);
		}
	};

	// Add toggle function for logs
	const toggleLogs = () => {
		setShowLogs(!showLogs);

		// If opening the dropdown, fetch fresh logs
		if (!showLogs) {
			fetchLogs();
		}
	};

	return (
		<div className={styles.headerContainer}>
			<div className={styles.backCanvas}
				onClick={  () =>
					(window.location.href = `${import.meta.env.VITE_DOMAIN_URL}/canvas`)
				}
			>
				<div>
				<BackCanvas height={20} width={20}/>
				</div>
			</div>
			<div className={styles.headerLogo}>Gateway Dashboard</div>

			<div className={styles.headerControls}>
				{/* Company dropdown */}
				<div className={styles.dropdownContainer} ref={dropdownRef}>
					<button className={styles.dropdownButton} onClick={toggleDropdown}>
						{selectedCompanyName}
						<ChevronDown size={16} className={styles.dropdownIcon} />
					</button>

					{showDropdown && (
						<div className={styles.dropdownMenu}>
							{companyList.map((company) => (
								<div
									key={company.id}
									className={`${styles.dropdownItem} ${selectedCompany === company.id ? styles.selected : ''
										}`}
									onClick={() => handleCompanySelect(company.id)}
								>
									{company.name}
								</div>
							))}
						</div>
					)}
				</div>

				{/* Company settings button */}
				{/* <button
					className={styles.settingsButton}
					onClick={toggleSettingsModal}
					title="Quản lý công ty"
				>
					<Settings size={20} />
				</button> */}
			</div>

			<div className={styles.spacer}></div>

			{/* Admin icon (only visible for admins) */}
			{currentUser?.isAdmin && (
				<div className={styles.adminContainer} ref={adminDropdownRef}>
					<button className={styles.adminButton} onClick={toggleAdminDropdown} title="Admin Settings">
						<Shield size={20} />
					</button>

					{showAdminDropdown && (
						<div className={styles.adminDropdownMenu}>
							<div className={styles.dropdownItem} onClick={openPermissionsModal}>
								<Users size={16} className={styles.dropdownItemIcon} />
								<span>Manage User Permissions</span>
							</div>
							{/* You can add more admin options here */}
						</div>
					)}
				</div>
			)}

			{/* Notification bell */}
			<div className={styles.notificationContainer} ref={notificationRef}>
				<button className={styles.notificationButton} onClick={toggleNotifications}>
					<Bell size={20} />
					{unreadCount > 0 && (
						<span className={styles.notificationBadge}>{unreadCount}</span>
					)}
				</button>

				{showNotifications && (
					<div className={styles.notificationDropdown}>
						<div className={styles.notificationHeader}>
							<h3>Thông báo</h3>
							{unreadCount > 0 && (
								<button
									className={styles.markAllReadButton}
									onClick={markAllAsRead}
								>
									Đánh dấu tất cả đã đọc
								</button>
							)}
						</div>

						<div className={styles.notificationList}>
							{isLoadingNotifications ? (
								<div className={styles.loadingNotifications}>
									Đang tải thông báo...
								</div>
							) : notifications.length === 0 ? (
								<div className={styles.emptyNotifications}>
									Không có thông báo nào
								</div>
							) : (
								notifications.map(notification => (
									<div
										key={notification.id}
										className={`${styles.notificationItem} ${notification.read ? styles.notificationRead : ''} ${isLoadingTicket ? styles.loading : ''}`}
										onClick={() => handleNotificationClick(notification)}
									>
										<div className={styles.notificationContent}>
											<div className={styles.notificationItemHeader}>
												<span className={styles.notificationTicket}>
													Ticket #{notification.ticket_id}
												</span>
												<span className={styles.notificationTime}>
													{formatTimeAgo(notification.createdAt)}
												</span>
											</div>
											<div className={styles.notificationMessage}>
												<span className={styles.notificationUser}>
													{notification.userNoti}
												</span> {notification.content}
											</div>
										</div>
										{!notification.read && (
											<div className={styles.unreadDot}></div>
										)}
										{isLoadingTicket && (
											<div className={styles.loadingOverlay}>
												<div className={styles.loadingSpinner}></div>
											</div>
										)}
									</div>
								))
							)}
						</div>
					</div>
				)}
			</div>

			{/* Logs */}
			<div className={styles.notificationContainer} ref={logRef}>
				<button className={styles.notificationButton} onClick={toggleLogs}>
					<History size={20} />
				</button>

				{showLogs && (
					<div className={styles.notificationDropdown}>
						<div className={styles.notificationHeader}>
							<h3>Lịch sử hoạt động</h3>
						</div>

						<div className={styles.notificationList}>
							{isLoadingLogs ? (
								<div className={styles.loadingNotifications}>
									Đang tải lịch sử...
								</div>
							) : logs.length === 0 ? (
								<div className={styles.emptyNotifications}>
									Không có hoạt động nào
								</div>
							) : (
								logs.map(log => (
									<div
										key={log.id}
										className={`${styles.notificationItem} ${log.read ? styles.notificationRead : ''}`}
										onClick={() => handleNotificationClick(log)}
									>
										<div className={styles.notificationContent}>
											<div className={styles.notificationItemHeader}>
												<span className={styles.notificationTicket}>
													Ticket #{log.ticket_id}
												</span>
												<span className={styles.notificationTime}>
													{formatTimeAgo(log.createdAt)}
												</span>
											</div>
											<div className={styles.notificationMessage}>
												<span className={styles.notificationUser}>
													{log.userNoti}
												</span> {log.content}
											</div>
										</div>
										{!log.read && (
											<div className={styles.unreadDot}></div>
										)}
									</div>
								))
							)}
						</div>
					</div>
				)}
			</div>

			{/* User profile dropdown */}
			<div className={styles.userDropdownContainer} ref={userDropdownRef}>
				<button className={styles.userButton} onClick={toggleUserDropdown}>
					{currentUser?.picture ? (
						<img
							src={currentUser.picture}
							alt={currentUser.name || 'User'}
							className={styles.userAvatar}
							onError={(e) => {
								e.target.style.display = 'none';
								e.target.parentNode.innerHTML = getUserInitial();
							}}
						/>
					) : (
						<div className={styles.userAvatarFallback}>{getUserInitial()}</div>
					)}
				</button>

				{showUserDropdown && (
					<div className={styles.userDropdownMenu}>
						<div className={styles.userInfo}>
							<div className={styles.userName}>
								{currentUser?.nickName || currentUser?.name || 'User'}
							</div>
							<div className={styles.userEmail}>{currentUser?.email || ''}</div>
						</div>
						<div className={styles.dropdownDivider}></div>
						<div className={styles.dropdownItem} onClick={openAccountSettingsModal}>
							<User size={16} className={styles.dropdownItemIcon} />
							<span>Cài đặt tài khoản</span>
						</div>
						<div className={styles.dropdownItem} onClick={handleLogout}>
							<LogOut size={16} className={styles.dropdownItemIcon} />
							<span>Đăng xuất</span>
						</div>
					</div>
				)}
			</div>

			{/* Account Settings Modal */}
			{showAccountSettingsModal && (
				<div className={styles.modalOverlay} onClick={closeAccountSettingsModal}>
					<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
						<div className={styles.modalHeader}>
							<h3>Cài đặt tài khoản</h3>
							<button
								className={styles.closeButton}
								onClick={closeAccountSettingsModal}
							>
								<X size={20} />
							</button>
						</div>

						<div className={styles.modalBody}>
							{updateError && (
								<div className={styles.errorMessage}>{updateError}</div>
							)}

							{updateSuccess && (
								<div className={styles.successMessage}>{updateSuccess}</div>
							)}

							<form onSubmit={handleUpdateNickname}>
								<div className={styles.formGroup}>
									<label htmlFor="nickname">Tên hiển thị</label>
									<input
										type="text"
										id="nickname"
										value={nickname}
										onChange={(e) => setNickname(e.target.value)}
										placeholder="Nhập tên hiển thị"
										disabled={isUpdating}
									/>
									<small>
										Tên này sẽ hiển thị trong các tin nhắn và ticket của bạn
									</small>
								</div>

								{/* Add new email notification settings while maintaining the original layout */}
								<div className={styles.formGroup}>
									<div className={styles.checkboxContainer}>
										<div className={styles.checkboxWrapper}>
											<input
												type="checkbox"
												id="emailNotifications"
												checked={isSendEmail}
												onChange={(e) => setIsSendEmail(e.target.checked)}
												disabled={isUpdating}
												className={styles.checkbox}
											/>
											<div className={styles.checkboxLabelContainer}>
												<label htmlFor="emailNotifications" className={styles.checkboxLabel}>
													Nhận thông báo thay đổi trạng thái qua email
												</label>
												<span className={styles.checkboxDescription}>
													Bạn sẽ nhận được email thông báo khi trạng thái ticket thay đổi
												</span>
											</div>
										</div>
									</div>
								</div>

								<div className={styles.formGroup}>
									<div className={styles.checkboxContainer}>
										<div className={styles.checkboxWrapper}>
											<input
												type="checkbox"
												id="emailMessageNotifications"
												checked={isSendEmailMessage}
												onChange={(e) => setIsSendEmailMessage(e.target.checked)}
												disabled={isUpdating}
												className={styles.checkbox}
											/>
											<div className={styles.checkboxLabelContainer}>
												<label htmlFor="emailMessageNotifications" className={styles.checkboxLabel}>
													Nhận thông báo tin nhắn qua email
												</label>
												<span className={styles.checkboxDescription}>
													Bạn sẽ nhận được email thông báo khi có người nhắc đến bạn trong tin nhắn
												</span>
											</div>
										</div>
									</div>
								</div>

								<div className={styles.modalFooter}>
									<button
										type="button"
										className={styles.cancelButton}
										onClick={closeAccountSettingsModal}
										disabled={isUpdating}
									>
										Hủy
									</button>
									<button
										type="submit"
										className={styles.saveButton}
										disabled={isUpdating}
									>
										{isUpdating ? (
											<span className={styles.spinner}></span>
										) : (
											<>
												<Save size={16} />
												Lưu thay đổi
											</>
										)}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}

			{/* Company Settings Modal */}
			{showSettingsModal && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContent}>
						<div className={styles.modalHeader}>
							<h3>Quản lý công ty</h3>
							<button className={styles.closeButton} onClick={toggleSettingsModal}>
								<X size={20} />
							</button>
						</div>

						<div className={styles.modalBody}>
							{/* Add new company section */}
							<div className={styles.addCompanySection}>
								<h4>Thêm công ty mới</h4>
								{error && <div className={styles.errorMessage}>{error}</div>}
								<div className={styles.addCompanyForm}>
									<input
										type="text"
										placeholder="Nhập tên công ty mới"
										value={newCompanyName}
										onChange={(e) => setNewCompanyName(e.target.value)}
										className={styles.companyInput}
										disabled={isLoading}
									/>
									<button
										onClick={addCompany}
										className={styles.addButton}
										disabled={isLoading}
									>
										{isLoading ? (
											<span className={styles.buttonLoader}></span>
										) : (
											<Plus size={18} />
										)}
									</button>
								</div>
							</div>

							{/* Company list section */}
							<div className={styles.companyListSection}>
								<h4>Danh sách công ty</h4>
								{companyList.length === 0 ? (
									<div className={styles.noCompanies}>Chưa có công ty nào</div>
								) : (
									<div className={styles.companyList}>
										{companyList.map((company) => (
											<div key={company.id} className={styles.companyItem}>
												{editCompanyId === company.id ? (
													<div className={styles.editCompanyForm}>
														<input
															type="text"
															value={editCompanyName}
															onChange={(e) =>
																setEditCompanyName(e.target.value)
															}
															className={styles.editCompanyInput}
															disabled={isLoading}
														/>
														<div className={styles.editActions}>
															<button
																onClick={() =>
																	saveEditCompany(company.id)
																}
																className={styles.saveButton}
																title="Lưu"
																disabled={isLoading}
															>
																{isLoading ? '...' : 'Lưu'}
															</button>
															<button
																onClick={cancelEditCompany}
																className={styles.cancelButton}
																title="Hủy"
																disabled={isLoading}
															>
																Hủy
															</button>
														</div>
													</div>
												) : (
													<>
														<span className={styles.companyName}>
															{company.name}
														</span>
														<div className={styles.companyActions}>
															<button
																onClick={() =>
																	startEditCompany(company)
																}
																className={styles.editButton}
																title="Sửa"
																disabled={isLoading}
															>
																<Edit2 size={16} />
															</button>
															<button
																onClick={() =>
																	removeCompany(company.id)
																}
																className={styles.removeButton}
																title="Xóa"
																disabled={isLoading}
															>
																<X size={16} />
															</button>
														</div>
													</>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Permissions Management Modal */}
			{showPermissionModal && (
				<div className={styles.modalOverlay} onClick={(e) => {
					if (e.target === e.currentTarget) {
						closePermissionsModal();
					}
				}}>
					<div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ width: '80%', maxWidth: '800px' }}>
						<div className={styles.modalHeader}>
							<h3><Users size={18} className={styles.modalHeaderIcon} /> Manage User Permissions</h3>
							<button
								className={styles.closeButton}
								onClick={closePermissionsModal}
							>
								<X size={20} />
							</button>
						</div>

						<div className={styles.modalBody}>
							{/* Company selector - convert value to integer when setting */}
							<div className={styles.formGroup}>
								<label><Building size={16} className={styles.formIcon} /> Select Company</label>
								<div className={styles.selectWrapper}>
									<select
										value={selectedCompanyForPermissions}
										onChange={(e) => handleCompanyPermissionSelect(e.target.value)}
										disabled={isLoadingPermissions}
										className={styles.companySelect}
									>
										{companyList.map(company => (
											<option key={company.id} value={parseInt(company.id, 10)}>
												{company.name}
											</option>
										))}
									</select>
									<ChevronDown size={16} className={styles.selectIcon} />
								</div>
							</div>

							{/* Add new user */}
							<div className={styles.addUserForm}>
								<h4><UserPlus size={16} className={styles.sectionIcon} /> Add User</h4>
								<div className={styles.addUserControls}>
									<div className={styles.selectWrapper} style={{ flexGrow: 1 }}>
										<select
											value={selectedUserToAdd}
											onChange={(e) => setSelectedUserToAdd(e.target.value)}
											disabled={isLoadingPermissions}
											className={styles.userSelect}
										>
											<option value="">Select a user</option>
											{getAvailableUsers().map(user => {
												const username = user.email.split('@')[0].toLowerCase();
												return (
													<option key={user.email} value={username}>
														{username} ({user.email})
													</option>
												);
											})}
										</select>
										<ChevronDown size={16} className={styles.selectIcon} />
									</div>
									<button
										onClick={addUserPermission}
										disabled={!selectedUserToAdd || isLoadingPermissions}
										className={styles.addUserButton}
									>
										<Plus size={16} /> Add User
									</button>
								</div>
							</div>

							{/* User permissions table */}
							<div className={styles.permissionsTable}>
								<div className={styles.tableHeader}>
									<div className={styles.tableHeaderCell}>
										<User size={16} className={styles.tableHeaderIcon} /> User
									</div>
									<div className={styles.tableHeaderCell}>
										<Edit2 size={16} className={styles.tableHeaderIcon} /> Editor
									</div>
									<div className={styles.tableHeaderCell}>
										<RefreshCw size={16} className={styles.tableHeaderIcon} /> Reset Status
									</div>
									<div className={styles.tableHeaderCell}>
										<Check size={16} className={styles.tableHeaderIcon} /> Confirm
									</div>
									<div className={styles.tableHeaderCell}>
										<User size={16} className={styles.tableHeaderIcon} /> Guest
									</div>
									<div className={styles.tableHeaderCell}>
										Actions
									</div>
								</div>

								{isLoadingPermissions ? (
									<div className={styles.loadingPermissions}>
										<div className={styles.spinner}></div> Loading permissions...
									</div>
								) : permissions.length === 0 ? (
									<div className={styles.noPermissions}>
										No users with permissions for this company
									</div>
								) : (
									<div className={styles.tableBody}>
										{permissions.map(permission => {
											const isEdited = !!editedPermissions[permission.id];
											const isEditor = getPermissionValue(permission, 'isEditor');
											const canResetStatus = getPermissionValue(permission, 'isResetStatus');
											const canConfirm = getPermissionValue(permission, 'isConfirm');
											const isGuest = getPermissionValue(permission, 'isGuest');

											return (
												<div key={permission.id} className={`${styles.tableRow} ${isEdited ? styles.editedRow : ''}`}>
													<div className={styles.tableCell}>
														<span className={styles.userEmail}>{permission.user_email}</span>
													</div>
													<div className={styles.tableCell}>
														<input
															type="checkbox"
															checked={isEditor}
															onChange={() => toggleEditorPermission(permission)}
															disabled={isLoadingPermissions}
															className={styles.permissionCheckbox}
														/>
													</div>
													<div className={styles.tableCell}>
														<input
															type="checkbox"
															checked={canResetStatus}
															disabled={!isEditor || isLoadingPermissions}
															onChange={() => toggleResetStatusPermission(permission)}
															className={styles.permissionCheckbox}
														/>
													</div>
													<div className={styles.tableCell}>
														<input
															type="checkbox"
															checked={canConfirm}
															onChange={() => toggleConfirmPermission(permission)}
															disabled={isLoadingPermissions}
															className={styles.permissionCheckbox}
														/>
													</div>
													<div className={styles.tableCell}>
														<input
															type="checkbox"
															checked={isGuest}
															onChange={() => toggleGuestPermission(permission)}
															disabled={isLoadingPermissions}
															className={styles.permissionCheckbox}
														/>
													</div>
													<div className={styles.tableCell}>
														<button
															className={styles.removeButton}
															onClick={() => confirmDeletePermission(permission)}
															disabled={isLoadingPermissions}
															title="Remove user"
														>
															<Trash2 size={16} className={styles.removeIcon} />
														</button>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>

							{/* Save changes button */}
							{permissionsChanged && (
								<div className={styles.saveChangesContainer}>
									<button
										className={styles.saveChangesButton}
										onClick={savePermissionChanges}
										disabled={isLoadingPermissions}
									>
										<Save size={16} /> Save Changes
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteConfirmModal && (
				<div className={styles.modalOverlay}>
					<div className={styles.confirmModalContent} onClick={(e) => e.stopPropagation()}>
						<div className={styles.confirmModalHeader}>
							<h3><Trash2 size={18} className={styles.modalHeaderIcon} /> Confirm Removal</h3>
						</div>

						<div className={styles.confirmModalBody}>
							<p>Are you sure you want to remove <strong>{permissionToDelete?.user_email}</strong>'s permissions?</p>
							<p>This action cannot be undone.</p>
						</div>

						<div className={styles.confirmModalFooter}>
							<button
								className={styles.cancelButton}
								onClick={cancelDeletePermission}
								disabled={isLoadingPermissions}
							>
								Cancel
							</button>
							<button
								className={styles.deleteButton}
								onClick={executeDeletePermission}
								disabled={isLoadingPermissions}
							>
								{isLoadingPermissions ? (
									<><div className={styles.smallSpinner}></div> Removing...</>
								) : (
									<>Remove</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default Header;
