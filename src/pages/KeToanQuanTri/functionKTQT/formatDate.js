import dayjs from 'dayjs';

export const formatDateTime = (dateTimeString) => {
    // if (!dateTimeString) {
    //     return '';
    // }
    //
    // const regex = /^\d{2}-\d{2}-\d{4}$/;
    // if (regex.test(dateTimeString)) {
    //     return dateTimeString;
    // }
    //
    // const date = dayjs(dateTimeString, ['DD/MM/YYYY']);
    // //
    // // if (!date.isValid()) {
    // //     return 'Invalid Date';
    // // }
    //
    // const day = date.format('DD');
    // const month = date.format('MM');
    // const year = date.format('YYYY');
    //
    // return `${day}/${month}/${year}`;
};

export function getCurrentDateTime() {
    const currentDateTime = dayjs();

    const day = currentDateTime.format('DD');
    const month = currentDateTime.format('MM');
    const year = currentDateTime.format('YYYY');
    return `${day}/${month}/${year}`;
}

export function getCurrentDateTimeWithHours() {
    const currentDateTime = dayjs();

    const year = currentDateTime.format('YYYY');
    const month = currentDateTime.format('MM');
    const day = currentDateTime.format('DD');
    const hour = currentDateTime.format('HH');
    const minute = currentDateTime.format('mm');
    const second = currentDateTime.format('ss');
    return `${day}/${month}/${year}-${hour}:${minute}:${second}`;
}
