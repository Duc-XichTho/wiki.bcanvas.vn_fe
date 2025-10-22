import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import StepSelector from './StepSelector.jsx';
import { stepTypeInfo } from '../logic/LogicPipeLine.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import Draggable from 'react-draggable';
const AddStepModal = ({
  visible,
  onCancel,
  onOk,
  addStepType,
  setAddStepType,
  tempConfig,
  setTempConfig,
  renderConfigForm,
  steps = [],
  autorun = false,
  getInputColumns,
  setInputColumns,
  modalKey,
  aiTransformerTestStatus = false,
  setAiTransformerTestStatus,
  uploadSaving = false,
  handleUploadSaveAndAddStep,
  showStepSelector,
  setShowStepSelector
}) => {
  const [autoFocus, setAutoFocus] = useState(false);
  const [dragDisabled, setDragDisabled] = useState(true);
  const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
  const dragRef = useRef(null);

  // Reset state khi modal mở/đóng
  useEffect(() => {
    if (!addStepType) {
      setShowStepSelector(true);
      setAddStepType(null);
    }


  }, [visible, setAddStepType]);

  useEffect(() => {
    if (visible && showStepSelector ) {
      // Focus vào input tìm kiếm sau khi modal mở
      setAutoFocus(true);
    }
  }, [visible, showStepSelector ]);
  const handleStepSelect = async (stepId) => {
    setAddStepType(stepId);
    setShowStepSelector(false);

    // Xác định inputStepId mặc định khi thêm step mới
    let defaultInputStepId = null;
    if (steps && steps.length > 0) {
      // Sử dụng step cuối cùng làm nguồn dữ liệu mặc định
      defaultInputStepId = steps[steps.length - 1].id;
    } else {
      // Nếu không có step nào, sử dụng dữ liệu gốc
      defaultInputStepId = 0;
    }

    setTempConfig({
      useCustomInput: false,
      inputStepId: defaultInputStepId,
    });

    // Cập nhật inputColumns dựa trên chế độ mặc định (step trước)
    if (getInputColumns) {
      const newInputColumns = await getInputColumns(null, null);
      setInputColumns(newInputColumns);
    }
  };

  const handleBackToSelector = () => {
    setShowStepSelector(true);
    setAddStepType(null);
    setTempConfig({
      useCustomInput: false,
      inputStepId: null,
    });
  };

  const onStart = (_event, uiData) => {
    try {
      const { clientWidth, clientHeight } = window.document.documentElement;
      const targetRect = dragRef.current?.getBoundingClientRect();
      if (!targetRect) return;
      setBounds({
        left: -targetRect.left + uiData.x,
        right: clientWidth - (targetRect.right - uiData.x),
        top: -targetRect.top + uiData.y,
        bottom: clientHeight - (targetRect.bottom - uiData.y),
      });
    } catch (_) {}
  };

  const handleOk = () => {
    if (addStepType) {
      onOk();
    }
  };

  const getAvailableSteps = () => {
    return Object.keys(stepTypeInfo).map(id => parseInt(id)).filter(stepId => {
      // Nếu chưa có step nào, chỉ cho phép chọn Upload Data (type 12)
      if (steps.length === 0) {
        return stepId === 12;
      } else {
        // Nếu đã có step, không hiển thị "Tạo mới" (type 12)
        return stepId !== 12;
      }
    });
  };

  return (
    <Modal
      key={modalKey}
      modalRender={(modal) => (
        <Draggable
          disabled={dragDisabled}
          bounds={bounds}
          nodeRef={dragRef}
          onStart={(event, uiData) => onStart(event, uiData)}
        >
          <div ref={dragRef}>{modal}</div>
        </Draggable>
      )}
      title={
        <div
          style={{ width: '100%', cursor: 'move' }}
          onMouseOver={() => {
            if (autorun) {
              return;
            }
            setDragDisabled(false);
          }}
          onMouseOut={() => setDragDisabled(true)}
        >
          {showStepSelector ? 'Chọn Process' : `Cấu hình ${stepTypeInfo[addStepType]?.name || 'Process'}`}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={showStepSelector  ? 1700 : 800}
      maskClosable={false}
      destroyOnClose={true}
      centered

      // Nếu là Upload Data thì không dùng onOk/okText mặc định
      // Nếu là AI Transformer (type 21) thì kiểm tra test status
      onOk={addStepType === 12 ? undefined : (addStepType === 21 && !aiTransformerTestStatus) ? undefined : handleOk}
      okText={addStepType === 12 ? undefined : (addStepType === 21 && !aiTransformerTestStatus) ? undefined : 'Add'}
      footer={addStepType === 12 ? [
        <Button
          key="save-upload"
          type="primary"
          loading={uploadSaving}
          onClick={async () => {
            // Validate for Google Sheets / Google Drive: must fetch data before saving
            const ut = (tempConfig?.uploadType || '').toLowerCase();
            if (ut === 'googlesheets') {
              const hasData = Array.isArray(tempConfig?.googleSheetsData) && tempConfig.googleSheetsData.length > 0;
              if (!hasData) {
                message.error('Vui lòng kéo dữ liệu từ Google Sheets trước khi lưu.');
                return;
              }
            }
            if (ut === 'googledrive') {
              const hasData = Array.isArray(tempConfig?.googleDriveData) && tempConfig.googleDriveData.length > 0;
              if (!hasData) {
                message.error('Vui lòng kéo dữ liệu từ Google Drive trước khi lưu.');
                return;
              }
            }
            // Google Drive Folder sẽ tự động kéo và lưu dữ liệu, không cần validate trước
            if (handleUploadSaveAndAddStep) {
              await handleUploadSaveAndAddStep(tempConfig);
            }
          }}
          disabled={uploadSaving}
        >
          Lưu dữ liệu
        </Button>,
      ] : addStepType === 21 ? [
        <Button
          key="cancel"
          onClick={onCancel}
        >
          Hủy
        </Button>,
        // <Button
        //   key="test"
        //   type="default"
        //   onClick={() => {
        //     // Test AI Transformer logic here
        //     if (setAiTransformerTestStatus) {
        //       setAiTransformerTestStatus(true);
        //     }
        //   }}
        //   disabled={aiTransformerTestStatus}
        // >
        //   Test
        // </Button>,
        <Button
          key="add"
          type="primary"
          onClick={handleOk}
          disabled={!aiTransformerTestStatus}
        >
          Add
        </Button>,
      ] : undefined}
    >
      {showStepSelector ? (
        <StepSelector
          onSelect={handleStepSelect}
          selectedStepType={addStepType}
          availableSteps={getAvailableSteps()}
          autoFocus={autoFocus}
        />
      ) : (
        <>
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
               <Button
              onClick={handleBackToSelector}
              style={{ marginRight: 8 }}
            >
              ← Quay lại chọn step
            </Button>

            <span style={{ fontSize: 14, color: '#666' }}>
              Đang cấu hình: <strong>{stepTypeInfo[addStepType]?.name || 'Process'}</strong>
            </span>
            </div>
           
            <div>
            {stepTypeInfo[addStepType]?.link_tlsd && (
              <a href={stepTypeInfo[addStepType]?.link_tlsd} target="_blank" rel="noopener noreferrer">
                <Button type="default" icon={<InfoCircleOutlined />}
        
                >
                  Tài liệu hướng dẫn
                </Button>
              </a>
            )}
            </div>
          </div>
          <div style={{ height: 'calc(80vh - 60px)', overflowY: 'auto' }}>
            {renderConfigForm && renderConfigForm(addStepType, tempConfig, setTempConfig)}
          </div>
        </>
      )}
    </Modal>
  );
};

export default AddStepModal;
