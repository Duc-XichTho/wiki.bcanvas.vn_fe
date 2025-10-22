import { handleSaveAgl } from "./handleSaveAgl.js";
import {getAllSoKeToan} from "../../../apisKTQT/soketoanService.jsx";
import {createNewVas, getAllVas} from "../../../apisKTQT/vasService.jsx";

// Cập nhật toàn bộ VAS từ Sổ kế toán DEHA
// export async function updateAll() {
//     let updatedVas = [];
//
//     // Lấy toàn bộ dữ liệu Sổ kế toán và VAS
//     const getskt = await getAllSoKeToan();
//     const soKeToanList = getskt || [];
//     const getVas = await getAllVas();
//     let vasList = getVas || [];
//
//     if (!soKeToanList || !vasList) return updatedVas;
//
//     // Kiểm tra và tạo tài khoản nếu cần
//     vasList = await checkAndCreateAccounts(soKeToanList, vasList);
//
//     // Reset tất cả các cột t1_no -> t12_ending_net về 0 cho tất cả các bản ghi VAS
//     vasList.forEach((vas) => {
//         for (let month = 1; month <= 12; month++) {
//             vas[`t${month}_no`] = 0;
//             vas[`t${month}_co`] = 0;
//             vas[`t${month}_ending_no`] = 0;
//             vas[`t${month}_ending_co`] = 0;
//             vas[`t${month}_ending_net`] = 0;
//         }
//     });
//
//     // Duyệt qua từng bản ghi Sổ kế toán để cập nhật dữ liệu vào VAS
//     soKeToanList.forEach((dataSKT) => {
//         const month = dataSKT?.month ? parseInt(dataSKT.month) : null;
//         const company = dataSKT?.company;
//         if (!month || !company) return;  // Bỏ qua bản ghi nếu không có tháng hoặc công ty
//
//         // Cập nhật theo tài khoản nợ và tài khoản có
//         if (dataSKT?.tk_no) {
//             updateVasField(vasList, dataSKT.tk_no, month, dataSKT?.so_tien || 0, 'no', dataSKT?.company, dataSKT?.year);
//         }
//         if (dataSKT?.tk_co) {
//             updateVasField(vasList, dataSKT.tk_co, month, dataSKT?.so_tien || 0, 'co', dataSKT?.company, dataSKT?.year);
//         }
//     });
//
//     // Tính toán lại giá trị kết thúc sau khi cập nhật
//     calculateEndingNetAndTrackChanges(vasList);
//
//     // Lưu lại toàn bộ các thay đổi vào VAS
//     if (vasList.length > 0) {
//         await handleSaveAgl(vasList, 'Vas', null);
//         return vasList;
//     } else {
//         return [];
//     }
// }
//
// // Hàm hỗ trợ để cập nhật từng trường trong VAS
// function updateVasField(vasList, tai_khoan, month, amount, field, company, year) {
//     // Tìm đối tượng `vas` tương ứng và cập nhật nó
//     vasList.forEach(v => {
//         if (v?.ma_tai_khoan == tai_khoan && v?.show && v?.company === company && v?.year == year) {
//             // Sử dụng parseInt để đảm bảo các giá trị là số
//             v[`t${month}_${field}`] = (parseInt(v[`t${month}_${field}`] || 0) + parseInt(amount || 0));
//
//             // Đảm bảo các giá trị không phải null hoặc undefined
//             if (!v[`t${month}_${field}`]) v[`t${month}_${field}`] = 0;
//         }
//     });
// }
//
//
// // Hàm để tính toán lại giá trị kết thúc và theo dõi các thay đổi
// function calculateEndingNetAndTrackChanges(vasList) {
//     vasList.forEach(v => {
//         if (v?.show) {
//             for (let month = 1; month <= 12; month++) {
//                 if (month == 1) {
//                     // Sử dụng parseInt để đảm bảo tính toán chính xác
//                     v.t1_ending_no = parseInt(v?.t1_no || 0) + parseInt(v?.t1_open_no || 0);
//                     v.t1_ending_co = parseInt(v?.t1_co || 0) + parseInt(v?.t1_open_co || 0);
//                 } else {
//                     // Sử dụng parseInt cho các tháng từ 2 đến 12
//                     v[`t${month}_ending_no`] = parseInt(v[`t${month}_no`] || 0) + parseInt(v[`t${month - 1}_ending_no`] || 0);
//                     v[`t${month}_ending_co`] = parseInt(v[`t${month}_co`] || 0) + parseInt(v[`t${month - 1}_ending_co`] || 0);
//                 }
//                 // Tính toán ending_net bằng parseInt
//                 v[`t${month}_ending_net`] = parseInt(v[`t${month}_ending_no`] || 0) - parseInt(v[`t${month}_ending_co`] || 0);
//             }
//         }
//     });
// }
//
// // Hàm kiểm tra và tạo tài khoản mới trong vasList
// const checkAndCreateAccounts = async (soKeToanList, vasList) => {
//     // Tạo một Set để chứa tất cả tk_no và tk_co từ Sổ kế toán, cùng với company
//     let accountSet = new Set();
//     // let soKeToanList = await getAllSoKeToan();
//     // let vasList = await getAllVas();
//     soKeToanList.forEach((dataSKT) => {
//         if (dataSKT.company != null && dataSKT.company !== '') {
//             if (dataSKT?.tk_no && dataSKT?.company) accountSet.add(`${dataSKT.tk_no}/${dataSKT.company}/${dataSKT.year}`);
//             if (dataSKT?.tk_co && dataSKT?.company) accountSet.add(`${dataSKT.tk_co}/${dataSKT.company}/${dataSKT.year}`);
//         }
//     });
//
//     // Duyệt qua accountSet và kiểm tra xem đã có trong vasList chưa
//     for (const account of accountSet) {
//
//         const [tai_khoan, company, year] = account.split('/');
//         const existingVas = vasList.find(v => v?.ma_tai_khoan === tai_khoan && v.company === company && v.year === year);
//
//         // Nếu tài khoản chưa tồn tại trong vasList thì tạo mới
//         if (!existingVas) {
//
//             const newVas = {
//                 ma_tai_khoan: tai_khoan,
//                 company: company,
//                 show: true,  // Đặt show = true theo yêu cầu của logic
//                 year: year,
//                 consol: 'CONSOL',
//                 // Khởi tạo các trường dữ liệu cần thiết cho vas
//                 t1_no: 0, t1_co: 0, t1_ending_no: 0, t1_ending_co: 0, t1_ending_net: 0,
//                 t2_no: 0, t2_co: 0, t2_ending_no: 0, t2_ending_co: 0, t2_ending_net: 0,
//                 t3_no: 0, t3_co: 0, t3_ending_no: 0, t3_ending_co: 0, t3_ending_net: 0,
//                 t4_no: 0, t4_co: 0, t4_ending_no: 0, t4_ending_co: 0, t4_ending_net: 0,
//                 t5_no: 0, t5_co: 0, t5_ending_no: 0, t5_ending_co: 0, t5_ending_net: 0,
//                 t6_no: 0, t6_co: 0, t6_ending_no: 0, t6_ending_co: 0, t6_ending_net: 0,
//                 t7_no: 0, t7_co: 0, t7_ending_no: 0, t7_ending_co: 0, t7_ending_net: 0,
//                 t8_no: 0, t8_co: 0, t8_ending_no: 0, t8_ending_co: 0, t8_ending_net: 0,
//                 t9_no: 0, t9_co: 0, t9_ending_no: 0, t9_ending_co: 0, t9_ending_net: 0,
//                 t10_no: 0, t10_co: 0, t10_ending_no: 0, t10_ending_co: 0, t10_ending_net: 0,
//                 t11_no: 0, t11_co: 0, t11_ending_no: 0, t11_ending_co: 0, t11_ending_net: 0,
//                 t12_no: 0, t12_co: 0, t12_ending_no: 0, t12_ending_co: 0, t12_ending_net: 0,
//             };
//             if (newVas && newVas.ma_tai_khoan !== null && newVas.ma_tai_khoan !== undefined && newVas.ma_tai_khoan !== '') {
//                 createNewVas(newVas).then(e => {
//                     vasList.push(e)
//                 })
//             }
//         }
//     }
//     return vasList
//
// }




