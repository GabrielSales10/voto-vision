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
import { UserRole } from '@/hooks/useAuth';
import { User, Plus, Edit, Trash2, Shield, Crown, Users } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  nome: string;
  role: UserRole;
  ativo: boolean;
  created_at: string;
}

const UsuariosManager = () => {
  const [usuarios, setUsuarios] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Profile | null>(null);
  const { toast } = useToast();

  // Form state
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('candidato');

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setNome('');
    setPassword('');
    setRole('candidato');
    setEditingUsuario(null);
  };

  const openDialog = (usuario?: Profile) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setEmail(usuario.email);
      setNome(usuario.nome);
      setRole(usuario.role);
      setPassword(''); // Não mostrar senha existente
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUsuario) {
        // Atualizar perfil existente
        const { error } = await supabase
          .from('profiles')
          .update({
            nome,
            role,
          })
          .eq('id', editingUsuario.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso!",
        });
      } else {
        // Criar novo usuário
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome,
              role,
            }
          }
        });

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso! Ele receberá um email de confirmação.",
        });
      }

      setDialogOpen(false);
      resetForm();
      
      // Aguardar um pouco antes de recarregar para o trigger processar
      setTimeout(fetchUsuarios, 1000);
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar usuário.",
        variant: "destructive",
      });
    }
  };

  const toggleUsuarioStatus = async (usuario: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ativo: !usuario.ativo })
        .eq('id', usuario.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Usuário ${!usuario.ativo ? 'ativado' : 'desativado'} com sucesso!`,
      });

      fetchUsuarios();
    } catch (error: any) {
      console.error('Erro ao alterar status do usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do usuário.",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'presidente':
        return <Crown className="w-4 h-4" />;
      case 'candidato':
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'presidente':
        return 'Presidente';
      case 'candidato':
        return 'Candidato';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'presidente':
        return 'default';
      case 'candidato':
        return 'secondary';
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
            Gerenciar Usuários
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome do usuário"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    disabled={!!editingUsuario}
                    required
                  />
                </div>
                {!editingUsuario && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="candidato">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Candidato
                        </div>
                      </SelectItem>
                      <SelectItem value="presidente">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          Presidente de Partido
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Administrador
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                    {editingUsuario ? 'Atualizar' : 'Criar'}
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
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">{usuario.nome}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleColor(usuario.role)} className="flex items-center gap-1 w-fit">
                    {getRoleIcon(usuario.role)}
                    {getRoleLabel(usuario.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={usuario.ativo ? "default" : "secondary"}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(usuario)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={usuario.ativo ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleUsuarioStatus(usuario)}
                    >
                      {usuario.ativo ? (
                        <Trash2 className="w-4 h-4" />
                      ) : (
                        'Ativar'
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {usuarios.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UsuariosManager;