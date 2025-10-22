import React, { useState, useEffect, useMemo } from 'react';
import { Tree, Card, Spin, Empty, Button, message, Modal, Input, Space, Typography } from 'antd';
import { 
  DatabaseOutlined, 
  FolderOutlined, 
  TableOutlined, 
  LoadingOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { postgresService } from '../../apis/postgresService.jsx';
import './PostgresExplorer.css';

const { Title, Text } = Typography;
const { Search } = Input;

const PostgresExplorer = ({ 
  connectionInfo, 
  onTableSelect, 
  onClose,
  visible = false 
}) => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // AG Grid configuration
  const gridOptions = useMemo(() => ({
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 100,
      flex: 1,
      floatingFilter: true,
      filterParams: {
        buttons: ['apply', 'reset'],
        closeOnApply: true,
      },
    },
    rowSelection: 'single',
    pagination: true,
    paginationPageSize: 20,
    paginationPageSizeSelector: [10, 20, 50, 100],
    domLayout: 'autoHeight',
    suppressRowClickSelection: true,
    enableCellTextSelection: true,
    suppressCopyRowsToClipboard: false,
    suppressCopySingleCellRanges: false,
    enableRangeSelection: true,
    enableFillHandle: true,
    animateRows: true,
    suppressColumnVirtualisation: false,
    suppressRowVirtualisation: false,
    tooltipShowDelay: 0,
    tooltipHideDelay: 2000,
  }), []);

  // Generate column definitions from data
  const getColumnDefs = (data) => {
    if (!data || data.length === 0) return [];
    
    const firstRow = data[0];
    return Object.keys(firstRow).map(key => ({
      field: key,
      headerName: key,
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 120,
      flex: 1,
      floatingFilter: true,
      filterParams: {
        buttons: ['apply', 'reset'],
        closeOnApply: true,
      },
      cellRenderer: (params) => {
        const value = params.value;
        if (value === null || value === undefined) {
          return <span style={{ color: '#999', fontStyle: 'italic' }}>null</span>;
        }
        if (typeof value === 'object') {
          return <span style={{ color: '#666' }}>{JSON.stringify(value)}</span>;
        }
        return <span>{String(value)}</span>;
      },
      tooltipField: key,
      tooltipComponent: 'CustomTooltip',
      cellStyle: (params) => {
        const value = params.value;
        if (value === null || value === undefined) {
          return { color: '#999', fontStyle: 'italic' };
        }
        if (typeof value === 'object') {
          return { color: '#666' };
        }
        return {};
      }
    }));
  };

  // Load data khi component mount hoặc connectionInfo thay đổi
  useEffect(() => {
    if (visible && connectionInfo) {
      loadDatabases();
    }
  }, [visible, connectionInfo]);

  // Load danh sách databases
  const loadDatabases = async () => {
    if (!connectionInfo) return;
    
    setLoading(true);
    try {
      // Kết nối PostgreSQL
   
      const result = await postgresService.connect(connectionInfo);
      
      if (result.success) {
        const databases = await postgresService.getDatabases(connectionInfo);
        const treeNodes = databases?.databases?.map(db => ({
          title: (
            <Space>
              <DatabaseOutlined style={{ color: '#1890ff' }} />
              <span>{db}</span>
            </Space>
          ),
          key: `db-${db}`,
          dbName: db,
          isLeaf: false,
          children: []
        }));
        
        setTreeData(treeNodes);
        setExpandedKeys([]);
        setSelectedKeys([]);
      } else {
        message.error(result.message || 'Không thể kết nối PostgreSQL');
      }
    } catch (error) {
      console.error('Lỗi khi load databases:', error);
      message.error('Có lỗi khi kết nối PostgreSQL');
    } finally {
      setLoading(false);
    }
  };

  // Load schemas khi expand database
  const loadSchemas = async (databaseName) => {
    setLoading(true);
    try {
      // Cập nhật connection info với database mới
      const newConnectionInfo = {
        ...connectionInfo,
        database: databaseName
      };
      
     
      const schemas = await postgresService.getSchemas(newConnectionInfo);
      console.log('schemas', schemas);
      const schemaNodes = schemas?.schemas?.map(schema => ({
        title: (
          <Space>
            <FolderOutlined style={{ color: '#52c41a' }} />
            <span>{schema}</span>
          </Space>
        ),
        key: `schema-${databaseName}-${schema}`,
        schemaName: schema,
        dbName: databaseName,
        isLeaf: false,
        children: []
      }));
      
      // Cập nhật tree data
      setTreeData(prevData => {
        return prevData.map(node => {
          if (node.key === `db-${databaseName}`) {
            return { ...node, children: schemaNodes };
          }
          return node;
        });
      });
    } catch (error) {
      console.error('Lỗi khi load schemas:', error);
      message.error('Có lỗi khi lấy danh sách schema');
    } finally {
      setLoading(false);
    }
  };

  // Load tables khi expand schema
  const loadTables = async (databaseName, schemaName) => {
    setLoading(true);
    try {
     
      const tables = await postgresService.getTables({
        ...connectionInfo,
        database: databaseName,
        schema: schemaName
      });
      
      const tableNodes = tables?.tables?.map(table => ({
        title: (
          <Space>
            <TableOutlined style={{ color: '#fa8c16' }} />
            <span>{table}</span>
          </Space>
        ),
        key: `table-${databaseName}-${schemaName}-${table}`,
        tableName: table,
        schemaName: schemaName,
        dbName: databaseName,
        isLeaf: true
      }));
      
      // Cập nhật tree data
      setTreeData(prevData => {
        return prevData.map(dbNode => {
          if (dbNode.key === `db-${databaseName}`) {
            return {
              ...dbNode,
              children: dbNode.children.map(schemaNode => {
                if (schemaNode.key === `schema-${databaseName}-${schemaName}`) {
                  return { ...schemaNode, children: tableNodes };
                }
                return schemaNode;
              })
            };
          }
          return dbNode;
        });
      });
    } catch (error) {
      console.error('Lỗi khi load tables:', error);
      message.error('Có lỗi khi lấy danh sách bảng');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi expand node
  const onExpand = (expandedKeys, { expanded, node }) => {
    setExpandedKeys(expandedKeys);
    
    if (expanded) {
      if (node.dbName && !node.schemaName) {
        // Expand database - load schemas
        loadSchemas(node.dbName);
      } else if (node.dbName && node.schemaName && !node.tableName) {
        // Expand schema - load tables
        loadTables(node.dbName, node.schemaName);
      }
    }
  };

  // Xử lý khi select node
  const onSelect = (selectedKeys, { selected, node }) => {
    setSelectedKeys(selectedKeys);
    
    if (selected && node.tableName) {
      setSelectedTable({
        database: node.dbName,
        schema: node.schemaName,
        table: node.tableName
      });
    } else {
      setSelectedTable(null);
    }
  };

  // Preview dữ liệu bảng
  const handlePreviewTable = async () => {
    if (!selectedTable) return;
    
    setPreviewLoading(true);
    try {
      // Cập nhật connection info với database và schema
      const newConnectionInfo = {
        ...connectionInfo,
        database: selectedTable.database
      };
      
     
      const data = await postgresService.getTableData({
        ...connectionInfo,
        database: selectedTable.database,
        schema: selectedTable.schema,
        table: selectedTable.table,
        limit: 10
      });
      console.log('data', data);
      if (Array.isArray(data) && data.length > 0) {
        setPreviewData(data);
      } else {
        message.warning('Bảng này không có dữ liệu');
        setPreviewData([]);
      }
    } catch (error) {
      console.error('Lỗi khi preview bảng:', error);
      message.error('Có lỗi khi xem dữ liệu bảng');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Chọn bảng
  const handleSelectTable = () => {
    if (!selectedTable) {
      message.warning('Vui lòng chọn một bảng');
      return;
    }
    
    // Truyền cả thông tin kết nối và thông tin bảng
    const tableInfo = {
      ...selectedTable,
      connectionInfo: connectionInfo
    };
    
    onTableSelect(tableInfo);
  };

  // Filter tree data theo search
  const getFilteredTreeData = () => {
    if (!searchValue) return treeData;
    
    const filterNode = (nodes) => {
      return nodes.filter(node => {
        const title = node.title?.props?.children?.[1]?.props?.children || 
                     node.title?.props?.children?.[1] || 
                     node.title || '';
        
        const matches = title.toLowerCase().includes(searchValue.toLowerCase());
        
        if (node.children) {
          node.children = filterNode(node.children);
          return matches || node.children.length > 0;
        }
        
        return matches;
      });
    };
    
    return filterNode([...treeData]);
  };

  // Render table preview with AG Grid
  const renderTablePreview = () => {
    if (!previewData) return null;
    
    if (previewData.length === 0) {
      return (
        <Card size="small" title="Dữ liệu mẫu" style={{ marginTop: 16 }}>
          <Empty description="Bảng không có dữ liệu" />
        </Card>
      );
    }
    
    const columnDefs = getColumnDefs(previewData);
    
    return (
      <Card size="small" title={`Dữ liệu mẫu (${previewData.length} dòng đầu)`} style={{ marginTop: 16, height:'calc(100% - 150px)' }}>
        <div 
          className="ag-theme-quartz" 
          style={{ 
            height: '100%', 
            width: '100%',
            fontSize: '12px'
          }}
        >
          <AgGridReact
            rowData={previewData}
            columnDefs={columnDefs}
            gridOptions={gridOptions}
            onGridReady={(params) => {
              params.api.sizeColumnsToFit();
              // Enable keyboard navigation
              params.api.setSuppressKeyboardEvent((params) => {
                return false;
              });
            }}
            onFirstDataRendered={(params) => {
              params.api.sizeColumnsToFit();
            }}
            onCellClicked={(params) => {
              console.log('Cell clicked:', params.data);
            }}
            onRowDoubleClicked={(params) => {
              console.log('Row double clicked:', params.data);
            }}
          />
        </div>
      </Card>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <DatabaseOutlined />
          <span>PostgreSQL Explorer</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={'80vw'}
      className="postgres-explorer"
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button 
          key="preview" 
          icon={<EyeOutlined />}
          onClick={handlePreviewTable}
          disabled={!selectedTable}
          loading={previewLoading}
        >
          Xem dữ liệu
        </Button>,
        <Button 
          key="select" 
          type="primary"
          onClick={handleSelectTable}
          disabled={!selectedTable}
        >
          Chọn bảng
        </Button>
      ]}
      centered
    >
      <div style={{ display: 'flex', gap: 16, width: '100%', height: '80vh' }}>
        {/* Tree Panel */}
        <div style={{ minHeight: 400, width: '30%', height:'100%' }}>
          <div style={{ marginBottom: 16 }}>
            <Search
              placeholder="Tìm kiếm database, schema, table..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadDatabases}
              loading={loading}
              size="small"
            >
              Làm mới
            </Button>
          </div>
          
          <Card size="small" style={{ height: 'calc(100% - 50px)', overflow: 'auto' }}>
            {loading && treeData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                <div style={{ marginTop: 16 }}>Đang kết nối...</div>
              </div>
            ) : treeData.length === 0 ? (
              <Empty description="Không có database nào" />
            ) : (
              <Tree
                treeData={getFilteredTreeData()}
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                onExpand={onExpand}
                onSelect={onSelect}
                showLine
                showIcon={false}
                blockNode
              />
            )}
          </Card>
        </div>
        
        {/* Preview Panel */}
        <div style={{  height:'100%' ,width:'70%'}}>
          {selectedTable && (
            <Card size="small" title="Thông tin bảng được chọn">
              <div>
                <p><strong>Database:</strong> {selectedTable.database}</p>
                <p><strong>Schema:</strong> {selectedTable.schema}</p>
                <p><strong>Table:</strong> {selectedTable.table}</p>
              </div>
            </Card>
          )}
          
          {renderTablePreview()}
        </div>
      </div>
    </Modal>
  );
};

export default PostgresExplorer; 