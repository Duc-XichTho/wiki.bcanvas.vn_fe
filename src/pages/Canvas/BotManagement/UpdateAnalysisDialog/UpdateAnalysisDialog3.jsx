import React, { useState, useEffect } from 'react';
import { Eye, PlusCircle } from 'lucide-react';
import css from './UpdateAnalysisDialog.module.css';
import { message } from 'antd';
// API
import { updateCanvasBot } from '../../../../apis/canvasBotService';
import { getAllFileTab } from '../../../../apis/fileTabService.jsx';
import { getAllFileNotePad } from '../../../../apis/fileNotePadService.jsx';
import { CANVAS_DATA_PACK } from '../../../../CONST.js';

const UpdateAnalysisDialog = ({ isOpen, onClose, canvasBot, fetchData }) => {
  const models = [
    { key: 'claude-3-5-sonnet-20240620', value: 'Claude 3.5 Sonnet' },
    // { key: 'haiku', value: 'Haiku 3.5' },
  ];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedPacks, setSelectedPacks] = useState([]);
  const [systemInstructions, setSystemInstructions] = useState('');

  const khkdPack = [
    {id: 'BH', name: 'Bán hàng'},
    {id: 'DL', name: 'Đo lường'},
    {id: 'KD', name: 'Kinh doanh'},
    {id: 'KPI', name: 'KPI'},
    {id: 'DT', name: 'Dòng tiền'},
  ]

  useEffect(() => {
    if (canvasBot) {
      setName(canvasBot.name);
      setDescription(canvasBot.description);
      setSelectedModel(canvasBot.model);
      setSelectedPacks(canvasBot.khkdPacks);
      setSystemInstructions(canvasBot.system);
    }
  }, [canvasBot]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    if (!name || !description || !selectedModel) return;

    const newData = {
      ...canvasBot,
      name,
      description,
      model: selectedModel,
      isEditing: false,
      system: systemInstructions,
      khkdPacks: selectedPacks,
    };

    await updateCanvasBot(newData);
    await fetchData();
    message.success('Cập nhật thành công');

    setName('');
    setDescription('');
    setSelectedModel('');
    setSelectedPacks([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`${css.overlay} ${isOpen ? css.overlayVisible : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={css.dialog}>
        <div className={css.header}>
          <h2 className={css.title2}>Cập nhật Bot</h2>
        </div>
        <div className={css.contentWrapper}>
          <div className={css.content}>
            <div className={css.formGroup2}>
              <label className={css.label}>Tên: </label>
              <input
                  type="text"
                  className={css.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên"
              />
            </div>

            <div className={css.formGroup2}>
              <label className={css.label}>Mô hình</label>
              <select
                  className={css.select}
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="">Chọn mô hình AI</option>
                {models.map((model) => (
                    <option key={model.key} value={model.key}>
                      {model.value}
                    </option>
                ))}
              </select>
            </div>

            <div className={css.formGroup}>
              <label className={css.label}>Mô tả</label>
              <textarea
                  className={css.textarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập mô tả"
              />
            </div>
            <div>
              <div className={css.formGroup}>
                <div className={css.dataPacks}>
                  {khkdPack.map((pack) => (
                      <button
                          key={pack.id}
                          className={`${css.button} ${selectedPacks.includes(pack.id)
                              ? css.buttonPrimary
                              : css.buttonOutline
                          }`}
                          onClick={() => {
                            setSelectedPacks((prev) =>
                                prev.includes(pack.id)
                                    ? prev.filter((p) => p !== pack.id)
                                    : [...prev, pack.id]
                            );
                          }}
                      >
                        {pack.name}
                        <Eye size={16} style={{ marginLeft: 8, opacity: 0, transition: 'opacity 0.3s' }}
                             onClick={(e) => {
                               e.stopPropagation();
                               handlePreview(pack)
                             }} />
                      </button>
                  ))}
                </div>
              </div>

              <div className={css.formGroup}>
                <label className={css.label}>Hướng dẫn hệ thống</label>
                <textarea
                    className={css.textarea}
                    placeholder="Hướng dẫn hệ thống..."
                    style={{ height: '8rem' }}
                    value={systemInstructions}
                    onChange={(e) => setSystemInstructions(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className={css.footer}>
          <button
              className={`${css.buttonPrimary} ${!name || !description || !selectedModel
                  ? css.buttonDisabled
                  : ''
              }`}
              onClick={handleSubmit}
              disabled={!name || !selectedModel}
          >
            Update Bot
          </button>
          <button
              className={css.buttonClose}
              onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpdateAnalysisDialog
