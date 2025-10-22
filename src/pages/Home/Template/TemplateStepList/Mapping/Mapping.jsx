import React, { useEffect, useState } from "react";
import css from './Mapping.module.css'
import { useNavigate } from "react-router-dom";
import { Form, Input, message, Modal, Select } from "antd";
import ViewAll from "../ViewAll/ViewAll.jsx";
import { createNewMappingCard, getAllMappingCard, updateMappingCard } from "../../../../../apis/mappingCardService.jsx";
import { getAllStep } from "../../../../../apis/stepService.jsx";
import { getAllSubStep } from "../../../../../apis/subStepService.jsx";
import { getAllInput } from "../../../../../apis/inputService.jsx";
import { getAllSheet } from "../../../../../apis/sheetService.jsx";
import { getAllSheetColumnBySheetId } from "../../../../../apis/sheetColumnService.jsx";
import {getAllStepMau} from "../../../../../generalFunction/logicMau/logicMau.js";

const Mapping = ({ idTemp, openDialog, setOpenDialog }) => {
    const navigate = useNavigate();
    const [mappings, setMappings] = useState([
        {
            field: 'so_tien',
            headerName: 'A',
            input_id: 0,
            sheet_column_id: 0,
            template_id: +idTemp,
        },
        {
            field: 'mo_ta',
            headerName: 'B',
            input_id: 0,
            sheet_column_id: 0,
            template_id: +idTemp,
        },
        {
            field: 'hoa_don',
            headerName: 'C',
            input_id: 0,
            sheet_column_id: 0,
            template_id: +idTemp,
        },
    ]);

    const [listSubStep, setListSubStep] = useState([]);
    const [listInput, setListInput] = useState([]);
    const [listSheetColumn, setlistSheetColumn] = useState([]);

    const getAllInputOfTemp = async () => {
        let steps = await getAllStep();
        const subSteps = await getAllSubStep();
        const inputs = await getAllInput();
        const stepsMau = await getAllStepMau();
        steps = steps.filter(step => {
            return step.template_id == idTemp
        });
        let filterStep = [];
        steps.forEach(step => {
            let mau = stepsMau.find(item=> item.type == 'M|'+step.type);
            if (mau) {
                filterStep.push(mau)
            } else {
                filterStep.push(step)
            }
        })
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
        setListSubStep(filterSubStep)
        setListInput(finalFilteredData)
        return finalFilteredData;
    };

    const getAllSheetColumnOfTemp = async () => {
        let steps = await getAllStep();
        const subSteps = await getAllSubStep();
        const sheets = await getAllSheet();
        const stepsMau = await getAllStepMau();
        steps = steps.filter(step => {
            return step.template_id == idTemp
        });
        let filterStep = [];
        steps.forEach(step => {
            let mau = stepsMau.find(item=> item.type == 'M|'+step.type);
            if (mau) {
                filterStep.push(mau)
            } else {
                filterStep.push(step)
            }
        })
        let filterStepIds = filterStep.map(step => step.id);
        let listSubStep = subSteps.filter(subStep =>
            subStep.subStepType === 'Bảng' &&
            filterStepIds.some(id => subStep.step_id == id)
        );
        let filterSheetData = sheets.filter(sheet =>
            listSubStep.some(subStep => subStep.id == sheet.sub_step_id && sheet.card_id == null)
        );
        let filterSheetIds = filterSheetData.map(sheet => sheet.id);
        let combinedSheetColumns = [];
        for (const id of filterSheetIds) {
            const sheetColumns = await getAllSheetColumnBySheetId(id);
            combinedSheetColumns = combinedSheetColumns.concat(sheetColumns);
        }
        combinedSheetColumns = combinedSheetColumns.sort((a, b) => a.position - b.position);
        setlistSheetColumn(combinedSheetColumns)
    };

    async function getData() {
        let data = await getAllMappingCard()
        const filteredMappings = data.filter(e => e.template_id == idTemp);
        const updatedMappings = mappings.map(mapping => {
            const existingMapping = filteredMappings.find(
                (apiMapping) => apiMapping.field === mapping.field
            );
            return existingMapping
                ? {
                    ...mapping,
                    input_id: existingMapping.input_id,
                    sheet_column_id: existingMapping.sheet_column_id,
                }
                : mapping;
        });
        setMappings(updatedMappings);
    }

    useEffect(() => {
        getData()
        getAllInputOfTemp()
        getAllSheetColumnOfTemp()
    }, [idTemp, openDialog]);

    const handleDialogClose = () => {
        setOpenDialog(false);
    };

    const handleDialogSave = async () => {
        const data = await getAllMappingCard();
        const filteredMappings = data.filter(e => e.template_id == idTemp);

        await Promise.all(mappings.map(async (mapping) => {
            const existingMapping = filteredMappings.find(
                (apiMapping) => apiMapping.field == mapping.field && apiMapping.template_id == idTemp
            );

            if (existingMapping) {
                await updateMappingCard({ ...mapping, id: existingMapping.id });
                return {
                    ...mapping,
                    input_id: mapping.input_id,
                    sheet_column_id: mapping.sheet_column_id,
                };
            } else {
                await createNewMappingCard(mapping);
                return {
                    ...mapping,
                    input_id: mapping.input_id || 0,
                    sheet_column_id: mapping.sheet_column_id || 0,
                    template_id: idTemp,
                };
            }
        }));

        await getData();
        message.success('Đã lưu cài đặt!')
        setOpenDialog(false);
    };

    const handleInputChange = (field, value, index) => {
        const updatedMappings = [...mappings];
        if (field === 'input_id') {
            updatedMappings[index] = {
                ...updatedMappings[index],
                [field]: value,
                sheet_column_id: 0,
            };
        }
        else if (field === 'sheet_column_id') {
            updatedMappings[index] = {
                ...updatedMappings[index],
                [field]: value,
                input_id: 0,
            };
        } else {
            updatedMappings[index] = {
                ...updatedMappings[index],
                [field]: value,
            };
        }

        setMappings(updatedMappings);
    };

    useEffect(() => {
    }, [idTemp])
    return (
        <>
            <Modal
                title={`Mapping`}
                visible={openDialog}
                onCancel={handleDialogClose}
                onOk={handleDialogSave}
                okText="Save"
                cancelText="Cancel"
                style={{ marginTop: '-7vh' }}
                width={1000}
            >
                <div className={css.modalContainer}>
                    <div className={css.md1}>
                        <img src="/mapping.png" alt="" style={{width : '100%' , height : '100px'}}/>
                        <Form layout="vertical">
                            {mappings.map((mapping, index) => (
                                <div key={index} className={css.mappingRow}>
                                    <h3>{mapping.headerName}</h3>
                                    <Form.Item label={`Input: (I${mapping.input_id})`}>
                                        <Select
                                            value={mapping.input_id}
                                            onChange={(value) => handleInputChange('input_id', value, index)}
                                        >
                                            {listInput.map((input, index) => (
                                                <Select.Option value={input.id} key={index}>I{input.id}: {input.label}</Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item label={`Sheet Column:  (C${mapping.sheet_column_id})`}>
                                        <Select
                                            value={mapping.sheet_column_id}
                                            onChange={(value) => handleInputChange('sheet_column_id', value, index)}
                                        >
                                            {listSheetColumn.map((input, index) => (
                                                <Select.Option value={input.id} key={index}>(C{input.id}): {input.name}</Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </div>
                            ))}
                        </Form>
                    </div>
                    <div className={css.md2}>
                        <ViewAll idTemp={idTemp} />
                    </div>
                </div>
            </Modal>

        </>
    );
};

export default Mapping;
