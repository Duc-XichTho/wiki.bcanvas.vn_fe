import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import css from './TemplateDKPro.module.css';
import { useParams } from 'react-router-dom';
import { message } from "antd";
import { IconButton, Tooltip } from "@mui/material";
import { EditIconCoLe } from "../../../../../icon/IconSVG";
import { TYPE_SHEET } from '../../../../../Consts/SECTION_TYPE.js';
// COMPONENT
import SettingDkProPopup from './SettingPopup/SettingDkProPopup.jsx';
// AG GRID
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
import AG_GRID_LOCALE_VN from "../../../AgridTable/locale.jsx";
// API
import { getDinhKhoanProDataByStepId, createNewDinhKhoanPro } from '../../../../../apis/dinhKhoanProService.jsx';
import { getAllSheet } from '../../../../../apis/sheetService.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const TemplateDKPro = ({ sub_step_id, listSubStep }) => {
    let { idTemp } = useParams()
    const gridRef = useRef();
    const [formStep, setFormStep] = useState(null);
    const [dinhKhoanProData, setDinhKhoanProData] = useState([]);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const defaultColDef = useMemo(() => {
        return {
            editable: false,
            filter: true,
            suppressMenu: true,
            cellStyle: { fontSize: '13.5px' },
            resizable: false,
        };
    });

    const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

    const getSheetData = async (sheetSubStep) => {
        try {
            const sheetList = await getAllSheet();
            const filteredSheetList = sheetList
                .filter(sheet => sheetSubStep.some(subStep => subStep.id === sheet.sub_step_id))
                .map(sheet => {
                    const matchingSubStep = sheetSubStep.find(subStep => subStep.id === sheet.sub_step_id);
                    return {
                        ...sheet,
                        name: matchingSubStep ? matchingSubStep.name : null,
                    };
                });
            const sheetLists = filteredSheetList.filter(sheet => sheet.card_id == null);
            setFormStep(sheetLists);
        } catch (error) {
            console.log(error);
            // message.error('Lỗi khi lấy dữ liệu');
        }
    };

    useEffect(() => {
        const sheetSubStep = listSubStep.filter(item => item.subStepType == TYPE_SHEET);
        getSheetData(sheetSubStep);
    }, [listSubStep])

    const loadData = async () => {
        const data = [
            {
                id: '001',
                date: '10/12/2024',
                note: 'Diễn giải',
                chuThich: 'Chú thích',
                tkNo: '1111',
                tkCo: '2222',
                soTien: '1,000,000',
                kmf: 'Phí dịch vụ',
                kmtc: 'Chi thường xuyên',
                duAn: 'Dự án A',
                sanPham: 'Sản phẩm X',
                nhaCungCap: 'Nhà cung cấp Y',
                hopDong: 'HD-1',
                khachHang: 'Khách hàng Z',
                employee: 'Nhân viên A',
                unitCode: 'Bussiness Unit',
                hoaDon: 'HD-001',
                taiSan: 'Vật dụng',
                temCode: 'tem-code',
                taiSanDauTu: 'Kinh doanh',
                loaiTien: 'VND',
                nganHang: 'Ngân hàng A',
                chuSoHuu: 'Chính phủ',
                chuongTrinh: 'Chương trình XYZ',
                soTienNguyenTe: '20000',
                fxRate: '0.03',
                soChungTu: 'CT-001',
            }
        ];
        setRowData(data);
    }

    const onGridReady = useCallback(async () => {
        await loadData()
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setColDefs([
                    {
                        field: 'id',
                        headerName: 'STT', width: 90,
                        pinned: 'left',
                    },
                    {
                        field: 'date',
                        headerName: 'Ngày',
                        width: 110,
                    },
                    {
                        field: 'note',
                        headerName: 'Diễn giải',
                        width: 150,
                    },
                    {
                        field: 'chuThich',
                        headerName: 'Chú thích',
                        width: 150,
                    },
                    {
                        field: 'tkNo',
                        headerName: 'Tài khoản nợ',
                        width: 130,
                    },
                    {
                        field: 'tkCo',
                        headerName: 'Tài khoản có',
                        width: 130,
                    },
                    {
                        field: 'soTien',
                        headerName: 'Số tiền',
                        width: 130,
                        valueFormatter: (params) => {
                            return params.value ? params.value.toLocaleString('en-US') : '';
                        },
                        hide: !dinhKhoanProData.showSoTien,
                    },
                    {
                        field: 'kmf',
                        headerName: 'Khoản mục phí',
                        width: 150,
                        hide: !dinhKhoanProData.showKMF
                    },
                    {
                        field: 'kmtc',
                        headerName: 'Khoản mục thu chi',
                        width: 180,
                        hide: !dinhKhoanProData.showKMTC
                    },
                    {
                        field: 'sanPham',
                        headerName: 'Hàng hóa',
                        width: 130,
                        hide: !dinhKhoanProData.showSanPham
                    },
                    {
                        field: 'nhaCungCap',
                        headerName: 'Nhà cung cấp',
                        width: 150,
                        hide: !dinhKhoanProData.showNcc
                    },
                    {
                        field: 'khachHang',
                        headerName: 'Khách hàng',
                        width: 150,
                        hide: !dinhKhoanProData.showKhachHang
                    },
                    {
                        field: 'employee',
                        headerName: 'Nhân viên',
                        width: 150,
                        hide: !dinhKhoanProData.showEmployee
                    },
                    {
                        field: 'duAn',
                        headerName: 'Vụ việc',
                        width: 130,
                        hide: !dinhKhoanProData.showDuAn
                    },
                    {
                        field: 'unitCode',
                        headerName: 'BU',
                        width: 130,
                        hide: !dinhKhoanProData.showUnitCode
                    },
                    {
                        field: 'hoaDon',
                        headerName: 'Hóa đơn',
                        width: 130,
                        hide: !dinhKhoanProData.showHoaDon
                    },
                    {
                        field: 'hopDong',
                        headerName: 'Hợp đồng',
                        width: 130,
                        hide: !dinhKhoanProData.showHopDong
                    },
                    {
                        field: 'taiSan',
                        headerName: 'Tài sản',
                        width: 130,
                        hide: !dinhKhoanProData.showTaiSan
                    },
                    {
                        field: 'temCode',
                        headerName: 'Department',
                        width: 130,
                        hide: !dinhKhoanProData.showTemCode
                    },
                    {
                        field: 'taiSanDauTu',
                        headerName: 'Tài sản đầu tư',
                        width: 130,
                        hide: !dinhKhoanProData.showTaiSanDauTu
                    },
                    {
                        field: 'loaiTien',
                        headerName: 'Loại tiền',
                        width: 130,
                        hide: !dinhKhoanProData.showLoaiTien
                    },
                    {
                        field: 'nganHang',
                        headerName: 'Ngân Hàng',
                        width: 130,
                        hide: !dinhKhoanProData.showNganHang
                    },
                    {
                        field: 'chuSoHuu',
                        headerName: 'Chủ sở hữu',
                        width: 130,
                        hide: !dinhKhoanProData.showChuSoHuu
                    },
                    {
                        field: 'chuongTrinh',
                        headerName: 'Chương trình',
                        width: 130,
                        hide: !dinhKhoanProData.showChuongTrinh
                    },
                    {
                        field: 'soTienNguyenTe',
                        headerName: 'Số tiền nguyên tệ',
                        width: 130,
                        hide: !dinhKhoanProData.showSoTienNguyenTe
                    },
                    {
                        field: 'fxRate',
                        headerName: 'Tỷ giá',
                        width: 130,
                        hide: !dinhKhoanProData.showFxRate
                    },
                    {
                        field: 'soChungTu',
                        headerName: 'Chứng từ',
                        width: 130,
                        hide: !dinhKhoanProData.showSoChungTu
                    },
                ]);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, [rowData, dinhKhoanProData]);

    const sections = [
        {
            value: 'note',
            label: 'Diễn giải',
            settingKey: 'settingChuThich',
            isNote: true
        },
        {
            key: 'showKMF',
            value: 'kmf',
            label: 'Khoản Mục Phí',
            show: dinhKhoanProData.showKMF,
            defaultCategory: 'kmf',
            settingKey: 'settingKMF',
        },
        {
            key: 'showKMTC',
            label: 'Khoản Mục Thu Chi',
            value: 'kmtc',
            show: dinhKhoanProData.showKMTC,
            defaultCategory: 'kmtc',
            settingKey: 'settingKMTC'
        },
        {
            key: 'showDuAn',
            label: 'Dự Án',
            value: 'duAn',
            show: dinhKhoanProData.showDuAn,
            defaultCategory: 'du-an',
            settingKey: 'settingDuAn'
        },
        {
            key: 'showSanPham',
            label: 'Sản Phẩm',
            value: 'sanPham',
            show: dinhKhoanProData.showSanPham,
            defaultCategory: 'san-pham',
            settingKey: 'settingSanPham'
        },
        {
            key: 'showNcc',
            label: 'Nhà Cung Cấp',
            value: 'nhaCungCap',
            show: dinhKhoanProData.showNcc,
            settingKey: 'settingNcc',
            defaultCategory: 'nha-cung-cap',
        },
        {
            key: 'showHopDong',
            label: 'Hợp Đồng',
            value: 'hopDong',
            show: dinhKhoanProData.showHopDong,
            settingKey: 'settingHopDong',
            defaultCategory: 'hop-dong',
        },
        {
            key: 'showKhachHang',
            label: 'Khách Hàng',
            value: 'khachHang',
            show: dinhKhoanProData.showKhachHang,
            settingKey: 'settingKhachHang',
            defaultCategory: 'khach-hang',
        },
        {
            key: 'showEmployee',
            label: 'Nhân viên',
            value: 'employee',
            show: dinhKhoanProData.showEmployee,
            settingKey: 'settingEmployee',
            defaultCategory: 'nhan-vien',
        },
        {
            key: 'showUnitCode',
            label: 'BU',
            value: 'unitCode',
            show: dinhKhoanProData.showUnitCode,
            settingKey: 'settingUnitCode',
            defaultCategory: 'business-unit',
        },
        {
            key: 'showHoaDon',
            label: 'Hóa Đơn',
            value: 'hoaDon',
            show: dinhKhoanProData.showHoaDon,
            settingKey: 'settingHoaDon',
            defaultCategory: 'hoa-don',
        },
        {
            key: 'showTaiSan',
            label: 'Tài Sản',
            value: 'taiSan',
            show: dinhKhoanProData.showTaiSan,
            settingKey: 'settingTaiSan',
            defaultCategory: 'so-quan-ly-tai-san',
        },
        {
            key: 'showTemCode',
            label: 'Department',
            value: 'temCode',
            show: dinhKhoanProData.showTemCode,
            settingKey: 'settingTemCode',
            defaultCategory: 'phong-ban',
        },
        {
            key: 'showTaiSanDauTu',
            label: 'Tài Sản Đầu Tư',
            value: 'taiSanDauTu',
            show: dinhKhoanProData.showTaiSanDauTu,
            settingKey: 'settingTaiSanDauTu',
            defaultCategory: 'tai-san-dau-tu',
        },
        {
            key: 'showLoaiTien',
            label: 'Loại Tiền',
            value: 'loaiTien',
            show: dinhKhoanProData.showLoaiTien,
            settingKey: 'settingLoaiTien',
            defaultCategory: 'loai-tien',
        },
        {
            key: 'showNganHang',
            label: 'Ngân Hàng',
            value: 'nganHang',
            show: dinhKhoanProData.showNganHang,
            settingKey: 'settingNganHang',
            defaultCategory: 'tk-ngan-hang',
        },
        {
            key: 'showChuSoHuu',
            label: 'Chủ Sở Hữu',
            value: 'chuSoHuu',
            show: dinhKhoanProData.showChuSoHuu,
            settingKey: 'settingChuSoHuu',
            defaultCategory: 'chu-so-huu',
        },
        {
            key: 'showChuongTrinh',
            label: 'Chương Trình',
            value: 'chuongTrinh',
            show: dinhKhoanProData.showChuongTrinh,
            settingKey: 'settingChuongTrinh',
            defaultCategory: 'chuong-trinh',
        },
    ];

    const loadDinhKhoanData = async () => {
        try {
            const dinhKhoanPro = await getDinhKhoanProDataByStepId(sub_step_id, 0);
            if (dinhKhoanPro) {
                setDinhKhoanProData(dinhKhoanPro);
            } else {
                let newDKData = {};
                for (const section of sections) {
                    if (section.key) {
                        const data = {
                            id: section['defaultCategory'],
                            type: 'category',
                            field: 'code',
                            defaultValue: '',
                        }
                        newDKData[section['settingKey']] = data;
                    }
                }
                newDKData['sub_step_id'] = sub_step_id;
                const newDK = await createNewDinhKhoanPro(newDKData);
                setDinhKhoanProData(newDK);
            }
        } catch (error) {
            console.error("Failed to load Dinh Khoan data:", error);
            message.error("Failed to load Dinh Khoan data");
        }
    }

    useEffect(() => {
        loadDinhKhoanData();
    }, [sub_step_id]);

    return (
        <div className={css.container}>
            <div className={css.settingsWrapper}>
                <Tooltip title="Cài đặt bảng" >
                    <IconButton onClick={() => setIsSettingsOpen(true)} size="small">
                        <img src={EditIconCoLe} alt="" />
                    </IconButton>
                </Tooltip>

                {isSettingsOpen && dinhKhoanProData && (
                    <SettingDkProPopup
                        dinhKhoanProData={dinhKhoanProData}
                        setDinhKhoanProData={setDinhKhoanProData}
                        onClose={() => setIsSettingsOpen(false)}
                        formStep={formStep}
                        idTemp={idTemp}
                        sections={sections}
                    />
                )}
            </div>
            <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
                <AgGridReact
                    statusBar={statusBar}
                    enableRangeSelection={true}
                    ref={gridRef}
                    rowData={rowData}
                    defaultColDef={defaultColDef}
                    columnDefs={colDefs}
                    rowSelection="multiple"
                    localeText={AG_GRID_LOCALE_VN}
                    onGridReady={onGridReady}
                    suppressContextMenu={true}
                    suppressCellSelection={true}
                    suppressMovableColumns={false}
                />
            </div>
        </div>
    );
};

export default TemplateDKPro;
