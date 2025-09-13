import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, MapPin, Users } from "lucide-react";
import heroImage from "@/assets/hero-electoral.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Electoral Analysis Dashboard" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-accent/80 to-primary/90"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Análise Eleitoral
            <span className="block bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
              Inteligente
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed">
            Transforme dados eleitorais em estratégias vencedoras com dashboards interativos, 
            mapas de calor e análises avançadas para vereadores e partidos políticos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button variant="elegant" size="xl" className="group">
              Começar Análise Gratuita
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl" className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary">
              Ver Demonstração
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <TrendingUp className="w-8 h-8 text-success mb-3" />
              <div className="text-3xl font-bold mb-1">95%</div>
              <div className="text-white/80">Precisão nas Análises</div>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <MapPin className="w-8 h-8 text-warning mb-3" />
              <div className="text-3xl font-bold mb-1">1000+</div>
              <div className="text-white/80">Regiões Analisadas</div>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <Users className="w-8 h-8 text-accent mb-3" />
              <div className="text-3xl font-bold mb-1">200+</div>
              <div className="text-white/80">Candidatos Ativos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;