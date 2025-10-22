import {calculateDataKQKDFS, calculateDataViewKQKDFS2} from "../../pages/KeToanQuanTri/BaoCao/logic/logicKQKDFS.js";
import {getAllKmf} from "../../apisKTQT/kmfService.jsx";
import {getAllUnits} from "../../apisKTQT/unitService.jsx";
import {calculateData3} from "../../pages/KeToanQuanTri/BaoCao/KQKD/logicKQKDKieuC.js";
import {calculateData, calculateDataView2} from "../../pages/KeToanQuanTri/BaoCao/KQKD/logicKQKD.js";
import {getAllProduct} from "../../apisKTQT/productService.jsx";
import {getAllProject} from "../../apisKTQT/projectService.jsx";
import {getAllKenh} from "../../apisKTQT/kenhService.jsx";
import {getAllVas} from "../../apisKTQT/vasService.jsx";
import {loadBCCCTC} from "../../pages/KeToanQuanTri/BaoCao/CDTC/logicBCCDTC.js";
import {getAllKmns} from "../../apisKTQT/kmnsService.jsx";
import {calculateBCTC} from "../../pages/KeToanQuanTri/BaoCao/ThuChi/LogicBaoCaoThiChi.js";
import {setItemInIndexedDB2} from "../../pages/KeToanQuanTri/storage/storageService.js";

let listYear = ['2024', '2025']

export async function calKQKD(dataSKT, listCom) {
    listCom = [...listCom, 'HQ'];
    let data = dataSKT.filter((e) => e.consol?.toLowerCase() == 'consol');
    let allResult = {}

    let uniqueKMF = await getAllKmf();
    uniqueKMF = uniqueKMF.reduce((acc, current) => {
        if (!acc.find((unit) => unit.name === current.name)) {
            acc.push(current);
        }
        return acc;
    }, []);

    let vasList = await getAllVas();
    vasList = vasList.filter(e => e.consol?.toLowerCase() == 'consol');

    let kmnsList = await getAllKmns();

    for (const year of listYear) {
        let dataYear = data.filter((e) => e.year == year);
        let vasListYear = vasList.filter(e => e.year == year);
        for (const com of listCom) {
            let dataCompany = dataYear;

            let vasListCompany = vasListYear;
            if (com !== 'HQ') {
                dataCompany = dataYear.filter(e => e.company == com);
                vasListCompany = vasListYear.filter(e => e.company == com);
            }
            // allResult[`TONGQUAT_${year}_${com}_1`] = calculateDataKQKDFS(dataCompany, uniqueKMF, 12);
            allResult[`TONGQUAT_${year}_${com}`] = calculateDataViewKQKDFS2(dataCompany, uniqueKMF, 12);
            allResult[`CANDOI_TAICHINH_${year}_${com}`] = loadBCCCTC(vasList, 12)
            allResult[`DONGTIEN_${year}_${com}`] = calculateBCTC(dataCompany, kmnsList, vasListCompany, 12);
        }
        await calDataKQKDUnit(allResult, dataYear, uniqueKMF, year)
        await calDataKQKDProduct(allResult, dataYear, uniqueKMF, year)
        await calDataKQKDVV(allResult, dataYear, uniqueKMF, year)
        await calDataKQKDKenh(allResult, dataYear, uniqueKMF, year)
    }
    await setItemInIndexedDB2('allResult', allResult)
    return allResult
}

function sumGroupColumns(row, group, units) {
    let result = {};
    for (let i = 0; i <= 12; i++) {
        let sum = 0;
        units.forEach((unit) => {
            if (unit.group === group) {
                const columnName = `${unit.code}_${i}`;
                sum += row[columnName] || 0;
            }
        });
        result[`${group}_${i}`] = sum;
    }
    return result;
}

async function calDataKQKDUnit(allResult, dataYear, uniqueKMF, year) {
    let units = await getAllUnits();
    const uniqueGroups = [...new Set(units.map((unit) => unit.group))];
    const uniqueUnits = units.reduce((acc, current) => {
        if (!acc.find((unit) => unit.code === current.code)) {
            acc.push(current);
        }
        return acc;
    }, []);

    // let dataUnits3 = calculateData3(dataYear, units, uniqueKMF, 'code', 'unit_code2', 'PBDV', 'teams');
    let dataUnits2 = calculateDataView2(dataYear, units, uniqueKMF, 'code', 'unit_code2', 'PBDV', 'teams');
    // let dataUnits1 = calculateData(dataYear, units, uniqueKMF, 'code', 'unit_code2', 'PBDV', 'teams');
    // allResult[`KQKD_NHOMDV_${year}_1`] = dataUnits1.map((row) => {
    //     let newRow = {...row};
    //     uniqueGroups.forEach((group) => {
    //         const groupSums = sumGroupColumns(row, group, uniqueUnits);
    //         newRow = {...newRow, ...groupSums};
    //     });
    //     return newRow;
    // });
    allResult[`KQKD_NHOMDV_${year}`] = dataUnits2.map((row) => {
        let newRow = {...row};
        uniqueGroups.forEach((group) => {
            const groupSums = sumGroupColumns(row, group, uniqueUnits);
            newRow = {...newRow, ...groupSums};
        });
        return newRow;
    });
    // allResult[`KQKD_NHOMDV_${year}_3`] = dataUnits3.map((row) => {
    //     let newRow = {...row};
    //     uniqueGroups.forEach((group) => {
    //         const groupSums = sumGroupColumns(row, group, uniqueUnits);
    //         newRow = {...newRow, ...groupSums};
    //     });
    //     return newRow;
    // });
}

