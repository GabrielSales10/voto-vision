import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Eye
} from "lucide-react";

const DashboardPreview = () => {
  const mockData = {
    totalVotes: 15420,
    growth: 12.5,
    topRegions: [
      { name: "Centro", votes: 3240, percentage: 21.0 },
      { name: "Norte", votes: 2890, percentage: 18.7 },
      { name: "Sul", votes: 2650, percentage: 17.2 },
    ],
    recentElection: {
      current: 15420,
      previous: 13705,
      change: 1715
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Dashboard em Ação
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Visualize como seria o seu dashboard com dados reais. 
            Análises automáticas, mapas interativos e insights estratégicos.
          </p>
          <Button variant="hero" size="lg">
            <Eye className="w-5 h-5" />
            Ver Demonstração Completa
          </Button>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="w-8 h-8 text-primary" />
                <div className="flex items-center text-success text-sm">
                  <ArrowUpRight className="w-4 h-4" />
                  {mockData.growth}%
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {mockData.totalVotes.toLocaleString()}
              </div>
              <div className="text-muted-foreground text-sm">Total de Votos</div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-success" />
                <div className="flex items-center text-success text-sm">
                  <ArrowUpRight className="w-4 h-4" />
                  +{mockData.recentElection.change}
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {mockData.recentElection.current.toLocaleString()}
              </div>
              <div className="text-muted-foreground text-sm">Última Eleição</div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-warning" />
                <div className="flex items-center text-warning text-sm">
                  <ArrowUpRight className="w-4 h-4" />
                  8.2%
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                73.4%
              </div>
              <div className="text-muted-foreground text-sm">Taxa de Aproveitamento</div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <MapPin className="w-8 h-8 text-accent" />
                <div className="flex items-center text-muted-foreground text-sm">
                  12 regiões
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                87
              </div>
              <div className="text-muted-foreground text-sm">Zonas Ativas</div>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  Performance por Região
                </h3>
                <Button variant="outline" size="sm">
                  Ver Detalhes
                </Button>
              </div>
              <div className="space-y-4">
                {mockData.topRegions.map((region, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gradient-primary"></div>
                      <span className="font-medium text-foreground">{region.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-primary rounded-full"
                          style={{ width: `${region.percentage * 4}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {region.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Map Preview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  Mapa de Calor
                </h3>
                <Button variant="outline" size="sm">
                  <MapPin className="w-4 h-4" />
                  Expandir Mapa
                </Button>
              </div>
              <div className="relative h-64 bg-gradient-muted rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Mapa interativo com intensidade de votos
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Zoom, filtros e análise por seção
                    </p>
                  </div>
                </div>
                {/* Simulated heat spots */}
                <div className="absolute top-16 left-20 w-8 h-8 bg-success/40 rounded-full animate-pulse"></div>
                <div className="absolute top-32 right-24 w-6 h-6 bg-warning/40 rounded-full animate-pulse"></div>
                <div className="absolute bottom-20 left-32 w-10 h-10 bg-primary/40 rounded-full animate-pulse"></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;