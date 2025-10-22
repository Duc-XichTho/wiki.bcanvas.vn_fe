import React, { useContext, useEffect, useState } from 'react';
import { Button, Checkbox, Dropdown, Menu, message, Modal, Popconfirm, Select, Spin, Switch } from 'antd';
import {
	createKHKDElement,
	deleteKHKDElement,
	getKHKDElementByKHKDId,
	updateKHKDElement,
} from '../../apis/khkdElementService';
import css from './KHKD.module.css';
import { useParams } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import AG_GRID_LOCALE_VN from '../../pages/Home/AgridTable/locale.jsx';
import AddKHKDElementModal from './AddKHKDElementModal/AddKHKDElementModal.jsx';
import { formatMoney } from '../../generalFunction/format.js';
import KHKDElement3 from './KHKDElement/KHKDElement3.jsx';
import KHKDImportExportDropdown from './KHKDImportExportDropdown';
import { getSettingByType } from '../../apis/settingService';
import { getKHKDById, updateKHKD } from '../../apis/khkdService.jsx';
import { IconUser, SaveTableIcon } from '../../icon/IconSVG.js';
import { MyContext } from '../../MyContext.jsx';
import { updateFileNotePad } from '../../apis/fileNotePadService.jsx';
import { getAllUserClass } from '../../apis/userClassService.jsx';
import Loading3DTower from '../../components/Loading3DTower';

const { Option } = Select;

// CSS styles for the grid
const gridStyles = {
	'.parent-group-row': {
		fontWeight: 'bold',
		backgroundColor: '#e6f0ff', // Lighter blue for parent rows
		color: '#1C3D69',
	},
	'.child-group-row': {
		fontWeight: 'bold',
		backgroundColor: '#f2f2f2', // Light gray for child rows
		color: '#333333',
		borderTop: '1px solid #ccc',
		borderBottom: '1px solid #ccc',
	},
	'.child-group-row-cntt': { // CNTT specific style
		backgroundColor: '#f0f7ff', // Light blue background
	},
	'.child-group-row-marketing': { // Marketing specific style
		backgroundColor: '#fff0f0', // Light red background
	},
	'.child-group-row-sanxuat': { // San xuat specific style
		backgroundColor: '#f0fff0', // Light green background
	},
	'.grandchild-row': {
		fontStyle: 'italic',
		paddingLeft: '20px',
		backgroundColor: '#fafafa', // Very light gray for grandchild rows
	},
	'.hidden-grandchild-row': {
		display: 'none !important',
	},
};


