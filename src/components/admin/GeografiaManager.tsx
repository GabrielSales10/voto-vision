import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Save } from "lucide-react";

type Regional = { id: string; nome: string; cidade: string | null };
type RB = { id: string; cidade: string; bairro_nome: string; regional_id: string };

export default function GeografiaManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  const [activeCity, setActiveCity] = useState<string | null>(null);

  const [regionais, setRegionais] = useState<Regional[]>([]);
  const [newRegionalName, setNewRegionalName] = useState("");

  const [bairros, setBairros] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string | null>>({}); // bairro -> regional_id

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Pega cidades de candidate_bairros e candidate_secoes e remove nulos/duplicados
        const [bairrosCitiesRes, secoesCitiesRes] = await Promise.all([
          supabase.from("candidate_bairros").select("cidade"),
          supabase.from("candidate_secoes").select("cidade"),
        ]);

        if (bairrosCitiesRes.error) throw bairrosCitiesRes.error;
        if (secoesCitiesRes.error) throw secoesCitiesRes.error;

        const list = [
          ...(bairrosCitiesRes.data || []).map((r: any) => r.cidade),
          ...(secoesCitiesRes.data || []).map((r: any) => r.cidade),
        ]
          .filter((c): c is string => !!c && typeof c === "string")
          .map((c) => c.trim())
          .filter((c) => c.length > 0);

        const unique = Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, "pt-BR"));

        setCities(unique);
        setActiveCity(unique[0] || null);
      } catch (e: any) {
        console.error(e);
        toast({ title: "Erro", description: e.message || "Falha ao carregar cidades", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  // Carrega regionais + bairros + mapping da cidade ativa
  useEffect(() => {
    if (!activeCity) return;

    (async () => {
      try {
        setLoading(true);

        const [{ data: regs, error: regsErr }, { data: bai, error: baiErr }, { data: map, error: mapErr }] =
          await Promise.all([
            supabase.from("regionais").select("*").eq("cidade", activeCity),
            // bairros distintos: prioriza candidate_bairros; se vier vazio, pega dos 'secoes'
            supabase
              .from("candidate_bairros")
              .select("bairro_nome")
              .eq("cidade", activeCity),
            supabase
              .from("regionais_bairros")
              .select("*")
              .eq("cidade", activeCity),
          ]);

        if (regsErr) throw regsErr;
        if (baiErr) throw baiErr;
        if (mapErr) throw mapErr;

        let bairrosList = Array.from(new Set((bai || []).map((r: any) => (r.bairro_nome || "").trim()).filter(Boolean)));

        if (bairrosList.length === 0) {
          // fallback: usa candidate_secoes.bairro
          const secs = await supabase.from("candidate_secoes").select("bairro").eq("cidade", activeCity);
          if (secs.error) throw secs.error;
          bairrosList = Array.from(new Set((secs.data || []).map((r: any) => (r.bairro || "").trim()).filter(Boolean)));
        }

        setRegionais((regs || []) as Regional[]);
        setBairros(bairrosList);

        // monta mapping inicial a partir de regionais_bairros
        const m: Record<string, string | null> = {};
        (map || []).forEach((row: any) => {
          m[row.bairro_nome] = row.regional_id;
        });
        setMapping(m);
      } catch (e: any) {
        console.error(e);
        toast({ title: "Erro", description: e.message || "Falha ao carregar dados da cidade", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [activeCity, toast]);

  const handleCreateRegional = async () => {
    if (!activeCity || !newRegionalName.trim()) return;
    try {
      const { data, error } = await supabase
        .from("regionais")
        .insert([{ nome: newRegionalName.trim(), cidade: activeCity }])
        .select()
        .single();
      if (error) throw error;
      setRegionais((prev) => [...prev, data as Regional]);
      setNewRegionalName("");
      toast({ title: "Sucesso", description: "Regional criada." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao criar regional", variant: "destructive" });
    }
  };

  const handleAssign = async (bairro: string, regionalId: string | null) => {
    if (!activeCity) return;
    try {
      if (regionalId) {
        // upsert vínculo
        const { error } = await supabase
          .from("regionais_bairros")
          .upsert({
            cidade: activeCity,
            bairro_nome: bairro,
            regional_id: regionalId,
          });
        if (error) throw error;
      } else {
        // remover vínculo
        const { error } = await supabase
          .from("regionais_bairros")
          .delete()
          .eq("cidade", activeCity)
          .eq("bairro_nome", bairro);
        if (error) throw error;
      }
      setMapping((p) => ({ ...p, [bairro]: regionalId }));
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao salvar vínculo", variant: "destructive" });
    }
  };

  const cityHeader = useMemo(() => {
    if (!activeCity) return "Geografia Eleitoral";
    const totalRegs = regionais.length;
    const totalBairros = bairros.length;
    const vinculados = Object.values(mapping).filter(Boolean).length;
    return `${activeCity} — Regionais: ${totalRegs} · Bairros: ${totalBairros} · Vinculados: ${vinculados}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCity, regionais.length, bairros.length, mapping]);

  if (loading && cities.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">Carregando geografia…</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Coluna esquerda: lista de cidades */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Cidades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cities.length === 0 && (
              <div className="text-sm text-muted-foreground">Nenhuma cidade detectada nos CSVs.</div>
            )}
            {cities.map((c) => (
              <Button
                key={c}
                variant={c === activeCity ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setActiveCity(c)}
              >
                {c}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Coluna direita: gestão por cidade */}
      <div className="lg:col-span-9">
        <Card>
          <CardHeader>
            <CardTitle>{cityHeader}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!activeCity ? (
              <div className="text-muted-foreground">Selecione uma cidade à esquerda.</div>
            ) : (
              <>
                {/* Criar Regional */}
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[240px]">
                    <Label htmlFor="regionalName">Nova Regional</Label>
                    <Input
                      id="regionalName"
                      placeholder="Nome da regional"
                      value={newRegionalName}
                      onChange={(e) => setNewRegionalName(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreateRegional}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Regional
                  </Button>
                </div>

                {/* Tabela: bairros da cidade + select de regional */}
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bairro</TableHead>
                        <TableHead className="w-[280px]">Regional</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bairros.map((bairro) => (
                        <TableRow key={bairro}>
                          <TableCell className="font-medium">{bairro}</TableCell>
                          <TableCell>
                            <Select
                              value={mapping[bairro] || ""}
                              onValueChange={(val) => handleAssign(bairro, val || null)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a regional" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">— Sem regional —</SelectItem>
                                {regionais.map((r) => (
                                  <SelectItem key={r.id} value={r.id}>
                                    {r.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                      {bairros.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                            Nenhum bairro encontrado para esta cidade.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* (Opcional) botão “salvar tudo” – não é necessário pois salvamos a cada mudança */}
                <div className="flex justify-end">
                  <Button variant="outline" disabled>
                    <Save className="w-4 h-4 mr-2" />
                    Alterações salvas automaticamente
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
