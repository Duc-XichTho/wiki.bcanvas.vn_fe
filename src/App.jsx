import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { PublicRoutes as FULL_HD_KHONG_CHE } from "./routes/PublicRoutes";
import { AuthRoutes as FULL_HD_CO_CHE } from "./routes/AuthRoutes";
import NotFoundPage from "./pages/HTTPStatus/NotFoundPage";
import { useState } from 'react';
import './styles/theme.css';
import './styles/message.css';
import './styles/antd-message-override.css';
// import '@syncfusion/ej2-base/styles/material.css';
// import '@syncfusion/ej2-buttons/styles/material.css';
// import '@syncfusion/ej2-inputs/styles/material.css';
// import '@syncfusion/ej2-popups/styles/material.css';
// import '@syncfusion/ej2-lists/styles/material.css';
// import '@syncfusion/ej2-navigations/styles/material.css';
// import '@syncfusion/ej2-splitbuttons/styles/material.css';
// import '@syncfusion/ej2-react-richtexteditor/styles/material.css';
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import KeyboardShortcut from "./components/KeyboardShortcut.jsx";
import { startPolling } from "./apisKTQT/soketoanService2.jsx";
import HomeTemplateLink from './pages/Canvas/Daas/Content/Template/TemplateForm/TemplateFormLink/HomeTemplateLink.jsx';
import { checkMobile } from "./generalFunction/checkMobile.js";
import MessageProvider from './components/MessageProvider.jsx';
import AuthRoutesSuperAdmin from "./routes/AuthRoutesSuperAdmin.jsx";
import AdminPath from "./pages/AdminPath/AdminPath.jsx";
import MetricMapPublic from "./pages/MetricMap/MetricMapPublic.jsx";
import ProposalPublic from "./pages/ProposalMaker/ProposalPublic.jsx";
import WorkspaceRegistration from "./pages/WorkspaceRegistration/WorkspaceRegistration.jsx";


const App = () => {
    const { listCompany } = useContext(MyContext);
    const location = useLocation();
    const isMobile = checkMobile();



    useEffect(() => {
        if (!location.pathname.includes('/adminApp')) {
            localStorage.setItem('prePath', location.pathname);
        }
    }, [location.pathname]);


    return (
        <MessageProvider>
            <KeyboardShortcut />
            <Routes>
                {FULL_HD_KHONG_CHE}
                {FULL_HD_CO_CHE({ listCompany, isMobile })}
                <Route path="form-template/:id" element={<HomeTemplateLink />} />
                <Route path="metric/:id" element={<MetricMapPublic />} />
                <Route path="proposal/:id" element={<ProposalPublic />} />
                <Route path="workspace-registration" element={<WorkspaceRegistration />} />
                <Route path="*" element={<NotFoundPage />} />
                <Route element={<AuthRoutesSuperAdmin />} >
                    <Route path="/admin-path" element={<AdminPath />} />
                </Route>

            </Routes>
        </MessageProvider>
    );
};

export default App;
