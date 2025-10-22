import React, { useState } from 'react';
import { Checkbox } from 'antd';
import { CaretRightOutlined, CaretDownOutlined } from '@ant-design/icons';
import css from './Permission.module.css';
import { data } from './data';

const Permission = () => {
  const [checkedState, setCheckedState] = useState({
    chain: {},    
    subChain: {}, 
    step: {},     
    section: {}   
  });

  const [expandedNodes, setExpandedNodes] = useState({});

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const renderCheckboxGroup = (level, id) => (
    <div className={css.checkboxGroup}>
      <Checkbox
        onChange={(e) => handleCheckboxChange(level, id, 'create', e.target.checked)}
        checked={checkedState[level][id]?.create}
      >
        Tạo
      </Checkbox>
      <Checkbox
        onChange={(e) => handleCheckboxChange(level, id, 'read', e.target.checked)}
        checked={checkedState[level][id]?.read}
      >
        Xem
      </Checkbox>
      <Checkbox
        onChange={(e) => handleCheckboxChange(level, id, 'update', e.target.checked)}
        checked={checkedState[level][id]?.update}
      >
        Sửa
      </Checkbox>
      <Checkbox
        onChange={(e) => handleCheckboxChange(level, id, 'delete', e.target.checked)}
        checked={checkedState[level][id]?.delete}
      >
        Xóa
      </Checkbox>
      <Checkbox
        onChange={(e) => handleCheckboxChange(level, id, 'confirm', e.target.checked)}
        checked={checkedState[level][id]?.confirm}
      >
        Xác nhận
      </Checkbox>
      <Checkbox
        onChange={(e) => handleCheckboxChange(level, id, 'approve1', e.target.checked)}
        checked={checkedState[level][id]?.approve1}
      >
        Duyệt 1
      </Checkbox>
      <Checkbox
        onChange={(e) => handleCheckboxChange(level, id, 'approve2', e.target.checked)}
        checked={checkedState[level][id]?.approve2}
      >
        Duyệt 2
      </Checkbox>
    </div>
  );

  const handleCheckboxChange = (level, id, permission, checked) => {
    const newState = { ...checkedState };
    
    if (!newState[level][id]) {
      newState[level][id] = {};
    }
    newState[level][id][permission] = checked;


    if (level === 'chain') {

      const chain = data.find(c => c.id === id);
      if (chain) {

        chain.subChains.forEach(subChain => {
          if (!newState.subChain[subChain.id]) {
            newState.subChain[subChain.id] = {};
          }
          newState.subChain[subChain.id][permission] = checked;

          subChain.steps.forEach(step => {
            if (!newState.step[step.id]) {
              newState.step[step.id] = {};
            }
            newState.step[step.id][permission] = checked;

            step.sections.forEach(section => {
              if (!newState.section[section.id]) {
                newState.section[section.id] = {};
              }
              newState.section[section.id][permission] = checked;
            });
          });
        });
      }
    } else if (level === 'subChain') {
      // Tìm subChain trong data
      const chain = data.find(c => 
        c.subChains.some(sub => sub.id === id)
      );
      const subChain = chain?.subChains.find(sub => sub.id === id);
      
      if (subChain) {
        subChain.steps.forEach(step => {
          if (!newState.step[step.id]) {
            newState.step[step.id] = {};
          }
          newState.step[step.id][permission] = checked;

          step.sections.forEach(section => {
            if (!newState.section[section.id]) {
              newState.section[section.id] = {};
            }
            newState.section[section.id][permission] = checked;
          });
        });
      }
    } else if (level === 'step') {
      const chain = data.find(c => 
        c.subChains.some(sub => 
          sub.steps.some(s => s.id === id)
        )
      );
      const subChain = chain?.subChains.find(sub => 
        sub.steps.some(s => s.id === id)
      );
      const step = subChain?.steps.find(s => s.id === id);

      if (step) {
        step.sections.forEach(section => {
          if (!newState.section[section.id]) {
            newState.section[section.id] = {};
          }
          newState.section[section.id][permission] = checked;
        });
      }
    }

    setCheckedState(newState);
  };

  const renderTreeNode = (node, level, depth = 0) => {
    const nodeId = node.id;
    const isExpanded = expandedNodes[nodeId];
    const hasChildren = level !== 'section' && node[level === 'chain' ? 'subChains' : level === 'subChain' ? 'steps' : 'sections']?.length > 0;

    return (
      <div key={nodeId} className={css.treeNode} style={{ marginLeft: `${depth * 24}px` }}>
        <div className={css.nodeHeader}>
          {hasChildren && (
            <span 
              className={css.expandIcon} 
              onClick={() => toggleNode(nodeId)}
            >
              {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
            </span>
          )}
          <span className={css.nodeName}>{node.name}</span>
          {renderCheckboxGroup(level, nodeId)}
        </div>
        
        {hasChildren && isExpanded && (
          <div className={css.nodeChildren}>
            {level === 'chain' && node.subChains.map(subChain => 
              renderTreeNode(subChain, 'subChain', depth + 1)
            )}
            {level === 'subChain' && node.steps.map(step => 
              renderTreeNode(step, 'step', depth + 1)
            )}
            {level === 'step' && node.sections.map(section => 
              renderTreeNode(section, 'section', depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={css.permissionTree}>
      {data.map(chain => renderTreeNode(chain, 'chain'))}
    </div>
  );
};

export default Permission;
