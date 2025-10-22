import {getItemFromIndexedDB2} from "../../KeToanQuanTri/storage/storageService.js";

export async function getDataByKey(key, dieu_kien, cot_loc) {
   let data = await getItemFromIndexedDB2(key);

   if (!data || !Array.isArray(data)) {
      return [];
   }

   return data.filter(item => {
      return dieu_kien.every(condition => {
         const { cot_du_lieu, dieu_kien_loc, gia_tri_loc } = condition;
         const value = item[cot_du_lieu];

         if (value === undefined || value === null) return false;

         const numValue = Number(value);
         const numValues = gia_tri_loc.map(Number);

         switch (dieu_kien_loc) {
            case "equal_to":
               return gia_tri_loc.includes(value?.toString());
            case "different":
               return !gia_tri_loc.includes(value?.toString());
            case "greater_than":
               return numValues.every(v => numValue > v);
            case "less_than":
               return numValues.every(v => numValue < v);
            case "between":
               if (numValues.length === 2) {
                  let [min, max] = numValues;
                  return numValue >= min && numValue <= max;
               }
               return false;
            default:
               return true;
         }
      });
   }).map(item => item[cot_loc]);
}

export function filterDataByKey(data, dieu_kien) {

   return data.filter(item => {
      return dieu_kien.every(condition => {
         const { cot_du_lieu, dieu_kien_loc, gia_tri_loc } = condition;
         const value = item[cot_du_lieu];

         if (value === undefined || value === null) return false;

         const numValue = Number(value);
         const numValues = gia_tri_loc.map(Number);

         switch (dieu_kien_loc) {
            case "equal_to":
               return gia_tri_loc.includes(value?.toString());
            case "different":
               return !gia_tri_loc.includes(value?.toString());
            case "greater_than":
               return numValues.every(v => numValue > v);
            case "less_than":
               return numValues.every(v => numValue < v);
            case "between":
               if (numValues.length === 2) {
                  let [min, max] = numValues;
                  return numValue >= min && numValue <= max;
               }
               return false;
            default:
               return true;
         }
      });
   });
}
