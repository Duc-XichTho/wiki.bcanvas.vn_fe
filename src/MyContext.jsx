import React, { createContext, useEffect, useState } from "react";
import { getAllCompany } from "./apis/companyService.jsx";
import { getPathDataById, getAllPath } from "./apis/adminPathService.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import fileNoteQueueService from './services/FileNoteQueueService.js';
import {
    getItemFromIndexedDB2,
    setItemInIndexedDB2,
} from "./pages/KeToanQuanTri/storage/storageService.js";
import {
    getAllSoKeToan,
    getLastIdSoKeToan,
    getLastUpdateSoKeToan,
} from "./apisKTQT/soketoanService.jsx";
import { getCurrentUserLogin, getAllUser } from "./apis/userService.jsx";
import { getAllUserClass } from "./apis/userClassService.jsx";
import {
    getSettingByType,
    updateSetting,
    createSetting,
} from "./apis/settingService.jsx";
import { LIST_COMPANY_KEY } from "./Consts/LIST_KEYS.js";

const MyContext = createContext();

const MyProvider = ({ children }) => {
    const date = new Date();
    const year = date.getFullYear();
    const now = date.getDate() <= 10 ? date.getMonth() : date.getMonth() + 1;
    const [currentUser, setCurrentUser] = useState(null);
    const [userClasses, setUserClasses] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(5);
    // const [currentMonth, setCurrentMonth] = useState(localStorage.getItem("currentMonth") || 5);
    const [currentYear, setCurrentYear] = useState(2025);
    const [currentMonthKTQT, setCurrentMonthKTQT] = useState(
        localStorage.getItem("currentMonthKTQT") || now
    );
    const [currentYearKTQT, setCurrentYearKTQT] = useState(2025);
    const [currentCompanyKTQT, setCurrentCompanyKTQT] = useState('HQ');
    const [listYear, setListYear] = useState(['2023', '2024', '2025']);
    const [currentYearCanvas, setCurrentYearCanvas] = useState(null);
    const [currentMonthCanvas, setCurrentMonthCanvas] = useState(null);
    const [currentDay, setCurrentDay] = useState(date.getDate());
    const [loadData, setLoadData] = useState(true);
    const [listSoKeToan, setListSoKeToan] = useState([]);
    const [listUC_CANVAS, setListUC_CANVAS] = useState([]);
    const [uCSelected_CANVAS, setUCSelected_CANVAS] = useState(null);
    const [listInput, setListInput] = useState([]);
    const [listCompany, setListCompany] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isCollapsedCard, setIsCollapseCard] = useState(false);
    const [changeBackgroud, setChangeBackgroud] = useState(false);
    const [selectedTapCanvas, setSelectedTapCanvas] = useState(null);
    const [yearCDSD, setYearCDSD] = useState(localStorage.getItem("year_cdsd"));
    const [botSetting, setBotSetting] = useState({});
    const [userList, setUserList] = useState([]);

    // KTQT
    const [isCollapsedKTQT, setIsCollapsedKTQT] = useState(false);
    const [unitDisplay, setUnitDisplay] = useState(() => {
        // Lấy giá trị từ localStorage, mặc định là 'thousand'
        return localStorage.getItem('unitDisplay') || 'thousand';
    });
    const [isTriggeredVas, setIsTriggeredVas] = useState(false);
    const [isUpdateNoti, setIsUpdateNoti] = useState(false);
    const [selectedTemplateName, setSelectedTemplateName] = useState(
        getLocalStorageSettings().selectedTemplateName
    ); // State for selected template
    const [selectedTemplate, setSelectedTemplate] = useState(
        getLocalStorageSettings().selectedTemplate
    ); // State for selected template

    const [checkUpdate, setCheckUpdate] = useState(false);
    const [valueUpdate, setValueUpdate] = useState(null);
    const [currenStepDuLieu, setCurrenStepDuLieu] = useState(null);
    const [currenStepKeHoach, setCurrenStepKeHoach] = useState(null);
    const [currenStepThucHien, setCurrenStepThucHien] = useState(null);
    const [currenStepHome, setCurrenStepHome] = useState(null);
    const [loadSidebarHopKH, setLoadSidebarHopKH] = useState(false);
    const [loadDataDuLieu, setLoadDataDuLieu] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [updateReportBuilder, setUpdateReportBuilder] = useState(false);
    const [runningStep, setRunningStep] = useState(null);
    const [currentFileNoteId, setCurrentFileNoteId] = useState(null);
    const [runningFileNotes, setRunningFileNotes] = useState(new Set());
    const [currentSchemaPathRecord, setCurrentSchemaPathRecord] = useState(null);

    // Queue states
    const [fileNoteQueue, setFileNoteQueue] = useState([]);
    const [isProcessingQueue, setIsProcessingQueue] = useState(false);
    const [currentRunningFileNote, setCurrentRunningFileNote] = useState(null);

    // Helper: Unread filenotes in localStorage
    const addUnreadFileNote = (fileNoteId) => {
        try {
            const key = 'unreadFileNotes';
            const raw = localStorage.getItem(key);
            const setIds = new Set(Array.isArray(JSON.parse(raw)) ? JSON.parse(raw).map(String) : []);
            setIds.add(String(fileNoteId));
            localStorage.setItem(key, JSON.stringify(Array.from(setIds)));
        } catch (_) { }
    };

    const removeUnreadFileNote = (fileNoteId) => {
        try {
            const key = 'unreadFileNotes';
            const raw = localStorage.getItem(key);
            const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw).map(String) : [];
            const next = arr.filter(id => id !== String(fileNoteId));
            localStorage.setItem(key, JSON.stringify(next));
        } catch (_) { }
    };

    // Đồng bộ queue service với context
    useEffect(() => {
        // Đăng ký callbacks cho queue service
        fileNoteQueueService.setCallbacks({
            onQueueUpdate: (status) => {
                setFileNoteQueue(status.queue);
                setIsProcessingQueue(status.isProcessing);
                setCurrentRunningFileNote(status.currentRunning);

                // Cập nhật runningFileNotes từ queue (chỉ những filenote đang chạy thực sự)
                // Hợp nhất với state hiện tại để không làm mất các filenote đang chạy batch (không qua queue)
                const runningSet = fileNoteQueueService.getRunningFileNotes();
                setRunningFileNotes(prev => {
                    const merged = new Set(prev);
                    runningSet.forEach(id => merged.add(String(id)));
                    return merged;
                });
            },
            onAllCompleteForFileNote: (fileNoteId) => {
                // Nếu hiện tại không mở fileNote này, đánh dấu unread
                try {
                    // current fileNote id from route param if available
                    const url = window.location.pathname || '';
                    const match = url.match(/\/data-manager\/data\/(\d+)/);
                    const openedId = match ? match[1] : null;
                    if (!openedId || String(openedId) !== String(fileNoteId)) {
                        addUnreadFileNote(fileNoteId);
                    }
                } catch (_) {
                    addUnreadFileNote(fileNoteId);
                }
            }
        });
    }, []);

    function getLocalStorageSettings() {
        const storedSettings = JSON.parse(localStorage.getItem("WorkFlow"));
        return {
            selectedTemplate: storedSettings?.selectedTemplate ?? null,
            selectedTemplateName: storedSettings?.selectedTemplateName ?? null,
        };
    }

    const [chainTemplate2Selected, setChainTemplate2Selected] = useState({
        type: null,
        data: null,
    });
    const [cardSelectedContext, setCardSelectedContext] = useState(null);

    useEffect(() => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        setCurrentMonthCanvas(currentMonth.toString());
        setCurrentYearCanvas("2025");

        loadBotSetting();
    }, []);

    const loadBotSetting = async () => {
        let chatBot = await getSettingByType("ChatBot");
        if (!chatBot) {
            chatBot = await createSetting({
                type: "ChatBot",
                setting: { limit: 1000000, used: 0 },
            });
        }
        setBotSetting(chatBot);
    };

    const fetchAllCompany = async () => {
        getAllCompany()
            .then((data) => {
                const validCompanies = data.filter(
                    (val) => val.name && val.name.trim() !== ""
                );
                if (validCompanies.length > 0) {
                    setListCompany(validCompanies);
                    setItemInIndexedDB2(LIST_COMPANY_KEY, validCompanies)
                    setSelectedCompany(validCompanies[1]?.name);
                }
            })
            .catch((error) => {
                console.error("Error fetching companies:", error);
            });
    };

    const fetchAllSoKeToan = async () => {
        const data = await getAllSoKeToan();
        setListSoKeToan(data);
        let years = data
            .map((e) => e?.year)
            .filter((year) => year !== undefined && year !== null);
        if (years?.length > 0) {
            let uniqueYears = [...new Set(years)];

            let maxYear = Math.max(...uniqueYears);
            let minYear = Math.min(...uniqueYears);

            // uniqueYears.push(`${maxYear + 1}`, `${maxYear + 2}`);
            // uniqueYears.unshift(`${minYear - 2}`, `${minYear - 1}`);
            setListYear(uniqueYears);
        } else {
            setListYear([currentYear - 1, currentYear, currentYear + 1]);
        }
    };

    const fetchAndSyncAllSoKeToan = async () => {
        const updatedList = await getAllSoKeToan();
        await setItemInIndexedDB2("listSoKeToan", updatedList);
        setListSoKeToan(updatedList);
        return updatedList;
    };

    const loadDataSoKeToan = async () => {
        let lastUpdateFE = localStorage.getItem("lastUpdateFE");
        let lastUpdateBE = await getLastUpdateSoKeToan();
        let lastIdFE = localStorage.getItem("lastIdFE");
        let lastIdBE = await getLastIdSoKeToan();
        let data = [];
        if (
            !lastUpdateFE ||
            lastUpdateFE !== lastUpdateBE ||
            !lastIdFE ||
            lastIdFE != lastIdBE
        ) {
            localStorage.setItem("lastUpdateFE", lastUpdateBE);
            localStorage.setItem("lastIdFE", lastIdBE);
            data = await fetchAndSyncAllSoKeToan();
            return data;
        } else {
            data = await getItemFromIndexedDB2("listSoKeToan");
            if (data.length === 0) {
                data = await fetchAndSyncAllSoKeToan();
                return data;
            } else {
                setListSoKeToan(data);
                return data;
            }
        }
    };

    const fetchCurrentUser = async () => {
        const user = await getCurrentUserLogin();
        console.log('=== MyContext: fetchCurrentUser ===');
        console.log('Full response:', user);
        console.log('User data:', user?.data);
        console.log('User email:', user?.data?.email);
        console.log('Is Admin:', user?.data?.isAdmin);
        console.log('Is Super Admin:', user?.data?.isSuperAdmin);
        console.log('Is Editor:', user?.data?.isEditor);
        console.log('Schema:', user?.data?.schema);
        if (user && Object.keys(user?.data || {}).length > 0) {
            setIsLoggedIn(true);
        }
        setCurrentUser(user.data);
        console.log('Current user state set to:', user.data);
        return user;
    };

    const resolveCurrentSchemaPathRecord = async () => {
        try {
            const currentUser = await getCurrentUserLogin();
            if(currentUser?.data?.isSuperAdmin){
                const selectedSchemaId = localStorage.getItem('selectedSchemaId');
                if (selectedSchemaId ) {
                    const res = await getPathDataById(selectedSchemaId);
                    console.log('res', res);
    
                    const data = res?.data || res;
                    if (data) {
                        setCurrentSchemaPathRecord(data);
                        if (data?.path) localStorage.setItem('currentUserSchema', data.path);
                        return data;
                    }
                } else {
                    setCurrentSchemaPathRecord({
                        schema: 'master',
                        email_import: 'gateway@xichtho-vn.com'
                    });
                }
            } else {
                if (currentUser && currentUser?.data ) {
                    if (currentUser?.data?.schema) {
                        const all = await getAllPath();
                        const list = all?.data
                        const found = Array.isArray(list) ? list.find(p => p?.path === currentUser?.data?.schema) : null;
                        if (found) {
                            setCurrentSchemaPathRecord(found);
                            console.log('found', found);
                            localStorage.setItem('currentUserSchema', found.path);
                            return found;
                        }
                    } 
                } 
            }
        } catch (error) { 
            console.error('Error in resolveCurrentSchemaPathRecord:', error);
        }
        setCurrentSchemaPathRecord(null);
        return null;
    };

    const fetchUserClasses = async () => {
        const userClasses = await getAllUserClass();
        setUserClasses(userClasses);
        return userClasses;
    };

    const fetchAllUser = async () => {
        try {
            const users = await getAllUser();
            const usersWithNickname = users.result.map(user => ({
                ...user,
                nickname: user.email.split('@')[0]
            }));
            setUserList(usersWithNickname);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    // Function để cập nhật unitDisplay và lưu vào localStorage
    const updateUnitDisplay = (newUnitDisplay) => {
        setUnitDisplay(newUnitDisplay);
        localStorage.setItem('unitDisplay', newUnitDisplay);
    };

    const fetchAllData = async () => {
        try {
            const [_, __, user] = await Promise.all([
                fetchAllCompany(),
                loadDataSoKeToan(),
                fetchCurrentUser(),
            ]);

            await Promise.all([
                fetchUserClasses(),
                fetchAllUser(),

            ]);
        } catch (error) {
            // console.error("Lỗi khi lấy dữ liệu: ", error);
        }
    };

    useEffect(() => {

        fetchAllData();
        resolveCurrentSchemaPathRecord()
    }, []);


    return (
        <ThemeProvider>
            <MyContext.Provider
                value={{
                    currentMonth,
                    setCurrentMonth,
                    currentYear,
                    setCurrentYear,
                    currentDay,
                    setCurrentDay,
                    loadData,
                    setLoadData,
                    loadDataSoKeToan,
                    listSoKeToan,
                    setSelectedCompany,
                    selectedCompany,
                    listCompany,
                    setListCompany,
                    fetchAllCompany,
                    isCollapsed,
                    setIsCollapsed,
                    isCollapsedCard,
                    setIsCollapseCard,
                    isCollapsedKTQT,
                    setIsCollapsedKTQT,
                    isTriggeredVas,
                    setIsTriggeredVas,
                    currentYearKTQT,
                    setCurrentYearKTQT,
                    currentCompanyKTQT,
                    setCurrentCompanyKTQT,
                    changeBackgroud,
                    setChangeBackgroud,
                    selectedTapCanvas,
                    currentYearCanvas,
                    setCurrentYearCanvas,
                    currentMonthCanvas,
                    setCurrentMonthCanvas,
                    setSelectedTapCanvas,
                    currentMonthKTQT,
                    setCurrentMonthKTQT,
                    year,
                    selectedTemplate,
                    setSelectedTemplate,
                    selectedTemplateName,
                    setSelectedTemplateName,
                    chainTemplate2Selected,
                    setChainTemplate2Selected,
                    currentUser,
                    cardSelectedContext,
                    setCardSelectedContext,
                    fetchUserClasses,
                    userClasses,
                    setUserClasses,
                    listYear,
                    yearCDSD,
                    setYearCDSD,
                    listUC_CANVAS,
                    setListUC_CANVAS,
                    uCSelected_CANVAS,
                    setUCSelected_CANVAS,
                    setCurrentUser,
                    botSetting,
                    setBotSetting,
                    isUpdateNoti,
                    setIsUpdateNoti,
                    checkUpdate, setCheckUpdate,
                    valueUpdate, setValueUpdate,
                    fetchCurrentUser,
                    userList,
                    fetchAllUser,
                    currenStepDuLieu, setCurrenStepDuLieu,
                    currenStepKeHoach, setCurrenStepKeHoach,
                    currenStepThucHien, setCurrenStepThucHien,
                    loadSidebarHopKH, setLoadSidebarHopKH,
                    currenStepHome, setCurrenStepHome,
                    isLoggedIn, setIsLoggedIn,
                    loadDataDuLieu, setLoadDataDuLieu,
                    updateReportBuilder, setUpdateReportBuilder,
                    unitDisplay, setUnitDisplay, updateUnitDisplay,
                    runningStep, setRunningStep,
                    currentFileNoteId, setCurrentFileNoteId,
                    runningFileNotes, setRunningFileNotes,
                    fileNoteQueue, setFileNoteQueue,
                    isProcessingQueue, setIsProcessingQueue,
                    currentRunningFileNote, setCurrentRunningFileNote,
                    currentSchemaPathRecord,
                }}
            >
                {children}
            </MyContext.Provider>
        </ThemeProvider>
    );
};

export { MyContext, MyProvider };

