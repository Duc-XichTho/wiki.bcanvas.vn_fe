import React from 'react';
import Select from 'react-select';
import { Field } from 'formik';

const SelectField = ({ field, form, options, ...props }) => {
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            borderRadius: "0px",
            border:0,
            borderColor: state.isFocused ? "var(--orange-light)" : "#ced4da",
            boxShadow: state.isFocused ? "none" : null,
            borderBottom: state.isFocused ? "var(--orange-light) 2px solid" : "#696969 1px solid",
            width: "422.39px",
            minHeight: "26px",
            transition: "border-bottom-color 0.3s ease, box-shadow 0.3s ease"
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 1000, // Ensure the menu is on top
            borderRadius: "0px", // Remove border radius to avoid rounded corners
            marginTop: 0, // Ensure the menu appears directly under the control
            boxShadow: "none", // Remove box shadow
            borderTop: "none", // Remove any border on top to prevent separation line
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: "#fff",
            ":hover": {
                backgroundColor: "#12CD7F",
                color: "#fff",
            },
        }),
        multiValue: (provided) => ({
            ...provided,
            background: 'rgba(0,0,0,0)',
            boxShadow: '0px 0px 2px 0px rgba(0,0,0, 0.2)',
            color: '#696969 !important',
        }),
        indicatorSeparator: (provided) => ({
            ...provided,
            display: 'none'
        }),
        indicatorsContainer: (provided) => ({
            ...provided,
            display: 'flex',
            alignItems: 'center',
            marginRight: 0,
            fontSize: '14.5px !important',
        }),
        dropdownIndicator: (provided) => ({
            ...provided,
            padding: 0,
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            color: "#696969",
            svg: {
                width: 16,
                height: 16,
            },
        }),
    };

    const { name, value } = field;
    const { setFieldValue } = form;

    const handleChange = (selectedOption) => {
        setFieldValue(name, selectedOption ? selectedOption.value : '');
    };
    const selectedOption = options.find(option => option.value === value);

    return (
        <Select
            {...props}
            name={name}
            value={selectedOption}
            onChange={handleChange}
            options={options}
            menuPortalTarget={document.body}
            styles={customStyles}
            placeholder=""
        />
    );
};

export default SelectField;
