import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2,
  Eye
} from 'lucide-react';
import VotacaoChart from '@/components/charts/VotacaoChart';
import MapaRegional from '@/components/maps/MapaRegional';
import RankingTable from '@/components/tables/RankingTable';

interface Candidato {
  id: string;
  nome: string;
  numero: number | null;
  foto_url: string | null;
}

const PresidenteDashboard = () => {
  const { profile } = useAuth();
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [candidatoSelecionado, setCandidatoSelecionado] = useState<string>('');
  const [dadosVotacao, setDadosVotacao] = useState<any[]>([]);
  const [partidoInfo, setPartidoInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartidoData();
  }, [profile]);

  useEffect(() => {
    if (candidatoSelecionado) {
      fetchVotacaoData();
    }
  }, [candidatoSelecionado]);

  const fetchPartidoData = async () => {
    if (!profile?.user_id) return;

    try {
      // Buscar o candidato associado ao usuário presidente
      const { data: candidatoPresidente } = await supabase
        .from('candidatos')
        .select('partido_id, partidos (id, nome, sigla)')
        .eq('user_id', profile.user_id)
        .single();

      if (candidatoPresidente?.partidos) {
        setPartidoInfo(candidatoPresidente.partidos);
        
        // Buscar todos os candidatos do partido
        const { data: candidatosPartido } = await supabase
          .from('candidatos')
          .select('id, nome, numero, foto_url')
          .eq('partido_id', candidatoPresidente.partidos.id)
          .eq('ativo', true)
          .order('nome');

        setCandidatos(candidatosPartido || []);
        
        // Selecionar o primeiro candidato por padrão
        if (candidatosPartido && candidatosPartido.length > 0) {
          setCandidatoSelecionado(candidatosPartido[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do partido:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVotacaoData = async () => {
    if (!candidatoSelecionado) return;

    try {
      const { data: votacao } = await supabase
        .from('votacao')
        .select(`
          *,
          bairros (nome, regionais (nome)),
          regionais (nome),
          zonas_eleitorais (numero, nome)
        `)
        .eq('candidato_id', candidatoSelecionado)
        .order('ano_eleicao', { ascending: false });

      setDadosVotacao(votacao || []);
    } catch (error) {
      console.error('Erro ao carregar dados de votação:', error);
    }
  };

  const calculateStats = () => {
    const totalVotos = dadosVotacao.reduce((sum, item) => sum + item.votos, 0);
    const totalEleitores = dadosVotacao.reduce((sum, item) => sum + (item.eleitores_aptos || 0), 0);
    const aproveitamento = totalEleitores > 0 ? (totalVotos / totalEleitores * 100) : 0;
    
    const votosPorRegional = dadosVotacao.reduce((acc, item) => {
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
      <DashboardLayout title="Dashboard do Presidente">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!partidoInfo || candidatos.length === 0) {
    return (
      <DashboardLayout title="Dashboard do Presidente">
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum candidato encontrado</h3>
            <p className="text-muted-foreground">
              Não há candidatos cadastrados para seu partido ainda.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const stats = calculateStats();
  const candidatoAtual = candidatos.find(c => c.id === candidatoSelecionado);

  return (
    <DashboardLayout title="Dashboard do Presidente">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              {partidoInfo.sigla} - {partidoInfo.nome}
            </h2>
            <p className="text-muted-foreground">
              Visualize os dados de todos os candidatos do seu partido
            </p>
          </div>
        </div>

        {/* Candidate Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Selecionar Candidato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={candidatoSelecionado} onValueChange={setCandidatoSelecionado}>
                <SelectTrigger className="w-80">
                  <SelectValue placeholder="Selecione um candidato" />
                </SelectTrigger>
                <SelectContent>
                  {candidatos.map((candidato) => (
                    <SelectItem key={candidato.id} value={candidato.id}>
                      <div className="flex items-center gap-2">
                        {candidato.foto_url && (
                          <img 
                            src={candidato.foto_url} 
                            alt={candidato.nome}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <span>
                          {candidato.nome}
                          {candidato.numero && ` (${candidato.numero})`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {candidatoAtual && (
                <div className="flex items-center gap-3">
                  {candidatoAtual.foto_url && (
                    <img 
                      src={candidatoAtual.foto_url} 
                      alt={candidatoAtual.nome}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <div className="font-semibold">{candidatoAtual.nome}</div>
                    {candidatoAtual.numero && (
                      <div className="text-sm text-muted-foreground">
                        Número: {candidatoAtual.numero}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {candidatoSelecionado && (
          <>
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
                      <Users className="w-6 h-6 text-warning" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">{candidatos?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Candidatos do Partido</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-accent" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">{stats.regioesMapeadas}</div>
                      <div className="text-sm text-muted-foreground">Regiões Ativas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Maps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
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
                <CardTitle className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Ranking Detalhado por Regional
                  </div>
                  <Button variant="hero" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Relatório Completo
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RankingTable data={stats.rankingRegionais} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PresidenteDashboard;