import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import css from './../KHKD.module.css';
import { useParams } from 'react-router-dom';
import SetListElement from './../SetListElement/SetListElement.jsx';
import { getKHKDTongHopById } from '../../../apis/khkdTongHopService.jsx';
import {
	addTT,
	calculateDifferences,
	convertDataKHKD,
	convertDataKQ,
	convertDataSL,
	convertDataTH,
	mergeColumnsKHKD,
	mergeDataByKM,
	mergeDataBySL,
} from './../logicKHKD/combineDataKHKD.js';
import { getTemplateRow } from '../../../apis/templateSettingService.jsx';
import { getKHKDElementByKHKDId } from '../../../apis/khkdElementService.jsx';
import { formatMoney } from '../../../generalFunction/format.js';
import { handleViewResult, tinhDongTien } from '../logicKHKD/calDongTien.js';
import DTHDKDView from '../KHKDDongTien/DTHDKD/DTHDKDView.jsx';
import DTHDDTView from '../KHKDDongTien/DTHDDT/DTHDDTView.jsx';
import DTHDTCView from '../KHKDDongTien/DTHDTC/DTHDTCView.jsx';
import KHKDChuKyView from '../KHKDChuKy/KHKDChuKyView.jsx';
import KHKDKPI from './KPI/KHKDKPI.jsx';
import KHKDBenchMark from './BenchMark/KHKDBenchMark.jsx';
import KHKDTitle from './TitleComponent/KHKDTitle.jsx';
import ActionDetail from '../ActionDetail/ActionDetail.jsx';
import ActionDetailDL from '../ActionDetail/ActionDetailDL.jsx';
import { getAllDienGiai } from '../../../apis/dienGiaiService.jsx';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { toast } from 'react-toastify';
import { SettingLuyKeDL } from './SettingLuyKe/SettingLuyKeDL.jsx';
import { Button, Dropdown, Menu, Spin } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { getLuyKeValue } from './SettingLuyKe/logicLuyKe.js';
import { uploadFiles } from '../../../apis/uploadManyFIleService.jsx';
import { createNewFile } from '../../../apis/fileService.jsx';
import Loading3DTower from '../../../components/Loading3DTower';

