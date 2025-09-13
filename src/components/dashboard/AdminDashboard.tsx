import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Vote, 
  Building2, 
  MapPin, 
  FileText,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PartidosManager from '@/components/admin/PartidosManager';
import MultiYearCandidateManager from '@/components/admin/MultiYearCandidateManager';
import UsuariosManager from '@/components/admin/UsuariosManager';
import GeografiaManager from '@/components/admin/GeografiaManager';
import RelatoriosManager from '@/components/admin/RelatoriosManager';
import ErrorBoundary from '@/components/dev/ErrorBoundary'; // <= ENVOLVEREMOS A ABA GEOGRAFIA COM ELE

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState([
    {
      title: 'Total de Candidatos',
      value: '0',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Partidos Ativos',
      value: '0',
      icon: Building2,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Votos Processados',
      value: '0',
      icon: Vote,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      title: 'Regionais Mapeadas',
      value: '0',
      icon: MapPin,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    }
  ]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: candidatos } = await supabase.from('candidatos').select('id', { count: 'exact' });
      const { data: partidos } = await supabase.from('partidos').select('id', { count: 'exact' });
      const { data: votacao } = await supabase.from('votacao').select('votos');
      const { data: regionais } = await supabase.from('regionais').select('id', { count: 'exact' });
      
      const totalVotos = votacao?.reduce((sum, v) => sum + (v.votos || 0), 0) || 0;
      
      setStats((prev) => [
        { ...prev[0], value: candidatos?.length?.toString() || '0' },
        { ...prev[1], value: partidos?.length?.toString() || '0' },
        { ...prev[2], value: totalVotos > 1000 ? `${(totalVotos/1000).toFixed(1)}K` : totalVotos.toString() },
        { ...prev[3], value: regionais?.length?.toString() || '0' }
      ]);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  return (
    <DashboardLayout title="Painel Administrativo">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Dashboard Admin</h2>
            <p className="text-muted-foreground">
              Gerencie candidatos, partidos e análises eleitorais
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="partidos">Partidos</TabsTrigger>
            <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="geografia">Geografia</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.title}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col gap-2"
                    onClick={() => setActiveTab('candidatos')}
                  >
                    <Users className="w-8 h-8" />
                    Novo Candidato
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col gap-2"
                    onClick={() => setActiveTab('relatorios')}
                  >
                    <FileText className="w-8 h-8" />
                    Gerar Relatório
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Atividades Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma atividade recente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partidos">
            <PartidosManager />
          </TabsContent>

          <TabsContent value="candidatos">
            <MultiYearCandidateManager />
          </TabsContent>

          <TabsContent value="usuarios">
            <UsuariosManager />
          </TabsContent>

          {/* ABA GEOGRAFIA ENVOLTA POR ERRORBOUNDARY */}
          <TabsContent value="geografia">
            <ErrorBoundary>
              <GeografiaManager />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="relatorios">
            <RelatoriosManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
