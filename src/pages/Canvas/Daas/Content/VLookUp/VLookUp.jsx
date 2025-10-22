import { Button, Divider, Modal, Popconfirm, Select } from 'antd';
import { useEffect, useState } from 'react';
import { getAllFileNotePad } from '../../../../../apis/fileNotePadService.jsx';
import {
	getAllTemplateSheetTable,
	getTemplateColumn,
	getTemplateRow,
	updateBatchTemplateRow,
} from '../../../../../apis/templateSettingService.jsx';

const VLookUp = ({
					 currentFileNote,
					 currentColumns,
					 currentTable,
					 reload,
				 }) => {
	const [loading, setLoading] = useState(true);
	const [isModalVisible, setModalVisible] = useState(false);
	const [selectedTable, setSelectedTable] = useState(null);
	const [selectedCurrentColumn, setSelectedCurrentColumn] = useState(null);
	const [sourceColumnInput, setSourceColumnInput] = useState('');
	const [selectedDataColumn, setSelectedDataColumn] = useState(null);
	const [selectedColumnFileNguon, setSelectedColumnFileNguon] = useState(null);
	const [selectedTargetColumn, setSelectedTargetColumn] = useState(null);
	const [fileNguons, setFileNguons] = useState([]);
	const [columnsFileNguons, setColumnsFileNguons] = useState([]);

	async function fetchData() {
		let allFileNote = await getAllFileNotePad();
		const allTable = await getAllTemplateSheetTable();
		if (allFileNote && allTable) {
			allFileNote = allFileNote.filter(file => file?.table == 'Template').map((file) => {

				const tab = allTable.find((tab) => tab.fileNote_id == file.id);
				if (tab) {
					return { ...file, table: tab };
				}

			});
			setFileNguons(allFileNote);
		}

	}


	function handleCancel() {
		setModalVisible(false);
		setSelectedTable(null);
		setSelectedCurrentColumn(null);
		setSourceColumnInput('');
		setSelectedDataColumn(null);
		setSelectedTargetColumn(null);
	}

	async function handleOpenModal() {
		await fetchData();
		setModalVisible(true);
	}

	const handleSelectedTable = async (value) => {
		const selected = fileNguons.find(file => file.id == value);
		let columns = await getTemplateColumn(selected?.table?.id);

		setSelectedTable(selected);
		setColumnsFileNguons(columns);
		// Reset dependent fields
		setSelectedCurrentColumn(null);
		setSourceColumnInput('');
		setSelectedDataColumn(null);
	};
	const handleSelectedCurrentColumn = (value) => {
		setSelectedCurrentColumn(value);
	};

	async function handleOk() {
		try {
			const originalDataResponse = await getTemplateRow(currentTable?.id);
			const originalData = originalDataResponse.rows || [];
			const sourceDataResponse = await getTemplateRow(selectedTable?.table?.id);
			const sourceData = sourceDataResponse.rows || [];

			// Create a lookup map for faster access
			const lookupMap = {};
			sourceData.forEach(sourceRow => {
				const key = sourceRow.data[selectedColumnFileNguon];
				if (key !== undefined && key !== null) {
					lookupMap[key] = sourceRow.data[selectedDataColumn];
				}
			});

			// Process the lookup and update data
			const updatedData = originalData.map(row => {
				const currentValue = row.data[selectedCurrentColumn];

				if (currentValue !== undefined && currentValue !== null && lookupMap.hasOwnProperty(currentValue)) {
					return {
						...row,
						data: {
							...row.data,
							[selectedTargetColumn]: lookupMap[currentValue],
						},
					};
				}
				return row;
			});

			// Update data and ensure everything is complete before closing
			await updateBatchTemplateRow({ tableId: currentTable?.id, data: updatedData });

			// Add a small delay to ensure the update is complete
			await new Promise(resolve => setTimeout(resolve, 300));

			// Close modal first
			handleCancel();

			// Then reload data
			if (typeof reload === 'function') {
				await reload();
			}

			return updatedData;
		} catch (error) {
			console.error('Error during VLOOKUP:', error);
			throw error;
		}
	}

	return (
		<div style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
			<Button onClick={handleOpenModal}
					style={{
						width: '100%',
						height: '100%',
						border: 0,
						borderRadius: 0,
						backgroundColor: 'transparent',
						justifyContent: 'start',
						paddingLeft: 5,
					}}>
				LookUp dữ liệu
			</Button>
			<Modal
				title="LookUp Dữ Liệu"
				onCancel={handleCancel}
				open={isModalVisible}
				footer={[
					<Button key="cancel" onClick={handleCancel}>
						Hủy
					</Button>,
					<Popconfirm
						title="Xác nhận LookUp"
						description="Bạn có chắc chắn muốn thực hiện LookUp dữ liệu không?"
						onConfirm={handleOk}
						okText="Đồng ý"
						cancelText="Hủy"
					>
						<Button
							key="ok"
							type="primary"
							disabled={!selectedTable || !selectedCurrentColumn || !selectedColumnFileNguon || !selectedDataColumn}
						>
							LookUp dữ liệu
						</Button>
					</Popconfirm>,
				]}
				width={800}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
					{/* Section 1: Select source table */}
					<Select
						style={{ width: '100%' }}
						placeholder="Chọn bảng nguồn"
						value={selectedTable?.id || null} // Change this line
						onChange={handleSelectedTable}
						options={
							fileNguons && fileNguons.length > 0 && fileNguons.map(e => ({
								key: e?.id,
								label: e?.name,
								value: e?.id, // Change this to use id instead of entire object
							}))
						}
					/>

					<Divider />

					{/* Section 2: Compare columns */}
					<div style={{ opacity: selectedTable ? 1 : 0.5, pointerEvents: selectedTable ? 'auto' : 'none' }}>
						<h3>2. Chọn cột so sánh</h3>
						<div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

							<div style={{ flex: 1 }}>
								<label>Cột bảng nguồn</label>
								<Select
									style={{ width: '100%' }}
									placeholder="Chọn cột"
									value={selectedColumnFileNguon}
									onChange={setSelectedColumnFileNguon}
									options={columnsFileNguons && columnsFileNguons.length > 0 && columnsFileNguons.map((value) => ({
										key: value?.id,
										label: value?.columnName,
										value: value?.columnName,
									}))}
								/>
							</div>
							<div style={{ flex: 1 }}>
								<label>Cột bảng hiện tại</label>
								<Select
									style={{ width: '100%' }}
									placeholder="Chọn cột"
									value={selectedCurrentColumn}
									onChange={handleSelectedCurrentColumn}
									options={currentColumns && currentColumns.length > 0 && currentColumns.map((value, index) => ({
										key: index,
										label: value,
										value: value,
									}))}
								/>
							</div>
						</div>
					</div>

					<Divider />

					{/* Section 3: Select data column */}
					<div style={{
						opacity: (selectedTable && selectedCurrentColumn && selectedColumnFileNguon) ? 1 : 0.5,
						pointerEvents: (selectedTable && selectedCurrentColumn && selectedColumnFileNguon) ? 'auto' : 'none',
					}}>
						<h3>3. Chọn cột lấy dữ liệu</h3>
						<div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
							<div style={{ flex: 1 }}>
								<label>Cột lấy dữ liệu từ bảng nguồn</label>
								<Select
									style={{ width: '100%' }}
									placeholder="Chọn cột dữ liệu"
									value={selectedDataColumn}
									onChange={setSelectedDataColumn}
									options={columnsFileNguons && columnsFileNguons.length > 0 && columnsFileNguons.filter(e => e?.columnName !== selectedColumnFileNguon).map((value) => ({
										key: value?.id,
										label: value?.columnName,
										value: value?.columnName,
									}))}
								/>
							</div>
							<div style={{ flex: 1 }}>
								<label>Cột nhập dữ liệu vào bảng hiện tại</label>
								<Select
									style={{ width: '100%' }}
									placeholder="Chọn cột"
									value={selectedTargetColumn}
									onChange={setSelectedTargetColumn}
									options={currentColumns && currentColumns.length > 0 && currentColumns.filter(e => e !== selectedCurrentColumn).map((value, index) => ({
										key: index,
										label: value,
										value: value,
									}))}
								/>
							</div>
						</div>
					</div>
				</div>
			</Modal>
		</div>
	);
};

export default VLookUp;