import React from 'react';
import { Card, Flex, Button, Input } from 'antd';
import { EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

export default function JobTabs({ 
  forecastingJobs, 
  activeJob, 
  setActiveJob, 
  editingJob, 
  setEditingJob,
  handleJobEdit,
  handleJobSave,
  handleJobCancel
}) {
  return (
    <Card style={{ marginBottom: 16, borderRadius: 0 }}>
      <Flex gap={8} align="center">
        {forecastingJobs.map((job) => (
          <div key={job.id} style={{ position: 'relative' }}>
            {editingJob && editingJob.id === job.id ? (
              <Flex gap={8} align="center">
                <Input
                  value={editingJob.name}
                  onChange={(e) => setEditingJob({...editingJob, name: e.target.value})}
                  size="small"
                  style={{ width: 120 }}
                  autoFocus
                />
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={handleJobSave}
                  style={{ color: '#52c41a' }}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={handleJobCancel}
                  style={{ color: '#ff4d4f' }}
                />
              </Flex>
            ) : (
              <Flex gap={4} align="center">
                <Button
                  type={activeJob === job.id ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setActiveJob(job.id)}
                >
                  {job.name}
                </Button>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleJobEdit(job)}
                  style={{ opacity: 0.6 }}
                />
              </Flex>
            )}
          </div>
        ))}
      </Flex>
    </Card>
  );
} 