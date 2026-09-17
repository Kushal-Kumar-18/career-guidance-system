import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Client-side gate only — the real protection is requireAdmin on the
// backend routes this page calls. This just avoids showing a normal
// user a page that will immediately 403 on every request.
export default function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}
