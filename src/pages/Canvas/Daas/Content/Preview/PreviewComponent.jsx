import PropTypes from 'prop-types';
import PreviewFile from "./PreviewFile.jsx";
import React from "react";
import PreviewNotePad from "./PreviewNotePad.jsx";

const PreviewComponent = ({data}) => {
    if (!data) return null;

    const componentsMap = {
        FileUpLoad: PreviewFile,
        NotePad: PreviewNotePad,
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
