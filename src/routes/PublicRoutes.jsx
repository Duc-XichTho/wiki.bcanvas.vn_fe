import { Route } from 'react-router-dom';
import PublicRoute from '../PublicRoute';
import Login from '../pages/Login/Login';
import { ROUTES } from '../CONST';
import DocumentShare from '../pages/Share/DocumentShare/DocumentShare';

export const PublicRoutes = (
  <Route element={<PublicRoute />}>
    <Route path={ROUTES.LOGIN} element={<Login />} />
    <Route path={'/login'} element={<Login />} />
    <Route path={ROUTES.HOME_PAGE} element={<Login />} />
    <Route path={'/share/document/:id'} element={<DocumentShare />} />
  </Route>
);
