import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button } from 'antd';
import { CloseOutlined, DragOutlined } from '@ant-design/icons';
import css from '../BaoCao/BaoCao.module.css';

const DraggableModal = ({ 
  isOpen, 
  onClose, 
  title = "Modal", 
  children, 
  width = 600, 
  height = 400 
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Center modal on open
      const centerX = (window.innerWidth - width) / 2;
      const centerY = (window.innerHeight - height) / 2;
      setPosition({ x: centerX, y: centerY });
    }
  }, [isOpen, width, height]);

  const handleMouseDown = (e) => {
    if (e.target === headerRef.current || headerRef.current.contains(e.target)) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Keep modal within viewport bounds
      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - height;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  if (!isOpen) return null;

  return (
    <div
      className={css.modalOverlay}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className={css.draggableModal}
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: width,
          height: height,
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'default'
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Header */}
        <div
          ref={headerRef}
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e8e8e8',
            backgroundColor: '#fafafa',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DragOutlined style={{ color: '#999' }} />
            <span style={{ fontWeight: '500', fontSize: '16px' }}>{title}</span>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            style={{
              border: 'none',
              boxShadow: 'none',
              padding: '4px',
              minWidth: 'auto'
            }}
          />
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: '20px',
            overflow: 'auto'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default DraggableModal;
