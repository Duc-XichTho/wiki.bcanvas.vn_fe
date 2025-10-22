import * as React from 'react';
import { useEffect, useState } from 'react';
import {LoadingOutlined, MoreOutlined} from '@ant-design/icons';
import {Dropdown, Menu, message, Modal, Select, Typography, Button} from "antd";
import {createNewVas,getAllVas, updateVas} from "../../../apisKTQT/vasService.jsx";

export default function UpdateOB() {
    const [yearOB, setYearOB] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [yearSelected, setYearSelected] = useState(false);
    const [isMenuOpen,setIsMenuOpen] = useState(false)

    useEffect(() => {
        // Lấy dữ liệu và xử lý danh sách năm
        getAllVas().then(e => {
            let listYear = [...new Set(e.map(e => parseInt(e.year)))];
            const maxYear = Math.max(...listYear);
            listYear.push(maxYear + 1); // Thêm năm lớn hơn
            setYearOB(listYear.sort((a, b) => a - b));
        });
    }, []);

    const handleOpenModal = () => {
        setIsModalOpen(true); // Mở Modal
    };

    const handleCloseModal = () => {
        setIsModalOpen(false); // Đóng Modal
    };
    const handleCaculate = async () => {
        if (!yearSelected) {
            message.warning('Chưa chọn năm!');
            return;
        }

        try {
            const vas = await getAllVas();
            const filterVasLastYear = vas.filter(e => e.year == (yearSelected - 1));
            const filterVasSelectedYear = vas.filter(e => e.year == yearSelected);

            // Lặp qua từng bản ghi của năm trước
            for (const recordLastYear of filterVasLastYear) {
                // Kiểm tra xem bản ghi này có tồn tại trong danh sách năm được chọn không
                const matchingRecord = filterVasSelectedYear.find(
                    record => record.ma_tai_khoan == recordLastYear.ma_tai_khoan && record.company == recordLastYear.company
                );

                if (!matchingRecord) {
                    // Nếu không tồn tại, tạo mới bản ghi cho năm được chọn
                    const newRecord = {
                        year: yearSelected,
                        ma_tai_khoan: recordLastYear.ma_tai_khoan,
                        ten_tai_khoan: recordLastYear.ten_tai_khoan,
                        t1_open_no: recordLastYear.t12_ending_no,
                        t1_open_co: recordLastYear.t12_ending_co,
                        t1_open_net: recordLastYear.t12_ending_net,
                        ma_chi_tieu: recordLastYear.ma_chi_tieu,
                        phan_loai: recordLastYear.phan_loai,
                        chu_thich_tai_khoan: recordLastYear.chu_thich_tai_khoan,
                        kc_no: recordLastYear.kc_no,
                        kc_co: recordLastYear.kc_co,
                        kc_net: recordLastYear.kc_net,
                        kc_net2: recordLastYear.kc_net2,
                        consol: recordLastYear.consol,
                        dp: recordLastYear.dp,
                        company: recordLastYear.company,
                    };

                    // Gửi yêu cầu tạo mới bản ghi
                    await createNewVas(newRecord)
                } else {

                    const updatedRecord = {
                        ...matchingRecord,
                        t1_open_no: recordLastYear.t12_ending_no,
                        t1_open_co: recordLastYear.t12_ending_co,
                        t1_open_net: recordLastYear.t12_ending_net,
                        ma_chi_tieu: recordLastYear.ma_chi_tieu,
                        phan_loai: recordLastYear.phan_loai,
                        chu_thich_tai_khoan: recordLastYear.chu_thich_tai_khoan,
                        kc_no: recordLastYear.kc_no,
                        kc_co: recordLastYear.kc_co,
                        kc_net: recordLastYear.kc_net,
                        kc_net2: recordLastYear.kc_net2,
                        consol: recordLastYear.consol,
                        dp: recordLastYear.dp,
                        company: recordLastYear.company,
                    };

                    // Gửi yêu cầu cập nhật bản ghi
                    await updateVas(updatedRecord)

                }

            }

            message.success('Hoàn thành tính toán và cập nhật dữ liệu!');
            setTimeout(()=>{
                window.location.reload()
            },500)
        } catch (error) {
            console.error('Error in handleCaculate:', error);
            message.error('Có lỗi xảy ra khi tính toán và cập nhật dữ liệu!');
        }
    };

    const menuItems = [
        {
            key: '1',
            label: (
                <Button
                    id="basic-button"
                    aria-controls={isModalOpen ? 'basic-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={isModalOpen ? 'true' : undefined}
                    onClick={handleOpenModal}
                    // sx={{ color: '#454545', textTransform: 'none' }}
                >

                    <LoadingOutlined /> Cập nhật đầu kỳ Vas

                </Button>
            ),
        },
    ];
    return (
        <div>
            {/*<Dropdown*/}
            {/*    overlay={<Menu items={menuItems} />}*/}
            {/*    trigger={['click']}*/}
            {/*    onOpenChange={(open) => setIsMenuOpen(open)}*/}
            {/*>*/}
            {/*    <Button>*/}
            {/*        <MoreOutlined />*/}
            {/*    </Button>*/}
            {/*</Dropdown>*/}

            {/*<Modal*/}
            {/*    open={isModalOpen}*/}
            {/*    onCancel={handleCloseModal}*/}
            {/*    width={500}*/}
            {/*    title={'Tính toán đầu kỳ'}*/}
            {/*    onOk={handleCaculate}*/}
            {/*>*/}
            {/*    <Typography style={{color: 'red'}}>Lưu ý: Thao tác này sẽ đặt lại toàn bộ số đầu kỳ của năm được chọn</Typography>*/}
            {/*    <Typography>Chọn năm</Typography>*/}
            {/*    <Select style={{ width: '100%' }} placeholder="Chọn năm" onChange={(e)=>setYearSelected(e)} allowClear>*/}
            {/*        {yearOB?.map((year, index) => (*/}
            {/*            <Select.Option key={index} value={year}>*/}
            {/*                {year}*/}
            {/*            </Select.Option>*/}
            {/*        ))}*/}
            {/*    </Select>*/}
            {/*</Modal>*/}
        </div>
    );
}
