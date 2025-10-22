import css from './PhieuNhapXuat.module.css'
import {useEffect, useState} from 'react'
import {Descriptions, Menu, Table} from "antd";
import {getFullPhieuNhap, getFullPhieuXuat} from '../../../../apis/phieuNhapXuatService'

const PhieuNhapXuat = () => {
    const [dataPhieuXuat, setDataPhieuXuat] = useState([])
    const [dataPhieuNhap, setDataPhieuNhap] = useState([])
    const [tabCurrent, setTabCurrent] = useState('phieu_nhap');
    const [menuCurrent, setMenuCurrent] = useState(null);

    const handleClickTab = (e) => {
        setTabCurrent(e.key);
    };

    const handleClickMenu = (e) => {
        if (tabCurrent === 'phieu_nhap') {
            const selected = dataPhieuNhap.find((phieuNhap) => phieuNhap.id_phieu_nhap == e.key.slice(3));
            setMenuCurrent(selected);
        } else if (tabCurrent === 'phieu_xuat') {
            const selected = dataPhieuXuat.find((phieuXuat) => phieuXuat.id_phieu_xuat == e.key.slice(3));
            setMenuCurrent(selected);
        }
    }

    const fetchAllPhieuXuat = async () => {
        try {
            const data = await getFullPhieuXuat()
            setDataPhieuXuat(data)
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error)
        }
    }

    const fetchAllPhieuNhap = async () => {
        try {
            const data = await getFullPhieuNhap()
            setDataPhieuNhap(data)
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error)
        }
    }

    useEffect(() => {
        fetchAllPhieuXuat()
        fetchAllPhieuNhap()
    }, [])

    const items = [
        {
            key: 'phieu_nhap',
            label: 'Phiếu nhập',
        },
        {
            key: 'phieu_xuat',
            label: 'Phiếu xuất',
        },

    ];

    const columnsPhieuXuat = [
        {
            title: 'Hàng hóa',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: 'Lô',
            dataIndex: 'lo_code',
            key: 'lo_code',
        },
        {
            title: 'Kho',
            dataIndex: 'kho_code',
            key: 'kho_code',
        },
        {
            title: 'Giá xuất',
            dataIndex: 'gia_xuat',
            key: 'gia_xuat',
        },
        {
            title: 'Số lượng',
            dataIndex: 'so_luong',
            key: 'so_luong',
        },
    ];

    const columnsPhieuNhap = [
        {
            title: 'Hàng hóa',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: 'Lô',
            dataIndex: 'lo_code',
            key: 'lo_code',
        },
        {
            title: 'Kho',
            dataIndex: 'kho_code',
            key: 'kho_code',
        },
        {
            title: 'Giá nhập',
            dataIndex: 'gia_nhap',
            key: 'gia_nhap',
        },
        {
            title: 'Số lượng',
            dataIndex: 'so_luong',
            key: 'so_luong',
        },
    ];

    const dataTablePhieuXuat = menuCurrent?.danh_sach_hang_hoa
        .map((item, index) => {
            return {
                key: index,
                code: item.code,
                lo_code: item.lo_code,
                kho_code: item.kho_code,
                gia_xuat: item.gia_xuat,
                so_luong: item.so_luong,
            }
        })

    const dataTablePhieuNhap = menuCurrent?.danh_sach_hang_hoa
        .map((item, index) => {
            return {
                key: index,
                code: item.code,
                lo_code: item.lo_code,
                kho_code: item.kho_code,
                gia_nhap: item.gia_nhap,
                so_luong: item.so_luong,
            }
        })

    return (
        <div className={css.main}>
            <div className={css.header}>
                <Menu
                    onClick={handleClickTab}
                    selectedKeys={[tabCurrent]}
                    mode="horizontal"
                    items={items}
                />
            </div>
            <div className={css.body}>
                <div className={css.sidebar}>
                    <Menu
                        onClick={handleClickMenu}
                        mode="inline"
                        items={tabCurrent == 'phieu_nhap' ? dataPhieuNhap.map((phieuNhap) => {
                            return {
                                key: `PN-${phieuNhap.id_phieu_nhap}`,
                                label: `PN-${phieuNhap.id_phieu_nhap}`,
                            };
                        }) : dataPhieuXuat.map((phieuXuat) => {
                            return {
                                key: `PX-${phieuXuat.id_phieu_xuat}`,
                                label: `PX-${phieuXuat.id_phieu_xuat}`,
                            };
                        })}
                    />
                </div>
                {menuCurrent ? (
                    menuCurrent.type === 'phieu_xuat' ? (
                        <div className={css.content}>
                            <div className={css.descriptionsWrap}>
                                <Descriptions bordered column={3}>
                                    <Descriptions.Item label="Ngày xuất" span={3}>
                                        {menuCurrent?.ngay_xuat}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Mã nhân viên" span={1.5}>
                                        {menuCurrent?.code_nhan_vien}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Tên nhân viên" span={1.5}>
                                        {menuCurrent?.name_nhan_vien}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Mã khách hàng" span={1.5}>
                                        {menuCurrent?.code_khach_hang}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Tên khách hàng" span={1.5}>
                                        {menuCurrent?.name_khach_hang}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Đơn hàng" span={1.5}>
                                        {menuCurrent?.don_hang}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Lệnh sản xuất" span={1.5}>
                                        {menuCurrent?.lenh_san_xuat?.code || '-'}
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>
                            <span>Danh sách hàng hóa:</span>
                            <Table
                                columns={columnsPhieuXuat}
                                dataSource={dataTablePhieuXuat}
                                pagination={{
                                    pageSize: 6,
                                }}
                            />
                        </div>
                    ) : (
                        <div className={css.content}>
                            <div className={css.descriptionsWrap}>
                                <Descriptions bordered column={3}>
                                    <Descriptions.Item label="Ngày nhập" span={3}>
                                        {menuCurrent?.ngay_nhap}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Mã nhân viên" span={1.5}>
                                        {menuCurrent?.code_nhan_vien}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Tên nhân viên" span={1.5}>
                                        {menuCurrent?.name_nhan_vien}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Mã nhà cung cấp" span={1.5}>
                                        {menuCurrent?.code_nha_cung_cap}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Tên nhà cung cấp" span={1.5}>
                                        {menuCurrent?.name_nha_cung_cap}
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>
                            <span>Danh sách hàng hóa:</span>
                            <Table
                                columns={columnsPhieuNhap}
                                dataSource={dataTablePhieuNhap}
                                pagination={{
                                    pageSize: 6,
                                }}
                            />
                        </div>
                    )
                ) : (
                    <div className={css.placeholder}>
                        <p>Chọn phiếu để xem chi tiết.</p>
                    </div>
                )}

            </div>
        </div>
    )
}

export default PhieuNhapXuat
