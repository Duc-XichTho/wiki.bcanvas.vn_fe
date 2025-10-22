import css from "./BangPhanBo.module.css";
import { useState, useEffect } from 'react';
import { Modal, Button, message } from "antd";
import { AgGridReact } from "ag-grid-react";
import { getAllPMVCategories } from '../../../../apis/pmvCategoriesService.jsx';
import { createNewPMVSkuAllocation, getAllPMVSkuAllocationFull } from '../../../../apis/pmvSkuAllocationService.jsx';
import { getAllPMVSettingKHFull } from "../../../../apis/pmvSettingKHService.jsx";

const findConChauChutChit = (parent, data) => {
  const children = data.filter(item => item.parentId == parent.id);
  if (children.length === 0) {
    return [parent];
  }
  let allDescendants = [parent, ...children];
  children.forEach(child => {
    const childDescendants = findConChauChutChit(child, data);
    const uniqueDescendants = childDescendants.filter(desc => desc.id !== child.id);
    allDescendants = [...allDescendants, ...uniqueDescendants];
  });
  return allDescendants;
};

const BangPhanBo = ({ planData, listPMVDeployment, deploymentDetail, isModalBangPhanBo, handleCancelBangPhanBo, fetchData }) => {

  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([]);

  const fetchPMVCategories = async () => {
    try {
      const data = await getAllPMVCategories();
      const filteredData = data.filter(item => item.category_type === 'sanpham');

      const uniqueItemsMap = new Map();

      filteredData.forEach((item) => {
        const key = `${item.group2}-${item.group5}`;
        if (!uniqueItemsMap.has(key)) {
          uniqueItemsMap.set(key, {
            id: item.id,
            group2: item.group2,
            group5: item.group5,
            isUse: false,
            ty_trong: null
          });
        }
      });

      let dataPre = Array.from(uniqueItemsMap.values());

      if (deploymentDetail && deploymentDetail.id) {
        const dataPMVSkuAllocationFull = await getAllPMVSkuAllocationFull();
        const filterPMVSku = dataPMVSkuAllocationFull.filter(item => item.deploy_detail_id == deploymentDetail.id);

        if (filterPMVSku.length > 0) {
          filterPMVSku.map(i => {
            const findData = dataPre.find(item => item.id == i.info.id_category);
            if (findData) {
              findData.isUse = i.isUse;
              findData.ty_trong = i.ratio;
            }
          })
        }
      }

      setRowData(dataPre);
    } catch (error) {
      console.log(error);
    }
  }

  const fetchPMVSettingKH = async () => {
    try {
      const defaultColumns = [
        { field: "id", headerName: 'ID', flex: 1, hide: true },
        { field: "group2", headerName: 'Group 2', flex: 1 },
        { field: "group5", headerName: 'Group 5', flex: 1 },
        {
          field: "isUse",
          headerName: 'Áp dụng',
          editable: true,
          width: 100,
          maxWidth: 100,
        },
        {
          field: "ty_trong",
          headerName: 'Tỷ trọng',
          editable: true,
          width: 100,
          maxWidth: 100,
          cellStyle: { textAlign: 'center' }
        }
      ];

      const data = await getAllPMVSettingKHFull();

      const productCategory = data.find(item => item.name === 'Danh mục sản phẩm');

      if (productCategory) {

        defaultColumns.forEach((column, index) => {
          if (column.field === 'group2' || column.field === 'group5') {
            const apiColumn = productCategory.data.find(item => item.field === column.field);
            if (apiColumn) {
              defaultColumns[index] = { ...column, ...apiColumn };
            }
          }
        });
      }

      setColDefs(defaultColumns);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchPMVCategories();
    fetchPMVSettingKH();
  }, [deploymentDetail])

  const handleCellValueChanged = (params) => {
    const { rowIndex, newValue, column } = params;
    const updatedRowData = [...rowData];
    updatedRowData[rowIndex] = {
      ...updatedRowData[rowIndex],
      [column.getId()]: newValue
    };
    setRowData(updatedRowData);
  };

  const handleCreateNewPMVSkuAllocation = async () => {
    try {

      let allPayloads = [];

      if (deploymentDetail && deploymentDetail.id && planData) {
        const allElements = findConChauChutChit(deploymentDetail, planData);

        allPayloads = allElements.flatMap(i =>
          rowData.map(record => ({
            deploy_detail_id: String(i.id),
            brand: record.group2,
            sku: record.group5,
            isUse: record.isUse,
            ratio: record.ty_trong,
            info: {
              id_category: record.id,
            }
          }))
        );
      }

      await createNewPMVSkuAllocation(allPayloads);
      fetchData();
      message.success('Cập nhật thành công!');
      handleCancelBangPhanBo();
    } catch (error) {
      console.error('Error creating/updating PMV SKU allocations:', error);
      message.error('Có lỗi xảy ra!');
    }
  }

  return (
    <Modal
      title={`
        PHÂN BỔ SKU
        > Nhóm triển khai ${listPMVDeployment[0]?.userClass}
        > Kênh ${deploymentDetail?.group_value}
        `}
      open={isModalBangPhanBo}
      onCancel={handleCancelBangPhanBo}
      centered
      maskClosable={false}
      width={'45%'}
      footer={null}
      styles={{ body: { height: '600px', } }}
    >
      <div className={css.main}>
        <div className={css.body}>
          <div className="ag-theme-quartz" style={{ width: "100%", height: "100%" }}>
            <AgGridReact
              rowData={rowData}
              columnDefs={colDefs}
              enableRangeSelection
              onCellValueChanged={handleCellValueChanged}
            />
          </div>
        </div>
        <div className={css.footer}>
          <Button size="small" type="text" onClick={() => handleCreateNewPMVSkuAllocation()}>Lưu bản phân bổ</Button>
          <Button size="small" type="text">Load bản phân bổ</Button>
          <Button size="small" type="text">Hoàn tất</Button>
        </div>
      </div>
    </Modal>
  )
}

export default BangPhanBo