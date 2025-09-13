import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

const ZonasManager = () => {
  return (
    <div className="text-center py-8">
      <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Gerenciar Zonas Eleitorais</h3>
      <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
    </div>
  );
};

export default ZonasManager;