import React, { useState, useEffect } from 'react';

const TableJoinComponent = () => {
	// Các state cần thiết
	const [tables, setTables] = useState([]);
	const [selectedTable1, setSelectedTable1] = useState('');
	const [selectedTable2, setSelectedTable2] = useState('');
	const [joinType, setJoinType] = useState('LEFT JOIN');
	const [table1Data, setTable1Data] = useState([]);
	const [table2Data, setTable2Data] = useState([]);
	const [joinColumns, setJoinColumns] = useState({
		table1Column: '',
		table2Column: ''
	});
	const [resultData, setResultData] = useState([]);
	const [selectedColumns, setSelectedColumns] = useState({
		table1: [],
		table2: []
	});
	const [isPreviewVisible, setIsPreviewVisible] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// Giả lập dữ liệu bảng
	useEffect(() => {
		// Trong thực tế, đây sẽ là API call để lấy danh sách bảng
		setTables([
			{ id: 'table1', name: 'Danh sách khách hàng' },
			{ id: 'table2', name: 'Danh sách đơn hàng' },
			{ id: 'table3', name: 'Danh sách sản phẩm' },
			{ id: 'table4', name: 'Danh sách nhà cung cấp' }
		]);
	}, []);

	// Hàm lấy dữ liệu của bảng được chọn
	const fetchTableData = (tableId) => {
		setLoading(true);

		// Giả lập API call với dữ liệu mẫu
		setTimeout(() => {
			if (tableId === 'table1') {
				setTable1Data([
					{ id: '1', maKH: 'KH001', tenKH: 'Công ty A', diaChi: 'Hà Nội', soDT: '0901234567' },
					{ id: '2', maKH: 'KH002', tenKH: 'Công ty B', diaChi: 'TP.HCM', soDT: '0912345678' },
					{ id: '3', maKH: 'KH003', tenKH: 'Công ty C', diaChi: 'Đà Nẵng', soDT: '0923456789' }
				]);
			} else if (tableId === 'table2') {
				setTable2Data([
					{ id: '1', maDH: 'DH001', maKH: 'KH001', ngayDat: '2023-01-15', tongTien: 5000000 },
					{ id: '2', maDH: 'DH002', maKH: 'KH001', ngayDat: '2023-02-20', tongTien: 7500000 },
					{ id: '3', maDH: 'DH003', maKH: 'KH002', ngayDat: '2023-03-10', tongTien: 3200000 },
					{ id: '4', maDH: 'DH004', maKH: 'KH005', ngayDat: '2023-03-25', tongTien: 1800000 }
				]);
			} else if (tableId === 'table3') {
				setTable2Data([
					{ id: '1', maSP: 'SP001', tenSP: 'Sản phẩm 1', donGia: 100000, tonKho: 50 },
					{ id: '2', maSP: 'SP002', tenSP: 'Sản phẩm 2', donGia: 200000, tonKho: 30 },
					{ id: '3', maSP: 'SP003', tenSP: 'Sản phẩm 3', donGia: 150000, tonKho: 25 }
				]);
			} else if (tableId === 'table4') {
				setTable2Data([
					{ id: '1', maNCC: 'NCC001', tenNCC: 'Nhà cung cấp A', diaChi: 'Hà Nội', soDT: '0801234567' },
					{ id: '2', maNCC: 'NCC002', tenNCC: 'Nhà cung cấp B', diaChi: 'TP.HCM', soDT: '0812345678' }
				]);
			}

			setLoading(false);
		}, 500);
	};

	// Xử lý khi chọn bảng
	const handleTable1Change = (e) => {
		const tableId = e.target.value;
		setSelectedTable1(tableId);
		fetchTableData(tableId);
		setJoinColumns({ ...joinColumns, table1Column: '' });
		setSelectedColumns({ ...selectedColumns, table1: [] });
		setResultData([]);
		setIsPreviewVisible(false);
	};

	const handleTable2Change = (e) => {
		const tableId = e.target.value;
		setSelectedTable2(tableId);
		fetchTableData(tableId);
		setJoinColumns({ ...joinColumns, table2Column: '' });
		setSelectedColumns({ ...selectedColumns, table2: [] });
		setResultData([]);
		setIsPreviewVisible(false);
	};

	// Xử lý khi chọn cột để join
	const handleJoinColumnChange = (table, e) => {
		const column = e.target.value;
		if (table === 'table1') {
			setJoinColumns({ ...joinColumns, table1Column: column });
		} else {
			setJoinColumns({ ...joinColumns, table2Column: column });
		}
		setResultData([]);
		setIsPreviewVisible(false);
	};

	// Xử lý khi chọn các cột để hiển thị
	const handleColumnSelectChange = (table, column, isChecked) => {
		if (isChecked) {
			setSelectedColumns({
				...selectedColumns,
				[table]: [...selectedColumns[table], column]
			});
		} else {
			setSelectedColumns({
				...selectedColumns,
				[table]: selectedColumns[table].filter(col => col !== column)
			});
		}
		setResultData([]);
		setIsPreviewVisible(false);
	};

	// Thực hiện join bảng
	const performJoin = () => {
		if (!selectedTable1 || !selectedTable2) {
			setError('Vui lòng chọn cả hai bảng để ghép');
			return;
		}

		if (!joinColumns.table1Column || !joinColumns.table2Column) {
			setError('Vui lòng chọn cột để ghép từ cả hai bảng');
			return;
		}

		if (selectedColumns.table1.length === 0 && selectedColumns.table2.length === 0) {
			setError('Vui lòng chọn ít nhất một cột để hiển thị');
			return;
		}

		setLoading(true);
		setError('');

		try {
			let result = [];

			// Thực hiện join dựa trên loại join được chọn
			switch (joinType) {
				case 'LEFT JOIN':
					// Tất cả từ bảng 1, kèm theo dữ liệu từ bảng 2 nếu khớp
					result = table1Data.map(t1Row => {
						const matchingRows = table2Data.filter(t2Row =>
							t2Row[joinColumns.table2Column] === t1Row[joinColumns.table1Column]);

						if (matchingRows.length > 0) {
							return matchingRows.map(t2Row => {
								const newRow = {};
								// Thêm các cột được chọn từ bảng 1
								selectedColumns.table1.forEach(col => {
									newRow[`table1_${col}`] = t1Row[col];
								});
								// Thêm các cột được chọn từ bảng 2
								selectedColumns.table2.forEach(col => {
									newRow[`table2_${col}`] = t2Row[col];
								});
								return newRow;
							});
						} else {
							const newRow = {};
							// Thêm các cột được chọn từ bảng 1
							selectedColumns.table1.forEach(col => {
								newRow[`table1_${col}`] = t1Row[col];
							});
							// Thêm các cột null từ bảng 2
							selectedColumns.table2.forEach(col => {
								newRow[`table2_${col}`] = null;
							});
							return [newRow];
						}
					}).flat();
					break;

				case 'RIGHT JOIN':
					// Tất cả từ bảng 2, kèm theo dữ liệu từ bảng 1 nếu khớp
					result = table2Data.map(t2Row => {
						const matchingRows = table1Data.filter(t1Row =>
							t1Row[joinColumns.table1Column] === t2Row[joinColumns.table2Column]);

						if (matchingRows.length > 0) {
							return matchingRows.map(t1Row => {
								const newRow = {};
								// Thêm các cột được chọn từ bảng 1
								selectedColumns.table1.forEach(col => {
									newRow[`table1_${col}`] = t1Row[col];
								});
								// Thêm các cột được chọn từ bảng 2
								selectedColumns.table2.forEach(col => {
									newRow[`table2_${col}`] = t2Row[col];
								});
								return newRow;
							});
						} else {
							const newRow = {};
							// Thêm các cột null từ bảng 1
							selectedColumns.table1.forEach(col => {
								newRow[`table1_${col}`] = null;
							});
							// Thêm các cột được chọn từ bảng 2
							selectedColumns.table2.forEach(col => {
								newRow[`table2_${col}`] = t2Row[col];
							});
							return [newRow];
						}
					}).flat();
					break;

				case 'FULL JOIN':
					// Tất cả từ cả hai bảng, bất kể có khớp hay không
					// LEFT JOIN
					const leftJoin = table1Data.map(t1Row => {
						const matchingRows = table2Data.filter(t2Row =>
							t2Row[joinColumns.table2Column] === t1Row[joinColumns.table1Column]);

						if (matchingRows.length > 0) {
							return matchingRows.map(t2Row => {
								const newRow = {};
								selectedColumns.table1.forEach(col => {
									newRow[`table1_${col}`] = t1Row[col];
								});
								selectedColumns.table2.forEach(col => {
									newRow[`table2_${col}`] = t2Row[col];
								});
								return newRow;
							});
						} else {
							const newRow = {};
							selectedColumns.table1.forEach(col => {
								newRow[`table1_${col}`] = t1Row[col];
							});
							selectedColumns.table2.forEach(col => {
								newRow[`table2_${col}`] = null;
							});
							return [newRow];
						}
					}).flat();

					// RIGHT JOIN (chỉ những bản ghi không có trong LEFT JOIN)
					const leftJoinKeys = leftJoin.map(row => row[`table2_${joinColumns.table2Column}`]).filter(Boolean);

					const rightOnly = table2Data
						.filter(t2Row => !leftJoinKeys.includes(t2Row[joinColumns.table2Column]))
						.map(t2Row => {
							const newRow = {};
							selectedColumns.table1.forEach(col => {
								newRow[`table1_${col}`] = null;
							});
							selectedColumns.table2.forEach(col => {
								newRow[`table2_${col}`] = t2Row[col];
							});
							return newRow;
						});

					result = [...leftJoin, ...rightOnly];
					break;

				case 'UNION':
					// Hợp nhất dữ liệu từ hai bảng (yêu cầu cấu trúc tương tự)
					const table1Union = table1Data.map(t1Row => {
						const newRow = {};
						selectedColumns.table1.forEach(col => {
							newRow[col] = t1Row[col];
						});
						return newRow;
					});

					const table2Union = table2Data.map(t2Row => {
						const newRow = {};
						selectedColumns.table2.forEach((col, index) => {
							if (selectedColumns.table1[index]) {
								newRow[selectedColumns.table1[index]] = t2Row[col];
							}
						});
						return newRow;
					});

					result = [...table1Union, ...table2Union];
					break;

				default:
					result = [];
			}

			setResultData(result);
			setIsPreviewVisible(true);
		} catch (err) {
			setError('Đã xảy ra lỗi khi ghép bảng: ' + err.message);
		} finally {
			setLoading(false);
		}
	};

	// Lấy tất cả các cột từ 1 bảng
	const getColumnsFromTable = (tableData) => {
		if (!tableData || tableData.length === 0) return [];
		return Object.keys(tableData[0]);
	};

	return (
		<div className="flex flex-col w-full max-w-full p-4 mx-auto bg-white rounded shadow">
			<h1 className="text-2xl font-bold text-blue-600 mb-6">Ghép Bảng Dữ Liệu</h1>

			{error && (
				<div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-200 rounded">
					{error}
				</div>
			)}

			<div className="flex flex-col lg:flex-row gap-4 mb-6">
				<div className="w-full lg:w-1/2">
					<div className="p-4 border border-gray-200 rounded">
						<h2 className="text-lg font-semibold mb-3">Bảng 1</h2>

						<div className="mb-4">
							<label className="block mb-2 font-medium text-gray-700">Chọn bảng dữ liệu</label>
							<select
								className="w-full p-2 border border-gray-300 rounded"
								value={selectedTable1}
								onChange={handleTable1Change}
							>
								<option value="">-- Chọn bảng --</option>
								{tables.map(table => (
									<option key={table.id} value={table.id}>
										{table.name}
									</option>
								))}
							</select>
						</div>

						{table1Data.length > 0 && (
							<>
								<div className="mb-4">
									<label className="block mb-2 font-medium text-gray-700">Chọn cột để ghép</label>
									<select
										className="w-full p-2 border border-gray-300 rounded"
										value={joinColumns.table1Column}
										onChange={(e) => handleJoinColumnChange('table1', e)}
									>
										<option value="">-- Chọn cột --</option>
										{getColumnsFromTable(table1Data).map(column => (
											<option key={column} value={column}>
												{column}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block mb-2 font-medium text-gray-700">Chọn các cột hiển thị</label>
									<div className="max-h-40 overflow-y-auto p-2 border border-gray-300 rounded">
										{getColumnsFromTable(table1Data).map(column => (
											<div key={column} className="flex items-center mb-2">
												<input
													type="checkbox"
													id={`table1-${column}`}
													checked={selectedColumns.table1.includes(column)}
													onChange={(e) => handleColumnSelectChange('table1', column, e.target.checked)}
													className="mr-2"
												/>
												<label htmlFor={`table1-${column}`}>{column}</label>
											</div>
										))}
									</div>
								</div>
							</>
						)}
					</div>
				</div>

				<div className="w-full lg:w-1/2">
					<div className="p-4 border border-gray-200 rounded">
						<h2 className="text-lg font-semibold mb-3">Bảng 2</h2>

						<div className="mb-4">
							<label className="block mb-2 font-medium text-gray-700">Chọn bảng dữ liệu</label>
							<select
								className="w-full p-2 border border-gray-300 rounded"
								value={selectedTable2}
								onChange={handleTable2Change}
							>
								<option value="">-- Chọn bảng --</option>
								{tables.map(table => (
									<option key={table.id} value={table.id}>
										{table.name}
									</option>
								))}
							</select>
						</div>

						{table2Data.length > 0 && (
							<>
								<div className="mb-4">
									<label className="block mb-2 font-medium text-gray-700">Chọn cột để ghép</label>
									<select
										className="w-full p-2 border border-gray-300 rounded"
										value={joinColumns.table2Column}
										onChange={(e) => handleJoinColumnChange('table2', e)}
									>
										<option value="">-- Chọn cột --</option>
										{getColumnsFromTable(table2Data).map(column => (
											<option key={column} value={column}>
												{column}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block mb-2 font-medium text-gray-700">Chọn các cột hiển thị</label>
									<div className="max-h-40 overflow-y-auto p-2 border border-gray-300 rounded">
										{getColumnsFromTable(table2Data).map(column => (
											<div key={column} className="flex items-center mb-2">
												<input
													type="checkbox"
													id={`table2-${column}`}
													checked={selectedColumns.table2.includes(column)}
													onChange={(e) => handleColumnSelectChange('table2', column, e.target.checked)}
													className="mr-2"
												/>
												<label htmlFor={`table2-${column}`}>{column}</label>
											</div>
										))}
									</div>
								</div>
							</>
						)}
					</div>
				</div>
			</div>

			<div className="mb-6">
				<label className="block mb-2 font-medium text-gray-700">Chọn kiểu ghép bảng</label>
				<select
					className="w-full p-2 border border-gray-300 rounded"
					value={joinType}
					onChange={(e) => setJoinType(e.target.value)}
				>
					<option value="LEFT JOIN">LEFT JOIN (Lấy tất cả từ Bảng 1)</option>
					<option value="RIGHT JOIN">RIGHT JOIN (Lấy tất cả từ Bảng 2)</option>
					<option value="FULL JOIN">FULL JOIN (Lấy tất cả từ cả hai bảng)</option>
					<option value="UNION">UNION (Hợp nhất dữ liệu)</option>
				</select>
			</div>

			<div className="mb-6">
				<button
					className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center justify-center"
					onClick={performJoin}
					disabled={loading}
				>
					{loading ? (
						<>
							<span className="mr-2">Đang xử lý...</span>
							<div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
						</>
					) : (
						"Thực hiện ghép và xem trước"
					)}
				</button>
			</div>

			{isPreviewVisible && resultData.length > 0 && (
				<div className="border border-gray-200 rounded">
					<h2 className="text-lg font-semibold p-3 bg-gray-50 border-b border-gray-200">
						Kết quả ghép bảng
						<span className="text-sm font-normal ml-2 text-gray-500">
              ({resultData.length} bản ghi)
            </span>
					</h2>

					<div className="overflow-x-auto">
						<table className="min-w-full">
							<thead>
							<tr className="bg-gray-100">
								{/* Header cho các cột từ bảng 1 */}
								{selectedColumns.table1.map(col => (
									<th key={`header-table1-${col}`} className="p-2 border-b border-gray-200 text-left">
										{col} (Bảng 1)
									</th>
								))}

								{/* Header cho các cột từ bảng 2 */}
								{selectedColumns.table2.map(col => (
									<th key={`header-table2-${col}`} className="p-2 border-b border-gray-200 text-left">
										{col} (Bảng 2)
									</th>
								))}
							</tr>
							</thead>
							<tbody>
							{resultData.slice(0, 100).map((row, rowIndex) => (
								<tr key={`row-${rowIndex}`} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
									{/* Dữ liệu từ bảng 1 */}
									{selectedColumns.table1.map(col => (
										<td key={`cell-table1-${col}-${rowIndex}`} className="p-2 border-b border-gray-200">
											{row[`table1_${col}`] !== null ? row[`table1_${col}`] : '-'}
										</td>
									))}

									{/* Dữ liệu từ bảng 2 */}
									{selectedColumns.table2.map(col => (
										<td key={`cell-table2-${col}-${rowIndex}`} className="p-2 border-b border-gray-200">
											{row[`table2_${col}`] !== null ? row[`table2_${col}`] : '-'}
										</td>
									))}
								</tr>
							))}
							</tbody>
						</table>
					</div>

					{resultData.length > 100 && (
						<div className="p-3 text-center text-gray-500">
							Hiển thị 100/{resultData.length} bản ghi
						</div>
					)}
				</div>
			)}

			{isPreviewVisible && resultData.length === 0 && (
				<div className="p-4 text-center text-gray-500 border border-gray-200 rounded">
					Không có dữ liệu phù hợp với điều kiện ghép bảng
				</div>
			)}
		</div>
	);
};

export default TableJoinComponent;
