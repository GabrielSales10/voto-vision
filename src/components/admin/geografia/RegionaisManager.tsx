import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, MapPin, Building2, Users, Save, Undo2 } from 'lucide-react';

interface City {
  nome: string;
  neighborhoods: string[];
}

interface Regional {
  id: string;
  nome: string;
  sigla?: string;
  cidade?: string;
  ativo: boolean;
}

interface RegionalMapping {
  id: string;
  regional_id: string;
  neighborhood_name: string;
  city_id?: string;
}

const RegionaisManager = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [regionais, setRegionais] = useState<Regional[]>([]);
  const [mappings, setMappings] = useState<RegionalMapping[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [sigla, setSigla] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [selectedRegional, setSelectedRegional] = useState<string>('');
  const [bulkMode, setBulkMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get distinct cities and neighborhoods from candidate data
      const { data: bairrosData } = await supabase
        .from('candidate_bairros')
        .select('cidade, bairro_nome')
        .not('cidade', 'is', null)
        .not('bairro_nome', 'is', null);

      // Group by city
      const cityMap = new Map<string, Set<string>>();
      bairrosData?.forEach(item => {
        if (!cityMap.has(item.cidade)) {
          cityMap.set(item.cidade, new Set());
        }
        cityMap.get(item.cidade)?.add(item.bairro_nome);
      });

      const citiesData: City[] = Array.from(cityMap.entries()).map(([city, neighborhoods]) => ({
        nome: city,
        neighborhoods: Array.from(neighborhoods).sort()
      }));

      setCities(citiesData);

      // Fetch regionais
      const { data: regionaisData } = await supabase
        .from('regionais')
        .select('*')
        .order('nome');
      
      setRegionais(regionaisData || []);

      // Fetch existing mappings
      const { data: mappingsData } = await supabase
        .from('regional_neighborhood_map')
        .select('*');
      
      setMappings(mappingsData || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das regionais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNome('');
    setSigla('');
    setEditingId(null);
  };

  const openDialog = (regional?: Regional) => {
    if (regional) {
      setEditingId(regional.id);
      setNome(regional.nome);
      setSigla(regional.sigla || '');
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('regionais')
          .update({ nome, sigla })
          .eq('id', editingId);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Regional atualizada com sucesso!" });
      } else {
        const { error } = await supabase
          .from('regionais')
          .insert([{ nome, sigla }]);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Regional criada com sucesso!" });
      }
      
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleBulkMapping = async () => {
    if (!selectedRegional || selectedNeighborhoods.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione uma regional e pelo menos um bairro.",
        variant: "destructive",
      });
      return;
    }

    try {
      const mappingData = selectedNeighborhoods.map(neighborhood => ({
        regional_id: selectedRegional,
        neighborhood_name: neighborhood,
        city_id: null // We'll handle city mapping later if needed
      }));

      const { error } = await supabase
        .from('regional_neighborhood_map')
        .upsert(mappingData, { onConflict: 'neighborhood_name' });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${selectedNeighborhoods.length} bairros mapeados com sucesso!`
      });

      setSelectedNeighborhoods([]);
      setBulkMode(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const getNeighborhoodStatus = (neighborhood: string) => {
    const mapping = mappings.find(m => m.neighborhood_name === neighborhood);
    if (mapping) {
      const regional = regionais.find(r => r.id === mapping.regional_id);
      return regional ? { mapped: true, regionalName: regional.nome } : { mapped: false };
    }
    return { mapped: false };
  };

  const selectedCityData = cities.find(c => c.nome === selectedCity);
  const totalNeighborhoods = selectedCityData?.neighborhoods.length || 0;
  const mappedNeighborhoods = selectedCityData?.neighborhoods.filter(n => getNeighborhoodStatus(n).mapped).length || 0;

  if (loading) return <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            Gerenciamento de Regionais
          </h3>
          <p className="text-muted-foreground">
            Organize bairros em regionais para análise estratégica
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Regional
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Regional' : 'Nova Regional'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome da Regional</Label>
                <Input 
                  value={nome} 
                  onChange={(e) => setNome(e.target.value)} 
                  placeholder="Ex: Região Central, Zona Norte..."
                  required 
                />
              </div>
              <div>
                <Label>Sigla (Opcional)</Label>
                <Input 
                  value={sigla} 
                  onChange={(e) => setSigla(e.target.value)} 
                  placeholder="Ex: RC, ZN..."
                />
              </div>
              <Button type="submit">{editingId ? 'Atualizar' : 'Criar'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* City Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Selecionar Cidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma cidade para gerenciar" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.nome} value={city.nome}>
                  <div className="flex items-center justify-between w-full">
                    <span>{city.nome}</span>
                    <Badge variant="outline">{city.neighborhoods.length} bairros</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCity && (
        <>
          {/* Mapping Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Status do Mapeamento - {selectedCity}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{totalNeighborhoods}</div>
                  <div className="text-sm text-muted-foreground">Total de Bairros</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{mappedNeighborhoods}</div>
                  <div className="text-sm text-muted-foreground">Mapeados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning">{totalNeighborhoods - mappedNeighborhoods}</div>
                  <div className="text-sm text-muted-foreground">Não Mapeados</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ações em Lote</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setBulkMode(!bulkMode)}
                  >
                    {bulkMode ? 'Cancelar' : 'Modo Lote'}
                  </Button>
                  {bulkMode && (
                    <Button onClick={handleBulkMapping}>
                      <Save className="w-4 h-4 mr-2" />
                      Mapear Selecionados
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {bulkMode && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Regional de Destino</Label>
                  <Select value={selectedRegional} onValueChange={setSelectedRegional}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a regional" />
                    </SelectTrigger>
                    <SelectContent>
                      {regionais.filter(r => r.ativo).map((regional) => (
                        <SelectItem key={regional.id} value={regional.id}>
                          {regional.nome} {regional.sigla && `(${regional.sigla})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedNeighborhoods.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {selectedNeighborhoods.length} bairros selecionados
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Neighborhoods Table */}
          <Card>
            <CardHeader>
              <CardTitle>Bairros - {selectedCity}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {bulkMode && <TableHead className="w-[50px]">Selecionar</TableHead>}
                    <TableHead>Nome do Bairro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Regional Atual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCityData?.neighborhoods.map((neighborhood) => {
                    const status = getNeighborhoodStatus(neighborhood);
                    return (
                      <TableRow key={neighborhood}>
                        {bulkMode && (
                          <TableCell>
                            <Checkbox
                              checked={selectedNeighborhoods.includes(neighborhood)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedNeighborhoods([...selectedNeighborhoods, neighborhood]);
                                } else {
                                  setSelectedNeighborhoods(selectedNeighborhoods.filter(n => n !== neighborhood));
                                }
                              }}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{neighborhood}</TableCell>
                        <TableCell>
                          <Badge variant={status.mapped ? "default" : "secondary"}>
                            {status.mapped ? 'Mapeado' : 'Não Mapeado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {status.mapped ? status.regionalName : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Regionais List */}
      <Card>
        <CardHeader>
          <CardTitle>Regionais Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Sigla</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bairros Mapeados</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regionais.map((regional) => {
                const mappedCount = mappings.filter(m => m.regional_id === regional.id).length;
                return (
                  <TableRow key={regional.id}>
                    <TableCell className="font-medium">{regional.nome}</TableCell>
                    <TableCell>{regional.sigla || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={regional.ativo ? "default" : "secondary"}>
                        {regional.ativo ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{mappedCount} bairros</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => openDialog(regional)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegionaisManager;