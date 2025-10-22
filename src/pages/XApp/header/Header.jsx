import { useNavigate, useLocation } from "react-router-dom";
import css from "./Header.module.css";
import { BackCanvas } from '../../../icon/svg/IconSvg.jsx';
import ProfileSelect from "../../Home/SelectComponent/ProfileSelect.jsx";
import { useState, useEffect } from "react";
import { getSettingByType, getSchemaTools } from "../../../apis/settingService.jsx";
import { ICON_CROSSROAD_LIST } from '../../../icon/svg/IconSvg.jsx';
export default function Header() {
    const navigate = useNavigate();
    const [tool, setTool] = useState(null);
    const location = useLocation();
    const [nameTable, setNameTable] = useState(null);
    const [masterTool, setMasterTool] = useState(null);

    // Hàm kết hợp với thông tin từ schema master
    const combineWithMasterInfo = async (currentTool) => {
        try {
            const masterResponse = await getSchemaTools('master');
            const masterAppsList = masterResponse?.setting || [];
            
            if (masterAppsList && masterAppsList.length > 0) {
                const masterApp = masterAppsList.find(masterApp => masterApp.id === currentTool.id);
                if (masterApp) {
                    console.log(`XApp Header: Combining tool ${currentTool.id} with master info`);
                    return {
                        ...currentTool,
                        name: masterApp.name,
                        icon: masterApp.icon
                    };
                }
            }
            return currentTool;
        } catch (error) {
            console.error('Error getting master apps for XApp header:', error);
            return currentTool;
        }
    };

    const getDashboardSetting = async () => {
        try {
            const res = await getSettingByType('DASHBOARD_SETTING');
            if (res.setting.length > 0) {
                let dashboardSetting = res.setting.find(item => location.pathname.includes(item.id));
                if (dashboardSetting) {
                    console.log('dashboardSetting', dashboardSetting);
                    // Kết hợp với thông tin từ schema master
                    const combinedTool = await combineWithMasterInfo(dashboardSetting);
                    setNameTable(combinedTool.name);
                    setTool(combinedTool);
                    setMasterTool(combinedTool);
                }
            }
        } catch (error) {
            console.log('error', error);
        }
    }
    const getIconSrcById = (tool) => {
        const found = ICON_CROSSROAD_LIST.find(item => item.id == tool.icon);
        return found ? found.icon : undefined;
    };

    useEffect(() => {
        getDashboardSetting();
    }, []);
    return  <>
    <div className={css.navContainer}>
        <div className={css.header_left}>
            <div className={css.backCanvas}
                 onClick={() =>
                     navigate('/dashboard')

                 }
            >
                <BackCanvas height={20} width={20}/>
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
            <div className={css.headerLogo}>
                {masterTool ? masterTool.name : nameTable}
            </div>
            
        </div>
        <div className={css.header_right}>
            <div className={css.username}>
                <ProfileSelect />
            </div>
        </div>
    </div>
</>
}