// Cập nhật toàn bộ VAS từ Sổ kế toán CG
export async function updateAll() {
    let updatedVas = [];

    // Lấy toàn bộ dữ liệu Sổ kế toán và VAS
    const getskt = await getAllSoKeToan();
    const soKeToanList = getskt || [];
    const getVas = await getAllVas();
    let vasList = getVas || [];

    if (!soKeToanList || !vasList) return updatedVas;

    // Kiểm tra và tạo tài khoản nếu cần
    vasList = await checkAndCreateAccounts(soKeToanList, vasList);

    // Reset tất cả các cột t1_no -> t12_ending_net về 0 cho tất cả các bản ghi VAS
    vasList.forEach((vas) => {
        for (let month = 1; month <= 12; month++) {
            vas[`t${month}_no`] = 0;
            vas[`t${month}_co`] = 0;
            vas[`t${month}_ending_no`] = 0;
            vas[`t${month}_ending_co`] = 0;
            vas[`t${month}_ending_net`] = 0;
        }
    });

    // Duyệt qua từng bản ghi Sổ kế toán để cập nhật dữ liệu vào VAS
    soKeToanList.forEach((dataSKT) => {
        const month = dataSKT?.month ? parseInt(dataSKT.month) : null;
        const year = dataSKT?.year ? parseInt(dataSKT.year) : null;
        const company = dataSKT?.company;
        if (!month || !company || !year) return;

        // Cập nhật theo tài khoản nợ và tài khoản có
        if (dataSKT?.tk_no) {
            updateVasField(vasList, dataSKT.tk_no, month, dataSKT?.ps_no, 'no', company, year);
            updateVasField(vasList, dataSKT.tk_no, month, dataSKT?.ps_co, 'co', company, year);
        }
    });

    // Tính toán lại giá trị kết thúc sau khi cập nhật
    calculateEndingNetAndTrackChanges(vasList);

    // Lưu lại toàn bộ các thay đổi vào VAS
    if (vasList.length > 0) {
        await handleSaveAgl(vasList, 'Vas', null);
        return vasList;
    } else {
        return [];
    }
}

