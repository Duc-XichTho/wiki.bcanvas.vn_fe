import React, {useContext, useEffect, useState} from "react";
import {Button, Input, Modal, Select} from "antd";
import css from './SubStepInput.module.css';
import {createNewCardInput, getAllCardInput, updateCardInput} from "../../../../../apis/cardInputService.jsx";
import {MyContext} from "../../../../../MyContext.jsx";
import {SaveTron} from "../../../../../icon/IconSVG.js";
import {getDataByNameTable} from "../../../../../generalFunction/getData.js";
import PopUpUploadFile from "../../../../../components/UploadFile/PopUpUploadFile.jsx";
import {DANH_MUC_LIST} from "../../../../../Consts/DANH_MUC_LIST.js";
import {updateCardField, updateInputFromColumn} from "../logic/updateCardField.js";
import {getValueFromAnotherInput, getValueFromCalc, getValueFromVLookUp} from "../logic/getValue.js";
import {useLocation, useParams} from "react-router-dom";
import {getAllHoaDon} from "../../../../../apis/hoaDonService.jsx";
import {
    getAllInputMau,
    getFieldHoaDonByCardId,
    getSubStepDKIdInCardByType
} from "../../../../../generalFunction/logicMau/logicMau.js";
import {getAllStep} from "../../../../../apis/stepService.jsx";
import {SE} from "../../../../../Consts/LIST_STEP_TYPE.js";
import {getAllCard, updateCard} from "../../../../../apis/cardService.jsx";
import {getDinhKhoanProDataByStepId} from "../../../../../apis/dinhKhoanProService.jsx";
import {createNewDinhKhoanProData} from "../../../../../apis/dinhKhoanProDataService.jsx";
import {TYPE_FORM} from "../../../../../Consts/SECTION_TYPE.js";
import {findRecordsByConditions} from "../../../../../apis/searchModelService.jsx";
import {CARD_INPUT, INPUT} from "../../../../../Consts/MODEL_CALL_API.js";

const FormattedNumberInput = ({value, onChange, placeholder, min, max, readOnly}) => {
    // Convert value to number and format with commas for display
    const formatDisplayValue = (val) => {
        if (val === '' || val === null || val === undefined) return '';
        return Number(val).toLocaleString('en-US');
    };

    const handleChange = (e) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (rawValue === '' || (!isNaN(rawValue) && Number(rawValue) >= (min || -Infinity) && Number(rawValue) <= (max || Infinity))) {
            onChange(rawValue);
        }
    };

    return (
        <Input
            type="text"
            value={formatDisplayValue(value)}
            onChange={handleChange}
            placeholder={placeholder}
            readOnly={readOnly}
        />
    );
};