const KHKD = () => {
	const { currentUser, listUC_CANVAS, isUpdateNoti, setLoadData, loadData, uCSelected_CANVAS } = useContext(MyContext);
	const { idLapKH } = useParams();
	const [isAddKHKDElementModalVisible, setIsAddKHKDElementModalVisible] = useState(false);
	const [isQLDanhMucModalVisible, setIsQLDanhMucModalVisible] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		khoanMuc: '',
		boPhan: '',
		labelSoLuong: '',
		phanLoai: '',
		data: [],
		theoDoi: true,
		theoDoiDG: true,
		isDT: true,
		percentFormula: [],
		isPercentFormula: false,
	});
	const [khkdListElement, setKhkdListElement] = useState([]);
	const [openCards, setOpenCards] = useState([]);
	const [editingItem, setEditingItem] = useState(null);
	const [loadingKHKDElement, setLoadingKHKDElement] = useState(false);
	const [khkdSetting, setKhkdSetting] = useState(null);
	const [rowData, setRowData] = useState([]);
	const [editedRows, setEditedRows] = useState({});
	const [openSetupUC, setOpenSetupUC] = useState(false);
	const [listUC, setListUC] = useState([]);
	const [selectedUC, setSelectedUC] = useState(new Set([]));
	const [khkdData, setKhkdData] = useState(null);

	useEffect(() => {
		getAllUserClass().then((data) => {
			setListUC(data.filter((e) => e.module == 'CANVAS'));
		});
	}, []);

	const [columnDefs, setColumnDefs] = useState([
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
			headerName: 'Khoản mục/ Tên mục/ Chi tiết',
			pinned: 'left',
			field: 'name',
			width: 300,
			cellRenderer: (params) => {
				const [isExpanded, setIsExpanded] = useState(null);
				// For child groups (items), add expand/collapse icon
				useEffect(() => {
					params.data.expanded = isExpanded;
				}, [isExpanded]);
				if (params.data.isChildGroup) {
					// Get the expanded state from a custom state map
					params.data.expanded !== false; // Default to expanded


					// Return the cell with the icon
					return (
						<div style={{
							display: 'flex',
							alignItems: 'center',
							fontWeight: 'bold',
							backgroundColor: '#f9f9f9',
							color: '#333333',
						}}>
							<span
								style={{ cursor: 'pointer', marginRight: '5px' }}
								onClick={(e) => {

									setIsExpanded(prev => !prev);
									const currentId = params.data.id;
									const gridApi = params.api;

									gridApi.forEachNode(node => {
										if (node.data && node.data.parentId === currentId) {
											const rowElement = gridApi.getRowNode(node.id)?.rowElement;
											if (rowElement) {
												if (!isExpanded) {
													rowElement.classList.add('hidden-grandchild-row');
													node.data.hidden = true;
												} else {
													rowElement.classList.remove('hidden-grandchild-row');
													node.data.hidden = false;
												}
											}
										}
									});


								}}
							>
								{!isExpanded ? '▼' : '►'}
							</span>
							{params.value}
						</div>
					);
				} else if (params.data.isGroup) {
					// Parent group (khoản mục)
					return (
						<div style={{
							fontWeight: 'bold',
							color: '#1C3D69',
						}}>
							{params.value}
						</div>
					);
				} else if (params.data.isGrandchild) {
					// Grandchild (data type)
					let style = { fontStyle: 'italic', paddingLeft: '20px' };

					// Apply different styles based on data type
					if (params.data.name === 'Thành tiền') {
						style = { ...style, color: '#1C3D69', fontWeight: 'bold' };
					} else if (params.data.name === 'Số lượng') {
						style = { ...style, color: '#1e65c8' };
					} else if (params.data.name === 'Đơn giá') {
						style = { ...style, color: '#1e65c8' };
					}

					return <div style={style}>{params.value}</div>;
				}

				return <div>{params.value}</div>;
			},
		},
		{
			headerName: 'Bộ phận',
			field: 'boPhan',
			width: 150,
			cellRenderer: (params) => {
				// Only show for child group rows (parent elements), not for grandchild rows
				if (params.data.isChildGroup) {
					return params.value;
				} else if (params.data.isGroup) {
					return '';
				}
				return '';
			},
		},
		{
			headerName: 'Phân loại',
			field: 'phanLoai',
			width: 150,
			cellRenderer: (params) => {
				// Only show for child group rows (parent elements), not for grandchild rows
				if (params.data.isChildGroup) {
					return params.value;
				} else if (params.data.isGroup) {
					return '';
				}
				return '';
			},
		},
		{
			headerName: 'Tên đo lường',
			field: 'labelSoLuong',
			width: 150,
			cellRenderer: (params) => {
				// Only show for child group rows (parent elements), not for grandchild rows
				if (params.data.isChildGroup) {
					return params.value;
				} else if (params.data.isGroup) {
					return '';
				}
				return '';
			},
		},
		...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => ({
			headerName: `T${month}`,
			field: `T${month}`,
			width: 130,
			cellRenderer: (params) => {
				// Nếu là dòng grandchild Tỷ lệ (%)
				if (params.data.isGrandchild && params.data.name === 'Tỷ lệ (%)') {
					const value = params.value;
					if (params.data.isGrandchild && params.data.name === 'Tỷ lệ (%)') {
						return (
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'end' }}>
								<span>{params.value || '-'}</span>
								<span style={{ marginLeft: 2 }}>%</span>
							</div>
						);
					}

				}
				// Nếu là dòng grandchild percentFormula (hiển thị thành tiền)
				if (params.data.isGrandchild && params.data.isPercentFormulaRow) {
					return <div style={{ textAlign: 'right', color: '#1C3D69', fontWeight: 500 }}>{formatMoney(params.value)}</div>;
				}
				// Nếu là dòng grandchild bình thường
				if (params.data.isGrandchild) {
					// Nếu là mục tỷ lệ thì ẩn Số lượng/Đơn giá
					if (params.data.isPercentFormula && (params.data.name === 'Số lượng' || params.data.name === 'Đơn giá')) {
						return null;
					}
					let style = { textAlign: 'right' };
					if (params.data.name === 'Số lượng' || params.data.name === 'Đơn giá') {
						style = { ...style, color: '#1e65c8' };
					}
					return <div style={style}>{formatMoney(params.value)}</div>;
				}
				// ... giữ nguyên các trường hợp khác ...
				if (params.data.isChildGroup) {
					if (params.data.theoDoiDG) {
						const thanhTienValue = params.data[`T${month}_ThanhTien`];
						if (thanhTienValue !== undefined && thanhTienValue !== null) {
							return (
								<div style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(thanhTienValue)}</div>
							);
						}
					}
					const value = params.data[`T${month}`];
					if (value) {
						return <div style={{ textAlign: 'right' }}>{formatMoney(value)}</div>;
					}
					return null;
				}
				if (params.data.isGroup) {
					const value = params.data[`T${month}`];
					return <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#1C3D69' }}>{formatMoney(value)}</div>;
				}
				return '';
			},
			editable: (params) => {
				// Không cho sửa dòng tổng thành tiền các mục đã chọn
				if (params.data.isGrandchild && params.data.isPercentFormulaSum) return false;
				// Cho phép sửa dòng Tỷ lệ (%)
				if (params.data.isGrandchild && params.data.name === 'Tỷ lệ (%)') return true;
				// Cho phép sửa các dòng grandchild còn lại (Số lượng, Đơn giá)
				if (params.data.isGrandchild) return true;
				console.log('params.data', params.data);
				if (params.data.isGrandchild && params.data.name === 'Tỷ lệ (%)') {

					return true;
				}
				// ... giữ nguyên logic cũ ...
				if (params.data.isChildGroup) {
					if (params.data.theoDoiDG) {
						const thanhTienValue = params.data[`T${month}_ThanhTien`];
						if (thanhTienValue !== undefined && thanhTienValue !== null) {
							return (
								<div style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(thanhTienValue)}</div>
							);
						}
					}
					const value = params.data[`T${month}`];
					if (value) {
						return <div style={{ textAlign: 'right' }}>{formatMoney(value)}</div>;
					}
					return null;
				}
				if (params.data.isGroup) {
					const value = params.data[`T${month}`];
					return <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#1C3D69' }}>{formatMoney(value)}</div>;
				}
				return '';
			},
			// cellEditor: (params) => {
			// 	if (params.data.isGrandchild && params.data.name === 'Tỷ lệ (%)') {
			// 		return 'agNumberCellEditor';
			// 	}
			// 	return null;
			// },
			cellEditorParams: (params) => {
				if (params.data.isGrandchild && params.data.name === 'Tỷ lệ (%)') {
					return {
						type: 'number',
						max: 100,
						min: 0,
					};
				}
				return null;
			},
			onCellValueChanged: (params) => {
				// Nếu là dòng grandchild Tỷ lệ (%) thì cập nhật lại thành tiền dòng cha và lưu vào data[1], data[2]
				if (params.data.isGrandchild && params.data.name === 'Tỷ lệ (%)') {
					const parentId = params.data.parentId;
					const monthKey = params.column.colId; // T1, T2, ...
					const newTyLe = Number(params.newValue) || 0;

					// Tính tổng thành tiền các mục được chọn cho tháng này
					let sumThanhTien = 0;
					params.api.forEachNode(node => {
						if (node.data && node.data.parentId === parentId && node.data.isPercentFormulaSum) {
							sumThanhTien = Number(node.data[monthKey]) || 0;
						}
					});

					// Cập nhật lại dòng cha cho tháng này
					params.api.forEachNode(node => {
						if (node.data && node.data.id === parentId) {
							node.data[`${monthKey}_ThanhTien`] = sumThanhTien * (newTyLe / 100);
							node.data[monthKey] = node.data[`${monthKey}_ThanhTien`];
							params.api.refreshCells({ force: true, rowNodes: [node] });
						}
					});

					// Lưu thay đổi vào editedRows và data[1] (Tỷ lệ %), data[2] (Thành tiền)
					setEditedRows(prev => {
						const parentId = params.data.parentId;
						const currentData = prev[parentId]
							? [...prev[parentId]]
							: params.data.parentData.map(item => ({ ...item }));
						// Đảm bảo data[1] là dòng Tỷ lệ (%)
						currentData[1] = currentData[1] && currentData[1].name === 'Tỷ lệ (%)'
							? { ...currentData[1] }
							: { name: 'Tỷ lệ (%)' };
						currentData[1][monthKey] = newTyLe;
						// Đảm bảo data[2] là dòng Thành tiền
						currentData[2] = currentData[2] && currentData[2].name === 'Thành tiền'
							? { ...currentData[2] }
							: { name: 'Thành tiền' };
						currentData[2][monthKey] = sumThanhTien * (newTyLe / 100);
						return {
							...prev,
							[parentId]: currentData,
						};
					});
				}
				// Nếu là dòng grandchild Số lượng hoặc Đơn giá thì cập nhật lại Thành tiền
				if (params.data.isGrandchild && (params.data.name === 'Số lượng' || params.data.name === 'Đơn giá')) {
					const dataIndex = params.data.dataIndex;
					const field = params.column.colId;
					const newValue = Number(params.newValue) || 0;
					params.data[field] = newValue;
					setEditedRows(prev => {
						const parentId = params.data.parentId;
						const currentData = prev[parentId]
							? [...prev[parentId]]
							: params.data.parentData.map(item => ({ ...item }));
						currentData[dataIndex][field] = newValue;
						// Tính lại Thành tiền cho tháng tương ứng
						const soLuong = currentData[0][field] !== undefined ? currentData[0][field] : currentData[0][params.column.colId];
						const donGia = currentData[1][field] !== undefined ? currentData[1][field] : currentData[1][params.column.colId];
						const sign = (typeof params.data.isDT === 'undefined' || params.data.isDT === true) ? 1 : -1;
						currentData[2][field] = (Number(currentData[0][field] || currentData[0][params.column.colId] || 0) * Number(currentData[1][field] || currentData[1][params.column.colId] || 0)) * sign;
						return {
							...prev,
							[parentId]: currentData
						};
					});
				}
			},
		})),

		{
			headerName: '+/-',
			field: 'isDT',
			minWidth: 50,
			pinned: 'right',
			headerClass: 'center-align-important',
			width: 50,
			cellRenderer: (params) => {
				if (params.data.isChildGroup) {
					return (
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
							<Switch
								checked={!!params.value}
								checkedChildren='+'
								unCheckedChildren='-'
								onChange={async (checked) => {
									await handleChangeIsDT(params.data, checked);
								}}
								size='small'
								style={{ backgroundColor: !params.value ? '#FF8B51' : undefined }}
							/>
						</div>
					);
				} else if (params.data.isGroup) {
					return '';
				}
				return '';
			},
			editable: false,
		},
		// {
		// 	headerName: 'SUM/AVG',
		// 	field: 'isSum',
		// 	pinned: 'right',
		// 	headerClass: 'center-align-important',
		// 	width: 90,
		// 	cellRenderer: (params) => {
		// 		if (params.data.isChildGroup) {
		// 			return (
		// 				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
		// 					<Switch
		// 						checked={params.value}
		// 						checkedChildren='SUM'
		// 						unCheckedChildren='AVG'
		// 						onChange={async (checked) => {
		// 							await updateKHKDElement(params.data.id, { ...params.data, isSum: checked });
		// 							await fetchKHKDElementList();
		// 						}}
		// 						size='small'
		// 					/>
		// 				</div>
		// 			);
		// 		} else if (params.data.isGroup) {
		// 			return '';
		// 		}
		// 		return '';
		// 	},
		// 	editable: false,
		// },
		{
			headerName: 'Track',
			field: 'theoDoi',
			width: 50,
			pinned: 'right',
			cellRenderer: (params) => {
				// Chỉ hiển thị cho các dòng con (parent elements), không hiển thị cho các dòng cháu
				if (params.data.isChildGroup) {
					// Sử dụng checkbox thay vì văn bản
					return (
						<div style={{
							display: 'flex',
							justifyContent: 'center',
							height: '35px',
						}}>
							<input
								type='checkbox'
								checked={params.data.theoDoi}
								onChange={(e) => handleTheoDoiChange(params.data.id, e.target.checked)}
							/>
						</div>
					);
				} else if (params.data.isGroup) {
					return '';
				}
				return '';
			},
		},

		{
			headerName: 'Thao tác',
			field: 'actions',
			pinned: 'right',
			width: 100,
			cellRenderer: (params) => {
				// Only show for child group rows (parent elements), not for grandchild rows
				if (params.data.isChildGroup) {
					return (
						<div style={{ display: 'flex', gap: '5px', height: '35px' }}>
							<Button
								type='text'
								size='small'
								onClick={() => handleEdit(params.data)}
								style={{ display: 'flex', height: '35px' }}
							>
								Sửa
							</Button>
							<Popconfirm
								title='Xóa mục này?'
								description='Bạn có chắc chắn muốn xóa mục này không?'
								onConfirm={() => handleDelete(params.data.id)}
								okText='Có'
								cancelText='Không'
							>
								<Button
									type='text'
									danger
									size='small'
									style={{ display: 'flex', height: '35px' }}
								>
									Xóa
								</Button>
							</Popconfirm>
						</div>
					);
				}
				return null;
			},

		},
	]);

	// Helper functions to process data for hierarchical display
	const processDataForHierarchicalView = (data) => {
		// Group data by khoanMuc
		const groupedByKhoanMuc = {};

		data.forEach(item => {
			if (!groupedByKhoanMuc[item.khoanMuc]) {
				groupedByKhoanMuc[item.khoanMuc] = [];
			}
			groupedByKhoanMuc[item.khoanMuc].push(item);
		});

		// Process data into hierarchical format
		const processedData = [];
		let groupIndex = 0;

		// Sort khoanMuc groups alphabetically for consistent ordering
		const sortedKhoanMuc = Object.keys(groupedByKhoanMuc).sort();

		sortedKhoanMuc.forEach((khoanMuc) => {
			groupIndex++;
			const items = groupedByKhoanMuc[khoanMuc];

			// Create parent row for khoanMuc
			const parentRow = {
				name: khoanMuc,
				boPhan: '',
				layer: groupIndex.toString(),

				isGroup: true,
				T1: 0, T2: 0, T3: 0, T4: 0, T5: 0, T6: 0,
				T7: 0, T8: 0, T9: 0, T10: 0, T11: 0, T12: 0,
				totalQuantities: {
					T1: 0, T2: 0, T3: 0, T4: 0, T5: 0, T6: 0,
					T7: 0, T8: 0, T9: 0, T10: 0, T11: 0, T12: 0,
				},
			};

			// Sort items by name within each group
			const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));

			// Add child rows and calculate sum for parent
			sortedItems.forEach((item, itemIndex) => {
				// Nếu là mục tỷ lệ %
				if (item.isPercentFormula) {
					// Tạo child row cho mục này
					const childRow = {
						id: item.id,
						name: item.name,
						boPhan: item.boPhan,
						khoanMuc: item.khoanMuc,
						labelSoLuong: item.labelSoLuong,
						theoDoi: item.theoDoi,
						theoDoiDG: item.theoDoiDG,
						data: item.data,
						layer: `${groupIndex}.${itemIndex + 1}`,
						isGroup: false,
						isChildGroup: true,
						expanded: true,
						isDT: item.isDT,
						isSum: item.isSum,
						phanLoai: item.phanLoai,
						percentFormula: item.percentFormula,
						isPercentFormula: item.isPercentFormula,
					};

					// Tạo object tỷ lệ theo tháng
					const tyLeTheoThang = {};
					for (let i = 1; i <= 12; i++) {
						const key = `T${i}`;
						tyLeTheoThang[key] = (item.data && item.data[1] && item.data[1][key] !== undefined) ? item.data[1][key] : 0;
					}
					const grandchildTyLe = {
						id: `${item.id}_tyle`,
						name: 'Tỷ lệ (%)',
						boPhan: item.boPhan,
						khoanMuc: item.khoanMuc,
						labelSoLuong: item.labelSoLuong,
						theoDoi: item.theoDoi,
						theoDoiDG: item.theoDoiDG,
						parentData: item.data,
						parentId: item.id,
						phanLoai: item.phanLoai,
						percentFormula: item.percentFormula,
						isPercentFormula: item.isPercentFormula,
						dataType: 'Tỷ lệ (%)',
						dataIndex: -1,
						...tyLeTheoThang,
						layer: `${groupIndex}.${itemIndex + 1}.1`,
						isGroup: false,
						isGrandchild: true,
						visible: true,
						isTyLePhanTram: true,
					};
					processedData.push(grandchildTyLe);

					// Tính tổng thành tiền các mục được chọn
					let sumThanhTien = {};
					for (let i = 1; i <= 12; i++) sumThanhTien[`T${i}`] = 0;
					(item.percentFormula || []).forEach((id) => {
						const found = data.find(e => e.id === id);
						if (found && found.data && found.data.length > 2) {
							const thanhTien = found.data[2];
							const sign = (typeof found.isDT === 'undefined' || found.isDT === true) ? 1 : -1;
							for (let i = 1; i <= 12; i++) {
								sumThanhTien[`T${i}`] += sign * (Number(thanhTien[`T${i}`]) || 0);
							}
						}
					});
					// Chỉ tạo 1 dòng grandchild tổng
					const grandchildTong = {
						id: `${item.id}_percent_sum`,
						name: `Tổng (${(item.percentFormula || []).map(id => {
							const found = data.find(e => e.id === id);
							return found ? found.name : id;
						}).join(', ')})`,
						boPhan: '',
						khoanMuc: '',
						labelSoLuong: '',
						parentData: item.data,
						parentId: item.id,
						dataType: 'percentFormulaSum',
						isGrandchild: true,
						isPercentFormulaSum: true,
						T1: sumThanhTien.T1,
						T2: sumThanhTien.T2,
						T3: sumThanhTien.T3,
						T4: sumThanhTien.T4,
						T5: sumThanhTien.T5,
						T6: sumThanhTien.T6,
						T7: sumThanhTien.T7,
						T8: sumThanhTien.T8,
						T9: sumThanhTien.T9,
						T10: sumThanhTien.T10,
						T11: sumThanhTien.T11,
						T12: sumThanhTien.T12,
						layer: `${groupIndex}.${itemIndex + 1}.2`,
						visible: true,
					};
					processedData.push(grandchildTong);

					// Tính thành tiền mới cho childRow
					for (let i = 1; i <= 12; i++) {
						const tyLe = grandchildTyLe[`T${i}`];

						if (tyLe === undefined || tyLe === null || tyLe === "" || isNaN(Number(tyLe)) || tyLe === 0) {
							childRow[`T${i}_ThanhTien`] = undefined;
							childRow[`T${i}`] = undefined;
						} else {
							if (childRow.isDT) {
								console.log(1);
								childRow[`T${i}_ThanhTien`] = Math.abs((sumThanhTien[`T${i}`] || 0) * (Number(tyLe) / 100));
							} else {
								childRow[`T${i}_ThanhTien`] = - Math.abs((sumThanhTien[`T${i}`] || 0) * (Number(tyLe) / 100));
							}

							childRow[`T${i}`] = childRow[`T${i}_ThanhTien`];

							parentRow[`T${i}`] += childRow[`T${i}`];
						}
					}
					processedData.push(childRow);
					return; // Bỏ qua xử lý mặc định
				}
				// Get the "Thành tiền" row from each item
				const thanhTien = item.data && item.data.length > 2 ? item.data[2] : null;
				// Get the "Số lượng" row for quantity tracking
				const soLuong = item.data && item.data.length > 0 ? item.data[0] : null;

				if (thanhTien) {
					// Add to parent row totals
					for (let i = 1; i <= 12; i++) {
						const monthKey = `T${i}`;
						parentRow[monthKey] += Number(thanhTien[monthKey]) || 0;

						// Add to total quantities if soLuong exists
						if (soLuong) {
							parentRow.totalQuantities[monthKey] += Number(soLuong[monthKey]) || 0;
						}
					}

					// Create child row for this item
					const childRow = {
						id: item.id,
						name: item.name,
						boPhan: item.boPhan,
						khoanMuc: item.khoanMuc,
						labelSoLuong: item.labelSoLuong,
						theoDoi: item.theoDoi,
						theoDoiDG: item.theoDoiDG,
						data: item.data,
						layer: `${groupIndex}.${itemIndex + 1}`,
						isGroup: false,
						isChildGroup: true,
						expanded: true,
						isDT: item.isDT,
						isSum: item.isSum,
						phanLoai: item.phanLoai,
						percentFormula: item.percentFormula,
						isPercentFormula: item.isPercentFormula,
					};

					// Get the Số lượng and Đơn giá data to calculate Thành tiền
					const soLuongData = item.data && item.data.length > 0 ? item.data[0] : null;
					const donGiaData = item.data && item.data.length > 1 ? item.data[1] : null;

					// Calculate and add Thành tiền values to the child row if theoDoiDG is true
					if (item.theoDoiDG && soLuongData && donGiaData) {
						const sign = (typeof item.isDT === 'undefined' || item.isDT === true) ? 1 : -1;
						for (let i = 1; i <= 12; i++) {
							const monthKey = `T${i}`;
							const soLuong = soLuongData[monthKey] || 0;
							const donGia = donGiaData[monthKey] || 0;
							childRow[`${monthKey}_ThanhTien`] = soLuong * donGia * sign;
							childRow[monthKey] = soLuong * donGia * sign;
						}
					}

					// Create grandchild rows for each data type (Số lượng, Đơn giá)
					if (item.data && item.data.length > 0) {
						// Add grandchild rows for Số lượng and Đơn giá only
						item.data.forEach((dataItem, dataIndex) => {
							// Skip Thành tiền row completely
							if (dataItem.name === 'Thành tiền') {
								return;
							}

							// Skip Đơn giá if theoDoiDG is false
							if (!item.theoDoiDG && dataItem.name === 'Đơn giá') {
								return;
							}

							const grandchildRow = {
								id: `${item.id}_${dataIndex}`,
								name: dataItem.name,
								boPhan: item.boPhan,
								khoanMuc: item.khoanMuc,
								labelSoLuong: item.labelSoLuong,
								theoDoi: item.theoDoi,
								theoDoiDG: item.theoDoiDG,
								parentData: item.data,
								parentId: item.id,
								phanLoai: item.phanLoai,
								dataType: dataItem.name,
								dataIndex: dataIndex,
								T1: dataItem.T1 || 0,
								T2: dataItem.T2 || 0,
								T3: dataItem.T3 || 0,
								T4: dataItem.T4 || 0,
								T5: dataItem.T5 || 0,
								T6: dataItem.T6 || 0,
								T7: dataItem.T7 || 0,
								T8: dataItem.T8 || 0,
								T9: dataItem.T9 || 0,
								T10: dataItem.T10 || 0,
								T11: dataItem.T11 || 0,
								T12: dataItem.T12 || 0,
								layer: `${groupIndex}.${itemIndex + 1}.${dataIndex + 1}`,
								isGroup: false,
								isGrandchild: true,
								visible: true, // Trạng thái hiển thị ban đầu
								percentFormula: item.percentFormula,
								isPercentFormula: item.isPercentFormula,
							};
							processedData.push(grandchildRow);
						});
					}

					processedData.push(childRow);
				}
			});

			// Add parent row after processing all children
			processedData.push(parentRow);
		});

		// Sort by layer
		return processedData.sort((a, b) => {
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
	};

	const fetchData = async () => {
		try {
			const data = await getKHKDById(idLapKH);
			setKhkdData(data); // 👈 lưu data vào state
			setSelectedUC(new Set(data?.userClass || [])); // 👈 lưu data vào state
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu KH:', error);
		}
	};

	useEffect(() => {
		fetchData();
	}, [idLapKH]);

	// Fetch KHKD list function
	const fetchKHKDElementList = async () => {
		try {
			const data = await getKHKDElementByKHKDId(idLapKH);
			// Format data to ensure we have the required objects and add calculated row
			const formattedData = data.map(item => {
				// Nếu đã có đủ 3 phần tử đúng tên thì giữ nguyên
				if (
					item.data &&
					item.data.length === 3 &&
					item.data[0]?.name === 'Số lượng' &&
					item.data[1]?.name === 'Đơn giá' &&
					item.data[2]?.name === 'Thành tiền'
				) {
					if (item.tyLePhanTram !== undefined) {
						item.tyLePhanTram = item.tyLePhanTram;
					}
					return item;
				}
				// Nếu chưa đủ, tính lại như cũ
				const soLuong = { name: 'Số lượng', ...item.data?.[0] };
				const donGia = { name: 'Đơn giá', ...item.data?.[1] };
				const thanhTien = {
					name: 'Thành tiền',
					T1: (Number(soLuong.T1) || 0) * (Number(donGia.T1) || 0),
					T2: (Number(soLuong.T2) || 0) * (Number(donGia.T2) || 0),
					T3: (Number(soLuong.T3) || 0) * (Number(donGia.T3) || 0),
					T4: (Number(soLuong.T4) || 0) * (Number(donGia.T4) || 0),
					T5: (Number(soLuong.T5) || 0) * (Number(donGia.T5) || 0),
					T6: (Number(soLuong.T6) || 0) * (Number(donGia.T6) || 0),
					T7: (Number(soLuong.T7) || 0) * (Number(donGia.T7) || 0),
					T8: (Number(soLuong.T8) || 0) * (Number(donGia.T8) || 0),
					T9: (Number(soLuong.T9) || 0) * (Number(donGia.T9) || 0),
					T10: (Number(soLuong.T10) || 0) * (Number(donGia.T10) || 0),
					T11: (Number(soLuong.T11) || 0) * (Number(donGia.T11) || 0),
					T12: (Number(soLuong.T12) || 0) * (Number(donGia.T12) || 0),
					// Calculate quarterly totals by summing up monthly values
					Q1: ((Number(soLuong.T1) || 0) * (Number(donGia.T1) || 0)) +
						((Number(soLuong.T2) || 0) * (Number(donGia.T2) || 0)) +
						((Number(soLuong.T3) || 0) * (Number(donGia.T3) || 0)),
					Q2: ((Number(soLuong.T4) || 0) * (Number(donGia.T4) || 0)) +
						((Number(soLuong.T5) || 0) * (Number(donGia.T5) || 0)) +
						((Number(soLuong.T6) || 0) * (Number(donGia.T6) || 0)),
					Q3: ((Number(soLuong.T7) || 0) * (Number(donGia.T7) || 0)) +
						((Number(soLuong.T8) || 0) * (Number(donGia.T8) || 0)) +
						((Number(soLuong.T9) || 0) * (Number(donGia.T9) || 0)),
					Q4: ((Number(soLuong.T10) || 0) * (Number(donGia.T10) || 0)) +
						((Number(soLuong.T11) || 0) * (Number(donGia.T11) || 0)) +
						((Number(soLuong.T12) || 0) * (Number(donGia.T12) || 0)),
					// Calculate yearly total by summing up all monthly values
					caNam: ((Number(soLuong.T1) || 0) * (Number(donGia.T1) || 0)) +
						((Number(soLuong.T2) || 0) * (Number(donGia.T2) || 0)) +
						((Number(soLuong.T3) || 0) * (Number(donGia.T3) || 0)) +
						((Number(soLuong.T4) || 0) * (Number(donGia.T4) || 0)) +
						((Number(soLuong.T5) || 0) * (Number(donGia.T5) || 0)) +
						((Number(soLuong.T6) || 0) * (Number(donGia.T6) || 0)) +
						((Number(soLuong.T7) || 0) * (Number(donGia.T7) || 0)) +
						((Number(soLuong.T8) || 0) * (Number(donGia.T8) || 0)) +
						((Number(soLuong.T9) || 0) * (Number(donGia.T9) || 0)) +
						((Number(soLuong.T10) || 0) * (Number(donGia.T10) || 0)) +
						((Number(soLuong.T11) || 0) * (Number(donGia.T11) || 0)) +
						((Number(soLuong.T12) || 0) * (Number(donGia.T12) || 0)),
				};
				if (item.isPercentFormula && item.data && item.data[1] && item.data[1].name === 'Tỷ lệ (%)') {
					// Lấy giá trị % theo từng tháng, mặc định lấy T1
					item.tyLePhanTram = item.data[1].T1 || 0;
				}
				return {
					...item,
					data: [soLuong, donGia, thanhTien],
				};
			});

			setKhkdListElement(formattedData || []);

			// Open all cards initially
			if (formattedData && formattedData.length > 0) {
				setOpenCards(formattedData.map(item => item.id));
			}

			setRowData(processDataForHierarchicalView(formattedData.filter(row => row.khoanMuc !== null)));
		} catch (error) {
			console.error('Lỗi khi lấy danh sách KHKD:', error);
		}
	};

	// Fetch KHKD list when element modal is opened
	useEffect(() => {
		fetchKHKDElementList();
	}, [idLapKH]);

	// Tham chiếu đến grid để có thể gọi các phương thức của AG Grid
	const gridRef = React.useRef();

	// Mở tất cả các master detail sau khi dữ liệu được tải
	useEffect(() => {
		if (gridRef.current && gridRef.current.api && khkdListElement.length > 0) {
			setTimeout(() => {
				gridRef.current.api.forEachNode(node => {
					node.setExpanded(true);
				});
			}, 500);
		}
	}, [khkdListElement]);

	useEffect(() => {
		const fetch = async () => {
			setLoadingKHKDElement(true);
			try {
				await fetchKHKDElementList();
			} finally {
				setLoadingKHKDElement(false);
			}
		};
		fetch();
	}, [idLapKH]);

	// Sau khi setRowData, thêm useEffect để tính lại tổng cho các dòng khoản mục
	useEffect(() => {
		// Nếu rowData rỗng hoặc không có dòng khoản mục thì bỏ qua
		if (!rowData || rowData.length === 0) return;

		// Tìm các dòng khoản mục (isGroup) và các dòng con (isChildGroup)
		const updatedRowData = rowData.map(row => {
			if (!row.isGroup) return row;
			// Lấy các dòng con thuộc khoản mục này
			const childRows = rowData.filter(r => r.khoanMuc === row.name && r.isChildGroup);
			// Tính tổng cho từng cột T1-T12
			const newRow = { ...row };
			for (let i = 1; i <= 12; i++) {
				const monthKey = `T${i}`;
				newRow[monthKey] = childRows.reduce((sum, child) => sum + (Number(child[monthKey]) || 0), 0);
			}
			return newRow;
		});
		setRowData(updatedRowData);
	}, [khkdListElement]);

	const openAddKHKDElementModal = () => {
		setEditingItem(null);
		setFormData({
			name: '',
			phanLoai: '',
			khoanMuc: '',
			boPhan: '',
			labelSoLuong: '',
			data: [],
			theoDoi: true,
			theoDoiDG: true,
			percentFormula: [],
			isPercentFormula: false,
		});
		setIsAddKHKDElementModalVisible(true);
	};

	const closeAddKHKDElementModal = () => {
		setIsAddKHKDElementModalVisible(false);
		setEditingItem(null);
		setFormData({
			name: '',
			khoanMuc: '',
			boPhan: '',
			phanLoai: '',
			labelSoLuong: '',
			data: [],
			theoDoi: true,
			theoDoiDG: true,
			percentFormula: [],
			isPercentFormula: false,
		});
	};

	// const openQLDanhMucModal = () => setIsQLDanhMucModalVisible(true);
	// const closeQLDanhMucModal = () => setIsQLDanhMucModalVisible(false);

	const handleInputChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSave = async () => {
		try {
			// Set khoanMuc to null if the value is "Không chọn"
			const updatedFormData = {
				...formData,
				khoanMuc: formData.khoanMuc === 'Không chọn' ? null : formData.khoanMuc,
			};

			if (editingItem) {
				// Update existing item
				await updateKHKDElement(editingItem.id, {
					...updatedFormData,
					idKHKD: idLapKH,
				});
				message.success('Mục đã được cập nhật thành công!');
				// Fetch updated list
				await fetchKHKDElementList();
			} else {
				// Create new item
				const newItem = {
					...updatedFormData,
					idKHKD: idLapKH,
					data: [],
				};
				await createKHKDElement(newItem);
				message.success('Mục đã được thêm thành công!');
				// Fetch updated list
				await fetchKHKDElementList();
			}
			closeAddKHKDElementModal();
		} catch (error) {
			message.error(editingItem ? 'Lỗi khi cập nhật mục!' : 'Lỗi khi thêm mục!');
			console.error(error);
		}
	};

	const handleEdit = (item) => {
		console.log('item', item);
		setEditingItem(item);
		setFormData({
			name: item.name,
			khoanMuc: item.khoanMuc,
			boPhan: item.boPhan,
			labelSoLuong: item.labelSoLuong,
			data: item.data,
			theoDoi: item.theoDoi,
			theoDoiDG: item.theoDoiDG,
			phanLoai: item.phanLoai,
			percentFormula: item.percentFormula,
			isPercentFormula: item.isPercentFormula,
		});
		setIsAddKHKDElementModalVisible(true);
	};

	const handleDelete = async (id) => {
		try {
			// Confirm deletion
			await deleteKHKDElement(id);
			message.success('Xóa thành công!');

			// This ensures the hierarchical view is properly updated with correct totals
			await fetchKHKDElementList();

			// Remove the deleted item's ID from openCards
			setOpenCards(prev => prev.filter(cardId => cardId !== id));
		} catch (error) {
			message.error('Lỗi khi xóa mục!');
			console.error(error);
		}
	};

	// Xử lý sự kiện khi người dùng thay đổi trạng thái của checkbox Theo dõi
	const handleTheoDoiChange = async (id, checked) => {
		try {
			// Cập nhật trạng thái theoDoi trong cơ sở dữ liệu
			await updateKHKDElement(id, { theoDoi: checked });

			// Cập nhật UI ngay lập tức
			if (gridRef.current && gridRef.current.api) {
				// Cập nhật trạng thái trong grid
				gridRef.current.api.forEachNode(node => {
					if (node.data && node.data.id === id) {
						node.data.theoDoi = checked;
						gridRef.current.api.refreshCells({
							force: true,
							rowNodes: [node],
							columns: ['theoDoi'],
						});
					}
				});
			}

			// Tải lại dữ liệu từ server để đảm bảo đồng bộ
			await fetchKHKDElementList();
		} catch (error) {
			console.error('Lỗi khi cập nhật trạng thái theo dõi:', error);
			message.error('Có lỗi xảy ra khi cập nhật trạng thái theo dõi');
		}
	};

	// Hàm cập nhật tổng cho dòng cha
	function updateParentTotals(params) {
		const parentId = params.data.parentId;
		const field = params.column.colId;

		// Tìm tất cả các dòng con của cùng một dòng cha
		const childValues = [];
		params.api.forEachNode(node => {
			if (node.data && node.data.parentId === parentId &&
				node.data.name === 'Thành tiền') {
				childValues.push(Number(node.data[field]) || 0);
			}
		});

		// Tính tổng
		const total = childValues.reduce((sum, value) => sum + value, 0);

		// Cập nhật giá trị tổng cho dòng cha
		params.api.forEachNode(node => {
			if (node.data && node.data.id === parentId) {
				node.data[field] = total;
			}
		});
	}

	// Lấy setting KHKD khi vào trang hoặc khi đóng QL Danh Mục
	useEffect(() => {
		const fetchSetting = async () => {
			try {
				const data = await getSettingByType('KHKD');
				setKhkdSetting(data?.setting || null);
			} catch (e) {
				setKhkdSetting(null);
			}
		};
		fetchSetting();
	}, [isQLDanhMucModalVisible]);

	const onImport = async (importedRows) => {
		let success = 0, fail = 0;
		for (const item of importedRows) {
			try {
				// Kiểm tra đã tồn tại theo name
				const existed = khkdListElement.find(e => e.name === item.name);

				// Create mới
				await createKHKDElement({ ...item, idKHKD: idLapKH, theoDoi: true });

				success++;
			} catch (e) {
				fail++;
			}
		}
		// Reload lại danh sách sau khi import
		await fetchKHKDElementList();
		if (success > 0) message.success(`Import thành công ${success} mục!`);
		if (fail > 0) message.error(`Có ${fail} mục lỗi!`);
	};

	// Hàm tính lại toàn bộ thành tiền cho tất cả các dòng data
	function recalculateAllThanhTien(allRows, allElements) {
		const idToElement = {};
		allElements.forEach(item => { idToElement[item.id] = item; });
		const updatedRows = {};
		Object.entries(allRows).forEach(([id, data]) => {
			const element = idToElement[id];
			if (!element) return;
			// Nếu là kiểu tỷ lệ %
			if (element.isPercentFormula && data[1] && data[1].name === 'Tỷ lệ (%)') {
				// Tính tổng thành tiền các mục được chọn cho từng tháng
				let sumThanhTien = {};
				for (let i = 1; i <= 12; i++) sumThanhTien[`T${i}`] = 0;
				(element.percentFormula || []).forEach((refId) => {
					const found = allElements.find(e => e.id === refId);
					if (found && found.data && found.data.length > 2) {
						const thanhTien = found.data[2];
						const sign = (typeof found.isDT === 'undefined' || found.isDT === true) ? 1 : -1;
						for (let i = 1; i <= 12; i++) {
							sumThanhTien[`T${i}`] += sign * (Number(thanhTien[`T${i}`]) || 0);
						}
					}
				});
				// Tính lại thành tiền từng tháng
				for (let i = 1; i <= 12; i++) {
					const tyLe = Number(data[1][`T${i}`]) || 0;
					if (tyLe === undefined || tyLe === null || tyLe === "" || isNaN(Number(tyLe))) {
						data[2][`T${i}`] = undefined;
						data[0][`T${i}`] = undefined;
					} else {
						data[2][`T${i}`] = sumThanhTien[`T${i}`] * (tyLe / 100);
						data[0][`T${i}`] = data[2][`T${i}`];
					}
				}
				updatedRows[id] = [...data];
			} else if (data[0] && data[1] && data[2]) {
				// Kiểu thường: Thành tiền = Số lượng * Đơn giá * sign
				const sign = (typeof element.isDT === 'undefined' || element.isDT === true) ? 1 : -1;
				for (let i = 1; i <= 12; i++) {
					const soLuong = Number(data[0][`T${i}`]) || 0;
					const donGia = Number(data[1][`T${i}`]) || 0;
					data[2][`T${i}`] = soLuong * donGia * sign;
				}
				updatedRows[id] = [...data];
			}
		});
		return updatedRows;
	}

	const handleSaveEditedRows = async () => {
		try {
			// Tính lại toàn bộ thành tiền trước khi lưu
			const recalculatedRows = recalculateAllThanhTien(editedRows, khkdListElement);
			for (const [id, data] of Object.entries(recalculatedRows)) {
				let updateData = { data };
				if (data.tyLePhanTram !== undefined) {
					updateData.tyLePhanTram = data.tyLePhanTram;
				}
				await updateKHKDElement(id, updateData);
			}
			message.success('Đã lưu các thay đổi!');
			setEditedRows({});
			await fetchKHKDElementList();
		} catch (error) {
			message.error('Lỗi khi lưu thay đổi!');
			console.error(error);
		}
	};

	// Viết lại hàm expand/collapse cho parent (khoản mục)
	const handleCollapseExpandAllParent = (expand) => {
		if (gridRef.current && gridRef.current.api) {
			gridRef.current.api.forEachNode(node => {
				// Node cấp 1 (khoản mục) là node có layer chỉ có 1 phần tử và isGroup
				if (node.data && node.data.isGroup && node.data.layer && node.data.layer.split('.').length === 1) {
					node.setExpanded(expand);
				}
			});
		}
	};

	// Viết lại hàm expand/collapse cho child (mục con)
	const handleCollapseExpandAllChild = (expand) => {
		if (gridRef.current && gridRef.current.api) {
			gridRef.current.api.forEachNode(node => {
				// Node cấp 2 (mục con) là node có layer 2 phần tử và isChildGroup
				if (node.data && node.data.isChildGroup && node.data.layer && node.data.layer.split('.').length === 2) {
					node.setExpanded(expand);
				}
			});
		}
	};

	const handleChangeIsDT = async (item, checked) => {
		if (!item) return;
		// Đổi dấu thành tiền trong data của mục này
		const newData = item.data.map((row) => {
			if (row.name === 'Thành tiền') {
				const sign = checked ? 1 : -1;
				const updated = { ...row };
				for (let i = 1; i <= 12; i++) {
					const key = `T${i}`;
					updated[key] = Math.abs(Number(row[key]) || 0) * sign;
				}
				return updated;
			}
			return row;
		});

		// Cập nhật mục này
		await updateKHKDElement(item.id, { ...item, isDT: checked, data: newData });

		// Cập nhật lại các mục percent phụ thuộc
		for (const percentItem of khkdListElement) {
			if (
				percentItem.isPercentFormula &&
				Array.isArray(percentItem.percentFormula) &&
				percentItem.percentFormula.includes(item.id)
			) {
				// Tính lại thành tiền cho mục tỷ lệ %
				// (Có thể dùng lại logic recalculateAllThanhTien cho từng mục này)
				// Hoặc đơn giản: gọi lại fetchKHKDElementList để reload toàn bộ
				await updateKHKDElement(percentItem.id, percentItem); // hoặc chỉ cần fetch lại toàn bộ
			}
		}

		// Reload lại danh sách để đồng bộ UI
		await fetchKHKDElementList();
	};


	const handleChange = (name) => {
		setSelectedUC((prev) => {
			const newSet = new Set(prev);
			newSet.has(name) ? newSet.delete(name) : newSet.add(name);
			return newSet;
		});
	};

	return (
		<>
			{!(currentUser.isAdmin || khkdData?.userCreated === currentUser.email) ? (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, fontSize: '18px', color: '#ff4d4f' }}>
					Không có quyền xem dữ liệu
				</div>
			) : loadingKHKDElement ? (
				<Loading3DTower />
			) : (
				<div className={css.KHKDContainer}>
					{/* Section 1: KẾ HOẠCH KINH DOANH */}

					<div className={css.headerContainer}>
						<div className={css.duyetContainer}>
							<h1 className={css.title}>{khkdData?.name}</h1>
							<div className="setting_userClass">
								<img
									style={{ width: '25px', height: '25px', cursor: 'pointer' }}
									src={IconUser}
									alt=""
									onClick={() => (currentUser.isAdmin || khkdData.userCreated == currentUser.email) && setOpenSetupUC(true)}
								/>
								{khkdData?.userClass && khkdData.userClass.map((uc) => <span
									className={css.tag}>{uc}</span>)}
							</div>
						</div>
						{/* <div className={css.headerTitle}>Kế hoạch doanh thu</div> */}
					</div>
					<div className={css.contentContainer}>
						<div>
							<div className={css.sectionTitle}>KẾ HOẠCH NGÂN SÁCH</div>
							<div className={css.sectionNote}>
								Lập kế hoạch tài chính theo các khoản mục KQKD, bộ phận, vụ việc/ mục chi tiết, bao gồm
								các đo lường bổ trợ cho kế hoạch.
							</div>
							<div className={css.headerButton}>
								<Dropdown
									overlay={
										<Menu>
											<Menu.Item key="collapseAllParent" onClick={() => handleCollapseExpandAllParent(false)}>
												Thu gọn tất cả khoản mục
											</Menu.Item>
											<Menu.Item key="expandAllParent" onClick={() => handleCollapseExpandAllParent(true)}>
												Mở tất cả khoản mục
											</Menu.Item>
											<Menu.Item key="collapseAllChild" onClick={() => handleCollapseExpandAllChild(false)}>
												Thu gọn chi tiết
											</Menu.Item>
											<Menu.Item key="expandAllChild" onClick={() => handleCollapseExpandAllChild(true)}>
												Mở tất cả chi tiết
											</Menu.Item>
										</Menu>
									}
									placement="bottomLeft"
								>
									<Button className={css.actionButton}>
										Tuỳ chọn hiển thị
									</Button>
								</Dropdown>

								{Object.keys(editedRows).length > 0 && (
									<>
										<Button
											className={css.actionButton}
											onClick={handleSaveEditedRows}
											icon={(<img src={SaveTableIcon} alt="" />)}
											style={{ backgroundColor: '#ffaa3a', color: 'white' }}
										>
											Lưu
										</Button>
										<Button
											className={css.actionButton}
											onClick={() => {
												setEditedRows({});
												fetchKHKDElementList();
											}}
											style={{ background: '#FF585B', color: 'white' }}
										>
											Hủy
										</Button>
									</>
								)}
								<Button className={css.actionButton} onClick={openAddKHKDElementModal}>
									Thêm mục
								</Button>
								<KHKDImportExportDropdown
									// onImport={onImport}
									reload={fetchKHKDElementList}
									importDisabled={!(khkdSetting?.khoanMuc?.templateId && khkdSetting?.boPhan?.templateId)}
								/>

							</div>
						</div>
						{khkdListElement.length === 0 ? (
							<div>Không có dữ liệu.</div>
						) : (
							<>
								<div className='ag-theme-quartz' style={{ width: '100%', marginTop: 10 }}>
									<AgGridReact
										ref={gridRef}
										domLayout={'autoHeight'}
										columnDefs={columnDefs}
										enableRangeSelection={true}
										defaultColDef={{
											resizable: true,
											sortable: true,
											filter: true,
											width: 100,
											suppressHeaderMenuButton: true,
										}}
										// Mặc định mở tất cả các master detail
										// detailRowAutoHeight={true}
										autoGroupColumnDef={{
											cellRendererParams: {
												suppressCount: true,
											},
										}}
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
										rowData={rowData}
										// Configure row grouping and expand/collapse functionality
										isRowSelectable={(params) => !params.data.isGrandchild}
										getRowClass={(params) => {
											// Apply different classes based on row type
											if (params.data.isGroup) return 'parent-group-row';

											if (params.data.isChildGroup) {
												// Apply specific styles based on department (boPhan)
												const boPhan = params.data.boPhan?.toLowerCase() || '';
												if (boPhan.includes('cntt') || boPhan.includes('it')) {
													return 'child-group-row child-group-row-cntt';
												} else if (boPhan.includes('marketing') || boPhan.includes('sale')) {
													return 'child-group-row child-group-row-marketing';
												} else if (boPhan.includes('sản xuất') || boPhan.includes('san xuat')) {
													return 'child-group-row child-group-row-sanxuat';
												}
												return 'child-group-row';
											}

											if (params.data.isGrandchild) {
												// Ẩn các dòng con nếu dòng cha đã thu gọn
												if (params.data.parentId) {
													const parentNode = params.api.getRowNode(params.data.parentId);
													// Kiểm tra trạng thái mở rộng của node cha
													if (!parentNode || !parentNode.expanded || params.data.visible === false) {
														return 'hidden-grandchild-row';
													}
												}
												return 'grandchild-row';
											}
											return '';
										}}

										onCellClicked={(params) => {
											if (params.column.colId === 'name') {
												// When clicking on a row name, toggle the detail view
												const newExpandedState = !params.data.expanded;
												params.node.setExpanded(newExpandedState);

												// Cập nhật trạng thái của các dòng con
												if (params.data && params.data.isChildGroup) {
													const currentId = params.data.id;
													params.api.forEachNode(node => {
														if (node.data && node.data.parentId === currentId) {
															// Cập nhật trạng thái hiển thị của dòng con
															node.data.visible = newExpandedState;
														}
													});

													// Cập nhật lại grid
													setTimeout(() => {
														params.api.refreshCells();
													}, 10);
												}
											}
										}}
										onRowClicked={(params) => {
											// Auto-expand the detail view when clicking anywhere on the row
											// This makes it easier for users to access the detail view
											if (!params.data.expanded && params.data.isChildGroup) {
												params.node.setExpanded(true);

												// Cập nhật trạng thái của các dòng con
												const currentId = params.data.id;
												params.api.forEachNode(node => {
													if (node.data && node.data.parentId === currentId) {
														// Cập nhật trạng thái hiển thị của dòng con
														node.data.visible = true;
													}
												});

												// Cập nhật lại grid
												setTimeout(() => {
													params.api.refreshCells();
												}, 10);
											}
										}}
										localeText={AG_GRID_LOCALE_VN}
									/>
								</div>
								{/* Section 2: CÁC CHỈ TIÊU HOẠT ĐỘNG KHÁC (PHI TÀI CHÍNH) */}

							</>
						)}
						<div style={{ marginTop: 32 }}>
							<div className={css.sectionTitle}>CÁC CHỈ TIÊU HOẠT ĐỘNG KHÁC (PHI TÀI CHÍNH)</div>
							<div className={css.sectionNote}>
								Lập các chỉ tiêu đo lường phi tài chính nhưng có có nghĩa quan trọng trong vận hành,
								kinh doanh
							</div>
							<KHKDElement3 data={khkdListElement.filter(row => row.khoanMuc === null)}
								fetchKHTH={fetchKHKDElementList}
								onImport={onImport} />
						</div>
					</div>
				</div>
			)}
			{isAddKHKDElementModalVisible && (
				<AddKHKDElementModal
					isVisible={isAddKHKDElementModalVisible}
					onClose={closeAddKHKDElementModal}
					onSave={handleSave}
					formData={formData}
					onInputChange={handleInputChange}
					isEditing={!!editingItem}
					khkdListElement={khkdListElement}
				/>
			)}
			{/*{isQLDanhMucModalVisible && (*/}
			{/*	<QLDanhMuc*/}
			{/*		isVisible={isQLDanhMucModalVisible}*/}
			{/*		onClose={closeQLDanhMucModal}*/}
			{/*	/>*/}
			{/*)}*/}
			{openSetupUC && (<>

				<Modal
					title={`Cài đặt nhóm người dùng`}
					open={openSetupUC}
					onCancel={() => setOpenSetupUC(false)}
					onOk={() => {
						updateKHKD(khkdData.id, {
							...khkdData, userClass: Array.from(selectedUC),
						}).then((data) => {
							setKhkdData(data?.data?.data)
							setOpenSetupUC(false);
						});
					}}
					okButtonProps={{
						style: {
							backgroundColor: '#2d9d5b',
						},
					}}
					centered
					width={400}
					bodyStyle={{ height: '20vh', overflowY: 'auto' }}
				>
					{listUC.map((uc) => {
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
			</>)}
		</>
	);
};

export default KHKD;
