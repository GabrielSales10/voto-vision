import { MapPin } from 'lucide-react';

interface MapaRegionalProps {
  data: { nome: string; votos: number }[];
}

const MapaRegional = ({ data }: MapaRegionalProps) => {
  return (
    <div className="relative h-64 bg-gradient-muted rounded-lg overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Mapa interativo em desenvolvimento</p>
          <p className="text-sm text-muted-foreground mt-2">
            Visualização de {data.length} regiões
          </p>
        </div>
      </div>
      {data.slice(0, 3).map((item, index) => (
        <div 
          key={index}
          className={`absolute w-6 h-6 bg-primary/40 rounded-full animate-pulse`}
          style={{
            top: `${20 + index * 30}%`,
            left: `${30 + index * 20}%`
          }}
        />
      ))}
    </div>
  );
};

export default MapaRegional;