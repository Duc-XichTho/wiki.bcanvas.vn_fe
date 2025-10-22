import { getAllStep } from "../../../../../../apis/stepService.jsx";
import { getAllSubStep } from "../../../../../../apis/subStepService.jsx";
import { getAllInput } from "../../../../../../apis/inputService.jsx";
import { useEffect, useState } from "react";
import css from './ViewAll.module.css'
import { getAllSheet } from "../../../../../../apis/sheetService.jsx";
import { getAllSheetColumnBySheetId } from "../../../../../../apis/sheetColumnService.jsx";

const ViewAll = ({ idTemp }) => {
    const [listStep, setListStep] = useState([]);
    const [listStep2, setListStep2] = useState([]);
    const getAllInputOfTemp = async () => {
        const steps = await getAllStep();
        const subSteps = await getAllSubStep();
        const sheets = await getAllSheet();
        const inputs = await getAllInput();
        let filterStep = steps.filter(step => step.template_id == idTemp);
        let filterStepIds = filterStep.map(step => step.id);
        let filterSubStep = subSteps.filter(subStep =>
            filterStepIds.some(id => subStep.step_id == id)
        );
        let finalFilteredData = inputs.filter(input =>
            filterSubStep.some(sub => sub.id == input.sub_step_id)
        );
        filterStep.sort((a, b) => a.position - b.position);
        filterSubStep.sort((a, b) => a.position - b.position);
        finalFilteredData.sort((a, b) => a.position - b.position);
        filterSubStep.forEach(subStep => {
            subStep.inputs = finalFilteredData.filter(input => input.sub_step_id == subStep.id);
        })
        let filterSheetData = sheets.filter(sheet =>
            filterSubStep.some(subStep => subStep.id == sheet.sub_step_id)
        );
        let filterSheetIds = filterSheetData.map(sheet => sheet.id);
        let combinedSheetColumns = [];
        for (const id of filterSheetIds) {
            const sheetColumns = await getAllSheetColumnBySheetId(id);
            combinedSheetColumns = combinedSheetColumns.concat(sheetColumns);
        }
        filterSheetData.forEach(sheet => {
            sheet.sheetColumns = combinedSheetColumns.filter(sheetColumn => sheet.id == sheetColumn.sheet_id);
        })
        filterSubStep.forEach(subStep => {
            subStep.sheet = filterSheetData.filter(sheet => sheet.sub_step_id == subStep.id);
        })
        filterStep.forEach(step => {
            step.subSteps = filterSubStep.filter(subStep => subStep.step_id == step.id);
        })
        setListStep(filterStep)

        return finalFilteredData;
    };

    useEffect(() => {
        getAllInputOfTemp()
    }, [idTemp])

    return (
        <div className={css.container}>

            <>
                <i>Danh sách các input</i>
                <div className={css.steps}>
                    {listStep.map((step, indexStep) => (
                        <div key={step.id}>
                            {step.name}:
                            <div className={css.steps}>
                                {step.subSteps && step.subSteps.map((subStep, indexSubStep) => (
                                    <div key={subStep.id}>
                                        {subStep.name}:
                                        <div className={css.steps}>
                                            {subStep.inputs && subStep.inputs.map((input, indexInput) => (
                                                <div key={input.id}>
                                                    (I{input.id}): {input.label}, {input.type_input}
                                                </div>
                                            ))}
                                        </div>
                                        <div className={css.steps}>
                                            {subStep.sheet[0] && subStep.sheet[0].sheetColumns && subStep.sheet[0].sheetColumns.map((sheetColumn) => (
                                                <div key={sheetColumn.id}>
                                                    (C{sheetColumn.id}): {sheetColumn.name}, {sheetColumn.type}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </>

        </div>
    );
};


export default ViewAll;
