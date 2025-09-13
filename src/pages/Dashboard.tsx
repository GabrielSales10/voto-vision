import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import PresidenteDashboard from '@/components/dashboard/PresidenteDashboard';
import CandidatoDashboard from '@/components/dashboard/CandidatoDashboard';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  // Render dashboard based on user role
  switch (profile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'presidente':
      return <PresidenteDashboard />;
    case 'candidato':
      return <CandidatoDashboard />;
    default:
      return <Navigate to="/auth" replace />;
  }
};

export default Dashboard;