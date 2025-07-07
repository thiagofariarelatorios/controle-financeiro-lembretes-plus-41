import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign,
  PieChart,
  BarChart3,
  FileText,
  Target
} from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { SearchAndFilter } from '@/components/common/SearchAndFilter';
import { StatCard } from '@/components/common/StatCard';
import { SimpleChart } from '@/components/common/SimpleChart';
import { formatCurrency, formatDate } from '@/utils/dateUtils';
import { Receita } from '@/types/financial';

export const ReceitasAdvanced = () => {
  const { receitas, loading } = useSupabaseData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Apply filters and search
  const processedReceitas = useMemo(() => {
    let result = receitas;

    // Apply search
    if (searchQuery) {
      result = result.filter(receita => 
        receita.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receita.categoria.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (filters.categoria) {
      result = result.filter(receita => receita.categoria === filters.categoria);
    }

    if (filters.dataInicial) {
      result = result.filter(receita => 
        new Date(receita.data) >= filters.dataInicial
      );
    }

    if (filters.dataFinal) {
      result = result.filter(receita => 
        new Date(receita.data) <= filters.dataFinal
      );
    }

    return result.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [receitas, searchQuery, filters]);

  // Get unique categories
  const categorias = useMemo(() => {
    const cats = [...new Set(receitas.map(r => r.categoria))];
    return cats.sort();
  }, [receitas]);

  // Statistics calculations
  const stats = useMemo(() => {
    const total = processedReceitas.reduce((sum, receita) => sum + receita.valor, 0);
    
    // Current month stats
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthReceitas = processedReceitas.filter(receita => {
      const receitaDate = new Date(receita.data);
      return receitaDate.getMonth() === currentMonth && receitaDate.getFullYear() === currentYear;
    });
    const totalCurrentMonth = currentMonthReceitas.reduce((sum, receita) => sum + receita.valor, 0);
    
    // Previous month stats
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const previousMonthReceitas = processedReceitas.filter(receita => {
      const receitaDate = new Date(receita.data);
      return receitaDate.getMonth() === previousMonth && receitaDate.getFullYear() === previousYear;
    });
    const totalPreviousMonth = previousMonthReceitas.reduce((sum, receita) => sum + receita.valor, 0);
    
    // Calculate growth
    const growth = totalPreviousMonth > 0 
      ? ((totalCurrentMonth - totalPreviousMonth) / totalPreviousMonth) * 100 
      : 0;
    
    // Average per month
    const months = [...new Set(processedReceitas.map(r => {
      const date = new Date(r.data);
      return `${date.getFullYear()}-${date.getMonth()}`;
    }))];
    const averagePerMonth = months.length > 0 ? total / months.length : 0;

    return {
      total,
      totalCurrentMonth,
      totalPreviousMonth,
      growth,
      averagePerMonth,
      quantidade: processedReceitas.length,
      quantidadeCurrentMonth: currentMonthReceitas.length,
      maiorReceita: Math.max(...processedReceitas.map(r => r.valor), 0),
      menorReceita: Math.min(...processedReceitas.map(r => r.valor), 0)
    };
  }, [processedReceitas]);

  // Chart data
  const chartData = useMemo(() => {
    // Revenue by category
    const categoriaData = categorias.map(categoria => {
      const receitasCategoria = processedReceitas.filter(receita => receita.categoria === categoria);
      const valor = receitasCategoria.reduce((sum, receita) => sum + receita.valor, 0);
      return {
        name: categoria,
        value: valor,
        color: 'from-green-500 to-emerald-500'
      };
    }).filter(item => item.value > 0);

    // Monthly trend (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      const monthReceitas = processedReceitas.filter(receita => {
        const receitaDate = new Date(receita.data);
        return receitaDate.getMonth() === date.getMonth() && 
               receitaDate.getFullYear() === date.getFullYear();
      });
      
      const valor = monthReceitas.reduce((sum, receita) => sum + receita.valor, 0);
      monthlyData.push({
        name: monthName,
        value: valor,
        color: 'from-blue-500 to-indigo-500'
      });
    }

    return { categoriaData, monthlyData };
  }, [processedReceitas, categorias]);

  const filterOptions = {
    categories: categorias
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Controle de Receitas
          </h1>
          <p className="text-gray-600 mt-1">Acompanhe e analise suas receitas</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total em Receitas"
          value={stats.total}
          icon={<DollarSign className="h-4 w-4" />}
          color="green"
          subtitle={`${stats.quantidade} receitas`}
        />
        <StatCard
          title="Este Mês"
          value={stats.totalCurrentMonth}
          icon={<Calendar className="h-4 w-4" />}
          color="blue"
          subtitle={`${stats.quantidadeCurrentMonth} receitas`}
          trend={{
            value: stats.growth,
            isPositive: stats.growth >= 0,
            label: 'vs mês anterior'
          }}
        />
        <StatCard
          title="Média Mensal"
          value={stats.averagePerMonth}
          icon={<Target className="h-4 w-4" />}
          color="purple"
          subtitle="Média histórica"
        />
        <StatCard
          title="Maior Receita"
          value={stats.maiorReceita}
          icon={<TrendingUp className="h-4 w-4" />}
          color="yellow"
          subtitle="Valor máximo"
        />
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        placeholder="Buscar receitas por nome ou categoria..."
        filterOptions={filterOptions}
        onSearch={setSearchQuery}
        onFilter={setFilters}
        activeFilters={filters}
      />

      {/* Content Tabs */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Lista de Receitas</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {processedReceitas.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="space-y-2">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="text-lg font-medium text-gray-600">Nenhuma receita encontrada</h3>
                <p className="text-gray-500">Tente ajustar os filtros ou adicionar novas receitas</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {processedReceitas.map(receita => (
                <Card key={receita.id} className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-lg border-0 shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg text-gray-800">{receita.nome}</h3>
                          <Badge variant="outline" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                            {receita.categoria}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          Data: {formatDate(new Date(receita.data))}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {formatCurrency(receita.valor)}
                        </p>
                        <TrendingUp className="h-5 w-5 text-green-500 ml-auto mt-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleChart
              title="Receitas por Categoria"
              data={chartData.categoriaData}
              type="pie"
            />
            <SimpleChart
              title="Evolução Mensal (Últimos 6 meses)"
              data={chartData.monthlyData}
              type="bar"
            />
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6">
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análise de Receitas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Performance Atual</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Receita total: {formatCurrency(stats.total)}</li>
                      <li>• Receita este mês: {formatCurrency(stats.totalCurrentMonth)}</li>
                      <li>• Crescimento: {stats.growth.toFixed(1)}% vs mês anterior</li>
                      <li>• Média mensal: {formatCurrency(stats.averagePerMonth)}</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Insights</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {stats.growth > 10 && (
                        <li className="text-green-600">📈 Excelente crescimento este mês!</li>
                      )}
                      {stats.growth < -10 && (
                        <li className="text-red-600">📉 Receitas em queda, analise as causas</li>
                      )}
                      {stats.totalCurrentMonth > stats.averagePerMonth && (
                        <li className="text-green-600">✅ Acima da média mensal</li>
                      )}
                      {categorias.length > 5 && (
                        <li className="text-blue-600">💡 Diversificação de receitas é positiva</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};