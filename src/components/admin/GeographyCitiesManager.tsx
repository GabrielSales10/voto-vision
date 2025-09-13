import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Building, Save, Globe } from 'lucide-react';

interface CityBairro {
  bairro_nome: string;
  count: number;
  regional_id?: string;
  regional_nome?: string;
}

interface City {
  nome: string;
  bairros: CityBairro[];
}

interface Regional {
  id: string;
  nome: string;
}

const GeographyCitiesManager = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [regionais, setRegionais] = useState<Regional[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bairroRegionalMap, setBairroRegionalMap] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar candidatos com seus bairros para extrair as cidades
      const { data: candidatosData, error: candidatosError } = await supabase
        .from('candidatos')
        .select(`
          id,
          nome,
          candidate_bairros!inner (
            bairro_nome,
            regional_id,
            regional:regionais(id, nome)
          )
        `)
        .eq('ativo', true);

      if (candidatosError) throw candidatosError;

      // Criar um mapa de cidades baseado nos bairros dos candidatos
      const cityMap = new Map<string, CityBairro[]>();
      const bairroRegionalMapTemp: Record<string, string> = {};

      candidatosData?.forEach((candidato) => {
        candidato.candidate_bairros?.forEach((bairro: any) => {
          // Inferir cidade do nome do bairro - vamos usar uma lógica simples
          // Em produção, você pode ter uma tabela de mapeamento bairro -> cidade
          let cityName = "Fortaleza"; // Cidade padrão
          
          // Lógica simples para inferir cidade baseada no nome do bairro
          const bairroLower = bairro.bairro_nome.toLowerCase();
          if (bairroLower.includes('recife') || bairroLower.includes('boa viagem') || 
              bairroLower.includes('piedade') || bairroLower.includes('imbiribeira')) {
            cityName = "Recife";
          } else if (bairroLower.includes('salvador') || bairroLower.includes('barra') || 
                     bairroLower.includes('pelourinho') || bairroLower.includes('pituba')) {
            cityName = "Salvador";
          } else if (bairroLower.includes('brasília') || bairroLower.includes('asa norte') || 
                     bairroLower.includes('asa sul') || bairroLower.includes('plano piloto')) {
            cityName = "Brasília";
          }
          
          if (!cityMap.has(cityName)) {
            cityMap.set(cityName, []);
          }

          const cityBairros = cityMap.get(cityName)!;
          const existingBairro = cityBairros.find(b => b.bairro_nome === bairro.bairro_nome);

          if (existingBairro) {
            existingBairro.count++;
            if (bairro.regional_id && !existingBairro.regional_id) {
              existingBairro.regional_id = bairro.regional_id;
              existingBairro.regional_nome = bairro.regional?.nome;
            }
          } else {
            cityBairros.push({
              bairro_nome: bairro.bairro_nome,
              count: 1,
              regional_id: bairro.regional_id || undefined,
              regional_nome: bairro.regional?.nome || undefined
            });
          }

          if (bairro.regional_id) {
            bairroRegionalMapTemp[bairro.bairro_nome] = bairro.regional_id;
          }
        });
      });

      const citiesArray = Array.from(cityMap.entries()).map(([nome, bairros]) => ({
        nome,
        bairros: bairros.sort((a, b) => a.bairro_nome.localeCompare(b.bairro_nome))
      }));

      setCities(citiesArray);
      setBairroRegionalMap(bairroRegionalMapTemp);

      // Buscar regionais disponíveis
      const { data: regionaisData, error: regionaisError } = await supabase
        .from('regionais')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (regionaisError) throw regionaisError;
      setRegionais(regionaisData || []);

    } catch (error: any) {
      toast({ 
        title: "Erro", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegionalChange = (bairroNome: string, regionalId: string) => {
    setBairroRegionalMap(prev => ({
      ...prev,
      [bairroNome]: regionalId
    }));
  };

  const saveChanges = async () => {
    try {
      setSaving(true);

      // Atualizar regionais de todos os bairros com o mesmo nome
      const updatePromises = Object.entries(bairroRegionalMap).map(([bairroNome, regionalId]) => {
        return supabase
          .from('candidate_bairros')
          .update({ regional_id: regionalId || null })
          .eq('bairro_nome', bairroNome);
      });

      const results = await Promise.all(updatePromises);
      
      // Verificar se houve algum erro
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Erro ao atualizar ${errors.length} bairro(s)`);
      }

      toast({
        title: "Sucesso",
        description: "Associações de regionais salvas com sucesso!"
      });

      // Atualizar os dados para refletir as mudanças
      fetchData();

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando dados de geografia...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Geografia Eleitoral - Cidades e Bairros
        </CardTitle>
        <Button onClick={saveChanges} disabled={saving || cities.length === 0}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </CardHeader>
      <CardContent>
        {cities.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma cidade encontrada</h3>
            <p className="text-muted-foreground">
              As cidades e bairros são criados automaticamente quando os candidatos fazem upload dos arquivos CSV.
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {cities.map((city, cityIndex) => (
              <AccordionItem key={city.nome} value={`city-${cityIndex}`}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">{city.nome}</span>
                    <Badge variant="outline">
                      {city.bairros.length} bairro{city.bairros.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bairro</TableHead>
                          <TableHead>Candidatos</TableHead>
                          <TableHead>Regional Atual</TableHead>
                          <TableHead>Associar à Regional</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {city.bairros.map((bairro) => (
                          <TableRow key={bairro.bairro_nome}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-muted-foreground" />
                                {bairro.bairro_nome}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {bairro.count} candidato{bairro.count !== 1 ? 's' : ''}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {bairro.regional_nome ? (
                                <Badge variant="default">{bairro.regional_nome}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">Sem regional</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={bairroRegionalMap[bairro.bairro_nome] || ''}
                                onValueChange={(value) => handleRegionalChange(bairro.bairro_nome, value)}
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue placeholder="Selecione uma regional" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Sem Regional</SelectItem>
                                  {regionais.map((regional) => (
                                    <SelectItem key={regional.id} value={regional.id}>
                                      {regional.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Resumo da Cidade:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total de bairros:</span>
                          <span className="ml-2 font-medium">{city.bairros.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Com regional:</span>
                          <span className="ml-2 font-medium">
                            {city.bairros.filter(b => bairroRegionalMap[b.bairro_nome]).length}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sem regional:</span>
                          <span className="ml-2 font-medium">
                            {city.bairros.filter(b => !bairroRegionalMap[b.bairro_nome]).length}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Candidatos:</span>
                          <span className="ml-2 font-medium">
                            {city.bairros.reduce((sum, b) => sum + b.count, 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default GeographyCitiesManager;