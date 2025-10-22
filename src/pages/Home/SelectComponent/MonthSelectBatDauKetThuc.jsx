import * as React from 'react';
import {useContext, useState} from 'react';
import {DatePicker} from 'antd';
import dayjs from 'dayjs';
import {MyContext} from "../../../MyContext.jsx";

const {RangePicker} = DatePicker;

export default function MonthSelectBatDauKetThuc({ setStartMonth , setEndMonth}) {
    const {currentYear} = useContext(MyContext)
    const [dateRange, setDateRange] = useState([dayjs(`${currentYear}-01-01`), dayjs(`${currentYear}-12-31`)]);

    const handleMonthChange = (dates) => {
        if (dates) {
            const value = dates.map(date => (date ? date.startOf('month').toISOString() : null))
            setDateRange(value);
            const formattedMonths = value.map(date => dayjs(date).format('MM'));
            setStartMonth(formattedMonths[0])
            setEndMonth(formattedMonths[1])
        } else {
            setDateRange([null, null]);
        }
    };
    const disabledDate = (current) => {
        if (!current) return false;
        return current.year() != currentYear;
    };


    return (
        <>
            <RangePicker
                size="middle"
                format="MM/YYYY"
                value={dateRange.map(date => (date ? dayjs(date) : null))}
                onChange={handleMonthChange}
                picker="month"
                disabledDate={disabledDate}
                style={{ width: '200px' }}
            />
        </>
    );
}
