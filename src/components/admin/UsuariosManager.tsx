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
  email: string | null;
  nome: string;
  role: UserRole;
  ativo: boolean;
  created_at: string;
  login?: string;
}

const FAKE_EMAIL_DOMAIN =
  (import.meta as any)?.env?.VITE_AUTH_FAKE_EMAIL_DOMAIN || 'example.com';

function loginToEmail(login: string) {
  const normalized = String(login || '').trim().toLowerCase().replace(/\s+/g, '');
  return `${normalized}@${FAKE_EMAIL_DOMAIN}`;
}

function validateLogin(login: string) {
  if (!/^[a-z0-9._-]{3,32}$/i.test(login)) {
    throw new Error('Login deve ter 3–32 caracteres (letras, números, ponto, hífen ou _).');
  }
}

async function waitForProfileByLogin(login: string, tries = 10, delayMs = 500) {
  // aguarda o trigger de criação do profile
  for (let i = 0; i < tries; i++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, login')
      .eq('login', login)
      .maybeSingle();
    if (!error && data) return data;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return null;
}

const UsuariosManager = () => {
  const [usuarios, setUsuarios] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Profile | null>(null);
  const { toast } = useToast();

  // Form state
  const [login, setLogin] = useState('');
  const [nome, setNome] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('candidato');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  
  // Lists for selection
  const [candidatos, setCandidatos] = useState<any[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);

  useEffect(() => {
    fetchUsuarios();
    fetchCandidatos();
    fetchPartidos();
  }, []);

  const fetchCandidatos = async () => {
    try {
      const { data, error } = await supabase
        .from('candidatos')
        .select('id, nome, numero, partidos(nome)')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      setCandidatos(data || []);
    } catch (error) {
      console.error('Erro ao carregar candidatos:', error);
    }
  };

  const fetchPartidos = async () => {
    try {
      const { data, error } = await supabase
        .from('partidos')
        .select('id, nome, sigla')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      setPartidos(data || []);
    } catch (error) {
      console.error('Erro ao carregar partidos:', error);
    }
  };

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
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLogin('');
    setNome('');
    setPassword('');
    setRole('candidato');
    setSelectedCandidateId('');
    setSelectedPartyId('');
    setEditingUsuario(null);
  };

  const openDialog = (usuario?: Profile) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setLogin(usuario.login || '');
      setNome(usuario.nome);
      setRole(usuario.role);
      setPassword('');
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      validateLogin(login);

      if (!editingUsuario) {
        // valida dependências por função
        if (role !== 'presidente' && role !== 'admin' && !selectedCandidateId) {
          throw new Error('Selecione o candidato para este usuário.');
        }
        if (role === 'presidente' && !selectedPartyId) {
          throw new Error('Selecione o partido para o presidente.');
        }
      }

      if (editingUsuario) {
        // Atualiza apenas dados de profile (login não editável aqui)
        const { error } = await supabase
          .from('profiles')
          .update({ nome, role })
          .eq('id', editingUsuario.id);
        if (error) throw error;

        toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso!' });
      } else {
        // Cria usuário no Auth usando e-mail técnico derivado do login
        const emailForAuth = loginToEmail(login);
        const { data, error: createError } = await supabase.auth.admin.createUser({
          email: emailForAuth,
          password,
          email_confirm: true, // já marca como confirmado
          user_metadata: { login, nome, role },
          app_metadata: { role },
        });
        if (createError) throw createError;


        // aguarda criação do profile via trigger
        const profile = await waitForProfileByLogin(login);
        if (!profile?.user_id) {
          throw new Error('Não foi possível criar o perfil do usuário. Tente novamente.');
        }

        // cria acessos conforme a função
        if (role !== 'presidente' && role !== 'admin' && selectedCandidateId) {
          const { error } = await supabase
            .from('user_candidate_access')
            .insert({ user_id: profile.user_id, candidate_id: selectedCandidateId });
          if (error) throw error;
        }

        if (role === 'presidente' && selectedPartyId) {
          const { error } = await supabase
            .from('user_party_access')
            .insert({ user_id: profile.user_id, party_id: selectedPartyId });
          if (error) throw error;
        }

        toast({
          title: 'Sucesso',
          description: 'Usuário criado com sucesso!',
        });
      }

      setDialogOpen(false);
      resetForm();
      await fetchUsuarios();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      let message = error?.message || 'Erro ao salvar usuário.';
      // mensagens mais amigáveis para casos comuns
      if (String(message).includes('invalid email')) {
        message = 'Domínio técnico do login inválido. Ajuste VITE_AUTH_FAKE_EMAIL_DOMAIN para um domínio real.';
      }
      if (String(message).includes('User already registered')) {
        message = 'Login já cadastrado.';
      }
      toast({ title: 'Erro', description: message, variant: 'destructive' });
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
        title: 'Sucesso',
        description: `Usuário ${!usuario.ativo ? 'ativado' : 'desativado'} com sucesso!`,
      });

      fetchUsuarios();
    } catch (error: any) {
      console.error('Erro ao alterar status do usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status do usuário.',
        variant: 'destructive',
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
                  <Label htmlFor="login">Login</Label>
                  <Input
                    id="login"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="nome_usuario"
                    disabled={!!editingUsuario}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Apenas login e senha. (Nenhum e-mail será usado.)
                  </p>
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

                {role !== 'presidente' && role !== 'admin' && !editingUsuario && (
                  <div className="space-y-2">
                    <Label htmlFor="candidate">Candidato</Label>
                    <Select value={selectedCandidateId} onValueChange={setSelectedCandidateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o candidato" />
                      </SelectTrigger>
                      <SelectContent>
                        {candidatos.map((candidato) => (
                          <SelectItem key={candidato.id} value={candidato.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{candidato.nome}</span>
                              {candidato.numero && (
                                <Badge variant="outline">{candidato.numero}</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {role === 'presidente' && !editingUsuario && (
                  <div className="space-y-2">
                    <Label htmlFor="party">Partido</Label>
                    <Select value={selectedPartyId} onValueChange={setSelectedPartyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o partido" />
                      </SelectTrigger>
                      <SelectContent>
                        {partidos.map((partido) => (
                          <SelectItem key={partido.id} value={partido.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{partido.nome}</span>
                              <Badge variant="outline">{partido.sigla}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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
              <TableHead>Login</TableHead>
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
                <TableCell>{usuario.login || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={getRoleColor(usuario.role)} className="flex items-center gap-1 w-fit">
                    {getRoleIcon(usuario.role)}
                    {getRoleLabel(usuario.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog(usuario)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={usuario.ativo ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => toggleUsuarioStatus(usuario)}
                    >
                      {usuario.ativo ? <Trash2 className="w-4 h-4" /> : 'Ativar'}
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
