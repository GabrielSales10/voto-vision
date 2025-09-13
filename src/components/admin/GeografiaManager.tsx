import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Building, Globe } from 'lucide-react';
import RegionaisManager from './geografia/RegionaisManager';
import BairrosManager from './geografia/BairrosManager';
import ZonasManager from './geografia/ZonasManager';

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
        <Tabs defaultValue="regionais" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="regionais" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Regionais
            </TabsTrigger>
            <TabsTrigger value="bairros" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Bairros
            </TabsTrigger>
            <TabsTrigger value="zonas" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Zonas Eleitorais
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="regionais" className="mt-6">
            <RegionaisManager />
          </TabsContent>
          
          <TabsContent value="bairros" className="mt-6">
            <BairrosManager />
          </TabsContent>
          
          <TabsContent value="zonas" className="mt-6">
            <ZonasManager />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GeografiaManager;