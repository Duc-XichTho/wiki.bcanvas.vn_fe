import React from 'react';
import { Card, Typography, Space, Alert } from 'antd';

const { Title } = Typography;

export default function AnalysisNotes() {
  return (
    <Card style={{ flex: 1, height: 320 }}>
      <Title level={5} style={{ marginBottom: 12 }}>📝 Analysis Notes</Title>
      <div style={{ height: 256, overflowY: 'auto' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="📊 Accuracy Trend"
            description="Average accuracy maintained at 96.9% across all forecast periods. Model performance remains stable with consistent prediction quality."
            type="info"
            showIcon
          />
          
          <Alert
            message="💡 Key Insights"
            description="Weekend sales consistently show 20% higher performance than weekday predictions. Consider adjusting weekend multipliers for better accuracy."
            type="success"
            showIcon
          />
          
          <Alert
            message="⚠️ Observations"
            description="Flash sales events demonstrate 15% variance from baseline. Historical data suggests promotional impact peaks at day 2-3 of campaign duration."
            type="warning"
            showIcon
          />
          
          <Alert
            message="✅ Recommendations"
            description="Consider increasing forecast confidence for established seasonal patterns. Q2 trends align well with historical data and show strong predictive indicators."
            type="success"
            showIcon
          />
          
          <Alert
            message="🎯 Seasonal Patterns"
            description="Monthly seasonal adjustments show 8-12% variance during holiday periods. Vietnamese New Year impact extends 2 weeks beyond traditional celebrations."
            type="info"
            showIcon
          />
          
          <Alert
            message="🔍 Data Quality"
            description="Recent data completeness at 98.7%. Missing data points primarily from weekend offline transactions. Consider automated data validation."
            type="error"
            showIcon
          />
          
          <Alert
            message="📊 Model Performance"
            description="Current algorithm shows improved performance on 7-day rolling forecasts. Consider extending forecast horizon for strategic planning purposes."
            type="info"
            showIcon
          />
        </Space>
      </div>
    </Card>
  );
} 