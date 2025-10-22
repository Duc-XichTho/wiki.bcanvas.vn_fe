import css from './MappingList.module.css'
import { useState, useEffect, useRef } from 'react';
import { deleteCrossCheck, getAllCrossCheck } from '../../../../../../apis/crossCheckService';
import MappingElement from '../MappingElement/MappingElement'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { AgGridReact } from "ag-grid-react";
import {  Button, Input, message,Popconfirm } from 'antd';
import { updateCrossCheck } from '../../../../../../apis/crossCheckService';
import { getAllKmf } from "../../../../../../apisKTQT/kmfService.jsx";
import { getAllKmns } from "../../../../../../apisKTQT/kmnsService.jsx";
import { getAllUnits } from "../../../../../../apisKTQT/unitService.jsx";
import { getAllProject } from "../../../../../../apisKTQT/projectService.jsx";
import { getAllProduct } from "../../../../../../apisKTQT/productService.jsx";
import { getAllKenh } from "../../../../../../apisKTQT/kenhService.jsx";
import { getAllVendor } from "../../../../../../apisKTQT/vendorService.jsx";
import { getTemplateRow, getAllTemplateSheetTable,updateTemplateRow  } from "../../../../../../apis/templateSettingService.jsx";

const MappingList = () => {
  const [mappingList, setMappingList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showMappingElement, setShowMappingElement] = useState(true);  // Add this state
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const gridRef = useRef();
  const [checkingSourceValues, setCheckingSourceValues] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const fetchAllCrossCheck = async () => {
    try {
      const response = await getAllCrossCheck();
      const filteredList = response.filter(item => item.type === 'Mapping');
      setMappingList(filteredList);
    } catch (error) {
      console.log('ERROR fetchAllCrossCheck', error);
    }
  }

  useEffect(() => {
    fetchAllCrossCheck();
  }, []);
const handleDelete = async (value) =>{
  try {
    await deleteCrossCheck(value?.id)
  }
  catch(error){
    console.log('ERROR delete CrossCheck', error);
  }
  finally {
    setSelectedItem(null);
    fetchAllCrossCheck();

  }
}


  const danhMucValues = [
    {value: 'KQKD', getApi: getAllKmf},
    {value: 'KMTC', getApi: getAllKmns},
    {value: 'DV', getApi: getAllUnits},
    {value: 'VV', getApi: getAllProject},
    {value: 'SP', getApi: getAllProduct},
    {value: 'KENH', getApi: getAllKenh},
    {value: 'KH', getApi: getAllVendor}
  ];

  async function getDataForSource(source) {
    if (!source) return null;

    if (source.type === "Template") {
      return await getTemplateData(source.id);
    } else {
      return await getDanhMucData(source.bo_du_lieu);
    }
  }

  async function getTemplateData(sourceId) {
    try {
      const templateSheets = await getAllTemplateSheetTable();
      const matchingSheet = templateSheets.find(sheet => sheet.fileNote_id === sourceId);

      if (matchingSheet) {
        const templateRowDataResponse = await getTemplateRow(matchingSheet.id);
        const templateRowData = templateRowDataResponse.rows || [];
        return templateRowData.map(item => item.data);
      }
      return null;
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu Template:", error);
      return null;
    }
  }

  async function getDanhMucData(boDuLieu) {
    try {
      const danhMuc = danhMucValues.find(item => item.value === boDuLieu);
      if (danhMuc) {
        return await danhMuc.getApi();
      }
      return null;
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu DanhMuc:", error);
      return null;
    }
  }

  const handleEdit = async (e, item) => {
    e.stopPropagation();
    setIsEditing(true);
    setSelectedItem(item);
    setShowMappingElement(false);

    // Fetch checking source values
    const checkingData = await getDataForSource(item.info.validateRecord.checkingSource);
    if (checkingData) {
      const checkingColumn = item.info.validateRecord.checkingSource.cot_du_lieu;
      const uniqueValues = [...new Set(checkingData.map(row => 
        row[checkingColumn] ? row[checkingColumn].toString() : ""
      ))];
      setCheckingSourceValues(uniqueValues);
    }
  };

  const renderMappingCreate = () => {
    return (
      <div className={css.mappingCreate}>
        <div className={css.formGroup}>
          <Input
            placeholder="Tên mapping"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginBottom: '10px' }}
          />
          <Input.TextArea
            placeholder="Mô tả"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={{ marginBottom: '20px' }}
          />
        </div>

        <div className={'ag-theme-quartz'} style={{ height: '400px' }}>
          <AgGridReact
            ref={gridRef}
            enableRangeSelection={true}
            rowData={selectedItem?.info?.mappingList || []}
            columnDefs={[
              { 
                field: 'du_lieu_chinh', 
                headerName: 'Dữ liệu cần kiểm soát làm sạch',
                editable: false,
                cellRenderer: (params) => params.value || ''
              },
              { 
                field: 'du_lieu_nguon', 
                headerName: 'Dữ liệu chuẩn (Master Data)',
                cellEditor: 'agRichSelectCellEditor',
                editable: true,
                cellEditorParams: {
                  values: checkingSourceValues,
                  allowTyping: true,
                  filterList: true,
                  highlightMatch: true,
                  valueListMaxHeight: 220
                }
              }
            ]}
            defaultColDef={{
              sortable: true,
              filter: true,
              flex: 1
            }}
          />
        </div>

        <div className={css.buttonGroup} style={{ marginTop: '20px' }}>
          <Button onClick={() => setIsEditing(false)}>Hủy</Button>
          <Button 
            type="primary" 
            onClick={handleUpdateMapping}
            disabled={!name.trim()}
          >
            Cập nhật
          </Button>
        </div>
      </div>
    );
  };

  const handleUpdateMapping = async () => {
    try {
      const gridApi = gridRef.current.api;
      let mappingList = [];
      gridApi.forEachNode(node => {
        mappingList.push({
          du_lieu_chinh: node.data.du_lieu_chinh,
          du_lieu_nguon: node.data.du_lieu_nguon
        });
      });

      const updatedData = {
        ...selectedItem,
        name: name,
        desc: desc,
        info: {
          ...selectedItem.info,
          mappingList
        }
      };

      await updateCrossCheck(updatedData);
      message.success('Cập nhật mapping thành công');
      setIsEditing(false);
      fetchAllCrossCheck();
    } catch (error) {
      console.error('Lỗi khi cập nhật mapping:', error);
      message.error('Cập nhật thất bại');
    }
  };

  useEffect(() => {
    if (isEditing && selectedItem) {
      setName(selectedItem.name || '');
      setDesc(selectedItem.desc || '');
    }
  }, [isEditing, selectedItem]);

  useEffect(() => {
    if (selectedItem) {
     getAllTemplateSheetTable().then(res => {
      getTemplateRow(res.find(item => item.fileNote_id == selectedItem?.info?.validateRecord?.primarySource?.id).id).then(res => {
        setRecords(res);
      });
     });
    }
  }, [selectedItem]);

  const handleItemClick = (e, item) => {
    if (e.target.closest('.headerRight')) {
      return;
    }
    setIsEditing(false);
    setSelectedItem(item);
    setShowMappingElement(true);  // Show MappingElement when selecting item
  };
  const handleMappingUpdate = async () => {
		try {
			const mappingList = selectedItem.info.mappingList;

			if (selectedItem?.info?.validateRecord?.primarySource?.id && selectedRecords.length > 0) {
				// Process only selected records
				for (const record of selectedRecords) {
					// Find the matching mapping rule
					const mapping = mappingList.find(m => m.du_lieu_chinh === record.data[selectedItem?.info?.validateRecord?.primarySource?.cot_du_lieu]);

					if (mapping && mapping.du_lieu_nguon) {
						// Update only if there's a valid mapping
						record.data[selectedItem?.info?.validateRecord?.primarySource?.cot_du_lieu] = mapping.du_lieu_nguon;
						await updateTemplateRow(record);
					}
				}

				setSelectedRecords([]);
				message.success(`Đã cập nhật ${selectedRecords.length} bản ghi thành công!`, 2);

				// Add small delay to ensure all updates are committed
				await new Promise(resolve => setTimeout(resolve, 300));

				// Reload the table data
				await fetchAllCrossCheck();
			}
		} catch (error) {
			console.error('Lỗi khi cập nhật mapping:', error);
			message.error('Đã xảy ra lỗi khi cập nhật mapping!');
		}
	};
  const handleMappingConfirm = async () => {
    handleMappingUpdate();
  }


  return (
    <div className={css.main}>
      <div className={css.sidebar}>
        {mappingList?.map((item) => (
          <div
            key={item.id}
            title={item.name}
            className={`${css.sidebarItem} ${selectedItem?.id === item.id ? css.selected : ''}`}
            style={{ width: selectedItem?.id === item.id ? '100%' : 'calc(100% - 5px)'  }}
            onClick={(e) => handleItemClick(e, item)}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
            <div className={css.headerRight}>
              <Button 
                shape="circle" 
                icon={<EditOutlined />} 
                size="small"
                onClick={(e) => handleEdit(e, item)}
                style={{ minWidth: '24px', width: '24px', height: '24px' }}
              />
              <Popconfirm
                title="Xóa mapping"
                description="Bạn có chắc chắn muốn xóa mapping này?"
                onConfirm={(e) => {
                  e?.stopPropagation();
                  handleDelete(item);
                }}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button 
                  shape="circle" 
                  icon={<DeleteOutlined />} 
                  size="small"
                  style={{ minWidth: '24px', width: '24px', height: '24px' }}
                />
              </Popconfirm>
            </div>
          </div>
        ))}
      </div>

      <div className={css.content}>
        {selectedItem && showMappingElement && <MappingElement selectedItem={selectedItem} records={records} setSelectedRecords={setSelectedRecords} selectedRecords={selectedRecords}   allList={true} handleMappingConfirm={handleMappingConfirm}/>}
        {selectedItem && isEditing && renderMappingCreate()}
       
      </div>
   
    </div>
  );
};

export default MappingList;