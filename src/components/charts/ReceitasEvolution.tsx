import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useMemo } from 'react';
import { formatCurrency } from '@/utils/dateUtils';

export const ReceitasEvolution = () => {
  const { receitas } = useSupabaseData();

  const evolutionData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const monthsData = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthName = new Date(currentYear, index, 1).toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthReceitas = receitas.filter(receita => {
        const receitaDate = new Date(receita.data);
        return receitaDate.getFullYear() === currentYear && receitaDate.getMonth() === index;
      });

      const total = monthReceitas.reduce((sum, receita) => sum + receita.valor, 0);
      
      return {
        month: monthName,
        total,
        formatted: formatCurrency(total)
      };
    });

    return monthsData;
  }, [receitas]);

  const totalYear = evolutionData.reduce((sum, month) => sum + month.total, 0);
  const averageMonth = totalYear / 12;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Evolução das Receitas - {new Date().getFullYear()}</span>
          <div className="text-sm text-gray-600">
            Total: {formatCurrency(totalYear)} | Média: {formatCurrency(averageMonth)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Receitas']}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};