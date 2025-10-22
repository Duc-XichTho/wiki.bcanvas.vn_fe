import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import styles from './Homepage.module.css';

const Homepage = () => {
  const navigate = useNavigate();
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
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

  // Smooth scrolling for anchor links
  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
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

  const solutions = [
    {
      icon: "📊",
      title: "Data Rubik",
      image: "/Bcanvas (4).png",
      description: "Tích hợp & làm sạch dữ liệu từ nhiều nguồn khác nhau một cách tự động và thông minh",
      features: [
        "Kết nối real-time với Google Sheets, Database qua API",
        "Làm sạch dữ liệu trùng lặp, thiếu sót tự động",
        "Logic bằng AI ngôn ngữ tự nhiên",
        "Biến đổi và mapping dữ liệu thông minh"
      ]
    },
    {
      icon: "📈",
      title: "PTTK - Phân tích & Thống kê",
      image: "/Bcanvas (7).png",
      description: "Công cụ phân tích kinh doanh thông minh với AI để tạo ra các báo cáo chuyên sâu",
      features: [
        "Tạo Metric & Indicator kinh doanh tự động",
        "Báo cáo thông minh với AI phân tích",
        "Dashboard tương tác real-time",
        "Phân tích nhanh với khuyến nghị hành động"
      ]
    },
    {
      icon: "💰",
      title: "FDR - Phân tích lãi lỗ đa chiều",
      image: "/Bcanvas (3).png",
      description: "Công cụ chuyên sâu cho phân tích tài chính nâng cao với Activity-Based Costing",
      features: [
        "Activity-Based Costing tự động",
        "Phân bổ chi phí linh hoạt theo nhiều chiều",
        "Trợ lý AI phân bổ chi phí thông minh",
        "Tiết kiệm 90% thời gian thao tác"
      ]
    },
    {
      icon: "🎯",
      title: "KPI Map - Hệ thống chỉ số",
      image: "/Bcanvas (2).png",
      description: "Trực quan hóa hệ thống chỉ số kinh doanh thiết yếu, liên kết với năng lực cạnh tranh",
      features: [
        "Listing chỉ số theo model ngành hàng cụ thể",
        "Định nghĩa các đo lường cần thiết",
        "Mapping mối quan hệ giữa KPI và dữ liệu nguồn",
        "Template KPI chuẩn cho các ngành phổ biến"
      ]
    },
    {
      icon: "🤖",
      title: "AI Agent & Tự động hóa",
      image: "/Bcanvas (1).png",
      description: "Ứng dụng AI thế hệ mới và các cổng kết nối đa dạng, tạo ra hệ thống AI Agent thông minh",
      features: [
        "Xử lý công việc hiệu quả và tự động",
        "Giải phóng năng suất cho doanh nghiệp",
        "Dẫn dắt cuộc chơi chuyển đổi 4.0",
        "Tối ưu hóa quy trình làm việc SME"
      ]
    },
    {
      icon: "🔧",
      title: "A-Z Solution",
      image: "/Bcanvas (6).png",
      description: "Giải pháp trọn gói từ thiết kế định hình, tinh chỉnh, vận hành thử, custom cho khách hàng",
      features: [
        "Chi phí thấp, độ linh hoạt cao",
        "Kiến trúc mở linh động",
        "Tùy chỉnh theo nhu cầu riêng",
        "Hỗ trợ toàn diện từ A đến Z"
      ]
    }
  ];

  const teamMembers = [
    {
      name: "Chuyên gia AI & Machine Learning",
      role: "Trưởng phòng AI & Automation",
      description: "Hơn 10 năm kinh nghiệm phát triển giải pháp AI cho doanh nghiệp. Chuyên sâu về NLP, Machine Learning và Automation."
    },
    {
      name: "Chuyên gia Data Analytics",
      role: "Giám đốc phân tích dữ liệu",
      description: "Hơn 15 năm kinh nghiệm trong lĩnh vực phân tích dữ liệu và BI. Hiểu sâu về nhu cầu của doanh nghiệp SME Việt Nam."
    },
    {
      name: "Chuyên gia trải nghiệm người dùng",
      role: "Trưởng phòng Product Design",
      description: "Chuyên gia thiết kế UX với hơn 8 năm kinh nghiệm. Đảm bảo sản phẩm dễ sử dụng và thân thiện với người dùng SME."
    },
    {
      name: "Đội ngũ hỗ trợ khách hàng",
      role: "Customer Success & Support",
      description: "Đội ngũ hỗ trợ chuyên nghiệp 24/7 với kinh nghiệm sâu về sản phẩm. Đảm bảo khách hàng đạt được mục tiêu kinh doanh."
    }
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
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <h1>Chuyển đổi số ứng dụng AI trong Quản trị thông minh</h1>
            <p className={styles.heroSubtitle}>
              Giải pháp toàn diện tích hợp AI & Automation để cách mạng hóa việc quản trị dữ liệu và phân tích kinh doanh cho doanh nghiệp SME Việt Nam
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
          <div className={styles.heroImage}>
            <img src={'/Bcanvas (8).png'} alt="hero" />
          </div>
        </div>
        
        <div className={styles.featuresPreview}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <img src="/feature (1).svg" alt="AI chuyên sâu" />
            </div>
            <h3>AI chuyên sâu</h3>
            <p>Công nghệ AI tùy chỉnh cho SME Việt Nam</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <img src="/feature (2).svg" alt="Real-time" />
            </div>
            <h3>Real-time</h3>
            <p>Phân tích dữ liệu thời gian thực</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <img src="/feature.svg" alt="Chi phí tối ưu" />
            </div>
            <h3>Chi phí tối ưu</h3>
            <p>Giá cả hợp lý cho doanh nghiệp SME</p>
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
                <h3>
                  <img src={point.icon} alt={point.title} className={styles.painIcon} />
                  {point.title}
                </h3>
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
            Bộ công cụ mạnh mẽ được thiết kế đặc biệt cho doanh nghiệp SME Việt Nam với module cốt lõi
          </p>
          <div className={styles.solutionsGrid}>
            {solutions.map((solution, index) => (
              <div key={index} className={styles.solutionCard}>
                <div className={styles.solutionImage}>
                  <img 
                    src={solution.image} 
                    alt={`${solution.title} illustration`}
                    onError={(e) => {
                      e.target.src = '/dashboard.png'; // fallback image
                    }}
                  />
                </div>
                <div className={styles.solutionHeader}>
                  {/*<div className={styles.solutionIcon}>{solution.icon}</div>*/}
                  <h3 className={styles.solutionTitle}>{solution.title}</h3>
                </div>
                <p className={styles.solutionDescription}>{solution.description}</p>
                <ul className={styles.solutionFeatures}>
                  {solution.features.map((feature, featureIndex) => (
                    <li key={featureIndex}>{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
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
          <div className={styles.trustContent}>
            <div className={styles.trustStats}>
              <div className={styles.trustItem}>
                <span className={styles.trustNumber}>500+</span>
                <p className={styles.trustText}>Doanh nghiệp SME tin tưởng</p>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustNumber}>98%</span>
                <p className={styles.trustText}>Mức độ hài lòng khách hàng</p>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustNumber}>90%</span>
                <p className={styles.trustText}>Tiết kiệm thời gian xử lý</p>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustNumber}>24/7</span>
                <p className={styles.trustText}>Hỗ trợ chuyên nghiệp</p>
              </div>
            </div>
            <div className={styles.trustImage}>
              [Customer Success Image]<br />
              Client testimonials or logos
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

      {/* Team Section */}
      {/*<section className={`${styles.section} ${styles.team}`}>*/}
      {/*  <div className={styles.container}>*/}
      {/*    <h2 className={styles.sectionTitle}>Về đội ngũ sản phẩm</h2>*/}
      {/*    <p className={styles.sectionSubtitle}>*/}
      {/*      Đội ngũ chuyên gia giàu kinh nghiệm trong lĩnh vực AI, Data Analytics và Business Intelligence*/}
      {/*    </p>*/}
      {/*    <div className={styles.teamGrid}>*/}
      {/*      {teamMembers.map((member, index) => (*/}
      {/*        <div key={index} className={styles.teamCard}>*/}
      {/*          <div className={styles.teamImage}>[{member.name} Photo]</div>*/}
      {/*          <h3 className={styles.teamName}>{member.name}</h3>*/}
      {/*          <p className={styles.teamRole}>{member.role}</p>*/}
      {/*          <p className={styles.teamDescription}>{member.description}</p>*/}
      {/*        </div>*/}
      {/*      ))}*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*</section>*/}

      {/* Footer CTA */}
      <section className={styles.footerCta}>
        <div className={styles.container}>
          <h2>Sẵn sàng chuyển đổi số với B-Canvas?</h2>
          <p>
            Bắt đầu hành trình chuyển đổi số thông minh cho doanh nghiệp của bạn ngay hôm nay
          </p>
          <div className={styles.heroCta}>
                         <Button 
               type="primary" 
               className={styles.btn}
               onClick={handleLogin}
             >
               Đăng ký dùng thử miễn phí
             </Button>
                         <Button 
               type="default" 
               className={styles.btnOutline}
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

export default Homepage;
