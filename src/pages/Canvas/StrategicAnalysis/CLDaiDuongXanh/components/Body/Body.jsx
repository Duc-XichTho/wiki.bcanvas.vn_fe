import React, { useEffect, useState } from 'react';
import { getAllPhanTichNote } from '../../../../../../apisKTQT/phantichNoteService.jsx';
import { Spin, message } from 'antd';
import { marked } from 'marked';
import dayjs from 'dayjs';
import '../../../Pestel/PestelHighlight.css';

function formatOceanContent(raw) {
  if (!raw) return '';
  return marked.parse(raw);
}

export default function Body() {
  const [highlightData, setHighlightData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const notes = await getAllPhanTichNote();
      const found = notes.find(n => n.table === 'CONG_CU_DAI_DUONG_XANH');
      setHighlightData(found ? {
        ...found,
        body: formatOceanContent(found.body),
      } : null);
    } catch (e) {
      setHighlightData({ body: 'Không thể tải dữ liệu!' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContent();
    const reloadHandler = () => fetchContent();
    window.addEventListener('reload-tiptap2-cong-cu-dai-duong-xanh', reloadHandler);
    // Lắng nghe loading AI
    const startLoading = () => setAiLoading(true);
    const endLoading = () => setAiLoading(false);
    window.addEventListener('start-ocean-analysis-loading', startLoading);
    window.addEventListener('end-ocean-analysis-loading', endLoading);
    return () => {
      window.removeEventListener('reload-tiptap2-cong-cu-dai-duong-xanh', reloadHandler);
      window.removeEventListener('start-ocean-analysis-loading', startLoading);
      window.removeEventListener('end-ocean-analysis-loading', endLoading);
    };
  }, []);

  return (
    <div style={{ marginTop: 16, height: '100%', overflow: 'auto', background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: 20 }}>
      <div style={{ fontSize: 14, color: '#888', fontStyle: 'italic', marginBottom: 12 }}>
        🕒 Cập nhật lần cuối: {highlightData?.update_at ? dayjs(highlightData.update_at).format('DD/MM/YYYY HH:mm:ss') : 'Chưa có'}
      </div>
      {(loading || aiLoading) ? (
        <Spin />
      ) : (
        <div
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: highlightData?.body || 'Chưa có dữ liệu' }}
        />
      )}
    </div>
  );
}