import React from 'react'
import css from "./LayoutChain.module.css"
import Chain from '../../Chain/Chain'
import SubChain from '../../SubChain/SubChain'
import Step from '../../Step/Step'
import Section from '../../Section/Section'

const LayoutChain = () => {

  const [selectedChain, setSelectedChain] = React.useState(null);
  const [selectedSubChain, setSelectedSubChain] = React.useState(null);
  const [selectedStep, setSelectedStep] = React.useState(null);

  const data = [
    {
      id: 'chain1',
      name: 'Chain 1',
      subChains: [
        {
          id: 'subChain1-1',
          name: 'SubChain 1-1',
          steps: [
            {
              id: 'step1-1-1',
              name: 'Step 1-1-1',
              sections: [
                { id: 'section1-1-1-1', name: 'Section 1-1-1-1' },
                { id: 'section1-1-1-2', name: 'Section 1-1-1-2' },
              ],
            },
            {
              id: 'step1-1-2',
              name: 'Step 1-1-2',
              sections: [
                { id: 'section1-1-2-1', name: 'Section 1-1-2-1' },
                { id: 'section1-1-2-2', name: 'Section 1-1-2-2' },
              ],
            },
          ],
        },
        {
          id: 'subChain1-2',
          name: 'SubChain 1-2',
          steps: [
            {
              id: 'step1-2-1',
              name: 'Step 1-2-1',
              sections: [
                { id: 'section1-2-1-1', name: 'Section 1-2-1-1' },
                { id: 'section1-2-1-2', name: 'Section 1-2-1-2' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'chain2',
      name: 'Chain 2',
      subChains: [
        {
          id: 'subChain2-1',
          name: 'SubChain 2-1',
          steps: [
            {
              id: 'step2-1-1',
              name: 'Step 2-1-1',
              sections: [
                { id: 'section2-1-1-1', name: 'Section 2-1-1-1' },
                { id: 'section2-1-1-2', name: 'Section 2-1-1-2' },
              ],
            },
          ],
        },
      ],
    },
  ];

  return (
    <div className={css.container}>
      <div className={css.chain}>
        {data.map((chain) => (
          <Chain
            key={chain.id}
            chain={chain}
            onClick={() => {
              setSelectedChain(chain);
              setSelectedSubChain(null);
              setSelectedStep(null);
            }}
            isSelected={selectedChain?.id === chain.id}
          />
        ))}
      </div>

      <div className={css.subchain}>
        {selectedChain ? (
          selectedChain.subChains.map((subChain) => (
            <SubChain
              key={subChain.id}
              subChain={subChain}
              onClick={() => {
                setSelectedSubChain(subChain);
                setSelectedStep(null);
              }}
              isSelected={selectedSubChain?.id === subChain.id}
            />
          ))
        ) : (
          <p>Chọn Chain để xem SubChain</p>
        )}
      </div>

      <div className={css.stepsection}>
        <div className={css.step}>
          {selectedSubChain ? (
            selectedSubChain.steps.map((step) => (
              <Step
                key={step.id}
                step={step}
                onClick={() => setSelectedStep(step)}
                isSelected={selectedStep?.id === step.id}
              />
            ))
          ) : (
            <p>Chọn SubChain để xem Step</p>
          )}
        </div>

        <div className={css.section}>
          {selectedStep ? (
            selectedStep.sections.map((section) => (
              <Section key={section.id} section={section} />
            ))
          ) : (
            <p>Chọn Step để xem Section</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default LayoutChain