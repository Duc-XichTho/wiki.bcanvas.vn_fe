import React, { useState, useEffect, useRef } from 'react';
import { useParams } from "react-router-dom";
import css from './SheetColumnModal.module.css';
import { message } from "antd";
import {
    createNewSheetColumn,
    updateSheetColumn,
    getAllSheetColumnBySheetId,
    deleteSheetColumn
} from '../../../../../../apis/sheetColumnService';
import { getAllInput } from '../../../../../../apis/inputService';
import { getAllStep } from '../../../../../../apis/stepService';
import { getAllSubStep } from '../../../../../../apis/subStepService';
// ICON
import { IconButton } from '@mui/material';
import { CancelIcon, XRedIcon } from '../../../../../../icon/IconSVG';
import {toast} from "react-toastify";
import PopUpDeleteSheetColum from "../../../../popUpDelete/popUpDeleteSheetColum.jsx";

const SheetColumnModal = ({ sheetId, loadSheetData, onClose, sub_step_id, formStep, DANH_MUC_LIST }) => {
    let { idTemp } = useParams()
    const [columns, setColumns] = useState([]);
    const [selectedColumn, setSelectedColumn] = useState(null);
    const [formulaVariables, setFormulaVariables] = useState([]);
    const [formulaInput, setFormulaInput] = useState('');
    const [listInputForGet, setListInputForGet] = useState([]);
    const [selectedVLookupKey, setSelectedVLookupKey] = useState('');
    const [selectedVLookupField, setSelectedVLookupField] = useState('');
    const [selectedVLookupFields, setSelectedVLookupFields] = useState([]);
    const modalRef = useRef(null);

    const closePopup = () => {
        onClose();
        loadSheetData();
    };

    const getAllInputOfTemp = async () => {
        const steps = await getAllStep();

        let filterStep = steps.filter(step => step.template_id == idTemp);

        const subSteps = await getAllSubStep();

        let filterStepIds = filterStep.map(step => step.id);

        let filterSubStep = subSteps.filter(subStep =>
            filterStepIds.some(id => subStep.step_id == id)
        );
        const data = await getAllInput();
        let finalFilteredData = data.filter(input =>
            filterSubStep.some(sub => sub.id == input.sub_step_id)
        );

        finalFilteredData = finalFilteredData.filter(item =>
            formStep.some(form => form.id == item.sub_step_id)
        );
        setListInputForGet(finalFilteredData);
        return finalFilteredData;
    };

    useEffect(() => {
        getAllInputOfTemp();
    }, [sub_step_id])

    useEffect(() => {
        const fetchColumns = async () => {
            try {
                const existingColumns = await getAllSheetColumnBySheetId(sheetId);
                setColumns(existingColumns);
            } catch (error) {
                console.error('Error fetching columns:', error);
            }
        };
        fetchColumns();
    }, [sheetId]);



    useEffect(() => {
        if (selectedColumn && (selectedColumn.type == 'formula' || selectedColumn.type == 'formula-input') && (selectedColumn.formulaSetting || selectedColumn.formulaInputSetting)) {
            try {
                const setting = selectedColumn.type === 'formula' ? selectedColumn.formulaSetting : selectedColumn.formulaInputSetting;

                setFormulaInput(setting.formula || '');

                let loadedVariables
                if (selectedColumn.type == 'formula') {
                    loadedVariables = setting.variables.map((varObj, index) => {
                        const letter = Object.keys(varObj)[0];
                        const columnName = varObj[letter];

                        const matchedColumn = columns.find(col => col.name === columnName);

                        return {
                            letter: letter,
                            columnId: matchedColumn ? matchedColumn.id : null
                        };
                    });
                } else if (selectedColumn.type == 'formula-input') {
                    loadedVariables = setting.variables.map((varObj, index) => {
                        const letter = Object.keys(varObj)[0];
                        const inputId = varObj[letter];

                        return {
                            letter: letter,
                            columnId: inputId || null
                        };
                    });
                }

                setFormulaVariables(loadedVariables);
            } catch (error) {
                console.error('Error parsing formula settings:', error);
            }
        } else {
            setFormulaInput('');
            setFormulaVariables([]);
        }
    }, [selectedColumn, columns]);

    useEffect(() => {
        if (selectedColumn?.type === 'vlookup' && selectedColumn.vLookupSetting) {
            try {
                const setting = selectedColumn.vLookupSetting;
                setSelectedVLookupKey(setting.key || '');
                setSelectedVLookupField(setting.item || '');
                const selectedDanhMuc = DANH_MUC_LIST.find(item => item.key === setting.key);
                if (selectedDanhMuc) {
                    setSelectedVLookupFields(selectedDanhMuc.fields || []);
                } else {
                    setSelectedVLookupFields([]);
                }
            } catch (error) {
                console.error('Error parsing VLookup settings:', error);
            }
        } else {
            setSelectedVLookupKey('');
            setSelectedVLookupField('');
            setSelectedVLookupFields([]);
        }
    }, [selectedColumn, DANH_MUC_LIST]);

    const handleAddFormulaVariable = () => {
        const nextLetter = String.fromCharCode(
            97 + formulaVariables.length
        );

        const defaultInputId = listInputForGet.length > 0
            ? listInputForGet[0].id
            : null;

        setFormulaVariables([
            ...formulaVariables,
            {
                letter: nextLetter,
                columnId: defaultInputId
            }
        ]);
    };

    const updateFormulaVariable = (index, columnId) => {
        const updatedVariables = [...formulaVariables];
        updatedVariables[index].columnId = columnId;
        setFormulaVariables(updatedVariables);
    };

    const removeFormulaVariable = (indexToRemove) => {
        setFormulaVariables(formulaVariables.filter((_, index) => index !== indexToRemove));
    };

    const handleSaveFormula = async () => {
        if (!selectedColumn) return;

        try {
            const formulaSetting = {
                formula: formulaInput.trim(),
                variables: formulaVariables.map(v => ({
                    [v.letter]: columns.find(col => col.id == v.columnId)?.name || ''
                }))
            };
            await updateSheetColumn({
                id: selectedColumn.id,
                formulaSetting: formulaSetting
            });
            toast.success('Formula saved successfully!', {autoClose : 1000});
        } catch (error) {
            console.error('Error saving formula:', error);
        }
    };

    const handleSaveFormulaInput = async () => {
        if (!selectedColumn) return;

        try {
            const formulaSetting = {
                formula: formulaInput.trim(),
                variables: formulaVariables.map(v => ({
                    [v.letter]: v.columnId
                }))
            };
            await updateSheetColumn({
                id: selectedColumn.id,
                formulaInputSetting: formulaSetting
            });
            toast.success('Formula saved successfully!' ,{autoClose : 1000});
        } catch (error) {
            console.error('Error saving formula:', error);
        }
    };

    const generateUniqueColumnName = () => {
        const existingNames = columns.map(col => col.name);
        let baseName = 'New Column';
        let count = 0;
        let uniqueName = baseName;

        while (existingNames.includes(uniqueName)) {
            count++;
            uniqueName = `${baseName} (${count})`;
        }

        return uniqueName;
    };

    const handleAddColumn = async () => {
        try {
            const columnName = generateUniqueColumnName();
            const columnData = {
                sheet_id: sheetId,
                name: columnName,
                type: 'text',
                columnWidth: 100,
                show: true
            };

            const createdColumn = await createNewSheetColumn(columnData);
            setColumns([...columns, createdColumn]);
            setSelectedColumn(createdColumn);
        } catch (error) {
            console.error('Error creating column:', error);
        }
    };

    const handleColumnNameUpdate = async (newName) => {
        if (!selectedColumn) return;

        try {
            await updateSheetColumn({ id: selectedColumn.id, name: newName });

            setColumns(columns.map(col =>
                col.id === selectedColumn.id
                    ? { ...col, name: newName }
                    : col
            ));

            setSelectedColumn({
                ...selectedColumn,
                name: newName
            });
        } catch (error) {
            console.error('Error updating column name:', error);
        }
    };

    const handleColumnTypeUpdate = async (newType) => {
        if (!selectedColumn) return;

        try {
            await updateSheetColumn({ id: selectedColumn.id, type: newType });
            setColumns(columns.map(col =>
                col.id === selectedColumn.id
                    ? { ...col, type: newType }
                    : col
            ));

            setSelectedColumn({
                ...selectedColumn,
                type: newType
            });
        } catch (error) {
            console.error('Error updating column type:', error);
        }
    };

    const handleDeleteColumn = async (columnId) => {
        try {
            await deleteSheetColumn(columnId);
            const updatedColumns = columns.filter(col => col.id !== columnId);
            setColumns(updatedColumns);
            if (selectedColumn?.id === columnId) {
                setSelectedColumn(null);
                setFormulaInput('');
                setFormulaVariables([]);
            }
            toast.success('Column deleted successfully!', {autoClose : 1000});
        } catch (error) {
            console.error('Error deleting column:', error);
            toast.error('Failed to delete column. Please try again.', {autoClose : 1000});
        }
    };

    const renderFormulaSection = () => {
        if (selectedColumn?.type !== 'formula') return null;
        const availableColumns = columns.filter(
            col => col.id !== selectedColumn?.id
        );
        return (
            <div className={css.formulaSection}>
                <div className={css.formulaInputContainer}>
                    <input
                        type="text"
                        value={formulaInput}
                        onChange={(e) => setFormulaInput(e.target.value)}
                        placeholder="Enter formula (e.g., a + b * c)"
                        className={css.formulaInput}
                    />
                    <button
                        onClick={handleAddFormulaVariable}
                        className={css.addVariableButton}
                    >
                        +
                    </button>
                </div>

                {formulaVariables.map((variable, index) => (
                    <div key={variable.letter} className={css.variableRow}>
                        <span className={css.variableLetter}>{variable.letter} -</span>
                        <select
                            value={variable.columnId || ''}
                            onChange={(e) => updateFormulaVariable(index, e.target.value)}
                            className={css.columnSelect}
                        >
                            {availableColumns.map(col => (
                                <option key={col.id} value={col.id}>
                                    {col.name}
                                </option>
                            ))}
                        </select>
                        <IconButton onClick={() => removeFormulaVariable(index)} size="small">
                            <img src={XRedIcon} alt="" />
                        </IconButton>
                    </div>
                ))}

                <button
                    onClick={handleSaveFormula}
                    className={css.saveFormulaButton}
                >
                    Save Formula
                </button>
            </div>
        );
    };

    const renderFormulaInputSection = () => {
        if (selectedColumn?.type !== 'formula-input') return null;
        return (
            <div className={css.formulaSection}>
                <div className={css.formulaInputContainer}>
                    <input
                        type="text"
                        value={formulaInput}
                        onChange={(e) => setFormulaInput(e.target.value)}
                        placeholder="Enter formula (e.g., a + b * c)"
                        className={css.formulaInput}
                    />
                    <button
                        onClick={handleAddFormulaVariable}
                        className={css.addVariableButton}
                    >
                        +
                    </button>
                </div>

                {formulaVariables.map((variable, index) => (
                    <div key={variable.letter} className={css.variableRow}>
                        <span className={css.variableLetter}>{variable.letter} -</span>
                        <select
                            value={variable.columnId || (listInputForGet.length > 0 ? listInputForGet[0].id : '')}
                            onChange={(e) => updateFormulaVariable(index, e.target.value)}
                            className={css.columnSelect}
                        >
                            {listInputForGet.map(col => (
                                <option key={col.id} value={col.id}>
                                    {col.label}
                                </option>
                            ))}
                        </select>
                        <IconButton onClick={() => removeFormulaVariable(index)} size="small">
                            <img src={XRedIcon} alt="" />
                        </IconButton>
                    </div>
                ))}

                <button
                    onClick={handleSaveFormulaInput}
                    className={css.saveFormulaButton}
                >
                    Save Formula
                </button>
            </div>
        );
    };

    const handleSaveVLookup = async () => {
        if (!selectedColumn || !selectedVLookupKey) return;

        try {
            const vLookupSetting = {
                key: selectedVLookupKey,
                item: selectedVLookupField
            };

            await updateSheetColumn({
                id: selectedColumn.id,
                vLookupSetting: vLookupSetting
            });
            message.success("Lưu cài đặt thành công!");

        } catch (error) {
            console.error('Error saving VLookup setting:', error);
        }
    };

    const RenderVLookUpSection = () => {
        if (selectedColumn?.type !== 'vlookup') return null;

        return (
            <div className={css.formulaSection}>
                <div className={css.formulaInputContainer}>
                    <select
                        value={selectedVLookupKey}
                        onChange={(e) => {
                            const selectedKey = e.target.value;
                            setSelectedVLookupKey(selectedKey);

                            const selectedDanhMuc = DANH_MUC_LIST.find(item => item.key === selectedKey);
                            setSelectedVLookupFields(selectedDanhMuc ? selectedDanhMuc.fields || [] : []);

                            setSelectedVLookupField('');
                        }}
                        className={css.columnSelect}
                    >
                        <option value="">Select a Danh Mục</option>
                        {DANH_MUC_LIST.filter(item => !item.isNotDM).map(item => (
                            <option key={item.key} value={item.key}>
                                {item.label}
                            </option>
                        ))}
                    </select>

                    {selectedVLookupKey && (
                        <select
                            value={selectedVLookupField}
                            onChange={(e) => setSelectedVLookupField(e.target.value)}
                            className={css.columnSelect}
                            disabled={!selectedVLookupKey}
                        >
                            <option value="">Select a Field</option>
                            {selectedVLookupFields.map(field => (
                                <option key={field.field} value={field.field}>
                                    {field.headerName}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <button
                    onClick={handleSaveVLookup}
                    className={css.saveFormulaButton}
                    disabled={!selectedVLookupKey || !selectedVLookupField}
                >
                    Save VLookup
                </button>
            </div>
        );
    };

    return (
        <div className={css.modalOverlay}>
            <div ref={modalRef} className={css.modalContainer}>
                <IconButton className={css.closeButton} onClick={closePopup} size="small">
                    <img src={CancelIcon} alt="" />
                </IconButton>
                <div className={css.sidebar}>
                    <button
                        onClick={handleAddColumn}
                        className={css.createColumnButton}
                    >
                        + Create Column
                    </button>
                    {columns.map((column) => (
                        <div
                            key={column.id}
                            className={`${css.columnItem} ${selectedColumn?.id === column.id ? css.selectedColumn : ''}`}
                        >
                            <span
                                className={css.columnName}
                                onClick={() => {
                                    setSelectedColumn(column);
                                    setFormulaInput('');
                                    setFormulaVariables([]);
                                }}
                            >
                                {column.name}
                            </span>
                            <PopUpDeleteSheetColum id={column.id}
                                                   selectedColumn={selectedColumn}
                                                   handleDelete={handleDeleteColumn}/>
                        </div>
                    ))}
                </div>
                <div className={css.modalContent}>
                    {selectedColumn && (
                        <div className={css.columnEditArea}>
                            <div className={css.columnEdit}>
                                <input
                                    type="text"
                                    value={selectedColumn.name}
                                    onChange={(e) => setSelectedColumn({
                                        ...selectedColumn,
                                        name: e.target.value
                                    })}
                                    onBlur={(e) => handleColumnNameUpdate(e.target.value)}
                                    className={css.columnNameInput}
                                />
                                <select
                                    value={selectedColumn.type}
                                    onChange={(e) => handleColumnTypeUpdate(e.target.value)}
                                    className={css.columnTypeSelect}
                                >
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="formula">Công thức</option>
                                    <option value="formula-input">Công thức từ chain</option>
                                    <option value="vlookup">Chọn từ bảng</option>
                                </select>
                            </div>

                            {renderFormulaSection()}
                            {renderFormulaInputSection()}
                            {RenderVLookUpSection()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SheetColumnModal;