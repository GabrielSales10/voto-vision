import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';

interface Partido {
  id: string;
  nome: string;
  sigla: string;
  numero: number | null;
  ativo: boolean;
  created_at: string;
}

const PartidosManager = () => {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartido, setEditingPartido] = useState<Partido | null>(null);
  const { toast } = useToast();

  // Form state
  const [nome, setNome] = useState('');
  const [sigla, setSigla] = useState('');
  const [numero, setNumero] = useState('');

  useEffect(() => {
    fetchPartidos();
  }, []);

  const fetchPartidos = async () => {
    try {
      const { data, error } = await supabase
        .from('partidos')
        .select('*')
        .order('sigla');

      if (error) throw error;
      setPartidos(data || []);
    } catch (error) {
      console.error('Erro ao carregar partidos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os partidos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNome('');
    setSigla('');
    setNumero('');
    setEditingPartido(null);
  };

  const openDialog = (partido?: Partido) => {
    if (partido) {
      setEditingPartido(partido);
      setNome(partido.nome);
      setSigla(partido.sigla);
      setNumero(partido.numero?.toString() || '');
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const partidoData = {
        nome,
        sigla: sigla.toUpperCase(),
        numero: numero ? parseInt(numero) : null,
      };

      if (editingPartido) {
        const { error } = await supabase
          .from('partidos')
          .update(partidoData)
          .eq('id', editingPartido.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Partido atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('partidos')
          .insert([partidoData]);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Partido cadastrado com sucesso!",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchPartidos();
    } catch (error: any) {
      console.error('Erro ao salvar partido:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar partido.",
        variant: "destructive",
      });
    }
  };

  const togglePartidoStatus = async (partido: Partido) => {
    try {
      const { error } = await supabase
        .from('partidos')
        .update({ ativo: !partido.ativo })
        .eq('id', partido.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Partido ${!partido.ativo ? 'ativado' : 'desativado'} com sucesso!`,
      });

      fetchPartidos();
    } catch (error: any) {
      console.error('Erro ao alterar status do partido:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do partido.",
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
            <Building2 className="w-5 h-5" />
            Gerenciar Partidos
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Partido
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPartido ? 'Editar Partido' : 'Novo Partido'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Partido</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Partido Democrático Social"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sigla">Sigla</Label>
                  <Input
                    id="sigla"
                    value={sigla}
                    onChange={(e) => setSigla(e.target.value)}
                    placeholder="Ex: PDS"
                    maxLength={10}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número (opcional)</Label>
                  <Input
                    id="numero"
                    type="number"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="Ex: 12"
                    min="1"
                    max="99"
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
                    {editingPartido ? 'Atualizar' : 'Cadastrar'}
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
              <TableHead>Sigla</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partidos.map((partido) => (
              <TableRow key={partido.id}>
                <TableCell className="font-medium">{partido.sigla}</TableCell>
                <TableCell>{partido.nome}</TableCell>
                <TableCell>{partido.numero || '-'}</TableCell>
                <TableCell>
                  <Badge variant={partido.ativo ? "default" : "secondary"}>
                    {partido.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(partido.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(partido)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={partido.ativo ? "destructive" : "default"}
                      size="sm"
                      onClick={() => togglePartidoStatus(partido)}
                    >
                      {partido.ativo ? (
                        <Trash2 className="w-4 h-4" />
                      ) : (
                        'Ativar'
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {partidos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum partido cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PartidosManager;