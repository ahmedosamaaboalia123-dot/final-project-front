import { Navigate } from 'react-router-dom';

export const authRoutes = {
  path: '/login',
  element: <Navigate to="/admin/dashboard" replace />,
};
