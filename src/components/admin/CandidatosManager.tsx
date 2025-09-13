import { useState, useEffect, useCallback } from 'react';
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
import { Plus, Edit, Power, Upload, X, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import CandidateGeographyManager from './CandidateGeographyManager';

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
  votos_por_secao_file?: string;
  votos_por_bairro_file?: string;
  usa_regionais: boolean;
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
  const [geographyDialogOpen, setGeographyDialogOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [partidoId, setPartidoId] = useState('');
  const [numero, setNumero] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>('');
  const [votosSecaoFile, setVotosSecaoFile] = useState<File | null>(null);
  const [votosBairroFile, setVotosBairroFile] = useState<File | null>(null);
  const [usaRegionais, setUsaRegionais] = useState(true);
  const [processingFiles, setProcessingFiles] = useState(false);
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
    setFoto(null);
    setFotoPreview('');
    setVotosSecaoFile(null);
    setVotosBairroFile(null);
    setUsaRegionais(true);
  };

  const openDialog = (candidato?: Candidato) => {
    if (candidato) {
      setEditingId(candidato.id);
      setNome(candidato.nome);
      setPartidoId(candidato.partido?.id || '');
      setNumero(candidato.numero?.toString() || '');
      setFotoPreview(candidato.foto_url || '');
      setUsaRegionais(candidato.usa_regionais);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const openGeographyDialog = (candidatoId: string) => {
    setSelectedCandidateId(candidatoId);
    setGeographyDialogOpen(true);
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('candidate-photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('candidate-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const processCSVFile = async (file: File, type: 'secao' | 'bairro', candidatoId: string) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          try {
            if (type === 'secao') {
              // Arquivo 1: Zona, Seção, Seções Agregadas, Votos, Local de Votação, Endereço do Local de Votação, Bairro
              const secaoData = results.data.map((row: any) => ({
                candidato_id: candidatoId,
                zona: parseInt(row.Zona) || 0,
                secao: parseInt(row.Seção) || parseInt(row.Secao) || 0,
                secoes_agregadas: row['Seções Agregadas'] || row['Secoes Agregadas'] || '',
                votos: parseInt(row.Votos) || 0,
                local_votacao: row['Local de Votação'] || row['Local de Votacao'] || '',
                endereco_local: row['Endereço do Local de Votação'] || row['Endereco do Local de Votacao'] || '',
                bairro: row.Bairro || ''
              }));

              const { error } = await supabase.from('candidate_secoes').insert(secaoData);
              if (error) throw error;
            } else {
              // Arquivo 2: Bairro, Votos, % Votos Obtidos
              const bairroData = results.data.map((row: any) => ({
                candidato_id: candidatoId,
                bairro_nome: row.Bairro || '',
                votos: parseInt(row.Votos) || 0,
                percentual_votos: parseFloat(row['% Votos Obtidos'] || row['Percentual Votos'] || '0') || 0
              }));

              const { error } = await supabase.from('candidate_bairros').insert(bairroData);
              if (error) throw error;
            }
            resolve(true);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error)
      });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingId && (!votosSecaoFile || !votosBairroFile)) {
      toast({
        title: "Erro",
        description: "Os dois arquivos CSV são obrigatórios para novos candidatos",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessingFiles(true);
      
      let fotoUrl = fotoPreview;
      if (foto) {
        fotoUrl = await uploadPhoto(foto);
      }

      const candidatoData = {
        nome,
        partido_id: partidoId,
        numero: numero ? parseInt(numero) : null,
        foto_url: fotoUrl,
        usa_regionais: usaRegionais,
        votos_por_secao_file: votosSecaoFile?.name || null,
        votos_por_bairro_file: votosBairroFile?.name || null
      };

      let candidatoId = editingId;

      if (editingId) {
        const { error } = await supabase
          .from('candidatos')
          .update(candidatoData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('candidatos')
          .insert([candidatoData])
          .select()
          .single();
        if (error) throw error;
        candidatoId = data.id;
      }

      // Processar arquivos CSV se foram fornecidos
      if (votosSecaoFile && votosBairroFile) {
        // Limpar dados existentes se for edição
        if (editingId) {
          await Promise.all([
            supabase.from('candidate_secoes').delete().eq('candidato_id', editingId),
            supabase.from('candidate_bairros').delete().eq('candidato_id', editingId)
          ]);
        }

        // Processar novos arquivos CSV
        await Promise.all([
          processCSVFile(votosSecaoFile, 'secao', candidatoId!),
          processCSVFile(votosBairroFile, 'bairro', candidatoId!)
        ]);
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
    } finally {
      setProcessingFiles(false);
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

  // Dropzone para foto
  const onDropPhoto = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onload = () => setFotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps: getPhotoRootProps, getInputProps: getPhotoInputProps } = useDropzone({
    onDrop: onDropPhoto,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] },
    maxFiles: 1
  });

  // Dropzone para arquivo de seções
  const onDropSecoes = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.name.endsWith('.csv')) {
      setVotosSecaoFile(file);
    } else {
      toast({
        title: "Erro",
        description: "Apenas arquivos CSV são aceitos",
        variant: "destructive"
      });
    }
  }, [toast]);

  const { getRootProps: getSecoesRootProps, getInputProps: getSecoesInputProps } = useDropzone({
    onDrop: onDropSecoes,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1
  });

  // Dropzone para arquivo de bairros
  const onDropBairros = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.name.endsWith('.csv')) {
      setVotosBairroFile(file);
    } else {
      toast({
        title: "Erro",
        description: "Apenas arquivos CSV são aceitos",
        variant: "destructive"
      });
    }
  }, [toast]);

  const { getRootProps: getBairrosRootProps, getInputProps: getBairrosInputProps } = useDropzone({
    onDrop: onDropBairros,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1
  });

  if (loading) return <div className="text-center py-8">Carregando...</div>;

  return (
    <>
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Candidato' : 'Novo Candidato'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
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
                  </div>

                  <div>
                    <Label>Foto do Candidato *</Label>
                    <div 
                      {...getPhotoRootProps()} 
                      className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400"
                    >
                      <input {...getPhotoInputProps()} />
                      {fotoPreview ? (
                        <div className="space-y-2">
                          <img src={fotoPreview} alt="Preview" className="w-24 h-24 object-cover rounded-full mx-auto" />
                          <p className="text-sm text-gray-600">Clique para alterar a foto</p>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p>Arraste uma imagem ou clique para selecionar</p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!editingId && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-lg font-semibold">Arquivos de Votação *</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Ambos os arquivos CSV são obrigatórios para o cadastro do candidato.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Arquivo 1: Votos por Seção *</Label>
                          <div 
                            {...getSecoesRootProps()} 
                            className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400"
                          >
                            <input {...getSecoesInputProps()} />
                            {votosSecaoFile ? (
                              <div className="flex items-center justify-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="text-sm">{votosSecaoFile.name}</span>
                              </div>
                            ) : (
                              <div>
                                <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm">Clique ou arraste o arquivo CSV</p>
                                <p className="text-xs text-gray-500">
                                  Zona, Seção, Seções Agregadas, Votos, Local de Votação, Endereço, Bairro
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label>Arquivo 2: Votos por Bairro *</Label>
                          <div 
                            {...getBairrosRootProps()} 
                            className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400"
                          >
                            <input {...getBairrosInputProps()} />
                            {votosBairroFile ? (
                              <div className="flex items-center justify-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="text-sm">{votosBairroFile.name}</span>
                              </div>
                            ) : (
                              <div>
                                <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm">Clique ou arraste o arquivo CSV</p>
                                <p className="text-xs text-gray-500">
                                  Bairro, Votos, % Votos Obtidos
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {editingId && (
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Atualizar Arquivos de Votação (Opcional)</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Para atualizar os dados de votação, faça o upload dos novos arquivos CSV.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Arquivo 1: Votos por Seção</Label>
                        <div 
                          {...getSecoesRootProps()} 
                          className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400"
                        >
                          <input {...getSecoesInputProps()} />
                          {votosSecaoFile ? (
                            <div className="flex items-center justify-center space-x-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-sm">{votosSecaoFile.name}</span>
                            </div>
                          ) : (
                            <div>
                              <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm">Clique ou arraste o arquivo CSV</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Arquivo 2: Votos por Bairro</Label>
                        <div 
                          {...getBairrosRootProps()} 
                          className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400"
                        >
                          <input {...getBairrosInputProps()} />
                          {votosBairroFile ? (
                            <div className="flex items-center justify-center space-x-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-sm">{votosBairroFile.name}</span>
                            </div>
                          ) : (
                            <div>
                              <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm">Clique ou arraste o arquivo CSV</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    disabled={processingFiles}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={processingFiles}>
                    {processingFiles ? (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      editingId ? 'Atualizar' : 'Criar'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
                <TableHead>Ações</TableHead>
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
                        className="w-10 h-10 object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-xs">{candidato.nome.charAt(0)}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{candidato.nome}</TableCell>
                  <TableCell>
                    {candidato.partido ? `${candidato.partido.sigla} - ${candidato.partido.nome}` : 'N/A'}
                  </TableCell>
                  <TableCell>{candidato.numero || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={candidato.ativo ? "default" : "secondary"}>
                      {candidato.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
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
                        onClick={() => openGeographyDialog(candidato.id)}
                      >
                        <MapPin className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant={candidato.ativo ? "destructive" : "default"} 
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
          {candidatos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum candidato encontrado
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={geographyDialogOpen} onOpenChange={setGeographyDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Geografia Eleitoral do Candidato</DialogTitle>
          </DialogHeader>
          {selectedCandidateId && (
            <CandidateGeographyManager candidateId={selectedCandidateId} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CandidatosManager;