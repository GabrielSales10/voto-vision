import { useEffect, useMemo, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, BarChart3, Calendar, Filter, LineChart as LineIcon,
  Map as MapIcon, PieChart, Search, Target, TrendingUp
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart as RPieChart, Pie, Cell
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

/** Tipos básicos */
type SecaoRow = {
  candidato_id: string;
  ano: number;
  cidade?: string | null;
  zona: string | number;
  secao: string | number;
  bairro?: string | null;
  votos: number;
};
type BairroRow = {
  candidato_id: string;
  ano: number;
  cidade?: string | null;
  bairro_nome: string | null;
  votos: number;
  percentual_votos?: number | null;
};

const COLORS = ["#6366F1","#22C55E","#F59E0B","#EF4444","#06B6D4","#8B5CF6","#84CC16","#F97316","#D946EF","#14B8A6"];

export default function CandidateAnalyticsPage() {
  const { user, profile, loading } = useAuth();
  const params = useParams<{ id: string }>();
  const candidateId = params.id!;
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [candidate, setCandidate] = useState<any>(null);
  const [years, setYears] = useState<number[]>([]);
  const [activeYear, setActiveYear] = useState<number | null>(null);

  const [secoes, setSecoes] = useState<SecaoRow[]>([]);
  const [bairros, setBairros] = useState<BairroRow[]>([]);

  // filtros geográficos
  const [city, setCity] = useState<string | null>(null);
  const [zona, setZona] = useState<string>("all");
  const [regional, setRegional] = useState<string>("all"); // mapeada via regionais_bairros
  const [bairro, setBairro] = useState<string>("all");
  // busca rápida
  const [quickQuery, setQuickQuery] = useState("");

  // guarda mapeamento de bairro -> regional para a cidade selecionada
  const [regionais, setRegionais] = useState<Array<{id:string; nome:string}>>([]);
  const [bairro2Regional, setBairro2Regional] = useState<Record<string,string>>({});

  useEffect(() => {
    (async () => {
      try {
        setLoadingData(true);
        setError(null);

        // 1) Candidato + anos
        const { data: cand, error: candErr } = await supabase
          .from("candidatos")
          .select("*, anos:candidate_anos(ano)")
          .eq("id", candidateId)
          .single();
        if (candErr) throw candErr;
        setCandidate(cand);
        const yrs = (cand?.anos || []).map((a:any)=>a.ano).sort();
        setYears(yrs);
        setActiveYear((prev)=> prev ?? (yrs[yrs.length-1] || null)); // último ano por padrão

        // 2) Secões + Bairros do candidato (todos anos; filtramos depois)
        const [sec, bai] = await Promise.all([
          supabase.from("candidate_secoes").select("*").eq("candidato_id", candidateId),
          supabase.from("candidate_bairros").select("*").eq("candidato_id", candidateId),
        ]);
        if (sec.error) throw sec.error;
        if (bai.error) throw bai.error;

        setSecoes((sec.data || []) as SecaoRow[]);
        setBairros((bai.data || []) as BairroRow[]);

        // 3) Definir cidade padrão (se houver no dataset)
        const cidades = Array.from(
          new Set<string>(
            [
              ...(sec.data || []).map((r:any)=> (r.cidade||"").trim()).filter(Boolean),
              ...(bai.data || []).map((r:any)=> (r.cidade||"").trim()).filter(Boolean),
            ]
          )
        );
        setCity(cidades[0] || null);
      } catch (e:any) {
        console.error(e);
        setError(e.message || "Falha ao carregar dados");
      } finally {
        setLoadingData(false);
      }
    })();
  }, [candidateId]);

  // Carrega regionais e mapeamento para a city atual
  useEffect(() => {
    if (!city) { setRegionais([]); setBairro2Regional({}); return; }
    (async () => {
      try {
        const [regs, maps] = await Promise.all([
          supabase.from("regionais").select("id,nome").eq("cidade", city),
          supabase.from("regionais_bairros").select("*").eq("cidade", city),
        ]);
        if (regs.error) throw regs.error;
        if (maps.error) throw maps.error;

        setRegionais(regs.data || []);
        const m: Record<string,string> = {};
        (maps.data || []).forEach((row:any)=> { m[row.bairro_nome] = row.regional_id; });
        setBairro2Regional(m);
      } catch (e:any) {
        console.error(e);
      }
    })();
  }, [city]);

  // guarda listas distintas para selects
  const zonasDisponiveis = useMemo(() => {
    const base = (secoes || [])
      .filter(r => !activeYear || r.ano === activeYear)
      .filter(r => !city || (r.cidade||"") === city)
      .map(r => String(r.zona || "").trim())
      .filter(Boolean);
    return Array.from(new Set(base)).sort((a,b)=>a.localeCompare(b));
  }, [secoes, activeYear, city]);

  const bairrosDisponiveis = useMemo(() => {
    const base = (bairros || [])
      .filter(r => !activeYear || r.ano === activeYear)
      .filter(r => !city || (r.cidade||"") === city)
      .map(r => String(r.bairro_nome || "").trim())
      .filter(Boolean);
    return Array.from(new Set(base)).sort((a,b)=>a.localeCompare(b,"pt-BR"));
  }, [bairros, activeYear, city]);

  const regionaisDisponiveis = useMemo(() => regionais, [regionais]);

  // aplica filtros comuns
  const filteredSecoes = useMemo(() => {
    let rows = (secoes || []).filter(r => !activeYear || r.ano === activeYear);
    if (city) rows = rows.filter(r => (r.cidade||"") === city);
    if (zona !== "all") rows = rows.filter(r => String(r.zona) === zona);
    if (bairro !== "all") rows = rows.filter(r => (r.bairro||"") === bairro);
    if (regional !== "all") {
      const allowed = new Set(Object.entries(bairro2Regional).filter(([,reg])=> reg===regional).map(([b])=>b));
      rows = rows.filter(r => allowed.has((r.bairro||"")));
    }
    if (quickQuery.trim()) {
      const q = quickQuery.toLowerCase();
      rows = rows.filter(r =>
        String(r.zona).toLowerCase().includes(q) ||
        String(r.secao).toLowerCase().includes(q) ||
        String(r.bairro||"").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [secoes, activeYear, city, zona, bairro, regional, quickQuery, bairro2Regional]);

  const filteredBairros = useMemo(() => {
    let rows = (bairros || []).filter(r => !activeYear || r.ano === activeYear);
    if (city) rows = rows.filter(r => (r.cidade||"") === city);
    if (bairro !== "all") rows = rows.filter(r => (r.bairro_nome||"") === bairro);
    if (regional !== "all") {
      const allowed = new Set(Object.entries(bairro2Regional).filter(([,reg])=> reg===regional).map(([b])=>b));
      rows = rows.filter(r => allowed.has((r.bairro_nome||"")));
    }
    if (quickQuery.trim()) {
      const q = quickQuery.toLowerCase();
      rows = rows.filter(r => String(r.bairro_nome||"").toLowerCase().includes(q));
    }
    return rows;
  }, [bairros, activeYear, city, bairro, regional, quickQuery, bairro2Regional]);

  // ===== KPIs =====
  const kpis = useMemo(() => {
    const votosTotal = filteredBairros.reduce((s, r)=> s + (r.votos||0), 0);
    const totalBairros = new Set(filteredBairros.map(r => r.bairro_nome||"")).size;
    const totalSecoes = new Set(filteredSecoes.map(r => `${r.zona}-${r.secao}`)).size;

    // bairro destaque
    const topB = [...filteredBairros].sort((a,b)=>(b.votos||0)-(a.votos||0))[0];

    return {
      votosTotal,
      totalBairros,
      totalSecoes,
      topBairro: topB?.bairro_nome || "-",
      topBairroVotos: topB?.votos || 0,
    };
  }, [filteredBairros, filteredSecoes]);

  // ===== Rankings =====
  const rankBairros = useMemo(() => {
    const map = new Map<string, number>();
    filteredBairros.forEach(r => {
      const key = (r.bairro_nome||"").trim();
      map.set(key, (map.get(key)||0) + (r.votos||0));
    });
    const arr = Array.from(map.entries()).map(([bairro, votos])=>({bairro, votos}));
    arr.sort((a,b)=> b.votos - a.votos);
    return arr;
  }, [filteredBairros]);

  const rankZonas = useMemo(() => {
    const map = new Map<string, number>();
    filteredSecoes.forEach(r => {
      const key = String(r.zona);
      map.set(key, (map.get(key)||0) + (r.votos||0));
    });
    const arr = Array.from(map.entries()).map(([zona, votos])=>({zona, votos}));
    arr.sort((a,b)=> b.votos - a.votos);
    return arr;
  }, [filteredSecoes]);

  const rankSecoes = useMemo(() => {
    const map = new Map<string, {zona:string; secao:string; votos:number; bairro:string}>();
    filteredSecoes.forEach(r => {
      const key = `${r.zona}-${r.secao}`;
      map.set(key, { zona:String(r.zona), secao:String(r.secao), votos:(r.votos||0), bairro:String(r.bairro||"") });
    });
    const arr = Array.from(map.values());
    arr.sort((a,b)=> b.votos - a.votos);
    return arr;
  }, [filteredSecoes]);

  // ===== Comparação temporal =====
  const timelineByBairro = useMemo(()=> {
    // evolução por ano (só do bairro/regionais filtrados atuais)
    const filtered = (bairros||[]).filter(r => !city || (r.cidade||"") === city);
    const byYear = new Map<number, number>();
    filtered.forEach(r=>{
      // respeita filtros de bairro/regional
      if (bairro !== "all" && (r.bairro_nome||"") !== bairro) return;
      if (regional !== "all") {
        const reg = bairro2Regional[r.bairro_nome||""];
        if (reg !== regional) return;
      }
      byYear.set(r.ano, (byYear.get(r.ano)||0) + (r.votos||0));
    });
    return Array.from(byYear.entries()).sort((a,b)=>a[0]-b[0]).map(([ano, votos])=>({ano, votos}));
  }, [bairros, city, bairro, regional, bairro2Regional]);

  // ===== Curva de concentração (regra 80/20) =====
  const concentracao = useMemo(() => {
    const arr = [...rankBairros];
    const total = arr.reduce((s,x)=>s+x.votos,0) || 1;
    let cumul = 0;
    return arr.map((x, idx)=> {
      cumul += x.votos;
      return { idx: idx+1, cumulPerc: +(100*(cumul/total)).toFixed(2) };
    });
  }, [rankBairros]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (!user || !profile) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              {candidate?.foto_url ? (
                <img src={candidate.foto_url} alt={candidate.nome} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg">
                  {candidate?.nome?.[0] || "?"}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{candidate?.nome}</h1>
                <div className="text-sm text-muted-foreground">
                  {candidate?.numero ? `Nº ${candidate.numero} · ` : ""}{candidate?.usa_regionais ? "Usa Regionais" : "Sem Regionais"}
                </div>
                <div className="mt-1 flex gap-2">
                  {years.map(y=>(
                    <Badge key={y} variant={y===activeYear?"default":"outline"} className="cursor-pointer" onClick={()=>setActiveYear(y)}>
                      {y}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* filtros rápidos */}
          <div className="flex gap-2 items-end">
            <div className="min-w-[200px]">
              <Label>Cidade</Label>
              <Select value={city ?? "all"} onValueChange={(v)=> setCity(v==="all"? null : v)}>
                <SelectTrigger><SelectValue placeholder="Cidade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Array.from(new Set([
                    ...secoes.map(s=> (s.cidade||"").trim()).filter(Boolean),
                    ...bairros.map(b=> (b.cidade||"").trim()).filter(Boolean),
                  ])).sort((a,b)=>a.localeCompare(b,"pt-BR")).map(c=>(
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px]">
              <Label>Zona</Label>
              <Select value={zona} onValueChange={setZona}>
                <SelectTrigger><SelectValue placeholder="Zona" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {zonasDisponiveis.map(z=>(
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[220px]">
              <Label>Regional</Label>
              <Select value={regional} onValueChange={setRegional}>
                <SelectTrigger><SelectValue placeholder="Regional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {regionaisDisponiveis.map(r=>(
                    <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[220px]">
              <Label>Bairro</Label>
              <Select value={bairro} onValueChange={setBairro}>
                <SelectTrigger><SelectValue placeholder="Bairro" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {bairrosDisponiveis.map(b=>(
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[240px]">
              <Label>Busca rápida</Label>
              <div className="relative">
                <Input placeholder="seção, zona, bairro…" value={quickQuery} onChange={e=>setQuickQuery(e.target.value)} />
                <Search className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* erros/loader */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
        )}
        {loadingData && (
          <div className="text-sm text-muted-foreground">Carregando dados…</div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="w-4 h-4" />Votos totais</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{kpis.votosTotal.toLocaleString("pt-BR")}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="w-4 h-4" />Bairros (ativos)</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{kpis.totalBairros.toLocaleString("pt-BR")}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Target className="w-4 h-4" />Seções com votos</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{kpis.totalSecoes.toLocaleString("pt-BR")}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><MapIcon className="w-4 h-4" />Bairro destaque</CardTitle></CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">{kpis.topBairro}</div>
              <div className="text-sm text-muted-foreground">{kpis.topBairroVotos.toLocaleString("pt-BR")} votos</div>
            </CardContent>
          </Card>
        </div>

        {/* Abas de análise */}
        <Tabs defaultValue="visao">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="visao">Visão Geral</TabsTrigger>
            <TabsTrigger value="mapa">Mapa/Heatmap</TabsTrigger>
            <TabsTrigger value="comparacao">Comparações</TabsTrigger>
            <TabsTrigger value="micro">Microanálise</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="visao" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="overflow-hidden">
                <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="w-4 h-4" />Top 10 Bairros</CardTitle></CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rankBairros.slice(0,10).map(r=>({name:r.bairro, votos:r.votos}))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="votos">
                        {rankBairros.slice(0,10).map((_,idx)=> <Cell key={idx} fill={COLORS[idx%COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="w-4 h-4" />Top 10 Zonas</CardTitle></CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rankZonas.slice(0,10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="zona" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="votos">
                        {rankZonas.slice(0,10).map((_,idx)=> <Cell key={idx} fill={COLORS[idx%COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="overflow-hidden">
                <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><LineIcon className="w-4 h-4" />Tendência histórica (votos)</CardTitle></CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineByBairro}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="votos" stroke="#6366F1" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><PieChart className="w-4 h-4" />Participação por Bairro (Top 10)</CardTitle></CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RPieChart>
                      <Pie
                        data={rankBairros.slice(0,10).map(x=>({name:x.bairro, value:x.votos}))}
                        dataKey="value" nameKey="name" outerRadius={110} label
                      >
                        {rankBairros.slice(0,10).map((_,idx)=> <Cell key={idx} fill={COLORS[idx%COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </RPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Mapa / Heatmap (placeholder seguro) */}
          <TabsContent value="mapa" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapIcon className="w-4 h-4" /> Heatmap por Bairro (precisa GeoJSON)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Para ativar o mapa de calor real, adicione um arquivo GeoJSON de bairros da cidade selecionada
                  (ex.: <code>/public/geo/{city || "sua-cidade"}.geojson</code>) com propriedades que casem com os nomes dos bairros.
                  Enquanto isso, abaixo exibimos uma distribuição textual segura.
                </p>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {rankBairros.slice(0,16).map((b,idx)=>(
                    <div key={idx} className="p-3 rounded-lg border flex items-center justify-between">
                      <span className="text-sm">{b.bairro}</span>
                      <Badge variant="secondary">{b.votos.toLocaleString("pt-BR")}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comparações (variação entre anos, curva de concentração) */}
          <TabsContent value="comparacao" className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4" />Variação por ano (total filtrado)</CardTitle></CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(() => {
                    // soma votos do filtro por ano
                    const all = (bairros||[]).filter(r => !city || (r.cidade||"")===city);
                    const byYear = new Map<number, number>();
                    all.forEach(r=>{
                      if (bairro!=="all" && (r.bairro_nome||"")!==bairro) return;
                      if (regional!=="all") {
                        const reg = bairro2Regional[r.bairro_nome||""];
                        if (reg !== regional) return;
                      }
                      byYear.set(r.ano, (byYear.get(r.ano)||0) + (r.votos||0));
                    });
                    return Array.from(byYear.entries()).sort((a,b)=>a[0]-b[0]).map(([ano, votos])=>({ano, votos}));
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ano" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="votos" fill="#06B6D4" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="w-4 h-4" />Curva de concentração (80/20)</CardTitle></CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={concentracao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="idx" tickFormatter={(v)=>`#${v}`} />
                    <YAxis domain={[0,100]} tickFormatter={(v)=>`${v}%`} />
                    <Tooltip formatter={(v:number)=> `${v}%`} />
                    <Line type="monotone" dataKey="cumulPerc" stroke="#22C55E" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Microanálise (seções) */}
          <TabsContent value="micro" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Ranking de Seções (Top 20)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Zona</TableHead>
                        <TableHead>Seção</TableHead>
                        <TableHead>Bairro</TableHead>
                        <TableHead className="text-right">Votos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankSecoes.slice(0,20).map((s,idx)=>(
                        <TableRow key={`${s.zona}-${s.secao}`}>
                          <TableCell>{idx+1}</TableCell>
                          <TableCell>{s.zona}</TableCell>
                          <TableCell>{s.secao}</TableCell>
                          <TableCell>{s.bairro}</TableCell>
                          <TableCell className="text-right">{s.votos.toLocaleString("pt-BR")}</TableCell>
                        </TableRow>
                      ))}
                      {rankSecoes.length===0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                            Sem dados de seções para os filtros aplicados.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
