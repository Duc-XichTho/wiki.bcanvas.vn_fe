export function getMonthRange(dateRange) {
    const [startDate, endDate] = dateRange.map(date => new Date(date));
    const result = [];

    // Bắt đầu từ tháng và năm của ngày bắt đầu
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (current <= endDate) {
        const month = current.getMonth() + 1; // getMonth() trả về 0-11
        const year = current.getFullYear();
        result.push({month, year});

        // Tăng tháng lên 1
        current.setMonth(current.getMonth() + 1);
    }

    return result;

}
