import { Button } from "@/components/ui/button";
import { BarChart3, Users, LogIn } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-border z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">ElectoralPro</h1>
            <p className="text-sm text-muted-foreground">Análise Eleitoral Inteligente</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-foreground hover:text-primary transition-colors">
            Funcionalidades
          </a>
          <a href="#pricing" className="text-foreground hover:text-primary transition-colors">
            Planos
          </a>
          <a href="#contact" className="text-foreground hover:text-primary transition-colors">
            Contato
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/auth'}>
            <LogIn className="w-4 h-4" />
            Entrar
          </Button>
          <Button variant="hero" size="sm" onClick={() => window.location.href = '/auth'}>
            <Users className="w-4 h-4" />
            Começar Agora
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;