import React, { useState } from 'react';
import { List, Card, Input, Button, DatePicker, Select, Modal, Tag } from 'antd';
import { SearchOutlined, EyeOutlined, CalendarOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from '../../K9.module.css';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const DiaryTab = ({ acceptedThesis }) => {
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedThesis, setSelectedThesis] = useState(null);

  // Filter thesis based on search and filters
  const filteredThesis = acceptedThesis.filter(thesis => {
    // Search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      if (!thesis.title.toLowerCase().includes(searchLower) &&
          !thesis.content.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Date range filter
    if (dateRange && dateRange.length === 2) {
      const thesisDate = dayjs(thesis.acceptedAt);
      if (!thesisDate.isBetween(dateRange[0], dateRange[1], 'day', '[]')) {
        return false;
      }
    }

    return true;
  });

  const handleViewDetails = (thesis) => {
    setSelectedThesis(thesis);
    setViewModalVisible(true);
  };

  const getThesisTypeColor = (content) => {
    if (content.toLowerCase().includes('buy') || content.toLowerCase().includes('mua')) {
      return '#52c41a';
    } else if (content.toLowerCase().includes('sell') || content.toLowerCase().includes('bán')) {
      return '#ff4d4f';
    } else if (content.toLowerCase().includes('hold') || content.toLowerCase().includes('giữ')) {
      return '#faad14';
    }
    return '#1890ff';
  };

  const getThesisType = (content) => {
    const contentLower = content.toLowerCase();
    if (contentLower.includes('buy') || contentLower.includes('mua')) {
      return 'BUY';
    } else if (contentLower.includes('sell') || contentLower.includes('bán')) {
      return 'SELL';
    } else if (contentLower.includes('hold') || contentLower.includes('giữ')) {
      return 'HOLD';
    }
    return 'ANALYSIS';
  };

  return (
    <div className={styles.diaryContainer}>
      <div className={styles.diaryHeader}>
        <h3>Investment Diary</h3>
        <p>Lưu trữ tất cả investment thesis đã được accept</p>
      </div>

      {/* Filters */}
      <div className={styles.diaryFilters}>
        <div className={styles.filterRow}>
          <Search
            placeholder="Tìm kiếm trong thesis..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={setSearchText}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
            style={{ width: 250 }}
          />

          <Button
            onClick={() => {
              setSearchText('');
              setDateRange(null);
              setStatusFilter('all');
            }}
            icon={<FilterOutlined />}
          >
            Xóa bộ lọc
          </Button>
        </div>
      </div>

      {filteredThesis.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📚</div>
          <h4>
            {acceptedThesis.length === 0 
              ? 'Chưa có thesis nào trong nhật ký' 
              : 'Không tìm thấy thesis phù hợp'
            }
          </h4>
          <p>
            {acceptedThesis.length === 0 
              ? 'Các thesis được accept sẽ tự động lưu vào đây' 
              : 'Thử thay đổi điều kiện tìm kiếm'
            }
          </p>
        </div>
      ) : (
        <div className={styles.diaryList}>
          <div className={styles.diaryStats}>
            <span>Tổng cộng: <strong>{filteredThesis.length}</strong> thesis</span>
            {dateRange && (
              <span> | Trong khoảng: {dateRange[0].format('DD/MM/YYYY')} - {dateRange[1].format('DD/MM/YYYY')}</span>
            )}
          </div>

          <List
            itemLayout="vertical"
            size="large"
            dataSource={filteredThesis.sort((a, b) => new Date(b.acceptedAt) - new Date(a.acceptedAt))}
            renderItem={(thesis) => (
              <List.Item
                key={thesis.id}
                className={styles.diaryItem}
                actions={[
                  <Button
                    key="view"
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetails(thesis)}
                  >
                    Xem chi tiết
                  </Button>
                ]}
              >
                <Card 
                  className={styles.diaryCard}
                  hoverable
                >
                  <div className={styles.diaryCardHeader}>
                    <div className={styles.diaryTitle}>
                      <h4>{thesis.title}</h4>
                      <div className={styles.diaryTags}>
                        <Tag color={getThesisTypeColor(thesis.content)}>
                          {getThesisType(thesis.content)}
                        </Tag>
                        <Tag icon={<CalendarOutlined />} color="blue">
                          {dayjs(thesis.date).format('DD/MM/YYYY')}
                        </Tag>
                      </div>
                    </div>
                    <div className={styles.diaryMeta}>
                      <span>Accept: {dayjs(thesis.acceptedAt).format('DD/MM/YYYY HH:mm')}</span>
                    </div>
                  </div>
                  
                  <div className={styles.diaryContent}>
                    <div className={styles.diaryPreview}>
                      {thesis.content.length > 200 
                        ? thesis.content.substring(0, 200) + '...' 
                        : thesis.content
                      }
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </div>
      )}

      {/* View Details Modal */}
      <Modal
        title={
          <div className={styles.modalHeader}>
            <span>{selectedThesis?.title}</span>
            <div className={styles.modalHeaderTags}>
              <Tag color={getThesisTypeColor(selectedThesis?.content || '')}>
                {getThesisType(selectedThesis?.content || '')}
              </Tag>
              <Tag icon={<CalendarOutlined />} color="blue">
                {selectedThesis && dayjs(selectedThesis.date).format('DD/MM/YYYY')}
              </Tag>
            </div>
          </div>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Đóng
          </Button>
        ]}
      >
        {selectedThesis && (
          <div className={styles.thesisDetailsModal}>
            <div className={styles.modalMeta}>
              <div><strong>Ngày thesis:</strong> {dayjs(selectedThesis.date).format('DD/MM/YYYY')}</div>
              <div><strong>Ngày accept:</strong> {dayjs(selectedThesis.acceptedAt).format('DD/MM/YYYY HH:mm')}</div>
              <div><strong>Status:</strong> <Tag color="green">Accepted</Tag></div>
            </div>
            
            <div className={styles.modalContent}>
              <h4>Nội dung Investment Thesis:</h4>
              <div className={styles.thesisFullContent}>
                {selectedThesis.content.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DiaryTab; 