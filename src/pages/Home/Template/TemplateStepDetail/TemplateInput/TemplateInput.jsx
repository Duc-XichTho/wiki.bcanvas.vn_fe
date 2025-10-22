import React, { useEffect, useState } from "react";
import { createNewInput, deleteInput, getAllInput, updateInput } from "../../../../../apis/inputService.jsx";
import { Button, Checkbox, Form, Input, message, Modal, Select } from "antd";
import css from './TemplateInput.module.css';
import { LIST_DATA } from "../../../../../Consts/SELECT_LIST_DATA.js";
import { useParams } from "react-router-dom";
import { getAllStep } from "../../../../../apis/stepService.jsx";
import { getAllSubStep } from "../../../../../apis/subStepService.jsx";
import ViewAll from "./ViewAll/ViewAll.jsx";
import { BluePlusCircle, EditIconCoLe, ICONDOWN, ICONUP, UnSaveTron, XRedIcon } from "../../../../../icon/IconSVG.js";
import { DANH_MUC_LIST } from "../../../../../Consts/DANH_MUC_LIST.js";
import { value } from "lodash/seq.js";
import CreateDanhMuc from "../../../CreateDanhMuc/CreateDanhMuc.jsx";
import { getAllSheet } from "../../../../../apis/sheetService.jsx";
import { getAllSheetColumnBySheetId } from "../../../../../apis/sheetColumnService.jsx";


const TemplateInput = ({ sub_step_id }) => {
    let { idTemp } = useParams()
    const [listInput, setListInput] = useState([]);
    const [listInputForGet, setListInputForGet] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editedInput, setEditedInput] = useState(null);
    const [isCustomSelect, setIsCustomSelect] = useState('default');
    const [optionsMap, setOptionsMap] = useState({});
    const [optionsMapForVLookUp, setOptionsMapForVLookUp] = useState({});
    const [resolvedNames, setResolvedNames] = useState({});
    const [openSecondModal, setOpenSecondModal] = useState(false);
    const [listForVLookUp, setListForVLookUp] = useState([]);
    const [listInputForVLookUp, setListInputForVLookUp] = useState([]);
    const [listSheetColumn, setlistSheetColumn] = useState([]);
    // State to hold selected columns and operations
    const [selectedColumns, setSelectedColumns] = useState(['', '']);
    const [selectedOperations, setSelectedOperations] = useState(['+']);

    const handleOpenSecondModal = (value) => {
        setOpenSecondModal(value);
    };
    const handleSecondModalClose = () => {
        setOpenSecondModal(false);
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
        finalFilteredData = finalFilteredData.filter(e => e.id != editedInput?.id)
        // if (editedInput?.type_input === 'calc') {
        //     finalFilteredData = finalFilteredData.filter(e => e.type_input === 'number')
        // }
        const sheets = await getAllSheet();
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
        setListInputForGet(finalFilteredData)
        return finalFilteredData;
    };
    const getAllInputForVLookUp = async () => {
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
        finalFilteredData = finalFilteredData.filter(e => e.id != editedInput?.id)
        finalFilteredData = finalFilteredData.filter(e => e?.type_input === 'select' && e.select_type === 'default' && e.list_option)

        // if (editedInput?.type_input === 'calc') {
        //
        // }
        setListInputForVLookUp(finalFilteredData)
        return finalFilteredData;
    };

    const getStepAndSubStepNamesByInputId = (inputId) => {
        return getAllStep().then(steps => {
            return getAllSubStep().then(subSteps => {
                return getAllInput().then(inputs => {
                    const input = inputs.find(input => input.id == inputId);
                    if (!input) {
                        return '';
                    }
                    const relatedSubStep = subSteps.find(sub => sub.id == input.sub_step_id);

                    if (!relatedSubStep) {
                        return '';
                    }
                    const relatedStep = steps.find(step => step.id == relatedSubStep.step_id);

                    if (relatedStep) {
                        return `${relatedStep.name} | ${relatedSubStep.name} | ${input.label}`;
                    }
                    return '';
                });
            });
        });
    };

    const loadResolvedNames = async (inputIds) => {
        const names = {};
        for (const id of inputIds) {
            const name = await getStepAndSubStepNamesByInputId(id);
            names[id] = name;
        }
        setResolvedNames(names);
    };

    useEffect(() => {
        if (listInputForGet.length > 0) {
            const inputIds = listInputForGet.map(e => e.id);
            loadResolvedNames(inputIds);
        }
    }, [listInputForGet]);
    const fetchOptions = async () => {
        try {
            for (const dm of DANH_MUC_LIST) {
                if (!dm.isNotDM) {
                    const functionGet = dm.getAllApi;

                    if (functionGet) {
                        const data = await functionGet();

                        setOptionsMap((pre) =>
                            ({ ...pre, [dm.key]: data.map(e => e.code) })
                        )
                    } else {
                        console.error('API function not found for the specified list option.');
                    }
                }
            }

        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };
    const fetchOptionsForVLookUp = async () => {
        try {
            // Get the API function based on the selected list option
            for (const dm of DANH_MUC_LIST) {
                if (!dm.isNotDM) {
                    const functionGet = dm.getAllApi;

                    // Check if the function exists
                    if (functionGet) {
                        const data = await functionGet(); // Call the API function

                        // Assuming you want to store the keys of each object in the data array
                        setOptionsMapForVLookUp((pre) =>
                            ({ ...pre, [dm.key]: data.map(e => Object.keys(e)) })
                        )
                    } else {
                        console.error('API function not found for the specified list option.');
                    }
                }
            }

        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };


    useEffect(() => {
        getAllInputOfTemp()
        if (editedInput?.type_input === 'vlookup') {
            getAllInputForVLookUp()
        }

    }, [sub_step_id, editedInput?.id]);
    useEffect(() => {

        fetchOptions()
        fetchOptionsForVLookUp()

    }, [editedInput?.id, sub_step_id]);


    const renderSelectData = (listOption) => {
        if (!listOption || !optionsMap[listOption]) return <p>No options available</p>;

        return (
            <>
                {optionsMap[listOption].length > 0 ? (
                    optionsMap[listOption].map((option, index) => (
                        <Select.Option key={index} value={option}>{option}</Select.Option>
                    ))
                ) : (
                    <p>No options available</p>
                )}
            </>
        );
    };


    function loadListInput() {
        getAllInput().then(data => {
            const filteredInputs = data.filter(item => item.sub_step_id == sub_step_id);
            filteredInputs.sort((a, b) => a.position - b.position);
            setListInput(filteredInputs);
        });
    }


    useEffect(() => {
        loadListInput();
    }, [sub_step_id]);

    const handleAddInput = () => {
        const newInput = {
            sub_step_id,
            label: "Label",
            type_input: "text",
            size_input: "4",
            position: listInput.length,
            data_select: "",
            default_value: "",
        };

        createNewInput(newInput).then(() => {
            loadListInput();
            message.success('Thêm mới 1 trường!')
        });

    };

    const handleDeleteInput = (id) => {
        deleteInput(id).then(() => {
            loadListInput();
        });
    };

    const handleMoveUp = (index) => {
        if (index > 0) {
            const updatedList = [...listInput];
            const [movedInput] = updatedList.splice(index, 1);
            updatedList.splice(index - 1, 0, movedInput);
            updatedList.forEach((input, idx) => input.position = idx);

            updatedList.forEach(input => {
                updateInput(input).then(() => loadListInput());
            });
        }
    };

    const handleMoveDown = (index) => {
        if (index < listInput.length - 1) {
            const updatedList = [...listInput];
            const [movedInput] = updatedList.splice(index, 1);
            updatedList.splice(index + 1, 0, movedInput);
            updatedList.forEach((input, idx) => input.position = idx);

            updatedList.forEach(input => {
                updateInput(input).then(() => loadListInput());
            });
        }
    };

    const handleInputChange = (field, value) => {

        const updatedInput = { ...editedInput, [field]: value };
        if (value === 'select' || value === 'vlookup') {
            updatedInput.select_type = 'default'
            updatedInput.default_value = null
            updatedInput.list_option = null
        }
        setEditedInput(updatedInput);

        // updateInput(updatedInput).then(() => {
        //     loadListInput();  // Tải lại danh sách input từ DB
        // });
    };
    const handleSelectValueColumn = (value) => {

        setEditedInput(prev => {
            return {
                ...prev,
                default_value: value
            }
        });
    }
    const handleSelectValueInputForVLookUp = (value) => {
        const selected = listInputForVLookUp.find(e => e.id == value)

        const listForFind = optionsMapForVLookUp[selected?.list_option]?.[0] || []


        setEditedInput(prev => {
            return {
                ...prev,
                default_value: value,
                list_option: selected?.list_option,
                data_for_vlookup: listForFind,
            }
        });
    }

    const handleSelectValueColumnForVLookUp = (value) => {
        setEditedInput(prev => {
            return {
                ...prev,
                column_selected_for_vlookup: value,
            }
        });
    }
    const handleSelectValueColumnForCalc = (value, index) => {
        const updatedColumns = [...selectedColumns];
        updatedColumns[index] = value; // Update the specific column
        setSelectedColumns(updatedColumns);
        updateDefaultValue(updatedColumns, selectedOperations); // Update default_value
    };
    useEffect(() => {
        if (editedInput?.type_input === 'get' || editedInput?.type_input === 'calc' || editedInput?.type_input === 'vlookup' || editedInput?.type_input === 'getTable') {
            handleOpenSecondModal(true)
        } else {
            handleOpenSecondModal(false)
        }
    }, [editedInput]);


    const handleEditInput = (input) => {
        // Đảm bảo rằng data_select là mảng khi mở modal
        const updatedInput = { ...input, data_select: Array.isArray(input.data_select) ? input.data_select : [] };

        setEditedInput(updatedInput);
        if (updatedInput?.type_input === 'select' && updatedInput?.select_type === 'custom') {

        } else if (updatedInput?.type_input === 'select' && (updatedInput?.select_type === 'default' || !updatedInput?.select_type)) {
            setIsCustomSelect('default')
        }

        setOpenDialog(true);
        const listCT = input?.cong_thuc

        let listChan = []
        let listLe = []
        listCT.map((e, index) => {
            if (index >= 0 && index % 2 === 0) {
                listChan.push(e)
            } else if (index > 0 && index % 2 === 1) {
                listLe.push(e)
            }
        })

        setSelectedColumns(listChan || ['', '']);
        setSelectedOperations(listLe || ['+']);
    };


    const handleCustomSelectInputChange = (e, index) => {
        const updatedOptions = [...editedInput.data_select];
        updatedOptions[index] = e.target.value;  // Cập nhật giá trị mới cho option
        setEditedInput({ ...editedInput, data_select: updatedOptions });
    };


    const handleAddOption = () => {
        // Kiểm tra xem editedInput.data_select có phải là mảng không, nếu không thì khởi tạo mảng mới
        if (!Array.isArray(editedInput.data_select)) {
            editedInput.data_select = [];  // Khởi tạo lại nếu không phải mảng
        }

        // Thêm một option mới (giá trị mặc định là rỗng)
        const updatedOptions = [...editedInput.data_select, ''];

        // Cập nhật lại data_select trong state và gọi API để lưu vào cơ sở dữ liệu
        const updatedInput = { ...editedInput, data_select: updatedOptions };
        setEditedInput(updatedInput);

        // Cập nhật dữ liệu vào cơ sở dữ liệu
        // updateInput(updatedInput).then(() => {
        //     loadListInput();  // Tải lại danh sách input sau khi cập nhật
        // });
    };


    const handleRemoveOption = (index) => {
        if (Array.isArray(editedInput.data_select)) {
            // Loại bỏ một option khỏi danh sách
            const updatedOptions = editedInput.data_select.filter((_, idx) => idx !== index);

            // Cập nhật lại data_select trong state và gọi API để lưu vào cơ sở dữ liệu
            const updatedInput = { ...editedInput, data_select: updatedOptions };
            setEditedInput(updatedInput);

            // Cập nhật dữ liệu vào cơ sở dữ liệu
            // updateInput(updatedInput).then(() => {
            //     loadListInput();  // Tải lại danh sách input sau khi cập nhật
            // });
        }
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
        setOpenSecondModal(false);
        setEditedInput(null)
    };

    const handleDialogSave = () => {
        if (isCustomSelect === 'custom') {
            editedInput.data_select = editedInput.data_select;
            editedInput.select_type = 'custom';
        }


        if (editedInput.type_input === 'calc') {
            editedInput.cong_thuc = [];
            editedInput.is_read_only = true;
            for (let i = 0; i < selectedColumns.length; i++) {
                editedInput.cong_thuc.push(selectedColumns[i]);
                if (i < selectedOperations.length) {
                    editedInput.cong_thuc.push(selectedOperations[i]);
                }
            }
        }


        // Cập nhật dữ liệu vào database
        updateInput(editedInput).then(() => {
            loadListInput();
            setOpenDialog(false);
            message.success('Lưu cài đặt thành công!')
        });
    };

    const handleSelectOptionChange = (value) => {
        const updatedInput = { ...editedInput, select_type: value };
        setEditedInput(updatedInput);
        // updateInput(updatedInput).then(() => {
        //     loadListInput();
        // });
    };

    const handleSelectListDataChange = (value) => {
        setEditedInput((prevState) => ({
            ...prevState,
            list_option: value,
        }));

        fetchOptions();
    };
    const handleSelectOperation = (value, index) => {
        const updatedOperations = [...selectedOperations];
        updatedOperations[index] = value; // Update the specific operation
        setSelectedOperations(updatedOperations);
        updateDefaultValue(selectedColumns, updatedOperations); // Update default_value
    };

    const handleAddColumnOperationPair = () => {
        const newColumns = [...selectedColumns, '']; // Add a new column placeholder
        const newOperations = [...selectedOperations, '+']; // Default operation

        setSelectedColumns(newColumns);
        setSelectedOperations(newOperations);
        updateDefaultValue(newColumns, newOperations); // Update default_value
    };

    const handleRemoveGroup = (index) => {
        const updatedColumns = [...selectedColumns];
        const updatedOperations = [...selectedOperations];

        // Remove the selected operation and source
        updatedOperations.splice(index - 1, 1); // Remove the operation at index - 1
        updatedColumns.splice(index, 1); // Remove the column at index

        setSelectedColumns(updatedColumns);
        setSelectedOperations(updatedOperations);
        updateDefaultValue(updatedColumns, updatedOperations); // Update default_value
    };


    const handleCheckboxChange = (e) => {

        setEditedInput(prev => ({
            ...prev,
            is_read_only: e.target.checked
        }));
    };

    const handleCheckboxCompulsoryChange = (e) => {

        setEditedInput(prev => ({
            ...prev,
            is_compulsory: e.target.checked
        }));
    };
    const updateDefaultValue = (columns, operations) => {
        // Construct the default value string
        const defaultValue = columns
            .map((col, idx) =>
                idx < operations.length ? `(I${col}) ${operations[idx]}` : `(I${col})`
            )
            .join(' ');

        // Update the editedInput state with the new default value
        if (editedInput) {
            setEditedInput(prev => ({ ...prev, default_value: defaultValue }));
        }
    };

    const renderInputField = (item) => {
        switch (item.type_input) {
            case "text":
                return (
                    <Input
                        type="text"
                        value={item.default_value || ''}
                        onChange={(e) => handleInputChange('default_value', e.target.value)}
                        placeholder={item.label}
                    />
                );
            case "number":
                return (
                    <Input
                        type="number"
                        value={item.default_value || ''}
                        onChange={(e) => handleInputChange('default_value', e.target.value)}
                        placeholder={item.label}
                        min={item?.min_value} // Set minimum value if defined
                        max={item?.max_value} // Set maximum value if defined
                    />
                );
            case "file":
                return (
                    <Input
                        type="text"
                        placeholder={'Đây là input upload file'}
                        disabled={true}
                    />
                );
            case "date":
                return (
                    <Input
                        type="date"
                        value={item.default_value || ''}
                        onChange={(e) => handleInputChange('default_value', e.target.value)}
                    />
                );
            case "select":
                return (
                    <>
                        <Select
                            value={item.default_value || ''}
                            onChange={(e) => handleInputChange('default_value', e.target.value)}
                            className={css.select_op}
                        >
                            {item?.select_type === 'custom' && <>
                                {item.data_select.map((option, index) => (
                                    <Select.Option value={option} key={index}>{option}</Select.Option>
                                ))}
                            </>}
                            {item.select_type === 'default' && renderSelectData(item?.list_option)}
                        </Select>
                    </>
                );
            case "get":
                return (
                    <Input
                        type="text"
                        readOnly={!!item?.is_read_only}
                        value={'I' + item.default_value || ''}
                        onChange={(e) => handleInputChange('default_value', e.target.value)}
                    />
                );
            case "comment":
                return (
                    <>

                        <i>
                            {item.default_value || ''}
                        </i>
                    </>

                );
            case "vlookup":
                return (
                    <Input
                        type="text"
                        readOnly={!!item?.is_read_only}
                        value={`I${item.default_value} VLOOKUP(${getColumnSelectedName(item.list_option)})`}
                        onChange={(e) => handleInputChange('default_value', e.target.value)}
                    />
                );
            default:
                return (
                    <Input
                        type="text"
                        value={item.default_value || ''}
                        onChange={(e) => handleInputChange('default_value', e.target.value)}
                        placeholder={item.label}
                    />
                );
        }
    };
    const getColumnSelectedName = (value) => {
        return DANH_MUC_LIST.find(e => e.key === value)?.label
    }

    return (
        <div className={css.inputListContainer}>
            <button className={css.btnAdd} onClick={handleAddInput}><img src={BluePlusCircle} alt="" /> Input</button>
            <div className={css.inputList}>
                {listInput.map((input, index) => (
                    <div className={css.inputItem}
                        style={{ width: `calc(${input.size_input * 9}% + ${(input.size_input - 1)}%)` }} key={input.id}>
                        <div className={css.headerInput}>
                            {/* Preview of the input */}
                            {!(input.type_input === 'comment') && (
                                <label>{input.label}{' (I' + input.id + ')'}</label>)}
                            <div className={css.btns}>
                                <button className={css.btnAdd} onClick={() => handleEditInput(input)}><img
                                    src={EditIconCoLe} alt="" /></button>

                                <button className={css.btnAdd} onClick={() => handleMoveUp(index)}
                                    disabled={index === 0}><img src={ICONUP} alt="" /></button>
                                <button className={css.btnAdd} onClick={() => handleMoveDown(index)}
                                    disabled={index === listInput.length - 1}><img src={ICONDOWN} alt="" />
                                </button>
                                <button className={css.btnAdd} onClick={() => handleDeleteInput(input.id)}><img
                                    src={UnSaveTron} alt="" /></button>
                            </div>
                        </div>
                        {renderInputField(input)}
                    </div>
                ))}
            </div>

            <Modal
                title={`Edit Input (I${editedInput?.id})`}
                visible={openDialog}
                onCancel={handleDialogClose}
                onOk={handleDialogSave}
                okText="Save"
                cancelText="Cancel"
                width={openSecondModal ? 1000 : 500}
                style={{ marginTop: '-7vh' }}
            >
                <div className={css.modalContainer}>
                    <div className={css.md1}>
                        <Form layout="vertical">
                            {editedInput?.type_input !== 'comment' &&
                                <Form.Item label="Label">
                                    <Input
                                        value={editedInput?.label || ''}
                                        onChange={(e) => handleInputChange('label', e.target.value)}
                                        placeholder="Enter label"
                                    />
                                </Form.Item>}

                            <Form.Item label="Type">
                                <Select
                                    value={editedInput?.type_input || 'text'}
                                    onChange={(value) => handleInputChange('type_input', value)}
                                >
                                    <Select.Option value="text">Text</Select.Option>
                                    <Select.Option value="ai">Auto</Select.Option>
                                    <Select.Option value="number">Number</Select.Option>
                                    <Select.Option value="thue">Thuế(%)</Select.Option>
                                    <Select.Option value="file">File</Select.Option>
                                    <Select.Option value="date">Date</Select.Option>
                                    <Select.Option value="select">Select</Select.Option>
                                    <Select.Option value="get">Lấy giá trị từ input khác</Select.Option>
                                    <Select.Option value="getTable">Lấy giá trị từ bảng đã tạo</Select.Option>
                                    <Select.Option value="calc">Công thức</Select.Option>
                                    <Select.Option value="vlookup">VLookUp</Select.Option>
                                    <Select.Option value="comment">Chú thích</Select.Option>
                                </Select>
                            </Form.Item>

                            {editedInput?.type_input === 'number' && (
                                <>
                                    <Form.Item label="Giá trị nhỏ nhất (không bắt buộc)">
                                        <Input
                                            type="number"
                                            value={editedInput?.min_value || ''}
                                            onChange={(e) => handleInputChange('min_value', e.target.value)}
                                            placeholder="Enter minimum value"
                                        />
                                    </Form.Item>
                                    <Form.Item label="Giá trị lớn nhất (không bắt buộc)">
                                        <Input
                                            type="number"
                                            value={editedInput?.max_value || ''}
                                            onChange={(e) => handleInputChange('max_value', e.target.value)}
                                            placeholder="Enter maximum value"
                                        />
                                    </Form.Item>
                                </>
                            )}
                            {editedInput?.type_input === 'vlookup' && (
                                <>
                                    <Form.Item label="Chọn nguồn lấy dữ liệu">
                                        <Select
                                            value={`${'(I' + editedInput.default_value + ')'}`}
                                            onChange={handleSelectValueInputForVLookUp}
                                        >
                                            <>
                                                {listInputForVLookUp.map((e) => (
                                                    <Select.Option
                                                        value={e.id}>{'(I' + e.id + ') '}</Select.Option>
                                                ))}
                                            </>
                                        </Select>
                                    </Form.Item>
                                    {editedInput?.data_for_vlookup && <>
                                        <Form.Item
                                            label={`Chọn cột lấy dữ liệu (bảng ${getColumnSelectedName(editedInput.list_option) || ''})`}>
                                            <Select
                                                value={editedInput.column_selected_for_vlookup}
                                                onChange={handleSelectValueColumnForVLookUp}
                                            >
                                                <>
                                                    {editedInput?.data_for_vlookup.map(e => {
                                                        // Find the corresponding list option in DANH_MUC_LIST
                                                        const listOption = DANH_MUC_LIST.find(item => item.key === editedInput.list_option);

                                                        // If found, get the fields and find the header name for e
                                                        const headerName = listOption?.fields.find(field => field.field === e)?.headerName;

                                                        return (
                                                            <Select.Option key={e} value={e}>
                                                                {headerName || e} {/* Display header name or fallback to e */}
                                                            </Select.Option>
                                                        );
                                                    })}
                                                </>
                                            </Select>
                                        </Form.Item>
                                    </>}
                                </>
                            )}
                            {editedInput?.type_input === 'calc' && (
                                <>
                                    <div className={css.calcContainer}>
                                        <Form.Item label="Giá trị đã chọn">
                                            <Input
                                                disabled={true}
                                                value={editedInput.default_value ? editedInput.default_value : ''
                                                    // selectedColumns
                                                    //     .map((col, idx) =>
                                                    //         idx < selectedOperations.length
                                                    //             ? `(I${col}) ${selectedOperations[idx]}`
                                                    //             : `(I${col})`
                                                    //     )
                                                    //     .join(' ')
                                                }
                                            />
                                        </Form.Item>
                                        {/* First group: Nguồn 1, Phép tính 1, Nguồn 2 */}
                                        <div
                                            className={css.calc}
                                        >
                                            <Form.Item label="Chọn nguồn 1">
                                                <Select
                                                    value={selectedColumns[0]}
                                                    onChange={(value) => handleSelectValueColumnForCalc(value, 0)}
                                                    placeholder="Chọn nguồn"
                                                >
                                                    {listInputForGet.map((e) => (
                                                        <Select.Option key={e.id} value={e.id}>
                                                            {'(I' + e.id + ')'}
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>

                                            <Form.Item label="Chọn phép tính 1">
                                                <Select
                                                    value={selectedOperations[0]}
                                                    onChange={(value) => handleSelectOperation(value, 0)}
                                                    placeholder="Chọn phép tính"
                                                >
                                                    <Select.Option value="+">Cộng</Select.Option>
                                                    <Select.Option value="-">Trừ</Select.Option>
                                                    <Select.Option value="*">Nhân</Select.Option>
                                                    <Select.Option value="/">Chia</Select.Option>
                                                </Select>
                                            </Form.Item>

                                            <Form.Item label="Chọn nguồn 2">
                                                <Select
                                                    value={selectedColumns[1]}
                                                    onChange={(value) => handleSelectValueColumnForCalc(value, 1)}
                                                    placeholder="Chọn nguồn"
                                                >
                                                    {listInputForGet.map((e) => (
                                                        <Select.Option key={e.id} value={e.id}>
                                                            {'(I' + e.id + ')'}
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </div>

                                        {/* Subsequent dynamic groups */}
                                        {selectedColumns.slice(2).map((_, index) => (
                                            <div
                                                key={index}
                                                className={css.calc}
                                            >
                                                <Form.Item label={`Chọn phép tính ${index + 2}`}>
                                                    <Select
                                                        value={selectedOperations[index + 1]}
                                                        onChange={(value) => handleSelectOperation(value, index + 1)}
                                                        placeholder="Chọn phép tính"
                                                    >
                                                        <Select.Option value="+">Cộng</Select.Option>
                                                        <Select.Option value="-">Trừ</Select.Option>
                                                        <Select.Option value="*">Nhân</Select.Option>
                                                        <Select.Option value="/">Chia</Select.Option>
                                                    </Select>
                                                </Form.Item>

                                                <Form.Item label={`Chọn nguồn ${index + 3}`}>
                                                    <Select
                                                        value={selectedColumns[index + 2]}
                                                        onChange={(value) => handleSelectValueColumnForCalc(value, index + 2)}
                                                        placeholder="Chọn nguồn"
                                                    >
                                                        {listInputForGet.map((e) => (
                                                            <Select.Option key={e.id} value={e.id}>
                                                                {'(I' + e.id + ')'}
                                                            </Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>

                                                {/* Delete button for this group */}
                                                <Button type="link" danger onClick={() => handleRemoveGroup(index + 2)}>
                                                    <img src={XRedIcon} alt="" />
                                                </Button>
                                            </div>
                                        ))}

                                        {/* Button to add more column-operation pairs */}
                                        <Button type="dashed" onClick={handleAddColumnOperationPair}
                                            style={{ width: '100%' }}>
                                            Thêm nguồn và phép toán
                                        </Button>
                                    </div>

                                </>
                            )}
                            {editedInput?.type_input === 'get' && <>
                                <Form.Item label="Chọn nguồn lấy dữ liệu">
                                    <Select
                                        value={`${'(I' + editedInput.default_value + ') '}` || ''}
                                        onChange={handleSelectValueColumn}
                                    >
                                        <>
                                            {listInputForGet.map((e) => (
                                                <Select.Option
                                                    value={e.id}>{'(I' + e.id + ')'}</Select.Option>
                                            ))}
                                        </>
                                    </Select>
                                </Form.Item>
                            </>}
                            {editedInput?.type_input === 'getTable' && <>
                                <Form.Item label="Chọn nguồn lấy dữ liệu">
                                    <Select
                                        value={`${'(C' + editedInput.default_value + ') '}` || ''}
                                        onChange={handleSelectValueColumn}
                                    >
                                        <>
                                            {listSheetColumn.map((e) => (
                                                <Select.Option
                                                    value={e.id}>{'(C' + e.id + ')'}</Select.Option>
                                            ))}
                                        </>
                                    </Select>
                                </Form.Item>
                            </>}
                            {editedInput?.type_input === 'select' && (
                                <>
                                    <Form.Item label="Chọn kiểu select">
                                        <Select
                                            value={editedInput?.select_type || 'default'}
                                            onChange={handleSelectOptionChange}
                                        >
                                            <Select.Option value="default">Chọn từ dữ liệu có sẵn</Select.Option>
                                            <Select.Option value="custom">Tự nhập</Select.Option>
                                        </Select>
                                    </Form.Item>

                                    {(editedInput?.select_type === 'custom') && (
                                        <div style={{ width: '100%' }}>
                                            {Array.isArray(editedInput?.data_select) && editedInput.data_select.length > 0 ? (
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{
                                                                padding: '10px',
                                                                border: '1px solid #ddd'
                                                            }}>Option
                                                            </th>
                                                            <th style={{
                                                                padding: '10px',
                                                                border: '1px solid #ddd'
                                                            }}>Action
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody style={{
                                                        // display: 'block',
                                                        maxHeight: '250px',
                                                        overflowY: 'auto',
                                                        width: '100%'
                                                    }}>

                                                        {editedInput.data_select.map((option, index) => (
                                                            <tr key={index}>
                                                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                                    <Form.Item style={{ margin: 0 }}>
                                                                        <Input
                                                                            value={option}
                                                                            onChange={(e) => handleCustomSelectInputChange(e, index)}
                                                                            placeholder="Enter option"
                                                                        />
                                                                    </Form.Item>
                                                                </td>
                                                                <td style={{
                                                                    padding: '10px',
                                                                    border: '1px solid #ddd',
                                                                    textAlign: 'center'
                                                                }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveOption(index)}
                                                                        style={{
                                                                            color: 'red',
                                                                            border: 'none',
                                                                            backgroundColor: 'transparent',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        Xóa
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p>No options available</p>
                                            )}
                                            <Button onClick={handleAddOption} style={{ margin: '10px 0' }}>
                                                Thêm option
                                            </Button>
                                        </div>
                                    )}

                                    {(editedInput?.select_type === 'default') && (
                                        <Form.Item label={'Nguồn'}>
                                            <Select

                                                value={editedInput?.list_option || ''}
                                                onChange={handleSelectListDataChange}
                                                className={css.select_op}
                                            >
                                                <>
                                                    {DANH_MUC_LIST.map((item) => {
                                                        if (item.isNotDM) {
                                                            return
                                                        }
                                                        return (<Select.Option key={item.key} value={item.key}>
                                                            {item.label}
                                                        </Select.Option>
                                                        )
                                                    })}
                                                </>


                                            </Select>
                                        </Form.Item>
                                    )}

                                </>
                            )}


                            <Form.Item label="Size">
                                <Select
                                    value={editedInput?.size_input || '5'}
                                    onChange={(value) => handleInputChange('size_input', value)}
                                >
                                    <Select.Option value="1">10%</Select.Option>
                                    <Select.Option value="2">20%</Select.Option>
                                    <Select.Option value="3">30%</Select.Option>
                                    <Select.Option value="4">40%</Select.Option>
                                    <Select.Option value="5">50%</Select.Option>
                                    <Select.Option value="6">60%</Select.Option>
                                    <Select.Option value="7">70%</Select.Option>
                                    <Select.Option value="8">80%</Select.Option>
                                    <Select.Option value="9">90%</Select.Option>
                                    <Select.Option value="10">100%</Select.Option>
                                </Select>
                            </Form.Item>

                            {(editedInput?.type_input !== 'get' && editedInput?.type_input !== 'calc') && <>
                                <Form.Item label="Default Value">
                                    <Input
                                        value={editedInput?.default_value || ''}
                                        onChange={(e) => handleInputChange('default_value', e.target.value)}
                                        placeholder="Enter default value"
                                    />
                                </Form.Item>

                            </>}
                            <div style={{ display: 'flex', justifyContent: 'start', gap: '10px' }}>
                                {editedInput?.type_input === 'get' && <>
                                    <Form.Item label="Chỉ đọc" style={{ display: 'flex', alignItems: 'center' }}>
                                        <Checkbox
                                            checked={editedInput.is_read_only}
                                            onChange={handleCheckboxChange}
                                        />
                                    </Form.Item>
                                </>}
                                <Form.Item label="Bắt buộc" style={{ display: 'flex', alignItems: 'center' }}>
                                    <Checkbox
                                        checked={editedInput?.is_compulsory}
                                        onChange={handleCheckboxCompulsoryChange}
                                    />
                                </Form.Item>

                            </div>
                        </Form>
                    </div>
                    {
                        openSecondModal &&
                        <div className={css.md2}>
                            <ViewAll idTemp={idTemp}
                                type={editedInput?.type_input}
                                editedInput={editedInput}
                            />
                        </div>
                    }
                </div>
            </Modal>
        </div>
    );
};

export default TemplateInput;
