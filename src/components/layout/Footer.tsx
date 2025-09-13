import { BarChart3, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">ElectoralPro</h3>
                <p className="text-white/70">Análise Eleitoral Inteligente</p>
              </div>
            </div>
            <p className="text-white/70 leading-relaxed mb-6">
              Transformamos dados eleitorais em insights estratégicos para candidatos e partidos políticos. 
              Nossa plataforma oferece análises avançadas, mapas interativos e relatórios completos 
              para otimizar campanhas eleitorais.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-white/70">
                <Mail className="w-5 h-5" />
                contato@electoralpro.com.br
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <Phone className="w-5 h-5" />
                (11) 9999-8888
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <MapPin className="w-5 h-5" />
                São Paulo, SP - Brasil
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Links Rápidos</h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-white/70 hover:text-white transition-colors">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-white/70 hover:text-white transition-colors">
                  Planos e Preços
                </a>
              </li>
              <li>
                <a href="#demo" className="text-white/70 hover:text-white transition-colors">
                  Demonstração
                </a>
              </li>
              <li>
                <a href="#support" className="text-white/70 hover:text-white transition-colors">
                  Suporte
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Legal</h4>
            <ul className="space-y-3">
              <li>
                <a href="#privacy" className="text-white/70 hover:text-white transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#terms" className="text-white/70 hover:text-white transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#cookies" className="text-white/70 hover:text-white transition-colors">
                  Política de Cookies
                </a>
              </li>
              <li>
                <a href="#security" className="text-white/70 hover:text-white transition-colors">
                  Segurança
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-12 pt-8 text-center">
          <p className="text-white/70">
            © 2024 ElectoralPro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;