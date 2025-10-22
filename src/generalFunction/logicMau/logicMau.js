import {getAllTemplate} from "../../apis/templateService.jsx";
import {getAllStep} from "../../apis/stepService.jsx";
import {getAllSubStep} from "../../apis/subStepService.jsx";
import {getAllInput} from "../../apis/inputService.jsx";
import {TYPE_DK_PRO, TYPE_FORM, TYPE_SHEET} from "../../Consts/SECTION_TYPE.js";
import {SA} from "../../Consts/LIST_STEP_TYPE.js";

export async function getIdTemplateMau(){
    let temps = await getAllTemplate();
    let temp = temps.find(item => item.name == 'Mẫu')
    if (temp) return temp.id
}

export async function getAllStepMau(){
    let steps = await getAllStep();
    let idTemp = await getIdTemplateMau();
    steps = steps.filter(item => item.template_id == idTemp)
    return steps;
}

export async function getAllSubStepMau(){
    let subSteps = await getAllSubStep();
    let steps = await getAllStepMau();
    let subStepMau = [];
    subSteps.forEach(item => {
        if (steps.some(step => step.id == item.step_id)) {
            subStepMau.push(item);
        }
    })
    return subStepMau
}

export async function getAllInputMau(){
    let inputs = await getAllInput();
    let idTemp = await getIdTemplateMau();
    inputs = inputs.filter(item => item.template_id == idTemp)
    return inputs
}

export function getSubStepSheetIdInCardByType(card, type){
    if (!card) return null;
    let steps = card.cau_truc
    if (!steps) return null;
    let step = steps.find(item => item.type == type);
    if (!step) return null;
    let subSteps = step.subSteps;
    if (!subSteps) return null;
    let subStep = subSteps.find(item => item.subStepType == TYPE_SHEET);
    if (!subStep) return null;
    return subStep.id
}

export function getSubStepDKIdInCardByType(card, type){
    if (!card) return null;
    let steps = card.cau_truc
    if (!steps) return null;
    let step = steps.find(item => item.type == type);
    if (!step) return null;
    let subSteps = step.subSteps;
    if (!subSteps) return null;
    let subStep = subSteps.find(item => item.subStepType == TYPE_DK_PRO);
    if (!subStep) return null;
    return subStep.id
}

export function getInputValueInCardByIdInput(card_id, input_id, cardInputs){
   let cardInput = cardInputs.find(item => item.input_id == input_id && item.card_id == card_id);
   if (!cardInput) return '';
   return cardInput.value;
}

export function getFieldHoaDonByCardId(card_id, hoaDons, field){
   let hoaDon = hoaDons.find(item => item.id_card_create == card_id);
   if (!hoaDon) return '';
   return hoaDon[field];
}
