import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Eye, Calendar, User } from 'lucide-react';

interface Candidato {
  id: string;
  nome: string;
  numero: number | null;
  partidos: {
    sigla: string;
    nome: string;
  };
}

const RelatoriosManager = () => {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [candidatoSelecionado, setCandidatoSelecionado] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCandidatos();
  }, []);

  const fetchCandidatos = async () => {
    try {
      const { data, error } = await supabase
        .from('candidatos')
        .select(`
          id,
          nome,
          numero,
          partidos (sigla, nome)
        `)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setCandidatos(data || []);
    } catch (error) {
      console.error('Erro ao carregar candidatos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os candidatos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type: 'resumo' | 'completo' | 'estrategico') => {
    if (!candidatoSelecionado) {
      toast({
        title: "Atenção",
        description: "Selecione um candidato primeiro.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    // Simular geração do relatório
    setTimeout(() => {
      setGenerating(false);
      toast({
        title: "Relatório gerado!",
        description: `Relatório ${type} foi gerado com sucesso.`,
      });
    }, 2000);
  };

  const reportTypes = [
    {
      id: 'resumo',
      title: 'Relatório Resumo',
      description: 'Visão geral dos resultados principais, rankings e mapas básicos',
      icon: FileText,
      color: 'primary'
    },
    {
      id: 'completo',
      title: 'Relatório Completo', 
      description: 'Análise detalhada com todos os gráficos, tabelas e comparações',
      icon: Download,
      color: 'success'
    },
    {
      id: 'estrategico',
      title: 'Relatório Estratégico',
      description: 'Sugestões de ações, análise de oportunidades e recomendações',
      icon: Eye,
      color: 'warning'
    }
  ];

  const mockRecentReports = [
    {
      id: 1,
      candidato: 'João Silva',
      tipo: 'Completo',
      data: '2024-01-15',
      status: 'Concluído'
    },
    {
      id: 2,
      candidato: 'Maria Santos',
      tipo: 'Resumo',
      data: '2024-01-14',
      status: 'Concluído'
    },
    {
      id: 3,
      candidato: 'Pedro Costa',
      tipo: 'Estratégico',
      data: '2024-01-13',
      status: 'Concluído'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generate Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerar Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Candidate Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione o Candidato</label>
            <Select value={candidatoSelecionado} onValueChange={setCandidatoSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um candidato para gerar o relatório" />
              </SelectTrigger>
              <SelectContent>
                {candidatos.map((candidato) => (
                  <SelectItem key={candidato.id} value={candidato.id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>
                        {candidato.nome} 
                        {candidato.numero && ` (${candidato.numero})`}
                        {" - " + candidato.partidos.sigla}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Report Types */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportTypes.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`w-12 h-12 rounded-lg bg-${report.color}/10 flex items-center justify-center`}>
                      <report.icon className={`w-6 h-6 text-${report.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{report.title}</h3>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                    <Button
                      onClick={() => generateReport(report.id as any)}
                      disabled={!candidatoSelecionado || generating}
                      className="w-full"
                      variant={report.color === 'primary' ? 'default' : 'outline'}
                    >
                      {generating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Gerar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Relatórios Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockRecentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium">{report.candidato}</div>
                    <div className="text-sm text-muted-foreground">
                      Relatório {report.tipo} • {new Date(report.data).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">{report.status}</Badge>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatoriosManager;