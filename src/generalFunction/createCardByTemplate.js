import {NOT_DONE_YET} from "../Consts/STEP_STATUS.js";
import {createTimestamp} from "./format.js";
import {createNewCard, getAllCard} from "../apis/cardService.jsx";
import {getAllStep} from "../apis/stepService.jsx";
import {getAllSubStep} from "../apis/subStepService.jsx";

export async function createCardByTemplate(template, selectedCompany, currentYear, setChainTemplate2Selected, chainTemplate2Selected) {
    const [cards, allStep, subSteps] = await Promise.all([
        getAllCard(),
        getAllStep(),
        getAllSubStep(),
    ]);
    const steps = allStep
        .filter(step => step.template_id == template.id)
        .map(step => {
            step.status = NOT_DONE_YET;
            const mau = allStep.find(item => item.type == 'M|' + step.type);

            step.subSteps = mau
                ? subSteps.filter(subStep => subStep.step_id == mau.id)
                : subSteps.filter(subStep => subStep.step_id == step.id);

            return step;
        });
    const data = {
        name: `${template.name} Gom`,
        template_id: template.id,
        chain_id: template.chain_id,
        cau_truc: steps,
        created_at: createTimestamp(),
        company: selectedCompany !== 'Toàn bộ' ? selectedCompany : '',
        year: currentYear,
    };
    const newCard = await createNewCard(data);
    let listCard = cards.filter(card => card.template_id == template.id)
    setChainTemplate2Selected({
        type: 'chain2',
        data: {
            ...chainTemplate2Selected.data,
            selectedTemplate: {
                ...template,
                cards: [newCard.data, ...listCard],
            }
        }
    })
    return newCard?.data?.id
}
