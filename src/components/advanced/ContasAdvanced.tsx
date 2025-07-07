import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  CreditCard,
  BarChart3,
  FileText
} from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { SearchAndFilter } from '@/components/common/SearchAndFilter';
import { StatCard } from '@/components/common/StatCard';
import { SimpleChart } from '@/components/common/SimpleChart';
import { formatCurrency, formatDate, getDiasVencimento } from '@/utils/dateUtils';
import { Conta } from '@/types/financial';

export const ContasAdvanced = () => {
  const { contas, categorias, loading } = useSupabaseData();
  const [filteredContas, setFilteredContas] = useState<Conta[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Apply filters and search
  const processedContas = useMemo(() => {
    let result = contas;

    // Apply search
    if (searchQuery) {
      result = result.filter(conta => 
        conta.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conta.categoria.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (filters.categoria) {
      result = result.filter(conta => conta.categoria === filters.categoria);
    }
    
    if (filters.status) {
      if (filters.status === 'pago') {
        result = result.filter(conta => conta.pago);
      } else if (filters.status === 'pendente') {
        result = result.filter(conta => !conta.pago);
      } else if (filters.status === 'vencido') {
        result = result.filter(conta => 
          !conta.pago && getDiasVencimento(new Date(conta.data_vencimento)) < 0
        );
      } else if (filters.status === 'vence_hoje') {
        result = result.filter(conta => 
          !conta.pago && getDiasVencimento(new Date(conta.data_vencimento)) === 0
        );
      }
    }

    if (filters.dataInicial) {
      result = result.filter(conta => 
        new Date(conta.data_vencimento) >= filters.dataInicial
      );
    }

    if (filters.dataFinal) {
      result = result.filter(conta => 
        new Date(conta.data_vencimento) <= filters.dataFinal
      );
    }

    return result;
  }, [contas, searchQuery, filters]);

  // Statistics calculations
  const stats = useMemo(() => {
    const total = processedContas.reduce((sum, conta) => sum + conta.valor, 0);
    const pagas = processedContas.filter(conta => conta.pago);
    const pendentes = processedContas.filter(conta => !conta.pago);
    const vencidas = pendentes.filter(conta => 
      getDiasVencimento(new Date(conta.data_vencimento)) < 0
    );
    const vencem_hoje = pendentes.filter(conta => 
      getDiasVencimento(new Date(conta.data_vencimento)) === 0
    );

    const totalPago = pagas.reduce((sum, conta) => sum + conta.valor, 0);
    const totalPendente = pendentes.reduce((sum, conta) => sum + conta.valor, 0);
    const totalVencido = vencidas.reduce((sum, conta) => sum + conta.valor, 0);

    return {
      total,
      totalPago,
      totalPendente,
      totalVencido,
      quantidadeTotal: processedContas.length,
      quantidadePagas: pagas.length,
      quantidadePendentes: pendentes.length,
      quantidadeVencidas: vencidas.length,
      quantidadeVencemHoje: vencem_hoje.length,
      percentualPago: total > 0 ? (totalPago / total) * 100 : 0
    };
  }, [processedContas]);

  // Chart data
  const chartData = useMemo(() => {
    const categoriaData = categorias.map(categoria => {
      const contasCategoria = processedContas.filter(conta => conta.categoria === categoria.nome);
      const valor = contasCategoria.reduce((sum, conta) => sum + conta.valor, 0);
      return {
        name: categoria.nome,
        value: valor,
        color: `from-[${categoria.cor}] to-[${categoria.cor}]/80`
      };
    }).filter(item => item.value > 0);

    const statusData = [
      { 
        name: 'Pagas', 
        value: stats.totalPago, 
        color: 'from-green-500 to-emerald-500' 
      },
      { 
        name: 'Pendentes', 
        value: stats.totalPendente - stats.totalVencido, 
        color: 'from-yellow-500 to-orange-500' 
      },
      { 
        name: 'Vencidas', 
        value: stats.totalVencido, 
        color: 'from-red-500 to-pink-500' 
      }
    ].filter(item => item.value > 0);

    return { categoriaData, statusData };
  }, [processedContas, categorias, stats]);

  const filterOptions = {
    categories: categorias.map(c => c.nome),
    statuses: [
      { value: 'pago', label: 'Pagas' },
      { value: 'pendente', label: 'Pendentes' },
      { value: 'vencido', label: 'Vencidas' },
      { value: 'vence_hoje', label: 'Vencem Hoje' }
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Controle de Contas
          </h1>
          <p className="text-gray-600 mt-1">Gestão completa das suas contas a pagar</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total em Contas"
          value={stats.total}
          icon={<CreditCard className="h-4 w-4" />}
          color="blue"
          subtitle={`${stats.quantidadeTotal} contas`}
        />
        <StatCard
          title="Contas Pagas"
          value={stats.totalPago}
          icon={<CheckCircle className="h-4 w-4" />}
          color="green"
          subtitle={`${stats.quantidadePagas} pagas (${stats.percentualPago.toFixed(1)}%)`}
        />
        <StatCard
          title="Contas Pendentes"
          value={stats.totalPendente}
          icon={<Clock className="h-4 w-4" />}
          color="yellow"
          subtitle={`${stats.quantidadePendentes} pendentes`}
        />
        <StatCard
          title="Contas Vencidas"
          value={stats.totalVencido}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="red"
          subtitle={`${stats.quantidadeVencidas} vencidas`}
        />
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        placeholder="Buscar contas por nome ou categoria..."
        filterOptions={filterOptions}
        onSearch={setSearchQuery}
        onFilter={setFilters}
        activeFilters={filters}
      />

      {/* Content Tabs */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Lista de Contas</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {processedContas.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="space-y-2">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="text-lg font-medium text-gray-600">Nenhuma conta encontrada</h3>
                <p className="text-gray-500">Tente ajustar os filtros ou adicionar novas contas</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {processedContas.map(conta => {
                const diasVencimento = getDiasVencimento(new Date(conta.data_vencimento));
                const isVencida = !conta.pago && diasVencimento < 0;
                const venceHoje = !conta.pago && diasVencimento === 0;
                
                return (
                  <Card key={conta.id} className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-lg border-0 shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg text-gray-800">{conta.nome}</h3>
                            {conta.recorrente && (
                              <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
                                Recorrente
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge variant="outline" className="bg-gradient-to-r from-gray-100 to-gray-200">
                              {conta.categoria}
                            </Badge>
                            
                            {conta.pago ? (
                              <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-800">
                                Pago
                              </Badge>
                            ) : isVencida ? (
                              <Badge className="bg-gradient-to-r from-red-100 to-red-200 text-red-800">
                                Vencida há {Math.abs(diasVencimento)} dias
                              </Badge>
                            ) : venceHoje ? (
                              <Badge className="bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800">
                                Vence hoje
                              </Badge>
                            ) : (
                              <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800">
                                {diasVencimento} dias
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600">
                            Vencimento: {formatDate(new Date(conta.data_vencimento))}
                          </p>
                          
                          {conta.pago && conta.data_pagamento && (
                            <p className="text-sm text-green-600 font-medium">
                              Pago em: {formatDate(new Date(conta.data_pagamento))}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                            {formatCurrency(conta.valor)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleChart
              title="Contas por Categoria"
              data={chartData.categoriaData}
              type="pie"
            />
            <SimpleChart
              title="Status das Contas"
              data={chartData.statusData}
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
                  Análise Financeira
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Situação Atual</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• {stats.percentualPago.toFixed(1)}% das contas foram pagas</li>
                      <li>• {stats.quantidadeVencidas} contas estão vencidas</li>
                      <li>• {stats.quantidadeVencemHoje} contas vencem hoje</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Recomendações</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {stats.quantidadeVencidas > 0 && (
                        <li className="text-red-600">⚠️ Priorize o pagamento das contas vencidas</li>
                      )}
                      {stats.quantidadeVencemHoje > 0 && (
                        <li className="text-yellow-600">⏰ Atenção: {stats.quantidadeVencemHoje} conta(s) vencem hoje</li>
                      )}
                      {stats.percentualPago > 80 && (
                        <li className="text-green-600">✅ Parabéns! Você está em dia com a maioria das contas</li>
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