import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Building } from 'lucide-react';

const BairrosManager = () => {
  const [bairros, setBairros] = useState<any[]>([]);
  const [regionais, setRegionais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [regionalId, setRegionalId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bairrosRes, regionaisRes] = await Promise.all([
        supabase.from('bairros').select(`
          *,
          regional:regionais(nome)
        `).order('nome'),
        supabase.from('regionais').select('*').eq('ativo', true).order('nome')
      ]);

      if (bairrosRes.error) throw bairrosRes.error;
      if (regionaisRes.error) throw regionaisRes.error;

      setBairros(bairrosRes.data || []);
      setRegionais(regionaisRes.data || []);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNome('');
    setRegionalId('');
    setEditingId(null);
  };

  const openDialog = (bairro?: any) => {
    if (bairro) {
      setEditingId(bairro.id);
      setNome(bairro.nome);
      setRegionalId(bairro.regional_id || '');
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bairroData = {
        nome,
        regional_id: regionalId || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('bairros')
          .update(bairroData)
          .eq('id', editingId);
        
        if (error) throw error;
        
        toast({ title: "Sucesso", description: "Bairro atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('bairros')
          .insert([bairroData]);

        if (error) throw error;
        
        toast({ title: "Sucesso", description: "Bairro criado com sucesso!" });
      }
      
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const toggleBairroStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('bairros')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `Bairro ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Bairros</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Bairro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Bairro' : 'Novo Bairro'}</DialogTitle>
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
                <Label htmlFor="regional">Regional</Label>
                <Select value={regionalId} onValueChange={setRegionalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma regional (opcional)" />
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
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Regional</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bairros.map((bairro) => (
            <TableRow key={bairro.id}>
              <TableCell className="font-medium">{bairro.nome}</TableCell>
              <TableCell>
                {bairro.regional?.nome || 'Sem Regional'}
              </TableCell>
              <TableCell>
                <Badge variant={bairro.ativo ? "default" : "secondary"}>
                  {bairro.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openDialog(bairro)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={bairro.ativo ? "destructive" : "default"}
                    size="sm" 
                    onClick={() => toggleBairroStatus(bairro.id, bairro.ativo)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {bairros.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum bairro encontrado</p>
        </div>
      )}
    </div>
  );
};

export default BairrosManager;