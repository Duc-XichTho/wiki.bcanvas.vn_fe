export function getValueFromAnotherInput(cardInputs, id_input) {
    let cardInput = cardInputs.find((cardInput) => cardInput.input_id == id_input);
    return cardInput?.value || '';
}

export function getValueFromCalc(cardInputs, cong_thuc) {
    function getValueById(id, data) {
        const item = data.find((d) => d.input_id === id);
        return item ? +item.value : null;
    }

    const operands = cong_thuc.filter((_, index) => index % 2 === 0).map((id) => getValueById(id, cardInputs));
    const operators = cong_thuc.filter((_, index) => index % 2 === 1);

    if (operands.includes(null)) {
        return 0;
    }

    let tempOperands = [...operands];
    let tempOperators = [...operators];

    for (let i = 0; i < tempOperators.length; i++) {
        if (tempOperators[i] === "*" || tempOperators[i] === "/") {
            const op1 = tempOperands[i];
            const op2 = tempOperands[i + 1];
            if (tempOperators[i] === "/") {
                if (op2 === 0) return "Division by zero.";
                tempOperands[i] = op1 / op2;
            } else {
                tempOperands[i] = op1 * op2;
            }
            tempOperands.splice(i + 1, 1);
            tempOperators.splice(i, 1);
            i--;
        }
    }

    let result = tempOperands[0];
    for (let i = 0; i < tempOperators.length; i++) {
        if (tempOperators[i] === "+") {
            result += tempOperands[i + 1];
        } else if (tempOperators[i] === "-") {
            result -= tempOperands[i + 1];
        }
    }

    return result;
}

export function getValueFromVLookUp(cardInputs, data, input) {
    try {
        let referenceId = input.default_value;
        let field = input.column_selected_for_vlookup;
        let cardInput = cardInputs.find(e => e.input_id == referenceId);
        let item = data.find(e => e.code == cardInput.value);
        return item[field]
    } catch (e) {
        return ''
    }
}
