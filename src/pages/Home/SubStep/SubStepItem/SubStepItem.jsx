import React from "react";
import css from './SubStepItem.module.css';

import {
    TYPE_FORM,
    TYPE_NOTEPAD,
    TYPE_CHECKLIST,
    TYPE_DK,
    TYPE_DK_PRO,
    TYPE_SHEET,
    TYPE_ACTION,
    TYPE_SALARY, TYPE_CUSTOM,
} from "../../../../Consts/SECTION_TYPE.js";

import SubStepInput from "./SubStepInput/SubStepInput.jsx";
import SubStepNotepad from "./SubStepNotepad/SubStepNotepad.jsx";
import SubStepChecklist from "./SubStepChecklist/SubStepChecklist.jsx";
import SubStepDK from "./SubStepDK/SubStepDK.jsx";
import SubStepDKPro from "./SubStepDKPro/SubStepDKPro.jsx";
import SubStepSheet from "./SubStepSheet/SubStepSheet.jsx";
import SubStepAction from "./SubStepAction/SubStepAction.jsx";
import SubStepSalary from "./SubStepSalary/SubStepSalary.jsx";
import SubStepCustom from "./SubStepCustom/SubStepCustom.jsx";

import {Watermark} from 'antd';
import {SectionIcon} from "../../../../icon/IconSVG.js";

const renderSubStepComponent = (subStepType, props) => {
    const componentsMap = {
        [TYPE_FORM]: SubStepInput,
        [TYPE_NOTEPAD]: SubStepNotepad,
        [TYPE_CHECKLIST]: SubStepChecklist,
        [TYPE_DK]: SubStepDK,
        [TYPE_DK_PRO]: SubStepDKPro,
        [TYPE_SHEET]: SubStepSheet,
        [TYPE_ACTION]: SubStepAction,
        [TYPE_SALARY]: SubStepSalary,
        [TYPE_CUSTOM]: SubStepCustom,
    };

    const Component = componentsMap[subStepType];
    return Component ? <Component {...props} /> : null;
};

export default function SubStepItem({subStep, idCard, listSubStep, permissionsSubStep}) {

    const config = {
        content: 'Read Only',
        color: 'rgba(0, 0, 0, 0.09)',
        fontSize: 12,
        zIndex: 100,
        rotate: -22,
        gap: [100, 100],
        offset: undefined,
    };

    const {content, color, fontSize, zIndex, rotate, gap, offset} = config;

    const watermarkProps = {
        content,
        zIndex,
        rotate,
        gap,
        offset,
        font: {
            color: typeof color === 'string' ? color : color.toRgbString(),
            fontSize,
        },
    };

    const commonProps = {
        sub_step_id: subStep.id,
        idCard,
        listSubStep,
        permissionsSubStep,
    };

    return (
        <div className={css.container}>
            {permissionsSubStep.update ? (
                <>
                    <div className={css.nameSection}>
                        <img src={SectionIcon} alt=""/>
                        {subStep?.name}
                    </div>

                    {renderSubStepComponent(subStep.subStepType, commonProps)}
                </>
            ) : (
                <Watermark {...watermarkProps}>
                    <>
                        {subStep?.name}
                        {renderSubStepComponent(subStep.subStepType, commonProps)}
                    </>
                </Watermark>
            )}
        </div>
    );
}
