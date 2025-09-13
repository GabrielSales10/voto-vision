import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  Award,
  Users,
  Eye
} from 'lucide-react';
import VotacaoChart from '@/components/charts/VotacaoChart';
import MapaRegional from '@/components/maps/MapaRegional';
import RankingTable from '@/components/tables/RankingTable';

interface VotacaoData {
  id: string;
  votos: number;
  eleitores_aptos: number;
  ano_eleicao: number;
  turno: number;
  bairros: { nome: string; regionais: { nome: string } | null } | null;
  regionais: { nome: string } | null;
  zonas_eleitorais: { numero: number; nome: string | null };
}

const CandidatoDashboard = () => {
  const { profile } = useAuth();
  const [votacaoData, setVotacaoData] = useState<VotacaoData[]>([]);
  const [candidatoInfo, setCandidatoInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidatoData();
  }, [profile]);

  const fetchCandidatoData = async () => {
    if (!profile?.user_id) return;

    try {
      // Buscar dados do candidato
      const { data: candidato } = await supabase
        .from('candidatos')
        .select(`
          *,
          partidos (nome, sigla)
        `)
        .eq('user_id', profile.user_id)
        .single();

      setCandidatoInfo(candidato);

      if (candidato) {
        // Buscar dados de votação
        const { data: votacao } = await supabase
          .from('votacao')
          .select(`
            *,
            bairros (nome, regionais (nome)),
            regionais (nome),
            zonas_eleitorais (numero, nome)
          `)
          .eq('candidato_id', candidato.id)
          .order('ano_eleicao', { ascending: false });

        setVotacaoData(votacao || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalVotos = votacaoData.reduce((sum, item) => sum + item.votos, 0);
    const totalEleitores = votacaoData.reduce((sum, item) => sum + (item.eleitores_aptos || 0), 0);
    const aproveitamento = totalEleitores > 0 ? (totalVotos / totalEleitores * 100) : 0;
    
    // Agrupar por regional para ranking
    const votosPorRegional = votacaoData.reduce((acc, item) => {
      const regional = item.regionais?.nome || item.bairros?.regionais?.nome || 'Sem Regional';
      acc[regional] = (acc[regional] || 0) + item.votos;
      return acc;
    }, {} as Record<string, number>);

    const rankingRegionais = Object.entries(votosPorRegional)
      .map(([nome, votos]) => ({ nome, votos: Number(votos) }))
      .sort((a, b) => b.votos - a.votos);

    return {
      totalVotos,
      totalEleitores,
      aproveitamento: aproveitamento.toFixed(1),
      rankingRegionais,
      regioesMapeadas: rankingRegionais.length
    };
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard do Candidato">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!candidatoInfo) {
    return (
      <DashboardLayout title="Dashboard do Candidato">
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Perfil não encontrado</h3>
            <p className="text-muted-foreground">
              Você ainda não foi cadastrado como candidato. Entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const stats = calculateStats();

  return (
    <DashboardLayout title="Dashboard do Candidato">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {candidatoInfo.foto_url && (
              <img 
                src={candidatoInfo.foto_url} 
                alt={candidatoInfo.nome}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h2 className="text-3xl font-bold text-foreground">{candidatoInfo.nome}</h2>
              <p className="text-muted-foreground">
                {candidatoInfo.partidos?.sigla} - {candidatoInfo.partidos?.nome}
                {candidatoInfo.numero && ` • Número: ${candidatoInfo.numero}`}
              </p>
            </div>
          </div>
          <Button variant="hero">
            <Eye className="w-4 h-4 mr-2" />
            Ver Relatório Completo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">
                    {stats.totalVotos.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total de Votos</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{stats.aproveitamento}%</div>
                  <div className="text-sm text-muted-foreground">Aproveitamento</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-warning" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{stats.regioesMapeadas}</div>
                  <div className="text-sm text-muted-foreground">Regiões Ativas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-accent" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">
                    #{stats.rankingRegionais.findIndex(r => r.votos === Math.max(...stats.rankingRegionais.map(r => r.votos))) + 1}
                  </div>
                  <div className="text-sm text-muted-foreground">Posição Geral</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Votação Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance por Regional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VotacaoChart data={stats.rankingRegionais} />
            </CardContent>
          </Card>

          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Mapa de Intensidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MapaRegional data={stats.rankingRegionais} />
            </CardContent>
          </Card>
        </div>

        {/* Ranking Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Ranking Detalhado por Regional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RankingTable data={stats.rankingRegionais} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CandidatoDashboard;