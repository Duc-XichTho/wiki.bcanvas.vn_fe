import React, { useEffect, useState, useRef } from 'react';
import { Button, Typography } from 'antd';
import { EditOutlined, DragOutlined, CloseOutlined } from '@ant-design/icons';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import css from '../../../Canvas/CongCu/CanvasWebPage/ContentWebPage/TipTap.module.css';
import { TiptapToolbar } from '../../../Canvas/CongCu/CanvasWebPage/ContentWebPage/TiptapToolbar.jsx';
import { EditorContent } from '@tiptap/react';
import { useEditor } from '../../../Canvas/CongCu/CanvasWebPage/ContentWebPage/useEditor';
import { updateDashBoardItem } from '../../../../apis/dashBoardItemService';
import styles from './AnalysisDetailModal.module.css';

const { Title, Text, Paragraph } = Typography;

const AnalysisDetailModal2 = ({
								  visible,
								  onClose,
								  analysis,
								  item,
								  onReanalyze,
								  isAnalyzing = false,
								  chartOptions = {},
								  currentUser,
								  onItemUpdate, // Thêm callback để cập nhật item trong list
								  tableData = {}, // Thêm tableData để hiển thị dữ liệu bảng
							  }) => {
	// State for Tiptap editor
	const [isEditMode, setIsEditMode] = useState(false);
	const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
	const [tableMenuOpen, setTableMenuOpen] = useState(false);
	const [fontMenuOpen, setFontMenuOpen] = useState(false);
	const [colorPickerMenuOpen, setColorPickerMenuOpen] = useState(false);
	const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
	const [lineHeightMenuOpen, setLineHeightMenuOpen] = useState(false);
	
	// State for draggable modal
	const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [modalSize, setModalSize] = useState({ width: 0, height: 0 });
	const [isResizing, setIsResizing] = useState(false);
	const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
	const [isPositioned, setIsPositioned] = useState(false); // Track if modal is positioned
	
	const modalRef = useRef(null);
	const headerRef = useRef(null);
	
	// Local state để quản lý note content
	const [localNoteContent, setLocalNoteContent] = useState(item?.info?.note || '');

	// Setup Tiptap editor - must be called before any conditional returns
	const { editor } = useEditor();

	// Setup Tiptap editor for note viewing
	useEffect(() => {
		if (editor) {
			editor.setEditable(isEditMode);
			const content = localNoteContent || '<p style="color: #999; font-style: italic;">Chưa có ghi chú. Click vào icon edit để thêm ghi chú.</p>';
			editor.commands.setContent(content);
		}
	}, [editor, localNoteContent, isEditMode]);

	// Cập nhật localNoteContent khi item thay đổi
	useEffect(() => {
		setLocalNoteContent(item?.info?.note || '');
	}, [item?.info?.note]);

	// Initialize modal position and size when modal opens
	useEffect(() => {
		if (visible) {
			setIsPositioned(false); // Reset position state
			// Lấy vị trí đã lưu từ sessionStorage hoặc center mặc định
			const savedPosition = sessionStorage.getItem('analysisModalPosition');
			const savedSize = sessionStorage.getItem('analysisModalSize');
			
			let centerX, centerY, width, height;
			
			if (savedPosition && savedSize) {
				// Sử dụng vị trí đã lưu
				const position = JSON.parse(savedPosition);
				const size = JSON.parse(savedSize);
				centerX = position.x;
				centerY = position.y;
				width = size.width;
				height = size.height;
			} else {
				// Vị trí mặc định ở giữa màn hình
				centerX = Math.max(0, (window.innerWidth - 800) / 2);
				centerY = Math.max(0, (window.innerHeight - 600) / 2);
				width = 800;
				height = 600;
			}
			
			// Set position directly - không có animation bay
			setModalPosition({ x: centerX, y: centerY });
			setModalSize({ width, height });
			setIsPositioned(true); // Mark as positioned
		}
	}, [visible]);

	// Handle mouse events for dragging and resizing
	useEffect(() => {
		const handleMouseMove = (e) => {
			if (isDragging) {
				const newX = e.clientX - dragStart.x;
				const newY = e.clientY - dragStart.y;
				// Keep modal within viewport bounds
				const maxX = window.innerWidth - modalSize.width;
				const maxY = window.innerHeight - modalSize.height;
				setModalPosition({ 
					x: Math.max(0, Math.min(newX, maxX)), 
					y: Math.max(0, Math.min(newY, maxY)) 
				});
			}
			if (isResizing) {
				const newWidth = resizeStart.width + (e.clientX - resizeStart.x);
				const newHeight = resizeStart.height + (e.clientY - resizeStart.y);
				setModalSize({ 
					width: Math.max(400, Math.min(newWidth, window.innerWidth - modalPosition.x)), 
					height: Math.max(300, Math.min(newHeight, window.innerHeight - modalPosition.y)) 
				});
			}
		};

		const handleMouseUp = () => {
			setIsDragging(false);
			setIsResizing(false);
			
			// Lưu vị trí và kích thước hiện tại vào sessionStorage
			sessionStorage.setItem('analysisModalPosition', JSON.stringify(modalPosition));
			sessionStorage.setItem('analysisModalSize', JSON.stringify(modalSize));
		};

		if (isDragging || isResizing) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		}

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [isDragging, isResizing, dragStart, resizeStart, modalSize, modalPosition]);


	if (!visible || !analysis || !item) return null;

	// Configure marked options for better rendering
	marked.setOptions({
		breaks: true, // Convert line breaks to <br>
		gfm: true, // GitHub Flavored Markdown
	});

	const toggleEditMode = () => {
		setIsEditMode(!isEditMode);
	};

	const handleSaveNote = async () => {
		try {
			const updatedNote = editor.getHTML();

			// Cập nhật local state trước
			setLocalNoteContent(updatedNote);

			// Cập nhật database
			await updateDashBoardItem({
				...item,
				info: {
					...item.info,
					note: updatedNote,
				},
			});

			// Cập nhật item trong list nếu có callback
			if (onItemUpdate) {
				const updatedItem = {
					...item,
					info: {
						...item.info,
						note: updatedNote,
					},
				};
				onItemUpdate(updatedItem);
			}

			setIsEditMode(false);
		} catch (error) {
			console.error('Error saving note:', error);
			// Có thể thêm thông báo lỗi cho user ở đây
		}
	};

	// Handle drag start
	const handleDragStart = (e) => {
		if (headerRef.current && headerRef.current.contains(e.target)) {
			setIsDragging(true);
			setDragStart({
				x: e.clientX - modalPosition.x,
				y: e.clientY - modalPosition.y
			});
		}
	};

	// Handle resize start
	const handleResizeStart = (e) => {
		e.preventDefault();
		setIsResizing(true);
		setResizeStart({
			x: e.clientX,
			y: e.clientY,
			width: modalSize.width,
			height: modalSize.height
		});
	};

	// Hàm render markdown
	const renderMarkdown = (content) => {
		try {
			const html = marked(content);
			return DOMPurify.sanitize(html);
		} catch (error) {
			console.error('Error rendering markdown:', error);
			return content;
		}
	};
	return (
		visible && isPositioned ? (
			<>
				{/* Backdrop overlay - chỉ hiển thị, không chặn interaction */}
				<div 
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.3)',
						zIndex: 1999,
						transition: 'opacity 0.2s ease-out',
						pointerEvents: 'none', // Không chặn click events
					}}
				/>
				
				{/* Modal */}
				<div 
					ref={modalRef}
					style={{
						position: 'fixed',
						left: modalPosition.x,
						top: modalPosition.y,
						width: modalSize.width || 800,
						height: modalSize.height || 600,
						margin: 0,
						backgroundColor: '#fff',
						border: '1px solid #f0f0f0',
						borderRadius: 8,
						boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
						maxWidth: 'none',
						transform: 'none',
						display: 'flex',
						flexDirection: 'column',
						zIndex: 2000,
						overflow: 'hidden',
						transition: 'all 0.2s ease-out', // Tắt transition để tránh animation bay
						opacity: 1,
					}}
				>
				{/* Resize handle */}
				<div
					onMouseDown={handleResizeStart}
					style={{
						position: 'absolute',
						bottom: 0,
						right: 0,
						width: '20px',
						height: '20px',
						cursor: 'nw-resize',
						background: 'linear-gradient(-45deg, transparent 30%, #ccc 30%, #ccc 70%, transparent 70%)',
						zIndex: 1000,
					}}
				/>
				
				<div 
					ref={headerRef}
					onMouseDown={handleDragStart}
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: window.innerWidth <= 480 ? '8px 12px' : '12px 16px',
						borderBottom: '1px solid #f0f0f0',
						backgroundColor: '#fafafa',
						cursor: 'move',
						userSelect: 'none',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<DragOutlined style={{ color: '#999', fontSize: '12px' }} />
						<Title level={5} style={{
							margin: 0,
							fontSize: window.innerWidth <= 480 ? '12px' : '14px',
							color: '#262626',
						}}>Kết quả phân tích</Title>
					</div>
					<div style={{ display: 'flex', gap: 8 }}>
						<Button
							type="primary"
							size={window.innerWidth <= 480 ? 'small' : 'middle'}
							loading={isAnalyzing}
							onClick={onReanalyze}
						>
							Phân tích lại
						</Button>
							<Button
							size={window.innerWidth <= 480 ? 'small' : 'middle'}
							icon={<CloseOutlined />}
							onClick={onClose}
						/>
					</div>
				</div>
				<div
					className={styles.analysisContent}
					style={{
						flex: 1,
						overflow: 'auto',
						padding: '5px 26px 25px 26px', // Thêm padding-bottom để tránh resize handle
						backgroundColor: '#fafafa',
						borderRadius: '6px',
						lineHeight: '1.5',
						color: '#262626',
						fontSize: '13px',
						border: '1px solid #f0f0f0',
						marginBottom: '20px', // Tạo khoảng cách với resize handle
					}}
					dangerouslySetInnerHTML={{
						__html: renderMarkdown(analysis?.answer),
					}}
				/>
			
				</div>
			</>
		) : null
	);
};

export default AnalysisDetailModal2;