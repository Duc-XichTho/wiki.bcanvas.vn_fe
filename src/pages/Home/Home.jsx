import React, { useContext, useEffect, useState } from 'react'
import { Outlet, useLocation } from "react-router-dom";
import Header from '../../components/Header/Header'
import css from "./Home.module.css"
import SideBar from "../../components/Sidebar/SideBar.jsx";
import SideBarNew from "../../components/Sidebar/SideBarNew.jsx";
import { getAllCauHinh } from "../../apis/cauHinhService.jsx";
import { MyContext } from "../../MyContext.jsx";

const Home = () => {
    const location = useLocation();
    const hideSidebarRoutes = ['/accounting/wiki-storage'];
    const shouldShowSidebar = !hideSidebarRoutes.includes(location.pathname);
    const { changeBackgroud, chainTemplate2Selected } = useContext(MyContext);

    const getLocalStorageSettings = () => {
        const storedSettings = JSON.parse(localStorage.getItem("StatusSidebar"));
        return {
            isPinSideBar: storedSettings?.isPinSideBar ?? true,
        };
    };
    const [isPinSideBar, setIsPinSideBar] = useState(getLocalStorageSettings().isPinSideBar);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isPinSideBar);


    useEffect(() => {
        const tableSettings = {
            isPinSideBar
        };

        localStorage.setItem("StatusSidebar", JSON.stringify(tableSettings));
    }, [isPinSideBar]);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const togglePinSidebar = () => {
        setIsPinSideBar(!isPinSideBar);
    };

    const [backgroundImage, setBackgroundImage] = useState('');

    useEffect(() => {
        getAllCauHinh().then(data => {
            const backgroundImage = data.find(item => item.field == 'Hình nền')?.chu_thich || '/SABBackground.jpg';
            setBackgroundImage(backgroundImage);
        })
    }, [changeBackgroud]); // useEffect chỉ chạy một lần khi component mount


    return (
        <div className={css.container}>
            <div className={css.header}>
                <Header />
            </div>
            <div className={css.main}>
                {shouldShowSidebar && (
                    <div className={`${css.sidebar} ${isSidebarCollapsed ? css.sidebarCollapsed : ''}`}>
                        <SideBarNew
                            isCollapsed={isSidebarCollapsed}
                            isPinSideBar={isPinSideBar}
                            onToggle={toggleSidebar}
                            togglePinSidebar={togglePinSidebar}
                        />
                    </div>
                )}
                <div className={`${css.content} ${isSidebarCollapsed ? css.contentExpanded : ''}`}
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                >
                    
                    <Outlet />
                </div>

            </div>
        </div>
    )
}

export default Home