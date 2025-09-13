import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Vote, 
  Building2, 
  MapPin, 
  Upload, 
  FileText,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import PartidosManager from '@/components/admin/PartidosManager';
import CandidatosManager from '@/components/admin/CandidatosManager';
import UsuariosManager from '@/components/admin/UsuariosManager';
import GeografiaManager from '@/components/admin/GeografiaManager';
import UploadVotacao from '@/components/admin/UploadVotacao';
import RelatoriosManager from '@/components/admin/RelatoriosManager';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    {
      title: 'Total de Candidatos',
      value: '24',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Partidos Ativos',
      value: '8',
      icon: Building2,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Votos Processados',
      value: '156.8K',
      icon: Vote,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      title: 'Regionais Mapeadas',
      value: '12',
      icon: MapPin,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    }
  ];

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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="partidos">Partidos</TabsTrigger>
            <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="geografia">Geografia</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    onClick={() => setActiveTab('upload')}
                  >
                    <Upload className="w-8 h-8" />
                    Upload Votação
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
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm">Upload de votação processado - Eleição 2024</span>
                    <span className="text-xs text-muted-foreground ml-auto">há 2 horas</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm">Novo candidato cadastrado - João Silva</span>
                    <span className="text-xs text-muted-foreground ml-auto">há 5 horas</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span className="text-sm">Relatório gerado - Análise Regional</span>
                    <span className="text-xs text-muted-foreground ml-auto">ontem</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partidos">
            <PartidosManager />
          </TabsContent>

          <TabsContent value="candidatos">
            <CandidatosManager />
          </TabsContent>

          <TabsContent value="usuarios">
            <UsuariosManager />
          </TabsContent>

          <TabsContent value="geografia">
            <GeografiaManager />
          </TabsContent>

          <TabsContent value="upload">
            <UploadVotacao />
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