import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface RankingTableProps {
  data: { nome: string; votos: number }[];
}

const RankingTable = ({ data }: RankingTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Posição</TableHead>
          <TableHead>Regional</TableHead>
          <TableHead>Votos</TableHead>
          <TableHead>% do Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => {
          const totalVotos = data.reduce((sum, d) => sum + d.votos, 0);
          const percentage = totalVotos > 0 ? (item.votos / totalVotos * 100).toFixed(1) : '0.0';
          
          return (
            <TableRow key={index}>
              <TableCell>
                <Badge variant={index < 3 ? "default" : "secondary"}>
                  #{index + 1}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{item.nome}</TableCell>
              <TableCell>{item.votos.toLocaleString()}</TableCell>
              <TableCell>{percentage}%</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default RankingTable;