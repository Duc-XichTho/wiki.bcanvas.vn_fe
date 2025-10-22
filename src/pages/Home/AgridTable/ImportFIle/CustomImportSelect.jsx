import React from 'react';
import Select from 'react-select';

// Custom styles for the React Select component
const customStyles = {
    control: (provided, state, isInvalid, hasValue) => ({
        ...provided,
        border: isInvalid ? '2px solid red' : state.isFocused ? '2px solid #1976d2' : '1px solid #ccc',
        boxShadow: isInvalid
            ? '0 0 5px rgba(255, 0, 0, 0.8)'
            : hasValue
                ? '0 0 5px rgba(0, 255, 0, 0.8)'  // Green box-shadow when a value is selected
                : state.isFocused
                    ? '0 0 3px rgba(25, 118, 210, 0.5)'
                    : 'none',
        '&:hover': {
            border: isInvalid ? '2px solid red' : state.isFocused ? '2px solid #1976d2' : '1px solid #aaa',
        },
        padding: '3px',
        borderRadius: '4px',
        position: 'relative',
        zIndex: 1,
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? '#f1f9ff' : 'white',
        color: state.isFocused ? '#1976d2' : '#333',
        padding: 10,
    }),
    menu: (provided) => ({
        ...provided,
        borderRadius: '4px',
        marginTop: '0px',
        position: 'absolute',
        zIndex: 10000,
    }),
    menuPortal: (provided) => ({
        ...provided,
        zIndex: 10000,
    }),
    placeholder: (provided) => ({
        ...provided,
        color: '#666',
        fontStyle: 'italic',
    }),
    singleValue: (provided) => ({
        ...provided,
        color: '#333',
    }),
    dropdownIndicator: (provided, state) => ({
        ...provided,
        color: state.isFocused ? '#1976d2' : '#666',
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
};


const CustomImportSelect = ({
                                options,
                                value,
                                onChange,
                                placeholder = "Chọn cột",
                                isDisabled,
                                isInvalid = false
                            }) => {
    const hasValue = !!value;  // Check if a value is selected

    return (
        <Select
            value={value}
            onChange={onChange}
            options={options}
            styles={{
                ...customStyles,
                control: (provided, state) => customStyles.control(provided, state, isInvalid, hasValue),  // Pass hasValue to control
            }}
            placeholder={placeholder}
            isDisabled={isDisabled}
            isClearable
            menuPortalTarget={document.body}  // This ensures the menu is rendered in the body, escaping any overflow restrictions
        />
    );
};

export default CustomImportSelect;
