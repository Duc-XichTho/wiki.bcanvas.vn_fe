import css from "./Header.module.css";
import * as React from "react";
import {useContext, useEffect, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import ProfileSelect from "../../pages/Home/SelectComponent/ProfileSelect.jsx";
import CompanySelect from "../../pages/Home/SelectComponent/CompanySelect.jsx";
import YearSelect from "../../pages/Home/SelectComponent/YearSelect.jsx";
import {buildStyles, CircularProgressbar} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import {Alert, Badge, Button, Dropdown, Popover, Space, Tooltip} from "antd";
// ICON
import {BotIcon,} from "../../icon/IconSVG.js";
// COMPONENT
import SABBotPopup from "./SABBot/SABBotPopup.jsx";
import AuditBotPopup from "./LogBot/LogBotPopup.jsx";
import KhaiBaoDauKy from "../../pages/Home/SelectComponent/KhaiBaoDauKy.jsx";
import CauHinhPPTGT from "./CauHinh/CauHinhPPTGT.jsx";
import CauHinhChotSo from "./CauHinh/CauHinhChotSo.jsx";
import CaiDatMenu from "../../pages/Home/SelectComponent/CaiDatSelect.jsx";
import {BellOutlined} from "@ant-design/icons";
import {getAllCard, getAllStepFromCard} from "../../apis/cardService.jsx";
import {FaExternalLinkAlt} from "react-icons/fa";
import {getUserClassByEmail} from "../../apis/userClassService.jsx";
import {MyContext} from "../../MyContext.jsx";
import {Canvas_APP, Gateway, SAB_MA, SAB_Workflow,} from "../../Consts/NAME_APP.js";
import WarningSetup from "./CauHinh/WarningSetup.jsx";
import {getAllWarningRTypeSAB, getAllWarningSAB,} from "../../apis/smartWarmingSABService.jsx";
import {getSettingByType} from "../../apis/settingService.jsx";
import {SETTING_TYPE} from "../../CONST.js";
import SetupDKPhieu from "./CauHinh/SetupDKPhieu.jsx";
import CrossRoadPopup2 from "../../components/CrossRoadPopup/CrossRoadPopup2.jsx";
import {BackCanvas} from "../../icon/svg/IconSvg.jsx";
import styles from '../gateway/Header/header.module.css';

const processStepAccessData = (data) => {
    const mergedStepAccess = {};

    data.forEach((item) => {
        item.stepAccess.forEach((step) => {
            if (!mergedStepAccess[step.id]) {
                mergedStepAccess[step.id] = {...step};
            } else {
                const currentPermissions = mergedStepAccess[step.id].permissions;
                const newPermissions = step.permissions;

                Object.keys(currentPermissions).forEach((key) => {
                    currentPermissions[key] =
                        currentPermissions[key] || newPermissions[key];
                });
            }
        });
    });

    const mergedArray = Object.values(mergedStepAccess);

    const filteredArray = mergedArray.filter(
        (step) => step.permissions.approve1 || step.permissions.approve2
    );

    return filteredArray;
};

export default function Header() {
    // const { currentUser, setIsLoggedIn } = useContext(MyContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [paths, setPaths] = useState(location.pathname);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const [showSABBotPopup, setShowSABBotPopup] = useState(false);
    const [showCauHinhPPTGT, setShowCauHinhPPTGT] = useState(false);
    const [showCauHinhButToan, setShowCauHinhButToan] = useState(false);
    const [showCauHinhChotSo, setShowCauHinhChotSo] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [showSetupDK, setShowSetupDK] = useState(false);
    const [dataStepFromCard, setDataStepFromCard] = useState([]);
    const [showLogBotPopup, setShowLogBotPopup] = useState(false);
    const [value, setValue] = useState(0);
    const [stepPermissionOfCurrentUser, setStepPermissionOfCurrentUser] =
        useState([]);
    const [smartWarning, setSmartWarning] = useState([]);
    const {
        setSelectedTemplate,
        chainTemplate2Selected,
        setChainTemplate2Selected,
        setSelectedTemplateName,
        currentUser,
        loadData,
        setLoadData,
        botSetting,
    } = useContext(MyContext);

    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const calculateValue = Math.round(
            (botSetting.setting.used / botSetting.setting.limit) * 100
        );
        setValue(calculateValue);
    }, [botSetting]);

    const showModal = () => {
        setIsModalOpen(true);
    };
    const handleOk = () => {
        setIsModalOpen(false);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const handleSelectedCard = (warning, setting, cards) => {
        if (warning[setting.code]?.temp) {
            let listCard = cards.filter(
                (card) => card.template_id == warning[setting.code]?.temp?.id
            );
            setChainTemplate2Selected({
                type: "chain2",
                data: {
                    ...chainTemplate2Selected.data,
                    selectedTemplate: {
                        ...warning[setting.code]?.temp,
                        cards: listCard,
                    },
                },
            });
            navigate(
                `${warning?.[setting.code]?.path}/cards/${listCard[0].id}/steps/${listCard[0].cau_truc[0].id
                }`
            );
        } else {
            navigate(warning?.[setting.code]?.path);
        }
    };

    async function getWarningSAB() {
        let settingData = (await getSettingByType(SETTING_TYPE.Warning)) || [];
        let warning = await getAllWarningSAB();
        let warningR = await getAllWarningRTypeSAB();
        warning = {...warning, ...warningR};
        let listWarning = [];
        let cards = await getAllCard();
        if (settingData.setting.length > 0) {
            let settings = settingData.setting;
            settings = settings.filter((e) => e.check && e.check.includes("Có"));
            for (const setting of settings) {
                if (
                    setting.code.includes(warning?.[setting.code]?.type) &&
                    warning[setting.code].data?.length > 0
                ) {
                    switch (setting?.type) {
                        case "Cảnh báo":
                            listWarning.push({
                                key: setting.code,
                                label: (
                                    <div
                                        className={css.warning}
                                        onClick={() => handleSelectedCard(warning, setting, cards)}
                                    >
                                        <div className={css.warning_title}>
                                            Mã lỗi: {setting.code}{" "}
                                        </div>
                                        <div className={css.warning_content}>
                                            {" "}
                                            {warning[setting.code].data?.length && setting.count
                                                ? `Có ${warning[setting.code].data?.length} - `
                                                : ""}
                                            {warning[setting.code].message}
                                        </div>
                                    </div>
                                ),
                            });
                            break;
                        case "Chú ý":
                            listWarning.push({
                                key: setting.code,
                                label: (
                                    <div
                                        className={css.attention}
                                        onClick={() => handleSelectedCard(warning, setting, cards)}
                                    >
                                        <div className={css.attention_title}>
                                            Mã lỗi: {setting.code}{" "}
                                        </div>
                                        <div className={css.attention_content}>
                                            Có {warning[setting.code].data?.length} -{" "}
                                            {warning[setting.code].message}
                                        </div>
                                    </div>
                                ),
                            });
                            break;
                        case "Thông báo":
                            listWarning.push({
                                key: setting.code,
                                label: (
                                    <div
                                        className={css.notification}
                                        onClick={() => handleSelectedCard(warning, setting, cards)}
                                    >
                                        <div className={css.notification_title}>
                                            Mã lỗi: {setting.code}{" "}
                                        </div>
                                        <div className={css.notification_content}>
                                            Có {warning[setting.code].data?.length} -{" "}
                                            {warning[setting.code].message}
                                        </div>
                                    </div>
                                ),
                            });
                            break;
                    }
                }
            }
        }

        setSmartWarning(listWarning);
    }

    useEffect(() => {
        getWarningSAB();
    }, [loadData, window.location.pathname]);

    const fetchUserPermissions = async () => {
        try {
            const data = await getUserClassByEmail();
            setStepPermissionOfCurrentUser(processStepAccessData(data));
        } catch (error) {
            console.error("Error fetching user permissions:", error);
        }
    };

    const fetchAllStepFromCard = async () => {
        try {
            const data = await getAllStepFromCard();
            setDataStepFromCard(data);
        } catch (error) {
            console.log(error);
        }
    };

    const items = [
        {
            key: "1",
            label: (
                <div onClick={() => navigate("/ke-toan-quan-tri/can-doi-phat-sinh")}>
                    {SAB_MA}
                </div>
            ),
        },
        {
            key: "2",
            label: <div onClick={() => navigate("/canvas")}>{Canvas_APP}</div>,
        },
        {
            key: "3",
            label: <div onClick={() => navigate("/project-manager")}>{Gateway}</div>,
        },
        {
            key: "4",
            label: (
                <div
                    onClick={() => {
                        setSelectedTemplateName("");
                        setSelectedTemplate("");

                        setTimeout(() => {
                            navigate(`/work-flow`);
                        }, 100);
                    }}
                >
                    {SAB_Workflow}
                </div>
            ),
        },

        {
            key: "5",
            label: (
                <div onClick={() => window.open("https://sab.io.vn", "_blank")}>
                    SAB Wiki
                </div>
            ),
        },
        {
            key: "6",
            label: (
                <>
                    {currentUser?.isAdmin && (
                        <div onClick={() => navigate("/admin")}>Admin</div>
                    )}
                </>
            ),
        },
    ];

    const navListRef = useRef(null);
    useEffect(() => {
        setPaths(location.pathname);
    }, [location]);

    const handleChangePath = (path, event) => {
        setPaths(path);
        navigate(path);

        const rect = event.currentTarget.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        event.currentTarget.style.setProperty("--click-x", `${clickX}px`);
        event.currentTarget.style.setProperty("--click-y", `${clickY}px`);
        event.currentTarget.scrollIntoView({
            behavior: "smooth",
            inline: "center",
        });
    };

    const scrollNavList = (direction) => {
        if (navListRef.current) {
            const scrollAmount = direction === "left" ? -250 : 250;
            navListRef.current.scrollBy({left: scrollAmount, behavior: "smooth"});
        }
    };

    const checkScrollPosition = () => {
        if (navListRef.current) {
            const {scrollLeft, scrollWidth, clientWidth} = navListRef.current;
            const maxScrollLeft = scrollWidth - clientWidth;

            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < maxScrollLeft);
        }
    };

    useEffect(() => {
        fetchUserPermissions();
        fetchAllStepFromCard();
        checkScrollPosition();
        const navList = navListRef.current;
        if (navList) {
            navList.addEventListener("scroll", checkScrollPosition);
        }
        window.addEventListener("resize", checkScrollPosition);

        return () => {
            if (navList) {
                navList.removeEventListener("scroll", checkScrollPosition);
            }
            window.removeEventListener("resize", checkScrollPosition);
        };
    }, []);

    const toggleSABBotPopup = () => {
        setShowSABBotPopup(!showSABBotPopup);
    };
    const toggleLogBotPopup = () => {
        setShowLogBotPopup(!showLogBotPopup);
    };
    const URL = import.meta.env.VITE_DOMAIN_URL;

    const contentApprove = (
        <div className={css.contentApprove}>
            {dataStepFromCard
                .filter((step) =>
                    stepPermissionOfCurrentUser.some((item) => {
                        if (item.id == step.id) {
                            if (step.status == "pending" && item.permissions.approve1) {
                                return true;
                            }
                            if (step.status == "duyet_1" && item.permissions.approve2) {
                                return true;
                            }
                        }
                        return false;
                    })
                )
                .map((step) => (
                    <Alert
                        key={step.id}
                        message={
                            <span>
                <b>{step.card_code}</b> - <i>{step.step_code}</i>
              </span>
                        }
                        description={
                            <span>
                <b>{step.card_name}</b> -{" "}
                                <span style={{color: "blue"}}>{step.name}</span>
              </span>
                        }
                        type={
                            step.status === "pending"
                                ? "info"
                                : step.status === "duyet_1" && "warning"
                        }
                        action={
                            <Button
                                type="text"
                                size="small"
                                icon={<FaExternalLinkAlt/>}
                                onClick={() =>
                                    window.open(
                                        `${URL}/accounting/chains/${step.chain_id}/cards/${step.card_id}/steps/${step.id}`,
                                        "_blank"
                                    )
                                }
                            />
                        }
                    />
                ))}
        </div>
    );


    return (
        <>
            <div className={css.navContainer}>
                <div className={css.header_left}>
                    {/*<Space*/}
                    {/*    style={{*/}
                    {/*        cursor: "pointer",*/}
                    {/*    }}*/}
                    {/*    onClick={showModal}*/}
                    {/*>*/}
                    {/*    /!*<img src={AppIcon} alt="" width={30} />*!/*/}
                    {/*    <img src="/App%20switcher.svg" alt="" width={25}/>*/}
                    {/*    <img src="/logo.png" alt="" width={35}/>*/}
                    {/*</Space>*/}
                    <div className={css.backCanvas}
                         onClick={() =>
                             navigate('/canvas')
                             // (window.location.href = `${import.meta.env.VITE_DOMAIN_URL}/canvas`)
                         }
                    >
                        <BackCanvas height={20} width={20}/>
                    </div>
                    <div className={css.headerLogo}>SAB - TÀI CHÍNH KẾ TOÁN</div>
                    <div className={css.selectGroup}>
                        <CompanySelect />
                        <YearSelect />
                        <KhaiBaoDauKy />
                    </div>
                </div>
                <div className={css.header_right}>
                    <div className={css.navItem}>
                        {smartWarning.length > 0 && (
                            <Dropdown
                                overlayClassName={css.noti_dropdown}
                                menu={{
                                    items: smartWarning,
                                }}
                            >
                                <div className={css.count_content}>{smartWarning.length}</div>
                            </Dropdown>
                        )}
                    </div>
                    <Tooltip
                        title={`Token đã dùng: ${botSetting?.setting?.used || 0}/${botSetting?.setting?.limit || 0
                        }`}
                        placement="bottom"
                    >
                        <div style={{width: "30px"}}>
                            <CircularProgressbar
                                value={value}
                                text={`${value}%`}
                                background
                                backgroundPadding={6}
                                styles={buildStyles({
                                    backgroundColor: "#3e98c7",
                                    textColor: "#fff",
                                    pathColor: "#fff",
                                    trailColor: "transparent",
                                    textSize: "30px",
                                })}
                            />
                        </div>
                    </Tooltip>
                    <div className={css.navItem} onClick={toggleSABBotPopup}>
                        <img src={BotIcon} alt=""/>
                        <div className={css.navItemLabel}>SAB Bot</div>
                    </div>
                    <div className={css.navItem} onClick={toggleLogBotPopup}>
                        <img src={BotIcon} alt=""/>
                        <div className={css.navItemLabel}>Log Bot</div>
                    </div>
                    <div
                        className={css.navItem}
                        onClick={(e) => handleChangePath("/accounting/wiki-storage", e)}
                    >
                        <div className={css.navItemLabel}>Kho Wiki</div>
                    </div>
                    <CaiDatMenu
                        setShowCauHinhChotSo={setShowCauHinhChotSo}
                        setShowCauHinhButToan={setShowCauHinhButToan}
                        setShowCauHinhPPTGT={setShowCauHinhPPTGT}
                        setShowWarning={setShowWarning}
                        setShowSetupDK={setShowSetupDK}
                    />
                    <div className={css.username}>
                        <Popover
                            content={contentApprove}
                            title={() => {
                                return (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "25px",
                                        }}
                                    >
                                        <div>Danh sách cần duyệt:</div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                gap: "10px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "25px",
                                                    height: "15px",
                                                    backgroundColor: "#e6f4ff",
                                                    borderRadius: "4px",
                                                    border: "1px solid #91caff",
                                                }}
                                            ></div>
                                            <div>Duyệt 1</div>
                                            <div
                                                style={{
                                                    width: "25px",
                                                    height: "15px",
                                                    backgroundColor: "#fffbe6",
                                                    borderRadius: "4px",
                                                    border: "1px solid #ffe58f",
                                                }}
                                            ></div>
                                            <div>Duyệt 2</div>
                                        </div>
                                    </div>
                                );
                            }}
                            trigger="click"
                        >
                            <Badge
                                count={
                                    dataStepFromCard.filter((step) =>
                                        stepPermissionOfCurrentUser.some((item) => {
                                            if (item.id === step.id) {
                                                if (
                                                    step.status === "pending" &&
                                                    item.permissions.approve1
                                                ) {
                                                    return true;
                                                }
                                                if (
                                                    step.status === "duyet_1" &&
                                                    item.permissions.approve2
                                                ) {
                                                    return true;
                                                }
                                            }
                                            return false;
                                        })
                                    ).length
                                }
                                size="small"
                                offset={[-30, 0]}
                            >
                                <Button
                                    type="text"
                                    shape="circle"
                                    color="default"
                                    variant="filled"
                                    icon={<BellOutlined/>}
                                />
                            </Badge>
                        </Popover>
                        <ProfileSelect/>
                    </div>
                </div>
            </div>

            {showSABBotPopup && (
                <SABBotPopup onClose={() => setShowSABBotPopup(false)}/>
            )}

            {showLogBotPopup && (
                <AuditBotPopup onClose={() => setShowLogBotPopup(false)}/>
            )}

            <CauHinhPPTGT
                showCauHinhPPTGT={showCauHinhPPTGT}
                setShowCauHinhPPTGT={setShowCauHinhPPTGT}
            />
            <CauHinhChotSo
                showCauHinhChotSo={showCauHinhChotSo}
                setShowCauHinhChotSo={setShowCauHinhChotSo}
            />
            <WarningSetup
                showCauHinhChotSo={showWarning}
                setShowCauHinhChotSo={setShowWarning}
            />
            <SetupDKPhieu
                showCauHinhChotSo={showSetupDK}
                setShowCauHinhChotSo={setShowSetupDK}
            />

            <CrossRoadPopup2
                openCrossRoad={isModalOpen}
                onOkCrossRoad={handleOk}
                onCancelCrossRoad={handleCancel}
            />

        </>
    );
}
