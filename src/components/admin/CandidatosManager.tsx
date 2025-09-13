import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Edit, Trash2, User } from 'lucide-react';

interface Candidato {
  id: string;
  nome: string;
  numero: number | null;
  foto_url: string | null;
  ativo: boolean;
  partidos: {
    id: string;
    nome: string;
    sigla: string;
  };
}

interface Partido {
  id: string;
  nome: string;
  sigla: string;
}

const CandidatosManager = () => {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCandidato, setEditingCandidato] = useState<Candidato | null>(null);
  const { toast } = useToast();

  // Form state
  const [nome, setNome] = useState('');
  const [numero, setNumero] = useState('');
  const [partidoId, setPartidoId] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Buscar candidatos
      const { data: candidatosData, error: candidatosError } = await supabase
        .from('candidatos')
        .select(`
          *,
          partidos (id, nome, sigla)
        `)
        .order('nome');

      if (candidatosError) throw candidatosError;

      // Buscar partidos
      const { data: partidosData, error: partidosError } = await supabase
        .from('partidos')
        .select('id, nome, sigla')
        .eq('ativo', true)
        .order('sigla');

      if (partidosError) throw partidosError;

      setCandidatos(candidatosData || []);
      setPartidos(partidosData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNome('');
    setNumero('');
    setPartidoId('');
    setFotoUrl('');
    setEditingCandidato(null);
  };

  const openDialog = (candidato?: Candidato) => {
    if (candidato) {
      setEditingCandidato(candidato);
      setNome(candidato.nome);
      setNumero(candidato.numero?.toString() || '');
      setPartidoId(candidato.partidos.id);
      setFotoUrl(candidato.foto_url || '');
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
        numero: numero ? parseInt(numero) : null,
        partido_id: partidoId,
        foto_url: fotoUrl || null,
      };

      if (editingCandidato) {
        const { error } = await supabase
          .from('candidatos')
          .update(candidatoData)
          .eq('id', editingCandidato.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Candidato atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('candidatos')
          .insert([candidatoData]);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Candidato cadastrado com sucesso!",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Erro ao salvar candidato:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar candidato.",
        variant: "destructive",
      });
    }
  };

  const toggleCandidatoStatus = async (candidato: Candidato) => {
    try {
      const { error } = await supabase
        .from('candidatos')
        .update({ ativo: !candidato.ativo })
        .eq('id', candidato.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Candidato ${!candidato.ativo ? 'ativado' : 'desativado'} com sucesso!`,
      });

      fetchData();
    } catch (error: any) {
      console.error('Erro ao alterar status do candidato:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do candidato.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gerenciar Candidatos
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Candidato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCandidato ? 'Editar Candidato' : 'Novo Candidato'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome do candidato"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partido">Partido</Label>
                  <Select value={partidoId} onValueChange={setPartidoId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o partido" />
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
                <div className="space-y-2">
                  <Label htmlFor="numero">Número (opcional)</Label>
                  <Input
                    id="numero"
                    type="number"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="Número do candidato"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="foto">URL da Foto (opcional)</Label>
                  <Input
                    id="foto"
                    type="url"
                    value={fotoUrl}
                    onChange={(e) => setFotoUrl(e.target.value)}
                    placeholder="https://exemplo.com/foto.jpg"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingCandidato ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Foto</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Partido</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidatos.map((candidato) => (
              <TableRow key={candidato.id}>
                <TableCell>
                  {candidato.foto_url ? (
                    <img 
                      src={candidato.foto_url} 
                      alt={candidato.nome}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{candidato.nome}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {candidato.partidos.sigla}
                  </Badge>
                </TableCell>
                <TableCell>{candidato.numero || '-'}</TableCell>
                <TableCell>
                  <Badge variant={candidato.ativo ? "default" : "secondary"}>
                    {candidato.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(candidato)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={candidato.ativo ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleCandidatoStatus(candidato)}
                    >
                      {candidato.ativo ? (
                        <Trash2 className="w-4 h-4" />
                      ) : (
                        'Ativar'
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {candidatos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum candidato cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CandidatosManager;