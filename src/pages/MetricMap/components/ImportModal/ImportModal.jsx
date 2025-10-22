import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal, Button, Upload as AntUpload, message, Alert, Input } from 'antd';
import { createKpiMetric } from '../../../../apis/kpiMetricService';
import { createMeasure, fetchAllMeasures } from '../../../../apis/measureService';

import styles from './ImportModal.module.css';

const ImportModal = ({ onClose, onImport, selectedCategory }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [textContent, setTextContent] = useState('');

  const handleFileChange = async (info) => {
    const selectedFile = info.file;
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);

      // Preview file info
      setPreview({
        name: selectedFile.name,
        size: (selectedFile.size / 1024).toFixed(2),
        type: selectedFile.type
      });

      // Đọc nội dung file và hiển thị trong textarea
      try {
        const fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsText(selectedFile);
        });
        setTextContent(fileContent);
      } catch (err) {
        setError('Không thể đọc file. Vui lòng thử lại.');
      }
    }
  };

  const handleTextContentChange = (e) => {
    setTextContent(e.target.value);
    setError(null);
  };

  const handleImport = async () => {
    if (!textContent.trim()) {
      message.error('Vui lòng nhập nội dung JSON để import');
      return;
    }

    try {
      // Parse JSON từ text content
      const jsonData = JSON.parse(textContent);
      await processImportData(jsonData);
    } catch (err) {
      if (err.name === 'SyntaxError') {
        setError('Nội dung JSON không hợp lệ. Vui lòng kiểm tra lại định dạng.');
      } else {
        setError(err.message || 'Có lỗi xảy ra khi import dữ liệu');
      }
      setLoading(false);
    }
  };

  const processImportData = async (jsonData) => {
    setLoading(true);
    setError(null);

    try {

      console.log('📄 Dữ liệu JSON được parse:', jsonData);

      // Bước 1: Lấy danh sách measures hiện tại từ DB
      const existingMeasures = await fetchAllMeasures({ business_category_id: selectedCategory , show: true});
      console.log('📋 Measures hiện tại trong DB:', existingMeasures);

      // Bước 2: Tạo map tên measure -> ID từ tất cả measures trong DB
      const measureNameToId = {};
      existingMeasures.forEach(measure => {
        measureNameToId[measure.name] = measure.id;
      });

      console.log('🗺️ Map tên measure -> ID từ DB:', measureNameToId);

      // Bước 3: Thu thập tất cả measures được tham chiếu trong KPIs
      const allReferencedMeasures = new Set();
      jsonData.kpis?.forEach(kpi => {
        (kpi.measures || []).forEach(measureName => {
          allReferencedMeasures.add(measureName);
        });
      });

      console.log('🔍 Tất cả measures được tham chiếu trong KPIs:', Array.from(allReferencedMeasures));

      // Bước 4: Tạo danh sách measures cần xử lý (từ file + thiếu)
      const measuresToProcess = new Map();

      // Thêm measures từ file JSON
      jsonData.measures?.forEach(measure => {
        measuresToProcess.set(measure.name, {
          ...measure,
          business_category_id: selectedCategory
        });
      });

      // Thêm measures thiếu (được tham chiếu nhưng không có trong file)
      Array.from(allReferencedMeasures).forEach(measureName => {
        if (!measuresToProcess.has(measureName) && !measureNameToId[measureName]) {
          // Tạo measure mặc định cho những measures thiếu
          measuresToProcess.set(measureName, {
            name: measureName,
            description: `Measure tự động tạo cho ${measureName}`,
            source: 'Auto-generated',
            business_category_id: selectedCategory
          });
          console.log('🆕 Tự động tạo measure thiếu:', measureName);
        }
      });

      console.log('📊 Tất cả measures sẽ được xử lý:', Array.from(measuresToProcess.keys()));

      // Bước 5: Xử lý tất cả measures
      const newlyCreatedMeasures = [];
      for (const [measureName, measureData] of measuresToProcess) {
        try {
          // Kiểm tra xem measure đã tồn tại trong DB chưa
          const existingMeasure = existingMeasures.find(
            measure => measure.name === measureName &&
              measure.business_category_id === selectedCategory
          );

          if (existingMeasure) {
            // Sử dụng measure đã tồn tại trong DB
            newlyCreatedMeasures.push(existingMeasure);
            console.log('🔄 Sử dụng measure đã tồn tại trong DB:', existingMeasure.name, 'ID:', existingMeasure.id);
          } else {
            // Tạo measure mới
            const createdMeasure = await createMeasure(measureData);
            newlyCreatedMeasures.push(createdMeasure);
            // Thêm vào map để KPI có thể sử dụng
            measureNameToId[createdMeasure.name] = createdMeasure.id;
            console.log('✅ Đã tạo measure mới:', createdMeasure.name, 'ID:', createdMeasure.id);
          }
        } catch (error) {
          console.error('❌ Lỗi xử lý measure:', measureName, error);
          throw new Error(`Không thể xử lý measure "${measureName}": ${error.message}`);
        }
      }

      console.log('🗺️ Map tên measure -> ID (DB + mới):', measureNameToId);
      console.log('📝 Danh sách tên measures có sẵn:', Object.keys(measureNameToId));
      console.log('📊 Chi tiết measures mới được xử lý:', newlyCreatedMeasures.map(m => ({ name: m.name, id: m.id, source: m.source })));

      // Validation: Kiểm tra tất cả measures được tham chiếu trong KPIs
      // Bây giờ tất cả measures đã được xử lý, chỉ cần kiểm tra cuối cùng
      const finalMissingMeasures = Array.from(allReferencedMeasures).filter(
        measureName => !measureNameToId[measureName]
      );

      if (finalMissingMeasures.length > 0) {
        console.error('❌ Validation failed:', {
          missingMeasures: finalMissingMeasures,
          availableMeasures: Object.keys(measureNameToId),
          allReferencedMeasures: Array.from(allReferencedMeasures)
        });
        throw new Error(
          `Các measures sau không được tìm thấy:\n` +
          `❌ Thiếu: ${finalMissingMeasures.join(', ')}\n` +
          `✅ Có sẵn: ${Object.keys(measureNameToId).join(', ')}\n\n` +
          `Hãy kiểm tra:\n` +
          `1. Tên measures trong KPI có khớp với tên trong danh sách measures\n` +
          `2. Không có khoảng trắng thừa hoặc lỗi chính tả\n` +
          `3. Tất cả measures được tham chiếu đều có trong danh sách measures`
        );
      }

      // Bước 4: Tạo KPIs với measures IDs
      const kpisToCreate = jsonData.kpis?.map(kpi => {
        console.log(`🔍 Đang xử lý KPI: ${kpi.name}`);
        console.log(`📋 Measures được tham chiếu:`, kpi.measures || []);

        // Chuyển đổi tên measures thành IDs
        const measureIds = (kpi.measures || []).map(measureName => {
          console.log(`🔎 Tìm measure: "${measureName}"`);
          const measureId = measureNameToId[measureName];
          if (!measureId) {
            console.error(`❌ Không tìm thấy measure "${measureName}"`);
            console.error(`📝 Measures có sẵn:`, Object.keys(measureNameToId));
            console.error(`📊 Measures mới được tạo:`, newlyCreatedMeasures.map(m => ({ name: m.name, id: m.id })));
            throw new Error(`Không tìm thấy measure "${measureName}". Measures có sẵn: ${Object.keys(measureNameToId).join(', ')}`);
          }
          console.log(`✅ Tìm thấy measure "${measureName}" -> ID: ${measureId}`);
          return measureId;
        });

        // Xử lý calc field nếu có - chuyển đổi tên measures thành IDs
        let processedCalc = kpi.calc || null;
        if (processedCalc) {
          try {
            const calcData = JSON.parse(processedCalc);
            if (calcData.variables) {
              // Chuyển đổi tên measures thành IDs trong variables
              Object.keys(calcData.variables).forEach(variableKey => {
                const variable = calcData.variables[variableKey];
                if (variable.type === 'measure' && variable.id) {
                  const measureId = measureNameToId[variable.id];
                  if (measureId) {
                    calcData.variables[variableKey].id = measureId;
                    console.log(`🔄 Chuyển đổi measure "${variable.id}" -> ID: ${measureId} trong calc`);
                  } else {
                    console.warn(`⚠️ Không tìm thấy measure "${variable.id}" trong calc`);
                  }
                }
              });
              processedCalc = JSON.stringify(calcData);
            }
          } catch (error) {
            console.error('❌ Lỗi xử lý calc field:', error);
            processedCalc = null;
          }
        }

        const result = {
          ...kpi,
          business_category_id: selectedCategory,
          measures: measureIds,
          // Xử lý calc field đã được chuyển đổi
          calc: processedCalc
        };

        console.log(`✅ KPI "${kpi.name}" đã được xử lý:`, result);
        return result;
      }) || [];

      console.log('📈 KPIs sẽ được tạo:', kpisToCreate);

      // Tạo tất cả KPIs
      const createdKpis = [];
      for (const kpiData of kpisToCreate) {
        try {
          const createdKpi = await createKpiMetric(kpiData);
          createdKpis.push(createdKpi);
          console.log('✅ Đã tạo KPI:', createdKpi.name, 'ID:', createdKpi.id);
        } catch (error) {
          console.error('❌ Lỗi tạo KPI:', kpiData.name, error);
          throw new Error(`Không thể tạo KPI "${kpiData.name}": ${error.message}`);
        }
      }

      console.log('🎉 Import thành công!');
      console.log('📊 Measures mới được xử lý:', newlyCreatedMeasures.length);
      console.log('📈 KPIs đã tạo:', createdKpis.length);

      // Gọi callback để refresh data
      await onImport({
        success: true,
        message: `Đã import thành công ${createdKpis.length} KPIs (sử dụng ${newlyCreatedMeasures.length} measures mới)`,
        data: {
          measures: newlyCreatedMeasures,
          kpis: createdKpis
        }
      });

      message.success(`Đã import thành công ${createdKpis.length} KPIs (sử dụng ${newlyCreatedMeasures.length} measures mới)`);
      onClose();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi import dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = {
      "metadata": {
        "version": "1.0",
        "description": "Template import KPIs và Measures cho Developer",
        "created_at": new Date().toISOString(),
                "instructions": [
           "1. Điền thông tin KPIs và Measures theo cấu trúc JSON",
           "2. Trường 'measures' trong KPI: array các tên measures (không phải ID)",
           "3. Trong phần 'measures': liệt kê measures với thông tin chi tiết (tùy chọn)",
           "4. KPI có thể tham chiếu đến measures cũ (có sẵn trong DB) và measures mới",
           "5. Hệ thống sẽ tự động tạo measures thiếu với thông tin mặc định",
           "6. Đảm bảo tên measures trong KPI khớp chính xác với tên trong danh sách measures",
           "7. Trong 'calc' field: sử dụng tên measures (không phải ID) trong variables",
           "8. Ví dụ calc: {\"formula\":\"a/b\",\"variables\":{\"a\":{\"type\":\"measure\",\"id\":\"Tên Measure\"}}}",
           "9. Upload file JSON để import"
         ]
      },
      "kpis": [
         {
           "name": "Tỷ lệ chuyển đổi (CVR)",
           "description": "Đo lường hiệu quả của gian hàng trong việc biến người xem thành người mua",
           "category": "Kinh doanh",
           "measures": ["Tổng Số đơn hàng", "Tổng Lượt truy cập"],
           "calc": "{\"formula\":\"a/b\",\"variables\":{\"a\":{\"type\":\"measure\",\"id\":\"Tổng Số đơn hàng\"},\"b\":{\"type\":\"measure\",\"id\":\"Tổng Lượt truy cập\"}}}"
         },
         {
           "name": "Giá trị đơn hàng trung bình (AOV)",
           "description": "Đo lường số tiền trung bình khách hàng chi tiêu mỗi lần mua",
           "category": "Kinh doanh",
           "measures": ["Tổng Doanh thu", "Tổng Số khách hàng"],
           "calc": "{\"formula\":\"a/b\",\"variables\":{\"a\":{\"type\":\"measure\",\"id\":\"Tổng Doanh thu\"},\"b\":{\"type\":\"measure\",\"id\":\"Tổng Số khách hàng\"}}}"
         },
         {
           "name": "Biên lợi nhuận gộp",
           "description": "Phản ánh lợi nhuận thực tế sau khi trừ đi giá vốn sản phẩm",
           "category": "Tài chính",
           "measures": ["Tổng Doanh thu gộp", "Tổng Giá vốn"],
           "calc": "{\"formula\":\"(a-b)/a\",\"variables\":{\"a\":{\"type\":\"measure\",\"id\":\"Tổng Doanh thu gộp\"},\"b\":{\"type\":\"measure\",\"id\":\"Tổng Giá vốn\"}}}"
         }
      ],
      "measures": [
        {
          "name": "Tổng Số đơn hàng",
          "description": "Tổng số đơn hàng được tạo trong kỳ",
          "unit": "đơn hàng"
        },
        {
          "name": "Tổng Lượt truy cập",
          "description": "Tổng số lượt truy cập website trong kỳ",
          "unit": "lượt"
        },
        {
          "name": "Tổng Doanh thu",
          "description": "Tổng doanh thu từ bán hàng trong kỳ",
          "unit": "VND"
        },
        {
          "name": "Tổng Số khách hàng",
          "description": "Tổng số khách hàng mua hàng trong kỳ",
          "unit": "khách hàng"
        },
        {
          "name": "Tổng Doanh thu gộp",
          "description": "Tổng doanh thu trước khi trừ chi phí",
          "unit": "VND"
        },
        {
          "name": "Tổng Giá vốn",
          "description": "Tổng giá vốn hàng bán trong kỳ",
          "unit": "VND"
        }
      ]
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'metric_map_template.json';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Modal
      title="Import dữ liệu"
      open={true}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="import"
          type="primary"
          loading={loading}
          disabled={!textContent.trim()}
          onClick={handleImport}
        >
          {loading ? 'Đang import...' : 'Import dữ liệu'}
        </Button>
      ]}
      width={600}
    >
      <div className={styles.content}>
        <div className={styles.section}>
          <Button
            type="dashed"
            icon={<FileText />}
            onClick={downloadTemplate}
            style={{ marginBottom: 16 }}
          >
            Tải template mẫu
          </Button>
        </div>

        <div className={styles.section}>
          <h4 style={{ marginBottom: 16 }}>
            <Upload style={{ marginRight: 8 }} />
            Upload file JSON
          </h4>

          <AntUpload
            accept=".json"
            beforeUpload={() => false}
            onChange={handleFileChange}
            showUploadList={false}
          >
            <Button icon={<Upload />}>
              Chọn file JSON
            </Button>
          </AntUpload>

          {preview && (
            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
              <CheckCircle style={{ color: '#52c41a', marginRight: 8 }} />
              <span style={{ fontWeight: 500 }}>{preview.name}</span>
              <span style={{ marginLeft: 8, color: '#666' }}>({preview.size} KB)</span>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h4 style={{ marginBottom: 16 }}>
            📝 Preview & Chỉnh sửa dữ liệu
          </h4>
          
          <Input.TextArea
            value={textContent}
            onChange={handleTextContentChange}
            placeholder="Upload file JSON hoặc nhập trực tiếp nội dung JSON vào đây..."
            rows={15}
            style={{ fontFamily: 'monospace', fontSize: '13px' }}
          />
          
          <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
            💡 Tip: Bạn có thể chỉnh sửa JSON trực tiếp trong ô này trước khi import
          </div>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </div>
    </Modal>
  );
};

export default ImportModal;
