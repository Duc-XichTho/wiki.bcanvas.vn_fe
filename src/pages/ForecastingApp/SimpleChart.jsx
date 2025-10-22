import React from 'react';
import { Card, Flex, Typography } from 'antd';

const { Title, Text } = Typography;

export default function SimpleChart({ data }) {
  const maxValue = Math.max(...data.map(d => Math.max(d.forecast, d.actual)));
  const chartHeight = 224;
  const chartWidth = 320;
  const padding = 32;

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * (chartWidth - 2 * padding);
    const forecastY = padding + ((maxValue - item.forecast) / maxValue) * (chartHeight - 2 * padding);
    const actualY = padding + ((maxValue - item.actual) / maxValue) * (chartHeight - 2 * padding);
    
    return { x, forecastY, actualY, month: item.month };
  });

  const forecastPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.forecastY}`).join(' ');
  const actualPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.actualY}`).join(' ');

  return (
    <Card>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>📊 Forecast vs Actual</Title>
        <Flex gap={12}>
          <Flex align="center" gap={6}>
            <div style={{ width: 12, height: 2, backgroundColor: '#1890ff' }}></div>
            <Text type="secondary" style={{ fontSize: 12 }}>Forecast</Text>
          </Flex>
          <Flex align="center" gap={6}>
            <div style={{ width: 12, height: 2, backgroundColor: '#52c41a' }}></div>
            <Text type="secondary" style={{ fontSize: 12 }}>Actual</Text>
          </Flex>
        </Flex>
      </Flex>
      
      <svg width={chartWidth} height={chartHeight + 24} style={{ overflow: 'visible' }}>
        <defs>
          <pattern id="grid" width="40" height="16" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 16" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
          </pattern>
        </defs>
        
        <rect width={chartWidth} height={chartHeight} fill="url(#grid)" opacity="0.3"/>
        
        <path d={forecastPath} fill="none" stroke="#1890ff" strokeWidth="2"/>
        <path d={actualPath} fill="none" stroke="#52c41a" strokeWidth="2"/>
        
        {points.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.forecastY} r="2.5" fill="#1890ff" />
            <circle cx={point.x} cy={point.actualY} r="2.5" fill="#52c41a" />
            <text 
              x={point.x} 
              y={chartHeight + 18} 
              textAnchor="middle" 
              fontSize="10" 
              fill="#8c8c8c"
            >
              {point.month}
            </text>
          </g>
        ))}
      </svg>
    </Card>
  );
} 