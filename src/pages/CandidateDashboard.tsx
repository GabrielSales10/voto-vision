import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  MapPin, 
  TrendingUp, 
  BarChart3, 
  Download, 
  Filter,
  Trophy,
  Target,
  Zap,
  Calendar,
  Users,
  Building2
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface Candidate {
  id: string;
  nome: string;
  numero: number;
  foto_url: string | null;
  partidos: {
    nome: string;
    sigla: string;
  };
}

interface VoteData {
  bairro_nome: string;
  votos: number;
  percentual_votos: number;
  cidade: string;
  regional_id?: string;
  ano?: number;
}

interface KPIData {
  totalVotes: number;
  totalNeighborhoods: number;
  totalCities: number;
  concentration: number;
  averagePerNeighborhood: number;
}

const CandidateDashboard = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [voteData, setVoteData] = useState<VoteData[]>([]);
  const [filteredData, setFilteredData] = useState<VoteData[]>([]);
  const [kpis, setKPIs] = useState<KPIData>({
    totalVotes: 0,
    totalNeighborhoods: 0,
    totalCities: 0,
    concentration: 0,
    averagePerNeighborhood: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>(searchParams.get('year') || '2024');
  const [selectedRegionals, setSelectedRegionals] = useState<string[]>(
    searchParams.get('regionais')?.split(',').filter(Boolean) || []
  );
  const [selectedCities, setSelectedCities] = useState<string[]>(
    searchParams.get('cidades')?.split(',').filter(Boolean) || []
  );
  const [minVotes, setMinVotes] = useState<string>(searchParams.get('minVotos') || '0');
  const [topN, setTopN] = useState<string>(searchParams.get('topN') || '10');

  // Filter options
  const [regionais, setRegionais] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    if (candidateId) {
      fetchCandidateData();
      fetchFilterOptions();
    }
  }, [candidateId]);

  useEffect(() => {
    if (voteData.length > 0) {
      applyFilters();
    }
  }, [voteData, selectedYear, selectedRegionals, selectedCities, minVotes, topN]);

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    if (selectedYear !== '2024') params.set('year', selectedYear);
    if (selectedRegionals.length > 0) params.set('regionais', selectedRegionals.join(','));
    if (selectedCities.length > 0) params.set('cidades', selectedCities.join(','));
    if (minVotes !== '0') params.set('minVotos', minVotes);
    if (topN !== '10') params.set('topN', topN);
    
    setSearchParams(params, { replace: true });
  }, [selectedYear, selectedRegionals, selectedCities, minVotes, topN, setSearchParams]);

  const fetchCandidateData = async () => {
    if (!candidateId) return;

    try {
      // Get candidate info
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidatos')
        .select(`
          id,
          nome,
          numero,
          foto_url,
          partidos(nome, sigla)
        `)
        .eq('id', candidateId)
        .single();

      if (candidateError) throw candidateError;
      setCandidate(candidateData);

      // Get vote data
      const { data: voteData, error: voteError } = await supabase
        .from('candidate_bairros')
        .select('*')
        .eq('candidato_id', candidateId)
        .order('votos', { ascending: false });

      if (voteError) throw voteError;
      setVoteData(voteData || []);

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do candidato.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Get regionais
      const { data: regionaisData } = await supabase
        .from('regionais')
        .select('id, nome, sigla')
        .eq('ativo', true)
        .order('nome');

      setRegionais(regionaisData || []);

      // Get unique cities and years from vote data
      const { data: voteData } = await supabase
        .from('candidate_bairros')
        .select('cidade, ano')
        .eq('candidato_id', candidateId)
        .not('cidade', 'is', null);

      const uniqueCities = [...new Set(voteData?.map(v => v.cidade).filter(Boolean))];
      const uniqueYears = [...new Set(voteData?.map(v => v.ano).filter(Boolean))];

      setCities(uniqueCities);
      setYears(uniqueYears.sort((a, b) => b - a));

    } catch (error) {
      console.error('Erro ao carregar opções de filtro:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...voteData];

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter(item => item.ano?.toString() === selectedYear);
    }

    // Filter by cities
    if (selectedCities.length > 0) {
      filtered = filtered.filter(item => item.cidade && selectedCities.includes(item.cidade));
    }

    // Filter by minimum votes
    const minVotesNum = parseInt(minVotes) || 0;
    filtered = filtered.filter(item => (item.votos || 0) >= minVotesNum);

    // Apply top N limit
    const topNNum = parseInt(topN) || 10;
    filtered = filtered.slice(0, topNNum);

    setFilteredData(filtered);

    // Calculate KPIs
    const totalVotes = filtered.reduce((sum, item) => sum + (item.votos || 0), 0);
    const totalNeighborhoods = filtered.length;
    const totalCities = new Set(filtered.map(item => item.cidade).filter(Boolean)).size;
    const averagePerNeighborhood = totalNeighborhoods > 0 ? totalVotes / totalNeighborhoods : 0;
    
    // Calculate concentration (top 20% of neighborhoods contribute what % of votes)
    const sortedByVotes = [...filtered].sort((a, b) => (b.votos || 0) - (a.votos || 0));
    const top20Percent = Math.ceil(sortedByVotes.length * 0.2);
    const top20Votes = sortedByVotes.slice(0, top20Percent).reduce((sum, item) => sum + (item.votos || 0), 0);
    const concentration = totalVotes > 0 ? (top20Votes / totalVotes) * 100 : 0;

    setKPIs({
      totalVotes,
      totalNeighborhoods,
      totalCities,
      concentration,
      averagePerNeighborhood
    });
  };

  const handleClearFilters = () => {
    setSelectedYear('2024');
    setSelectedRegionals([]);
    setSelectedCities([]);
    setMinVotes('0');
    setTopN('10');
  };

  const exportData = (format: 'csv' | 'png') => {
    if (format === 'csv') {
      const csv = [
        ['Bairro', 'Cidade', 'Votos', 'Percentual'],
        ...filteredData.map(item => [
          item.bairro_nome,
          item.cidade || '',
          item.votos?.toString() || '0',
          item.percentual_votos?.toString() || '0'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${candidate?.nome}_votos_${selectedYear}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    toast({
      title: "Exportação",
      description: `Dados exportados em formato ${format.toUpperCase()}`,
    });
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">Candidato não encontrado</h2>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const top10Data = filteredData.slice(0, 10).map(item => ({
    name: item.bairro_nome.length > 15 ? item.bairro_nome.substring(0, 15) + '...' : item.bairro_nome,
    votos: item.votos || 0,
    fullName: item.bairro_nome
  }));

  const cityData = cities.map(city => {
    const cityVotes = filteredData.filter(item => item.cidade === city).reduce((sum, item) => sum + (item.votos || 0), 0);
    return { name: city, votos: cityVotes };
  }).filter(item => item.votos > 0).sort((a, b) => b.votos - a.votos);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Filters Sidebar */}
        <Sidebar className="w-80 border-r bg-muted/20">
          <SidebarTrigger className="m-4" />
          <SidebarContent className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    Limpar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
                    <Download className="w-4 h-4 mr-1" />
                    CSV
                  </Button>
                </div>
              </div>
              
              <Separator />

              {/* Year Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Ano da Eleição
                </Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cities Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Cidades
                </Label>
                <ScrollArea className="h-32 w-full border rounded p-2">
                  {cities.map(city => (
                    <div key={city} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={city}
                        checked={selectedCities.includes(city)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCities([...selectedCities, city]);
                          } else {
                            setSelectedCities(selectedCities.filter(c => c !== city));
                          }
                        }}
                      />
                      <Label htmlFor={city} className="text-sm">{city}</Label>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              {/* Minimum Votes Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Votos Mínimos
                </Label>
                <Input
                  type="number"
                  value={minVotes}
                  onChange={(e) => setMinVotes(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>

              {/* Top N Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Top N Bairros
                </Label>
                <Select value={topN} onValueChange={setTopN}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Top 5</SelectItem>
                    <SelectItem value="10">Top 10</SelectItem>
                    <SelectItem value="20">Top 20</SelectItem>
                    <SelectItem value="50">Top 50</SelectItem>
                    <SelectItem value="100">Top 100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                <AvatarImage src={candidate.foto_url || ''} alt={candidate.nome} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                  {getInitials(candidate.nome)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{candidate.nome}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-primary/5">
                    {candidate.numero}
                  </Badge>
                  <Badge variant="secondary">
                    {candidate.partidos.sigla}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>Dados filtrados: {filteredData.length} bairros</div>
              <div>Ano: {selectedYear}</div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Total de Votos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {kpis.totalVotes.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-success/5 to-success/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Bairros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{kpis.totalNeighborhoods}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-warning/5 to-warning/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Cidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{kpis.totalCities}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/5 to-accent/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Média/Bairro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">
                  {Math.round(kpis.averagePerNeighborhood)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Concentração
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {kpis.concentration.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Neighborhoods Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Top {topN} Bairros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={top10Data} layout="horizontal">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} votos`,
                        props.payload?.fullName || name
                      ]}
                    />
                    <Bar dataKey="votos" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cities Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Distribuição por Cidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={cityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="votos"
                    >
                      {cityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} votos`, 'Votos']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Detalhamento por Bairro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Posição</th>
                      <th className="text-left p-2">Bairro</th>
                      <th className="text-left p-2">Cidade</th>
                      <th className="text-right p-2">Votos</th>
                      <th className="text-right p-2">Percentual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item, index) => (
                      <tr key={`${item.bairro_nome}-${item.cidade}`} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                        </td>
                        <td className="p-2 font-medium">{item.bairro_nome}</td>
                        <td className="p-2 text-muted-foreground">{item.cidade}</td>
                        <td className="p-2 text-right font-mono">{(item.votos || 0).toLocaleString()}</td>
                        <td className="p-2 text-right font-mono">{(item.percentual_votos || 0).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CandidateDashboard;