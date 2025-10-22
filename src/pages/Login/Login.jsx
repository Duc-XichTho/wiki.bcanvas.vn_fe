import React, { useState, useEffect } from "react";
import styles from "./Login.module.css";
import { getSchemaBackground } from "../../apis/settingService.jsx";

export default function Login() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [backgroundImageUrl, setBackgroundImageUrl] = useState('/simple_background2.png');

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Load background settings on component mount
    useEffect(() => {
        const loadBackgroundSettings = async () => {
            try {
                const existing = await getSchemaBackground('master');

                if (existing && existing.setting && typeof existing.setting === 'string') {
                    setBackgroundImageUrl(existing.setting);
                } else {
                    setBackgroundImageUrl('/simple_background2.png');
                }
            } catch (error) {
                setBackgroundImageUrl('/simple_background2.png');
            }
        };

        loadBackgroundSettings();
    }, []);


    const formatTime = (date) => {
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const formatDate = (date) => {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `Ngày ${day} tháng ${month} năm ${year}`;
    };

    const handleLogin = () => {
        const currentPath = '/login-success';
        window.open(`${import.meta.env.VITE_API_URL}/login?redirect=${encodeURIComponent(currentPath)}`, '_self');
    };

    const homepageContent = {
        hero: {
            brandLine: "AI-Centric Data & Analytics Platform",
            brandSubtitle: "",
            tagline: formatTime(currentTime) + " | " + formatDate(currentTime),
            description: "",
            ctaText: "Login Dashboard"
        }
    };

    return (
        <div 
            className={styles.loginPage}
            style={{
                backgroundImage: `url(${backgroundImageUrl})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            <section className={styles.hero}>
                {/* <div className={styles.heroBlocks}>
                    <div className={`${styles.colorBlock} ${styles.block1}`}></div>
                    <div className={`${styles.colorBlock} ${styles.block2}`}></div>
                    <div className={`${styles.colorBlock} ${styles.block3}`}></div>
                    <div className={`${styles.colorBlock} ${styles.block4}`}></div>
                </div> */}
                
                <div className={styles.container}>
                    {/* White Background Container */}
                    <div className={styles.whiteContainer}>
                        {/* Hero Logo on Top */}
                        <div className={styles.heroLogo}>
                            <div className={styles.logo}>
                                <img src="/logo_bcanvas_05_10.png" alt="B-Canvas Logo" width={30} height={30} />
                                B-Canvas
                            </div>
                        </div>

                        {/* Hero Icon */}
                        {/* <div className={styles.heroIcon}>
                            <div className={styles.iconContainer}>
                                <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                        </div> */}

                        {homepageContent && homepageContent.hero && (
                            <>
                                <div className={styles.heroBrandLine}>
                                    <span className={styles.brandSubtitle}>{homepageContent.hero.brandSubtitle}</span>
                                    {homepageContent.hero.brandLine}
                                </div>
                                
                                <p className={styles.heroTagline}>
                                    {homepageContent.hero.tagline}
                                </p>
                                
                                {/* <p className={styles.heroDescription}>
                                    {homepageContent.hero.description}
                                </p>
                                */}
                                <div className={styles.heroCta}>
                                    <button onClick={handleLogin} className={`${styles.btn} ${styles.btnHero} ${styles.pulse}`}>
                                        {homepageContent.hero.ctaText}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    {/* Bottom Rectangle Shadow */}
                    {/* <div className={styles.bottomRectangle}></div> */}
                </div>
            </section>
        </div>
    );
}
