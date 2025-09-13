import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Power, Users } from 'lucide-react';

interface Candidato {
  id: string;
  nome: string;
  numero?: number;
  foto_url?: string;
  ativo: boolean;
  partido?: {
    id: string;
    nome: string;
    sigla: string;
  };
  usa_regionais: boolean;
}

interface Partido {
  id: string;
  nome: string;
  sigla: string;
}

const SimpleCandidateManager = () => {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [partidoId, setPartidoId] = useState('');
  const [numero, setNumero] = useState('');
  const [usaRegionais, setUsaRegionais] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candidatosRes, partidosRes] = await Promise.all([
        supabase.from('candidatos').select(`
          *, 
          partido:partidos(id, nome, sigla)
        `).order('nome'),
        supabase.from('partidos').select('*').eq('ativo', true).order('nome')
      ]);

      if (candidatosRes.error) throw candidatosRes.error;
      if (partidosRes.error) throw partidosRes.error;

      setCandidatos(candidatosRes.data || []);
      setPartidos(partidosRes.data || []);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNome('');
    setPartidoId('');
    setNumero('');
    setUsaRegionais(true);
  };

  const openDialog = (candidato?: Candidato) => {
    if (candidato) {
      setEditingId(candidato.id);
      setNome(candidato.nome);
      setPartidoId(candidato.partido?.id || '');
      setNumero(candidato.numero?.toString() || '');
      setUsaRegionais(candidato.usa_regionais);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const candidatoData = {
        nome,
        partido_id: partidoId,
        numero: numero ? parseInt(numero) : null,
        usa_regionais: usaRegionais,
      };

      if (editingId) {
        const { error } = await supabase
          .from('candidatos')
          .update(candidatoData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('candidatos')
          .insert([candidatoData]);
        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: `Candidato ${editingId ? 'atualizado' : 'criado'} com sucesso!`
      });
      
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleCandidatoStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('candidatos')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `Candidato ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) return <div className="text-center py-8">Carregando...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle>Gerenciar Candidatos</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Candidato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Candidato' : 'Novo Candidato'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input 
                  id="nome"
                  value={nome} 
                  onChange={(e) => setNome(e.target.value)} 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="partido">Partido *</Label>
                <Select value={partidoId} onValueChange={setPartidoId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um partido" />
                  </SelectTrigger>
                  <SelectContent>
                    {partidos.map((partido) => (
                      <SelectItem key={partido.id} value={partido.id}>
                        {partido.sigla} - {partido.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="numero">Número</Label>
                <Input 
                  id="numero"
                  type="number"
                  value={numero} 
                  onChange={(e) => setNumero(e.target.value)} 
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={usaRegionais} 
                  onCheckedChange={setUsaRegionais} 
                />
                <Label>Usar Regionais</Label>
              </div>

              <Button type="submit" className="w-full">
                {editingId ? 'Atualizar' : 'Criar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {candidatos.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum candidato encontrado</h3>
            <p className="text-muted-foreground">
              Comece criando seu primeiro candidato.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Partido</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Regionais</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidatos.map((candidato) => (
                <TableRow key={candidato.id}>
                  <TableCell className="font-medium">{candidato.nome}</TableCell>
                  <TableCell>
                    {candidato.partido?.sigla} - {candidato.partido?.nome}
                  </TableCell>
                  <TableCell>{candidato.numero || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={candidato.usa_regionais ? "default" : "secondary"}>
                      {candidato.usa_regionais ? 'Sim' : 'Não'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={candidato.ativo ? "default" : "secondary"}>
                      {candidato.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openDialog(candidato)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCandidatoStatus(candidato.id, candidato.ativo)}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleCandidateManager;