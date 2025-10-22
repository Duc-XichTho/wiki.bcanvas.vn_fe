import React, { useContext, useEffect, useState } from "react";
import css from "./Content.module.css";
import { MyContext } from "../../../../MyContext.jsx";
import { useParams, useLocation } from "react-router-dom";
import { getFileNotePadByIdController } from "../../../../apis/fileNotePadService.jsx";
// COMPONENT
import NotePad from "./NotePad/NotePad.jsx";
import Tiptap from "./Tiptap/TipTap.jsx";
import File from "./File/File.jsx";
import Data from "./Data/Data.jsx";
import Template from "./Template/Template.jsx";
import ResultKPITableChart from "../../CanvasFolder/KPI2Calculator/ResultKPITableChart.jsx";
import KPI2ContentView from "../../CanvasFolder/KPI2Calculator/KPI2ContentView.jsx";
import ChartTemplateElementView
  from "./Template/SettingChart/ChartTemplate/ChartTemplateElement/ChartTemplateElementView.jsx";
import TipTapWithChart from './TiptapWithChart/TipTapWithChart.jsx';

const Content = () => {
  

  const { selectedTapCanvas, setSelectedTapCanvas } = useContext(MyContext);
  const { id } = useParams();
  const [fileNotePad, setFileNotePad] = useState("");
  const location = useLocation();
  const showFormModal = location.pathname.endsWith('/form');

  const fetchData = async () => {
    try {
      const data = await getFileNotePadByIdController(id);
      setFileNotePad(data);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  console.log(fileNotePad);
  const componentsMap = {
    FileUpLoad: File,
    TiptapWithChart: TipTapWithChart,
    NotePad: NotePad,
    Tiptap: Tiptap,
    Data: Data,
    Template: Template,
    KPI: KPI2ContentView,
    ChartTemplate: ChartTemplateElementView
  };

  const ComponentToRender = componentsMap[fileNotePad?.table];

  return (
    <div className={css.container}>
      {/* {selectedTapCanvas === "daas" && ComponentToRender && (
                <ComponentToRender fileNotePad={fileNotePad} fetchData={fetchData} />
            )} */}
      {ComponentToRender && (
        <ComponentToRender
          fileNotePad={fileNotePad}
          fetchData={fetchData}
          selectedKpiId={fileNotePad.type}
          selectedItemID={fileNotePad.type}
          showFormModal={showFormModal}
        />
      )}
    </div>
  );
};

export default Content;
