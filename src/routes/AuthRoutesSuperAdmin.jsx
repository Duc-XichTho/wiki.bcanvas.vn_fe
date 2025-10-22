import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { getCurrentUserLogin } from '../apis/userService';
import NotAuthorized from '../pages/HTTPStatus/NotAuthorized';
import Loading3DTower from '../components/Loading3DTower';
import '../index.css';


export default function AuthRoutesSuperAdmin() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
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

  if (!currentUser?.isSuperAdmin) {
    return <NotAuthorized />;
  }


  return (
    <div className='zoomIn' >
      <Outlet />
    </div>
  );
};

