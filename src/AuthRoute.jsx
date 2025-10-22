import './index.css';
import { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import NotAuthorized from './pages/HTTPStatus/NotAuthorized';
import { Spin } from 'antd';
import { getCurrentUserLogin } from './apis/userService';
import { checkMobile } from './generalFunction/checkMobile.js';
import css from './AuthRoute.module.css'; // Import CSS Module
import Loading3DTower from './components/Loading3DTower';
import TaskChecklistModal from './components/TaskChecklistModal/TaskChecklistModal';
import { HelpCircle as QuestionMark } from 'lucide-react';
import { OpenTaskCheckList } from './icon/svg/IconSvg.jsx';

const AuthRoute = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [showTaskChecklistModal, setShowTaskChecklistModal] = useState(() => {
        try {
            return localStorage.getItem('taskChecklistModalOpen') === 'true';
        } catch {
            return false;
        }
    });
    const [taskChecklistRefreshTrigger, setTaskChecklistRefreshTrigger] = useState(0);
    const location = useLocation();

	const fetchCurrentUserLogin = async () => {
		setIsLoading(true);
		try {
			const { data } = await getCurrentUserLogin();
			if (data) {
				setCurrentUser(data);
			}
		} catch (error) {
			console.error('Error fetching current user:', error);
		} finally {
			setTimeout(() => {
				setIsLoading(false);
			}, 500);
		}
	};

	useEffect(() => {
		fetchCurrentUserLogin();
	}, []);

	// Listen for task checklist refresh events
	useEffect(() => {
		const handleTaskChecklistRefresh = () => {
			setTaskChecklistRefreshTrigger(prev => prev + 1);
		};

		window.addEventListener('taskChecklistRefresh', handleTaskChecklistRefresh);
		
		return () => {
			window.removeEventListener('taskChecklistRefresh', handleTaskChecklistRefresh);
		};
	}, []);

	if (isLoading) {
		return (
			<div
				style={{
					width: '100vw',
					height: '100vh',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<Loading3DTower />
			</div>
		);
	}

	// if (!currentUser?.email) {

	// 	const isFormTemplateRoute = /^\/form-template\/\d+$/.test(location.pathname);

	// 	if (isFormTemplateRoute) {
	// 		return <Navigate to={location.pathname} replace />;
	// 	} else {
	// 		return <Navigate to='/' replace />;
	// 	}
	// }

	const ROUTES_CUA_VUA = ['/admin'];

	const isVua = ROUTES_CUA_VUA.includes(location.pathname);
	if (isVua && !currentUser.isAdmin) {
		return <NotAuthorized />;
	}

    const isMobile = checkMobile();
    const isMobileDashboard = /^\/dashboard(\/[^/]+)?$/.test(location.pathname);
    
    const APPS_WITH_TASK_CHECKLIST = new Set(['dashboard', 'data-manager', 'metric-map', 'analysis-review', 'khkd', 'process-guide' , 'adminApp']);
    const firstSegment = location.pathname.split('/')[1];
    const canShowTaskChecklist = APPS_WITH_TASK_CHECKLIST.has(firstSegment);

    return (
        <div className='zoomIn' >
            <Outlet />
            {canShowTaskChecklist && (
                <>
                {!showTaskChecklistModal && (
                    <button
                        onClick={() => {
                            setShowTaskChecklistModal(true);
                            try { localStorage.setItem('taskChecklistModalOpen', 'true'); } catch {}
                        }}
                        style={{
                            position: 'fixed',
                            bottom: '20px',
                            right: '20px',
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            color: '#1890ff',
                            background: '#f0f8ff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            transition: 'all 0.2s ease',
                            zIndex: 1000,
                        }}
                        title="Task Checklist"
                    >
						<OpenTaskCheckList width={35} height={35}/>
                        {/*<QuestionMark size={18} />*/}
                    </button>
                )
            }
                    {showTaskChecklistModal && (
                        <TaskChecklistModal
                            isOpen={showTaskChecklistModal}
                            onClose={() => {
                                setShowTaskChecklistModal(false);
                                try { localStorage.setItem('taskChecklistModalOpen', 'false'); } catch {}
                            }}
                            showScrollButton={false}
                            refreshTrigger={taskChecklistRefreshTrigger}
                        />
                    )}
                </>
            )}

        </div>
    );
};

export default AuthRoute;