import React, { useState, useEffect, useContext } from 'react';
import { MyContext } from '../../../MyContext';
import { getSettingByType } from '../../../apis/settingService';
import { Button, Modal, Form, Input, Select, message, Popconfirm, Card, Space, Tag, List, Collapse, Alert } from 'antd';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	SearchOutlined,
	BookOutlined,
	DownOutlined,
	UpOutlined,
	SaveOutlined,
	FileTextOutlined,
	MenuOutlined,
} from '@ant-design/icons';
import { Sparkles } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import styles from '../K9.module.css';
import { createThesis, deleteThesis, getAllThesis, updateThesis } from '../../../apis/serviceApi/k9Service.jsx';
import { aiGen } from '../../../apis/botService.jsx';

const { TextArea } = Input;
const { Option } = Select;

const ThesisTab = ({ currentPrompt }) => {
	const { currentUser } = useContext(MyContext);
	const [thesisList, setThesisList] = useState([]);
	const [loading, setLoading] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [editingThesis, setEditingThesis] = useState(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [form] = Form.useForm();
	const [editingChatIndex, setEditingChatIndex] = useState(null);
	const [showAddChatForm, setShowAddChatForm] = useState(false);
	const [chatForm] = Form.useForm();
	const [generatingSummary, setGeneratingSummary] = useState(false);
	const [generatingThesisSummary, setGeneratingThesisSummary] = useState(false);
	const [selectedThesis, setSelectedThesis] = useState(null);
	const [summaryModalVisible, setSummaryModalVisible] = useState(false);
	const [editingSummary, setEditingSummary] = useState('');
	const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 768);
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
	const [isUpdating, setIsUpdating] = useState(false); // Flag để tránh multiple updates

	useEffect(() => {
		loadThesis();
	}, []);

	useEffect(() => {
		const handleResize = () => {
			const newIsMobile = window.innerWidth <= 768;
			setIsMobile(newIsMobile);
			setSidebarCollapsed(newIsMobile);
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
	const closeSidebar = () => isMobile && setSidebarCollapsed(true);

	const formatDate = (date) => {
		return new Date(date).toLocaleDateString('vi-VN', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	// Refresh thesis data safely
	const refreshThesisData = async () => {
		try {
			const data = await getAllThesis();
			const allThesis = Array.isArray(data) ? data : (data?.data || data?.thesis || []);
			const thesisArray = allThesis.filter(item => item.userCreated === currentUser?.email || item.userCreated === currentUser?.id);
			setThesisList(thesisArray);

			// Cập nhật selectedThesis với dữ liệu mới nhất
			if (selectedThesis && thesisArray.length > 0) {
				const updatedSelectedThesis = thesisArray.find(thesis => thesis.id === selectedThesis.id);
				if (updatedSelectedThesis) {
					setSelectedThesis(updatedSelectedThesis);
					// Cập nhật editingThesis nếu đang edit
					if (editingThesis && editingThesis.id === selectedThesis.id) {
						setEditingThesis(updatedSelectedThesis);
					}
				}
			}
		} catch (error) {
			console.error('Error refreshing thesis data:', error);
		}
	};

	// Refresh thesis data without overwriting current state
	const refreshThesisDataWithoutOverwrite = async () => {
		try {
			const data = await getAllThesis();
			const allThesis = Array.isArray(data) ? data : (data?.data || data?.thesis || []);
			const thesisArray = allThesis.filter(item => item.userCreated === currentUser?.email || item.userCreated === currentUser?.id);

			setThesisList(thesisArray);

			// Chỉ cập nhật selectedThesis nếu không đang edit
			if (selectedThesis && !editingThesis && thesisArray.length > 0) {
				const updatedSelectedThesis = thesisArray.find(thesis => thesis.id === selectedThesis.id);
				if (updatedSelectedThesis) {
					setSelectedThesis(updatedSelectedThesis);
				}
			}
		} catch (error) {
			console.error('Error refreshing thesis data:', error);
		}
	};

	// Load thesis data
	const loadThesis = async () => {
		setLoading(true);
		try {
			const data = await getAllThesis();

			// Ensure data is an array
			const allThesis = Array.isArray(data) ? data : (data?.data || data?.thesis || []);

			const thesisArray = allThesis.filter(item => item.userCreated === currentUser?.email || item.userCreated === currentUser?.id);

			console.log('Loaded thesis data:', thesisArray);

			setThesisList(thesisArray);

			// Cập nhật selectedThesis nếu đã có thesis được chọn
			if (selectedThesis && thesisArray.length > 0) {
				const updatedSelectedThesis = thesisArray.find(thesis => thesis.id === selectedThesis.id);
				if (updatedSelectedThesis) {
					setSelectedThesis(updatedSelectedThesis);
				}
			} else if (thesisArray.length > 0 && !selectedThesis) {
				// Select first thesis if none selected
				setSelectedThesis(thesisArray[0]);
			}
		} catch (error) {
			message.error('Không thể tải danh sách thesis');
			console.error('Error loading thesis:', error);
			setThesisList([]);
		} finally {
			setLoading(false);
		}
	};


	useEffect(() => {
		loadThesis();
	}, []);


	// Search thesis
	const handleSearch = async () => {
		if (!searchTerm.trim()) {
			loadThesis();
			return;
		}

		setLoading(true);
		try {
			const data = await searchThesis(searchTerm);
			// Ensure data is an array
			const thesisArray = Array.isArray(data) ? data : (data?.data || data?.thesis || []);
			setThesisList(thesisArray);

			// Select first thesis from search results if none selected
			if (thesisArray.length > 0 && !selectedThesis) {
				setSelectedThesis(thesisArray[0]);
			}
		} catch (error) {
			message.error('Lỗi tìm kiếm thesis');
			console.error('Error searching thesis:', error);
			setThesisList([]);
		} finally {
			setLoading(false);
		}
	};

	// Hàm tạo tên thesis mặc định
	const getDefaultThesisName = (date = new Date()) => {
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		return `Sổ ngày ${day}/${month}/${year}`;
	};

	// Create/Update thesis
	const handleSubmit = async (values) => {
		try {
			if (editingThesis) {
				// Cập nhật thesis hiện có
				const response = await updateThesis(editingThesis.id, {
					...editingThesis,
					...values,
					name: values.name || editingThesis.name || getDefaultThesisName(),
					updateAt: new Date().toISOString(),
				});
				console.log('Saved thesis after update:', response);

				// Cập nhật state với dữ liệu trả về từ server
				const finalThesis = response?.data;
				setSelectedThesis(finalThesis);
				setEditingThesis(finalThesis);

				message.success('Cập nhật sổ ngày thành công');
			} else {
				// Tạo thesis mới với list_chat rỗng
				const response = await createThesis({
					content: '',
					summary: '',
					name: values.name || getDefaultThesisName(), // Lưu tên thesis
					userCreated: currentUser?.email || currentUser?.id,
					list_chat: [],
				});
				console.log('Created new thesis:', response);

				// Cập nhật state với dữ liệu trả về từ server
				const newThesis = response?.data;
				setSelectedThesis(newThesis);

				message.success('Tạo sổ ngày thành công');
			}

			setModalVisible(false);
			setEditingThesis(null);
			setEditingChatIndex(null);
			form.resetFields();
			chatForm.resetFields();
			await refreshThesisData();
		} catch (error) {
			message.error(editingThesis ? 'Lỗi cập nhật thesis' : 'Lỗi tạo thesis');
			console.error('Error submitting thesis:', error);
		}
	};

	// Delete thesis
	const handleDelete = async (id) => {
		try {
			await deleteThesis(id);
			message.success('Xóa sổ ngày thành công');

			// If deleted thesis was selected, clear selection
			if (selectedThesis && selectedThesis.id === id) {
				setSelectedThesis(null);
			}

			loadThesis();
		} catch (error) {
			message.error('Lỗi xóa thesis');
			console.error('Error deleting thesis:', error);
		}
	};

	// Edit thesis
	const handleEdit = (thesis) => {
		setEditingThesis(thesis);
		setEditingChatIndex(null);
		setShowAddChatForm(false);
		form.resetFields();
		form.setFieldsValue({
			name: thesis.name || '',
		});
		chatForm.resetFields();
		setModalVisible(true);
	};

	// Add new chat
	const handleAddChat = () => {
		console.log('handleAddChat called');
		setEditingChatIndex(null);
		setShowAddChatForm(true);
		chatForm.resetFields();
		console.log('Form reset, editingChatIndex set to null, showAddChatForm set to true');
	};

	// Edit chat
	const handleEditChat = (chat, index) => {
		setEditingChatIndex(index);
		setShowAddChatForm(false);
		chatForm.setFieldsValue({
			content: chat.content,
			summary: chat.summary,
		});
	};

	// Save chat
	const handleSaveChat = async (values) => {
		console.log('handleSaveChat called with values:', values);
		console.log('Current state:', { editingThesis, selectedThesis, editingChatIndex, showAddChatForm });

		// Xác định target thesis
		let targetThesis = null;
		if (editingThesis) {
			targetThesis = editingThesis;
			console.log('Using editingThesis as target');
		} else if (selectedThesis) {
			targetThesis = selectedThesis;
			console.log('Using selectedThesis as target');
		}

		console.log('targetThesis:', targetThesis);
		if (!targetThesis) {
			console.log('No target thesis found');
			message.error('Không tìm thấy sổ ngày để thêm chat');
			return;
		}

		// Tránh multiple updates
		if (isUpdating) {
			console.log('Update already in progress, skipping...');
			return;
		}

		setIsUpdating(true);
		try {
			const updatedListChat = [...(targetThesis.list_chat || [])];
			console.log('Original list_chat:', targetThesis.list_chat);
			console.log('Updated list_chat before modification:', updatedListChat);
			console.log('editingChatIndex:', editingChatIndex);

			if (editingChatIndex !== null) {
				// Cập nhật chat hiện có
				console.log('Updating existing chat at index:', editingChatIndex);
				updatedListChat[editingChatIndex] = {
					...updatedListChat[editingChatIndex],
					...values,
					updateAt: new Date().toISOString(), // Cập nhật updateAt khi sửa đoạn
				};
			} else {
				// Thêm chat mới
				console.log('Adding new chat');
				const newOrder = updatedListChat.length + 1;
				const newChat = {
					order: newOrder,
					...values,
					updateAt: new Date().toISOString(), // Thêm updateAt cho đoạn mới
				};
				console.log('New chat object:', newChat);
				updatedListChat.push(newChat);
			}

			console.log('Final updatedListChat:', updatedListChat);

			const updatedThesis = {
				...targetThesis,
				list_chat: updatedListChat,
				updateAt: new Date().toISOString(),
			};

			// Gọi API update và đợi kết quả
			const response = await updateThesis(targetThesis.id, updatedThesis);
			console.log('Saved thesis after chat update:', response);

			// Cập nhật state với dữ liệu trả về từ server
			const finalThesis = response?.data;
			console.log('Final thesis after update:', finalThesis);

			// Cập nhật state ngay lập tức để UI phản hồi
			if (editingThesis) {
				setEditingThesis(finalThesis);
				console.log('Updated editingThesis');
			}
			setSelectedThesis(finalThesis);
			console.log('Updated selectedThesis');

			// Reset form và đóng modal
			setEditingChatIndex(null);
			setShowAddChatForm(false);
			chatForm.resetFields();

			// Hiển thị thông báo thành công
			const successMessage = editingChatIndex !== null ? 'Cập nhật chat thành công' : 'Thêm chat thành công';
			message.success(successMessage);
			console.log(successMessage);

			// Cập nhật thesisList để hiển thị đúng trong sidebar
			setThesisList(prevList => {
				const updatedList = prevList.map(thesis =>
					thesis.id === finalThesis.id ? finalThesis : thesis,
				);
				console.log('Updated thesisList:', updatedList);
				return updatedList;
			});

			// Refresh danh sách thesis sau một chút để đảm bảo UI đồng bộ
			setTimeout(async () => {
				await refreshThesisDataWithoutOverwrite();
			}, 500);
		} catch (error) {
			message.error('Lỗi khi lưu chat');
			console.error('Error saving chat:', error);
		} finally {
			setIsUpdating(false);
		}
	};

	// Delete chat
	const handleDeleteChat = async (index) => {
		const targetThesis = editingThesis || selectedThesis;
		if (!targetThesis) return;

		// Tránh multiple updates
		if (isUpdating) {
			console.log('Update already in progress, skipping...');
			return;
		}

		setIsUpdating(true);
		try {
			const updatedListChat = [...(targetThesis.list_chat || [])];
			updatedListChat.splice(index, 1);

			// Cập nhật lại order
			updatedListChat.forEach((chat, idx) => {
				chat.order = idx + 1;
			});

			const updatedThesis = {
				...targetThesis,
				list_chat: updatedListChat,
				updateAt: new Date().toISOString(),
			};

			// Gọi API update và đợi kết quả
			const response = await updateThesis(targetThesis.id, updatedThesis);
			console.log('Saved thesis after chat delete:', response);

			// Cập nhật state với dữ liệu trả về từ server
			const finalThesis = response?.data;
			if (editingThesis) {
				setEditingThesis(finalThesis);
			}
			setSelectedThesis(finalThesis);

			message.success('Xóa chat thành công');

			// Không cần refresh ngay lập tức vì đã cập nhật state với dữ liệu từ server
			// await refreshThesisData();
		} catch (error) {
			message.error('Lỗi khi xóa chat');
			console.error('Error deleting chat:', error);
		} finally {
			setIsUpdating(false);
		}
	};

	// Open create modal
	const handleCreate = () => {
		setEditingThesis(null);
		form.resetFields();
		form.setFieldsValue({
			name: getDefaultThesisName(),
		});
		setModalVisible(true);
	};

	// Close modal
	const handleCancel = () => {
		setModalVisible(false);
		setEditingThesis(null);
		form.resetFields();
	};

	// Open summary modal
	const handleOpenSummaryModal = () => {
		setEditingSummary(selectedThesis.summary || '');
		setSummaryModalVisible(true);
	};

	// Close summary modal
	const handleCloseSummaryModal = () => {
		setSummaryModalVisible(false);
		setEditingSummary('');
	};

	// Save summary
	const handleSaveSummary = async () => {
		try {
			const updatedThesis = {
				...selectedThesis,
				summary: editingSummary,
				updateAt: new Date().toISOString(),
			};

			// Gọi API update và đợi kết quả
			const response = await updateThesis(selectedThesis.id, updatedThesis);
			console.log('Saved thesis after summary update:', response);

			// Cập nhật state với dữ liệu trả về từ server
			const finalThesis = response?.data;
			setSelectedThesis(finalThesis);
			if (editingThesis && editingThesis.id === selectedThesis.id) {
				setEditingThesis(finalThesis);
			}

			message.success('Đã lưu tóm tắt thesis');

			// Không cần refresh ngay lập tức vì đã cập nhật state với dữ liệu từ server
			// await refreshThesisData();
			handleCloseSummaryModal();
		} catch (error) {
			message.error('Lỗi khi lưu tóm tắt');
			console.error('Error saving thesis summary:', error);
		}
	};

	// Get content preview
	const getContentPreview = (content) => {
		if (!content) return 'Không có nội dung';
		return content.length > 150 ? `${content.substring(0, 150)}...` : content;
	};

	// Get summary preview
	const getSummaryPreview = (summary) => {
		if (!summary) return 'Không có tóm tắt';
		return summary.length > 100 ? `${summary.substring(0, 100)}...` : summary;
	};

	// Function to generate AI summary
	const generateSummaryWithAI = async (content) => {
		if (!content || content.trim().length === 0) {
			message.warning('Vui lòng nhập nội dung trước khi tạo tóm tắt');
			return;
		}

		setGeneratingSummary(true);
		try {
			const prompt = `Hãy tạo một tóm tắt ngắn gọn và súc tích cho nội dung sau đây. Tóm tắt nên có độ dài khoảng 100-150 ký tự và nêu bật những điểm chính:

${content}

Tóm tắt:`;

			const response = await aiGen(
				prompt,
				'Bạn là một trợ lý AI chuyên tạo tóm tắt ngắn gọn và chính xác. Sử dụng ngôn ngữ Việt Nam, câu từ trịnh trọng.',
				'gemini-2.5-flash',
				'text',
			);

			if (response && response.result) {
				const aiSummary = response.result.trim();
				chatForm.setFieldValue('summary', aiSummary);
				message.success('Đã tạo tóm tắt thành công!');
			} else {
				message.error('Không thể tạo tóm tắt. Vui lòng thử lại.');
			}
		} catch (error) {
			console.error('Error generating summary:', error);
			message.error('Lỗi khi tạo tóm tắt. Vui lòng thử lại.');
		} finally {
			setGeneratingSummary(false);
		}
	};

	// Function to generate AI summary for entire thesis
	const handleGenerateThesisSummary = async () => {
		if (!selectedThesis || !selectedThesis.list_chat || selectedThesis.list_chat.length === 0) {
			message.warning('Không có nội dung chat để tạo tóm tắt');
			return;
		}

		setGeneratingThesisSummary(true);
		try {
			// Combine all chat content
			const allContent = selectedThesis.list_chat
				.sort((a, b) => a.order - b.order)
				.map(chat => `Đoạn ${chat.order}:\n${chat.content}`)
				.join('\n\n');
			console.log('All content:', allContent);

			// Sử dụng prompt từ props hoặc prompt mặc định
			const defaultPrompt = `Hãy tạo một tóm tắt tổng hợp và súc tích cho toàn bộ nội dung thesis sau đây. Tóm tắt nên có độ dài khoảng 200-300 ký tự và nêu bật những điểm chính, kết luận quan trọng:

{content}
Chỉ trả về câu tóm tắt, không có gì khác.`;

			const prompt = currentPrompt ? currentPrompt.replace('{content}', allContent) : defaultPrompt.replace('{content}', allContent);

			const response = await aiGen(
				prompt,
				'Bạn là một trợ lý AI chuyên tạo tóm tắt tổng hợp cho các thesis. Sử dụng ngôn ngữ Việt Nam, câu từ trịnh trọng và chuyên nghiệp.',
				'gpt-4.1-2025-04-14',
				'text',
			);
			console.log('Response:', response);
			if (response && response.result) {
				const thesisSummary = response.result.trim();
				console.log('Thesis summary:', thesisSummary);
				setEditingSummary(thesisSummary);

				// Cập nhật cả editingThesis.summary nếu đang trong edit mode
				if (editingThesis) {
					const updatedThesis = {
						...editingThesis,
						summary: thesisSummary,
					};
					setEditingThesis(updatedThesis);
				}

				// Tự động lưu summary vào database
				try {
					// Sử dụng thesis hiện tại (có thể là editingThesis hoặc selectedThesis)
					const currentThesis = editingThesis || selectedThesis;
					console.log('Current thesis for summary update:', currentThesis);

					const updatedThesis = {
						...currentThesis,
						summary: thesisSummary,
						updateAt: new Date().toISOString(),
					};
					console.log('Updated thesis for summary save:', updatedThesis);

					const response = await updateThesis(currentThesis.id, updatedThesis);
					console.log('Saved thesis after AI summary generation:', response);

					// Cập nhật state với dữ liệu trả về từ server
					const finalThesis = response?.data;
					console.log('Final thesis after summary update:', finalThesis);

					setSelectedThesis(finalThesis);
					if (editingThesis && editingThesis.id === currentThesis.id) {
						setEditingThesis(finalThesis);
					}

					// Cập nhật thesisList để đảm bảo sidebar hiển thị đúng
					setThesisList(prevList => {
						const updatedList = prevList.map(thesis =>
							thesis.id === finalThesis.id ? finalThesis : thesis,
						);
						return updatedList;
					});

					message.success('Đã tạo và lưu tóm tắt sổ ngày thành công!');
				} catch (error) {
					console.error('Error saving generated summary:', error);
					message.error('Đã tạo tóm tắt nhưng lưu thất bại');
				}
			} else {
				message.error('Không thể tạo tóm tắt thesis. Vui lòng thử lại.');
			}
		} catch (error) {
			console.error('Error generating thesis summary:', error);
			message.error('Lỗi khi tạo tóm tắt sổ ngày. Vui lòng thử lại.');
		} finally {
			setGeneratingThesisSummary(false);
		}
	};

	return (
		<div className={styles.thesisTab}>
			{/* Overlay for mobile when sidebar is open */}
			<div
				className={`${styles.sidebarOverlay} ${!sidebarCollapsed && isMobile ? styles.mobileOpen : ''}`}
				onClick={closeSidebar}
			/>
			<Button className={styles.thesisTitle}
					style={{ display: 'flex', alignItems: 'center', position: 'relative' }} onClick={toggleSidebar}>

				<BookOutlined style={{ marginRight: 8 }} />
				Quản lý Sổ ngày ({Array.isArray(thesisList) ? thesisList.length : 0} bài)
			</Button>
			<div className={styles.thesisLayout}>
				{/* Sidebar */}
				<div
					className={
						`${styles.thesisSidebar} ${sidebarCollapsed ? styles.collapsed : ''} ${!sidebarCollapsed && isMobile ? styles.mobileOpen : ''}`
					}
				>
					{/* Header */}
					<div className={styles.thesisHeader}>
						{/* Search */}
						<Input
							placeholder="Tìm kiếm sổ ngày..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onPressEnter={handleSearch}
							style={{ width: '70%', marginRight: '10px' }}
							suffix={
								<SearchOutlined
									onClick={handleSearch}
									style={{ cursor: 'pointer' }}
								/>
							}
						/>

						{/* Create button */}
						<Button
							type="primary"
							icon={<PlusOutlined />}
							onClick={handleCreate}
							style={{ width: '30%' }}
						>Sổ ngày
						</Button>

					</div>

					{/* Thesis List */}
					<div className={styles.thesisList}>
						{loading ? (
							<div className={styles.loadingContainer}>
								<div className={styles.loading}>Đang tải...</div>
							</div>
						) : (!Array.isArray(thesisList) || thesisList.length === 0) ? (
							<div className={styles.emptyContainer}>
								<BookOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
								<p>Chưa có sổ ngày nào</p>
								<Button type="primary" onClick={handleCreate}>
									Tạo sổ ngày đầu tiên
								</Button>
							</div>
						) : (
							<List
								dataSource={thesisList}
								renderItem={(thesis) => (
									<div
										className={`${styles.thesisListItem} ${selectedThesis?.id === thesis.id ? styles.selectedThesis : ''}`}
										onClick={() => {
											setSelectedThesis(thesis);
											closeSidebar(); // Đóng sidebar khi chọn thesis trên mobile
										}}
									>
										<div className={styles.thesisItemHeader}>
											<div className={styles.thesisItemInfo}>
												<div className={styles.thesisItemTitle}>
													<BookOutlined style={{ marginRight: 8, color: '#1890ff' }} />
													{thesis.name ? (<>{thesis.name}</>) : (<>  Sổ ngày #{thesis.id}</>)}
												</div>
												<div className={styles.thesisItemSummary}>
													{thesis.summary && (
														<div className={styles.thesisChatPreview}>
															{thesis.summary ? thesis.summary : 'Chưa có tóm tắt sổ ngày'}
														</div>)}
													<div className={styles.thesisChatCount}>
														📝 {thesis.list_chat ? thesis.list_chat.length : 0} đoạn chat
													</div>
												</div>
												<div className={styles.thesisItemMeta}>
                          <span className={styles.thesisDate}>
                            {thesis.updateAt ? formatDate(thesis.updateAt) : formatDate(thesis.createAt)}
                          </span>

												</div>
												<div className={styles.thesisItemMeta}>
                        <span className={styles.thesisUser}>
                            {thesis.userCreated}
                          </span>
												</div>
											</div>
											<div className={styles.thesisItemActions}>
												<Button
													type="text"
													icon={<EditOutlined />}
													onClick={(e) => {
														e.stopPropagation();
														handleEdit(thesis);
													}}
												/>
												<Popconfirm
													title="Bạn có chắc chắn muốn xóa sổ ngày này?"
													onConfirm={() => handleDelete(thesis.id)}
													okText="Có"
													cancelText="Không"
												>
													<Button
														type="text"
														danger
														icon={<DeleteOutlined />}
														onClick={(e) => e.stopPropagation()}
													/>
												</Popconfirm>
											</div>
										</div>
									</div>
								)}
							/>
						)}
					</div>
				</div>

				{/* Right Content Area */}
				<div className={styles.thesisContent}>
					{selectedThesis ? (
						<div className={styles.thesisContentWrapper}>
							{/* Header with Summary Button */}
							<div className={styles.thesisContentHeader}>
								<div className={styles.thesisContentTitle}>
									<BookOutlined style={{ marginRight: 8, color: '#1890ff' }} />
									{selectedThesis.name || ` Sổ ngày #${selectedThesis.id}`}
								</div>
								<div className={styles.thesisContentSummary}>
									{selectedThesis.summary && (
										<div
											style={{
												fontSize: '14px',
												lineHeight: '1.6',
												fontStyle: 'italic',
											}}
											dangerouslySetInnerHTML={{
												__html: selectedThesis.summary,
											}}
										/>
									)}
								</div>
							</div>

							{/* Chat Content Area */}
							<div className={styles.thesisChatArea}>


								<div style={{
									display: 'flex',
									justifyContent: 'space-between',
									marginTop: '10px',
									paddingBottom: '10px',
									marginBottom: '10px',
									borderBottom: '1px solid #e8e8e8',
								}}>
									<div style={{
										fontSize: '12px',
										color: '#666',
										display: 'flex',
										alignItems: 'center',
										gap: '10px',
										paddingLeft: '10px',
									}}>
										{selectedThesis.updateAt ? (
											<div>
												Cập nhật lúc: {formatDate(selectedThesis.updateAt)}
											</div>
										) : (
											<div>
												Tạo lúc: {formatDate(selectedThesis.createAt)}
											</div>
										)}
									</div>
									<Button
										type="primary"
										icon={<PlusOutlined />}
										onClick={() => {
											setShowAddChatForm(true);
											setEditingChatIndex(null);
											chatForm.resetFields();
										}}
									>
										Thêm chat
									</Button>
								</div>

								<div className={styles.thesisChatList}>
									{selectedThesis.list_chat && selectedThesis.list_chat.length > 0 ? (
										selectedThesis.list_chat
											.sort((a, b) => a.order - b.order)
											.map((chat, index) => (
												<div key={index} className={styles.thesisChatItem}>
													<div className={styles.thesisChatHeader}>
                            <span className={styles.thesisChatOrder}>
                              Đoạn #{chat.order}
								{chat.updateAt && (
									<span style={{
										fontSize: '12px',
										color: '#666',
										marginLeft: '8px',
										fontWeight: 'normal',
									}}>
                                  • {formatDate(chat.updateAt)}
                                </span>
								)}
                            </span>

													</div>
													{chat.summary && (
														<div className={styles.thesisChatSummary}>
															{chat.summary ? (
																<div style={{
																	fontSize: '14px',
																	lineHeight: '1.6',
																	fontStyle: 'italic',
																}}>
																	{chat.summary}
																</div>
															) : (
																'Không có tóm tắt'
															)}
														</div>)}

													<div className={styles.thesisChatContent}>
														<div
															className={styles.thesisChatText}
															dangerouslySetInnerHTML={{
																__html: DOMPurify.sanitize(marked.parse(chat.content || '')),
															}}
														/>
													</div>
												</div>
											))
									) : (
										<div className={styles.thesisDetailEmpty}>
											<div className={styles.thesisEmptyContent}>
												<BookOutlined
													style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
												<h4>Chưa có nội dung</h4>
												<Button
													type="primary"
													onClick={() => {
														setShowAddChatForm(true);
														setEditingChatIndex(null);
														chatForm.resetFields();
													}}
												>
													Thêm chat đầu tiên
												</Button>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					) : (
						<div className={styles.thesisContentEmpty}>
							<BookOutlined style={{ fontSize: 64, color: '#ccc', marginBottom: 24 }} />
							<h3>Chọn một sổ ngày để xem nội dung</h3>
							<p>Vui lòng chọn một sổ ngày từ danh sách bên trái để xem chi tiết</p>
						</div>
					)}
				</div>
			</div>

			{/* Summary Modal */}
			<Modal
				title={`Tóm tắt sổ ngày #${selectedThesis?.id}`}
				open={summaryModalVisible}
				onCancel={handleCloseSummaryModal}
				footer={[
					<Button key="cancel" onClick={handleCloseSummaryModal}>
						Hủy
					</Button>,
					<Button
						key="generate"
						icon={<Sparkles size={14} />}
						onClick={handleGenerateThesisSummary}
						loading={generatingThesisSummary}
						disabled={!selectedThesis?.list_chat || selectedThesis?.list_chat.length === 0}
					>
						AI Tóm tắt
					</Button>,
					<Button key="save" type="primary" onClick={handleSaveSummary}>
						Lưu
					</Button>,
				]}
				width={600}
			>
				<div style={{ marginBottom: 16 }}>
					<Alert
						message="Thông tin"
						description="Tóm tắt này sẽ hiển thị tổng quan về toàn bộ nội dung sổ ngày. Bạn có thể chỉnh sửa trực tiếp hoặc sử dụng AI để tạo tóm tắt tự động."
						type="info"
						showIcon
						style={{ marginBottom: 16 }}
					/>
				</div>

				<TextArea
					value={editingSummary}
					onChange={(e) => setEditingSummary(e.target.value)}
					placeholder="Nhập tóm tắt tổng hợp cho sổ ngày này..."
					rows={12}
					style={{
						fontSize: '14px',
						lineHeight: '1.6',
						resize: 'vertical',
					}}
				/>
			</Modal>

			{/* Add Chat Modal */}
			<Modal
				title="Thêm chat mới"
				open={showAddChatForm && !modalVisible && selectedThesis && !editingThesis}
				onCancel={() => {
					setShowAddChatForm(false);
					setEditingChatIndex(null);
					chatForm.resetFields();
				}}
				footer={null}
				width={800}
			>
				<div style={{ borderTop: '1px solid #e8e8e8', paddingTop: '16px' }}>
					<h4>Thêm chat mới cho Sổ ngày #{selectedThesis?.id}</h4>
					<Form
						form={chatForm}
						layout="vertical"
						onFinish={(values) => {
							console.log('Standalone form onFinish called with values:', values);
							handleSaveChat(values);
						}}
						onFinishFailed={(errorInfo) => {
							console.log('Standalone form validation failed:', errorInfo);
						}}
					>
						<Form.Item
							name="content"
							label="Nội dung"
							rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
						>
							<TextArea
								rows={6}
								placeholder="Nhập nội dung chat"
							/>
						</Form.Item>

						<Form.Item
							name="summary"
							label={
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<span>Tóm tắt</span>
									<Button
										type="text"
										size="small"
										icon={<Sparkles size={14} />}
										onClick={() => {
											const content = chatForm.getFieldValue('content');
											if (content) {
												generateSummaryWithAI(content);
											}
										}}
										loading={generatingSummary}
										title="Sử dụng AI để tạo tóm tắt tự động"
										style={{
											color: '#1890ff',
											padding: '2px 8px',
											height: '24px',
											fontSize: '12px',
										}}
									>
										AI Tóm tắt
									</Button>
								</div>
							}
						>
							<TextArea
								rows={3}
								placeholder="Tóm tắt ngắn gọn (hoặc click nút AI Tóm tắt để tạo tự động)"
							/>
						</Form.Item>

						<Form.Item>
							<Space>
								<Button type="primary" htmlType="submit">
									Thêm
								</Button>
								<Button onClick={() => {
									setShowAddChatForm(false);
									setEditingChatIndex(null);
									chatForm.resetFields();
								}}>
									Hủy
								</Button>
							</Space>
						</Form.Item>
					</Form>
				</div>
			</Modal>

			{/* Add/Edit Chat Modal trong Edit Mode */}
			<Modal
				title={editingChatIndex !== null ? 'Sửa đoạn chat' : 'Thêm chat mới'}
				open={(showAddChatForm || editingChatIndex !== null) && modalVisible}
				onCancel={() => {
					console.log('Chat modal onCancel called');
					setShowAddChatForm(false);
					setEditingChatIndex(null);
					chatForm.resetFields();
				}}
				footer={null}
				width={800}
				zIndex={1001}
				maskClosable={false}
			>
				{console.log('Chat modal render condition:', {
					showAddChatForm,
					editingChatIndex,
					modalVisible,
					shouldShow: (showAddChatForm || editingChatIndex !== null) && modalVisible,
				})}
				<div style={{ borderTop: '1px solid #e8e8e8', paddingTop: '16px' }}>
					<h4>{editingChatIndex !== null ? 'Sửa chat' : 'Thêm chat mới'}</h4>
					<Form
						form={chatForm}
						layout="vertical"
						onFinish={(values) => {
							console.log('Edit mode form onFinish called with values:', values);
							handleSaveChat(values);
						}}
						onFinishFailed={(errorInfo) => {
							console.log('Edit mode form validation failed:', errorInfo);
						}}
					>
						<Form.Item
							name="content"
							label="Nội dung"
							rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
						>
							<TextArea
								rows={6}
								placeholder="Nhập nội dung chat"
							/>
						</Form.Item>

						<Form.Item
							name="summary"
							label={
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<span>Tóm tắt</span>
									<Button
										type="text"
										size="small"
										icon={<Sparkles size={14} />}
										onClick={() => {
											const content = chatForm.getFieldValue('content');
											if (content) {
												generateSummaryWithAI(content);
											}
										}}
										loading={generatingSummary}
										title="Sử dụng AI để tạo tóm tắt tự động"
										style={{
											color: '#1890ff',
											padding: '2px 8px',
											height: '24px',
											fontSize: '12px',
										}}
									>
										AI Tóm tắt
									</Button>
								</div>
							}
						>
							<TextArea
								rows={3}
								placeholder="Tóm tắt ngắn gọn (hoặc click nút AI Tóm tắt để tạo tự động)"
							/>
						</Form.Item>

						<Form.Item>
							<Space>
								<Button type="primary" htmlType="submit">
									{editingChatIndex !== null ? 'Cập nhật' : 'Thêm'}
								</Button>
								<Button onClick={() => {
									setEditingChatIndex(null);
									setShowAddChatForm(false);
									chatForm.resetFields();
								}}>
									Hủy
								</Button>
							</Space>
						</Form.Item>
					</Form>
				</div>
			</Modal>

			{/* Create/Edit Modal */}
			<Modal
				title={editingThesis ? `Chỉnh sửa sổ ngày #${editingThesis.id}` : 'Tạo Thesis mới'}
				open={modalVisible}
				onCancel={handleCancel}
				footer={null}
				width={800}
			>
				{editingThesis ? (
					/* Edit mode: Hiển thị danh sách chat và form thêm/sửa */
					<div>
						{/* Thesis Name Section */}
						<div style={{
							marginBottom: 16,
							padding: '16px',
							border: '1px solid #e8e8e8',
							borderRadius: '8px',
							backgroundColor: '#fafafa',
						}}>
							<h4 style={{ margin: 0, color: '#1890ff', marginBottom: 12 }}>Tên sổ ngày</h4>
							<Input
								value={editingThesis.name || ''}
								onChange={(e) => {
									const updatedThesis = {
										...editingThesis,
										name: e.target.value,
									};
									setEditingThesis(updatedThesis);
								}}
								placeholder="Nhập tên sổ ngày..."
								style={{
									fontSize: '14px',
								}}
							/>
						</div>

						{/* Thesis Summary Section */}
						<div style={{
							marginBottom: 24,
							padding: '16px',
							border: '1px solid #e8e8e8',
							borderRadius: '8px',
							backgroundColor: '#fafafa',
						}}>
							<div style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: 12,
							}}>
								<h4 style={{ margin: 0, color: '#1890ff' }}>Tóm tắt toàn bộ nội dung sổ ngày</h4>
								<Space>
									<Button
										type="default"
										size="small"
										icon={<Sparkles size={14} />}
										onClick={() => handleGenerateThesisSummary()}
										loading={generatingThesisSummary}
										disabled={!editingThesis.list_chat || editingThesis.list_chat.length === 0}
										title="Sử dụng AI để tạo tóm tắt tổng hợp cho toàn bộ sổ ngày"
									>
										AI Tóm tắt
									</Button>
									<Button
										type="primary"
										size="small"
										icon={<SaveOutlined />}
										onClick={async () => {
											try {
												const updatedThesis = {
													...editingThesis,
													name: editingThesis.name,
													summary: editingThesis.summary,
													updateAt: new Date().toISOString(),
												};
												const response = await updateThesis(editingThesis.id, updatedThesis);

												// Cập nhật state với dữ liệu trả về từ server
												const finalThesis = response?.data;
												setEditingThesis(finalThesis);
												setSelectedThesis(finalThesis);

												message.success('Đã lưu tóm tắt sổ ngày');

												// Refresh data để đảm bảo dữ liệu đồng bộ
												await refreshThesisData();
											} catch (error) {
												message.error('Lỗi khi lưu tóm tắt');
												console.error('Error saving thesis summary:', error);
											}
										}}
										title="Lưu tóm tắt thesis"
									/>
								</Space>
							</div>
							<TextArea
								value={editingThesis.summary || ''}
								onChange={(e) => {
									const updatedThesis = {
										...editingThesis,
										summary: e.target.value,
									};
									setEditingThesis(updatedThesis);
								}}
								placeholder="Nhập tóm tắt tổng hợp cho sổ ngày này..."
								rows={4}
								style={{
									fontSize: '14px',
									lineHeight: '1.5',
									resize: 'vertical',
								}}
							/>
						</div>

						{/* Header với nút thêm chat */}
						<div style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: 16,
						}}>
							<h3>Danh sách chat ({editingThesis.list_chat?.length || 0} đoạn)</h3>
							<Button
								type="primary"
								icon={<PlusOutlined />}
								onClick={() => {
									console.log('Add chat button clicked');
									console.log('Current state:', { showAddChatForm, editingChatIndex, modalVisible });
									setShowAddChatForm(true);
									setEditingChatIndex(null);
									chatForm.resetFields();
									console.log('State after setting:', {
										showAddChatForm: true,
										editingChatIndex: null,
										modalVisible,
									});
								}}
							>
								Thêm chat
							</Button>
						</div>

												{/* Danh sách chat */}
						<div style={{ height: 'calc(80vh - 350px)', overflowY: 'auto' }}>
							{editingThesis.list_chat && editingThesis.list_chat.length > 0 ? (
								<div style={{ marginBottom: 24 }}>
									{editingThesis.list_chat
										.sort((a, b) => a.order - b.order)
										.map((chat, index) => (
											<div key={index} style={{
												border: '1px solid #e8e8e8',
												borderRadius: '8px',
												padding: '12px',
												marginBottom: '8px',
												background: editingChatIndex === index ? '#f0f8ff' : 'white',
											}}>
												<div style={{
													display: 'flex',
													justifyContent: 'space-between',
													alignItems: 'center',
													marginBottom: '8px',
												}}>
                         <span style={{ fontWeight: 600, color: '#1890ff' }}>
                           Đoạn #{chat.order}
							{chat.updateAt && (
								<span style={{
									fontSize: '12px',
									color: '#666',
									marginLeft: '8px',
									fontWeight: 'normal',
								}}>
                               • {formatDate(chat.updateAt)}
                             </span>
							)}
                         </span>
													<Space>
														<Button
															type="text"
															size="small"
															onClick={() => handleEditChat(chat, index)}
														>
															Sửa
														</Button>
														<Popconfirm
															title="Xóa đoạn chat này?"
															onConfirm={() => handleDeleteChat(index)}
															okText="Có"
															cancelText="Không"
														>
															<Button
																type="text"
																size="small"
																danger
															>
																Xóa
															</Button>
														</Popconfirm>
													</Space>
												</div>
												<div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
													{chat.summary || 'Không có tóm tắt'}
												</div>
												<div style={{ fontSize: '13px', color: '#333' }}>
													{chat.content.length > 100 ? chat.content.substring(0, 100) + '...' : chat.content}
												</div>
											</div>
										))}
								</div>
							) : (
								<div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
									<BookOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
									<p>Chưa có đoạn chat nào</p>
									<Button type="primary" onClick={() => {
										setShowAddChatForm(true);
										setEditingChatIndex(null);
										chatForm.resetFields();
									}}>
										Thêm chat đầu tiên
									</Button>
								</div>
							)}
						</div>

						{/* Nút lưu chính cho modal edit */}
						<div style={{
							display: 'flex',
							justifyContent: 'flex-end',
							gap: '8px',
							paddingTop: '16px',
							borderTop: '1px solid #e8e8e8',
							marginTop: '16px'
						}}>
							<Button onClick={handleCancel}>
								Hủy
							</Button>
							<Button 
								type="primary" 
								onClick={() => handleSubmit({ name: editingThesis.name, summary: editingThesis.summary })}
							>
								Lưu thay đổi
							</Button>
						</div>

					</div>
				) : (
					/* Create mode: Form tạo thesis mới */
					<Form
						form={form}
						layout="vertical"
						onFinish={handleSubmit}
					>
						<Alert
							message="Thông tin"
							description="Sổ ngày mới sẽ được tạo với danh sách chat rỗng. Bạn có thể thêm các đoạn chat sau khi tạo."
							type="info"
							showIcon
							style={{ marginBottom: 16 }}
						/>

						{/* Trường tên thesis */}
						<Form.Item
							name="name"
							label="Tên thesis"
							rules={[{ required: true, message: 'Vui lòng nhập tên sổ ngày' }]}
							initialValue={getDefaultThesisName()}
						>
							<Input
								placeholder="Nhập tên thesis..."
								style={{ marginBottom: 16 }}
							/>
						</Form.Item>

						<Form.Item>
							<Space>
								<Button type="primary" htmlType="submit">
									Tạo Thesis
								</Button>
								<Button onClick={handleCancel}>
									Hủy
								</Button>
							</Space>
						</Form.Item>
					</Form>
				)}
			</Modal>
		</div>
	);
};

export default ThesisTab; 