const SubStepInput = ({sub_step_id, idCard, permissionsSubStep}) => {
    const UPDATE_PERMISSION = permissionsSubStep?.update;
    const {id, idStep} = useParams();
    const [listInput, setListInput] = useState([]);
    const [hoaDons, setHoaDons] = useState([]);
    const [optionsMap, setOptionsMap] = useState({});
    const [pendingChanges, setPendingChanges] = useState([]);
    const {loadData, setLoadData} = useContext(MyContext);
    const [isEditing, setIsEditing] = useState(false);
    const location = useLocation();
    const [step, setStep] = useState([]);
    const [card, setCard] = useState([]);

    const fetchInputs = async () => {
        const data = await findRecordsByConditions(INPUT, {sub_step_id: sub_step_id})
        setListInput(data);
        return data
    };

    const fetchCardInputs = async () => {
        const data = await findRecordsByConditions(CARD_INPUT, {card_id: idCard})
        return data
    };

    function fetchHoaDon() {
        getAllHoaDon().then(data => {
            setHoaDons(data)
        })
    }

    function fetchStep() {
        getAllStep().then(data => {
            setStep(data.find(item => item.id == idStep));
        })
    }

    function fetchCard() {
        getAllCard().then(data => {
            setCard(data.find(item => item.id == idCard))
        })
    }


    useEffect(() => {
        setIsEditing(false)
    }, [idStep]);

    useEffect(() => {
        fetchHoaDon();
        fetchStep();
        fetchCard();
    }, [idCard, idStep, sub_step_id, loadData]);


    const fetchOptions = async () => {
        try {
            for (const dm of DANH_MUC_LIST) {
                if (!dm.isNotDM) {
                    const functionGet = dm.getAllApi;
                    if (functionGet) {
                        const data = await functionGet();
                        setOptionsMap((pre) =>
                            ({
                                ...pre, [dm.key]: data.map(e => {
                                    return {code: e.code, label: e.name}
                                })
                            })
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
        fetchOptions()
    }, [sub_step_id, loadData]);

    useEffect(() => {
        loadListInput();
    }, [sub_step_id, loadData, hoaDons, step]);

    const renderSelectData = (listOption) => {
        if (!listOption || !optionsMap[listOption]) return <p>No options available</p>;
        return (
            <>
                {optionsMap[listOption].length > 0 ? (
                    optionsMap[listOption].map((option, index) => (
                        <Select.Option key={index} value={option.code}>{option.code}|{option.label}</Select.Option>
                    ))
                ) : (
                    <p>No options available</p>
                )}
            </>
        );
    };


    async function loadListInput() {
        const filteredInputs = await fetchInputs()
        let filteredCardInputs = []
        for (const input of filteredInputs) {
            let type = input.type_input;
            filteredCardInputs = await fetchCardInputs();
            filteredCardInputs.sort((a, b) => b.id - a.id)
            let cardInput = filteredCardInputs.find(cardInput => cardInput.input_id == input.id);
            if (input.label == 'Số tiền' && step && step.type == SE) {
                input.value = getFieldHoaDonByCardId(idCard, hoaDons, 'tong_gia_tri');
            } else {
                if (cardInput) {
                    if (type == 'get') {
                        if (!cardInput.value || cardInput.value == '') {
                            input.value = getValueFromAnotherInput(filteredCardInputs, input.default_value)
                        } else {
                            input.value = cardInput.value;
                        }
                    } else if (type == 'getTable') {
                        input.value = await updateInputFromColumn(idCard, input.default_value)
                        input.is_read_only = true
                    } else if (type == 'vlookup') {
                        let data = await getDataByNameTable(input.list_option);
                        input.value = getValueFromVLookUp(filteredCardInputs, data, input)
                        input.is_read_only = true
                    } else if (type == 'calc') {
                        input.value = getValueFromCalc(filteredCardInputs, input.cong_thuc).toFixed(0)
                        input.is_read_only = true
                    } else if (type == 'thue') {
                        input.value = ((cardInput.value - 1) * 100).toFixed(0);
                        if (input.value == -100) {
                            input.value = 0
                        }
                    } else {
                        input.value = cardInput.value;
                    }
                    cardInput.value = input.value
                } else {
                    if (type == 'ai') {
                        input.value = input.default_value + '|' + idCard
                    } else if (type != 'get' && type != 'vlookup' && type != 'calc' && type !== 'getTable') input.value = input.default_value || '';
                    else input.value = '';
                    await createNewCardInput({
                        value: input.value,
                        card_id: idCard,
                        input_id: input.id,
                        is_compulsory: input.is_compulsory
                    })
                }
            }

        }
        filteredInputs.sort((a, b) => a.position - b.position);
        setListInput(filteredInputs);
    }

    const handleInputChange = (item, value) => {
        setListInput(prevInputs =>
            prevInputs.map(input =>
                input.id === item.id ? {...input, value} : input
            )
        );

        setPendingChanges(prev => {
            const existingChange = prev.find(change => change.input_id === item.id);
            if (existingChange) {
                return prev.map(change =>
                    change.input_id === item.id ? {...change, value} : change
                );
            }
            return [...prev, {card_id: idCard, input_id: item.id, value, type: item.type_input}];
        });

        setIsEditing(true); // Mark as editing
    };

    // Save all changes function (implement according to your logic)
    const saveAllChanges = async () => {
        let cardInputs = await getAllCardInput();
        for (const change of pendingChanges) {
            if (change.type == 'thue') {
                change.value = change.value / 100 + 1;
            }
            let cardInput = cardInputs.find(input => input.input_id == change.input_id && input.card_id == change.card_id);
            if (cardInput) {
                cardInput.value = change.value;
                await updateCardInput(cardInput);
            }
        }
        setPendingChanges([]);
        setIsEditing(false);
        await updateCardField(idCard, 'input')
        setLoadData(!loadData)
    };


    // Show confirmation dialog before navigating away
    const showConfirm = () => {
        Modal.confirm({
            title: 'Bạn có chắc muốn chuyển không?',
            content: 'Bạn có những thay đổi chưa được lưu.',
            okText: 'Lưu',
            cancelText: 'Hủy',
            onOk() {
                saveAllChanges();
            },
            onCancel() {
                setIsEditing(false);
                setPendingChanges([]);
            },
        });
    };

    const renderInputField = (item) => {
        switch (item.type_input) {
            case "text":
                return (
                    <Input
                        type="text"
                        readOnly={item.is_read_only}
                        value={item.value || ''}
                        onChange={UPDATE_PERMISSION ? (e) => handleInputChange(item, e.target.value) : null}
                        placeholder={item.label}
                    />
                );
            case "get":
                return (
                    <Input
                        type="text"
                        readOnly={item.is_read_only}
                        value={item.value || ''}
                        onChange={UPDATE_PERMISSION ? (e) => handleInputChange(item, e.target.value) : null}
                        placeholder={item.label}
                    />
                );
            case "number":
                let placeholder = item.label;

                if (item?.min_value && !item?.max_value) {
                    placeholder = `Nhập giá trị nhỏ nhất ${+item.min_value}`;
                } else if (!item?.min_value && item?.max_value) {
                    placeholder = `Nhập giá trị lớn nhất ${+item.max_value}`;
                } else if (item?.min_value && item?.max_value) {
                    placeholder = `Nhập giá trị trong khoảng từ ${+item.min_value} đến ${+item.max_value}`;
                }

                return (
                    <FormattedNumberInput
                        value={item?.value || 0}
                        onChange={UPDATE_PERMISSION ? (value) => handleInputChange(item, value) : null}
                        placeholder={placeholder}
                        min={+item?.min_value}
                        max={+item?.max_value}
                        readOnly={item.is_read_only}
                    />
                );
            case "file":
                return (
                    <div style={{pointerEvents: UPDATE_PERMISSION ? 'auto' : 'none'}}>
                        <PopUpUploadFile
                            id={item.id}
                            table={idCard}
                            onGridReady={()=>setLoadData(!loadData)}
                            card={'Card'}
                        />
                    </div>
                );
            case "date":
                return (
                    <Input
                        readOnly={item.is_read_only}
                        type="date"
                        value={item.value || ''}
                        onChange={UPDATE_PERMISSION ? (e) => handleInputChange(item, e.target.value) : null}
                    />
                );
            case "select":
                return (
                    <>
                        <Select
                            value={item.value || ''}
                            onChange={(value) => handleInputChange(item, value)}
                            className={css.select_op}
                            disabled={!UPDATE_PERMISSION}
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
            case "comment":
                return (
                    <>
                        <i>
                            {item.default_value ?
                                (<>
                                    <span style={{color: 'red'}}>({'*'}) </span> {item.default_value}
                                </>)
                                : ''}
                        </i>
                    </>
                );
            case "calc":
                return (
                    <FormattedNumberInput
                        value={item?.value || 0}
                        onChange={UPDATE_PERMISSION ? (value) => handleInputChange(item, value) : null}
                        placeholder={item.label}
                        min={+item?.min_value}
                        max={+item?.max_value}
                        readOnly={item.is_read_only}
                    />
                );

            default:
                return (
                    <Input
                        type="text"
                        readOnly={item.is_read_only}
                        value={item.value || ''}
                        onChange={UPDATE_PERMISSION ? (e) => handleInputChange(item, e.target.value) : null}
                        placeholder={item.label}
                    />
                );
        }
    };

    const handleConfirm = async () => {
        try {
            const dataUpdateCard = {
                ...card,
                cau_truc: card.cau_truc.map(item => {
                    if (item.type == SE) {
                        return {
                            ...item,
                            subSteps: item.subSteps.map(subStep => {
                                if (subStep.subStepType == TYPE_FORM) {
                                    return {
                                        ...subStep,
                                        status: 'done'
                                    };
                                }
                                return subStep;
                            })
                        };
                    }
                    return item;
                })
            };
            await updateCard(dataUpdateCard);
            let idSSDK = getSubStepDKIdInCardByType(card, SE);
            const dinhKhoanPro = await getDinhKhoanProDataByStepId(idSSDK, idCard);
            let ipms = await getAllInputMau();
            const ipmSP = ipms.find(e => e.label == 'Số phiếu');
            if (dinhKhoanPro) {
                const newRowData = {
                    dinhKhoan_id: dinhKhoanPro.id,
                    "date": new Date(),
                    "note": ipmSP.default_value + '|' + idCard,
                    "tkNo": 112,
                    "tkCo": 1311,
                    card_id: idCard,
                    step_id: idStep,
                    "soTien": getFieldHoaDonByCardId(idCard, hoaDons, 'tong_gia_tri'),
                    "show": true

                };
                await createNewDinhKhoanProData(newRowData);
                fetchCard();
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoadData(!loadData)
        }
    };

    return (
        <div className={css.inputListContainer}>
            <div className={css.inputList}>
                {listInput.map((input) => (
                    <div className={css.inputItem}
                         style={{width: `calc(${input.size_input * 9}% + ${(input.size_input - 1)}%)`}} key={input.id}>
                        <div className={css.headerInput}>
                            {input?.type_input !== 'comment' && <label>{input.label}<span
                                style={{color: 'red'}}>{input.is_compulsory ? '*' : ''}</span></label>}
                        </div>
                        {renderInputField(input)}
                    </div>
                ))}
            </div>
            {pendingChanges.length > 0 && (
                <div className={'save-btn'} onClick={saveAllChanges}><img src={SaveTron} alt=""/> Lưu </div>
            )
            }
            {step && step.type == SE &&
                <div className={css.contentModalAction}>

                    {Array.isArray(card?.cau_truc) &&
                    card.cau_truc
                        .filter(card => card.type == SE)
                        .some(cardField =>
                            cardField.subSteps.some(subStep =>
                                subStep.subStepType === TYPE_FORM && subStep.status === "done"
                            )
                        )
                        ? (
                            <Button
                                type="primary"
                                disabled
                            >
                                Đã xác nhận
                            </Button>
                        )
                        : (
                            <Button
                                type="primary"
                                onClick={handleConfirm}
                            >
                                Xác nhận
                            </Button>
                        )}
                </div>}
        </div>
    )
        ;
};

export default SubStepInput;
