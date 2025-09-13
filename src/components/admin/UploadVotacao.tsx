import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const UploadVotacao = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setUploadResult(null);
      } else {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo CSV.",
          variant: "destructive",
        });
      }
    }
  };

  const simulateUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    // Simular progresso do upload
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    // Simular processamento
    setTimeout(() => {
      setUploadProgress(100);
      setUploading(false);
      
      // Simular resultado do processamento
      setUploadResult({
        success: true,
        processedRows: 1247,
        errors: 3,
        warnings: 12,
        summary: {
          candidatos: 8,
          zonas: 15,
          secoes: 156,
          totalVotos: 15420
        }
      });

      toast({
        title: "Upload concluído!",
        description: "Arquivo processado com sucesso.",
      });
    }, 3000);
  };

  const csvExample = `candidato_id,secao_numero,zona_numero,bairro_nome,regional_nome,votos,eleitores_aptos,ano_eleicao,turno
123e4567-e89b-12d3-a456-426614174000,0001,001,Centro,SER I,25,150,2024,1
123e4567-e89b-12d3-a456-426614174000,0002,001,Centro,SER I,18,120,2024,1
456e7890-e89b-12d3-a456-426614174001,0001,001,Centro,SER I,30,150,2024,1`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload de Dados de Votação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csvFile">Arquivo CSV</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Label 
                htmlFor="csvFile" 
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-12 h-12 text-muted-foreground" />
                <span className="text-lg font-medium">
                  {file ? file.name : 'Clique para selecionar arquivo CSV'}
                </span>
                <span className="text-sm text-muted-foreground">
                  Ou arraste e solte o arquivo aqui
                </span>
              </Label>
            </div>
          </div>

          {/* Upload Button */}
          {file && !uploading && !uploadResult && (
            <Button onClick={simulateUpload} className="w-full" size="lg">
              <Upload className="w-4 h-4 mr-2" />
              Processar Arquivo
            </Button>
          )}

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando arquivo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Results */}
          {uploadResult && (
            <Card className={uploadResult.success ? "border-success" : "border-destructive"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  {uploadResult.success ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}
                  <span className="font-semibold">
                    {uploadResult.success ? 'Processamento Concluído' : 'Erro no Processamento'}
                  </span>
                </div>

                {uploadResult.success && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {uploadResult.processedRows}
                      </div>
                      <div className="text-sm text-muted-foreground">Linhas Processadas</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-success">
                        {uploadResult.summary.candidatos}
                      </div>
                      <div className="text-sm text-muted-foreground">Candidatos</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-warning">
                        {uploadResult.summary.zonas}
                      </div>
                      <div className="text-sm text-muted-foreground">Zonas</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-accent">
                        {uploadResult.summary.totalVotos.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Votos</div>
                    </div>
                  </div>
                )}

                {(uploadResult.errors > 0 || uploadResult.warnings > 0) && (
                  <div className="mt-4 space-y-2">
                    {uploadResult.errors > 0 && (
                      <div className="text-sm text-destructive">
                        ⚠️ {uploadResult.errors} erro(s) encontrado(s)
                      </div>
                    )}
                    {uploadResult.warnings > 0 && (
                      <div className="text-sm text-warning">
                        ⚠️ {uploadResult.warnings} aviso(s) encontrado(s)
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* CSV Format Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Formato do Arquivo CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O arquivo CSV deve conter as seguintes colunas na ordem especificada:
          </p>
          
          <div className="bg-muted p-4 rounded-lg text-sm font-mono">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Colunas obrigatórias:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• candidato_id (UUID)</li>
                  <li>• secao_numero (número)</li>
                  <li>• zona_numero (número)</li>
                  <li>• votos (número)</li>
                  <li>• ano_eleicao (ano)</li>
                  <li>• turno (1 ou 2)</li>
                </ul>
              </div>
              <div>
                <strong>Colunas opcionais:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• bairro_nome (texto)</li>
                  <li>• regional_nome (texto)</li>
                  <li>• eleitores_aptos (número)</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <strong className="text-sm">Exemplo de arquivo CSV:</strong>
            <Textarea
              value={csvExample}
              readOnly
              className="mt-2 font-mono text-xs"
              rows={4}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            <strong>Observações importantes:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>O arquivo deve usar vírgula (,) como separador</li>
              <li>A primeira linha deve conter os cabeçalhos das colunas</li>
              <li>Os candidatos devem estar previamente cadastrados no sistema</li>
              <li>Zonas e seções serão criadas automaticamente se não existirem</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadVotacao;