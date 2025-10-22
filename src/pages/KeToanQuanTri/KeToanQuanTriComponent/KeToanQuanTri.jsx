import React, { useContext, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { MyContext } from '../../../MyContext.jsx';
import { getSettingByType, createSetting, updateSetting, getSchemaTools } from '../../../apis/settingService.jsx';
import { getAllUserClass, getUserClassByEmail } from '../../../apis/userClassService.jsx';
import { getAllCompany } from '../../../apis/companyService.jsx';
import { getItemFromIndexedDB2 } from '../storage/storageService.js';
import { LIST_COMPANY_KEY } from '../../../Consts/LIST_KEYS.js';
import { BackCanvas, ICON_CROSSROAD_LIST } from '../../../icon/svg/IconSvg.jsx';
import ProfileSelect from '../../Home/SelectComponent/ProfileSelect.jsx';
import YearSelectKTQT from '../../Home/SelectComponent/YearSelectKTQT.jsx';
import { Settings } from 'lucide-react';
import PopUpSetting from '../popUp/popUpSetting.jsx';
import css from './KeToanQuanTri.module.css';
import Sidebar from './Sidebar.jsx';

function ensureHQCompany(listCompany) {
    if (!listCompany.some(c => c.code === 'HQ')) {
        return [
            ...listCompany,
            { id: 99999999, name: 'Hợp nhất', code: 'HQ' }
        ];
    }
    return listCompany;
}

const KeToanQuanTri = () => {
    const { isCollapsedKTQT, setIsCollapsedKTQT, userClasses, fetchUserClasses, currentCompanyKTQT, currentUser, } = useContext(MyContext)
    const [permissions, setPermissions] = useState([])
    const [listCompany, setListCompany] = useState([])
    const [loadingPermission, setLoadingPermission] = useState(true)
    const [allowedCompanies, setAllowedCompanies] = useState([])
    const [nameTable, setNameTable] = useState(null);
    const [tool, setTool] = useState(null);
    const [masterTool, setMasterTool] = useState(null);
    const [isDialogOpenSetting, setIsDialogOpenSetting] = useState(false);
    const [checkFolder, setCheckFolder] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { buSelect, companySelect } = useParams();

    const fetchAllCompany = async () => {
        getAllCompany()
            .then((data) => {
                const validCompanies = data.filter(
                    (val) => val.name && val.name.trim() !== ""
                );
                if (validCompanies.length > 0) {
                    setListCompany(validCompanies);
                }
            })
            .catch((error) => {
                console.error("Error fetching companies:", error);
            });
    };

    useEffect(() => {
        fetchAllCompany();
    }, []);

    useEffect(() => {
        async function fetchData() {
            let perms = await getUserClassByEmail();
            let allUserClass = await getAllUserClass();
            // let allFDRUC = allUserClass.filter(uc => uc?.stepAccess?.includes("fdr") && uc?.module?.includes("DASHBOARD"));
            perms = perms.filter(permission => permission.module.includes("DASHBOARD") && permission.stepAccess.includes("fdr"));
            if (currentUser.isAdmin || currentUser.isSuperAdmin) {
                perms = perms.concat(allUserClass);
            }
            setPermissions(perms);
            setLoadingPermission(false);
            // Lấy danh sách mã công ty từ trường info của các permission
            let companyCodes = perms.flatMap(p => Array.isArray(p.info) ? p.info : []).filter(Boolean);
            // Nếu có HQ thì cho phép tất cả công ty (và luôn thêm HQ nếu thiếu)
            if (companyCodes.includes('HQ') || currentUser.isAdmin) {
                setAllowedCompanies(ensureHQCompany(listCompany));
            } else {
                setAllowedCompanies(listCompany.filter(c => companyCodes.includes(c.code)));
            }
        }
        fetchData();
    }, [listCompany]);

    useEffect(() => {
        if (currentCompanyKTQT === 'HQ' && location.pathname.includes('/chay-du-lieu')) {
            navigate(`/fdr`)
        }

    }, [location.pathname, currentCompanyKTQT]);

    // Hàm kết hợp với thông tin từ schema master
    const combineWithMasterInfo = async (currentTool) => {
        try {
            const masterResponse = await getSchemaTools('master');
            const masterAppsList = masterResponse?.setting || [];
            
            if (masterAppsList && masterAppsList.length > 0) {
                const masterApp = masterAppsList.find(masterApp => masterApp.id === currentTool.id);
                if (masterApp) {
                    return {
                        ...currentTool,
                        name: masterApp.name,
                        icon: masterApp.icon
                    };
                }
            }
            return currentTool;
        } catch (error) {
            console.error('Error getting master apps for ketoan header:', error);
            return currentTool;
        }
    };

    // Load dashboard setting for navbar
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
                    }
                }
            } catch (error) {
                console.error('Error loading dashboard setting for ketoan:', error);
            }
        };
        
        getDashboardSetting();
    }, [location]);

    const getIconSrcById = (tool) => {
        const found = ICON_CROSSROAD_LIST.find(item => item.id == tool.icon);
        return found ? found.icon : undefined;
    };

    let isAdmin = currentUser && currentUser.isAdmin;
    let noAccess = false;

    // Kiểm tra quyền cao nhất dựa trên permissions
    if (!isAdmin) {
        if (loadingPermission) {
            // Đang load quyền, có thể show loading hoặc return null
            return null;
        }
        // Kiểm tra user có trong userAccess của bất kỳ permission nào không
        const userEmail = currentUser?.email;
        const hasPermission = permissions.some(permission => Array.isArray(permission.userAccess) && permission.userAccess.includes(userEmail));
        if (!hasPermission) {
            noAccess = true;
        }
    }

    if (noAccess) {
        return (
            <div style={{
                width: '100%',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: '#F64C26',
                fontWeight: 'bold',
                background: '#fff'
            }}>
                Bạn chưa được cấp quyền truy cập
            </div>
        );
    }

    const handleCloseModalSetting = async (data) => {
        setIsDialogOpenSetting(false);
        if (data) {
            setCheckFolder(data);
        }
    };

    const loadCheckFolderSetting = async () => {
        let coms = await getItemFromIndexedDB2(LIST_COMPANY_KEY);
        if (!coms || coms.length === 0) {
            coms = await getAllCompany();
        }

        let folder = await getSettingByType('FolderKTQT');


        // if (!folder || !folder.setting) {
        //     folder = await createSetting({
        //         type: 'FolderKTQT',
        //         setting: settingObj,
        //     });
        // } else {
        //     // Đảm bảo mỗi userclass đều có đủ allTitles
        //     let updated = false;
        //     let currentSetting = { ...folder.setting };
        //     userClassList.forEach(uc => {
        //         if (!currentSetting[uc.id]) {
        //             currentSetting[uc.id] = allTitles.map(title => ({ name: title, open: true }));
        //             updated = true;
        //         } else {
        //             // Bổ sung title còn thiếu hoặc loại bỏ title thừa
        //             const currentTitles = currentSetting[uc.id].map(s => s.name);
        //             const missingTitles = allTitles.filter(title => !currentTitles.includes(title));
        //             const extraTitles = currentTitles.filter(title => !allTitles.includes(title));
        //             if (missingTitles.length > 0 || extraTitles.length > 0) {
        //                 currentSetting[uc.id] = [
        //                     ...currentSetting[uc.id].filter(s => !extraTitles.includes(s.name)),
        //                     ...missingTitles.map(title => ({ name: title, open: true })),
        //                 ];
        //                 updated = true;
        //             }
        //         }
        //     });
        //     if (updated) {
        //         folder.setting = currentSetting;
        //         await updateSetting(folder);
        //     }
        // }
        setCheckFolder(folder);
    };

    useEffect(() => {
        loadCheckFolderSetting();
    }, [location.pathname]);

    return (
        <div className={css.mainContainer}>
            <div className={css.navbar}>
                <div className={css.navbarLeft}>

                    <div className={css.backCanvas}
                        onClick={() =>
                            navigate('/dashboard')

                        }
                    >
                        <BackCanvas height={20} width={20} />
                    </div>
                    <div className={css.appName}>
                        {masterTool && (
                            <>
                                {masterTool.icon ? (
                                    (() => {
                                        const iconSrc = getIconSrcById(masterTool);
                                        return iconSrc ? (
                                            <img src={iconSrc} alt={masterTool.name} className={css.appIcon} />
                                        ) : (
                                            <span style={{ fontSize: '20px' }}>{masterTool.icon}</span>
                                        );
                                    })()
                                ) : (
                                    <span style={{ fontSize: '20px' }}>🛠️</span>
                                )}
                            </>
                        )}
                        <span className={css.nameTable}>{masterTool ? masterTool.name : nameTable}</span>
                    </div>
                    <YearSelectKTQT />
                    {currentUser && currentUser.isAdmin && (
                        <Settings
                            className={css.settingIcon}
                            size={18}
                            onClick={() => setIsDialogOpenSetting(true)}
                        />
                    )}
                </div>
                <div className={css.navbarRight}>
                    <ProfileSelect />

                </div>
            </div>
            <div className={css.keToanQuanTri}>
                {/* Navbar */}

                <Sidebar allowedCompanies={allowedCompanies} permissions={permissions} currentUser={currentUser} />
                <div className={isCollapsedKTQT ? css.outletExpanded : css.outlet}>
                    {/*{permission ?*/}
                    <>
                        <div className={css.content} style={{ padding: location.pathname.includes('chay-du-lieu') ? '0px' : '' }}>
                            <Outlet />
                        </div>
                    </>
                    {/*      :
                     <NotAccessible NotAccessible={KHONG_THE_TRUY_CAP} view={'KTQT'}/>
                }*/}
                </div>
            </div>
            <PopUpSetting
                open={isDialogOpenSetting}
                onClose={handleCloseModalSetting}
                data={checkFolder}
                permissions={permissions}
                currentUser={currentUser}
            />
        </div>
    )
}

export default KeToanQuanTri
