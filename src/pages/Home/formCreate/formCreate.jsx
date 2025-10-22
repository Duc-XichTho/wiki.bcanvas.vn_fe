import React, {useEffect, useState} from "react";
import {Box, Button, FormControl, InputLabel, MenuItem, Modal, Select, TextField,} from "@mui/material";
import css from './formCreate.module.css';
import {DANH_MUC_LIST} from "../../../Consts/DANH_MUC_LIST.js";
import {createTimestamp, formatCurrency, parseCurrencyInput} from "../../../generalFunction/format.js";
import {toast} from "react-toastify";
import {handleCreate} from "../AgridTable/handleAction/handleCreate.js";

export default function PopUpForm({table, onClose, open, reload, currentUser}) {
    const [fields, setFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [options, setOptions] = useState({});
    const [listNumberInput, setListNumberInput] = useState([]);

    useEffect(() => {
        setFormData({})
        setListNumberInput([]);
    }, [onClose]);

    useEffect(() => {
        const selectedItem = DANH_MUC_LIST.find(item => item.table === table);
        if (selectedItem) {
            const updatedFields = selectedItem.fields.filter(item => item.field !== 'id');
            setFields(updatedFields);
        }

        const fetchOptions = async () => {
            const fetchedOptions = {};
            for (const field of selectedItem.fields) {
                if (field.type === 'select' && field.getAllApi) {
                    try {
                        const response = await field.getAllApi();
                        fetchedOptions[field.field] = response.map(item => ({
                            id: item.id,
                            label: item[field.key],
                        }));
                    } catch (error) {
                        console.error(`Error loading data for ${field.field}:`, error);
                    }
                }
            }
            setOptions(fetchedOptions);
        };
        fetchOptions();
    }, [table]);

    const handleInputChange = (e, type) => {
        const {name, value} = e.target;
        if (type === 'decimal') {
            const numericValue = value.replace(/[^\d.-]/g, '');
            setFormData({...formData, [name]: formatCurrency(numericValue)});
            if (!listNumberInput.includes(name)) {
                setListNumberInput(prevFields => [...prevFields, name]);
            }
        } else if (type === 'number') {
            const numericValue = value.replace(/[^\d.-]/g, '');
            setFormData({...formData, [name]: parseCurrencyInput(numericValue)});
            if (!listNumberInput.includes(name)) {
                setListNumberInput(prevFields => [...prevFields, name]);
            }
        }  else if (type === 'text') {
            setFormData({...formData, [name]: value});
        } else if (type === 'select') {
            setFormData({...formData, [name]: value});
        } else if (type === 'date') {
            setFormData({...formData, [name]: value});
        }
    };

    const handleSave = async () => {
        const formattedData = {...formData};
        listNumberInput.forEach(fieldName => {
            const value = formattedData[fieldName];
            if (value) {
                formattedData[fieldName] = parseCurrencyInput(value);
            }
        });
        const newData = {
            ...formattedData,
        };
        await handleCreate(table, newData , currentUser);
        await reload();
        toast.success("Tạo dòng thành công", {autoClose: 1000});
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="form-modal-title"
            aria-describedby="form-modal-description"
        >
            <Box className={css.popUpForm}>
                <div className={css.formContent}>
                    <h3 id="form-modal-title">Thêm mới</h3>
                    {fields.map((field, index) => (
                        <div key={index} className={css.formField}>
                            {field.type === 'text' && (
                                <TextField
                                    name={field.field}
                                    label={field.headerName}
                                    value={formData[field.field] || ''}
                                    onChange={(e) => handleInputChange(e, 'text')}
                                    variant="outlined"
                                    fullWidth
                                />
                            )}
                            {field.type === 'date' && (
                                <TextField
                                    name={field.field}
                                    label={field.headerName}
                                    type="date"
                                    value={formData[field.field] || ''}
                                    onChange={(e) => handleInputChange(e, 'date')}
                                    variant="outlined"
                                    fullWidth
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            )}
                            {field.type === 'decimal' && (
                                <TextField
                                    name={field.field}
                                    label={field.headerName}
                                    value={formData[field.field] || ''}
                                    onChange={(e) => handleInputChange(e, 'decimal')}
                                    variant="outlined"
                                    fullWidth
                                />
                            )}
                            {field.type === 'number' && (
                                <TextField
                                    name={field.field}
                                    label={field.headerName}
                                    value={formData[field.field] || ''}
                                    onChange={(e) => handleInputChange(e, 'number')}
                                    variant="outlined"
                                    fullWidth
                                />
                            )}
                            {field.type === 'select' && (
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel id={`${field.field}-label`}>{field.headerName}</InputLabel>
                                    <Select
                                        labelId={`${field.field}-label`}
                                        name={field.field}
                                        value={formData[field.field] || ''}
                                        onChange={(e) => handleInputChange(e, 'select')}
                                        label={field.headerName}
                                    >
                                        <MenuItem value="" sx={{height: 40}}></MenuItem>
                                        {options[field.field]?.map((option, idx) => (
                                            <MenuItem key={idx} value={option.id}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </div>
                    ))}
                    <div className={css.formActions}>
                        <Button color="secondary" onClick={onClose}>Hủy</Button>
                        <Button color="primary" onClick={handleSave}>Lưu</Button>
                    </div>
                </div>
            </Box>
        </Modal>
    );
}
