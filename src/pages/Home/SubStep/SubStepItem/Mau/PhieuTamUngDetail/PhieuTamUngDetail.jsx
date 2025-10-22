import css from './../Mau.module.css'
import { useEffect, useState } from "react";
import { Table } from "antd";

const PhieuTamUngDetail = ({ phieu }) => {
  const [dataDetail, setDataDetail] = useState([]);

  useEffect(() => {
    setDataDetail(phieu?.chi_tiet_tam_ung)
  }, [phieu]);

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code_hang_hoa',
      key: 'code_hang_hoa',
      minWidth: 100,
    },
    {
      title: 'Tên hàng hóa',
      dataIndex: 'name_hang_hoa',
      key: 'name_hang_hoa',
      minWidth: 100,
    },
    {
      title: 'Bộ phận',
      dataIndex: 'name_bo_phan',
      key: 'name_bo_phan',
      minWidth: 100,
    },
    {
      title: 'KMF',
      dataIndex: 'name_kmf',
      key: 'name_kmf',
      minWidth: 100,
    },
    {
      title: 'KMNS',
      dataIndex: 'name_kmns',
      key: 'name_kmns',
      minWidth: 100,
    },
    {
      title: 'Vụ việc',
      dataIndex: 'name_vu_viec',
      key: 'name_vu_viec',
      minWidth: 100,
    },
    {
      title: 'Số lượng',
      dataIndex: 'so_luong',
      key: 'so_luong',
      minWidth: 100,
    },

    {
      title: 'Đơn giá',
      dataIndex: 'gia_ban',
      key: 'gia_ban',
      minWidth: 100,
    },
    {
      title: 'Thuế (%)',
      dataIndex: 'thue',
      key: 'thue',
      minWidth: 100,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'tong_tien',
      key: 'tong_tien',
      minWidth: 100,
    },
  ];

  return (
    <>
      <div className={css.phieuDetail}>
        <h3 className={css.maPhieu}>{phieu?.code}</h3>
        <div className={css.infoContainer}>
          <div className={css.infoItem}>
            <div className={css.infoLabel}>
              Số phiếu
            </div>
            <div className={css.infoValue}>
              TU - {phieu?.id}
            </div>
          </div>
          <div className={css.infoItem}>
            <div className={css.infoLabel}>
              Ngày chi
            </div>
            <div className={css.infoValue}>
              {phieu?.mo_ta}
            </div>
          </div>
          <div className={css.infoItem}>
            <div className={css.infoLabel}>
              Bộ phận
            </div>
            <div className={css.infoValue}>
              {phieu?.bo_phan?.code} - {phieu?.bo_phan?.name}
            </div>
          </div>
          <div className={css.infoItem}>
            <div className={css.infoLabel}>
              Nhân viên
            </div>
            <div className={css.infoValue}>
              {phieu?.nhan_vien?.code} - {phieu?.nhan_vien?.name}
            </div>
          </div>
          <div className={css.infoItem}>
            <div className={css.infoLabel}>
              Ngày dự kiến tạm ứng
            </div>
            <div className={css.infoValue}>
              {phieu?.ngay_du_kien_tam_ung}
            </div>
          </div>
          <div className={css.infoItem}>
            <div className={css.infoLabel}>
              Ngày dự kiến hoàn ứng
            </div>
            <div className={css.infoValue}>
              {phieu?.ngay_du_kien_hoan_ung}
            </div>
          </div>
          <div className={css.infoItem}>
            <div className={css.infoLabel}>
              Tài khoản nhận tiền
            </div>
            <div className={css.infoValue}>
              {phieu?.tk_nhan_tien}
            </div>
          </div>
          <div className={css.infoItem}>
            <div className={css.infoLabel}>
              Mô tả
            </div>
            <div className={css.infoValue}>
              {phieu?.mo_ta}
            </div>
          </div>

        </div>
        <div style={{ width: '100%', display: "block" }}>
          <Table
          rowKey='id'
          scroll={{ x: 'max-content', y: 350 }}
          pagination={false}
          dataSource={dataDetail?.length > 0 ? dataDetail : []}
          columns={columns}
          tableLayout="auto"
          bordered
          />
        </div>
      </div>
    </>
  )
}

export default PhieuTamUngDetail
