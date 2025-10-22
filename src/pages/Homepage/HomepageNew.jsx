import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import styles from './HomepageNew.module.css';

const HomepageNew = () => {
  const navigate = useNavigate();
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setHeaderScrolled(true);
      } else {
        setHeaderScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // FAQ toggle functionality
  const handleFaqToggle = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Handle login
  const handleLogin = () => {
    window.open(`${import.meta.env.VITE_API_URL}/login`, "_self");
  };

  const faqData = [
    {
      question: "B-Canvas phù hợp với doanh nghiệp nào?",
      answer: "B-Canvas là lựa chọn lý tưởng cho các doanh nghiệp SME có quy mô doanh thu từ 15-300 tỷ VNĐ/năm, có nhu cầu xây dựng hoặc phát triển một hệ thống báo cáo, phân tích và Dashboard BI tập trung."
    },
    {
      question: "Thời gian triển khai B-Canvas là bao lâu?",
      answer: "Thời gian triển khai từ 2-4 tuần tùy thuộc vào độ phức tạp của hệ thống dữ liệu hiện tại. Chúng tôi có đội ngũ chuyên gia hỗ trợ triển khai và đào tạo người dùng."
    },
    {
      question: "B-Canvas có khó sử dụng không?",
      answer: "Không, B-Canvas được thiết kế với giao diện tinh gọn, trực quan và dễ sử dụng ngay cả với người dùng không chuyên về kỹ thuật. Hệ thống tích hợp AI để hỗ trợ người dùng."
    },
    {
      question: "Chi phí sử dụng B-Canvas như thế nào?",
      answer: "B-Canvas cung cấp những tính năng mạnh mẽ với mức chi phí hợp lý nhất cho SME, thấp hơn đáng kể so với các giải pháp quốc tế. Chúng tôi có các gói dịch vụ linh hoạt phù hợp với từng quy mô."
    },
    {
      question: "B-Canvas có tích hợp được với hệ thống hiện tại không?",
      answer: "Có, B-Canvas có khả năng tích hợp cao với các hệ thống hiện tại thông qua API, kết nối trực tiếp với Google Sheets, các Database phổ biến và hỗ trợ upload file Excel."
    },
    {
      question: "B-Canvas có hỗ trợ đào tạo và bảo trì không?",
      answer: "Có, chúng tôi cung cấp chương trình đào tạo toàn diện cho người dùng. Đội ngũ hỗ trợ kỹ thuật 24/7 sẵn sàng giải quyết mọi vấn đề và dịch vụ bảo trì định kỳ."
    }
  ];

  const features = [
    {
      icon: "/feature (1).svg",
      title: "AI chuyên sâu",
      description: "Công nghệ AI tùy chỉnh, đơn giản hóa cho SME Việt Nam"
    },
    {
      icon: "/feature (2).svg", 
      title: "Real-time",
      description: "Phân tích dữ liệu thời gian thực"
    },
    {
      icon: "/feature.svg",
      title: "Chi phí tối ưu",
      description: "Giá cả hợp lý cho doanh nghiệp SME"
    }
  ];

  const painPoints = [
    {
      icon: "/painPoints (4).svg",
      title: "Dữ liệu phân mảnh",
      description: "Dữ liệu nhiều nhưng phân mảnh ở các nguồn khác nhau, không kết nối. Thiếu hệ thống tập trung để quản lý đồng bộ."
    },
    {
      icon: "/painPoints (6).svg",
      title: "Báo cáo chậm trễ",
      description: "Dữ liệu báo cáo chậm, thiếu hoặc không đủ, ảnh hưởng nghiêm trọng đến việc ra quyết định kịp thời."
    },
    {
      icon: "/painPoints (1).svg",
      title: "Hạn chế ngân sách",
      description: "Không có nguồn lực lớn để đầu tư cho các hệ thống cồng kềnh, phức tạp với chi phí cao."
    },
    {
      icon: "/painPoints (3).svg",
      title: "Thiếu chuyên gia",
      description: "Không có đội ngũ IT chuyên sâu để vận hành và bảo trì các hệ thống phức tạp."
    },
    {
      icon: "/painPoints (5).svg",
      title: "Khó đo lường hiệu quả",
      description: "Thiếu các chỉ số đo lường chuẩn hóa và hệ thống theo dõi hiệu quả kinh doanh."
    },
    {
      icon: "/painPoints (2).svg",
      title: "Thiếu insight hành động",
      description: "Dữ liệu có nhưng không biết cách phân tích để tạo ra insight có thể hành động được."
    }
  ];

  const advantages = [
    {
      icon: "⚡",
      title: "Nhanh",
      description: "Hiệu quả nhanh chóng, dễ triển khai, dễ làm quen"
    },
    {
      icon: "🧠",
      title: "Thông minh", 
      description: "Ứng dụng AI và tự động hóa sâu rộng, chuyên biệt"
    },
    {
      icon: "🛡️",
      title: "Phù hợp & Làm chủ",
      description: "Dữ liệu luôn tin cậy cao và do khách hàng làm chủ"
    }
  ];

  const tools = [
    {
      title: "Data Rubik",
      description: "Tích hợp & làm sạch dữ liệu từ nhiều nguồn khác nhau một cách tự động và thông minh",
      features: [
        "Kết nối real-time với Google Sheets, Database qua API",
        "Làm sạch dữ liệu trùng lặp, thiếu sót tự động",
        "Logic bằng AI ngôn ngữ tự nhiên"
      ]
    },
    {
      title: "PTTK - Phân tích & Thống kê",
      description: "Công cụ phân tích kinh doanh thông minh với AI để tạo ra các báo cáo chuyên sâu",
      features: [
        "Tạo Metric & Indicator kinh doanh tự động",
        "Báo cáo thông minh với AI phân tích",
        "Dashboard tương tác real-time"
      ]
    },
    {
      title: "KTQT - Phân tích xây dựng báo cáo quản trị tài chính đa chiều",
      description: "Công cụ chuyên sâu cho phân tích tài chính nâng cao với Activity-Based Costing",
      features: [
        "Activity-Based Costing tự động",
        "Phân bổ chi phí linh hoạt theo nhiều chiều",
        "Trợ lý AI phân bổ chi phí thông minh"
      ]
    },
    {
      title: "KPI Map - Hệ thống chỉ số",
      description: "Trực quan hóa hệ thống chỉ số kinh doanh thiết yếu, liên kết với năng lực cạnh tranh",
      features: [
        "Listing chỉ số theo model ngành hàng cụ thể",
        "Định nghĩa các đo lường cần thiết",
        "Mapping mối quan hệ giữa KPI và dữ liệu nguồn"
      ]
    },
    {
      title: "Mini App & Automation Builder",
      description: "Xây dựng các ứng dụng mini và tự động hóa quy trình kinh doanh",
      features: [
        "Tạo mini app không cần code",
        "Automation workflow thông minh",
        "Tích hợp với các hệ thống hiện có"
      ]
    }
  ];

  const showcaseItems = [
    { icon: "📊", title: "Dashboard Analytics" },
    { icon: "🎯", title: "KPI Dashboard" },
    { icon: "📈", title: "Financial Analysis" },
    { icon: "🗄️", title: "Data Integration" },
    { icon: "⚙️", title: "Automation Builder" }
  ];

  const trustPills = [
    "Triển khai nhanh", "Bảo mật & Tin cậy", "Tích hợp đa nền tảng",
    "AI Insights", "Hỗ trợ 24/7", "Tiết kiệm chi phí",
    "Tùy biến linh hoạt", "Quy trình chuẩn", "Khách hàng hài lòng", "Mở rộng dễ dàng"
  ];

  return (
    <div className={styles.homepage}>
      {/* Header */}
      <header className={`${styles.header} ${headerScrolled ? styles.scrolled : ''}`} id="header">
        <div className={styles.navContainer}>
          <div className={styles.logo}>
            <img src={'/logo_bcanvas_05_10.png'} alt="logo" width={20} height={20} />
            B-Canvas
          </div>
          <div className={styles.navButtons}>
            <Button 
              type="default" 
              className={styles.btnOutline}
              onClick={() => navigate('/login')}
            >
              Đăng ký
            </Button>
            <Button 
              type="primary" 
              className={styles.btnPrimary}
              onClick={handleLogin}
            >
              Đăng nhập
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1>Chuyển đổi số với AI & Phân tích Dữ liệu thông minh</h1>
            <p className={styles.heroSubtitle}>
              Giải pháp nhanh-mạnh-gọn tích hợp AI tiên phong và Automation để cách mạng hóa việc quản trị dữ liệu và phân tích kinh doanh, giúp doanh nghiệp SME Việt Nam ra quyết định nhanh và chính xác.
            </p>
            <div className={styles.heroCta}>
              <Button 
                type="primary" 
                className={styles.btnHero}
                onClick={() => navigate('/dashboard')}
              >
                Khám phá ngay
              </Button>
              <Button 
                type="default" 
                className={styles.btnHero}
                onClick={() => navigate('/dashboard')}
              >
                Xem demo
              </Button>
            </div>
          </div>
          
          <div className={styles.featuresPreview}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <img src={feature.icon} alt={feature.title} />
                </div>
                <div className={styles.featureContent}>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className={`${styles.section} ${styles.showcase}`}>
        <div className={styles.container}>
          <div className={styles.showcaseMarquee}>
            <div className={styles.marqueeTrack}>
              {[...showcaseItems, ...showcaseItems].map((item, index) => (
                <div key={index} className={styles.showcaseItem}>
                  <div className={styles.showcaseImage}>
                    <div className={styles.imagePlaceholder}>
                      <span className={styles.placeholderIcon}>{item.icon}</span>
                      <span>{item.title}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className={`${styles.section} ${styles.painPoints}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Thách thức của doanh nghiệp SME trong quản trị dữ liệu</h2>
          <p className={styles.sectionSubtitle}>
            Các doanh nghiệp vừa và nhỏ thường gặp phải những khó khăn nghiêm trọng trong việc khai thác và phân tích dữ liệu hiệu quả
          </p>
          <div className={styles.painGrid}>
            {painPoints.map((point, index) => (
              <div key={index} className={styles.painCard}>
                <div className={styles.painIcon}>
                  <img src={point.icon} alt={point.title} />
                </div>
                <h3>{point.title}</h3>
                <p>{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className={`${styles.section} ${styles.solutions}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Giải pháp đột phá từ B-Canvas</h2>
          <p className={styles.sectionSubtitle}>
            Bộ công cụ mạnh mẽ được thiết kế đặc biệt cho doanh nghiệp SME Việt Nam với 5 Module/ App cốt lõi
          </p>
          
          {/* Core Advantages */}
          <div className={styles.advantages}>
            <h3 className={styles.advantagesTitle}>3 Lợi thế cốt lõi</h3>
            <div className={styles.advantagesTimeline}>
              {advantages.map((advantage, index) => (
                <div key={index} className={styles.advantageItem}>
                  <div className={styles.advantageDot}></div>
                  <div className={styles.advantageContent}>
                    <h4>
                      <span className={styles.advantageIcon}>{advantage.icon}</span>
                      {advantage.title}
                    </h4>
                    <p>{advantage.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B-Canvas Tools */}
          <div className={styles.toolsSection}>
            <h3 className={styles.toolsTitle}>BCanvas Tool Studio</h3>
            <div className={styles.toolsGrid}>
              {tools.map((tool, index) => (
                <div key={index} className={styles.toolCard}>
                  <h4>{tool.title}</h4>
                  <p>{tool.description}</p>
                  <ul className={styles.toolFeatures}>
                    {tool.features.map((feature, featureIndex) => (
                      <li key={featureIndex}>{feature}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className={`${styles.section} ${styles.trust}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Được tin tưởng bởi</h2>
          <p className={styles.sectionSubtitle}>
            Những con số ấn tượng chứng minh hiệu quả của B-Canvas
          </p>
          
          <div className={styles.trustStats}>
            <div className={styles.trustItem}>
              <div className={styles.trustNumber}>98%</div>
              <p className={styles.trustText}>Mức độ hài lòng khách hàng</p>
            </div>
            <div className={styles.trustItem}>
              <div className={styles.trustNumber}>90%</div>
              <p className={styles.trustText}>Tiết kiệm thời gian xử lý - ra quyết định</p>
            </div>
            <div className={styles.trustItem}>
              <div className={styles.trustNumber}>24/7</div>
              <p className={styles.trustText}>Hỗ trợ chuyên nghiệp</p>
            </div>
          </div>
          
          <div className={styles.trustMarquee}>
            <div className={styles.trustTrack}>
              {[...trustPills, ...trustPills].map((pill, index) => (
                <span key={index} className={styles.trustPill}>{pill}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={`${styles.section} ${styles.faq}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Câu hỏi thường gặp</h2>
          <p className={styles.sectionSubtitle}>
            Những thắc mắc phổ biến về B-Canvas và giải đáp chi tiết
          </p>
          
          <div className={styles.faqContainer}>
            {faqData.map((faq, index) => (
              <div key={index} className={`${styles.faqItem} ${activeFaq === index ? styles.active : ''}`}>
                <button 
                  className={styles.faqQuestion}
                  onClick={() => handleFaqToggle(index)}
                >
                  {faq.question}
                  <span className={styles.faqIcon}>▼</span>
                </button>
                <div className={styles.faqAnswer}>
                  {faq.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className={styles.footerCta}>
        <div className={styles.container}>
          <h2>Sẵn sàng chuyển đổi số với B-Canvas?</h2>
          <p>
            Bắt đầu hành trình chuyển đổi số thông minh cho doanh nghiệp của bạn ngay hôm nay
          </p>
          <div className={styles.ctaButtons}>
            <Button 
              type="primary" 
              className={styles.btnCta}
              onClick={handleLogin}
            >
              Đăng ký dùng thử miễn phí
            </Button>
            <Button 
              type="default" 
              className={styles.btnCta}
              onClick={handleLogin}
            >
              Liên hệ tư vấn
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomepageNew;
