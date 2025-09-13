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
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Power, Upload, CheckCircle, AlertCircle, MapPin, Calendar } from 'lucide-react';
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
  usa_regionais: boolean;
  anos_data?: {
    ano: number;
    votos_por_secao_file?: string;
    votos_por_bairro_file?: string;
  }[];
}

interface Partido {
  id: string;
  nome: string;
  sigla: string;
}

interface YearData {
  ano: number;
  secaoFile: File | null;
  bairroFile: File | null;
}

/** =========================
 *  Uploader por ano (sem hook em loop)
 *  ========================= */
function YearFilesUploader({
  year,
  value,
  onChange,
  editing,
}: {
  year: number;
  value: YearData | undefined;
  onChange: (partial: Partial<YearData>) => void;
  editing: boolean;
}) {
  const onDropSecao = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !file.name.endsWith('.csv')) return;
    onChange({ secaoFile: file });
  }, [onChange]);

  const { getRootProps: getSecaoRootProps, getInputProps: getSecaoInputProps } = useDropzone({
    onDrop: onDropSecao,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1
  });

  const onDropBairro = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !file.name.endsWith('.csv')) return;
    onChange({ bairroFile: file });
  }, [onChange]);

  const { getRootProps: getBairroRootProps, getInputProps: getBairroInputProps } = useDropzone({
    onDrop: onDropBairro,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1
  });

  return (
    <Card key={year} className="p-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Dados de {year}
          {!editing && (
            <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-0">
        <div>
          <Label>Arquivo 1: Votos por Seção {!editing && '*'}</Label>
          <div
            {...getSecaoRootProps()}
            className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400"
          >
            <input {...getSecaoInputProps()} />
            {value?.secaoFile ? (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">{value.secaoFile.name}</span>
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
          <Label>Arquivo 2: Votos por Bairro {!editing && '*'}</Label>
          <div
            {...getBairroRootProps()}
            className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400"
          >
            <input {...getBairroInputProps()} />
            {value?.bairroFile ? (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">{value.bairroFile.name}</span>
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
      </CardContent>
    </Card>
  );
}

/** =========================
 *  Componente principal
 *  ========================= */
const MultiYearCandidateManager = () => {
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
  const [usaRegionais, setUsaRegionais] = useState(true);

  const [selectedYears, setSelectedYears] = useState<number[]>([2024]);
  const [yearDataMap, setYearDataMap] = useState<Record<number, YearData>>({});
  const [processingFiles, setProcessingFiles] = useState(false);
  const { toast } = useToast();

  const availableYears = [2020, 2024];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candidatosRes, partidosRes] = await Promise.all([
        supabase.from('candidatos').select(`
          *, 
          partido:partidos(id, nome, sigla),
          anos_data:candidate_anos(ano, votos_por_secao_file, votos_por_bairro_file)
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
    setUsaRegionais(true);
    setSelectedYears([2024]);
    setYearDataMap({});
  };

  const openDialog = (candidato?: Candidato) => {
    if (candidato) {
      setEditingId(candidato.id);
      setNome(candidato.nome);
      setPartidoId(candidato.partido?.id || '');
      setNumero(candidato.numero?.toString() || '');
      setFotoPreview(candidato.foto_url || '');
      setUsaRegionais(candidato.usa_regionais);

      const years = candidato.anos_data?.map(a => a.ano) || [];
      setSelectedYears(years.length ? years : [2024]);

      const map: Record<number, YearData> = {};
      (candidato.anos_data || []).forEach(y => {
        map[y.ano] = { ano: y.ano, secaoFile: null, bairroFile: null };
      });
      setYearDataMap(map);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const openGeographyDialog = (candidatoId: string) => {
    setSelectedCandidateId(candidatoId);
    setGeographyDialogOpen(true);
  };

  const handleYearSelection = (year: number, checked: boolean) => {
    if (checked) {
      setSelectedYears(prev => {
        const next = [...prev, year].sort();
        setYearDataMap(p => ({ ...p, [year]: { ano: year, secaoFile: null, bairroFile: null } }));
        return next;
      });
    } else {
      setSelectedYears(prev => prev.filter(y => y !== year));
      setYearDataMap(prev => {
        const n = { ...prev };
        delete n[year];
        return n;
      });
    }
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID?.() || Math.random()}.${fileExt}`;
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

  const processCSVFile = async (file: File, type: 'secao' | 'bairro', candidatoId: string, ano: number) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            if (type === 'secao') {
              const secaoData = (results.data as any[]).map((row: any) => ({
                candidato_id: candidatoId,
                ano,
                zona: (row.Zona ?? '').toString() || '0',
                secao: (row['Seção'] ?? row['Secao'] ?? '').toString() || '0',
                secoes_agregadas: row['Seções Agregadas'] ?? row['Secoes Agregadas'] ?? '',
                votos: parseInt(row.Votos) || 0,
                local_votacao: row['Local de Votação'] ?? row['Local de Votacao'] ?? '',
                endereco_local: row['Endereço do Local de Votação'] ?? row['Endereco do Local de Votacao'] ?? '',
                bairro: row.Bairro ?? ''
              }));
              const { error } = await supabase.from('candidate_secoes').insert(secaoData);
              if (error) throw error;
            } else {
              const bairroData = (results.data as any[]).map((row: any) => ({
                candidato_id: candidatoId,
                ano,
                bairro_nome: row.Bairro ?? '',
                votos: parseInt(row.Votos) || 0,
                percentual_votos: parseFloat(row['% Votos Obtidos'] ?? row['Percentual Votos'] ?? '0') || 0
              }));
              const { error } = await supabase.from('candidate_bairros').insert(bairroData);
              if (error) throw error;
            }
            resolve(true);
          } catch (e) {
            reject(e);
          }
        },
        error: (err) => reject(err)
      });
    });
  };

  // Dropzone para foto (um único hook, fora de loops)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingId && selectedYears.length === 0) {
      toast({ title: "Erro", description: "Selecione pelo menos um ano", variant: "destructive" });
      return;
    }

    if (!editingId) {
      const missing = selectedYears.some(y => !yearDataMap[y]?.secaoFile || !yearDataMap[y]?.bairroFile);
      if (missing) {
        toast({ title: "Erro", description: "Cada ano selecionado precisa dos dois CSVs", variant: "destructive" });
        return;
      }
    }

    try {
      setProcessingFiles(true);

      let fotoUrl = fotoPreview;
      if (foto) fotoUrl = await uploadPhoto(foto);

      const candidatoData = {
        nome,
        partido_id: partidoId,
        numero: numero ? parseInt(numero) : null,
        foto_url: fotoUrl,
        usa_regionais: usaRegionais,
      };

      let candidatoId = editingId;
      if (editingId) {
        const { error } = await supabase.from('candidatos').update(candidatoData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('candidatos').insert([candidatoData]).select().single();
        if (error) throw error;
        candidatoId = data.id;
      }

      // Salva/atualiza anos + processa CSVs
      for (const year of selectedYears) {
        const yearData = yearDataMap[year];

        const { error: anoError } = await supabase
          .from('candidate_anos')
          .upsert({
            candidato_id: candidatoId!,
            ano: year,
            votos_por_secao_file: yearData?.secaoFile?.name || null,
            votos_por_bairro_file: yearData?.bairroFile?.name || null
          });
        if (anoError) throw anoError;

        if (yearData?.secaoFile && yearData?.bairroFile) {
          // limpa dados antigos daquele ano
          await Promise.all([
            supabase.from('candidate_secoes').delete().eq('candidato_id', candidatoId!).eq('ano', year),
            supabase.from('candidate_bairros').delete().eq('candidato_id', candidatoId!).eq('ano', year)
          ]);
          // insere novos
          await Promise.all([
            processCSVFile(yearData.secaoFile, 'secao', candidatoId!, year),
            processCSVFile(yearData.bairroFile, 'bairro', candidatoId!, year)
          ]);
        }
      }

      toast({ title: "Sucesso", description: `Candidato ${editingId ? 'atualizado' : 'criado'} com sucesso!` });
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setProcessingFiles(false);
    }
  };

  const toggleCandidatoStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('candidatos').update({ ativo: !currentStatus }).eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: `Candidato ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

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
                      <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
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
                      <Input id="numero" type="number" value={numero} onChange={(e) => setNumero(e.target.value)} />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch checked={usaRegionais} onCheckedChange={setUsaRegionais} />
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

                {/* Seleção de Anos */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Anos de Dados Eleitorais *</Label>
                  <p className="text-sm text-muted-foreground">Selecione os anos para os quais você possui dados.</p>

                  <div className="flex gap-4">
                    {availableYears.map((year) => (
                      <div key={year} className="flex items-center space-x-2">
                        <Checkbox
                          id={`year-${year}`}
                          checked={selectedYears.includes(year)}
                          onCheckedChange={(checked) => handleYearSelection(year, !!checked)}
                        />
                        <Label htmlFor={`year-${year}`} className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {year}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Uploads por ano */}
                {selectedYears.length > 0 && (
                  <div className="space-y-6">
                    <Label className="text-lg font-semibold">Arquivos de Votação por Ano</Label>
                    {selectedYears.map((year) => (
                      <YearFilesUploader
                        key={year}
                        year={year}
                        value={yearDataMap[year]}
                        editing={!!editingId}
                        onChange={(partial) =>
                          setYearDataMap((prev) => ({
                            ...prev,
                            [year]: { ...(prev[year] || { ano: year, secaoFile: null, bairroFile: null }), ...partial },
                          }))
                        }
                      />
                    ))}
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={processingFiles}>
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
                <TableHead>Anos de Dados</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidatos.map((candidato) => (
                <TableRow key={candidato.id}>
                  <TableCell>
                    {candidato.foto_url ? (
                      <img src={candidato.foto_url} alt={candidato.nome} className="w-10 h-10 object-cover rounded-full" />
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
                    <div className="flex gap-1">
                      {candidato.anos_data?.length
                        ? candidato.anos_data.map((ano) => (
                            <Badge key={ano.ano} variant="outline" className="text-xs">
                              {ano.ano}
                            </Badge>
                          ))
                        : <span className="text-muted-foreground text-sm">Nenhum</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={candidato.ativo ? 'default' : 'secondary'}>
                      {candidato.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openDialog(candidato)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openGeographyDialog(candidato.id)}>
                        <MapPin className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={candidato.ativo ? 'destructive' : 'default'}
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
            <div className="text-center py-8 text-muted-foreground">Nenhum candidato encontrado</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={geographyDialogOpen} onOpenChange={setGeographyDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Geografia Eleitoral do Candidato</DialogTitle>
          </DialogHeader>
          {selectedCandidateId && <CandidateGeographyManager candidateId={selectedCandidateId} />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MultiYearCandidateManager;