// Hàm hỗ trợ để cập nhật từng trường trong VAS
function updateVasField(vasList, tai_khoan, month, amount, field, company, year) {
    // Tìm đối tượng `vas` tương ứng và cập nhật nó
    vasList.forEach(v => {
        if (v?.ma_tai_khoan == tai_khoan && v?.show && v?.company === company && v.year == year) {
            // Sử dụng parseInt để đảm bảo các giá trị là số
            v[`t${month}_${field}`] = (parseFloat(v[`t${month}_${field}`] || 0) + parseFloat(amount || 0));

            // Đảm bảo các giá trị không phải null hoặc undefined
            if (!v[`t${month}_${field}`]) v[`t${month}_${field}`] = 0;
        }
    });
}


// Hàm để tính toán lại giá trị kết thúc và theo dõi các thay đổi
function calculateEndingNetAndTrackChanges(vasList) {
    vasList.forEach(v => {
        if (v?.show) {
            for (let month = 1; month <= 12; month++) {
                if (month == 1) {
                    // Sử dụng parseFloat để đảm bảo tính toán chính xác
                    v.t1_ending_no = parseFloat(v?.t1_no || 0) + parseFloat(v?.t1_open_no || 0);
                    v.t1_ending_co = parseFloat(v?.t1_co || 0) + parseFloat(v?.t1_open_co || 0);
                } else {
                    // Sử dụng parseFloat cho các tháng từ 2 đến 12
                    v[`t${month}_ending_no`] = parseFloat(v[`t${month}_no`] || 0) + parseFloat(v[`t${month - 1}_ending_no`] || 0);
                    v[`t${month}_ending_co`] = parseFloat(v[`t${month}_co`] || 0) + parseFloat(v[`t${month - 1}_ending_co`] || 0);
                }
                // Tính toán ending_net bằng parseFloat
                v[`t${month}_ending_net`] = parseFloat(v[`t${month}_ending_no`] || 0) - parseFloat(v[`t${month}_ending_co`] || 0);
            }
        }
    });
}

