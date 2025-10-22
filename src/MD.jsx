import React, { useState, useCallback, useMemo } from 'react';
import { Layout, Row, Col, Typography, Button, DatePicker, Menu, Popconfirm } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-grid.css';
import './pages/Home/AgridTable/agComponent.css';
import dayjs from 'dayjs';
import { PlusOutlined, DeleteOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Content, Sider } = Layout;
const { WeekPicker } = DatePicker;

import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import { re } from 'mathjs';
import { AgCharts } from 'ag-charts-react';
import { width } from '@mui/system';
import { employeeData, weeklyPerformanceData } from './pages/Canvas/Daas/MD/const.js';

// Register plugins
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
const generateUniqueId = () => `id_${Math.random().toString(36).substr(2, 9)}`;


const saveToLocalStorage = (performanceData, employeeData) => {
  try {
    // Create a deep copy and remove circular references
    const cleanPerformanceData = JSON.parse(JSON.stringify(performanceData, (key, value) => {
      if (key === 'parentData') {
        return undefined; // Skip parentData when stringifying
      }
      return value;
    }));
    
    localStorage.setItem('performanceData', JSON.stringify(cleanPerformanceData));
    localStorage.setItem('employeeData', JSON.stringify(employeeData));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};


const loadFromLocalStorage = () => {
  try {
    const savedPerformanceData = localStorage.getItem('performanceData');
    const savedEmployeeData = localStorage.getItem('employeeData');
    return {
      performanceData: savedPerformanceData ? JSON.parse(savedPerformanceData) : weeklyPerformanceData,
      employeeData: savedEmployeeData ? JSON.parse(savedEmployeeData) : employeeData,
    };
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return {
      performanceData: weeklyPerformanceData,
      employeeData: employeeData,
    };
  }
};


const ProductivityManagement = () => {
  const { performanceData: initialPerformanceData, employeeData: initialEmployeeData } = loadFromLocalStorage();

  // States
  const [selectedWeek, setSelectedWeek] = useState(dayjs());
  const [selectedTeam, setSelectedTeam] = useState('team1');
  const [hasChanges, setHasChanges] = useState(false);
  const [employeeDataState, setEmployeeDataState] = useState(initialEmployeeData);
  const [performanceDataState, setPerformanceDataState] = useState(initialPerformanceData);
  const [tempPerformanceData, setTempPerformanceData] = useState(initialPerformanceData);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedRows, setExpandedRows] = useState(() => {
    const saved = localStorage.getItem('expandedRows');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Grid styles
  const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);

  const handleWeekChange = (week) => {
    setSelectedWeek(week || dayjs());
  };

  const handlePrevWeek = () => {
    setSelectedWeek(prev => prev ? prev.subtract(1, 'week') : dayjs().subtract(1, 'week'));
  };

  const handleNextWeek = () => {
    setSelectedWeek(prev => prev ? prev.add(1, 'week') : dayjs().add(1, 'week'));
  };

  const handleTeamChange = (e) => {
    setSelectedTeam(e.key);
    onGridReady();
  };

  // Data handlers
  const handleSave = () => {
    setPerformanceDataState(tempPerformanceData);
    saveToLocalStorage(tempPerformanceData, employeeDataState);
    setHasChanges(false);
    setIsEditing(false); // Reset editing mode
  };
  
  // Modify handleCancel
  const handleCancel = () => {
    setTempPerformanceData(performanceDataState);
    setHasChanges(false);
    setIsEditing(false); // Reset editing mode
  };
  

  // Add new state for expanded rows

  // Add function to save expanded state
  const saveExpandedState = (teamName, newState) => {
    const updatedState = {
      ...expandedRows,
      [teamName]: newState
    };
    setExpandedRows(updatedState);
    localStorage.setItem('expandedRows', JSON.stringify(updatedState));
  };
  
  // Modify handlers
  const handleMainDataChange = (params) => {
    const { data, colDef, newValue } = params;
    if (!data || !data.code) return;  // Remove the result field check to detect all changes
    
    // Handle numeric conversion only for result field
    if (colDef.field === 'result') {
      const numericValue = parseFloat(newValue);
      if (isNaN(numericValue)) return;
      
      setTempPerformanceData(prevState => {
        const weekNumber = selectedWeek.isoWeek();
        const weekKey = `week${weekNumber}`;
        const currentWeekData = prevState[weekKey] || {};
        const currentEmployeeData = currentWeekData[data.code] || {
          id: data.id,
          result: 'N/A',
          skills: 'N/A',
          details: [],
        };
      
        return {
          ...prevState,
          [weekKey]: {
            ...currentWeekData,
            [data.code]: {
              ...currentEmployeeData,
              result: numericValue,
            },
          },
        };
      });
    } else {
      // Handle other field changes
      setEmployeeDataState(prevState => ({
        ...prevState,
        [selectedTeam]: prevState[selectedTeam].map(emp => 
          emp.code === data.code ? { ...emp, [colDef.field]: newValue } : emp
        )
      }));
    }
    
    setHasChanges(true);
    setIsEditing(true);
  };
  
  
  const handleDetailDataChange = (params) => {
    const { data, colDef, newValue } = params;
    const weekNumber = selectedWeek.isoWeek();
    const weekKey = `week${weekNumber}`;
    const parentData = params.node.parent.data;
  
    setTempPerformanceData(prevState => ({
      ...prevState,
      [weekKey]: {
        ...prevState[weekKey],
        [parentData?.code]: {
          ...prevState[weekKey][parentData?.code],
          details: prevState[weekKey][parentData?.code]?.details?.map(detail =>
            detail.id === data.id ? { ...detail, [colDef.field]: newValue } : detail
          ),
        },
      },
    }));
    setHasChanges(true);
  };
  
  const handleAddEmployee = () => {
    const newEmployeeId = generateUniqueId();
    const newEmployeeCode = `NV${Math.floor(Math.random() * 1000)}`;
    
    setEmployeeDataState(prevState => {
      const newState = {
        ...prevState,
        [selectedTeam]: [
          ...prevState[selectedTeam],
          {
            id: newEmployeeId,
            employee: null,
            avatar: null,
            code: newEmployeeCode,
          },
        ],
      };
      saveToLocalStorage(tempPerformanceData, newState);
      return newState;
    });
  };
  
  const handleDeleteEmployee = (params) => {
    const employeeCode = params.data.code;
    setEmployeeDataState(prevState => {
      const newState = {
        ...prevState,
        [selectedTeam]: prevState[selectedTeam].filter(emp => emp.code !== employeeCode)
      };
      saveToLocalStorage(tempPerformanceData, newState);
      return newState;
    });
  };
  
  
  const handleAddDetail = (params) => {
    const weekNumber = selectedWeek.isoWeek();
    const weekKey = `week${weekNumber}`;
    const employeeCode = params.data.code;
    const detailGridApi = params.api.getDetailGridInfo(params.node.id)?.api;
  
    setTempPerformanceData(prevState => {
      const currentWeekData = prevState[weekKey] || {};
      const currentEmployeeData = currentWeekData[employeeCode] || {
        result: 'N/A',
        skills: 'N/A',
        details: []
      };
  
      const newDetail = {
        id: generateUniqueId(),
        criteria: '',
        target: '',
        weight: '',
        result: '',
        comment: ''
      };
  
      const newState = {
        ...prevState,
        [weekKey]: {
          ...currentWeekData,
          [employeeCode]: {
            ...currentEmployeeData,
            details: [...(currentEmployeeData.details || []), newDetail]
          }
        }
      };
  
      if (detailGridApi) {
        detailGridApi.setRowData(newState[weekKey][employeeCode].details);
      }
  
      saveToLocalStorage(newState, employeeDataState);
      return newState;
    });
  };
  
  const handleDeleteDetail = (params) => {
    const weekNumber = selectedWeek.isoWeek();
    const weekKey = `week${weekNumber}`;
    
    // Get parent data from the detail row's parentData property
    const parentData = params.data.parentData;
    if (!parentData?.code) {
      console.error('Cannot find parent data');
      return;
    }
    
    const detailId = params.data.id;
  
    setTempPerformanceData(prevState => {
      const currentWeekData = prevState[weekKey] || {};
      const employeeData = currentWeekData[parentData.code] || {};
      const details = employeeData.details || [];
  
      const newState = {
        ...prevState,
        [weekKey]: {
          ...currentWeekData,
          [parentData.code]: {
            ...employeeData,
            details: details.filter(detail => detail.id !== detailId)
          }
        }
      };
      
      saveToLocalStorage(newState, employeeDataState);
      return newState;
    });
  };
  

  function getPreviousWeekResult(code, currentWeekNumber) {
    console.log(code, currentWeekNumber);
    const previousWeekKey = `week${currentWeekNumber - 1}`;
    const previousWeekData = tempPerformanceData[previousWeekKey];

    return previousWeekData?.[code]?.result || null;
  };

  function getLast5WeeksData(code, currentWeekNumber) {
    const weeks = [];
    for (let i = 0; i < 5; i++) {
      const weekKey = `week${currentWeekNumber - i}`;
      const weekData = tempPerformanceData[weekKey]?.[code]?.result;
      weeks.unshift(weekData ? parseFloat(weekData) : 0);
    }
    return weeks;
  };

  // Modify getCurrentWeekData to include comparison calculation
  const getCurrentWeekData = () => {
    if (!selectedWeek) return [];
    const weekNumber = selectedWeek.isoWeek();
    const weekKey = `week${weekNumber}`;
    const weekData = tempPerformanceData[weekKey] || {};

    const teamEmployees = employeeDataState[selectedTeam] || [];

    return teamEmployees.map(employee => {
      const performanceData = weekData[employee.code] || {};



      return {
        ...employee,
        team: selectedTeam,
        ...performanceData,
      };
    });
  };



  const defaultColDef = useMemo(() => ({

    sortable: true,
    resizable: true,
  }), []);
  // AG-Grid Column Definitions
  const columnDefs = useMemo(() => [
    {
      headerName: '',
      field: 'delete',
      width: 40,
      editable: false,
      pinned: 'left',
      cellRenderer: (params) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Popconfirm
            title="Xác nhận xoá"
            description="Bạn có chắc chắn muốn xoá nhân viên này?"
            onConfirm={() => handleDeleteEmployee(params)}
            okText="Xoá"
            cancelText="Huỷ"
          >
            <Button
              icon={<DeleteOutlined />}
              type="text"
              danger
            />
          </Popconfirm>
        </div>
      ),
    },
    {
      headerName: '',
      field: '',
      cellRenderer: 'agGroupCellRenderer',
      width: 25,
      pinned: 'left',
      editable: false,

    },
    {
      field: 'employee',
      headerName: 'Nhân viên',
      editable: true,
    },
    {
      field: 'avatar',
      width: 50,
      headerName: 'Ảnh',
      suppressMenu: true,
      editable: true,
      cellRenderer: (params) => (
        <img src={params.value} alt="avatar" style={{ width: 45, height: 45 }} />
      ),

    },
    { field: 'code', headerName: 'Mã', editable: true, width: 60  },
    {
      field: 'result',
      headerName: 'Kết quả',
      editable: true,

      cellRenderer: (params) => {
        if (!params.value || params.value === 'N/A') return 'N/A | N/A';

        const currentValue = params.value;
        const previousValue = getPreviousWeekResult(params.data.code, selectedWeek.isoWeek());
        let comparison = 'N/A';
        if (previousValue !== null) {
          const diff = currentValue - previousValue;
          console.log('diff', diff);

          const diffColor = diff >= 0 ? '#259c63' : 'red';
          comparison = `<span style="color: ${diffColor}">${diff >= 0 ? '+' : ''}${diff}%</span>`;
        }

        return <div dangerouslySetInnerHTML={{ __html: `${currentValue} % | ${comparison}` }} />;
      },
    },
    {
      field: 'skills',
      headerName: 'Phân tích',
      flex:1,
      editable: false,
      cellRenderer: 'agSparklineCellRenderer',
      cellRendererParams: (params) => {
        const weekNumber = selectedWeek.isoWeek();
        const sparklineData = getLast5WeeksData(params.data.code, weekNumber);

        return {
          sparklineOptions: {
            type: 'line',
            fill: '#259c63',
            stroke: '#259c63',

            data: sparklineData,
            axis: {
              stroke: '#999',
              strokeWidth: 1,
            },
            line: {
              stroke: '#259c63',
              strokeWidth: 3,
            },
            axes: {
              number: {
                type: 'number',
                position: 'left',
                label: {
                  enabled: true,
                  fontSize: 10,
                },
                gridStyle: [{
                  stroke: '#e0e0e0',
                  lineDash: [4, 2],
                }],
              },
              category: {
                type: 'category',
                position: 'bottom',
                label: {
                  enabled: true,
                  fontSize: 10,
                },
                gridStyle: [{
                  stroke: '#e0e0e0',
                  lineDash: [4, 2],
                }],
              },
            },
          },
        };
      },
    },
    {
      headerName: '',
      field: 'actions',
      pinned: 'right',
      width: 40,
      editable: false,
      cellRenderer: (params) => (
        <Button
          icon={<PlusOutlined />}
          onClick={() => handleAddDetail(params)}
          type="text"
        />
      
      ),
    },
  ], [selectedWeek]);


  // Detail Grid Options
  const detailCellRendererParams = useMemo(() => ({
    detailGridOptions: {
      enableRangeSelection: true,
      columnDefs: [
        {
          headerName: '',
          field: 'deleteD',
          width: 40,
          cellRenderer: (params) => {
            // Store parent data in the detail row
            const parentData = params.node.parent?.data || params.context?.parentData;
            return (
              <Popconfirm
                title="Xác nhận xoá"
                description="Bạn có chắc chắn muốn xoá chi tiết này?"
                onConfirm={() => handleDeleteDetail({ ...params, node: { parent: { data: parentData } } })}
                okText="Xoá"
                cancelText="Huỷ"
              >
                <Button
                  icon={<DeleteOutlined />}
                  type="text"
                  danger
                />
              </Popconfirm>
            );
          },
          pinned: 'left'
        },
        { field: 'criteria', headerName: 'Tiêu chí', editable: true,width: 150 },
        { field: 'target', headerName: 'Mục tiêu', editable: true, width: 100 },
        { field: 'weight', headerName: 'Trọng số (%)', editable: true , width: 110, suppressMenu: true },
        { field: 'result', headerName: 'Kết quả', editable: true, width: 80, suppressMenu: true  },
        { field: 'comment', headerName: 'Comment', editable: true, flex:1, },
      ],
      defaultColDef: {
        sortable: true,
      },
      onCellValueChanged: (params) => handleDetailDataChange(params),
      className: 'ag-theme-quartz',
      rowClass: 'detail-grid-row',
      headerClass: 'detail-grid-header',
    },
    getDetailRowData: (params) => {
      const details = params.data.details || [];
      details.forEach(detail => {
        detail.parentData = params.data;
      });
      params.successCallback(details);
    }

  }), []);


  const onFirstDataRendered = useCallback((params) => {
  
    setTimeout(() => {
      params.api.getDisplayedRowAtIndex(0)?.setExpanded(true);
    }, 0);
  }, []);


  const loadChartData = () => {
    try {
      const currentData = getCurrentWeekData();

      // Transform data for chart, including employees with no data
      const chartData = currentData.map(employee => ({
        employee: employee.employee || 'Chưa có tên',
        result: employee.result ? parseFloat(employee.result) : 0,
        color: '#91cc75'
      }));

      // Sort data by result
      chartData.sort((a, b) => b.result - a.result);

      return {
        autoSize: true,
        title: {
          text: 'Đóng góp hiệu suất nhân viên',
          fontSize: 16,
        },
        data: chartData,
        series: [{
          type: 'bar',
          xKey: 'employee',
          yKey: 'result',
          fill: '#259c63',
          strokeWidth: 0,
          cornerRadius: 3,
          label: {
            enabled: true,
            formatter: (params) => `${params.value}%`,
            placement: 'inside',
          },
        }],
        axes: [
          {
            type: 'category',
            position: 'bottom',
            title: {
              text: 'Nhân viên',
            },
            label: {
              fontSize: 12,
              rotation: 45,
            },
          },
          {
            type: 'number',
            position: 'left',
            title: {
              text: 'Hiệu suất (%)',
            },
            min: 0,
            max: 100,
            tick: {
              interval: 20,
            },
          },
        ],
      };
    } catch (error) {
      console.error("Error loading chart:", error);
      return null;
    }
  };

  return (
    <Layout style={{ height: '100vh', padding: '10px' }}>
  <Row style={{
        display: 'flex',
        justifyContent: 'start',
        marginBottom: 20,
        alignItems: 'end',
        gridGap: '30px',
        height: '60px',
      }}>
        {/* <Title style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'end' }}
          level={3}>Check-point với nhân viên</Title> */}
        <div style={{ display: 'flex', alignItems: 'end', gap: 10 }}>
          <Button icon={<LeftOutlined />} onClick={handlePrevWeek} />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'end',
            gap: '10px',
          }}
          >
            <span>Chọn tuần</span>
            <WeekPicker
              value={selectedWeek}
              onChange={handleWeekChange}
              placeholder="Chọn tuần"
              format="w/YYYY"
            />
          </div>
          <Button icon={<RightOutlined />} onClick={handleNextWeek} />
        </div>
        <div>
          <Button
            type="primary"
            style={{ backgroundColor: '#259c63', borderColor: '#259c63' }}
            icon={<PlusOutlined />}
            onClick={handleAddEmployee}
          >
            Thêm nhân viên
          </Button>
          {hasChanges && (
            <>
              <Button
                type="primary"
                onClick={handleSave}
                style={{ marginLeft: '10px', backgroundColor: '#259c63', borderColor: '#259c63' }}
              >
                Lưu thay đổi
              </Button>
              <Button
                onClick={handleCancel}
                style={{ marginLeft: '10px' }}
              >
                Huỷ thay đổi
              </Button>
            </>
          )}
        </div>
      </Row>

    <Layout >
      <Sider width={200} style={{ background: '#fff' ,height: 'calc(100% - 90px)', }}>
      <Menu
            mode="inline"
            selectedKeys={[selectedTeam]}
            onClick={handleTeamChange}
            style={{ height: '100%' }}
          >
            <Menu.Item key="team1">Nhóm Sales 10A</Menu.Item>
            <Menu.Item key="team2">Nhóm Sales Horeca</Menu.Item>
            <Menu.Item key="team3">Nhóm Tây Bắc</Menu.Item>
            <Menu.Item key="team4">Team HC-VP</Menu.Item>
            <Menu.Item key="team5">Kế toán</Menu.Item>
          </Menu>
      </Sider>

      <Content style={{ padding: '0 24px', height: 'calc(100% - 90px)' }}>
        <Row style={{ height: '100%' }}>
          <Col span={16}>
            <div className="ag-theme-quartz" style={{ height: '100%' }}>
              <AgGridReact
                style={{ height: '100%', width: '100%' }}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowData={getCurrentWeekData()}
                masterDetail={true}
                detailRowHeight={200}
                detailCellRendererParams={detailCellRendererParams}
                suppressRowTransform={true}
                onCellValueChanged={handleMainDataChange}
                editType="fullRow"
                maintainMasterDetail={true}
                enableRangeSelection={true}
                rowHeight={50}
                isRowMaster={(dataItem) => dataItem?.details?.length >= 0}
                onGridReady={(params) => {
                  const gridApi = params.api;
                  
                  // Wait for initial data to be rendered
                  requestAnimationFrame(() => {
                    if (expandedRows[selectedTeam]) {
                      const currentTeamRows = expandedRows[selectedTeam];
                      Object.keys(currentTeamRows).forEach((code) => {
                        const node = gridApi.getRowNode(code);
                        if (node && currentTeamRows[code]) {
                          node.setExpanded(true);
                        }
                      });
                    }
                  });
                }}
                getRowId={(params) => params.data.id}  // Change to use code instead of id
                onRowGroupOpened={(params) => {
                  if (!params.data?.id) return;
                  
                  const code = params.data.id;
                  const currentTeamState = expandedRows[selectedTeam] || {};
                  
                  saveExpandedState(selectedTeam, {
                    ...currentTeamState,
                    [code]: params.expanded
                  });
                }}
              />
            </div>
          </Col>
          <Col span={8} style={{ padding: '0 10px', height: '100%' }}>
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              justifyContent: 'start', 
              width: '100%', 
              backgroundColor: '#fff' 
            }}>
              <AgCharts options={loadChartData()} />
            </div>
          </Col>
        </Row>
      </Content>
    </Layout>
  </Layout>
  );
};

export default ProductivityManagement;