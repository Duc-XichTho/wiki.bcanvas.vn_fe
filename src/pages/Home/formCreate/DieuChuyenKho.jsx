import {Col, message, Modal, Row, Select, Typography} from "antd";
import React, {useEffect, useState} from "react";
import {getAllKho} from "../../../apis/khoService.jsx";
import css from './DieuChuyenKho.module.css';
import {getAllHangHoa, getHangHoaDataById} from "../../../apis/hangHoaService.jsx";
import {AgGridReact} from "ag-grid-react";
import {filter} from "../AgridTable/FilterAgrid.jsx";
import {createNewDetailPhieuNhap, getAllDetailPhieuNhap} from "../../../apis/detailPhieuNhapService.jsx";
import {createNewDetailPhieuXuat, getAllDetailPhieuXuat} from "../../../apis/detailPhieuXuatService.jsx";
import {getAllLo} from "../../../apis/loService.jsx";
import {createNewPhieuNhap} from "../../../apis/phieuNhapService.jsx";
import {createNewPhieuXuat} from "../../../apis/phieuXuatService.jsx";
import {getAllNhanVien} from "../../../apis/nhanVienService.jsx";

const DieuChuyenKho = ({open, onClose}) => {
    const [listKho, setListKho] = useState([]);
    const [listProduct, setListProduct] = useState([]);
    const [listProductFrom, setListProductFrom] = useState([]);
    const [listDetailPhieuNhap, setListDetailPhieuNhap] = useState([]);
    const [listDetailPhieuXuat, setListDetailPhieuXuat] = useState([]);
    const [listLo, setListLo] = useState([]);
    const [listNV, setListNV] = useState([]);
    const [columnDefs, setColumnDefs] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const getData = () => {
        getAllKho().then(e => {
            setListKho(e);
        });
        getAllHangHoa().then(e => {
            setListProduct(e)
        })
        getAllDetailPhieuNhap().then(e => {
            setListDetailPhieuNhap(e)
        })
        getAllDetailPhieuXuat().then(e => {
            setListDetailPhieuXuat(e)
        })
        getAllLo().then(e=>{
            setListLo(e)
        })
        getAllNhanVien().then(e=>{
            setListNV(e)
        })
    };

    useEffect(() => {
        getData();
    }, [open]);

    useEffect(() => {

        const columns = [
            {field: 'code', headerName: 'Mã sản phẩm',width: 120, type: 'text', ...filter()},
            {field: 'name', headerName: 'Tên sản phẩm', type: 'text', ...filter()},
            {field: 'lo', headerName: 'Lô', type: 'text', ...filter()},
            {field: 'so_luong_con_lai', headerName: 'Số lượng hiện tại', type: 'number', ...filter()},
            {field: 'so_luong_chuyen_di', headerName: 'Số lượng chuyển đi', type: 'number', pinned: 'right', editable:true, },


        ];
        setColumnDefs(columns);


    }, []);
    const handleFromChange = (value) => {
        setFrom(value);
        // Nếu chọn kho "Từ", thì reset kho "Đến"
        if (value === to) {
            setTo('');
        }

        // Tạo đối tượng để lưu trữ số lượng nhập và xuất theo từng sản phẩm và lô
        const productQuantities = {};

        // Cộng dồn số lượng nhập
        listDetailPhieuNhap.forEach(n => {
            if (n.id_kho === value) {
                const key = `${n.id_hang_hoa}-${n.id_lo}`; // Tạo key duy nhất cho từng sản phẩm và lô
                if (!productQuantities[key]) {
                    productQuantities[key] = { so_luong_nhap: 0, so_luong_xuat: 0, id_hang_hoa: n.id_hang_hoa, id_lo: n.id_lo };
                }
                productQuantities[key].so_luong_nhap += n.so_luong;
            }
        });

        // Cộng dồn số lượng xuất
        listDetailPhieuXuat.forEach(x => {
            if (x.id_kho === value) {
                const key = `${x.id_hang_hoa}-${x.id_lo}`; // Tạo key duy nhất cho từng sản phẩm và lô
                if (!productQuantities[key]) {
                    productQuantities[key] = { so_luong_nhap: 0, so_luong_xuat: 0, id_hang_hoa: x.id_hang_hoa, id_lo: x.id_lo };
                }
                productQuantities[key].so_luong_xuat += x.so_luong;
            }
        });

        // Tạo danh sách sản phẩm với số lượng còn lại theo từng lô
        const products = Object.values(productQuantities).map(({ id_hang_hoa, id_lo, so_luong_nhap, so_luong_xuat }) => ({
            id_hang_hoa,
            code: listProduct.find(e => e.id === id_hang_hoa)?.code,
            name: listProduct.find(e => e.id === id_hang_hoa)?.name,
            lo: listLo.find(e => e.id === id_lo)?.code,
            so_luong_con_lai: so_luong_nhap - so_luong_xuat
        }));

        setListProductFrom(products);
    };



    const handleToChange = (value) => {
        setTo(value);
        // Nếu chọn kho "Đến", thì reset kho "Từ"
        if (value === from) {
            setFrom('');
        }
    };
    const handleEmployeeChange = (value) => {
        setSelectedEmployee(value);
    };

    const handleDieuChuyen = async () => {
        // Gather data for PhieuXuat and PhieuNhap
        const phieuXuatDetails = listProductFrom.map(product => ({
            id_hang_hoa: product.id_hang_hoa,
            id_lo: product.lo,
            so_luong: parseInt(product.so_luong_chuyen_di) || 0,
        })).filter(detail => detail.so_luong > 0);

        const phieuNhapDetails = listProductFrom.map(product => ({
            id_hang_hoa: product.id_hang_hoa,
            id_lo: product.lo,
            so_luong: parseInt(product.so_luong_chuyen_di) || 0,
        })).filter(detail => detail.so_luong > 0);

        // Validate employee selection
        if (!selectedEmployee) {
            message.error('Nhân viên chưa được chọn.');
            return;
        }

        // Validate details
        if (phieuXuatDetails.length === 0 || phieuNhapDetails.length === 0) {
            message.error('Không có sản phẩm nào để chuyển.');
            return;
        }

        const phieuXuatData = {
            id_kho: from,
            id_nhan_vien: selectedEmployee,
            details: phieuXuatDetails,
        };

        const phieuNhapData = {
            id_kho: to,
            id_nhan_vien: selectedEmployee,
            details: phieuNhapDetails,
        };

        try {
            // Create PhieuXuat
            const phieuXuatResponse = await createNewPhieuXuat(phieuXuatData);
            console.log('Phieu Xuat created:', phieuXuatResponse);

            // Create PhieuNhap
            const phieuNhapResponse = await createNewPhieuNhap(phieuNhapData);
            console.log('Phieu Nhap created:', phieuNhapResponse);

            // Continue with detail creation...
            const phieuXuatId = phieuXuatResponse.data.id;
            const phieuNhapId = phieuNhapResponse.data.id;

            // Tạo chi tiết cho Phiếu Xuất
            await Promise.all(
                phieuXuatDetails.map(product => {
                    console.log(product)
                    const detailData = {
                        id_phieu_xuat: phieuXuatId,
                        id_hang_hoa: product.id_hang_hoa,
                        id_lo: listLo.find(e => e.code == product.id_lo)?.id, // Ensure we get the correct ID
                        id_kho: parseInt(from) ,
                        so_luong: parseInt(product?.so_luong), // Ensure it's a number
                    };
                    return createNewDetailPhieuXuat(detailData).then(e=> {
                        console.log(e)});
                })
            );

            // Tạo chi tiết cho Phiếu Nhập
            await Promise.all(
                phieuNhapDetails.map(product => {
                    const detailData = {
                        id_phieu_nhap: phieuNhapId,
                        id_hang_hoa: product.id_hang_hoa,
                        id_lo: listLo.find(e => e.code == product.id_lo)?.id,
                        id_kho: parseInt(to) ,
                        so_luong: parseInt(product?.so_luong),
                    };
                    return createNewDetailPhieuNhap(detailData).then(e=> {
                        console.log(e)});
                })
            );

            // Refresh data or close modal
            getData();
            onClose();
        } catch (error) {
            console.error('Error creating PhieuNhap or PhieuXuat:', error.response ? error.response.data : error.message);
        }
    };





    return (
        <Modal
            title={"Điều chuyển kho"}
            open={open}
            onCancel={onClose}
            centered
            width={1200}
            bodyStyle={{ height: '700px', overflowY: 'auto' }}
        >

            <div style={{width: '100%', display: 'flex', gap: '20px'}}>
                {/* First Row with two Selects */}
                <div style={{width: '300px'}}>
                    <Typography>Từ kho</Typography>
                    <Select
                        style={{width: '100%'}}
                        className={css.select_kho}
                        value={from}
                        onChange={handleFromChange}
                        showSearch
                        allowClear
                    >
                        {listKho.filter(item => item.id !== to).map((item) =>
                            <Select.Option key={item.id} value={item.id}>
                                {`${item?.code} | ${item?.name}`}
                            </Select.Option>
                        )}
                    </Select>
                </div>
                <div style={{width: '300px'}}>
                    <Typography>Đến kho</Typography>
                    <Select
                        style={{width: '100%'}}
                        className={css.select_kho}
                        value={to}
                        onChange={handleToChange}
                        showSearch
                        allowClear
                    >
                        {listKho.filter(item => item.id !== from).map((item) =>
                            <Select.Option key={item.id} value={item.id}>
                                {`${item?.code} | ${item?.name}`}
                            </Select.Option>
                        )}
                    </Select>
                </div>
            </div>

            {/* Second Row with Employee Select */}
                <div style={{ marginTop: '20px' }}>
                    <div style={{width: '300px'}}>
                        <Typography>Nhân viên</Typography>
                        <Select
                            style={{width: '100%'}}
                            className={css.select_kho}
                            value={selectedEmployee}
                            onChange={handleEmployeeChange}
                            showSearch
                            allowClear
                        >
                            {listNV.map((item) =>
                                <Select.Option key={item.id} value={item.id}>
                                    {`${item?.code} | ${item?.name}`}
                                </Select.Option>
                            )}
                        </Select>
                    </div>
                </div>

            {/* AgGrid Section */}
                <Row aria-colspan={12}>
                    <div className="ag-theme-quartz" style={{ height: '450px', width: '100%', marginTop: '20px' }}>
                        <AgGridReact
                            columnDefs={columnDefs}
                            rowData={listProductFrom}
                            enableRangeSelection
                        />
                    </div>
                </Row>

        </Modal>
    );
};

export default DieuChuyenKho;
