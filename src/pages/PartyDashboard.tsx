import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Users, TrendingUp, BarChart3, Eye } from 'lucide-react';

interface Candidate {
  id: string;
  nome: string;
  numero: number;
  foto_url: string | null;
  partidos: {
    nome: string;
    sigla: string;
  };
  _count?: {
    votos: number;
  };
}

const PartyDashboard = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [partyName, setPartyName] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPartyCandidates();
  }, [user]);

  const fetchPartyCandidates = async () => {
    if (!user) return;

    try {
      // Get party ID from user access
      const { data: partyAccess } = await supabase
        .from('user_party_access')
        .select('party_id, partidos(nome, sigla)')
        .eq('user_id', user.id)
        .single();

      if (!partyAccess) {
        toast({
          title: "Erro",
          description: "Acesso ao partido não encontrado.",
          variant: "destructive",
        });
        return;
      }

      setPartyName(`${partyAccess.partidos.nome} (${partyAccess.partidos.sigla})`);

      // Get candidates from the party
      const { data: candidatesData, error } = await supabase
        .from('candidatos')
        .select(`
          id,
          nome,
          numero,
          foto_url,
          partidos(nome, sigla)
        `)
        .eq('partido_id', partyAccess.party_id)
        .eq('ativo', true)
        .order('numero');

      if (error) throw error;

      // Get vote counts for each candidate
      const candidatesWithVotes = await Promise.all(
        (candidatesData || []).map(async (candidate) => {
          const { data: voteData } = await supabase
            .from('candidate_bairros')
            .select('votos')
            .eq('candidato_id', candidate.id);

          const totalVotes = voteData?.reduce((sum, item) => sum + (item.votos || 0), 0) || 0;

          return {
            ...candidate,
            _count: { votos: totalVotes }
          };
        })
      );

      setCandidates(candidatesWithVotes);
    } catch (error: any) {
      console.error('Erro ao carregar candidatos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar candidatos do partido.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewCandidate = (candidateId: string) => {
    navigate(`/candidato/${candidateId}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <DashboardLayout title="Candidatos do Partido">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Candidatos - ${partyName}`}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              {partyName}
            </h2>
            <p className="text-muted-foreground mt-2">
              Acompanhe o desempenho de todos os candidatos do seu partido
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              {candidates.length} candidatos ativos
            </div>
          </div>
        </div>

        {/* Party Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Candidatos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{candidates.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-success/5 to-success/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Votos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {candidates.reduce((sum, c) => sum + (c._count?.votos || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-warning/5 to-warning/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Média por Candidato  
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">
                {candidates.length > 0 
                  ? Math.round(candidates.reduce((sum, c) => sum + (c._count?.votos || 0), 0) / candidates.length).toLocaleString()
                  : '0'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Candidates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate) => (
            <Card 
              key={candidate.id} 
              className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/20"
              onClick={() => handleViewCandidate(candidate.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                    <AvatarImage src={candidate.foto_url || ''} alt={candidate.nome} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {getInitials(candidate.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {candidate.nome}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {candidate.numero && (
                        <Badge variant="outline" className="bg-primary/5 group-hover:bg-primary/10">
                          {candidate.numero}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-primary">
                        {(candidate._count?.votos || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Votos</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <TrendingUp className="w-6 h-6 text-success mx-auto mb-1" />
                      <div className="text-xs text-muted-foreground">Performance</div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewCandidate(candidate.id);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Painéis
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {candidates.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-muted-foreground">
                Nenhum candidato encontrado
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Não há candidatos ativos cadastrados para este partido.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PartyDashboard;