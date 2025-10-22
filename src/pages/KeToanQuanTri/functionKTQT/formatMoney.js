export const formatCurrency = (value) => {
    if (typeof value !== 'number') {
        value = parseFloat(value);
    }
    if (isNaN(value) || value === 0) return '-';

    return value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2, // giữ tối đa 2 số lẻ, không làm tròn lên nguyên
    });
};

export const  formatCurrencyString = (value)=> {
    if (typeof value !== 'string') {
            return '-'
    } else {
        return  value;
    }
}

export function parseCurrencyInput(input) {
    let sanitizedInput =  String(input).replace(/,/g, '');
    let number = parseFloat(sanitizedInput);
    if (isNaN(number)) {
        return 0;
    }
    return number;
}

export const chuyenDauChamThanhDauPhay = (value) => {
    if (!value && value !== 0) return ''; // Kiểm tra giá trị null hoặc undefined
    return value.toString().replace('.', ',');
};
