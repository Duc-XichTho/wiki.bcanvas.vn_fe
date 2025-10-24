import React, { useState, useEffect, useContext } from 'react';
import styles from './AiAcademicAssistant.module.css';
import { BackCanvas } from '../../icon/svg/IconSvg.jsx';
import ProfileSelect from '../Home/SelectComponent/ProfileSelect.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { MyContext } from '../../MyContext.jsx';
import { getSettingByType } from '../../apis/settingService.jsx';
import { getSchemaTools } from '../../apis/settingService.jsx';
import { ICON_CROSSROAD_LIST } from '../../icon/svg/IconSvg.jsx';
import AiChatTab from '../K9/components/AiChatTab.jsx';
const AiAcademicAssistant = () => {

    const navigate = useNavigate();
    const [masterTool, setMasterTool] = useState(null);
    const [nameTable, setNameTable] = useState(null);
    const [tool, setTool] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [tag4Options, setTag4Options] = useState([]);
    const location = useLocation();
    const { currentUser } = useContext(MyContext);

    const getIconSrcById = (tool) => {
        const found = ICON_CROSSROAD_LIST.find(item => item.id == tool.icon);
        return found ? found.icon : undefined;
    };

    const combineWithMasterInfo = async (currentTool) => {
        try {
            const masterResponse = await getSchemaTools('master');
            const masterAppsList = masterResponse?.setting || [];

            if (masterAppsList && masterAppsList.length > 0) {
                const masterApp = masterAppsList.find(masterApp => masterApp.id === currentTool.id);
                if (masterApp) {
                    console.log(`K9Header: Combining tool ${currentTool.id} with master info`);
                    return {
                        ...currentTool,
                        name: masterApp.name,
                        icon: masterApp.icon
                    };
                }
            }
            return currentTool;
        } catch (error) {
            console.error('Error getting master apps for K9 header:', error);
            return currentTool;
        }
    };

    useEffect(() => {
        const getDashboardSetting = async () => {
            try {
                const res = await getSettingByType('DASHBOARD_SETTING');
                if (res.setting.length > 0) {
                    let dashboardSetting = res.setting.find(item => location.pathname.includes(item.id));
                    if (dashboardSetting) {
                        // Kết hợp với thông tin từ schema master
                        const combinedTool = await combineWithMasterInfo(dashboardSetting);
                        setNameTable(combinedTool.name);
                        setTool(combinedTool);
                        setMasterTool(combinedTool);
                    } else {
                        // Fallback for K9Service page
                        setNameTable('Business Databook | Bách khoa kinh doanh 4.0');
                    }
                }
            } catch (error) {
                console.error('Error loading dashboard setting for K9:', error);
            }
        };

        getDashboardSetting();
    }, [location]);

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };
    return <>
        <div className={styles.container}>
            <div className={styles.navContainer}>
                <div className={styles.header_left}>
                    <div className={styles.header_left}>
                        <div className={styles.backCanvas}
                            onClick={handleBackToDashboard}
                        >
                            <BackCanvas height={20} width={20} />
                        </div>
                        {masterTool && (
                            <>
                                {masterTool.icon ? (
                                    (() => {
                                        const iconSrc = getIconSrcById(masterTool);
                                        return iconSrc ? (
                                            <img src={iconSrc} alt={masterTool.name} width={30} height={30} />
                                        ) : (
                                            <span style={{ fontSize: '20px' }}>{masterTool.icon}</span>
                                        );
                                    })()
                                ) : (
                                    <span style={{ fontSize: '20px' }}>🛠️</span>
                                )}
                            </>
                        )}
                        <div className={styles.headerLogo}>
                            {masterTool ? masterTool.name : nameTable}
                        </div>
                        <div className={styles.logo} style={{ padding: '0px 4px' }}>
                            {/*<img style={{ width : isMobile ? '80px' : '35px', height: isMobile ? '20px' : '32px' }} src="/LogoAiMBA.png" alt="" />*/}
                            {/*{*/}
                            {/*	!isMobile && (*/}
                            {/*		<div className={styles.desc}>*/}
                            {/*			<p>Expert-Grade Knowledge</p>*/}
                            {/*			<p>& Situation Training</p>*/}
                            {/*		</div>*/}
                            {/*	)*/}
                            {/*}*/}

                        </div>
                    </div>

                </div>

                <div className={styles.header_right}>

                </div>


                <div className={styles.username}>
                    <ProfileSelect />
                </div>

            </div>
            <div className={styles.mainContainer}>
                        
                <AiChatTab />
          
       
            </div>
        </div>



    </>;
};

export default AiAcademicAssistant;