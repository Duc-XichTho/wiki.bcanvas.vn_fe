import * as XLSX from "xlsx";

const mapFieldToDisplayValue = (data, field, columnDefs, table) => {
  if (!data || !data[field]) return "";

  // Custom handling for AccountingJournal table
  if (table === "AccountingJournal") {
    switch (field) {
      case "accountingJournalContractLists":
        return data[field].map((item) => item.so_hop_dong).join("; ");
      case "accountingJournalInvoiceLists":
        return data[field].map((item) => item.so_hoa_don).join("; ");
      case "accountingJournalClientManagers":
        return data[field].map((item) => item.ten_khach_hang).join("; ");
      case "accountingJournalDivisionLists":
        return data[field].map((item) => item.don_vi).join("; ");
      case "accountingJournalNhanViens":
        return data[field].map((item) => item.ten_day_du).join("; ");
      case "accountingJournalProductLists":
        return data[field].map((item) => item.ten_sp).join("; ");
      case "accountingJournalTeamLists":
        return data[field].map((item) => item.team).join("; ");
      case "supplierList":
        return data[field]?.ten_nha_cung_cap || "";
      case "projectList":
        return data[field]?.project_name || "";
      case "kmfList":
        return data[field]?.khoan_muc_pl || "";
      case "kmnsList":
        return data[field]?.khoan_muc_thu_chi || "";
      case "cashAccount":
        return data[field]?.chu_tai_khoan || "";
      case "vasAccountListNo":
        return data[field]?.ma_tai_khoan || "";
      case "vasAccountListCo":
        return data[field]?.ma_tai_khoan || "";
      case "industryList":
        return data[field]?.nganh || "";
      default:
        return data[field];
    }
  }

  // General handling for other tables
  const colDef = columnDefs.find((col) => col.field === field);
  if (colDef && colDef.valueFormatter) {
    return colDef.valueFormatter({ value: data[field] });
  }

  return data[field];
};

const createStyles = () => {
  return {
    header: {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "808080" } }, // Màu xám đậm
      alignment: { horizontal: "center", vertical: "center" },
    },
    oddRow: {
      fill: { fgColor: { rgb: "FFFFFF" } }, // Màu trắng
    },
    evenRow: {
      fill: { fgColor: { rgb: "D3D3D3" } }, // Màu xám nhạt
    },
  };
};

const getFormattedDate = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  return `${day}-${month}-${year}`;
};

export const exportToXlsx = (gridApi, columnApi, table) => {
  const allColumns = columnApi.getAllGridColumns();
  const allColumnHeaders = allColumns.map(
    (column) => column.getColDef().headerName
  );
  const allColumnIds = allColumns.map((column) => column.getId());
  const styles = createStyles();
  const columnDefs = allColumns.map((column) => column.getColDef());

  const rowData = [];
  gridApi.forEachNodeAfterFilterAndSort((node, rowIndex) => {
    const data = {};
    allColumnIds.forEach((colId) => {
      const colDef = columnApi.getColumn(colId).getColDef();
      const value = mapFieldToDisplayValue(
        node.data,
        colDef.field,
        columnDefs,
        table
      );
      data[colDef.headerName] = value;
    });
    rowData.push(data);
  });

  const worksheet = XLSX.utils.json_to_sheet(rowData, {
    header: allColumnHeaders,
  });
  worksheet["!cols"] = allColumnHeaders.map(() => ({ width: 20 }));

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell_address = { c: C, r: 0 };
    const cell_ref = XLSX.utils.encode_cell(cell_address);
    if (!worksheet[cell_ref]) continue;
    worksheet[cell_ref].s = styles.header;
  }

  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = { c: C, r: R };
      const cell_ref = XLSX.utils.encode_cell(cell_address);
      if (!worksheet[cell_ref]) continue;
      worksheet[cell_ref].s = R % 2 === 0 ? styles.evenRow : styles.oddRow;
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const formattedDate = getFormattedDate();
  XLSX.writeFile(workbook, `${table}-${formattedDate}.xlsx`);
};

export const exportToCsv = (gridApi, columnApi, table) => {
  const allColumns = columnApi.getAllGridColumns();
  const allColumnHeaders = allColumns.map(
    (column) => column.getColDef().headerName
  );
  const allColumnIds = allColumns.map((column) => column.getId());
  const columnDefs = allColumns.map((column) => column.getColDef());

  const rowData = [];
  gridApi.forEachNodeAfterFilterAndSort((node) => {
    const data = {};
    allColumnIds.forEach((colId) => {
      const colDef = columnApi.getColumn(colId).getColDef();
      const value = mapFieldToDisplayValue(
        node.data,
        colDef.field,
        columnDefs,
        table
      );
      data[colDef.headerName] = value;
    });
    rowData.push(data);
  });

  const csvData = XLSX.utils.sheet_to_csv(
    XLSX.utils.json_to_sheet(rowData, { header: allColumnHeaders })
  );
  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  const formattedDate = getFormattedDate();
  link.setAttribute("download", `${table}-${formattedDate}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
