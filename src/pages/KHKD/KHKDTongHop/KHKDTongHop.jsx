import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, ColorPicker, Input, Modal, Popconfirm, Space, Spin, Table } from 'antd';
import { DeleteOutlined, DownOutlined, SettingOutlined, UpOutlined } from '@ant-design/icons';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import css from './../KHKD.module.css';
import { useParams } from 'react-router-dom';
import SetListElement from './../SetListElement/SetListElement.jsx';
import { getKHKDTongHopById, updateKHKDTongHop } from '../../../apis/khkdTongHopService.jsx';
import {
	addTT,
	convertDataKHKD,
	convertDataKQ,
	convertDataSL,
	mergeDataByKM,
	mergeDataBySL,
} from './../logicKHKD/combineDataKHKD.js';
import { getKHKDElementByKHKDId } from '../../../apis/khkdElementService.jsx';
import { formatMoney } from '../../../generalFunction/format.js';
import DTHDKD from '../KHKDDongTien/DTHDKD/DTHDKD.jsx';
import DTHDDT from '../KHKDDongTien/DTHDDT/DTHDDT.jsx';
import DTHDTC from '../KHKDDongTien/DTHDTC/DTHDTC.jsx';
import { handleViewResult, tinhDongTien } from '../logicKHKD/calDongTien.js';
import ViewDongTien from '../KHKDDongTien/ViewDongTien/ViewDongTien.jsx';
import { MyContext } from '../../../MyContext.jsx';
import ActionDetail from '../ActionDetail/ActionDetail.jsx';
import { KHBanHang } from '../KHBanHang/KHBanHang.jsx';
import KHKDChuKy from '../KHKDChuKy/KHKDChuKy.jsx';
import ActionDetailDL from '../ActionDetail/ActionDetailDL.jsx';
import { getAllDienGiai } from '../../../apis/dienGiaiService.jsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import Loading3DTower from '../../../components/Loading3DTower';

