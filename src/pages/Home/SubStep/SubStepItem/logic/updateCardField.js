import {getAllMappingCard} from "../../../../../apis/mappingCardService.jsx";
import {getCardDataById, updateCard} from "../../../../../apis/cardService.jsx";
import {getAllCardInput} from "../../../../../apis/cardInputService.jsx";
import {getDataByNameTable} from "../../../../../generalFunction/getData.js";
import {getAllInput} from "../../../../../apis/inputService.jsx";
import {getValueFromAnotherInput, getValueFromCalc, getValueFromVLookUp} from "./getValue.js";
import {getAllSheet} from "../../../../../apis/sheetService.jsx";
import {getSheetColumnDataById, getSheetColumnDataByCloneId} from "../../../../../apis/sheetColumnService.jsx";
import {getAllSheetDataBySheetId} from "../../../../../apis/sheetDataService.jsx";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {createTimestamp} from "../../../../../generalFunction/format.js";

export async function updateCardField(idCard, type) {
    let newCardData
    if (type == 'input') {
        newCardData = await updateCardInput(idCard)
    }
    if (type == 'sheet') {
        newCardData = await updateSheetInput(idCard)
    }
    const {data, error} = await getCurrentUserLogin();
    newCardData.user_update = data.email,
        newCardData.updated_at = createTimestamp(),
        await updateCard(newCardData)
}

const updateSheetInput = async (idCard) => {
    let sheets = await getAllSheet();
    let mappings = await getAllMappingCard();
    let card = await getCardDataById(idCard);
    let mappingCard = mappings.filter(mapping => mapping.template_id == card.template_id && mapping.sheet_column_id != 0);
    let updatedData = {id: card.id};
    for (const card of mappingCard) {
        let sum = 0;
        const columnData = await getSheetColumnDataById(card.sheet_column_id);
        const columnStep = await getSheetColumnDataByCloneId(columnData.id);
        const filterSheet = sheets.filter(sheet =>
            sheet.card_id == idCard &&
            columnStep.some(column => column.sheet_id == sheet.id)
        );
        for (const sheet of filterSheet) {
            const sheetData = await getAllSheetDataBySheetId(sheet.id);
            for (const data of sheetData) {
                const value = parseFloat(data.data[columnData.name]);
                if (!isNaN(value)) {
                    sum += value;
                }
            }
        }
        updatedData[card.field] = sum;
    }
    return updatedData;
}

export const updateInputFromColumn = async (idCard, idColumn) => {
    let sheets = await getAllSheet();
    let sum = 0;
    const columnData = await getSheetColumnDataById(idColumn);
    const columnStep = await getSheetColumnDataByCloneId(columnData.id);
    const filterSheet = sheets.filter(sheet =>
        sheet.card_id == idCard &&
        columnStep.some(column => column.sheet_id == sheet.id)
    );
    for (const sheet of filterSheet) {
        const sheetData = await getAllSheetDataBySheetId(sheet.id);
        for (const data of sheetData) {
            const value = parseFloat(data.data[columnData.name]);
            if (!isNaN(value)) {
                sum += value;
            }
        }
    }
    return sum
}

const updateCardInput = async (idCard) => {
    let inputs = await getAllInput()
    let mappings = await getAllMappingCard();
    let card = await getCardDataById(idCard)
    let cardInputs = await getAllCardInput()
    let filteredCardInputs = cardInputs.filter(cardInput => cardInput.card_id == idCard);
    for (const input of inputs) {
        let type = input.type_input;
        let cardInput = filteredCardInputs.find(cardInput => cardInput.input_id == input.id);
        if (cardInput) {
            if (type == 'get') {
                input.value = getValueFromAnotherInput(filteredCardInputs, input.default_value)
            } else if (type == 'vlookup') {
                let data = await getDataByNameTable(input.list_option);
                input.value = getValueFromVLookUp(filteredCardInputs, data, input)
            } else if (type == 'calc') {
                input.value = getValueFromCalc(filteredCardInputs, input.cong_thuc)
            } else {
                input.value = cardInput.value;
            }
        } else {
            if (type != 'get' && type != 'vlookup' && type != 'calc') input.value = input.default_value || '';
            else input.value = '';
        }
    }
    let mappingCard = mappings.filter(mapping => mapping.template_id == card.template_id);
    let InputData = updateCardFields(card, inputs, mappingCard);
    return InputData;
}

function updateCardFields(card, cardInputs, mappingCard) {
    mappingCard.forEach(mapping => {
        const matchedInput = cardInputs.find(input => input.id === mapping.input_id);

        if (matchedInput) {
            card[mapping.field] = matchedInput.value;
        }
    });

    return card;
}
