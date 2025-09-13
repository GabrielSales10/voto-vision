import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

const RegionaisManager = () => {
  const [regionais, setRegionais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRegionais();
  }, []);

  const fetchRegionais = async () => {
    try {
      const { data, error } = await supabase
        .from('regionais')
        .select('*')
        .order('nome');

      if (error) throw error;
      setRegionais(data || []);
    } catch (error) {
      console.error('Erro ao carregar regionais:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNome('');
    setEditingId(null);
  };

  const openDialog = (regional?: any) => {
    if (regional) {
      setEditingId(regional.id);
      setNome(regional.nome);
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
          .update({ nome })
          .eq('id', editingId);
        
        if (error) throw error;
        
        toast({ title: "Sucesso", description: "Regional atualizada com sucesso!" });
      } else {
        const { error } = await supabase
          .from('regionais')
          .insert([{ nome }]);

        if (error) throw error;
        
        toast({ title: "Sucesso", description: "Regional criada com sucesso!" });
      }
      
      setDialogOpen(false);
      resetForm();
      fetchRegionais();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Regionais</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}><Plus className="w-4 h-4 mr-2" />Nova Regional</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Editar Regional' : 'Nova Regional'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} required /></div>
              <Button type="submit">{editingId ? 'Atualizar' : 'Criar'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Nome</TableHead><TableHead>Ações</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {regionais.map((regional) => (
            <TableRow key={regional.id}>
              <TableCell>{regional.nome}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => openDialog(regional)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RegionaisManager;