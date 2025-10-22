import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Input, Card, Tag } from 'antd';
import { SearchOutlined, StarOutlined } from '@ant-design/icons';
import { stepTypeInfo, stepCategories } from '../logic/LogicPipeLine.js';

const StepSelector = ({ onSelect, selectedStepType, availableSteps = [], autoFocus = false }) => {
  const [searchText, setSearchText] = useState('');
  const searchInputRef = useRef(null);

  // Danh sách các step nổi bật (có thể cấu hình)
  const featuredSteps = [ 34 ,5, 21, ]; // Các step phổ biến nhất

  // Lọc steps dựa trên search text
  const filteredSteps = useMemo(() => {
    let steps = availableSteps.filter(stepId => stepTypeInfo[stepId]);

    // Lọc theo search text
    if (searchText) {
      steps = steps.filter(stepId => {
        const step = stepTypeInfo[stepId];
        return (
          step.name.toLowerCase().includes(searchText.toLowerCase()) ||
          step.shortDescription.toLowerCase().includes(searchText.toLowerCase()) ||
          step.description.toLowerCase().includes(searchText.toLowerCase()) ||
          step.tag.toLowerCase().includes(searchText.toLowerCase())
        );
      });
    }

    return steps;
  }, [availableSteps, searchText]);

  const handleStepSelect = (stepId) => {
    onSelect(parseInt(stepId));
  };

  // Auto focus vào trường tìm kiếm khi autoFocus = true
  useEffect(() => {
    if (autoFocus) {
      // Sử dụng nhiều lần setTimeout với thời gian khác nhau để đảm bảo focus
      const focusInput = () => {
        if (searchInputRef.current) {
          const inputElement = searchInputRef.current.input || searchInputRef.current;
          if (inputElement) {
            inputElement.focus();
            inputElement.select(); // Chọn toàn bộ text nếu có
            return true;
          }
        }
        return false;
      };

      if (!focusInput()) {
        // Nếu vẫn chưa focus được, thử tìm input element bằng querySelector
        const inputElement = document.querySelector('input[placeholder="Tìm kiếm process..."]');
        if (inputElement) {
          inputElement.focus();
          inputElement.select();
        }
      }
    }
  }, [autoFocus]);

  // Lọc featured steps từ availableSteps
  const availableFeaturedSteps = featuredSteps.filter(stepId => 
    availableSteps.includes(stepId) && stepTypeInfo[stepId]
  );

  // Lọc steps theo category
  const getStepsByCategory = (categoryId) => {
    if (categoryId === 'all') {
      return filteredSteps;
    }
    const category = stepCategories.find(cat => cat.id === categoryId);
    if (category) {
      return filteredSteps.filter(stepId => category.steps.includes(stepId));
    }
    return [];
  };

  // Màu sắc cho từng loại tag
  const getTagColor = (tagName) => {
    const colorMap = {
      'Làm sạch & Chuẩn hóa Dữ liệu': 'blue',
      'Chuyển đổi & Tái cấu trúc Dữ liệu': 'green', 
      'Lọc & Tổng hợp Dữ liệu': 'orange',
      'Làm giàu & Tích hợp Dữ liệu': 'purple'
    };
    return colorMap[tagName] || 'default';
  };

  return (
    <div style={{ width: '100%', height: '80vh' }}>
      {/* Search và Filter */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Input
          ref={searchInputRef}
          placeholder="Tìm kiếm process..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ flex: 1 }}
          autoFocus={autoFocus}
        />
      </div>

      {/* Layout chính với 5 phần */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '16px', 
        height: 'calc(80vh - 60px)' 
      }}>

        {/* 5 phần tất cả - hiển thị dọc với cuộn riêng biệt */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
          gap: '16px',
          flex: 1,
          minHeight: 0
        }}>
          {/* Phần Nổi bật đã được thêm vào grid */}
          <div style={{ 
            border: '1px solid #f0f0f0',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}>
            <div style={{ 
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '12px',
              color: '#1890ff',
              borderBottom: '1px solid #f0f0f0',
              paddingBottom: '8px'
            }}>
              <StarOutlined style={{ marginRight: '8px' }} />
              Nổi bật
            </div>
            <div style={{ 
              flex: 1,
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              {availableFeaturedSteps.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#8c8c8c',
                  fontSize: '14px',
                  padding: '20px 0'
                }}>
                  Không có process nào
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availableFeaturedSteps.map(stepId => {
                    const step = stepTypeInfo[stepId];
                    const isSelected = selectedStepType === stepId;
                    
                    return (
                      <Card
                        key={stepId}
                        size="small"
                        hoverable
                        onClick={() => handleStepSelect(stepId)}
                        style={{
                          cursor: 'pointer',
                          border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                          backgroundColor: isSelected ? '#f0f8ff' : '#fff',
                          transition: 'all 0.2s'
                        }}
                        bodyStyle={{ padding: '8px' }}
                      >
                        <div style={{ marginBottom: '4px' }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: isSelected ? '#1890ff' : '#262626',
                            marginBottom: '2px'
                          }}>
                            {step.shortDescription}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#8c8c8c',
                            lineHeight: '1.3'
                          }}>
                            {step.description}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <Tag
                            size="small"
                            color={isSelected ? getTagColor(step.tag) : getTagColor(step.tag)}
                            style={{ fontSize: '13px' }}
                          >
                            {step.tag}
                          </Tag>
                          {isSelected && (
                            <div style={{
                              fontSize: '12px',
                              color: '#1890ff',
                              fontWeight: 'bold'
                            }}>
                              ✓
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {stepCategories.map((category, index) => {
            const categorySteps = getStepsByCategory(category.id);
            
            return (
              <div 
                key={category.id}
                style={{ 
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0
                }}
              >
                <div style={{ 
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  borderBottom: '1px solid #f0f0f0',
                  paddingBottom: '8px'
                }}>
                  {category.name}
                </div>
                
                <div style={{ 
                  flex: 1,
                  overflowY: 'auto',
                  paddingRight: '8px'
                }}>
                  {categorySteps.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#8c8c8c',
                      fontSize: '14px',
                      padding: '20px 0'
                    }}>
                      Không có process nào
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {categorySteps.map(stepId => {
                        const step = stepTypeInfo[stepId];
                        const isSelected = selectedStepType === stepId;

                        return (
                          <Card
                            key={stepId}
                            size="small"
                            hoverable
                            onClick={() => handleStepSelect(stepId)}
                            style={{
                              cursor: 'pointer',
                              border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                              backgroundColor: isSelected ? '#f0f8ff' : '#fff',
                              transition: 'all 0.2s'
                            }}
                            bodyStyle={{ padding: '8px' }}
                          >
                        <div style={{ marginBottom: '4px' }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: isSelected ? '#1890ff' : '#262626',
                            marginBottom: '2px'
                          }}>
                            {step.shortDescription}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#8c8c8c',
                            lineHeight: '1.3'
                          }}>
                            {step.description}
                          </div>
                        </div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                            <Tag
                              size="small"
                              color={isSelected ? getTagColor(step.tag) : getTagColor(step.tag)}
                              style={{ fontSize: '13px' }}
                            >
                              {step.tag}
                            </Tag>
                              {isSelected && (
                                <div style={{
                                  fontSize: '12px',
                                  color: '#1890ff',
                                  fontWeight: 'bold'
                                }}>
                                  ✓
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepSelector;
