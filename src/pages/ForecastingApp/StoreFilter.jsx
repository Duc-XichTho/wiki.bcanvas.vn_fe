import React from 'react';
import { Card, Input, Tag, Flex, Checkbox, Space, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function StoreFilter({
  searchQuery,
  setSearchQuery,
  selectedTags,
  setSelectedTags,
  selectedStores,
  handleStoreToggle,
  handleSelectAll,
  handleUnselectAll,
  getSelectionState,
  filteredStores,
  tags,
  lastRunTime
}) {
  return (
    <div style={{ width: 320, flexShrink: 0 }}>
      {/* Current Forecast Version Panel */}
      <Card style={{ marginBottom: 16 }}>
        <Text strong style={{ fontSize: 16, marginBottom: 12, display: 'block' }}>
          📊 Dự báo hiện tại
        </Text>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Forecast Run 23/6-29/6 v3</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>Created: {lastRunTime}</Text>
          </div>
        </Space>
      </Card>

      <Card>
        <Text strong style={{ fontSize: 16, marginBottom: 12, display: 'block' }}>
          🏪 Stores
        </Text>
        
        {/* Search */}
        <Input
          placeholder="Search stores..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        {/* Tag Filter */}
        <div style={{ marginBottom: 12 }}>
          <Flex wrap="wrap" gap={4}>
            {tags.map((tag) => (
              <Tag
                key={tag}
                color={selectedTags.includes(tag) ? 'blue' : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSelectedTags(prev =>
                    prev.includes(tag)
                      ? prev.filter(t => t !== tag)
                      : [...prev, tag]
                  );
                }}
              >
                {tag}
              </Tag>
            ))}
          </Flex>
        </div>

        {/* Select All/None */}
        <Flex justify="space-between" align="center" style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
          <Flex gap={8} align="center">
            <Checkbox
              indeterminate={getSelectionState() === 'partial'}
              checked={getSelectionState() === 'all'}
              onChange={() => {
                const state = getSelectionState();
                if (state === 'all') {
                  handleUnselectAll();
                } else {
                  handleSelectAll();
                }
              }}
            />
            <Text style={{ fontSize: 14 }}>Select All</Text>
          </Flex>
          <Flex gap={8}>
            <button 
              type="button" 
              style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
              onClick={handleSelectAll}
            >
              All
            </button>
            <Text type="secondary">|</Text>
            <button 
              type="button" 
              style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
              onClick={handleUnselectAll}
            >
              None
            </button>
          </Flex>
        </Flex>

        {/* Store List */}
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {filteredStores.map((store) => (
              <Flex key={store.id} gap={12} align="center">
                <Checkbox
                  checked={selectedStores.includes(store.id)}
                  onChange={() => handleStoreToggle(store.id)}
                />
                <div style={{ flex: 1 }}>
                  <div>{store.name}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{store.tag}</Text>
                </div>
              </Flex>
            ))}
          </Space>
        </div>
      </Card>
    </div>
  );
} 