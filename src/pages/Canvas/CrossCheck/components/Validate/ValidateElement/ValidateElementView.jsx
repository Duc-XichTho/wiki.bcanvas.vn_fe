import css from './ValidateElement.module.css';
import React, { useEffect, useState } from 'react';
import { message, Spin, Table } from 'antd';
import { deleteCrossCheck } from '../../../../../../apis/crossCheckService';
import {
	getAllTemplateSheetTable,
	getTemplateColumn,
	getTemplateRow,
} from '../../../../../../apis/templateSettingService.jsx';
import { getFileNotePadByIdController } from '../../../../../../apis/fileNotePadService.jsx';
import { getAllKmf } from '../../../../../../apisKTQT/kmfService.jsx';
import { getAllKmns } from '../../../../../../apisKTQT/kmnsService.jsx';
import { getAllUnits } from '../../../../../../apisKTQT/unitService.jsx';
import { getAllProject } from '../../../../../../apisKTQT/projectService.jsx';
import { getAllProduct } from '../../../../../../apisKTQT/productService.jsx';
import { getAllKenh } from '../../../../../../apisKTQT/kenhService.jsx';
import { getAllVendor } from '../../../../../../apisKTQT/vendorService.jsx';

import { ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community';

import { ClipboardModule } from 'ag-grid-enterprise';
import { log } from 'mathjs';
import { LoadingOutlined } from '@ant-design/icons';

ModuleRegistry.registerModules([
	ClientSideRowModelModule,
	ClipboardModule,
]);

const COT_DU_LIEU = [
	{ id: 1, value: 'name', label: 'Mã' },
	{ id: 2, value: 'dp', label: 'Tên' },
];

const DANH_MUC_CHUNG = [
	{ id: 1, bo_du_lieu: { value: 'KQKD', label: 'Danh mục KQKD' } },
	{ id: 2, bo_du_lieu: { value: 'KMTC', label: 'Danh mục KMTC' } },
	{ id: 3, bo_du_lieu: { value: 'DV', label: 'Danh mục Đơn vị' } },
	{ id: 4, bo_du_lieu: { value: 'VV', label: 'Danh mục Vụ việc' } },
	{ id: 5, bo_du_lieu: { value: 'SP', label: 'Danh mục Sản phẩm' } },
	{ id: 6, bo_du_lieu: { value: 'KENH', label: 'Danh mục Kênh' } },
	{ id: 7, bo_du_lieu: { value: 'KH', label: 'Danh mục Khách hàng' } },
];

const ValidateElementView = ({ selectedItem, currentData }) => {

	const [name, setName] = useState('');
	const [desc, setDesc] = useState('');
	const [boDuLieuPrimary, setBoDuLieuPrimary] = useState('');
	const [cotDuLieuPrimary, setCotDuLieuPrimary] = useState('');
	const [boDuLieuChecking, setBoDuLieuChecking] = useState('');
	const [cotDuLieuChecking, setCotDuLieuChecking] = useState('');
	const [result, setResult] = useState([]);
	const [listTemplates, setListTemplates] = useState([]);
	const [checkingSourceValues, setCheckingSourceValues] = useState([]);
	const [loading, setLoading] = useState(false);

	async function getAllTemplate() {
		try {
			setLoading(true);

			let data = await getAllTemplateSheetTable();
			let validTemplates = [];

			for (const item of data) {
				try {
					if (!item.fileNote_id) {
						console.warn(`Template ID ${item.id}: Thiếu fileNote_id`);
						continue;
					}

					const fileNote = await getFileNotePadByIdController(item.fileNote_id);
					if (!fileNote) {
						console.warn(`Template ID ${item.id}: FileNote ${item.fileNote_id} không tồn tại`);
						continue;
					}

					const columns = await getTemplateColumn(item.id);
					let rows = []
					if (currentData) {
						rows = [...currentData]
					}
					else {
						const rowsResponse = await getTemplateRow(item.id)
						rows = rowsResponse.rows || [];
					}


					validTemplates.push({
						...item,
						name: fileNote.name,
						value: 'TEMP_' + item.id,
						fields: columns.map(col => ({
							headerName: col.columnName,
							field: col.columnName,
							type: col.columnType,
						})),
						rows: rows,
					});
				} catch (itemError) {
					console.warn(`Template ID ${item.id}: ${itemError.message}`);
					continue;
				}
			}
			console.log(validTemplates );

			setListTemplates(validTemplates);
		} catch (error) {
			console.error(`Lỗi: ${error.message}`);
			setListTemplates([]);
		}
	}

	useEffect(() => {
		getAllTemplate();
	}, [currentData]);

	const getSourceData = (source) => {

		let boDuLieu = '';
		let cotDuLieu = '';

		switch (source.type) {
			case 'DanhMuc':
				boDuLieu = DANH_MUC_CHUNG.find(item => item.bo_du_lieu.value === source?.bo_du_lieu)?.bo_du_lieu.label || '';
				cotDuLieu = COT_DU_LIEU.find(item => item.value === source?.cot_du_lieu)?.label || '';
				break;

			case 'Template': {
				const template = listTemplates.find(item => item.value === source?.bo_du_lieu);
				boDuLieu = template?.name || '';
				cotDuLieu = template?.fields?.find(field => field.field === source?.cot_du_lieu)?.headerName || '';
				break;
			}
			default:
				break;
		}

		return { boDuLieu, cotDuLieu };
	};


	useEffect(() => {
		if (selectedItem) {
			setName(selectedItem?.name);
			setDesc(selectedItem?.desc);

			const primaryData = getSourceData(selectedItem?.primarySource);
			setBoDuLieuPrimary(primaryData.boDuLieu);
			setCotDuLieuPrimary(primaryData.cotDuLieu);

			const checkingData = getSourceData(selectedItem?.checkingSource);
			setBoDuLieuChecking(checkingData.boDuLieu);
			setCotDuLieuChecking(checkingData.cotDuLieu);
			setResult([]);
		}
	}, [selectedItem, listTemplates]);

	useEffect(() => {
		if (selectedItem && listTemplates.length > 0) {
			handleChay();
		}
	}, [selectedItem, listTemplates]);

	const handleDelete = async () => {
		try {
			await deleteCrossCheck(selectedItem?.id);
			message.success('Xóa thành công');
		} catch (error) {
			console.log('ERROR handleDelete', error);
		}
	};

	const danhMucValues = [
		{ value: 'KQKD', getApi: getAllKmf },
		{ value: 'KMTC', getApi: getAllKmns },
		{ value: 'DV', getApi: getAllUnits },
		{ value: 'VV', getApi: getAllProject },
		{ value: 'SP', getApi: getAllProduct },
		{ value: 'KENH', getApi: getAllKenh },
		{ value: 'KH', getApi: getAllVendor },
	];

	async function getDataForSource(source) {
		if (!source) return null;

		if (source.type === 'Template') {
			return await getTemplateData(source.id);
		} else {
			const data = await getDanhMucData(source.bo_du_lieu);
			return data;
		}
	}

	async function getTemplateData(sourceId) {
		try {
			const templateSheets = await getAllTemplateSheetTable();
			const matchingSheet = templateSheets.find(sheet => sheet.fileNote_id === sourceId);
			if (matchingSheet) {
				let templateRowData = []
				if (currentData) {
					templateRowData = [...currentData]
				}
				else {
					const templateRowDataResponse = await getTemplateRow(matchingSheet.id);
					templateRowData = templateRowDataResponse.rows || [];
				}


				return templateRowData.map(item => ({ ...item.data, id: item.id }));
			} else {
				console.warn('Không tìm thấy sheet phù hợp với source ID:', sourceId);
				return null;
			}
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu Template:', error);
			return null;
		}
	}

	async function getDanhMucData(boDuLieu) {
		try {
			if (!boDuLieu) {
				console.warn('Không có bộ dữ liệu để lấy');
				return null;
			}

			const danhMuc = danhMucValues.find(item => item.value === boDuLieu);

			if (!danhMuc) {
				console.warn('Bộ dữ liệu không hợp lệ:', boDuLieu);
				return null;
			}

			return await danhMuc.getApi();
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu DanhMuc:', error);
			return null;
		}
	}

	async function handleChay() {
		if (!selectedItem) return;

		try {
			setLoading(true);
			const { primarySource, checkingSource } = selectedItem;

			if (!primarySource || !checkingSource) {
				console.warn('Thiếu dữ liệu primarySource hoặc checkingSource');
				return;
			}

			const primaryData = await getDataForSource(primarySource);
			const checkingData = await getDataForSource(checkingSource);
			if (!primaryData || !checkingData) {
				console.warn('Không có dữ liệu để so sánh');
				return;
			}

			const primaryColumn = primarySource.cot_du_lieu;
			const checkingColumn = checkingSource.cot_du_lieu;

			const uniqueCheckingValues = [...new Set(checkingData.map(item =>
				item[checkingColumn] ? item[checkingColumn].toString() : ''))];
			setCheckingSourceValues(uniqueCheckingValues);

			const result = markExistence(primaryData, checkingData, primaryColumn, checkingColumn);
			setResult(result);
		} catch (error) {
			console.error('Lỗi khi xử lý dữ liệu:', error);
			message.error('Có lỗi xảy ra khi xử lý dữ liệu');
		} finally {
			setLoading(false);
		}
	}

	function markExistence(primaryData, checkingData, primaryColumn, checkingColumn) {

		const checkingValues = new Set(checkingData.map(item => item[checkingColumn]));
		return primaryData
			.map(item => ({
				...item,
				id: item?.id,
				existsInChecking: checkingValues.has(item[primaryColumn]),
			}))
			.filter(item => !item.existsInChecking); // Only keep items that don't exist in checking source
	}

	const columns = [
		{
			title: 'ID dòng lỗi',
			dataIndex: 'id',
			key: 'id',
			width: 150,
		},
		{
			title: 'Giá trị nguồn cần kiểm soát làm sạch',
			dataIndex: selectedItem?.primarySource?.cot_du_lieu,
			key: 'primaryValue',
		},
		{
			title: 'Tồn tại trong nguồn kiểm tra',
			dataIndex: 'existsInChecking',
			key: 'existsInChecking',
			width: 200,
			render: (value) => value ? '✅' : '❌',
		},
	];

	return (
		<>


			<div className={css.main}>
				{loading && (
					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: '100%',
							position: 'absolute',
							width: '100%',
							zIndex: '1000',
							top: 0,
							left: 0,
							backgroundColor: 'rgba(255, 255, 255, 0.96)',
						}}
					>
						<img src="/loading_moi_2.svg" alt="Loading..." style={{ width: '650px', height: '550px' }} />
					</div>
				)}
				<div className={css.container}>
					<div className={css.body}>
						<div>
							<h3>Tên quy tắc: {name}</h3>
						</div>
						<div>
							<div>Mô tả:</div>
							<div>{desc}</div>
						</div>
						<div className={css.source}>
							<div className={css.sourceLeft}>
								<div>Dữ liệu cần kiểm soát làm sạch:</div>
							</div>
							<div className={css.sourceRight}>
								<div className={css.sourceTop}>
									<div className={css.sourceBoDuLieu}>
										<div>Bộ dữ liệu:</div>
										<div>{boDuLieuPrimary}</div>
									</div>
									<div className={css.sourceCotDuLieu}>
										<div>Cột dữ liệu:</div>
										<div>{cotDuLieuPrimary}</div>
									</div>
								</div>
							</div>
						</div>
						<div className={css.source}>
							<div className={css.sourceLeft}>
								<div>Dữ liệu chuẩn (Master Data):</div>
							</div>
							<div className={css.sourceRight}>
								<div className={css.sourceTop}>
									<div className={css.sourceBoDuLieu}>
										<div>Bộ dữ liệu:</div>
										<div>{boDuLieuChecking}</div>
									</div>
									<div className={css.sourceCotDuLieu}>
										<div>Cột dữ liệu:</div>
										<div>{cotDuLieuChecking}</div>
									</div>
								</div>
							</div>
						</div>
						<Table columns={columns} dataSource={result} rowKey="id"
							   scroll={{ y: '45vh' }}
							   pagination={false}
						/>

					</div>
				</div>
			</div>

		</>
	);
};

export default ValidateElementView;