// Hàm kiểm tra và tạo tài khoản mới trong vasList
const checkAndCreateAccounts = async (soKeToanList, vasList) => {
    // Tạo một Set để chứa tất cả tk_no và tk_co từ Sổ kế toán, cùng với company
    let accountSet = new Set();
    // let soKeToanList = await getAllSoKeToan();
    // let vasList = await getAllVas();
    soKeToanList.forEach((dataSKT) => {
        if (dataSKT.company != null && dataSKT.company !== '') {
            if (dataSKT?.tk_no && dataSKT?.company) accountSet.add(`${dataSKT.tk_no}/${dataSKT.company}/${dataSKT.year}`);
            if (dataSKT?.tk_co && dataSKT?.company) accountSet.add(`${dataSKT.tk_co}/${dataSKT.company}/${dataSKT.year}`);
        }
    });

    // Duyệt qua accountSet và kiểm tra xem đã có trong vasList chưa
    for (const account of accountSet) {

        const [tai_khoan, company, year] = account.split('/');
        const existingVas = vasList.find(v => v?.ma_tai_khoan === tai_khoan && v.company === company && v.year === year);

        // Nếu tài khoản chưa tồn tại trong vasList thì tạo mới
        if (!existingVas) {

            const newVas = {
                ma_tai_khoan: tai_khoan,
                company: company,
                show: true,  // Đặt show = true theo yêu cầu của logic
                year: year,
                consol: 'CONSOL',
                // Khởi tạo các trường dữ liệu cần thiết cho vas
                t1_no: 0, t1_co: 0, t1_ending_no: 0, t1_ending_co: 0, t1_ending_net: 0,
                t2_no: 0, t2_co: 0, t2_ending_no: 0, t2_ending_co: 0, t2_ending_net: 0,
                t3_no: 0, t3_co: 0, t3_ending_no: 0, t3_ending_co: 0, t3_ending_net: 0,
                t4_no: 0, t4_co: 0, t4_ending_no: 0, t4_ending_co: 0, t4_ending_net: 0,
                t5_no: 0, t5_co: 0, t5_ending_no: 0, t5_ending_co: 0, t5_ending_net: 0,
                t6_no: 0, t6_co: 0, t6_ending_no: 0, t6_ending_co: 0, t6_ending_net: 0,
                t7_no: 0, t7_co: 0, t7_ending_no: 0, t7_ending_co: 0, t7_ending_net: 0,
                t8_no: 0, t8_co: 0, t8_ending_no: 0, t8_ending_co: 0, t8_ending_net: 0,
                t9_no: 0, t9_co: 0, t9_ending_no: 0, t9_ending_co: 0, t9_ending_net: 0,
                t10_no: 0, t10_co: 0, t10_ending_no: 0, t10_ending_co: 0, t10_ending_net: 0,
                t11_no: 0, t11_co: 0, t11_ending_no: 0, t11_ending_co: 0, t11_ending_net: 0,
                t12_no: 0, t12_co: 0, t12_ending_no: 0, t12_ending_co: 0, t12_ending_net: 0,
            };
            if (newVas && newVas.ma_tai_khoan !== null && newVas.ma_tai_khoan !== undefined && newVas.ma_tai_khoan !== '') {
                createNewVas(newVas).then(e => {
                    vasList.push(e)
                })
            }
        }
    }
    return vasList

}
