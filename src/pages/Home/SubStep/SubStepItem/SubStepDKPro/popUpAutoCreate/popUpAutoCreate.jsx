import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import css from './popUpAutoCreate.module.css';
// API
import { getAllSheetColumnBySheetId } from '../../../../../../apis/sheetColumnService';

const PopupAutoCreateRenderer = ({ sub_step_id, idCard, formStep, onClose }) => {
    const [colList, setColList] = useState([]);
    const [sheetList, setSheetList] = useState([]);

    const getData = async () => {
        console.log(sub_step_id, idCard)
    }

    const getDropDownData = async () => {
        try {
            let sheets = [];
            const results = await Promise.all(
                formStep.map(async (item) => {
                    sheets.push({
                        id: item.id,
                        name: item.name
                    });
                    const sheetColumnList = await getAllSheetColumnBySheetId(item.id);
                    return sheetColumnList.map((sheetCol) => ({
                        key: `${item.name} - ${sheetCol.name}`,
                        value: sheetCol.id,
                    }));
                })
            );
            const updatedColList = results.flat();
            console.log(sheets);
            setSheetList(sheets);
            setColList(updatedColList);
        } catch (error) {
            console.error(error);
            message.error('Error fetching data');
        }
    };

    useEffect(() => {
        getData();
    }, [])

    useEffect(() => {
        getDropDownData();
    }, [formStep]);

    return (
        <div></div>
    )
};

export default PopupAutoCreateRenderer;