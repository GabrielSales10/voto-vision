import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Building } from 'lucide-react';

const BairrosManager = () => {
  return (
    <div className="text-center py-8">
      <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Gerenciar Bairros</h3>
      <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
    </div>
  );
};

export default BairrosManager;