const KHKDTongHopView2 = () => {
	const { idHopKH } = useParams();
	const [khkdTH, setKhkdTH] = useState(null);
	const [isSetListElementModalVisible, setIsSetListElementModalVisible] = useState(false);
	const [dataDoLuong, setDataDoLuong] = useState([]);
	const [dataSL, setDataSL] = useState([]);
	const [dataKetQua, setDataKetQua] = useState([]);
	const [dataDongTienTHCK, setDataDongTienTHCK] = useState([]);
	const [dataDongTienTHCKDT, setDataDongTienTHCKDT] = useState([]);
	const [dataDongTienTHCKTC, setDataDongTienTHCKTC] = useState([]);
	const [settingMonth, setSettingMonth] = useState([]);
	const [showCungKy, setShowCungKy] = useState(false);
	const [dataDongTien, setDataDongTien] = useState([]);
	const [dataTT, setDataTT] = useState([]);
	const [listDienGiai, setListDienGiai] = useState([]);
	const [dataDT1AI, setDataDT1AI] = useState([]);
	const [dKPIDataAI, setKPIDataAI] = useState([]);
	const [showLuyKeDL, setShowLuyKeDL] = useState(false);

	const fetchDataDienGiai = async () => {
		const data = await getAllDienGiai();
		if (data.length > 0) {
			setListDienGiai(data);
		}
	};
	useEffect(() => {
		fetchDataDienGiai();
	}, []);

	const defaultColDef = useMemo(() => ({
		editable: true,
		filter: true,
		suppressMenu: true,
		cellStyle: { fontSize: '14.5px' },
		wrapHeaderText: true,
		autoHeaderHeight: true,
		width: 120,
	}), []);

	async function fetchKHTH() {
		let khkdTH = await getKHKDTongHopById(idHopKH);
		setKhkdTH(khkdTH);
		setSettingMonth(khkdTH.month);
		setShowCungKy(khkdTH.info?.showCungKy ?? false);
		let dataKDTH = [];
		let dataKDCK = [];
		let dataDLTH = [];
		let dataDLCK = [];
		let dataDTTH = [];
		let dataDTCK = [];
		if (khkdTH.listTemplate) {
			if (khkdTH.listTemplate.thucHien) {
				let thucHien = khkdTH.listTemplate.thucHien;
				let dataResponse = await getTemplateRow(thucHien.templateId);
				let data = dataResponse.rows || [];
				if (data.length > 0) {
					data = data.map(item => item.data);
					dataKDTH = convertDataTH(data, thucHien.columnName);
				}
			}
			if (khkdTH.listTemplate.cungKy) {
				let thucHien = khkdTH.listTemplate.cungKy;
				let dataResponse = await getTemplateRow(thucHien.templateId);
				let data = dataResponse.rows || [];
				if (data.length > 0) {
					data = data.map(item => item.data);
					dataKDCK = convertDataTH(data, thucHien.columnName, 'ck');
				}
			}
			if (khkdTH.listTemplate.doLuongCungKy) {
				let thucHien = khkdTH.listTemplate.doLuongCungKy;
				let dataResponse = await getTemplateRow(thucHien.templateId);
				let data = dataResponse.rows || [];
				if (data.length > 0) {
					data = data.map(item => item.data);
					dataDLCK = convertDataTH(data, thucHien.columnName, 'ck');
				}
			}
			if (khkdTH.listTemplate.doLuongThucHien) {
				let thucHien = khkdTH.listTemplate.doLuongThucHien;
				let dataResponse = await getTemplateRow(thucHien.templateId);
				let data = dataResponse.rows || [];
				if (data.length > 0) {
					data = data.map(item => item.data);
					dataDLTH = convertDataTH(data, thucHien.columnName);
				}
			}
			if (khkdTH.listTemplate.dongTienCungKy) {
				let thucHien = khkdTH.listTemplate.dongTienCungKy;
				let dataResponse = await getTemplateRow(thucHien.templateId);
				let data = dataResponse.rows || [];
				if (data.length > 0) {
					data = data.map(item => item.data);
					dataDTCK = convertDataTH(data, thucHien.columnName, 'ck');
				}
			}
			if (khkdTH.listTemplate.dongTienThucHien) {
				let thucHien = khkdTH.listTemplate.dongTienThucHien;
				let dataResponse = await getTemplateRow(thucHien.templateId);
				let data = dataResponse.rows || [];
				if (data.length > 0) {
					data = data.map(item => item.data);
					dataDTTH = convertDataTH(data, thucHien.columnName);
				}
			}
		}
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
		dataSL = convertDataSL(dataSL);
		dataSL = mergeColumnsKHKD(dataSL, dataDLTH, dataDLCK);
		dataSL = dataSL.filter(e => e.name);
		setDataDoLuong(dataSL);

		let dataKQ = mergeDataByKM(ttData);
		dataKQ = convertDataKQ(dataKQ);
		let dataKQMerge = mergeColumnsKHKD(dataKQ, dataKDTH, dataKDCK);
		dataKQMerge = dataKQMerge.filter(e => e.name);
		setDataKetQua(dataKQMerge);

		let { dauKy, settingDongTien, settingDongTienTC, settingDongTienDT } = khkdTH;
		if (!settingDongTienDT) {
			settingDongTienDT = [];
		}
		if (!settingDongTienTC) {
			settingDongTienTC = [];
		}
		settingDongTien = handleViewResult(settingDongTien, dataKQ);
		let dataDTMerge = mergeColumnsKHKD(settingDongTien, dataDTTH, dataDTCK);
		setDataDongTienTHCK(dataDTMerge);
		settingDongTienDT.forEach(item => {
			item.name = item.moTa;
		});
		let dataDTDTMerge = mergeColumnsKHKD(settingDongTienDT, dataDTTH, dataDTCK);
		setDataDongTienTHCKDT(dataDTDTMerge);
		settingDongTienTC.forEach(item => {
			item.name = item.moTa;
		});
		let dataDTTCMerge = mergeColumnsKHKD(settingDongTienTC, dataDTTH, dataDTCK);
		setDataDongTienTHCKTC(dataDTTCMerge);
		setDataDongTien(tinhDongTien(+dauKy, settingDongTien, settingDongTienTC, settingDongTienDT));
	}

	useEffect(() => {
		const fetchData = async () => {
			setLoadingKHKD(true);
			try {
				await fetchKHTH(); // fetch kế hoạch tổng hợp
			} catch (error) {
				console.error('Error fetching KHTH:', error);
			} finally {
				setLoadingKHKD(false);
			}
		};

		if (idHopKH) {
			fetchData();
		}
	}, [idHopKH]);


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
			if (Array.isArray(groupObj.items)) {
				const parentRow = {
					name: groupName,
					layer: groupIndex.toString(),
					isGroup: true,
				};
				for (let i = 1; i <= 12; i++) {
					parentRow[`t${i}`] = 0;
					parentRow[`t${i}_th`] = 0;
					parentRow[`t${i}_cl_th`] = 0;
					parentRow[`t${i}_ck`] = 0;
					parentRow[`t${i}_cl_ck`] = 0;
				}
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
							const t = Number(matchingItem[`t${i}`]) || 0;
							const t_th = Number(matchingItem[`t${i}_th`]) || 0;
							const t_cl_th = Number(matchingItem[`t${i}_cl_th`]) || 0;
							const t_ck = Number(matchingItem[`t${i}_ck`]) || 0;
							const t_cl_ck = Number(matchingItem[`t${i}_cl_ck`]) || 0;
							parentRow[`t${i}`] += t;
							parentRow[`t${i}_th`] += t_th;
							parentRow[`t${i}_cl_th`] += t_cl_th;
							parentRow[`t${i}_ck`] += t_ck;
							parentRow[`t${i}_cl_ck`] += t_cl_ck;
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
						formulaRow[`t${i}`] = 0;
					}

					let expr_th = formula;
					groupNames.forEach(name => {
						expr_th = expr_th.split(name).join(groupValues[name][`t${i}_th`] || 0);
					});
					try {
						formulaRow[`t${i}_th`] = eval(expr_th);
					} catch (e) {
						formulaRow[`t${i}_th`] = 0;
					}

					let expr_cl = formula;
					groupNames.forEach(name => {
						expr_cl = expr_cl.split(name).join(groupValues[name][`t${i}_cl_th`] || 0);
					});
					try {
						formulaRow[`t${i}_cl_th`] = eval(expr_cl);
					} catch (e) {
						formulaRow[`t${i}_cl_th`] = 0;
					}

					let expr_cl_ck = formula;
					groupNames.forEach(name => {
						expr_cl = expr_cl.split(name).join(groupValues[name][`t${i}_cl_ck`] || 0);
					});
					try {
						formulaRow[`t${i}_cl_ck`] = eval(expr_cl_ck);
					} catch (e) {
						formulaRow[`t${i}_cl_ck`] = 0;
					}

					let expr_ck = formula;
					groupNames.forEach(name => {
						expr_cl = expr_cl.split(name).join(groupValues[name][`t${i}_ck`] || 0);
					});
					try {
						formulaRow[`t${i}_ck`] = eval(expr_ck);
					} catch (e) {
						formulaRow[`t${i}_ck`] = 0;
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
			};
			for (let i = 1; i <= 12; i++) {
				otherParent[`t${i}`] = 0;
				otherParent[`t${i}_th`] = 0;
				otherParent[`t${i}_cl_th`] = 0;
				otherParent[`t${i}_ck`] = 0;
				otherParent[`t${i}_cl_ck`] = 0;
			}
			ungroupedItems.forEach((item, idx) => {
				const childRow = {
					...item,
					layer: `${groupIndex}.${idx + 1}`,
					isGroup: false,
				};
				processedData.push(childRow);
				for (let i = 1; i <= 12; i++) {
					const t = Number(item[`t${i}`]) || 0;
					const t_th = Number(item[`t${i}_th`]) || 0;
					const t_cl_th = Number(item[`t${i}_cl_th`]) || 0;
					const t_ck = Number(item[`t${i}_ck`]) || 0;
					const t_cl_ck = Number(item[`t${i}_cl_ck`]) || 0;
					otherParent[`t${i}`] += t;
					otherParent[`t${i}_th`] += t_th;
					otherParent[`t${i}_cl_th`] += t_cl_th;
					otherParent[`t${i}_ck`] += t_ck;
					otherParent[`t${i}_cl_ck`] += t_cl_ck;
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
		return calculateDifferences(sortedData);
	};

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
				innerRenderer: (params) => params.value,
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
				listDienGiai={listDienGiai}
				khkdData={khkdTH}
			/>,
			cellStyle: (params) => {
				if (params.data.formula) {
					const groupSettings = khkdTH?.setting?.[params.data.name] || {};
					return {
						// backgroundColor: groupSettings.background || '#f0f7ff',
						// color: groupSettings.text || '#0066cc',
						// fontWeight: 'bold',
					};
				}
				return {};
			},
		},
		{
			headerName: 'Lũy kế',
			headerClass: 'ag-center-header-group',
			children: [
				{
					headerName: 'Thực hiện',
					field: 'total_th',
					valueGetter: (params) => {
						return (settingMonth ?? []).reduce((sum, m) => sum + (params.data[`t${m}_th`] || 0), 0);
					},
					valueFormatter: (params) => formatMoney(params.value),
					cellStyle: (params) => {
						let parent = params.data.layer && !params.data.layer.includes('.');
						if (parent) { return { textAlign: 'right', fontWeight: '600' } }
						return { textAlign: 'right' };
					},
					headerClass: 'ag-right-aligned-header',
					width: 160,
				},
				{
					headerName: 'Kế hoạch',
					field: 'total_kh',
					valueGetter: (params) => {
						return (settingMonth ?? []).reduce((sum, m) => sum + (params.data[`t${m}`] || 0), 0);
					},
					valueFormatter: (params) => formatMoney(params.value),
					cellStyle: (params) => {
						let parent = params.data.layer && !params.data.layer.includes('.');
						if (parent) { return { textAlign: 'right', fontWeight: '600' } }
						return { textAlign: 'right' };
					},
					headerClass: 'ag-right-aligned-header',
					width: 160,
				},
				{
					headerName: 'Chênh lệch KH-TH',
					field: 'total_diff',
					valueGetter: (params) => {
						const th = (settingMonth ?? []).reduce((sum, m) => sum + (params.data[`t${m}_th`] || 0), 0);
						const kh = (settingMonth ?? []).reduce((sum, m) => sum + (params.data[`t${m}`] || 0), 0);
						const diff = th - kh;
						return diff;
					},
					valueFormatter: (params) => formatMoney(params.value),
					cellStyle: (params) => ({
						textAlign: 'right',
						color: params.value < 0 ? 'red' : params.value > 0 ? 'green' : '#e48407',
					}),
					headerClass: 'ag-right-aligned-header',
					width: 160,
				},
				{
					headerName: 'Cùng kỳ',
					field: 'total_ck',
					valueGetter: (params) => {
						return (settingMonth ?? []).reduce((sum, m) => sum + (params.data[`t${m}_ck`] || 0), 0);
					},
					valueFormatter: (params) => formatMoney(params.value),
					cellStyle: (params) => {
						let parent = params.data.layer && !params.data.layer.includes('.');
						if (parent) { return { textAlign: 'right', fontWeight: '600' } }
						return { textAlign: 'right' };
					},
					headerClass: 'ag-right-aligned-header',
					width: 160,
					hide: !showCungKy,
				},
				{
					headerName: 'Chênh lệch CK',
					field: 'total_diff_ck',
					valueGetter: (params) => {
						const th = (settingMonth ?? []).reduce((sum, m) => sum + (params.data[`t${m}_th`] || 0), 0);
						const ck = (settingMonth ?? []).reduce((sum, m) => sum + (params.data[`t${m}_ck`] || 0), 0);
						const diff = th - ck;
						return diff;
					},
					valueFormatter: (params) => formatMoney(params.value),
					cellStyle: (params) => ({
						textAlign: 'right',
						color: params.value < 0 ? 'red' : params.value > 0 ? 'green' : '#e48407',
					}),
					headerClass: 'ag-right-aligned-header',
					width: 160,
					hide: !showCungKy,
				},
			],
		},
		...(settingMonth ?? [])
			.slice()
			.sort((a, b) => b - a)
			.map((i) => {
				const month = i;
				return {
					headerName: `Tháng ${month}`,
					headerClass: 'ag-center-header-group',
					children: [
						{
							headerName: `Thực hiện`,
							field: `t${month}_th`,
							cellStyle: (params) => {
								let parent = params.data.layer && !params.data.layer.includes('.');
								if (parent) { return { textAlign: 'right', fontWeight: '600' } }
								return { textAlign: 'right' };
							},
							headerClass: 'ag-right-aligned-header',
							valueFormatter: (params) => formatMoney(params.value),
							width: 140,
						},
						{
							headerName: `Kế hoạch`,
							field: `t${month}`,
							cellStyle: (params) => {
								let parent = params.data.layer && !params.data.layer.includes('.');
								if (parent) { return { textAlign: 'right', fontWeight: '600' } }
								return { textAlign: 'right' };
							},
							headerClass: 'ag-right-aligned-header',
							valueFormatter: (params) => formatMoney(params.value),
							width: 140,
						},
						{
							headerName: `Chênh lệch KH-TH`,
							field: `t${month}_cl_th`,
							cellStyle: (params) => {
								const value = params.value;
								if (params.data.formula) {
									const groupSettings = khkdTH?.setting?.[params.data.name] || {};
									return {
										// backgroundColor: groupSettings.background || '#f0f7ff',
										color: value < 0 ? 'red' : value > 0 ? 'green' : '#e48407',
										textAlign: 'right',
									};
								}
								return {
									color: value < 0 ? 'red' : value > 0 ? 'green' : '#e48407',
									textAlign: 'right',
								};
							},
							headerClass: 'ag-right-aligned-header',
							valueFormatter: (params) => formatMoney(params.value),
							width: 140,
						},
						{
							headerName: `Cùng kỳ`,
							field: `t${month}_ck`,
							cellStyle: (params) => {
								let parent = params.data.layer && !params.data.layer.includes('.');
								if (parent) { return { textAlign: 'right', fontWeight: '600' } }
								return { textAlign: 'right' };
							},
							headerClass: 'ag-right-aligned-header',
							valueFormatter: (params) => formatMoney(params.value),
							width: 140,
							hide: !showCungKy,
						},
						{
							headerName: `Chênh lệch CK`,
							field: `t${month}_cl_ck`,
							valueGetter: (params) => {
								const th = params.data[`t${month}_th`] || 0;
								const ck = params.data[`t${month}_ck`] || 0;
								const diff = th - ck;
								const percent = ck !== 0 ? (diff / ck) * 100 : 0;
								return { diff, percent };
							},
							valueFormatter: (params) => {
								const { diff, percent } = params.value || {};
								const sign = percent > 0 ? '+' : '';
								// return `${formatMoney(diff)} | ${sign}${percent.toFixed(1)}%`;
								return `${formatMoney(diff)}`;
							},
							cellStyle: (params) => {
								const value = params.value.diff;
								if (params.data.formula) {
									const groupSettings = khkdTH?.setting?.[params.data.name] || {};
									return {
										backgroundColor: groupSettings.background || '#f0f7ff',
										color: value < 0 ? 'red' : value > 0 ? 'green' : '#e48407',
										textAlign: 'right',
									};
								}
								return {
									color: value < 0 ? 'red' : value > 0 ? 'green' : '#e48407',
									textAlign: 'right',
								};
							},
							headerClass: 'ag-right-aligned-header',
							width: 140,
							hide: !showCungKy,
						},
					],
				};
			}),
	];

	const columns = [
		{
			headerName: 'Tên',
			field: 'name',
			pinned: 'left',
			width: 460,
			cellRenderer: (params) => <ActionDetailDL {...params}
				khkdTH={khkdTH}
				listDienGiai={listDienGiai} />,
		},
		{
			headerName: 'Lũy kế',
			headerClass: 'ag-center-header-group',
			children: [
				{
					headerName: 'Thực hiện',
					field: 'total_th',
					valueGetter: (params) => getLuyKeValue(params, settingMonth, khkdTH.luyKeDL, '_th'),
					valueFormatter: (params) => formatMoney(params.value),
					cellStyle: { textAlign: 'right' },
					headerClass: 'ag-right-aligned-header',
					width: 160,
				},
				{
					headerName: 'Kế hoạch',
					field: 'total_kh',
					valueGetter: (params) => getLuyKeValue(params, settingMonth, khkdTH.luyKeDL),
					valueFormatter: (params) => formatMoney(params.value),
					cellStyle: { textAlign: 'right' },
					headerClass: 'ag-right-aligned-header',
					width: 160,
				},
				{
					headerName: 'Chênh lệch KH-TH',
					field: 'total_diff',
					valueGetter: (params) => {
						const th = getLuyKeValue(params, settingMonth, khkdTH.luyKeDL, '_th');
						const kh = getLuyKeValue(params, settingMonth, khkdTH.luyKeDL, '');
						return th - kh;
					},
					valueFormatter: (params) => formatMoney(params.value),
					cellStyle: (params) => ({
						textAlign: 'right',
						color: params.value < 0 ? 'red' : params.value > 0 ? 'green' : '#e48407',
					}),
					headerClass: 'ag-right-aligned-header',
					width: 160,
				},
				{
					headerName: 'Cùng kỳ',
					field: 'total_ck',
					valueGetter: (params) => getLuyKeValue(params, settingMonth, khkdTH.luyKeDL, '_ck'),
					valueFormatter: (params) => formatMoney(params.value),
					cellStyle: { textAlign: 'right' },
					headerClass: 'ag-right-aligned-header',
					width: 160,
					hide: !showCungKy,
				},
				{
					headerName: 'Chênh lệch CK',
					field: 'total_diff_ck',
					valueGetter: (params) => {
						const th = getLuyKeValue(params, settingMonth, khkdTH.luyKeDL, '_th');
						const ck = getLuyKeValue(params, settingMonth, khkdTH.luyKeDL, '_ck');
						return th - ck;
					}
					,
					valueFormatter: (params) => formatMoney(params.value),
					cellStyle: (params) => ({
						textAlign: 'right',
						color: params.value < 0 ? 'red' : params.value > 0 ? 'green' : '#e48407',
					}),
					headerClass: 'ag-right-aligned-header',
					width: 160,
					hide: !showCungKy,
				},
			],
		},
		...(settingMonth ?? [])
			.slice()
			.sort((a, b) => b - a)
			.map((i) => {
				const month = i;
				return {
					headerName: `Tháng ${month}`,
					headerClass: 'ag-center-header-group',
					children: [
						{
							headerName: `Thực hiện`,
							field: `t${month}_th`,
							cellStyle: { textAlign: 'right' },
							headerClass: 'ag-right-aligned-header',
							valueFormatter: (params) => formatMoney(params.value),
							width: 140,
						},
						{
							headerName: `Kế hoạch `,
							field: `t${month}`,
							editable: true,
							cellStyle: { textAlign: 'right' },
							headerClass: 'ag-right-aligned-header',
							valueFormatter: (params) => formatMoney(params.value),
							width: 140,
						},
						{
							headerName: `Chênh lệch KH-TH`,
							editable: false,
							valueGetter: (params) => {
								const th = params.data[`t${month}_th`] || 0;
								const kh = params.data[`t${month}`] || 0;
								const diff = th - kh;
								const percent = th !== 0 ? (diff / th) * 100 : 0;
								return { diff, percent };
							},
							valueFormatter: (params) => {
								if (!params.value) return '';
								const { diff, percent } = params.value;
								const sign = percent > 0 ? '+' : '';
								// return `${formatMoney(diff)} | ${sign}${percent.toFixed(1)}%`;
								return `${formatMoney(diff)}`;
							},
							cellStyle: (params) => {
								const value = params.value?.diff;
								return {
									textAlign: 'right',
									color: value < 0 ? 'red' : value > 0 ? 'green' : '#e48407',
								};
							},
							headerClass: 'ag-right-aligned-header',
							width: 160,
						},
						{
							headerName: `Cùng kỳ `,
							field: `t${month}_ck`,
							cellStyle: { textAlign: 'right' },
							headerClass: 'ag-right-aligned-header',
							valueFormatter: (params) => formatMoney(params.value),
							width: 140,
							hide: !showCungKy,
						},
						{
							headerName: `Chênh lệch CK`,
							editable: false,
							field: `t${month}_cl_ck`, // Có thể bỏ nếu dùng valueGetter
							valueGetter: (params) => {
								const th = params.data[`t${month}_th`] || 0;
								const ck = params.data[`t${month}_ck`] || 0;
								const diff = th - ck;
								const percent = ck !== 0 ? (diff / ck) * 100 : 0;
								return { diff, percent };
							},
							valueFormatter: (params) => {
								const { diff, percent } = params.value || {};
								const sign = percent > 0 ? '+' : '';
								// return `${formatMoney(diff)} | ${sign}${percent.toFixed(1)}%`;
								return `${formatMoney(diff)}`;
							},
							cellStyle: (params) => {
								const value = params.value?.diff;
								return {
									textAlign: 'right',
									color: value < 0 ? 'red' : value > 0 ? 'green' : '#e48407',
								};
							},
							headerClass: 'ag-right-aligned-header',
							width: 160,
							hide: !showCungKy,
						},

					],
				};
			}),

	];

	const printRef = useRef();

	// const handleExport = async () => {
	// 	const element = printRef.current;
	//
	// 	if (!element) {
	// 		console.error("Không tìm thấy phần tử cần xuất PDF");
	// 		return;
	// 	}
	//
	// 	// 1. Ẩn tooltip hoặc các phần tử động (nếu có)
	// 	const tooltips = document.querySelectorAll(".tooltip, [role='tooltip']");
	// 	tooltips.forEach((el) => (el.style.display = "none"));
	//
	// 	// 2. Đảm bảo layout đầy đủ
	// 	element.style.height = "auto";
	// 	element.style.overflow = "visible";
	//
	// 	// 3. Chụp canvas với chất lượng cao
	// 	const canvas = await html2canvas(element, {
	// 		scale: 2,
	// 		useCORS: true, // nếu có hình ảnh từ nguồn khác
	// 		scrollY: -window.scrollY, // chụp đúng vị trí
	// 	});
	//
	// 	const imgData = canvas.toDataURL("image/png");
	// 	const pdf = new jsPDF("landscape", "mm", "a3");
	// 	const pdfWidth = pdf.internal.pageSize.getWidth();
	// 	const pdfHeight = pdf.internal.pageSize.getHeight();
	//
	// 	const imgWidth = pdfWidth;
	// 	const imgHeight = (canvas.height * imgWidth) / canvas.width;
	//
	// 	let heightLeft = imgHeight;
	// 	let position = 0;
	//
	// 	// 4. Chia ảnh thành nhiều trang nếu quá dài
	// 	while (heightLeft > 0) {
	// 		pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
	// 		heightLeft -= pdfHeight;
	// 		if (heightLeft > 0) {
	// 			pdf.addPage();
	// 			position = position - pdfHeight;
	// 		}
	// 	}
	//
	// 	pdf.save("bao-cao.pdf");
	//
	// 	// 5. Khôi phục tooltip nếu cần
	// 	tooltips.forEach((el) => (el.style.display = ""));
	// };

	const [isExporting, setIsExporting] = useState(false)

	const handleExport = async () => {
		const element = printRef.current;
		if (!element) return;

		setIsExporting(true);

		try {
			const pxToMm = 0.264583;
			const padding = 10;

			const canvas = await html2canvas(element, {
				scale: 2,
				useCORS: true,
				scrollY: -window.scrollY,
			});

			const imgData = canvas.toDataURL("image/jpeg", 1.0);
			const imgWidth = canvas.width * pxToMm;
			const imgHeight = canvas.height * pxToMm;
			const pdfWidth = imgWidth + padding * 2;
			const pdfHeight = imgHeight + padding * 2;

			const pdf = new jsPDF({
				orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
				unit: "mm",
				format: [pdfWidth, pdfHeight],
			});

			pdf.addImage(imgData, "JPEG", padding, padding, imgWidth, imgHeight);

			// Lưu PDF vào trình duyệt
			pdf.save("bao-cao.pdf");

			// CHUYỂN PDF thành File để upload
			const pdfBlob = pdf.output("blob");
			const pdfFile = new File([pdfBlob], "bao-cao.pdf", { type: "application/pdf" });

			// Gửi lên server (dùng hàm của bạn)
			const response = await uploadFiles([pdfFile]);
			const type = "pdf";
			const fileData = {
				name: response.files[0].fileName,
				url: response.files[0].fileUrl,
				type: type,
				table: 'KHKD',
				table_id: idHopKH,
				updated_at: new Date().toISOString(),
			};

			await createNewFile(fileData);
			toast.success("PDF đã được xuất và lưu lên hệ thống!");

		} catch (error) {
			console.error("Lỗi khi xuất hoặc upload PDF:", error);
			toast.error("Lỗi khi xuất hoặc upload PDF.");
		} finally {
			setIsExporting(false);
		}
	};

	const menuDoLuong = (
		<Menu>
			<Menu.Item key="cai-dat-luy-ke" onClick={() => setShowLuyKeDL(true)}>
				Cài đặt lũy kế
			</Menu.Item>
		</Menu>
	);


	const [loadingKHKD, setLoadingKHKD] = useState(false);

	return (
		<>
			{loadingKHKD ? (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '900px' }}>
					<Loading3DTower />
				</div>
			) : (
				<div ref={printRef} className={css.KHKDContainer}>
					<KHKDTitle handleExport={handleExport}
						khkdTH={khkdTH}
						fetchKHTH={fetchKHTH} dataDoLuong={[...dataDoLuong, ...processGroupedData(dataKetQua, khkdTH?.setting)]}
						dataKQKD={processGroupedData(dataKetQua, khkdTH?.setting)}
						dataDT={[...dataDT1AI, ...dataDongTienTHCKDT, ...dataDongTienTHCKTC]}
						dKPIDataAI={dKPIDataAI}
						dataTT={dataTT}
					/>

					{/*<div className={css.divider} />*/}
					<div className={css.animatedLine}></div>
					{khkdTH && khkdTH.showBH && dataTT &&
						<>
							<KHKDChuKyView dataTT={dataTT.filter(e => e.phanLoai?.trim().toLowerCase() === 'doanh thu')}
								dataCF={dataTT.filter(e => e.phanLoai?.trim().toLowerCase() === 'chi phí cố định')}
								khkdTH={khkdTH} />
						</>
					}

					{khkdTH && khkdTH.showDL && (
						<div style={{ marginTop: 25 }}>
							<div className={css.headerContainer2}>
								<h2>ĐO LƯỜNG</h2>
								<Dropdown overlay={menuDoLuong} trigger={['click']} placement="bottomRight">
									<Button icon={<MoreOutlined />} />
								</Dropdown>
							</div>
							<div className='ag-theme-quartz' style={{ marginBottom: 20 }}>
								<AgGridReact
									enableRangeSelection={true}
									statusBar={{
										statusPanels: [{ statusPanel: 'agAggregationComponent' }],
									}}
									defaultColDef={defaultColDef}
									columnDefs={columns}
									rowData={dataDoLuong}
									domLayout='autoHeight' />
							</div>

							{showLuyKeDL && (
								<SettingLuyKeDL
									isOpen={showLuyKeDL}
									setIsOpen={setShowLuyKeDL}
									dataDoLuong={dataDoLuong}
									dataKinhDoanh={processGroupedData(dataKetQua, khkdTH?.setting)}
									khkdTH={khkdTH}
									onSuccess={() => {
										setLoadingKHKD(true);
										fetchKHTH().finally(() => {
											setLoadingKHKD(false);
										});
									}}
								/>
							)}
						</div>
					)}

					{khkdTH && khkdTH.showKD && (
						<div style={{ marginTop: 25 }}>
							<div className={css.headerContainer2}>
								<h2>KẾT QUẢ KINH DOANH DỰ TÍNH</h2>
							</div>
							<div className='ag-theme-quartz' style={{ marginBottom: 20 }}>
								<AgGridReact
									enableRangeSelection={true}
									statusBar={{
										statusPanels: [{ statusPanel: 'agAggregationComponent' }],
									}}
									defaultColDef={defaultColDef}
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
								/>
							</div>
						</div>
					)}

					{khkdTH && khkdTH.showKPI && (
						<KHKDKPI
							listDienGiai={listDienGiai}
							showCungKy={showCungKy}
							settingMonth={settingMonth}
							dataDoLuong={JSON.parse(JSON.stringify([...dataDoLuong, ...processGroupedData(dataKetQua, khkdTH?.setting)]))}
							setKPIDataAI={setKPIDataAI}
							khkdTH={khkdTH}
						/>
					)}

					{khkdTH && khkdTH.showBenchmark && (
						<KHKDBenchMark dataDoLuong={[...dataDoLuong, ...processGroupedData(dataKetQua, khkdTH?.setting)]} />
					)}

					{khkdTH && khkdTH.showDT && (
						<div style={{ marginTop: 25 }}>
							<h2 style={{ marginBottom: 16 }}>DÒNG TIỀN</h2>
							<DTHDKDView showCungKy={showCungKy}
								dataKetQua={dataKetQua}
								khkdTH={khkdTH}
								settingMonth={settingMonth}
								dataDongTienTHCK={dataDongTienTHCK}
								setDataDT1AI={setDataDT1AI}
							/>

							{khkdTH.showDTFull && (
								<>
									<DTHDDTView showCungKy={showCungKy}
										settingMonth={settingMonth}
										dataDongTienTHCKDT={dataDongTienTHCKDT}
									/>
									<DTHDTCView showCungKy={showCungKy}
										settingMonth={settingMonth}
										dataDongTienTHCKDT={dataDongTienTHCKTC}
									/>
								</>
							)}
						</div>
					)}
				</div>
			)}

			{isSetListElementModalVisible && (
				<SetListElement
					isVisible={isSetListElementModalVisible}
					onClose={() => setIsSetListElementModalVisible(false)}
					idHopKH={idHopKH}
					khkdTH={khkdTH}
				/>
			)}
		</>
	);
};

export default KHKDTongHopView2;