const KHKDTongHop = () => {
	const { idHopKH } = useParams();
	const [khkdTH, setKhkdTH] = useState(null);
	const [dataDoLuong, setDataDoLuong] = useState([]);
	const [dataKetQua, setDataKetQua] = useState([]);
	const [listElement, setListElement] = useState([]);
	const [isSetListElementModalVisible, setIsSetListElementModalVisible] = useState(false);
	const openSetListModal = () => setIsSetListElementModalVisible(true);
	const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
	const [groups, setGroups] = useState([]);
	const [newGroupName, setNewGroupName] = useState('');
	const [groupSelections, setGroupSelections] = useState({});
	const [isFormulaModalVisible, setIsFormulaModalVisible] = useState(false);
	const [formulaGroupName, setFormulaGroupName] = useState('');
	const [formula, setFormula] = useState('');
	const [formulaVars, setFormulaVars] = useState([]);
	const [isColorModalVisible, setIsColorModalVisible] = useState(false);
	const [selectedFormulaGroup, setSelectedFormulaGroup] = useState('');
	const [isDuyet, setIsDuyet] = useState(false);
	const [dataDongTien, setDataDongTien] = useState([]);
	const [dataTT, setDataTT] = useState([]);
	const { loadSidebarHopKH, setLoadSidebarHopKH } = useContext(MyContext);
	const [listDienGiai, setListDienGiai] = useState([]);
	const [loadingKHKD, setLoadingKHKD] = useState(false);
	const [isAddGroupModalVisible, setIsAddGroupModalVisible] = useState(false);
	const [checkedRowName, setCheckedRowName] = useState(null);

	const fetchDataDienGiai = async () => {
		const data = await getAllDienGiai();
		if (data.length > 0) {
			setListDienGiai(data);
		}
	};
	useEffect(() => {
		fetchDataDienGiai();
	}, []);

	const openGroupModal = () => {
		if (khkdTH?.setting) {
			const groupArr = Object.entries(khkdTH.setting)
				.filter(([k, v]) => typeof v === 'object' && v.position !== undefined)
				.map(([name, v]) => ({ name, position: v.position }));
			setGroups(groupArr.sort((a, b) => a.position - b.position));
			setGroupSelections(khkdTH.setting);
		}
		setIsGroupModalVisible(true);
	};
	const closeGroupModal = () => setIsGroupModalVisible(false);

	const handleAddGroup = async () => {
		if (newGroupName.trim()) {
			const maxPos = groups.length > 0 ? Math.max(...groups.map(g => g.position)) : 0;
			const newGroup = { name: newGroupName, position: maxPos + 1, items: [] };
			setGroups([...groups, newGroup]);
			setGroupSelections({ ...groupSelections, [newGroupName]: { position: newGroup.position, items: [] } });

			const updatedRowData = {
				...khkdTH,
				setting: {
					...khkdTH.setting,
					[newGroupName]: { position: newGroup.position, items: [] },
				},
			};
			try {
				await updateKHKDTongHop(updatedRowData);
			} catch (error) {
				console.error('Error updating group:', error);
			}
			setNewGroupName('');
		}
	};
	const handleCheckboxChange = (group, rowName, checked) => {
		setGroupSelections((prev) => {
			const updatedSelections = { ...prev };
			if (!updatedSelections[group].items) updatedSelections[group].items = [];
			if (checked) {
				updatedSelections[group].items = [...updatedSelections[group].items, rowName];
				setCheckedRowName(rowName); // Set the currently checked row name
			} else {
				updatedSelections[group].items = updatedSelections[group].items.filter((name) => name !== rowName);
				setCheckedRowName(null); // Clear the checked row name
			}
			return updatedSelections;
		});
	};

	const handleSaveGroups = async () => {
		const updatedSetting = { ...khkdTH.setting };
		groups.forEach((g, idx) => {
			if (!updatedSetting[g.name]) updatedSetting[g.name] = {};
			updatedSetting[g.name].position = idx + 1;
		});
		Object.keys(updatedSetting).forEach(k => {
			if (!groups.find(g => g.name === k) && updatedSetting[k]?.position !== undefined) {
				delete updatedSetting[k];
			}
		});
		groups.forEach(g => {
			if (groupSelections[g.name]) {
				Object.assign(updatedSetting[g.name], groupSelections[g.name]);
			}
		});
		const updatedRowData = {
			...khkdTH,
			setting: updatedSetting,
		};
		try {
			await updateKHKDTongHop(updatedRowData);
			setKhkdTH(updatedRowData);
			setIsGroupModalVisible(false);
		} catch (error) {
			console.error('Error saving settings:', error);
		}
	};
	useEffect(() => {
		// Fetch initial duyet status
		const fetchDuyetStatus = async () => {
			try {
				const khkdTH = await getKHKDTongHopById(idHopKH);
				setIsDuyet(khkdTH.duyet || false);
			} catch (error) {
				console.error('Error fetching duyet status:', error);
			}
		};

		fetchDuyetStatus();
	}, [idHopKH]);

	const handleDuyetChange = async (checked) => {
		try {
			const updatedData = { duyet: checked }; // Use the 'checked' value for 'duyet'
			await updateKHKDTongHop({ id: idHopKH, ...updatedData });
			setIsDuyet(checked); // Update the local state
			setLoadSidebarHopKH(!loadSidebarHopKH);
		} catch (error) {
			console.error('Error updating duyet status:', error);
		}
	};


	const handleSaveColors = async () => {
		const updatedSetting = {
			...khkdTH.setting,
			...groupSelections,
			__order: groups,
		};
		const updatedRowData = {
			...khkdTH,
			setting: updatedSetting,
		};
		try {
			await updateKHKDTongHop(updatedRowData);
			setKhkdTH(updatedRowData);
			setIsColorModalVisible(false);
		} catch (error) {
			console.error('Error saving colors:', error);
		}
	};

	const handleDeleteGroup = async (groupName) => {
		const newGroups = groups.filter(g => g.name !== groupName);
		const newGroupSelections = { ...groupSelections };
		delete newGroupSelections[groupName];
		const updatedSetting = { ...khkdTH.setting };
		delete updatedSetting[groupName];
		const updatedRowData = {
			...khkdTH,
			setting: updatedSetting,
		};
		try {
			await updateKHKDTongHop(updatedRowData);
			setKhkdTH(updatedRowData);
			setGroups(newGroups);
			setGroupSelections(newGroupSelections);
		} catch (error) {
			console.error('Error deleting group:', error);
		}
	};

	const handleNameChange = (groupName, newName) => {
		if (!newName.trim() || groupName === newName) return;
		const newGroups = groups.map(g => g.name === groupName ? { ...g, name: newName } : g);
		const newGroupSelections = { ...groupSelections };
		newGroupSelections[newName] = { ...newGroupSelections[groupName] };
		delete newGroupSelections[groupName];
		setGroups(newGroups);
		setGroupSelections(newGroupSelections);
	};

	async function fetchKHTH() {
		let khkdTH = await getKHKDTongHopById(idHopKH);
		setKhkdTH(khkdTH);
		let listElement = [];
		if (khkdTH.listKHKD) {
			for (const elementId of khkdTH.listKHKD) {
				let elements = await getKHKDElementByKHKDId(elementId);
				elements.map(element => {
					element.data = convertDataKHKD(element.data);
					listElement.push(element);
				});
			}
		}
		let ttData = addTT(listElement);
		setDataTT(ttData);
		let dataSL = mergeDataBySL(ttData);
		let dataKQ = mergeDataByKM(ttData);
		setDataDoLuong(convertDataSL(dataSL).filter(e => e.name));
		setDataKetQua(convertDataKQ(dataKQ).filter(e => e.name));
		setListElement(listElement);
		let { dauKy, settingDongTien, settingDongTienTC, settingDongTienDT } = khkdTH;
		settingDongTien = handleViewResult(settingDongTien, convertDataKQ(dataKQ));
		setDataDongTien(tinhDongTien(+dauKy, settingDongTien, settingDongTienTC, settingDongTienDT));
	}
	useEffect(() => {
		const fetch = async () => {
			setLoadingKHKD(true);
			try {
				await fetchKHTH();
			} finally {
				setLoadingKHKD(false);
			}
		};
		fetch();
	}, [idHopKH]);

	const baseColumns = [
		{
			headerName: 'Tên', field: 'name', pinned: 'left', width: 460,
			cellRenderer: (params) => <ActionDetailDL {...params}
													  khkdTH={khkdTH}
													  listDienGiai={listDienGiai} />,
		},
		...Array.from({ length: 12 }, (_, i) => ({
			headerName: `Tháng ${i + 1}`,
			field: `t${i + 1}`,
			editable: false,
			valueFormatter: (params) => formatMoney(params.value),
			cellStyle: { textAlign: 'right' },
			headerClass: 'ag-right-aligned-header',
			width: 130,
		})),
	];

	const columns = [
		{
			title: 'Tên nhóm',
			dataIndex: 'name',
			key: 'name',
			render: (text, record) => (
				<Input
					defaultValue={text}
					onBlur={(e) => handleNameChange(text, e.target.value)}
					style={{ width: '200px' }}
				/>
			),
		},
		{
			title: 'Chọn nhóm',
			dataIndex: 'selections',
			key: 'selections',
			render: (_, record) => {
				const group = groupSelections[record.name];
				if (group?.items) {
					return (
						<div>
							{dataKetQua.map((row) => {
								const isCheckedInAnyGroup = Object.values(groupSelections).some(
									(g) => g.items && g.items.includes(row.name)
								);
								return (
									<Checkbox
										key={row.name}
										checked={group.items.includes(row.name)}
										onChange={(e) => handleCheckboxChange(record.name, row.name, e.target.checked)}
									>
									   <span
										   style={{
											   color: isCheckedInAnyGroup ? 'red' : 'inherit',
										   }}
									   >
										{row.name}
									   </span>
									</Checkbox>
								);
							})}
						</div>
					);
				}
				return null;
			},
		},
		{
			title: 'Thao tác',
			key: 'actions',
			width: 200,
			render: (_, record, index) => (
				<Space>
					<Button
						icon={<UpOutlined />}
						size='small'
						disabled={index === 0}
						onClick={() => moveGroup(index, -1)}
					/>
					<Button
						icon={<DownOutlined />}
						size='small'
						disabled={index === groups.length - 1}
						onClick={() => moveGroup(index, 1)}
					/>
					{groupSelections[record.name]?.formula && (
						<Button
							icon={<SettingOutlined />}
							size='small'
							onClick={() => {
								setSelectedFormulaGroup(record.name);
								setIsColorModalVisible(true);
							}}
						/>
					)}
					<Popconfirm
						title='Xác nhận xóa'
						description='Bạn có chắc chắn muốn xóa nhóm này?'
						onConfirm={() => handleDeleteGroup(record.name)}
						okText='Đồng ý'
						cancelText='Hủy'
					>
						<Button
							icon={<DeleteOutlined />}
							size='small'
							danger
						/>
					</Popconfirm>
				</Space>
			),
		},
	];

	const groupColumns = [
		{
			headerName: '',
			minWidth: 30,
			maxWidth: 30,
			editable: false,
			floatingFilter: false,
			cellRenderer: 'agGroupCellRenderer',
			cellRendererParams: {
				suppressCount: true,
				innerRenderer: (params) => {
					return params.value;
				},
				innerRendererParams: {
					style: {
						display: 'flex',
						alignItems: 'center',
						height: '100%',
					},
				},
			},
			pinned: 'left',
		},
		{
			headerName: 'Tên',
			field: 'name',
			pinned: 'left',
			width: 430,
			cellRenderer: (params) => <ActionDetail {...params}
													khkdTH={khkdTH}
													listDienGiai={listDienGiai} />,
			// cellStyle: (params) => {
			// 	if (params.data.formula) {
			// 		const groupSettings = khkdTH?.setting?.[params.data.name] || {};
			// 		return {
			// 			backgroundColor: groupSettings.background || '#f0f7ff',
			// 			color: groupSettings.text || '#0066cc',
			// 			fontWeight: 'bold',
			// 		};
			// 	}
			// 	return {};
			// },
		},
		...Array.from({ length: 12 }, (_, i) => ({
			headerName: `Tháng ${i + 1}`,
			field: `t${i + 1}`,
			editable: true,
			width: 130,
			cellStyle: (params) => {
				// if (params.data.formula) {
				// 	const groupSettings = khkdTH?.setting?.[params.data.name] || {};
				// 	return {
				// 		backgroundColor: groupSettings.background || '#f0f7ff',
				// 		color: groupSettings.text || '#0066cc',
				// 		textAlign: 'right',
				// 	};
				// }
				let parent = params.data.layer && !params.data.layer.includes('.');
				if (parent) {return { textAlign: 'right', fontWeight: '600'}}
				return { textAlign: 'right' } ;
			},
			headerClass: 'ag-right-aligned-header',
			valueFormatter: (params) => formatMoney(params.value),
		})),
	];

	const processGroupedData = (data, settings) => {
		if (!settings) return data;
		const groupArr = Object.entries(settings)
			.filter(([k, v]) => typeof v === 'object' && v.position !== undefined)
			.map(([name, v]) => ({ name, ...v }));
		const groupsSorted = groupArr.sort((a, b) => a.position - b.position);
		const processedData = [];
		const groupedNames = new Set();
		let groupIndex = 0;
		const groupValues = {};
		groupsSorted.forEach((group) => {
			const groupName = group.name;
			const groupObj = settings[groupName];
			groupIndex++;
			// Nếu là nhóm thường (có items)
			if (Array.isArray(groupObj.items)) {
				const parentRow = {
					name: groupName,
					layer: groupIndex.toString(),
					isGroup: true,
					t1: 0, t2: 0, t3: 0, t4: 0, t5: 0, t6: 0,
					t7: 0, t8: 0, t9: 0, t10: 0, t11: 0, t12: 0,
				};
				groupObj.items.forEach((itemName, itemIndex) => {
					const matchingItem = (data || []).find(d => d.name === itemName);
					if (matchingItem) {
						groupedNames.add(itemName);
						const childRow = {
							...matchingItem,
							layer: `${groupIndex}.${itemIndex + 1}`,
							isGroup: false,
						};
						processedData.push(childRow);
						for (let i = 1; i <= 12; i++) {
							const monthKey = `t${i}`;
							parentRow[monthKey] += Number(matchingItem[monthKey]) || 0;
						}
					}
				});
				processedData.push(parentRow);
				groupValues[groupName] = parentRow;
			} else if (typeof groupObj === 'object' && groupObj.formula) {
				let formula = groupObj.formula;
				const formulaRow = {
					name: groupName,
					layer: groupIndex.toString(),
					isGroup: true,
					formula: true,
				};
				const groupNames = Object.keys(groupValues).sort((a, b) => b.length - a.length);
				for (let i = 1; i <= 12; i++) {
					let expr = formula;
					groupNames.forEach(name => {
						expr = expr.split(name).join(groupValues[name][`t${i}`] || 0);
					});
					try {
						formulaRow[`t${i}`] = eval(expr);
					} catch (e) {
						console.error(`Error evaluating formula for month ${i}:`, e);
						formulaRow[`t${i}`] = 0;
					}
				}
				processedData.push(formulaRow);
				groupValues[groupName] = formulaRow;
			}
		});
		const ungroupedItems = (data || []).filter(item => !groupedNames.has(item.name));
		if (ungroupedItems.length > 0) {
			groupIndex++;
			const otherParent = {
				name: 'Chưa phân nhóm',
				layer: groupIndex.toString(),
				isGroup: true,
				t1: 0, t2: 0, t3: 0, t4: 0, t5: 0, t6: 0,
				t7: 0, t8: 0, t9: 0, t10: 0, t11: 0, t12: 0,
			};
			ungroupedItems.forEach((item, idx) => {
				const childRow = {
					...item,
					layer: `${groupIndex}.${idx + 1}`,
					isGroup: false,
				};
				processedData.push(childRow);
				for (let i = 1; i <= 12; i++) {
					const monthKey = `t${i}`;
					otherParent[monthKey] += Number(item[monthKey]) || 0;
				}
			});
			processedData.push(otherParent);
		}
		const sortedData = processedData.sort((a, b) => {
			const aLayers = a.layer.split('.');
			const bLayers = b.layer.split('.');
			for (let i = 0; i < Math.max(aLayers.length, bLayers.length); i++) {
				const aVal = parseInt(aLayers[i] || '0');
				const bVal = parseInt(bLayers[i] || '0');
				if (aVal !== bVal) {
					return aVal - bVal;
				}
			}
			return 0;
		});
		return sortedData;
	};

	const defaultColDef = useMemo(() => {
		return {
			editable: false,
			filter: true,
			cellStyle: {
				fontSize: '14.5px',
				color: 'var(--text-color)',
				fontFamily: 'var(--font-family)',
			},
			width: 120,
			wrapHeaderText: true,
			autoHeaderHeight: true,
		};
	}, []);

	function isBold(params) {
		const isBold = params.data.layer?.toString().includes('.');
		return {
			textAlign: 'left',
			paddingRight: 10,
			fontWeight: isBold ? 'normal' : 'bold',
		};
	}

	const moveGroup = (idx, direction) => {
		if (idx + direction < 0 || idx + direction >= groups.length) return;
		const newGroups = [...groups];
		const posA = newGroups[idx].position;
		const posB = newGroups[idx + direction].position;
		newGroups[idx].position = posB;
		newGroups[idx + direction].position = posA;
		setGroups(newGroups.sort((a, b) => a.position - b.position));
	};

	const handleCreateFormulaGroup = () => {
		if (!formulaGroupName.trim() || !formula.trim()) return;
		const maxPos = groups.length > 0 ? Math.max(...groups.map(g => g.position)) : 0;
		let realFormula = formula;
		formulaVars.forEach(item => {
			if (item.group) {
				realFormula = realFormula.replace(
					new RegExp(`\\b${item.var}\\b`, 'g'),
					item.group,
				);
			}
		});
		const newGroup = { name: formulaGroupName, position: maxPos + 1 };
		setGroups([...groups, newGroup]);
		setGroupSelections({
			...groupSelections,
			[formulaGroupName]: { formula: realFormula, position: newGroup.position },
		});
		setIsFormulaModalVisible(false);
		setFormula('');
		setFormulaGroupName('');
		setFormulaVars([]);
	};

	const handleFormulaChange = (e) => {
		const value = e.target.value;
		setFormula(value);

		const matches = value.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
		const uniqueVars = Array.from(new Set(matches));
		setFormulaVars((prev) =>
			uniqueVars.map((v) => ({
				var: v,
				group: prev.find((item) => item.var === v)?.group || '',
			})),
		);
	};

	const handleColorChange = (groupName, type, color) => {
		setGroupSelections(prev => ({
			...prev,
			[groupName]: {
				...prev[groupName],
				[type]: color.toHexString(),
			},
		}));
	};

	const renderFormulaGroup = (group) => {
		if (groupSelections[group]?.formula) {
			return (
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ fontStyle: 'italic', color: '#888' }}>
						Công thức: {groupSelections[group].formula}
					</div>
					<Button
						size='small'
						onClick={() => {
							setSelectedFormulaGroup(group);
							setIsColorModalVisible(true);
						}}
					>
						Cài đặt màu
					</Button>
				</div>
			);
		}
		return null;
	};

	const printRef = useRef();
	const [ isExporting ,setIsExporting] = useState(false)
	const handleExport = async () => {
		const element = printRef.current;
		if (!element) return;

		setIsExporting(true);

		try {
			const pxToMm = 0.264583; // 1px = 0.264583 mm

			// Chụp toàn bộ element (scrollHeight)
			const canvas = await html2canvas(element, {
				scale: 2,
				useCORS: true,
				scrollY: -window.scrollY,
				width: element.scrollWidth,
				height: element.scrollHeight,
			});

			const imgData = canvas.toDataURL("image/jpeg", 1.0);

			const pdfWidth = canvas.width * pxToMm;
			const pdfHeight = canvas.height * pxToMm;

			// Tạo pdf với khổ tùy chỉnh (width x height)
			const pdf = new jsPDF({
				orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
				unit: "mm",
				format: [pdfWidth, pdfHeight],
			});

			pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

			pdf.save("bao-cao.pdf");
		} catch (error) {
			console.error("Lỗi khi xuất PDF:", error);
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<>
			{loadingKHKD ? (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
		<Loading3DTower /> 
				</div>
			) : (
			<div className={css.KHKDContainer} ref={printRef}>
				<div className={css.duyetContainer}>
					<h1 className={css.title}>{khkdTH?.name}</h1>
					<div className={css.headerButton}>
						<Checkbox
							className={css.duyetCheckbox}
							checked={isDuyet}
							onChange={(e) => handleDuyetChange(e.target.checked)}
						>
							Duyệt
						</Checkbox>
						<Button className={css.actionButton} onClick={() => handleExport()}>PDF</Button>
						<Button className={css.actionButton} onClick={openSetListModal}>
							Cài đặt
						</Button>
					</div>
				</div>

				{khkdTH && khkdTH.showBH && dataTT && <>
					<KHBanHang fetchKHTH={fetchKHTH}
							   dataTT={dataTT.filter(e => e.phanLoai?.trim().toLowerCase() === 'doanh thu')} />

					<div style={{ borderTop: '2px solid #c6d2d3', margin: '20px 0', borderRadius: '5px' }}></div>
				</>
				}

				{khkdTH && khkdTH.showDL &&
					<>
						<div className={css.caiDatNhomKetQuaContainer}>
							<h2>ĐO LƯỜNG</h2>
						</div>
						<div className='ag-theme-quartz' style={{ marginBottom: 20, height: '400px', width: '100%' }}>
							<AgGridReact 
								columnDefs={baseColumns} 
								rowData={dataDoLuong} 
								domLayout="normal"
								style={{ width: '100%', height: '100%' }}
							/>
						</div>

						<div style={{ borderTop: '2px solid #c6d2d3', margin: '20px 0', borderRadius: '5px' }}></div>
					</>
				}

				{khkdTH && khkdTH.showKD &&
					<>
						<div className={css.ketQuaKinhDoanhDuTinhContainer} style={{ width: '100%' }}>
							<h2>KẾT QUẢ KINH DOANH DỰ TÍNH</h2>
							<div className={css.headerButton}>
								<Button className={css.caiDatButton} onClick={openGroupModal}>
									Cài đặt nhóm
								</Button>
							</div>
							<Modal
								title='Cài đặt nhóm kết quả'
								visible={isGroupModalVisible}
								onCancel={closeGroupModal}
								footer={null}
								width={800}
							>
								<div style={{ marginBottom: 16 }}>
									<Button
										onClick={() => setIsAddGroupModalVisible(true)}
										style={{ marginRight: 8 }}
									>
										Tạo subtotal
									</Button>

									<Modal
										title='Tạo nhóm mới'
										visible={isAddGroupModalVisible}
										onCancel={() => setIsAddGroupModalVisible(false)}
										footer={[
											<Button key="cancel" onClick={() => setIsAddGroupModalVisible(false)}>
												Huỷ
											</Button>,
											<Button
												key="add"
												type="primary"
												onClick={() => {
													handleAddGroup();
													setIsAddGroupModalVisible(false);
												}}
											>
												Thêm nhóm
											</Button>,
										]}
									>
										<Input
											placeholder='Nhập tên nhóm mới'
											value={newGroupName}
											onChange={(e) => setNewGroupName(e.target.value)}
											style={{ width: 200, marginRight: 8 }}
										/>
									</Modal>
									<Button onClick={() => setIsFormulaModalVisible(true)}>
										Tạo Grand Total
									</Button>
								</div>
								<Table
									columns={columns}
									dataSource={groups.sort((a, b) => a.position - b.position).map(g => ({
										name: g.name,
										key: g.name,
									}))}
									pagination={false}
									size='small'
								/>
								<div style={{ marginTop: 20, textAlign: 'right' }}>
									<Button onClick={closeGroupModal} style={{ marginRight: 10 }}>
										Huỷ
									</Button>
									<Button type='primary' onClick={handleSaveGroups}>
										Lưu
									</Button>
								</div>
							</Modal>
						</div>

						<div className='ag-theme-quartz' style={{ marginBottom: 40 }}>
							<AgGridReact
								columnDefs={groupColumns}
								rowData={processGroupedData(dataKetQua, khkdTH?.setting)}
								domLayout='autoHeight'
								treeData={true}
								groupDefaultExpanded={-1}
								getDataPath={(data) => data.layer?.toString().split('.')}

								rowClassRules={{
									'row-head': (params) => {
										return params.data.layer?.toString().split('.').length === 1;
									},
								}}

								groupDisplayType='groupRows'
								animateRows={true}
								defaultColDef={defaultColDef}
								enableRangeSelection={true}
								statusBar={{
									statusPanels: [{ statusPanel: 'agAggregationComponent' }],
								}}
							/>
						</div>

						<div style={{ borderTop: '2px solid #c6d2d2', margin: '20px 0' }}></div>
					</>
				}
				{khkdTH && khkdTH.showDT &&
					<>
						<h2 style={{ marginBottom: 16 }}>DÒNG TIỀN</h2>
						{khkdTH.showDTFull &&
							<>
								{dataDongTien && <ViewDongTien dataDongTien={dataDongTien} />}
							</>
						}
						<DTHDKD dataKetQua={dataKetQua} khkdTH={khkdTH} fetchKHTH={fetchKHTH} />
						{khkdTH.showDTFull &&
							<>
								<DTHDDT khkdTH={khkdTH} setKhkdTH={setKhkdTH} fetchKHTH={fetchKHTH} />
								<DTHDTC khkdTH={khkdTH} setKhkdTH={setKhkdTH} fetchKHTH={fetchKHTH} />
							</>
						}

					</>
				}


				{/*<h2>Dự kiến đồng tiền</h2>*/}
				{/*<div className="ag-theme-quartz">*/}
				{/*	<AgGridReact columnDefs={baseColumns} rowData={dataDongTien} domLayout="autoHeight" />*/}
				{/*</div>*/}
			</div>
			)}
			{isSetListElementModalVisible && <SetListElement isVisible={isSetListElementModalVisible}
															 onClose={() => setIsSetListElementModalVisible(false)}
															 idHopKH={idHopKH} khkdTH={khkdTH}
															 fetchKHTH={fetchKHTH}
			/>}

			<Modal
				title='Tạo nhóm công thức'
				visible={isFormulaModalVisible}
				onCancel={() => setIsFormulaModalVisible(false)}
				onOk={handleCreateFormulaGroup}
			>
				<Input
					placeholder='Tên nhóm công thức'
					value={formulaGroupName}
					onChange={e => setFormulaGroupName(e.target.value)}
					style={{ marginBottom: 10 }}
				/>
				<Input
					placeholder='Công thức (ví dụ: a + b - c)'
					value={formula}
					onChange={handleFormulaChange}
					style={{ marginBottom: 10 }}
				/>
				{formulaVars.map((item, idx) => (
					<div key={item.var} style={{ marginBottom: 8 }}>
						<span style={{ marginRight: 8 }}>{item.var}:</span>
						<select
							value={item.group}
							onChange={e => {
								const newVars = [...formulaVars];
								newVars[idx].group = e.target.value;
								setFormulaVars(newVars);
							}}
						>
							<option value=''>Chọn nhóm</option>
							{groups.map(g => (
								<option key={g.name} value={g.name}>{g.name}</option>
							))}
						</select>
					</div>
				))}
			</Modal>
			<Modal
				title='Cài đặt màu cho nhóm công thức'
				visible={isColorModalVisible}
				onCancel={() => setIsColorModalVisible(false)}
				onOk={handleSaveColors}
			>
				{selectedFormulaGroup && (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<div>
							<div style={{ marginBottom: '8px' }}>Màu nền:</div>
							<ColorPicker
								value={groupSelections[selectedFormulaGroup]?.background || '#f0f7ff'}
								onChange={(color) => handleColorChange(selectedFormulaGroup, 'background', color)}
							/>
						</div>
						<div>
							<div style={{ marginBottom: '8px' }}>Màu chữ:</div>
							<ColorPicker
								value={groupSelections[selectedFormulaGroup]?.text || '#0066cc'}
								onChange={(color) => handleColorChange(selectedFormulaGroup, 'text', color)}
							/>
						</div>
					</div>
				)}
			</Modal>
		</>
	);
};

export default KHKDTongHop;
