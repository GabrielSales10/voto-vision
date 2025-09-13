import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VotacaoChartProps {
  data: { nome: string; votos: number }[];
}

const VotacaoChart = ({ data }: VotacaoChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data.slice(0, 10)}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="votos" fill="hsl(var(--primary))" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default VotacaoChart;