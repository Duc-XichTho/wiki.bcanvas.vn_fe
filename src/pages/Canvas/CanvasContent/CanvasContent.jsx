// CanvasContent.jsx
import css from './CanvasContent.module.css';
import React, { useContext, useEffect, useState } from 'react';
import { data, useParams } from 'react-router-dom';
import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import {
	Button,
	ConfigProvider,
	Dropdown,
	FloatButton,
	Input,
	message,
	Modal,
	Popconfirm,
	Select,
	Spin,
	Menu, Checkbox, Switch,
} from 'antd';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
// CONSTANT
import { CANVAS_TYPE } from '../../../CONST';
// API
import {
	createCanvasContainer,
	deleteCanvasContainer,
	getAllCanvasContainer,
	updateCanvasContainer,
} from '../../../apis/canvasContainerService';
import { createNewCanvasNotepad } from '../../../apis/canvasNotepadService';
import {
	getAllFileNotePad,
	getFileNotePadByIdController,
	updateFileNotePad,
} from '../../../apis/fileNotePadService.jsx';
import { getAllCanvasData } from '../../../apis/canvasDataService.jsx';
import { getAllChatHistory } from '../../../apis/aiChatHistoryService.jsx';
// COMPONENT
import CanvasNotepad from '../CanvasNotepad/CanvasNotepad';
import File from '../Daas/Content/File/File.jsx';
import NotePad from '../Daas/Content/NotePad/NotePad.jsx';
import Data from '../Daas/Content/Data/Data.jsx';
import ChildWrapper from '../Child/ChildWrapper.jsx';
import { MyContext } from '../../../MyContext.jsx';
import { DeleteIcon, EditIcon, IconUser } from '../../../icon/IconSVG.js';
import { getCurrentUserLogin } from '../../../apis/userService.jsx';
import { IoSettingsOutline } from 'react-icons/io5';
import { FcTreeStructure } from 'react-icons/fc';
import { FiLink } from 'react-icons/fi';
import { LuLayoutDashboard } from 'react-icons/lu';
import { CiExport } from 'react-icons/ci';
import { SiOpenaigym } from 'react-icons/si';
import { findRecordsByConditions } from '../../../apis/searchModelService.jsx';
import { AddNew, Calendar_White, Vector } from '../../../icon/svg/IconSvg.jsx';
import KPI2ContentView from '../CanvasFolder/KPI2Calculator/KPI2ContentView.jsx';
import ChartTemplateElementView
	from '../Daas/Content/Template/SettingChart/ChartTemplate/ChartTemplateElement/ChartTemplateElementView.jsx';
import { getAllFileTab } from '../../../apis/fileTabService.jsx';
import { Radio, notification } from 'antd';
import styled from 'styled-components';
import TemplateView from '../Daas/Content/Template/TemplateView.jsx';
import DraggableOpenAIBox from './DraggableOpenAIBox';
import Loading from '../../Loading/Loading.jsx';
import styles from '../CanvasFolder/KPI2Calculator/KPICalculator2.module.css';
import { getReportCanvasDataById, updateReportCanvas } from '../../../apis/reportCanvasService.jsx';
import { getAllUserClass } from '../../../apis/userClassService.jsx';
import TipTapDashboard from '../Daas/Content/Tiptap/TipTapDashboard.jsx';
import TipTapWithChart from '../Daas/Content/TiptapWithChart/TipTapWithChart.jsx';

const CustomRadioGroup = styled(Radio.Group)`
  .ant-radio-checked .ant-radio-inner {
    border-color: rgba(37, 156, 99, 1) !important;
    background-color: rgba(37, 156, 99, 1) !important;
  }

  .ant-radio-checked .radio-label {
    color: rgba(37, 156, 99, 1) !important;
  }
`;

