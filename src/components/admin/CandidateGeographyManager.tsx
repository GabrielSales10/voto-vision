import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Building, Save } from 'lucide-react';

interface CandidateBairro {
  id: string;
  bairro_nome: string;
  votos: number;
  percentual_votos: number;
  regional_id?: string;
  regional?: {
    id: string;
    nome: string;
  };
}

interface Regional {
  id: string;
  nome: string;
}

interface Candidato {
  id: string;
  nome: string;
  usa_regionais: boolean;
}

interface CandidateGeographyManagerProps {
  candidateId: string;
}

const CandidateGeographyManager = ({ candidateId }: CandidateGeographyManagerProps) => {
  const [candidato, setCandidato] = useState<Candidato | null>(null);
  const [bairros, setBairros] = useState<CandidateBairro[]>([]);
  const [regionais, setRegionais] = useState<Regional[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bairroRegionalMap, setBairroRegionalMap] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [candidateId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do candidato
      const { data: candidatoData, error: candidatoError } = await supabase
        .from('candidatos')
        .select('id, nome, usa_regionais')
        .eq('id', candidateId)
        .single();

      if (candidatoError) throw candidatoError;
      setCandidato(candidatoData);

      // Buscar bairros do candidato
      const { data: bairrosData, error: bairrosError } = await supabase
        .from('candidate_bairros')
        .select(`
          id,
          bairro_nome,
          votos,
          percentual_votos,
          regional_id,
          regional:regionais(id, nome)
        `)
        .eq('candidato_id', candidateId)
        .order('bairro_nome');

      if (bairrosError) throw bairrosError;
      setBairros(bairrosData || []);

      // Criar mapa inicial de bairro->regional
      const initialMap: Record<string, string> = {};
      bairrosData?.forEach(bairro => {
        if (bairro.regional_id) {
          initialMap[bairro.id] = bairro.regional_id;
        }
      });
      setBairroRegionalMap(initialMap);

      // Buscar regionais disponíveis se o candidato usa regionais
      if (candidatoData?.usa_regionais) {
        const { data: regionaisData, error: regionaisError } = await supabase
          .from('regionais')
          .select('id, nome')
          .eq('ativo', true)
          .order('nome');

        if (regionaisError) throw regionaisError;
        setRegionais(regionaisData || []);
      }

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

  const handleRegionalChange = (bairroId: string, regionalId: string) => {
    setBairroRegionalMap(prev => ({
      ...prev,
      [bairroId]: regionalId
    }));
  };

  const saveChanges = async () => {
    try {
      setSaving(true);

      // Atualizar cada bairro com sua regional
      const updatePromises = bairros.map(bairro => {
        const regionalId = bairroRegionalMap[bairro.id] || null;
        return supabase
          .from('candidate_bairros')
          .update({ regional_id: regionalId })
          .eq('id', bairro.id);
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
    return <div className="text-center py-8">Carregando dados do candidato...</div>;
  }

  if (!candidato) {
    return <div className="text-center py-8 text-muted-foreground">Candidato não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{candidato.nome}</h3>
          <p className="text-muted-foreground">
            {candidato.usa_regionais ? 'Gerenciar associação de bairros com regionais' : 'Este candidato não utiliza regionais'}
          </p>
        </div>
        
        {candidato.usa_regionais && bairros.length > 0 && (
          <Button onClick={saveChanges} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        )}
      </div>

      {bairros.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum bairro encontrado</h3>
            <p className="text-muted-foreground">
              Este candidato ainda não possui dados de bairros. 
              Os bairros são criados automaticamente quando você faz o upload do arquivo CSV de votos por bairro.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Bairros do Candidato ({bairros.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bairro</TableHead>
                  <TableHead>Votos</TableHead>
                  <TableHead>% Votos</TableHead>
                  {candidato.usa_regionais && (
                    <TableHead>Regional</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {bairros.map((bairro) => (
                  <TableRow key={bairro.id}>
                    <TableCell className="font-medium">{bairro.bairro_nome}</TableCell>
                    <TableCell>{bairro.votos.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {bairro.percentual_votos.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    {candidato.usa_regionais && (
                      <TableCell>
                        <Select
                          value={bairroRegionalMap[bairro.id] || ''}
                          onValueChange={(value) => handleRegionalChange(bairro.id, value)}
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
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {candidato.usa_regionais && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Resumo de Associações:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total de bairros:</span>
                    <span className="ml-2 font-medium">{bairros.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Com regional:</span>
                    <span className="ml-2 font-medium">
                      {Object.values(bairroRegionalMap).filter(id => id).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sem regional:</span>
                    <span className="ml-2 font-medium">
                      {bairros.length - Object.values(bairroRegionalMap).filter(id => id).length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CandidateGeographyManager;