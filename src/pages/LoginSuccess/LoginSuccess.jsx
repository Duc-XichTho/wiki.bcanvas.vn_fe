import "./LoginSuccess.css";
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { getSchemaBackground } from "../../apis/settingService.jsx";
import { getCurrentUserLogin } from "../../apis/userService.jsx";

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
    // Fetch and log user after login
    const fetchUserAfterLogin = async () => {
      try {
        const userResponse = await getCurrentUserLogin();
        console.log('=== LoginSuccess: User after login ===');
        console.log('Full response:', userResponse);
        console.log('User data:', userResponse?.data);
        console.log('User email:', userResponse?.data?.email);
        console.log('Is Admin:', userResponse?.data?.isAdmin);
        console.log('Is Super Admin:', userResponse?.data?.isSuperAdmin);
        console.log('Is Editor:', userResponse?.data?.isEditor);
        console.log('Schema:', userResponse?.data?.schema);
      } catch (error) {
        console.error('Error fetching user after login:', error);
      }
    };

    fetchUserAfterLogin();

    const isMobile = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;

    const timer = setTimeout(() => {
      window.close();
      if (isMobile) {
        navigate('/');
      } else {
        navigate('/');
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