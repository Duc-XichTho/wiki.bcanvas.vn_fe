import React, { useContext, useEffect, useState } from "react";
import { getSubStepDataById } from "../../../../../apis/subStepService.jsx";
import { getCurrentUserLogin } from "../../../../../apis/userService.jsx";
import { DANH_MUC_LIST } from "../../../../../Consts/DANH_MUC_LIST.js";
import { createTimestamp } from "../../../../../generalFunction/format.js";
import { Button, Col, DatePicker, Form, Input, message, Modal, Row, Select, Table } from "antd";
import PopUpFormCreatePhieu from "../../../formCreate/formCreatePhieu.jsx";
import css from "../../../CreateDanhMuc/CreateDanhMuc.module.css";
import { ACTION_BUTTON_LIST } from "../../../../../Consts/ACTION_BUTTON.js";
import { MyContext } from "../../../../../MyContext.jsx";
import { AgGridReact } from "ag-grid-react";
import { filter } from "../../../AgridTable/FilterAgrid.jsx";
import PopupAction from "../../../formCreate/PopupAction.jsx";
import { LiST_COMPONENT_FOR_TYPE_TABLE } from "../../../../../Consts/LiST_COMPONENT_FOR_TYPE_TABLE.jsx";


const SubStepCustom = ({ sub_step_id, idCard, listSubStep, permissionsSubStep }) => {
    const UPDATE_PERMISSION = permissionsSubStep?.update;
    const [selectedComponent, setSelectedComponent] = useState(null);

    useEffect(() => {
        if (sub_step_id) {
            getSubStepDataById(sub_step_id).then((data) => {
                setSelectedComponent(data.action_list || null);
            });
        }
    }, [sub_step_id]);

    return (
        <div className={css.container}>
            {UPDATE_PERMISSION
                ? (
                    <div style={{ width: '100%' }}>
                        {selectedComponent && (
                            LiST_COMPONENT_FOR_TYPE_TABLE.map((component, index) => {
                                if (component.name === selectedComponent) {
                                    return React.cloneElement(component.component, { key: index });
                                }
                                return null;
                            })
                        )}
                    </div>
                )
                : (<></>)
            }
        </div>
    );
};
export default SubStepCustom;
