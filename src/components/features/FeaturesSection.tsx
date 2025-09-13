import FeatureCard from "./FeatureCard";
import { 
  BarChart3, 
  Map, 
  Users, 
  FileText, 
  TrendingUp, 
  Shield,
  Database,
  Filter,
  Download
} from "lucide-react";

const FeaturesSection = () => {
  const adminFeatures = [
    {
      icon: Users,
      title: "Gestão Completa",
      description: "Cadastre partidos, candidatos e usuários com controle total de acesso e permissões.",
      iconColor: "text-primary"
    },
    {
      icon: Database,
      title: "Upload de Dados",
      description: "Importe arquivos CSV com dados de votação organizados por seção, zona, bairro e regional.",
      iconColor: "text-success"
    },
    {
      icon: Map,
      title: "Mapeamento Regional",
      description: "Configure o mapeamento de bairros para regionais com interface intuitiva e visual.",
      iconColor: "text-warning"
    },
    {
      icon: FileText,
      title: "Relatórios PDF",
      description: "Gere relatórios completos com análises estratégicas e sugestões para próximas eleições.",
      iconColor: "text-accent"
    }
  ];

  const analysisFeatures = [
    {
      icon: BarChart3,
      title: "Dashboards Interativos",
      description: "Visualize resultados com gráficos dinâmicos, rankings e comparações automáticas.",
      iconColor: "text-primary"
    },
    {
      icon: Map,
      title: "Mapas de Calor",
      description: "Mapas interativos com intensidade de votos por região, zona e seção eleitoral.",
      iconColor: "text-success"
    },
    {
      icon: TrendingUp,
      title: "Análise de Tendências",
      description: "Compare performance entre eleições e identifique padrões de crescimento ou declínio.",
      iconColor: "text-warning"
    },
    {
      icon: Filter,
      title: "Filtros Avançados",
      description: "Filtre dados por região, zona, bairro, seção e período para análises específicas.",
      iconColor: "text-accent"
    }
  ];

  const accessFeatures = [
    {
      icon: Shield,
      title: "3 Níveis de Acesso",
      description: "Admin (controle total), Presidente (partido completo) e Candidato (dados próprios).",
      iconColor: "text-primary"
    },
    {
      icon: Download,
      title: "Exportação de Dados",
      description: "Exporte relatórios, gráficos e dados em diversos formatos para apresentações.",
      iconColor: "text-success"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Funcionalidades Completas
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Todas as ferramentas que você precisa para analisar resultados eleitorais 
            e planejar estratégias vencedoras para as próximas eleições.
          </p>
        </div>

        {/* Admin Features */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
            Área Administrativa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>

        {/* Analysis Features */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
            Análises e Visualizações
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysisFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>

        {/* Access Features */}
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
            Controle e Segurança
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {accessFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;