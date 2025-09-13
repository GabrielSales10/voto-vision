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
  const [sigla, setSigla] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('regionais')
        .insert([{ nome, sigla }]);

      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Regional criada com sucesso!" });
      setDialogOpen(false);
      setNome('');
      setSigla('');
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
            <Button><Plus className="w-4 h-4 mr-2" />Nova Regional</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Regional</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} required /></div>
              <div><Label>Sigla</Label><Input value={sigla} onChange={(e) => setSigla(e.target.value)} /></div>
              <Button type="submit">Criar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Nome</TableHead><TableHead>Sigla</TableHead><TableHead>Ações</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {regionais.map((regional) => (
            <TableRow key={regional.id}>
              <TableCell>{regional.nome}</TableCell>
              <TableCell>{regional.sigla}</TableCell>
              <TableCell><Button variant="outline" size="sm"><Edit className="w-4 h-4" /></Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RegionaisManager;