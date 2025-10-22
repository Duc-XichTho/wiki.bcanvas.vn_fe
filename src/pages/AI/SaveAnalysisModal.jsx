import React, { useEffect, useState, useContext } from 'react';
import { Modal, Button, message, Popconfirm, Input, Select, Radio } from 'antd';
import { EditorContent } from '@tiptap/react';
import { TiptapToolbar } from '../Canvas/StrategicAnalysis/ComponentWarehouse/TiptapToolbar';
import { useEditor } from '../Canvas/StrategicAnalysis/ComponentWarehouse/useEditor';
import css from './SaveAnalysisModal.module.css';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { createNewFileNotePad, updateFileNotePad } from '../../apis/fileNotePadService.jsx';
import { createTimestamp } from '../../generalFunction/format.js';
import { getFileTabByTypeData } from '../../apis/fileTabService.jsx';
import { MyContext } from '../../MyContext.jsx';

export default function SaveAnalysisModal({ open, onClose, initialContent, onSave, currentUser , multipleCharts }) {
  const { editor } = useEditor();
  const { loadDataDuLieu, setLoadDataDuLieu } = useContext(MyContext);
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(false);

  // State cho các menu của toolbar
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [colorPickerMenuOpen, setColorPickerMenuOpen] = useState(false);
  const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
  const [lineHeightMenuOpen, setLineHeightMenuOpen] = useState(false);
  const [tabs, setTabs] = useState([]);

  // Popconfirm state
  const [showConfirm, setShowConfirm] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(undefined);

  // Convert initialContent to string if it's an object, then to HTML
  const getContentAsString = () => {
    if (!initialContent) return '';
    if (typeof initialContent === 'string') {
      return initialContent;
    }
    if (typeof initialContent === 'object') {
      // If it's a powerdrill result with blocks, format it nicely
      if (initialContent.blocks && Array.isArray(initialContent.blocks)) {
        return initialContent.blocks.map(block => {
          if (block.type === 'MESSAGE') {
            return block.content;
          } else if (block.type === 'CODE') {
            return '```\n' + block.content + '\n```';
          } else if (block.type === 'TABLE') {
            return `**${block.content.name}**\n\nTable URL: ${block.content.url}`;
          }
          return '';
        }).join('\n\n');
      }
      // For other objects, stringify them
      return JSON.stringify(initialContent, null, 2);
    }
    return String(initialContent);
  };

  // Convert markdown to HTML and sanitize
  const htmlContent = DOMPurify.sanitize(marked(getContentAsString()));

  useEffect(() => {
    if (editor && open) {
      editor.commands.setContent(htmlContent, false);
      editor.setEditable(true);
    }
    if (!open) {
      setShowConfirm(false);
      setFileName('');
      setSelectedFolder(undefined);
    }
  }, [editor, htmlContent, open]);

  // Lấy danh sách tab khi mở modal
  useEffect(() => {
    if (open) {
      getFileTabByTypeData().then(fileTabs => {
        let filteredTabs = fileTabs.filter(tab => tab.position < 100 && tab.table === 'du-lieu-dau-vao' && tab.type === 'data' && tab?.hide == false);
        filteredTabs = filteredTabs.sort((a, b) => a.position - b.position);
        setTabs(filteredTabs);
      });
    }
  }, [open]);

  const handleSave = async () => {
    setShowConfirm(true);
  };

  const handleCreateFile = async () => {
    if (!fileName || !selectedFolder) {
      message.error('Vui lòng nhập tên và chọn folder!');
      return;
    }
    setLoading(true);
    try {
      const newData = {
        name: fileName,
        tab: selectedFolder,
        table: 'TiptapWithChart',
        user_create: currentUser?.email,
        created_at: createTimestamp(),
        url: editor.getHTML(),
        show: true,
        chart : multipleCharts
      };
      await createNewFileNotePad(newData).then(res => {
        console.log(res);
        if (res.status === 201) {   
            updateFileNotePad({
                id: res.data.id,
                code: `Tiptap_${res.data.id}`,
            }).then(res => {
                message.success('Cập nhật file thành công!');
            });
        message.success('Tạo file thành công!');
          setShowConfirm(false);
          onClose();
    
          if (onSave) onSave(editor.getHTML());
        } else {
          message.error('Có lỗi khi tạo file!');
        }
      });
      // message.success('Tạo file thành công!');
      setShowConfirm(false);
      onClose();
      if (onSave) onSave(editor.getHTML());
    } catch (e) {
      message.error('Có lỗi khi tạo file!');
    }
    finally {
      setLoadDataDuLieu(!loadDataDuLieu);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    onClose();
  };

  if (!editor) return null;

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title="Lưu dữ liệu phân tích"
      width={'90vw'}
      footer={null}
      destroyOnClose
      centered
    >
      <div className={css.modalMain}>
        <div className={css.modalButtonRow}>
          <Popconfirm
            open={showConfirm}
            title="Tạo mới dữ liệu"
            onConfirm={handleCreateFile}
            onCancel={() => setShowConfirm(false)}
            okText="Tạo"
            cancelText="Hủy"
            description={
              <div style={{ minWidth: 300 }}>
                <Input
                  placeholder="Nhập tên dữ liệu"
                  value={fileName}
                  onChange={e => setFileName(e.target.value)}
                  style={{ marginBottom: 8 }}
                />
                <Select
                  placeholder="Chọn folder"
                  value={selectedFolder}
                  onChange={setSelectedFolder}
                  style={{ width: '100%' }}
                  options={tabs.map(tab => ({ value: tab.key, label: tab.label }))}
                  showSearch
                  optionFilterProp="label"
                />
              </div>
            }
          >
            <Button type="primary" onClick={handleSave} loading={loading} style={{ minWidth: 100 }}>
              Lưu
            </Button>
          </Popconfirm>
          <Button onClick={handleCancel} style={{ minWidth: 100 }}>
            Hủy
          </Button>
        </div>
        <TiptapToolbar
          editor={editor}
          headingMenuOpen={headingMenuOpen}
          setHeadingMenuOpen={setHeadingMenuOpen}
          tableMenuOpen={tableMenuOpen}
          setTableMenuOpen={setTableMenuOpen}
          fontMenuOpen={fontMenuOpen}
          setFontMenuOpen={setFontMenuOpen}
          colorPickerMenuOpen={colorPickerMenuOpen}
          setColorPickerMenuOpen={setColorPickerMenuOpen}
          fontSizeMenuOpen={fontSizeMenuOpen}
          setFontSizeMenuOpen={setFontSizeMenuOpen}
          lineHeightMenuOpen={lineHeightMenuOpen}
          setLineHeightMenuOpen={setLineHeightMenuOpen}
        />
        <div className={css.modalTiptap}>
          <div className={css.modalEditorContentFull} style={{ padding: '10px' }}>
            <EditorContent className={css.modalEditorContentWrap} editor={editor} />
          </div>
        </div>
      </div>
    </Modal>
  );
} 