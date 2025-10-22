import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AgGridReact } from 'ag-grid-react';
import { Badge, Button, Card, DatePicker, Input, Space, Tag, Typography } from 'antd';
import {
  CheckCircle,
  Clock,
  Mail,
  XCircle
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { getEmailReportData } from '../../../../apis/emailHistoryCRMService';
import { formatDateTimeUTCToVietnam } from '../../../../generalFunction/format';
import styles from './EmailReportDashboard.module.css';
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const EmailReportDashboard = () => {
  const [dateRange, setDateRange] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [gridApi, setGridApi] = useState(null);
  const [reportData, setReportData] = useState({
    statistics: {
      totalEmails: 0,
      sentEmails: 0,
      failedEmails: 0,
      successRate: 0,
      automatedEmails: 0,
      manualEmails: 0,
      scriptEmails: 0
    },
    emailsByCustomer: [],
    loading: true,
    error: null
  });

  const statusBar = useMemo(() => ({
    statusPanels: [{ statusPanel: 'agAggregationComponent' }]
  }), []);
  
  const loadReportData = async () => {
    try {
      setReportData(prev => ({ ...prev, loading: true, error: null }));

      // Build filters object
      const filters = {};
      if (dateRange && dateRange.length === 2) {
        filters.dateFrom = dateRange[0].format('YYYY-MM-DD');
        filters.dateTo = dateRange[1].format('YYYY-MM-DD');
      }

      const data = await getEmailReportData(filters);
      setReportData({
        statistics: data.statistics || reportData.statistics,
        emailsByCustomer: data.emailsByCustomer || [],
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      setReportData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange]);
  // Sử dụng dữ liệu từ API
  const { statistics, emailsByCustomer, loading, error } = reportData;


  // Chuyển đổi dữ liệu cho AG Grid với treeData structure và filter
  const gridData = useMemo(() => {
    const flatData = [];

    emailsByCustomer.forEach(emailGroup => {
      // Filter emails trong group theo searchText
      const filteredEmails = emailGroup.emails.filter(email => {
        if (!searchText) return true;

        const searchLower = searchText.toLowerCase();
        return (
          email.customer_email?.toLowerCase().includes(searchLower) ||
          email.subject?.toLowerCase().includes(searchLower) ||
          email.customer_info?.name?.toLowerCase().includes(searchLower) ||
          email.customer_info?.phone?.toLowerCase().includes(searchLower) ||
          email.customer_info?.company?.toLowerCase().includes(searchLower) ||
          email.info?.scriptName?.toLowerCase().includes(searchLower)
        );
      });

      // Chỉ hiển thị group nếu có email phù hợp hoặc không có search
      if (filteredEmails.length > 0 || !searchText) {
        // Thêm group row (parent)
        flatData.push({
          id: `group-${emailGroup.customer_email}`,
          customer_email: emailGroup.customer_email,
          customer_info: emailGroup.customer_info,
          totalEmails: searchText ? filteredEmails.length : emailGroup.totalEmails,
          sentEmails: searchText ? filteredEmails.filter(e => e.status === 'sent').length : emailGroup.sentEmails,
          failedEmails: searchText ? filteredEmails.filter(e => e.status === 'failed').length : emailGroup.failedEmails,
          lastEmailDate: emailGroup.lastEmailDate,
          isGroup: true,
          groupPath: [emailGroup.customer_email], // Path cho treeData
          // Thêm các field cho email rows để hiển thị trong group
          subject: null,
          status: null,
          type: null,
          sent_at: null,
          template_id: null
        });

        // Thêm các email rows (children) - chỉ những email đã filter
        filteredEmails.forEach((email, index) => {
          flatData.push({
            ...email,
            id: `email-${email.id}`,
            customer_info: email.customer_info || emailGroup.customer_info,
            isGroup: false,
            groupPath: [emailGroup.customer_email, `email-${index}`], // Path cho treeData
            // Thêm thống kê từ group
            totalEmails: emailGroup.totalEmails,
            sentEmails: emailGroup.sentEmails,
            failedEmails: emailGroup.failedEmails,
            lastEmailDate: emailGroup.lastEmailDate
          });
        });
      }
    });

    return flatData;
  }, [emailsByCustomer, searchText]);

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    {
      field: 'customer_email',
      headerName: 'Địa chỉ Email',
      width: 400,
      cellRenderer: (params) => {
        // Chỉ hiển thị cho group rows (parent)
        if (params.data.isGroup) {
          return (
            <div>
              {params.value}
            </div>
          );
        }
        // Cho email rows (children) - hiển thị email address
        return (
          <div style={{
            paddingLeft: '20px',
            fontSize: '13px',
            color: '#495057'
          }}>
            {params.value}
          </div>
        );
      },
      cellStyle: (params) => {
        if (params.data.isGroup) {
          return {
            backgroundColor: '#f8f9fa',
            fontWeight: 'bold'
          };
        }
        return {
          backgroundColor: '#ffffff',
          paddingLeft: '20px'
        };
      }
    },
    {
      field: 'totalEmails',
      headerName: 'Thống kê',
      width: 240,
      cellRenderer: (params) => {
        if (params.data.isGroup) {
          return (
            <div>
              <Badge count={params.data.totalEmails} style={{ backgroundColor: '#1890ff' }} />
              <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                {params.data.sentEmails} thành công, {params.data.failedEmails} thất bại
              </span>
            </div>
          );
        }
        return null;
      }
    },
    {
      field: 'customer_item_info',
      headerName: 'Phiên bản',
      width: 180,
      cellRenderer: (params) => {
        if (!params.data.isGroup && params.data.customer_item_info) {
          return (
            <div style={{
              fontWeight: '600',
              color: '#1890ff',
              fontSize: '14px',
            }}>
              {params.data.customer_item_info?.name}
            </div>
          );
        }
        return null;
      }
    },
    {
      field: 'customer_name',
      headerName: 'Tên khách hàng',
      width: 180,
      cellRenderer: (params) => {
        if (!params.data.isGroup && params.data.customer_info) {
          return (
            <div style={{
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {params.data.customer_info?.name}
            </div>
          );
        }
        return null;
      }
    },
    {
      field: 'customer_phone',
      headerName: 'Số điện thoại',
      width: 140,
      cellRenderer: (params) => {
        if (!params.data.isGroup && params.data.customer_info) {
          return (
            <div style={{
              fontSize: '13px'
            }}>
              {params.data.customer_info?.phone}
            </div>
          );
        }
        return null;
      }
    },
    {
      field: 'customer_company',
      headerName: 'Công ty',
      width: 160,
      cellRenderer: (params) => {
        if (!params.data.isGroup && params.data.customer_info) {
          return (
            <div style={{
              fontSize: '13px'
            }}>
              {params.data.customer_info?.company}
            </div>
          );
        }
        return null;
      }
    },
    {
      field: 'customer_note',
      headerName: 'Ghi chú',
      width: 260,
      cellRenderer: (params) => {
        if (!params.data.isGroup && params.data.customer_info) {
          return (
            <div style={{
              fontSize: '13px'
            }}>
              {params.data.customer_info?.note}
            </div>
          );
        }
        return null;
      }
    },
    {
      field: 'subject',
      headerName: 'Tiêu đề email',
      width: 300,
      cellRenderer: (params) => {
        if (!params.data.isGroup) {
          return (
            <div>
              <div style={{ fontWeight: 'bold' }}>{params.value}</div>
              {params.data.info?.scriptName && (
                <Tag color="green" size="small" style={{ marginTop: '4px' }}>
                  {params.data.info.scriptName}
                </Tag>
              )}
            </div>
          );
        }
        return null;
      }
    },


    {
      field: 'created_at',
      headerName: 'Ngày gửi',
      width: 160,
      cellRenderer: (params) => {
        if (!params.data.isGroup) {
          return formatDateTimeUTCToVietnam(params.value);
        }
        return null;
      }
    },
    {
      field: 'type',
      headerName: 'Loại gửi',
      width: 120,
      cellRenderer: (params) => {
        if (!params.data.isGroup) {
          const emailType = params.data.info?.email_type;
          const scriptName = params.data.info?.scriptName;
          
          // Kiểm tra nếu có scriptName hoặc emailType là 'script'
          if ( params.value === 'script') {
            return (
              <Tag color="green">
                 Kịch bản
              </Tag>
            );
          }
          
          return (
            <Tag color={
              params.value === 'immediate' ? 'blue' :
                params.value === 'scheduled' ? 'purple' : 'default'
            }>
              {params.value === 'immediate' ? 'Ngay lập tức' :
                params.value === 'scheduled' ? 'Đã lên lịch' : params.value}
            </Tag>
          );
        }
        return null;
      }
    },
    // {
    //   field: 'status',
    //   headerName: 'Status',
    //   width: 120,
    //   cellRenderer: (params) => {
    //     if (!params.data.isGroup) {
    //       return (
    //         <Tag color={
    //           params.value === 'sent' ? 'green' :
    //             params.value === 'failed' ? 'red' : 'orange'
    //         }>
    //           {params.value === 'sent' ? 'Đã gửi' :
    //             params.value === 'failed' ? 'Thất bại' : 'Chờ gửi'}
    //         </Tag>
    //       );
    //     }
    //     return null;
    //   }
    // },

  ], []);

  // AG Grid options
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    cellStyle: { fontSize: '14px' }
  }), []);

  // State để quản lý expanded groups


  // Helper functions for rendering
  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle size={16} color="#52c41a" />;
      case 'failed':
        return <XCircle size={16} color="#ff4d4f" />;
      case 'pending':
        return <Clock size={16} color="#faad14" />;
      default:
        return <Mail size={16} color="#1890ff" />;
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ color: 'red' }}>Lỗi: {error}</div>
          <Button onClick={loadReportData} style={{ marginTop: '16px' }}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer} >
      {/* Header */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerLeft}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '20px' }}>
            <Mail size={20} color="#1890ff" />
            Báo cáo Email Chăm sóc Khách hàng
          </Title>

        </div>
        <div className={styles.headerRight}>
          <Space>
            <Input.Search
              placeholder="Tìm kiếm email, tên, phone, công ty, kịch bản..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder={['Từ ngày', 'Đến ngày']}
            />
            <Button
              onClick={loadReportData}
              style={{ marginRight: '8px' }}
            >
              Refresh
            </Button>

          </Space>
        </div>
      </div>



      {/* Email History - AG Grid */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Card
          title={
            <div className={styles.cardTitle}>
              <span>📧 Lịch sử gửi email theo địa chỉ email</span>
              <div className={styles.cardTitleStats}>
                <Tag color="blue">{emailsByCustomer.length} địa chỉ email</Tag>
                <Tag color="green">{statistics.totalEmails} email</Tag>
              </div>
            </div>
          }
          className={styles.tableCard}
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          bodyStyle={{ flex: 1, minHeight: 0 }}
          extra={
            <div className={styles.cardExtra}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Cập nhật: {new Date().toLocaleString('vi-VN')}
              </Text>
            </div>
          }
        >

          <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
            <AgGridReact
              rowData={gridData}
              columnDefs={columnDefs}
              statusBar={statusBar}
              enableRangeSelection={true}
              defaultColDef={defaultColDef}
              treeData={true}
              getDataPath={(data) => data.groupPath}
              groupDefaultExpanded={-1}
              animateRows={true}
              suppressRowClickSelection={true}
              pagination={true}
              paginationPageSize={50}
              paginationPageSizeSelector={[25, 50, 100, 200]}
              onGridReady={(params) => {
                setGridApi(params.api);
                params.api.sizeColumnsToFit();
              }}
              autoGroupColumnDef={{
                headerName: '',
                maxWidth: 30,
                editable: false,
                floatingFilter: false,
                cellRendererParams: {
                  suppressCount: true,
                },
                pinned: 'left',
              }}
              rowClassRules={{
                'row-group': (params) => {
                  return params.data.isGroup;
                },
              }}
            />
          </div>
        </Card>
      </div>
    </div>

  );
};

export default EmailReportDashboard;
