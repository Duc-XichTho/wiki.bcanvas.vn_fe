import css from './TemplateDetail.module.css'
import {useContext, useEffect, useState} from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import TemplateStepList from "../TemplateStepList/TemplateStepList.jsx";
import { getTemplateDataById } from "../../../../apis/templateService.jsx";
import {MyContext} from "../../../../MyContext.jsx";

export default function TemplateDetail() {
    const { idTemp } = useParams();
    const navigate = useNavigate();
    const [template, setTemplate] = useState({});
    const {loadData, setLoadData} = useContext(MyContext);
    useEffect(() => {
        getTemplateDataById(idTemp).then(data => {
            setTemplate(data);
        })
    }, [idTemp, loadData])
    return (
        <>
            <div className={css.cardDetailContainer}>
                <div className={css.stepListContainer}>
                    <TemplateStepList
                        idTemp={idTemp}
                        template={template}
                    />
                </div>
                <div className={css.stepDetailContainer}>
                    <Outlet />
                </div>
            </div>
        </>
    )
}
