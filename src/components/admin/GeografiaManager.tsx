import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Building, Globe } from 'lucide-react';
import RegionaisManager from './geografia/RegionaisManager';
import BairrosManager from './geografia/BairrosManager';
import GeographyCitiesManager from './GeographyCitiesManager';

const GeografiaManager = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Gerenciar Geografia Eleitoral
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cidades" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cidades" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Cidades & Bairros
            </TabsTrigger>
            <TabsTrigger value="regionais" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Regionais
            </TabsTrigger>
            <TabsTrigger value="bairros" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Cadastro de Bairros
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cidades" className="mt-6">
            <GeographyCitiesManager />
          </TabsContent>
          
          <TabsContent value="regionais" className="mt-6">
            <RegionaisManager />
          </TabsContent>
          
          <TabsContent value="bairros" className="mt-6">
            <BairrosManager />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GeografiaManager;