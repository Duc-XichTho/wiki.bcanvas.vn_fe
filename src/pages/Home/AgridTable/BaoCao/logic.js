export function calculateNamNay(accounts) {
    // Chuyển danh sách accounts thành một map để truy cập nhanh bằng code
    const accountMap = accounts.reduce((map, account) => {
        map[account.code] = account;
        return map;
    }, {});

    // Hàm tính toán giá trị từ công thức
    function evaluateFormula(formula) {
        // Thay thế các mã code trong formula bằng giá trị nam_nay tương ứng
        const replacedFormula = formula.replace(/[0-9]+/g, (code) => {
            const account = accountMap[code];
            return account ? account.value : 0;
        });
        // Sử dụng eval để tính giá trị công thức
        try {
            return eval(replacedFormula);
        } catch (error) {
            console.error(`Lỗi khi tính toán công thức: ${formula}`, error);
            return 0;
        }
    }

    // Duyệt qua danh sách accounts để tính nam_nay cho các công thức
    accounts.forEach(account => {
        if (account.formula) {
            account.value = evaluateFormula(account.formula);
        }
    });

    return accounts;
}
