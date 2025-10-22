import React, { useContext, useEffect, useState } from 'react';
import { Table, Tag } from 'antd';
import { formatCurrency } from "../../../../../../generalFunction/format.js";
import { MyContext } from "../../../../../../MyContext.jsx";
import { getAllCrossCheck } from "../../../../../../apis/crossCheckService.jsx";
import { getDataFromSheet } from "../../getDataFromSheet.js";

const HistoryResult = () => {
    const [dataSource, setDataSource] = useState([]);
    let { listCompany } = useContext(MyContext);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let rs = []
                const result = await getAllCrossCheck();
                const filteredData = result.filter(item => item.type === 'CrossCheck');
                for (const selectedItem of filteredData) {
                    const data = await getDataFromSheet(selectedItem, listCompany);
                    data.name = selectedItem.name;
                    rs.push(data)
                }
                setDataSource(rs);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu:', error);
            }
        };

        fetchData();
    }, []);

    const columns = [
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Giá trị chính',
            dataIndex: 'valuePrimary',
            key: 'valuePrimary',
            render: (value) => formatCurrency(value)
        },
        {
            title: 'Giá trị đối chiếu',
            dataIndex: 'valueChecking',
            key: 'valueChecking',
            render: (value) => formatCurrency(value)

        },
        {
            title: 'Lệch cho phép',
            dataIndex: 'difference_ratio',
            key: 'difference_ratio',
            render: (value) => value + '%'
        },
        {
            title: 'Lệch thực tế',
            dataIndex: 'ratio',
            key: 'ratio',
            render: (value) => value?.toFixed(2) + "%"
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isOK',
            key: 'isOK',
            width: 100,
            render: (text) => (
                <Tag
                    color={text ? 'green' : 'red'}
                    style={{
                        padding: '3px 12px',
                        fontSize: '12px',
                        width: 'fit-content'
                    }}
                >
                    {text ? 'OK' : 'Lệch'}
                </Tag>
            )
        },
    ];

    return <Table dataSource={dataSource} columns={columns} pagination={{ pageSize: 10 }} />;
};

export default HistoryResult;
