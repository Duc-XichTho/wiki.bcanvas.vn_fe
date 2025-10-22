import {getAllFileNotePad} from "../../apis/fileNotePadService.jsx";
import {CANVAS_DATA_PACK} from "../../CONST.js";
import {Select} from "antd";
import React from "react";

export async function getListComponent(typeData) {
   const filenote =  await getAllFileNotePad();
   if (typeData && typeData === 'KPI') {
       return filenote.filter(e => e?.table === 'KPI');
   }
   if (typeData && typeData === 'ChartTemplate') {
       return filenote.filter(e => e?.table === 'ChartTemplate');
   }
   else if (typeData && typeData !== 'KPI') {
       const listComponent = CANVAS_DATA_PACK.filter(e => typeData && typeData === 'C' ? e.isChart :
           typeData && typeData === 'B' ? !e.isDM && !e.isChart : null
       )
       let result = filenote.filter(e => listComponent.map(com=> com?.value)?.includes(e?.type));
       return result;
   }



}