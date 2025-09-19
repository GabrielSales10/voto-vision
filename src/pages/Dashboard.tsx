import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import PresidenteDashboard from '@/components/dashboard/PresidenteDashboard';
import PartyDashboard from '@/pages/PartyDashboard';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkUserAccess = async () => {
      if (!user || !profile) return;

      try {
        // For non-admin users, check their access and redirect accordingly
        if (profile.role === 'presidente') {
          // Presidents see their party candidates
          const { data: partyAccess } = await supabase
            .from('user_party_access')
            .select('party_id')
            .eq('user_id', user.id)
            .single();

          if (partyAccess) {
            setCheckingAccess(false);
            return; // Will render PartyDashboard
          }
        } else if (profile.role === 'candidato') {
          // Candidates go directly to their dashboard
          const { data: candidateAccess } = await supabase
            .from('user_candidate_access')
            .select('candidate_id')
            .eq('user_id', user.id)
            .single();

          if (candidateAccess) {
            navigate(`/candidato/${candidateAccess.candidate_id}`, { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
      }
      
      setCheckingAccess(false);
    };

    if (!loading && user && profile) {
      checkUserAccess();
    }
  }, [user, profile, loading, navigate]);

  if (loading || checkingAccess) {
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
      return <PartyDashboard />;
    case 'candidato':
      // This case should not be reached due to redirect above, but keep as fallback
      return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Redirecionando...</h2>
        </div>
      </div>;
    default:
      return <Navigate to="/auth" replace />;
  }
};

export default Dashboard;
