import Header from "./header/Header";
    import css from "./XApp.module.css";
import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  Layout,
  Row,
  Col,
  Button,
  Select,
  Card,
  Tag,
  Space,
  Typography,
  Switch,
  TimePicker,
  Tabs,
  List,
  Flex,
  Table,
  message,    
  Modal,
  Input
} from 'antd';
import { Settings, Monitor, Smartphone, Sun, CloudRain, Snowflake, Zap, Wind, AlertTriangle, Calendar, Users, Car, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { marked } from 'marked';
import { getPredictionsByDateService } from '../../apis/apiWeather/predictionService';
import { getEventsByDateService } from '../../apis/apiWeather/eventService';
import { getTroLyDuBaoNoiBoByIdCuaHang, createNewTroLyDuBaoNoiBo, updateTroLyDuBaoNoiBo } from '../../apis/troLyDuBaoNoiBoService';
import { getSettingByType, createSetting, updateSetting } from '../../apis/settingService';
import { aiGen } from '../../apis/botService';
dayjs.locale('vi');
import { RedoOutlined } from '@ant-design/icons';
import { MyContext } from '../../MyContext.jsx';
const { Content } = Layout;
const { Text, Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Hook để detect mobile
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
};

export default function XApp() {

    const [selectedModel, setSelectedModel] = useState('gpt-4');
    const [autoRun, setAutoRun] = useState(false);
    const [runTime, setRunTime] = useState('06:00');
    const [selectedStore, setSelectedStore] = useState('');
    const [selectedWeek, setSelectedWeek] = useState('week-1');
    const [forceDesktop, setForceDesktop] = useState(true); // Keep this for logic, though layout is more responsive with AntD
    const [loading, setLoading] = useState(false);
    const [showTagModal, setShowTagModal] = useState(false);
    const [customTags, setCustomTags] = useState([]);
    const [newTagName, setNewTagName] = useState('');
    const [newTagProvince, setNewTagProvince] = useState('');
    const [loadingTags, setLoadingTags] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetailData, setSelectedDetailData] = useState(null);
    const [businessImpactMode, setBusinessImpactMode] = useState('chung'); // 'chung' or 'noi-bo'
    const [showSystemMessageModal, setShowSystemMessageModal] = useState(false);
    const [selectedTagForSystemMessage, setSelectedTagForSystemMessage] = useState(null);
    const [tagSystemMessage, setTagSystemMessage] = useState('');
    const [noiBoData, setNoiBoData] = useState({});
    const [ghiChuData, setGhiChuData] = useState({});
    const [analyzingNoiBo, setAnalyzingNoiBo] = useState({});
    const [analyzingAll, setAnalyzingAll] = useState(false);
    const [debugMode, setDebugMode] = useState(false);
    const [testDataCreated, setTestDataCreated] = useState(false);
    const [defaultSystemMessage, setDefaultSystemMessage] = useState('');
    const {currentUser} = useContext(MyContext);  
    // Detect mobile device
    const isMobile = useMediaQuery('(max-width: 768px)');
  
    // Data and options from the original component
    const storeTags = useMemo(() => customTags.map(tag => tag.name), [customTags]);
    
    // Danh sách tỉnh thành Việt Nam
    const provinces = [
      'Hà Nội', 'TP.HCM', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ',
      'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
      'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
      'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
      'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
      'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
      'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
      'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
      'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
      'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
      'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
      'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
      'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
    ];
    
    // Generate week options
    const generateWeekOptions = () => {
      const weeks = [];
      const today = new Date();
      
      for (let i = 0; i < 4; i++) {
        let startDate, endDate;
        
        if (i === 0) {
          // Tuần hiện tại: từ thứ 2 đến chủ nhật
          startDate = new Date(today);
          // Tìm thứ 2 của tuần hiện tại
          while (startDate.getDay() !== 1) {
            startDate.setDate(startDate.getDate() - 1);
          }
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
        } else {
          // Các tuần sau: từ thứ 2 đến chủ nhật
          // Tìm thứ 2 của tuần tiếp theo
          const nextMonday = new Date(today);
          nextMonday.setDate(today.getDate() + (7 - today.getDay() + 1) % 7);
          if (today.getDay() === 1) {
            nextMonday.setDate(today.getDate() + 7);
          }
          
          startDate = new Date(nextMonday);
          startDate.setDate(nextMonday.getDate() + (i - 1) * 7);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
        }
        
        weeks.push({
          id: `week-${i + 1}`,
          label: `(${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')})`,
          startDate: startDate,
          endDate: endDate
        });
      }
      return weeks;
    };
  
    const weekOptions = generateWeekOptions();
  
    // Fetch real forecast data from API
    const fetchForecastData = async () => {
      setLoading(true);
      try {
        const forecastData = [];
        
        // Get selected week info
        const selectedWeekInfo = weekOptions.find(week => week.id === selectedWeek);
        if (!selectedWeekInfo) {
          throw new Error('Không tìm thấy thông tin tuần được chọn');
        }
        
        let startDate, endDate;
        
        if (selectedWeek === 'week-1') {
          // Tuần hiện tại: chỉ hiển thị từ ngày hiện tại đến hết tuần
          startDate = new Date();
          endDate = selectedWeekInfo.endDate;
        } else {
          // Các tuần khác: hiển thị đầy đủ tuần
          startDate = selectedWeekInfo.startDate;
          endDate = selectedWeekInfo.endDate;
        }
        
        // Calculate number of days to fetch
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        // Fetch data for selected week
        for (let i = 0; i < daysDiff; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          try {
            // Fetch predictions for this date
            const predictionResponse = await getPredictionsByDateService(dateString);
            const predictions = predictionResponse?.result || [];
            
            // Fetch events for this date
            const eventResponse = await getEventsByDateService(dateString);
            const events = eventResponse?.result || [];
            
            // Find prediction for selected store
            let prediction = null;
            if (selectedStore) {
              // First try to find by exact area match
              prediction = predictions.find(pred => pred.area === selectedStore);
              
              // If not found, try to find by custom tag name
              if (!prediction) {
                const customTag = customTags.find(tag => tag.name === selectedStore);
                if (customTag) {
                  prediction = predictions.find(pred => pred.area === customTag.province);
                }
              }
            }
            
            // Filter events based on area
            let filteredEvents = [];
            if (selectedStore) {
              const customTag = customTags.find(tag => tag.name === selectedStore);
              const selectedProvince = customTag ? customTag.province : selectedStore;
              
              filteredEvents = events.filter(event => {
                // If area is null or empty, show for all areas
                if (!event.area || event.area === "" || event.area === null) {
                  return true;
                }
                // If area is specified, only show for that specific area
                return event.area === selectedProvince;
              });
            } else {
              // If no store selected, show all events
              filteredEvents = events;
            }
            
            // Process events
            const eventText = filteredEvents.length > 0 
              ? filteredEvents.map(event => event.phan_tich_su_kien || event.event_name).join(", ")
              : "Không có sự kiện đặc biệt";
            
            // Create forecast data object
            const dayData = {
              id: i + 1, // ID from 1 to number of days in the week
              date: date.toLocaleDateString('vi-VN'),
              dayOfWeek: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][date.getDay()],
              fullDate: date,
              isWeekend: date.getDay() === 0 || date.getDay() === 6,
              lunchClimate: {
                condition: prediction?.thoi_tiet_trua || "Chưa có dữ liệu",
                impact: prediction?.danh_gia_thoi_tiet_trua ? 'positive' : 'neutral',
                meaning: prediction?.danh_gia_thoi_tiet_trua || "Chưa đánh giá"
              },
              dinnerClimate: {
                condition: prediction?.thoi_tiet_toi || "Chưa có dữ liệu",
                impact: prediction?.danh_gia_thoi_tiet_toi ? 'positive' : 'neutral',
                meaning: prediction?.danh_gia_thoi_tiet_toi || "Chưa đánh giá"
              },
              event: {
                event: eventText,
                impact: 'neutral',
                meaning: eventText
              },
              overallImpact: prediction?.tong_the ? 
                (() => {
                  // Handle string format like "4/5"
                  if (typeof prediction.tong_the === 'string' && prediction.tong_the.includes('/')) {
                    const [numerator, denominator] = prediction.tong_the.split('/');
                    const score = parseInt(numerator);
                    
                    if (score === 5) return 'very-positive';
                    if (score === 4) return 'positive';
                    if (score === 3) return 'neutral';
                    if (score === 2) return 'negative';
                    if (score === 1) return 'very-negative';
                    return 'neutral';
                  }
                  
                  // Handle numeric format - scale of 1-5
                  if (typeof prediction.tong_the === 'number' || !isNaN(parseInt(prediction.tong_the))) {
                    const score = parseInt(prediction.tong_the);
                    
                    if (score === 5) return 'very-positive';
                    if (score === 4) return 'positive';
                    if (score === 3) return 'neutral';
                    if (score === 2) return 'negative';
                    if (score === 1) return 'very-negative';
                    return 'neutral';
                  }
                  
                  // Fallback to old logic (0-100 scale)
                  const score = parseInt(prediction.tong_the);
                  if (score >= 80) return 'very-positive';
                  if (score >= 60) return 'positive';
                  if (score >= 40) return 'neutral';
                  if (score >= 20) return 'negative';
                  return 'very-negative';
                })() : 'neutral',
              overallScore: prediction?.tong_the ? prediction.tong_the : null,
              businessImpact: prediction?.tac_dong_kinh_doanh || "",
              businessImpactMode: businessImpactMode // Add mode to the data
            };
            
            forecastData.push(dayData);
          } catch (error) {
            console.error(`Error fetching data for ${dateString}:`, error);
            // Add fallback data
            forecastData.push({
              id: i + 1, // ID from 1 to number of days in the week
          date: date.toLocaleDateString('vi-VN'),
              dayOfWeek: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][date.getDay()],
          fullDate: date,
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
              lunchClimate: {
                condition: "Chưa có dữ liệu",
                impact: 'neutral',
                meaning: "Chưa đánh giá"
              },
              dinnerClimate: {
                condition: "Chưa có dữ liệu",
                impact: 'neutral',
                meaning: "Chưa đánh giá"
              },
              event: {
                event: "Chưa có dữ liệu",
                impact: 'neutral',
                meaning: "Chưa có dữ liệu"
              },
              overallImpact: 'neutral',
              overallScore: null,
              businessImpact: ""
            });
          }
        }
        
        // Load noi bo data if in noi-bo mode
        if (businessImpactMode === 'noi-bo' && selectedStore) {
          const selectedTag = customTags.find(tag => tag.name === selectedStore);
          if (selectedTag) {
            const noiBoDataPromises = forecastData.map(async (dayData) => {
              // Use date in d/m/yyyy format for API
              const noiBoData = await fetchNoiBoData(dayData.date, selectedTag.id);
              if (noiBoData) {
                setNoiBoData(prev => ({
                  ...prev,
                  [`${dayData.date}_${selectedTag.id}`]: noiBoData.noi_dung
                }));
              }
              return noiBoData;
            });
            await Promise.all(noiBoDataPromises);
          }
        }

        // Load ghi chu data for all modes
        if (selectedStore) {
          const selectedTag = customTags.find(tag => tag.name === selectedStore);
          if (selectedTag) {
            const ghiChuDataPromises = forecastData.map(async (dayData) => {
              const noiBoData = await fetchNoiBoData(dayData.date, selectedTag.id);
              
              if (noiBoData && noiBoData.ghi_chu) {
                setGhiChuData(prev => ({
                  ...prev,
                  [`${dayData.date}_${selectedTag.id}`]: noiBoData.ghi_chu
                }));
              }
              return noiBoData;
            });
            await Promise.all(ghiChuDataPromises);
          }
        }

        return forecastData;
      } catch (error) {
        console.error('Error fetching forecast data:', error);
        message.error('Không thể tải dữ liệu dự báo');
        return [];
      } finally {
        setLoading(false);
      }
    };
  
    const [forecastData, setForecastData] = useState([]);
  
    // Icon and style helper functions (adapted for AntD)
    const getClimateIcon = (condition) => {
      const props = { style: { fontSize: '16px', color: '#555' } };
      if (condition.includes('Nóng') || condition.includes('Nắng')) return <Sun {...props} />;
      if (condition.includes('Mưa') || condition.includes('Bão')) return <CloudRain {...props} />;
      if (condition.includes('Mát')) return <Wind {...props} />;
      if (condition.includes('Quá Mức')) return <Zap {...props} />;
      return <Sun {...props} />;
    };
  
    const getEventIcon = (event) => {
      const props = { style: { fontSize: '16px', color: '#555' } };
      if (event.includes('Cuối Tuần') || event.includes('Lễ')) return <Calendar {...props} />;
      if (event.includes('Concert') || event.includes('Lễ Hội')) return <Users {...props} />;
      if (event.includes('Xây Dựng') || event.includes('Marathon') || event.includes('Đình Công')) return <Car {...props} />;
      return <Calendar {...props} />;
    };
    
    const getImpactIndicator = (impact) => {
      const colorMap = {
        positive: 'green',
        negative: 'red',
        neutral: 'orange',
      };
      return <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: colorMap[impact] || 'gray' }}></div>;
    };
  
    const getOverallStatus = (impact) => {
      const statusMap = {
        'very-negative': { label: 'Rất tiêu cực', color: 'red' },
        'negative': { label: 'Tiêu cực', color: 'volcano' },
        'neutral': { label: 'Trung tính', color: 'gold' },
        'positive': { label: 'Tích cực', color: 'lime' },
        'very-positive': { label: 'Rất tích cực', color: 'green' }
      };
      return statusMap[impact] || statusMap['neutral'];
    };

    // Business Impact Component with CSS styling using marked library
    const BusinessImpactDisplay = ({ businessImpact }) => {
      if (!businessImpact) {
        return <span>Chưa đánh giá</span>;
      }

      // Handle string format - check if it contains markdown
      if (typeof businessImpact === 'string') {
        // Check if the string contains markdown syntax
        if (businessImpact.includes('*') || businessImpact.includes('**') || businessImpact.includes('-')) {
          // Configure marked options for better rendering
          marked.setOptions({
            breaks: true, // Convert line breaks to <br>
            gfm: true, // GitHub Flavored Markdown
          });

          // Convert markdown to HTML
          const htmlContent = marked(businessImpact);

          return (
            <div 
              style={{ 
                fontSize: '12px', 
                lineHeight: '1.4', 
                textAlign: 'left',
                maxWidth: '100%'
              }}
              dangerouslySetInnerHTML={{ 
                __html: `
                  <style>
                    .business-impact-markdown {
                      font-size: 12px;
                      line-height: 1.4;
                      color: #333;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    .business-impact-markdown strong {
                      color: #262626;
                      font-weight: 600;
                    }
                    .business-impact-markdown ul {
                      margin: 4px 0;
                      padding-left: 16px;
                      list-style-type: disc;
                    }
                    .business-impact-markdown li {
                      margin-bottom: 4px;
                      line-height: 1.3;
                    }
                    .business-impact-markdown p {
                      margin: 2px 0;
                      line-height: 1.3;
                    }
                    .business-impact-markdown br {
                      margin-bottom: 2px;
                    }
                    .business-impact-markdown * {
                      font-size: inherit;
                    }
                  </style>
                  <div class="business-impact-markdown">${htmlContent}</div>
                `
              }}
            />
          );
        }
        // If no markdown, return as plain text
        return <span>{businessImpact}</span>;
      }

      // Handle new format with businessImpactText using marked
      if (businessImpact.businessImpactText) {
        // Configure marked options for better rendering
        marked.setOptions({
          breaks: true, // Convert line breaks to <br>
          gfm: true, // GitHub Flavored Markdown
        });

        // Convert markdown to HTML
        const htmlContent = marked(businessImpact.businessImpactText);

        return (
          <div 
            style={{ 
              fontSize: '12px', 
              lineHeight: '1.4', 
              textAlign: 'left',
              maxWidth: '100%'
            }}
            dangerouslySetInnerHTML={{ 
              __html: `
                <style>
                  .business-impact-markdown {
                    font-size: 12px;
                    line-height: 1.4;
                    color: #333;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  }
                  .business-impact-markdown strong {
                    color: #262626;
                    font-weight: 600;
                  }
                  .business-impact-markdown ul {
                    margin: 4px 0;
                    padding-left: 16px;
                    list-style-type: disc;
                  }
                  .business-impact-markdown li {
                    margin-bottom: 4px;
                    line-height: 1.3;
                  }
                  .business-impact-markdown p {
                    margin: 2px 0;
                    line-height: 1.3;
                  }
                  .business-impact-markdown br {
                    margin-bottom: 2px;
                  }
                  .business-impact-markdown * {
                    font-size: inherit;
                  }
                </style>
                <div class="business-impact-markdown">${htmlContent}</div>
              `
            }}
          />
        );
      }

      // Handle old format with separate sections
      const { noonWeather, eveningWeather, negativeFactors, positiveFactors, advice } = businessImpact;

      return (
        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
          {negativeFactors && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ 
                fontWeight: '600', 
                color: '#d32f2f',
                display: 'block',
                marginBottom: '2px',
                fontSize: '11px'
              }}>
                Yếu tố tiêu cực:
              </span>
              <span style={{ color: '#666', fontSize: '11px' }}>{negativeFactors}</span>
            </div>
          )}
          {positiveFactors && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ 
                fontWeight: '600', 
                color: '#2e7d32',
                display: 'block',
                marginBottom: '2px',
                fontSize: '11px'
              }}>
                Yếu tố tích cực:
              </span>
              <span style={{ color: '#666', fontSize: '11px' }}>{positiveFactors}</span>
            </div>
          )}
          {advice && (
            <div>
              <span style={{ 
                fontWeight: '600', 
                color: '#1976d2',
                display: 'block',
                marginBottom: '2px',
                fontSize: '11px'
              }}>
                Lời khuyên:
              </span>
              <span style={{ color: '#666', fontSize: '11px' }}>{advice}</span>
            </div>
          )}
        </div>
      );
    };

    // Score meter component for overall score
    const ScoreMeter = ({ score }) => {
      if (score === null || score === undefined) return <Text type="secondary" style={{ fontSize: '11px' }}>N/A</Text>;
      
      // Handle string format like "1/5"
      if (typeof score === 'string' && score.includes('/')) {
        const [numerator, denominator] = score.split('/');
        const numericScore = parseInt(numerator);
        const maxScore = parseInt(denominator);
        
        // Convert to percentage for the progress bar
        const percentage = (numericScore / maxScore) * 100;
        

        
        const getColor = (percentage) => {
          if (percentage >= 80) return "#4CAF50"; // Green
          if (percentage >= 60) return "#FF9800"; // Orange
          if (percentage >= 40) return "#FFC107"; // Yellow
          return "#F44336"; // Red
        };

        return (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ 
              width: "60px", 
              height: "12px", 
              backgroundColor: "#f0f0f0", 
              borderRadius: "6px",
              overflow: "hidden",
              position: "relative"
            }}>
              <div style={{
                width: `${percentage}%`,
                height: "100%",
                backgroundColor: getColor(percentage),
                transition: "width 0.3s ease",
                minWidth: "4px" // Ensure minimum width for visibility
              }} />
            </div>
            <span style={{ fontSize: "11px", fontWeight: "bold" }}>{score}</span>
          </div>
        );
      }
      
      // Handle numeric format - assume it's on a scale of 1-5
      if (typeof score === 'number') {
        // Convert to percentage assuming scale of 1-5
        const percentage = (score / 5) * 100;
        
    
        const getColor = (percentage) => {
          if (percentage >= 80) return "#4CAF50"; // Green
          if (percentage >= 60) return "#FF9800"; // Orange
          if (percentage >= 40) return "#FFC107"; // Yellow
          return "#F44336"; // Red
        };

        return (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ 
              width: "60px", 
              height: "12px", 
              backgroundColor: "#f0f0f0", 
              borderRadius: "6px",
              overflow: "hidden",
              position: "relative"
            }}>
              <div style={{
                width: `${percentage}%`,
                height: "100%",
                backgroundColor: getColor(percentage),
                transition: "width 0.3s ease",
                minWidth: "4px" // Ensure minimum width for visibility
              }} />
            </div>
            <span style={{ fontSize: "11px", fontWeight: "bold" }}>{score}/5</span>
          </div>
        );
      }
      
      // Handle other string formats (fallback)
      const getColor = (score) => {
        if (score >= 80) return "#4CAF50"; // Green
        if (score >= 60) return "#FF9800"; // Orange
        if (score >= 40) return "#FFC107"; // Yellow
        return "#F44336"; // Red
      };

      return (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ 
            width: "60px", 
            height: "12px", 
            backgroundColor: "#f0f0f0", 
            borderRadius: "6px",
            overflow: "hidden",
            position: "relative"
          }}>
            <div style={{
              width: `${score}%`,
              height: "100%",
              backgroundColor: getColor(score),
              transition: "width 0.3s ease",
              minWidth: "4px" // Ensure minimum width for visibility
            }} />
          </div>
          <span style={{ fontSize: "11px", fontWeight: "bold" }}>{score}</span>
        </div>
      );
    };
  
    const handleStoreSelection = (store) => {
      setSelectedStore(store);
      
      // Load businessImpactMode for the selected store
      if (store) {
        const selectedTag = customTags.find(tag => tag.name === store);
        if (selectedTag) {
          setBusinessImpactMode(selectedTag.businessImpactMode || 'chung');
        }
      }
    };

        // Load custom tags from setting
    const loadCustomTags = async () => {
      setLoadingTags(true);
      try {
        const response = await getSettingByType('CONFIG_TAG_X_APP');
        if (response && response.setting && Array.isArray(response.setting)) {
          // Dữ liệu đã là array object, không cần parse
          setCustomTags(response.setting);
        } else if (response && response.setting && typeof response.setting === 'string') {
          // Fallback cho dữ liệu cũ (JSON string)
          try {
            const tags = JSON.parse(response.setting);
            setCustomTags(tags);
          } catch (parseError) {
            console.error('Error parsing old JSON string:', parseError);
            setCustomTags([]);
          }
        } else {
          setCustomTags([]);
        }
      } catch (error) {
        console.error('Error loading custom tags:', error);
        message.error('Không thể tải danh sách tag');
      } finally {
        setLoadingTags(false);
      }
    };

    // Save custom tags to setting
    const saveCustomTags = async (tags) => {
      try {
        const settingData = {
          type: 'CONFIG_TAG_X_APP',
          setting: tags // Lưu trực tiếp array object, không cần JSON.stringify
        };

        const response = await getSettingByType('CONFIG_TAG_X_APP');
        if (response && response.id) {
          // Update existing setting
          await updateSetting({
            ...settingData,
            id: response.id
          });
        } else {
          // Create new setting
          await createSetting(settingData);
        }
        
        message.success('Đã lưu cấu hình tag');
      } catch (error) {
        console.error('Error saving custom tags:', error);
        message.error('Không thể lưu cấu hình tag');
      }
    };

    // Add new tag
    const handleAddTag = () => {
      if (!newTagName.trim() || !newTagProvince) {
        message.warning('Vui lòng nhập đầy đủ thông tin');
        return;
      }

      const newTag = {
        id: Date.now(),
        name: newTagName.trim(),
        province: newTagProvince,
        businessImpactMode: 'chung', // Default to 'chung'
        system_message: '' // Default empty system message
      };

      const updatedTags = [...customTags, newTag];
      setCustomTags(updatedTags);
      saveCustomTags(updatedTags);

      setNewTagName('');
      setNewTagProvince('');
      
      // Auto select the new tag (first tag if none selected)
      setSelectedStore(newTag.name);
    };

    // Delete tag
    const handleDeleteTag = (tagId) => {
      const tagToDelete = customTags.find(tag => tag.id === tagId);
      const updatedTags = customTags.filter(tag => tag.id !== tagId);
      
      // If we're deleting the currently selected store, select the first available tag
      if (tagToDelete && selectedStore === tagToDelete.name) {
        if (updatedTags.length > 0) {
          setSelectedStore(updatedTags[0].name);
        } else {
          setSelectedStore('');
        }
      }
      
      setCustomTags(updatedTags);
      saveCustomTags(updatedTags);
    };

    // Open system message modal for a specific tag
    const handleOpenSystemMessageModal = (tag) => {
      setSelectedTagForSystemMessage(tag);
      setTagSystemMessage(tag.system_message || '');
      setShowSystemMessageModal(true);
    };

    // Save system message for a tag
    const handleSaveSystemMessage = () => {
      if (selectedTagForSystemMessage) {
        const updatedTags = customTags.map(tag => 
          tag.id === selectedTagForSystemMessage.id 
            ? { ...tag, system_message: tagSystemMessage }
            : tag
        );
        setCustomTags(updatedTags);
        saveCustomTags(updatedTags);
        setShowSystemMessageModal(false);
        message.success('Đã lưu system message cho tag');
      }
    };

    // Fetch noi bo data for a specific date and store
    const fetchNoiBoData = async (date, storeId) => {
      try {

        const response = await getTroLyDuBaoNoiBoByIdCuaHang({
          id: storeId,
          ngay: date
        });

        
        // Handle different response formats
        if (response?.result) {
          // If result is an array, check if it has data
          if (Array.isArray(response.result)) {
            return response.result.length > 0 ? response.result[0] : null;
          }
          // If result is an object, return it directly
          return response.result;
        }
        
        // If response is an array directly
        if (Array.isArray(response)) {
          return response.length > 0 ? response[0] : null;
        }
        
        // If response is an object with data property
        if (response?.data) {
          if (Array.isArray(response.data)) {
            return response.data.length > 0 ? response.data[0] : null;
          }
          return response.data;
        }
        
        // If response is an object with noi_dung property
        if (response?.noi_dung) {
          return response;
        }
        
        return null;
      } catch (error) {
        // 404 is expected when no data exists yet
        if (error.response?.status === 404) {
          return null;
        }
        console.error('Error fetching noi bo data:', error);
        return null;
      }
    };

    // Analyze noi bo data using AI
    const analyzeNoiBoData = async (record, rowIndex) => {
      if (!selectedStore) return;

      const selectedTag = customTags.find(tag => tag.name === selectedStore);
      if (!selectedTag) return;

      setAnalyzingNoiBo(prev => ({ ...prev, [rowIndex]: true }));

      try {
        // Prepare data for AI analysis
        const analysisData = {
          date: record.date,
          weatherNoon: record.lunchClimate.condition,
          weatherEvening: record.dinnerClimate.condition,
          events: record.event.event,
          overallScore: record.overallScore,
          businessImpact: record.businessImpact
        };

        const prompt = `Ngày: ${analysisData.date}
Thời tiết trưa: ${analysisData.weatherNoon}
Thời tiết tối: ${analysisData.weatherEvening}
Sự kiện: ${analysisData.events}
Điểm tổng quan: ${analysisData.overallScore}
Tác động kinh doanh hiện tại: ${analysisData.businessImpact}`;

        // Use tag's system message or default
        const systemMessage = selectedTag.system_message + 'chỉ trả về nội dung tác động kinh doanh nội bộ và không giải thích gì thêm, không cần lời chào mở đầu' || defaultSystemMessage || `Bạn là chuyên gia phân tích nội bộ cho chuỗi F&B. Dựa vào dữ liệu sau, đưa ra phân tích chi tiết về tác động kinh doanh nội bộ cho cửa hàng này. 
        chỉ trả về kết quả tác động kinh doanh nội bộ và không giải thích gì thêm, không cần lời chào mở đầu.
        `;

        const response = await aiGen(prompt, systemMessage, 'gemini-2.5-flash-preview-05-20', 'text');
        const noiBoContent = response.result || response.message || 'Không thể phân tích';

        // Save to database
        const noiBoData = {
          id_cua_hang: selectedTag.id,
          ngay: record.date,
          noi_dung: noiBoContent
        };
        // Check if data already exists
        const existingData = await fetchNoiBoData(record.date, selectedTag.id);
        
        if (existingData) {
          // Update existing
          await updateTroLyDuBaoNoiBo({
            ...noiBoData,
            id: existingData.id
          });
        } else {
          // Create new
          await createNewTroLyDuBaoNoiBo(noiBoData);
        }

        // Update local state
        setNoiBoData(prev => ({
          ...prev,
          [`${record.date}_${selectedTag.id}`]: noiBoContent
        }));

        message.success('Đã phân tích và lưu dữ liệu nội bộ');
      } catch (error) {
        console.error('Error analyzing noi bo data:', error);
        message.error('Lỗi khi phân tích dữ liệu nội bộ');
      } finally {
        setAnalyzingNoiBo(prev => ({ ...prev, [rowIndex]: false }));
      }
    };

    // Analyze all records
    const analyzeAllRecords = async () => {
      if (!selectedStore || !forecastData.length) return;

      setAnalyzingAll(true);
      
      try {
        for (let i = 0; i < forecastData.length; i++) {
          const record = forecastData[i];
          
          // Skip if already analyzing this record
          if (analyzingNoiBo[i]) continue;
          
          // Set analyzing state for this record
          setAnalyzingNoiBo(prev => ({ ...prev, [i]: true }));
          
          try {
            await analyzeNoiBoData(record, i);
            
            // Add delay between requests to avoid overwhelming the API
            if (i < forecastData.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.error(`Error analyzing record ${i}:`, error);
            // Continue with next record even if this one fails
          } finally {
            setAnalyzingNoiBo(prev => ({ ...prev, [i]: false }));
          }
        }
        
        message.success('Đã phân tích toàn bộ dữ liệu');
      } catch (error) {
        console.error('Error in batch analysis:', error);
        message.error('Có lỗi xảy ra khi phân tích toàn bộ');
      } finally {
        setAnalyzingAll(false);
      }
    };

    // Save ghi chu for a specific date and store
    const saveGhiChu = async (date, storeId, ghiChu) => {
      try {
        const noiBoData = {
          id_cua_hang: storeId,
          ngay: date,
          ghi_chu: ghiChu
        };

        // Check if data already exists
        const existingData = await fetchNoiBoData(date, storeId);
        
        if (existingData) {
          // Update existing
          await updateTroLyDuBaoNoiBo({
            ...noiBoData,
            id: existingData.id
          });
        } else {
          // Create new
          await createNewTroLyDuBaoNoiBo(noiBoData);
        }

        // Update local state
        setGhiChuData(prev => ({
          ...prev,
          [`${date}_${storeId}`]: ghiChu
        }));

        message.success('Đã lưu ghi chú');
      } catch (error) {
        console.error('Error saving ghi chu:', error);
        message.error('Lỗi khi lưu ghi chú');
      }
    };

    // Create test data for debugging
    const createTestData = async () => {
      if (!selectedStore) return;
      
      const selectedTag = customTags.find(tag => tag.name === selectedStore);
      if (!selectedTag) return;

      try {
        const testData = {
          id_cua_hang: selectedTag.id,
          ngay: '4/8/2025',
          noi_dung: '**Test dữ liệu nội bộ**\n\n- Đây là dữ liệu test để kiểm tra hiển thị\n- Dữ liệu này được tạo tự động\n- Nếu bạn thấy dữ liệu này, API đang hoạt động đúng'
        };

        await createNewTroLyDuBaoNoiBo(testData);
        setTestDataCreated(true);
        message.success('Đã tạo dữ liệu test');
        
        // Refresh data
        if (businessImpactMode === 'noi-bo') {
          const noiBoData = await fetchNoiBoData('4/8/2025', selectedTag.id);
          if (noiBoData) {
            setNoiBoData(prev => ({
              ...prev,
              [`4/8/2025_${selectedTag.id}`]: noiBoData.noi_dung
            }));
          }
        }
      } catch (error) {
        console.error('Error creating test data:', error);
        message.error('Lỗi khi tạo dữ liệu test');
      }
    };

    // Fetch data when component mounts or filters change
    useEffect(() => {
      if (selectedStore) {
        fetchForecastData().then(setForecastData);
      } else {
        setForecastData([]);
      }
    }, [selectedStore, selectedWeek, businessImpactMode]);

    // Load custom tags when component mounts
    useEffect(() => {
      loadCustomTags();
      loadDefaultSystemMessage();
    }, []);

    // Load default system message
    const loadDefaultSystemMessage = async () => {
      try {
        const response = await getSettingByType('DEFAULT_SYSTEM_MESSAGE_FOR_TLDB');
        if (response && response.setting) {
          setDefaultSystemMessage(response.setting);
        } else {
          // Set default message if not exists
          const defaultMessage = `Dựa vào data sau, đưa ra 2 phần đánh giá riêng biệt cho một cửa hàng quán ăn:

Đánh giá mức độ tổng quan kinh doanh: Cung cấp một điểm số trên thang 5 (với 3 là trung bình) và lý do chi tiết cho điểm số đó.

Đánh giá tác động kinh doanh: Phân tích tác động kinh doanh bằng cách nêu rõ các yếu tố tiêu cực (Yếu tố tiêu cực:) trong 20 từ, tích cực (Yếu tố tích cực:) trong 20 từ, đưa ra lời khuyên (Lời khuyên:) cụ thể cho cửa hàng trong 20 từ.

Chỉ đưa ra data cần thiết, dưới dạng text, đánh giá bố cục rõ ràng để tôi có thể dùng code phân tách ra cho từng phần và mục, không thêm bất cứ gì`;
          setDefaultSystemMessage(defaultMessage);
        }
      } catch (error) {
        console.error('Error loading default system message:', error);
      }
    };

    // Save default system message
    const saveDefaultSystemMessage = async () => {
      try {
        const settingData = {
          type: 'DEFAULT_SYSTEM_MESSAGE_FOR_TLDB',
          setting: defaultSystemMessage
        };

        // Check if setting already exists
        const existingSetting = await getSettingByType('DEFAULT_SYSTEM_MESSAGE_FOR_TLDB');
        
        if (existingSetting) {
          // Update existing
          await updateSetting({
            ...settingData,
            id: existingSetting.id
          });
        } else {
          // Create new
          await createSetting(settingData);
        }

        message.success('Đã lưu system message mặc định');
      } catch (error) {
        console.error('Error saving default system message:', error);
        message.error('Lỗi khi lưu system message mặc định');
      }
    };

    // Load noi bo data when businessImpactMode changes
    useEffect(() => {
      if (businessImpactMode === 'noi-bo' && selectedStore && forecastData.length > 0) {
        const loadNoiBoData = async () => {
          const selectedTag = customTags.find(tag => tag.name === selectedStore);
          if (selectedTag) {

            
                                        const noiBoDataPromises = forecastData.map(async (dayData) => {
                // Use date in d/m/yyyy format for API
                const noiBoData = await fetchNoiBoData(dayData.date, selectedTag.id);
                
                if (noiBoData) {
                  setNoiBoData(prev => ({
                    ...prev,
                    [`${dayData.date}_${selectedTag.id}`]: noiBoData.noi_dung
                  }));
                  
                  // Also load ghi chu data
                  if (noiBoData.ghi_chu) {
                    setGhiChuData(prev => ({
                      ...prev,
                      [`${dayData.date}_${selectedTag.id}`]: noiBoData.ghi_chu
                    }));
                  }
                }
                return noiBoData;
              });
              await Promise.all(noiBoDataPromises);
          }
        };
        
        loadNoiBoData();
      }
    }, [businessImpactMode, selectedStore, forecastData, customTags]);

    // Auto-select first week when component mounts
    useEffect(() => {
      if (!selectedWeek) {
        setSelectedWeek('week-1');
      }
    }, []);

    // Validate selectedStore when customTags change
    useEffect(() => {
      if (selectedStore && customTags.length > 0) {
        const isValidStore = customTags.some(tag => tag.name === selectedStore);
        if (!isValidStore) {
          // If selectedStore is no longer valid, select the first available tag
          setSelectedStore(customTags[0].name);
        }
      }
    }, [customTags, selectedStore]);

    // Table columns for PC view
    const tableColumns = [
      {
        title: 'Ngày',
        dataIndex: 'date',
        key: 'date',
        width: 120,
        render: (date, record) => (
          <div style={{ display: "flex", alignItems: "start", gap: "4px", height: "150px"}}>
            
          <div>
            <Text strong style={{ color: record.isWeekend ? 'red' : 'inherit' }}>
              {record.dayOfWeek}
            </Text>
            <br />
            <Text type="secondary" style={{ color: record.isWeekend ? 'red' : 'inherit' }}>
              {date}
            </Text>
          </div>
            </div>
        ),
      },
      {
        title: 'Điểm',
        key: 'overallScore',
        width: 100,
        render: (_, record) => (
          <div style={{ display: "flex", alignItems: "start", gap: "4px", height: "150px"}}>
            <ScoreMeter score={record.overallScore} />
          </div>
        ),
      },
      {
        title: 'Thời Tiết Trưa',
        key: 'lunchClimate',
        width: 100,
        render: (_, record) => (
          <div style={{ height: '150px', overflow: 'hidden', position: 'relative' }}>
            <div 
              style={{ 
                fontSize: '13px', 
                lineHeight: '1.4',
                color: '#454545'
              }}
            >
              {record.lunchClimate.meaning || "Chưa đánh giá"}
            </div>

          </div>
        ),
      },
      {
        title: 'Thời Tiết Tối',
        key: 'dinnerClimate',
        width: 100,
        render: (_, record) => (
          <div style={{ height: '150px', overflow: 'hidden', position: 'relative' }}>
            <div 
              style={{ 
                fontSize: '13px', 
                lineHeight: '1.4',
                color: '#454545'
              }}
            >
              {record.dinnerClimate.meaning || "Chưa đánh giá"}
            </div>

          </div>
        ),
      },
      {
        title: 'Sự Kiện',
        key: 'event',
        width: 300,
        render: (_, record) => (
          <div style={{ height: '150px', overflow: 'hidden', position: 'relative' }}>
            <div 
              style={{ 
                fontSize: '13px', 
                lineHeight: '1.3',
                color: record.event.event === "Không có sự kiện đặc biệt" ? '#999' : '#454545',
                fontWeight: record.event.event === "Không có sự kiện đặc biệt" ? 'normal' : '500'
              }}
            >
              {record.event.event}
            </div>
            {(() => {
              // Check if content overflows by creating a temporary element
              const tempDiv = document.createElement('div');
              tempDiv.style.cssText = `
                position: absolute;
                visibility: hidden;
                height: 100%;
                width: 180px;
                fontSize: 13px;
                lineHeight: 1.3;
                fontFamily: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                whiteSpace: 'pre-wrap';
                wordWrap: 'break-word';
              `;
              tempDiv.innerHTML = record.event.event || '';
              document.body.appendChild(tempDiv);
              const isOverflowing = tempDiv.scrollHeight > 150;
              document.body.removeChild(tempDiv);
              
              return isOverflowing ? (
                <div style={{ 
                  position: 'absolute', 
                  bottom: '0', 
                  right: 0, 
                  background: 'linear-gradient(transparent, white)', 
                  width: '100%', 
                  height: '20px',
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'flex-end',
                }}>
                  <Button 
                    type="link" 
                    size="small" 
                    style={{ fontSize: '11px', color: '#1890ff' ,backgroundColor: 'white'}}
                    onClick={() => {
                      setSelectedDetailData({
                        ...record,
                        detailContent: record.event.event || "Không có sự kiện đặc biệt",
                        detailTitle: 'Sự Kiện'
                      });
                      setShowDetailModal(true);
                    }}
                  >
                    Xem chi tiết
                  </Button>
                </div>
              ) : null;
            })()}
          </div>
        ),
      },
      {
        title: 'Ghi Chú',
        key: 'ghiChu',
        flex: 1,
        render: (_, record) => {
          const selectedTag = customTags.find(tag => tag.name === selectedStore);
          const ghiChuContent = selectedTag ? ghiChuData[`${record.date}_${selectedTag.id}`] : null;
          
          return (
            <div style={{ height: '150px', overflow: 'hidden', position: 'relative' }}>
              {ghiChuContent ? (
                <div 
                  style={{ 
                    fontSize: '12px', 
                    lineHeight: '1.4', 
                    color: '#333',
                    maxWidth: '100%'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: `
                      <style>
                        .ghi-chu-markdown {
                          font-size: 12px;
                          line-height: 1.4;
                          color: #333;
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        }
                        .ghi-chu-markdown strong {
                          color: #262626;
                          font-weight: 600;
                        }
                        .ghi-chu-markdown ul {
                          margin: 4px 0;
                          padding-left: 16px;
                          list-style-type: disc;
                        }
                        .ghi-chu-markdown li {
                          margin-bottom: 4px;
                          line-height: 1.3;
                        }
                        .ghi-chu-markdown p {
                          margin: 2px 0;
                          line-height: 1.3;
                        }
                        .ghi-chu-markdown br {
                          margin-bottom: 2px;
                        }
                        .ghi-chu-markdown * {
                          font-size: inherit;
                        }
                      </style>
                      <div class="ghi-chu-markdown">${marked(ghiChuContent)}</div>
                    `
                  }}
                />
              ) : (
                <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#999' }}>
                  Chưa có ghi chú
                </div>
              )}
              
              
              
              {/* Edit/Add button */}
              <div style={{ 
                position: 'absolute', 
                bottom: '2px', 
                right: 0, 
                background: 'linear-gradient(transparent, white)', 
                width: '100%', 
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: '8px'
              }}>
                {(() => {
                // Check if content overflows by creating a temporary element
                const tempDiv = document.createElement('div');
                tempDiv.style.cssText = `
                  position: absolute;
                  visibility: hidden;
                  height: 100%;
                  width: 200px;
                  fontSize: 12px;
                  lineHeight: 1.4;
                  fontFamily: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  whiteSpace: 'pre-wrap';
                  wordWrap: 'break-word';
                `;
                tempDiv.innerHTML = ghiChuContent || '';
                document.body.appendChild(tempDiv);
                const isOverflowing = tempDiv.scrollHeight > 150;
                document.body.removeChild(tempDiv);
                
                return isOverflowing ? (
                  <Button 
                    type="link" 
                    size="small" 
                    style={{ fontSize: '11px', color: '#1890ff', marginLeft: '8px' }}
                    onClick={() => {
                      setSelectedDetailData({
                        ...record,
                        detailContent: ghiChuContent || "Chưa có ghi chú",
                        detailTitle: 'Ghi Chú'
                      });
                      setShowDetailModal(true);
                    }}
                  >
                    Xem chi tiết
                  </Button>
                ) : null;
              })()}
                <Button 
                  type="default" 
                  size="small" 
                  style={{ padding: '0 4px', fontSize: '11px', color: '#1890ff' }}
                  onClick={() => {
                    const selectedTag = customTags.find(tag => tag.name === selectedStore);
                    if (selectedTag) {
                      const currentGhiChu = ghiChuData[`${record.date}_${selectedTag.id}`] || '';
                      Modal.confirm({
                        title: 'Chỉnh sửa ghi chú',
                        content: (
                          <Input.TextArea
                            defaultValue={currentGhiChu}
                            rows={8}
                            placeholder="Nhập ghi chú..."
                            style={{ marginTop: 16 }}
                          />
                        ),
                        onOk: (close) => {
                          const textArea = document.querySelector('.ant-modal-content textarea');
                          const newGhiChu = textArea ? textArea.value : '';
                          saveGhiChu(record.date, selectedTag.id, newGhiChu);
                          close();
                        },
                        width: 600
                      });
                    }
                  }}
                >
                  {ghiChuContent ? 'Sửa' : 'Thêm'}
                </Button>
              </div>

            </div>
          );
        },
      },
      // Conditional columns based on businessImpactMode
      ...(businessImpactMode === 'chung' ? [
        {
          title: 'Tác Động Kinh Doanh',
          key: 'businessImpact',
          width: 300,
          render: (_, record) => {
            return (
              <div style={{ height: '150px', overflow: 'hidden', position: 'relative' }}>
                <div 
                  ref={(el) => {
                    if (el) {
                      // Check if content overflows
                      const isOverflowing = el.scrollHeight > 120;
                      if (isOverflowing) {
                        el.style.overflow = 'hidden';
                      }
                    }
                  }}
                >
                  <BusinessImpactDisplay businessImpact={record.businessImpact} />
                </div>
                {(() => {
                  // Check if content overflows by creating a temporary element
                  const tempDiv = document.createElement('div');
                  tempDiv.style.cssText = `
                    position: absolute;
                    visibility: hidden;
                    height: 100%;
                    width: 300px;
                    fontSize: 12px;
                    lineHeight: 1.4;
                    fontFamily: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    whiteSpace: 'pre-wrap';
                    wordWrap: 'break-word';
                  `;
                  tempDiv.innerHTML = record.businessImpact || '';
                  document.body.appendChild(tempDiv);
                  const isOverflowing = tempDiv.scrollHeight > 150;
                  document.body.removeChild(tempDiv);
                  
                  return isOverflowing ? (
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '0', 
                      right: 0, 
                      background: 'linear-gradient(transparent, white)', 
                      width: '100%', 
                      height: '20px',
                      display: 'flex',
                      alignItems: 'start',
                      justifyContent: 'flex-end',
                    }}>
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ fontSize: '11px', color: '#1890ff' ,backgroundColor: 'white'}}
                        onClick={() => {
                          setSelectedDetailData(record);
                          setShowDetailModal(true);
                        }}
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  ) : null;
                })()}
              </div>
            );
          },
        }
      ] : [
        {
          title: 'Ghi Chú Nội Bộ',
          key: 'noiBoImpact',
          width: 300,
          render: (_, record) => {
            const selectedTag = customTags.find(tag => tag.name === selectedStore);
            const noiBoContent = selectedTag ? noiBoData[`${record.date}_${selectedTag.id}`] : null;
            

            
            return (
              <div style={{ height: '150px', overflow: 'hidden', position: 'relative' }}>
                {noiBoContent ? (
                  <div 
                    style={{ 
                      fontSize: '12px', 
                      lineHeight: '1.4', 
                      color: '#333',
                      maxWidth: '100%'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: `
                        <style>
                          .noi-bo-markdown {
                            font-size: 12px;
                            line-height: 1.4;
                            color: #333;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                          }
                          .noi-bo-markdown strong {
                            color: #262626;
                            font-weight: 600;
                          }
                          .noi-bo-markdown ul {
                            margin: 4px 0;
                            padding-left: 16px;
                            list-style-type: disc;
                          }
                          .noi-bo-markdown li {
                            margin-bottom: 4px;
                            line-height: 1.3;
                          }
                          .noi-bo-markdown p {
                            margin: 2px 0;
                            line-height: 1.3;
                          }
                          .noi-bo-markdown br {
                            margin-bottom: 2px;
                          }
                          .noi-bo-markdown * {
                            font-size: inherit;
                          }
                        </style>
                        <div class="noi-bo-markdown">${marked(noiBoContent)}</div>
                      `
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#999' }}>
                    Chưa có ghi chú nội bộ
                  </div>
                )}
                
                {/* Check if content overflows and show "Xem chi tiết" */}
                {(() => {
                  // Check if content overflows by creating a temporary element
                  const tempDiv = document.createElement('div');
                  tempDiv.style.cssText = `
                    position: absolute;
                    visibility: hidden;
                    height: 100%;
                    width: 300px;
                    fontSize: 12px;
                    lineHeight: 1.4;
                    fontFamily: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    whiteSpace: 'pre-wrap';
                    wordWrap: 'break-word';
                  `;
                  tempDiv.innerHTML = noiBoContent || '';
                  document.body.appendChild(tempDiv);
                  const isOverflowing = tempDiv.scrollHeight > 150;
                  document.body.removeChild(tempDiv);
                  
                  return isOverflowing ? (
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '0', 
                      right: 0, 
                      background: 'linear-gradient(transparent, white)', 
                      width: '100%', 
                      height: '20px',
                      display: 'flex',
                      alignItems: 'start',
                      justifyContent: 'flex-end',
                    }}>
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ fontSize: '11px', color: '#1890ff' ,backgroundColor: 'white'}}
                        onClick={() => {
                          setSelectedDetailData({
                            ...record,
                            detailContent: noiBoContent || "Chưa có ghi chú nội bộ",
                            detailTitle: 'Ghi Chú Nội Bộ'
                          });
                          setShowDetailModal(true);
                        }}
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  ) : null;
                })()}
              </div>
            );
          },
        },
        ...(currentUser?.isAdmin ? [{
          title: (<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Phân Tích    {selectedStore && businessImpactMode === 'noi-bo' && (
     
              <Button
                type="link"
                size="small"
                loading={analyzingAll}
                onClick={analyzeAllRecords}
                disabled={!forecastData.length}
                icon={<RedoOutlined />}
                title="Phân tích toàn bộ"
              />
          )}</div>),
          key: 'analyze',
          width: 120,
          render: (_, record, index) => {
            const selectedTag = customTags.find(tag => tag.name === selectedStore);
            const hasData = selectedTag ? noiBoData[`${record.date}_${selectedTag.id}`] : false;
            
            return (
              <Button
                type={hasData ? "default" : "primary"}
                size="small"
                loading={analyzingNoiBo[index]}
                onClick={() => analyzeNoiBoData(record, index)}
                style={{ fontSize: '11px' }}
              >
                {hasData ? 'Phân tích lại' : 'Phân tích'}
              </Button>
            );
          },
        }] : [])
      ]),
      {
        title: 'Tổng Quan',
        key: 'overallImpact',
        width: 120,
        render: (_, record) => {
          const status = getOverallStatus(record.overallImpact);
          return (
            <div style={{ display: "flex", alignItems: "start", gap: "4px", height: "150px"}}>
              <Tag color={status.color}>{status.label}</Tag>
            </div>
          );
        },
      },
    ];
  
  
    const HomeTab = () => (
      <Row gutter={[24, 24]}>
        {/* Left Panel */}
        <Col xs={24} sm={24} md={6}>
          <Card 
className={css.containerFilter}

            title={
              <Flex justify="space-between" align="center" style={{width: '100%', padding: '0'}}>
                <Text strong>Bộ Lọc</Text>
                <Button 
                  type="text" 
                  size="small"
                  icon={<Settings size={14} />}
                  onClick={() => setShowTagModal(true)}
                  title="Cấu hình tag"
                />
              </Flex>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} >
              <div>
                <Text strong>Cửa Hàng</Text>
                {customTags.length === 0 ? (
                  <div style={{ 
                    marginTop: 8, 
                    padding: '16px', 
                    backgroundColor: '#f6f8fa', 
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                      Chưa có cửa hàng nào được tạo
                    </Text>
                    <Button 
                      type="primary" 
                      size="small"
                      icon={<Settings size={14} />}
                      onClick={() => setShowTagModal(true)}
                    >
                      Tạo Cửa Hàng Đầu Tiên
                    </Button>
                  </div>
                ) : (
                  <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap' }}>
                    {customTags.map((tag) => (
                    <Tag.CheckableTag
                        key={tag.id}
                        checked={selectedStore === tag.name}
                        onChange={() => handleStoreSelection(tag.name)}
                      >
                        <div style={{ fontSize: '12px' }}>
                          <div>{tag.name}</div>
                        </div>
                    </Tag.CheckableTag>
                  ))}
                </div>
                )}
              </div>
              <div>
                <Text strong>Tuần</Text>
                <Select
                  value={selectedWeek}
                  onChange={setSelectedWeek}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {weekOptions.map((week) => (
                    <Option key={week.id} value={week.id}>
                      {week.label}
                    </Option>
                  ))}
                </Select>
              </div>
              {selectedStore && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <Text strong>Tác Động Kinh Doanh</Text>
                  <Switch
                    checked={businessImpactMode === 'noi-bo'}
                    onChange={(checked) => {
                      const newMode = checked ? 'noi-bo' : 'chung';
                      setBusinessImpactMode(newMode);
                      
                      // Update the selected tag's businessImpactMode
                      if (selectedStore) {
                        const updatedTags = customTags.map(tag => 
                          tag.name === selectedStore 
                            ? { ...tag, businessImpactMode: newMode }
                            : tag
                        );
                        setCustomTags(updatedTags);
                        saveCustomTags(updatedTags);
                      }
                    }}
                    checkedChildren='Nội Bộ'
                    unCheckedChildren="Chung"
                  />
                </div>
              )}
              
           
              <Button 
                type="primary" 
                onClick={() => fetchForecastData().then(setForecastData)}
                loading={loading}
                style={{ width: '100%' }}
              >
                Làm Mới Dữ Liệu
              </Button>
            </Space>
          </Card>
        </Col>
  
        {/* Main Content */}
        <Col xs={24} sm={24} md={18}>
          {!selectedStore ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Settings size={48} style={{ color: '#d9d9d9', marginBottom: '16px' }} />
                <Title level={4} style={{ color: '#666', marginBottom: '8px' }}>
                  Chưa có cửa hàng nào được chọn
                </Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
                  Vui lòng tạo cửa hàng đầu tiên để xem dữ liệu dự báo
                </Text>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<Settings size={16} />}
                  onClick={() => setShowTagModal(true)}
                >
                  Tạo Cửa Hàng Đầu Tiên
                </Button>
              </div>
            </Card>
          ) : loading ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text>Đang tải dữ liệu dự báo...</Text>
              </div>
            </Card>
          ) : (
            <>
          
            
              
              {isMobile ? (
            // Mobile view - Card layout
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: forceDesktop ? 3 : 2 }}
            dataSource={forecastData}
            renderItem={(day) => {
              const status = getOverallStatus(day.overallImpact);
              const title = (
                   <Flex justify="space-between" align="start">
                      <div style={{display: 'flex', gap: 4 }}>
                          <Text strong style={{ color: day.isWeekend ? 'red' : 'inherit', fontSize: '19px' }}>{day.dayOfWeek}</Text>
                    
                          <Text type="secondary" style={{ color: day.isWeekend ? 'red' : 'inherit', fontSize: '19px' }}>- {day.date}</Text>
                      </div>
                      <Tag color={status.color}>{status.label}</Tag>
                  </Flex>
              );
                
              return (
                <List.Item>
                  <Card title={title} headStyle={{padding: '0 16px', borderBottom: '2px solid #898989'}} bodyStyle={{padding: 16}} >
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        {/* Overall Score */}
                        <div>
                          <Text strong>Điểm Tổng Quan</Text>
                          <div style={{ marginTop: 8 }}>
                            <ScoreMeter score={day.overallScore} />
                          </div>
                        </div>
                        
                      {/* Weather Evaluations */}
                      <div>
                          <Text strong>Đánh Giá Thời Tiết</Text>
                          <Row gutter={8} style={{marginTop: 8}}>
                              <Col span={12}>
                                  <Card size="small" bodyStyle={{padding: 8}}>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                          <Text strong style={{ color: '#FF6B35', fontSize: '12px' }}>Trưa</Text>
                                          <Text style={{display: 'block', fontSize: '11px', marginTop: '4px'}}>
                                            {day.lunchClimate.meaning || "Chưa đánh giá"}
                                          </Text>
                                      </div>
                                  </Card>
                              </Col>
                              <Col span={12}>
                                 <Card size="small" bodyStyle={{padding: 8}}>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                          <Text strong style={{ color: '#4A90E2', fontSize: '12px' }}>Tối</Text>
                                          <Text  style={{display: 'block', fontSize: '11px', marginTop: '4px'}}>
                                            {day.dinnerClimate.meaning || "Chưa đánh giá"}
                                          </Text>
                                      </div>
                                  </Card>
                              </Col>
                          </Row>
                      </div>
  
                      {/* Event Section */}
                      <div>
                           <Text strong>Sự Kiện</Text>
                            <Card size="small" bodyStyle={{padding: 8}} style={{marginTop: 8}}>
                                 <Text 
                                   style={{ 
                                     fontSize: '11px',
                                     color: (day.event.event || "Không có sự kiện đặc biệt") === "Không có sự kiện đặc biệt" ? '#999' : '#1890ff',
                                     fontWeight: (day.event.event || "Không có sự kiện đặc biệt") === "Không có sự kiện đặc biệt" ? 'normal' : '500'
                                   }}
                                 >
                                   {day.event.event || "Không có sự kiện đặc biệt"}
                                 </Text>
                              </Card>
                      </div>
  
                      {/* Business Impact */}
                      <div>
                        <div style={{display: 'flex', gap: 8}}>
                          <Text strong>{businessImpactMode === 'noi-bo' ? 'Ghi Chú Nội Bộ' : 'Tác Động Kinh Doanh'}</Text>
                        {businessImpactMode === 'noi-bo' && currentUser?.isAdmin && (
                        <div>
                          <Button
                            type="primary"
                            size="small"
                            loading={analyzingNoiBo[forecastData.indexOf(day)]}
                            onClick={() => analyzeNoiBoData(day, forecastData.indexOf(day))}
                            style={{ width: '100%', fontSize: '12px' }}
                          >
                            {(() => {
                              const selectedTag = customTags.find(tag => tag.name === selectedStore);
                              const hasData = selectedTag ? noiBoData[`${day.date}_${selectedTag.id}`] : false;
                              return hasData ? 'Phân tích lại' : 'Phân tích';
                            })()}
                          </Button>
                        </div>
                      )}
                      </div>
                        <div style={{fontSize: '12px', marginTop: 8 }}>
                          {businessImpactMode === 'noi-bo' ? (
                            (() => {
                              const selectedTag = customTags.find(tag => tag.name === selectedStore);
                              const noiBoContent = selectedTag ? noiBoData[`${day.date}_${selectedTag.id}`] : null;
                              
                              if (noiBoContent) {
                                return (
                                  <div 
                                    style={{ 
                                      fontSize: '12px', 
                                      lineHeight: '1.4', 
                                      color: '#333',
                                      maxWidth: '100%'
                                    }}
                                    dangerouslySetInnerHTML={{ 
                                      __html: `
                                        <style>
                                          .mobile-noi-bo-markdown {
                                            font-size: 12px;
                                            line-height: 1.4;
                                            color: #333;
                                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                          }
                                          .mobile-noi-bo-markdown strong {
                                            color: #262626;
                                            font-weight: 600;
                                          }
                                          .mobile-noi-bo-markdown ul {
                                            margin: 4px 0;
                                            padding-left: 16px;
                                            list-style-type: disc;
                                          }
                                          .mobile-noi-bo-markdown li {
                                            margin-bottom: 4px;
                                            line-height: 1.3;
                                          }
                                          .mobile-noi-bo-markdown p {
                                            margin: 2px 0;
                                            line-height: 1.3;
                                          }
                                          .mobile-noi-bo-markdown br {
                                            margin-bottom: 2px;
                                          }
                                          .mobile-noi-bo-markdown * {
                                            font-size: inherit;
                                          }
                                        </style>
                                        <div class="mobile-noi-bo-markdown">${marked(noiBoContent)}</div>
                                      `
                                    }}
                                  />
                                );
                              } else {
                                return (
                                  <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#999' }}>
                                    Chưa có ghi chú nội bộ    
                                  </div>
                                );
                              }
                            })()
                          ) : (
                            <BusinessImpactDisplay businessImpact={day.businessImpact} />
                          )}
                        </div>
                      </div>
                      
                      {/* Analysis Button for Noi Bo Mode */}
                    
                      
                      {/* Ghi Chú Section */}
                      <div>
                        <div style={{display: 'flex', gap: 8}}>
                        <Text strong >Ghi Chú </Text>
                        <Button
                          type="default"
                          size="small"
                          onClick={() => {
                            const selectedTag = customTags.find(tag => tag.name === selectedStore);
                            if (selectedTag) {
                              const currentGhiChu = ghiChuData[`${day.date}_${selectedTag.id}`] || '';
                              Modal.confirm({
                                title: 'Chỉnh sửa ghi chú',
                                content: (
                                  <Input.TextArea
                                    defaultValue={currentGhiChu}
                                    rows={8}
                                    placeholder="Nhập ghi chú..."
                                  />
                                ),
                                onOk: (close) => {
                                  const textArea = document.querySelector('.ant-modal-content textarea');
                                  const newGhiChu = textArea ? textArea.value : '';
                                  saveGhiChu(day.date, selectedTag.id, newGhiChu);
                                  close();
                                },
                                width: 600
                              });
                            }
                          }}
                          style={{  fontSize: '12px'}}
                        >
                          {(() => {
                            const selectedTag = customTags.find(tag => tag.name === selectedStore);
                            const hasGhiChu = selectedTag ? ghiChuData[`${day.date}_${selectedTag.id}`] : false;
                            return hasGhiChu ? 'Sửa ghi chú' : 'Thêm ghi chú';
                          })()}
                        </Button>
                        </div>
                        <div style={{fontSize: '12px', marginTop: 8 }}>
                          {(() => {
                            const selectedTag = customTags.find(tag => tag.name === selectedStore);
                            const ghiChuContent = selectedTag ? ghiChuData[`${day.date}_${selectedTag.id}`] : null;
                            
                            if (ghiChuContent) {
                              return (
                                <div 
                                  style={{ 
                                    fontSize: '12px', 
                                    lineHeight: '1.4', 
                                    maxWidth: '100%',
                                    color: '#0084ff',
                                    fontWeight: '500'
                                  }}
                             
                                >
                                  {ghiChuContent}
                                </div>
                              );
                            } else {
                              return (
                                <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#999' }}>
                                  Chưa có ghi chú
                                </div>
                              );
                            }
                          })()}
                        </div>
                        
                      </div>
                    </Space>
                  </Card>
                </List.Item>
              );
            }}
          />
          ) : (
            // PC view - Table layout
            <div style={{height: '100%', width: '100%'}}>
              <Table
                columns={tableColumns}
                dataSource={forecastData}
                rowKey="id"
                pagination={false}
                scroll={{ x: 'max-content', y: 'calc(100vh - 120px)' }}
                size="small"
              />
            </div>
          )}
            </>
          )}
        </Col>
      </Row>
    );
  
    const ConfigTab = () => (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Row gutter={[24, 24]}>
          {/* Left Column - Configuration */}
          <Col xs={24} lg={12}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              
              {/* AI Model Configuration */}
              <Card title={<Title level={5}>🤖 Cấu Hình AI Model</Title>}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <div>
                    <Text strong>Chọn Model AI</Text>
                          <Select
                              value={selectedModel}
                              onChange={setSelectedModel}
                              style={{ width: '100%', marginTop: 8 }}
                          >
                      <Option value="gpt-4">GPT-4 (Độ chính xác cao)</Option>
                      <Option value="gpt-3.5-turbo">GPT-3.5 Turbo (Cân bằng)</Option>
                      <Option value="claude-3">Claude 3 (Phân tích sâu)</Option>
                      <Option value="gemini-pro">Gemini Pro (Tốc độ nhanh)</Option>
                          </Select>
                      </div>
                  
                  <div>
                    <Flex justify="space-between" align="center">
                      <div>
                        <Text strong>Tự Động Chạy Hàng Ngày</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Tự động cập nhật dự báo mỗi ngày
                        </Text>
                      </div>
                              <Switch checked={autoRun} onChange={setAutoRun} />
                          </Flex>
                    
                           {autoRun && (
                      <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#f6f8fa', borderRadius: '6px' }}>
                        <Text strong>Thời Gian Chạy Tự Động</Text>
                                  <TimePicker 
                                      value={dayjs(runTime, 'HH:mm')} 
                                      onChange={(time, timeString) => setRunTime(timeString)}
                                      format="HH:mm" 
                          style={{ width: '100%', marginTop: 8 }}
                          placeholder="Chọn thời gian"
                                  />
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                          Hệ thống sẽ tự động chạy dự báo vào thời gian này mỗi ngày
                        </Text>
                              </div>
                          )}
                      </div>
                  </Space>
              </Card>
  
              {/* Quick Actions */}
              <Card title={<Title level={5}>⚡ Thao Tác Nhanh</Title>}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Button 
                    type="primary" 
                    size="large"
                    style={{ width: '100%', height: '48px' }}
                    icon={<Settings size={16} />}
                  >
                    Chạy Dự Báo Ngay
                  </Button>
                  
                  <Button 
                    size="large"
                    style={{ width: '100%', height: '48px' }}
                    icon={<Monitor size={16} />}
                  >
                    Xem Lịch Sử Dự Báo
                  </Button>
                  
                  <Button 
                    size="large"
                    style={{ width: '100%', height: '48px' }}
                    icon={<AlertTriangle size={16} />}
                  >
                    Kiểm Tra Lỗi Hệ Thống
                  </Button>
                </Space>
              </Card>
            </Space>
          </Col>

          {/* Right Column - Information */}
          <Col xs={24} lg={12}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              
              {/* Forecast Parameters */}
              <Card title={<Title level={5}>📊 Tham Số Dự Báo</Title>}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Card 
                    type="inner" 
                    title={
                      <Flex gap={8} align="center">
                        <Sun size={16} />
                        <Text strong>Yếu Tố Thời Tiết</Text>
                      </Flex>
                    }
                    size="small"
                  >
                    <Text type="secondary">
                          Điều kiện thời tiết, nhiệt độ, lượng mưa ảnh hưởng đến lưu lượng khách và sở thích ăn uống
                    </Text>
                      </Card>
                  
                  <Card 
                    type="inner" 
                    title={
                      <Flex gap={8} align="center">
                        <Calendar size={16} />
                        <Text strong>Yếu Tố Sự Kiện</Text>
                      </Flex>
                    }
                    size="small"
                  >
                    <Text type="secondary">
                          Sự kiện công cộng, lễ hội, tình trạng giao thông, hoạt động địa phương ảnh hưởng đến dòng khách
                    </Text>
                      </Card>
                  
                  <Card 
                    type="inner" 
                    title={
                      <Flex gap={8} align="center">
                        <Users size={16} />
                        <Text strong>Phân Tích Tác Động Kinh Doanh</Text>
                      </Flex>
                    }
                    size="small"
                  >
                    <Text type="secondary">
                          Dự đoán định lượng về thay đổi doanh số, điều chỉnh hoạt động và nhu cầu nhân sự
                    </Text>
                      </Card>
                  </Space>
              </Card>
              
              {/* System Status */}
              <Card title={<Title level={5}>🔧 Trạng Thái Hệ Thống</Title>}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Flex justify="space-between" align="center">
                    <Text>Kết nối API</Text>
                    <Tag color="green">Hoạt động</Tag>
                  </Flex>
                  
                  <Flex justify="space-between" align="center">
                    <Text>Database</Text>
                    <Tag color="green">Kết nối</Tag>
                  </Flex>
                  
                  <Flex justify="space-between" align="center">
                    <Text>AI Model</Text>
                    <Tag color="blue">{selectedModel}</Tag>
                  </Flex>
                  
                  <Flex justify="space-between" align="center">
                    <Text>Tự động chạy</Text>
                    <Tag color={autoRun ? "green" : "orange"}>
                      {autoRun ? "Bật" : "Tắt"}
                    </Tag>
                  </Flex>
                  
                  {autoRun && (
                    <Flex justify="space-between" align="center">
                      <Text>Thời gian chạy</Text>
                      <Tag color="blue">{runTime}</Tag>
                    </Flex>
                  )}
                </Space>
              </Card>
          </Space>
          </Col>
        </Row>
      </div>
    );

    return <div className={css.container}>
        <div className={css.header}>
            <Header />
        </div>
        <div className={css.content}>
        <HomeTab />
        {/* <Tabs defaultActiveKey="home" className={css.tabs}>
      
            <TabPane tab="Home" key="home">
          
            </TabPane>
            {forceDesktop && (
                <TabPane 
                    tab={<Space><Settings size={14} /> Config</Space>} 
                    key="config"
                >
                    <ConfigTab />
                </TabPane>
            )}
        </Tabs> */}
        </div>

        {/* Tag Configuration Modal */}
        <Modal
          title={
            <Flex gap={8} align="center">
              <Settings size={16} />
              <Text strong>Cấu Hình Tag</Text>
            </Flex>
          }
          open={showTagModal}
          onCancel={() => setShowTagModal(false)}
          footer={null}
          width={600}
          centered
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            
            {/* Add New Tag Section */}
            <Card title="Thêm Tag Mới" size="small">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong>Tên Tag</Text>
                  <Input
                    placeholder="Ví dụ: Cửa hàng 87 Thái Hà"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                </div>
                
                <div>
                  <Text strong>Tỉnh/Thành</Text>
                  <Select
                    placeholder="Chọn tỉnh/thành"
                    value={newTagProvince}
                    onChange={setNewTagProvince}
                    style={{ width: '100%', marginTop: 8 }}
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {provinces.map(province => (
                      <Option key={province} value={province}>
                        {province}
                      </Option>
                    ))}
                  </Select>
                </div>
                
                <Button 
                  type="primary" 
                  onClick={handleAddTag}
                  style={{ width: '100%' }}
                >
                  Thêm Tag
                </Button>
              </Space>
            </Card>

            {/* Existing Tags Section */}
            <Card title="Danh Sách Tag" size="small" >
              {loadingTags ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text>Đang tải...</Text>
                </div>
              ) : customTags.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">Chưa có tag nào</Text>
                </div>
              ) : (
                <List
                  dataSource={customTags}
                  style={{ height: '300px', overflow: 'auto' }}
                  renderItem={(tag) => (
                    <List.Item
                      actions={[
                        <Button 
                          type="text" 
                          size="small"
                          icon={<Settings size={14} />}
                          onClick={() => handleOpenSystemMessageModal(tag)}
                          title="Cài đặt system message"
                        >
                          Cài đặt
                        </Button>,
                        <Button 
                          type="text" 
                          danger 
                          size="small"
                          icon={<AlertTriangle size={14} />}
                          onClick={() => handleDeleteTag(tag.id)}
                        >
                          Xóa
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={tag.name}
                        description={
                          <div>
                            <Tag color="blue" style={{ marginBottom: 4 }}>{tag.province}</Tag>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Space>
        </Modal>

        {/* Detail Modal */}
        <Modal
          title={
            <Flex gap={8} align="center">
              <Calendar size={16} />
              <Text strong>Chi Tiết Dự Báo - {selectedDetailData?.date}</Text>

            </Flex>
          }
          open={showDetailModal}
          onCancel={() => setShowDetailModal(false)}
          footer={null}
          width={600}
          centered
        >
          {selectedDetailData && (
            <Card style={{height: '80vh', overflow: 'auto'}}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* Date and Day */}
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: selectedDetailData.isWeekend ? '#fff2f0' : '#f6f8fa', 
                  borderRadius: '6px',
                  border: selectedDetailData.isWeekend ? '1px solid #ffccc7' : '1px solid #e8e8e8'
                }}>
                  <Text strong style={{ color: selectedDetailData.isWeekend ? 'red' : 'inherit' }}>
                    {selectedDetailData.dayOfWeek} - {selectedDetailData.date}
                  </Text>
                  {selectedDetailData.isWeekend && (
                    <Tag color="red" style={{ marginLeft: 8 }}>Cuối tuần</Tag>
                  )}
                </div>

                {/* Overall Score */}
                <div style={{ padding: '12px', backgroundColor: '#f6f8fa', borderRadius: '6px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>Điểm Tổng Quan</Text>
                  <ScoreMeter score={selectedDetailData.overallScore} />
                </div>

                {/* Weather Evaluations */}
                <div style={{ padding: '12px', backgroundColor: '#f6f8fa', borderRadius: '6px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>Đánh Giá Thời Tiết</Text>
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: '4px' }}>
                        <Text strong style={{ color: '#FF6B35', fontSize: '12px' }}>Trưa</Text>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          {selectedDetailData.lunchClimate.meaning || "Chưa đánh giá"}
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: '4px' }}>
                        <Text strong style={{ color: '#4A90E2', fontSize: '12px' }}>Tối</Text>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          {selectedDetailData.dinnerClimate.meaning || "Chưa đánh giá"}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Events */}
                <div style={{ padding: '12px', backgroundColor: '#f6f8fa', borderRadius: '6px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>Sự Kiện</Text>
                  <div style={{ 
                    fontSize: '12px', 
                    color: (selectedDetailData.event.event || "Không có sự kiện đặc biệt") === "Không có sự kiện đặc biệt" ? '#666' : '#1890ff',
                    fontWeight: (selectedDetailData.event.event || "Không có sự kiện đặc biệt") === "Không có sự kiện đặc biệt" ? 'normal' : '500'
                  }}>
                    {selectedDetailData.event.event || "Không có sự kiện đặc biệt"}
                  </div>
                </div>

                {/* Business Impact or Detail Content */}
                {selectedDetailData.detailContent ? (
                  <div style={{ padding: '12px', backgroundColor: '#f6f8fa', borderRadius: '6px' }}>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                      {selectedDetailData.detailTitle || 'Chi Tiết'}
                    </Text>
                    <div 
                      style={{ 
                        fontSize: '13px', 
                        lineHeight: '1.4', 
                        color: '#333',
                        maxWidth: '100%'
                      }}
                    >
                      {selectedDetailData.detailContent}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '12px', backgroundColor: '#f6f8fa', borderRadius: '6px' }}>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                      {businessImpactMode === 'noi-bo' ? 'Ghi Chú Nội Bộ' : 'Tác Động Kinh Doanh'}
                    </Text>
                    {businessImpactMode === 'noi-bo' && selectedDetailData.noiBoContent ? (
                      <div 
                        style={{ 
                          fontSize: '13px', 
                          lineHeight: '1.4', 
                          color: '#333',
                          maxWidth: '100%'
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: `
                            <style>
                              .modal-noi-bo-markdown {
                                font-size: 13px;
                                line-height: 1.4;
                                color: #333;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                              }
                              .modal-noi-bo-markdown strong {
                                color: #262626;
                                font-weight: 600;
                              }
                              .modal-noi-bo-markdown ul {
                                margin: 6px 0;
                                padding-left: 18px;
                                list-style-type: disc;
                              }
                              .modal-noi-bo-markdown li {
                                margin-bottom: 6px;
                                line-height: 1.4;
                              }
                              .modal-noi-bo-markdown p {
                                margin: 3px 0;
                                line-height: 1.4;
                              }
                              .modal-noi-bo-markdown br {
                                margin-bottom: 3px;
                              }
                              .modal-noi-bo-markdown * {
                                font-size: inherit;
                              }
                            </style>
                            <div class="modal-noi-bo-markdown">${marked(selectedDetailData.noiBoContent)}</div>
                          `
                        }}
                      />
                    ) : (
                      <BusinessImpactDisplay businessImpact={selectedDetailData.businessImpact} />
                    )}
                  </div>
                )}

                {/* Overall Impact */}
                <div style={{ padding: '12px', backgroundColor: '#f6f8fa', borderRadius: '6px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>Tổng Quan</Text>
                  {(() => {
                    const status = getOverallStatus(selectedDetailData.overallImpact);
                    return <Tag color={status.color}>{status.label}</Tag>;
                  })()}
                </div>
              </Space>
            </Card>
          )}
        </Modal>

        {/* System Message Modal */}
        <Modal
        centered
          title={
            <Flex gap={8} align="center">
              <Settings size={16} />
              <Text strong>Cài Đặt System Message - {selectedTagForSystemMessage?.name}</Text>
            </Flex>
          }
          open={showSystemMessageModal}
          onCancel={() => setShowSystemMessageModal(false)}
          footer={[
            <Button key="cancel" onClick={() => setShowSystemMessageModal(false)}>
              Hủy
            </Button>,
            <Button key="save" type="primary" onClick={handleSaveSystemMessage}>
              Lưu
            </Button>
          ]}
          width={800}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong>System Message cho AI</Text>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                Cấu hình system message riêng cho tag này. Để trống để sử dụng system message mặc định.
              </Text>
            </div>
            
            <div>
              <Input.TextArea
                value={tagSystemMessage}
                onChange={(e) => setTagSystemMessage(e.target.value)}
                placeholder="Nhập system message cho AI..."
                rows={15}
                style={{ 
                  fontFamily: 'monospace',
                  fontSize: '13px'
                }}
              />
            </div>
            
            <div style={{ padding: '12px', backgroundColor: '#f6f8fa', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <Text strong>System Message Mặc Định</Text>
                {currentUser?.isAdmin && (
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={saveDefaultSystemMessage}
                    style={{ fontSize: '12px' }}
                  >
                    Lưu
                  </Button>
                )}
              </div>
              {currentUser?.isAdmin ? (
                <Input.TextArea
                  value={defaultSystemMessage}
                  onChange={(e) => setDefaultSystemMessage(e.target.value)}
                  placeholder="Nhập system message mặc định..."
                  rows={8}
                  style={{ 
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    backgroundColor: 'white'
                  }}
                />
              ) : (
                <Text type="secondary" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  {defaultSystemMessage || `Dựa vào data sau, đưa ra 2 phần đánh giá riêng biệt cho một cửa hàng quán ăn:

Đánh giá mức độ tổng quan kinh doanh: Cung cấp một điểm số trên thang 5 (với 3 là trung bình) và lý do chi tiết cho điểm số đó.

Đánh giá tác động kinh doanh: Phân tích tác động kinh doanh bằng cách nêu rõ các yếu tố tiêu cực (Yếu tố tiêu cực:) trong 20 từ, tích cực (Yếu tố tích cực:) trong 20 từ, đưa ra lời khuyên (Lời khuyên:) cụ thể cho cửa hàng trong 20 từ.

Chỉ đưa ra data cần thiết, dưới dạng text, đánh giá bố cục rõ ràng để tôi có thể dùng code phân tách ra cho từng phần và mục, không thêm bất cứ gì`}
                </Text>
              )}
            </div>
          </Space>
        </Modal>
    </div>;
}