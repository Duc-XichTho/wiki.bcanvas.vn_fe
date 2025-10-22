import {Outlet} from "react-router-dom";
import css from "./WorkFlow.module.css"
import * as React from "react";
import {useEffect, useState} from "react";
import Header from "./Components/Header/Header";
import SideBarWorkFlow from "../../components/Sidebar/SideBarWorkFlow.jsx";

const WorkFlow = () => {

    const hideSidebarRoutes = ['/accounting/wiki-storage'];
    const shouldShowSidebar = !hideSidebarRoutes.includes(location.pathname);

    const getLocalStorageSettings = () => {
        const storedSettings = JSON.parse(localStorage.getItem("StatusSidebarWorkFlow"));
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

        localStorage.setItem("StatusSidebarWorkFlow", JSON.stringify(tableSettings));
    }, [isPinSideBar]);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const togglePinSidebar = () => {
        setIsPinSideBar(!isPinSideBar);
    };


    return (
        <div className={css.main}>
            <div className={css.header}>
                <Header/>
            </div>
            <div className={css.body}>
                {shouldShowSidebar && (
                    <div className={`${css.sidebar} ${isSidebarCollapsed ? css.sidebarCollapsed : ''}`}>
                        <SideBarWorkFlow
                            isCollapsed={isSidebarCollapsed}
                            isPinSideBar={isPinSideBar}
                            onToggle={toggleSidebar}
                            togglePinSidebar={togglePinSidebar}/>
                    </div>
                )}
                <div className={`${css.content} ${isSidebarCollapsed ? css.contentExpanded : ''}`}>
                    <Outlet/>
                </div>
            </div>

        </div>
    )
}

export default WorkFlow