const CanvasContent = () => {
	const {
		currentMonthCanvas,
		setCurrentMonthCanvas,
		userClasses,
		fetchUserClasses,
		listUC_CANVAS,
		uCSelected_CANVAS
	} = useContext(MyContext) || {};
	const [currentUser, setCurrentUser] = useState(null);
	const [listUC, setListUC] = useState([]);
	const { companySelect, buSelect, tabSelect, siderId } = useParams();
	const [layoutWidth, setLayoutWidth] = useState(1550);
	const [isUpdating, setIsUpdating] = useState(false);
	const [editMode, setEditMode] = useState(false);
	const [layouts, setLayouts] = useState({});
	const [isLoading, setIsLoading] = useState(true);
	const [layoutElementSelected, setLayoutElementSelected] = useState(null);
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [updateModalOpen, setUpdateModalOpen] = useState(false);
	const [titleCanvasContainer, setTitleCanvasContainer] = useState('');
	const [descriptionCanvasContainer, setDescriptionCanvasContainer] = useState('');
	const [link, setLink] = useState('');
	const [componentInfoCanvasContainer, setComponentInfoCanvasContainer] = useState(null);
	const [child, setChild] = useState(null);
	const [dataPacks, setDataPacks] = useState([]);
	const [canvasPacks, setCanvasPacks] = useState([]);
	const [visualComponents, setVisualComponents] = useState({});
	const [visualData, setVisualData] = useState({});
	const [openChildWrapper, setOpenChildWrapper] = useState(false);
	const [checkPermit, setCheckPerrmit] = useState(false);
	const [visiblePopovers, setVisiblePopovers] = useState({});
	const [typeData, setTypeData] = useState(null);
	const [typeDataEdit, setTypeDataEdit] = useState(null);
	const [fileTab, setFileTab] = useState([]);
	const [openSetupUC, setOpenSetupUC] = useState(false);
	const [reportCanvas, setReportCanvas] = useState(false);
	const [selectedUC, setSelectedUC] = useState(new Set());
	const [isChartEnabled, setIsChartEnabled] = useState(false);
	const [selectedRadio, setSelectedRadio] = useState('folder');
	const [aiChatHistory, setAIChatHistory] = useState([]);

	const handleResize = () => {
		if (isUpdating) return;
		const contentElement = document.querySelector(`.${css.contentElement}`);
		if (contentElement) {
			setLayoutWidth(contentElement.offsetWidth);
		}
	};

	useEffect(() => {
		getAllUserClass().then((data) => {
			setListUC(data.filter(e => e.module == 'CANVAS'));
		});
	}, []);

	function fetchRC() {
		getReportCanvasDataById(siderId).then(a => {
			setSelectedUC(new Set(a?.userClass || []));
			setReportCanvas(a);
		});
	}

	useEffect(() => {
		fetchRC();
	}, [siderId]);

	const handleChange = (name) => {
		setSelectedUC((prev) => {
			const newSet = new Set(prev);
			newSet.has(name) ? newSet.delete(name) : newSet.add(name);
			return newSet;
		});
	};

	const fetchAllFileTab = async () => {
		try {
			const dataFileTab = await getAllFileTab();
			const dataFileNotePad = await getAllFileNotePad();
			const filterDataFileTab = dataFileTab.filter(item => item.hide === false && item.type == 'data')
				.map(tab => ({
					...tab,
					child: dataFileNotePad.filter(notepad => notepad.tab === tab.key && notepad.table !== 'FileUpLoad'),
				}));
			setFileTab(filterDataFileTab);
		} catch (error) {
			console.error('Failed to fetch file tabs:', error);
		}
	};

	useEffect(() => {
		fetchAllFileTab();
	}, []);

	const showCreateModal = () => {
		setCreateModalOpen(true);
	};

	const showUpdateModal = (item) => {
        if (item.type == 'notepad') {
            setSelectedRadio('new')
        }
		setIsUpdating(true);
		setTitleCanvasContainer(item.title || '');
		setDescriptionCanvasContainer(item.description || '');
		setLink(item.link || '');
		setComponentInfoCanvasContainer(Number(item.type) || null);
		setChild(item.child || null);
		setTypeDataEdit(item.code || null);
		setUpdateModalOpen(true);
        setIsChartEnabled(item.show_chart )
        setSelectedRadio(item.mode || 'folder')
		setTimeout(() => setIsUpdating(false), 100);
	};

	const onChangeTypeContainer = (value) => {
		setComponentInfoCanvasContainer(value);
	};

	const onSearch = (value) => {
	};
	const confirm = async (e) => {
		try {
			await deleteCanvasContainer(Number(layoutElementSelected.i));
			await fetchAllCanvasContainer();
			setLayoutElementSelected(null);
			message.success('Xóa thành công');
		} catch (error) {
			console.error('Failed to delete canvas container:', error);
		}
	};

	const cancel = (e) => {
	};

	const componentsMap = {
		FileUpLoad: File,
		NotePad: NotePad,
		Data: Data,
		Tiptap: TipTapDashboard,
		TiptapWithChart: TipTapWithChart,
		KPI: KPI2ContentView,
		ChartTemplate: ChartTemplateElementView,
		Template: TemplateView,
	};

	const loadVisual = async (id) => {
		try {
			const fileNotePadData = await getFileNotePadByIdController(id);
			const Component = componentsMap?.[fileNotePadData?.table];
			if (Component) {
				setVisualComponents(prev => ({
					...prev,
					[id]: Component,
				}));
				setVisualData(prev => ({
					...prev,
					[id]: fileNotePadData,
				}));
			}
		} catch (error) {
			console.log('Failed to load visual:', error);
			setVisualComponents(prev => ({
				...prev,
				[id]: null,
			}));
		}
	};

	const fetchVisualData = async (id) => {
		try {
			const updatedData = await getFileNotePadByIdController(id);
			setVisualData(prev => ({
				...prev,
				[id]: updatedData,
			}));
		} catch (error) {
			console.error('Failed to fetch visual data:', error);
		}
	};

	const fetchAllCanvasContainer = async () => {
		try {
			const response = await getAllCanvasContainer();
			const filteredResponse = response.filter(item =>
					item.companySelect == companySelect &&
					item.tabSelect == tabSelect &&
					item.siderSelect == siderId,
				// && item.buSelect == buSelect
			);
			const generatedLayouts = {
				lg: filteredResponse.map(item => ({
					i: item.id.toString(),
					title: item.title || '',
					description: item.description || '',
					link: item.link,
					child: item.child,
					x: item.x,
					y: item.y,
					w: item.w,
					h: item.h,
					type: item.type,
					code: item.code || '',
					show_chart: item.show_chart,
					mode : item.mode
                })),
				md: filteredResponse.map(item => ({
					i: item.id.toString(),
					title: item.title || '',
					description: item.description || '',
					link: item.link,
					child: item.child,
					x: Math.floor(item.x / 2),
					y: item.y,
					w: Math.max(1, Math.floor(item.w / 2)),
					h: item.h,
					type: item.type,
					show_chart: item.show_chart,
                    mode : item.mode
                })),
				sm: filteredResponse.map(item => ({
					i: item.id.toString(),
					title: item.title || '',
					description: item.description || '',
					link: item.link,
					child: item.child,
					x: 0,
					y: item.y * 2,
					w: 12,
					h: item.h,
					type: item.type,
					show_chart: item.show_chart,
                    mode : item.mode
				})),
			};
			setLayouts(generatedLayouts);
			setTimeout(() => {
				setIsLoading(false);
			}, 1500);
		} catch (error) {
			console.error('Failed to fetch canvas containers:', error);
			setIsLoading(false);
		}
	};

	const fetchPermissionCanvas = async () => {
		const { data } = await getCurrentUserLogin();
		const reportCanvas = await findRecordsByConditions('ReportCanvas', { id: siderId });
		if (reportCanvas.length > 0 && data) {
			let canView = false;
			if (data.isAdmin) {
				canView = true;
			} else {
				try {
					const ucObj = listUC_CANVAS?.find(uc => uc.id == uCSelected_CANVAS);
					const ucId = ucObj?.id;
					if (!reportCanvas[0].userClass || !Array.isArray(reportCanvas[0].userClass) || reportCanvas[0].userClass.length === 0) {
						canView = false;
					} else {
						canView = reportCanvas[0].userClass.includes(ucId);
					}
				} catch (e) {
					canView = false;
				}
			}
			setCheckPerrmit(canView);
		} else {
			setCheckPerrmit(false);
		}
		if (!(userClasses?.length > 0)) {
			fetchUserClasses();
		}
		if (!currentUser) {
			setCurrentUser(data);
		}
		let response = await getAllFileNotePad();
		const res = await getAllCanvasData();

		setCanvasPacks(response);
		if (typeData) {
			if (typeData == '0') {
				setDataPacks([{ aiDatapackId: CANVAS_TYPE.NOTEPAD, name: 'Notepad' }]);
				setComponentInfoCanvasContainer(CANVAS_TYPE.NOTEPAD);
			} else {
				setComponentInfoCanvasContainer(null);
				setDataPacks(res.filter(item => item.code.toLowerCase().startsWith(typeData.toLowerCase())));
			}
		}
		if (typeDataEdit) {
			if (typeDataEdit == '0') {
				setDataPacks([{ aiDatapackId: CANVAS_TYPE.NOTEPAD, name: 'Notepad' }]);
			} else {
				setDataPacks(res.filter(item => item.code.toLowerCase().startsWith(typeDataEdit.toLowerCase())));
			}
		}
	};

	useEffect(() => {
		if (selectedRadio === 'ai') {
			getAllChatHistory().then(data => {
				console.log('AI Chat History:', data);
				// Filter by current user
				const filtered = data.filter(item => item.userCreated === currentUser?.email);
				console.log('Filtered:', filtered);
				setAIChatHistory(filtered);
			});
		}
	}, [selectedRadio, currentUser?.email]);



	const handleTypeDataChange = (value) => {
		if (value == '0') {
			setComponentInfoCanvasContainer(CANVAS_TYPE.NOTEPAD);
			setTypeData(value);

		} else {
			setComponentInfoCanvasContainer(null);
			setTypeData(value);

		}
	};

	const handleTypeDataEditChange = (value) => {
		if (value == '0') {
			setComponentInfoCanvasContainer(CANVAS_TYPE.NOTEPAD);
			setTypeDataEdit(value);

		} else {
			setComponentInfoCanvasContainer(null);
			setTypeDataEdit(value);

		}
	};

	useEffect(() => {
		fetchAllCanvasContainer();
		fetchPermissionCanvas();

		window.addEventListener('resize', handleResize);
		handleResize();

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, [layoutWidth, buSelect, tabSelect, siderId, listUC_CANVAS, typeData, typeDataEdit]);

	useEffect(() => {
		if (layouts.lg) {
			layouts.lg.forEach(item => {
				if (item.type !== CANVAS_TYPE.NOTEPAD && !visualComponents[item.type]) {
					loadVisual(item.type);
				}
			});
		}
	}, [layouts.lg]);

	const handleLayoutChange = (currentLayout, allLayouts) => {
		setLayouts(prevLayouts => {
			const updatedLayouts = { ...prevLayouts };

			updatedLayouts.lg = currentLayout.map(layoutItem => {
				const existingItem = prevLayouts.lg.find(item => item.i == layoutItem.i);
				return {
					...layoutItem,
					title: existingItem?.title || '',
					description: existingItem?.description || '',
					componentInfo: existingItem?.componentInfo,
					type: existingItem?.type,
				};
			});

			return updatedLayouts;
		});
	};

	const handleEditMode = () => {
		setEditMode(true);
	};

	const handleAddNewCanvasContainer = async () => {
		if (!componentInfoCanvasContainer) {
			message.warning('Vui lòng chọn một thành phần.');
			return;
		}
		const dataPack = canvasPacks.find(item => item.id == componentInfoCanvasContainer);
		const newItem = {
			title: titleCanvasContainer,
			description: descriptionCanvasContainer,
			componentInfo: null,
			w: 20,
			h: 12,
			companySelect: companySelect,
			buSelect: buSelect,
			tabSelect: tabSelect,
			siderSelect: siderId,
			link: link,
			child: child,
			type: componentInfoCanvasContainer == CANVAS_TYPE.NOTEPAD ? CANVAS_TYPE.NOTEPAD : dataPack?.id,
			code: typeData,
			show_chart: isChartEnabled,
            mode : selectedRadio
        };

		const maxY = layouts.lg.reduce((max, item) => Math.max(max, item.y + item.h), 0);

		newItem.x = 0;
		newItem.y = maxY;

		try {
			const newContainer = await createCanvasContainer(newItem);
			await fetchAllCanvasContainer();
			if (newItem.type == CANVAS_TYPE.NOTEPAD) {
				await createNewCanvasNotepad({
					canvasContainerId: newContainer.id,
				});
			}
			setComponentInfoCanvasContainer(null);
			setTitleCanvasContainer('');
			setDescriptionCanvasContainer('');
			setCreateModalOpen(false);
			setTypeData(null);
			setSelectedRadio('folder');
			message.success('Tạo vùng thành công');
		} catch (error) {
			console.error('Failed to add new item:', error);
		}
	};

	const handleCancelCreateCanvasContainer = () => {
		setTitleCanvasContainer('');
		setDescriptionCanvasContainer('');
		setTypeData(null);
		setTypeDataEdit(null);
		setLink('');
		setComponentInfoCanvasContainer(null);
		setChild(null);
		setCreateModalOpen(false);
		setSelectedRadio('folder');
	};

	const handleSaveLayout = async () => {
		try {
			const updatePromises = layouts.lg.map(layout => {
				const { i, title, description, x, y, w, h, componentInfo } = layout;
				const data = { title, description, x, y, w, h, componentInfo };
				return updateCanvasContainer(Number(i), data);
			});

			await Promise.all(updatePromises);

			setEditMode(false);
			await fetchAllCanvasContainer();
			message.success('Lưu layout thành công');
		} catch (error) {
			console.error('Failed to save layout', error);
		}
	};

	const handleUpdateCanvasContainer = async () => {
		try {
			const dataUpdate = {
				title: titleCanvasContainer,
				description: descriptionCanvasContainer,
				type: componentInfoCanvasContainer,
				link: link,
				child: child ? child : null,
				code: typeDataEdit,
                show_chart : selectedRadio == 'kpi' ? isChartEnabled : true,
                mode : selectedRadio
			};

			await updateCanvasContainer(Number(layoutElementSelected.i), dataUpdate);
			setLayouts(prevLayouts => {
				const updatedLayouts = { ...prevLayouts };
				updatedLayouts.lg = prevLayouts.lg.map(layout => {
					if (layout.i == layoutElementSelected.i) {
						return {
							...layout,
							title: titleCanvasContainer,
							description: descriptionCanvasContainer,
							type: componentInfoCanvasContainer,
							link: link,
							child: child ? child : null,
							show_chart : selectedRadio == 'kpi' ? isChartEnabled : true,
							mode : selectedRadio
						};
					}
					return layout;
				});
				return updatedLayouts;
			});
			setUpdateModalOpen(false);
			setTypeData(null);
			setSelectedRadio('folder');
		} catch (error) {
			console.error('Failed to update canvas container:', error);
		}
	};

	const handleCancelUpdateCanvasContainer = () => {
        if (selectedRadio == 'new') {
            setSelectedRadio('new')
        } else {
            setSelectedRadio('folder')
        }
		setTitleCanvasContainer('');
		setDescriptionCanvasContainer('');
		setLink('');
		setComponentInfoCanvasContainer(null);
		setChild(null);
		setUpdateModalOpen(false);
		setTypeData(null);
	};



	const handleChildWrapperOpen = (item) => {
		setLayoutElementSelected(item);
		setOpenChildWrapper(true);
	};

	const months = Array.from({ length: 12 }, (_, index) => ({
		value: (index + 1).toString(),
		label: `Tháng ${index + 1}`,
	}));

	const exportToPDF = async () => {
		try {
			message.loading({ content: 'Đang xuất PDF...', key: 'pdfExport' });

			// Save original document state
			const originalScrollPos = {
				x: window.pageXOffset,
				y: window.pageYOffset,
			};
			const originalOverflow = document.documentElement.style.overflow;
			const originalBodyOverflow = document.body.style.overflow;

			// Handle scrollable containers
			const scrollableContainers = Array.from(document.querySelectorAll('*')).filter(el => {
				const style = window.getComputedStyle(el);
				return ['auto', 'scroll'].includes(style.overflowY) ||
					['auto', 'scroll'].includes(style.overflow);
			});

			const originalHeights = new Map(
				scrollableContainers.map(container => [container, {
					height: container.style.height,
					maxHeight: container.style.maxHeight,
					overflow: container.style.overflow,
					width: container.style.width,
				}]),
			);

			// Make all content visible
			scrollableContainers.forEach(container => {
				container.style.height = 'auto';
				container.style.maxHeight = 'none';
				container.style.overflow = 'visible';
				container.style.width = '100%';
			});

			// Get full document dimensions
			const fullHeight = Math.max(
				document.body.scrollHeight,
				document.body.offsetHeight,
				document.documentElement.clientHeight,
				document.documentElement.scrollHeight,
				document.documentElement.offsetHeight,
			);

			const fullWidth = Math.max(
				document.body.scrollWidth,
				document.body.offsetWidth,
				document.documentElement.clientWidth,
				document.documentElement.scrollWidth,
				document.documentElement.offsetWidth,
			);

			document.documentElement.style.overflow = 'hidden';
			document.body.style.overflow = 'hidden';


			const scale = 2;
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			canvas.width = fullWidth * scale;
			canvas.height = fullHeight * scale;

			const options = {
				allowTaint: true,
				useCORS: true,
				logging: false,
				width: fullWidth,
				height: fullHeight,
				windowWidth: fullWidth,
				windowHeight: fullHeight,
				x: 0,
				y: 0,
				scrollX: 0,
				scrollY: 0,
				scale: scale,
				backgroundColor: '#ffffff',
				imageTimeout: 30000,
				removeContainer: true,
				foreignObjectRendering: true,
				onclone: async (clonedDoc) => {
					const clonedContainer = clonedDoc.querySelector('.your-dashboard-container');
					if (clonedContainer) {
						clonedContainer.style.width = '100%';
						clonedContainer.style.maxWidth = 'none';
						clonedContainer.style.margin = '0';
						clonedContainer.style.padding = '0';
					}

					const clonedScrollables = clonedDoc.querySelectorAll('*');
					clonedScrollables.forEach(el => {
						const style = window.getComputedStyle(el);
						if (['auto', 'scroll'].includes(style.overflowY) ||
							['auto', 'scroll'].includes(style.overflow)) {
							el.style.height = 'auto';
							el.style.maxHeight = 'none';
							el.style.overflow = 'visible';
							el.style.width = '100%';
							el.style.margin = '0';
							el.style.padding = '0';
						}
					});

					clonedDoc.querySelectorAll('*[style*="position: fixed"]')
						.forEach(el => el.style.position = 'absolute');

					const dynamicContent = clonedDoc.querySelectorAll('.recharts-wrapper, canvas');
					dynamicContent.forEach(el => {
						if (el.style) {
							el.style.visibility = 'visible';
							el.style.display = 'block';
							el.style.width = '100%';
							el.style.margin = '0';
						}
					});

					await Promise.all([
						...Array.from(clonedDoc.images).map(img =>
							new Promise(resolve => {
								if (img.complete) resolve();
								else {
									img.onload = resolve;
									img.onerror = resolve;
								}
							}),
						),
						...Array.from(dynamicContent).map(el =>
							new Promise(resolve => setTimeout(resolve, 1000)),
						),
					]);
				},
			};

			const pageCanvas = await html2canvas(document.documentElement, options);
			ctx.drawImage(pageCanvas, 0, 0, fullWidth * scale, fullHeight * scale);

			const pdf = new jsPDF('p', 'mm', 'a4');

			// Remove margins completely
			const margin = 0;

			const a4Width = 210;
			const a4Height = 297;

			// Use full page width and height
			const availableWidth = a4Width;
			const availableHeight = a4Height;

			const imgWidth = availableWidth;
			const imgHeight = (canvas.height * imgWidth) / canvas.width;

			// Calculate optimal content chunks for each page
			const contentChunks = [];
			let remainingHeight = canvas.height;
			let currentPosition = 0;

			while (remainingHeight > 0) {
				const pageRatio = availableHeight / availableWidth;
				const contentHeight = Math.min(
					canvas.width * pageRatio,
					remainingHeight,
				);

				contentChunks.push({
					y: currentPosition,
					height: contentHeight,
				});

				currentPosition += contentHeight;
				remainingHeight -= contentHeight;
			}

			// Create PDF pages with optimized content distribution
			for (let i = 0; i < contentChunks.length; i++) {
				if (i > 0) {
					pdf.addPage();
				}

				const chunk = contentChunks[i];
				const tempCanvas = document.createElement('canvas');
				tempCanvas.width = canvas.width;
				tempCanvas.height = chunk.height;
				const tempCtx = tempCanvas.getContext('2d');

				tempCtx.drawImage(
					canvas,
					0, chunk.y, canvas.width, chunk.height,
					0, 0, canvas.width, chunk.height,
				);

				const pageImgData = tempCanvas.toDataURL('image/jpeg', 1.0);

				const destHeight = (chunk.height * imgWidth) / canvas.width;

				pdf.addImage(
					pageImgData,
					'JPEG',
					0, // x position - no margin
					0, // y position - no margin
					imgWidth,
					Math.min(destHeight, availableHeight),
					'',
					'FAST',
				);
			}

			pdf.save(`dashboard-${new Date().toISOString().slice(0, 10)}.pdf`);

			// Restore original document state
			document.documentElement.style.overflow = originalOverflow;
			document.body.style.overflow = originalBodyOverflow;

			scrollableContainers.forEach(container => {
				const original = originalHeights.get(container);
				container.style.height = original.height;
				container.style.maxHeight = original.maxHeight;
				container.style.overflow = original.overflow;
				container.style.width = original.width;
			});

			window.scrollTo(originalScrollPos.x, originalScrollPos.y);

			message.success({ content: 'Xuất PDF thành công', key: 'pdfExport' });

		} catch (error) {
			console.error('PDF Export Error:', error);
			message.error({
				content: `Lỗi khi xuất PDF: ${error.message}`,
				key: 'pdfExport',
			});
		}
	};


	const handleRadioChange = (e) => {
		const value = e.target.value;
		setSelectedRadio(value);
		if (value == 'new') {
			setTypeData('0');
			setComponentInfoCanvasContainer('notepad');
		} else if (value == 'folder') {
			setTypeData(null);
			setComponentInfoCanvasContainer(null);
		} else if (value == 'chart') {
			let chartTab = fileTab.find(e => e.position == 100);
			setTypeData(chartTab.key);
		}
		if (value == 'kpi') {
			let chartTab = fileTab.find(e => e.position == 101);
			setTypeData(chartTab.key);
		}
	};

	const handleRadioChange2 = (e) => {
		const value = e.target.value;
		setSelectedRadio(value);
		if (value == 'new') {
			setTypeDataEdit('0');
			setComponentInfoCanvasContainer('notepad');
		} else if (value == 'folder') {
			setTypeDataEdit(null);
			setComponentInfoCanvasContainer(null);
		} else if (value == 'chart') {
			let chartTab = fileTab.find(e => e.position == 100);
			setTypeDataEdit(chartTab.key);
			setComponentInfoCanvasContainer(null);

		}
		if (value == 'kpi') {
			let chartTab = fileTab.find(e => e.position == 101);
			setComponentInfoCanvasContainer(null);
			setTypeDataEdit(chartTab.key);
		}
	};

	const getButtonPosition = (item) => {
		const position = [];
		if (item.child) position.push('child');
		if (item.link) position.push('link');
		if (currentUser?.isAdmin) position.push('admin');
		return position;
	};

	if (isLoading) {
		return (
			<Loading loading={isLoading} />
		);
	}

	const getTypeColorAndText = (value) => {
		switch (value) {
			case 'Data':
				return { color: 'rgba(201, 118, 182, 1)', text: 'Dữ liệu (API)' };
			case 'Template':
				return { color: 'rgba(37, 156, 99, 1)', text: 'Bảng dữ liệu' };
			case 'FileUpLoad':
				return { color: 'rgba(201, 118, 182, 1)', text: 'Kho File' };
			case 'KPI':
				return { color: 'rgba(244, 113, 25, 1)', text: 'KPI / Đo lường' };
			case 'Tiptap':
				return { color: 'rgba(70, 128, 222, 1)', text: 'Văn Bản' };
			case 'ChartTemplate':
				return { color: 'rgba(37, 156, 99, 1)', text: 'Biểu đồ từ bảng' };
			default:
				return { color: null, text: '' }; // Trả về đối tượng rỗng nếu không khớp
		}
	};

	const checkDisabled = !(typeData && componentInfoCanvasContainer);

	const okButtonStyle = checkDisabled
		? {}
		: {
			backgroundColor: '#2d9d5b',
			color: 'white',
			border: 'none',
		};

	const checkDisabledEdit = !(typeDataEdit && componentInfoCanvasContainer);
	const okButtonStyleEdit = checkDisabledEdit
		? {}
		: {
			backgroundColor: '#2d9d5b',
			color: 'white',
			border: 'none',
		};

	console.log(layoutWidth);



	return (
		checkPermit ?
			<>
				<div className={`${css.main} ${css.zoomIn}`}>
					<div
						className={css.container}
					>
						<div className={css.header}>
							<div className={css.headerLeft}>

								{!editMode ? (
									<div style={{ display: 'flex', gap: '10px' }}>
										{currentUser.isAdmin &&
											<>
												<ConfigProvider>
													<Button
														shape='circle'
														icon={<AddNew width={18} height={22} />}
														onClick={showCreateModal}
														type='text'
														style={{
															boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
															backgroundColor: '#fff',
														}}
													/>

													<Button
														shape='circle'
														icon={<Vector width={18} height={22} />}
														onClick={handleEditMode}
														type='text'
														style={{
															boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
															border: '1px solid #ddd',
															backgroundColor: '#fff',
														}}
													/>
												</ConfigProvider>

											</>
										}


										{/* <PopUpUploadFile
										id={''}
										table={''}
									/> */}
									</div>
								) : (
									<div style={{ display: 'flex', gap: '10px' }}>
										<Button onClick={handleSaveLayout}>Lưu</Button>
									</div>
								)}
								<Button
									onClick={() => {
										if (currentUser.isAdmin || reportCanvas.user_create?.includes(currentUser.email)) {
											setOpenSetupUC(true);
										}
									}}
									icon={<img style={{ width: '20px', height: '20px' }} src={IconUser} alt='' />}
									style={{ border: 'none', width: '20px', height: '20px' }}
								>

								</Button>

								{reportCanvas?.userClass &&
									reportCanvas.userClass.map(uc =>
										<span className={styles.tag}>{uc}</span>,
									)
								}
							</div>

							<div className={css.headerRight}>
							</div>
							<div className={css.headerRight}>
								{!editMode && (
									<>
										<DraggableOpenAIBox siderId={siderId} />
										<Button
											shape='round'
											icon={<CiExport />}
											onClick={() => exportToPDF()}
										>
											PDF
										</Button>
									</>
								)
								}
							</div>
						</div>
						<div className={css.contentElement}>
							<ResponsiveGridLayout
								layouts={layouts}
								breakpoints={{ lg: 1200, md: 1000, sm: 800, xs: 480, xxs: 0 }}
								cols={{ lg: 48, md: 1, sm: 1, xs: 1, xxs: 1 }}
								rowHeight={20}
								width={layoutWidth}
								isDraggable={editMode}
								isResizable={editMode}
								margin={{
									lg: [15, 15],
									md: [15, 15],
									sm: [15, 15],
									xs: [15, 15],
									xxs: [15, 15],
								}}
								padding={{ lg: [50, 50], md: [50, 50], sm: [50, 50], xs: [50, 50], xxs: [50, 50] }}
								onLayoutChange={handleLayoutChange}
								resizeHandles={['s', 'e', 'w', 'n', 'se', 'ne', 'sw', 'nw']}
								// preventCollision={true}
								// compactType={null}
								compactType='vertical'
								autoSize={true}
								onResize={(layout, oldItem, newItem) => {
									if (newItem.w < 5) newItem.w = 5;
									if (newItem.h < 4) newItem.h = 4;
								}}
							>
								{layouts.lg &&
									layouts.lg.map(item => {
											const buttonPosition = getButtonPosition(item);
											return (
												<div key={item.i} className={css.layoutElementContainer}>
													{item.title || item.description
														? (
															<div className={css.layoutElementHeader}>
																<div className={css.layoutElementInfo}>
																	{item.title
																		? (
																			<span
																				className={css.titleCanvasContainer}>{item.title}</span>

																		)
																		: null
																	}
																	{item.description
																		? (
																			<span className={css.descriptionCanvasContainer}
																				  title={item.description}>
                                                                            {item.description}
                                                                        </span>
																		)
																		: null
																	}
																</div>
															</div>
														)
														: null
													}
													{item.type == CANVAS_TYPE.NOTEPAD ? (
														<div className={css.layoutElementComponent} style={{ padding: 0 }}>
															<CanvasNotepad canvasId={item.i} />
														</div>
													) : visualComponents[item.type] && visualData[item.type] ? (
														<div className={css.layoutElementComponent} style={{ padding: 0 }}>
															<div className={css.previewWrapper}>
																<div className={css.previewContent}>
																	{React.createElement(visualComponents[item.type], {
																		fileNotePad: visualData[item.type],
																		fetchData: () => fetchVisualData(item.type),
																		selectedKpiId: visualData[item.type].type,
																		selectedItemID: visualData[item.type].type,
                                                                        showChart: item.show_chart,
																	})}
																</div>
																{/* <div className={css.overlay}></div> */}
															</div>
														</div>
													) : (
														<div className={css.layoutElementComponent}>
															<p style={{ padding: 10 }}>Dữ liệu gốc bị xóa</p>
														</div>
													)}

													{buttonPosition.includes('child') && (
														<div className={css.floatButtons}>
															<FloatButton
																style={{
																	position: 'fixed',
																	bottom: 10,
																	right: buttonPosition.indexOf('child') * 35 + 10,
																	transform: 'scale(0.7)',
																	transformOrigin: 'bottom right',
																}}
																icon={<FiLink />}
																onClick={() => handleChildWrapperOpen(item)}
																tooltip={<div>Thành phần liên quan</div>}
															/>
														</div>
													)}

													{buttonPosition.includes('link') && (
														<div className={css.floatButtons}>
															<FloatButton
																style={{
																	position: 'fixed',
																	bottom: 10,
																	right: buttonPosition.indexOf('link') * 35 + 10,
																	transform: 'scale(0.7)',
																	transformOrigin: 'bottom right',
																}}
																icon={<FcTreeStructure />}
																onClick={() => window.open(item?.link, '_blank')}
																tooltip={<div>Đường dẫn đã gắn</div>}
															/>
														</div>
													)}

													{buttonPosition.includes('admin') && (
														<div className={css.floatButtons}>
															<FloatButton.Group
																trigger='click'
																style={{
																	position: 'fixed',
																	bottom: 10,
																	right: buttonPosition.indexOf('admin') * 35 + 10,
																	transform: 'scale(0.7)',
																	transformOrigin: 'bottom right',
																}}
																icon={<IoSettingsOutline />}
															>
																<Popconfirm
																	title='Xóa vùng'
																	description='Bạn muốn xóa vùng này?'
																	onConfirm={confirm}
																	onCancel={cancel}
																	okText='Xóa'
																	cancelText='Hủy'
																>
																	<FloatButton
																		tooltip={<div>Xóa vùng</div>}
																		icon={<img src={DeleteIcon} width={15} alt='' />}
																		onMouseDown={(e) => e.stopPropagation()}
																		onClick={() => setLayoutElementSelected(item)}
																	/>
																</Popconfirm>

																<FloatButton
																	tooltip={<div>Cập nhật</div>}
																	icon={<img src={EditIcon} width={15} alt='' />}
																	onClick={() => {
																		showUpdateModal(item);
																		setLayoutElementSelected(item);
																		setVisiblePopovers(false);
																	}}
																/>
															</FloatButton.Group>
														</div>
													)}

												</div>
											);
										},
									)
								}
							</ResponsiveGridLayout>
						</div>
					</div>
				</div>
				{createModalOpen &&
					<Modal title={<span style={{ fontSize: '24px', fontWeight: 'bold' }}>Tạo vùng</span>}
						   open={createModalOpen}
						   onOk={handleAddNewCanvasContainer}
						   onCancel={handleCancelCreateCanvasContainer}
						   okText='Tạo'
						   cancelText='Hủy'
						   okButtonProps={{
							   disabled: checkDisabled,
							   style: okButtonStyle,
						   }}
						   maskClosable={false} // Chặn đóng khi bấm ra ngoài
					>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
							<div className={css.customForm}>
								<label>Tiêu đề của vùng</label>
								<Input
									placeholder='Nhập tiêu đề'
									value={titleCanvasContainer}
									onChange={(e) => setTitleCanvasContainer(e.target.value)}
								/>
							</div>

							<div className={css.customForm}>
								<label>Mô tả vùng(tùy chọn)</label>
								<Input
									placeholder='Nhập mô tả'
									value={descriptionCanvasContainer}
									onChange={(e) => setDescriptionCanvasContainer(e.target.value)}
								/>
							</div>

							<div className={css.customForm}>
								<label>Gắn thêm link liên kết</label>
								<p>Chức năng tạo ra 1 nút có thể bấm để người dùng truy cập tới liên kết </p>
								<Input
									placeholder='Nhập link'
									value={link}
									onChange={(e) => setLink(e.target.value)}
								/>
							</div>

							<div className={css.customForm}>
								<CustomRadioGroup defaultValue={selectedRadio} onChange={handleRadioChange}>
									<Radio value='folder'>
										<span className='radio-label'>Folder có sẵn</span>
									</Radio>
									<Radio value='new'>
										<span className='radio-label'>Ghi chú mới</span>
									</Radio>
									<Radio value='chart'>
										<span className='radio-label'>Biểu đồ</span>
									</Radio>
									<Radio value='kpi'>
										<span className='radio-label'>KPI</span>
									</Radio>
									<Radio value='ai'>
										<span className='radio-label'>AI</span>
									</Radio>
								</CustomRadioGroup>
							</div>

							{selectedRadio === 'folder' && (
								<div className={css.customForm}>
									<label>Folder kho dữ liệu</label>
									<Select
										placeholder='Chọn kho dữ liệu'
										allowClear
										showSearch
										value={typeData}
										onChange={handleTypeDataChange}
										style={{ width: '100%', marginBottom: 10 }}
									>
										{fileTab.map((item) => (
											<Select.Option key={item.key} value={item.key}>
												{item.label}
											</Select.Option>
										))}
									</Select>
								</div>
							)}

							{selectedRadio === 'ai' && (
								<div className={css.customForm}>
									<label>Chọn câu hỏi AI đã hỏi</label>
									<Select
										showSearch
										allowClear
										placeholder='Chọn câu hỏi'
										optionFilterProp='children'
										value={componentInfoCanvasContainer}
										onChange={onChangeTypeContainer}
									>
										{aiChatHistory.map(item => (
											<Select.Option key={item.id} value={item.id}>
												{item.quest}
											</Select.Option>
										))}
									</Select>
								</div>
							)}


							{typeData && selectedRadio != 'new' && selectedRadio != 'ai' && (
								<>
									{selectedRadio === 'kpi' && (
										<div className={css.customForm}>
											<label style={{ marginBottom: 8 }}>Bật/Tắt biểu đồ</label>
											<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
												<Switch
													className={css.customSwitch}
													checked={isChartEnabled}
													onChange={(checked) => setIsChartEnabled(checked)}
													checkedChildren='Bật'
													unCheckedChildren='Tắt'
													style={{ width: 80 }}
												/>
											</div>
										</div>

									)}

									<div className={css.customForm}>
										<label>Chọn dữ liệu</label>
										<Select
											showSearch
											allowClear
											placeholder='Chọn dữ liệu'
											optionFilterProp='label'
											value={componentInfoCanvasContainer}
											onChange={onChangeTypeContainer}
											onSearch={onSearch}
										>
											{fileTab.find(tab => tab.key === typeData)?.child?.map((item) => {
												const data = getTypeColorAndText(item.table);

												return (<Select.Option key={item.id} value={item.id}>
														<div className={css.itemContainer}>
															<span className={css.itemName}>{item.name}</span>
															<span className={css.itemText}
																  style={{ color: data.color }}>
                                                        ({data.text})
                                                    </span>
														</div>

													</Select.Option>
												);

											})}
										</Select>
									</div>
								</>
							)}


						</div>
					</Modal>
				}

				{
					updateModalOpen &&
					<Modal title={<span style={{ fontSize: '24px', fontWeight: 'bold' }}>Cập nhật vùng</span>}
						   open={updateModalOpen}
						   onOk={handleUpdateCanvasContainer}
						   onCancel={handleCancelUpdateCanvasContainer}
						   okText='Lưu'
						   cancelText='Hủy'
						   okButtonProps={{
							   disabled: checkDisabledEdit,
							   style: okButtonStyleEdit,
						   }}
						   maskClosable={false}
					>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
							<div className={css.customForm}>
								<label>Tiêu đề của vùng</label>
								<Input
									placeholder='Tiêu đề'
									value={titleCanvasContainer}
									onChange={(e) => setTitleCanvasContainer(e.target.value)}
								/>
							</div>

							<div className={css.customForm}>
								<label>Mô tả vùng(tùy chọn)</label>
								<Input
									placeholder='Mô tả'
									value={descriptionCanvasContainer}
									onChange={(e) => setDescriptionCanvasContainer(e.target.value)}
								/>
							</div>

							<div className={css.customForm}>
								<label>Gắn thêm link liên kết</label>
								<p>Chức năng tạo ra 1 nút có thể bấm để người dùng truy cập tới liên kết </p>
								<Input
									placeholder='Gắn link'
									value={link}
									onChange={(e) => setLink(e.target.value)}
								/>
							</div>

							{/*<div className={css.customForm}>*/}
							{/*    <CustomRadioGroup defaultValue="folder" onChange={handleRadioChange}>*/}
							{/*        <Radio value="folder">*/}
							{/*            <span className="radio-label">Nhặt từ folder có sẵn</span>*/}
							{/*        </Radio>*/}
							{/*        <Radio value="new">*/}
							{/*            <span className="radio-label">Tạo vùng văn bản/ ghi chú mới</span>*/}
							{/*        </Radio>*/}
							{/*    </CustomRadioGroup>*/}
							{/*</div>*/}

							<div className={css.customForm}>
								<CustomRadioGroup value={selectedRadio} onChange={handleRadioChange2}>
									<Radio value='folder'>
										<span className='radio-label'>Folder có sẵn</span>
									</Radio>
									<Radio value='new'>
										<span className='radio-label'>Ghi chú mới</span>
									</Radio>
									<Radio value='chart'>
										<span className='radio-label'>Biểu đồ</span>
									</Radio>
									<Radio value='kpi'>
										<span className='radio-label'>KPI</span>
									</Radio>
								</CustomRadioGroup>
							</div>

							{selectedRadio === 'folder' && (
								<div className={css.customForm}>
									<label>Folder kho dữ liệu</label>
									<Select
										placeholder='Chọn kho dữ liệu'
										allowClear
										showSearch
										value={typeDataEdit}
										onChange={handleTypeDataEditChange}
										style={{ width: '100%', marginBottom: 10 }}
									>
										{fileTab.map((item) => (
											<Select.Option key={item.key} value={item.key}>
												{item.label}
											</Select.Option>
										))}
									</Select>
								</div>
							)}

							{typeDataEdit && selectedRadio != 'new' && (
								<>
                                    {selectedRadio === 'kpi' && (
                                        <div className={css.customForm}>
                                            <label style={{ marginBottom: 8 }}>Bật/Tắt biểu đồ</label>
                                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                                <Switch
                                                    className={css.customSwitch}
                                                    checked={isChartEnabled}
                                                    onChange={(checked) => setIsChartEnabled(checked)}
                                                    checkedChildren='Bật'
                                                    unCheckedChildren='Tắt'
                                                    style={{ width: 80 }}
                                                />
                                            </div>
                                        </div>

                                    )}
									<div className={css.customForm}>
										<label>Mục dữ liệu trong folder</label>
										<Select
											showSearch
											allowClear
											placeholder='Chọn Mục dữ liệu trong folder'
											optionFilterProp='label'
											value={componentInfoCanvasContainer}
											onChange={onChangeTypeContainer}
											onSearch={onSearch}
										>
											{fileTab.find(tab => tab.key == typeDataEdit)?.child?.map((item) => {
												const data = getTypeColorAndText(item.table);

												return (<Select.Option key={item.id} value={item.id}>
														<div className={css.itemContainer}>
															<span className={css.itemName}>{item.name}</span>
															<span className={css.itemText}
																  style={{ color: data.color }}>
                                                        ({data.text})
                                                    </span>
														</div>
													</Select.Option>
												);

											})}
											{/*{dataPacks.map(item => (*/}
											{/*    <Select.Option key={item.id} value={item.aiDatapackId}>*/}
											{/*        {item.name}*/}
											{/*    </Select.Option>*/}
											{/*))}*/}
										</Select>
									</div>
								</>
							)}
						</div>
					</Modal>
				}


				{openSetupUC &&
					<>
						<Modal
							title={`Cài đặt nhóm người dùng`}
							open={openSetupUC}
							onCancel={() => setOpenSetupUC(false)}
							onOk={() => {
								updateReportCanvas({
									id: siderId,
									userClass: Array.from(selectedUC),
								}).then(data => {
									setOpenSetupUC(false);
									fetchRC();
								});
							}}
							centered
							width={400}
							bodyStyle={{ height: '20vh', overflowY: 'auto' }}
						>
							{listUC.map((uc) => {
								// Nếu là admin thì luôn cho phép sửa
								// Nếu không phải admin thì chỉ cho phép sửa nếu currentUser.email nằm trong uc.userAccess (mảng email)
								const isDisabled = !currentUser?.isAdmin && !(uc.userAccess?.includes(currentUser?.email));
								return (
									<Checkbox
										key={uc.name}
										checked={selectedUC.has(uc.name)}
										onChange={() => handleChange(uc.name)}
										disabled={isDisabled}
									>
										{uc.name}
									</Checkbox>
								);
							})}
						</Modal>

					</>
				}
				<ChildWrapper
					openChildWrapper={openChildWrapper}
					setOpenChildWrapper={setOpenChildWrapper}
					layoutElementSelected={layoutElementSelected}
				/>


			</> :
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '90vh',
				color: 'red',
				fontSize: '18px',
			}}>
				Không có quyền để xem
			</div>
	);
};

export default CanvasContent;
