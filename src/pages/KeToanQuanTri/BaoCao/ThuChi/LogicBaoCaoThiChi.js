import {calculateTotal} from "../../../Home/AgridTable/SoLieu/CDPS/logicCDPS.js";

export function calculateBCTC(soKeToanList, kmnsList, vasList, currentMonth) {
  soKeToanList = soKeToanList.filter((e) => e.phan_loai !== 'DE');
  kmnsList = kmnsList.reduce((acc, current) => {
    if (!acc.find((unit) => unit.name === current.name)) {
      acc.push(current);
    }
    return acc;
  }, []);
  let headerList = [...new Set(kmnsList?.map((item) => item?.mo_ta))];
  headerList = headerList
    .filter((item) => item?.includes('.'))
    .map((item) => {
      let [refercode, header] = item.split('.');
      return { mo_ta: item, header, refercode: parseInt(refercode) + 1 + '' };
    });
  headerList = headerList.sort((a, b) => a.refercode - b.refercode);
  let rowDataList = [
    { header: 'Dư đầu kỳ', mo_ta: null, refercode: '1' },
    ...headerList,
    { header: 'Dư cuối kỳ', mo_ta: null, refercode: '100' },
  ];
  const uniqueRefercodes = rowDataList.map((item) => item.refercode);
  const uniqueRefercodesUnHave1000 = uniqueRefercodes;
  uniqueRefercodesUnHave1000.pop();
  rowDataList.forEach((row) => {
    let counter = 1;
    kmnsList.forEach((item) => {
      if (item.mo_ta === row.mo_ta) {
        rowDataList.push({ header: item.name, refercode: `${row.refercode}.${counter++}` });
      }
    });
  });
  for (let i = 0; i < rowDataList.length; i++) {
    for (let x = 1; x <= 12; x++) {
      rowDataList[i][`t${x}_thuchien`] = 0;
      rowDataList[i][`t${x}_chenhlech`] = 0;
    }
  }
  for (let i = 0; i < rowDataList.length; i++) {
    let header = rowDataList[i].header;
    for (let x = 1; x <= 12; x++) {
      if (!rowDataList[i][`t${x}_thuchien`]) {
        rowDataList[i][`t${x}_thuchien`] = 0;
      }
    }
    for (let j = 0; j < soKeToanList.length; j++) {
      if (soKeToanList[j].kmns === header) {
        let month = parseInt(soKeToanList[j].month, 10);
        let cashValue = parseFloat(soKeToanList[j].cash_value || 0);
        rowDataList[i][`t${month}_thuchien`] += cashValue;
      }
    }
  }
  let refercodeIndex = 1;
  for (let i = 0; i < vasList.length; i++) {
    if (vasList[i].ma_tai_khoan && vasList[i].ma_tai_khoan.startsWith('11')) {
      let newRow = {
        header: vasList[i].ten_tai_khoan,
        mo_ta: vasList[i].ma_tai_khoan,
        refercode: `1.${refercodeIndex}`,
      };
      refercodeIndex++;
      for (let x = 1; x <= 12; x++) {
        if (x === 1) {
          newRow[`t${x}_thuchien`] = vasList[i][`t1_open_net`];
        } else {
          newRow[`t${x}_thuchien`] = vasList[i][`t${x - 1}_ending_net`];
        }
      }
      rowDataList.push(newRow);
    }
  }
  const calculateSums = (data, parentRefercode) => {
    const parentObj = data.find((obj) => obj.refercode === parentRefercode);
    if (!parentObj) return;
    const childObjects = data.filter((obj) => obj.refercode.startsWith(`${parentRefercode}.`));
    for (let i = 1; i <= 12; i++) {
      parentObj[`t${i}_thuchien`] = childObjects.reduce((sum, child) => sum + Number(child[`t${i}_thuchien`] || 0), 0);
      if (parentRefercode === '1') {
        continue;
      }
      parentObj[`t${i}_chenhlech`] = childObjects.reduce(
        (sum, child) => sum + Number(child[`t${i}_chenhlech`] || 0),
        0
      );
    }
  };

  uniqueRefercodes.forEach((refercode) => calculateSums(rowDataList, refercode));
  rowDataList.forEach((item) => {
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      let key = `t${i}_thuchien`;
      if (item[key]) {
        total += +item[key];
      }
    }
    item.t0_thuchien = total;
  });
  rowDataList.forEach((obj) => {
    obj.change = [];
    for (let i = 1; i <= currentMonth; i++) {
      if (obj.refercode.startsWith('3')) {
        obj.change.push(Math.abs(+obj[`t${i}_thuchien`]));
      } else {
        obj.change.push(+obj[`t${i}_thuchien`]);
      }
    }
    obj.avg = (
      +(
        +obj[`t${currentMonth}_thuchien`] +
        +obj[`t${currentMonth - 2}_thuchien`] +
        +obj[`t${currentMonth - 1}_thuchien`]
      ) / 3
    ).toFixed(0);
  });
  let cuoiKy = rowDataList.find(item => item.refercode == 100);
  let unCuoiKy = rowDataList.filter(item=> !item.refercode.includes('.') && item.refercode !== '100')
  for (let i = 1; i <= 12 ; i++) {
    let key = `t${i}_thuchien`;
    cuoiKy[key] = calculateTotal(unCuoiKy, key);
  }
  return rowDataList;
}
