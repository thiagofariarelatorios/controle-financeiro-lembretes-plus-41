
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, DollarSign, Calendar, Bell } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { formatCurrency, formatDate, isVencimentoProximo, isVencido } from '@/utils/dateUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export const Dashboard = () => {
  const { contas, receitas, loading } = useSupabaseData();

  const contasVencendoHoje = contas.filter(conta => 
    !conta.pago && isVencimentoProximo(new Date(conta.data_vencimento), 0)
  );

  const contasVencidas = contas.filter(conta => 
    !conta.pago && isVencido(new Date(conta.data_vencimento))
  );

  const contasProximoVencimento = contas.filter(conta => 
    !conta.pago && isVencimentoProximo(new Date(conta.data_vencimento), 7) && !isVencido(new Date(conta.data_vencimento))
  );

  const totalContasMes = contas
    .filter(conta => new Date(conta.data_vencimento).getMonth() === new Date().getMonth())
    .reduce((total, conta) => total + conta.valor, 0);

  const totalReceitasMes = receitas
    .filter(receita => new Date(receita.data).getMonth() === new Date().getMonth())
    .reduce((total, receita) => total + receita.valor, 0);

  const saldoMes = totalReceitasMes - totalContasMes;

  // Dados reais para gráficos (últimos 6 meses)
  const dadosGastosMensais = Array.from({ length: 6 }, (_, i) => {
    const data = new Date();
    data.setMonth(data.getMonth() - (5 - i));
    const mes = data.toLocaleString('pt-BR', { month: 'short' });
    
    // Calcular gastos reais do mês
    const inicioMes = new Date(data.getFullYear(), data.getMonth(), 1);
    const fimMes = new Date(data.getFullYear(), data.getMonth() + 1, 0);
    
    const contasDoMes = contas.filter(conta => {
      const dataVencimento = new Date(conta.data_vencimento);
      return dataVencimento >= inicioMes && dataVencimento <= fimMes;
    });
    
    const valor = contasDoMes.reduce((total, conta) => total + conta.valor, 0);
    return { mes, valor };
  });

  // Dados reais de evolução do saldo (últimos 6 meses)
  const dadosEvolucaoSaldo = Array.from({ length: 6 }, (_, i) => {
    const data = new Date();
    data.setMonth(data.getMonth() - (5 - i));
    const mes = data.toLocaleString('pt-BR', { month: 'short' });
    
    // Calcular saldo real do mês
    const inicioMes = new Date(data.getFullYear(), data.getMonth(), 1);
    const fimMes = new Date(data.getFullYear(), data.getMonth() + 1, 0);
    
    const receitasDoMes = receitas.filter(receita => {
      const dataReceita = new Date(receita.data);
      return dataReceita >= inicioMes && dataReceita <= fimMes;
    }).reduce((total, receita) => total + receita.valor, 0);
    
    const contasDoMes = contas.filter(conta => {
      const dataVencimento = new Date(conta.data_vencimento);
      return dataVencimento >= inicioMes && dataVencimento <= fimMes;
    }).reduce((total, conta) => total + conta.valor, 0);
    
    const saldo = receitasDoMes - contasDoMes;
    return { mes, saldo };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas e Lembretes */}
      {(contasVencidas.length > 0 || contasVencendoHoje.length > 0 || contasProximoVencimento.length > 0) && (
        <div className="grid gap-4">
          {contasVencidas.length > 0 && (
            <Card className="border-red-600/30 bg-gradient-to-r from-red-900/40 to-red-800/40 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-300">
                  <AlertTriangle className="h-5 w-5" />
                  Contas Vencidas ({contasVencidas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contasVencidas.map(conta => (
                    <div key={conta.id} className="flex justify-between items-center text-foreground">
                      <span>{conta.nome}</span>
                      <Badge variant="destructive">{formatCurrency(conta.valor)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {contasVencendoHoje.length > 0 && (
            <Card className="border-yellow-600/30 bg-gradient-to-r from-yellow-900/40 to-yellow-800/40 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-300">
                  <Calendar className="h-5 w-5" />
                  Vencem Hoje ({contasVencendoHoje.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contasVencendoHoje.map(conta => (
                    <div key={conta.id} className="flex justify-between items-center text-foreground">
                      <span>{conta.nome}</span>
                      <Badge variant="outline" className="border-yellow-600/50 text-yellow-300">{formatCurrency(conta.valor)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {contasProximoVencimento.length > 0 && (
            <Card className="border-blue-600/30 bg-gradient-to-r from-blue-900/40 to-blue-800/40 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-300">
                  <Bell className="h-5 w-5" />
                  Próximos Vencimentos ({contasProximoVencimento.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contasProximoVencimento.map(conta => (
                    <div key={conta.id} className="flex justify-between items-center text-foreground">
                      <span>{conta.nome}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{formatDate(new Date(conta.data_vencimento))}</span>
                        <Badge variant="secondary">{formatCurrency(conta.valor)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-gradient-blue to-gradient-blue/80 border-0 shadow-xl text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Receitas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalReceitasMes)}</div>
            <p className="text-xs text-white/70 mt-1">
              +{receitas.filter(r => new Date(r.data).getMonth() === new Date().getMonth()).length} este mês
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gradient-orange to-gradient-orange/80 border-0 shadow-xl text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Despesas do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalContasMes)}</div>
            <p className="text-xs text-white/70 mt-1">
              {contasVencidas.length} vencidas
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${saldoMes >= 0 ? 'from-gradient-teal to-gradient-teal/80' : 'from-gradient-pink to-gradient-pink/80'} border-0 shadow-xl text-white`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Saldo do Mês
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(saldoMes)}
            </div>
            <p className="text-xs text-white/70 mt-1">
              {saldoMes >= 0 ? '↗' : '↘'} {Math.abs(((saldoMes / (totalReceitasMes || 1)) * 100)).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gradient-purple to-gradient-purple/80 border-0 shadow-xl text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total de Contas</CardTitle>
            <DollarSign className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {contas.length}
            </div>
            <p className="text-xs text-white/70 mt-1">
              {contas.filter(c => c.pago).length} pagas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-xl">
          <CardHeader>
            <CardTitle className="text-card-foreground">Gastos Mensais (Últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGastosMensais}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))} 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--card-foreground))'
                  }}
                />
                <Bar 
                  dataKey="valor" 
                  fill="hsl(var(--gradient-orange))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xl">
          <CardHeader>
            <CardTitle className="text-card-foreground">Evolução do Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosEvolucaoSaldo}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))} 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--card-foreground))'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="saldo" 
                  stroke="hsl(var(--gradient-teal))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--gradient-teal))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
