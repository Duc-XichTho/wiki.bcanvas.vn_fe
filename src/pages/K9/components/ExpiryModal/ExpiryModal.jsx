import React, { useEffect, useContext, useState } from 'react';
import { Modal, Button, Typography, Space, Alert } from 'antd';
import {
	ExclamationCircleOutlined,
	ClockCircleOutlined,
	WarningOutlined,
	CalendarOutlined,
	UserOutlined,
	LockOutlined,
	InfoCircleOutlined,
	LogoutOutlined,
} from '@ant-design/icons';
import styles from './ExpiryModal.module.css';
import { logout } from '../../../../apis/userService';
import { MyContext } from '../../../../MyContext.jsx';

const { Title, Text, Paragraph } = Typography;

const ExpiryModal = ({}) => {
	const { currentUser } = useContext(MyContext);
	const [expiryModalVisible, setExpiryModalVisible] = useState(false);
	const [expiryModalType, setExpiryModalType] = useState('no_setup');
	const [userTimeInfo, setUserTimeInfo] = useState(null);
	const checkUserTimeAccess = () => {
		if (!currentUser) return { canAccess: false, type: 'no_setup', userInfo: null };

		// Admin có quyền truy cập không giới hạn
		if (currentUser.isAdmin) {
			return { canAccess: true, type: null, userInfo: null };
		}

		try {
			if (currentUser.info) {
				const userTimeInfo = typeof currentUser.info === 'string' ? JSON.parse(currentUser.info) : currentUser.info;
				// Kiểm tra xem user đã được setup thời gian chưa
				if (!userTimeInfo.startDate || !userTimeInfo.durationDays || !userTimeInfo.expiryDate) {
					return {
						canAccess: false,
						type: 'no_setup',
						userInfo: userTimeInfo,
					};
				}

				// Kiểm tra xem đã đến ngày bắt đầu chưa
				const now = new Date();
				const startDate = new Date(userTimeInfo.startDate);
				const expiryDate = new Date(userTimeInfo.expiryDate);

				// Nếu chưa đến ngày bắt đầu
				if (now < startDate) {
					return {
						canAccess: false,
						type: 'not_started',
						userInfo: userTimeInfo,
					};
				}

				// Nếu đã hết hạn
				if (now > expiryDate) {
					return {
						canAccess: false,
						type: 'expired',
						userInfo: userTimeInfo,
					};
				}

				// Có thể truy cập
				return { canAccess: true, type: null, userInfo: userTimeInfo };
			}
		} catch (error) {
			console.warn('Error checking user time access:', error);
		}

		// Mặc định không có quyền truy cập nếu không có thông tin
		return { canAccess: false, type: 'no_setup', userInfo: null };
	};


	useEffect(() => {
		if (currentUser) {
			const accessCheck = checkUserTimeAccess();

			if (!accessCheck.canAccess) {
				setExpiryModalType(accessCheck.type);
				setUserTimeInfo(accessCheck.userInfo);
				setExpiryModalVisible(true);
			} else {
				setExpiryModalVisible(false);
			}
		}
	}, [currentUser]);

	// Chặn F12 và các phím tắt khác
	useEffect(() => {
		if (expiryModalVisible) {
			const handleKeyDown = (e) => {
				// Chặn F12
				if (e.keyCode === 123) {
					e.preventDefault();
					return false;
				}

				// Chặn Ctrl+Shift+I (Developer Tools)
				if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
					e.preventDefault();
					return false;
				}

				// Chặn Ctrl+Shift+J (Console)
				if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
					e.preventDefault();
					return false;
				}

				// Chặn Ctrl+U (View Source)
				if (e.ctrlKey && e.keyCode === 85) {
					e.preventDefault();
					return false;
				}

				// Chặn Ctrl+Shift+C (Inspect Element)
				if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
					e.preventDefault();
					return false;
				}

				// Chặn Escape key
				if (e.keyCode === 27) {
					e.preventDefault();
					return false;
				}
			};

			const handleContextMenu = (e) => {
				e.preventDefault();
				return false;
			};

			document.addEventListener('keydown', handleKeyDown);
			document.addEventListener('contextmenu', handleContextMenu);

			// Disable right click
			document.addEventListener('selectstart', (e) => e.preventDefault());
			document.addEventListener('dragstart', (e) => e.preventDefault());

			return () => {
				document.removeEventListener('keydown', handleKeyDown);
				document.removeEventListener('contextmenu', handleContextMenu);
			};
		};
	}, [expiryModalVisible]);

	const getModalContent = () => {
		if (expiryModalType === 'no_setup') {
			return {
				icon: <UserOutlined className={styles.iconWarning} />,
				title: 'Tài khoản chưa được thiết lập thời gian sử dụng',
				subtitle: 'Vui lòng liên hệ quản trị viên để được cấp quyền truy cập',
				description: 'Tài khoản của bạn hiện chưa có thông tin về thời gian sử dụng. Để tiếp tục sử dụng hệ thống Visao, bạn cần được quản trị viên thiết lập thời hạn sử dụng.',
				alertType: 'warning',
				alertMessage: 'Tài khoản chưa được cấu hình thời gian sử dụng',
				color: '#faad14',
			};
		} else if (expiryModalType === 'expired') {
			return {
				icon: <ClockCircleOutlined className={styles.iconExpired} />,
				title: 'Tài khoản đã hết hạn sử dụng',
				subtitle: 'Vui lòng liên hệ quản trị viên để gia hạn tài khoản',
				description: `Tài khoản của bạn đã hết hạn vào ngày ${userTimeInfo?.expiryDate ? new Date(userTimeInfo.expiryDate).toLocaleDateString('vi-VN') : 'N/A'}. Để tiếp tục sử dụng hệ thống Visao, bạn cần được quản trị viên gia hạn tài khoản.`,
				alertType: 'error',
				alertMessage: 'Tài khoản đã hết hạn sử dụng',
				color: '#ff4d4f',
			};
		} else if (expiryModalType === 'not_started') {
			const startDate = userTimeInfo?.startDate ? new Date(userTimeInfo.startDate) : null;
			const now = new Date();
			const daysUntilStart = startDate ? Math.ceil((startDate - now) / (1000 * 60 * 60 * 24)) : 0;

			return {
				icon: <CalendarOutlined className={styles.iconInfo} />,
				title: 'Tài khoản chưa đến thời gian sử dụng',
				subtitle: 'Vui lòng đợi đến ngày bắt đầu để sử dụng hệ thống',
				description: `Tài khoản của bạn sẽ được kích hoạt vào ngày ${startDate ? startDate.toLocaleDateString('vi-VN') : 'N/A'}. Còn ${daysUntilStart} ngày nữa bạn có thể bắt đầu sử dụng hệ thống Visao.`,
				alertType: 'info',
				alertMessage: `Tài khoản sẽ được kích hoạt sau ${daysUntilStart} ngày`,
				color: '#1890ff',
			};
		}

		return {
			icon: <LockOutlined className={styles.iconLocked} />,
			title: 'Truy cập bị hạn chế',
			subtitle: 'Vui lòng liên hệ quản trị viên',
			description: 'Tài khoản của bạn hiện không thể truy cập hệ thống. Vui lòng liên hệ quản trị viên để được hỗ trợ.',
			alertType: 'error',
			alertMessage: 'Truy cập bị hạn chế',
			color: '#ff4d4f',
		};
	};

	const content = getModalContent();

	const handleLogout = async () => {
		await logout();
		window.location.href = '/';
	};

	return (
		<Modal
			open={expiryModalVisible}
			footer={null}
			closable={false}
			maskClosable={false}
			keyboard={false}
			width={600}
			centered
			className={styles.expiryModal}
			maskStyle={{
				backgroundColor: 'rgba(0, 0, 0, 0.85)',
				backdropFilter: 'blur(8px)',
			}}
		>
			<div className={styles.modalContent}>
				{/* Header với icon */}
				<div className={styles.modalHeader}>
					<div className={styles.iconContainer} style={{ backgroundColor: `${content.color}15` }}>
						{content.icon}
					</div>
					<Title level={3} className={styles.modalTitle}>
						{content.title}
					</Title>
				</div>

				{/* Alert */}
				<Alert
					message={content.alertMessage}
					type={content.alertType}
					showIcon
					className={styles.alert}
					icon={
						content.alertType === 'warning' ? <WarningOutlined /> :
							content.alertType === 'error' ? <ExclamationCircleOutlined /> :
								content.alertType === 'info' ? <InfoCircleOutlined /> :
									<ExclamationCircleOutlined />
					}
				/>

				{/* Content */}
				<div className={styles.modalBody}>
					<Paragraph className={styles.description}>
						{content.description}
					</Paragraph>

					{/* Thông tin tài khoản nếu có */}
					{userTimeInfo && (
						<div className={styles.userInfo}>
							<div className={styles.infoItem}>
								<CalendarOutlined className={styles.infoIcon} />
								<div className={styles.infoContent}>
									<Text strong>Ngày bắt đầu:</Text>
									<Text>{userTimeInfo.startDate ? new Date(userTimeInfo.startDate).toLocaleDateString('vi-VN') : 'Chưa thiết lập'}</Text>
								</div>
							</div>

							{userTimeInfo.expiryDate && (
								<div className={styles.infoItem}>
									<ClockCircleOutlined className={styles.infoIcon} />
									<div className={styles.infoContent}>
										<Text strong>Ngày hết hạn:</Text>
										<Text>{new Date(userTimeInfo.expiryDate).toLocaleDateString('vi-VN')}</Text>
									</div>
								</div>
							)}

							{userTimeInfo.durationDays && (
								<div className={styles.infoItem}>
									<UserOutlined className={styles.infoIcon} />
									<div className={styles.infoContent}>
										<Text strong>Thời hạn:</Text>
										<Text>{userTimeInfo.durationDays} ngày</Text>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Hướng dẫn */}
					<div className={styles.instructions}>
						<Title level={5} className={styles.instructionsTitle}>
							📞 Liên hệ hỗ trợ
						</Title>
						<Paragraph className={styles.instructionsText}>
							Để được hỗ trợ và cấp quyền truy cập, vui lòng liên hệ:
						</Paragraph>
						<ul className={styles.contactList}>
							<li>📧 Email: support@visao.com</li>
							<li>📱 Hotline: 1900-xxxx</li>
							<li>💬 Zalo: Visao Support</li>
						</ul>
					</div>
				</div>

				{/* Footer */}
				<div className={styles.modalFooter}>
					<div className={styles.footerActions}>
						<Button
							type='default'
							icon={<LogoutOutlined />}
							onClick={handleLogout}
							className={styles.logoutButton}
						>
							Đăng xuất
						</Button>
					</div>
					<div className={styles.footerNote}>
						<LockOutlined /> Hệ thống đã được bảo vệ - Không thể đóng thông báo này
					</div>
				</div>
			</div>
		</Modal>
	);
};

export default ExpiryModal; 