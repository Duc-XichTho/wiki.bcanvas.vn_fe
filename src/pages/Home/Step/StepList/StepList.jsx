import {useContext, useEffect, useState} from "react";
import css from "./StepList.module.css";
import {
    CompleteStep,
    DoingStep,
    ExpandLessIcon,
    ExpandMoreIcon,
    NotDoneYetStep,
    PendingStep
} from "../../../../icon/IconSVG.js";
import {useNavigate, useParams} from "react-router-dom";
import {MyContext} from "../../../../MyContext.jsx";
import {DONE, DUYET1} from "../../../../Consts/STEP_STATUS.js";
import {updateCard} from "../../../../apis/cardService.jsx";

const getStepIcon = (step) => {
    switch (step.status) {
        case "done":
            return CompleteStep;
        case "doing":
            return DoingStep;
        case "pending":
            return PendingStep;
        case "notDoneYet":
            return NotDoneYetStep;
        case "duyet_1":
            return PendingStep;
        default:
            return null;
    }
};

const statusLabels = {
    done: "Hoàn thành", pending: "Chờ duyệt", doing: "Đang thực hiện", notDoneYet: "Chưa thực hiện"
};

const getInitialStep = (steps) => {
    const doingSteps = steps.filter((step) => step.status === "doing");
    if (doingSteps.length > 0) {
        return doingSteps.reduce((min, step) => (step.position < min.position ? step : min), doingSteps[0]);
    }

    const pendingSteps = steps.filter((step) => step.status === "pending");
    if (pendingSteps.length > 0) {
        return pendingSteps.reduce((max, step) => (step.position > max.position ? step : max), pendingSteps[0]);
    }

    const doneSteps = steps.filter((step) => step.status === "done");
    if (doneSteps.length > 0) {
        return doneSteps.reduce((max, step) => (step.position > max.position ? step : max), doneSteps[0]);
    }

    const notDoneYetSteps = steps.filter((step) => step.status === "notDoneYet");
    return notDoneYetSteps.reduce((min, step) => (step.position < min.position ? step : min), notDoneYetSteps[0]);
};

const StepList = ({currentStep, setCurrentStep, idCard, stepList, card, setIsFull}) => {
    const {idStep} = useParams()
    const [steps, setSteps] = useState([]);
    const [showDetail, setShowDetail] = useState(false);
    const navigate = useNavigate();
    const {loadData, setLoadData} = useContext(MyContext);
    useEffect(() => {
        const fetchedSteps = stepList.filter(step => step.card_id = idCard);
        setSteps(fetchedSteps);
    }, [setCurrentStep, stepList, idCard, loadData]);
    useEffect(() => {
        setCurrentStep({})
    }, [idCard])

    const handleStepClick = (step) => {
        setCurrentStep(step);
        navigate(`steps/${step.id}`);
    };

    const sortedSteps = [...steps].sort((a, b) => a.position - b.position);

    return (<>

        <div className={css.stepListWrapper}>
            <div className={css.stepWrapper}>
                {sortedSteps.map((step, index) => (
                    <div key={step.id}
                         className={`${css.step}`}
                    >
                        <div>
                            <div
                                className={`${css.stepIconWrapper} ${step?.id == idStep ? css.highlight : ""}`}
                                onClick={() => handleStepClick(step)}
                            >
                                <div className={css.stepIcon}>
                                    <img src={getStepIcon(step)} alt={step.name}/>
                                </div>
                                <div className={css.stepLabel}>
                                    <p title={step.name}>{step.name}</p>
                                </div>
                            </div>
                            <div className={`${css.statusStep} ${css[step.status]}`}>
                                <p>{statusLabels[step.status]}</p>
                            </div>
                            {/*{(step.skipable) &&*/}
                            {/*    <div className={css.skip}>*/}
                            {/*        {step.status !== DONE && <button onClick={() => {*/}
                            {/*            step.status = DONE;*/}
                            {/*            updateCard(card).then(() => {*/}
                            {/*                setLoadData(!loadData)*/}
                            {/*            })*/}
                            {/*        }}>Bỏ qua</button>}*/}
                            {/*    </div>}*/}
                            {/*{!step.skipable && <div className={css.skip}></div>}*/}
                        </div>
                        {index < sortedSteps.length - 1 && (
                            <div className={css.arrowConnector}>
                                <img src="/flowing-line%20(1).svg" alt=""/>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </>);
};

export default StepList;
