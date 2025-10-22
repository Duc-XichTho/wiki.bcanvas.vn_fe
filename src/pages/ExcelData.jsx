import React from 'react';
import * as XLSX from 'xlsx';
import { sendToN8nParseExcel } from '../apis/n8nWebhook.jsx'; // Adjust the import path as necessary

const ExcelData = () => {
  const handleClick = async () => {
    try {
      // const response = await fetch('https://n8n.sab.io.vn/webhook-test/get-excel');
      // const blob = await response.blob();
      // const arrayBuffer = await blob.arrayBuffer();
      // const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      // const sheetNames = workbook.SheetNames;
      // console.log('Sheet names:', sheetNames);
      // sheetNames.forEach((name, idx) => {
      //   console.log(`Sheet ${idx + 1}:`, name);
      // });
      // const sheetNamesJson = [{ sheets: sheetNames }];
      // console.log('Sheet names as JSON:', JSON.stringify(sheetNamesJson, null, 2));

// Send parsed sheet names to the specified endpoint

      // const sheetNamesJson = [
      //   {
      //     "sheets": ["users", "products", "orders", "order_items", "categories"]
      //   }
      // ]
      const sheetNamesJson =  [
        {
          "sheets": [
            "BCTC_Consol",
            "fin_ratio_list",
            "fin_ratio",
            "BCTC_seperate",
            "company_report",
            "industry_report",
            "macro_report",
            "strategy_report",
            "IR_report",
            "Sector_financial_ratios",
            "VNINDEX",
            "Sector_index",
            "global_index",
            "FullName_company",
            "financial_planning"
          ]
        }
      ]
      // Send parsed sheet names to the specified endpoint
      // Use your backend API instead of direct fetch
      const postResult = await sendToN8nParseExcel(sheetNamesJson);
      console.log('Response from /send-to-n8n-parse-excel:', postResult);
    } catch (error) {
      console.error('Error fetching, parsing, or posting Excel file:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40 }}>
      <h2>Excel Data Fetcher</h2>
      <button onClick={handleClick} style={{ padding: '10px 20px', fontSize: 16 }}>
        Fetch Excel Data
      </button>
    </div>
  );
};

export default ExcelData;