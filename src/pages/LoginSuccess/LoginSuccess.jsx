import "./LoginSuccess.css";
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { getSchemaBackground } from "../../apis/settingService.jsx";

export default function LoginSuccess() {
  const navigate = useNavigate();
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('/simple_background2.png');

  // Load background settings on component mount
  useEffect(() => {
    const loadBackgroundSettings = async () => {
      try {
        const existing = await getSchemaBackground('amaster');

        if (existing && existing.setting && typeof existing.setting === 'string') {
          setBackgroundImageUrl(existing.setting);
        } else {
          setBackgroundImageUrl('/simple_background2.png');
        }
      } catch (error) {
        setBackgroundImageUrl('/simple_background2.png');
      }
    };
    setBackgroundImageUrl('/simple_background2.png');
    loadBackgroundSettings();
  }, []);

  useEffect(() => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;

    const timer = setTimeout(() => {
      window.close();
      if (isMobile) {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div 
      className="login-success-container"
      style={{
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="success-card">
        <div className="success-content">
          <h1>Đăng nhập thành công!</h1>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        </div>
      </div>
    </div>
  );
}