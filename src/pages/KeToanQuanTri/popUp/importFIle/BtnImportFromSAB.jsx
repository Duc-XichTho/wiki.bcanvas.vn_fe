import React, {useEffect, useState} from "react";
import {Col, Modal, Row, Select, Typography, Button} from "antd";
import {fetchAndProcessSoKeToanSAB} from "../../../../apis/soketoanService.jsx";
import {getAllTaiKhoanFull} from "../../../../apis/taiKhoanService.jsx";
import {MAPPING_SKT_SAB, MAPPING_VAS_SAB} from "../../../../Consts/MAPPING_SAB.js";
import {uploadSoKeToan, uploadVas} from "./hamTinh.js";
import './BtnImportFromSAB.module.css'
import {Box, LinearProgress} from "@mui/material";
import {toast} from "react-toastify";
import {deleteAllSoKeToanService, deleteSoKeToanByMonth} from "../../../../apisKTQT/soketoanService.jsx";


const BtnImportFromSAB = () => {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const [sktSAB, setSktSAB] = useState([]);
    const [sktSABFiltered, setSktSABFiltered] = useState([]);
    const [vasSABFiltered, setVasSABFiltered] = useState([]);
    const [importSelected, setImportSelected] = useState(null);
    const [tkSAB, setTkSAB] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const loadData = () => {
        fetchAndProcessSoKeToanSAB().then(e => {
            setSktSAB(e);

        });
        getAllTaiKhoanFull().then(e => {
            setVasSABFiltered(e);
        });
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleButtonClick = () => {
        setOpen(true);
    };

    useEffect(() => {
        if (sktSAB.length == 0) {
            loadData();
        }

        let filtered = sktSAB;
        if (selectedOption) {
            if (selectedOption === 'for_month') {
                if (selectedYear && selectedMonth?.length > 0) {
                    if (selectedMonth[0] !== 'all') {
                        filtered = sktSAB.filter(e => selectedMonth.some(m => m == e.month) && e.year == selectedYear);
                    }

                }
            }
            if (selectedOption === 'for_year') {
                if (selectedYear) {
                    filtered = sktSAB.filter(e => e.year == selectedYear);
                }
            }
        }

        setSktSABFiltered(filtered);
    }, [selectedOption, selectedYear, selectedMonth]);

    const handleClose = () => {
        setOpen(false); // Close the modal
        resetSelections(); // Reset selections when closing
    };

    const handleSelectChange = (value) => {
        setSelectedOption(value); // Update selected option
        resetSelections(); // Reset month and year when changing main selection
    };
    const handleSelectImportChange = (value) => {
        setImportSelected(value); // Update selected option
        resetSelections(); // Reset month and year when changing main selection
    };

    const resetSelections = () => {
        setSelectedYear(null);
        setSelectedMonth(null);
    };
    const handleSelectMonth = (value) => {
        console.log(value);

        // Check if 'all' is already selected
        if (value.includes('all')) {
            setSelectedMonth(['all']); // Keep only 'all'
        } else {
            // Add new value to selectedMonth array if it's not already included
            setSelectedMonth(prevState => {
                console.log(prevState);

                if (!Array.isArray(prevState)) {
                    return value; // If somehow it's not an array, start fresh with the new value
                }

                if (!prevState.some(e => e == value)) {
                    return value;
                }

            });
        }
    };


    const handleImportData = async () => {
        try {
            if (importSelected === 'vas') {
                setOpen(false)
                let cleanedDataVAS = []

                for (const item of vasSABFiltered) {
                    const mappedDataVAS = {};
                    MAPPING_VAS_SAB.forEach(mapping => {
                        const key = Object.keys(mapping)[0];
                        const valueKey = mapping[key];
                        mappedDataVAS[key] = item[valueKey];
                    });
                    cleanedDataVAS.push(mappedDataVAS)
                }
                if (cleanedDataVAS.length > 0) {
                    setTotal(cleanedDataVAS.length)
                    await uploadVas(cleanedDataVAS, setIsLoading, setUploadProgress);
                }
            } else if (importSelected === 'skt') {
                setOpen(false)
                let cleanedDataSKT = []
                for (const item of sktSABFiltered) {
                    const mappedDataSKT = {};
                    MAPPING_SKT_SAB.forEach(mapping => {
                        const key = Object.keys(mapping)[0]; // Get the key from the mapping
                        const valueKey = mapping[key]; // Get the corresponding value key
                        mappedDataSKT[key] = item[valueKey]; // Assign value from item to mappedDataSKT
                    });
                    cleanedDataSKT.push(mappedDataSKT)
                }
                if (cleanedDataSKT.length > 0) {
                    setTotal(cleanedDataSKT.length)
                    await uploadSoKeToan(cleanedDataSKT, setIsLoading, setUploadProgress);
                }
            }
            window.location.reload()
        } catch (error) {
            console.error("Lỗi khi nhập dữ liệu:", error);
            alert("Đã xảy ra lỗi khi nhập dữ liệu."); // Notify error
        }
    };
    const deleteAllSoKeToan = async () => {
        try {
            await deleteAllSoKeToanService()
            toast.success("Toàn bộ dữ liệu đã được xóa thành công.");
        } catch (error) {
            toast.error("Lỗi khi xóa toàn bộ dữ liệu.");
        }
    };
    const deleteDataForMonths = async (months, year) => {
        try {
            for (const month of months) {
                await deleteSoKeToanByMonth(month, year)
            }
            toast.success(`Dữ liệu của các tháng ${months.join(", ")} đã được xóa thành công.`);
        } catch (error) {
            toast.error("Lỗi khi xóa dữ liệu.");
        }
    };
    const handleCancelDelete = () => {
        setConfirmDialogOpen(false);
    };
    const handleConfirmDelete = async () => {
        setConfirmDialogOpen(false);

        if (selectedMonth[0] !== 'all') {
            await deleteAllSoKeToan(); // Delete all data
        } else {
            const monthsToDelete = selectedMonth.map(month => month.value);
            await deleteDataForMonths(monthsToDelete, selectedYear); // Delete records by month
        }

        // Now import the new data
        try {
            await handleImportData();
            toast.success("Dữ liệu đã được nhập thành công.");
        } catch (error) {
            toast.error("Lỗi khi nhập dữ liệu.");
        }
    };

    return (
        <>
            {isLoading &&
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        position: 'fixed',
                        width: '100vw',
                        top: 0,
                        left: 0,
                        zIndex: '10000',
                        backgroundColor: 'rgba(255, 255, 255, 0.96)',
                    }}
                >
                    <div>
                        <img src='/loading_moi_2.svg' alt="Loading..." style={{width: '650px', height: '550px'}}/>
                        <div style={{display: "flex", justifyContent: "center", alignItems: "center", width: '100%'}}>
                            {uploadProgress > 0 && (
                                <Box mt={3} sx={{width: "100%"}}>
                                    <LinearProgress variant="determinate" value={uploadProgress} sx={{height: "1em"}}/>
                                    <Typography variant="body2" align="center"
                                                mt={1}>{`${uploadProgress}%`}</Typography>
                                </Box>
                            )}
                        </div>
                    </div>

                </div>
            }

            <Button onClick={handleButtonClick} style={{fontSize : '15px' , width : '120px'}} >SAB Import</Button>

            <Modal
                title={'Import dữ liệu từ SAB vào KTQT'}
                open={open}
                onCancel={handleClose}
                centered
                width={600}
                onOk={(importSelected === 'skt' && selectedMonth?.length > 0) ? () => setConfirmDialogOpen(true) : handleImportData}
                okText={'Import'}
            >

                <Row style={{width: '100%', gap: '10px', display: "flex", justifyContent: "space-between"}}>
                    <Col span={24}>
                        <Typography> Lựa chọn nơi thêm dữ liệu</Typography>
                        <Select
                            value={importSelected} // Single selection for main options
                            allowClear
                            onChange={handleSelectImportChange} // Handle select change
                            style={{width: '100%'}}
                        >
                            <Select.Option value={'skt'}>Sổ kế toán</Select.Option>
                            <Select.Option value={'vas'}>Cân đối phát sinh</Select.Option>
                        </Select>
                    </Col>
                    {
                        importSelected === 'skt' &&
                        <>
                            <Col span={24}>
                                <Typography> Lựa chọn hình thức thêm dữ liệu sổ kế toán</Typography>
                                <Select
                                    value={selectedOption} // Single selection for main options
                                    allowClear
                                    onChange={handleSelectChange} // Handle select change
                                    style={{width: '100%'}}
                                >
                                    <Select.Option value={'add'}>Thêm mới</Select.Option>
                                    <Select.Option value={'for_month'}>Theo tháng</Select.Option>
                                    <Select.Option value={'for_year'}>Theo năm</Select.Option>
                                </Select>
                            </Col>


                            {selectedOption === 'for_month' && (
                                <Col span={11}>
                                    <Typography>Chọn năm</Typography>
                                    <Select

                                        value={selectedYear}
                                        onChange={setSelectedYear}
                                        allowClear
                                        style={{width: '100%'}}
                                    >
                                        {[...Array(11)].map((_, index) => (
                                            <Select.Option key={2022 + index} value={2022 + index}>
                                                {2022 + index}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Col>
                            )}
                            {selectedOption === 'for_month' && selectedYear && (
                                <Col span={11}>
                                    <Typography>Chọn tháng</Typography>
                                    <Select
                                        mode="multiple"
                                        value={selectedMonth}
                                        onChange={handleSelectMonth}
                                        allowClear
                                        style={{width: '100%'}}
                                    >
                                        <Select.Option key={'all'} value={'all'}>
                                            Toàn bộ
                                        </Select.Option>
                                        {[...Array(12)].map((_, index) => (
                                            <Select.Option key={index + 1} value={index + 1}>
                                                Tháng {index + 1}
                                            </Select.Option>
                                        ))}


                                    </Select>
                                </Col>
                            )}
                            {(selectedOption === 'for_year') && (
                                <Col span={24}>
                                    <Typography>Chọn năm</Typography>
                                    <Select
                                        value={selectedYear}
                                        onChange={setSelectedYear}
                                        allowClear
                                        style={{width: '100%'}}
                                    >
                                        {[...Array(11)].map((_, index) => (
                                            <Select.Option key={2022 + index} value={2022 + index}>
                                                {2022 + index}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Col>
                            )}
                        </>
                    }


                </Row>
            </Modal>
            {
                (importSelected === 'skt' && selectedMonth?.length > 0) &&
                <Modal
                    title={'Xác nhận'}
                    open={confirmDialogOpen}
                    onOk={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                    okText={'Xác nhận'}
                    cancelText={'Hủy'}
                >
                    <Typography>{`Thao tác này sẽ xóa toàn dữ liệu tại ${selectedMonth?.length > 0 && selectedMonth[0] === 'all' ? 'toàn bộ tháng' : `các tháng [${selectedMonth.map((e) => `${e}`)}]`} trong năm ${selectedYear} của sổ kế toán`}</Typography>

                </Modal>
            }

        </>
    );
};

export default BtnImportFromSAB;
