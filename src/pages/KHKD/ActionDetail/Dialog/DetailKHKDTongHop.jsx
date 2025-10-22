import React, { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import AG_GRID_LOCALE_VN from '../../../../pages/Home/AgridTable/locale.jsx';
import { getKHKDElementByKhoanMuc, getAllKHKDElement } from '../../../../apis/khkdElementService.jsx';
import { Dialog, DialogActions, DialogContent } from '@mui/material';
import { formatMoney } from '../../../../generalFunction/format.js';
import { Button } from 'antd';
import css from './Detail.module.css';
import { getTableByid, getTemplateRow } from '../../../../apis/templateSettingService.jsx';
import { getDeepestLevelRows, viewDetailTH } from './logicDetailTH.js';
import { ViewTHTable } from './ViewTHTable.jsx';

export default function DetailKHKDTongHop({ open, onClose, name, khkdData }) {
	const [khkdListElement, setKhkdListElement] = useState([]);
	const [dataTH, setDataTH] = useState(null);
	const [fullKHKDListElement, setFullKHKDListElement] = useState([]);
	// Helper functions to process data for hierarchical display
	const processDataForHierarchicalView = (data, fullData) => {
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
					};

					// Tạo object tỷ lệ theo tháng
					const tyLeTheoThang = {};
					for (let i = 1; i <= 12; i++) {
						const key = `T${i}`;
						tyLeTheoThang[key] = (item.data && item.data[1] && item.data[1][key] !== undefined) ? item.data[1][key] : undefined;
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
						const found = (fullData || []).find(e => e.id === id);
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
							const found = (fullData || []).find(e => e.id === id);
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
						if (tyLe === undefined || tyLe === null || tyLe === "" || isNaN(Number(tyLe))) {
							childRow[`T${i}_ThanhTien`] = undefined;
							childRow[`T${i}`] = undefined;
						} else {
							const value = (sumThanhTien[`T${i}`] || 0) * (Number(tyLe) / 100);
							// Áp dụng dấu theo childRow.isDT
							childRow[`T${i}_ThanhTien`] = (typeof childRow.isDT === 'undefined' || childRow.isDT === true)
								? Math.abs(value)
								: -Math.abs(value);
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
					};

					// Get the Số lượng and Đơn giá data to calculate Thành tiền
					const soLuongData = item.data && item.data.length > 0 ? item.data[0] : null;
					const donGiaData = item.data && item.data.length > 1 ? item.data[1] : null;

					// Calculate and add Thành tiền values to the child row if theoDoiDG is true
					if (item.theoDoiDG && soLuongData && donGiaData) {
						for (let i = 1; i <= 12; i++) {
							const monthKey = `T${i}`;
							const soLuong = soLuongData[monthKey] || 0;
							const donGia = donGiaData[monthKey] || 0;
							childRow[`${monthKey}_ThanhTien`] = soLuong * donGia;
							// Also set the regular month value to show the Thành tiền in the cell
							childRow[monthKey] = soLuong * donGia;
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

	// Fetch KHKD list function
	const fetchKHKDElementList = async () => {
		try {
			const data = await getKHKDElementByKhoanMuc(name);
			// Format data to ensure we have the required objects and add calculated row
			const formattedData = data.map(item => {
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
				return {
					...item,
					data: [soLuong, donGia, thanhTien],
				};
			});
			setKhkdListElement(formattedData || []);
		} catch (error) {
			console.error('Lỗi khi lấy danh sách KHKD:', error);
		}
	};

	// Fetch KHKD list when element modal is opened
	useEffect(() => {
		fetchKHKDElementList();
	}, [name]);

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

	async function viewTH() {
		let allTemplatesData = await viewDetailTH(khkdData, 'thucHien');
		let dataTH = getDeepestLevelRows(allTemplatesData);
		setDataTH(dataTH);
	}

	useEffect(() => {
		// Gọi API lấy toàn bộ mục kế hoạch (không filter theo khoản mục)
		getAllKHKDElement(khkdData?.idKHKD).then(setFullKHKDListElement);
	}, [khkdData]);

	return (
		<Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
			<DialogContent sx={{
				maxHeight: '80vh', // Chiều cao tối đa là 80% chiều cao viewport
				overflowY: 'auto', // Tự cuộn nếu nội dung vượt quá
			}}>
				<div className={css.contentContainer}>
					{khkdListElement.length === 0 ? (
						<div>Không có dữ liệu.</div>
					) : (
						<>
							{khkdData && <Button onClick={viewTH}>Xem thực hiện</Button>}
							<div className="ag-theme-quartz" style={{ width: '100%', marginTop: 30 }}>
								<h1>Dữ liệu kế hoạch</h1>
								<AgGridReact
									ref={gridRef}
									domLayout={'autoHeight'}
									columnDefs={[
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
											headerName: 'Khoản mục/ Tên mục/ Chi tiết',
											pinned: 'left',
											field: 'name',
											width: 200,
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
															backgroundColor: '#ffffff',
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
															backgroundColor: '#f0f7ff',
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
														style = { ...style, color: '#1E65C8', fontWeight: 'bold' };
													} else if (params.data.name === 'Số lượng') {
														style = { ...style, color: '#1E65C8' };
													} else if (params.data.name === 'Đơn giá') {
														style = { ...style, color: '#1E65C8' };
													}

													return <div style={style}>{params.value}</div>;
												}

												return <div>{params.value}</div>;
											},
										},
										{
											headerName: 'Bộ phận',
											field: 'boPhan',
											width: 130,
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
											width: 130,
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
										// Monthly columns (T1-T12)
										...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => ({
												headerName: `T${month}`,
												field: `T${month}`,
												width: 130,
												cellRenderer: (params) => {
													// For child group rows (parent elements)
													if (params.data.isChildGroup) {
														// Display Thành tiền value if theoDoiDG is true
														if (params.data.theoDoiDG) {
															const thanhTienValue = params.data[`T${month}_ThanhTien`];
															// Check if we have a valid Thành tiền value
															if (thanhTienValue !== undefined && thanhTienValue !== null) {
																return (
																	<div style={{
																		textAlign: 'right',
																		fontWeight: 'bold',
																	}}>
																		{formatMoney(thanhTienValue)}
																	</div>
																);
															}
														}
														// Display the regular cell value if there's no Thành tiền value
														const value = params.data[`T${month}`];
														if (value) {
															return <div
																style={{ textAlign: 'right' }}>{formatMoney(value)}</div>;
														}
														return null;
													}

													// For grandchild rows (data type rows)
													if (params.data.isGrandchild) {
														const value = params.data[`T${month}`];
														let style = { textAlign: 'right' };

														// Apply different styles based on data type
														if (params.data.name === 'Số lượng') {
															style = { ...style, color: '#1E65C8' };
														} else if (params.data.name === 'Đơn giá') {
															style = { ...style, color: '#1E65C8' };
														}

														return <div style={style}>{formatMoney(value)}</div>;
													}

													// For parent group rows (khoanMuc)
													if (params.data.isGroup) {
														const value = params.data[`T${month}`];
														return <div style={{
															textAlign: 'right',
															fontWeight: 'bold',
															color: '#1C3D69',
														}}>{formatMoney(value)}</div>;
													}

													return '';
												},
												editable: (params) => {
													// Only allow editing for grandchild rows that are not 'Thành tiền'
													return params.data.isGrandchild && params.data.name !== 'Thành tiền';
												},
											}
										)),
									]}
									enableRangeSelection={true}
									defaultColDef={{
										resizable: true,
										sortable: true,
										filter: true,
										width: 100,
										suppressHeaderMenuButton: true,
									}}
									// Mặc định mở tất cả các master detail
									detailRowAutoHeight={true}
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
									groupDisplayType="groupRows"
									animateRows={true}
									rowData={processDataForHierarchicalView(khkdListElement, fullKHKDListElement)}
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
							{dataTH &&
								<>
									<h1>Dữ liệu thực hiện</h1>
									<ViewTHTable data={dataTH} />
								</>
							}
						</>
					)}
				</div>
			</DialogContent>

			<DialogActions>
				<Button onClick={onClose} color="primary">
					Đóng
				</Button>
			</DialogActions>
		</Dialog>

	);
};

