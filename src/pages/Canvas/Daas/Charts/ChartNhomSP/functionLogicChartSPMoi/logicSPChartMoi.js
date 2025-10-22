
export function transformDataBCKDMoi(result, uniqueGroups, items, groupType) {
    return result.map((row) => {
            let newRow = {
                ...row
            };
            uniqueGroups.forEach((group) => {
                const groupSums = sumGroupColumnsMoi(row, group, items,groupType);
                newRow = {
                    ...newRow,
                    ...groupSums
                };
            });
            return newRow;
        }
    );
}

const sumGroupColumnsMoi = (row, group, units,groupType) => {
    let result = {};
    for (let i = 0; i <= 12; i++) {
        let sum = 0;
        units.forEach((unit) => {
            if (unit[groupType] === group) {
                const columnName = `${unit.code}_${i}`;
                sum += row[columnName] || 0;
            }
        });
        result[`${group}_${i}`] = sum;
    }
    return result;
}
