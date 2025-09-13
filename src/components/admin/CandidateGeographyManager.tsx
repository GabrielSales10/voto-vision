import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, MapPin, Target, TrendingUp } from "lucide-react";

/**
 * Props: recebemos o ID do candidato do AdminDashboard (já está correto lá)
 */
export default function CandidateGeographyManager({ candidateId }: { candidateId: string }) {
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<any>(null);
  const [years, setYears] = useState<number[]>([]);
  const [activeYear, setActiveYear] = useState<number | null>(null);

  // dados por ano
  const [byNeighborhood, setByNeighborhood] = useState<Record<number, any[]>>({});
  const [bySection, setBySection] = useState<Record<number, any[]>>({});

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Candidato + anos configurados
        const { data: candRes, error: candErr } = await supabase
          .from("candidatos")
          .select(
            `
            *,
            anos:candidate_anos(ano)
          `
          )
          .eq("id", candidateId)
          .single();

        if (candErr) throw candErr;

        setCandidate(candRes);
        const yrs: number[] = (candRes?.anos || []).map((a: any) => a.ano).sort();
        setYears(yrs);
        setActiveYear((prev) => prev ?? (yrs.length ? yrs[0] : null));

        // Carrega tabelas agregadas para todos os anos do candidato
        const [secRes, baiRes] = await Promise.all([
          supabase
            .from("candidate_secoes")
            .select("*")
            .eq("candidato_id", candidateId),
          supabase
            .from("candidate_bairros")
            .select("*")
            .eq("candidato_id", candidateId),
        ]);

        if (secRes.error) throw secRes.error;
        if (baiRes.error) throw baiRes.error;

        // Organiza por ano
        const secByYear: Record<number, any[]> = {};
        (secRes.data || []).forEach((row: any) => {
          const y = row.ano;
          if (!secByYear[y]) secByYear[y] = [];
          secByYear[y].push(row);
        });
        setBySection(secByYear);

        const baiByYear: Record<number, any[]> = {};
        (baiRes.data || []).forEach((row: any) => {
          const y = row.ano;
          if (!baiByYear[y]) baiByYear[y] = [];
          baiByYear[y].push(row);
        });
        setByNeighborhood(baiByYear);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Falha ao carregar os dados do candidato");
      } finally {
        setLoading(false);
      }
    })();
  }, [candidateId]);

  const kpis = useMemo(() => {
    if (!activeYear) return null;

    const sec = bySection[activeYear] || [];
    const bai = byNeighborhood[activeYear] || [];

    const totalVotosSec = sec.reduce((sum, r) => sum + (r.votos || 0), 0);
    const totalVotosBai = bai.reduce((sum, r) => sum + (r.votos || 0), 0);

    // Top bairro
    const topBairro = [...bai]
      .sort((a, b) => (b.votos || 0) - (a.votos || 0))
      .slice(0, 1)[0];

    // Cobertura (qtd de seções com votos > 0)
    const secoesComVoto = sec.filter((r) => (r.votos || 0) > 0).length;

    return {
      totalVotos: Math.max(totalVotosSec, totalVotosBai),
      secoesComVoto,
      topBairroNome: topBairro?.bairro_nome || "-",
      topBairroVotos: topBairro?.votos || 0,
    };
  }, [activeYear, bySection, byNeighborhood]);

  const topBairros = useMemo(() => {
    if (!activeYear) return [];
    const bai = byNeighborhood[activeYear] || [];
    return [...bai].sort((a, b) => (b.votos || 0) - (a.votos || 0)).slice(0, 10);
  }, [activeYear, byNeighborhood]);

  const topSecoes = useMemo(() => {
    if (!activeYear) return [];
    const sec = bySection[activeYear] || [];
    return [...sec].sort((a, b) => (b.votos || 0) - (a.votos || 0)).slice(0, 10);
  }, [activeYear, bySection]);

  if (loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Carregando dados do candidato…
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            Erro ao carregar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!candidate) {
    return <div className="py-10 text-center text-muted-foreground">Candidato não encontrado.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        {candidate.foto_url ? (
          <img
            src={candidate.foto_url}
            alt={candidate.nome}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl">
            {candidate.nome?.[0] || "?"}
          </div>
        )}
        <div>
          <h3 className="text-xl font-semibold">{candidate.nome}</h3>
          <div className="text-sm text-muted-foreground">
            {candidate.numero ? `Nº ${candidate.numero} · ` : ""}
            {candidate.usa_regionais ? "Usa Regionais" : "Sem Regionais"}
          </div>
          <div className="mt-1 flex gap-2">
            {(years || []).map((y) => (
              <Badge
                key={y}
                variant={y === activeYear ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveYear(y)}
              >
                {y}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      {activeYear && kpis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Votos Totais ({activeYear})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalVotos.toLocaleString("pt-BR")}</div>
              <p className="text-xs text-muted-foreground">Maior entre agregações por seção e por bairro</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                Seções com votos ({activeYear})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.secoesComVoto.toLocaleString("pt-BR")}</div>
              <p className="text-xs text-muted-foreground">Total de seções em que o candidato pontuou</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Bairro destaque ({activeYear})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.topBairroNome}</div>
              <p className="text-xs text-muted-foreground">
                {kpis.topBairroVotos.toLocaleString("pt-BR")} votos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Abas: Bairros / Seções */}
      <Tabs defaultValue="bairros" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bairros">Top Bairros</TabsTrigger>
          <TabsTrigger value="secoes">Top Seções</TabsTrigger>
        </TabsList>

        <TabsContent value="bairros">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Maiores concentrações por bairro {activeYear ? `(${activeYear})` : ""}</CardTitle>
            </CardHeader>
            <CardContent>
              {activeYear && topBairros.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bairro</TableHead>
                      <TableHead className="text-right">Votos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topBairros.map((b, i) => (
                      <TableRow key={`${b.bairro_nome}-${i}`}>
                        <TableCell className="font-medium">{b.bairro_nome || "-"}</TableCell>
                        <TableCell className="text-right">{(b.votos || 0).toLocaleString("pt-BR")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">Sem dados de bairros para este ano.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="secoes">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Maiores concentrações por seção {activeYear ? `(${activeYear})` : ""}</CardTitle>
            </CardHeader>
            <CardContent>
              {activeYear && topSecoes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zona</TableHead>
                      <TableHead>Seção</TableHead>
                      <TableHead>Bairro</TableHead>
                      <TableHead className="text-right">Votos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSecoes.map((s, i) => (
                      <TableRow key={`${s.zona}-${s.secao}-${i}`}>
                        <TableCell>{s.zona}</TableCell>
                        <TableCell>{s.secao}</TableCell>
                        <TableCell>{s.bairro || "-"}</TableCell>
                        <TableCell className="text-right">{(s.votos || 0).toLocaleString("pt-BR")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">Sem dados de seções para este ano.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
