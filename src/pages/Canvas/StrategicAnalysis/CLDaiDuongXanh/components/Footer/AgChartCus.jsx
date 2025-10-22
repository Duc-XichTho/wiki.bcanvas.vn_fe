import React, { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const AgChartCus = () => {
	const [rowData] = useState([
		{ company: "Công ty 1", factor1: 3, factor2: 3, factor3: 5, factor4: 4, factor5: 3, factor6: 5, factor7: 3 },
		{ company: "Công ty 2", factor1: 4, factor2: 4, factor3: 3, factor4: 2, factor5: 2, factor6: 1, factor7: 4 },
		{ company: "Công ty 3", factor1: 3, factor2: 2, factor3: 4, factor4: 2, factor5: 1, factor6: 3, factor7: 3 },
		{ company: "Công ty 4", factor1: 5, factor2: 1, factor3: 2, factor4: 4, factor5: 4, factor6: 2, factor7: 2 },
		{ company: "Công ty 5", factor1: 1, factor2: 4, factor3: 3, factor4: 1, factor5: 5, factor6: 2, factor7: 1 },
	]);

	const [columnDefs] = useState([
		{ headerName: "Company", field: "company" },
		{ headerName: "Yếu tố cạnh tranh 1", field: "factor1" },
		{ headerName: "Yếu tố cạnh tranh 2", field: "factor2" },
		{ headerName: "Yếu tố cạnh tranh 3", field: "factor3" },
		{ headerName: "Yếu tố cạnh tranh 4", field: "factor4" },
		{ headerName: "Yếu tố cạnh tranh 5", field: "factor5" },
		{ headerName: "Yếu tố cạnh tranh 6", field: "factor6" },
		{ headerName: "Yếu tố cạnh tranh 7", field: "factor7" },
	]);

	return (
		<div className="ag-theme-alpine" style={{ height: 400, width: "100%" }}>
			<AgGridReact rowData={rowData} columnDefs={columnDefs} />
		</div>
	);
};

export default AgChartCus;