async function calDataKQKDProduct(allResult, dataYear, uniqueKMF, year) {
    let units = await getAllProduct();
    const uniqueGroups = [...new Set(units.map((unit) => unit.group))];
    const uniqueUnits = units.reduce((acc, current) => {
        if (!acc.find((unit) => unit.code === current.code)) {
            acc.push(current);
        }
        return acc;
    }, []);

    let dataUnits2 = calculateDataView2(dataYear, uniqueUnits, uniqueKMF, 'code', 'product2', 'PBSP', 'teams');
    // let dataUnits1 = calculateData(dataYear, uniqueUnits, uniqueKMF, 'code', 'product2', 'PBSP', 'teams');
    // allResult[`KQKD_NHOMSP_${year}_1`] = dataUnits1.map((row) => {
    //     let newRow = {...row};
    //     uniqueGroups.forEach((group) => {
    //         const groupSums = sumGroupColumns(row, group, uniqueUnits);
    //         newRow = {...newRow, ...groupSums};
    //     });
    //     return newRow;
    // });
    allResult[`KQKD_NHOMSP_${year}`] = dataUnits2.map((row) => {
        let newRow = {...row};
        uniqueGroups.forEach((group) => {
            const groupSums = sumGroupColumns(row, group, uniqueUnits);
            newRow = {...newRow, ...groupSums};
        });
        return newRow;
    });
}

async function calDataKQKDVV(allResult, dataYear, uniqueKMF, year) {
    let units = await getAllProject();
    const uniqueGroups = [...new Set(units.map((unit) => unit.group))];
    const uniqueUnits = units.reduce((acc, current) => {
        if (!acc.find((unit) => unit.code === current.code)) {
            acc.push(current);
        }
        return acc;
    }, []);

    let dataUnits2 = calculateDataView2(dataYear, uniqueUnits, uniqueKMF, 'code', 'project2', 'PBPROJECT', 'teams');
    // let dataUnits1 = calculateData(dataYear, uniqueUnits, uniqueKMF, 'code', 'project2', 'PBPROJECT', 'teams');
    // allResult[`KQKD_NHOMVV_${year}_1`] = dataUnits1.map((row) => {
    //     let newRow = {...row};
    //     uniqueGroups.forEach((group) => {
    //         const groupSums = sumGroupColumns(row, group, uniqueUnits);
    //         newRow = {...newRow, ...groupSums};
    //     });
    //     return newRow;
    // });
    allResult[`KQKD_NHOMVV_${year}`] = dataUnits2.map((row) => {
        let newRow = {...row};
        uniqueGroups.forEach((group) => {
            const groupSums = sumGroupColumns(row, group, uniqueUnits);
            newRow = {...newRow, ...groupSums};
        });
        return newRow;
    });
}

async function calDataKQKDKenh(allResult, dataYear, uniqueKMF, year) {
    let units = await getAllKenh();
    const uniqueGroups = [...new Set(units.map((unit) => unit.group))];
    const uniqueUnits = units.reduce((acc, current) => {
        if (!acc.find((unit) => unit.code === current.code)) {
            acc.push(current);
        }
        return acc;
    }, []);

    let dataUnits2 = calculateDataView2(dataYear, uniqueUnits, uniqueKMF, 'code', 'kenh2', 'PBKENH', 'teams');
    // let dataUnits1 = calculateData(dataYear, uniqueUnits, uniqueKMF, 'code', 'kenh2', 'PBKENH', 'teams');
    // allResult[`KQKD_NHOMK_${year}_1`] = dataUnits1.map((row) => {
    //     let newRow = {...row};
    //     uniqueGroups.forEach((group) => {
    //         const groupSums = sumGroupColumns(row, group, uniqueUnits);
    //         newRow = {...newRow, ...groupSums};
    //     });
    //     return newRow;
    // });
    allResult[`KQKD_NHOMK_${year}`] = dataUnits2.map((row) => {
        let newRow = {...row};
        uniqueGroups.forEach((group) => {
            const groupSums = sumGroupColumns(row, group, uniqueUnits);
            newRow = {...newRow, ...groupSums};
        });
        return newRow;
    });
}
