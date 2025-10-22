import PropTypes from 'prop-types';
import PreviewFile from "./PreviewFile.jsx";
import React from "react";

const PreviewComponent = ({data}) => {
    if (!data) return null;
    const componentsMap = {
        ProgressTask: PreviewFile,
    };
    const ComponentToRender = componentsMap[data.table];

    return (
        <>
            {ComponentToRender && (
                <ComponentToRender data={data}/>
            )}
        </>

    );
};

PreviewComponent.propTypes = {
    data: PropTypes.object.isRequired,
};

export default PreviewComponent;
