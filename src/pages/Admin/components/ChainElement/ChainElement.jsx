import css from "./ChainElement.module.css"
import { useState, useEffect } from "react";
import Template from "./Template/Template";
import Step from "./Step/Step";
import SubStep from "./SubStep/SubStep";

const ChainElement = ({
  chainSelected
}) => {
  const [templateSelected, setTemplateSelected] = useState(null);
  const [stepSelected, setStepSelected] = useState(null);
  const [subStepSelected, setSubStepSelected] = useState(null);

  useEffect(() => {
    if (chainSelected) {
      setTemplateSelected(null);
      setStepSelected(null);
      setSubStepSelected(null);
    } else {
      setTemplateSelected(null);
      setStepSelected(null);
      setSubStepSelected(null);
    }
  }, [chainSelected]);

  useEffect(() => {
    if (templateSelected) {
      setStepSelected(null);
      setSubStepSelected(null);
    } else {
      setStepSelected(null);
      setSubStepSelected(null);
    }
  }, [templateSelected]);

  useEffect(() => {
    if (stepSelected) {
      setSubStepSelected(null);
    } else {
      setSubStepSelected(null);
    }
  }, [stepSelected]);

  return (
    <div className={css.main}>
      <div className={css.template}>
        <Template
          chainSelected={chainSelected}
          templateSelected={templateSelected}
          setTemplateSelected={setTemplateSelected}
        />
      </div>
      <div className={css.step}>
        {templateSelected && (
          <Step
            templateSelected={templateSelected}
            stepSelected={stepSelected}
            setStepSelected={setStepSelected}
          />
        )}
      </div>
      <div className={css.substep}>
        {stepSelected && (
          <SubStep
            stepSelected={stepSelected}
            subStepSelected={subStepSelected}
            setSubStepSelected={setSubStepSelected}
          />
        )}
      </div>
    </div>
  );
};

export default ChainElement;
