export const SortMoi =()=> {
    return {
        comparator: (valueA, valueB) => {
            // Loại bỏ các ký tự không phải là số và dấu chấm hoặc dấu trừ khỏi chuỗi
            let a = parseFloat(valueA?.replace(/[^\d.-]/g, ''));
            let b = parseFloat(valueB?.replace(/[^\d.-]/g, ''));

            // Kiểm tra nếu một trong hai giá trị là NaN
            const isANaN = isNaN(a);
            const isBNaN = isNaN(b);

            // Nếu cả hai đều là NaN, chúng được xem là bằng nhau
            if (isANaN && isBNaN) {
                return 0;
            }

            // Nếu a là NaN, đặt nó ở cuối
            if (isANaN) {
                return 1;
            }

            // Nếu b là NaN, đặt nó ở cuối
            if (isBNaN) {
                return -1;
            }

            // Sắp xếp theo giá trị số
            return a - b;
        },
    };
}
