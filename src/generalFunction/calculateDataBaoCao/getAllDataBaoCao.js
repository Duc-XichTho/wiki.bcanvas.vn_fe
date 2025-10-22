import { getItemFromIndexedDB2 } from "../../pages/KeToanQuanTri/storage/storageService.js";
import { calKQKD } from "./calKQKD.js";
import { CANVAS_DATA_PACK } from "../../CONST.js";

export async function getAllVar(listCompany, listYear, loadDataSoKeToan) {
  let result = [];
  listCompany = [...listCompany, { code: "HQ", name: "HQ" }];
  // let allResult = await getItemFromIndexedDB2("allResult");
  let allResult = [];
  if (!allResult || allResult.length === 0) {
    let data = await loadDataSoKeToan();
    allResult = await calKQKD(
      data,
      listCompany.map((e) => e.code)
    );
  }
  let dataPack = CANVAS_DATA_PACK.filter((e) => e.crossCheck);
  for (const pack of dataPack) {
    if (pack.options) {
      for (const opt of pack.options) {
        for (const year of listYear) {
          if (!pack.value.startsWith("KQKD_")) {
            for (const com of listCompany) {
              result.push({
                name: `${opt.label} ${pack.name} ${year} ${com.code}`,
                key: `${opt.value}`,
                value: `${pack.value}_${year}_${com.code}`,
                keyDP: pack.keyDP,
                field: pack.field,
                year,
                company: com,
                code: `${opt.value}_${pack.value}_${year}_${com.code}`,
              });
            }
          } else {
            result.push({
              name: `${opt.label} ${pack.name} ${year}`,
              key: `${opt.value}`,
              value: `${pack.value}_${year}`,
              keyDP: pack.keyDP,
              field: pack.field,
              year,
              code: `${opt.value}_${pack.value}_${year}`,
            });
          }
        }
      }
    }
  }
  for (const item of result) {
    if (allResult[item.value]) {
      let row = allResult[item.value].find((e) => e[item.keyDP] == item.key);
      if (!row)
        console.log(
          item.name,
          allResult[item.value],
          item.keyDP,
          item.key,
          allResult[item.value].find((e) => e[item.keyDP] == item.key)
        );
      else {
        for (let i = 1; i <= 12; i++) {
          item[`t${i}`] = row[item.field(i)];
        }
      }
    }
  }
  return result;
}
