import {Modal} from "antd";
import React, {useContext, useEffect, useState} from "react";
import File from "../../Daas/Content/File/File.jsx";
import NotePad from "../../Daas/Content/NotePad/NotePad.jsx";
import Data from "../../Daas/Content/Data/Data.jsx";
import Template from "../../Daas/Content/Template/Template.jsx";
import KPI2ContentView from "../../CanvasFolder/KPI2Calculator/KPI2ContentView.jsx";
import {MyContext} from "../../../../MyContext.jsx";
import {useLocation, useParams} from "react-router-dom";
import {getFileNotePadByIdController} from "../../../../apis/fileNotePadService.jsx";
import ChartTemplateElementView
    from "../../Daas/Content/Template/SettingChart/ChartTemplate/ChartTemplateElement/ChartTemplateElementView.jsx";

export default function PreviewDataBot({show, setShow, pack}) {
    const [fileNotePad, setFileNotePad] = useState("");
    const location = useLocation();
    const showFormModal = location.pathname.endsWith('/form');

    const fetchData = async () => {
        try {
            const data = await getFileNotePadByIdController(pack.id);
            setFileNotePad(data);
        } catch (error) {
            console.error("Lỗi khi lấy thông tin:", error);
        }
    };

    useEffect(() => {
        fetchData().then();
    }, [pack]);

    const componentsMap = {
        FileUpLoad: File,
        NotePad: NotePad,
        Data: Data,
        Template: Template,
        KPI: KPI2ContentView,
        ChartTemplate: ChartTemplateElementView
    };

    const ComponentToRender = componentsMap[fileNotePad.table];

    return (
        <>
            <Modal
                open={show}
                onCancel={() => setShow(false)}
                onOk={() => setShow(false)}
                width={'95vw'}
                title={`Preview ${pack.name}`}
                centered={true}
            >
                {ComponentToRender && (
                    <ComponentToRender
                        fileNotePad={fileNotePad}
                        fetchData={fetchData}
                        selectedKpiId={fileNotePad.type}
                        selectedItemID={fileNotePad.type}
                        showFormModal={showFormModal}
                    />
                )}
            </Modal>
        </>
    )
}
