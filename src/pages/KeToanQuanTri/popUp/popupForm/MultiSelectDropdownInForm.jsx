import React from "react";
import Select from "react-select";

const MultiSelectDropdownInForm = ({options, onChange, selectedValues}) => {
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            borderRadius: "5px",
            borderColor: state.isFocused ? "#ffffff" : "#ced4da",
            boxShadow: state.isFocused
                ? "0 0 0 0.2rem rgba(0, 123, 255, 0.25)"
                : null,
            "&:hover": {
                borderColor: state.isFocused ? "#ffffff" : "#adb5bd",
            },
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: "white",
            ":hover": {
                backgroundColor: "transparent",
                color: "white",
            },
        }),
        multiValue: (provided) => ({
            ...provided,
            background: 'rgba(0,0,0,0)',
            boxShadow: '0px 0px 2px 0px rgba(0,0,0, 0.2)',
            color: '#696969 !important',
        }),
    };

    return (
        <Select
            options={options}
            isMulti
            value={selectedValues ? selectedValues : []}
            onChange={onChange}
            styles={customStyles}
            placeholder="Chọn ..."
        />
    );
};

export default MultiSelectDropdownInForm;
