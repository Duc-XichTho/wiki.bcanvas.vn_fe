// Test file để kiểm tra hàm processAggregate với multiple group by
import _ from 'lodash';

// Hàm xử lý Aggregate (copy từ PipelineSteps.jsx)
const processAggregate = (data, config) => {
	// Kiểm tra groupBy có thể là string hoặc array
	const groupByIsValid = config.groupBy && (
		(Array.isArray(config.groupBy) && config.groupBy.length > 0) ||
		(typeof config.groupBy === 'string' && config.groupBy !== '')
	);
	
	if (!groupByIsValid || !config.aggregations || config.aggregations.length === 0) {
		return data;
	}

	try {
		// Hàm tạo key cho nhóm dữ liệu (hỗ trợ nhiều cột)
		const createGroupKey = (row) => {
			if (Array.isArray(config.groupBy)) {
				return config.groupBy.map(col => row[col]).join('|');
			}
			return row[config.groupBy];
		};

		// Nhóm dữ liệu theo nhiều cột
		const groupedData = _.groupBy(data, createGroupKey);

		// Xử lý từng nhóm
		const aggregatedData = Object.keys(groupedData).map(groupKey => {
			const groupRows = groupedData[groupKey];
			
			// Tạo object chứa các cột nhóm
			const aggregatedRow = {};
			if (Array.isArray(config.groupBy)) {
				// Nếu nhóm theo nhiều cột, tách key và gán vào từng cột
				const groupValues = groupKey.split('|');
				config.groupBy.forEach((col, index) => {
					aggregatedRow[col] = groupValues[index] || '';
				});
			} else if (typeof config.groupBy === 'string') {
				// Nếu nhóm theo một cột
				aggregatedRow[config.groupBy] = groupKey;
			}

			// Xử lý từng aggregation
			config.aggregations.forEach(agg => {
				if (!agg.column || !agg.function) {
					return;
				}

				const columnName = agg.alias || `${agg.function}_${agg.column}`;
				let result;

				switch (agg.function) {
					case 'sum':
						result = _.sumBy(groupRows, row => {
							const value = parseFloat(row[agg.column]);
							return isNaN(value) ? 0 : value;
						});
						break;
					case 'count':
						result = groupRows.length;
						break;
					case 'avg':
						const sum = _.sumBy(groupRows, row => {
							const value = parseFloat(row[agg.column]);
							return isNaN(value) ? 0 : value;
						});
						result = groupRows.length > 0 ? sum / groupRows.length : 0;
						break;
					case 'min':
						result = _.minBy(groupRows, row => {
							const value = parseFloat(row[agg.column]);
							return isNaN(value) ? Infinity : value;
						});
						result = result ? parseFloat(result[agg.column]) : null;
						break;
					case 'max':
						result = _.maxBy(groupRows, row => {
							const value = parseFloat(row[agg.column]);
							return isNaN(value) ? -Infinity : value;
						});
						result = result ? parseFloat(result[agg.column]) : null;
						break;
					case 'std':
						const values = groupRows.map(row => {
							const value = parseFloat(row[agg.column]);
							return isNaN(value) ? 0 : value;
						});
						if (values.length > 1) {
							const mean = _.mean(values);
							const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
							result = Math.sqrt(_.sum(squaredDiffs) / (values.length - 1));
						} else {
							result = 0;
						}
						break;
					case 'distinct_count':
						const distinctValues = _.uniq(groupRows.map(row => row[agg.column]));
						result = distinctValues.length;
						break;
					default:
						result = null;
				}

				aggregatedRow[columnName] = result;
			});

			return aggregatedRow;
		});

		return aggregatedData;
	} catch (error) {
		console.error('Lỗi khi xử lý Aggregate:', error);
		return data;
	}
};

// Dữ liệu test với nhiều cột
const testData = [
	{ region: 'North', category: 'A', product: 'P1', sales: 100, price: 10, year: 2023 },
	{ region: 'North', category: 'A', product: 'P2', sales: 150, price: 15, year: 2023 },
	{ region: 'North', category: 'B', product: 'P3', sales: 200, price: 20, year: 2023 },
	{ region: 'South', category: 'A', product: 'P4', sales: 80, price: 8, year: 2023 },
	{ region: 'South', category: 'B', product: 'P5', sales: 120, price: 12, year: 2023 },
	{ region: 'North', category: 'A', product: 'P1', sales: 90, price: 11, year: 2024 },
	{ region: 'North', category: 'B', product: 'P3', sales: 180, price: 22, year: 2024 },
	{ region: 'South', category: 'A', product: 'P4', sales: 95, price: 9, year: 2024 },
];

// Test 1: Nhóm theo một cột
console.log('=== TEST 1: Single Column Group By ===');
const testConfig1 = {
	groupBy: 'region',
	aggregations: [
		{ column: 'sales', function: 'sum', alias: 'total_sales' },
		{ column: 'sales', function: 'avg', alias: 'avg_sales' },
		{ column: 'product', function: 'count', alias: 'product_count' },
	]
};

console.log('Config 1:', testConfig1);
const result1 = processAggregate(testData, testConfig1);
console.log('Result 1:', result1);

// Test 2: Nhóm theo nhiều cột
console.log('\n=== TEST 2: Multiple Columns Group By ===');
const testConfig2 = {
	groupBy: ['region', 'category'],
	aggregations: [
		{ column: 'sales', function: 'sum', alias: 'total_sales' },
		{ column: 'price', function: 'max', alias: 'max_price' },
		{ column: 'product', function: 'distinct_count', alias: 'unique_products' },
	]
};

console.log('Config 2:', testConfig2);
const result2 = processAggregate(testData, testConfig2);
console.log('Result 2:', result2);

// Test 3: Nhóm theo 3 cột
console.log('\n=== TEST 3: Three Columns Group By ===');
const testConfig3 = {
	groupBy: ['region', 'category', 'year'],
	aggregations: [
		{ column: 'sales', function: 'sum', alias: 'total_sales' },
		{ column: 'price', function: 'avg', alias: 'avg_price' },
		{ column: 'product', function: 'count', alias: 'product_count' },
	]
};

console.log('Config 3:', testConfig3);
const result3 = processAggregate(testData, testConfig3);
console.log('Result 3:', result3);

// Test 4: Xử lý lỗi - groupBy rỗng
console.log('\n=== TEST 4: Empty Group By ===');
const testConfig4 = {
	groupBy: [],
	aggregations: [
		{ column: 'sales', function: 'sum', alias: 'total_sales' },
	]
};

console.log('Config 4:', testConfig4);
const result4 = processAggregate(testData, testConfig4);
console.log('Result 4 (should return original data):', result4);

// Test 5: Xử lý lỗi - groupBy null
console.log('\n=== TEST 5: Null Group By ===');
const testConfig5 = {
	groupBy: null,
	aggregations: [
		{ column: 'sales', function: 'sum', alias: 'total_sales' },
	]
};

console.log('Config 5:', testConfig5);
const result5 = processAggregate(testData, testConfig5);
console.log('Result 5 (should return original data):', result5);

export { processAggregate }; 